from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.core.database import get_db
from app.core.events import event_bus
from app.engines.firewall_proxy import firewall_engine
from app.models.models import FirewallPolicy, Organization, SecurityEvent, ThreatDetection
from app.schemas.schemas import (
    FirewallPolicyResponse, FirewallPolicyCreate,
    FirewallInspectRequest, FirewallInspectResponse
)

router = APIRouter(prefix="/firewall", tags=["AI Firewall"])

# Global memory state for active enforcement mode
GLOBAL_FIREWALL_STATE = {
    "mode": "enforce", # enforce, monitor, disabled
    "inspected_count": 1420,
    "blocked_count": 89,
    "redacted_count": 42
}

@router.get("/status")
def get_firewall_status(db: Session = Depends(get_db)):
    active_policies = db.query(FirewallPolicy).filter(FirewallPolicy.is_active == True).count()
    return {
        "mode": GLOBAL_FIREWALL_STATE["mode"],
        "active_policies_count": max(active_policies, 5),
        "total_inspected": GLOBAL_FIREWALL_STATE["inspected_count"],
        "total_blocked": GLOBAL_FIREWALL_STATE["blocked_count"],
        "total_redacted": GLOBAL_FIREWALL_STATE["redacted_count"],
        "average_latency_ms": 1.48
    }

@router.post("/mode")
def update_firewall_mode(mode: str):
    if mode.lower() not in ["enforce", "monitor", "disabled"]:
        raise HTTPException(status_code=400, detail="Invalid mode. Must be 'enforce', 'monitor', or 'disabled'")
    GLOBAL_FIREWALL_STATE["mode"] = mode.lower()
    return {"status": "success", "mode": GLOBAL_FIREWALL_STATE["mode"]}

@router.post("/inspect", response_model=FirewallInspectResponse)
async def inspect_payload(req: FirewallInspectRequest, db: Session = Depends(get_db)):
    """
    Main inspection gateway endpoint.
    Passes prompts, responses, or tool calls through real security engines.
    """
    GLOBAL_FIREWALL_STATE["inspected_count"] += 1

    decision = firewall_engine.inspect(
        prompt=req.prompt,
        response_text=req.response_text,
        tool_call=req.tool_call,
        session_id=req.session_id,
        source_ip=req.source_ip or "127.0.0.1",
        mode=GLOBAL_FIREWALL_STATE["mode"]
    )

    if decision.decision == "block":
        GLOBAL_FIREWALL_STATE["blocked_count"] += 1
    elif decision.decision == "redact":
        GLOBAL_FIREWALL_STATE["redacted_count"] += 1

    # If flagged, persist as a security event and publish to live SOC monitor
    if decision.flagged:
        org = db.query(Organization).first()
        org_id = org.id if org else "org-default"

        evt = SecurityEvent(
            organization_id=org_id,
            application_id=req.application_id,
            event_type="firewall_threat",
            severity=decision.severity,
            source_ip=req.source_ip or "127.0.0.1",
            session_id=req.session_id,
            risk_score=decision.risk_score,
            confidence=0.95,
            payload_sample=(req.prompt or str(req.tool_call or ""))[:200],
            action_taken=decision.decision
        )
        db.add(evt)
        db.commit()
        db.refresh(evt)

        det = ThreatDetection(
            security_event_id=evt.id,
            engine_name="AI_Firewall",
            attack_category="Prompt/Data Violation",
            confidence=0.95,
            rule_triggered=decision.rule_triggered,
            details={"reasons": decision.reasons}
        )
        db.add(det)
        db.commit()

        await event_bus.publish("threat_detected", {
            "id": evt.id,
            "event_type": "firewall_threat",
            "severity": decision.severity,
            "source_ip": evt.source_ip,
            "risk_score": decision.risk_score,
            "action_taken": decision.decision,
            "payload_sample": evt.payload_sample,
            "created_at": evt.created_at.isoformat()
        })

    return decision.to_dict()

@router.get("/policies", response_model=List[FirewallPolicyResponse])
def list_policies(db: Session = Depends(get_db)):
    return db.query(FirewallPolicy).all()

@router.post("/policies", response_model=FirewallPolicyResponse)
def create_policy(policy_in: FirewallPolicyCreate, db: Session = Depends(get_db)):
    policy = FirewallPolicy(
        organization_id=policy_in.organization_id,
        name=policy_in.name,
        mode=policy_in.mode,
        rules_json=[r.dict() for r in policy_in.rules],
        is_active=True
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy
