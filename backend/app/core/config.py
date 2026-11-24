import os
import secrets
from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import List


def _resolve_secret_key() -> str:
    env_key = os.getenv("SECRET_KEY", "").strip()
    if env_key:
        return env_key
    environment = os.getenv("ENVIRONMENT", "development").lower()
    if environment == "production":
        raise RuntimeError("SECRET_KEY environment variable must be set in production")
    return secrets.token_urlsafe(48)


class Settings(BaseSettings):
    model_config = ConfigDict(case_sensitive=True)
    
    PROJECT_NAME: str = "AgentGuard"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = _resolve_secret_key()
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./agentguard.db")
    SYNC_DATABASE_URL: str = os.getenv("SYNC_DATABASE_URL", "sqlite:///./agentguard.db")
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]
    
    # Default admin user credentials for local dev (override via env vars)
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@agentguard.ai")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "")

    # Google OAuth / Identity Services
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")

settings = Settings()
