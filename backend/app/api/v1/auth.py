from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, generate_api_key
from app.models.models import User, Organization, OrganizationMembership, ApiKey
from app.schemas.schemas import UserLogin, UserCreate, UserResponse, Token, ApiKeyCreate, ApiKeyCreatedResponse, ApiKeyResponse
from typing import List

router = APIRouter(prefix="/auth", tags=["Authentication & Keys"])

@router.post("/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
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

    token = create_access_token(subject=user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token(subject=user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_me(db: Session = Depends(get_db)):
    # Fallback to first active user if without auth header for local dev
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="No user registered")
    return user

@router.post("/keys", response_model=ApiKeyCreatedResponse)
def create_api_key(key_in: ApiKeyCreate, db: Session = Depends(get_db)):
    full_key, hashed_key, prefix_display = generate_api_key()
    user = db.query(User).first()
    user_id = user.id if user else None

    api_key_obj = ApiKey(
        organization_id=key_in.organization_id,
        user_id=user_id,
        name=key_in.name,
        key_hash=hashed_key,
        prefix_display=prefix_display
    )
    db.add(api_key_obj)
    db.commit()
    db.refresh(api_key_obj)

    return {
        "id": api_key_obj.id,
        "name": api_key_obj.name,
        "raw_key": full_key,
        "prefix_display": prefix_display,
        "created_at": api_key_obj.created_at
    }

@router.get("/keys", response_model=List[ApiKeyResponse])
def list_api_keys(db: Session = Depends(get_db)):
    keys = db.query(ApiKey).filter(ApiKey.is_revoked == False).order_by(ApiKey.created_at.desc()).all()
    return keys
