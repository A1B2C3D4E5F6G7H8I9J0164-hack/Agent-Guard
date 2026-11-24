import time
import hmac
import hashlib
import struct
import base64
import uuid
import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from app.main import app
from app.core.config import _resolve_secret_key
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


def _register_user(client, prefix: str = "user"):
    email = f"{prefix}_{uuid.uuid4().hex[:8]}@agentguard.io"
    res = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "StrongPassword!123",
            "full_name": f"{prefix.title()} User",
        },
    )
    assert res.status_code == 200
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    me = client.get("/api/v1/auth/me", headers=headers).json()
    return email, token, headers, me["org_id"]


def test_register_login_mfa_and_sessions(client):
    unique_email, token, headers, _ = _register_user(client, "intern")

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
    _, _, headers, org_id = _register_user(client, "owner")

    # Create scoped API key
    key_res = client.post(
        "/api/v1/auth/keys",
        json={
            "name": "CI/CD Red Team Runner",
            "organization_id": org_id,
            "scopes": ["firewall:inspect", "threats:read"],
        },
        headers=headers,
    )
    assert key_res.status_code == 200
    key_data = key_res.json()
    assert key_data["raw_key"].startswith("ag_live_")
    key_id = key_data["id"]

    # Verify API key can authenticate to allowed endpoint and is denied on admin endpoint
    api_key_headers = {"X-API-Key": key_data["raw_key"]}
    fw_res = client.get("/api/v1/firewall/status", headers=api_key_headers)
    assert fw_res.status_code == 200
    denied_res = client.post("/api/v1/firewall/mode?mode=monitor", headers=api_key_headers)
    assert denied_res.status_code == 403

    # List API keys and verify creation
    keys_list = client.get("/api/v1/auth/keys", headers=headers)
    assert keys_list.status_code == 200
    matching_keys = [k for k in keys_list.json() if k["id"] == key_id]
    assert len(matching_keys) == 1
    assert matching_keys[0]["name"] == "CI/CD Red Team Runner"
    assert matching_keys[0]["prefix_display"].startswith("ag_live_")

    # Revoke API key
    del_res = client.delete(f"/api/v1/auth/keys/{key_id}", headers=headers)
    assert del_res.status_code == 200

    # Revoked API key must no longer authenticate
    revoked_res = client.get("/api/v1/firewall/status", headers=api_key_headers)
    assert revoked_res.status_code == 401

    # List members & invite a new analyst
    invite_email = f"analyst_{uuid.uuid4().hex[:6]}@agentguard.io"
    invite_res = client.post(
        "/api/v1/auth/members",
        json={"email": invite_email, "role": "analyst"},
        headers=headers,
    )
    assert invite_res.status_code == 200
    assert invite_res.json()["status"] == "invited"

    # Fetch members list to get membership id
    members_res = client.get("/api/v1/auth/members", headers=headers)
    assert members_res.status_code == 200
    invited_member = next(m for m in members_res.json() if m["email"] == invite_email)
    member_id = invited_member["id"]

    # Update role to viewer
    role_res = client.put(
        f"/api/v1/auth/members/{member_id}/role",
        json={"role": "viewer"},
        headers=headers,
    )
    assert role_res.status_code == 200
    assert role_res.json()["new_role"] == "viewer"

    # Verify audit logs recorded the actions
    audit_res = client.get("/api/v1/auth/audit-logs", headers=headers)
    assert audit_res.status_code == 200
    logs = audit_res.json()
    assert len(logs) >= 1
    assert any("role" in (log.get("action") or "") or "api_key" in (log.get("action") or "") for log in logs)


def test_unauthenticated_routes_rejected(client):
    protected_gets = [
        "/api/v1/auth/me",
        "/api/v1/auth/members",
        "/api/v1/auth/keys",
        "/api/v1/auth/audit-logs",
        "/api/v1/orgs",
        "/api/v1/orgs/projects",
        "/api/v1/threats",
        "/api/v1/firewall/status",
        "/api/v1/firewall/policies",
        "/api/v1/scanner/scans",
        "/api/v1/redteam/suites",
        "/api/v1/agents/sessions",
        "/api/v1/incidents",
        "/api/v1/analytics/overview",
        "/api/v1/compliance/report",
        "/api/v1/attack-graph",
        "/api/v1/intel/feed",
        "/api/v1/integrations",
    ]
    for path in protected_gets:
        res = client.get(path)
        assert res.status_code == 401, f"Expected 401 for unauthenticated GET {path}, got {res.status_code}"


def test_tenant_isolation_between_organizations(client):
    _, _, headers_a, org_a = _register_user(client, "tenant_a")
    _, _, headers_b, org_b = _register_user(client, "tenant_b")
    assert org_a != org_b

    # Tenant A creates an API key and a simulated threat
    key_a = client.post(
        "/api/v1/auth/keys",
        json={"name": "OrgA Secret Key", "organization_id": org_a, "scopes": ["threats:read"]},
        headers=headers_a,
    )
    assert key_a.status_code == 200
    key_a_id = key_a.json()["id"]

    sim_a = client.post("/api/v1/threats/simulate", headers=headers_a)
    assert sim_a.status_code == 200
    event_a_id = sim_a.json()["event_id"]

    # Tenant B cannot see Tenant A's API keys or revoke them
    keys_b = client.get("/api/v1/auth/keys", headers=headers_b).json()
    assert all(k["id"] != key_a_id for k in keys_b)
    revoke_b = client.delete(f"/api/v1/auth/keys/{key_a_id}", headers=headers_b)
    assert revoke_b.status_code == 404

    # Tenant B cannot see Tenant A's threat events
    threats_b = client.get("/api/v1/threats", headers=headers_b).json()
    assert all(t["id"] != event_a_id for t in threats_b)

    # Tenant B cannot create a project in Tenant A's org
    proj_b = client.post(
        "/api/v1/orgs/projects",
        json={"organization_id": org_a, "name": "Cross-Tenant Project", "description": "Should fail"},
        headers=headers_b,
    )
    assert proj_b.status_code == 403


def test_websocket_authentication(client):
    # Unauthenticated WebSocket connections must be rejected
    for ws_path in ["/api/v1/threats/stream", "/api/v1/terminal/ws"]:
        with pytest.raises(WebSocketDisconnect) as exc_info:
            with client.websocket_connect(ws_path):
                pass
        assert exc_info.value.code == 1008

    # Authenticated WebSocket connection succeeds
    _, token, _, _ = _register_user(client, "ws_user")
    with client.websocket_connect(f"/api/v1/terminal/ws?token={token}") as ws:
        banner = ws.receive_text()
        assert "AgentGuard Interactive Security Terminal" in banner


def test_production_requires_secret_key(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.delenv("SECRET_KEY", raising=False)
    with pytest.raises(RuntimeError, match="SECRET_KEY"):
        _resolve_secret_key()


def test_google_oauth_login_syncs_profile(client, monkeypatch):
    google_email = f"google_{uuid.uuid4().hex[:8]}@gmail.com"

    class MockResp:
        status_code = 200

        def json(self):
            return {
                "email": google_email,
                "email_verified": "true",
                "name": "Google Test User",
                "picture": "https://lh3.googleusercontent.com/a/test-avatar",
            }

    async def mock_get(self, url, **kwargs):
        return MockResp()

    monkeypatch.setattr("httpx.AsyncClient.get", mock_get)

    res = client.post("/api/v1/auth/google", json={"credential": "mock-google-id-token"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == google_email
    assert data["user"]["full_name"] == "Google Test User"
    assert data["user"]["avatar_url"] == "https://lh3.googleusercontent.com/a/test-avatar"
    assert data["user"]["auth_provider"] == "google"

    # Verify /auth/me returns the synced Google details
    me_res = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {data['access_token']}"},
    )
    assert me_res.status_code == 200
    me = me_res.json()
    assert me["full_name"] == "Google Test User"
    assert me["avatar_url"] == "https://lh3.googleusercontent.com/a/test-avatar"
    assert me["auth_provider"] == "google"
