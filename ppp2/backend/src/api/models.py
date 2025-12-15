"""
Database models for the Todo application.

Uses SQLModel for ORM and Pydantic validation.
"""
from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum


class Priority(str, Enum):
    """Task priority levels."""
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class RecurrencePattern(str, Enum):
    """Recurring task patterns."""
    NONE = "NONE"
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    MONTHLY = "MONTHLY"
    YEARLY = "YEARLY"


# Database Models (table=True)

class User(SQLModel, table=True):
    """User model - managed by Better Auth."""
    __tablename__ = "users"

    id: str = Field(primary_key=True)  # Better Auth provides string IDs
    email: str = Field(unique=True, index=True)
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Task(SQLModel, table=True):
    """Task model with full feature support."""
    __tablename__ = "tasks"

    # Primary fields
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)

    # Basic task info
    title: str = Field(max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)

    # Organization fields
    priority: Priority = Field(default=Priority.MEDIUM)
    tags: str = Field(default="")  # JSON array string: ["work", "urgent"]

    # Scheduling fields
    due_date: Optional[datetime] = None
    task_type: str = Field(default="activity")  # "scheduled" or "activity"
    recurrence_pattern: RecurrencePattern = Field(default=RecurrencePattern.NONE)

    # Status fields
    completed: bool = Field(default=False)
    completed_at: Optional[datetime] = None

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Computed fields
    @property
    def is_overdue(self) -> bool:
        """Check if task is overdue."""
        if not self.due_date or self.completed:
            return False
        return datetime.utcnow() > self.due_date


# API Models (table=False) - for request/response validation

class TaskCreate(SQLModel):
    """Model for creating a new task."""
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    priority: Priority = Priority.MEDIUM
    tags: list[str] = Field(default_factory=list)
    due_date: Optional[datetime] = None
    task_type: str = "activity"
    recurrence_pattern: RecurrencePattern = RecurrencePattern.NONE


class TaskUpdate(SQLModel):
    """Model for updating a task."""
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = None
    priority: Optional[Priority] = None
    tags: Optional[list[str]] = None
    due_date: Optional[datetime] = None
    task_type: Optional[str] = None
    recurrence_pattern: Optional[RecurrencePattern] = None


class TaskResponse(SQLModel):
    """Model for task API responses."""
    id: int
    user_id: str
    title: str
    description: Optional[str]
    priority: Priority
    tags: list[str]
    due_date: Optional[datetime]
    task_type: str
    recurrence_pattern: RecurrencePattern
    completed: bool
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    is_overdue: bool

    @classmethod
    def from_task(cls, task: Task) -> "TaskResponse":
        """Convert Task model to TaskResponse."""
        import json

        # Parse tags from JSON string
        tags = []
        if task.tags:
            try:
                tags = json.loads(task.tags)
            except json.JSONDecodeError:
                tags = []

        return cls(
            id=task.id,
            user_id=task.user_id,
            title=task.title,
            description=task.description,
            priority=task.priority,
            tags=tags,
            due_date=task.due_date,
            task_type=task.task_type,
            recurrence_pattern=task.recurrence_pattern,
            completed=task.completed,
            completed_at=task.completed_at,
            created_at=task.created_at,
            updated_at=task.updated_at,
            is_overdue=task.is_overdue
        )


class UserCreate(SQLModel):
    """Model for user creation (handled by Better Auth)."""
    email: str
    name: str
    password: str


class UserResponse(SQLModel):
    """Model for user API responses."""
    id: str
    email: str
    name: str
    created_at: datetime
