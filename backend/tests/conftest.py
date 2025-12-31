"""
Pytest configuration and fixtures.

This file provides test fixtures for database sessions, JWT tokens, and test users.
"""

import jwt
import pytest
from datetime import datetime, timedelta
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from src.api.config import settings
from src.api.models import User


@pytest.fixture(name="test_db_session")
def fixture_test_db_session():
    """
    Create an in-memory SQLite database for testing.

    This fixture creates a fresh database for each test and tears it down after.
    Using SQLite in memory for speed (tests don't need PostgreSQL).

    Yields:
        Session: Database session for testing
    """
    # Create in-memory SQLite engine for testing
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Create all tables
    SQLModel.metadata.create_all(engine)

    with Session(engine) as session:
        yield session

    # Cleanup: Drop all tables
    SQLModel.metadata.drop_all(engine)


@pytest.fixture
def test_user(test_db_session: Session) -> User:
    """
    Create a test user.

    Args:
        test_db_session: Database session

    Returns:
        User: Test user object
    """
    user = User(
        id="test_user_123",
        email="test@example.com",
        name="Test User",
        created_at=datetime.utcnow(),
    )
    test_db_session.add(user)
    test_db_session.commit()
    test_db_session.refresh(user)
    return user


@pytest.fixture
def test_user_2(test_db_session: Session) -> User:
    """
    Create a second test user for user isolation tests.

    Args:
        test_db_session: Database session

    Returns:
        User: Second test user object
    """
    user = User(
        id="test_user_456",
        email="test2@example.com",
        name="Test User 2",
        created_at=datetime.utcnow(),
    )
    test_db_session.add(user)
    test_db_session.commit()
    test_db_session.refresh(user)
    return user


@pytest.fixture
def test_jwt_token() -> str:
    """
    Generate a valid JWT token for testing.

    Returns:
        str: Valid JWT token with user_id=test_user_123
    """
    payload = {
        "user_id": "test_user_123",
        "email": "test@example.com",
        "exp": datetime.utcnow() + timedelta(hours=1),  # Expires in 1 hour
        "iat": datetime.utcnow(),
    }
    token = jwt.encode(payload, settings.better_auth_secret, algorithm="HS256")
    return token


@pytest.fixture
def expired_jwt_token() -> str:
    """
    Generate an expired JWT token for testing.

    Returns:
        str: Expired JWT token
    """
    payload = {
        "user_id": "test_user_123",
        "email": "test@example.com",
        "exp": datetime.utcnow() - timedelta(hours=1),  # Expired 1 hour ago
        "iat": datetime.utcnow() - timedelta(hours=2),
    }
    token = jwt.encode(payload, settings.better_auth_secret, algorithm="HS256")
    return token


@pytest.fixture
def test_user_2_jwt_token() -> str:
    """
    Generate a valid JWT token for second test user.

    Returns:
        str: Valid JWT token with user_id=test_user_456
    """
    payload = {
        "user_id": "test_user_456",
        "email": "test2@example.com",
        "exp": datetime.utcnow() + timedelta(hours=1),
        "iat": datetime.utcnow(),
    }
    token = jwt.encode(payload, settings.better_auth_secret, algorithm="HS256")
    return token


@pytest.fixture
def invalid_signature_jwt_token() -> str:
    """
    Generate a JWT token with invalid signature for testing.

    Returns:
        str: JWT token with wrong signature
    """
    payload = {
        "user_id": "test_user_123",
        "email": "test@example.com",
        "exp": datetime.utcnow() + timedelta(hours=1),
        "iat": datetime.utcnow(),
    }
    token = jwt.encode(payload, "wrong_secret_key", algorithm="HS256")
    return token


@pytest.fixture(autouse=True)
def override_get_session(test_db_session: Session):
    """
    Override FastAPI's get_session dependency to use test database.

    This fixture automatically runs before each test and ensures all API endpoints
    use the in-memory test database instead of production PostgreSQL.

    Args:
        test_db_session: In-memory SQLite session fixture

    Yields:
        None: Dependency override is active during test execution
    """
    from src.api.db import get_session
    from src.api.main import app

    def get_test_session():
        yield test_db_session

    app.dependency_overrides[get_session] = get_test_session
    yield
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
async def client():
    """
    Create an AsyncClient for testing FastAPI endpoints.

    Yields:
        AsyncClient: HTTPX async client for API testing
    """
    from httpx import ASGITransport, AsyncClient
    from src.api.main import app

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client_instance:
        yield client_instance
