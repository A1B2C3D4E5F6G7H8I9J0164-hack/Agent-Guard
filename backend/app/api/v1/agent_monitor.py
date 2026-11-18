from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.core.database import get_db
from app.models.models import AgentSession, ToolExecution, Application
from app.schemas.schemas import AgentSessionResponse, ToolExecutionResponse, ToolExecutionCreate
from app.engines.agent_monitor import agent_behaviour_engine

router = APIRouter(prefix="/agents", tags=["Agent Behaviour Monitoring"])

@router.get("/sessions", response_model=List[AgentSessionResponse])
def list_agent_sessions(application_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(AgentSession).order_by(AgentSession.created_at.desc())
    if application_id:
        query = query.filter(AgentSession.application_id == application_id)
    return query.limit(30).all()

@router.get("/sessions/{session_id}", response_model=AgentSessionResponse)
def get_agent_session(session_id: str, db: Session = Depends(get_db)):
    sess = db.query(AgentSession).filter(AgentSession.session_id == session_id).first()
    if not sess:
        raise HTTPException(status_code=404, detail="Agent session not found")
    return sess

@router.post("/tools/audit", response_model=ToolExecutionResponse)
def audit_tool_execution(req: ToolExecutionCreate, db: Session = Depends(get_db)):
    sess = db.query(AgentSession).filter(AgentSession.id == req.agent_session_id).first()
    if not sess:
        # Fallback to create or find first session
        sess = db.query(AgentSession).first()

    # Get recent tool history for this session
    recent_tools = [t.tool_name for t in sess.tool_executions[-5:]] if sess and sess.tool_executions else []

    audit_res = agent_behaviour_engine.audit_tool_call(
        tool_name=req.tool_name,
        parameters=req.parameters or {},
        recent_tool_history=recent_tools
    )

    status_str = "blocked" if not audit_res.is_allowed else ("flagged" if audit_res.is_flagged else "allowed")

    tool_exec = ToolExecution(
        agent_session_id=sess.id if sess else "sess-default",
        tool_name=req.tool_name,
        parameters_json=req.parameters,
        execution_status=status_str,
        risk_score=audit_res.risk_score,
        is_flagged=audit_res.is_flagged,
        flag_reason=audit_res.flag_reason
    )
    db.add(tool_exec)

    if sess:
        sess.total_tool_calls += 1
        if audit_res.risk_score >= 80.0:
            sess.status = "quarantined"
            sess.anomaly_score = max(sess.anomaly_score, 0.95)

    db.commit()
    db.refresh(tool_exec)
    return tool_exec
