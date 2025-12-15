# Quickstart: Implementing Persistent Storage

**Feature**: Persistent Data Storage
**For**: Developers implementing this feature
**Time Estimate**: 4-6 hours (with TDD)

## Implementation Overview

This feature adds file-based persistence to the todo app using JSON storage. You'll create a new `persistence.py` module that handles file I/O transparently, allowing the existing in-memory architecture to remain unchanged.

---

## Prerequisites

- [ ] Read `spec.md` (feature specification)
- [ ] Read `plan.md` (this file)
- [ ] Read `research.md` (technical decisions)
- [ ] Read `data-model.md` (JSON schema)
- [ ] Read `contracts/persistence-api.md` (API contract)
- [ ] User approval for constitution amendment (Principle II)

---

## Implementation Steps (TDD)

### Step 1: Setup & Dependencies (15 min)

1. **Add dependency to requirements.txt**
   ```bash
   echo "filelock==3.13.1" >> requirements.txt
   pip install -r requirements.txt
   ```

2. **Create new module**
   ```bash
   touch src/todo/persistence.py
   touch tests/test_persistence.py
   ```

3. **Verify imports work**
   ```python
   # In persistence.py
   from pathlib import Path
   import json
   from filelock import FileLock
   ```

---

### Step 2: JSON Serialization (RED → GREEN → REFACTOR)

#### 🔴 RED: Write Failing Tests

Create `tests/test_persistence.py`:

```python
import pytest
from datetime import datetime
from src.todo.models import Task, Priority, TaskType, RecurrencePattern
from src.todo.persistence import serialize_tasks, deserialize_tasks

def test_task_serialization_roundtrip():
    """Task should serialize to JSON and deserialize back identically."""
    original = Task(
        id=1,
        title="Test task",
        description="Description",
        priority=Priority.HIGH,
        tags=["Work", "Urgent"],
        task_type=TaskType.SCHEDULED,
        due_date=datetime(2025, 12, 10, 15, 30),
        recurrence=RecurrencePattern.WEEKLY
    )

    # Serialize then deserialize
    json_str = serialize_tasks([original])
    tasks = deserialize_tasks(json_str)

    # Should roundtrip perfectly
    assert len(tasks) == 1
    assert tasks[0].id == original.id
    assert tasks[0].title == original.title
    assert tasks[0].priority == Priority.HIGH  # Enum, not string
    assert tasks[0].due_date == original.due_date  # datetime, not string
    assert tasks[0].tags == ["Work", "Urgent"]
```

Run test (should fail): `pytest tests/test_persistence.py -v`

#### 🟢 GREEN: Make Tests Pass

Implement in `src/todo/persistence.py`:

```python
from dataclasses import asdict
from datetime import datetime
from enum import Enum
from typing import List, Dict, Any
import json

from src.todo.models import Task, Priority, TaskType, RecurrencePattern

class TaskEncoder(json.JSONEncoder):
    """Custom JSON encoder for Task objects."""
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, Enum):
            return obj.value
        if hasattr(obj, '__dataclass_fields__'):
            return asdict(obj)
        return super().default(obj)

def serialize_tasks(tasks: List[Task]) -> str:
    """Convert task list to JSON string."""
    data = {"version": "1.0", "tasks": tasks}
    return json.dumps(data, cls=TaskEncoder, indent=2)

def deserialize_tasks(json_str: str) -> List[Task]:
    """Convert JSON string to task list."""
    data = json.loads(json_str)

    if data.get("version") != "1.0":
        raise ValueError(f"Unsupported schema version: {data.get('version')}")

    return [_task_from_dict(item) for item in data.get("tasks", [])]

def _task_from_dict(data: Dict[str, Any]) -> Task:
    """Reconstruct Task from dict."""
    return Task(
        id=data["id"],
        title=data["title"],
        description=data["description"],
        status=data["status"],
        priority=Priority(data["priority"]),
        tags=data["tags"],
        task_type=TaskType(data["task_type"]),
        created_date=_parse_datetime(data["created_date"]),
        due_date=_parse_datetime(data["due_date"]) if data["due_date"] else None,
        recurrence=RecurrencePattern(data["recurrence"]) if data["recurrence"] else None,
        completed_date=_parse_datetime(data["completed_date"]) if data["completed_date"] else None,
        reminder_offset=data["reminder_offset"]
    )

def _parse_datetime(iso_string: str) -> datetime:
    """Parse ISO 8601 datetime."""
    return datetime.fromisoformat(iso_string)
```

Run test (should pass): `pytest tests/test_persistence.py -v`

#### 🔨 REFACTOR: Clean Up

- Add docstrings to all functions
- Add type hints
- Extract common logic
- Run `black` and `flake8`

---

### Step 3: Platform-Specific Paths (RED → GREEN → REFACTOR)

#### 🔴 RED: Write Tests

```python
def test_app_data_dir_creation():
    """App data directory should be created if missing."""
    from src.todo.persistence import get_app_data_dir
    import shutil

    # Clean up if exists
    app_dir = get_app_data_dir()
    if app_dir.exists():
        shutil.rmtree(app_dir)

    # Should create directory
    app_dir = get_app_data_dir()
    assert app_dir.exists()
    assert app_dir.is_dir()
```

#### 🟢 GREEN: Implement

```python
import os
import sys
from pathlib import Path

def get_app_data_dir() -> Path:
    """Get platform-specific app data directory."""
    if os.name == 'nt':  # Windows
        base = Path(os.environ.get('APPDATA', Path.home()))
    elif sys.platform == 'darwin':  # macOS
        base = Path.home() / 'Library' / 'Application Support'
    else:  # Linux/Unix
        xdg = os.environ.get('XDG_DATA_HOME', Path.home() / '.local' / 'share')
        base = Path(xdg)

    app_dir = base / 'todo-app'
    app_dir.mkdir(parents=True, exist_ok=True)
    return app_dir

# Module-level constants
STORAGE_DIR = get_app_data_dir()
TASKS_FILE = STORAGE_DIR / 'tasks.json'
BACKUP_FILE = STORAGE_DIR / 'tasks.json.backup'
LOCK_FILE = STORAGE_DIR / 'tasks.json.lock'
```

---

### Step 4: File Locking (RED → GREEN → REFACTOR)

#### 🔴 RED: Write Tests

```python
def test_file_lock_prevents_concurrent_access():
    """Second instance should fail to acquire lock."""
    from src.todo.persistence import acquire_lock, release_lock
    import subprocess

    lock1 = acquire_lock()
    assert lock1 is not None

    # Simulate second instance
    with pytest.raises(SystemExit):
        lock2 = acquire_lock()  # Should fail

    release_lock(lock1)
```

#### 🟢 GREEN: Implement

```python
from filelock import FileLock, Timeout
import sys

_file_lock: Optional[FileLock] = None

def acquire_lock() -> FileLock:
    """Acquire exclusive file lock."""
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
    """Release file lock."""
    if lock and lock.is_locked:
        lock.release()
```

---

### Step 5: Atomic Saves with Backup (RED → GREEN → REFACTOR)

#### 🔴 RED: Write Tests

```python
def test_atomic_save_creates_backup(tmp_path):
    """Save should create backup of previous file."""
    filepath = tmp_path / "tasks.json"

    # First save
    save_tasks_to_file([task1], filepath)
    assert filepath.exists()

    # Second save (should backup first version)
    save_tasks_to_file([task1, task2], filepath)
    backup = filepath.with_suffix('.json.backup')
    assert backup.exists()

def test_atomic_save_survives_crash(tmp_path):
    """Temp file should not corrupt primary if crash mid-write."""
    # Test that temp file is used and renamed atomically
    # (Detailed test omitted for brevity)
```

#### 🟢 GREEN: Implement

```python
import shutil
import os

def save_tasks(tasks: List[Task]) -> None:
    """Save tasks with atomic write and backup."""
    try:
        _atomic_write(TASKS_FILE, serialize_tasks(tasks))
    except PermissionError:
        print("⚠ Warning: Cannot save tasks (permission denied)")
        print("  Your changes will be lost when you exit!")
    except OSError as e:
        print(f"⚠ Warning: Save failed ({e})")
        print("  Continuing in memory-only mode...")

def _atomic_write(filepath: Path, content: str) -> None:
    """Write file atomically with backup."""
    temp_path = filepath.with_suffix('.tmp')

    # Write to temp file
    with open(temp_path, 'w') as f:
        f.write(content)
        f.flush()
        os.fsync(f.fileno())

    # Backup current file
    if filepath.exists():
        shutil.copy2(filepath, filepath.with_suffix('.backup'))

    # Atomic rename
    temp_path.replace(filepath)
```

---

### Step 6: Load with Backup Recovery (RED → GREEN → REFACTOR)

#### 🔴 RED: Write Tests

```python
def test_load_recovers_from_corrupted_file(tmp_path):
    """Load should restore from backup if primary corrupted."""
    tasks = [task1, task2]
    save_tasks_to_file(tasks, tmp_path / "tasks.json")

    # Corrupt primary file
    (tmp_path / "tasks.json").write_text("invalid json {{{")

    # Load should recover from backup
    loaded = load_tasks_from_dir(tmp_path)
    assert len(loaded) == 2
```

#### 🟢 GREEN: Implement

```python
def load_tasks() -> List[Task]:
    """Load tasks with automatic backup recovery."""
    try:
        return _load_from_file(TASKS_FILE)
    except (json.JSONDecodeError, ValueError, KeyError) as e:
        print(f"Warning: Primary storage corrupted ({e})")

        # Try backup
        if BACKUP_FILE.exists():
            print("Attempting recovery from backup...")
            try:
                tasks = _load_from_file(BACKUP_FILE)
                print(f"✓ Recovered {len(tasks)} tasks from backup")
                save_tasks(tasks)  # Restore primary
                return tasks
            except Exception:
                print("Error: Backup file also corrupted")

        print("Starting with empty task list")
        return []

def _load_from_file(filepath: Path) -> List[Task]:
    """Load and validate tasks from file."""
    if not filepath.exists():
        return []

    with open(filepath) as f:
        json_str = f.read()

    return deserialize_tasks(json_str)
```

---

### Step 7: Integration with storage.py

Modify `src/todo/storage.py` to call persistence layer:

```python
from src.todo import persistence

def create_task(...) -> Task:
    # ... existing code ...
    persistence.save_tasks(tasks)  # Add this line
    return task

def update_task(...) -> Task:
    # ... existing code ...
    persistence.save_tasks(tasks)  # Add this line
    return task

def delete_task(...) -> bool:
    # ... existing code ...
    persistence.save_tasks(tasks)  # Add this line
    return True

def mark_complete(...) -> Task:
    # ... existing code ...
    persistence.save_tasks(tasks)  # Add this line
    return task
```

**Write integration tests** in `tests/test_storage.py`:

```python
def test_create_task_persists(tmp_path, monkeypatch):
    """Creating task should auto-save to disk."""
    # Patch TASKS_FILE to use tmp_path
    # Create task
    # Verify JSON file exists and contains task
```

---

### Step 8: Update main.py

Add initialization and shutdown:

```python
from src.todo import persistence, storage, cli

def main():
    # Initialize persistence
    persistence.acquire_lock()

    # Load existing tasks
    loaded = persistence.load_tasks()
    storage.tasks = loaded
    storage.task_index = {t.id: i for i, t in enumerate(loaded)}
    storage.next_task_id = max([t.id for t in loaded], default=0) + 1

    try:
        cli.run()
    finally:
        persistence.release_lock(_file_lock)

if __name__ == "__main__":
    main()
```

---

## Testing Checklist

Run all tests after each step:

```bash
# Run specific test file
pytest tests/test_persistence.py -v

# Run all tests
pytest tests/ -v

# Check coverage
pytest tests/ --cov=src/todo --cov-report=term-missing

# Ensure ≥90% coverage for persistence.py
pytest tests/test_persistence.py --cov=src/todo/persistence --cov-report=term
```

---

## Quality Gates

Before marking complete:

- [ ] All tests pass (`pytest tests/ -v`)
- [ ] Coverage ≥90% for `persistence.py`
- [ ] Coverage ≥85% overall (constitution requirement)
- [ ] `black src/ tests/` (no changes)
- [ ] `flake8 src/ tests/` (no errors)
- [ ] `mypy src/` (no type errors)
- [ ] Manual test: Create tasks → exit → reopen → verify persisted
- [ ] Manual test: Create tasks → kill -9 → reopen → verify persisted
- [ ] Manual test: Run two instances → second shows error message

---

## Common Pitfalls

1. **Forgetting to fsync before rename**
   - Data may not be on disk, lose on crash
   - Always call `os.fsync(f.fileno())` after write

2. **Not handling optional fields in JSON**
   - `due_date`, `recurrence`, `completed_date` can be `null`
   - Check `if data["field"]` before parsing datetime

3. **Enum deserialization**
   - JSON has string values ("HIGH"), not enum objects
   - Must call `Priority(data["priority"])` to reconstruct

4. **Platform path differences**
   - Use `pathlib.Path`, not string concatenation
   - Test on Windows (different path separator)

5. **Lock file cleanup**
   - `filelock` handles cleanup automatically
   - Don't manually delete `.lock` files

---

## Verification

After implementation, run this manual verification:

```bash
# 1. Create tasks
python main.py
> add "Task 1"
> add "Task 2" --priority HIGH
> exit

# 2. Verify file exists
ls ~/.local/share/todo-app/  # Linux
ls ~/Library/Application\ Support/todo-app/  # macOS
dir %APPDATA%\todo-app\  # Windows

# Should see: tasks.json, tasks.json.backup, tasks.json.lock

# 3. Verify content
cat ~/.local/share/todo-app/tasks.json
# Should show JSON with version and tasks array

# 4. Restart and verify persistence
python main.py
> list
# Should show Task 1 and Task 2

# 5. Test concurrent access
python main.py &  # Start first instance
python main.py    # Try second instance
# Should show error: "Another instance is already running"
```

---

## Time Estimates (with TDD)

- Step 1 (Setup): 15 min
- Step 2 (Serialization): 45 min
- Step 3 (Paths): 30 min
- Step 4 (Locking): 30 min
- Step 5 (Atomic saves): 60 min
- Step 6 (Load/recovery): 45 min
- Step 7 (Integration): 30 min
- Step 8 (main.py): 15 min
- Testing & QA: 60 min

**Total**: ~5 hours

---

## Next Steps

After implementation:

1. Run `/sp.tasks` to generate detailed task breakdown
2. Create ADR for constitution amendment
3. Update constitution Section II with new wording
4. Create PHR documenting implementation session
5. Consider creating reusable "persistence" skill for future features

---

## Questions?

- Check `contracts/persistence-api.md` for API details
- Check `data-model.md` for JSON schema
- Check `research.md` for technical decisions
- Refer to spec.md for requirements

**Status**: ✅ Quickstart guide complete
