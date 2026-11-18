from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.models import Organization, Project, Application, ApiTarget
from app.schemas.schemas import (
    OrganizationResponse, OrganizationCreate,
    ProjectResponse, ProjectCreate,
    ApplicationResponse, ApplicationCreate,
    ApiTargetResponse, ApiTargetCreate
)

router = APIRouter(prefix="/orgs", tags=["Organizations & Assets"])

@router.get("", response_model=List[OrganizationResponse])
def list_organizations(db: Session = Depends(get_db)):
    return db.query(Organization).all()

@router.post("", response_model=OrganizationResponse)
def create_organization(org_in: OrganizationCreate, db: Session = Depends(get_db)):
    slug = org_in.slug or org_in.name.lower().replace(" ", "-")
    org = Organization(name=org_in.name, slug=slug)
    db.add(org)
    db.commit()
    db.refresh(org)
    return org

@router.get("/projects", response_model=List[ProjectResponse])
def list_projects(organization_id: str = None, db: Session = Depends(get_db)):
    query = db.query(Project)
    if organization_id:
        query = query.filter(Project.organization_id == organization_id)
    return query.all()

@router.post("/projects", response_model=ProjectResponse)
def create_project(proj_in: ProjectCreate, db: Session = Depends(get_db)):
    proj = Project(
        organization_id=proj_in.organization_id,
        name=proj_in.name,
        description=proj_in.description
    )
    db.add(proj)
    db.commit()
    db.refresh(proj)
    return proj

@router.get("/applications", response_model=List[ApplicationResponse])
def list_applications(project_id: str = None, db: Session = Depends(get_db)):
    query = db.query(Application)
    if project_id:
        query = query.filter(Application.project_id == project_id)
    return query.all()

@router.post("/applications", response_model=ApplicationResponse)
def create_application(app_in: ApplicationCreate, db: Session = Depends(get_db)):
    app_obj = Application(
        project_id=app_in.project_id,
        name=app_in.name,
        environment=app_in.environment,
        model_provider=app_in.model_provider
    )
    db.add(app_obj)
    db.commit()
    db.refresh(app_obj)
    return app_obj

@router.get("/targets", response_model=List[ApiTargetResponse])
def list_api_targets(organization_id: str = None, db: Session = Depends(get_db)):
    query = db.query(ApiTarget)
    if organization_id:
        query = query.filter(ApiTarget.organization_id == organization_id)
    return query.all()

@router.post("/targets", response_model=ApiTargetResponse)
def create_api_target(target_in: ApiTargetCreate, db: Session = Depends(get_db)):
    masked = f"Bearer {target_in.auth_token[:4]}...***" if target_in.auth_token else "Bearer sk-***"
    target = ApiTarget(
        organization_id=target_in.organization_id,
        name=target_in.name,
        base_url=target_in.base_url,
        auth_header_name=target_in.auth_header_name,
        auth_token_masked=masked,
        is_authorized=target_in.is_authorized
    )
    db.add(target)
    db.commit()
    db.refresh(target)
    return target
