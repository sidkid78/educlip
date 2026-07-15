import os
import traceback
from uuid import UUID, uuid4
from celery import Celery
from api.config import settings
from api.database import SessionLocal, Source, Asset, Organization, Publication
from api.ai_engine import EduClipAIEngine
from api.publishers import get_publisher, PublishError

# Initialize Celery app
celery_app = Celery(
    "educlip_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

# Optional configuration overrides
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=600, # 10-minute timeout limit for processing
    # Fail fast instead of hanging when the broker is unreachable (defense in depth;
    # dev also gates dispatch behind settings.USE_CELERY so it's never reached).
    broker_connection_retry_on_startup=False,
    broker_connection_max_retries=0,
    task_publish_retry=False,
    broker_transport_options={"socket_connect_timeout": 2, "socket_timeout": 2},
)

def _extract_document_text(file_path: str, source_type: str) -> str:
    """Extract text from an uploaded document (PyMuPDF for PDF, plain read for text)."""
    if source_type == "pdf":
        import fitz  # PyMuPDF
        parts = []
        with fitz.open(file_path) as doc:
            for page in doc:
                parts.append(page.get_text())
        return "\n".join(parts).strip()
    # text / plain
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read().strip()


@celery_app.task(name="process_media_ingestion", bind=True, max_retries=3)
def process_media_ingestion(self, source_id: str, s3_key: str):
    """
    Asynchronous Celery background task:
    1. Simulates/implements multi-modal data ingestion (FFmpeg audio extraction & Whisper transcription).
    2. Runs the AI concept extraction pipeline on the transcribed text.
    3. Synthesizes visual carousels, video scripts, and markdown newsletters from extracted concepts.
    4. Saves the results into PostgreSQL and updates source execution status.
    """
    print(f"Starting background media processing for source_id: {source_id}, key: {s3_key}")
    db = SessionLocal()
    
    try:
        # 1. Fetch Source metadata from database
        source = db.query(Source).filter(Source.id == UUID(source_id)).first()
        if not source:
            print(f"Error: Source record not found for id {source_id}")
            return False

        # Update status to processing
        source.status = "processing"
        db.commit()

        # 2. Extract and Transcribe Multi-Modal Content (Simulating Whisper/FFmpeg or PDF parsing)
        # We simulate transcription text or extract real info depending on type
        raw_text = ""
        duration = 0.0
        word_count = 0
        
        meta = source.metadata_json or {}
        file_name = meta.get("original_name", "lecture.mp4")

        # Real transcription path: if an actual audio/video file is available locally
        # and a real Gemini key is configured, transcribe it with Gemini (multimodal
        # audio understanding). Falls through to a simulated transcript otherwise
        # (the S3 upload is still mocked, so most dev runs use the simulation).
        ai_engine = EduClipAIEngine()
        local_audio = meta.get("local_path")
        if source.type in ["video", "audio"] and local_audio and os.path.exists(local_audio):
            try:
                print(f"Transcribing real audio via Gemini: {local_audio}")
                transcribed = ai_engine.transcribe_media(local_audio, meta.get("content_type"))
                if transcribed:
                    raw_text = transcribed
                    word_count = len(raw_text.split())
            except Exception as e:
                print(f"Gemini transcription failed ({e}); using simulated transcript.")

        if source.type in ["video", "audio"] and not raw_text:
            # Simulated transcript (no real media file in the mocked-S3 flow)
            print(f"Extracting audio track using FFmpeg from S3 key: {s3_key}")
            print(f"Transcribing audio track with word-level timestamps...")

            # Formulate a context-relevant educational transcript depending on the topic of file name
            if "seo" in file_name.lower():
                raw_text = (
                    "Welcome back class. Today we are talking about Search Engine Optimization or SEO. "
                    "The single biggest mistake online educators make is they guess what people want to learn. "
                    "You should never guess. Use data to drive your curriculum! First, perform Keyword Research. "
                    "Identify high-volume search terms with low keyword difficulty. Second, focus on Search Intent. "
                    "Understand whether your audience wants informational, navigational, or transactional guides. "
                    "Third, write comprehensive semantic content. Go deep into topics rather than skim-reading. "
                    "By structuring your school landing page and articles this way, Google will rank you as an authority. "
                    "Let's put this into practice this week. See you in the next lesson!"
                )
                duration = 180.5
            else:
                raw_text = (
                    "In today's training, we are mastering semantic chunking for large language models. "
                    "Standard text splitting breaks paragraphs and concepts directly in half. "
                    "This ruins retrieval accuracy because context is completely lost. To solve this, we use a three-step semantic boundary strategy. "
                    "First, isolate text by sentence ends. Second, generate multi-modal embeddings using Google's text-embedding-004 model. "
                    "Third, calculate cosine similarity between consecutive blocks, and trigger a split only when similarity drops below 0.65. "
                    "This guarantees every chunk represents a coherent educational concept. "
                    "It's a game-changer for AI SaaS developers! Make sure to run this on your background task queue."
                )
                duration = 240.2
                
            word_count = len(raw_text.split())
            
        elif source.type in ["pdf", "text"]:
            # Real document extraction when an uploaded file is present.
            if local_audio and os.path.exists(local_audio):
                try:
                    print(f"Extracting document text from: {local_audio}")
                    raw_text = _extract_document_text(local_audio, source.type)
                    word_count = len(raw_text.split())
                except Exception as e:
                    print(f"Document extraction failed ({e}); using simulated text.")

            if not raw_text:
                # Simulated document text (no real file in the mocked flow)
                print(f"Extracting document structure and cleaning header/footers from key: {s3_key}")
                raw_text = (
                    "EduClip Technical Architecture Blueprint. Design criteria and business rule mapping. "
                    "The core goal is to optimize 'Time-To-Asset' (TTA) metrics for creator solopreneurs. "
                    "This is achieved through a cloud-native, asynchronous architecture. "
                    "First, we utilize AWS S3 presigned URLs for secure upload directly from client. "
                    "Second, we implement parallel Celery background processing tasks to run transcription and visual rendering. "
                    "Third, we provide a WYSIWYG live preview editor built with Next.js 14, Zustand, and Satori/Resvg. "
                    "Fourth, we enforce strict multi-tenancy at database level via Row Level Security (RLS) on PostgreSQL. "
                    "This ensures data boundary isolation while reducing hosting costs under a shared RDS instance."
                )
                word_count = len(raw_text.split())
            duration = 0.0

        # Update Source progress metadata
        source.duration = duration
        source.word_count = word_count
        db.commit()

        # 3. Launch AI Concept Extraction & Synthesis Engine
        print(f"Triggering AI Concept Extraction for text ({word_count} words)...")
        concepts = ai_engine.extract_concepts(raw_text)
        print(f"Extracted {len(concepts)} educational concepts successfully.")

        # Brand kit (colors/handle) feeds the carousel synthesizer.
        org = db.query(Organization).filter(Organization.id == source.organization_id).first()
        brand_kit = org.brand_kit if org and org.brand_kit else None

        # 4. Generate & Save Micro-Learning Assets
        # For each concept, we generate: 1 Carousel, 1 Video Script, and 1 Newsletter lesson
        created_asset_count = 0
        for concept in concepts:
            print(f"Synthesizing assets for concept: '{concept.title}'")
            
            # A. Visual Carousel (branded with the org's colors)
            carousel = ai_engine.synthesize_carousel(concept, brand_kit)
            carousel_asset = Asset(
                id=uuid4(),
                organization_id=source.organization_id,
                source_id=source.id,
                asset_type="carousel",
                content_data=carousel.model_dump(),
                status="draft"
            )
            db.add(carousel_asset)

            # B. Short-form Video Script
            script = ai_engine.synthesize_video_script(concept)
            script_asset = Asset(
                id=uuid4(),
                organization_id=source.organization_id,
                source_id=source.id,
                asset_type="short_video",
                content_data=script.model_dump(),
                status="draft"
            )
            db.add(script_asset)

            # C. Newsletter Lesson
            newsletter = ai_engine.synthesize_newsletter(concept)
            newsletter_asset = Asset(
                id=uuid4(),
                organization_id=source.organization_id,
                source_id=source.id,
                asset_type="newsletter",
                content_data=newsletter.model_dump(),
                status="draft"
            )
            db.add(newsletter_asset)
            
            created_asset_count += 3

        # Update task execution status to completed
        source.status = "completed"
        db.commit()
        print(f"Media ingestion task completed. Generated {created_asset_count} assets.")
        return True

    except Exception as e:
        db.rollback()
        tb = traceback.format_exc()
        print(f"Error in Celery worker process: {str(e)}\n{tb}")
        
        try:
            # Save traceback error logs to the Source database record
            source = db.query(Source).filter(Source.id == UUID(source_id)).first()
            if source:
                source.status = "failed"
                source.error_log = f"Error: {str(e)}\n\nTraceback:\n{tb}"
                db.commit()
        except Exception as inner_err:
            print(f"Fatal: Could not save error log to DB: {inner_err}")
            
        # Retry logic for transient failures (e.g., API limits/network timeout)
        try:
            self.retry(exc=e, countdown=60)
        except Exception:
            # Reached max retries or retry bounds
            pass

        return False

    finally:
        db.close()


@celery_app.task(name="publish_publication", bind=True, max_retries=5)
def publish_publication(self, publication_id: str):
    """
    Distribution worker: takes a scheduled Publication to a platform through the
    unified IPublisher handshake (validate → upload media → publish), recording the
    external post id. Idempotent: a row already published is a no-op.
    """
    print(f"Publishing publication_id: {publication_id}")
    db = SessionLocal()
    try:
        pub = db.query(Publication).filter(Publication.id == UUID(publication_id)).first()
        if not pub:
            print(f"Publication {publication_id} not found")
            return False

        # Idempotency / lifecycle guards.
        if pub.status == "published":
            return True
        if pub.status == "cancelled":
            return False

        asset = db.query(Asset).filter(Asset.id == pub.asset_id).first()
        if not asset:
            pub.status = "failed"
            pub.error_log = "Asset no longer exists"
            db.commit()
            return False

        pub.status = "publishing"
        db.commit()

        publisher = get_publisher(pub.platform)
        publisher.validate_asset(asset.asset_type, asset.content_data)
        media_ids = publisher.upload_media(asset.asset_type, asset.content_data)
        result = publisher.publish(asset.asset_type, asset.content_data, media_ids)

        pub.status = "published"
        pub.external_post_id = result.external_post_id
        pub.error_log = None
        # Reflect distribution state back onto the asset for the dashboard.
        asset.status = "published"
        asset.external_platform_id = result.external_post_id
        db.commit()
        print(f"Published {publication_id} to {pub.platform} as {result.external_post_id}")
        return True

    except PublishError as e:
        # Validation failure — not retryable.
        db.rollback()
        pub = db.query(Publication).filter(Publication.id == UUID(publication_id)).first()
        if pub:
            pub.status = "failed"
            pub.error_log = f"Validation failed: {e}"
            db.commit()
        return False

    except Exception as e:
        db.rollback()
        tb = traceback.format_exc()
        print(f"Publish error for {publication_id}: {e}\n{tb}")
        try:
            pub = db.query(Publication).filter(Publication.id == UUID(publication_id)).first()
            if pub:
                pub.status = "failed"
                pub.error_log = f"Error: {e}"
                db.commit()
        except Exception:
            pass
        # Transient failures (5xx/429) retry with exponential backoff: 2, 4, 8, 16 min.
        try:
            self.retry(exc=e, countdown=120 * (2 ** self.request.retries))
        except Exception:
            pass
        return False

    finally:
        db.close()
