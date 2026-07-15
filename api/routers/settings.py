from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session
from api.database import get_db_session, Organization, Project, Source, Asset, Publication
from api.auth_utils import get_current_tenant
from api.publishers import PLATFORMS

router = APIRouter()


class SettingsUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=120)


def _get_org(db: Session, tenant: dict) -> Organization:
    org = db.query(Organization).filter(Organization.id == UUID(tenant["org_id"])).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


def _serialize(db: Session, org: Organization) -> dict:
    org_id = org.id
    connected = {
        row[0]
        for row in db.query(Publication.platform).filter(Publication.organization_id == org_id).distinct()
    }
    return {
        "organization": {
            "name": org.name,
            "slug": org.slug,
            "plan_tier": org.plan_tier,
            "subscription_status": org.subscription_status,
            "ai_credits_remaining": org.ai_credits_remaining,
            "brand_configured": bool(org.brand_kit),
        },
        "usage": {
            "projects": db.query(Project).filter(Project.organization_id == org_id).count(),
            "sources": db.query(Source).filter(Source.organization_id == org_id).count(),
            "assets": db.query(Asset).filter(Asset.organization_id == org_id).count(),
            "published": db.query(Publication)
            .filter(Publication.organization_id == org_id, Publication.status == "published")
            .count(),
        },
        "platforms": [
            {"key": key, "name": meta["name"], "connected": key in connected}
            for key, meta in PLATFORMS.items()
        ],
    }


@router.get("")
def get_settings(db: Session = Depends(get_db_session), tenant: dict = Depends(get_current_tenant)):
    """Account overview: plan, credits, usage counts, and connected platforms."""
    return _serialize(db, _get_org(db, tenant))


@router.put("")
def update_settings(
    payload: SettingsUpdate,
    db: Session = Depends(get_db_session),
    tenant: dict = Depends(get_current_tenant),
):
    """Update editable account settings (currently the workspace name)."""
    org = _get_org(db, tenant)
    if payload.name is not None:
        org.name = payload.name
    db.commit()
    db.refresh(org)
    return _serialize(db, org)
