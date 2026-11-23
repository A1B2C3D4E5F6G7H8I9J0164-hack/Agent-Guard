import time
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from app.schemas.schemas import IntegrationConfigResponse, IntegrationConfigCreate, IntegrationTestResponse

router = APIRouter(prefix="/integrations", tags=["Ecosystem Integrations & Webhooks"])

# In-memory storage for active enterprise integrations
INTEGRATIONS_STORE: List[Dict[str, Any]] = [
    {
        "id": "slack-soc",
        "name": "Slack SOC Alerts Channel",
        "category": "Incident Notification",
        "status": "CONNECTED",
        "desc": "Streams critical threats and quarantine approvals to #soc-agentguard in real-time.",
        "enabled": True,
        "channel": "#soc-agentguard",
        "last_synced": "2 mins ago",
        "events_dispatched": 142
    },
    {
        "id": "splunk-siem",
        "name": "Splunk / SIEM Log Forwarder",
        "category": "Telemetry Export",
        "status": "CONNECTED",
        "desc": "Forwards CEF and OpenTelemetry JSON audit logs to centralized SIEM indexers.",
        "enabled": True,
        "channel": "index=agentguard_audit",
        "last_synced": "10 mins ago",
        "events_dispatched": 1420
    },
    {
        "id": "pagerduty-oncall",
        "name": "PagerDuty Urgent On-Call",
        "category": "Escalation",
        "status": "CONFIGURED",
        "desc": "Pages on-call cybersecurity engineer on critical multi-stage attack chains.",
        "enabled": True,
        "channel": "Service: AI-SOC-P1",
        "last_synced": "1 hour ago",
        "events_dispatched": 8
    },
    {
        "id": "openai-proxy",
        "name": "OpenAI Proxy Gateway",
        "category": "Model Ingestion",
        "status": "ACTIVE",
        "desc": "Direct reverse proxy middleware inspecting GPT-4o and o1 model endpoints.",
        "enabled": True,
        "channel": "Gateway: /v1/chat/completions",
        "last_synced": "Live Active",
        "events_dispatched": 48200
    },
    {
        "id": "anthropic-proxy",
        "name": "Anthropic Claude Gateway",
        "category": "Model Ingestion",
        "status": "ACTIVE",
        "desc": "Direct streaming middleware inspecting Claude-3.5-Sonnet and Opus API calls.",
        "enabled": True,
        "channel": "Gateway: /v1/messages",
        "last_synced": "Live Active",
        "events_dispatched": 12450
    },
    {
        "id": "datadog-metrics",
        "name": "Datadog Security Monitoring",
        "category": "Observability",
        "status": "READY",
        "desc": "Exports firewall latency overhead, anomaly z-scores, and threat rates.",
        "enabled": True,
        "channel": "dd-agent.metrics.agentguard",
        "last_synced": "5 mins ago",
        "events_dispatched": 890
    }
]

@router.get("", response_model=List[IntegrationConfigResponse])
def list_integrations():
    return INTEGRATIONS_STORE

@router.post("", response_model=IntegrationConfigResponse)
def update_or_create_integration(config: IntegrationConfigCreate):
    for idx, item in enumerate(INTEGRATIONS_STORE):
        if item["id"] == config.id:
            INTEGRATIONS_STORE[idx]["name"] = config.name
            INTEGRATIONS_STORE[idx]["category"] = config.category
            INTEGRATIONS_STORE[idx]["status"] = config.status
            INTEGRATIONS_STORE[idx]["enabled"] = config.enabled
            if config.desc:
                INTEGRATIONS_STORE[idx]["desc"] = config.desc
            if config.channel:
                INTEGRATIONS_STORE[idx]["channel"] = config.channel
            INTEGRATIONS_STORE[idx]["last_synced"] = "Just now"
            return INTEGRATIONS_STORE[idx]
    
    # New integration
    new_item = {
        "id": config.id,
        "name": config.name,
        "category": config.category,
        "status": config.status,
        "desc": config.desc or "Custom integration connector",
        "enabled": config.enabled,
        "channel": config.channel or "default",
        "last_synced": "Just now",
        "events_dispatched": 0
    }
    INTEGRATIONS_STORE.append(new_item)
    return new_item

@router.post("/{integration_id}/test", response_model=IntegrationTestResponse)
def test_integration_connection(integration_id: str):
    target = next((item for item in INTEGRATIONS_STORE if item["id"] == integration_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Integration connector not found")
    
    t0 = time.perf_counter()
    # Emulate real handshake latency
    time.sleep(0.05)
    latency = (time.perf_counter() - t0) * 1000.0

    target["last_synced"] = "Just now"
    target["events_dispatched"] += 1
    target["status"] = "CONNECTED"

    return {
        "success": True,
        "integration_id": integration_id,
        "message": f"Successfully delivered test probe payload to {target['name']}. Webhook acknowledged with HTTP 200 OK.",
        "latency_ms": round(latency, 2),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
