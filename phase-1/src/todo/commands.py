"""Business logic layer for task operations."""

from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional, Any

from src.todo.models import Priority, RecurrencePattern
from src.todo import storage


@dataclass
class CommandResult:
    """Standard result object for all commands.

    Attributes:
        success: True if operation succeeded, False otherwise
        message: Human-readable message describing the result
        data: Optional data returned by the operation
        errors: List of error messages if operation failed
    """

    success: bool
    message: str
    data: Any = None
    errors: List[str] = None

    def __post_init__(self):
        """Initialize errors list if None."""
        if self.errors is None:
            self.errors = []


def add_task_command(
    title: str,
    description: str = "",
    priority: str = "MEDIUM",
    tags: str = "",
    due_date_str: str = "",
    recurrence_str: str = "",
    reminder_offset_str: str = "",
) -> CommandResult:
    """Add a new task.

    Args:
        title: Task title (required)
        description: Task description (optional)
        priority: Priority level string (HIGH/MEDIUM/LOW)
        tags: Comma-separated tags string
        due_date_str: Due date string (YYYY-MM-DD or YYYY-MM-DD HH:MM)
        recurrence_str: Recurrence pattern (DAILY/WEEKLY/MONTHLY/YEARLY)
        reminder_offset_str: Hours before due date to remind

    Returns:
        CommandResult with created Task in data field if successful
    """
    try:
        # Parse priority
        priority_enum = parse_priority(priority)
        if priority_enum is None:
            return CommandResult(
                success=False,
                message="Invalid priority level",
                errors=["Priority must be HIGH, MEDIUM, or LOW"],
            )

        # Parse tags
        tags_list = parse_tags(tags)

        # Parse due date
        due_date = parse_date(due_date_str) if due_date_str else None

        # Parse recurrence
        recurrence = None
        if recurrence_str:
            recurrence = parse_recurrence(recurrence_str)
            if recurrence is None:
                return CommandResult(
                    success=False,
                    message="Invalid recurrence pattern",
                    errors=[
                        "Recurrence must be DAILY, WEEKLY, BIWEEKLY, MONTHLY, or YEARLY"
                    ],
                )

        # Parse reminder offset
        reminder_offset = None
        if reminder_offset_str:
            try:
                reminder_offset = float(reminder_offset_str)
            except ValueError:
                return CommandResult(
                    success=False,
                    message="Invalid reminder offset",
                    errors=["Reminder offset must be a number (hours)"],
                )

        # Create task
        task = storage.create_task(
            title=title,
            description=description,
            priority=priority_enum,
            tags=tags_list,
            due_date=due_date,
            recurrence=recurrence,
            reminder_offset=reminder_offset,
        )

        return CommandResult(
            success=True, message=f"Task #{task.id} created successfully", data=task
        )

    except ValueError as e:
        return CommandResult(success=False, message="Validation error", errors=[str(e)])
    except Exception as e:
        return CommandResult(
            success=False, message="Failed to create task", errors=[str(e)]
        )


def view_all_tasks_command() -> CommandResult:
    """View all tasks.

    Returns:
        CommandResult with list of all tasks in data field
    """
    try:
        tasks = storage.get_all_tasks()
        return CommandResult(
            success=True,
            message=f"Found {len(tasks)} task(s)",
            data=tasks,
        )
    except Exception as e:
        return CommandResult(
            success=False, message="Failed to retrieve tasks", errors=[str(e)]
        )


def update_task_command(task_id: int, **updates) -> CommandResult:
    """Update task fields.

    Args:
        task_id: Task ID to update
        **updates: Keyword arguments for fields to update (e.g., title="New Title")

    Returns:
        CommandResult with updated Task in data field if successful
    """
    try:
        # Parse updates if they're strings
        parsed_updates = {}
        for key, value in updates.items():
            if key == "priority" and isinstance(value, str):
                priority_enum = parse_priority(value)
                if priority_enum is None:
                    return CommandResult(
                        success=False,
                        message="Invalid priority level",
                        errors=["Priority must be HIGH, MEDIUM, or LOW"],
                    )
                parsed_updates[key] = priority_enum
            elif key == "tags" and isinstance(value, str):
                parsed_updates[key] = parse_tags(value)
            elif key == "due_date" and isinstance(value, str):
                parsed_updates[key] = parse_date(value)
            elif key == "recurrence" and isinstance(value, str):
                recurrence = parse_recurrence(value)
                if recurrence is None:
                    return CommandResult(
                        success=False,
                        message="Invalid recurrence pattern",
                        errors=[
                            "Recurrence must be DAILY, WEEKLY, BIWEEKLY, "
                            "MONTHLY, or YEARLY"
                        ],
                    )
                parsed_updates[key] = recurrence
            else:
                parsed_updates[key] = value

        # Update task
        success = storage.update_task(task_id, **parsed_updates)

        if not success:
            return CommandResult(
                success=False,
                message=f"Task #{task_id} not found",
                errors=[
                    "Task does not exist. Use option 2 (View All Tasks) "
                    "to see valid task IDs."
                ],
            )

        # Get updated task
        task = storage.get_task(task_id)
        return CommandResult(
            success=True, message=f"Task #{task_id} updated successfully", data=task
        )

    except ValueError as e:
        return CommandResult(success=False, message="Validation error", errors=[str(e)])
    except Exception as e:
        return CommandResult(
            success=False, message="Failed to update task", errors=[str(e)]
        )


def delete_task_command(task_id: int, confirmed: bool = False) -> CommandResult:
    """Delete a task with confirmation.

    Args:
        task_id: Task ID to delete
        confirmed: True if user has confirmed deletion

    Returns:
        CommandResult indicating success or confirmation needed
    """
    try:
        # Check if task exists
        task = storage.get_task(task_id)
        if task is None:
            return CommandResult(
                success=False,
                message=f"Task #{task_id} not found",
                errors=[
                    "Task does not exist. Use option 2 (View All Tasks) "
                    "to see valid task IDs."
                ],
            )

        if not confirmed:
            return CommandResult(
                success=True,
                message=f"Confirm deletion of task #{task_id}: '{task.title}'?",
                data=task,
            )

        # Delete task
        success = storage.delete_task(task_id)
        if success:
            return CommandResult(
                success=True, message=f"Task #{task_id} deleted successfully"
            )
        else:
            return CommandResult(
                success=False,
                message=f"Failed to delete task #{task_id}",
                errors=["Unknown error"],
            )

    except Exception as e:
        return CommandResult(
            success=False, message="Failed to delete task", errors=[str(e)]
        )


def mark_complete_command(task_id: int) -> CommandResult:
    """Mark task as complete.

    Args:
        task_id: Task ID to mark complete

    Returns:
        CommandResult indicating success
    """
    try:
        # Mark complete (returns new task if recurring)
        new_task = storage.mark_complete(task_id)

        if new_task is None:
            # Either task not found or non-recurring task completed
            task = storage.get_task(task_id)
            if task is None:
                return CommandResult(
                    success=False,
                    message=f"Task #{task_id} not found",
                    errors=[
                        "Task does not exist. Use option 2 (View All Tasks) "
                        "to see valid task IDs."
                    ],
                )
            if task.status != "complete":
                return CommandResult(
                    success=False,
                    message="Failed to mark task as complete",
                    errors=["Unknown error"],
                )

            return CommandResult(
                success=True, message=f"Task #{task_id} marked as complete", data=task
            )
        else:
            # Recurring task - new instance created
            return CommandResult(
                success=True,
                message=(
                    f"Task #{task_id} completed. "
                    f"New instance #{new_task.id} created."
                ),
                data=new_task,
            )

    except Exception as e:
        return CommandResult(
            success=False, message="Failed to mark task as complete", errors=[str(e)]
        )


def mark_incomplete_command(task_id: int) -> CommandResult:
    """Mark task as incomplete.

    Args:
        task_id: Task ID to mark incomplete

    Returns:
        CommandResult indicating success
    """
    try:
        success = storage.mark_incomplete(task_id)

        if not success:
            return CommandResult(
                success=False,
                message=f"Task #{task_id} not found",
                errors=[
                    "Task does not exist. Use option 2 (View All Tasks) "
                    "to see valid task IDs."
                ],
            )

        task = storage.get_task(task_id)
        return CommandResult(
            success=True, message=f"Task #{task_id} marked as incomplete", data=task
        )

    except Exception as e:
        return CommandResult(
            success=False,
            message="Failed to mark task as incomplete",
            errors=[str(e)],
        )


# Helper functions for parsing


def parse_priority(priority_str: str) -> Optional[Priority]:
    """Parse priority string to Priority enum.

    Args:
        priority_str: Priority string (case-insensitive)

    Returns:
        Priority enum value or None if invalid
    """
    try:
        return Priority[priority_str.upper()]
    except (KeyError, AttributeError):
        return None


def parse_date(date_str: str) -> Optional[datetime]:
    """Parse date string to datetime object.

    Supports formats:
    - YYYY-MM-DD
    - YYYY-MM-DD HH:MM

    Args:
        date_str: Date string

    Returns:
        datetime object or None if invalid
    """
    if not date_str:
        return None

    formats = [
        "%Y-%m-%d",
        "%Y-%m-%d %H:%M",
    ]

    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue

    return None


def parse_tags(tags_str: str) -> List[str]:
    """Parse comma-separated tags string to list.

    Args:
        tags_str: Comma-separated tags string

    Returns:
        List of trimmed tag strings (empty list if input is empty)
    """
    if not tags_str or not tags_str.strip():
        return []

    return [tag.strip() for tag in tags_str.split(",") if tag.strip()]


def parse_recurrence(recurrence_str: str) -> Optional[RecurrencePattern]:
    """Parse recurrence string to RecurrencePattern enum.

    Args:
        recurrence_str: Recurrence string (case-insensitive)

    Returns:
        RecurrencePattern enum value or None if invalid
    """
    try:
        return RecurrencePattern[recurrence_str.upper()]
    except (KeyError, AttributeError):
        return None


def parse_reminder_offset(offset_str: str) -> Optional[float]:
    """Parse reminder offset string to float.

    Args:
        offset_str: Hours before due date as string

    Returns:
        Float hours or None if invalid
    """
    if not offset_str:
        return None

    try:
        return float(offset_str)
    except ValueError:
        return None
