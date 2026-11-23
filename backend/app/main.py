from contextlib import asynccontextmanager
from fastapi import FastAPI, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
from app.core.events import pipeline, metrics
from app.seed import seed_database

# Routers
from app.api.v1.auth import router as auth_router
from app.api.v1.organizations import router as orgs_router
from app.api.v1.threats import router as threats_router
from app.api.v1.firewall import router as firewall_router
from app.api.v1.scanner import router as scanner_router
from app.api.v1.redteam import router as redteam_router
from app.api.v1.agent_monitor import router as agent_router
from app.api.v1.incidents import router as incidents_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.compliance import router as compliance_router
from app.api.v1.attack_graph import router as attack_graph_router
from app.api.v1.terminal import router as terminal_router
from app.api.v1.intel import router as intel_router
from app.api.v1.integrations import router as integrations_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables & seed initial data
    Base.metadata.create_all(bind=engine)
    try:
        seed_database()
    except Exception as e:
        print(f"Seed note: {e}")
    # Start high-throughput async event ingestion pipeline
    pipeline.start()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AgentGuard: Production AI-Native Cybersecurity, Threat Detection & Red Team SaaS Platform",
    lifespan=lifespan
)

# Secure Production Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "accelerometer=(), camera=(), microphone=(), geolocation=()"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow local frontend development access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register v1 routes
v1_prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=v1_prefix)
app.include_router(orgs_router, prefix=v1_prefix)
app.include_router(threats_router, prefix=v1_prefix)
app.include_router(firewall_router, prefix=v1_prefix)
app.include_router(scanner_router, prefix=v1_prefix)
app.include_router(redteam_router, prefix=v1_prefix)
app.include_router(agent_router, prefix=v1_prefix)
app.include_router(incidents_router, prefix=v1_prefix)
app.include_router(analytics_router, prefix=v1_prefix)
app.include_router(compliance_router, prefix=v1_prefix)
app.include_router(attack_graph_router, prefix=v1_prefix)
app.include_router(terminal_router, prefix=v1_prefix)
app.include_router(intel_router, prefix=v1_prefix)
app.include_router(integrations_router, prefix=v1_prefix)

@app.get("/metrics")
def get_prometheus_metrics():
    """
    Standard Prometheus exposition format endpoint for scraping cluster latency,
    inspection rates, block/redact rates, and event pipeline queue depth.
    """
    return Response(
        content=metrics.generate_prometheus_output(),
        media_type="text/plain; version=0.0.4; charset=utf-8"
    )

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "services": {
            "ai_firewall": "operational",
            "detection_engines": "operational",
            "anomaly_detector": "operational",
            "event_bus": "operational"
        }
    }
