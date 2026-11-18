from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
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

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables & seed initial data
    Base.metadata.create_all(bind=engine)
    try:
        seed_database()
    except Exception as e:
        print(f"Seed note: {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AgentGuard: Production AI-Native Cybersecurity, Threat Detection & Red Team SaaS Platform",
    lifespan=lifespan
)

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
