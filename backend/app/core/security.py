import secrets
import hashlib
import base64
import struct
import hmac
import time
from datetime import datetime, timedelta, timezone
from typing import Optional, Union, Any, List, Dict
import bcrypt
from jose import jwt, JWTError
from app.core.config import settings

# -------------------------------------------------------------
# RBAC PERMISSIONS MATRIX
# -------------------------------------------------------------
PERMISSIONS_MATRIX: Dict[str, List[str]] = {
    "owner": [
        "firewall:inspect", "threats:read", "threats:simulate",
        "firewall:mode_change", "rules:write", "rules:rollback",
        "incidents:respond", "org:members_write", "org:keys_write",
        "audit:read", "settings:write"
    ],
    "admin": [
        "firewall:inspect", "threats:read", "threats:simulate",
        "firewall:mode_change", "rules:write", "rules:rollback",
        "incidents:respond", "org:members_write", "org:keys_write",
        "audit:read", "settings:write"
    ],
    "analyst": [
        "firewall:inspect", "threats:read", "threats:simulate",
        "incidents:respond", "audit:read"
    ],
    "viewer": [
        "threats:read", "firewall:inspect"
    ],
    "service": [
        "firewall:inspect", "threats:read"
    ]
}

def has_permission(role: str, permission: str) -> bool:
    perms = PERMISSIONS_MATRIX.get(role.lower(), [])
    return permission in perms

# -------------------------------------------------------------
# PASSWORDS (Bcrypt with 72-byte safe truncation)
# -------------------------------------------------------------
def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pwd_bytes = plain_password.encode('utf-8')[:72]
        return bcrypt.checkpw(pwd_bytes, hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

# -------------------------------------------------------------
# JWT ACCESS & REFRESH TOKENS
# -------------------------------------------------------------
def create_access_token(
    subject: Union[str, Any],
    role: str = "analyst",
    org_id: str = "org-default",
    expires_delta: Optional[timedelta] = None
) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "role": role,
        "org_id": org_id,
        "type": "access"
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(user_id: str) -> tuple[str, str, datetime]:
    raw_token = secrets.token_urlsafe(48)
    token_hash = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    return raw_token, token_hash, expires_at

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

# -------------------------------------------------------------
# TOTP MFA (RFC 6238 Standard Base32 + HMAC-SHA1)
# -------------------------------------------------------------
def generate_mfa_secret() -> str:
    random_bytes = secrets.token_bytes(20)
    return base64.b32encode(random_bytes).decode('utf-8').replace('=', '')

def generate_recovery_codes(count: int = 6) -> List[str]:
    return [f"{secrets.token_hex(4).upper()}-{secrets.token_hex(4).upper()}" for _ in range(count)]

def verify_totp_code(secret: str, code: str, window: int = 1) -> bool:
    try:
        code = code.strip()
        if not code.isdigit() or len(code) != 6:
            return False

        # Add base32 padding if needed
        padding = (8 - len(secret) % 8) % 8
        padded_secret = secret + '=' * padding
        key = base64.b32decode(padded_secret, casefold=True)

        current_interval = int(time.time() // 30)

        for i in range(-window, window + 1):
            interval = current_interval + i
            msg = struct.pack(">Q", interval)
            h = hmac.new(key, msg, hashlib.sha1).digest()
            offset = h[-1] & 0x0F
            truncated_hash = struct.unpack(">I", h[offset:offset + 4])[0] & 0x7FFFFFFF
            candidate_code = str(truncated_hash % 1000000).zfill(6)
            if candidate_code == code:
                return True
        return False
    except Exception:
        return False

# -------------------------------------------------------------
# API KEY MANAGEMENT (Hashed at rest)
# -------------------------------------------------------------
def generate_api_key(prefix: str = "ag_live_") -> tuple[str, str, str]:
    raw_secret = secrets.token_urlsafe(32)
    full_key = f"{prefix}{raw_secret}"
    hashed_key = hashlib.sha256(full_key.encode('utf-8')).hexdigest()
    prefix_display = f"{full_key[:12]}...{full_key[-4:]}"
    return full_key, hashed_key, prefix_display

def hash_api_key(key: str) -> str:
    return hashlib.sha256(key.encode('utf-8')).hexdigest()

# -------------------------------------------------------------
# AUDIT LOGGING HELPER
# -------------------------------------------------------------
def record_audit_log(
    db,
    organization_id: str,
    action: str,
    resource_type: str,
    actor_id: Optional[str] = None,
    actor_email: str = "system",
    resource_id: Optional[str] = None,
    before_state: Optional[Dict[str, Any]] = None,
    after_state: Optional[Dict[str, Any]] = None,
    ip_address: str = "127.0.0.1",
    user_agent: Optional[str] = None,
    metadata_json: Optional[Dict[str, Any]] = None
):
    from app.models.models import AuditLog
    try:
        log = AuditLog(
            organization_id=organization_id,
            actor_id=actor_id,
            actor_email=actor_email,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            before_state=before_state,
            after_state=after_state,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata_json=metadata_json
        )
        db.add(log)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Failed to record audit log: {e}")
