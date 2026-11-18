from fastapi import APIRouter
from typing import Optional, Dict, Any
from app.services.redteam_service import redteam_service
from app.services.replay_service import replay_service

router = APIRouter(prefix="/redteam", tags=["Red Team Lab & Regression"])

@router.get("/suites")
def get_suites():
    return redteam_service.get_test_suites()

@router.post("/run")
def execute_redteam_run(suite_id: Optional[str] = "all", target_name: Optional[str] = "Customer Support Assistant"):
    return redteam_service.run_suite(suite_id=suite_id, target_name=target_name)

@router.get("/regression")
def get_regression_cases():
    return replay_service.get_regression_cases()

@router.post("/regression/run")
def execute_regression_run():
    return replay_service.run_regression_suite()
