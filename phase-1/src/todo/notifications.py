"""Notification system for task reminders.

Note: This is a simplified implementation for the CLI application.
Desktop notifications require plyer library and work best on native OS installations.
In CLI context, we focus on the logic for calculating and checking reminders.
"""

from datetime import datetime, timedelta
from typing import Optional

from src.todo.models import Task, Reminder


def calculate_reminder_time(due_date: datetime, offset_hours: float) -> datetime:
    """Calculate when reminder should trigger.

    Args:
        due_date: Task due date
        offset_hours: Hours before due date to remind

    Returns:
        Reminder trigger time
    """
    return due_date - timedelta(hours=offset_hours)


def should_trigger_reminder(reminder: Reminder, current_time: datetime) -> bool:
    """Check if reminder should trigger now.

    Args:
        reminder: Reminder to check
        current_time: Current time

    Returns:
        True if reminder should trigger
    """
    # Only trigger if status is pending and time has passed
    if reminder.status != "pending":
        return False

    return current_time >= reminder.reminder_time


def format_notification_message(task: Task) -> str:
    """Format notification message for task.

    Args:
        task: Task to create notification for

    Returns:
        Formatted notification message
    """
    if task.due_date:
        due_str = task.due_date.strftime("%Y-%m-%d %H:%M")
        return f"Reminder: {task.title} is due at {due_str}"
    else:
        return f"Reminder: {task.title}"


def create_reminder(task: Task) -> Optional[Reminder]:
    """Create a reminder for a task if it has reminder_offset.

    Args:
        task: Task to create reminder for

    Returns:
        Reminder object or None if task doesn't have reminder settings
    """
    if not task.reminder_offset or not task.due_date:
        return None

    reminder_time = calculate_reminder_time(task.due_date, task.reminder_offset)
    message = format_notification_message(task)

    return Reminder(
        task_id=task.id,
        reminder_time=reminder_time,
        status="pending",
        notification_message=message,
    )


def trigger_notification(task: Task, message: str) -> bool:
    """Trigger desktop notification (simplified for CLI).

    In a full implementation, this would use plyer.notification.
    For CLI context, we just validate the logic works.

    Args:
        task: Task to notify about
        message: Notification message

    Returns:
        True if notification would be sent successfully
    """
    # Simplified implementation - in production would use:
    # try:
    #     from plyer import notification
    #     notification.notify(
    #         title="Todo Reminder",
    #         message=message,
    #         app_name="Todo App",
    #         timeout=10
    #     )
    #     return True
    # except Exception:
    #     return False

    # For now, just validate inputs and return success
    return task is not None and len(message) > 0
