"""Tests for CLI interface."""

from datetime import datetime

from src.todo.cli import format_task, display_menu
from src.todo.models import Task, Priority


class TestFormatTask:
    """Test format_task function."""

    def test_format_task_output(self):
        """Test that format_task returns formatted string."""
        task = Task(
            id=1,
            title="Test Task",
            description="Description",
            status="incomplete",
            priority=Priority.HIGH,
        )

        output = format_task(task)

        assert "1" in output  # ID
        assert "Test Task" in output  # Title
        assert "HIGH" in output or "[H]" in output  # Priority indicator

    def test_format_task_with_overdue(self):
        """Test format_task shows overdue indicator."""
        task = Task(
            id=1,
            title="Overdue Task",
            due_date=datetime(2020, 1, 1),
            status="incomplete",
        )

        output = format_task(task)

        assert "[!]" in output or "overdue" in output.lower()


class TestDisplayMenu:
    """Test display_menu function."""

    def test_menu_display(self, capsys):
        """Test that display_menu prints the menu."""
        display_menu()

        captured = capsys.readouterr()
        output = captured.out

        # Check for tier labels
        assert "PRIMARY" in output or "Core" in output
        assert "INTERMEDIATE" in output or "Organization" in output
        assert "ADVANCED" in output or "Automation" in output

        # Check for basic options
        assert "Add" in output or "1" in output
        assert "View" in output or "2" in output
        assert "Exit" in output or "0" in output


class TestPriorityDisplay:
    """Test priority display indicators (US2)."""

    def test_priority_display_indicators(self):
        """Test that priority indicators are displayed correctly."""
        # Test HIGH priority
        high_task = Task(id=1, title="High Priority", priority=Priority.HIGH)
        high_output = format_task(high_task)
        assert "[H]" in high_output

        # Test MEDIUM priority
        medium_task = Task(id=2, title="Medium Priority", priority=Priority.MEDIUM)
        medium_output = format_task(medium_task)
        assert "[M]" in medium_output

        # Test LOW priority
        low_task = Task(id=3, title="Low Priority", priority=Priority.LOW)
        low_output = format_task(low_task)
        assert "[L]" in low_output

    def test_tags_display_with_visual_separators(self):
        """Test that tags are displayed with visual separators."""
        task = Task(id=1, title="Tagged Task", tags=["Work", "Urgent", "Meeting"])
        output = format_task(task)

        # Check that tags appear in output
        assert "Work" in output
        assert "Urgent" in output
        assert "Meeting" in output

        # Check for tag separator (# symbol from cli.py)
        assert "#" in output


class TestDueDateDisplay:
    """Test due date and overdue indicators (US3)."""

    def test_overdue_indicator_display(self):
        """Test that overdue indicator [!] is displayed for past due tasks."""
        # Overdue incomplete task
        overdue_task = Task(
            id=1,
            title="Overdue Task",
            due_date=datetime(2020, 1, 1),
            status="incomplete",
        )
        overdue_output = format_task(overdue_task)
        assert "[!]" in overdue_output

        # Future task - no overdue indicator
        future_task = Task(id=2, title="Future Task", due_date=datetime(2099, 12, 31))
        future_output = format_task(future_task)
        assert "[!]" not in future_output

    def test_due_date_formatting(self):
        """Test that due dates are displayed in correct format."""
        task_with_date = Task(
            id=1, title="Task with due date", due_date=datetime(2025, 12, 31, 14, 30)
        )
        output = format_task(task_with_date)

        # Check for date components
        assert "2025-12-31" in output
        assert "14:30" in output
        assert "Due:" in output or "due" in output.lower()

    def test_task_type_display(self):
        """Test that task type is displayed correctly."""
        # Scheduled task
        scheduled = Task(id=1, title="Scheduled", due_date=datetime(2025, 12, 31))
        scheduled_output = format_task(scheduled)
        assert "[scheduled]" in scheduled_output

        # Activity task
        activity = Task(id=2, title="Activity")
        activity_output = format_task(activity)
        assert "[activity]" in activity_output


class TestSelectPriority:
    """Test priority selection menu (F013 - User Story 1)."""

    def test_select_priority_high(self, monkeypatch):
        """Test selecting HIGH priority (option 1)."""
        from src.todo.cli import select_priority

        monkeypatch.setattr("builtins.input", lambda _: "1")
        priority = select_priority()
        assert priority == Priority.HIGH

    def test_select_priority_medium(self, monkeypatch):
        """Test selecting MEDIUM priority (option 2)."""
        from src.todo.cli import select_priority

        monkeypatch.setattr("builtins.input", lambda _: "2")
        priority = select_priority()
        assert priority == Priority.MEDIUM

    def test_select_priority_low(self, monkeypatch):
        """Test selecting LOW priority (option 3)."""
        from src.todo.cli import select_priority

        monkeypatch.setattr("builtins.input", lambda _: "3")
        priority = select_priority()
        assert priority == Priority.LOW

    def test_select_priority_default_empty_input(self, monkeypatch):
        """Test that empty input defaults to MEDIUM."""
        from src.todo.cli import select_priority

        monkeypatch.setattr("builtins.input", lambda _: "")
        priority = select_priority()
        assert priority == Priority.MEDIUM

    def test_select_priority_invalid_input(self, monkeypatch, capsys):
        """Test that invalid input defaults to MEDIUM with error message."""
        from src.todo.cli import select_priority

        monkeypatch.setattr("builtins.input", lambda _: "99")
        priority = select_priority()
        assert priority == Priority.MEDIUM

        captured = capsys.readouterr()
        assert "Invalid" in captured.out or "invalid" in captured.out

    def test_select_priority_invalid_text(self, monkeypatch, capsys):
        """Test that text input defaults to MEDIUM with error message."""
        from src.todo.cli import select_priority

        monkeypatch.setattr("builtins.input", lambda _: "abc")
        priority = select_priority()
        assert priority == Priority.MEDIUM

        captured = capsys.readouterr()
        assert "Invalid" in captured.out or "invalid" in captured.out


class TestSelectRecurrence:
    """Test recurrence selection menu (F013 - User Story 2)."""

    def test_select_recurrence_none(self, monkeypatch):
        """Test selecting no recurrence (option 0)."""
        from src.todo.cli import select_recurrence

        monkeypatch.setattr("builtins.input", lambda _: "0")
        recurrence = select_recurrence()
        assert recurrence is None

    def test_select_recurrence_daily(self, monkeypatch):
        """Test selecting DAILY recurrence (option 1)."""
        from src.todo.cli import select_recurrence
        from src.todo.models import RecurrencePattern

        monkeypatch.setattr("builtins.input", lambda _: "1")
        recurrence = select_recurrence()
        assert recurrence == RecurrencePattern.DAILY

    def test_select_recurrence_weekly(self, monkeypatch):
        """Test selecting WEEKLY recurrence (option 2)."""
        from src.todo.cli import select_recurrence
        from src.todo.models import RecurrencePattern

        monkeypatch.setattr("builtins.input", lambda _: "2")
        recurrence = select_recurrence()
        assert recurrence == RecurrencePattern.WEEKLY

    def test_select_recurrence_biweekly(self, monkeypatch):
        """Test selecting BIWEEKLY recurrence (option 3)."""
        from src.todo.cli import select_recurrence
        from src.todo.models import RecurrencePattern

        monkeypatch.setattr("builtins.input", lambda _: "3")
        recurrence = select_recurrence()
        assert recurrence == RecurrencePattern.BIWEEKLY

    def test_select_recurrence_monthly(self, monkeypatch):
        """Test selecting MONTHLY recurrence (option 4)."""
        from src.todo.cli import select_recurrence
        from src.todo.models import RecurrencePattern

        monkeypatch.setattr("builtins.input", lambda _: "4")
        recurrence = select_recurrence()
        assert recurrence == RecurrencePattern.MONTHLY

    def test_select_recurrence_yearly(self, monkeypatch):
        """Test selecting YEARLY recurrence (option 5)."""
        from src.todo.cli import select_recurrence
        from src.todo.models import RecurrencePattern

        monkeypatch.setattr("builtins.input", lambda _: "5")
        recurrence = select_recurrence()
        assert recurrence == RecurrencePattern.YEARLY

    def test_select_recurrence_default_empty_input(self, monkeypatch):
        """Test that empty input returns None (no recurrence)."""
        from src.todo.cli import select_recurrence

        monkeypatch.setattr("builtins.input", lambda _: "")
        recurrence = select_recurrence()
        assert recurrence is None

    def test_select_recurrence_invalid_input(self, monkeypatch, capsys):
        """Test that invalid input returns None with error message."""
        from src.todo.cli import select_recurrence

        monkeypatch.setattr("builtins.input", lambda _: "99")
        recurrence = select_recurrence()
        assert recurrence is None

        captured = capsys.readouterr()
        assert "Invalid" in captured.out or "invalid" in captured.out

    def test_select_recurrence_invalid_text(self, monkeypatch, capsys):
        """Test that text input returns None with error message."""
        from src.todo.cli import select_recurrence

        monkeypatch.setattr("builtins.input", lambda _: "xyz")
        recurrence = select_recurrence()
        assert recurrence is None

        captured = capsys.readouterr()
        assert "Invalid" in captured.out or "invalid" in captured.out


class TestSelectStatusAction:
    """Test status mark submenu (F014 - User Story 1)."""

    def test_select_status_action_complete(self, monkeypatch):
        """Test selecting 'Mark Complete' from Status Mark submenu (option A)."""
        from src.todo.cli import select_status_action

        monkeypatch.setattr("builtins.input", lambda _: "A")
        action = select_status_action()
        assert action == "complete"

    def test_select_status_action_complete_lowercase(self, monkeypatch):
        """Test selecting 'Mark Complete' with lowercase 'a'."""
        from src.todo.cli import select_status_action

        monkeypatch.setattr("builtins.input", lambda _: "a")
        action = select_status_action()
        assert action == "complete"

    def test_select_status_action_incomplete(self, monkeypatch):
        """Test selecting 'Mark Incomplete' from Status Mark submenu (option B)."""
        from src.todo.cli import select_status_action

        monkeypatch.setattr("builtins.input", lambda _: "B")
        action = select_status_action()
        assert action == "incomplete"

    def test_select_status_action_incomplete_lowercase(self, monkeypatch):
        """Test selecting 'Mark Incomplete' with lowercase 'b'."""
        from src.todo.cli import select_status_action

        monkeypatch.setattr("builtins.input", lambda _: "b")
        action = select_status_action()
        assert action == "incomplete"

    def test_select_status_action_back(self, monkeypatch):
        """Test selecting 'Back' from Status Mark submenu (option 0)."""
        from src.todo.cli import select_status_action

        monkeypatch.setattr("builtins.input", lambda _: "0")
        action = select_status_action()
        assert action == "back"

    def test_select_status_action_invalid(self, monkeypatch, capsys):
        """Test invalid input defaults to 'back' with error message."""
        from src.todo.cli import select_status_action

        monkeypatch.setattr("builtins.input", lambda _: "X")
        action = select_status_action()
        assert action == "back"

        captured = capsys.readouterr()
        assert "Invalid" in captured.out or "invalid" in captured.out


class TestSelectFilterStatus:
    """Test filter status selection menu (F014 - User Story 2)."""

    def test_select_filter_status_complete(self, monkeypatch):
        """Test selecting 'complete' status filter (option 1)."""
        from src.todo.cli import select_filter_status

        monkeypatch.setattr("builtins.input", lambda _: "1")
        status = select_filter_status()
        assert status == "complete"

    def test_select_filter_status_incomplete(self, monkeypatch):
        """Test selecting 'incomplete' status filter (option 2)."""
        from src.todo.cli import select_filter_status

        monkeypatch.setattr("builtins.input", lambda _: "2")
        status = select_filter_status()
        assert status == "incomplete"

    def test_select_filter_status_all(self, monkeypatch):
        """Test selecting 'all' status filter (option 3)."""
        from src.todo.cli import select_filter_status

        monkeypatch.setattr("builtins.input", lambda _: "3")
        status = select_filter_status()
        assert status == "all"

    def test_select_filter_status_default(self, monkeypatch):
        """Test empty input defaults to 'all'."""
        from src.todo.cli import select_filter_status

        monkeypatch.setattr("builtins.input", lambda _: "")
        status = select_filter_status()
        assert status == "all"

    def test_select_filter_status_invalid(self, monkeypatch, capsys):
        """Test invalid input defaults to 'all' with error message."""
        from src.todo.cli import select_filter_status

        monkeypatch.setattr("builtins.input", lambda _: "99")
        status = select_filter_status()
        assert status == "all"

        captured = capsys.readouterr()
        assert "Invalid" in captured.out or "invalid" in captured.out


class TestSelectFilterPriority:
    """Test filter priority selection menu (F014 - User Story 2)."""

    def test_select_filter_priority_high(self, monkeypatch):
        """Test selecting HIGH priority filter (option 1)."""
        from src.todo.cli import select_filter_priority

        monkeypatch.setattr("builtins.input", lambda _: "1")
        priority = select_filter_priority()
        assert priority == "HIGH"

    def test_select_filter_priority_medium(self, monkeypatch):
        """Test selecting MEDIUM priority filter (option 2)."""
        from src.todo.cli import select_filter_priority

        monkeypatch.setattr("builtins.input", lambda _: "2")
        priority = select_filter_priority()
        assert priority == "MEDIUM"

    def test_select_filter_priority_low(self, monkeypatch):
        """Test selecting LOW priority filter (option 3)."""
        from src.todo.cli import select_filter_priority

        monkeypatch.setattr("builtins.input", lambda _: "3")
        priority = select_filter_priority()
        assert priority == "LOW"

    def test_select_filter_priority_all(self, monkeypatch):
        """Test selecting 'all' priority filter (option 4)."""
        from src.todo.cli import select_filter_priority

        monkeypatch.setattr("builtins.input", lambda _: "4")
        priority = select_filter_priority()
        assert priority == "all"

    def test_select_filter_priority_default(self, monkeypatch):
        """Test empty input defaults to 'all'."""
        from src.todo.cli import select_filter_priority

        monkeypatch.setattr("builtins.input", lambda _: "")
        priority = select_filter_priority()
        assert priority == "all"

    def test_select_filter_priority_invalid(self, monkeypatch, capsys):
        """Test invalid input defaults to 'all' with error message."""
        from src.todo.cli import select_filter_priority

        monkeypatch.setattr("builtins.input", lambda _: "88")
        priority = select_filter_priority()
        assert priority == "all"

        captured = capsys.readouterr()
        assert "Invalid" in captured.out or "invalid" in captured.out


class TestSelectSortOption:
    """Test sort option selection menu (F014 - User Story 2)."""

    def test_select_sort_by_due_date(self, monkeypatch):
        """Test selecting sort by due date (option 1)."""
        from src.todo.cli import select_sort_option

        monkeypatch.setattr("builtins.input", lambda _: "1")
        sort_by = select_sort_option()
        assert sort_by == "due_date"

    def test_select_sort_by_priority(self, monkeypatch):
        """Test selecting sort by priority (option 2)."""
        from src.todo.cli import select_sort_option

        monkeypatch.setattr("builtins.input", lambda _: "2")
        sort_by = select_sort_option()
        assert sort_by == "priority"

    def test_select_sort_by_title(self, monkeypatch):
        """Test selecting sort by title (option 3)."""
        from src.todo.cli import select_sort_option

        monkeypatch.setattr("builtins.input", lambda _: "3")
        sort_by = select_sort_option()
        assert sort_by == "title"

    def test_select_sort_by_created(self, monkeypatch):
        """Test selecting sort by created date (option 4)."""
        from src.todo.cli import select_sort_option

        monkeypatch.setattr("builtins.input", lambda _: "4")
        sort_by = select_sort_option()
        assert sort_by == "created"

    def test_select_sort_default(self, monkeypatch):
        """Test empty input defaults to 'due_date'."""
        from src.todo.cli import select_sort_option

        monkeypatch.setattr("builtins.input", lambda _: "")
        sort_by = select_sort_option()
        assert sort_by == "due_date"

    def test_select_sort_invalid(self, monkeypatch, capsys):
        """Test invalid input defaults to 'due_date' with error message."""
        from src.todo.cli import select_sort_option

        monkeypatch.setattr("builtins.input", lambda _: "77")
        sort_by = select_sort_option()
        assert sort_by == "due_date"

        captured = capsys.readouterr()
        assert "Invalid" in captured.out or "invalid" in captured.out


class TestAskRetry:
    """Test ask_retry helper function (F015)."""

    def test_ask_retry_yes(self, monkeypatch):
        """Test user chooses to retry (yes)."""
        from src.todo.cli import ask_retry

        monkeypatch.setattr("builtins.input", lambda _: "yes")
        result = ask_retry("due date", "2025-12-31")
        assert result is True

    def test_ask_retry_yes_short(self, monkeypatch):
        """Test user chooses to retry (y)."""
        from src.todo.cli import ask_retry

        monkeypatch.setattr("builtins.input", lambda _: "y")
        result = ask_retry("due date", "2025-12-31")
        assert result is True

    def test_ask_retry_no(self, monkeypatch):
        """Test user chooses not to retry (no)."""
        from src.todo.cli import ask_retry

        monkeypatch.setattr("builtins.input", lambda _: "no")
        result = ask_retry("due date", "2025-12-31")
        assert result is False

    def test_ask_retry_empty_default_no(self, monkeypatch):
        """Test empty input defaults to no (don't retry)."""
        from src.todo.cli import ask_retry

        monkeypatch.setattr("builtins.input", lambda _: "")
        result = ask_retry("due date", "2025-12-31")
        assert result is False


class TestGetDateInputWithRetry:
    """Test get_date_input_with_retry function (F015)."""

    def test_date_input_valid_first_try(self, monkeypatch):
        """Test valid date on first try."""
        from src.todo.cli import get_date_input_with_retry

        monkeypatch.setattr("builtins.input", lambda _: "2025-12-31")
        result = get_date_input_with_retry("Due date: ")
        assert result is not None
        assert result.year == 2025
        assert result.month == 12
        assert result.day == 31

    def test_date_input_retry_success(self, monkeypatch):
        """Test successful retry after invalid date."""
        from src.todo.cli import get_date_input_with_retry

        inputs = iter(["invalid-date", "y", "2025-12-31"])
        monkeypatch.setattr("builtins.input", lambda _: next(inputs))

        result = get_date_input_with_retry("Due date: ")
        assert result is not None
        assert result.year == 2025

    def test_date_input_retry_cancel(self, monkeypatch, capsys):
        """Test canceling retry after invalid date."""
        from src.todo.cli import get_date_input_with_retry

        inputs = iter(["invalid-date", "n"])
        monkeypatch.setattr("builtins.input", lambda _: next(inputs))

        result = get_date_input_with_retry("Due date: ")
        assert result is None

        captured = capsys.readouterr()
        assert "Example:" in captured.out or "example" in captured.out.lower()

    def test_date_input_empty_skip(self, monkeypatch):
        """Test empty input skips date (returns None)."""
        from src.todo.cli import get_date_input_with_retry

        monkeypatch.setattr("builtins.input", lambda _: "")
        result = get_date_input_with_retry("Due date: ")
        assert result is None


class TestGetTaskIdWithRetry:
    """Test get_task_id_with_retry function (F015)."""

    def test_task_id_valid_first_try(self, monkeypatch):
        """Test valid task ID on first try."""
        from src.todo.cli import get_task_id_with_retry

        monkeypatch.setattr("builtins.input", lambda _: "5")
        result = get_task_id_with_retry("Task ID: ")
        assert result == 5

    def test_task_id_retry_success(self, monkeypatch):
        """Test successful retry after invalid task ID."""
        from src.todo.cli import get_task_id_with_retry

        inputs = iter(["abc", "y", "5"])
        monkeypatch.setattr("builtins.input", lambda _: next(inputs))

        result = get_task_id_with_retry("Task ID: ")
        assert result == 5

    def test_task_id_retry_cancel(self, monkeypatch, capsys):
        """Test canceling retry after invalid task ID."""
        from src.todo.cli import get_task_id_with_retry

        inputs = iter(["abc", "n"])
        monkeypatch.setattr("builtins.input", lambda _: next(inputs))

        result = get_task_id_with_retry("Task ID: ")
        assert result is None

        captured = capsys.readouterr()
        assert "Example:" in captured.out or "example" in captured.out.lower()

    def test_task_id_negative_retry(self, monkeypatch):
        """Test retry after negative task ID."""
        from src.todo.cli import get_task_id_with_retry

        inputs = iter(["-1", "y", "3"])
        monkeypatch.setattr("builtins.input", lambda _: next(inputs))

        result = get_task_id_with_retry("Task ID: ")
        assert result == 3

    def test_task_id_zero_retry(self, monkeypatch):
        """Test retry after zero task ID."""
        from src.todo.cli import get_task_id_with_retry

        inputs = iter(["0", "y", "1"])
        monkeypatch.setattr("builtins.input", lambda _: next(inputs))

        result = get_task_id_with_retry("Task ID: ")
        assert result == 1


class TestGetTitleWithRetry:
    """Test get_title_with_retry function (F015)."""

    def test_title_valid_first_try(self, monkeypatch):
        """Test valid title on first try."""
        from src.todo.cli import get_title_with_retry

        monkeypatch.setattr("builtins.input", lambda _: "My Task")
        result = get_title_with_retry()
        assert result == "My Task"

    def test_title_retry_success(self, monkeypatch):
        """Test successful retry after empty title."""
        from src.todo.cli import get_title_with_retry

        inputs = iter(["", "y", "My Task"])
        monkeypatch.setattr("builtins.input", lambda _: next(inputs))

        result = get_title_with_retry()
        assert result == "My Task"

    def test_title_retry_cancel(self, monkeypatch, capsys):
        """Test canceling retry after empty title."""
        from src.todo.cli import get_title_with_retry

        inputs = iter(["", "n"])
        monkeypatch.setattr("builtins.input", lambda _: next(inputs))

        result = get_title_with_retry()
        assert result is None

        captured = capsys.readouterr()
        assert "Example:" in captured.out or "example" in captured.out.lower()

    def test_title_whitespace_only_retry(self, monkeypatch):
        """Test retry after whitespace-only title."""
        from src.todo.cli import get_title_with_retry

        inputs = iter(["   ", "y", "Valid Title"])
        monkeypatch.setattr("builtins.input", lambda _: next(inputs))

        result = get_title_with_retry()
        assert result == "Valid Title"

    def test_title_strips_whitespace(self, monkeypatch):
        """Test that title strips leading/trailing whitespace."""
        from src.todo.cli import get_title_with_retry

        monkeypatch.setattr("builtins.input", lambda _: "  My Task  ")
        result = get_title_with_retry()
        assert result == "My Task"
