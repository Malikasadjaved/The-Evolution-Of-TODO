"""Persistent storage for tasks using JSON files.

This module handles file I/O operations for task persistence, including:
- JSON serialization/deserialization of Task objects
- Atomic file writes with backup rotation
- File locking to prevent concurrent access
- Platform-specific storage path resolution
- Graceful error handling and backup recovery
"""

from dataclasses import asdict
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import List, Dict, Any, Optional
import json
import os
import sys
import shutil
from filelock import FileLock, Timeout

from src.todo.models import Task, Priority, TaskType, RecurrencePattern


# Module-level state
_file_lock: Optional[FileLock] = None
_storage_initialized: bool = False


# =============================================================================
# JSON Serialization (T010-T015)
# =============================================================================

class TaskEncoder(json.JSONEncoder):
    """Custom JSON encoder for Task objects.

    Handles serialization of:
    - datetime objects → ISO 8601 strings
    - Enum objects → enum values
    - dataclass objects → dictionaries
    """

    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, Enum):
            return obj.value
        if hasattr(obj, '__dataclass_fields__'):  # is_dataclass check
            return asdict(obj)
        return super().default(obj)


def serialize_tasks(tasks: List[Task]) -> str:
    """Convert task list to JSON string with schema version.

    Args:
        tasks: List of Task objects to serialize

    Returns:
        JSON string with version and tasks

    Example:
        >>> json_str = serialize_tasks([task1, task2])
        >>> '{"version": "1.0", "tasks": [...]}'
    """
    data = {
        "version": "1.0",
        "tasks": tasks
    }
    return json.dumps(data, cls=TaskEncoder, indent=2)


def deserialize_tasks(json_str: str) -> List[Task]:
    """Convert JSON string to task list with validation.

    Args:
        json_str: JSON string from file

    Returns:
        List of Task objects

    Raises:
        ValueError: If schema version unsupported
        json.JSONDecodeError: If invalid JSON
        KeyError: If required field missing
    """
    data = json.loads(json_str)

    # Validate schema version
    _validate_schema_version(data)

    # Deserialize each task
    tasks = [_task_from_dict(item) for item in data.get("tasks", [])]
    return tasks


def _task_from_dict(data: Dict[str, Any]) -> Task:
    """Reconstruct Task object from dictionary.

    Args:
        data: Dictionary with task fields

    Returns:
        Task object

    Raises:
        KeyError: If required field missing
        ValueError: If invalid enum value or datetime format

    Note:
        task_type is a computed property (not a field) so it's not set during construction.
        It will be automatically computed from the due_date field.
    """
    return Task(
        id=data["id"],
        title=data["title"],
        description=data["description"],
        status=data["status"],
        priority=Priority(data["priority"]),  # String → Enum
        tags=data["tags"],
        # task_type is computed from due_date, not stored
        created_date=_parse_datetime(data["created_date"]),
        due_date=_parse_datetime(data["due_date"]) if data["due_date"] else None,
        recurrence=RecurrencePattern(data["recurrence"]) if data["recurrence"] else None,
        completed_date=_parse_datetime(data["completed_date"]) if data["completed_date"] else None,
        reminder_offset=data["reminder_offset"]
    )


def _parse_datetime(iso_string: str) -> datetime:
    """Parse ISO 8601 datetime string.

    Args:
        iso_string: ISO format datetime string

    Returns:
        datetime object

    Raises:
        ValueError: If invalid datetime format
    """
    return datetime.fromisoformat(iso_string)


def _validate_schema_version(data: dict) -> None:
    """Check schema version compatibility.

    Args:
        data: Parsed JSON dict

    Raises:
        ValueError: If unsupported schema version
    """
    version = data.get("version")
    if version != "1.0":
        raise ValueError(f"Unsupported schema version: {version}")


# =============================================================================
# Platform-Specific Paths (T019-T020)
# =============================================================================

def get_app_data_dir() -> Path:
    """Get platform-specific application data directory.

    Returns:
        Path object pointing to app data directory

    Platform paths:
        - Windows: %APPDATA%\\todo-app\\
        - macOS: ~/Library/Application Support/todo-app/
        - Linux: ~/.local/share/todo-app/

    Side effects:
        Creates directory if it doesn't exist
    """
    if os.name == 'nt':  # Windows
        base = Path(os.environ.get('APPDATA', Path.home()))
    elif sys.platform == 'darwin':  # macOS
        base = Path.home() / 'Library' / 'Application Support'
    else:  # Linux/Unix
        xdg_data = os.environ.get('XDG_DATA_HOME', Path.home() / '.local' / 'share')
        base = Path(xdg_data)

    app_dir = base / 'todo-app'
    app_dir.mkdir(parents=True, exist_ok=True)
    return app_dir


# Module-level constants (T020)
STORAGE_DIR = get_app_data_dir()
TASKS_FILE = STORAGE_DIR / 'tasks.json'
BACKUP_FILE = STORAGE_DIR / 'tasks.json.backup'
LOCK_FILE = STORAGE_DIR / 'tasks.json.lock'


# =============================================================================
# File Locking (T033-T035)
# =============================================================================

def acquire_lock() -> FileLock:
    """Acquire exclusive file lock to prevent concurrent access.

    Returns:
        FileLock object (already acquired)

    Raises:
        SystemExit: If lock cannot be acquired (another instance running)

    Side effects:
        Creates lock file and holds exclusive lock
        Exits app with error message if lock unavailable
    """
    global _file_lock

    _file_lock = FileLock(LOCK_FILE, timeout=1)

    try:
        _file_lock.acquire(timeout=1)
        return _file_lock
    except Timeout:
        print("Error: Another instance of todo-app is already running.")
        print("Please close the other instance and try again.")
        sys.exit(1)


def release_lock(lock: FileLock) -> None:
    """Release file lock.

    Args:
        lock: FileLock object to release

    Side effects:
        Releases lock if held, removes lock file
    """
    if lock and lock.is_locked:
        lock.release()


# =============================================================================
# Atomic Save/Load (T037-T045)
# =============================================================================

def save_tasks(tasks: List[Task]) -> None:
    """Save tasks to file with atomic write and backup rotation.

    Args:
        tasks: List of Task objects to save

    Side effects:
        Writes tasks.json, creates .backup copy, uses temp file for atomic write
        Prints warning if save fails (permission denied, disk full, etc.)

    Error handling:
        Continues in memory-only mode if save fails
    """
    try:
        _atomic_write(TASKS_FILE, serialize_tasks(tasks))
    except PermissionError:
        print("⚠ Warning: Cannot save tasks (permission denied)")
        print("  Your changes will be lost when you exit!")
        print("  Check file permissions or run with appropriate access.")
    except OSError as e:
        import errno
        if e.errno == errno.ENOSPC:
            print("⚠ Warning: Disk full - cannot save tasks!")
        else:
            print(f"⚠ Warning: Save failed ({e})")
        print("  Continuing in memory-only mode...")


def _atomic_write(filepath: Path, content: str) -> None:
    """Write file atomically with backup rotation.

    Args:
        filepath: Target file path
        content: String content to write

    Algorithm:
        1. Write to temporary file
        2. Flush and fsync to ensure data on disk
        3. Backup current file (if exists)
        4. Atomic rename: temp → primary

    Raises:
        OSError: I/O errors (disk full, permissions, etc.)
    """
    temp_path = filepath.with_suffix('.tmp')

    # Step 1: Write to temp file
    with open(temp_path, 'w') as f:
        f.write(content)
        f.flush()
        os.fsync(f.fileno())  # Ensure written to disk

    # Step 2: Backup current file
    if filepath.exists():
        shutil.copy2(filepath, BACKUP_FILE)

    # Step 3: Atomic rename
    temp_path.replace(filepath)


def load_tasks() -> List[Task]:
    """Load tasks from file with automatic backup recovery.

    Returns:
        List of Task objects (empty list if no file or corruption)

    Error handling:
        - File not found: Returns empty list
        - JSON corrupt: Attempts backup recovery
        - Backup corrupt: Returns empty list with warning

    Side effects:
        May restore primary file from backup if corrupted
        Prints warnings to stdout for user visibility
    """
    try:
        return _load_from_file(TASKS_FILE)
    except (json.JSONDecodeError, ValueError, KeyError) as e:
        print(f"Warning: Primary storage corrupted ({e})")

        # Try backup recovery
        if BACKUP_FILE.exists():
            print("Attempting recovery from backup...")
            try:
                tasks = _load_from_file(BACKUP_FILE)
                print(f"✓ Recovered {len(tasks)} tasks from backup")
                # Restore primary file
                save_tasks(tasks)
                return tasks
            except Exception:
                print("Error: Backup file also corrupted")

        print("Starting with empty task list")
        return []


def _load_from_file(filepath: Path) -> List[Task]:
    """Load and validate tasks from JSON file.

    Args:
        filepath: Path to JSON file

    Returns:
        List of Task objects

    Raises:
        FileNotFoundError: If file doesn't exist
        json.JSONDecodeError: If invalid JSON
        ValueError: If schema validation fails
        KeyError: If required field missing
    """
    if not filepath.exists():
        return []

    with open(filepath) as f:
        json_str = f.read()

    return deserialize_tasks(json_str)
