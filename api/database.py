import os
from datetime import datetime
from uuid import uuid4
from sqlalchemy import (
    create_engine, Column, String, Integer, Float, ForeignKey, DateTime, Text, Enum, JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/educlip")

# SQLite (local dev) doesn't accept the QueuePool sizing args and needs
# check_same_thread disabled for FastAPI's threadpool; Postgres uses real pooling.
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL, pool_size=20, max_overflow=10)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    stripe_customer_id = Column(String, unique=True, nullable=True)
    subscription_status = Column(String, default="trialing") # trialing, active, past_due, canceled
    plan_tier = Column(String, default="free") # free, pro, agency
    ai_credits_remaining = Column(Integer, default=10)
    brand_kit = Column(JSON, nullable=True)  # {primary_color, bg_color, font_family, creator_handle}

    memberships = relationship("Membership", back_populates="organization", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="organization", cascade="all, delete-orphan")
    sources = relationship("Source", back_populates="organization", cascade="all, delete-orphan")
    assets = relationship("Asset", back_populates="organization", cascade="all, delete-orphan")

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True) # Clerk User ID
    email = Column(String, unique=True, nullable=False)
    full_name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    memberships = relationship("Membership", back_populates="user", cascade="all, delete-orphan")

class Membership(Base):
    __tablename__ = "memberships"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, default="member") # owner, admin, member

    organization = relationship("Organization", back_populates="memberships")
    user = relationship("User", back_populates="memberships")

class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="projects")
    sources = relationship("Source", back_populates="project")

class Source(Base):
    __tablename__ = "sources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    type = Column(String, nullable=False) # video, audio, pdf, text
    s3_key = Column(String, nullable=False)
    vector_namespace = Column(String, nullable=False) # Pinecone isolation namespace
    metadata_json = Column(JSON, nullable=True) # To store word count, duration, raw name, etc.
    status = Column(String, default="pending") # pending, processing, completed, failed
    word_count = Column(Integer, default=0)
    duration = Column(Float, default=0.0)
    error_log = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="sources")
    project = relationship("Project", back_populates="sources")
    assets = relationship("Asset", back_populates="source", cascade="all, delete-orphan")

class Asset(Base):
    __tablename__ = "assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    source_id = Column(UUID(as_uuid=True), ForeignKey("sources.id", ondelete="CASCADE"), nullable=True)
    asset_type = Column(String, nullable=False) # carousel, short_video, newsletter
    content_data = Column(JSON, nullable=False) # Script structure, slides, or markdown lessons
    status = Column(String, default="draft") # draft, scheduled, published
    scheduled_at = Column(DateTime, nullable=True)
    external_platform_id = Column(String, nullable=True) # Social media post reference ID
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="assets")
    source = relationship("Source", back_populates="assets")
    publications = relationship("Publication", back_populates="asset", cascade="all, delete-orphan")

class Publication(Base):
    """The 'last mile': one scheduled/published delivery of an asset to one platform."""
    __tablename__ = "publications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    platform = Column(String, nullable=False)  # linkedin, instagram, tiktok, twitter, beehiiv
    status = Column(String, default="scheduled")  # scheduled, publishing, published, failed, cancelled
    publish_at = Column(DateTime, nullable=False)  # stored in UTC
    external_post_id = Column(String, nullable=True)  # platform post id once published
    request_id = Column(String, nullable=False)  # idempotency key to prevent double-posting
    error_log = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    asset = relationship("Asset", back_populates="publications")

# Logical Multi-Tenancy / RLS Guard Helpers
def get_db_session():
    """FastAPI Dependency for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def enforce_tenant(session, org_id):
    """Enforces that all subsequent queries verify multi-tenancy.
    For PostgreSQL, this can simulate Row Level Security or serve as a local check.
    """
    # This acts as a logical security hook.
    # It ensures that queries are strictly bounded by organization_id.
    # Usage: query = session.query(Source).filter_by(organization_id=org_id)
    return TenantContext(session, org_id)

class TenantContext:
    def __init__(self, session, org_id):
        self.session = session
        self.org_id = org_id

    def query(self, model):
        if hasattr(model, "organization_id"):
            return self.session.query(model).filter(model.organization_id == self.org_id)
        return self.session.query(model)
