from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field

# Auth & User
class UserLogin(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    is_active: bool
    is_superuser: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Organizations & Projects
class OrganizationCreate(BaseModel):
    name: str
    slug: Optional[str] = None

class OrganizationResponse(BaseModel):
    id: str
    name: str
    slug: str
    plan_tier: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ProjectCreate(BaseModel):
    organization_id: str
    name: str
    description: Optional[str] = None

class ProjectResponse(BaseModel):
    id: str
    organization_id: str
    name: str
    description: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ApplicationCreate(BaseModel):
    project_id: str
    name: str
    environment: str = "production"
    model_provider: str = "OpenAI GPT-4o"

class ApplicationResponse(BaseModel):
    id: str
    project_id: str
    name: str
    environment: str
    model_provider: str
    status: str
    total_requests: int
    blocked_requests: int
    threat_detection_rate: float
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# API Targets
class ApiTargetCreate(BaseModel):
    organization_id: str
    name: str
    base_url: str
    auth_header_name: str = "Authorization"
    auth_token: Optional[str] = None
    is_authorized: bool = True

class ApiTargetResponse(BaseModel):
    id: str
    organization_id: str
    name: str
    base_url: str
    auth_header_name: str
    auth_token_masked: str
    is_authorized: bool
    risk_level: str
    last_scanned_at: Optional[datetime] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Security Events & Detections
class ThreatDetectionResponse(BaseModel):
    id: str
    engine_name: str
    attack_category: str
    confidence: float
    rule_triggered: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    model_config = ConfigDict(from_attributes=True)

class SecurityEventResponse(BaseModel):
    id: str
    organization_id: str
    application_id: Optional[str] = None
    event_type: str
    severity: str
    source_ip: str
    session_id: Optional[str] = None
    risk_score: float
    confidence: float
    payload_sample: Optional[str] = None
    action_taken: str
    created_at: datetime
    detections: List[ThreatDetectionResponse] = []
    model_config = ConfigDict(from_attributes=True)

# Firewall
class FirewallRule(BaseModel):
    rule_id: str
    name: str
    description: str
    condition: str # e.g. "prompt_injection_score > 0.70"
    action: str # "block", "redact", "quarantine", "allow"
    is_active: bool = True

class FirewallPolicyCreate(BaseModel):
    organization_id: str
    name: str
    mode: str = "enforce" # "monitor", "enforce", "disabled"
    rules: List[FirewallRule]

class FirewallPolicyResponse(BaseModel):
    id: str
    organization_id: str
    name: str
    mode: str
    rules_json: Any
    is_active: bool
    version: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class FirewallInspectRequest(BaseModel):
    application_id: Optional[str] = None
    prompt: Optional[str] = None
    response_text: Optional[str] = None
    tool_call: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None
    source_ip: Optional[str] = "127.0.0.1"

class FirewallInspectResponse(BaseModel):
    decision: str # "allow", "block", "redact", "quarantine"
    risk_score: float
    severity: str
    flagged: bool
    sanitized_prompt: Optional[str] = None
    sanitized_response: Optional[str] = None
    reasons: List[str]
    rule_triggered: Optional[str] = None
    latency_ms: float

# Scan & Red Team
class ScanExecutionCreate(BaseModel):
    organization_id: str
    target_id: Optional[str] = None
    scan_type: str = "full" # "full", "prompt-injection", "api-security", "redteam", "credential"

class ScanFindingResponse(BaseModel):
    id: str
    scan_id: str
    title: str
    severity: str
    category: str
    description: str
    request_payload: Optional[str] = None
    response_summary: Optional[str] = None
    remediation: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ScanExecutionResponse(BaseModel):
    id: str
    organization_id: str
    target_id: Optional[str] = None
    scan_type: str
    status: str
    total_tests: int
    passed_tests: int
    failed_tests: int
    risk_score: float
    started_at: datetime
    completed_at: Optional[datetime] = None
    findings: List[ScanFindingResponse] = []
    model_config = ConfigDict(from_attributes=True)

# Agent Monitor
class ToolExecutionCreate(BaseModel):
    agent_session_id: str
    tool_name: str
    parameters: Optional[Dict[str, Any]] = None

class ToolExecutionResponse(BaseModel):
    id: str
    agent_session_id: str
    tool_name: str
    parameters_json: Optional[Dict[str, Any]] = None
    execution_status: str
    risk_score: float
    is_flagged: bool
    flag_reason: Optional[str] = None
    executed_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AgentSessionResponse(BaseModel):
    id: str
    application_id: str
    agent_name: str
    session_id: str
    status: str
    total_tool_calls: int
    anomaly_score: float
    created_at: datetime
    tool_executions: List[ToolExecutionResponse] = []
    model_config = ConfigDict(from_attributes=True)

# Incident
class IncidentResponse(BaseModel):
    id: str
    organization_id: str
    title: str
    status: str
    severity: str
    root_cause: Optional[str] = None
    affected_resource: Optional[str] = None
    events_count: int
    attack_sequence: Optional[List[str]] = None
    response_actions: Optional[List[str]] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

# API Key
class ApiKeyCreate(BaseModel):
    organization_id: str
    name: str
    scopes: Optional[List[str]] = None

class ApiKeyCreatedResponse(BaseModel):
    id: str
    name: str
    raw_key: str # Displayed once
    prefix_display: str
    created_at: datetime

class ApiKeyResponse(BaseModel):
    id: str
    name: str
    prefix_display: str
    is_revoked: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Command CLI Execution Schema
class TerminalCommandRequest(BaseModel):
    command: str

class TerminalCommandResponse(BaseModel):
    command: str
    stdout: str
    stderr: Optional[str] = None
    exit_code: int
    format: str = "text"

# Threat Intelligence & IOC Schemas
class ThreatIntelReputationResponse(BaseModel):
    ip: str
    reputation: str # "malicious", "suspicious", "clean"
    threat_type: str
    confidence: float
    is_known_threat: bool
    details: Optional[Dict[str, Any]] = None

class ThreatSignatureCreate(BaseModel):
    id: Optional[str] = None
    name: str
    type: str
    severity: str = "high" # critical, high, medium, low
    pattern: Optional[str] = None
    description: Optional[str] = None

class ThreatSignatureResponse(BaseModel):
    id: str
    name: str
    type: str
    severity: str
    added_at: str
    pattern: Optional[str] = None
    description: Optional[str] = None

# Integration Connectors Schemas
class IntegrationConfigCreate(BaseModel):
    id: str
    name: str
    category: str
    status: str = "CONNECTED" # CONNECTED, CONFIGURED, ACTIVE, READY, DISABLED
    webhook_url: Optional[str] = None
    api_token: Optional[str] = None
    channel: Optional[str] = None
    desc: Optional[str] = None
    enabled: bool = True

class IntegrationConfigResponse(BaseModel):
    id: str
    name: str
    category: str
    status: str
    desc: str
    enabled: bool = True
    channel: Optional[str] = None
    last_synced: Optional[str] = None
    events_dispatched: int = 0

class IntegrationTestResponse(BaseModel):
    success: bool
    integration_id: str
    message: str
    latency_ms: float
    timestamp: str

