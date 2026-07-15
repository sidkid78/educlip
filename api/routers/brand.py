from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from uuid import UUID
from sqlalchemy.orm import Session
from api.database import get_db_session, Organization
from api.auth_utils import get_current_tenant

router = APIRouter()

DEFAULT_BRAND_KIT = {
    "primary_color": "#4F46E5",
    "bg_color": "#FFFFFF",
    "font_family": "Inter, sans-serif",
    "creator_handle": "my_academy",
}


class BrandKitModel(BaseModel):
    primary_color: str = Field("#4F46E5", description="Hex primary/brand color")
    bg_color: str = Field("#FFFFFF", description="Hex slide-canvas background color")
    font_family: str = Field("Inter, sans-serif", description="CSS font-family stack")
    creator_handle: str = Field("my_academy", description="Handle shown on slide footers")


def _get_org(db: Session, tenant: dict) -> Organization:
    org = db.query(Organization).filter(Organization.id == UUID(tenant["org_id"])).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


@router.get("", response_model=BrandKitModel)
def get_brand_kit(
    db: Session = Depends(get_db_session),
    tenant: dict = Depends(get_current_tenant),
):
    """Return the tenant's saved brand kit, or sensible defaults if none set."""
    org = db.query(Organization).filter(Organization.id == UUID(tenant["org_id"])).first()
    return {**DEFAULT_BRAND_KIT, **((org.brand_kit if org and org.brand_kit else {}))}


@router.put("", response_model=BrandKitModel)
def update_brand_kit(
    payload: BrandKitModel,
    db: Session = Depends(get_db_session),
    tenant: dict = Depends(get_current_tenant),
):
    """Save the tenant's brand kit. These colors feed carousel generation."""
    org = _get_org(db, tenant)
    org.brand_kit = payload.model_dump()
    db.commit()
    db.refresh(org)
    return org.brand_kit
