"""Tests for reminder notification system."""

from datetime import datetime, timedelta

import pytest

from src.todo.models import Task, Reminder
from src.todo import notifications


class TestReminderModel:
    """Test Reminder dataclass."""

    def test_reminder_dataclass(self):
        """Test creating Reminder instance."""
        reminder_time = datetime(2025, 12, 10, 13, 0)
        reminder = Reminder(
            task_id=1,
            reminder_time=reminder_time,
            status="pending",
            notification_message="Task due in 1 hour",
        )

        assert reminder.task_id == 1
        assert reminder.reminder_time == reminder_time
        assert reminder.status == "pending"
        assert reminder.notification_message == "Task due in 1 hour"

    def test_reminder_requires_due_date(self):
        """Test that tasks with reminders must have due dates."""
        # Task with reminder but no due date should fail validation
        with pytest.raises(ValueError, match="Reminder requires due date"):
            Task(id=1, title="Task", reminder_offset=2.0, due_date=None)


class TestParseReminderOffset:
    """Test parsing reminder offset."""

    def test_parse_reminder_offset(self):
        """Test parsing reminder offset from string."""
        from src.todo.commands import parse_reminder_offset

        # Valid offsets
        assert parse_reminder_offset("1.0") == 1.0
        assert parse_reminder_offset("2.5") == 2.5
        assert parse_reminder_offset("24") == 24.0

        # Invalid offsets
        assert parse_reminder_offset("invalid") is None
        assert parse_reminder_offset("") is None


class TestCalculateReminderTime:
    """Test reminder time calculation."""

    def test_calculate_reminder_time(self):
        """Test calculating reminder time from due date and offset."""
        due_date = datetime(2025, 12, 10, 14, 0)
        offset_hours = 1.0

        reminder_time = notifications.calculate_reminder_time(due_date, offset_hours)

        expected = datetime(2025, 12, 10, 13, 0)
        assert reminder_time == expected

    def test_calculate_reminder_time_multiple_hours(self):
        """Test reminder time with multiple hour offset."""
        due_date = datetime(2025, 12, 10, 14, 0)
        offset_hours = 24.0

        reminder_time = notifications.calculate_reminder_time(due_date, offset_hours)

        expected = datetime(2025, 12, 9, 14, 0)
        assert reminder_time == expected


class TestCheckReminders:
    """Test checking if reminders should trigger."""

    def test_check_reminder_should_trigger(self):
        """Test that reminder triggers when time has passed."""
        now = datetime.now()
        past_time = now - timedelta(minutes=5)

        reminder = Reminder(
            task_id=1,
            reminder_time=past_time,
            status="pending",
            notification_message="Test",
        )

        should_trigger = notifications.should_trigger_reminder(reminder, now)
        assert should_trigger is True

    def test_check_reminder_should_not_trigger_future(self):
        """Test that reminder doesn't trigger for future time."""
        now = datetime.now()
        future_time = now + timedelta(minutes=5)

        reminder = Reminder(
            task_id=1,
            reminder_time=future_time,
            status="pending",
            notification_message="Test",
        )

        should_trigger = notifications.should_trigger_reminder(reminder, now)
        assert should_trigger is False

    def test_check_reminder_already_triggered(self):
        """Test that triggered reminders don't trigger again."""
        now = datetime.now()
        past_time = now - timedelta(minutes=5)

        reminder = Reminder(
            task_id=1,
            reminder_time=past_time,
            status="triggered",  # Already triggered
            notification_message="Test",
        )

        should_trigger = notifications.should_trigger_reminder(reminder, now)
        assert should_trigger is False


class TestFormatNotificationMessage:
    """Test notification message formatting."""

    def test_format_notification_message(self):
        """Test formatting notification message for task."""
        task = Task(
            id=1,
            title="Team meeting",
            due_date=datetime(2025, 12, 10, 14, 0),
        )

        message = notifications.format_notification_message(task)

        assert "Team meeting" in message
        assert "2025-12-10 14:00" in message or "14:00" in message

    def test_format_notification_message_no_due_date(self):
        """Test formatting notification for task without due date."""
        task = Task(
            id=1,
            title="Simple task",
            due_date=None,
        )

        message = notifications.format_notification_message(task)

        assert "Simple task" in message
        assert "Reminder:" in message


class TestCreateReminder:
    """Test create_reminder function."""

    def test_create_reminder_with_offset_and_due_date(self):
        """Test creating reminder for task with reminder offset and due date."""
        task = Task(
            id=1,
            title="Important meeting",
            due_date=datetime(2025, 12, 10, 14, 0),
            reminder_offset=2.0,  # 2 hours before
        )

        reminder = notifications.create_reminder(task)

        assert reminder is not None
        assert reminder.task_id == 1
        assert reminder.status == "pending"
        assert reminder.reminder_time == datetime(2025, 12, 10, 12, 0)
        assert "Important meeting" in reminder.notification_message

    def test_create_reminder_no_offset(self):
        """Test that no reminder is created when reminder_offset is None."""
        task = Task(
            id=1,
            title="No reminder task",
            due_date=datetime(2025, 12, 10, 14, 0),
            reminder_offset=None,
        )

        reminder = notifications.create_reminder(task)

        assert reminder is None

    def test_create_reminder_no_due_date(self):
        """Test that no reminder is created when due_date is None."""
        # Create task without reminder_offset first
        task = Task(
            id=1,
            title="No due date task",
            due_date=None,
            reminder_offset=None,
        )

        # This function should return None for tasks without due_date
        reminder = notifications.create_reminder(task)

        assert reminder is None


class TestTriggerNotification:
    """Test trigger_notification function."""

    def test_trigger_notification_success(self):
        """Test triggering notification with valid task and message."""
        task = Task(
            id=1,
            title="Test task",
            due_date=datetime(2025, 12, 10, 14, 0),
        )

        result = notifications.trigger_notification(task, "Reminder: Test task")

        assert result is True

    def test_trigger_notification_empty_message(self):
        """Test triggering notification with empty message returns False."""
        task = Task(
            id=1,
            title="Test task",
        )

        result = notifications.trigger_notification(task, "")

        assert result is False

    def test_trigger_notification_none_task(self):
        """Test triggering notification with None task returns False."""
        result = notifications.trigger_notification(None, "Test message")

        assert result is False


class TestIntegrationScenarios:
    """Integration tests for complete reminder workflows."""

    def test_complete_reminder_workflow(self):
        """Test complete flow: create task → create reminder → check trigger."""
        # Step 1: Create task with reminder
        due_date = datetime.now() + timedelta(hours=3)
        task = Task(
            id=1,
            title="Team standup",
            due_date=due_date,
            reminder_offset=1.0,  # Remind 1 hour before
        )

        # Step 2: Create reminder
        reminder = notifications.create_reminder(task)
        assert reminder is not None
        assert reminder.task_id == 1
        assert reminder.status == "pending"

        # Step 3: Check reminder shouldn't trigger yet (2 hours away)
        now = datetime.now()
        should_trigger = notifications.should_trigger_reminder(reminder, now)
        assert should_trigger is False

        # Step 4: Simulate time passing (2 hours later)
        future_time = now + timedelta(hours=2)
        should_trigger = notifications.should_trigger_reminder(reminder, future_time)
        assert should_trigger is True

    def test_reminder_with_past_due_date(self):
        """Test reminder for task that's already overdue."""
        # Task due 1 hour ago, remind 2 hours before
        past_due = datetime.now() - timedelta(hours=1)
        task = Task(
            id=1,
            title="Overdue task",
            due_date=past_due,
            reminder_offset=2.0,
        )

        reminder = notifications.create_reminder(task)
        assert reminder is not None

        # Reminder time was 3 hours ago
        now = datetime.now()
        should_trigger = notifications.should_trigger_reminder(reminder, now)
        assert should_trigger is True  # Should trigger immediately for past reminders

    def test_multiple_reminders_different_tasks(self):
        """Test managing reminders for multiple tasks."""
        now = datetime.now()

        # Task 1: Due in 4 hours, remind 1 hour before
        task1 = Task(
            id=1,
            title="Task 1",
            due_date=now + timedelta(hours=4),
            reminder_offset=1.0,
        )

        # Task 2: Due in 2 hours, remind 1 hour before
        task2 = Task(
            id=2,
            title="Task 2",
            due_date=now + timedelta(hours=2),
            reminder_offset=1.0,
        )

        reminder1 = notifications.create_reminder(task1)
        reminder2 = notifications.create_reminder(task2)

        # Neither should trigger yet
        assert not notifications.should_trigger_reminder(reminder1, now)
        assert not notifications.should_trigger_reminder(reminder2, now)

        # After 1.5 hours, only task2 reminder should trigger
        future = now + timedelta(hours=1.5)
        assert not notifications.should_trigger_reminder(reminder1, future)
        assert notifications.should_trigger_reminder(reminder2, future)

    def test_notification_message_formatting_integration(self):
        """Test that notification messages are properly formatted in workflow."""
        task = Task(
            id=1,
            title="Code review",
            description="Review PR #123",
            due_date=datetime(2025, 12, 10, 15, 30),
            reminder_offset=0.5,  # 30 minutes before
        )

        reminder = notifications.create_reminder(task)

        # Check message format
        assert "Code review" in reminder.notification_message
        assert "2025-12-10 15:30" in reminder.notification_message

        # Test trigger notification
        result = notifications.trigger_notification(task, reminder.notification_message)
        assert result is True
