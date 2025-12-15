# Feature Specification: Validation Error Handling with Retry & Examples

**Feature ID:** F015
**Title:** Smart Validation Error Handling with Retry Prompts and Examples
**Status:** Planning
**Created:** 2025-12-06

## Overview

When users make validation errors (e.g., invalid date format, invalid priority, empty required fields), the app should:
1. Show a clear error message explaining what went wrong
2. Provide an example of correct input format
3. Ask if the user wants to retry
4. Allow the user to re-enter the data correctly

## User Stories

### US-015-1: Date Format Validation with Retry
**As a** user adding a task with due date
**I want to** see an example when I enter an invalid date format
**So that** I can retry with the correct format instead of starting over

**Acceptance Criteria:**
- When user enters invalid date (e.g., "12/31/2025" instead of "2025-12-31")
- App shows error: "Invalid date format"
- App shows example: "Example: 2025-12-31 or 2025-12-31 14:30"
- App asks: "Would you like to retry? (yes/no)"
- If yes: User can re-enter the date
- If no: Skip due date (continue without it)

### US-015-2: Priority Validation with Retry
**As a** user updating task priority manually (if typing instead of menu)
**I want to** see valid options when I make an error
**So that** I know exactly what to type

**Acceptance Criteria:**
- When user enters invalid priority (e.g., "URGENT" instead of "HIGH")
- App shows error: "Invalid priority"
- App shows example: "Valid options: HIGH, MEDIUM, LOW"
- App asks: "Would you like to retry? (yes/no)"
- If yes: User can re-enter priority
- If no: Use default (MEDIUM)

### US-015-3: Empty Required Field with Retry
**As a** user adding a task
**I want to** be prompted to retry when I skip required fields
**So that** I don't have to restart the entire process

**Acceptance Criteria:**
- When user leaves title empty (required field)
- App shows error: "Title is required and cannot be empty"
- App shows example: "Example: 'Complete project report' or 'Buy groceries'"
- App asks: "Would you like to retry? (yes/no)"
- If yes: User can re-enter title
- If no: Cancel task creation

### US-015-4: Invalid Recurrence with Retry
**As a** user setting up recurring tasks
**I want to** see valid recurrence patterns when I make an error
**So that** I can choose the correct one

**Acceptance Criteria:**
- When user enters invalid recurrence (if typing instead of menu)
- App shows error: "Invalid recurrence pattern"
- App shows example: "Valid options: DAILY, WEEKLY, BIWEEKLY, MONTHLY, YEARLY"
- App asks: "Would you like to retry? (yes/no)"
- If yes: User can re-enter recurrence
- If no: Skip recurrence (no recurring)

### US-015-5: Numeric Input Validation (Task ID)
**As a** user selecting a task to update/delete
**I want to** see examples when I enter invalid task ID
**So that** I know what format is expected

**Acceptance Criteria:**
- When user enters non-numeric task ID (e.g., "task-1" instead of "1")
- App shows error: "Task ID must be a number"
- App shows example: "Example: 1, 2, 3, etc."
- App asks: "Would you like to retry? (yes/no)"
- If yes: User can re-enter task ID
- If no: Return to main menu

## Technical Design

### 1. Helper Function: Retry Prompt

```python
def ask_retry(field_name: str, example: str) -> bool:
    """Ask user if they want to retry after validation error.

    Args:
        field_name: Name of the field that had validation error
        example: Example of correct format

    Returns:
        True if user wants to retry, False otherwise
    """
    print(f"\n{Fore.YELLOW}Would you like to try entering {field_name} again?{Style.RESET_ALL}")
    print(f"{Fore.CYAN}Example: {example}{Style.RESET_ALL}")

    choice = get_input("Retry? (yes/no) [no]: ", required=False)
    return choice.lower() in ["yes", "y"] if choice else False
```

### 2. Enhanced Input Functions with Retry

**Enhanced Date Input:**
```python
def get_date_input_with_retry(prompt: str) -> Optional[datetime]:
    """Get date input with retry on validation error."""
    while True:
        date_str = get_input(prompt, required=False)
        if not date_str:
            return None

        try:
            return commands.parse_date(date_str)
        except ValueError as e:
            print(f"{Fore.RED}❌ {str(e)}{Style.RESET_ALL}")
            if ask_retry("due date", "2025-12-31 or 2025-12-31 14:30"):
                continue  # Retry
            else:
                return None  # Skip
```

**Enhanced Task ID Input:**
```python
def get_task_id_with_retry(prompt: str) -> Optional[int]:
    """Get task ID input with retry on validation error."""
    while True:
        task_id_str = get_input(prompt, required=False)
        if not task_id_str:
            return None

        try:
            task_id = int(task_id_str)
            if task_id <= 0:
                raise ValueError("Task ID must be positive")
            return task_id
        except ValueError:
            print(f"{Fore.RED}❌ Invalid task ID. Must be a positive number.{Style.RESET_ALL}")
            if ask_retry("task ID", "1, 2, 3, etc."):
                continue  # Retry
            else:
                return None  # Cancel
```

**Enhanced Title Input (Required):**
```python
def get_title_with_retry() -> Optional[str]:
    """Get title input with retry on empty value."""
    while True:
        title = get_input("Title: ", required=False)

        if title and title.strip():
            return title.strip()

        print(f"{Fore.RED}❌ Title is required and cannot be empty.{Style.RESET_ALL}")
        if ask_retry("title", "'Complete project report' or 'Buy groceries'"):
            continue  # Retry
        else:
            return None  # Cancel
```

### 3. Validation Error Messages with Examples

| Error Type | Error Message | Example |
|------------|---------------|---------|
| Invalid date | "Invalid date format" | "2025-12-31 or 2025-12-31 14:30" |
| Invalid priority | "Invalid priority" | "HIGH, MEDIUM, or LOW" |
| Empty title | "Title cannot be empty" | "'Complete project' or 'Buy groceries'" |
| Invalid task ID | "Task ID must be a number" | "1, 2, 3, etc." |
| Invalid recurrence | "Invalid recurrence pattern" | "DAILY, WEEKLY, MONTHLY, or YEARLY" |
| Invalid tags | "Tags should be comma-separated" | "Work, Urgent or Home, Shopping" |

## Test Cases

### TC-015-1: Date Retry Flow
```python
def test_date_input_retry_success(monkeypatch):
    """Test successful retry after invalid date."""
    inputs = iter(["invalid-date", "y", "2025-12-31"])
    monkeypatch.setattr("builtins.input", lambda _: next(inputs))

    result = get_date_input_with_retry("Due date: ")
    assert result is not None
    assert result.year == 2025
    assert result.month == 12
    assert result.day == 31

def test_date_input_retry_cancel(monkeypatch):
    """Test canceling retry after invalid date."""
    inputs = iter(["invalid-date", "n"])
    monkeypatch.setattr("builtins.input", lambda _: next(inputs))

    result = get_date_input_with_retry("Due date: ")
    assert result is None
```

### TC-015-2: Task ID Retry Flow
```python
def test_task_id_retry_success(monkeypatch):
    """Test successful retry after invalid task ID."""
    inputs = iter(["abc", "y", "5"])
    monkeypatch.setattr("builtins.input", lambda _: next(inputs))

    result = get_task_id_with_retry("Task ID: ")
    assert result == 5

def test_task_id_retry_cancel(monkeypatch):
    """Test canceling retry after invalid task ID."""
    inputs = iter(["abc", "n"])
    monkeypatch.setattr("builtins.input", lambda _: next(inputs))

    result = get_task_id_with_retry("Task ID: ")
    assert result is None
```

### TC-015-3: Title Retry Flow
```python
def test_title_retry_success(monkeypatch):
    """Test successful retry after empty title."""
    inputs = iter(["", "y", "My Task"])
    monkeypatch.setattr("builtins.input", lambda _: next(inputs))

    result = get_title_with_retry()
    assert result == "My Task"

def test_title_retry_cancel(monkeypatch):
    """Test canceling retry after empty title."""
    inputs = iter(["", "n"])
    monkeypatch.setattr("builtins.input", lambda _: next(inputs))

    result = get_title_with_retry()
    assert result is None
```

## Implementation Checklist

- [ ] Create `ask_retry()` helper function
- [ ] Implement `get_date_input_with_retry()`
- [ ] Implement `get_task_id_with_retry()`
- [ ] Implement `get_title_with_retry()`
- [ ] Update `add_task_interactive()` to use retry functions
- [ ] Update `update_task_interactive()` to use retry functions
- [ ] Update `delete_task_interactive()` to use retry functions
- [ ] Update `mark_complete_interactive()` to use retry functions
- [ ] Update `mark_incomplete_interactive()` to use retry functions
- [ ] Write 15+ tests for retry functionality
- [ ] Run all tests (should have 155+ passing)
- [ ] Format with black
- [ ] Verify with flake8

## Example User Flow

### Before (No Retry):
```
User: Add Task
App: Due date (YYYY-MM-DD):
User: 12/31/2025
App: ❌ Invalid date format
App: [Returns to main menu - user loses all progress]
```

### After (With Retry):
```
User: Add Task
App: Due date (YYYY-MM-DD):
User: 12/31/2025
App: ❌ Invalid date format

App: Would you like to try entering due date again?
App: Example: 2025-12-31 or 2025-12-31 14:30
App: Retry? (yes/no) [no]:
User: yes
App: Due date (YYYY-MM-DD):
User: 2025-12-31
App: ✓ [Continues with task creation]
```

## Benefits

1. **Reduced Frustration**: Users don't lose progress on validation errors
2. **Learning**: Examples teach correct format immediately
3. **Flexibility**: Users can skip optional fields if they change their mind
4. **Professional UX**: Similar to web forms with inline validation
5. **Error Recovery**: Graceful error handling throughout the app

## Related Features

- **F001-F012**: Original features (all enhanced with retry)
- **F013**: Selection Menus (already prevents most validation errors)
- **F014**: Menu Organization (enhanced with retry for task ID inputs)

## Success Criteria

1. All input functions support retry with examples
2. Clear error messages with actionable examples
3. User can retry or skip after validation errors
4. All 155+ tests pass
5. Code formatted with black
6. No flake8 violations
7. Improved user experience confirmed
