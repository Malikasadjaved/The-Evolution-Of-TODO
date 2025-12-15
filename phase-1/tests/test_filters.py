"""Tests for search and filter functionality."""

from datetime import datetime, timedelta

from src.todo.models import Task, Priority
from src.todo import filters


class TestSearchTasks:
    """Test search functionality."""

    def test_search_tasks_case_insensitive(self):
        """Test that search is case-insensitive."""
        tasks = [
            Task(id=1, title="Team MEETING"),
            Task(id=2, title="meeting notes"),
            Task(id=3, title="Project work"),
        ]

        results = filters.search_tasks(tasks, "meeting")
        assert len(results) == 2
        assert results[0].id == 1
        assert results[1].id == 2

    def test_search_tasks_in_title_and_description(self):
        """Test search looks in both title and description."""
        tasks = [
            Task(id=1, title="Task 1", description="Contains keyword meeting"),
            Task(id=2, title="Meeting task", description="Description"),
            Task(id=3, title="Other task", description="No match"),
        ]

        results = filters.search_tasks(tasks, "meeting")
        assert len(results) == 2
        assert results[0].id == 1
        assert results[1].id == 2


class TestFilterByStatus:
    """Test status filtering."""

    def test_filter_by_status(self):
        """Test filtering by completion status."""
        tasks = [
            Task(id=1, title="Task 1", status="complete"),
            Task(id=2, title="Task 2", status="incomplete"),
            Task(id=3, title="Task 3", status="incomplete"),
        ]

        incomplete = filters.filter_by_status(tasks, "incomplete")
        assert len(incomplete) == 2

        complete = filters.filter_by_status(tasks, "complete")
        assert len(complete) == 1


class TestFilterByPriority:
    """Test priority filtering."""

    def test_filter_by_priority_multiple(self):
        """Test filtering by multiple priority levels."""
        tasks = [
            Task(id=1, title="High", priority=Priority.HIGH),
            Task(id=2, title="Medium", priority=Priority.MEDIUM),
            Task(id=3, title="Low", priority=Priority.LOW),
            Task(id=4, title="High2", priority=Priority.HIGH),
        ]

        high_only = filters.filter_by_priority(tasks, [Priority.HIGH])
        assert len(high_only) == 2

        high_and_medium = filters.filter_by_priority(
            tasks, [Priority.HIGH, Priority.MEDIUM]
        )
        assert len(high_and_medium) == 3


class TestFilterByTag:
    """Test tag filtering."""

    def test_filter_by_tag(self):
        """Test filtering by tag presence."""
        tasks = [
            Task(id=1, title="Task 1", tags=["Work", "Urgent"]),
            Task(id=2, title="Task 2", tags=["Home"]),
            Task(id=3, title="Task 3", tags=["Work", "Project"]),
        ]

        work_tasks = filters.filter_by_tag(tasks, "Work")
        assert len(work_tasks) == 2
        assert work_tasks[0].id == 1
        assert work_tasks[1].id == 3

        home_tasks = filters.filter_by_tag(tasks, "Home")
        assert len(home_tasks) == 1


class TestFilterByDateRange:
    """Test date range filtering."""

    def test_filter_by_date_range(self):
        """Test filtering tasks within date range."""
        start_date = datetime(2025, 12, 1)
        end_date = datetime(2025, 12, 31)

        tasks = [
            Task(id=1, title="Dec task", due_date=datetime(2025, 12, 15)),
            Task(id=2, title="Jan task", due_date=datetime(2026, 1, 15)),
            Task(id=3, title="Nov task", due_date=datetime(2025, 11, 15)),
            Task(id=4, title="No date"),
        ]

        results = filters.filter_by_date_range(tasks, start_date, end_date)
        assert len(results) == 1
        assert results[0].id == 1


class TestFilterOverdue:
    """Test overdue filtering."""

    def test_filter_overdue(self):
        """Test filtering overdue tasks."""
        tasks = [
            Task(
                id=1,
                title="Overdue",
                due_date=datetime(2020, 1, 1),
                status="incomplete",
            ),
            Task(id=2, title="Future", due_date=datetime(2099, 12, 31)),
            Task(id=3, title="No date"),
            Task(
                id=4,
                title="Complete overdue",
                due_date=datetime(2020, 1, 1),
                status="complete",
            ),
        ]

        overdue = filters.filter_overdue(tasks)
        assert len(overdue) == 1
        assert overdue[0].id == 1


class TestFilterDueToday:
    """Test due today filtering."""

    def test_filter_due_today(self):
        """Test filtering tasks due today."""
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow = today + timedelta(days=1)
        yesterday = today - timedelta(days=1)

        tasks = [
            Task(id=1, title="Due today", due_date=today + timedelta(hours=14)),
            Task(id=2, title="Due tomorrow", due_date=tomorrow),
            Task(id=3, title="Due yesterday", due_date=yesterday),
            Task(id=4, title="No date"),
        ]

        due_today = filters.filter_due_today(tasks)
        assert len(due_today) == 1
        assert due_today[0].id == 1


class TestFilterDueThisWeek:
    """Test due this week filtering."""

    def test_filter_due_this_week(self):
        """Test filtering tasks due this week."""
        today = datetime.now()
        in_week = today + timedelta(days=3)
        next_week = today + timedelta(days=10)

        tasks = [
            Task(id=1, title="This week", due_date=in_week),
            Task(id=2, title="Next week", due_date=next_week),
            Task(id=3, title="No date"),
        ]

        this_week = filters.filter_due_this_week(tasks)
        assert len(this_week) >= 1  # At least the one we created
        assert tasks[0] in this_week


class TestCombineFilters:
    """Test combining multiple filters."""

    def test_combine_filters_and_logic(self):
        """Test that multiple filters combine with AND logic."""
        tasks = [
            Task(
                id=1,
                title="Match all",
                status="incomplete",
                priority=Priority.HIGH,
                tags=["Work"],
            ),
            Task(
                id=2,
                title="Wrong status",
                status="complete",
                priority=Priority.HIGH,
                tags=["Work"],
            ),
            Task(
                id=3,
                title="Wrong priority",
                status="incomplete",
                priority=Priority.LOW,
                tags=["Work"],
            ),
            Task(
                id=4,
                title="Wrong tag",
                status="incomplete",
                priority=Priority.HIGH,
                tags=["Home"],
            ),
        ]

        # Apply filters in sequence (AND logic)
        results = tasks
        results = filters.filter_by_status(results, "incomplete")
        results = filters.filter_by_priority(results, [Priority.HIGH])
        results = filters.filter_by_tag(results, "Work")

        assert len(results) == 1
        assert results[0].id == 1

    def test_combine_filters_with_keyword(self):
        """Test combine_filters with keyword search."""
        tasks = [
            Task(id=1, title="Meeting notes", status="incomplete"),
            Task(id=2, title="Project meeting", status="complete"),
            Task(id=3, title="Other task", status="incomplete"),
        ]

        results = filters.combine_filters(tasks, keyword="meeting", status="incomplete")
        assert len(results) == 1
        assert results[0].id == 1

    def test_combine_filters_with_status(self):
        """Test combine_filters with status filter."""
        tasks = [
            Task(id=1, title="Task 1", status="complete"),
            Task(id=2, title="Task 2", status="incomplete"),
        ]

        results = filters.combine_filters(tasks, status="complete")
        assert len(results) == 1
        assert results[0].id == 1

    def test_combine_filters_with_priorities(self):
        """Test combine_filters with priority filter."""
        tasks = [
            Task(id=1, title="High", priority=Priority.HIGH),
            Task(id=2, title="Medium", priority=Priority.MEDIUM),
            Task(id=3, title="Low", priority=Priority.LOW),
        ]

        results = filters.combine_filters(
            tasks, priorities=[Priority.HIGH, Priority.LOW]
        )
        assert len(results) == 2
        assert results[0].id == 1
        assert results[1].id == 3

    def test_combine_filters_with_tag(self):
        """Test combine_filters with tag filter."""
        tasks = [
            Task(id=1, title="Task 1", tags=["Work"]),
            Task(id=2, title="Task 2", tags=["Home"]),
        ]

        results = filters.combine_filters(tasks, tag="Work")
        assert len(results) == 1
        assert results[0].id == 1

    def test_combine_filters_with_date_range(self):
        """Test combine_filters with date range."""
        start_date = datetime(2025, 12, 1)
        end_date = datetime(2025, 12, 31)

        tasks = [
            Task(id=1, title="Dec task", due_date=datetime(2025, 12, 15)),
            Task(id=2, title="Jan task", due_date=datetime(2026, 1, 15)),
        ]

        results = filters.combine_filters(
            tasks, start_date=start_date, end_date=end_date
        )
        assert len(results) == 1
        assert results[0].id == 1

    def test_combine_filters_overdue_only(self):
        """Test combine_filters with overdue_only flag."""
        tasks = [
            Task(
                id=1,
                title="Overdue",
                due_date=datetime(2020, 1, 1),
                status="incomplete",
            ),
            Task(id=2, title="Future", due_date=datetime(2099, 12, 31)),
        ]

        results = filters.combine_filters(tasks, overdue_only=True)
        assert len(results) == 1
        assert results[0].id == 1

    def test_combine_filters_due_today_only(self):
        """Test combine_filters with due_today_only flag."""
        today = datetime.now().replace(hour=14, minute=0, second=0, microsecond=0)
        tomorrow = today + timedelta(days=1)

        tasks = [
            Task(id=1, title="Today", due_date=today),
            Task(id=2, title="Tomorrow", due_date=tomorrow),
        ]

        results = filters.combine_filters(tasks, due_today_only=True)
        assert len(results) == 1
        assert results[0].id == 1

    def test_combine_filters_due_this_week_only(self):
        """Test combine_filters with due_this_week_only flag."""
        today = datetime.now()
        in_week = today + timedelta(days=3)
        next_week = today + timedelta(days=10)

        tasks = [
            Task(id=1, title="This week", due_date=in_week),
            Task(id=2, title="Next week", due_date=next_week),
        ]

        results = filters.combine_filters(tasks, due_this_week_only=True)
        assert len(results) == 1
        assert results[0].id == 1

    def test_combine_filters_all_criteria(self):
        """Test combine_filters with multiple criteria combined."""
        tasks = [
            Task(
                id=1,
                title="Perfect match",
                description="keyword here",
                status="incomplete",
                priority=Priority.HIGH,
                tags=["Work"],
                due_date=datetime(2025, 12, 15),
            ),
            Task(
                id=2,
                title="Different task",
                description="No match",
                status="incomplete",
                priority=Priority.HIGH,
                tags=["Work"],
                due_date=datetime(2025, 12, 15),
            ),
        ]

        results = filters.combine_filters(
            tasks,
            keyword="keyword",
            status="incomplete",
            priorities=[Priority.HIGH],
            tag="Work",
            start_date=datetime(2025, 12, 1),
            end_date=datetime(2025, 12, 31),
        )
        assert len(results) == 1
        assert results[0].id == 1

    def test_combine_filters_no_filters(self):
        """Test combine_filters returns all tasks when no filters applied."""
        tasks = [
            Task(id=1, title="Task 1"),
            Task(id=2, title="Task 2"),
            Task(id=3, title="Task 3"),
        ]

        results = filters.combine_filters(tasks)
        assert len(results) == 3


class TestSortByDueDate:
    """Test sorting by due date."""

    def test_sort_by_due_date_ascending(self):
        """Test sorting tasks by due date (earliest first)."""
        tasks = [
            Task(id=1, title="Later", due_date=datetime(2025, 12, 31)),
            Task(id=2, title="Earlier", due_date=datetime(2025, 12, 1)),
            Task(id=3, title="Middle", due_date=datetime(2025, 12, 15)),
        ]

        sorted_tasks = filters.sort_by_due_date(tasks)
        assert sorted_tasks[0].id == 2  # December 1
        assert sorted_tasks[1].id == 3  # December 15
        assert sorted_tasks[2].id == 1  # December 31

    def test_sort_by_due_date_nulls_last(self):
        """Test that tasks without due dates appear last."""
        tasks = [
            Task(id=1, title="No date"),
            Task(id=2, title="Has date", due_date=datetime(2025, 12, 15)),
            Task(id=3, title="Also no date"),
        ]

        sorted_tasks = filters.sort_by_due_date(tasks)
        assert sorted_tasks[0].id == 2  # Has due date first
        assert sorted_tasks[1].id in [1, 3]  # No dates last
        assert sorted_tasks[2].id in [1, 3]


class TestSortByPriority:
    """Test sorting by priority."""

    def test_sort_by_priority_descending(self):
        """Test sorting by priority (HIGH → MEDIUM → LOW)."""
        tasks = [
            Task(id=1, title="Low", priority=Priority.LOW),
            Task(id=2, title="High", priority=Priority.HIGH),
            Task(id=3, title="Medium", priority=Priority.MEDIUM),
            Task(id=4, title="High2", priority=Priority.HIGH),
        ]

        sorted_tasks = filters.sort_by_priority(tasks)
        assert sorted_tasks[0].priority == Priority.HIGH
        assert sorted_tasks[1].priority == Priority.HIGH
        assert sorted_tasks[2].priority == Priority.MEDIUM
        assert sorted_tasks[3].priority == Priority.LOW


class TestSortByTitle:
    """Test sorting by title."""

    def test_sort_by_title_case_insensitive(self):
        """Test sorting alphabetically (case-insensitive)."""
        tasks = [
            Task(id=1, title="Zebra"),
            Task(id=2, title="apple"),
            Task(id=3, title="Banana"),
        ]

        sorted_tasks = filters.sort_by_title(tasks)
        assert sorted_tasks[0].title == "apple"
        assert sorted_tasks[1].title == "Banana"
        assert sorted_tasks[2].title == "Zebra"


class TestSortByCreatedDate:
    """Test sorting by created date."""

    def test_sort_by_created_date(self):
        """Test sorting by created date (oldest first)."""
        old_date = datetime(2025, 1, 1)
        middle_date = datetime(2025, 6, 1)
        new_date = datetime(2025, 12, 1)

        tasks = [
            Task(id=1, title="Newest", created_date=new_date),
            Task(id=2, title="Oldest", created_date=old_date),
            Task(id=3, title="Middle", created_date=middle_date),
        ]

        sorted_tasks = filters.sort_by_created_date(tasks)
        assert sorted_tasks[0].id == 2  # Oldest
        assert sorted_tasks[1].id == 3  # Middle
        assert sorted_tasks[2].id == 1  # Newest


class TestSortStability:
    """Test sort stability."""

    def test_sort_stability(self):
        """Test that sorting preserves relative order for equal values."""
        tasks = [
            Task(id=1, title="Task A", priority=Priority.HIGH),
            Task(id=2, title="Task B", priority=Priority.HIGH),
            Task(id=3, title="Task C", priority=Priority.HIGH),
        ]

        sorted_tasks = filters.sort_by_priority(tasks)
        # Should maintain original order for same priority
        assert sorted_tasks[0].id == 1
        assert sorted_tasks[1].id == 2
        assert sorted_tasks[2].id == 3


class TestGetFilterSummary:
    """Test filter summary generation."""

    def test_get_filter_summary_no_filters(self):
        """Test summary when no filters are applied."""
        summary = filters.get_filter_summary()
        assert summary == "No filters applied"

    def test_get_filter_summary_keyword(self):
        """Test summary with keyword filter."""
        summary = filters.get_filter_summary(keyword="meeting")
        assert 'Keyword: "meeting"' in summary

    def test_get_filter_summary_status(self):
        """Test summary with status filter."""
        summary = filters.get_filter_summary(status="incomplete")
        assert "Status: incomplete" in summary

    def test_get_filter_summary_priorities(self):
        """Test summary with priority filter."""
        summary = filters.get_filter_summary(
            priorities=[Priority.HIGH, Priority.MEDIUM]
        )
        assert "Priority: HIGH, MEDIUM" in summary

    def test_get_filter_summary_tag(self):
        """Test summary with tag filter."""
        summary = filters.get_filter_summary(tag="Work")
        assert "Tag: Work" in summary

    def test_get_filter_summary_date_range(self):
        """Test summary with date range filter."""
        start = datetime(2025, 12, 1)
        end = datetime(2025, 12, 31)
        summary = filters.get_filter_summary(start_date=start, end_date=end)
        assert "Due: 2025-12-01 to 2025-12-31" in summary

    def test_get_filter_summary_overdue_only(self):
        """Test summary with overdue only flag."""
        summary = filters.get_filter_summary(overdue_only=True)
        assert "Overdue only" in summary

    def test_get_filter_summary_due_today_only(self):
        """Test summary with due today only flag."""
        summary = filters.get_filter_summary(due_today_only=True)
        assert "Due today only" in summary

    def test_get_filter_summary_due_this_week_only(self):
        """Test summary with due this week only flag."""
        summary = filters.get_filter_summary(due_this_week_only=True)
        assert "Due this week only" in summary

    def test_get_filter_summary_multiple_filters(self):
        """Test summary with multiple filters."""
        summary = filters.get_filter_summary(
            keyword="test", status="incomplete", priorities=[Priority.HIGH], tag="Work"
        )
        assert "Filters:" in summary
        assert 'Keyword: "test"' in summary
        assert "Status: incomplete" in summary
        assert "Priority: HIGH" in summary
        assert "Tag: Work" in summary


class TestGetSortDescription:
    """Test sort description generation."""

    def test_get_sort_description_due_date(self):
        """Test description for due date sort."""
        desc = filters.get_sort_description("due_date")
        assert desc == "Due Date (earliest first)"

    def test_get_sort_description_priority(self):
        """Test description for priority sort."""
        desc = filters.get_sort_description("priority")
        assert desc == "Priority (HIGH → MEDIUM → LOW)"

    def test_get_sort_description_title(self):
        """Test description for title sort."""
        desc = filters.get_sort_description("title")
        assert desc == "Title (A-Z)"

    def test_get_sort_description_created_date(self):
        """Test description for created date sort."""
        desc = filters.get_sort_description("created_date")
        assert desc == "Created Date (oldest first)"

    def test_get_sort_description_unknown(self):
        """Test description for unknown sort type."""
        desc = filters.get_sort_description("invalid_sort")
        assert desc == "Unknown"
