import time
import hmac
import hashlib
import struct
import base64
import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import Base, engine
from app.seed import seed_database


@pytest.fixture(scope="module")
def client():
    Base.metadata.create_all(bind=engine)
    seed_database()
    with TestClient(app) as c:
        yield c


def _generate_valid_totp(secret: str) -> str:
    padding = (8 - len(secret) % 8) % 8
    key = base64.b32decode(secret + "=" * padding, casefold=True)
    interval = int(time.time() // 30)
    msg = struct.pack(">Q", interval)
    h = hmac.new(key, msg, hashlib.sha1).digest()
    offset = h[-1] & 0x0F
    truncated = struct.unpack(">I", h[offset:offset + 4])[0] & 0x7FFFFFFF
    return str(truncated % 1000000).zfill(6)


def test_register_login_mfa_and_sessions(client):
    unique_email = f"intern_{uuid.uuid4().hex[:8]}@agentguard.io"
    reg_res = client.post(
        "/api/v1/auth/register",
        json={
            "email": unique_email,
            "password": "StrongPassword!123",
            "full_name": "Security Intern",
            "org_name": "Interview Demo Org",
        },
    )
    assert reg_res.status_code == 200
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    token = reg_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify Login works without MFA initially
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": unique_email, "password": "StrongPassword!123"},
    )
    assert login_res.status_code == 200
    assert login_res.json()["mfa_required"] is False

    # Setup TOTP MFA
    mfa_setup = client.post("/api/v1/auth/mfa/setup", headers=headers)
    assert mfa_setup.status_code == 200
    secret = mfa_setup.json()["secret"]
    assert "otpauth_url" in mfa_setup.json()

    # Verify valid TOTP code activates MFA & returns recovery codes
    valid_code = _generate_valid_totp(secret)
    mfa_verify = client.post(
        "/api/v1/auth/mfa/verify",
        json={"code": valid_code},
        headers=headers,
    )
    assert mfa_verify.status_code == 200
    assert mfa_verify.json()["status"] == "mfa_activated"
    assert len(mfa_verify.json()["recovery_codes"]) >= 6

    # Check active sessions list
    sessions_res = client.get("/api/v1/auth/sessions", headers=headers)
    assert sessions_res.status_code == 200
    assert isinstance(sessions_res.json(), list)

    # Revoke all sessions
    logout_all = client.post("/api/v1/auth/logout-all", headers=headers)
    assert logout_all.status_code == 200


def test_rbac_members_scoped_keys_and_audit_logs(client):
    # Create scoped API key
    key_res = client.post(
        "/api/v1/auth/keys",
        json={
            "name": "CI/CD Red Team Runner",
            "organization_id": "org-default",
            "scopes": ["firewall:inspect", "threats:read"],
        },
    )
    assert key_res.status_code == 200
    key_data = key_res.json()
    assert key_data["raw_key"].startswith("ag_live_")
    key_id = key_data["id"]

    # List API keys and verify creation
    keys_list = client.get("/api/v1/auth/keys")
    assert keys_list.status_code == 200
    matching_keys = [k for k in keys_list.json() if k["id"] == key_id]
    assert len(matching_keys) == 1
    assert matching_keys[0]["name"] == "CI/CD Red Team Runner"
    assert matching_keys[0]["prefix_display"].startswith("ag_live_")

    # Revoke API key
    del_res = client.delete(f"/api/v1/auth/keys/{key_id}")
    assert del_res.status_code == 200

    # List members & invite a new analyst
    invite_email = f"analyst_{uuid.uuid4().hex[:6]}@agentguard.io"
    invite_res = client.post(
        "/api/v1/auth/members",
        json={"email": invite_email, "role": "analyst"},
    )
    assert invite_res.status_code == 200
    assert invite_res.json()["status"] == "invited"

    # Fetch members list to get membership id
    members_res = client.get("/api/v1/auth/members")
    assert members_res.status_code == 200
    invited_member = next(m for m in members_res.json() if m["email"] == invite_email)
    member_id = invited_member["id"]

    # Update role to viewer
    role_res = client.put(
        f"/api/v1/auth/members/{member_id}/role",
        json={"role": "viewer"},
    )
    assert role_res.status_code == 200
    assert role_res.json()["new_role"] == "viewer"

    # Verify audit logs recorded the actions
    audit_res = client.get("/api/v1/auth/audit-logs")
    assert audit_res.status_code == 200
    logs = audit_res.json()
    assert len(logs) >= 1
    assert any("role" in (log.get("action") or "") or "api_key" in (log.get("action") or "") for log in logs)
