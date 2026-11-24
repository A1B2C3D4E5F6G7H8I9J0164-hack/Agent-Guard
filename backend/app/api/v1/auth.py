import hashlib
import secrets
from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from app.core.database import get_db
from app.core.deps import AuthContext, get_current_user, require_permission
from app.core.security import (
    verify_password, get_password_hash, create_access_token,
    create_refresh_token, generate_api_key, hash_api_key,
    generate_mfa_secret, verify_totp_code, generate_recovery_codes,
    record_audit_log, has_permission, PERMISSIONS_MATRIX
)
from app.models.models import User, Organization, OrganizationMembership, ApiKey, UserSession, AuditLog
from app.schemas.schemas import (
    UserLogin, UserCreate, UserResponse, Token,
    ApiKeyCreate, ApiKeyCreatedResponse, ApiKeyResponse
)

router = APIRouter(prefix="/auth", tags=["Authentication & Access Control"])

@router.post("/register", response_model=Token)
def register(user_in: UserCreate, request: Request, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    hashed_pw = get_password_hash(user_in.password)
    user = User(
        email=user_in.email,
        hashed_password=hashed_pw,
        full_name=user_in.full_name or user_in.email.split("@")[0]
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Automatically create default organization
    org = Organization(
        name=f"{user.full_name}'s Org",
        slug=f"org-{user.id[:8]}",
        plan_tier="enterprise"
    )
    db.add(org)
    db.commit()
    db.refresh(org)

    membership = OrganizationMembership(
        user_id=user.id,
        organization_id=org.id,
        role="owner"
    )
    db.add(membership)
    db.commit()

    token = create_access_token(subject=user.id, role="owner", org_id=org.id)

    # Audit log
    record_audit_log(
        db=db,
        organization_id=org.id,
        action="user_registered",
        resource_type="user",
        actor_id=user.id,
        actor_email=user.email,
        ip_address=request.client.host if request.client else "127.0.0.1",
        after_state={"email": user.email, "role": "owner"}
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/login", response_model=Dict[str, Any])
def login(login_in: UserLogin, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    # If MFA is active, challenge MFA
    if user.mfa_enabled:
        return {
            "mfa_required": True,
            "temp_user_id": user.id,
            "message": "TOTP MFA code required to complete authentication."
        }

    # Fetch active membership
    membership = db.query(OrganizationMembership).filter(OrganizationMembership.user_id == user.id).first()
    role = membership.role if membership else "analyst"
    org_id = membership.organization_id if membership else "org-default"

    token = create_access_token(subject=user.id, role=role, org_id=org_id)
    raw_refresh, refresh_hash, exp = create_refresh_token(user.id)

    # Track session
    session_obj = UserSession(
        user_id=user.id,
        refresh_token_hash=refresh_hash,
        ip_address=request.client.host if request.client else "127.0.0.1",
        user_agent=request.headers.get("user-agent"),
        expires_at=exp
    )
    db.add(session_obj)
    db.commit()

    record_audit_log(
        db=db,
        organization_id=org_id,
        action="user_login",
        resource_type="session",
        actor_id=user.id,
        actor_email=user.email,
        ip_address=request.client.host if request.client else "127.0.0.1",
        after_state={"role": role}
    )

    return {
        "mfa_required": False,
        "access_token": token,
        "refresh_token": raw_refresh,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": role,
            "org_id": org_id,
            "mfa_enabled": user.mfa_enabled or False
        }
    }

@router.post("/mfa/setup")
def setup_mfa(
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = auth.user
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    secret = generate_mfa_secret()
    user.mfa_secret = secret
    db.commit()
    otpauth_url = f"otpauth://totp/AgentGuard:{user.email}?secret={secret}&issuer=AgentGuard"
    return {
        "secret": secret,
        "otpauth_url": otpauth_url
    }

@router.post("/mfa/verify")
def verify_mfa(
    payload: Dict[str, str],
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    code = payload.get("code", "")
    user = auth.user
    if not user or not user.mfa_secret:
        raise HTTPException(status_code=400, detail="MFA setup not initialized")

    if not verify_totp_code(user.mfa_secret, code):
        raise HTTPException(status_code=400, detail="Invalid verification code")

    user.mfa_enabled = True
    recovery_codes = generate_recovery_codes()
    user.recovery_codes = recovery_codes
    db.commit()

    return {
        "status": "mfa_activated",
        "recovery_codes": recovery_codes,
        "message": "TOTP hardware authentication enabled successfully."
    }

@router.post("/refresh")
def refresh_session(payload: Dict[str, str], db: Session = Depends(get_db)):
    refresh_token = payload.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=400, detail="Refresh token required")

    h = hashlib.sha256(refresh_token.encode('utf-8')).hexdigest()
    session_obj = db.query(UserSession).filter(
        UserSession.refresh_token_hash == h,
        UserSession.is_revoked == False
    ).first()

    if not session_obj or session_obj.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired or revoked")

    user = db.query(User).filter(User.id == session_obj.user_id).first()
    membership = db.query(OrganizationMembership).filter(OrganizationMembership.user_id == user.id).first()
    role = membership.role if membership else "analyst"
    org_id = membership.organization_id if membership else "org-default"

    new_access = create_access_token(user.id, role=role, org_id=org_id)
    return {"access_token": new_access, "token_type": "bearer"}

@router.post("/logout-all")
def logout_all_sessions(
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if auth.user_id:
        db.query(UserSession).filter(UserSession.user_id == auth.user_id).update({"is_revoked": True})
        db.commit()
    return {"status": "all_sessions_revoked", "message": "Signed out from all active devices."}

@router.get("/sessions")
def list_sessions(
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not auth.user_id:
        return []
    sessions = db.query(UserSession).filter(UserSession.user_id == auth.user_id, UserSession.is_revoked == False).all()
    return [
        {
            "id": s.id,
            "ip_address": s.ip_address,
            "user_agent": s.user_agent or "Browser / API Client",
            "created_at": s.created_at.isoformat(),
            "is_current": True
        }
        for s in sessions
    ]

@router.get("/me")
def get_me(auth: AuthContext = Depends(get_current_user)):
    if not auth.user:
        return {
            "id": auth.user_id,
            "email": auth.email,
            "full_name": auth.email,
            "role": auth.role,
            "org_id": auth.organization_id,
            "mfa_enabled": False,
            "permissions": auth.scopes,
        }
    return {
        "id": auth.user.id,
        "email": auth.user.email,
        "full_name": auth.user.full_name,
        "role": auth.role,
        "org_id": auth.organization_id,
        "mfa_enabled": auth.user.mfa_enabled or False,
        "permissions": PERMISSIONS_MATRIX.get(auth.role, [])
    }

# -------------------------------------------------------------
# MULTI-TENANCY & RBAC TEAM MANAGEMENT
# -------------------------------------------------------------
@router.get("/members")
def list_members(
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    members = db.query(OrganizationMembership).filter(
        OrganizationMembership.organization_id == auth.organization_id
    ).all()
    out = []
    for m in members:
        user = db.query(User).filter(User.id == m.user_id).first()
        out.append({
            "id": m.id,
            "user_id": m.user_id,
            "name": user.full_name if user else "Analyst",
            "email": user.email if user else "member@apexcyber.ai",
            "role": m.role,
            "created_at": m.created_at.isoformat()
        })
    return out

@router.post("/members")
def invite_member(
    payload: Dict[str, str],
    request: Request,
    auth: AuthContext = Depends(require_permission("org:members_write")),
    db: Session = Depends(get_db),
):
    email = payload.get("email", "")
    role = payload.get("role", "analyst")
    name = payload.get("name", email.split("@")[0])

    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    if role not in ["owner", "admin", "analyst", "viewer"]:
        raise HTTPException(status_code=400, detail="Invalid role specified")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            full_name=name,
            hashed_password=get_password_hash(secrets.token_urlsafe(24))
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    org_id = auth.organization_id

    mem = OrganizationMembership(
        user_id=user.id,
        organization_id=org_id,
        role=role
    )
    db.add(mem)
    db.commit()

    record_audit_log(
        db=db,
        organization_id=org_id,
        action="member_invited",
        resource_type="organization_membership",
        actor_id=auth.user_id,
        actor_email=auth.email,
        ip_address=request.client.host if request.client else "127.0.0.1",
        after_state={"invited_email": email, "role": role}
    )

    return {"status": "invited", "email": email, "role": role}

@router.put("/members/{member_id}/role")
def update_member_role(
    member_id: str,
    payload: Dict[str, str],
    request: Request,
    auth: AuthContext = Depends(require_permission("org:members_write")),
    db: Session = Depends(get_db),
):
    role = payload.get("role", "analyst")
    if role not in ["owner", "admin", "analyst", "viewer"]:
        raise HTTPException(status_code=400, detail="Invalid role specified")

    mem = db.query(OrganizationMembership).filter(
        OrganizationMembership.id == member_id,
        OrganizationMembership.organization_id == auth.organization_id,
    ).first()
    if not mem:
        raise HTTPException(status_code=404, detail="Membership not found")

    old_role = mem.role
    mem.role = role
    db.commit()

    record_audit_log(
        db=db,
        organization_id=mem.organization_id,
        action="member_role_updated",
        resource_type="organization_membership",
        actor_id=auth.user_id,
        actor_email=auth.email,
        ip_address=request.client.host if request.client else "127.0.0.1",
        before_state={"role": old_role},
        after_state={"role": role}
    )

    return {"status": "role_updated", "new_role": role}

# -------------------------------------------------------------
# AUDIT LOGS
# -------------------------------------------------------------
@router.get("/audit-logs")
def get_audit_logs(
    limit: int = 50,
    auth: AuthContext = Depends(require_permission("audit:read")),
    db: Session = Depends(get_db),
):
    logs = (
        db.query(AuditLog)
        .filter(AuditLog.organization_id == auth.organization_id)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": l.id,
            "action": l.action,
            "actor_email": l.actor_email,
            "resource_type": l.resource_type,
            "ip_address": l.ip_address,
            "before_state": l.before_state,
            "after_state": l.after_state,
            "created_at": l.created_at.isoformat()
        }
        for l in logs
    ]

# -------------------------------------------------------------
# API KEYS (With Scopes & Rotation)
# -------------------------------------------------------------
@router.post("/keys", response_model=ApiKeyCreatedResponse)
def create_api_key(
    key_in: ApiKeyCreate,
    auth: AuthContext = Depends(require_permission("org:keys_write")),
    db: Session = Depends(get_db),
):
    if key_in.organization_id and key_in.organization_id not in ("org-default", auth.organization_id):
        raise HTTPException(status_code=403, detail="Cannot create API key for another organization")
    target_org_id = auth.organization_id
    full_key, hashed_key, prefix_display = generate_api_key()

    api_key_obj = ApiKey(
        organization_id=target_org_id,
        user_id=auth.user_id,
        name=key_in.name,
        key_hash=hashed_key,
        prefix_display=prefix_display,
        scopes=key_in.scopes or ["firewall:inspect", "threats:read"]
    )
    db.add(api_key_obj)
    db.commit()
    db.refresh(api_key_obj)

    record_audit_log(
        db=db,
        organization_id=target_org_id,
        action="api_key_created",
        resource_type="api_key",
        actor_id=auth.user_id,
        actor_email=auth.email,
        after_state={"name": key_in.name, "prefix": prefix_display}
    )

    return {
        "id": api_key_obj.id,
        "name": api_key_obj.name,
        "raw_key": full_key,
        "prefix_display": prefix_display,
        "created_at": api_key_obj.created_at
    }

@router.get("/keys", response_model=List[ApiKeyResponse])
def list_api_keys(
    auth: AuthContext = Depends(require_permission("org:keys_write")),
    db: Session = Depends(get_db),
):
    keys = (
        db.query(ApiKey)
        .filter(
            ApiKey.organization_id == auth.organization_id,
            ApiKey.is_revoked == False,
        )
        .order_by(ApiKey.created_at.desc())
        .all()
    )
    return keys

@router.delete("/keys/{key_id}")
def revoke_api_key(
    key_id: str,
    auth: AuthContext = Depends(require_permission("org:keys_write")),
    db: Session = Depends(get_db),
):
    k = db.query(ApiKey).filter(
        ApiKey.id == key_id,
        ApiKey.organization_id == auth.organization_id,
    ).first()
    if not k:
        raise HTTPException(status_code=404, detail="API key not found")
    k.is_revoked = True
    db.commit()
    record_audit_log(
        db=db,
        organization_id=k.organization_id,
        action="api_key_revoked",
        resource_type="api_key",
        actor_id=auth.user_id,
        actor_email=auth.email,
        after_state={"key_id": key_id}
    )
    return {"status": "revoked"}
