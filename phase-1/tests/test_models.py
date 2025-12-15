"""Tests for Task data model and enums."""

import pytest
from datetime import datetime
from src.todo.models import Task, Priority, TaskType, RecurrencePattern, Reminder


class TestTaskCreation:
    """Test Task creation with various configurations."""

    def test_task_creation_with_defaults(self):
        """Test creating a task with default values."""
        task = Task(
            id=1,
            title="Test Task",
        )
        assert task.id == 1
        assert task.title == "Test Task"
        assert task.description == ""
        assert task.status == "incomplete"
        assert task.priority == Priority.MEDIUM
        assert task.tags == []
        assert isinstance(task.created_date, datetime)
        assert task.due_date is None
        assert task.recurrence is None
        assert task.completed_date is None

    def test_task_validation_empty_title(self):
        """Test that empty title raises ValueError."""
        with pytest.raises(ValueError, match="Title"):
            Task(id=1, title="")

    def test_task_validation_whitespace_only_title(self):
        """Test that whitespace-only title raises ValueError."""
        with pytest.raises(ValueError, match="Title"):
            Task(id=1, title="   ")


class TestPriorityEnum:
    """Test Priority enumeration."""

    def test_priority_enum_values(self):
        """Test all priority enum values exist."""
        assert Priority.HIGH.value == "HIGH"
        assert Priority.MEDIUM.value == "MEDIUM"
        assert Priority.LOW.value == "LOW"

    def test_priority_enum_count(self):
        """Test that there are exactly 3 priority levels."""
        assert len(Priority) == 3


class TestTaskComputedProperties:
    """Test Task computed properties."""

    def test_task_is_overdue_computed_property(self):
        """Test is_overdue property returns True for past due dates."""
        # Task with past due date
        past_date = datetime(2020, 1, 1)
        task = Task(id=1, title="Overdue Task", due_date=past_date, status="incomplete")
        assert task.is_overdue is True

    def test_task_is_not_overdue_future_date(self):
        """Test is_overdue returns False for future due dates."""
        # Task with future due date
        future_date = datetime(2099, 12, 31)
        task = Task(
            id=1, title="Future Task", due_date=future_date, status="incomplete"
        )
        assert task.is_overdue is False

    def test_task_is_not_overdue_no_due_date(self):
        """Test is_overdue returns False when no due date."""
        task = Task(id=1, title="No Due Date")
        assert task.is_overdue is False

    def test_task_is_not_overdue_when_complete(self):
        """Test is_overdue returns False for completed tasks even if past due."""
        past_date = datetime(2020, 1, 1)
        task = Task(id=1, title="Completed Task", due_date=past_date, status="complete")
        assert task.is_overdue is False

    def test_task_type_computed_property(self):
        """Test task_type property returns SCHEDULED when due_date exists."""
        task_with_due = Task(
            id=1, title="Scheduled Task", due_date=datetime(2025, 12, 31)
        )
        assert task_with_due.task_type == TaskType.SCHEDULED

    def test_task_type_activity_no_due_date(self):
        """Test task_type returns ACTIVITY when no due_date."""
        task_no_due = Task(id=1, title="Activity Task")
        assert task_no_due.task_type == TaskType.ACTIVITY


class TestTaskTypeEnum:
    """Test TaskType enumeration."""

    def test_task_type_enum_values(self):
        """Test TaskType enum values."""
        assert TaskType.SCHEDULED.value == "scheduled"
        assert TaskType.ACTIVITY.value == "activity"

    def test_task_type_enum_count(self):
        """Test that there are exactly 2 task types."""
        assert len(TaskType) == 2


class TestPriorityValidation:
    """Test Priority validation (US2)."""

    def test_priority_validation_invalid_value(self):
        """Test that invalid priority string cannot be used directly."""
        # Priority is an enum, so invalid values can't be assigned directly
        # This tests that only valid Priority enum values work
        task = Task(id=1, title="Test", priority=Priority.HIGH)
        assert task.priority == Priority.HIGH

        # Attempting to use invalid string would fail at type level
        with pytest.raises((ValueError, KeyError, AttributeError)):
            Priority["INVALID"]


class TestTagsFeatures:
    """Test Tags functionality (US2)."""

    def test_tags_multiple_per_task(self):
        """Test that multiple tags can be assigned to a task."""
        task = Task(
            id=1, title="Multi-tag Task", tags=["Work", "Urgent", "Meeting", "Q4"]
        )
        assert len(task.tags) == 4
        assert "Work" in task.tags
        assert "Urgent" in task.tags
        assert "Meeting" in task.tags
        assert "Q4" in task.tags

    def test_tags_special_characters(self):
        """Test that tags can contain special characters."""
        task = Task(
            id=1,
            title="Special Tags",
            tags=["Work-2024", "Project_X", "Team:Backend", "Status:In-Progress"],
        )
        assert len(task.tags) == 4
        assert "Work-2024" in task.tags
        assert "Project_X" in task.tags
        assert "Team:Backend" in task.tags
        assert "Status:In-Progress" in task.tags


class TestDueDateFeatures:
    """Test due date functionality (US3)."""

    def test_task_with_due_date(self):
        """Test creating task with due date."""
        due_date = datetime(2025, 12, 31, 14, 30)
        task = Task(id=1, title="Task with deadline", due_date=due_date)

        assert task.due_date == due_date
        assert task.task_type == TaskType.SCHEDULED

    def test_overdue_detection_logic(self):
        """Test overdue detection for past due dates."""
        # Past due date - should be overdue
        past_task = Task(
            id=1,
            title="Past Due",
            due_date=datetime(2020, 1, 1),
            status="incomplete",
        )
        assert past_task.is_overdue is True

        # Future due date - not overdue
        future_task = Task(
            id=2,
            title="Future Due",
            due_date=datetime(2099, 12, 31),
            status="incomplete",
        )
        assert future_task.is_overdue is False

        # No due date - not overdue
        no_due_task = Task(id=3, title="No Due Date")
        assert no_due_task.is_overdue is False

        # Completed task even with past due - not overdue
        completed_task = Task(
            id=4,
            title="Completed",
            due_date=datetime(2020, 1, 1),
            status="complete",
        )
        assert completed_task.is_overdue is False

    def test_task_type_scheduled_vs_activity(self):
        """Test task_type property distinguishes scheduled vs activity."""
        # Task with due date is SCHEDULED
        scheduled = Task(id=1, title="Scheduled", due_date=datetime(2025, 12, 31))
        assert scheduled.task_type == TaskType.SCHEDULED

        # Task without due date is ACTIVITY
        activity = Task(id=2, title="Activity")
        assert activity.task_type == TaskType.ACTIVITY


class TestRecurrenceValidation:
    """Test recurrence pattern validation."""

    def test_recurrence_requires_due_date(self):
        """Test that recurrence pattern requires a due date."""
        with pytest.raises(ValueError, match="Recurrence pattern requires due date"):
            Task(
                id=1,
                title="Recurring without due",
                recurrence=RecurrencePattern.DAILY,
            )

    def test_recurrence_with_due_date_is_valid(self):
        """Test that recurrence with due date is valid."""
        task = Task(
            id=1,
            title="Valid recurring task",
            due_date=datetime(2025, 12, 31),
            recurrence=RecurrencePattern.WEEKLY,
        )
        assert task.recurrence == RecurrencePattern.WEEKLY


class TestReminderValidation:
    """Test reminder validation."""

    def test_reminder_requires_due_date(self):
        """Test that reminder_offset requires a due date."""
        with pytest.raises(ValueError, match="Reminder requires due date"):
            Task(
                id=1,
                title="Reminder without due",
                reminder_offset=2.0,
            )

    def test_reminder_with_due_date_is_valid(self):
        """Test that reminder with due date is valid."""
        task = Task(
            id=1,
            title="Task with reminder",
            due_date=datetime(2025, 12, 31, 14, 0),
            reminder_offset=1.0,  # 1 hour before
        )
        assert task.reminder_offset == 1.0


class TestReminderClass:
    """Test Reminder class."""

    def test_reminder_creation(self):
        """Test creating a reminder."""
        reminder = Reminder(
            task_id=1,
            reminder_time=datetime(2025, 12, 31, 13, 0),
            notification_message="Task due in 1 hour",
        )
        assert reminder.task_id == 1
        assert reminder.status == "pending"
        assert reminder.notification_message == "Task due in 1 hour"

    def test_reminder_invalid_status(self):
        """Test that invalid reminder status raises ValueError."""
        with pytest.raises(
            ValueError, match="Status must be pending/triggered/cancelled/missed"
        ):
            Reminder(
                task_id=1,
                reminder_time=datetime(2025, 12, 31),
                status="invalid",
            )

    def test_reminder_valid_statuses(self):
        """Test all valid reminder statuses."""
        for status in ["pending", "triggered", "cancelled", "missed"]:
            reminder = Reminder(
                task_id=1,
                reminder_time=datetime(2025, 12, 31),
                status=status,
            )
            assert reminder.status == status
