# Filters Interface Contract

**Module**: `src/todo/filters.py`
**Purpose**: Search, filter, and sort operations on task lists
**Version**: 1.0.0

## Overview

Provides pure functions for searching, filtering, and sorting task lists. All functions are non-mutating (return new lists) and composable.

## Search Functions

### search_tasks

Search tasks by keyword in title or description (case-insensitive).

**Signature**:
```python
def search_tasks(tasks: List[Task], keyword: str) -> List[Task]
```

**Parameters**:
- `tasks` (List[Task]): List of tasks to search
- `keyword` (str): Search keyword (case-insensitive)

**Returns**: List of tasks matching keyword (may be empty)

**Logic**:
- Search in both `task.title` and `task.description`
- Case-insensitive matching
- Substring match (not whole word)

**Example**:
```python
tasks = get_all_tasks()
results = search_tasks(tasks, "meeting")
# Returns all tasks with "meeting" in title or description
```

**Edge Cases**:
- Empty keyword: Return all tasks
- No matches: Return empty list

---

## Filter Functions

### filter_by_status

Filter tasks by completion status.

**Signature**:
```python
def filter_by_status(tasks: List[Task], status: str) -> List[Task]
```

**Parameters**:
- `tasks` (List[Task]): List of tasks to filter
- `status` (str): "complete" or "incomplete"

**Returns**: List of tasks with matching status

**Example**:
```python
incomplete_tasks = filter_by_status(tasks, "incomplete")
```

---

### filter_by_priority

Filter tasks by priority level(s).

**Signature**:
```python
def filter_by_priority(tasks: List[Task], priorities: List[Priority]) -> List[Task]
```

**Parameters**:
- `tasks` (List[Task]): List of tasks to filter
- `priorities` (List[Priority]): List of priorities to include

**Returns**: List of tasks with any of the specified priorities

**Example**:
```python
high_medium = filter_by_priority(tasks, [Priority.HIGH, Priority.MEDIUM])
```

---

### filter_by_tag

Filter tasks by tag(s).

**Signature**:
```python
def filter_by_tag(tasks: List[Task], tags: List[str]) -> List[Task]
```

**Parameters**:
- `tasks` (List[Task]): List of tasks to filter
- `tags` (List[str]): List of tags to match (OR logic)

**Returns**: List of tasks having any of the specified tags

**Example**:
```python
work_tasks = filter_by_tag(tasks, ["Work"])
work_or_meeting = filter_by_tag(tasks, ["Work", "Meeting"])
```

---

### filter_by_date_range

Filter tasks by due date range.

**Signature**:
```python
def filter_by_date_range(
    tasks: List[Task],
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> List[Task]
```

**Parameters**:
- `tasks` (List[Task]): List of tasks to filter
- `start_date` (Optional[datetime]): Minimum due date (inclusive), None = no lower bound
- `end_date` (Optional[datetime]): Maximum due date (inclusive), None = no upper bound

**Returns**: List of tasks with due dates in range

**Logic**:
- Tasks without due dates are excluded
- If `start_date` is None: no lower bound
- If `end_date` is None: no upper bound

**Example**:
```python
# Tasks due this week
today = datetime.now()
week_later = today + timedelta(days=7)
this_week = filter_by_date_range(tasks, today, week_later)
```

---

### filter_overdue

Filter for overdue tasks.

**Signature**:
```python
def filter_overdue(tasks: List[Task]) -> List[Task]
```

**Returns**: List of incomplete tasks past their due date

**Example**:
```python
overdue_tasks = filter_overdue(tasks)
```

---

### filter_due_today

Filter tasks due today.

**Signature**:
```python
def filter_due_today(tasks: List[Task]) -> List[Task]
```

**Returns**: List of tasks due on current date

**Example**:
```python
today_tasks = filter_due_today(tasks)
```

---

### filter_due_this_week

Filter tasks due within next 7 days.

**Signature**:
```python
def filter_due_this_week(tasks: List[Task]) -> List[Task]
```

**Returns**: List of tasks due in next 7 days (from now)

**Example**:
```python
week_tasks = filter_due_this_week(tasks)
```

---

### combine_filters

Combine multiple filters with AND logic.

**Signature**:
```python
def combine_filters(tasks: List[Task], *filter_funcs) -> List[Task]
```

**Parameters**:
- `tasks` (List[Task]): Initial task list
- `*filter_funcs`: Variable number of filter functions (partially applied)

**Returns**: Tasks matching all filters

**Example**:
```python
# Incomplete HIGH priority Work tasks
results = combine_filters(
    tasks,
    lambda t: filter_by_status(t, "incomplete"),
    lambda t: filter_by_priority(t, [Priority.HIGH]),
    lambda t: filter_by_tag(t, ["Work"])
)
```

**Alternative Pattern** (method chaining):
```python
results = filter_by_status(tasks, "incomplete")
results = filter_by_priority(results, [Priority.HIGH])
results = filter_by_tag(results, ["Work"])
```

---

## Sort Functions

### sort_by_due_date

Sort tasks by due date.

**Signature**:
```python
def sort_by_due_date(tasks: List[Task], ascending: bool = True) -> List[Task]
```

**Parameters**:
- `tasks` (List[Task]): List of tasks to sort
- `ascending` (bool): True for earliest first, False for latest first

**Returns**: New sorted list (original unchanged)

**Logic**:
- Tasks with due dates come before tasks without (when ascending=True)
- Tasks without due dates go to end
- Among tasks with due dates: sort by datetime
- Among tasks without due dates: maintain original order

**Example**:
```python
earliest_first = sort_by_due_date(tasks, ascending=True)
latest_first = sort_by_due_date(tasks, ascending=False)
```

---

### sort_by_priority

Sort tasks by priority level.

**Signature**:
```python
def sort_by_priority(tasks: List[Task], descending: bool = True) -> List[Task]
```

**Parameters**:
- `tasks` (List[Task]): List of tasks to sort
- `descending` (bool): True for HIGH→MEDIUM→LOW, False for LOW→MEDIUM→HIGH

**Returns**: New sorted list

**Example**:
```python
high_first = sort_by_priority(tasks, descending=True)  # HIGH, MEDIUM, LOW
low_first = sort_by_priority(tasks, descending=False)  # LOW, MEDIUM, HIGH
```

---

### sort_by_title

Sort tasks alphabetically by title.

**Signature**:
```python
def sort_by_title(tasks: List[Task], ascending: bool = True) -> List[Task]
```

**Parameters**:
- `tasks` (List[Task]): List of tasks to sort
- `ascending` (bool): True for A-Z, False for Z-A

**Returns**: New sorted list (case-insensitive)

**Example**:
```python
a_to_z = sort_by_title(tasks, ascending=True)
z_to_a = sort_by_title(tasks, ascending=False)
```

---

### sort_by_created_date

Sort tasks by creation timestamp.

**Signature**:
```python
def sort_by_created_date(tasks: List[Task], newest_first: bool = True) -> List[Task]
```

**Parameters**:
- `tasks` (List[Task]): List of tasks to sort
- `newest_first` (bool): True for newest→oldest, False for oldest→newest

**Returns**: New sorted list

**Example**:
```python
newest_first = sort_by_created_date(tasks, newest_first=True)
oldest_first = sort_by_created_date(tasks, newest_first=False)
```

---

## Utility Functions

### get_filter_summary

Generate human-readable summary of applied filters.

**Signature**:
```python
def get_filter_summary(
    keyword: Optional[str] = None,
    status: Optional[str] = None,
    priorities: Optional[List[Priority]] = None,
    tags: Optional[List[str]] = None,
    date_filter: Optional[str] = None
) -> str
```

**Returns**: String describing active filters

**Example**:
```python
summary = get_filter_summary(
    keyword="meeting",
    status="incomplete",
    priorities=[Priority.HIGH],
    tags=["Work"]
)
# Returns: "Filters: keyword='meeting', status=incomplete, priority=HIGH, tags=Work"
```

---

### get_sort_description

Generate human-readable description of current sort order.

**Signature**:
```python
def get_sort_description(sort_key: str, ascending: bool = True) -> str
```

**Parameters**:
- `sort_key` (str): "due_date", "priority", "title", "created_date"
- `ascending` (bool): Sort direction

**Returns**: String describing sort order

**Example**:
```python
desc = get_sort_description("due_date", ascending=True)
# Returns: "Sorted by: Due Date (earliest first)"

desc = get_sort_description("priority", ascending=False)
# Returns: "Sorted by: Priority (LOW → HIGH)"
```

---

## Performance Contract

### Complexity

All filter/search functions: **O(n)** where n = number of tasks
All sort functions: **O(n log n)** using Python's Timsort

### Scale Target

For 1000 tasks:
- Filter operations: < 5ms
- Sort operations: < 10ms
- Combined filter + sort: < 15ms

All operations comfortably meet SC-004 requirement (find tasks in < 10 seconds).

## Testing Contract

### Unit Test Requirements

Each function MUST have tests for:
- Success case with matches
- Empty result set (no matches)
- Empty input list
- Edge cases (null due dates, empty strings)

### Example Test Cases

```python
def test_search_tasks_case_insensitive():
    tasks = [
        Task(id=1, title="Team MEETING"),
        Task(id=2, title="Buy groceries"),
        Task(id=3, description="prepare for meeting")
    ]
    results = search_tasks(tasks, "meeting")
    assert len(results) == 2
    assert results[0].id == 1
    assert results[1].id == 3

def test_filter_by_priority_multiple():
    tasks = [
        Task(id=1, priority=Priority.HIGH),
        Task(id=2, priority=Priority.MEDIUM),
        Task(id=3, priority=Priority.LOW)
    ]
    results = filter_by_priority(tasks, [Priority.HIGH, Priority.MEDIUM])
    assert len(results) == 2

def test_sort_by_due_date_nulls_last():
    tasks = [
        Task(id=1, due_date=datetime(2025, 12, 15)),
        Task(id=2, due_date=None),
        Task(id=3, due_date=datetime(2025, 12, 10))
    ]
    results = sort_by_due_date(tasks, ascending=True)
    assert results[0].id == 3  # Dec 10
    assert results[1].id == 1  # Dec 15
    assert results[2].id == 2  # None (last)

def test_combine_filters():
    tasks = [
        Task(id=1, status="incomplete", priority=Priority.HIGH, tags=["Work"]),
        Task(id=2, status="complete", priority=Priority.HIGH, tags=["Work"]),
        Task(id=3, status="incomplete", priority=Priority.LOW, tags=["Work"])
    ]
    results = combine_filters(
        tasks,
        lambda t: filter_by_status(t, "incomplete"),
        lambda t: filter_by_priority(t, [Priority.HIGH])
    )
    assert len(results) == 1
    assert results[0].id == 1
```

## Integration with CLI

### CLI Usage Pattern

```python
# In cli.py
def handle_search():
    keyword = input("Enter search keyword: ")
    tasks = get_all_tasks()
    results = search_tasks(tasks, keyword)

    if results:
        print(f"Found {len(results)} tasks:")
        for task in results:
            print(format_task(task))
    else:
        print(f"No tasks found matching '{keyword}'")

def handle_filter():
    all_tasks = get_all_tasks()

    # Collect filter criteria
    status = input("Filter by status (complete/incomplete/all): ")
    priority_str = input("Filter by priority (HIGH/MEDIUM/LOW/all): ")

    # Apply filters
    results = all_tasks
    if status != "all":
        results = filter_by_status(results, status)
    if priority_str != "all":
        priority = parse_priority(priority_str)
        results = filter_by_priority(results, [priority])

    # Display results
    summary = get_filter_summary(status=status if status != "all" else None)
    print(f"\n{summary}")
    print(f"Matching tasks: {len(results)}")
    for task in results:
        print(format_task(task))
```

## Versioning

**Version**: 1.0.0

**Changelog**:
- 1.0.0 (2025-12-06): Initial contract definition
