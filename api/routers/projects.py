from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime
from sqlalchemy.orm import Session
from api.database import get_db_session, Project, Source, Asset
from api.auth_utils import get_current_tenant

router = APIRouter()


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    description: Optional[str] = Field(None, max_length=500)


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=120)
    description: Optional[str] = Field(None, max_length=500)


def _counts(db: Session, project_id: UUID) -> Dict[str, int]:
    source_count = db.query(Source).filter(Source.project_id == project_id).count()
    asset_count = (
        db.query(Asset)
        .join(Source, Asset.source_id == Source.id)
        .filter(Source.project_id == project_id)
        .count()
    )
    return {"source_count": source_count, "asset_count": asset_count}


def _serialize(db: Session, p: Project) -> Dict[str, Any]:
    return {
        "id": str(p.id),
        "name": p.name,
        "description": p.description,
        "created_at": p.created_at.isoformat() if p.created_at else None,
        **_counts(db, p.id),
    }


def _get_project(db: Session, org_id: str, project_id: UUID) -> Project:
    p = db.query(Project).filter(Project.id == project_id, Project.organization_id == UUID(org_id)).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return p


@router.get("")
def list_projects(db: Session = Depends(get_db_session), tenant: dict = Depends(get_current_tenant)):
    """List the org's projects with source/asset counts."""
    org_id = UUID(tenant["org_id"])
    projects = db.query(Project).filter(Project.organization_id == org_id).order_by(Project.created_at.desc()).all()
    return [_serialize(db, p) for p in projects]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db_session),
    tenant: dict = Depends(get_current_tenant),
):
    """Create a new project (content series) for the org."""
    project = Project(
        id=uuid4(),
        organization_id=UUID(tenant["org_id"]),
        name=payload.name,
        description=payload.description,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return _serialize(db, project)


@router.get("/{project_id}")
def get_project(
    project_id: UUID,
    db: Session = Depends(get_db_session),
    tenant: dict = Depends(get_current_tenant),
):
    p = _get_project(db, tenant["org_id"], project_id)
    return _serialize(db, p)


@router.patch("/{project_id}")
def update_project(
    project_id: UUID,
    payload: ProjectUpdate,
    db: Session = Depends(get_db_session),
    tenant: dict = Depends(get_current_tenant),
):
    p = _get_project(db, tenant["org_id"], project_id)
    if payload.name is not None:
        p.name = payload.name
    if payload.description is not None:
        p.description = payload.description
    db.commit()
    db.refresh(p)
    return _serialize(db, p)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: UUID,
    db: Session = Depends(get_db_session),
    tenant: dict = Depends(get_current_tenant),
):
    """Delete a project. Its sources are unlinked (project_id set null), not deleted."""
    p = _get_project(db, tenant["org_id"], project_id)
    db.delete(p)
    db.commit()
    return None


@router.get("/{project_id}/assets")
def list_project_assets(
    project_id: UUID,
    db: Session = Depends(get_db_session),
    tenant: dict = Depends(get_current_tenant),
):
    """Assets generated from sources belonging to this project."""
    _get_project(db, tenant["org_id"], project_id)  # authorization / existence check
    assets = (
        db.query(Asset)
        .join(Source, Asset.source_id == Source.id)
        .filter(Source.project_id == project_id)
        .order_by(Asset.created_at.desc())
        .all()
    )
    return [
        {
            "id": str(a.id),
            "source_id": str(a.source_id) if a.source_id else None,
            "asset_type": a.asset_type,
            "status": a.status,
            "content_data": a.content_data,
            "scheduled_at": a.scheduled_at.isoformat() if a.scheduled_at else None,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in assets
    ]
