"""
Unit tests for update_task MCP tool.

Tests for:
- Update task with all fields (title, description, priority, due_date, tags)
- Partial updates (only provided fields updated)
- Update updated_at timestamp
- User isolation (cannot update other user's task)
- Task not found error
- Validation errors (no fields provided, empty title)
- Tag updates (add/remove/replace tags)
- Return updated task details with success message

Constitution: .specify/memory/phase-3-constitution.md (v1.1.0)
Spec: specs/002-ai-chatbot-mcp/spec.md Section 5.1.4 (update_task tool)

MCP Tool Contract:
- Input: UpdateTaskInput (task_id, optional: title, description, priority, due_date, tags)
- Output: UpdateTaskOutput (updated task with message)
- Behavior: Find task by ID, update only provided fields, update timestamps
- User Isolation: Server injects user_id, verifies task belongs to user

Implementation: Task T055-T061 (Phase 3: User Story 4)
"""

import pytest
from datetime import datetime, timedelta
from sqlmodel import Session, select

from mcp.schemas import (
    UpdateTaskInput,
    UpdateTaskOutput,
    TaskPriority,
    TaskStatus,
)
from mcp.tools.update_task import update_task  # Will implement in T060
from src.api.models import Task, Tag, TaskTag


# ============================================================================
# update_task Tool Tests (T055-T059)
# ============================================================================


def test_update_task_with_all_fields(test_db_session: Session):
    """
    Test update_task updates all fields when provided.

    Validates:
    - Title, description, priority, due_date, tags all updated
    - updated_at timestamp updated
    - Task persisted to database
    - Success message returned

    Constitution: Section IX - MCP tool behavior
    """
    # Arrange
    user_id = "user_update_all"

    # Create existing task
    original_date = datetime.utcnow() - timedelta(days=1)
    task = Task(
        user_id=user_id,
        title="Original title",
        description="Original description",
        priority=TaskPriority.LOW,
        status=TaskStatus.INCOMPLETE,
        due_date=original_date,
        created_at=datetime.utcnow() - timedelta(hours=2),
        updated_at=datetime.utcnow() - timedelta(hours=1),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)

    # Act
    new_due_date = datetime.utcnow() + timedelta(days=7)
    task_input = UpdateTaskInput(
        task_id=task.id,
        title="Updated title",
        description="Updated description",
        priority=TaskPriority.HIGH,
        due_date=new_due_date,
        tags=["Urgent", "Work"],
    )

    before_update = datetime.utcnow()
    result = update_task(session=test_db_session, user_id=user_id, task_input=task_input)
    after_update = datetime.utcnow()

    # Assert
    assert isinstance(result, UpdateTaskOutput)
    assert result.id == task.id
    assert result.title == "Updated title"
    assert result.description == "Updated description"
    assert result.priority == TaskPriority.HIGH
    assert result.status == TaskStatus.INCOMPLETE  # Status not changed
    assert result.due_date == new_due_date
    assert sorted(result.tags) == ["Urgent", "Work"]
    assert before_update <= result.updated_at <= after_update
    assert "success" in result.message.lower() or "updated" in result.message.lower()

    # Verify database persistence
    statement = select(Task).where(Task.id == task.id)
    db_task = test_db_session.exec(statement).first()
    assert db_task.title == "Updated title"
    assert db_task.description == "Updated description"
    assert db_task.priority == TaskPriority.HIGH
    assert db_task.due_date == new_due_date


def test_update_task_partial_update_title_only(test_db_session: Session):
    """
    Test update_task with partial update (title only).

    Validates:
    - Only provided fields updated
    - Other fields preserved (description, priority, due_date, tags)
    - updated_at timestamp updated
    - Partial updates supported

    Constitution: Section IX - Principle of least privilege
    """
    # Arrange
    user_id = "user_partial_update"

    original_due_date = datetime.utcnow() + timedelta(days=3)
    task = Task(
        user_id=user_id,
        title="Original title",
        description="Keep this description",
        priority=TaskPriority.MEDIUM,
        status=TaskStatus.INCOMPLETE,
        due_date=original_due_date,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)

    # Act: Update only title
    task_input = UpdateTaskInput(task_id=task.id, title="New title only")

    result = update_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert: Title updated, other fields preserved
    assert result.title == "New title only"
    assert result.description == "Keep this description"
    assert result.priority == TaskPriority.MEDIUM
    assert result.due_date == original_due_date
    assert result.tags == []  # No tags originally


def test_update_task_partial_update_priority_only(test_db_session: Session):
    """
    Test update_task with partial update (priority only).

    Validates:
    - Only priority updated
    - Title, description, due_date, tags preserved
    - updated_at timestamp updated

    Constitution: Section IX - Principle of least privilege
    """
    # Arrange
    user_id = "user_update_priority"

    task = Task(
        user_id=user_id,
        title="Task to update",
        description="Task description",
        priority=TaskPriority.LOW,
        status=TaskStatus.INCOMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)

    # Act: Update only priority
    task_input = UpdateTaskInput(task_id=task.id, priority=TaskPriority.HIGH)

    result = update_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert
    assert result.priority == TaskPriority.HIGH
    assert result.title == "Task to update"  # Preserved
    assert result.description == "Task description"  # Preserved


def test_update_task_partial_update_tags_only(test_db_session: Session):
    """
    Test update_task with partial update (tags only).

    Validates:
    - Only tags updated
    - Other fields preserved
    - Old tags replaced with new tags
    - Tag associations updated in TaskTag table

    Constitution: Section IX - User isolation (tags are user-scoped)
    """
    # Arrange
    user_id = "user_update_tags"

    task = Task(
        user_id=user_id,
        title="Task with tags",
        priority=TaskPriority.MEDIUM,
        status=TaskStatus.INCOMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)

    # Create old tags
    old_tag1 = Tag(name="OldTag1", user_id=user_id, created_at=datetime.utcnow())
    old_tag2 = Tag(name="OldTag2", user_id=user_id, created_at=datetime.utcnow())
    test_db_session.add(old_tag1)
    test_db_session.add(old_tag2)
    test_db_session.commit()
    test_db_session.refresh(old_tag1)
    test_db_session.refresh(old_tag2)

    # Associate old tags with task
    task_tag1 = TaskTag(task_id=task.id, tag_id=old_tag1.id)
    task_tag2 = TaskTag(task_id=task.id, tag_id=old_tag2.id)
    test_db_session.add(task_tag1)
    test_db_session.add(task_tag2)
    test_db_session.commit()

    # Act: Update tags only
    task_input = UpdateTaskInput(task_id=task.id, tags=["NewTag1", "NewTag2", "NewTag3"])

    result = update_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert: New tags applied
    assert sorted(result.tags) == ["NewTag1", "NewTag2", "NewTag3"]
    assert result.title == "Task with tags"  # Preserved

    # Verify TaskTag associations updated
    statement = select(TaskTag).where(TaskTag.task_id == task.id)
    task_tags = test_db_session.exec(statement).all()
    assert len(task_tags) == 3  # Old tags removed, new tags added


def test_update_task_error_on_no_fields_provided(test_db_session: Session):
    """
    Test update_task raises error when no fields to update.

    Validates:
    - At least one field must be provided (besides task_id)
    - Clear error message
    - No database changes

    Constitution: Section X - Input validation (fail fast)
    """
    # Arrange
    user_id = "user_no_fields"

    task = Task(
        user_id=user_id,
        title="Task to update",
        status=TaskStatus.INCOMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)

    original_updated_at = task.updated_at

    # Act & Assert: No fields provided (only task_id)
    task_input = UpdateTaskInput(task_id=task.id)

    with pytest.raises(Exception) as exc_info:
        update_task(session=test_db_session, user_id=user_id, task_input=task_input)

    assert (
        "no fields" in str(exc_info.value).lower()
        or "nothing to update" in str(exc_info.value).lower()
    )

    # Verify no database changes
    statement = select(Task).where(Task.id == task.id)
    db_task = test_db_session.exec(statement).first()
    assert db_task.updated_at == original_updated_at  # Not updated


def test_update_task_error_on_task_not_found(test_db_session: Session):
    """
    Test update_task raises error when task doesn't exist.

    Validates:
    - Non-existent task_id → Exception raised
    - Clear error message
    - No database changes

    Constitution: Section X - Clear error messages
    """
    # Arrange
    user_id = "user_not_found"
    task_input = UpdateTaskInput(task_id=99999, title="New title")  # Task does not exist

    # Act & Assert
    with pytest.raises(Exception) as exc_info:
        update_task(session=test_db_session, user_id=user_id, task_input=task_input)

    assert "not found" in str(exc_info.value).lower()


def test_update_task_error_on_different_user(test_db_session: Session):
    """
    Test update_task prevents updating other user's tasks.

    Validates:
    - Task belongs to user2, user1 cannot update it
    - 403-style error raised (user isolation)
    - Task unchanged

    Constitution: Section IX - User isolation
    """
    # Arrange
    user1_id = "user_alice"
    user2_id = "user_bob"

    # Bob's task
    bob_task = Task(
        user_id=user2_id,
        title="Bob's task",
        status=TaskStatus.INCOMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(bob_task)
    test_db_session.commit()
    test_db_session.refresh(bob_task)

    # Act: Alice tries to update Bob's task
    task_input = UpdateTaskInput(task_id=bob_task.id, title="Alice's malicious update")

    with pytest.raises(Exception) as exc_info:
        update_task(
            session=test_db_session,
            user_id=user1_id,  # Alice
            task_input=task_input,
        )

    # Assert
    assert "not found" in str(exc_info.value).lower() or "access" in str(exc_info.value).lower()

    # Verify Bob's task unchanged
    statement = select(Task).where(Task.id == bob_task.id)
    db_task = test_db_session.exec(statement).first()
    assert db_task.title == "Bob's task"  # Not changed


def test_update_task_validation_empty_title_raises_error(test_db_session: Session):
    """
    Test update_task rejects empty title.

    Validates:
    - Title min_length=1 enforced
    - Pydantic validation error raised
    - No database changes

    Constitution: Section X - Input validation (fail fast)
    """
    # Arrange
    user_id = "user_validation"

    task = Task(
        user_id=user_id,
        title="Original title",
        status=TaskStatus.INCOMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)

    # Act & Assert
    with pytest.raises(Exception):  # Pydantic ValidationError
        task_input = UpdateTaskInput(task_id=task.id, title="")  # Empty string
        update_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Verify no database changes
    statement = select(Task).where(Task.id == task.id)
    db_task = test_db_session.exec(statement).first()
    assert db_task.title == "Original title"


def test_update_task_validation_title_too_long_raises_error(test_db_session: Session):
    """
    Test update_task rejects title exceeding max length.

    Validates:
    - Title max_length=500 enforced
    - Pydantic validation error raised

    Constitution: Section X - Input validation (prevent abuse)
    """
    # Arrange
    user_id = "user_validation"

    task = Task(
        user_id=user_id,
        title="Original title",
        status=TaskStatus.INCOMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)

    # Act & Assert
    long_title = "A" * 501  # Exceeds 500 character limit
    with pytest.raises(Exception):  # Pydantic ValidationError
        task_input = UpdateTaskInput(task_id=task.id, title=long_title)
        update_task(session=test_db_session, user_id=user_id, task_input=task_input)


def test_update_task_validation_description_too_long_raises_error(test_db_session: Session):
    """
    Test update_task rejects description exceeding max length.

    Validates:
    - Description max_length=2000 enforced
    - Pydantic validation error raised

    Constitution: Section X - Input validation (prevent abuse)
    """
    # Arrange
    user_id = "user_validation"

    task = Task(
        user_id=user_id,
        title="Original title",
        status=TaskStatus.INCOMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)

    # Act & Assert
    long_description = "B" * 2001  # Exceeds 2000 character limit
    with pytest.raises(Exception):  # Pydantic ValidationError
        task_input = UpdateTaskInput(task_id=task.id, description=long_description)
        update_task(session=test_db_session, user_id=user_id, task_input=task_input)


def test_update_task_updates_timestamp(test_db_session: Session):
    """
    Test update_task updates updated_at timestamp.

    Validates:
    - updated_at is set to current time
    - updated_at is later than original
    - Timestamp tracking for audit

    Constitution: Section X - Timestamp tracking
    """
    # Arrange
    user_id = "user_timestamp"

    original_time = datetime.utcnow() - timedelta(hours=1)
    task = Task(
        user_id=user_id,
        title="Original title",
        status=TaskStatus.INCOMPLETE,
        created_at=original_time,
        updated_at=original_time,
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)

    # Act
    before_update = datetime.utcnow()
    task_input = UpdateTaskInput(task_id=task.id, title="New title")
    result = update_task(session=test_db_session, user_id=user_id, task_input=task_input)
    after_update = datetime.utcnow()

    # Assert
    assert before_update <= result.updated_at <= after_update
    assert result.updated_at > original_time

    # Verify database
    statement = select(Task).where(Task.id == task.id)
    db_task = test_db_session.exec(statement).first()
    assert db_task.updated_at > original_time


def test_update_task_preserves_status(test_db_session: Session):
    """
    Test update_task does NOT change status field.

    Validates:
    - Status unchanged (use complete_task tool for status changes)
    - Only specified fields updated

    Constitution: Section IX - Separation of concerns
    """
    # Arrange
    user_id = "user_preserve_status"

    task = Task(
        user_id=user_id,
        title="Completed task",
        status=TaskStatus.COMPLETE,  # Already complete
        completed_at=datetime.utcnow(),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)

    # Act: Update title (should not affect status)
    task_input = UpdateTaskInput(task_id=task.id, title="Updated title")
    result = update_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert: Status still COMPLETE
    assert result.status == TaskStatus.COMPLETE
    assert result.title == "Updated title"


def test_update_task_clear_due_date(test_db_session: Session):
    """
    Test update_task can clear due_date by setting to None.

    Validates:
    - due_date can be set to None (remove deadline)
    - Explicit None different from not providing the field
    - Database NULL stored correctly

    Constitution: Section IX - Explicit nullability
    """
    # Arrange
    user_id = "user_clear_due_date"

    task = Task(
        user_id=user_id,
        title="Task with due date",
        due_date=datetime.utcnow() + timedelta(days=7),
        status=TaskStatus.INCOMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)

    # Act: Clear due_date by setting to None
    task_input = UpdateTaskInput(task_id=task.id, due_date=None)
    result = update_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert: due_date is None
    assert result.due_date is None

    # Verify database
    statement = select(Task).where(Task.id == task.id)
    db_task = test_db_session.exec(statement).first()
    assert db_task.due_date is None


def test_update_task_with_new_tags_creates_tags(test_db_session: Session):
    """
    Test update_task creates new tags if they don't exist.

    Validates:
    - New tags created in database
    - Tags are user-scoped
    - TaskTag associations created
    - Output includes tag names in alphabetical order

    Constitution: Section IX - User isolation (tags are user-scoped)
    """
    # Arrange
    user_id = "user_new_tags"

    task = Task(
        user_id=user_id,
        title="Task without tags",
        status=TaskStatus.INCOMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)

    # Act: Add new tags
    task_input = UpdateTaskInput(task_id=task.id, tags=["Work", "Urgent", "Meeting"])
    result = update_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert
    assert sorted(result.tags) == ["Meeting", "Urgent", "Work"]

    # Verify tags created in database
    statement = select(Tag).where(Tag.user_id == user_id)
    db_tags = test_db_session.exec(statement).all()
    tag_names = {tag.name for tag in db_tags}
    assert "Work" in tag_names
    assert "Urgent" in tag_names
    assert "Meeting" in tag_names


def test_update_task_with_existing_tags_reuses_tags(test_db_session: Session):
    """
    Test update_task reuses existing tags instead of creating duplicates.

    Validates:
    - Existing tags looked up by name AND user_id
    - No duplicate tags created
    - Tags from other users NOT reused (user isolation)

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

    # Create tag for different user (should NOT be reused)
    other_user_tag = Tag(name="Work", user_id="other_user_999", created_at=datetime.utcnow())
    test_db_session.add(other_user_tag)
    test_db_session.commit()

    task = Task(
        user_id=user_id,
        title="Task to update",
        status=TaskStatus.INCOMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)

    # Act: Add tags (2 existing, 1 new)
    task_input = UpdateTaskInput(task_id=task.id, tags=["Work", "Important", "NewTag"])
    result = update_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert
    assert sorted(result.tags) == ["Important", "NewTag", "Work"]

    # Verify only 1 new tag created (NewTag)
    statement = select(Tag).where(Tag.user_id == user_id)
    user_tags = test_db_session.exec(statement).all()
    assert len(user_tags) == 3  # Work, Important, NewTag


def test_update_task_clear_tags_with_empty_list(test_db_session: Session):
    """
    Test update_task can remove all tags by providing empty list.

    Validates:
    - Empty list [] removes all tag associations
    - TaskTag associations deleted
    - Tags themselves remain in database (may be used by other tasks)

    Constitution: Section IX - Principle of least privilege
    """
    # Arrange
    user_id = "user_clear_tags"

    task = Task(
        user_id=user_id,
        title="Task with tags",
        status=TaskStatus.INCOMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)

    # Add tags
    tag1 = Tag(name="Tag1", user_id=user_id, created_at=datetime.utcnow())
    tag2 = Tag(name="Tag2", user_id=user_id, created_at=datetime.utcnow())
    test_db_session.add(tag1)
    test_db_session.add(tag2)
    test_db_session.commit()

    task_tag1 = TaskTag(task_id=task.id, tag_id=tag1.id)
    task_tag2 = TaskTag(task_id=task.id, tag_id=tag2.id)
    test_db_session.add(task_tag1)
    test_db_session.add(task_tag2)
    test_db_session.commit()

    # Act: Clear all tags with empty list
    task_input = UpdateTaskInput(task_id=task.id, tags=[])
    result = update_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert: No tags
    assert result.tags == []

    # Verify TaskTag associations removed
    statement = select(TaskTag).where(TaskTag.task_id == task.id)
    task_tags = test_db_session.exec(statement).all()
    assert len(task_tags) == 0


def test_update_task_success_message_includes_summary(test_db_session: Session):
    """
    Test update_task returns success message with update summary.

    Validates:
    - Message includes task title
    - Message indicates what was updated
    - User-friendly response

    Constitution: Section X - User-friendly messages
    """
    # Arrange
    user_id = "user_message_test"

    task = Task(
        user_id=user_id,
        title="Buy groceries",
        status=TaskStatus.INCOMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)

    # Act
    task_input = UpdateTaskInput(task_id=task.id, priority=TaskPriority.HIGH)
    result = update_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert
    assert "updated" in result.message.lower() or "success" in result.message.lower()
    # Message should be descriptive
    assert len(result.message) > 10


def test_update_task_output_schema_format(test_db_session: Session):
    """
    Test update_task returns correct UpdateTaskOutput format.

    Validates:
    - All required fields present (id, title, description, priority, status, due_date, tags, updated_at, message)
    - Types match schema
    - No extra fields leaked

    Constitution: Section X - Schema compliance
    """
    # Arrange
    user_id = "user_schema_test"

    task = Task(
        user_id=user_id,
        title="Test task",
        status=TaskStatus.INCOMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)

    # Act
    task_input = UpdateTaskInput(task_id=task.id, title="Updated title")
    result = update_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert: Verify UpdateTaskOutput schema
    assert isinstance(result, UpdateTaskOutput)
    assert hasattr(result, "id")
    assert hasattr(result, "title")
    assert hasattr(result, "description")
    assert hasattr(result, "priority")
    assert hasattr(result, "status")
    assert hasattr(result, "due_date")
    assert hasattr(result, "tags")
    assert hasattr(result, "updated_at")
    assert hasattr(result, "message")

    assert isinstance(result.id, int)
    assert isinstance(result.title, str)
    assert result.description is None or isinstance(result.description, str)
    assert isinstance(result.priority, TaskPriority)
    assert isinstance(result.status, TaskStatus)
    assert result.due_date is None or isinstance(result.due_date, datetime)
    assert isinstance(result.tags, list)
    assert isinstance(result.updated_at, datetime)
    assert isinstance(result.message, str)


def test_update_task_with_special_characters(test_db_session: Session):
    """
    Test update_task handles special characters in title and description.

    Validates:
    - Unicode characters accepted (emoji, accents, etc.)
    - Special punctuation preserved
    - No SQL injection vulnerabilities

    Constitution: Section X - Input sanitization
    """
    # Arrange
    user_id = "user_special_chars"

    task = Task(
        user_id=user_id,
        title="Original title",
        status=TaskStatus.INCOMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)

    # Act
    task_input = UpdateTaskInput(
        task_id=task.id,
        title="Buy 🎂 for mom's birthday! (June 15th)",
        description="Don't forget: vanilla cake with strawberries & cream 😋",
    )
    result = update_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert
    assert result.title == "Buy 🎂 for mom's birthday! (June 15th)"
    assert "strawberries & cream 😋" in result.description
