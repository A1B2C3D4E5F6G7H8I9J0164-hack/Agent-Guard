# AgentGuard — Remaining Issues & Limitations

**Generated:** 2026-11-24

---

## Production Readiness Gaps

### HIGH Priority

| Issue | Category | Description | Recommended Fix |
|-------|----------|-------------|-----------------|
| No API route authentication | Security | All routes accessible without JWT token — `/auth/me` returns first user as fallback | Add `Depends(get_current_user)` middleware to protected routes |
| Default JWT secret in source | Security | `agentguard_super_secret_jwt_hmac_key_2026_change_in_production` hardcoded as default | Require `SECRET_KEY` env var in production, fail if not set |
| No tenant isolation on API routes | Security | Endpoints return all data regardless of user's organization | Filter all queries by authenticated user's `organization_id` |
| WebSocket endpoints unauthenticated | Security | `/threats/stream` and `/terminal/ws` accept connections without auth | Validate JWT token in WebSocket handshake |

### MEDIUM Priority

| Issue | Category | Description | Recommended Fix |
|-------|----------|-------------|-----------------|
| Wildcard CORS | Security | `allow_origins=["*"]` — appropriate for dev only | Use `settings.BACKEND_CORS_ORIGINS` list in production |
| SQLite in production | Performance | SQLite doesn't support concurrent writes well | Migrate to PostgreSQL for production deployment |
| In-memory firewall counters | Reliability | `GLOBAL_FIREWALL_STATE` dict resets on restart | Persist to database or Redis |
| In-memory EventBus | Reliability | WebSocket subscribers and history lost on restart | Add Redis Streams or PostgreSQL LISTEN/NOTIFY backend |
| No global rate limiting | Security | Rate limiter only applies during firewall inspection | Add FastAPI middleware rate limiter |
| No request logging middleware | Observability | No structured access logs | Add logging middleware with request ID tracking |

### LOW Priority

| Issue | Category | Description | Recommended Fix |
|-------|----------|-------------|-----------------|
| Activity timeline is static | Data Quality | Returns hardcoded 24h intervals, not computed from DB | Query SecurityEvent table grouped by hour |
| Threat category counts are formulaic | Data Quality | Uses `max(N, int(total * pct))` blending | Compute actual counts with `GROUP BY event_type` |
| ApiSecurityEngine not thread-safe | Concurrency | `_request_counts` dict mutated without locks | Use `threading.Lock()` or `asyncio.Lock()` |
| No database migrations | DevOps | Schema changes require manual DB recreation | Add Alembic migration framework |
| No Docker Compose for full stack | DevOps | No single-command startup for all services | Create `docker-compose.yml` |
| Admin password in config.py | Security | `AgentGuardAdmin2026!` visible in source | Load from env var or secrets manager |
| No email validation strength | Validation | Email regex in schema doesn't use `EmailStr` | Use Pydantic `EmailStr` type |

---

## NOT IMPLEMENTED Features

| Feature | Priority | Description |
|---------|----------|-------------|
| Multi-user concurrent sessions | High | Currently single-user dev mode |
| Password reset / email verification | Medium | No forgot password flow |
| Organization invitation system | Medium | Can't invite team members |
| Webhook / notification integrations | Medium | Settings UI shows integrations but backend doesn't implement Slack/email/PagerDuty |
| PDF report export | Low | CLI `report export --format pdf` command is not implemented |
| Dashboard real-time auto-refresh | Low | Frontend doesn't auto-poll or use WebSocket for dashboard data |
| Dark/light theme toggle | Low | Settings view exists but theme toggle not wired |
| Mobile responsive optimization | Low | Base responsive layout via Tailwind but not fully optimized |

---

## Testing Gaps

| Area | Status | Recommendation |
|------|--------|----------------|
| Frontend unit tests | **NOT IMPLEMENTED** | Add Jest/Vitest tests for components |
| Frontend E2E tests | **NOT IMPLEMENTED** | Add Playwright tests for navigation flows |
| API load testing | **NOT RUN** | Run with Locust or k6 against local server |
| pip-audit / Bandit | **NOT RUN** | Requires network access — run manually |
| OWASP ZAP scan | **NOT RUN** | Requires network access — run manually |

---

## Summary

AgentGuard is a **fully functional development-stage platform** with:
- ✅ 8 real, working security detection engines
- ✅ Real-time firewall enforcement with 3 modes
- ✅ 30 tested API endpoints, all passing
- ✅ 13 automated tests, all passing
- ✅ Interactive CLI with 12 working commands
- ✅ WebSocket live threat streaming
- ✅ ML-powered anomaly detection (Isolation Forest)
- ✅ Automated red team benchmarking (10 tests, 100% defense rate)
- ✅ Compliance reporting (OWASP LLM, OWASP API, NIST AI RMF)

The main gaps for production readiness are **authentication middleware on routes**, **tenant isolation**, and **infrastructure upgrades** (PostgreSQL, Redis, proper secrets management).
