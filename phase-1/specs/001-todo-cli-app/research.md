# Research & Technology Decisions

**Feature**: Python CLI Todo Application
**Branch**: `001-todo-cli-app`
**Date**: 2025-12-06

## Overview

This document captures technology choices, research findings, and architectural decisions for the Python CLI Todo Application with three-tier feature architecture.

## Technology Stack Decisions

### 1. Language & Version

**Decision**: Python 3.9+

**Rationale**:
- Constitution mandates proper Python project structure and Pythonic design
- Python 3.9+ provides modern type hints syntax (PEP 585, PEP 604)
- Built-in support for dataclasses, enums, and datetime
- Excellent standard library for CLI applications
- Wide availability and cross-platform support

**Alternatives Considered**:
- Python 3.7/3.8: Rejected due to less modern type hint support
- Python 3.11+: Would be better for performance, but 3.9+ is acceptable for broader compatibility

### 2. In-Memory Storage

**Decision**: Python list with dictionary lookup optimization

**Rationale**:
- Constitution mandates in-memory storage (FR-054, FR-055)
- Use `list` for maintaining insertion order and task storage
- Use `dict` for O(1) ID-based lookups: `{task_id: task_index}`
- Satisfies FR-057 requirement for O(1) or O(log n) lookups
- No external dependencies required

**Alternatives Considered**:
- Pure list: O(n) lookups would violate FR-057 for large lists
- OrderedDict only: More complex than necessary
- SQLite in-memory: Overkill and adds dependency

**Implementation Pattern**:
```python
tasks: List[Task] = []
task_index: Dict[int, int] = {}  # {task_id: list_index}
```

### 3. Testing Framework

**Decision**: pytest

**Rationale**:
- Industry standard for Python testing
- Simple syntax, powerful fixtures
- Excellent parameterized testing for edge cases
- Built-in coverage reporting with pytest-cov
- Supports TDD workflow (constitution requirement)
- Mock support via pytest-mock or unittest.mock

**Alternatives Considered**:
- unittest: More verbose, less Pythonic
- nose2: Less actively maintained than pytest

**Dependencies**:
- pytest (core)
- pytest-cov (coverage ≥85% requirement)
- pytest-mock (optional, for mocking datetime.now, notifications)

### 4. CLI Framework

**Decision**: Native Python `input()` with custom menu system

**Rationale**:
- Constitution specifies menu-driven CLI (FR-058)
- No complex command-line parsing needed
- Keeps dependencies minimal (constitution principle)
- Allows for numbered menu + keyword commands (FR-059)
- Full control over UX and error handling

**Alternatives Considered**:
- Click: Overkill for menu-driven interface; better for command-style CLIs
- argparse: For command-line arguments, not interactive menus
- Typer: Modern but adds dependency; not needed for simple menu
- prompt_toolkit: Powerful but complex; not required by spec

**Implementation Approach**:
- Display numbered menu organized by tier
- Accept both numeric input (1, 2, 3) and keywords (add, list, search)
- Loop until user selects exit/quit

### 5. Colored Terminal Output

**Decision**: colorama

**Rationale**:
- Constitution recommends colorama for colored output
- FR-064 mandates colored output for priorities, status, errors
- Cross-platform (Windows, Linux, macOS)
- Simple API, minimal overhead
- Lightweight dependency

**Alternatives Considered**:
- termcolor: Similar but less cross-platform support
- rich: Feature-rich but heavy; overkill for simple color coding
- ANSI codes directly: Not portable to Windows without colorama

**Color Scheme**:
- RED: HIGH priority, overdue tasks, errors
- YELLOW: MEDIUM priority, warnings
- GREEN: LOW priority, success messages, completed tasks
- GRAY/DIM: Completed tasks (when listed with incomplete)

### 6. Date/Time Handling

**Decision**: Python standard library `datetime` and `dateutil` for recurrence

**Rationale**:
- Standard library datetime handles FR-027, FR-028 (date/time parsing and formatting)
- Constitution permits python-dateutil for recurrence (FR-043 to FR-048)
- dateutil.rrule provides robust recurrence calculation (handles month-end, leap years)
- No custom recurrence logic needed

**Alternatives Considered**:
- Pure stdlib datetime: Complex recurrence logic, edge case bugs likely
- APScheduler: Overkill; designed for job scheduling, not recurrence calculation
- Custom recurrence: High risk of edge case bugs (FR-048 requirement)

**Dependencies**:
- datetime (stdlib)
- python-dateutil (for rrule)

### 7. Desktop Notifications

**Decision**: plyer

**Rationale**:
- FR-051 mandates desktop notifications
- Cross-platform (Windows, macOS, Linux)
- Simple API: `notification.notify(title, message)`
- Lightweight, minimal dependencies
- Well-maintained

**Alternatives Considered**:
- desktop-notifier: Good alternative, but plyer more established
- Platform-specific (win10toast, pync): Not cross-platform
- Browser notifications: Requires web interface (out of scope for CLI)

**Implementation Note**:
- For reminders, need background process or scheduler
- Constitution mentions APScheduler as conditional dependency (FR-049, FR-050)
- Use threading with daemon thread for reminder checking

### 8. Code Quality Tools

**Decision**: black, flake8, mypy (constitution mandates)

**Rationale**:
- Constitution mandates all three (Code Quality Standards section)
- black: Automatic formatting (line length 88)
- flake8: Linting (ignore E203, W503 for black compatibility)
- mypy: Static type checking (strict mode)

**Configuration**:
```ini
# pyproject.toml or setup.cfg
[tool:pytest]
testpaths = tests
python_files = test_*.py

[flake8]
max-line-length = 88
extend-ignore = E203, W503

[mypy]
python_version = 3.9
strict = True
```

### 9. Project Structure

**Decision**: Single project (Option 1 from template)

**Rationale**:
- Constitution defines exact structure (Section V)
- CLI application, no web/mobile components
- src/todo/ package with specialized modules
- tests/ directory mirroring src/ structure

**Structure**:
```
todo-app/
├── src/
│   └── todo/
│       ├── __init__.py
│       ├── models.py          # Task, Priority, TaskType, RecurrencePattern enums
│       ├── storage.py         # In-memory CRUD operations
│       ├── commands.py        # Business logic for each feature
│       ├── filters.py         # Search, filter, sort algorithms
│       ├── scheduler.py       # Recurring tasks, next due date calculation
│       ├── notifications.py   # Reminder system, notification delivery
│       └── cli.py             # CLI menu, input/output, main loop
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
├── pyproject.toml             # Tool configs
└── README.md
```

### 10. Scheduler for Reminders

**Decision**: threading.Thread with daemon for reminder checking

**Rationale**:
- FR-049 to FR-053 require reminder notifications before due dates
- Needs background process to check reminder times
- stdlib threading sufficient for single-user CLI app
- Daemon thread exits when main program exits
- No need for APScheduler's job persistence (in-memory storage)

**Alternatives Considered**:
- APScheduler: Constitution lists as conditional; overkill for this use case
- asyncio: Adds complexity; not needed for simple reminder checking
- Cron/system scheduler: External dependency; not portable

**Implementation Approach**:
- Background thread checks reminders every 60 seconds
- Compare current time to task due_time - reminder_offset
- Trigger notification via plyer when match found
- Cancel reminder if task marked complete (FR-053)

## Architectural Patterns

### 1. Separation of Concerns

**Pattern**: Layered architecture (constitution mandates)

**Layers**:
- **Models** (models.py): Data structures, validation, enums
- **Storage** (storage.py): CRUD operations, data integrity
- **Business Logic** (commands.py, filters.py, scheduler.py): Feature implementation
- **Presentation** (cli.py): User interface, input/output

**Benefits**:
- Testability: Each layer independently testable
- Maintainability: Clear responsibility boundaries
- Constitution compliance: Section V requirement

### 2. Data Model Design

**Pattern**: Dataclass with computed properties

**Rationale**:
- Python 3.9+ dataclasses for Task entity
- Computed properties for derived fields (is_overdue, task_type)
- Enums for constrained values (Priority, RecurrencePattern, TaskType)
- Type hints throughout (constitution requirement)

**Example**:
```python
@dataclass
class Task:
    id: int
    title: str
    description: str = ""
    status: str = "incomplete"
    priority: Priority = Priority.MEDIUM
    tags: List[str] = field(default_factory=list)
    created_date: datetime = field(default_factory=datetime.now)
    due_date: Optional[datetime] = None
    recurrence: Optional[RecurrencePattern] = None
    completed_date: Optional[datetime] = None

    @property
    def is_overdue(self) -> bool:
        return self.due_date and datetime.now() > self.due_date and self.status == "incomplete"

    @property
    def task_type(self) -> TaskType:
        return TaskType.SCHEDULED if self.due_date else TaskType.ACTIVITY
```

### 3. Filter/Sort Strategy

**Pattern**: Functional composition with lambda/filter/sorted

**Rationale**:
- FR-031 to FR-042 define search, filter, sort requirements
- Python's functional tools (filter, sorted) are idiomatic
- Combine multiple filters with AND logic (FR-036)
- Chainable, testable, readable

**Example**:
```python
def search_tasks(tasks: List[Task], keyword: str) -> List[Task]:
    return [t for t in tasks if keyword.lower() in t.title.lower() or keyword.lower() in t.description.lower()]

def filter_by_status(tasks: List[Task], status: str) -> List[Task]:
    return [t for t in tasks if t.status == status]

def sort_by_priority(tasks: List[Task], reverse: bool = False) -> List[Task]:
    priority_order = {Priority.HIGH: 0, Priority.MEDIUM: 1, Priority.LOW: 2}
    return sorted(tasks, key=lambda t: priority_order[t.priority], reverse=reverse)
```

### 4. Error Handling Strategy

**Pattern**: Defensive validation with custom exceptions

**Rationale**:
- FR-066 to FR-070 mandate comprehensive error handling
- Validate input at CLI layer
- Raise custom exceptions (TaskNotFoundError, InvalidDateError)
- Catch at CLI layer, display user-friendly messages
- Never show Python tracebacks to user (FR-061)

**Exception Hierarchy**:
```python
class TodoAppError(Exception): pass
class TaskNotFoundError(TodoAppError): pass
class InvalidDateError(TodoAppError): pass
class InvalidPriorityError(TodoAppError): pass
class InvalidRecurrenceError(TodoAppError): pass
```

## Performance Considerations

### Scale Target

**Specification**: SC-010 requires handling 1000+ tasks without degradation (< 1 second operations)

**Strategy**:
- O(1) lookups via task_index dict
- Filtering/sorting on full list acceptable for 1000 items (< 10ms typical)
- No database overhead
- In-memory operations inherently fast

### Memory Footprint

**Estimate**:
- Task object: ~500 bytes (title, description, metadata)
- 1000 tasks: ~500 KB
- Indexes and auxiliary data: ~100 KB
- Total: < 1 MB for typical usage

## Testing Strategy

### Coverage Target

**Requirement**: ≥85% coverage (constitution mandates)

**Approach**:
- Unit tests for all public functions/methods
- Parameterized tests for edge cases (pytest.mark.parametrize)
- Mock time-dependent functions (datetime.now, notification triggers)
- Test isolation: no shared state

### Test Organization

**Structure** (mirrors src/):
- test_models.py: Task validation, computed properties, enums
- test_storage.py: CRUD operations, ID generation, data integrity
- test_commands.py: Add, update, delete, complete business logic
- test_filters.py: Search, filter, sort algorithms
- test_scheduler.py: Recurrence calculation, edge cases (month-end, leap year)
- test_notifications.py: Reminder triggering, cancellation, missed reminders
- test_cli.py: Menu system, input validation, output formatting

### Edge Case Testing Priority

Per constitution (Section VI):
- Priority tests: All three levels, invalid values
- Tag tests: Multiple tags, special characters, empty tags
- Date tests: Valid/invalid formats, past dates, overdue detection
- Filter tests: Single criteria, combined filters, empty results
- Sort tests: Multiple keys, null handling, stability
- Recurrence tests: Month boundaries, leap years (FR-048)
- Notification tests: Timing, multiple reminders, cancellation

## Dependencies Summary

### Required

```
pytest>=7.4.0
pytest-cov>=4.1.0
colorama>=0.4.6
python-dateutil>=2.8.2
plyer>=2.1.0
```

### Development

```
black>=23.0.0
flake8>=6.0.0
mypy>=1.4.0
pytest-mock>=3.11.0  # Optional, for mocking
```

### Justification

All dependencies align with constitution:
- pytest: TDD requirement
- colorama: Recommended in constitution for colored output
- python-dateutil: Listed as conditional for recurrence
- plyer: Cross-platform notifications (FR-051)
- black, flake8, mypy: Code quality mandates

## Risk Assessment

### Technical Risks

1. **Recurrence Edge Cases** (Medium Risk)
   - Mitigation: Use battle-tested python-dateutil.rrule
   - Test month-end, leap year scenarios explicitly (FR-048)

2. **Reminder Background Thread** (Low Risk)
   - Mitigation: Simple daemon thread with 60s polling
   - Graceful shutdown on exit
   - No complex concurrency needed

3. **Cross-Platform Notifications** (Medium Risk)
   - Mitigation: plyer abstracts platform differences
   - Test on Windows, macOS, Linux if possible
   - Fallback: print to console if notification fails

4. **Test Coverage ≥85%** (Low Risk)
   - Mitigation: TDD approach ensures coverage
   - Use pytest-cov to track continuously
   - Focus on core modules (models, storage, commands, filters, scheduler)

### Scope Risks

1. **Three-Tier Complexity** (Low Risk)
   - Mitigation: Implement tiers sequentially (Primary → Intermediate → Advanced)
   - Each tier independently deliverable
   - Constitution mandates this approach (Section III)

2. **Advanced Features** (Medium Risk)
   - Recurring tasks and reminders are most complex
   - Mitigation: Leverage python-dateutil and plyer
   - Implement last after Primary/Intermediate proven

## Open Questions / Decisions Deferred

None. All technical unknowns resolved through research phase.

## References

- Constitution: `.specify/memory/constitution.md` v2.1.0
- Feature Spec: `specs/001-todo-cli-app/spec.md`
- Python Documentation: datetime, dataclasses, typing
- python-dateutil: https://dateutil.readthedocs.io/
- pytest: https://docs.pytest.org/
- plyer: https://plyer.readthedocs.io/
