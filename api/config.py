import os
from pydantic_settings import BaseSettings

_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class Settings(BaseSettings):
    PROJECT_NAME: str = "EduClip"
    # Local directory for real file uploads (dev stand-in for S3 object storage).
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", os.path.join(_PROJECT_ROOT, "uploads"))
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/v1"
    
    # Database Settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/educlip")
    
    # Redis & Queue Settings
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    # When false (dev default), skip the Celery broker entirely and run tasks in a
    # background thread. Set USE_CELERY=true in production with a real Redis broker.
    USE_CELERY: bool = os.getenv("USE_CELERY", "false").lower() in ("1", "true", "yes")
    
    # Third-Party API Keys (simulated or real from AWS Secrets Manager)
    CLERK_API_KEY: str = os.getenv("CLERK_API_KEY", "clerk_sec_mock_key")
    CLERK_FRONTEND_API: str = os.getenv("CLERK_FRONTEND_API", "clerk_pub_mock_key")
    
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "sk_test_mock_key")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_mock_secret")
    
    # S3 Settings
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "mock_aws_id")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "mock_aws_secret")
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    S3_RAW_BUCKET: str = os.getenv("S3_RAW_BUCKET", "educlip-raw-ingest")
    S3_PROCESSED_BUCKET: str = os.getenv("S3_PROCESSED_BUCKET", "educlip-processed")
    
    # Pinecone Vector Settings
    PINECONE_API_KEY: str = os.getenv("PINECONE_API_KEY", "pinecone_mock_key")
    PINECONE_ENVIRONMENT: str = os.getenv("PINECONE_ENVIRONMENT", "us-west1-gcp")
    PINECONE_INDEX_NAME: str = os.getenv("PINECONE_INDEX_NAME", "educlip-concepts")
    
    # Gemini API settings (new Interactions API)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "mock_gemini_key")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
    GEMINI_EMBED_MODEL: str = os.getenv("GEMINI_EMBED_MODEL", "gemini-embedding-001")

    class Config:
        # Load api/.env regardless of the process working directory.
        env_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
        case_sensitive = True

settings = Settings()
