"""Recurring task scheduler for auto-rescheduling."""

from datetime import datetime
from dateutil.relativedelta import relativedelta

from src.todo.models import Task, RecurrencePattern


def calculate_next_due_date(
    current_due: datetime, recurrence: RecurrencePattern
) -> datetime:
    """Calculate the next due date for a recurring task.

    Args:
        current_due: Current due date
        recurrence: Recurrence pattern

    Returns:
        Next due date based on recurrence pattern
    """
    if recurrence == RecurrencePattern.DAILY:
        return current_due + relativedelta(days=1)
    elif recurrence == RecurrencePattern.WEEKLY:
        return current_due + relativedelta(weeks=1)
    elif recurrence == RecurrencePattern.BIWEEKLY:
        return current_due + relativedelta(weeks=2)
    elif recurrence == RecurrencePattern.MONTHLY:
        return current_due + relativedelta(months=1)
    elif recurrence == RecurrencePattern.YEARLY:
        return current_due + relativedelta(years=1)
    else:
        raise ValueError(f"Unknown recurrence pattern: {recurrence}")


def create_recurring_instance(original: Task, next_task_id: int) -> Task:
    """Create a new recurring task instance based on the original.

    Args:
        original: Original task that was completed
        next_task_id: ID to assign to the new task instance

    Returns:
        New Task instance with updated due date and reset status
    """
    if not original.recurrence or not original.due_date:
        raise ValueError("Task must have recurrence and due_date")

    # Calculate next due date
    next_due = calculate_next_due_date(original.due_date, original.recurrence)

    # Create new task instance with same properties
    new_task = Task(
        id=next_task_id,
        title=original.title,
        description=original.description,
        status="incomplete",
        priority=original.priority,
        tags=original.tags.copy() if original.tags else [],
        due_date=next_due,
        recurrence=original.recurrence,
        completed_date=None,
        reminder_offset=original.reminder_offset,
    )

    return new_task
