"""Task data model and enumerations."""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Optional


class Priority(Enum):
    """Task priority levels."""

    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class TaskType(Enum):
    """Task classification based on time-sensitivity."""

    SCHEDULED = "scheduled"  # Has due date
    ACTIVITY = "activity"  # No due date, priority-based


class RecurrencePattern(Enum):
    """Repeating task intervals."""

    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    BIWEEKLY = "BIWEEKLY"
    MONTHLY = "MONTHLY"
    YEARLY = "YEARLY"


@dataclass
class Task:
    """Represents a todo item.

    Attributes:
        id: Unique task identifier (auto-generated, immutable)
        title: Task title (required, non-empty)
        description: Task description (optional)
        status: Completion status ("complete" or "incomplete")
        priority: Task priority level (HIGH/MEDIUM/LOW)
        tags: List of tags/categories
        created_date: Timestamp when task was created (auto-set)
        due_date: Optional due date and time
        recurrence: Optional recurrence pattern
        completed_date: Timestamp when marked complete
        reminder_offset: Time before due_date to trigger reminder
    """

    id: int
    title: str
    description: str = ""
    status: str = "incomplete"
    priority: Priority = Priority.MEDIUM
    tags: List[str] = field(default_factory=list)
    created_date: datetime = field(default_factory=datetime.now)
    due_date: Optional[datetime] = None
    recurrence: Optional[RecurrencePattern] = None
    completed_date: Optional[datetime] = None
    reminder_offset: Optional[float] = None  # Hours before due_date

    def __post_init__(self) -> None:
        """Validate task fields after initialization."""
        # Validate title
        if not self.title or not self.title.strip():
            raise ValueError("Title cannot be empty")

        # Validate status
        if self.status not in ["complete", "incomplete"]:
            raise ValueError("Status must be 'complete' or 'incomplete'")

        # Validate recurrence requires due_date
        if self.recurrence and not self.due_date:
            raise ValueError("Recurrence pattern requires due date")

        # Validate reminder requires due_date
        if self.reminder_offset and not self.due_date:
            raise ValueError("Reminder requires due date")

    @property
    def is_overdue(self) -> bool:
        """Check if task is past due date and incomplete.

        Returns:
            True if task has due date in the past and is incomplete
        """
        if not self.due_date:
            return False
        if self.status == "complete":
            return False
        return datetime.now() > self.due_date

    @property
    def task_type(self) -> TaskType:
        """Get task type based on whether it has a due date.

        Returns:
            TaskType.SCHEDULED if has due_date, TaskType.ACTIVITY otherwise
        """
        return TaskType.SCHEDULED if self.due_date else TaskType.ACTIVITY


@dataclass
class Reminder:
    """Notification configuration for a task.

    Attributes:
        task_id: Reference to task ID
        reminder_time: Exact time to trigger notification
        status: Reminder status (pending/triggered/cancelled/missed)
        notification_message: Message to display in notification
    """

    task_id: int
    reminder_time: datetime
    status: str = "pending"
    notification_message: str = ""

    def __post_init__(self) -> None:
        """Validate reminder fields."""
        if self.status not in ["pending", "triggered", "cancelled", "missed"]:
            raise ValueError("Status must be pending/triggered/cancelled/missed")
