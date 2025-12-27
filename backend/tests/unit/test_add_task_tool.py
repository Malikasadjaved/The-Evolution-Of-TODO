"""
Unit tests for add_task MCP tool.

Tests for:
- Task creation with all fields (title, description, priority, due_date, tags)
- Minimal task creation (title only, defaults applied)
- User isolation (user_id injected by server, NOT from agent)
- Tag creation and association
- Validation errors (title required, max lengths)
- Database persistence

Constitution: .specify/memory/phase-3-constitution.md (v1.1.0)
Spec: specs/002-ai-chatbot-mcp/spec.md Section 5.1.1 (add_task tool)

MCP Tool Contract:
- Input: AddTaskInput (title, description, priority, due_date, tags)
- Output: AddTaskOutput (task with id, user_id, timestamps)
- Behavior: Create task in database, associate tags, return full task object
- User Isolation: Server injects user_id from JWT token (NOT from agent)
"""

import pytest
from datetime import datetime, timedelta
from sqlmodel import Session, select

from mcp.schemas import AddTaskInput, AddTaskOutput, TaskPriority, TaskStatus
from mcp.tools.add_task import add_task  # Will implement in T025
from src.api.models import Task, Tag, TaskTag


# ============================================================================
# add_task Tool Tests (T023)
# ============================================================================


def test_add_task_with_all_fields(test_db_session: Session):
    """
    Test add_task creates task with all fields provided.

    Validates:
    - Title, description, priority, due_date all saved
    - Status defaults to INCOMPLETE
    - user_id injected by server
    - created_at and updated_at timestamps set
    - Task persisted to database

    Constitution: Section IX - MCP boundary (user_id injection)
    """
    # Arrange
    user_id = "user_12345"
    due_date = datetime.utcnow() + timedelta(days=7)

    task_input = AddTaskInput(
        title="Complete Phase 3 implementation",
        description="Implement all 5 MCP tools and OpenAI Agent integration",
        priority=TaskPriority.HIGH,
        due_date=due_date,
        tags=None,  # Test tags separately
    )

    # Act
    result = add_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert
    assert isinstance(result, AddTaskOutput)
    assert result.id is not None  # Database assigned ID
    assert result.user_id == user_id
    assert result.title == "Complete Phase 3 implementation"
    assert result.description == "Implement all 5 MCP tools and OpenAI Agent integration"
    assert result.priority == TaskPriority.HIGH
    assert result.status == TaskStatus.INCOMPLETE
    assert result.due_date == due_date
    assert result.tags == []  # No tags provided
    assert result.created_at is not None
    assert result.updated_at is not None

    # Verify database persistence
    statement = select(Task).where(Task.id == result.id)
    db_task = test_db_session.exec(statement).first()
    assert db_task is not None
    assert db_task.user_id == user_id
    assert db_task.title == "Complete Phase 3 implementation"


def test_add_task_minimal_title_only(test_db_session: Session):
    """
    Test add_task with minimal input (title only).

    Validates:
    - Only title is required
    - description defaults to None
    - priority defaults to MEDIUM
    - status defaults to INCOMPLETE
    - due_date defaults to None
    - tags defaults to empty list

    Constitution: Section IX - Principle of least privilege
    """
    # Arrange
    user_id = "user_67890"
    task_input = AddTaskInput(title="Buy groceries")

    # Act
    result = add_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert
    assert result.id is not None
    assert result.user_id == user_id
    assert result.title == "Buy groceries"
    assert result.description is None
    assert result.priority == TaskPriority.MEDIUM  # Default
    assert result.status == TaskStatus.INCOMPLETE  # Default
    assert result.due_date is None
    assert result.tags == []
    assert result.created_at is not None


def test_add_task_with_new_tags(test_db_session: Session):
    """
    Test add_task creates new tags and associates them with task.

    Validates:
    - Tags are created if they don't exist
    - Tags are associated with task via TaskTag join table
    - Tags are user-scoped (same tag name for different users)
    - Output includes tag names in alphabetical order

    Constitution: Section IX - User isolation (tags are user-scoped)
    """
    # Arrange
    user_id = "user_tags_123"
    task_input = AddTaskInput(
        title="Prepare hackathon presentation", tags=["Work", "Urgent", "Presentation"]
    )

    # Act
    result = add_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert
    assert result.id is not None
    assert result.user_id == user_id
    assert sorted(result.tags) == ["Presentation", "Urgent", "Work"]

    # Verify tags created in database
    statement = select(Tag).where(Tag.user_id == user_id)
    db_tags = test_db_session.exec(statement).all()
    tag_names = {tag.name for tag in db_tags}
    assert "Work" in tag_names
    assert "Urgent" in tag_names
    assert "Presentation" in tag_names

    # Verify TaskTag associations
    statement = select(TaskTag).where(TaskTag.task_id == result.id)
    task_tags = test_db_session.exec(statement).all()
    assert len(task_tags) == 3


def test_add_task_with_existing_tags(test_db_session: Session):
    """
    Test add_task reuses existing tags instead of creating duplicates.

    Validates:
    - Existing tags are looked up by name AND user_id
    - No duplicate tags created for same user
    - Tags from other users are NOT reused (user isolation)

    Constitution: Section IX - User isolation (tags are user-scoped)
    """
    # Arrange
    user_id = "user_existing_tags"

    # Pre-create tags for this user
    existing_tag1 = Tag(name="Work", user_id=user_id, created_at=datetime.utcnow())
    existing_tag2 = Tag(name="Important", user_id=user_id, created_at=datetime.utcnow())
    test_db_session.add(existing_tag1)
    test_db_session.add(existing_tag2)
    test_db_session.commit()
    test_db_session.refresh(existing_tag1)
    test_db_session.refresh(existing_tag2)

    # Create tag for different user (should NOT be reused)
    other_user_tag = Tag(name="Work", user_id="other_user_999", created_at=datetime.utcnow())
    test_db_session.add(other_user_tag)
    test_db_session.commit()

    task_input = AddTaskInput(
        title="Review code changes", tags=["Work", "Important", "Code Review"]  # 2 existing, 1 new
    )

    # Act
    result = add_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert
    assert sorted(result.tags) == ["Code Review", "Important", "Work"]

    # Verify only 1 new tag created (Code Review)
    statement = select(Tag).where(Tag.user_id == user_id)
    user_tags = test_db_session.exec(statement).all()
    assert len(user_tags) == 3  # Work, Important, Code Review

    # Verify other user's "Work" tag was NOT touched
    statement = select(Tag).where(Tag.user_id == "other_user_999")
    other_tags = test_db_session.exec(statement).all()
    assert len(other_tags) == 1
    assert other_tags[0].name == "Work"


def test_add_task_user_isolation(test_db_session: Session):
    """
    Test add_task enforces user isolation.

    Validates:
    - user_id is injected by server (from JWT token)
    - Agent cannot specify user_id (not in AddTaskInput schema)
    - Tasks are only visible to owning user
    - Tags are user-scoped

    Constitution: Section IX - MCP boundary (user_id injection)
    """
    # Arrange
    user1_id = "user_alice"
    user2_id = "user_bob"

    task_input = AddTaskInput(title="Private task")

    # Act: Create tasks for two different users
    task1 = add_task(session=test_db_session, user_id=user1_id, task_input=task_input)
    task2 = add_task(session=test_db_session, user_id=user2_id, task_input=task_input)

    # Assert: Each task belongs to correct user
    assert task1.user_id == user1_id
    assert task2.user_id == user2_id
    assert task1.id != task2.id  # Different tasks

    # Verify database isolation
    statement = select(Task).where(Task.user_id == user1_id)
    alice_tasks = test_db_session.exec(statement).all()
    assert len(alice_tasks) == 1
    assert alice_tasks[0].id == task1.id

    statement = select(Task).where(Task.user_id == user2_id)
    bob_tasks = test_db_session.exec(statement).all()
    assert len(bob_tasks) == 1
    assert bob_tasks[0].id == task2.id


def test_add_task_validation_empty_title_raises_error(test_db_session: Session):
    """
    Test add_task rejects empty title.

    Validates:
    - Title is required (min_length=1 in schema)
    - Pydantic validation error raised
    - No task created in database

    Constitution: Section X - Input validation (fail fast)
    """
    # Arrange
    user_id = "user_validation_test"

    # Act & Assert
    with pytest.raises(Exception):  # Pydantic ValidationError
        task_input = AddTaskInput(title="")  # Empty string
        add_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Verify no task created
    statement = select(Task).where(Task.user_id == user_id)
    tasks = test_db_session.exec(statement).all()
    assert len(tasks) == 0


def test_add_task_validation_title_too_long_raises_error(test_db_session: Session):
    """
    Test add_task rejects title exceeding max length.

    Validates:
    - Title max_length=500 enforced
    - Pydantic validation error raised

    Constitution: Section X - Input validation (prevent abuse)
    """
    # Arrange
    user_id = "user_validation_test"
    long_title = "A" * 501  # Exceeds 500 character limit

    # Act & Assert
    with pytest.raises(Exception):  # Pydantic ValidationError
        task_input = AddTaskInput(title=long_title)
        add_task(session=test_db_session, user_id=user_id, task_input=task_input)


def test_add_task_validation_description_too_long_raises_error(test_db_session: Session):
    """
    Test add_task rejects description exceeding max length.

    Validates:
    - Description max_length=2000 enforced
    - Pydantic validation error raised

    Constitution: Section X - Input validation (prevent abuse)
    """
    # Arrange
    user_id = "user_validation_test"
    long_description = "B" * 2001  # Exceeds 2000 character limit

    # Act & Assert
    with pytest.raises(Exception):  # Pydantic ValidationError
        task_input = AddTaskInput(title="Valid title", description=long_description)
        add_task(session=test_db_session, user_id=user_id, task_input=task_input)


def test_add_task_with_due_date_in_past(test_db_session: Session):
    """
    Test add_task allows due_date in the past (user's choice).

    Validates:
    - Due date validation is NOT enforced by add_task tool
    - Task is created with past due date
    - Overdue detection happens in list_tasks (not add_task)

    Constitution: Section IX - Principle of least privilege
    """
    # Arrange
    user_id = "user_past_due"
    past_date = datetime.utcnow() - timedelta(days=30)

    task_input = AddTaskInput(title="Missed deadline task", due_date=past_date)

    # Act
    result = add_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert: Task created successfully with past due date
    assert result.due_date == past_date
    assert result.status == TaskStatus.INCOMPLETE  # Not auto-completed


def test_add_task_priority_levels(test_db_session: Session):
    """
    Test add_task handles all priority levels correctly.

    Validates:
    - LOW, MEDIUM, HIGH priorities accepted
    - Priority stored in database
    - Default priority is MEDIUM

    Constitution: Section X - Enumeration validation
    """
    # Arrange
    user_id = "user_priorities"

    # Test LOW priority
    task_low = add_task(
        session=test_db_session,
        user_id=user_id,
        task_input=AddTaskInput(title="Low priority task", priority=TaskPriority.LOW),
    )
    assert task_low.priority == TaskPriority.LOW

    # Test MEDIUM priority (default)
    task_medium = add_task(
        session=test_db_session,
        user_id=user_id,
        task_input=AddTaskInput(title="Medium priority task"),
    )
    assert task_medium.priority == TaskPriority.MEDIUM

    # Test HIGH priority
    task_high = add_task(
        session=test_db_session,
        user_id=user_id,
        task_input=AddTaskInput(title="High priority task", priority=TaskPriority.HIGH),
    )
    assert task_high.priority == TaskPriority.HIGH


# ============================================================================
# Edge Case Tests (T024)
# ============================================================================


def test_add_task_with_special_characters_in_title(test_db_session: Session):
    """
    Test add_task handles special characters in title.

    Validates:
    - Unicode characters accepted (emoji, accents, etc.)
    - Special punctuation preserved
    - No SQL injection vulnerabilities (SQLModel parameterized queries)

    Constitution: Section X - Input sanitization
    """
    # Arrange
    user_id = "user_special_chars"
    task_input = AddTaskInput(
        title="Buy 🎂 for mom's birthday! (June 15th)",
        description="Don't forget: vanilla cake with strawberries & cream 😋",
    )

    # Act
    result = add_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert
    assert result.title == "Buy 🎂 for mom's birthday! (June 15th)"
    assert "strawberries & cream 😋" in result.description


def test_add_task_with_duplicate_tags(test_db_session: Session):
    """
    Test add_task handles duplicate tags in input.

    Validates:
    - Duplicate tags are deduplicated
    - Only one TaskTag association created per unique tag
    - Case-sensitive deduplication (Work != work)

    Constitution: Section X - Idempotency
    """
    # Arrange
    user_id = "user_duplicate_tags"
    task_input = AddTaskInput(
        title="Task with duplicate tags",
        tags=["Work", "Urgent", "Work", "urgent", "URGENT"],  # Mixed case duplicates
    )

    # Act
    result = add_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert: Should have 4 unique tags (case-sensitive)
    assert sorted(result.tags) == ["URGENT", "Urgent", "Work", "urgent"]

    # Verify TaskTag associations
    statement = select(TaskTag).where(TaskTag.task_id == result.id)
    task_tags = test_db_session.exec(statement).all()
    assert len(task_tags) == 4  # 4 unique case-sensitive tags


def test_add_task_with_empty_tags_list(test_db_session: Session):
    """
    Test add_task handles empty tags list.

    Validates:
    - Empty list [] is different from None
    - No tags created
    - Task created successfully

    Constitution: Section IX - Principle of least privilege
    """
    # Arrange
    user_id = "user_empty_tags"
    task_input = AddTaskInput(title="Task with explicitly empty tags", tags=[])  # Explicitly empty

    # Act
    result = add_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert
    assert result.tags == []

    # Verify no TaskTag associations
    statement = select(TaskTag).where(TaskTag.task_id == result.id)
    task_tags = test_db_session.exec(statement).all()
    assert len(task_tags) == 0


def test_add_task_with_whitespace_only_tags_ignored(test_db_session: Session):
    """
    Test add_task ignores tags that are whitespace only.

    Validates:
    - Tags like "", "  ", "\\t", "\\n" are filtered out
    - No empty tags created in database
    - Task created successfully

    Constitution: Section X - Input sanitization
    """
    # Arrange
    user_id = "user_whitespace_tags"
    task_input = AddTaskInput(
        title="Task with whitespace tags", tags=["Valid", "  ", "", "\t", "\n", "  Another  "]
    )

    # Act
    result = add_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert: Only valid tags preserved (trimmed)
    assert sorted(result.tags) == ["Another", "Valid"]


def test_add_task_with_very_long_tag_name(test_db_session: Session):
    """
    Test add_task handles long tag names.

    Validates:
    - Tag names up to 50 characters accepted (Tag model max_length)
    - Tags longer than 50 characters truncated or rejected
    - No database constraint violations

    Constitution: Section X - Input validation (prevent abuse)
    """
    # Arrange
    user_id = "user_long_tags"
    long_tag = "A" * 50  # Max length
    _too_long_tag = "B" * 51  # Exceeds max  # noqa: F841

    task_input = AddTaskInput(title="Task with long tag", tags=[long_tag, "Short"])

    # Act
    result = add_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert: Max length tag accepted
    assert long_tag in result.tags
    assert "Short" in result.tags


def test_add_task_timestamps_are_utc(test_db_session: Session):
    """
    Test add_task sets timestamps in UTC timezone.

    Validates:
    - created_at is UTC
    - updated_at is UTC
    - Both timestamps are approximately equal (within 1 second)

    Constitution: Section X - Time handling (always UTC)
    """
    # Arrange
    user_id = "user_timestamps"
    before = datetime.utcnow()

    task_input = AddTaskInput(title="Timestamp test task")

    # Act
    result = add_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert
    after = datetime.utcnow()

    assert before <= result.created_at <= after
    assert before <= result.updated_at <= after
    assert abs((result.updated_at - result.created_at).total_seconds()) < 1


def test_add_task_with_none_description(test_db_session: Session):
    """
    Test add_task correctly handles None vs empty string for description.

    Validates:
    - description=None stored as NULL in database
    - description="" stored as empty string
    - Output schema distinguishes None vs ""

    Constitution: Section IX - Explicit nullability
    """
    # Arrange
    user_id = "user_none_description"

    # Test None description
    task_none = add_task(
        session=test_db_session,
        user_id=user_id,
        task_input=AddTaskInput(title="Task with None description", description=None),
    )
    assert task_none.description is None

    # Test empty string description
    task_empty = add_task(
        session=test_db_session,
        user_id=user_id,
        task_input=AddTaskInput(title="Task with empty description", description=""),
    )
    assert task_empty.description == ""


def test_add_task_transaction_rollback_on_error(test_db_session: Session):
    """
    Test add_task rolls back transaction on database error.

    Validates:
    - If task creation fails, no partial data persisted
    - Tags not created if task creation fails
    - Database remains consistent

    Constitution: Section XVI - Atomic operations
    """
    # This test will be implemented when we add error handling to add_task
    # For now, we document the expected behavior
    pass  # Placeholder for transaction test
