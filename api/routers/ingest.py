from fastapi import APIRouter, Depends, HTTPException, Query, status, Request, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from uuid import uuid4, UUID
from sqlalchemy.orm import Session
from api.database import get_db_session, Source, Organization
from api.auth_utils import get_current_tenant
from api.config import settings
import os
import shutil
import threading


def _resolve_org(db: Session, org_id: str) -> Organization:
    """Fetch the tenant org, creating it on the fly (mock auth) if missing."""
    try:
        org = db.query(Organization).filter(Organization.id == UUID(org_id)).first()
    except Exception:
        org = None
    if org is None:
        org = Organization(
            id=UUID(org_id),
            name="Mock Academy",
            slug=f"academy-{org_id[:8]}",
            ai_credits_remaining=10,
        )
        db.add(org)
        db.commit()
        db.refresh(org)
    return org


def _infer_source_type(content_type: str, ext: str) -> Optional[str]:
    """Map a MIME type / extension to a Source.type value."""
    ext = ext.lower()
    if content_type.startswith("video/") or ext in (".mp4", ".mov", ".webm", ".mkv"):
        return "video"
    if content_type.startswith("audio/") or ext in (".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac"):
        return "audio"
    if content_type == "application/pdf" or ext == ".pdf":
        return "pdf"
    if content_type.startswith("text/") or ext in (".txt", ".md"):
        return "text"
    return None

router = APIRouter()

# Tri-state cache of broker reachability: None = untried, True = up, False = down.
# Avoids paying the broker connection timeout on every upload once we know it's down.
_celery_available: Optional[bool] = None


def _dispatch_processing(source_id: str, file_key: str) -> str:
    """
    Kick off media processing. Prefer the Celery worker; if the broker can't be
    reached (typical in local dev with no Redis), execute the task synchronously
    in-process (background thread) so the ingest → extract → asset-generation loop
    still completes. Returns "queued" (async) or "processing_background".
    """
    global _celery_available
    from api.config import settings
    from api.celery_app import celery_app, process_media_ingestion

    if settings.USE_CELERY and _celery_available is not False:
        try:
            celery_app.send_task("process_media_ingestion", args=[source_id, file_key])
            _celery_available = True
            return "queued"
        except Exception as e:  # broker unreachable / misconfigured
            _celery_available = False
            print(f"Celery broker unavailable ({e}); running ingestion in a background thread.")

    # No broker: run the task body in a background thread so the HTTP request returns
    # immediately (the real Gemini pipeline can take a minute+). The client polls
    # /status; the task updates Source pending → processing → completed.
    def _run():
        try:
            process_media_ingestion.apply(args=[source_id, file_key])
        except Exception as e:
            print(f"Background ingestion failed for {source_id}: {e}")

    threading.Thread(target=_run, daemon=True, name=f"ingest-{source_id[:8]}").start()
    return "processing_background"

class UploadUrlResponse(BaseModel):
    upload_url: str = Field(..., description="S3 Presigned Upload URL")
    file_key: str = Field(..., description="Unique S3 storage key path")
    expires_in: int = Field(3600, description="Expiration in seconds")

class ConfirmPayload(BaseModel):
    file_key: str = Field(..., description="The unique S3 key path uploaded to")
    file_type: str = Field(..., description="File content type: video, audio, pdf, text")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Metadata like file name, size, duration, etc.")

class StatusResponse(BaseModel):
    job_id: str
    status: str # pending, processing, completed, failed
    progress: int
    estimated_time_remaining: int
    error: Optional[str] = None

@router.get("/upload-url", response_model=UploadUrlResponse)
def get_upload_url(
    file_name: str = Query(..., description="Name of the file"),
    content_type: str = Query(..., description="MIME content type of the file"),
    tenant: dict = Depends(get_current_tenant)
):
    """
    Step 1: Secure Upload. Generates a secure S3 Presigned URL for direct upload.
    This prevents the API from being throttled by large multi-gigabyte media streams.
    """
    org_id = tenant["org_id"]
    file_id = uuid4()
    
    # Restrict file types
    allowed_types = ["video/mp4", "audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp3", "application/pdf", "text/plain"]
    if content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_types)}"
        )

    ext = os.path.splitext(file_name)[1]
    file_key = f"raw/{org_id}/{file_id}{ext}"
    
    # Simulating secure AWS S3 client presigned url generation
    bucket_name = "educlip-raw-ingest"
    mock_presigned_url = f"https://{bucket_name}.s3.amazonaws.com/{file_key}?AWSAccessKeyId=MOCK_AWS_ACCESS_KEY_ID&Signature=vjbyPxybdZaNmGa%2ByT272YEAiv4%3D&Expires=1700000000"

    return UploadUrlResponse(
        upload_url=mock_presigned_url,
        file_key=file_key,
        expires_in=3600
    )

@router.post("/confirm", status_code=status.HTTP_202_ACCEPTED)
def confirm_upload(
    payload: ConfirmPayload,
    db: Session = Depends(get_db_session),
    tenant: dict = Depends(get_current_tenant)
):
    """
    Step 2: Upload Confirmation.
    Validates organization AI credits, decrements 1 credit, creates a Source database record,
    and launches asynchronous background processing.
    """
    org_id = tenant["org_id"]
    user_id = tenant["user_id"]
    
    # Find Tenant organization
    try:
        org = db.query(Organization).filter(Organization.id == UUID(org_id)).first()
    except Exception:
        org = None

    # Create the organization on-the-fly if it doesn't exist yet (simulation ease).
    # Note: .first() returns None for a missing row, so this must be an explicit
    # None check, not just an except branch.
    if org is None:
        org = Organization(
            id=UUID(org_id),
            name="Mock Academy",
            slug=f"academy-{org_id[:8]}",
            ai_credits_remaining=10
        )
        db.add(org)
        db.commit()
        db.refresh(org)

    if org.ai_credits_remaining <= 0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Insufficient AI credits. Please upgrade your subscription plan or buy top-up credits."
        )

    # Metering credit logic: Decrement 1 credit
    org.ai_credits_remaining -= 1
    db.commit()

    # Create Source Metadata Record
    source_id = uuid4()
    new_source = Source(
        id=source_id,
        organization_id=UUID(org_id),
        type=payload.file_type,
        s3_key=payload.file_key,
        vector_namespace=f"ns_{org_id}",
        metadata_json=payload.metadata or {},
        status="pending"
    )
    db.add(new_source)
    db.commit()

    # Trigger the processing pipeline: async via Celery when a broker is available,
    # otherwise run it inline so the flow works end-to-end in local dev without Redis.
    mode = _dispatch_processing(str(source_id), payload.file_key)

    return {
        "message": "Upload confirmed. Processing task queued.",
        "source_id": str(source_id),
        "credits_remaining": org.ai_credits_remaining,
        "processing_mode": mode,
    }

@router.post("/upload", status_code=status.HTTP_202_ACCEPTED)
async def upload_file(
    file: UploadFile = File(...),
    project_id: Optional[str] = Form(None),
    db: Session = Depends(get_db_session),
    tenant: dict = Depends(get_current_tenant),
):
    """
    Direct multipart upload (local-dev stand-in for the S3 presigned flow): saves the
    real file to disk, records its path on the Source, meters a credit, and kicks off
    processing — so audio/video get real Gemini transcription and PDFs real extraction.
    """
    org_id = tenant["org_id"]
    org = _resolve_org(db, org_id)
    if org.ai_credits_remaining <= 0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Insufficient AI credits. Please upgrade your plan or buy top-up credits.",
        )

    content_type = file.content_type or ""
    ext = os.path.splitext(file.filename or "")[1]
    source_type = _infer_source_type(content_type, ext)
    if not source_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {content_type or ext or 'unknown'}",
        )

    # Persist the uploaded bytes under uploads/{org}/{source_id}{ext}.
    source_id = uuid4()
    org_dir = os.path.join(settings.UPLOAD_DIR, str(org.id))
    os.makedirs(org_dir, exist_ok=True)
    dest = os.path.join(org_dir, f"{source_id}{ext}")
    with open(dest, "wb") as out:
        shutil.copyfileobj(file.file, out)

    # Meter the credit and record the Source with the local path for the pipeline.
    org.ai_credits_remaining -= 1
    db.commit()

    new_source = Source(
        id=source_id,
        organization_id=org.id,
        project_id=UUID(project_id) if project_id else None,
        type=source_type,
        s3_key=f"local://{dest}",
        vector_namespace=f"ns_{org.id}",
        metadata_json={
            "original_name": file.filename,
            "local_path": dest,
            "content_type": content_type,
        },
        status="pending",
    )
    db.add(new_source)
    db.commit()

    mode = _dispatch_processing(str(source_id), f"local://{dest}")

    return {
        "message": "Upload received. Processing started.",
        "source_id": str(source_id),
        "source_type": source_type,
        "credits_remaining": org.ai_credits_remaining,
        "processing_mode": mode,
    }


@router.get("/status/{job_id}", response_model=StatusResponse)
def get_job_status(
    job_id: str,
    db: Session = Depends(get_db_session),
    tenant: dict = Depends(get_current_tenant)
):
    """
    Step 3: Job status polling.
    Retrieves execution state and progression metrics.
    """
    try:
        source = db.query(Source).filter(
            Source.id == UUID(job_id),
            Source.organization_id == UUID(tenant["org_id"])
        ).first()
    except Exception:
        raise HTTPException(status_code=404, detail="Ingestion job not found")

    if not source:
        raise HTTPException(status_code=404, detail="Ingestion job not found")

    progress_map = {
        "pending": 10,
        "processing": 50,
        "completed": 100,
        "failed": 0
    }

    return StatusResponse(
        job_id=str(source.id),
        status=source.status,
        progress=progress_map.get(source.status, 0),
        estimated_time_remaining=60 if source.status in ["pending", "processing"] else 0,
        error=source.error_log
    )
