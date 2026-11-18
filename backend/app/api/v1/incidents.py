from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.core.database import get_db
from app.models.models import Incident, Organization
from app.schemas.schemas import IncidentResponse
from app.services.correlation_service import correlation_service

router = APIRouter(prefix="/incidents", tags=["Incident Forensics"])

@router.get("", response_model=List[IncidentResponse])
def list_incidents(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Incident).order_by(Incident.created_at.desc())
    if status:
        query = query.filter(Incident.status == status.lower())
    return query.all()

@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return inc

@router.post("/{incident_id}/respond")
def execute_incident_response(incident_id: str, action: str, target: str, db: Session = Depends(get_db)):
    """
    Feature 14: Automated Incident Response trigger (BLOCK_IP, QUARANTINE_SESSION, APPLY_RATE_LIMIT).
    """
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    log_entry = correlation_service.trigger_automated_response(
        action_type=action,
        target=target,
        actor="SOC Analyst / Automated Responder"
    )

    actions = inc.response_actions or []
    actions.append(action)
    inc.response_actions = actions
    inc.status = "resolved"
    inc.resolved_at = datetime.now(timezone.utc)
    db.commit()

    return {"status": "success", "action_log": log_entry}

@router.get("/audit/logs")
def get_audit_trail():
    return correlation_service.get_audit_logs()
