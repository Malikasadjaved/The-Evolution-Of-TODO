# Quickstart Guide: Python CLI Todo Application

**Feature**: Python CLI Todo Application
**Branch**: `001-todo-cli-app`
**For**: Developers implementing this feature

## Overview

This guide provides a quick reference for implementing the Python CLI Todo Application following the three-tier architecture (Primary → Intermediate → Advanced).

## Project Setup

### Prerequisites

- Python 3.9 or higher
- pip package manager
- Git (for version control)

### Initial Setup

```bash
# Clone repository (if not already done)
git clone <repository-url>
cd To-do-app

# Checkout feature branch
git checkout 001-todo-cli-app

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install development dependencies
pip install -r requirements-dev.txt
```

### Dependencies

**requirements.txt**:
```
colorama>=0.4.6
python-dateutil>=2.8.2
plyer>=2.1.0
```

**requirements-dev.txt**:
```
pytest>=7.4.0
pytest-cov>=4.1.0
pytest-mock>=3.11.0
black>=23.0.0
flake8>=6.0.0
mypy>=1.4.0
```

## Project Structure

```
To-do-app/
├── src/
│   └── todo/
│       ├── __init__.py
│       ├── models.py          # Task data model, enums
│       ├── storage.py         # In-memory CRUD operations
│       ├── commands.py        # Business logic layer
│       ├── filters.py         # Search, filter, sort
│       ├── scheduler.py       # Recurring tasks
│       ├── notifications.py   # Reminders
│       └── cli.py             # CLI interface
├── tests/
│   ├── __init__.py
│   ├── test_models.py
│   ├── test_storage.py
│   ├── test_commands.py
│   ├── test_filters.py
│   ├── test_scheduler.py
│   ├── test_notifications.py
│   └── test_cli.py
├── main.py                    # Entry point
├── requirements.txt
├── requirements-dev.txt
├── pyproject.toml             # Tool configuration
└── README.md
```

## Implementation Sequence (TDD)

### PRIMARY TIER (Foundation - Implement First)

#### 1. Models (models.py)

Define core data structures:

**Classes to implement**:
- `Priority` enum (HIGH, MEDIUM, LOW)
- `TaskType` enum (SCHEDULED, ACTIVITY)
- `RecurrencePattern` enum (DAILY, WEEKLY, BIWEEKLY, MONTHLY, YEARLY)
- `Task` dataclass with all attributes
- `Reminder` dataclass

**TDD Steps**:
1. Write `test_models.py`: Test Task creation, validation, computed properties
2. Implement `models.py` to pass tests
3. Run: `pytest tests/test_models.py -v`

**Reference**: `specs/001-todo-cli-app/data-model.md`

#### 2. Storage (storage.py)

Implement in-memory CRUD operations:

**Functions to implement**:
- `create_task()` - Add new task with auto-generated ID
- `get_task()` - Retrieve task by ID (O(1))
- `get_all_tasks()` - Retrieve all tasks
- `update_task()` - Update task fields
- `delete_task()` - Delete task with index rebuild
- `mark_complete()` - Mark complete (no recurrence yet)
- `mark_incomplete()` - Mark incomplete

**TDD Steps**:
1. Write `test_storage.py`: Test each CRUD operation
2. Implement `storage.py` to pass tests
3. Run: `pytest tests/test_storage.py -v`

**Reference**: `specs/001-todo-cli-app/contracts/storage-interface.md`

#### 3. Commands (commands.py - Basic Operations)

Implement business logic layer:

**Functions to implement**:
- `CommandResult` dataclass
- `add_task_command()` - With validation
- `view_all_tasks_command()`
- `update_task_command()`
- `delete_task_command()` - With confirmation logic
- `mark_complete_command()` - Basic (no recurrence)
- `mark_incomplete_command()`
- Helper parsers: `parse_priority()`, `parse_date()`, `parse_tags()`

**TDD Steps**:
1. Write `test_commands.py`: Test validation, error handling
2. Implement `commands.py` to pass tests
3. Run: `pytest tests/test_commands.py -v`

**Reference**: `specs/001-todo-cli-app/contracts/commands-interface.md`

#### 4. CLI (cli.py - Basic Menu)

Implement interactive menu:

**Features to implement**:
- Main menu loop
- Add task (collect title, description, priority, tags, due date)
- View all tasks (formatted display with indicators)
- Update task (select task, update fields)
- Delete task (with confirmation)
- Mark complete/incomplete
- Exit option

**TDD Steps**:
1. Write `test_cli.py`: Test menu navigation, input handling
2. Implement `cli.py` to pass tests
3. Run: `pytest tests/test_cli.py -v`

#### 5. Main Entry Point (main.py)

```python
from src.todo.cli import main_loop

if __name__ == "__main__":
    main_loop()
```

**Acceptance Test**: Run application and verify all Primary Tier features work

```bash
python main.py
```

### INTERMEDIATE TIER (Organization - Implement Second)

#### 6. Filters (filters.py)

Implement search, filter, and sort:

**Functions to implement**:
- `search_tasks()` - Keyword search
- `filter_by_status()` - Complete/incomplete
- `filter_by_priority()` - Priority levels
- `filter_by_tag()` - Tag matching
- `filter_by_date_range()` - Date range
- `filter_overdue()`, `filter_due_today()`, `filter_due_this_week()`
- `sort_by_due_date()`, `sort_by_priority()`, `sort_by_title()`, `sort_by_created_date()`
- `combine_filters()` - AND logic

**TDD Steps**:
1. Write `test_filters.py`: Test search, filters, sorts, edge cases
2. Implement `filters.py` to pass tests
3. Run: `pytest tests/test_filters.py -v`

**Reference**: `specs/001-todo-cli-app/contracts/filters-interface.md`

#### 7. Update CLI (cli.py - Add Search/Filter/Sort)

Add menu options:
- Search tasks by keyword
- Filter tasks (status, priority, tags, dates)
- Sort tasks (due date, priority, alphabetically, created date)
- Display filter/sort summary

**Acceptance Test**: Verify all Intermediate Tier features work

### ADVANCED TIER (Automation - Implement Third)

#### 8. Scheduler (scheduler.py)

Implement recurring task logic:

**Functions to implement**:
- `calculate_next_due_date()` - Using python-dateutil.rrule
- `create_recurring_instance()` - Generate next task
- Edge case handlers (month-end, leap year)

**TDD Steps**:
1. Write `test_scheduler.py`: Test all recurrence patterns, edge cases
2. Implement `scheduler.py` to pass tests
3. Run: `pytest tests/test_scheduler.py -v`

#### 9. Update mark_complete (commands.py)

Modify `mark_complete_command()` to handle recurrence:
- Check if task has recurrence pattern
- Call `create_recurring_instance()` from scheduler
- Return new task instance in CommandResult

#### 10. Notifications (notifications.py)

Implement reminder system:

**Functions to implement**:
- `ReminderManager` class with background thread
- `add_reminder()` - Register reminder
- `cancel_reminder()` - Remove reminder
- `check_reminders()` - Background loop (60s interval)
- `trigger_notification()` - Using plyer
- Handle missed reminders (mark as OVERDUE)

**TDD Steps**:
1. Write `test_notifications.py`: Test reminder scheduling, triggering, cancellation
2. Implement `notifications.py` to pass tests
3. Run: `pytest tests/test_notifications.py -v --tb=short`

#### 11. Update CLI (cli.py - Add Reminders)

Add reminder configuration:
- Set reminder when creating/updating task with due date
- Display upcoming reminders
- Start ReminderManager background thread on app start

**Acceptance Test**: Verify all Advanced Tier features work

## Running Tests

### Run All Tests

```bash
# All tests
pytest

# With coverage
pytest --cov=src/todo --cov-report=html --cov-report=term

# View coverage report
open htmlcov/index.html  # macOS
start htmlcov/index.html # Windows
```

### Run Specific Test Modules

```bash
pytest tests/test_models.py -v
pytest tests/test_storage.py -v
pytest tests/test_commands.py -v
pytest tests/test_filters.py -v
pytest tests/test_scheduler.py -v
pytest tests/test_notifications.py -v
pytest tests/test_cli.py -v
```

### Coverage Target

- **Requirement**: ≥85% coverage for core modules
- **Focus**: models, storage, commands, filters, scheduler

## Code Quality

### Format Code

```bash
# Format all Python files
black src/ tests/

# Check formatting (CI mode)
black src/ tests/ --check
```

### Lint Code

```bash
# Run flake8
flake8 src/ tests/

# With config from pyproject.toml
flake8 src/ tests/ --config=.flake8
```

### Type Check

```bash
# Run mypy
mypy src/

# Strict mode (as per constitution)
mypy src/ --strict
```

### Run All Quality Checks

```bash
black src/ tests/ --check && flake8 src/ tests/ && mypy src/ && pytest --cov=src/todo
```

## Configuration Files

### pyproject.toml

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]

[tool.black]
line-length = 88
target-version = ['py39']

[tool.mypy]
python_version = "3.9"
strict = true
warn_return_any = true
warn_unused_configs = true
```

### .flake8

```ini
[flake8]
max-line-length = 88
extend-ignore = E203, W503
exclude = .git,__pycache__,venv
```

## Development Workflow

### 1. Red-Green-Refactor Cycle

For each feature:

1. **RED**: Write failing test
   ```bash
   pytest tests/test_storage.py::test_create_task -v
   ```

2. **GREEN**: Implement minimal code to pass
   ```python
   # In storage.py
   def create_task(title: str, ...) -> Task:
       # Implementation
   ```

3. **REFACTOR**: Clean up code
   - Run black, flake8, mypy
   - Ensure test still passes

### 2. Commit Strategy

Commit after each completed module:

```bash
git add src/todo/models.py tests/test_models.py
git commit -m "feat(primary): implement Task data model with validation"

git add src/todo/storage.py tests/test_storage.py
git commit -m "feat(primary): implement in-memory CRUD operations"
```

**Commit Message Format**: `<type>(<tier>): <description>`
- Types: feat, fix, refactor, test, docs
- Tiers: primary, intermediate, advanced

### 3. Integration Testing

After completing each tier:

```bash
# Run all tests
pytest -v

# Manual testing
python main.py
```

Verify user stories from spec.md are satisfied.

## Common Issues & Solutions

### Issue: Import Errors

**Solution**: Ensure you're running from project root and venv is activated

```bash
# From project root
python -m pytest tests/

# Or add src to PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:$(pwd)/src"  # Linux/macOS
set PYTHONPATH=%PYTHONPATH%;%CD%\src          # Windows
```

### Issue: Coverage Below 85%

**Solution**: Check coverage report and add missing tests

```bash
pytest --cov=src/todo --cov-report=term-missing
```

Look for uncovered lines and write tests for those code paths.

### Issue: Mypy Type Errors

**Solution**: Add type hints to all functions

```python
# Before
def get_task(task_id):
    return task_index.get(task_id)

# After
def get_task(task_id: int) -> Optional[Task]:
    idx = task_index.get(task_id)
    return tasks[idx] if idx is not None else None
```

### Issue: Flake8 Formatting Conflicts

**Solution**: Use recommended .flake8 config (ignore E203, W503 for black compatibility)

## Performance Validation

After implementation, validate performance requirements:

### SC-010: Handle 1000+ tasks without degradation

```python
# Create performance test
import time

def test_performance_with_1000_tasks():
    # Create 1000 tasks
    for i in range(1000):
        create_task(title=f"Task {i}")

    # Test operations
    start = time.time()
    task = get_task(500)  # O(1) lookup
    elapsed = time.time() - start
    assert elapsed < 0.001  # < 1ms

    start = time.time()
    results = search_tasks(get_all_tasks(), "Task")
    elapsed = time.time() - start
    assert elapsed < 0.010  # < 10ms
```

## Debugging Tips

### Debug CLI Menu

Run with verbose output:

```python
# In cli.py, add debug prints
def main_loop():
    print(f"DEBUG: Total tasks: {len(get_all_tasks())}")
    # ... menu code
```

### Debug Reminders

Test reminder without waiting:

```python
# In test
from unittest.mock import patch

@patch('src.todo.notifications.datetime')
def test_reminder_triggers(mock_datetime):
    mock_datetime.now.return_value = datetime(2025, 12, 10, 13, 0)
    # Test reminder at exactly trigger time
```

## Next Steps

After completing implementation:

1. **Run Full Test Suite**: `pytest --cov=src/todo`
2. **Check Coverage**: Ensure ≥85%
3. **Run Quality Checks**: `black`, `flake8`, `mypy`
4. **Manual Testing**: Verify all user stories from spec.md
5. **Create PR**: Document all changes

## References

- **Specification**: `specs/001-todo-cli-app/spec.md`
- **Data Model**: `specs/001-todo-cli-app/data-model.md`
- **Contracts**: `specs/001-todo-cli-app/contracts/`
- **Research**: `specs/001-todo-cli-app/research.md`
- **Constitution**: `.specify/memory/constitution.md`

## Support

For questions or issues:
1. Review specification and contracts
2. Check constitution for principles
3. Run tests to verify assumptions
4. Use Python debugger (`python -m pdb main.py`)
