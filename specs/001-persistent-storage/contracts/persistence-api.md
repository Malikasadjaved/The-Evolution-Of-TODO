# Persistence API Contract

**Module**: `src/todo/persistence.py`
**Purpose**: File I/O operations for task persistence
**Date**: 2025-12-07

## Public API

### Module-Level Functions

---

#### `initialize_storage() -> None`

**Purpose**: Initialize storage directory and acquire file lock

**Preconditions**:
- Must be called once at application startup
- No other instance of the app should be running

**Behavior**:
1. Create app data directory if it doesn't exist
2. Acquire exclusive file lock
3. Clean up stale temp files from previous crashes
4. Validate lock acquisition or exit with error

**Returns**: None

**Raises**:
- `LockTimeout`: If another instance is running (caught internally, exits app)
- `PermissionError`: If cannot create directory or write lock file (exits app)

**Side Effects**:
- Creates `{APP_DATA_DIR}` directory
- Creates `{APP_DATA_DIR}/tasks.json.lock` file
- Sets module-level `_file_lock` variable

**Example**:
```python
initialize_storage()  # Call once at app startup
```

---

#### `load_tasks() -> List[Task]`

**Purpose**: Load all tasks from storage with automatic backup recovery

**Preconditions**:
- `initialize_storage()` has been called
- File lock is held

**Behavior**:
1. Attempt to load from primary file (`tasks.json`)
2. If corrupted, attempt to load from backup (`tasks.json.backup`)
3. If backup succeeds, restore primary file
4. If both fail, return empty list and warn user
5. Preserve corrupted files as `.corrupted` for debugging

**Returns**: `List[Task]` - Loaded tasks (empty list if no data or corruption)

**Raises**: None (handles all errors internally)

**Side Effects**:
- May print warnings to stdout
- May restore primary file from backup
- May rename corrupted files to `.corrupted`

**Performance**: <2 seconds for 1000+ tasks (spec requirement)

**Example**:
```python
tasks = load_tasks()
print(f"Loaded {len(tasks)} tasks")
```

---

#### `save_tasks(tasks: List[Task]) -> None`

**Purpose**: Atomically save all tasks to storage with backup rotation

**Preconditions**:
- `initialize_storage()` has been called
- File lock is held
- `tasks` is a valid list of Task objects

**Behavior**:
1. Serialize tasks to JSON (with schema version)
2. Write to temporary file (`tasks.json.tmp`)
3. Flush and fsync to ensure data on disk
4. Backup current file to `.backup` (if exists)
5. Atomic rename: tmp → primary
6. Clean up temp file if error occurs

**Parameters**:
- `tasks`: List of Task objects to save

**Returns**: None

**Raises**:
- `PermissionError`: Insufficient permissions (caught, warn user, continue)
- `OSError` (ENOSPC): Disk full (caught, warn user, continue)
- Other `OSError`: Generic I/O error (caught, warn user, continue)

**Side Effects**:
- Writes `tasks.json`, `tasks.json.backup`, `tasks.json.tmp` files
- May print warnings to stdout if save fails

**Performance**: <1 second per operation (spec requirement)

**Example**:
```python
save_tasks(all_tasks)
```

---

#### `shutdown_storage() -> None`

**Purpose**: Release file lock and clean up resources

**Preconditions**:
- `initialize_storage()` has been called

**Behavior**:
1. Release file lock
2. Clean up lock file (optional, lock library handles this)

**Returns**: None

**Raises**: None

**Side Effects**:
- Releases `tasks.json.lock`

**Example**:
```python
# Called on app exit
shutdown_storage()
```

---

## Internal Functions (Private API)

### `_get_app_data_dir() -> Path`

**Purpose**: Get platform-specific app data directory

**Returns**: `Path` object pointing to app data directory

**Platforms**:
- Windows: `%APPDATA%\todo-app\`
- macOS: `~/Library/Application Support/todo-app/`
- Linux: `~/.local/share/todo-app/`

---

### `_serialize_tasks(tasks: List[Task]) -> str`

**Purpose**: Convert task list to JSON string

**Parameters**:
- `tasks`: List of Task objects

**Returns**: JSON string with schema version

**Raises**:
- `TypeError`: If task contains non-serializable data (should never happen)

---

### `_deserialize_tasks(json_str: str) -> List[Task]`

**Purpose**: Convert JSON string to task list

**Parameters**:
- `json_str`: JSON string from file

**Returns**: List of Task objects

**Raises**:
- `json.JSONDecodeError`: Invalid JSON syntax
- `KeyError`: Missing required field
- `ValueError`: Invalid enum value or datetime format

---

### `_validate_schema_version(data: dict) -> None`

**Purpose**: Check schema version compatibility

**Parameters**:
- `data`: Parsed JSON dict

**Raises**:
- `ValueError`: If unsupported schema version

---

### `_atomic_write(filepath: Path, content: str) -> None`

**Purpose**: Write file atomically with backup rotation

**Parameters**:
- `filepath`: Target file path
- `content`: String content to write

**Raises**:
- `OSError`: I/O errors (disk full, permissions, etc.)

---

## Module-Level State

```python
_file_lock: Optional[FileLock] = None  # Global file lock instance
_storage_initialized: bool = False      # Initialization flag

STORAGE_DIR: Path                       # App data directory
TASKS_FILE: Path                        # Primary storage file
BACKUP_FILE: Path                       # Backup storage file
LOCK_FILE: Path                         # Lock file
```

---

## Error Handling Contract

### Graceful Degradation

All errors are caught and handled gracefully per FR-012:

| Error Type | Behavior | User Message |
|------------|----------|--------------|
| Lock timeout | Exit app | "Another instance of todo-app is already running. Please close it first." |
| Permission denied (save) | Continue in-memory mode | "⚠ Warning: Cannot save tasks (permission denied). Changes will be lost on exit!" |
| Disk full | Continue in-memory mode | "⚠ Warning: Disk full - cannot save tasks! Free up space to enable persistence." |
| Corrupted primary file | Restore from backup | "Warning: Primary storage corrupted. Recovering from backup..." |
| Both files corrupted | Start fresh | "Error: Storage corrupted and backup unusable. Starting with empty task list." |
| Missing directory | Create automatically | (No message - silent recovery) |

### No Exceptions Leak to Caller

- All public functions handle exceptions internally
- User sees friendly error messages, not Python tracebacks
- App never crashes due to persistence errors

---

## Integration with storage.py

### Hooks in Existing Functions

```python
# In src/todo/storage.py

def create_task(...) -> Task:
    task = Task(...)
    tasks.append(task)
    task_index[task.id] = len(tasks) - 1
    persistence.save_tasks(tasks)  # NEW: Auto-save after create
    return task

def update_task(...) -> Task:
    ...
    persistence.save_tasks(tasks)  # NEW: Auto-save after update
    return task

def delete_task(...) -> bool:
    ...
    persistence.save_tasks(tasks)  # NEW: Auto-save after delete
    return True

def mark_complete(...) -> Task:
    ...
    persistence.save_tasks(tasks)  # NEW: Auto-save after status change
    return task
```

### Initialization in main.py

```python
# In main.py

from src.todo import persistence, storage

def main():
    # Initialize persistence layer
    persistence.initialize_storage()

    # Load existing tasks
    loaded_tasks = persistence.load_tasks()

    # Populate in-memory storage
    storage.tasks = loaded_tasks
    storage._rebuild_index()  # Rebuild task_index dict

    try:
        # Run CLI loop
        cli.run()
    finally:
        # Clean up on exit
        persistence.shutdown_storage()
```

---

## Thread Safety

**Not Thread-Safe**: This API is designed for single-threaded CLI application

**Rationale**:
- CLI apps run in single thread
- File locking prevents concurrent processes, not threads
- Adding thread safety would complicate code without benefit

**Future**: If multi-threading added, use `threading.Lock()` around save/load

---

## Testing Contract

### Unit Tests (test_persistence.py)

1. **Serialization tests**
   - Task → JSON → Task roundtrip
   - Enum conversion (Priority, TaskType, RecurrencePattern)
   - Datetime ISO format roundtrip
   - Optional fields (None values)

2. **File I/O tests**
   - Atomic write creates temp file
   - Backup rotation works
   - Corrupted file recovery
   - Empty file handling

3. **Lock tests**
   - Lock acquired on init
   - Second instance blocked
   - Lock released on shutdown
   - Stale lock cleanup

4. **Error handling tests**
   - Permission denied scenarios
   - Disk full scenarios
   - Invalid JSON recovery
   - Missing fields recovery

5. **Platform tests**
   - Correct paths on Windows/macOS/Linux
   - Directory creation on all platforms

### Integration Tests (test_storage.py extensions)

1. **Full lifecycle test**
   - Create tasks → save → exit → restart → load → verify

2. **Crash simulation**
   - Create tasks → kill -9 → restart → verify persistence

3. **Large dataset test**
   - 1000 tasks → save → load → verify <2s load time

---

## Contract Checklist

- [x] All public functions documented with pre/post conditions
- [x] Parameters and return types specified
- [x] Error handling behavior defined
- [x] Side effects documented
- [x] Performance requirements noted
- [x] Integration points with existing code specified
- [x] Thread safety clarified
- [x] Testing requirements outlined

**Status**: ✅ API contract complete
