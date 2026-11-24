from fastapi import APIRouter, Depends
from typing import Optional
from app.core.deps import AuthContext, get_current_user, require_permission
from app.services.redteam_service import redteam_service
from app.services.replay_service import replay_service

router = APIRouter(prefix="/redteam", tags=["Red Team Lab & Regression"])

@router.get("/suites")
def get_suites(auth: AuthContext = Depends(get_current_user)):
    return redteam_service.get_test_suites()

@router.post("/run")
def execute_redteam_run(
    suite_id: Optional[str] = "all",
    target_name: Optional[str] = "Customer Support Assistant",
    auth: AuthContext = Depends(require_permission("threats:simulate")),
):
    return redteam_service.run_suite(suite_id=suite_id, target_name=target_name)

@router.get("/regression")
def get_regression_cases(auth: AuthContext = Depends(get_current_user)):
    return replay_service.get_regression_cases()

@router.post("/regression/run")
def execute_regression_run(auth: AuthContext = Depends(require_permission("threats:simulate"))):
    return replay_service.run_regression_suite()
