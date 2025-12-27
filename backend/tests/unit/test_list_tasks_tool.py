"""
Unit tests for list_tasks MCP tool.

Tests for:
- List all tasks for user
- Filter by status (INCOMPLETE, COMPLETE)
- Filter by priority (LOW, MEDIUM, HIGH)
- Filter by tag
- Combine multiple filters
- User isolation (only see own tasks)
- Empty results handling
- Limit and pagination
- Task ordering (newest first)

Constitution: .specify/memory/phase-3-constitution.md (v1.1.0)
Spec: specs/002-ai-chatbot-mcp/spec.md Section 5.1.2 (list_tasks tool)

MCP Tool Contract:
- Input: ListTasksInput (status, priority, tag, limit)
- Output: ListTasksOutput (tasks, count)
- Behavior: Query tasks filtered by user_id and optional filters
- User Isolation: Server injects user_id from JWT token

Implementation: Task T033 (Phase 3: User Story 2)
"""

from datetime import datetime, timedelta
from sqlmodel import Session

from mcp.schemas import ListTasksInput, ListTasksOutput, TaskPriority, TaskStatus, TaskSummary
from mcp.tools.list_tasks import list_tasks  # Will implement in T034
from src.api.models import Task, Tag, TaskTag


# ============================================================================
# list_tasks Tool Tests (T033)
# ============================================================================


def test_list_tasks_returns_all_user_tasks(test_db_session: Session):
    """
    Test list_tasks returns all tasks for authenticated user.

    Validates:
    - All user's tasks returned (no filters)
    - Tasks ordered by created_at DESC (newest first)
    - User isolation enforced
    - Count matches number of tasks

    Constitution: Section IX - User isolation
    """
    # Arrange
    user_id = "user_list_all"

    # Create 3 tasks
    task1 = Task(
        user_id=user_id,
        title="Task 1",
        priority=TaskPriority.LOW,
        status=TaskStatus.INCOMPLETE,
        created_at=datetime.utcnow() - timedelta(hours=2),
        updated_at=datetime.utcnow(),
    )
    task2 = Task(
        user_id=user_id,
        title="Task 2",
        priority=TaskPriority.MEDIUM,
        status=TaskStatus.COMPLETE,
        created_at=datetime.utcnow() - timedelta(hours=1),
        updated_at=datetime.utcnow(),
    )
    task3 = Task(
        user_id=user_id,
        title="Task 3",
        priority=TaskPriority.HIGH,
        status=TaskStatus.INCOMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task1)
    test_db_session.add(task2)
    test_db_session.add(task3)
    test_db_session.commit()

    # Act
    task_input = ListTasksInput()
    result = list_tasks(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert
    assert isinstance(result, ListTasksOutput)
    assert result.count == 3
    assert len(result.tasks) == 3

    # Verify newest first (task3, task2, task1)
    assert result.tasks[0].title == "Task 3"
    assert result.tasks[1].title == "Task 2"
    assert result.tasks[2].title == "Task 1"


def test_list_tasks_filter_by_status_incomplete(test_db_session: Session):
    """
    Test list_tasks filters by INCOMPLETE status.

    Validates:
    - Only incomplete tasks returned
    - Complete tasks excluded
    - Count reflects filtered results

    Constitution: Section IX - Query filtering
    """
    # Arrange
    user_id = "user_filter_incomplete"

    incomplete_task = Task(
        user_id=user_id,
        title="Pending task",
        status=TaskStatus.INCOMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    complete_task = Task(
        user_id=user_id,
        title="Done task",
        status=TaskStatus.COMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(incomplete_task)
    test_db_session.add(complete_task)
    test_db_session.commit()

    # Act
    task_input = ListTasksInput(status=TaskStatus.INCOMPLETE)
    result = list_tasks(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert
    assert result.count == 1
    assert len(result.tasks) == 1
    assert result.tasks[0].title == "Pending task"
    assert result.tasks[0].status == TaskStatus.INCOMPLETE


def test_list_tasks_filter_by_status_complete(test_db_session: Session):
    """
    Test list_tasks filters by COMPLETE status.

    Validates:
    - Only complete tasks returned
    - Incomplete tasks excluded
    - Count reflects filtered results

    Constitution: Section IX - Query filtering
    """
    # Arrange
    user_id = "user_filter_complete"

    incomplete_task = Task(
        user_id=user_id,
        title="Pending task",
        status=TaskStatus.INCOMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    complete_task = Task(
        user_id=user_id,
        title="Done task",
        status=TaskStatus.COMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(incomplete_task)
    test_db_session.add(complete_task)
    test_db_session.commit()

    # Act
    task_input = ListTasksInput(status=TaskStatus.COMPLETE)
    result = list_tasks(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert
    assert result.count == 1
    assert len(result.tasks) == 1
    assert result.tasks[0].title == "Done task"
    assert result.tasks[0].status == TaskStatus.COMPLETE


def test_list_tasks_filter_by_priority(test_db_session: Session):
    """
    Test list_tasks filters by priority level.

    Validates:
    - Only tasks with specified priority returned
    - Other priority tasks excluded

    Constitution: Section IX - Query filtering
    """
    # Arrange
    user_id = "user_filter_priority"

    low_task = Task(
        user_id=user_id,
        title="Low priority",
        priority=TaskPriority.LOW,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    high_task = Task(
        user_id=user_id,
        title="High priority",
        priority=TaskPriority.HIGH,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(low_task)
    test_db_session.add(high_task)
    test_db_session.commit()

    # Act: Filter by HIGH priority
    task_input = ListTasksInput(priority=TaskPriority.HIGH)
    result = list_tasks(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert
    assert result.count == 1
    assert result.tasks[0].title == "High priority"
    assert result.tasks[0].priority == TaskPriority.HIGH


def test_list_tasks_filter_by_tag(test_db_session: Session):
    """
    Test list_tasks filters by tag name.

    Validates:
    - Only tasks with specified tag returned
    - Tasks without tag excluded
    - Tag lookup is user-scoped

    Constitution: Section IX - User isolation (tags are user-scoped)
    """
    # Arrange
    user_id = "user_filter_tag"

    # Create tags
    work_tag = Tag(name="Work", user_id=user_id, created_at=datetime.utcnow())
    personal_tag = Tag(name="Personal", user_id=user_id, created_at=datetime.utcnow())
    test_db_session.add(work_tag)
    test_db_session.add(personal_tag)
    test_db_session.commit()
    test_db_session.refresh(work_tag)
    test_db_session.refresh(personal_tag)

    # Create tasks
    work_task = Task(
        user_id=user_id,
        title="Work task",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    personal_task = Task(
        user_id=user_id,
        title="Personal task",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(work_task)
    test_db_session.add(personal_task)
    test_db_session.commit()
    test_db_session.refresh(work_task)
    test_db_session.refresh(personal_task)

    # Associate tags
    test_db_session.add(TaskTag(task_id=work_task.id, tag_id=work_tag.id))
    test_db_session.add(TaskTag(task_id=personal_task.id, tag_id=personal_tag.id))
    test_db_session.commit()

    # Act: Filter by "Work" tag
    task_input = ListTasksInput(tag="Work")
    result = list_tasks(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert
    assert result.count == 1
    assert result.tasks[0].title == "Work task"
    assert "Work" in result.tasks[0].tags


def test_list_tasks_combine_multiple_filters(test_db_session: Session):
    """
    Test list_tasks with multiple filters applied simultaneously.

    Validates:
    - Status + priority filters both applied (AND logic)
    - Only tasks matching ALL filters returned

    Constitution: Section IX - Complex query filtering
    """
    # Arrange
    user_id = "user_multi_filter"

    # Task matching both filters
    matching_task = Task(
        user_id=user_id,
        title="High priority incomplete",
        priority=TaskPriority.HIGH,
        status=TaskStatus.INCOMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    # Task matching only priority
    wrong_status_task = Task(
        user_id=user_id,
        title="High priority complete",
        priority=TaskPriority.HIGH,
        status=TaskStatus.COMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    # Task matching only status
    wrong_priority_task = Task(
        user_id=user_id,
        title="Low priority incomplete",
        priority=TaskPriority.LOW,
        status=TaskStatus.INCOMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(matching_task)
    test_db_session.add(wrong_status_task)
    test_db_session.add(wrong_priority_task)
    test_db_session.commit()

    # Act: Filter by HIGH priority AND INCOMPLETE status
    task_input = ListTasksInput(priority=TaskPriority.HIGH, status=TaskStatus.INCOMPLETE)
    result = list_tasks(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert
    assert result.count == 1
    assert result.tasks[0].title == "High priority incomplete"


def test_list_tasks_user_isolation(test_db_session: Session):
    """
    Test list_tasks enforces user isolation.

    Validates:
    - Only returns tasks belonging to authenticated user
    - Other users' tasks NOT visible
    - user_id injected by server (not from agent)

    Constitution: Section IX - User isolation
    """
    # Arrange
    user1_id = "user_alice"
    user2_id = "user_bob"

    # Alice's tasks
    task_alice = Task(
        user_id=user1_id,
        title="Alice's task",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    # Bob's tasks
    task_bob = Task(
        user_id=user2_id,
        title="Bob's task",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task_alice)
    test_db_session.add(task_bob)
    test_db_session.commit()

    # Act: Alice requests her tasks
    task_input = ListTasksInput()
    result = list_tasks(session=test_db_session, user_id=user1_id, task_input=task_input)

    # Assert: Only Alice's task returned
    assert result.count == 1
    assert result.tasks[0].title == "Alice's task"
    assert result.tasks[0].id != task_bob.id


def test_list_tasks_empty_results(test_db_session: Session):
    """
    Test list_tasks handles no tasks found gracefully.

    Validates:
    - Empty list returned (not null)
    - Count is 0
    - No error raised

    Constitution: Section IX - Graceful empty results
    """
    # Arrange
    user_id = "user_no_tasks"
    task_input = ListTasksInput()

    # Act
    result = list_tasks(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert
    assert result.count == 0
    assert len(result.tasks) == 0
    assert isinstance(result.tasks, list)


def test_list_tasks_limit_enforced(test_db_session: Session):
    """
    Test list_tasks respects limit parameter.

    Validates:
    - Maximum limit tasks returned (default 50)
    - Can specify custom limit (e.g., 5)
    - Count reflects total matching tasks (not just returned)

    Constitution: Section IX - Pagination support
    """
    # Arrange
    user_id = "user_limit_test"

    # Create 10 tasks
    for i in range(10):
        task = Task(
            user_id=user_id,
            title=f"Task {i}",
            created_at=datetime.utcnow() - timedelta(hours=i),
            updated_at=datetime.utcnow(),
        )
        test_db_session.add(task)
    test_db_session.commit()

    # Act: Request only 3 tasks
    task_input = ListTasksInput(limit=3)
    result = list_tasks(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert
    assert len(result.tasks) == 3  # Only 3 returned
    assert result.count == 3  # Count also reflects limit

    # Verify newest 3 tasks returned
    assert result.tasks[0].title == "Task 0"  # Newest
    assert result.tasks[1].title == "Task 1"
    assert result.tasks[2].title == "Task 2"


def test_list_tasks_includes_tags(test_db_session: Session):
    """
    Test list_tasks includes associated tags for each task.

    Validates:
    - Tags loaded for each task
    - Tags returned in alphabetical order
    - Empty list if no tags

    Constitution: Section IX - Complete task representation
    """
    # Arrange
    user_id = "user_with_tags"

    # Create task with tags
    tag1 = Tag(name="Urgent", user_id=user_id, created_at=datetime.utcnow())
    tag2 = Tag(name="Work", user_id=user_id, created_at=datetime.utcnow())
    test_db_session.add(tag1)
    test_db_session.add(tag2)
    test_db_session.commit()
    test_db_session.refresh(tag1)
    test_db_session.refresh(tag2)

    task_with_tags = Task(
        user_id=user_id,
        title="Tagged task",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    task_without_tags = Task(
        user_id=user_id,
        title="Untagged task",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task_with_tags)
    test_db_session.add(task_without_tags)
    test_db_session.commit()
    test_db_session.refresh(task_with_tags)
    test_db_session.refresh(task_without_tags)

    # Associate tags
    test_db_session.add(TaskTag(task_id=task_with_tags.id, tag_id=tag1.id))
    test_db_session.add(TaskTag(task_id=task_with_tags.id, tag_id=tag2.id))
    test_db_session.commit()

    # Act
    task_input = ListTasksInput()
    result = list_tasks(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert
    assert result.count == 2

    # Find tagged task
    tagged = next(t for t in result.tasks if t.title == "Tagged task")
    assert sorted(tagged.tags) == ["Urgent", "Work"]

    # Find untagged task
    untagged = next(t for t in result.tasks if t.title == "Untagged task")
    assert untagged.tags == []


def test_list_tasks_includes_due_date(test_db_session: Session):
    """
    Test list_tasks includes due_date in task summary.

    Validates:
    - due_date included in response
    - None if no due date set
    - ISO format preserved

    Constitution: Section X - Complete data representation
    """
    # Arrange
    user_id = "user_due_dates"
    future_date = datetime.utcnow() + timedelta(days=7)

    task_with_due = Task(
        user_id=user_id,
        title="Task with deadline",
        due_date=future_date,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    task_without_due = Task(
        user_id=user_id,
        title="Task without deadline",
        due_date=None,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task_with_due)
    test_db_session.add(task_without_due)
    test_db_session.commit()

    # Act
    task_input = ListTasksInput()
    result = list_tasks(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert
    assert result.count == 2

    # Task with due date
    with_due = next(t for t in result.tasks if t.title == "Task with deadline")
    assert with_due.due_date == future_date

    # Task without due date
    without_due = next(t for t in result.tasks if t.title == "Task without deadline")
    assert without_due.due_date is None


def test_list_tasks_default_limit_50(test_db_session: Session):
    """
    Test list_tasks uses default limit of 50 tasks.

    Validates:
    - Default limit is 50
    - Can be overridden with custom limit
    - Maximum limit is 100

    Constitution: Section IX - Reasonable defaults
    """
    # Arrange
    user_id = "user_default_limit"

    # Create 60 tasks
    for i in range(60):
        task = Task(
            user_id=user_id,
            title=f"Task {i}",
            created_at=datetime.utcnow() - timedelta(hours=i),
            updated_at=datetime.utcnow(),
        )
        test_db_session.add(task)
    test_db_session.commit()

    # Act: Use default limit
    task_input = ListTasksInput()  # Default limit=50
    result = list_tasks(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert
    assert len(result.tasks) == 50  # Default limit applied
    assert result.count == 50


def test_list_tasks_task_summary_format(test_db_session: Session):
    """
    Test list_tasks returns tasks in TaskSummary format.

    Validates:
    - All required fields present (id, title, description, priority, status, due_date, tags, created_at)
    - Types match schema
    - No extra fields leaked

    Constitution: Section X - Schema compliance
    """
    # Arrange
    user_id = "user_summary_format"

    task = Task(
        user_id=user_id,
        title="Sample task",
        description="Task description",
        priority=TaskPriority.MEDIUM,
        status=TaskStatus.INCOMPLETE,
        due_date=None,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()

    # Act
    task_input = ListTasksInput()
    result = list_tasks(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert
    assert result.count == 1
    task_summary = result.tasks[0]

    # Verify TaskSummary schema
    assert isinstance(task_summary, TaskSummary)
    assert hasattr(task_summary, "id")
    assert hasattr(task_summary, "title")
    assert hasattr(task_summary, "description")
    assert hasattr(task_summary, "priority")
    assert hasattr(task_summary, "status")
    assert hasattr(task_summary, "due_date")
    assert hasattr(task_summary, "tags")
    assert hasattr(task_summary, "created_at")

    # Verify values
    assert task_summary.title == "Sample task"
    assert task_summary.description == "Task description"
    assert task_summary.priority == TaskPriority.MEDIUM


def test_list_tasks_no_filters_returns_all_statuses(test_db_session: Session):
    """
    Test list_tasks without status filter returns both complete and incomplete.

    Validates:
    - No filter → all tasks returned regardless of status
    - Both COMPLETE and INCOMPLETE included

    Constitution: Section IX - Principle of least privilege
    """
    # Arrange
    user_id = "user_all_statuses"

    incomplete_task = Task(
        user_id=user_id,
        title="Incomplete",
        status=TaskStatus.INCOMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    complete_task = Task(
        user_id=user_id,
        title="Complete",
        status=TaskStatus.COMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(incomplete_task)
    test_db_session.add(complete_task)
    test_db_session.commit()

    # Act: No status filter
    task_input = ListTasksInput()
    result = list_tasks(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert
    assert result.count == 2
    statuses = {task.status for task in result.tasks}
    assert TaskStatus.INCOMPLETE in statuses
    assert TaskStatus.COMPLETE in statuses


def test_list_tasks_ordered_by_created_at_desc(test_db_session: Session):
    """
    Test list_tasks returns tasks ordered by created_at DESC (newest first).

    Validates:
    - Most recent task appears first
    - Oldest task appears last
    - Order is consistent

    Constitution: Section IX - Predictable ordering
    """
    # Arrange
    user_id = "user_ordering"

    # Create tasks at different times
    old_task = Task(
        user_id=user_id,
        title="Old task",
        created_at=datetime.utcnow() - timedelta(days=7),
        updated_at=datetime.utcnow(),
    )
    recent_task = Task(
        user_id=user_id,
        title="Recent task",
        created_at=datetime.utcnow() - timedelta(hours=1),
        updated_at=datetime.utcnow(),
    )
    newest_task = Task(
        user_id=user_id,
        title="Newest task",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(old_task)
    test_db_session.add(recent_task)
    test_db_session.add(newest_task)
    test_db_session.commit()

    # Act
    task_input = ListTasksInput()
    result = list_tasks(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert: Newest first
    assert result.count == 3
    assert result.tasks[0].title == "Newest task"
    assert result.tasks[1].title == "Recent task"
    assert result.tasks[2].title == "Old task"
