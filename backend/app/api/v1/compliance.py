from fastapi import APIRouter, Depends
from app.core.deps import AuthContext, get_current_user
from app.services.compliance_service import compliance_service

router = APIRouter(prefix="/compliance", tags=["Compliance Reports"])

@router.get("/report")
def get_compliance_report(
    framework: str = "owasp_llm",
    auth: AuthContext = Depends(get_current_user),
):
    return compliance_service.generate_assessment_report(framework=framework)
