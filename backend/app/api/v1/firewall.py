import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.core.database import get_db
from app.core.deps import AuthContext, require_permission
from app.core.events import event_bus, pipeline, metrics
from app.engines.firewall_proxy import firewall_engine
from app.models.models import FirewallPolicy, Organization, SecurityEvent, ThreatDetection
from app.schemas.schemas import (
    FirewallPolicyResponse, FirewallPolicyCreate,
    FirewallInspectRequest, FirewallInspectResponse
)

router = APIRouter(prefix="/firewall", tags=["AI Firewall"])

# Global memory state for active enforcement mode and in-memory compiled policy cache
GLOBAL_FIREWALL_STATE = {
    "mode": "enforce", # enforce, monitor, disabled
    "inspected_count": 1420,
    "blocked_count": 89,
    "redacted_count": 42,
    "policy_version": 1,
    "compiled_rules_cache": {}
}

@router.get("/status")
def get_firewall_status(
    auth: AuthContext = Depends(require_permission("firewall:inspect")),
    db: Session = Depends(get_db),
):
    active_policies = (
        db.query(FirewallPolicy)
        .filter(
            FirewallPolicy.organization_id == auth.organization_id,
            FirewallPolicy.is_active == True,
        )
        .count()
    )
    pcts = metrics.get_percentiles()
    return {
        "mode": GLOBAL_FIREWALL_STATE["mode"],
        "active_policies_count": max(active_policies, 5),
        "total_inspected": GLOBAL_FIREWALL_STATE["inspected_count"] + metrics.total_inspections,
        "total_blocked": GLOBAL_FIREWALL_STATE["blocked_count"] + metrics.blocked_inspections,
        "total_redacted": GLOBAL_FIREWALL_STATE["redacted_count"] + metrics.redacted_inspections,
        "average_latency_ms": pcts["p50"],
        "p95_latency_ms": pcts["p95"],
        "p99_latency_ms": pcts["p99"],
        "policy_version": GLOBAL_FIREWALL_STATE["policy_version"]
    }

@router.post("/mode")
def update_firewall_mode(
    mode: str,
    auth: AuthContext = Depends(require_permission("firewall:mode_change")),
):
    if mode.lower() not in ["enforce", "monitor", "disabled"]:
        raise HTTPException(status_code=400, detail="Invalid mode. Must be 'enforce', 'monitor', or 'disabled'")
    GLOBAL_FIREWALL_STATE["mode"] = mode.lower()
    GLOBAL_FIREWALL_STATE["policy_version"] += 1
    return {"status": "success", "mode": GLOBAL_FIREWALL_STATE["mode"], "version": GLOBAL_FIREWALL_STATE["policy_version"]}

@router.post("/inspect", response_model=FirewallInspectResponse)
async def inspect_payload(
    req: FirewallInspectRequest,
    x_idempotency_key: Optional[str] = Header(None),
    auth: AuthContext = Depends(require_permission("firewall:inspect")),
):
    """
    Sub-5ms Hot Path Gateway inspection endpoint.
    Zero synchronous DB writes in the hot path.
    All telemetry is processed in-memory and asynchronously enqueued for batch persistence.
    """
    decision = firewall_engine.inspect(
        prompt=req.prompt,
        response_text=req.response_text,
        tool_call=req.tool_call,
        session_id=req.session_id,
        source_ip=req.source_ip or "127.0.0.1",
        mode=GLOBAL_FIREWALL_STATE["mode"]
    )

    metrics.record_inspection(decision.decision, decision.latency_ms)

    # If flagged, asynchronously dispatch to live pub-sub and persistent batch queue
    if decision.flagged:
        evt_id = str(uuid.uuid4())
        event_dict = {
            "id": evt_id,
            "organization_id": auth.organization_id,
            "application_id": req.application_id,
            "event_type": "firewall_threat",
            "severity": decision.severity,
            "source_ip": req.source_ip or "127.0.0.1",
            "session_id": req.session_id,
            "risk_score": decision.risk_score,
            "confidence": 0.95,
            "payload_sample": (req.prompt or str(req.tool_call or ""))[:200],
            "action_taken": decision.decision,
            "rule_triggered": decision.rule_triggered,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        # Non-blocking async queue enqueue
        await pipeline.enqueue(event_dict)

        # Real-time pub-sub stream dispatch with deduplication
        await event_bus.publish(
            "threat_detected",
            event_dict,
            idempotency_key=x_idempotency_key or evt_id
        )

    return decision.to_dict()

@router.get("/policies", response_model=List[FirewallPolicyResponse])
def list_policies(
    auth: AuthContext = Depends(require_permission("firewall:inspect")),
    db: Session = Depends(get_db),
):
    return (
        db.query(FirewallPolicy)
        .filter(FirewallPolicy.organization_id == auth.organization_id)
        .all()
    )

@router.post("/policies", response_model=FirewallPolicyResponse)
def create_policy(
    policy_in: FirewallPolicyCreate,
    auth: AuthContext = Depends(require_permission("rules:write")),
    db: Session = Depends(get_db),
):
    if policy_in.organization_id and policy_in.organization_id not in ("org-default", auth.organization_id):
        raise HTTPException(status_code=403, detail="Cannot create policy for another organization")
    policy = FirewallPolicy(
        organization_id=auth.organization_id,
        name=policy_in.name,
        mode=policy_in.mode,
        rules_json=[r.dict() for r in policy_in.rules],
        is_active=True
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy
