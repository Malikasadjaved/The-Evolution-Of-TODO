# Implementation Plan: Python CLI Todo Application

**Branch**: `001-todo-cli-app` | **Date**: 2025-12-06 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/001-todo-cli-app/spec.md`

## Summary

Build a Python CLI Todo Application with three-tier progressive architecture (Primary → Intermediate → Advanced). The application provides comprehensive task management capabilities including CRUD operations, priority/tag organization, search/filter/sort, recurring tasks, and deadline reminders. All data is stored in-memory with ≥85% test coverage using TDD methodology.

**Technical Approach**: Use Python 3.9+ with stdlib-first strategy, minimal dependencies (pytest, colorama, python-dateutil, plyer), layered architecture with separation of concerns (models, storage, business logic, presentation), and incremental tier-based delivery.

## Technical Context

**Language/Version**: Python 3.9+
**Primary Dependencies**: pytest (testing), colorama (colored output), python-dateutil (recurrence calculation), plyer (desktop notifications)
**Storage**: In-memory (list + dict index for O(1) lookups)
**Testing**: pytest with pytest-cov (≥85% coverage requirement)
**Target Platform**: Cross-platform CLI (Windows, macOS, Linux)
**Project Type**: Single project (CLI application)
**Performance Goals**: Handle 1000+ tasks with < 1 second operations (SC-010)
**Constraints**: In-memory only, no external database, ≥85% test coverage, TDD workflow
**Scale/Scope**: Single-user application, 70 functional requirements across 3 tiers, 7 prioritized user stories

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Compliance Status: ✅ PASS

**I. Clean Code & Pythonic Design**
- ✅ PEP 8 guidelines enforced via black formatter
- ✅ Type hints required (Python 3.9+ syntax, mypy strict mode)
- ✅ Single responsibility principle in module separation
- ✅ Google-style docstrings for public APIs

**II. Enhanced In-Memory Storage Architecture**
- ✅ In-memory storage using list + dict index (FR-054, FR-055)
- ✅ Auto-incremented integer IDs (FR-002)
- ✅ O(1) lookups via task_index dict (FR-057)
- ✅ Rich metadata support (priority, tags, dates, recurrence)

**III. Three-Tier Feature Architecture**
- ✅ Primary Tier: CRUD operations (FR-001 to FR-018)
- ✅ Intermediate Tier: Organization features (FR-019 to FR-042)
- ✅ Advanced Tier: Automation (FR-043 to FR-053)
- ✅ Sequential implementation mandated (Primary → Intermediate → Advanced)

**IV. Reusable Intelligence & Agent-Driven Development**
- ✅ Custom slash commands available (`/sp.plan`, `/sp.tasks`)
- ✅ Agent skills directory structure in place
- ⚠️ Project-specific skills to be developed during implementation (test runner, validator)

**V. Proper Python Project Structure**
- ✅ Standard package layout: `src/todo/` with specialized modules
- ✅ Clear separation: models, storage, commands, filters, scheduler, notifications, cli
- ✅ Tests mirror source structure

**VI. Test-First Development**
- ✅ pytest framework selected
- ✅ ≥85% coverage requirement (pytest-cov)
- ✅ TDD Red-Green-Refactor workflow mandated
- ✅ Edge case testing prioritized (dates, recurrence, filters)

**VII. Enhanced User Experience & Error Handling**
- ✅ Menu-driven CLI with numbered options (FR-058)
- ✅ Input validation before processing (FR-060)
- ✅ User-friendly error messages (FR-061, FR-067)
- ✅ Colored output via colorama (FR-064)

**Code Quality Standards**
- ✅ black for formatting (line length 88)
- ✅ flake8 for linting (ignore E203, W503)
- ✅ mypy for static type checking (strict mode)

**Dependencies**
- ✅ All dependencies justified and aligned with constitution:
  - pytest: TDD requirement
  - colorama: Recommended for colored output
  - python-dateutil: Conditional dependency for recurrence
  - plyer: Cross-platform notifications

**No violations.** All architecture decisions comply with constitution v2.1.0.

## Project Structure

### Documentation (this feature)

```text
specs/001-todo-cli-app/
├── plan.md              # This file (/sp.plan output)
├── research.md          # Phase 0 output (technology decisions)
├── data-model.md        # Phase 1 output (entities, schema)
├── quickstart.md        # Phase 1 output (developer guide)
├── contracts/           # Phase 1 output (API contracts)
│   ├── storage-interface.md
│   ├── commands-interface.md
│   └── filters-interface.md
└── tasks.md             # Phase 2 output (/sp.tasks - NOT created yet)
```

### Source Code (repository root)

```text
To-do-app/
├── src/
│   └── todo/
│       ├── __init__.py
│       ├── models.py          # Task, Priority, TaskType, RecurrencePattern enums
│       ├── storage.py         # In-memory CRUD (list + dict index)
│       ├── commands.py        # Business logic, validation, CommandResult
│       ├── filters.py         # Search, filter, sort functions
│       ├── scheduler.py       # Recurring task calculation
│       ├── notifications.py   # Reminder manager, desktop notifications
│       └── cli.py             # Menu system, I/O formatting
├── tests/
│   ├── __init__.py
│   ├── test_models.py
│   ├── test_storage.py
│   ├── test_commands.py
│   ├── test_filters.py
│   ├── test_scheduler.py
│   ├── test_notifications.py
│   └── test_cli.py
├── main.py                    # Entry point (calls cli.main_loop)
├── requirements.txt           # Runtime dependencies
├── requirements-dev.txt       # Development dependencies
├── pyproject.toml             # Tool configuration (pytest, black, mypy)
├── .flake8                    # Flake8 configuration
└── README.md                  # User documentation
```

**Structure Decision**: Single project layout chosen (Option 1 from template). This is a CLI application without web/mobile components, so a single `src/todo/` package with specialized modules is appropriate. The structure aligns with constitution Section V requirements and provides clear separation of concerns.

## Complexity Tracking

No complexity violations. All architecture choices follow constitution principles and prefer simplicity:

- **Storage**: In-memory list + dict (simplest compliant solution)
- **CLI Framework**: Native Python input() (no framework overhead)
- **Recurrence**: python-dateutil library (avoid custom edge-case-prone logic)
- **Notifications**: plyer library (cross-platform abstraction)
- **Module Count**: 7 specialized modules (models, storage, commands, filters, scheduler, notifications, cli) - each with single responsibility

## Architecture Design

### Layer Architecture

```
┌─────────────────────────────────────────────┐
│          CLI Layer (cli.py)                 │
│  - Menu system                              │
│  - Input/Output formatting                  │
│  - Colored display (colorama)               │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│     Commands Layer (commands.py)            │
│  - Business logic                           │
│  - Validation (CommandResult)               │
│  - Error handling                           │
└──┬──────────────┬──────────────┬────────────┘
   │              │              │
   │         ┌────▼─────┐   ┌───▼──────────┐
   │         │ Filters  │   │  Scheduler   │
   │         │ .py      │   │  .py         │
   │         └──────────┘   └──────────────┘
   │              │              │
┌──▼──────────────▼──────────────▼────────────┐
│       Storage Layer (storage.py)            │
│  - In-memory CRUD                           │
│  - task_index (O(1) lookups)                │
│  - Data integrity                           │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│       Models Layer (models.py)              │
│  - Task dataclass                           │
│  - Enums (Priority, TaskType, Recurrence)   │
│  - Validation rules                         │
└─────────────────────────────────────────────┘

      ┌─────────────────────────┐
      │  Notifications Layer    │
      │  (notifications.py)     │
      │  - Background thread    │
      │  - Reminder checking    │
      │  - plyer integration    │
      └─────────────────────────┘
```

### Data Flow: Add Task Example

```
User Input (CLI)
    ↓
cli.py: handle_add_task()
    │ Collect: title, description, priority, tags, due_date
    ↓
commands.py: add_task_command()
    │ Parse: priority_str → Priority enum
    │ Parse: tags_str → List[str]
    │ Parse: due_date_str → datetime
    │ Validate: all inputs
    ↓
storage.py: create_task()
    │ Generate ID: next_task_id++
    │ Append: tasks.append(task)
    │ Index: task_index[task.id] = len(tasks) - 1
    ↓
CommandResult(success=True, data=task)
    ↓
cli.py: Display success message
    │ Format: "✓ Task created: ID {id}"
    │ Color: GREEN
```

### Data Flow: Search & Filter Example

```
User Input (CLI)
    ↓
cli.py: handle_search()
    │ Collect: keyword, status, priority, tags, date_range
    ↓
storage.py: get_all_tasks()
    │ Return: List[Task]
    ↓
filters.py: search_tasks(tasks, keyword)
    │ Filter: keyword in title or description
    ↓
filters.py: filter_by_status(results, status)
    │ Filter: status matches
    ↓
filters.py: filter_by_priority(results, priorities)
    │ Filter: priority in list
    ↓
filters.py: sort_by_due_date(results, ascending)
    │ Sort: earliest due dates first
    ↓
cli.py: Display results
    │ Format: Tabular view with indicators
    │ Summary: "Found X tasks matching criteria"
```

### Data Flow: Recurring Task Completion

```
User Input (CLI): mark complete
    ↓
commands.py: mark_complete_command(task_id)
    ↓
storage.py: get_task(task_id)
    │ Verify: task exists and has recurrence
    ↓
scheduler.py: calculate_next_due_date(task)
    │ Use: python-dateutil.rrule
    │ Handle: month-end, leap year edge cases
    ↓
storage.py: create_task()
    │ New task: same title/description/priority/tags
    │ New due_date: calculated next occurrence
    │ New ID: auto-generated
    ↓
storage.py: mark_complete() [original task]
    │ Set: status = "complete"
    │ Set: completed_date = datetime.now()
    ↓
CommandResult(success=True, data=new_task)
    ↓
cli.py: Display
    │ "✓ Task completed. Next instance: ID {new_id}"
```

## Module Responsibilities

### models.py

**Purpose**: Define data structures, enums, and validation rules

**Exports**:
- `Priority` enum (HIGH, MEDIUM, LOW)
- `TaskType` enum (SCHEDULED, ACTIVITY)
- `RecurrencePattern` enum (DAILY, WEEKLY, BIWEEKLY, MONTHLY, YEARLY)
- `Task` dataclass with attributes and computed properties
- `Reminder` dataclass
- `validate_task()` function

**Key Decisions**:
- Use dataclasses (Python 3.9+) for automatic `__init__`, `__repr__`
- Computed properties: `is_overdue`, `task_type` (not stored)
- Immutable fields: `id`, `created_date`

**Reference**: `data-model.md`

### storage.py

**Purpose**: In-memory CRUD operations with O(1) lookups

**Module State**:
```python
tasks: List[Task] = []
task_index: Dict[int, int] = {}  # {task_id: list_index}
next_task_id: int = 1
```

**Exports**:
- `create_task()` - O(1)
- `get_task()` - O(1)
- `get_all_tasks()` - O(1)
- `update_task()` - O(1)
- `delete_task()` - O(n) [rebuilds index]
- `mark_complete()` - O(1) + recurrence handling
- `mark_incomplete()` - O(1)

**Key Decisions**:
- Dict index for O(1) lookups (FR-057 requirement)
- Index rebuild on delete (acceptable for infrequent operation)
- No persistence layer (in-memory only per constitution)

**Reference**: `contracts/storage-interface.md`

### commands.py

**Purpose**: Business logic, validation, error handling

**Exports**:
- `CommandResult` dataclass (success, message, data, errors)
- `add_task_command()`
- `view_all_tasks_command()`
- `update_task_command()`
- `delete_task_command(confirmed=bool)`
- `mark_complete_command()`
- `mark_incomplete_command()`
- Helper parsers: `parse_priority()`, `parse_date()`, `parse_tags()`, `parse_recurrence()`, `parse_reminder_offset()`

**Key Decisions**:
- CommandResult pattern for consistent error handling
- Parse and validate at this layer (not storage layer)
- Collect multiple validation errors before failing
- Delete confirmation handled via `confirmed` parameter

**Reference**: `contracts/commands-interface.md`

### filters.py

**Purpose**: Search, filter, and sort operations (pure functions)

**Exports**:
- `search_tasks(tasks, keyword)` - Keyword search
- `filter_by_status(tasks, status)`
- `filter_by_priority(tasks, priorities)`
- `filter_by_tag(tasks, tags)`
- `filter_by_date_range(tasks, start, end)`
- `filter_overdue(tasks)`
- `filter_due_today(tasks)`
- `filter_due_this_week(tasks)`
- `combine_filters(tasks, *filter_funcs)` - AND logic
- `sort_by_due_date(tasks, ascending)`
- `sort_by_priority(tasks, descending)`
- `sort_by_title(tasks, ascending)`
- `sort_by_created_date(tasks, newest_first)`
- `get_filter_summary()` - Human-readable summary
- `get_sort_description()` - Sort order description

**Key Decisions**:
- All functions are pure (no mutation)
- Return new lists (don't modify input)
- Composable via chaining or combine_filters()
- O(n) filter, O(n log n) sort (acceptable for 1000 tasks)

**Reference**: `contracts/filters-interface.md`

### scheduler.py

**Purpose**: Recurring task calculation and edge case handling

**Exports**:
- `calculate_next_due_date(task: Task) -> datetime`
- `create_recurring_instance(task: Task) -> Task`
- Edge case handlers for month-end, leap year

**Key Decisions**:
- Use python-dateutil.rrule for robust recurrence calculation
- Handle month-end: Jan 31 → Feb 28, Mar 31, Apr 30...
- Handle leap year: Feb 29 → Feb 28 in non-leap years
- Preserve title, description, priority, tags, recurrence in new instance

**Implementation Strategy**:
```python
from dateutil.rrule import rrule, DAILY, WEEKLY, MONTHLY, YEARLY

def calculate_next_due_date(task: Task) -> datetime:
    freq_map = {
        RecurrencePattern.DAILY: DAILY,
        RecurrencePattern.WEEKLY: WEEKLY,
        RecurrencePattern.MONTHLY: MONTHLY,
        RecurrencePattern.YEARLY: YEARLY,
    }
    freq = freq_map[task.recurrence]
    rule = rrule(freq, count=2, dtstart=task.due_date)
    return list(rule)[1]  # Second occurrence
```

### notifications.py

**Purpose**: Reminder management and desktop notifications

**Exports**:
- `ReminderManager` class (singleton)
  - `add_reminder(task_id, task)` - Register reminder
  - `cancel_reminder(task_id)` - Remove reminder
  - `start()` - Start background thread
  - `stop()` - Stop background thread
- `trigger_notification(task)` - Send desktop notification

**Key Decisions**:
- Background daemon thread with 60-second check interval
- Use plyer for cross-platform notifications
- Store active reminders in dict: `{task_id: Reminder}`
- Missed reminders marked as "OVERDUE" (FR edge case resolution)

**Implementation Strategy**:
```python
import threading
from plyer import notification

class ReminderManager:
    def __init__(self):
        self.reminders: Dict[int, Reminder] = {}
        self.thread = None
        self.running = False

    def start(self):
        self.running = True
        self.thread = threading.Thread(target=self._check_loop, daemon=True)
        self.thread.start()

    def _check_loop(self):
        while self.running:
            self._check_reminders()
            time.sleep(60)  # Check every 60 seconds

    def _check_reminders(self):
        now = datetime.now()
        for task_id, reminder in list(self.reminders.items()):
            if now >= reminder.reminder_time:
                trigger_notification(reminder.task)
                reminder.status = "triggered"
                del self.reminders[task_id]
```

### cli.py

**Purpose**: Interactive menu system and I/O formatting

**Exports**:
- `main_loop()` - Entry point
- Menu handlers:
  - `handle_add_task()`
  - `handle_view_tasks()`
  - `handle_update_task()`
  - `handle_delete_task()`
  - `handle_mark_complete()`
  - `handle_mark_incomplete()`
  - `handle_search()`
  - `handle_filter()`
  - `handle_sort()`
- Formatting:
  - `format_task(task)` - Format single task for display
  - `format_task_list(tasks)` - Tabular task list
  - `display_menu()` - Numbered menu organized by tier

**Key Decisions**:
- Use colorama for colored output (FR-064)
- Accept both numeric input (1, 2, 3) and keywords (add, list, search)
- Display menu organized by tier (Primary, Intermediate, Advanced)
- Confirmation prompts for destructive actions (delete)

**Color Scheme**:
- RED: HIGH priority, overdue tasks, errors
- YELLOW: MEDIUM priority, warnings
- GREEN: LOW priority, success messages
- GRAY/DIM: Completed tasks

**Menu Structure**:
```
=== Python CLI Todo Application ===

PRIMARY TIER - Core Operations:
1. Add Task
2. View All Tasks
3. Update Task
4. Delete Task
5. Mark Complete/Incomplete

INTERMEDIATE TIER - Organization:
6. Search Tasks
7. Filter Tasks
8. Sort Tasks

ADVANCED TIER - Automation:
9. Manage Recurring Tasks
10. View Upcoming Reminders

0. Exit

Enter choice (number or keyword):
```

## Implementation Sequence (TDD)

### Tier 1: PRIMARY (Foundation)

**Goal**: Establish MVP with core CRUD operations

**Order**:
1. `models.py` + `test_models.py` - Define Task, enums
2. `storage.py` + `test_storage.py` - Implement CRUD (no recurrence yet)
3. `commands.py` + `test_commands.py` - Add business logic (basic mark_complete)
4. `cli.py` + `test_cli.py` - Build menu for Primary Tier features
5. `main.py` - Entry point

**Acceptance**: User can add, view, update, delete, and mark tasks complete/incomplete via CLI

**Tests**: ~50-60 test cases across models, storage, commands, cli

### Tier 2: INTERMEDIATE (Organization)

**Goal**: Add search, filter, sort capabilities

**Order**:
1. `filters.py` + `test_filters.py` - Implement all search/filter/sort functions
2. Update `cli.py` + `test_cli.py` - Add menu options for search, filter, sort

**Acceptance**: User can search by keyword, filter by status/priority/tags/dates, sort by various criteria

**Tests**: ~40-50 test cases for filters (edge cases: empty results, null dates, combined filters)

### Tier 3: ADVANCED (Automation)

**Goal**: Add recurring tasks and reminders

**Order**:
1. `scheduler.py` + `test_scheduler.py` - Implement recurrence calculation
2. Update `commands.py` + `test_commands.py` - Modify mark_complete to handle recurrence
3. `notifications.py` + `test_notifications.py` - Implement reminder manager
4. Update `cli.py` + `test_cli.py` - Add reminder configuration, display upcoming

**Acceptance**: User can create recurring tasks that auto-reschedule; reminders trigger before due dates

**Tests**: ~30-40 test cases (recurrence edge cases, reminder timing, missed reminders)

**Total Expected Tests**: ~120-150 test cases across all modules

## Testing Strategy

### Unit Test Coverage Targets

Per constitution Section VI, ≥85% coverage required for core modules:

| Module | Target Coverage | Priority Test Areas |
|--------|-----------------|---------------------|
| models.py | ≥90% | Task validation, computed properties, enum values |
| storage.py | ≥90% | CRUD operations, index integrity, ID generation |
| commands.py | ≥85% | Validation errors, not-found cases, edge cases |
| filters.py | ≥85% | Search matching, combined filters, sort stability |
| scheduler.py | ≥90% | Month-end, leap year, all recurrence patterns |
| notifications.py | ≥80% | Reminder scheduling, cancellation, thread safety |
| cli.py | ≥70% | Menu navigation, input validation, output formatting |

### Edge Case Testing (Constitution Mandate)

**Priority Tests**:
- All three levels (HIGH, MEDIUM, LOW)
- Invalid priority values
- Case sensitivity

**Tag Tests**:
- Multiple tags per task
- Special characters in tags
- Empty tags (should be rejected)
- Unicode characters

**Date Tests**:
- Valid formats: YYYY-MM-DD, YYYY-MM-DD HH:MM
- Invalid formats: MM/DD/YYYY, 2025-13-45
- Past dates (should be allowed)
- Overdue detection (due_date < now)
- Month-end edge cases

**Filter Tests**:
- Single filter criterion
- Combined filters (AND logic)
- Empty result sets
- All tasks match
- No tasks match

**Sort Tests**:
- Null handling (tasks without due dates go to end)
- Stability (maintain relative order for equal elements)
- Multiple sort keys (secondary sorts)

**Recurrence Tests** (Critical):
- All patterns: DAILY, WEEKLY, BIWEEKLY, MONTHLY, YEARLY
- Month-end: Jan 31 → Feb 28, Mar 31, Apr 30, May 31
- Leap year: Feb 29 → Feb 28 (non-leap year)
- DST transitions (if applicable)

**Notification Tests**:
- Timing accuracy (reminder at correct time)
- Multiple reminders scheduled
- Reminder cancellation when task completed
- Missed reminders (system offline)

### Test Utilities

**Fixtures**:
```python
# In conftest.py
import pytest
from datetime import datetime

@pytest.fixture
def sample_task():
    return Task(
        id=1,
        title="Sample Task",
        description="Description",
        status="incomplete",
        priority=Priority.MEDIUM,
        tags=["Work"],
        created_date=datetime(2025, 12, 6, 10, 0),
        due_date=None
    )

@pytest.fixture
def task_list():
    return [
        Task(id=1, title="Task 1", priority=Priority.HIGH),
        Task(id=2, title="Task 2", priority=Priority.MEDIUM),
        Task(id=3, title="Task 3", priority=Priority.LOW),
    ]

@pytest.fixture
def clear_storage():
    """Clear storage before each test"""
    from src.todo import storage
    storage.tasks = []
    storage.task_index = {}
    storage.next_task_id = 1
    yield
    storage.tasks = []
    storage.task_index = {}
    storage.next_task_id = 1
```

**Mocking Time**:
```python
from unittest.mock import patch
from datetime import datetime

@patch('src.todo.storage.datetime')
def test_overdue_detection(mock_datetime):
    mock_datetime.now.return_value = datetime(2025, 12, 11)
    task = Task(id=1, due_date=datetime(2025, 12, 10))
    assert task.is_overdue == True
```

## Performance Validation

### SC-010 Requirement: 1000+ tasks, < 1 second operations

**Validation Tests**:

```python
def test_performance_create_1000_tasks():
    start = time.time()
    for i in range(1000):
        create_task(title=f"Task {i}")
    elapsed = time.time() - start
    assert elapsed < 1.0  # < 1 second for 1000 creates

def test_performance_lookup_with_1000_tasks():
    # Create 1000 tasks
    for i in range(1000):
        create_task(title=f"Task {i}")

    # Test O(1) lookup
    start = time.time()
    task = get_task(500)
    elapsed = time.time() - start
    assert elapsed < 0.001  # < 1ms for O(1) lookup

def test_performance_filter_1000_tasks():
    # Create 1000 tasks
    for i in range(1000):
        create_task(title=f"Task {i}", priority=Priority.HIGH if i % 2 == 0 else Priority.LOW)

    tasks = get_all_tasks()

    # Test filter performance
    start = time.time()
    results = filter_by_priority(tasks, [Priority.HIGH])
    elapsed = time.time() - start
    assert elapsed < 0.010  # < 10ms for filter operation
```

## Risk Mitigation

### Risk 1: Recurrence Edge Cases

**Impact**: High (incorrect due dates, data integrity issues)

**Mitigation**:
- Use battle-tested python-dateutil.rrule library
- Comprehensive test suite for month-end, leap year
- Manual testing with edge dates (Jan 31, Feb 29)

**Validation**: `test_scheduler.py` with parameterized edge case tests

### Risk 2: Test Coverage Below 85%

**Impact**: Medium (blocks PR approval)

**Mitigation**:
- TDD approach ensures coverage as code is written
- Use pytest-cov to track continuously
- Focus on core modules (models, storage, commands, filters, scheduler)
- CLI layer can be < 85% (70% target due to I/O complexity)

**Validation**: Run `pytest --cov=src/todo --cov-report=term-missing` before each commit

### Risk 3: Cross-Platform Notification Issues

**Impact**: Low (notifications may fail on some platforms)

**Mitigation**:
- Use plyer for platform abstraction
- Fallback: print to console if plyer fails
- Test on Windows, macOS, Linux if possible

**Validation**: Manual testing on available platforms

### Risk 4: Background Thread Issues

**Impact**: Low (reminders may not trigger)

**Mitigation**:
- Simple daemon thread with 60s polling (no complex concurrency)
- Graceful shutdown on exit
- Unit tests with mocked time

**Validation**: `test_notifications.py` with thread testing

## Deployment & Delivery

### Deliverables

1. **Source Code**: All modules in `src/todo/`
2. **Tests**: Full test suite in `tests/`
3. **Documentation**:
   - README.md (user guide)
   - This plan.md (architecture)
   - data-model.md (entities)
   - contracts/ (API contracts)
   - quickstart.md (developer guide)
4. **Configuration**: pyproject.toml, .flake8, requirements.txt

### Quality Gates

Before PR:
- ✅ All tests passing (`pytest`)
- ✅ Coverage ≥85% for core modules (`pytest --cov`)
- ✅ Code formatted (`black --check`)
- ✅ Linting passing (`flake8`)
- ✅ Type checking passing (`mypy --strict`)
- ✅ Manual testing of all user stories
- ✅ Performance validation (1000 tasks test)

### User Acceptance

Verify all user stories from spec.md:
- ✅ P1: Basic Task Management (CRUD)
- ✅ P2: Task Organization (Priority, Tags)
- ✅ P3: Scheduled Tasks (Due Dates, Overdue)
- ✅ P4: Search & Filter
- ✅ P5: Sort Tasks
- ✅ P6: Recurring Tasks
- ✅ P7: Reminders

## References

- **Specification**: [spec.md](spec.md) - Requirements and user stories
- **Data Model**: [data-model.md](data-model.md) - Entities, schema, validation
- **Research**: [research.md](research.md) - Technology decisions and rationale
- **Contracts**: [contracts/](contracts/) - API interface definitions
- **Quickstart**: [quickstart.md](quickstart.md) - Developer implementation guide
- **Constitution**: `.specify/memory/constitution.md` v2.1.0 - Project principles

## Next Steps

1. **Review and Approve Plan**: User reviews this plan.md
2. **Generate Tasks**: Run `/sp.tasks` to break down into actionable tasks with test cases
3. **Begin Implementation**: Start with PRIMARY TIER (models → storage → commands → cli)
4. **Iterative Development**: TDD Red-Green-Refactor for each module
5. **Tier Completion Gates**: Complete PRIMARY before INTERMEDIATE, INTERMEDIATE before ADVANCED
6. **Final Validation**: All tests passing, coverage ≥85%, manual acceptance testing
7. **Create PR**: Submit for review with full documentation

**Estimated Effort**: 3-5 days for experienced Python developer following TDD workflow (PRIMARY: 1.5 days, INTERMEDIATE: 1 day, ADVANCED: 1.5 days, testing/polish: 1 day)
