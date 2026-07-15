from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime
from sqlalchemy.orm import Session
from api.database import get_db_session, Asset, Source
from api.auth_utils import get_current_tenant

router = APIRouter()

class AssetUpdatePayload(BaseModel):
    content_data: Optional[Dict[str, Any]] = Field(default=None, description="Updated asset text, slides, or schemas")
    status: Optional[str] = Field(default=None, description="draft, scheduled, published")
    scheduled_at: Optional[datetime] = Field(default=None, description="UTC scheduled date time")

class AssetResponse(BaseModel):
    id: UUID
    source_id: Optional[UUID]
    asset_type: str
    content_data: Dict[str, Any]
    status: str
    scheduled_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("", response_model=List[AssetResponse])
def list_assets(
    asset_type: Optional[str] = Query(None, description="Filter by type: carousel, short_video, newsletter"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status: draft, scheduled, published"),
    db: Session = Depends(get_db_session),
    tenant: dict = Depends(get_current_tenant)
):
    """
    Lists all generated micro-learning assets belonging to the tenant's workspace organization.
    Supports filtering by platform asset types and scheduled statuses.
    """
    org_id = UUID(tenant["org_id"])
    query = db.query(Asset).filter(Asset.organization_id == org_id)

    if asset_type:
        query = query.filter(Asset.asset_type == asset_type)
    if status_filter:
        query = query.filter(Asset.status == status_filter)

    return query.order_by(Asset.created_at.desc()).all()

@router.get("/{asset_id}", response_model=AssetResponse)
def get_asset(
    asset_id: UUID,
    db: Session = Depends(get_db_session),
    tenant: dict = Depends(get_current_tenant)
):
    """
    Retrieves detailed specifications of a single asset.
    """
    org_id = UUID(tenant["org_id"])
    asset = db.query(Asset).filter(Asset.id == asset_id, Asset.organization_id == org_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset

@router.patch("/{asset_id}", response_model=AssetResponse)
def update_asset(
    asset_id: UUID,
    payload: AssetUpdatePayload,
    db: Session = Depends(get_db_session),
    tenant: dict = Depends(get_current_tenant)
):
    """
    Edits a generated asset's caption text, visual structure, or schedules its publishing time.
    """
    org_id = UUID(tenant["org_id"])
    asset = db.query(Asset).filter(Asset.id == asset_id, Asset.organization_id == org_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    if payload.content_data is not None:
        # Atomic merger of payload
        merged_content = dict(asset.content_data)
        merged_content.update(payload.content_data)
        asset.content_data = merged_content
        
    if payload.status is not None:
        asset.status = payload.status
        
    if payload.scheduled_at is not None:
        asset.scheduled_at = payload.scheduled_at

    db.commit()
    db.refresh(asset)
    return asset

@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(
    asset_id: UUID,
    db: Session = Depends(get_db_session),
    tenant: dict = Depends(get_current_tenant)
):
    """
    Deletes an asset from the workspace, purging associated cache entries.
    """
    org_id = UUID(tenant["org_id"])
    asset = db.query(Asset).filter(Asset.id == asset_id, Asset.organization_id == org_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    db.delete(asset)
    db.commit()
    return None
