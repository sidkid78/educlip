from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from api.config import settings
from api.database import get_db_session, Base, engine
from api.routers import ingest, assets, billing, auth, distribution, brand, projects
from api.routers import settings as settings_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure ORM tables exist. Idempotent (checkfirst=True) — a convenience so the
    # app self-bootstraps on a fresh SQLite dev DB; Postgres deploys still use schema.sql.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-powered SaaS tool to repurpose long educational videos, webinars, and ebooks into micro-learning assets.",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import uuid

def _get_valid_uuid_string(val_str: str) -> str:
    clean_str = val_str.replace("org_educlip_", "").replace("org_", "")
    try:
        return str(uuid.UUID(clean_str))
    except ValueError:
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, clean_str))

# Authentication & Tenancy Middleware
@app.middleware("http")
async def db_tenant_session_middleware(request: Request, call_next):
    """
    Simulated Clerk Identity Verification and Tenant Extraction Middleware.
    Inspects JWT inside Authorization Header, extracts Clerk User ID and Organization ID,
    validates tenant access, and injects state parameters into the request.
    """
    auth_header = request.headers.get("Authorization")
    
    # Defaults for public/anonymous routes (such as webhooks)
    request.state.user_id = None
    request.state.org_id = None

    # Exclude public API endpoints like webhooks and docs
    path = request.url.path
    if path.startswith("/docs") or path.startswith("/redoc") or path.startswith("/openapi.json") or "webhook" in path or path == "/":
        response = await call_next(request)
        return response

    raw_user_id = "user_clerk_mock_123"
    raw_org_id = "org_educlip_mock_999"

    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        if token == "mock_admin_token":
            raw_user_id = "user_clerk_admin"
            raw_org_id = "org_educlip_mock_999"
        else:
            parts = token.split("_")
            if len(parts) >= 2:
                raw_user_id = f"user_clerk_{parts[0]}"
                raw_org_id = parts[1]
            else:
                raw_user_id = "user_clerk_default"
                raw_org_id = "org_educlip_default"

    request.state.user_id = raw_user_id
    request.state.org_id = _get_valid_uuid_string(raw_org_id)

    # Process Request
    response = await call_next(request)
    return response

# Tenant Context Dependency is imported from api.auth_utils
from api.auth_utils import get_current_tenant

@app.get("/")
def home():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "healthy",
        "description": "Welcome to EduClip: The Micro-Learning Asset Factory API"
    }

# Register Routers
app.include_router(ingest.router, prefix="/v1/ingest", tags=["Ingestion Pipeline"])
app.include_router(assets.router, prefix="/v1/assets", tags=["Asset Generation & Management"])
app.include_router(billing.router, prefix="/v1/billing", tags=["Billing & Stripe Billing"])
app.include_router(auth.router, prefix="/v1/auth", tags=["Auth & Webhooks"])
app.include_router(distribution.router, prefix="/v1/distribution", tags=["Distribution & Scheduling"])
app.include_router(brand.router, prefix="/v1/brand", tags=["Brand Kit"])
app.include_router(projects.router, prefix="/v1/projects", tags=["Projects"])
app.include_router(settings_router.router, prefix="/v1/settings", tags=["Settings"])
