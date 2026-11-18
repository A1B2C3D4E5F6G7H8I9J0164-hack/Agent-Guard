from fastapi import APIRouter
from typing import Optional
from app.services.compliance_service import compliance_service

router = APIRouter(prefix="/compliance", tags=["Compliance Reports"])

@router.get("/report")
def get_compliance_report(framework: str = "owasp_llm"):
    return compliance_service.generate_assessment_report(framework=framework)
