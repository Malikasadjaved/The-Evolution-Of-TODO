"""
Database session management with SQLModel.

This module provides the database engine and session factory.
"""

from typing import Generator

from sqlmodel import Session, SQLModel, create_engine

from .config import settings

# Create database engine
# echo=True enables SQL query logging (set to False in production)
# Use psycopg3 driver (modern PostgreSQL driver)
database_url = settings.database_url.replace("postgresql://", "postgresql+psycopg://")

engine = create_engine(
    database_url,
    echo=False,  # Set to True to see SQL queries in logs
    pool_pre_ping=True,  # Verify connections before using them
)


def create_tables() -> None:
    """
    Create all database tables.

    This should be called once during application startup (development)
    or via Alembic migrations (production).
    """
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """
    Dependency to get database session.

    Usage in FastAPI endpoints:
        @app.get("/api/tasks")
        async def get_tasks(session: Session = Depends(get_session)):
            ...

    Yields:
        Session: SQLModel database session

    The session is automatically closed after the request.
    """
    with Session(engine) as session:
        yield session
