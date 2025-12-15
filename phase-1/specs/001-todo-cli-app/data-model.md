# Data Model

**Feature**: Python CLI Todo Application
**Branch**: `001-todo-cli-app`
**Date**: 2025-12-06

## Overview

This document defines the data model for the Python CLI Todo Application, including entities, enumerations, relationships, validation rules, and state transitions.

## Entities

### Task

The core entity representing a todo item.

**Attributes**:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| id | int | Yes | Auto-generated | Unique task identifier (auto-incremented) |
| title | str | Yes | - | Task title (user-provided, non-empty) |
| description | str | No | "" | Task description (optional, can be empty) |
| status | str | Yes | "incomplete" | Completion status: "complete" or "incomplete" |
| priority | Priority | Yes | Priority.MEDIUM | Task priority level (enum) |
| tags | List[str] | No | [] | List of tags/categories (Work, Home, custom) |
| created_date | datetime | Yes | datetime.now() | Timestamp when task was created |
| due_date | Optional[datetime] | No | None | Optional due date and time |
| recurrence | Optional[RecurrencePattern] | No | None | Optional recurrence pattern (enum) |
| completed_date | Optional[datetime] | No | None | Timestamp when task was marked complete |
| reminder_offset | Optional[timedelta] | No | None | Time before due_date to trigger reminder (e.g., 1 hour) |

**Computed Properties**:

| Property | Type | Computation | Description |
|----------|------|-------------|-------------|
| is_overdue | bool | `due_date and datetime.now() > due_date and status == "incomplete"` | True if task is past due and incomplete |
| task_type | TaskType | `TaskType.SCHEDULED if due_date else TaskType.ACTIVITY` | Scheduled (has due date) or Activity (no due date) |

**Validation Rules**:

- `title` MUST NOT be empty (min length: 1)
- `status` MUST be one of: "complete", "incomplete"
- `priority` MUST be valid Priority enum value
- `tags` MUST be list of non-empty strings (no whitespace-only tags)
- `due_date` if provided, MUST be valid datetime (not before 1900-01-01)
- `recurrence` if provided, MUST be valid RecurrencePattern enum AND `due_date` MUST be set
- `completed_date` if set, `status` MUST be "complete"
- `reminder_offset` if set, `due_date` MUST be set

**Relationships**:

- Task → Reminder: One task can have zero or one active reminder configuration
- Recurring Task → Task Instances: A recurring task template generates new task instances upon completion

**Invariants**:

1. Task ID is immutable once assigned
2. Created date is immutable (never updated)
3. Completed date can only be set when status changes to "complete"
4. Recurrence pattern cannot be set without a due date
5. Reminder cannot be set without a due date

### Reminder

Represents a notification configuration for a task.

**Attributes**:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| task_id | int | Yes | - | Reference to task ID |
| reminder_time | datetime | Yes | Computed | Exact time to trigger notification (due_date - reminder_offset) |
| status | str | Yes | "pending" | Reminder status: "pending", "triggered", "cancelled", "missed" |
| notification_message | str | Yes | Auto-generated | Message to display in notification |

**Computed Fields**:

- `reminder_time = task.due_date - task.reminder_offset`
- `notification_message = f"Reminder: {task.title} is due at {task.due_date.strftime('%Y-%m-%d %H:%M')}"`

**Validation Rules**:

- `task_id` MUST reference an existing Task
- `reminder_time` MUST be in the future when created
- `status` MUST be one of: "pending", "triggered", "cancelled", "missed"

**State Transitions**:

```
pending → triggered (when current_time >= reminder_time and task incomplete)
pending → cancelled (when task marked complete before reminder_time)
pending → missed (when system offline at reminder_time, shown as OVERDUE when online)
triggered → [terminal state, no further transitions]
cancelled → [terminal state, no further transitions]
missed → triggered (when shown to user after coming back online)
```

## Enumerations

### Priority

Task priority levels.

**Values**:

```python
class Priority(Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
```

**Display Indicators**:

- HIGH: `[H]` (RED color)
- MEDIUM: `[M]` (YELLOW color)
- LOW: `[L]` (GREEN color)

**Sort Order**: HIGH (0) > MEDIUM (1) > LOW (2)

### TaskType

Task classification based on time-sensitivity.

**Values**:

```python
class TaskType(Enum):
    SCHEDULED = "scheduled"  # Has due date
    ACTIVITY = "activity"    # No due date, priority-based
```

**Derivation**: Computed from Task.due_date (not stored separately)

### RecurrencePattern

Repeating task intervals.

**Values**:

```python
class RecurrencePattern(Enum):
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    BIWEEKLY = "BIWEEKLY"
    MONTHLY = "MONTHLY"
    YEARLY = "YEARLY"
```

**Recurrence Calculation Rules**:

- DAILY: Add 1 day to current due_date
- WEEKLY: Add 7 days to current due_date
- BIWEEKLY: Add 14 days to current due_date
- MONTHLY: Add 1 month to current due_date (handle month-end: use last valid day)
  - Example: Jan 31 → Feb 28/29, Mar 31, Apr 30, May 31...
- YEARLY: Add 1 year to current due_date (handle leap year: Feb 29 → Feb 28 in non-leap years)

**Edge Case Handling**:

- Month-end dates (31st): Use `min(day, last_day_of_target_month)`
- Leap year (Feb 29): If next year is not leap year, use Feb 28
- Implementation: Use `python-dateutil.rrule` for robust calculation

## Storage Schema (In-Memory)

### Primary Storage

**Structure**:

```python
# Global state in storage.py module
tasks: List[Task] = []
task_index: Dict[int, int] = {}  # {task_id: list_index} for O(1) lookup
next_task_id: int = 1
reminders: Dict[int, Reminder] = {}  # {task_id: Reminder}
```

**Invariants**:

1. `task_index[task.id] == i` where `tasks[i].id == task.id` for all tasks
2. `next_task_id > max(task.id for task in tasks)` (always)
3. All task IDs in `task_index` exist in `tasks`
4. All task IDs in `reminders` exist in `tasks`

**Data Integrity Rules**:

- When task is added: append to `tasks`, add to `task_index`, increment `next_task_id`
- When task is updated: update in place, maintain `task_index`
- When task is deleted: remove from `tasks`, rebuild `task_index`, remove from `reminders`
- When task is completed with recurrence: create new task instance, reset original task

### Index Maintenance

**Operations**:

```python
def add_task(task: Task) -> None:
    """Add task to storage, update index."""
    tasks.append(task)
    task_index[task.id] = len(tasks) - 1

def get_task(task_id: int) -> Optional[Task]:
    """O(1) lookup by ID."""
    idx = task_index.get(task_id)
    return tasks[idx] if idx is not None else None

def update_task(task_id: int, **updates) -> bool:
    """Update task fields, maintain index."""
    idx = task_index.get(task_id)
    if idx is None:
        return False
    task = tasks[idx]
    for key, value in updates.items():
        setattr(task, key, value)
    return True

def delete_task(task_id: int) -> bool:
    """Delete task, rebuild index."""
    idx = task_index.get(task_id)
    if idx is None:
        return False
    del tasks[idx]
    # Rebuild index (O(n) but infrequent operation)
    task_index.clear()
    for i, task in enumerate(tasks):
        task_index[task.id] = i
    # Remove associated reminder
    reminders.pop(task_id, None)
    return True
```

## State Transitions

### Task Status

```
[Created] → incomplete (initial state)
incomplete → complete (mark_complete)
complete → incomplete (mark_incomplete)
```

**Transitions**:

- `mark_complete()`:
  - Set `status = "complete"`
  - Set `completed_date = datetime.now()`
  - If recurrence pattern set: Create new task instance with next due date
  - Cancel pending reminder for this task

- `mark_incomplete()`:
  - Set `status = "incomplete"`
  - Clear `completed_date = None`
  - Recalculate reminder if reminder_offset is set

### Recurring Task Lifecycle

```
[Recurring Template Created] → incomplete with due_date and recurrence
    ↓ (mark_complete)
[New Instance Created] → incomplete with next_due_date and same recurrence
    ↓ (mark_complete)
[Another Instance Created] → ...
    ↓ (stop_recurrence)
[Final Instance] → complete (no new instance created)
```

**Recurrence Instance Creation**:

1. Original task marked complete
2. Calculate `next_due_date` using recurrence pattern
3. Create new task with:
   - New ID (auto-generated)
   - Same title, description, priority, tags, recurrence
   - `due_date = next_due_date`
   - `status = "incomplete"`
   - `created_date = datetime.now()`
   - `completed_date = None`
4. Optional: Archive or mark original as completed

## Validation Functions

### Task Validation

```python
def validate_task(task: Task) -> List[str]:
    """Validate task fields, return list of error messages."""
    errors = []

    if not task.title or not task.title.strip():
        errors.append("Title cannot be empty")

    if task.status not in ["complete", "incomplete"]:
        errors.append("Status must be 'complete' or 'incomplete'")

    if task.priority not in Priority:
        errors.append("Priority must be HIGH, MEDIUM, or LOW")

    if any(not tag.strip() for tag in task.tags):
        errors.append("Tags cannot be empty or whitespace-only")

    if task.recurrence and not task.due_date:
        errors.append("Recurrence pattern requires due date")

    if task.completed_date and task.status != "complete":
        errors.append("Completed date can only be set when status is 'complete'")

    if task.reminder_offset and not task.due_date:
        errors.append("Reminder requires due date")

    return errors
```

### Date Validation

```python
def validate_date_string(date_str: str) -> Optional[datetime]:
    """Parse and validate date string (YYYY-MM-DD or YYYY-MM-DD HH:MM)."""
    try:
        # Try with time first
        if ' ' in date_str:
            return datetime.strptime(date_str, "%Y-%m-%d %H:%M")
        else:
            return datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        return None
```

## Examples

### Example: Basic Task

```python
task = Task(
    id=1,
    title="Buy groceries",
    description="Milk, eggs, bread",
    status="incomplete",
    priority=Priority.MEDIUM,
    tags=["Personal", "Shopping"],
    created_date=datetime(2025, 12, 6, 10, 0),
    due_date=None,
    recurrence=None,
    completed_date=None,
    reminder_offset=None
)

# Computed properties
assert task.task_type == TaskType.ACTIVITY
assert task.is_overdue == False
```

### Example: Scheduled Task with Reminder

```python
task = Task(
    id=2,
    title="Team meeting",
    description="Weekly sync",
    status="incomplete",
    priority=Priority.HIGH,
    tags=["Work", "Meeting"],
    created_date=datetime(2025, 12, 6, 10, 0),
    due_date=datetime(2025, 12, 10, 14, 0),  # Dec 10 at 2 PM
    recurrence=None,
    completed_date=None,
    reminder_offset=timedelta(hours=1)  # Remind 1 hour before
)

# Computed properties
assert task.task_type == TaskType.SCHEDULED
# is_overdue depends on current time vs due_date

# Reminder
reminder = Reminder(
    task_id=2,
    reminder_time=datetime(2025, 12, 10, 13, 0),  # 1 hour before
    status="pending",
    notification_message="Reminder: Team meeting is due at 2025-12-10 14:00"
)
```

### Example: Recurring Task

```python
task = Task(
    id=3,
    title="Submit weekly report",
    description="Status update for management",
    status="incomplete",
    priority=Priority.HIGH,
    tags=["Work", "Report"],
    created_date=datetime(2025, 12, 6, 10, 0),
    due_date=datetime(2025, 12, 13, 17, 0),  # Next Friday at 5 PM
    recurrence=RecurrencePattern.WEEKLY,
    completed_date=None,
    reminder_offset=timedelta(days=1)  # Remind 1 day before
)

# When task is completed on Dec 13:
# 1. Set task.status = "complete", completed_date = datetime.now()
# 2. Create new task instance:
new_task = Task(
    id=4,  # New ID
    title="Submit weekly report",  # Same title
    description="Status update for management",  # Same description
    status="incomplete",
    priority=Priority.HIGH,  # Same priority
    tags=["Work", "Report"],  # Same tags
    created_date=datetime(2025, 12, 13, 18, 0),  # New creation time
    due_date=datetime(2025, 12, 20, 17, 0),  # Next week (Dec 20 at 5 PM)
    recurrence=RecurrencePattern.WEEKLY,  # Same recurrence
    completed_date=None,
    reminder_offset=timedelta(days=1)  # Same reminder offset
)
```

### Example: Month-End Recurrence Edge Case

```python
# Task created on Jan 31
task = Task(
    id=5,
    title="Monthly backup",
    due_date=datetime(2025, 1, 31, 23, 59),
    recurrence=RecurrencePattern.MONTHLY,
    # ... other fields
)

# Completed on Jan 31 → next instance due Feb 28 (not 31, since Feb has 28 days)
# Using python-dateutil.rrule:
from dateutil.rrule import rrule, MONTHLY
next_due = rrule(MONTHLY, count=2, dtstart=task.due_date)[1]
# next_due = datetime(2025, 2, 28, 23, 59)

# Completed on Feb 28 → next instance due Mar 31 (March has 31 days)
# Completed on Mar 31 → next instance due Apr 30 (April has 30 days)
```

## Data Integrity Checklist

- [ ] All tasks have unique, immutable IDs
- [ ] task_index maintains accurate mapping of task_id → list_index
- [ ] Created dates never change after task creation
- [ ] Completed dates only set when status is "complete"
- [ ] Recurring tasks always have due dates
- [ ] Reminders always reference valid task IDs
- [ ] No orphaned reminders after task deletion
- [ ] Recurrence calculation handles month-end and leap year edge cases
- [ ] All enum values are validated before storage
- [ ] Date formats are validated before parsing

## Performance Considerations

### Lookup Complexity

- Get task by ID: **O(1)** (via task_index)
- Add task: **O(1)** (append + index update)
- Update task: **O(1)** (direct index access)
- Delete task: **O(n)** (index rebuild, but infrequent)
- Search/Filter: **O(n)** (linear scan, acceptable for 1000 tasks)
- Sort: **O(n log n)** (Python's Timsort, efficient for 1000 tasks)

### Memory Footprint

- Task object: ~400-600 bytes (depends on title/description length)
- 1000 tasks: ~500 KB - 600 KB
- task_index: ~16 KB (int→int mapping for 1000 entries)
- reminders: ~20 KB (assuming 10% of tasks have reminders)
- **Total**: < 1 MB for typical usage (well within SC-010 performance requirement)

## References

- Feature Spec: `specs/001-todo-cli-app/spec.md`
- Research Decisions: `specs/001-todo-cli-app/research.md`
- Constitution: `.specify/memory/constitution.md` Section II (Data Model Requirements)
