"""
SQLModel Database Models with Proper Timestamp Handling

These models follow PostgreSQL best practices for timestamp columns.

CRITICAL: Use datetime.utcnow() for TIMESTAMP columns, NEVER int(time.time())

Usage:
    from .models import Task, User
    from datetime import datetime

    task = Task(
        user_id=current_user_id,
        title="My Task",
        created_at=datetime.utcnow()  # Correct
    )
"""

from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    """
    User model for Better Auth integration.

    Note: Better Auth manages the users table, but you may need
    this model for querying user data.
    """

    __tablename__ = "users"

    id: str = Field(primary_key=True)  # Better Auth user ID
    email: str = Field(unique=True, index=True)
    name: Optional[str] = None

    # Timestamps - CRITICAL: Use datetime, not int
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        sa_column_kwargs={"onupdate": datetime.utcnow},  # Auto-update on modification
    )


class Task(SQLModel, table=True):
    """
    Task model with proper timestamp handling and user isolation.

    Example:
        # Create task
        task = Task(
            user_id=current_user_id,
            title="Buy groceries",
            created_at=datetime.utcnow()
        )
        db.add(task)
        db.commit()

        # Query tasks (with user isolation)
        statement = select(Task).where(Task.user_id == current_user_id)
        tasks = db.exec(statement).all()
    """

    __tablename__ = "tasks"

    # Primary key
    id: Optional[int] = Field(default=None, primary_key=True)

    # Foreign key (user isolation)
    user_id: str = Field(foreign_key="users.id", index=True, nullable=False)

    # Task data
    title: str = Field(max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    completed: bool = Field(default=False)
    priority: str = Field(default="medium")  # low, medium, high

    # Timestamps - CRITICAL: Use datetime.utcnow(), NOT int(time.time())
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        sa_column_kwargs={"onupdate": datetime.utcnow},
    )

    # Optional: Due date
    due_date: Optional[datetime] = None


class Tag(SQLModel, table=True):
    """
    Tag model for categorizing tasks.
    """

    __tablename__ = "tags"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True, nullable=False)
    name: str = Field(max_length=50, index=True)
    color: Optional[str] = Field(default="#808080", max_length=7)  # Hex color

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)


class TaskTag(SQLModel, table=True):
    """
    Many-to-many relationship between tasks and tags.
    """

    __tablename__ = "task_tags"

    task_id: int = Field(foreign_key="tasks.id", primary_key=True)
    tag_id: int = Field(foreign_key="tags.id", primary_key=True)


# Database initialization
def create_tables(engine):
    """
    Create all tables.
    Run once during initial setup.

    Example:
        from sqlmodel import create_engine
        from .config import settings
        from .models import create_tables

        engine = create_engine(settings.database_url)
        create_tables(engine)
    """
    SQLModel.metadata.create_all(engine)
    print("✅ Database tables created")


def drop_tables(engine):
    """
    Drop all tables.
    WARNING: This deletes all data!

    Example:
        from sqlmodel import create_engine
        from .config import settings
        from .models import drop_tables

        engine = create_engine(settings.database_url)
        drop_tables(engine)
    """
    SQLModel.metadata.drop_all(engine)
    print("⚠️ Database tables dropped")
