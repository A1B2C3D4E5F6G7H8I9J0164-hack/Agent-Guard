from datetime import datetime, timezone
import uuid
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, Enum as SQLEnum, JSON, Index
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    avatar_url = Column(String(512), nullable=True)
    auth_provider = Column(String(50), default="local")
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    mfa_secret = Column(String(100), nullable=True)
    mfa_enabled = Column(Boolean, default=False)
    recovery_codes = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    memberships = relationship("OrganizationMembership", back_populates="user", cascade="all, delete-orphan")
    api_keys = relationship("ApiKey", back_populates="user")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    plan_tier = Column(String(50), default="enterprise") # starter, pro, enterprise
    created_at = Column(DateTime, default=get_utc_now)

    memberships = relationship("OrganizationMembership", back_populates="organization", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="organization", cascade="all, delete-orphan")
    api_targets = relationship("ApiTarget", back_populates="organization", cascade="all, delete-orphan")
    security_events = relationship("SecurityEvent", back_populates="organization", cascade="all, delete-orphan")
    incidents = relationship("Incident", back_populates="organization", cascade="all, delete-orphan")
    firewall_policies = relationship("FirewallPolicy", back_populates="organization", cascade="all, delete-orphan")
    api_keys = relationship("ApiKey", back_populates="organization", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="organization", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="organization", cascade="all, delete-orphan")
    subscription = relationship("Subscription", back_populates="organization", uselist=False, cascade="all, delete-orphan")


class OrganizationMembership(Base):
    __tablename__ = "organization_memberships"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), default="analyst") # owner, admin, analyst, viewer
    created_at = Column(DateTime, default=get_utc_now)

    organization = relationship("Organization", back_populates="memberships")
    user = relationship("User", back_populates="memberships")


class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

    organization = relationship("Organization", back_populates="projects")
    applications = relationship("Application", back_populates="project", cascade="all, delete-orphan")


class Application(Base):
    __tablename__ = "applications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    environment = Column(String(50), default="production") # production, staging, development
    model_provider = Column(String(100), default="OpenAI GPT-4o")
    status = Column(String(50), default="active") # active, warning, critical, paused
    total_requests = Column(Integer, default=0)
    blocked_requests = Column(Integer, default=0)
    threat_detection_rate = Column(Float, default=0.0)
    created_at = Column(DateTime, default=get_utc_now)

    project = relationship("Project", back_populates="applications")
    security_events = relationship("SecurityEvent", back_populates="application")
    agent_sessions = relationship("AgentSession", back_populates="application", cascade="all, delete-orphan")


class ApiTarget(Base):
    __tablename__ = "api_targets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    base_url = Column(String(500), nullable=False)
    auth_header_name = Column(String(100), default="Authorization")
    auth_token_masked = Column(String(255), default="Bearer sk-***")
    is_authorized = Column(Boolean, default=True) # Must be explicitly true for scanning
    risk_level = Column(String(50), default="low")
    last_scanned_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

    organization = relationship("Organization", back_populates="api_targets")
    scans = relationship("ScanExecution", back_populates="target", cascade="all, delete-orphan")


class SecurityEvent(Base):
    __tablename__ = "security_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="SET NULL"), nullable=True, index=True)
    event_type = Column(String(100), nullable=False, index=True) # prompt_injection, jailbreak, data_leakage, api_abuse, agent_anomaly
    severity = Column(String(50), default="medium", index=True) # critical, high, medium, low, info
    source_ip = Column(String(64), default="127.0.0.1")
    session_id = Column(String(100), index=True, nullable=True)
    correlation_id = Column(String(100), index=True, nullable=True)
    risk_score = Column(Float, default=0.0)
    confidence = Column(Float, default=0.95)
    payload_sample = Column(Text, nullable=True) # sanitized
    action_taken = Column(String(50), default="monitored") # allowed, blocked, redacted, quarantined
    created_at = Column(DateTime, default=get_utc_now, index=True)

    organization = relationship("Organization", back_populates="security_events")
    application = relationship("Application", back_populates="security_events")
    detections = relationship("ThreatDetection", back_populates="security_event", cascade="all, delete-orphan")


class ThreatDetection(Base):
    __tablename__ = "threat_detections"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    security_event_id = Column(String(36), ForeignKey("security_events.id", ondelete="CASCADE"), nullable=False, index=True)
    engine_name = Column(String(100), nullable=False) # PromptInjectionEngine, JailbreakEngine, DataLeakageEngine
    attack_category = Column(String(100), nullable=False)
    confidence = Column(Float, default=0.9)
    rule_triggered = Column(String(255), nullable=True)
    details = Column(JSON, nullable=True)

    security_event = relationship("SecurityEvent", back_populates="detections")


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    status = Column(String(50), default="open", index=True) # open, investigating, resolved, false_positive
    severity = Column(String(50), default="high", index=True) # critical, high, medium, low
    root_cause = Column(String(255), nullable=True)
    affected_resource = Column(String(255), nullable=True)
    events_count = Column(Integer, default=1)
    attack_sequence = Column(JSON, nullable=True) # Array of event IDs in sequence
    response_actions = Column(JSON, nullable=True) # List of actions executed
    created_at = Column(DateTime, default=get_utc_now, index=True)
    resolved_at = Column(DateTime, nullable=True)

    organization = relationship("Organization", back_populates="incidents")


class Vulnerability(Base):
    __tablename__ = "vulnerabilities"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=True, index=True)
    cve_id = Column(String(100), nullable=True)
    title = Column(String(255), nullable=False)
    severity = Column(String(50), default="medium")
    category = Column(String(100), nullable=False) # OWASP-LLM-01, OWASP-API-01, etc.
    description = Column(Text, nullable=False)
    remediation = Column(Text, nullable=False)
    status = Column(String(50), default="open") # open, remediated, ignored
    created_at = Column(DateTime, default=get_utc_now)


class AttackTestCase(Base):
    __tablename__ = "attack_test_cases"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    suite_name = Column(String(100), nullable=False, index=True) # prompt-injection, jailbreak, tool-abuse, data-exfil
    category = Column(String(100), nullable=False)
    name = Column(String(255), nullable=False)
    payload = Column(Text, nullable=False)
    expected_outcome = Column(String(50), default="block") # block, sanitize, flag
    severity = Column(String(50), default="high")


class ScanExecution(Base):
    __tablename__ = "scan_executions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    target_id = Column(String(36), ForeignKey("api_targets.id", ondelete="CASCADE"), nullable=True, index=True)
    scan_type = Column(String(100), default="full") # full, prompt-injection, api-security, redteam, credential
    status = Column(String(50), default="pending") # pending, running, completed, failed
    total_tests = Column(Integer, default=0)
    passed_tests = Column(Integer, default=0)
    failed_tests = Column(Integer, default=0)
    risk_score = Column(Float, default=0.0)
    started_at = Column(DateTime, default=get_utc_now)
    completed_at = Column(DateTime, nullable=True)

    target = relationship("ApiTarget", back_populates="scans")
    findings = relationship("ScanFinding", back_populates="scan", cascade="all, delete-orphan")


class ScanFinding(Base):
    __tablename__ = "scan_findings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    scan_id = Column(String(36), ForeignKey("scan_executions.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    severity = Column(String(50), default="high")
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    request_payload = Column(Text, nullable=True)
    response_summary = Column(Text, nullable=True)
    remediation = Column(Text, nullable=False)
    created_at = Column(DateTime, default=get_utc_now)

    scan = relationship("ScanExecution", back_populates="findings")


class FirewallPolicy(Base):
    __tablename__ = "firewall_policies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    mode = Column(String(50), default="enforce") # monitor, enforce, disabled
    rules_json = Column(JSON, nullable=False) # list of rules
    is_active = Column(Boolean, default=True)
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    organization = relationship("Organization", back_populates="firewall_policies")


class AgentSession(Base):
    __tablename__ = "agent_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    application_id = Column(String(36), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    agent_name = Column(String(255), nullable=False)
    session_id = Column(String(100), unique=True, index=True, nullable=False)
    status = Column(String(50), default="active") # active, completed, quarantined, flagged
    total_tool_calls = Column(Integer, default=0)
    anomaly_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    application = relationship("Application", back_populates="agent_sessions")
    tool_executions = relationship("ToolExecution", back_populates="session", cascade="all, delete-orphan")


class ToolExecution(Base):
    __tablename__ = "tool_executions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    agent_session_id = Column(String(36), ForeignKey("agent_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    tool_name = Column(String(255), nullable=False)
    parameters_json = Column(JSON, nullable=True)
    execution_status = Column(String(50), default="allowed") # allowed, blocked, quarantined
    risk_score = Column(Float, default=0.0)
    is_flagged = Column(Boolean, default=False)
    flag_reason = Column(String(255), nullable=True)
    executed_at = Column(DateTime, default=get_utc_now)

    session = relationship("AgentSession", back_populates="tool_executions")


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    refresh_token_hash = Column(String(255), unique=True, index=True, nullable=False)
    ip_address = Column(String(64), default="127.0.0.1")
    user_agent = Column(String(255), nullable=True)
    expires_at = Column(DateTime, nullable=False)
    is_revoked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=get_utc_now)

    user = relationship("User", back_populates="sessions")


class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(255), nullable=False)
    key_hash = Column(String(255), unique=True, index=True, nullable=False)
    prefix_display = Column(String(50), nullable=False)
    scopes = Column(JSON, default=lambda: ["firewall:inspect", "threats:read"])
    expires_at = Column(DateTime, nullable=True)
    last_used_at = Column(DateTime, nullable=True)
    is_revoked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=get_utc_now)

    organization = relationship("Organization", back_populates="api_keys")
    user = relationship("User", back_populates="api_keys")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_id = Column(String(36), nullable=True)
    actor_email = Column(String(255), default="system")
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(100), nullable=False)
    resource_id = Column(String(255), nullable=True)
    before_state = Column(JSON, nullable=True)
    after_state = Column(JSON, nullable=True)
    ip_address = Column(String(64), default="127.0.0.1")
    user_agent = Column(String(255), nullable=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, index=True)

    organization = relationship("Organization", back_populates="audit_logs")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(50), default="info") # info, warning, critical
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=get_utc_now)

    organization = relationship("Organization", back_populates="notifications")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), unique=True, nullable=False)
    plan_id = Column(String(50), default="enterprise")
    status = Column(String(50), default="active")
    seats_limit = Column(Integer, default=25)
    requests_monthly_limit = Column(Integer, default=1_000_000)
    created_at = Column(DateTime, default=get_utc_now)

    organization = relationship("Organization", back_populates="subscription")
