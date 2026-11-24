from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List
from app.core.deps import AuthContext, require_permission
from app.services.threat_intel import threat_intel_service
from app.schemas.schemas import ThreatIntelReputationResponse, ThreatSignatureResponse, ThreatSignatureCreate

router = APIRouter(prefix="/intel", tags=["Attack Intelligence & Threat Feed"])

@router.get("/reputation", response_model=ThreatIntelReputationResponse)
def lookup_ip_reputation(
    ip: str = Query(..., description="IP address or domain to investigate"),
    auth: AuthContext = Depends(require_permission("threats:read")),
):
    if not ip or not ip.strip():
        raise HTTPException(status_code=400, detail="IP address parameter is required")
    return threat_intel_service.check_ip_reputation(ip.strip())

@router.get("/feed", response_model=List[ThreatSignatureResponse])
def get_threat_signatures(auth: AuthContext = Depends(require_permission("threats:read"))):
    return threat_intel_service.get_threat_feed()

@router.post("/signatures", response_model=ThreatSignatureResponse)
def add_threat_signature(
    sig_in: ThreatSignatureCreate,
    auth: AuthContext = Depends(require_permission("rules:write")),
):
    sig = threat_intel_service.add_signature(
        name=sig_in.name,
        sig_type=sig_in.type,
        severity=sig_in.severity,
        pattern=sig_in.pattern,
        description=sig_in.description
    )
    return sig
