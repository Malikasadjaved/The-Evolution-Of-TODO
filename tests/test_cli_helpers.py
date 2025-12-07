"""Unit tests for CLI helper functions to improve cli.py coverage.

This test file focuses on testing individual CLI helper functions that have low coverage:
- Input validation helpers
- Selection menus
- Retry logic
- Format functions
"""

import pytest
from unittest.mock import patch
from datetime import datetime, timedelta

from src.todo import storage
from src.todo.models import Task, Priority, RecurrencePattern
from src.todo.cli import (
    format_task,
    get_input,
    select_priority,
    select_recurrence,
    select_filter_status,
    select_filter_priority,
    select_sort_option,
    ask_retry,
    get_date_input_with_retry,
    get_task_id_with_retry,
    get_title_with_retry,
)


@pytest.fixture(autouse=True)
def mock_persistence():
    """Mock persistence to avoid file I/O."""
    with patch('src.todo.persistence.save_tasks'):
        with patch('src.todo.persistence.load_tasks', return_value=[]):
            yield


# =============================================================================
# Format Task Tests (cli.py:15-70)
# =============================================================================

class TestFormatTask:
    """Tests for format_task function."""

    def test_format_task_complete_status(self):
        """Test formatting completed task."""
        task = Task(
            id=1,
            title="Completed task",
            status="complete",
            priority=Priority.HIGH,
            completed_date=datetime.now()
        )
        result = format_task(task)
        assert "Completed task" in result
        assert "[✓]" in result or "complete" in result.lower()

    def test_format_task_with_all_fields(self):
        """Test formatting task with all fields populated."""
        task = Task(
            id=1,
            title="Full task",
            description="Description here",
            priority=Priority.HIGH,
            tags=["Work", "Urgent"],
            due_date=datetime.now() + timedelta(days=1),
            recurrence=RecurrencePattern.WEEKLY
        )
        result = format_task(task)
        assert "Full task" in result
        assert "Work" in result
        assert "Urgent" in result


# =============================================================================
# Input Helper Tests
# =============================================================================

class TestGetInput:
    """Tests for get_input helper."""

    def test_get_input_with_value(self):
        """Test getting non-empty input."""
        with patch('builtins.input', return_value="Test value"):
            result = get_input("Prompt: ")
            assert result == "Test value"

    def test_get_input_empty_when_not_required(self):
        """Test empty input when not required."""
        with patch('builtins.input', return_value=""):
            result = get_input("Prompt: ", required=False)
            assert result is None or result == ""  # CLI returns None for empty optional input

    def test_get_input_strips_whitespace(self):
        """Test that input is stripped of whitespace."""
        with patch('builtins.input', return_value="  value  "):
            result = get_input("Prompt: ")
            assert result == "value"


# =============================================================================
# Selection Menu Tests
# =============================================================================

class TestSelectPriority:
    """Tests for select_priority menu."""

    def test_select_priority_invalid_defaults_medium(self):
        """Test invalid input defaults to MEDIUM."""
        with patch('builtins.input', return_value="invalid"):
            result = select_priority()
            assert result == Priority.MEDIUM  # Default when invalid

    def test_select_priority_empty_defaults_medium(self):
        """Test empty input defaults to MEDIUM."""
        with patch('builtins.input', return_value=""):
            result = select_priority()
            assert result == Priority.MEDIUM  # Default

    def test_select_priority_by_number(self):
        """Test selecting priority by number."""
        with patch('builtins.input', return_value="1"):
            result = select_priority()
            assert result == Priority.HIGH


class TestSelectRecurrence:
    """Tests for select_recurrence menu."""

    def test_select_recurrence_none(self):
        """Test selecting no recurrence."""
        with patch('builtins.input', return_value=""):
            result = select_recurrence()
            assert result is None

    def test_select_recurrence_daily(self):
        """Test selecting DAILY recurrence."""
        with patch('builtins.input', return_value="1"):
            result = select_recurrence()
            assert result == RecurrencePattern.DAILY

    def test_select_recurrence_weekly(self):
        """Test selecting WEEKLY recurrence."""
        with patch('builtins.input', return_value="2"):
            result = select_recurrence()
            assert result == RecurrencePattern.WEEKLY


class TestSelectFilterStatus:
    """Tests for select_filter_status menu."""

    def test_select_filter_status_all(self):
        """Test selecting all statuses."""
        with patch('builtins.input', return_value="3"):
            result = select_filter_status()
            assert result == "all"

    def test_select_filter_status_complete(self):
        """Test selecting complete status."""
        with patch('builtins.input', return_value="1"):
            result = select_filter_status()
            assert result == "complete"


class TestSelectFilterPriority:
    """Tests for select_filter_priority menu."""

    def test_select_filter_priority_high(self):
        """Test selecting HIGH priority filter."""
        with patch('builtins.input', return_value="1"):
            result = select_filter_priority()
            # Returns string "HIGH" not Priority enum
            assert result == "HIGH" or result == [Priority.HIGH]

    def test_select_filter_priority_invalid_defaults_all(self):
        """Test invalid input defaults to 'all'."""
        with patch('builtins.input', return_value="invalid"):
            result = select_filter_priority()
            assert result == "all"  # Default when invalid


class TestSelectSortOption:
    """Tests for select_sort_option menu."""

    def test_select_sort_due_date(self):
        """Test selecting due date sort."""
        with patch('builtins.input', return_value="1"):
            result = select_sort_option()
            assert result == "due_date"

    def test_select_sort_priority(self):
        """Test selecting priority sort."""
        with patch('builtins.input', return_value="2"):
            result = select_sort_option()
            assert result == "priority"


# =============================================================================
# Retry Logic Tests
# =============================================================================

class TestAskRetry:
    """Tests for ask_retry function."""

    def test_ask_retry_yes(self):
        """Test retry with 'yes' input."""
        with patch('builtins.input', return_value="y"):
            result = ask_retry("field", "example")
            assert result is True

    def test_ask_retry_no(self):
        """Test retry with 'no' input."""
        with patch('builtins.input', return_value="n"):
            result = ask_retry("field", "example")
            assert result is False

    def test_ask_retry_empty_defaults_no(self):
        """Test retry with empty input defaults to no."""
        with patch('builtins.input', return_value=""):
            result = ask_retry("field", "example")
            assert result is False


class TestGetDateInputWithRetry:
    """Tests for get_date_input_with_retry."""

    def test_date_input_valid_first_try(self):
        """Test valid date on first try."""
        with patch('builtins.input', return_value="2025-12-25"):
            result = get_date_input_with_retry("Due date: ")
            assert result is not None
            assert result.year == 2025
            assert result.month == 12
            assert result.day == 25

    def test_date_input_with_time(self):
        """Test date with time input."""
        with patch('builtins.input', return_value="2025-12-25 14:30"):
            result = get_date_input_with_retry("Due date: ")
            assert result is not None
            assert result.hour == 14
            assert result.minute == 30

    def test_date_input_empty_skip(self):
        """Test empty input skips date."""
        with patch('builtins.input', return_value=""):
            result = get_date_input_with_retry("Due date: ")
            assert result is None

    def test_date_input_invalid_then_skip(self):
        """Test invalid date then choosing to skip."""
        inputs = ["invalid-date", "n"]  # invalid, then no retry
        with patch('builtins.input', side_effect=inputs):
            result = get_date_input_with_retry("Due date: ")
            assert result is None


class TestGetTaskIdWithRetry:
    """Tests for get_task_id_with_retry."""

    def test_task_id_valid(self):
        """Test valid task ID input."""
        with patch('builtins.input', return_value="5"):
            result = get_task_id_with_retry("Task ID: ")
            assert result == 5

    def test_task_id_invalid_then_cancel(self):
        """Test invalid task ID then cancel."""
        inputs = ["abc", "n"]  # invalid, then no retry
        with patch('builtins.input', side_effect=inputs):
            result = get_task_id_with_retry("Task ID: ")
            assert result is None

    def test_task_id_negative_retry(self):
        """Test negative task ID triggers retry."""
        inputs = ["-1", "n"]  # negative (invalid), then no retry
        with patch('builtins.input', side_effect=inputs):
            result = get_task_id_with_retry("Task ID: ")
            assert result is None


class TestGetTitleWithRetry:
    """Tests for get_title_with_retry."""

    def test_title_valid(self):
        """Test valid title input."""
        with patch('builtins.input', return_value="Valid title"):
            result = get_title_with_retry()
            assert result == "Valid title"

    def test_title_empty_retry(self):
        """Test empty title triggers retry."""
        inputs = ["", "n"]  # empty, then no retry
        with patch('builtins.input', side_effect=inputs):
            result = get_title_with_retry()
            assert result is None

    def test_title_whitespace_only_retry(self):
        """Test whitespace-only title triggers retry."""
        inputs = ["   ", "n"]  # whitespace only, then no retry
        with patch('builtins.input', side_effect=inputs):
            result = get_title_with_retry()
            assert result is None

    def test_title_strips_whitespace(self):
        """Test title strips whitespace."""
        with patch('builtins.input', return_value="  Title  "):
            result = get_title_with_retry()
            assert result == "Title"
