"""
Database connection and session management.

Connects to Neon PostgreSQL using SQLModel.
"""
from sqlmodel import SQLModel, Session, create_engine
from typing import Generator
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

# Create engine
engine = create_engine(
    DATABASE_URL,
    echo=True,  # Set to False in production
    pool_pre_ping=True,  # Verify connections before using
    pool_size=5,
    max_overflow=10
)


def create_db_and_tables():
    """Create all database tables."""
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """
    Dependency for getting database sessions.

    Usage in FastAPI:
        @app.get("/tasks")
        def get_tasks(session: Session = Depends(get_session)):
            ...
    """
    with Session(engine) as session:
        yield session


# For testing purposes
def get_test_session() -> Session:
    """Get a database session for testing."""
    return Session(engine)
