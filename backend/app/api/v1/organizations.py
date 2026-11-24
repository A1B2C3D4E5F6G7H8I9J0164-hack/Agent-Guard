from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.deps import AuthContext, get_current_user, require_permission
from app.models.models import Organization, OrganizationMembership, Project, Application, ApiTarget
from app.schemas.schemas import (
    OrganizationResponse, OrganizationCreate,
    ProjectResponse, ProjectCreate,
    ApplicationResponse, ApplicationCreate,
    ApiTargetResponse, ApiTargetCreate
)

router = APIRouter(prefix="/orgs", tags=["Organizations & Assets"])

@router.get("", response_model=List[OrganizationResponse])
def list_organizations(
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Organization).filter(Organization.id == auth.organization_id).all()

@router.post("", response_model=OrganizationResponse)
def create_organization(
    org_in: OrganizationCreate,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    slug = org_in.slug or org_in.name.lower().replace(" ", "-")
    org = Organization(name=org_in.name, slug=slug)
    db.add(org)
    db.commit()
    db.refresh(org)
    if auth.user_id:
        db.add(OrganizationMembership(user_id=auth.user_id, organization_id=org.id, role="owner"))
        db.commit()
    return org

@router.get("/projects", response_model=List[ProjectResponse])
def list_projects(
    organization_id: Optional[str] = None,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if organization_id and organization_id != auth.organization_id:
        raise HTTPException(status_code=403, detail="Access denied to requested organization")
    return db.query(Project).filter(Project.organization_id == auth.organization_id).all()

@router.post("/projects", response_model=ProjectResponse)
def create_project(
    proj_in: ProjectCreate,
    auth: AuthContext = Depends(require_permission("settings:write")),
    db: Session = Depends(get_db),
):
    if proj_in.organization_id and proj_in.organization_id not in ("org-default", auth.organization_id):
        raise HTTPException(status_code=403, detail="Cannot create project in another organization")
    proj = Project(
        organization_id=auth.organization_id,
        name=proj_in.name,
        description=proj_in.description
    )
    db.add(proj)
    db.commit()
    db.refresh(proj)
    return proj

@router.get("/applications", response_model=List[ApplicationResponse])
def list_applications(
    project_id: Optional[str] = None,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Application)
        .join(Project, Application.project_id == Project.id)
        .filter(Project.organization_id == auth.organization_id)
    )
    if project_id:
        query = query.filter(Application.project_id == project_id)
    return query.all()

@router.post("/applications", response_model=ApplicationResponse)
def create_application(
    app_in: ApplicationCreate,
    auth: AuthContext = Depends(require_permission("settings:write")),
    db: Session = Depends(get_db),
):
    proj = (
        db.query(Project)
        .filter(
            Project.id == app_in.project_id,
            Project.organization_id == auth.organization_id,
        )
        .first()
    )
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found in organization")
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
def list_api_targets(
    organization_id: Optional[str] = None,
    auth: AuthContext = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if organization_id and organization_id != auth.organization_id:
        raise HTTPException(status_code=403, detail="Access denied to requested organization")
    return db.query(ApiTarget).filter(ApiTarget.organization_id == auth.organization_id).all()

@router.post("/targets", response_model=ApiTargetResponse)
def create_api_target(
    target_in: ApiTargetCreate,
    auth: AuthContext = Depends(require_permission("settings:write")),
    db: Session = Depends(get_db),
):
    if target_in.organization_id and target_in.organization_id not in ("org-default", auth.organization_id):
        raise HTTPException(status_code=403, detail="Cannot create target in another organization")
    masked = f"Bearer {target_in.auth_token[:4]}...***" if target_in.auth_token else "Bearer sk-***"
    target = ApiTarget(
        organization_id=auth.organization_id,
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
