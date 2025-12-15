"""Integration tests for commands module to improve coverage.

Focuses on error handling, edge cases, and integration scenarios.
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock

from src.todo import storage, commands
from src.todo.models import Priority, RecurrencePattern
from src.todo.commands import (
    CommandResult,
    add_task_command,
    view_all_tasks_command,
    update_task_command,
    delete_task_command,
    mark_complete_command,
    mark_incomplete_command,
    parse_priority,
    parse_date,
    parse_tags,
    parse_recurrence,
    parse_reminder_offset,
)


@pytest.fixture(autouse=True)
def reset_storage():
    """Reset storage before each test."""
    storage.tasks.clear()
    storage.task_index.clear()
    storage.next_task_id = 1
    yield
    storage.tasks.clear()
    storage.task_index.clear()
    storage.next_task_id = 1


@pytest.fixture(autouse=True)
def mock_persistence():
    """Mock persistence to avoid file I/O."""
    with patch('src.todo.persistence.save_tasks'):
        with patch('src.todo.persistence.load_tasks', return_value=[]):
            yield


# =============================================================================
# Add Task Command Integration Tests
# =============================================================================

class TestAddTaskCommandIntegration:
    """Integration tests for add_task_command."""

    def test_add_task_with_validation_error_empty_title(self):
        """Test add task with empty title raises validation error."""
        result = add_task_command(
            title="",
            description="Test",
            priority="HIGH",
            tags="Work",
            due_date_str="",
            recurrence_str="",
            reminder_offset_str=""
        )

        assert result.success is False
        assert "error" in result.message.lower() or "empty" in result.message.lower()

    def test_add_task_with_invalid_priority_string(self):
        """Test add task with invalid priority string."""
        result = add_task_command(
            title="Test task",
            description="",
            priority="INVALID",
            tags="",
            due_date_str="",
            recurrence_str="",
            reminder_offset_str=""
        )

        # Invalid priority should fail validation
        assert result.success is False
        assert "priority" in result.message.lower()

    def test_add_task_with_recurrence_no_due_date_error(self):
        """Test add task with recurrence but no due date fails."""
        result = add_task_command(
            title="Recurring task",
            description="",
            priority="MEDIUM",
            tags="",
            due_date_str="",
            recurrence_str="DAILY",
            reminder_offset_str=""
        )

        assert result.success is False
        error_text = (result.message + " " + " ".join(result.errors)).lower()
        assert "recurrence" in error_text or "due date" in error_text

    def test_add_task_with_reminder_no_due_date_error(self):
        """Test add task with reminder but no due date fails."""
        result = add_task_command(
            title="Task with reminder",
            description="",
            priority="MEDIUM",
            tags="",
            due_date_str="",
            recurrence_str="",
            reminder_offset_str="2.0"
        )

        assert result.success is False
        error_text = (result.message + " " + " ".join(result.errors)).lower()
        assert "reminder" in error_text or "due date" in error_text


# =============================================================================
# Update Task Command Integration Tests
# =============================================================================

class TestUpdateTaskCommandIntegration:
    """Integration tests for update_task_command."""

    def test_update_task_not_found_error(self):
        """Test updating non-existent task."""
        result = update_task_command(
            task_id=999,
            title="New title",
            description=None,
            priority=None,
            tags=None,
            due_date_str=None,
            recurrence_str=None,
            reminder_offset_str=None
        )

        assert result.success is False
        assert "not found" in result.message.lower()

    def test_update_task_validation_error(self):
        """Test update causing validation error."""
        storage.create_task("Original task")

        # Try to update with invalid recurrence (no due date)
        result = update_task_command(
            task_id=1,
            title=None,
            description=None,
            priority=None,
            tags=None,
            due_date_str=None,
            recurrence_str="DAILY",
            reminder_offset_str=None
        )

        assert result.success is False
        assert "error" in result.message.lower()

    def test_update_task_partial_updates(self):
        """Test updating only some fields."""
        storage.create_task("Original", description="Original desc", priority=Priority.LOW)

        result = update_task_command(
            task_id=1,
            title="Updated",
            description="New description",  # Update description
            priority="HIGH",
            tags=None,
            due_date_str=None,
            recurrence_str=None,
            reminder_offset_str=None
        )

        assert result.success is True
        task = storage.get_task(1)
        assert task.title == "Updated"
        assert task.description == "New description"
        assert task.priority == Priority.HIGH


# =============================================================================
# Delete Task Command Integration Tests
# =============================================================================

class TestDeleteTaskCommandIntegration:
    """Integration tests for delete_task_command."""

    def test_delete_task_not_found(self):
        """Test deleting non-existent task."""
        result = delete_task_command(task_id=999)

        assert result.success is False
        assert "not found" in result.message.lower()

    def test_delete_task_with_confirmation(self):
        """Test successful task deletion."""
        storage.create_task("Task to delete")

        result = delete_task_command(task_id=1, confirmed=True)

        assert result.success is True
        assert storage.get_task(1) is None


# =============================================================================
# Mark Complete/Incomplete Command Integration Tests
# =============================================================================

class TestMarkCommandsIntegration:
    """Integration tests for mark_complete and mark_incomplete."""

    def test_mark_complete_not_found(self):
        """Test marking non-existent task complete."""
        result = mark_complete_command(task_id=999)

        assert result.success is False
        assert "not found" in result.message.lower()

    def test_mark_incomplete_not_found(self):
        """Test marking non-existent task incomplete."""
        result = mark_incomplete_command(task_id=999)

        assert result.success is False
        assert "not found" in result.message.lower()

    def test_mark_complete_recurring_task(self):
        """Test marking recurring task complete creates new instance."""
        task = storage.create_task(
            "Weekly meeting",
            due_date=datetime.now() + timedelta(days=1),
            recurrence=RecurrencePattern.WEEKLY
        )

        result = mark_complete_command(task_id=1)

        assert result.success is True
        # Should have 2 tasks now (completed + new instance)
        assert len(storage.tasks) == 2
        assert storage.get_task(1).status == "complete"
        assert storage.get_task(2).status == "incomplete"


# =============================================================================
# View All Tasks Command Integration Tests
# =============================================================================

class TestViewAllTasksCommandIntegration:
    """Integration tests for view_all_tasks_command."""

    def test_view_all_tasks_empty(self):
        """Test viewing when no tasks exist."""
        result = view_all_tasks_command()

        assert result.success is True
        assert "0 task" in result.message.lower() or "no tasks" in result.message.lower()

    def test_view_all_tasks_with_multiple(self):
        """Test viewing multiple tasks."""
        storage.create_task("Task 1")
        storage.create_task("Task 2", priority=Priority.HIGH)
        storage.create_task("Task 3", tags=["Work"])

        result = view_all_tasks_command()

        assert result.success is True
        assert len(result.data) == 3
        assert result.data[0].title == "Task 1"
        assert result.data[1].title == "Task 2"
        assert result.data[2].title == "Task 3"


# =============================================================================
# Helper Function Tests
# =============================================================================

class TestParsePriority:
    """Tests for parse_priority helper."""

    def test_parse_priority_valid_strings(self):
        """Test parsing valid priority strings."""
        assert parse_priority("HIGH") == Priority.HIGH
        assert parse_priority("MEDIUM") == Priority.MEDIUM
        assert parse_priority("LOW") == Priority.LOW

    def test_parse_priority_case_insensitive(self):
        """Test case insensitive parsing."""
        assert parse_priority("high") == Priority.HIGH
        assert parse_priority("MeDiUm") == Priority.MEDIUM

    def test_parse_priority_invalid_returns_none(self):
        """Test invalid priority returns None."""
        assert parse_priority("INVALID") is None
        assert parse_priority("") is None
        assert parse_priority(None) is None


class TestParseDate:
    """Tests for parse_date helper."""

    def test_parse_date_valid_formats(self):
        """Test parsing various valid date formats."""
        result1 = parse_date("2025-12-25")
        assert result1.year == 2025
        assert result1.month == 12
        assert result1.day == 25

        result2 = parse_date("2025-12-25 14:30")
        assert result2.hour == 14
        assert result2.minute == 30

    def test_parse_date_invalid_returns_none(self):
        """Test invalid date returns None."""
        assert parse_date("invalid") is None
        assert parse_date("") is None
        assert parse_date(None) is None
        assert parse_date("2025-13-45") is None  # Invalid month/day

    def test_parse_date_empty_string(self):
        """Test empty string returns None."""
        assert parse_date("") is None


class TestParseTags:
    """Tests for parse_tags helper."""

    def test_parse_tags_comma_separated(self):
        """Test parsing comma-separated tags."""
        result = parse_tags("Work, Home, Urgent")
        assert result == ["Work", "Home", "Urgent"]

    def test_parse_tags_strips_whitespace(self):
        """Test tags are stripped of whitespace."""
        result = parse_tags("  Work  ,  Home  ")
        assert result == ["Work", "Home"]

    def test_parse_tags_empty_string(self):
        """Test empty string returns empty list."""
        assert parse_tags("") == []
        assert parse_tags(None) == []

    def test_parse_tags_single_tag(self):
        """Test parsing single tag."""
        result = parse_tags("Work")
        assert result == ["Work"]


class TestParseRecurrence:
    """Tests for parse_recurrence helper."""

    def test_parse_recurrence_valid_patterns(self):
        """Test parsing valid recurrence patterns."""
        assert parse_recurrence("DAILY") == RecurrencePattern.DAILY
        assert parse_recurrence("WEEKLY") == RecurrencePattern.WEEKLY
        assert parse_recurrence("MONTHLY") == RecurrencePattern.MONTHLY
        assert parse_recurrence("YEARLY") == RecurrencePattern.YEARLY

    def test_parse_recurrence_case_insensitive(self):
        """Test case insensitive parsing."""
        assert parse_recurrence("daily") == RecurrencePattern.DAILY
        assert parse_recurrence("Weekly") == RecurrencePattern.WEEKLY

    def test_parse_recurrence_invalid_returns_none(self):
        """Test invalid recurrence returns None."""
        assert parse_recurrence("INVALID") is None
        assert parse_recurrence("") is None
        assert parse_recurrence(None) is None


class TestParseReminderOffset:
    """Tests for parse_reminder_offset helper."""

    def test_parse_reminder_offset_valid(self):
        """Test parsing valid reminder offsets."""
        assert parse_reminder_offset("1.0") == 1.0
        assert parse_reminder_offset("2.5") == 2.5
        assert parse_reminder_offset("24") == 24.0

    def test_parse_reminder_offset_invalid(self):
        """Test invalid offset returns None."""
        assert parse_reminder_offset("invalid") is None
        assert parse_reminder_offset("") is None
        assert parse_reminder_offset(None) is None
        assert parse_reminder_offset("abc") is None


# =============================================================================
# CommandResult Tests
# =============================================================================

class TestCommandResult:
    """Tests for CommandResult dataclass."""

    def test_command_result_success(self):
        """Test creating success CommandResult."""
        result = CommandResult(success=True, message="Task created successfully")
        assert result.success is True
        assert result.message == "Task created successfully"

    def test_command_result_failure(self):
        """Test creating failure CommandResult."""
        result = CommandResult(success=False, message="Task not found")
        assert result.success is False
        assert result.message == "Task not found"


# =============================================================================
# End-to-End Command Workflows
# =============================================================================

class TestCommandWorkflows:
    """End-to-end command workflow tests."""

    def test_complete_task_lifecycle_via_commands(self):
        """Test: Add → Update → Complete → Delete via command functions."""
        # Step 1: Add task
        add_result = add_task_command(
            title="Lifecycle test",
            description="Testing complete workflow",
            priority="HIGH",
            tags="Test, Workflow",
            due_date_str="2025-12-31",
            recurrence_str="",
            reminder_offset_str=""
        )
        assert add_result.success is True

        # Step 2: Update task
        update_result = update_task_command(
            task_id=1,
            title="Updated lifecycle test",
            description=None,
            priority="LOW",
            tags=None,
            due_date_str=None,
            recurrence_str=None,
            reminder_offset_str=None
        )
        assert update_result.success is True

        task = storage.get_task(1)
        assert task.title == "Updated lifecycle test"
        assert task.priority == Priority.LOW

        # Step 3: Mark complete
        complete_result = mark_complete_command(task_id=1)
        assert complete_result.success is True

        task = storage.get_task(1)
        assert task.status == "complete"

        # Step 4: Delete
        delete_result = delete_task_command(task_id=1, confirmed=True)
        assert delete_result.success is True

        assert storage.get_task(1) is None

    def test_recurring_task_workflow_via_commands(self):
        """Test recurring task creation and completion via commands."""
        # Add recurring task
        result = add_task_command(
            title="Weekly standup",
            description="Team meeting",
            priority="MEDIUM",
            tags="Work, Meeting",
            due_date_str=(datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"),
            recurrence_str="WEEKLY",
            reminder_offset_str="1.0"
        )
        assert result.success is True

        task = storage.get_task(1)
        assert task.recurrence == RecurrencePattern.WEEKLY
        assert task.reminder_offset == 1.0

        # Mark complete - should create new instance
        complete_result = mark_complete_command(task_id=1)
        assert complete_result.success is True

        assert len(storage.tasks) == 2
        assert storage.get_task(1).status == "complete"
        assert storage.get_task(2).status == "incomplete"
        assert storage.get_task(2).title == "Weekly standup"
