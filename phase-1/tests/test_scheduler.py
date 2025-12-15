"""Tests for recurring task scheduler."""

from datetime import datetime

from src.todo.models import Task, Priority, RecurrencePattern
from src.todo import scheduler


class TestCalculateNextDueDate:
    """Test next due date calculation for recurring tasks."""

    def test_calculate_next_due_date_daily(self):
        """Test daily recurrence calculation."""
        current_due = datetime(2025, 12, 1, 14, 30)
        next_due = scheduler.calculate_next_due_date(
            current_due, RecurrencePattern.DAILY
        )

        expected = datetime(2025, 12, 2, 14, 30)
        assert next_due == expected

    def test_calculate_next_due_date_weekly(self):
        """Test weekly recurrence calculation."""
        current_due = datetime(2025, 12, 1, 14, 30)
        next_due = scheduler.calculate_next_due_date(
            current_due, RecurrencePattern.WEEKLY
        )

        expected = datetime(2025, 12, 8, 14, 30)
        assert next_due == expected

    def test_calculate_next_due_date_biweekly(self):
        """Test biweekly recurrence calculation."""
        current_due = datetime(2025, 12, 1, 14, 30)
        next_due = scheduler.calculate_next_due_date(
            current_due, RecurrencePattern.BIWEEKLY
        )

        expected = datetime(2025, 12, 15, 14, 30)
        assert next_due == expected

    def test_calculate_next_due_date_monthly(self):
        """Test monthly recurrence calculation."""
        current_due = datetime(2025, 12, 1, 14, 30)
        next_due = scheduler.calculate_next_due_date(
            current_due, RecurrencePattern.MONTHLY
        )

        expected = datetime(2026, 1, 1, 14, 30)
        assert next_due == expected

    def test_calculate_next_due_date_yearly(self):
        """Test yearly recurrence calculation."""
        current_due = datetime(2025, 12, 1, 14, 30)
        next_due = scheduler.calculate_next_due_date(
            current_due, RecurrencePattern.YEARLY
        )

        expected = datetime(2026, 12, 1, 14, 30)
        assert next_due == expected


class TestRecurrenceEdgeCases:
    """Test edge cases in recurrence calculation."""

    def test_recurrence_month_end_edge_case(self):
        """Test monthly recurrence at month end (e.g., Jan 31 → Feb 28)."""
        # January 31st should become February 28th (or 29th in leap year)
        jan_31 = datetime(2025, 1, 31, 14, 30)
        next_due = scheduler.calculate_next_due_date(jan_31, RecurrencePattern.MONTHLY)

        # 2025 is not a leap year, so Feb has 28 days
        # dateutil.rrule handles this by moving to the last day of Feb
        assert next_due.month == 2
        assert next_due.day in [28, 29]  # Allow for leap year handling

    def test_recurrence_leap_year_edge_case(self):
        """Test yearly recurrence with leap year (Feb 29)."""
        # Feb 29, 2024 (leap year) → Feb 28, 2025 (non-leap year)
        feb_29_2024 = datetime(2024, 2, 29, 14, 30)
        next_due = scheduler.calculate_next_due_date(
            feb_29_2024, RecurrencePattern.YEARLY
        )

        # Should handle gracefully - either Feb 28 or 29 depending on year
        assert next_due.year == 2025
        assert next_due.month == 2
        assert next_due.day in [28, 29]


class TestCreateRecurringInstance:
    """Test creating new recurring task instances."""

    def test_create_recurring_instance(self):
        """Test creating new task instance with updated due date."""
        original = Task(
            id=1,
            title="Weekly meeting",
            description="Team standup",
            priority=Priority.HIGH,
            tags=["Work", "Meeting"],
            due_date=datetime(2025, 12, 1, 14, 30),
            recurrence=RecurrencePattern.WEEKLY,
        )

        new_task = scheduler.create_recurring_instance(original, next_task_id=2)

        # Check new task has same properties except id and due_date
        assert new_task.id == 2
        assert new_task.title == original.title
        assert new_task.description == original.description
        assert new_task.priority == original.priority
        assert new_task.tags == original.tags
        assert new_task.recurrence == original.recurrence
        assert new_task.status == "incomplete"
        assert new_task.completed_date is None

        # Due date should be one week later
        expected_due = datetime(2025, 12, 8, 14, 30)
        assert new_task.due_date == expected_due

    def test_create_recurring_instance_preserves_reminder(self):
        """Test that recurring instance preserves reminder offset."""
        original = Task(
            id=1,
            title="Task with reminder",
            due_date=datetime(2025, 12, 1, 14, 30),
            recurrence=RecurrencePattern.DAILY,
            reminder_offset=2.0,  # 2 hours before
        )

        new_task = scheduler.create_recurring_instance(original, next_task_id=2)

        assert new_task.reminder_offset == 2.0
