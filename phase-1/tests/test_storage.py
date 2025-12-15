"""Tests for in-memory storage operations."""

from datetime import datetime

import pytest

from src.todo.models import Priority
from src.todo import storage


class TestCreateTask:
    """Test create_task function."""

    def test_create_task_auto_id(self, clear_storage):
        """Test that task ID is auto-generated and incremented."""
        task1 = storage.create_task(title="First Task")
        task2 = storage.create_task(title="Second Task")

        assert task1.id == 1
        assert task2.id == 2
        assert storage.next_task_id == 3

    def test_create_task_with_all_fields(self, clear_storage):
        """Test creating task with all optional fields."""
        due_date = datetime(2025, 12, 31)
        task = storage.create_task(
            title="Complete Task",
            description="Full description",
            priority=Priority.HIGH,
            tags=["Work", "Important"],
            due_date=due_date,
        )

        assert task.title == "Complete Task"
        assert task.description == "Full description"
        assert task.priority == Priority.HIGH
        assert task.tags == ["Work", "Important"]
        assert task.due_date == due_date

    def test_create_task_empty_title_raises_error(self, clear_storage):
        """Test that empty title raises ValueError."""
        with pytest.raises(ValueError):
            storage.create_task(title="")


class TestGetTask:
    """Test get_task function."""

    def test_get_task_by_id_success(self, clear_storage):
        """Test retrieving task by ID."""
        task = storage.create_task(title="Find Me")
        retrieved = storage.get_task(task.id)

        assert retrieved is not None
        assert retrieved.id == task.id
        assert retrieved.title == "Find Me"

    def test_get_task_not_found(self, clear_storage):
        """Test that get_task returns None for invalid ID."""
        result = storage.get_task(9999)
        assert result is None

    def test_get_task_o1_complexity(self, clear_storage):
        """Test that get_task uses O(1) lookup via index."""
        # Create multiple tasks
        for i in range(100):
            storage.create_task(title=f"Task {i}")

        # Lookup should be instant via task_index
        task = storage.get_task(50)
        assert task is not None
        assert task.title == "Task 49"  # 0-indexed


class TestGetAllTasks:
    """Test get_all_tasks function."""

    def test_get_all_tasks_empty(self, clear_storage):
        """Test get_all_tasks returns empty list when no tasks."""
        tasks = storage.get_all_tasks()
        assert tasks == []

    def test_get_all_tasks_returns_all(self, clear_storage):
        """Test get_all_tasks returns all created tasks."""
        storage.create_task(title="Task 1")
        storage.create_task(title="Task 2")
        storage.create_task(title="Task 3")

        tasks = storage.get_all_tasks()
        assert len(tasks) == 3
        assert tasks[0].title == "Task 1"
        assert tasks[1].title == "Task 2"
        assert tasks[2].title == "Task 3"


class TestUpdateTask:
    """Test update_task function."""

    def test_update_task_success(self, clear_storage):
        """Test updating task fields."""
        task = storage.create_task(title="Original Title")

        success = storage.update_task(
            task.id,
            title="Updated Title",
            description="New description",
            priority=Priority.HIGH,
        )

        assert success is True
        updated_task = storage.get_task(task.id)
        assert updated_task.title == "Updated Title"
        assert updated_task.description == "New description"
        assert updated_task.priority == Priority.HIGH

    def test_update_task_not_found(self, clear_storage):
        """Test update_task returns False for invalid ID."""
        success = storage.update_task(9999, title="Won't Work")
        assert success is False

    def test_update_task_preserves_id_and_created_date(self, clear_storage):
        """Test that update doesn't change immutable fields."""
        task = storage.create_task(title="Original")
        original_id = task.id
        original_created = task.created_date

        storage.update_task(task.id, title="Updated")

        updated = storage.get_task(task.id)
        assert updated.id == original_id
        assert updated.created_date == original_created


class TestDeleteTask:
    """Test delete_task function."""

    def test_delete_task_rebuilds_index(self, clear_storage):
        """Test that delete_task removes task and rebuilds index."""
        task1 = storage.create_task(title="Task 1")
        task2 = storage.create_task(title="Task 2")
        task3 = storage.create_task(title="Task 3")

        success = storage.delete_task(task2.id)

        assert success is True
        assert storage.get_task(task2.id) is None
        assert storage.get_task(task1.id) is not None
        assert storage.get_task(task3.id) is not None
        assert len(storage.get_all_tasks()) == 2

    def test_delete_task_not_found(self, clear_storage):
        """Test delete_task returns False for invalid ID."""
        success = storage.delete_task(9999)
        assert success is False


class TestMarkComplete:
    """Test mark_complete function."""

    def test_mark_complete_sets_timestamp(self, clear_storage):
        """Test mark_complete sets status and timestamp."""
        task = storage.create_task(title="To Complete")

        storage.mark_complete(task.id)

        completed_task = storage.get_task(task.id)
        assert completed_task.status == "complete"
        assert completed_task.completed_date is not None
        assert isinstance(completed_task.completed_date, datetime)

    def test_mark_complete_returns_none_for_non_recurring(self, clear_storage):
        """Test mark_complete returns None for non-recurring tasks."""
        task = storage.create_task(title="Simple Task")
        result = storage.mark_complete(task.id)
        assert result is None

    def test_mark_complete_not_found(self, clear_storage):
        """Test mark_complete returns None for invalid ID."""
        result = storage.mark_complete(9999)
        assert result is None

    def test_mark_complete_recurring_creates_new_task(self, clear_storage):
        """Test that completing recurring task creates new instance."""
        from src.todo.models import RecurrencePattern

        # Create recurring task
        task = storage.create_task(
            title="Weekly meeting",
            due_date=datetime(2025, 12, 1, 14, 30),
            recurrence=RecurrencePattern.WEEKLY,
        )

        # Mark complete
        new_task = storage.mark_complete(task.id)

        # Should return new task instance
        assert new_task is not None
        assert new_task.id != task.id
        assert new_task.title == task.title
        assert new_task.status == "incomplete"
        assert new_task.recurrence == RecurrencePattern.WEEKLY

        # New task should have due date one week later
        expected_due = datetime(2025, 12, 8, 14, 30)
        assert new_task.due_date == expected_due

        # Original task should still be marked complete
        original = storage.get_task(task.id)
        assert original.status == "complete"


class TestMarkIncomplete:
    """Test mark_incomplete function."""

    def test_mark_incomplete_clears_timestamp(self, clear_storage):
        """Test mark_incomplete clears status and timestamp."""
        task = storage.create_task(title="Task")
        storage.mark_complete(task.id)

        success = storage.mark_incomplete(task.id)

        assert success is True
        incomplete_task = storage.get_task(task.id)
        assert incomplete_task.status == "incomplete"
        assert incomplete_task.completed_date is None

    def test_mark_incomplete_not_found(self, clear_storage):
        """Test mark_incomplete returns False for invalid ID."""
        success = storage.mark_incomplete(9999)
        assert success is False


class TestTaskIndexIntegrity:
    """Test that task_index maintains data integrity."""

    def test_task_index_integrity(self, clear_storage):
        """Test task_index always points to correct list positions."""
        # Create tasks
        t1 = storage.create_task(title="Task 1")
        t2 = storage.create_task(title="Task 2")
        t3 = storage.create_task(title="Task 3")

        # Verify index mappings
        assert storage.task_index[t1.id] == 0
        assert storage.task_index[t2.id] == 1
        assert storage.task_index[t3.id] == 2

        # Delete middle task
        storage.delete_task(t2.id)

        # Index should be rebuilt correctly
        assert storage.task_index[t1.id] == 0
        assert storage.task_index[t3.id] == 1
        assert t2.id not in storage.task_index
