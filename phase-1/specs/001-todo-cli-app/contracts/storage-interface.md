# Storage Interface Contract

**Module**: `src/todo/storage.py`
**Purpose**: In-memory CRUD operations for Task entities
**Version**: 1.0.0

## Overview

Defines the contract for all task storage operations. All functions maintain data integrity invariants and provide consistent error handling.

## Data Structures

### Module State

```python
tasks: List[Task] = []
task_index: Dict[int, int] = {}  # {task_id: list_index}
next_task_id: int = 1
```

## Functions

### create_task

Create a new task with auto-generated ID.

**Signature**:
```python
def create_task(
    title: str,
    description: str = "",
    priority: Priority = Priority.MEDIUM,
    tags: List[str] = None,
    due_date: Optional[datetime] = None,
    recurrence: Optional[RecurrencePattern] = None,
    reminder_offset: Optional[timedelta] = None
) -> Task
```

**Parameters**:
- `title` (str, required): Task title, non-empty
- `description` (str, optional): Task description, default ""
- `priority` (Priority, optional): Priority level, default MEDIUM
- `tags` (List[str], optional): List of tags, default []
- `due_date` (Optional[datetime], optional): Due date/time, default None
- `recurrence` (Optional[RecurrencePattern], optional): Recurrence pattern, default None
- `reminder_offset` (Optional[timedelta], optional): Reminder offset before due_date, default None

**Returns**: Created Task object with auto-generated ID

**Raises**:
- `ValueError`: If title is empty or recurrence set without due_date

**Postconditions**:
- Task added to `tasks` list
- Task ID mapped in `task_index`
- `next_task_id` incremented

**Example**:
```python
task = create_task(
    title="Buy groceries",
    description="Milk, eggs, bread",
    priority=Priority.HIGH,
    tags=["Personal", "Shopping"],
    due_date=datetime(2025, 12, 10, 18, 0)
)
# Returns: Task(id=1, title="Buy groceries", ...)
```

---

### get_task

Retrieve task by ID.

**Signature**:
```python
def get_task(task_id: int) -> Optional[Task]
```

**Parameters**:
- `task_id` (int, required): Task identifier

**Returns**: Task object if found, None otherwise

**Complexity**: O(1)

**Example**:
```python
task = get_task(1)
if task:
    print(task.title)
else:
    print("Task not found")
```

---

### get_all_tasks

Retrieve all tasks.

**Signature**:
```python
def get_all_tasks() -> List[Task]
```

**Returns**: List of all Task objects (may be empty)

**Complexity**: O(1) (returns reference to list)

**Example**:
```python
all_tasks = get_all_tasks()
print(f"Total tasks: {len(all_tasks)}")
```

---

### update_task

Update task fields by ID.

**Signature**:
```python
def update_task(task_id: int, **updates) -> bool
```

**Parameters**:
- `task_id` (int, required): Task identifier
- `**updates`: Keyword arguments for fields to update

**Returns**: True if task updated, False if task not found

**Raises**:
- `ValueError`: If updates violate validation rules (e.g., empty title)

**Allowed Update Fields**:
- `title` (str)
- `description` (str)
- `priority` (Priority)
- `tags` (List[str])
- `due_date` (Optional[datetime])
- `recurrence` (Optional[RecurrencePattern])
- `reminder_offset` (Optional[timedelta])

**Immutable Fields** (cannot be updated):
- `id`
- `created_date`
- `status` (use mark_complete/mark_incomplete instead)
- `completed_date` (set automatically)

**Example**:
```python
success = update_task(1, title="Buy organic groceries", priority=Priority.HIGH)
if success:
    print("Task updated")
else:
    print("Task not found")
```

---

### delete_task

Delete task by ID.

**Signature**:
```python
def delete_task(task_id: int) -> bool
```

**Parameters**:
- `task_id` (int, required): Task identifier

**Returns**: True if task deleted, False if task not found

**Postconditions**:
- Task removed from `tasks` list
- `task_index` rebuilt for all remaining tasks
- Associated reminders removed

**Complexity**: O(n) due to index rebuild

**Example**:
```python
success = delete_task(1)
if success:
    print("Task deleted")
else:
    print("Task not found")
```

---

### mark_complete

Mark task as complete.

**Signature**:
```python
def mark_complete(task_id: int) -> Optional[Task]
```

**Parameters**:
- `task_id` (int, required): Task identifier

**Returns**:
- New recurring task instance if task has recurrence pattern
- None if task has no recurrence or task not found

**Side Effects**:
- Sets `task.status = "complete"`
- Sets `task.completed_date = datetime.now()`
- If recurrence pattern set: Creates new task instance with next due date
- Cancels associated reminder

**Example**:
```python
new_task = mark_complete(1)
if new_task:
    print(f"Recurring task created: {new_task.id}")
```

---

### mark_incomplete

Mark task as incomplete.

**Signature**:
```python
def mark_incomplete(task_id: int) -> bool
```

**Parameters**:
- `task_id` (int, required): Task identifier

**Returns**: True if task updated, False if task not found

**Side Effects**:
- Sets `task.status = "incomplete"`
- Clears `task.completed_date = None`
- Recreates reminder if `reminder_offset` is set

**Example**:
```python
success = mark_incomplete(1)
if success:
    print("Task marked incomplete")
```

---

### get_next_id

Get next available task ID (utility function).

**Signature**:
```python
def get_next_id() -> int
```

**Returns**: Next task ID that will be assigned

**Example**:
```python
next_id = get_next_id()
print(f"Next task will have ID: {next_id}")
```

---

## Data Integrity Invariants

All storage operations MUST maintain these invariants:

1. **Unique IDs**: Every task has a unique ID
2. **Index Consistency**: `task_index[task.id]` points to correct position in `tasks` list
3. **ID Sequence**: `next_task_id > max(task.id for task in tasks)`
4. **No Orphans**: All task IDs in `task_index` exist in `tasks`
5. **Immutability**: Task IDs and created dates never change

## Error Handling

### Validation Errors

Functions raise `ValueError` with descriptive messages for:
- Empty title
- Recurrence without due date
- Reminder without due date
- Invalid priority value
- Empty tags

### Not Found Errors

Functions return `None` or `False` (never raise exceptions) when task ID not found:
- `get_task(invalid_id)` → `None`
- `update_task(invalid_id, ...)` → `False`
- `delete_task(invalid_id)` → `False`
- `mark_complete(invalid_id)` → `None`
- `mark_incomplete(invalid_id)` → `False`

## Testing Contract

### Unit Test Requirements

Each function MUST have tests for:
- Success case (happy path)
- Not found case (invalid ID)
- Validation error cases
- Data integrity preservation
- Edge cases (empty lists, boundary values)

### Example Test Cases

```python
def test_create_task_success():
    task = create_task(title="Test")
    assert task.id == 1
    assert task.title == "Test"
    assert task.status == "incomplete"

def test_create_task_empty_title():
    with pytest.raises(ValueError, match="title"):
        create_task(title="")

def test_get_task_not_found():
    assert get_task(9999) is None

def test_update_task_preserves_id():
    task = create_task(title="Original")
    original_id = task.id
    update_task(task.id, title="Updated")
    assert get_task(original_id).title == "Updated"

def test_mark_complete_recurring_creates_new_instance():
    task = create_task(
        title="Weekly task",
        due_date=datetime(2025, 12, 13),
        recurrence=RecurrencePattern.WEEKLY
    )
    new_task = mark_complete(task.id)
    assert new_task is not None
    assert new_task.id != task.id
    assert new_task.due_date == datetime(2025, 12, 20)
```

## Performance Contract

### Complexity Guarantees

- `create_task`: O(1)
- `get_task`: O(1)
- `get_all_tasks`: O(1)
- `update_task`: O(1)
- `delete_task`: O(n) [acceptable, infrequent operation]
- `mark_complete`: O(1) or O(1) + create_task
- `mark_incomplete`: O(1)

### Scale Target

All operations MUST complete in < 1ms for task lists up to 1000 items (except delete_task which can take up to 10ms).

## Implementation Notes

### Recurrence Logic

When `mark_complete` is called on a recurring task:

1. Calculate next due date using `python-dateutil.rrule`
2. Create new task instance with:
   - New auto-generated ID
   - Same title, description, priority, tags, recurrence
   - `due_date = next_due_date`
   - `status = "incomplete"`
   - `created_date = datetime.now()`
   - `completed_date = None`
3. Return new task instance

### Index Rebuild Strategy

On `delete_task`:
```python
def delete_task(task_id: int) -> bool:
    idx = task_index.get(task_id)
    if idx is None:
        return False

    del tasks[idx]

    # Rebuild index
    task_index.clear()
    for i, task in enumerate(tasks):
        task_index[task.id] = i

    return True
```

## Versioning

**Version**: 1.0.0

**Changelog**:
- 1.0.0 (2025-12-06): Initial contract definition
