import os

# Set environment variables at the absolute top so any module load gets mock settings
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
os.environ["DATABASE_URL"] = SQLALCHEMY_DATABASE_URL
os.environ["GEMINI_API_KEY"] = "mock_gemini_key"
os.environ["STRIPE_SECRET_KEY"] = "sk_test_mock_key"
os.environ["REDIS_URL"] = "redis://localhost:6379/0"

import pytest
from unittest.mock import MagicMock
import celery

# Mock Celery's send_task globally to prevent any Redis connection attempts during unit tests
celery.Celery.send_task = MagicMock()

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from api.database import Base, get_db_session
from api.main import app
from fastapi.testclient import TestClient

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
    
    # Create schema tables
    Base.metadata.create_all(bind=engine)
    
    yield
    
    # Clean up after all tests complete
    try:
        Base.metadata.drop_all(bind=engine)
    except Exception:
        pass
        
    engine.dispose()
    
    try:
        if os.path.exists("./test.db"):
            os.remove("./test.db")
    except Exception:
        pass

@pytest.fixture
def db_session():
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
    SessionTesting = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionTesting()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def client(db_session):
    # Override get_db_session FastAPI dependency
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
            
    app.dependency_overrides[get_db_session] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
