import pytest
from uuid import uuid4
from api.database import Organization, Source, Asset
from api.celery_app import process_media_ingestion

def test_celery_background_worker_task(db_session):
    """
    Verifies that the asynchronous background ingestion task:
    1. Reads raw source metadata and file type.
    2. Runs Whisper transcription and AI concept extraction.
    3. Synthesizes visual carousels, video scripts, and newsletter lessons.
    4. Automatically commits generated assets back to PostgreSQL in logical isolation.
    """
    # 1. Provision organization tenant
    org = Organization(
        id=uuid4(),
        name="Repurposing Center",
        slug="repurposing-center",
        ai_credits_remaining=10
    )
    db_session.add(org)
    db_session.commit()

    # 2. Add raw video content source record
    source_id = uuid4()
    source = Source(
        id=source_id,
        organization_id=org.id,
        type="video",
        s3_key="raw/repurposing/lecture_seo.mp4",
        vector_namespace=f"ns_{org.id}",
        metadata_json={"original_name": "seo_tutorial_2026.mp4"},
        status="pending"
    )
    db_session.add(source)
    db_session.commit()

    # 3. Call Celery task handler directly (sync mode) to verify execution logic
    success = process_media_ingestion(str(source_id), source.s3_key)
    assert success is True

    # 4. Assert Source state is updated
    db_session.refresh(source)
    assert source.status == "completed"
    assert source.duration > 0.0
    assert source.word_count > 0

    # 5. Assert all three types of micro-learning assets have been generated
    generated_assets = db_session.query(Asset).filter(Asset.source_id == source_id).all()
    assert len(generated_assets) > 0

    # Group types
    asset_types = [a.asset_type for a in generated_assets]
    assert "carousel" in asset_types
    assert "short_video" in asset_types
    assert "newsletter" in asset_types

    # Ensure assets are secured within the tenant workspace
    for asset in generated_assets:
        assert asset.organization_id == org.id
        assert asset.status == "draft"
        assert asset.content_data is not None
