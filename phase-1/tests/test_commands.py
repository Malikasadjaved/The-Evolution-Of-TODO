"""Tests for command business logic layer."""

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
)
from src.todo.models import Priority


class TestCommandResult:
    """Test CommandResult dataclass."""

    def test_command_result_success(self):
        """Test CommandResult for successful operation."""
        result = CommandResult(success=True, message="Task created", data={"id": 1})
        assert result.success is True
        assert result.message == "Task created"
        assert result.data == {"id": 1}
        assert result.errors == []

    def test_command_result_failure(self):
        """Test CommandResult for failed operation."""
        result = CommandResult(
            success=False, message="Validation failed", errors=["Title cannot be empty"]
        )
        assert result.success is False
        assert len(result.errors) == 1


class TestAddTaskCommand:
    """Test add_task_command function."""

    def test_add_task_command_success(self, clear_storage):
        """Test successfully adding a task."""
        result = add_task_command(title="New Task")

        assert result.success is True
        assert result.data is not None
        assert result.data.title == "New Task"
        assert result.data.id == 1

    def test_add_task_command_empty_title(self, clear_storage):
        """Test that empty title returns error."""
        result = add_task_command(title="")

        assert result.success is False
        assert "title" in result.message.lower() or any(
            "title" in e.lower() for e in result.errors
        )

    def test_add_task_command_with_all_fields(self, clear_storage):
        """Test adding task with all optional fields."""
        result = add_task_command(
            title="Complete Task",
            description="Description",
            priority="HIGH",
            tags="Work, Meeting",
            due_date_str="2025-12-31",
        )

        assert result.success is True
        task = result.data
        assert task.title == "Complete Task"
        assert task.description == "Description"
        assert task.priority == Priority.HIGH
        assert "Work" in task.tags
        assert "Meeting" in task.tags

    def test_add_task_command_invalid_priority(self, clear_storage):
        """Test that invalid priority returns error."""
        result = add_task_command(title="Task", priority="INVALID")

        assert result.success is False
        assert "priority" in result.message.lower() or any(
            "priority" in e.lower() for e in result.errors
        )


class TestViewAllTasksCommand:
    """Test view_all_tasks_command function."""

    def test_view_all_tasks_command(self, clear_storage):
        """Test viewing all tasks."""
        add_task_command(title="Task 1")
        add_task_command(title="Task 2")

        result = view_all_tasks_command()

        assert result.success is True
        assert len(result.data) == 2


class TestUpdateTaskCommand:
    """Test update_task_command function."""

    def test_update_task_command_success(self, clear_storage):
        """Test successfully updating a task."""
        add_result = add_task_command(title="Original")
        task_id = add_result.data.id

        result = update_task_command(task_id, title="Updated")

        assert result.success is True
        assert result.data.title == "Updated"

    def test_update_task_command_not_found(self, clear_storage):
        """Test updating non-existent task."""
        result = update_task_command(9999, title="Updated")

        assert result.success is False
        assert "not found" in result.message.lower()


class TestDeleteTaskCommand:
    """Test delete_task_command function."""

    def test_delete_task_command_confirmation(self, clear_storage):
        """Test delete requires confirmation."""
        add_result = add_task_command(title="To Delete")
        task_id = add_result.data.id

        # First call without confirmation
        result = delete_task_command(task_id, confirmed=False)
        assert result.success is True
        assert "confirm" in result.message.lower() or "delete" in result.message.lower()

        # Second call with confirmation
        result = delete_task_command(task_id, confirmed=True)
        assert result.success is True


class TestMarkCompleteCommand:
    """Test mark_complete_command function."""

    def test_mark_complete_command(self, clear_storage):
        """Test marking task as complete."""
        add_result = add_task_command(title="To Complete")
        task_id = add_result.data.id

        result = mark_complete_command(task_id)

        assert result.success is True
        assert "complete" in result.message.lower()


class TestMarkIncompleteCommand:
    """Test mark_incomplete_command function."""

    def test_mark_incomplete_command(self, clear_storage):
        """Test marking task as incomplete."""
        add_result = add_task_command(title="Task")
        task_id = add_result.data.id
        mark_complete_command(task_id)

        result = mark_incomplete_command(task_id)

        assert result.success is True
        assert "incomplete" in result.message.lower()


class TestParsePriorityHelper:
    """Test parse_priority helper function."""

    def test_parse_priority_valid(self):
        """Test parsing valid priority strings."""
        assert parse_priority("HIGH") == Priority.HIGH
        assert parse_priority("MEDIUM") == Priority.MEDIUM
        assert parse_priority("LOW") == Priority.LOW

    def test_parse_priority_case_insensitive(self):
        """Test that priority parsing is case-insensitive."""
        assert parse_priority("high") == Priority.HIGH
        assert parse_priority("Medium") == Priority.MEDIUM

    def test_parse_priority_invalid(self):
        """Test that invalid priority returns None."""
        assert parse_priority("INVALID") is None
        assert parse_priority("") is None


class TestParseDateHelper:
    """Test parse_date helper function."""

    def test_parse_date_valid_format(self):
        """Test parsing valid date formats."""
        result = parse_date("2025-12-31")
        assert result is not None
        assert result.year == 2025
        assert result.month == 12
        assert result.day == 31

    def test_parse_date_with_time(self):
        """Test parsing date with time."""
        result = parse_date("2025-12-31 14:30")
        assert result is not None
        assert result.hour == 14
        assert result.minute == 30

    def test_parse_date_invalid_format(self):
        """Test that invalid date returns None."""
        assert parse_date("invalid") is None
        assert parse_date("2025-13-45") is None


class TestParseTagsHelper:
    """Test parse_tags helper function."""

    def test_parse_tags_comma_separated(self):
        """Test parsing comma-separated tags."""
        tags = parse_tags("Work, Meeting, Important")
        assert len(tags) == 3
        assert "Work" in tags
        assert "Meeting" in tags
        assert "Important" in tags

    def test_parse_tags_strips_whitespace(self):
        """Test that parse_tags strips whitespace."""
        tags = parse_tags("  Work  ,  Meeting  ")
        assert tags == ["Work", "Meeting"]

    def test_parse_tags_empty_string(self):
        """Test that empty string returns empty list."""
        assert parse_tags("") == []
