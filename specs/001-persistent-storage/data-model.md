# Data Model: Persistent Storage

**Feature**: Persistent Data Storage
**Phase**: 1 (Design & Contracts)
**Date**: 2025-12-07

## Overview

This document defines the data model extensions required for persistent storage. The existing `Task` dataclass remains unchanged; we add serialization/deserialization logic and file format specification.

---

## Existing Data Model (No Changes)

### Task Entity (from models.py)

```python
@dataclass
class Task:
    id: int
    title: str
    description: str = ""
    status: str = "incomplete"  # "complete" or "incomplete"
    priority: Priority = Priority.MEDIUM
    tags: List[str] = field(default_factory=list)
    task_type: TaskType = TaskType.ACTIVITY
    created_date: datetime = field(default_factory=datetime.now)
    due_date: Optional[datetime] = None
    recurrence: Optional[RecurrencePattern] = None
    completed_date: Optional[datetime] = None
    reminder_offset: Optional[float] = None
```

**Rationale**: Existing model already has all required fields. No schema changes needed.

---

## JSON Storage Schema

### File Structure

```json
{
  "version": "1.0",
  "tasks": [
    {
      "id": 1,
      "title": "Buy groceries",
      "description": "Milk, eggs, bread",
      "status": "incomplete",
      "priority": "HIGH",
      "tags": ["Home", "Shopping"],
      "task_type": "scheduled",
      "created_date": "2025-12-07T10:30:00",
      "due_date": "2025-12-07T18:00:00",
      "recurrence": null,
      "completed_date": null,
      "reminder_offset": 1.0
    },
    {
      "id": 2,
      "title": "Write report",
      "description": "",
      "status": "complete",
      "priority": "MEDIUM",
      "tags": ["Work"],
      "task_type": "activity",
      "created_date": "2025-12-06T09:00:00",
      "due_date": null,
      "recurrence": null,
      "completed_date": "2025-12-06T15:30:00",
      "reminder_offset": null
    }
  ]
}
```

### Schema Version 1.0 Specification

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `version` | string | Yes | Schema version for migrations | Must be "1.0" |
| `tasks` | array | Yes | Array of task objects | Empty array if no tasks |

### Task Object Schema

| Field | Type | Required | Description | Format/Values |
|-------|------|----------|-------------|---------------|
| `id` | integer | Yes | Unique task ID | Positive integer, auto-increment |
| `title` | string | Yes | Task title | Non-empty string |
| `description` | string | Yes | Task description | Can be empty string |
| `status` | string | Yes | Completion status | "complete" or "incomplete" |
| `priority` | string | Yes | Priority level | "HIGH", "MEDIUM", or "LOW" |
| `tags` | array[string] | Yes | Tag list | Can be empty array |
| `task_type` | string | Yes | Task classification | "scheduled" or "activity" |
| `created_date` | string | Yes | Creation timestamp | ISO 8601 format |
| `due_date` | string or null | Yes | Due date/time | ISO 8601 or null |
| `recurrence` | string or null | Yes | Recurrence pattern | "DAILY", "WEEKLY", "MONTHLY", "YEARLY", or null |
| `completed_date` | string or null | Yes | Completion timestamp | ISO 8601 or null |
| `reminder_offset` | number or null | Yes | Reminder hours before due | Float (hours) or null |

---

## Serialization Layer

### Python → JSON Encoding

```python
from dataclasses import asdict
from datetime import datetime
from enum import Enum
import json

class TaskEncoder(json.JSONEncoder):
    """Custom JSON encoder for Task objects."""

    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, Enum):
            return obj.value
        if hasattr(obj, '__dataclass_fields__'):  # is_dataclass check
            return asdict(obj)
        return super().default(obj)

def serialize_tasks(tasks: List[Task]) -> str:
    """Convert task list to JSON string."""
    data = {
        "version": "1.0",
        "tasks": tasks
    }
    return json.dumps(data, cls=TaskEncoder, indent=2)
```

### JSON → Python Decoding

```python
from datetime import datetime
from typing import Dict, Any

def deserialize_tasks(json_str: str) -> List[Task]:
    """Convert JSON string to task list."""
    data = json.loads(json_str)

    # Validate schema version
    if data.get("version") != "1.0":
        raise ValueError(f"Unsupported schema version: {data.get('version')}")

    # Deserialize each task
    tasks = [task_from_dict(item) for item in data.get("tasks", [])]
    return tasks

def task_from_dict(data: Dict[str, Any]) -> Task:
    """Reconstruct Task object from dictionary."""
    return Task(
        id=data["id"],
        title=data["title"],
        description=data["description"],
        status=data["status"],
        priority=Priority(data["priority"]),  # String to Enum
        tags=data["tags"],
        task_type=TaskType(data["task_type"]),  # String to Enum
        created_date=parse_datetime(data["created_date"]),
        due_date=parse_datetime(data["due_date"]) if data["due_date"] else None,
        recurrence=RecurrencePattern(data["recurrence"]) if data["recurrence"] else None,
        completed_date=parse_datetime(data["completed_date"]) if data["completed_date"] else None,
        reminder_offset=data["reminder_offset"]
    )

def parse_datetime(iso_string: str) -> datetime:
    """Parse ISO 8601 datetime string."""
    return datetime.fromisoformat(iso_string)
```

---

## Validation Rules

### On Deserialization (Load)

1. **Schema version validation**
   - Must be "1.0" (reject unknown versions with clear error)

2. **Required field validation**
   - All fields in Task Object Schema must be present (no missing fields)
   - Raise `KeyError` with clear message if field missing

3. **Type validation**
   - `id`: Must be positive integer
   - `title`: Must be non-empty string
   - `status`: Must be "complete" or "incomplete"
   - `priority`: Must be valid Priority enum value
   - `task_type`: Must be valid TaskType enum value
   - `recurrence`: Must be valid RecurrencePattern enum value or null

4. **Datetime validation**
   - Must parse as ISO 8601 format
   - Raise `ValueError` if invalid format

5. **Logical validation**
   - If `status == "complete"`, `completed_date` should not be null (warning, not error)
   - If `task_type == "scheduled"`, `due_date` should not be null (warning, not error)

### On Serialization (Save)

1. **Type conversion**
   - Enum → value string
   - datetime → ISO 8601 string
   - None → null

2. **No validation needed**
   - Assume in-memory Task objects are always valid (created via storage.py)

---

## File Storage Metadata

### Storage Locations

- **Primary file**: `{APP_DATA_DIR}/tasks.json`
- **Backup file**: `{APP_DATA_DIR}/tasks.json.backup`
- **Lock file**: `{APP_DATA_DIR}/tasks.json.lock`

Where `{APP_DATA_DIR}` is:
- Windows: `%APPDATA%\todo-app\`
- macOS: `~/Library/Application Support/todo-app/`
- Linux: `~/.local/share/todo-app/`

### File Permissions

- **Owner**: Read/Write (0600 on Unix)
- **Group**: None
- **Others**: None

**Rationale**: Tasks may contain sensitive information (dates, descriptions)

---

## State Transitions

### Initialization (App Startup)

```
[App Start]
    ↓
[Check Lock] → [Lock Acquired?] → No → [Error: Instance Running] → [Exit]
    ↓ Yes
[Load Primary File]
    ↓
[Parse JSON] → [Valid?] → No → [Load Backup] → [Valid?] → No → [Empty List]
    ↓ Yes                            ↓ Yes
[Populate In-Memory Storage]    [Restore Primary]
    ↓
[App Ready]
```

### Save Operation (After Any Modification)

```
[Task Modified]
    ↓
[Serialize to JSON]
    ↓
[Write to Temp File] → [fsync]
    ↓
[Backup Current File] (if exists)
    ↓
[Atomic Rename: Temp → Primary]
    ↓
[Save Complete]
```

### Error Recovery

```
[Load Error Detected]
    ↓
[JSONDecodeError / ValidationError]
    ↓
[Try Backup File]
    ↓
[Backup Valid?] → Yes → [Restore & Save] → [Continue]
    ↓ No
[Rename Primary to .corrupted]
    ↓
[Start with Empty List]
    ↓
[Warn User of Data Loss]
```

---

## Migration Strategy (Future Versions)

### Version 1.0 → 2.0 (Example)

If future schema changes are needed:

1. **Add new field with default value**
   ```json
   {
     "version": "2.0",
     "tasks": [{
       ...existing fields...,
       "new_field": "default_value"
     }]
   }
   ```

2. **Migration function**
   ```python
   def migrate_v1_to_v2(data: dict) -> dict:
       data["version"] = "2.0"
       for task in data["tasks"]:
           task["new_field"] = "default_value"
       return data
   ```

3. **Automatic migration on load**
   - Detect old version
   - Run migration
   - Save migrated data
   - Log migration to user

**Not Implemented Yet**: Schema is stable at 1.0, no migrations needed currently

---

## Data Model Checklist

- [x] Task entity schema documented (no changes from existing)
- [x] JSON storage format specified
- [x] Serialization/deserialization logic designed
- [x] Validation rules defined
- [x] File locations and permissions specified
- [x] State transitions documented
- [x] Migration strategy outlined (for future)

**Status**: ✅ Data model complete, ready for contracts and implementation
