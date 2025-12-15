"""Search and filter functions for tasks."""

from datetime import datetime, timedelta
from typing import List, Optional

from src.todo.models import Task, Priority


def search_tasks(tasks: List[Task], keyword: str) -> List[Task]:
    """Search tasks by keyword in title or description (case-insensitive).

    Args:
        tasks: List of tasks to search
        keyword: Search term

    Returns:
        List of tasks containing keyword in title or description
    """
    keyword_lower = keyword.lower()
    return [
        task
        for task in tasks
        if keyword_lower in task.title.lower()
        or keyword_lower in task.description.lower()
    ]


def filter_by_status(tasks: List[Task], status: str) -> List[Task]:
    """Filter tasks by completion status.

    Args:
        tasks: List of tasks to filter
        status: Status to filter by ("complete" or "incomplete")

    Returns:
        List of tasks with matching status
    """
    return [task for task in tasks if task.status == status]


def filter_by_priority(tasks: List[Task], priorities: List[Priority]) -> List[Task]:
    """Filter tasks by priority levels.

    Args:
        tasks: List of tasks to filter
        priorities: List of priority levels to include

    Returns:
        List of tasks with matching priority
    """
    return [task for task in tasks if task.priority in priorities]


def filter_by_tag(tasks: List[Task], tag: str) -> List[Task]:
    """Filter tasks by tag presence.

    Args:
        tasks: List of tasks to filter
        tag: Tag to search for

    Returns:
        List of tasks containing the tag
    """
    return [task for task in tasks if tag in task.tags]


def filter_by_date_range(
    tasks: List[Task], start_date: datetime, end_date: datetime
) -> List[Task]:
    """Filter tasks with due dates within date range.

    Args:
        tasks: List of tasks to filter
        start_date: Start of date range (inclusive)
        end_date: End of date range (inclusive)

    Returns:
        List of tasks with due_date in range
    """
    return [
        task
        for task in tasks
        if task.due_date and start_date <= task.due_date <= end_date
    ]


def filter_overdue(tasks: List[Task]) -> List[Task]:
    """Filter tasks that are overdue.

    Args:
        tasks: List of tasks to filter

    Returns:
        List of overdue tasks (past due date and incomplete)
    """
    return [task for task in tasks if task.is_overdue]


def filter_due_today(tasks: List[Task]) -> List[Task]:
    """Filter tasks due today.

    Args:
        tasks: List of tasks to filter

    Returns:
        List of tasks due today (any time)
    """
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = today + timedelta(days=1)

    return [
        task for task in tasks if task.due_date and today <= task.due_date < tomorrow
    ]


def filter_due_this_week(tasks: List[Task]) -> List[Task]:
    """Filter tasks due within the next 7 days.

    Args:
        tasks: List of tasks to filter

    Returns:
        List of tasks due this week
    """
    now = datetime.now()
    week_from_now = now + timedelta(days=7)

    return [
        task
        for task in tasks
        if task.due_date and now <= task.due_date <= week_from_now
    ]


def combine_filters(
    tasks: List[Task],
    keyword: Optional[str] = None,
    status: Optional[str] = None,
    priorities: Optional[List[Priority]] = None,
    tag: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    overdue_only: bool = False,
    due_today_only: bool = False,
    due_this_week_only: bool = False,
) -> List[Task]:
    """Combine multiple filters with AND logic.

    Args:
        tasks: List of tasks to filter
        keyword: Optional search keyword
        status: Optional status filter
        priorities: Optional list of priorities to include
        tag: Optional tag to filter by
        start_date: Optional start of date range
        end_date: Optional end of date range
        overdue_only: If True, only include overdue tasks
        due_today_only: If True, only include tasks due today
        due_this_week_only: If True, only include tasks due this week

    Returns:
        List of tasks matching ALL specified filters
    """
    results = tasks

    if keyword:
        results = search_tasks(results, keyword)

    if status:
        results = filter_by_status(results, status)

    if priorities:
        results = filter_by_priority(results, priorities)

    if tag:
        results = filter_by_tag(results, tag)

    if start_date and end_date:
        results = filter_by_date_range(results, start_date, end_date)

    if overdue_only:
        results = filter_overdue(results)

    if due_today_only:
        results = filter_due_today(results)

    if due_this_week_only:
        results = filter_due_this_week(results)

    return results


def get_filter_summary(
    keyword: Optional[str] = None,
    status: Optional[str] = None,
    priorities: Optional[List[Priority]] = None,
    tag: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    overdue_only: bool = False,
    due_today_only: bool = False,
    due_this_week_only: bool = False,
) -> str:
    """Generate human-readable summary of active filters.

    Args:
        keyword: Optional search keyword
        status: Optional status filter
        priorities: Optional list of priorities
        tag: Optional tag filter
        start_date: Optional start date
        end_date: Optional end date
        overdue_only: Overdue filter flag
        due_today_only: Due today filter flag
        due_this_week_only: Due this week filter flag

    Returns:
        Human-readable filter summary string
    """
    filters_applied = []

    if keyword:
        filters_applied.append(f'Keyword: "{keyword}"')

    if status:
        filters_applied.append(f"Status: {status}")

    if priorities:
        priority_names = [p.value for p in priorities]
        filters_applied.append(f"Priority: {', '.join(priority_names)}")

    if tag:
        filters_applied.append(f"Tag: {tag}")

    if start_date and end_date:
        filters_applied.append(
            f"Due: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}"
        )

    if overdue_only:
        filters_applied.append("Overdue only")

    if due_today_only:
        filters_applied.append("Due today only")

    if due_this_week_only:
        filters_applied.append("Due this week only")

    if not filters_applied:
        return "No filters applied"

    return "Filters: " + " | ".join(filters_applied)


# Sort functions


def sort_by_due_date(tasks: List[Task]) -> List[Task]:
    """Sort tasks by due date (earliest first, nulls last).

    Args:
        tasks: List of tasks to sort

    Returns:
        New sorted list (original list unchanged)
    """
    # Use stable sort: tasks with due_date first (sorted), then tasks without
    with_due_date = [t for t in tasks if t.due_date]
    without_due_date = [t for t in tasks if not t.due_date]

    sorted_with_due = sorted(with_due_date, key=lambda t: t.due_date)
    return sorted_with_due + without_due_date


def sort_by_priority(tasks: List[Task]) -> List[Task]:
    """Sort tasks by priority (HIGH → MEDIUM → LOW).

    Args:
        tasks: List of tasks to sort

    Returns:
        New sorted list (original list unchanged)
    """
    priority_order = {Priority.HIGH: 0, Priority.MEDIUM: 1, Priority.LOW: 2}
    return sorted(tasks, key=lambda t: priority_order[t.priority])


def sort_by_title(tasks: List[Task]) -> List[Task]:
    """Sort tasks alphabetically by title (case-insensitive).

    Args:
        tasks: List of tasks to sort

    Returns:
        New sorted list (original list unchanged)
    """
    return sorted(tasks, key=lambda t: t.title.lower())


def sort_by_created_date(tasks: List[Task]) -> List[Task]:
    """Sort tasks by created date (oldest first).

    Args:
        tasks: List of tasks to sort

    Returns:
        New sorted list (original list unchanged)
    """
    return sorted(tasks, key=lambda t: t.created_date)


def get_sort_description(sort_by: str) -> str:
    """Get human-readable description of sort order.

    Args:
        sort_by: Sort criteria (due_date, priority, title, created_date)

    Returns:
        Human-readable sort description
    """
    descriptions = {
        "due_date": "Due Date (earliest first)",
        "priority": "Priority (HIGH → MEDIUM → LOW)",
        "title": "Title (A-Z)",
        "created_date": "Created Date (oldest first)",
    }
    return descriptions.get(sort_by, "Unknown")
