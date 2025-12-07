"""Integration tests for CLI workflows.

This test file covers end-to-end CLI user scenarios to improve coverage on:
- cli.py (currently 44% coverage)
- commands.py (currently 69% coverage)
- Full user workflows from input to output
"""

import pytest
from io import StringIO
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta

from src.todo import storage
from src.todo.models import Priority, RecurrencePattern
from src.todo.cli import (
    add_task_interactive,
    view_all_tasks_interactive,
    update_task_interactive,
    delete_task_interactive,
    mark_complete_interactive,
    mark_incomplete_interactive,
    search_tasks_interactive,
    filter_tasks_interactive,
    sort_tasks_interactive,
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
    """Mock persistence to avoid actual file I/O during CLI tests."""
    with patch('src.todo.persistence.save_tasks'):
        with patch('src.todo.persistence.load_tasks', return_value=[]):
            yield


# =============================================================================
# Add Task Workflow Integration Tests
# =============================================================================

class TestAddTaskWorkflow:
    """Integration tests for add_task_interactive (cli.py:410-462)."""

    def test_add_task_minimal_input(self):
        """Add task with only title (all other fields default/empty)."""
        inputs = [
            "Buy milk",  # title
            "",  # description (empty)
            "",  # priority (default MEDIUM)
            "",  # tags (empty)
            "",  # due date (empty)
            "",  # recurrence (empty)
            "",  # reminder (empty)
        ]

        with patch('builtins.input', side_effect=inputs):
            with patch('src.todo.cli.print') as mock_print:
                add_task_interactive()

        # Verify task created
        assert len(storage.tasks) == 1
        task = storage.tasks[0]
        assert task.title == "Buy milk"
        assert task.description == ""
        assert task.priority == Priority.MEDIUM
        assert task.tags == []
        assert task.due_date is None
        assert task.recurrence is None

    def test_add_task_with_all_fields(self):
        """Add task with all fields populated."""
        future_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d %H:%M")
        inputs = [
            "Complete project report",  # title
            "Final submission for Q4",  # description
            "1",  # priority HIGH
            "Work, Urgent",  # tags
            future_date,  # due date
            "2",  # recurrence WEEKLY
            "2",  # reminder 2 hours before
        ]

        with patch('builtins.input', side_effect=inputs):
            with patch('src.todo.cli.print') as mock_print:
                add_task_interactive()

        assert len(storage.tasks) == 1
        task = storage.tasks[0]
        assert task.title == "Complete project report"
        assert task.description == "Final submission for Q4"
        assert task.priority == Priority.HIGH
        assert "Work" in task.tags
        assert "Urgent" in task.tags
        assert task.due_date is not None
        assert task.recurrence == RecurrencePattern.WEEKLY
        assert task.reminder_offset == 2.0

    def test_add_task_validation_retry_on_empty_title(self):
        """Test retry mechanism when title is empty."""
        inputs = [
            "",  # title (invalid - empty)
            "n",  # don't retry
        ]

        with patch('builtins.input', side_effect=inputs):
            with patch('src.todo.cli.print') as mock_print:
                add_task_interactive()

        # No task should be created
        assert len(storage.tasks) == 0

    def test_add_task_with_invalid_date_retry(self):
        """Test date validation with retry."""
        inputs = [
            "Task with date",  # title
            "",  # description
            "",  # priority
            "",  # tags
            "invalid-date",  # due date (invalid)
            "y",  # retry
            "2025-12-31",  # valid date
            "",  # recurrence
            "",  # reminder
        ]

        with patch('builtins.input', side_effect=inputs):
            with patch('src.todo.cli.print') as mock_print:
                add_task_interactive()

        assert len(storage.tasks) == 1
        task = storage.tasks[0]
        assert task.due_date is not None


# =============================================================================
# View All Tasks Workflow Integration Tests
# =============================================================================

class TestViewAllTasksWorkflow:
    """Integration tests for view_all_tasks_workflow (cli.py:465-478)."""

    def test_view_tasks_empty_list(self):
        """View tasks when no tasks exist."""
        with patch('src.todo.cli.print') as mock_print:
            view_all_tasks_interactive()

        # Should print "No tasks found"
        calls = [str(call) for call in mock_print.call_args_list]
        assert any("No tasks found" in str(call) for call in calls)

    def test_view_tasks_with_multiple_tasks(self):
        """View tasks with multiple tasks in different states."""
        # Create test tasks
        task1 = storage.create_task("Task 1", priority=Priority.HIGH)
        task2 = storage.create_task("Task 2", priority=Priority.LOW, tags=["Work"])
        task3 = storage.create_task(
            "Task 3",
            due_date=datetime.now() + timedelta(days=1),
            priority=Priority.MEDIUM
        )

        with patch('src.todo.cli.print') as mock_print:
            view_all_tasks_interactive()

        # Should display all 3 tasks
        calls = str(mock_print.call_args_list)
        assert "Task 1" in calls
        assert "Task 2" in calls
        assert "Task 3" in calls


# =============================================================================
# Update Task Workflow Integration Tests
# =============================================================================

class TestUpdateTaskWorkflow:
    """Integration tests for update_task_workflow (cli.py:483-542)."""

    def test_update_task_title_only(self):
        """Update only the title of a task."""
        task = storage.create_task("Old title")

        inputs = [
            "1",  # task_id
            "New title",  # new title
            "",  # description (no change)
            "",  # priority (no change)
            "",  # tags (no change)
            "",  # due date (no change)
            "",  # recurrence (no change)
            "",  # reminder (no change)
        ]

        with patch('builtins.input', side_effect=inputs):
            with patch('src.todo.cli.print') as mock_print:
                update_task_interactive()

        updated_task = storage.get_task(1)
        assert updated_task.title == "New title"

    def test_update_task_not_found(self):
        """Try to update non-existent task."""
        inputs = [
            "999",  # task_id (doesn't exist)
            "n",  # don't retry
        ]

        with patch('builtins.input', side_effect=inputs):
            with patch('src.todo.cli.print') as mock_print:
                update_task_interactive()

        # Should print error message
        calls = str(mock_print.call_args_list)
        assert "not found" in calls.lower() or "error" in calls.lower()

    def test_update_task_all_fields(self):
        """Update all fields of a task."""
        task = storage.create_task("Original", description="Original desc")

        future_date = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")
        inputs = [
            "1",  # task_id
            "Updated title",  # title
            "Updated description",  # description
            "1",  # priority HIGH
            "Home, Shopping",  # tags
            future_date,  # due date
            "1",  # recurrence DAILY
            "1",  # reminder 1 hour
        ]

        with patch('builtins.input', side_effect=inputs):
            with patch('src.todo.cli.print') as mock_print:
                update_task_interactive()

        updated = storage.get_task(1)
        assert updated.title == "Updated title"
        assert updated.description == "Updated description"
        assert updated.priority == Priority.HIGH
        assert "Home" in updated.tags
        assert updated.due_date is not None
        assert updated.recurrence == RecurrencePattern.DAILY


# =============================================================================
# Delete Task Workflow Integration Tests
# =============================================================================

class TestDeleteTaskWorkflow:
    """Integration tests for delete_task_workflow (cli.py:547-579)."""

    def test_delete_task_with_confirmation(self):
        """Delete task with user confirmation."""
        task = storage.create_task("Task to delete")

        inputs = [
            "1",  # task_id
            "y",  # confirm deletion
        ]

        with patch('builtins.input', side_effect=inputs):
            with patch('src.todo.cli.print') as mock_print:
                delete_task_interactive()

        # Task should be deleted
        assert len(storage.tasks) == 0
        assert storage.get_task(1) is None

    def test_delete_task_cancel_confirmation(self):
        """Cancel task deletion when user says no."""
        task = storage.create_task("Task to keep")

        inputs = [
            "1",  # task_id
            "n",  # cancel deletion
        ]

        with patch('builtins.input', side_effect=inputs):
            with patch('src.todo.cli.print') as mock_print:
                delete_task_interactive()

        # Task should still exist
        assert len(storage.tasks) == 1
        assert storage.get_task(1) is not None

    def test_delete_task_not_found(self):
        """Try to delete non-existent task."""
        inputs = [
            "999",  # task_id (doesn't exist)
            "n",  # don't retry
        ]

        with patch('builtins.input', side_effect=inputs):
            with patch('src.todo.cli.print') as mock_print:
                delete_task_interactive()

        # Should print error
        calls = str(mock_print.call_args_list)
        assert "not found" in calls.lower() or "error" in calls.lower()


# =============================================================================
# Mark Status Workflow Integration Tests
# =============================================================================

class TestMarkStatusWorkflow:
    """Integration tests for mark_status_workflow (cli.py:584-602)."""

    def test_mark_task_complete(self):
        """Mark task as complete."""
        task = storage.create_task("Task to complete")

        inputs = ["1"]  # task_id

        with patch('builtins.input', side_effect=inputs):
            with patch('src.todo.cli.print') as mock_print:
                mark_complete_interactive()

        updated = storage.get_task(1)
        assert updated.status == "complete"
        assert updated.completed_date is not None

    def test_mark_task_incomplete(self):
        """Mark completed task as incomplete."""
        task = storage.create_task("Completed task")
        storage.mark_complete(task.id)

        inputs = ["1"]  # task_id

        with patch('builtins.input', side_effect=inputs):
            with patch('src.todo.cli.print') as mock_print:
                mark_incomplete_interactive()

        updated = storage.get_task(1)
        assert updated.status == "incomplete"
        assert updated.completed_date is None

    def test_mark_complete_not_found(self):
        """Try to mark non-existent task complete."""
        inputs = [
            "999",  # task_id (doesn't exist)
            "n",  # don't retry
        ]

        with patch('builtins.input', side_effect=inputs):
            with patch('src.todo.cli.print') as mock_print:
                mark_complete_interactive()

        # Should print error
        calls = str(mock_print.call_args_list)
        assert "not found" in calls.lower() or "error" in calls.lower()


# =============================================================================
# Search Tasks Workflow Integration Tests
# =============================================================================

class TestSearchTasksWorkflow:
    """Integration tests for search_tasks_workflow (cli.py:607-625)."""

    def test_search_tasks_by_keyword(self):
        """Search tasks by keyword in title."""
        storage.create_task("Buy groceries")
        storage.create_task("Buy books")
        storage.create_task("Sell old items")

        inputs = ["buy"]  # search keyword

        with patch('builtins.input', side_effect=inputs):
            with patch('src.todo.cli.print') as mock_print:
                search_tasks_interactive()

        # Should find 2 tasks with "buy"
        calls = str(mock_print.call_args_list)
        assert "groceries" in calls.lower()
        assert "books" in calls.lower()
        assert "sell" not in calls.lower()

    def test_search_no_results(self):
        """Search with no matching results."""
        storage.create_task("Task 1")

        inputs = ["nonexistent"]  # keyword that doesn't match

        with patch('builtins.input', side_effect=inputs):
            with patch('src.todo.cli.print') as mock_print:
                search_tasks_interactive()

        calls = str(mock_print.call_args_list)
        assert "no tasks" in calls.lower() or "not found" in calls.lower()


# =============================================================================
# Filter Tasks Workflow Integration Tests
# =============================================================================

class TestFilterTasksWorkflow:
    """Integration tests for filter_tasks_workflow (cli.py:630-652)."""

    def test_filter_by_status_complete(self):
        """Filter tasks by complete status."""
        task1 = storage.create_task("Incomplete task")
        task2 = storage.create_task("Complete task")
        storage.mark_complete(task2.id)

        inputs = [
            "1",  # filter by status
            "1",  # complete
        ]

        with patch('builtins.input', side_effect=inputs):
            with patch('src.todo.cli.print') as mock_print:
                filter_tasks_interactive()

        calls = str(mock_print.call_args_list)
        assert "complete task" in calls.lower()
        # Should not show incomplete task

    def test_filter_by_priority(self):
        """Filter tasks by priority."""
        storage.create_task("High priority", priority=Priority.HIGH)
        storage.create_task("Low priority", priority=Priority.LOW)

        inputs = [
            "2",  # filter by priority
            "1",  # HIGH priority
        ]

        with patch('builtins.input', side_effect=inputs):
            with patch('src.todo.cli.print') as mock_print:
                filter_tasks_interactive()

        calls = str(mock_print.call_args_list)
        assert "high priority" in calls.lower()

    def test_filter_by_tag(self):
        """Filter tasks by tag."""
        storage.create_task("Work task", tags=["Work"])
        storage.create_task("Home task", tags=["Home"])

        inputs = [
            "3",  # filter by tag
            "Work",  # tag name
        ]

        with patch('builtins.input', side_effect=inputs):
            with patch('src.todo.cli.print') as mock_print:
                filter_tasks_interactive()

        calls = str(mock_print.call_args_list)
        assert "work task" in calls.lower()


# =============================================================================
# Sort Tasks Workflow Integration Tests
# =============================================================================

class TestSortTasksWorkflow:
    """Integration tests for sort_tasks_workflow (cli.py:657-724)."""

    def test_sort_by_priority(self):
        """Sort tasks by priority (high to low)."""
        storage.create_task("Low task", priority=Priority.LOW)
        storage.create_task("High task", priority=Priority.HIGH)
        storage.create_task("Medium task", priority=Priority.MEDIUM)

        inputs = ["2"]  # sort by priority

        with patch('builtins.input', side_effect=inputs):
            with patch('src.todo.cli.print') as mock_print:
                sort_tasks_interactive()

        # Should display HIGH first
        calls = [str(call) for call in mock_print.call_args_list]
        high_index = next(i for i, c in enumerate(calls) if "high task" in c.lower())
        low_index = next(i for i, c in enumerate(calls) if "low task" in c.lower())
        assert high_index < low_index

    def test_sort_by_title(self):
        """Sort tasks alphabetically by title."""
        storage.create_task("Zebra task")
        storage.create_task("Apple task")
        storage.create_task("Mango task")

        inputs = ["3"]  # sort by title

        with patch('builtins.input', side_effect=inputs):
            with patch('src.todo.cli.print') as mock_print:
                sort_tasks_interactive()

        # Should display alphabetically
        calls = [str(call) for call in mock_print.call_args_list]
        apple_index = next(i for i, c in enumerate(calls) if "apple" in c.lower())
        zebra_index = next(i for i, c in enumerate(calls) if "zebra" in c.lower())
        assert apple_index < zebra_index

    def test_sort_by_due_date(self):
        """Sort tasks by due date."""
        storage.create_task("Far future", due_date=datetime.now() + timedelta(days=30))
        storage.create_task("Near future", due_date=datetime.now() + timedelta(days=1))
        storage.create_task("No due date")

        inputs = ["1"]  # sort by due date

        with patch('builtins.input', side_effect=inputs):
            with patch('src.todo.cli.print') as mock_print:
                sort_tasks_interactive()

        # Should show tasks with due dates first
        calls = [str(call) for call in mock_print.call_args_list]
        near_index = next(i for i, c in enumerate(calls) if "near future" in c.lower())
        far_index = next(i for i, c in enumerate(calls) if "far future" in c.lower())
        assert near_index < far_index


# =============================================================================
# End-to-End Workflow Tests
# =============================================================================

class TestEndToEndWorkflows:
    """Complete user journey integration tests."""

    def test_complete_task_lifecycle(self):
        """Test: Add → View → Update → Mark Complete → Delete."""
        # Step 1: Add task
        add_inputs = ["Test task", "", "", "", "", "", ""]
        with patch('builtins.input', side_effect=add_inputs):
            with patch('src.todo.cli.print'):
                add_task_interactive()

        assert len(storage.tasks) == 1

        # Step 2: Update task
        update_inputs = ["1", "Updated task", "", "1", "", "", "", ""]
        with patch('builtins.input', side_effect=update_inputs):
            with patch('src.todo.cli.print'):
                update_task_interactive()

        task = storage.get_task(1)
        assert task.title == "Updated task"
        assert task.priority == Priority.HIGH

        # Step 3: Mark complete
        complete_inputs = ["1"]
        with patch('builtins.input', side_effect=complete_inputs):
            with patch('src.todo.cli.print'):
                mark_complete_interactive()

        task = storage.get_task(1)
        assert task.status == "complete"

        # Step 4: Delete
        delete_inputs = ["1", "y"]
        with patch('builtins.input', side_effect=delete_inputs):
            with patch('src.todo.cli.print'):
                delete_task_interactive()

        assert len(storage.tasks) == 0

    def test_recurring_task_workflow(self):
        """Test recurring task creation and completion."""
        future_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        add_inputs = [
            "Weekly meeting",
            "Team sync",
            "",
            "Work",
            future_date,
            "2",  # WEEKLY
            "",
        ]

        with patch('builtins.input', side_effect=add_inputs):
            with patch('src.todo.cli.print'):
                add_task_interactive()

        task = storage.get_task(1)
        assert task.recurrence == RecurrencePattern.WEEKLY

        # Mark complete - should create new instance
        complete_inputs = ["1"]
        with patch('builtins.input', side_effect=complete_inputs):
            with patch('src.todo.cli.print'):
                mark_complete_interactive()

        # Should have 2 tasks now (original complete + new recurring instance)
        assert len(storage.tasks) == 2
        completed_task = storage.get_task(1)
        new_task = storage.get_task(2)
        assert completed_task.status == "complete"
        assert new_task.status == "incomplete"
        assert new_task.title == "Weekly meeting"
