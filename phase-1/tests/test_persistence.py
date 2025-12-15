"""Tests for persistent storage module.

This test file covers:
- JSON serialization/deserialization
- File locking mechanisms
- Atomic file writes
- Backup recovery
- Error handling and edge cases
"""

import pytest
from datetime import datetime
from pathlib import Path

from src.todo.models import Task, Priority, TaskType, RecurrencePattern


# =============================================================================
# Phase 2: Foundational - JSON Serialization Tests (T005-T009)
# =============================================================================

def test_task_serialization_roundtrip():
    """Task should serialize to JSON and deserialize back identically (T005)."""
    from src.todo.persistence import serialize_tasks, deserialize_tasks

    original = Task(
        id=1,
        title="Test task",
        description="Test description",
        status="incomplete",
        priority=Priority.HIGH,
        tags=["Work", "Urgent"],
        created_date=datetime(2025, 12, 7, 10, 30, 0),
        due_date=datetime(2025, 12, 10, 15, 30, 0),  # This makes task_type = SCHEDULED
        recurrence=RecurrencePattern.WEEKLY,
        completed_date=None,
        reminder_offset=1.0
    )

    # Serialize then deserialize
    json_str = serialize_tasks([original])
    tasks = deserialize_tasks(json_str)

    # Should roundtrip perfectly
    assert len(tasks) == 1
    assert tasks[0].id == original.id
    assert tasks[0].title == original.title
    assert tasks[0].description == original.description
    assert tasks[0].priority == Priority.HIGH  # Enum, not string
    assert tasks[0].tags == ["Work", "Urgent"]
    assert tasks[0].task_type == TaskType.SCHEDULED  # Computed from due_date
    assert tasks[0].due_date == original.due_date  # datetime, not string
    assert tasks[0].recurrence == RecurrencePattern.WEEKLY
    assert tasks[0].completed_date is None
    assert tasks[0].reminder_offset == 1.0


def test_datetime_serialization():
    """Datetime objects should convert to ISO format and back (T006)."""
    from src.todo.persistence import serialize_tasks, deserialize_tasks

    task = Task(
        id=1,
        title="Task with dates",
        created_date=datetime(2025, 12, 7, 14, 30, 45),
        due_date=datetime(2025, 12, 31, 23, 59, 59),
        completed_date=datetime(2025, 12, 8, 10, 15, 30)
    )

    json_str = serialize_tasks([task])

    # Check JSON contains ISO format strings
    assert "2025-12-07T14:30:45" in json_str
    assert "2025-12-31T23:59:59" in json_str
    assert "2025-12-08T10:15:30" in json_str

    # Deserialize and verify datetime objects restored
    tasks = deserialize_tasks(json_str)
    assert isinstance(tasks[0].created_date, datetime)
    assert isinstance(tasks[0].due_date, datetime)
    assert isinstance(tasks[0].completed_date, datetime)
    assert tasks[0].created_date == datetime(2025, 12, 7, 14, 30, 45)


def test_enum_serialization():
    """Enum values should convert to strings and back (T007)."""
    from src.todo.persistence import serialize_tasks, deserialize_tasks

    task = Task(
        id=1,
        title="Task with enums",
        priority=Priority.LOW,
        due_date=datetime(2025, 12, 15),  # Makes task_type = SCHEDULED
        recurrence=RecurrencePattern.MONTHLY
    )

    json_str = serialize_tasks([task])

    # Check JSON contains enum values as strings
    assert '"priority": "LOW"' in json_str
    assert '"recurrence": "MONTHLY"' in json_str
    # Note: task_type is a property (not serialized), computed from due_date

    # Deserialize and verify Enum objects restored
    tasks = deserialize_tasks(json_str)
    assert tasks[0].priority == Priority.LOW
    assert tasks[0].task_type == TaskType.SCHEDULED  # Recomputed from due_date
    assert tasks[0].recurrence == RecurrencePattern.MONTHLY


def test_optional_fields_serialization():
    """Optional fields (None values) should roundtrip correctly (T008)."""
    from src.todo.persistence import serialize_tasks, deserialize_tasks

    task = Task(
        id=1,
        title="Minimal task",
        description="",
        due_date=None,
        recurrence=None,
        completed_date=None,
        reminder_offset=None
    )

    json_str = serialize_tasks([task])

    # Check JSON has null for None values
    assert '"due_date": null' in json_str
    assert '"recurrence": null' in json_str
    assert '"completed_date": null' in json_str
    assert '"reminder_offset": null' in json_str

    # Deserialize and verify None values preserved
    tasks = deserialize_tasks(json_str)
    assert tasks[0].due_date is None
    assert tasks[0].recurrence is None
    assert tasks[0].completed_date is None
    assert tasks[0].reminder_offset is None


def test_schema_version_validation():
    """Schema version must be validated on load (T009)."""
    from src.todo.persistence import deserialize_tasks

    # Invalid schema version should raise error
    invalid_json = '{"version": "2.0", "tasks": []}'

    with pytest.raises(ValueError, match="Unsupported schema version"):
        deserialize_tasks(invalid_json)

    # Valid schema version should work
    valid_json = '{"version": "1.0", "tasks": []}'
    tasks = deserialize_tasks(valid_json)
    assert tasks == []


# =============================================================================
# Phase 2: Platform-Specific Paths (T018-T021)
# =============================================================================

def test_app_data_dir_creation():
    """App data directory should be created if missing (T018)."""
    from src.todo.persistence import get_app_data_dir

    # Should return a Path object
    app_dir = get_app_data_dir()
    assert isinstance(app_dir, Path)

    # Should exist after calling function
    assert app_dir.exists()
    assert app_dir.is_dir()

    # Should contain 'todo-app' in the path
    assert 'todo-app' in str(app_dir)


# =============================================================================
# Phase 3: User Story 1 - File Locking Tests (T022-T024)
# =============================================================================

def test_acquire_lock_success():
    """Lock should be acquired successfully on first try (T022)."""
    from src.todo.persistence import acquire_lock, release_lock

    lock = acquire_lock()
    assert lock is not None
    assert lock.is_locked

    # Clean up
    release_lock(lock)
    assert not lock.is_locked


def test_acquire_lock_blocks_second_instance():
    """Second instance should fail to acquire lock with timeout (T023)."""
    from src.todo.persistence import acquire_lock, release_lock
    import subprocess
    import sys

    # First instance acquires lock
    lock1 = acquire_lock()
    assert lock1.is_locked

    # Try to acquire lock again (simulating second instance)
    # This should timeout and exit
    try:
        # In real scenario, this would be a second process
        # For testing, we'll use a short timeout
        from filelock import FileLock, Timeout
        from src.todo.persistence import LOCK_FILE

        lock2 = FileLock(LOCK_FILE, timeout=0.1)
        with pytest.raises(Timeout):
            lock2.acquire(timeout=0.1)
    finally:
        # Clean up first lock
        release_lock(lock1)


def test_release_lock():
    """Lock should be released properly (T024)."""
    from src.todo.persistence import acquire_lock, release_lock

    lock = acquire_lock()
    assert lock.is_locked

    release_lock(lock)
    assert not lock.is_locked

    # Should be able to acquire again after release
    lock2 = acquire_lock()
    assert lock2.is_locked
    release_lock(lock2)


# =============================================================================
# Phase 3: User Story 1 - Atomic Save/Load Tests (T025-T032)
# =============================================================================

def test_save_and_load_tasks(tmp_path):
    """Tasks should save to file and load back correctly (T028, T031)."""
    from src.todo.persistence import save_tasks, load_tasks
    import src.todo.persistence as persistence

    # Override TASKS_FILE for testing
    test_file = tmp_path / "test_tasks.json"
    original_file = persistence.TASKS_FILE
    persistence.TASKS_FILE = test_file

    try:
        # Create some tasks
        task1 = Task(id=1, title="Task 1", priority=Priority.HIGH)
        task2 = Task(id=2, title="Task 2", priority=Priority.LOW, tags=["Work"])

        # Save tasks
        save_tasks([task1, task2])

        # File should exist
        assert test_file.exists()

        # Load tasks back
        loaded = load_tasks()

        # Should match original
        assert len(loaded) == 2
        assert loaded[0].id == 1
        assert loaded[0].title == "Task 1"
        assert loaded[1].id == 2
        assert loaded[1].tags == ["Work"]
    finally:
        persistence.TASKS_FILE = original_file


def test_load_empty_when_no_file():
    """Load should return empty list if file doesn't exist (T029)."""
    from src.todo.persistence import load_tasks
    import src.todo.persistence as persistence

    # Use a non-existent file
    original_file = persistence.TASKS_FILE
    persistence.TASKS_FILE = Path("/nonexistent/path/tasks.json")

    try:
        tasks = load_tasks()
        assert tasks == []
    finally:
        persistence.TASKS_FILE = original_file


def test_atomic_write_creates_backup(tmp_path):
    """Atomic write should create backup of previous file (T026)."""
    from src.todo.persistence import save_tasks
    import src.todo.persistence as persistence

    test_file = tmp_path / "tasks.json"
    backup_file = tmp_path / "tasks.json.backup"

    original_file = persistence.TASKS_FILE
    original_backup = persistence.BACKUP_FILE
    persistence.TASKS_FILE = test_file
    persistence.BACKUP_FILE = backup_file

    try:
        task1 = Task(id=1, title="First save")
        save_tasks([task1])
        assert test_file.exists()

        # Second save should create backup
        task2 = Task(id=2, title="Second save")
        save_tasks([task1, task2])

        assert backup_file.exists()

        # Backup should contain first version
        with open(backup_file) as f:
            backup_data = f.read()
            assert '"title": "First save"' in backup_data
    finally:
        persistence.TASKS_FILE = original_file
        persistence.BACKUP_FILE = original_backup


def test_load_recovers_from_corruption(tmp_path):
    """Load should restore from backup if primary file corrupted (T030)."""
    from src.todo.persistence import save_tasks, load_tasks
    import src.todo.persistence as persistence

    test_file = tmp_path / "tasks.json"
    backup_file = tmp_path / "tasks.json.backup"

    original_file = persistence.TASKS_FILE
    original_backup = persistence.BACKUP_FILE
    persistence.TASKS_FILE = test_file
    persistence.BACKUP_FILE = backup_file

    try:
        # Save valid tasks (first save)
        task1 = Task(id=1, title="Valid task")
        save_tasks([task1])

        # Save again to create backup
        task2 = Task(id=2, title="Another task")
        save_tasks([task1, task2])

        # Now backup exists - corrupt the primary file
        with open(test_file, 'w') as f:
            f.write("invalid json {{{")

        # Load should recover from backup
        loaded = load_tasks()
        # Backup contains the FIRST save (1 task), not the second save
        assert len(loaded) == 1
        assert loaded[0].title == "Valid task"
    finally:
        persistence.TASKS_FILE = original_file
        persistence.BACKUP_FILE = original_backup
