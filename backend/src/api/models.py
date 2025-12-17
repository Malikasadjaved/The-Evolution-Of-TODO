"""
Database models for the Todo application.

All models use SQLModel (SQLAlchemy + Pydantic).
CRITICAL: Always filter queries by user_id for user isolation.
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional

from sqlmodel import Field, Relationship, SQLModel


# ============================================================================
# Enums
# ============================================================================


class TaskStatus(str, Enum):
    """Task completion status."""

    INCOMPLETE = "INCOMPLETE"
    COMPLETE = "COMPLETE"


class TaskPriority(str, Enum):
    """Task priority level (Intermediate tier)."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class TaskRecurrence(str, Enum):
    """Task recurrence pattern (Advanced tier)."""

    NONE = "NONE"
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    MONTHLY = "MONTHLY"
    YEARLY = "YEARLY"


# ============================================================================
# Models
# ============================================================================


class User(SQLModel, table=True):
    """
    User account entity.
    Created by Better Auth during signup/signin.
    """

    __tablename__ = "users"

    id: str = Field(primary_key=True)  # UUID from Better Auth
    email: str = Field(unique=True, index=True, max_length=255)
    name: str = Field(max_length=255)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    tasks: List["Task"] = Relationship(back_populates="user")
    tags: List["Tag"] = Relationship(back_populates="user")


class Task(SQLModel, table=True):
    """
    Todo task entity with three-tier features.
    CRITICAL: Always filter by user_id for user isolation.
    """

    __tablename__ = "tasks"

    # Primary Key
    id: Optional[int] = Field(default=None, primary_key=True)

    # Foreign Key (CRITICAL: User isolation)
    user_id: str = Field(foreign_key="users.id", index=True)

    # Primary Tier: Basic CRUD fields
    title: str = Field(max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    status: TaskStatus = Field(default=TaskStatus.INCOMPLETE)

    # Intermediate Tier: Priority, Tags, Search, Filter, Sort
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM)
    due_date: Optional[datetime] = Field(default=None)
    completed_at: Optional[datetime] = Field(default=None)  # When task was marked complete

    # Advanced Tier: Recurring tasks
    recurrence: TaskRecurrence = Field(default=TaskRecurrence.NONE)
    last_completed_at: Optional[datetime] = Field(default=None)  # For recurring task tracking

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: Optional["User"] = Relationship(back_populates="tasks")
    task_tags: List["TaskTag"] = Relationship(
        back_populates="task", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class Tag(SQLModel, table=True):
    """
    Custom task tag/category.
    CRITICAL: Tags are user-scoped (user isolation).
    """

    __tablename__ = "tags"

    # Primary Key
    id: Optional[int] = Field(default=None, primary_key=True)

    # Foreign Key (CRITICAL: User isolation)
    user_id: str = Field(foreign_key="users.id", index=True)

    # Tag Data
    name: str = Field(max_length=50, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: Optional["User"] = Relationship(back_populates="tags")
    task_tags: List["TaskTag"] = Relationship(
        back_populates="tag", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class TaskTag(SQLModel, table=True):
    """
    Join table for many-to-many Task ↔ Tag relationship.
    """

    __tablename__ = "task_tags"

    # Composite Primary Key
    task_id: int = Field(foreign_key="tasks.id", primary_key=True)
    tag_id: int = Field(foreign_key="tags.id", primary_key=True)

    # Relationships
    task: Optional["Task"] = Relationship(back_populates="task_tags")
    tag: Optional["Tag"] = Relationship(back_populates="task_tags")
