# Commands Interface Contract

**Module**: `src/todo/commands.py`
**Purpose**: Business logic for task operations (wraps storage layer with validation and error handling)
**Version**: 1.0.0

## Overview

Provides high-level command functions for the CLI layer. Each command encapsulates business logic, validation, and error handling, returning structured results with success/error status.

## Command Result Type

All commands return a `CommandResult` to provide consistent error handling:

```python
@dataclass
class CommandResult:
    success: bool
    message: str
    data: Optional[Any] = None
    errors: List[str] = field(default_factory=list)
```

## Commands

### add_task_command

Add a new task with validation.

**Signature**:
```python
def add_task_command(
    title: str,
    description: str = "",
    priority: str = "MEDIUM",
    tags: str = "",  # Comma-separated
    due_date_str: str = "",
    recurrence_str: str = "",
    reminder_offset_str: str = ""
) -> CommandResult
```

**Parameters**:
- `title` (str): Task title
- `description` (str): Task description
- `priority` (str): "HIGH", "MEDIUM", or "LOW"
- `tags` (str): Comma-separated tags (e.g., "Work, Meeting")
- `due_date_str` (str): Date string "YYYY-MM-DD" or "YYYY-MM-DD HH:MM"
- `recurrence_str` (str): "DAILY", "WEEKLY", "MONTHLY", etc.
- `reminder_offset_str` (str): "1 hour", "1 day", etc.

**Returns**: CommandResult with created Task in `data` field

**Validation**:
- Title not empty
- Priority valid enum value
- Due date parseable if provided
- Recurrence requires due date
- Reminder requires due date

**Example**:
```python
result = add_task_command(
    title="Team meeting",
    priority="HIGH",
    tags="Work, Meeting",
    due_date_str="2025-12-10 14:00",
    reminder_offset_str="1 hour"
)

if result.success:
    task = result.data
    print(f"Task created: ID {task.id}")
else:
    print(f"Errors: {', '.join(result.errors)}")
```

**Error Messages**:
- "Title cannot be empty"
- "Invalid priority. Must be HIGH, MEDIUM, or LOW"
- "Invalid date format. Use YYYY-MM-DD or YYYY-MM-DD HH:MM"
- "Recurrence pattern requires a due date"
- "Reminder requires a due date"

---

### view_all_tasks_command

Retrieve and format all tasks for display.

**Signature**:
```python
def view_all_tasks_command() -> CommandResult
```

**Returns**: CommandResult with List[Task] in `data` field

**Example**:
```python
result = view_all_tasks_command()
if result.success:
    tasks = result.data
    for task in tasks:
        print(format_task(task))
```

---

### update_task_command

Update task fields with validation.

**Signature**:
```python
def update_task_command(
    task_id: int,
    title: Optional[str] = None,
    description: Optional[str] = None,
    priority: Optional[str] = None,
    tags: Optional[str] = None,
    due_date_str: Optional[str] = None,
    recurrence_str: Optional[str] = None
) -> CommandResult
```

**Parameters**:
- `task_id` (int): Task ID to update
- Other parameters: Same as add_task_command (None means no update)

**Returns**: CommandResult with updated Task in `data` field

**Validation**:
- Task ID exists
- Title not empty if provided
- Priority valid if provided
- Due date parseable if provided

**Example**:
```python
result = update_task_command(
    task_id=1,
    title="Updated title",
    priority="LOW"
)

if result.success:
    print(result.message)  # "Task updated successfully"
else:
    print(f"Error: {result.message}")
```

**Error Messages**:
- "Task with ID {id} not found"
- "Title cannot be empty"
- "Invalid priority. Must be HIGH, MEDIUM, or LOW"
- "Invalid date format. Use YYYY-MM-DD or YYYY-MM-DD HH:MM"

---

### delete_task_command

Delete task with confirmation requirement.

**Signature**:
```python
def delete_task_command(task_id: int, confirmed: bool = False) -> CommandResult
```

**Parameters**:
- `task_id` (int): Task ID to delete
- `confirmed` (bool): Whether user has confirmed deletion

**Returns**:
- If `confirmed=False`: CommandResult with task details in `message` for confirmation prompt
- If `confirmed=True`: CommandResult with deletion status

**Business Logic**:
1. Verify task exists
2. If not confirmed: Return task details for confirmation
3. If confirmed: Delete task

**Example**:
```python
# Step 1: Get confirmation details
result = delete_task_command(task_id=1, confirmed=False)
if result.success:
    print(f"Delete this task? {result.message}")
    user_input = input("Confirm (y/n): ")

    # Step 2: Perform deletion if confirmed
    if user_input.lower() == 'y':
        result = delete_task_command(task_id=1, confirmed=True)
        print(result.message)  # "Task deleted successfully"
```

**Error Messages**:
- "Task with ID {id} not found"

---

### mark_complete_command

Mark task as complete and handle recurrence.

**Signature**:
```python
def mark_complete_command(task_id: int) -> CommandResult
```

**Parameters**:
- `task_id` (int): Task ID to mark complete

**Returns**: CommandResult with optional new recurring task in `data` field

**Business Logic**:
1. Verify task exists
2. Mark task complete
3. If recurring: Create new instance
4. Cancel reminder

**Example**:
```python
result = mark_complete_command(task_id=1)
if result.success:
    if result.data:
        new_task = result.data
        print(f"Task completed. Next instance created: ID {new_task.id}")
    else:
        print("Task completed.")
else:
    print(f"Error: {result.message}")
```

**Success Messages**:
- "Task marked as complete"
- "Task completed. Recurring task created: ID {new_id}"

**Error Messages**:
- "Task with ID {id} not found"

---

### mark_incomplete_command

Mark task as incomplete.

**Signature**:
```python
def mark_incomplete_command(task_id: int) -> CommandResult
```

**Parameters**:
- `task_id` (int): Task ID to mark incomplete

**Returns**: CommandResult with success status

**Example**:
```python
result = mark_incomplete_command(task_id=1)
if result.success:
    print(result.message)  # "Task marked as incomplete"
else:
    print(f"Error: {result.message}")
```

**Error Messages**:
- "Task with ID {id} not found"

---

## Helper Functions

### parse_priority

Parse priority string to Priority enum.

**Signature**:
```python
def parse_priority(priority_str: str) -> Optional[Priority]
```

**Returns**: Priority enum or None if invalid

---

### parse_date

Parse date string to datetime.

**Signature**:
```python
def parse_date(date_str: str) -> Optional[datetime]
```

**Formats Supported**:
- "YYYY-MM-DD" → datetime at 00:00
- "YYYY-MM-DD HH:MM" → datetime at specified time

**Returns**: datetime or None if invalid

---

### parse_tags

Parse comma-separated tags string to list.

**Signature**:
```python
def parse_tags(tags_str: str) -> List[str]
```

**Example**:
```python
tags = parse_tags("Work, Meeting, Important")
# Returns: ["Work", "Meeting", "Important"]
```

**Processing**:
- Split by comma
- Strip whitespace
- Remove empty strings

---

### parse_reminder_offset

Parse reminder offset string to timedelta.

**Signature**:
```python
def parse_reminder_offset(offset_str: str) -> Optional[timedelta]
```

**Formats Supported**:
- "X hour" or "X hours" → timedelta(hours=X)
- "X day" or "X days" → timedelta(days=X)
- "X minute" or "X minutes" → timedelta(minutes=X)

**Example**:
```python
offset = parse_reminder_offset("1 hour")
# Returns: timedelta(hours=1)

offset = parse_reminder_offset("2 days")
# Returns: timedelta(days=2)
```

---

### parse_recurrence

Parse recurrence string to RecurrencePattern enum.

**Signature**:
```python
def parse_recurrence(recurrence_str: str) -> Optional[RecurrencePattern]
```

**Returns**: RecurrencePattern enum or None if invalid

---

## Error Handling Strategy

### Input Validation

All commands validate inputs before calling storage layer:

1. **Parse inputs**: Convert strings to appropriate types
2. **Validate constraints**: Check business rules
3. **Return errors**: Collect all validation errors before failing

### Error Accumulation

```python
def add_task_command(...) -> CommandResult:
    errors = []

    if not title.strip():
        errors.append("Title cannot be empty")

    priority_enum = parse_priority(priority)
    if not priority_enum:
        errors.append("Invalid priority. Must be HIGH, MEDIUM, or LOW")

    due_date = None
    if due_date_str:
        due_date = parse_date(due_date_str)
        if not due_date:
            errors.append("Invalid date format. Use YYYY-MM-DD or YYYY-MM-DD HH:MM")

    if errors:
        return CommandResult(success=False, message="Validation failed", errors=errors)

    # Proceed with creation...
```

### User-Friendly Messages

Never expose Python exceptions to user:
- Catch storage layer exceptions
- Convert to user-friendly messages
- Include context (task ID, field name)

## Testing Contract

### Unit Test Requirements

Each command MUST have tests for:
- Success case with minimal inputs
- Success case with all inputs
- Validation error cases (each error message)
- Not found cases (invalid IDs)
- Edge cases (empty strings, boundary values)

### Example Test Cases

```python
def test_add_task_command_success():
    result = add_task_command(title="Test task")
    assert result.success
    assert result.data.title == "Test task"

def test_add_task_command_empty_title():
    result = add_task_command(title="")
    assert not result.success
    assert "Title cannot be empty" in result.errors

def test_update_task_command_not_found():
    result = update_task_command(task_id=9999, title="Updated")
    assert not result.success
    assert "not found" in result.message.lower()

def test_mark_complete_command_recurring():
    # Create recurring task
    add_result = add_task_command(
        title="Weekly task",
        due_date_str="2025-12-13",
        recurrence_str="WEEKLY"
    )
    task_id = add_result.data.id

    # Complete and verify new instance
    result = mark_complete_command(task_id)
    assert result.success
    assert result.data is not None
    assert result.data.id != task_id
```

## Integration with CLI Layer

### Usage Pattern

```python
# In cli.py
def handle_add_task():
    title = input("Enter title: ")
    priority = input("Enter priority (HIGH/MEDIUM/LOW): ")
    # ... collect other inputs

    result = add_task_command(title=title, priority=priority, ...)

    if result.success:
        print(f"✓ {result.message}")
        if result.data:
            print(f"  Task ID: {result.data.id}")
    else:
        print(f"✗ Error: {result.message}")
        for error in result.errors:
            print(f"  - {error}")
```

### Error Display

CLI layer should:
1. Check `result.success`
2. Display `result.message` as primary feedback
3. Display each item in `result.errors` if present
4. Use colored output (red for errors, green for success)

## Versioning

**Version**: 1.0.0

**Changelog**:
- 1.0.0 (2025-12-06): Initial contract definition
