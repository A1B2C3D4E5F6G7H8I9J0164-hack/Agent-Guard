from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import Depends, HTTPException, Request, WebSocket, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    PERMISSIONS_MATRIX,
    decode_access_token,
    has_permission,
    hash_api_key,
)
from app.models.models import ApiKey, OrganizationMembership, User


@dataclass
class AuthContext:
    """Authenticated caller context for HTTP and WebSocket endpoints."""

    user: Optional[User]
    user_id: Optional[str]
    email: str
    role: str
    organization_id: str
    scopes: List[str] = field(default_factory=list)
    auth_type: str = "jwt"


def _extract_bearer_token(auth_header: Optional[str]) -> Optional[str]:
    if not auth_header:
        return None
    parts = auth_header.strip().split(" ", 1)
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1].strip()
    return None


def _authenticate_api_key(raw_key: str, db: Session) -> Optional[AuthContext]:
    key_hash = hash_api_key(raw_key)
    api_key = (
        db.query(ApiKey)
        .filter(ApiKey.key_hash == key_hash, ApiKey.is_revoked == False)
        .first()
    )
    if not api_key:
        return None
    if api_key.expires_at and api_key.expires_at < datetime.now(timezone.utc):
        return None

    api_key.last_used_at = datetime.now(timezone.utc)
    db.commit()

    return AuthContext(
        user=None,
        user_id=api_key.user_id,
        email=f"service:{api_key.name}",
        role="service",
        organization_id=api_key.organization_id,
        scopes=list(api_key.scopes or []),
        auth_type="api_key",
    )


def _authenticate_jwt(token: str, db: Session) -> Optional[AuthContext]:
    payload = decode_access_token(token)
    if not payload or payload.get("type") != "access":
        return None

    user_id = payload.get("sub")
    if not user_id:
        return None

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        return None

    token_org_id = payload.get("org_id")
    membership = None
    if token_org_id:
        membership = (
            db.query(OrganizationMembership)
            .filter(
                OrganizationMembership.user_id == user.id,
                OrganizationMembership.organization_id == token_org_id,
            )
            .first()
        )
    if not membership:
        membership = (
            db.query(OrganizationMembership)
            .filter(OrganizationMembership.user_id == user.id)
            .first()
        )
    if not membership:
        return None

    role = membership.role
    return AuthContext(
        user=user,
        user_id=user.id,
        email=user.email,
        role=role,
        organization_id=membership.organization_id,
        scopes=list(PERMISSIONS_MATRIX.get(role.lower(), [])),
        auth_type="jwt",
    )


def authenticate_credentials(
    bearer_token: Optional[str],
    api_key_header: Optional[str],
    db: Session,
) -> Optional[AuthContext]:
    """Resolve either an API key or a Bearer JWT into an AuthContext."""
    if api_key_header:
        return _authenticate_api_key(api_key_header.strip(), db)

    if bearer_token:
        if bearer_token.startswith("ag_live_"):
            return _authenticate_api_key(bearer_token, db)
        return _authenticate_jwt(bearer_token, db)

    return None


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> AuthContext:
    """FastAPI dependency enforcing valid JWT or API key authentication."""
    bearer = _extract_bearer_token(request.headers.get("authorization"))
    api_key = request.headers.get("x-api-key")
    auth = authenticate_credentials(bearer, api_key, db)
    if not auth:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return auth


def require_permission(permission: str):
    """FastAPI dependency factory enforcing RBAC or API key scopes."""

    def _checker(auth: AuthContext = Depends(get_current_user)) -> AuthContext:
        if auth.auth_type == "api_key":
            allowed = permission in auth.scopes
        else:
            allowed = has_permission(auth.role, permission)
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing required permission: {permission}",
            )
        return auth

    return _checker


async def authenticate_websocket(
    websocket: WebSocket,
    db: Session,
    required_permission: Optional[str] = None,
) -> Optional[AuthContext]:
    """Validate WebSocket handshake credentials; closes with 1008 on failure."""
    query_token = websocket.query_params.get("token")
    bearer = _extract_bearer_token(websocket.headers.get("authorization")) or query_token
    api_key = websocket.headers.get("x-api-key")

    auth = authenticate_credentials(bearer, api_key, db)
    if not auth:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Not authenticated")
        return None

    if required_permission:
        allowed = (
            required_permission in auth.scopes
            if auth.auth_type == "api_key"
            else has_permission(auth.role, required_permission)
        )
        if not allowed:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Forbidden")
            return None

    return auth
