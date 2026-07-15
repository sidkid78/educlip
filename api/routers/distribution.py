from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID, uuid4
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from api.database import get_db_session, Asset, Publication
from api.auth_utils import get_current_tenant
from api.publishers import PLATFORMS, get_publisher, PublishError

router = APIRouter()

# Broker reachability cache (see ingest._dispatch_processing for the same pattern).
_celery_available: Optional[bool] = None


def _to_naive_utc(dt: datetime) -> datetime:
    """Normalize any datetime to naive UTC (how the DB stores publish_at)."""
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def _dispatch_publish(publication_id: str, publish_at: datetime) -> str:
    """
    Schedule/run a publish. Prefer Celery (delayed via eta); with no broker, run
    inline if it's already due, otherwise leave it 'scheduled' for /run-due to fire.
    Returns the dispatch mode for the API response.
    """
    global _celery_available
    from api.config import settings
    from api.celery_app import celery_app, publish_publication

    now = datetime.utcnow()
    if settings.USE_CELERY and _celery_available is not False:
        try:
            eta = publish_at if publish_at > now else None
            celery_app.send_task("publish_publication", args=[publication_id], eta=eta)
            _celery_available = True
            return "queued" if eta else "publishing"
        except Exception as e:
            _celery_available = False
            print(f"Celery broker unavailable ({e}); using inline publish path.")

    # No broker: publish now if due, else defer to the /run-due scheduler tick.
    if publish_at <= now:
        try:
            publish_publication.apply(args=[publication_id])
        except Exception as e:
            print(f"Synchronous publish failed for {publication_id}: {e}")
        return "published_sync"
    return "scheduled"


# ---------- schemas ----------

class SchedulePayload(BaseModel):
    asset_id: UUID
    platform: str = Field(..., description="linkedin, instagram, tiktok, twitter, beehiiv")
    publish_at: Optional[datetime] = Field(None, description="UTC time to publish; omit to publish now")


class ReschedulePayload(BaseModel):
    publish_at: datetime = Field(..., description="New UTC publish time")


class PublicationResponse(BaseModel):
    id: UUID
    asset_id: UUID
    platform: str
    status: str
    publish_at: datetime
    external_post_id: Optional[str]
    error_log: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- endpoints ----------

@router.get("/platforms")
def list_platforms():
    """Supported distribution platforms and the asset types each accepts."""
    return {
        key: {"name": meta["name"], "asset_types": meta["asset_types"], "caption_limit": meta["caption_limit"]}
        for key, meta in PLATFORMS.items()
    }


@router.post("/schedule", response_model=PublicationResponse, status_code=status.HTTP_201_CREATED)
def schedule_publication(
    payload: SchedulePayload,
    db: Session = Depends(get_db_session),
    tenant: dict = Depends(get_current_tenant),
):
    """
    Schedule an asset for delivery to one platform (omit publish_at to publish now).
    Validates the asset↔platform combo up front so bad pairings fail fast.
    """
    org_id = UUID(tenant["org_id"])
    asset = db.query(Asset).filter(Asset.id == payload.asset_id, Asset.organization_id == org_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    # Fail fast on unsupported platform / incompatible asset type / caption limits.
    try:
        publisher = get_publisher(payload.platform)
        publisher.validate_asset(asset.asset_type, asset.content_data)
    except PublishError as e:
        raise HTTPException(status_code=400, detail=str(e))

    publish_at = _to_naive_utc(payload.publish_at) if payload.publish_at else datetime.utcnow()

    pub = Publication(
        id=uuid4(),
        organization_id=org_id,
        asset_id=asset.id,
        platform=payload.platform,
        status="scheduled",
        publish_at=publish_at,
        request_id=str(uuid4()),  # idempotency key
    )
    db.add(pub)
    # Keep the asset lifecycle in step with the design's state machine.
    asset.status = "scheduled"
    asset.scheduled_at = publish_at
    db.commit()
    db.refresh(pub)

    _dispatch_publish(str(pub.id), publish_at)
    db.refresh(pub)
    return pub


@router.get("", response_model=List[PublicationResponse])
def list_publications(
    status_filter: Optional[str] = Query(None, alias="status"),
    platform: Optional[str] = Query(None),
    db: Session = Depends(get_db_session),
    tenant: dict = Depends(get_current_tenant),
):
    """List the org's publications (drives the calendar/distribution view)."""
    org_id = UUID(tenant["org_id"])
    query = db.query(Publication).filter(Publication.organization_id == org_id)
    if status_filter:
        query = query.filter(Publication.status == status_filter)
    if platform:
        query = query.filter(Publication.platform == platform)
    return query.order_by(Publication.publish_at.asc()).all()


@router.patch("/{publication_id}", response_model=PublicationResponse)
def reschedule_publication(
    publication_id: UUID,
    payload: ReschedulePayload,
    db: Session = Depends(get_db_session),
    tenant: dict = Depends(get_current_tenant),
):
    """Move a publication to a new time. Rejected once it's publishing/published."""
    org_id = UUID(tenant["org_id"])
    pub = db.query(Publication).filter(Publication.id == publication_id, Publication.organization_id == org_id).first()
    if not pub:
        raise HTTPException(status_code=404, detail="Publication not found")
    if pub.status in ("publishing", "published"):
        raise HTTPException(status_code=409, detail=f"Cannot reschedule a '{pub.status}' publication")

    pub.publish_at = _to_naive_utc(payload.publish_at)
    pub.status = "scheduled"
    db.commit()
    db.refresh(pub)
    _dispatch_publish(str(pub.id), pub.publish_at)
    db.refresh(pub)
    return pub


@router.post("/{publication_id}/cancel", response_model=PublicationResponse)
def cancel_publication(
    publication_id: UUID,
    db: Session = Depends(get_db_session),
    tenant: dict = Depends(get_current_tenant),
):
    """Cancel a scheduled publication. Rejected once it's publishing/published."""
    org_id = UUID(tenant["org_id"])
    pub = db.query(Publication).filter(Publication.id == publication_id, Publication.organization_id == org_id).first()
    if not pub:
        raise HTTPException(status_code=404, detail="Publication not found")
    if pub.status in ("publishing", "published"):
        raise HTTPException(status_code=409, detail=f"Cannot cancel a '{pub.status}' publication")

    pub.status = "cancelled"
    db.commit()
    db.refresh(pub)
    return pub


@router.post("/{publication_id}/publish", response_model=PublicationResponse)
def publish_now(
    publication_id: UUID,
    db: Session = Depends(get_db_session),
    tenant: dict = Depends(get_current_tenant),
):
    """Manually publish a publication immediately, bypassing its scheduled time."""
    org_id = UUID(tenant["org_id"])
    pub = db.query(Publication).filter(Publication.id == publication_id, Publication.organization_id == org_id).first()
    if not pub:
        raise HTTPException(status_code=404, detail="Publication not found")
    if pub.status == "published":
        return pub

    _dispatch_publish(str(pub.id), datetime.utcnow())
    db.refresh(pub)
    return pub


@router.post("/run-due")
def run_due_publications(
    db: Session = Depends(get_db_session),
    tenant: dict = Depends(get_current_tenant),
):
    """
    Scheduler tick: publish every scheduled publication whose time has arrived.
    Stands in for Celery beat / a cron when running locally without a broker.
    """
    org_id = UUID(tenant["org_id"])
    now = datetime.utcnow()
    due = db.query(Publication).filter(
        Publication.organization_id == org_id,
        Publication.status == "scheduled",
        Publication.publish_at <= now,
    ).all()

    fired = 0
    for pub in due:
        _dispatch_publish(str(pub.id), now)
        fired += 1
    return {"due": len(due), "fired": fired}
