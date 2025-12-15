"""Integration tests for persistence module to improve coverage.

Focuses on error handling, edge cases, and real-world scenarios.
"""

import pytest
import json
from pathlib import Path
from datetime import datetime
from unittest.mock import patch, MagicMock

from src.todo.models import Task, Priority, RecurrencePattern
from src.todo import persistence


# =============================================================================
# Error Handling Tests
# =============================================================================

class TestPersistenceSaveErrorHandling:
    """Test error handling during save operations."""

    def test_save_tasks_permission_error(self, tmp_path, capsys):
        """Test save_tasks handles permission errors gracefully."""
        test_file = tmp_path / "tasks.json"
        original_file = persistence.TASKS_FILE
        persistence.TASKS_FILE = test_file

        try:
            # Create a read-only directory to trigger permission error
            with patch('src.todo.persistence._atomic_write', side_effect=PermissionError("Permission denied")):
                task = Task(id=1, title="Test task")
                persistence.save_tasks([task])

            # Check warning was printed
            captured = capsys.readouterr()
            assert "permission denied" in captured.out.lower() or "warning" in captured.out.lower()

        finally:
            persistence.TASKS_FILE = original_file

    def test_save_tasks_disk_full_error(self, tmp_path, capsys):
        """Test save_tasks handles disk full errors."""
        test_file = tmp_path / "tasks.json"
        original_file = persistence.TASKS_FILE
        persistence.TASKS_FILE = test_file

        try:
            # Simulate disk full error
            import errno
            disk_full_error = OSError(errno.ENOSPC, "No space left on device")

            with patch('src.todo.persistence._atomic_write', side_effect=disk_full_error):
                task = Task(id=1, title="Test task")
                persistence.save_tasks([task])

            # Check warning was printed
            captured = capsys.readouterr()
            assert "disk full" in captured.out.lower() or "warning" in captured.out.lower()

        finally:
            persistence.TASKS_FILE = original_file

    def test_save_tasks_generic_os_error(self, tmp_path, capsys):
        """Test save_tasks handles generic OS errors."""
        test_file = tmp_path / "tasks.json"
        original_file = persistence.TASKS_FILE
        persistence.TASKS_FILE = test_file

        try:
            # Simulate generic OS error
            with patch('src.todo.persistence._atomic_write', side_effect=OSError("Generic error")):
                task = Task(id=1, title="Test task")
                persistence.save_tasks([task])

            # Check warning was printed
            captured = capsys.readouterr()
            assert "warning" in captured.out.lower() or "failed" in captured.out.lower()

        finally:
            persistence.TASKS_FILE = original_file


class TestPersistenceLoadErrorHandling:
    """Test error handling during load operations."""

    def test_load_tasks_corrupted_json(self, tmp_path, capsys):
        """Test load_tasks handles corrupted JSON."""
        test_file = tmp_path / "tasks.json"
        backup_file = tmp_path / "tasks.json.backup"

        original_file = persistence.TASKS_FILE
        original_backup = persistence.BACKUP_FILE
        persistence.TASKS_FILE = test_file
        persistence.BACKUP_FILE = backup_file

        try:
            # Create corrupted JSON
            with open(test_file, 'w') as f:
                f.write("{ invalid json {{")

            # Load should return empty list and print warning
            result = persistence.load_tasks()

            assert result == []
            captured = capsys.readouterr()
            assert "corrupted" in captured.out.lower() or "warning" in captured.out.lower()

        finally:
            persistence.TASKS_FILE = original_file
            persistence.BACKUP_FILE = original_backup

    def test_load_tasks_invalid_schema_version(self, tmp_path, capsys):
        """Test load_tasks handles invalid schema version."""
        test_file = tmp_path / "tasks.json"
        backup_file = tmp_path / "tasks.json.backup"

        original_file = persistence.TASKS_FILE
        original_backup = persistence.BACKUP_FILE
        persistence.TASKS_FILE = test_file
        persistence.BACKUP_FILE = backup_file

        try:
            # Create file with invalid schema version
            with open(test_file, 'w') as f:
                json.dump({"version": "99.0", "tasks": []}, f)

            result = persistence.load_tasks()

            assert result == []
            captured = capsys.readouterr()
            assert "corrupted" in captured.out.lower() or "version" in captured.out.lower()

        finally:
            persistence.TASKS_FILE = original_file
            persistence.BACKUP_FILE = original_backup

    def test_load_tasks_missing_required_field(self, tmp_path, capsys):
        """Test load_tasks handles missing required fields."""
        test_file = tmp_path / "tasks.json"
        backup_file = tmp_path / "tasks.json.backup"

        original_file = persistence.TASKS_FILE
        original_backup = persistence.BACKUP_FILE
        persistence.TASKS_FILE = test_file
        persistence.BACKUP_FILE = backup_file

        try:
            # Create task data missing required field
            bad_data = {
                "version": "1.0",
                "tasks": [
                    {
                        "id": 1,
                        # Missing "title" field
                        "description": "Test",
                        "status": "incomplete",
                        "priority": "MEDIUM",
                        "tags": [],
                        "created_date": "2025-12-07T10:00:00",
                        "due_date": None,
                        "recurrence": None,
                        "completed_date": None,
                        "reminder_offset": None
                    }
                ]
            }

            with open(test_file, 'w') as f:
                json.dump(bad_data, f)

            result = persistence.load_tasks()

            assert result == []
            captured = capsys.readouterr()
            assert "corrupted" in captured.out.lower() or "warning" in captured.out.lower()

        finally:
            persistence.TASKS_FILE = original_file
            persistence.BACKUP_FILE = original_backup

    def test_load_tasks_backup_recovery_success(self, tmp_path, capsys):
        """Test successful recovery from backup when primary is corrupted."""
        test_file = tmp_path / "tasks.json"
        backup_file = tmp_path / "tasks.json.backup"

        original_file = persistence.TASKS_FILE
        original_backup = persistence.BACKUP_FILE
        persistence.TASKS_FILE = test_file
        persistence.BACKUP_FILE = backup_file

        try:
            # Create valid backup
            valid_task = Task(id=1, title="Backup task", priority=Priority.HIGH)
            backup_data = {
                "version": "1.0",
                "tasks": [persistence.TaskEncoder().default(valid_task)]
            }
            with open(backup_file, 'w') as f:
                json.dump(backup_data, f, cls=persistence.TaskEncoder)

            # Corrupt primary file
            with open(test_file, 'w') as f:
                f.write("{ corrupt }")

            result = persistence.load_tasks()

            assert len(result) == 1
            assert result[0].title == "Backup task"
            assert result[0].priority == Priority.HIGH

            captured = capsys.readouterr()
            assert "recovered" in captured.out.lower() or "backup" in captured.out.lower()

        finally:
            persistence.TASKS_FILE = original_file
            persistence.BACKUP_FILE = original_backup

    def test_load_tasks_backup_also_corrupted(self, tmp_path, capsys):
        """Test when both primary and backup are corrupted."""
        test_file = tmp_path / "tasks.json"
        backup_file = tmp_path / "tasks.json.backup"

        original_file = persistence.TASKS_FILE
        original_backup = persistence.BACKUP_FILE
        persistence.TASKS_FILE = test_file
        persistence.BACKUP_FILE = backup_file

        try:
            # Corrupt primary file
            with open(test_file, 'w') as f:
                f.write("{ corrupt }")

            # Corrupt backup file too
            with open(backup_file, 'w') as f:
                f.write("{ also corrupt }")

            result = persistence.load_tasks()

            assert result == []
            captured = capsys.readouterr()
            assert "backup" in captured.out.lower() and "corrupted" in captured.out.lower()

        finally:
            persistence.TASKS_FILE = original_file
            persistence.BACKUP_FILE = original_backup


# =============================================================================
# Serialization Edge Cases
# =============================================================================

class TestSerializationEdgeCases:
    """Test edge cases in serialization."""

    def test_serialize_task_with_all_none_optional_fields(self):
        """Test serializing task with all optional fields as None."""
        task = Task(
            id=1,
            title="Minimal task",
            description="",
            due_date=None,
            recurrence=None,
            reminder_offset=None,
            completed_date=None
        )

        json_str = persistence.serialize_tasks([task])
        data = json.loads(json_str)

        assert data["tasks"][0]["due_date"] is None
        assert data["tasks"][0]["recurrence"] is None
        assert data["tasks"][0]["reminder_offset"] is None
        assert data["tasks"][0]["completed_date"] is None

    def test_deserialize_task_with_all_optional_fields(self):
        """Test deserializing task with all optional fields populated."""
        task = Task(
            id=1,
            title="Full task",
            description="Complete description",
            priority=Priority.HIGH,
            tags=["Work", "Urgent", "Critical"],
            due_date=datetime(2025, 12, 31, 23, 59, 59),
            recurrence=RecurrencePattern.MONTHLY,
            reminder_offset=2.5,
            completed_date=datetime(2025, 12, 7, 10, 30, 0)
        )

        json_str = persistence.serialize_tasks([task])
        loaded = persistence.deserialize_tasks(json_str)

        assert len(loaded) == 1
        assert loaded[0].id == 1
        assert loaded[0].title == "Full task"
        assert loaded[0].description == "Complete description"
        assert loaded[0].priority == Priority.HIGH
        assert loaded[0].tags == ["Work", "Urgent", "Critical"]
        assert loaded[0].due_date == datetime(2025, 12, 31, 23, 59, 59)
        assert loaded[0].recurrence == RecurrencePattern.MONTHLY
        assert loaded[0].reminder_offset == 2.5
        assert loaded[0].completed_date == datetime(2025, 12, 7, 10, 30, 0)

    def test_serialize_empty_task_list(self):
        """Test serializing empty task list."""
        json_str = persistence.serialize_tasks([])
        data = json.loads(json_str)

        assert data["version"] == "1.0"
        assert data["tasks"] == []

    def test_deserialize_empty_task_list(self):
        """Test deserializing empty task list."""
        json_str = '{"version": "1.0", "tasks": []}'
        tasks = persistence.deserialize_tasks(json_str)

        assert tasks == []


# =============================================================================
# Platform-Specific Path Tests
# =============================================================================

class TestPlatformSpecificPaths:
    """Test platform-specific path resolution."""

    def test_get_app_data_dir_creates_directory(self, tmp_path):
        """Test that get_app_data_dir creates directory if missing."""
        with patch('os.environ.get', return_value=str(tmp_path)):
            with patch('os.name', 'nt'):  # Windows
                app_dir = persistence.get_app_data_dir()
                assert app_dir.exists()
                assert app_dir.is_dir()

    def test_get_app_data_dir_windows(self, tmp_path):
        """Test Windows path resolution."""
        with patch('os.environ.get', return_value=str(tmp_path)):
            with patch('os.name', 'nt'):
                app_dir = persistence.get_app_data_dir()
                assert 'todo-app' in str(app_dir)

    def test_get_app_data_dir_macos(self, tmp_path):
        """Test macOS path resolution."""
        with patch('sys.platform', 'darwin'):
            with patch('pathlib.Path.home', return_value=tmp_path):
                app_dir = persistence.get_app_data_dir()
                assert 'todo-app' in str(app_dir)


# =============================================================================
# File Locking Edge Cases
# =============================================================================

class TestFileLockingEdgeCases:
    """Test file locking edge cases."""

    def test_acquire_lock_timeout_exits(self, capsys):
        """Test that acquire_lock exits on timeout."""
        from filelock import Timeout

        with patch('src.todo.persistence.FileLock') as mock_filelock:
            mock_lock = MagicMock()
            mock_lock.acquire.side_effect = Timeout("Lock timeout")
            mock_filelock.return_value = mock_lock

            with pytest.raises(SystemExit) as exc_info:
                persistence.acquire_lock()

            assert exc_info.value.code == 1

            captured = capsys.readouterr()
            assert "already running" in captured.out.lower()

    def test_release_lock_when_not_locked(self):
        """Test releasing lock that isn't locked."""
        mock_lock = MagicMock()
        mock_lock.is_locked = False

        # Should not raise error
        persistence.release_lock(mock_lock)

    def test_release_lock_when_locked(self):
        """Test releasing locked lock."""
        mock_lock = MagicMock()
        mock_lock.is_locked = True

        persistence.release_lock(mock_lock)

        mock_lock.release.assert_called_once()


# =============================================================================
# Integration Scenarios
# =============================================================================

class TestPersistenceIntegrationScenarios:
    """End-to-end persistence scenarios."""

    def test_save_load_multiple_tasks_roundtrip(self, tmp_path):
        """Test saving and loading multiple tasks."""
        test_file = tmp_path / "tasks.json"
        original_file = persistence.TASKS_FILE
        persistence.TASKS_FILE = test_file

        try:
            tasks = [
                Task(id=1, title="Task 1", priority=Priority.HIGH),
                Task(id=2, title="Task 2", priority=Priority.MEDIUM, tags=["Work"]),
                Task(id=3, title="Task 3", priority=Priority.LOW,
                     due_date=datetime(2025, 12, 25), recurrence=RecurrencePattern.DAILY)
            ]

            persistence.save_tasks(tasks)
            loaded = persistence.load_tasks()

            assert len(loaded) == 3
            assert loaded[0].title == "Task 1"
            assert loaded[0].priority == Priority.HIGH
            assert loaded[1].tags == ["Work"]
            assert loaded[2].recurrence == RecurrencePattern.DAILY

        finally:
            persistence.TASKS_FILE = original_file

    def test_incremental_saves_create_backups(self, tmp_path):
        """Test that multiple saves create backup files."""
        test_file = tmp_path / "tasks.json"
        backup_file = tmp_path / "tasks.json.backup"

        original_file = persistence.TASKS_FILE
        original_backup = persistence.BACKUP_FILE
        persistence.TASKS_FILE = test_file
        persistence.BACKUP_FILE = backup_file

        try:
            # First save
            task1 = Task(id=1, title="First save")
            persistence.save_tasks([task1])
            assert test_file.exists()

            # Second save - should create backup
            task2 = Task(id=2, title="Second save")
            persistence.save_tasks([task1, task2])
            assert backup_file.exists()

            # Backup should contain first version
            with open(backup_file) as f:
                backup_data = json.load(f)
                assert len(backup_data["tasks"]) == 1
                assert backup_data["tasks"][0]["title"] == "First save"

        finally:
            persistence.TASKS_FILE = original_file
            persistence.BACKUP_FILE = original_backup
