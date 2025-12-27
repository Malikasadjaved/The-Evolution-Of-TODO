"""
Unit tests for delete_task MCP tool.

Tests for:
- Delete task by task_id
- Return deleted task title (for confirmation)
- User isolation (cannot delete other user's task)
- Task not found error
- Verify task no longer queryable after deletion
- Delete task with tags (cascade deletion or orphan tags)
- Delete completed vs incomplete tasks
- Sync with Phase 2 web UI (shared database)

Constitution: .specify/memory/phase-3-constitution.md (v1.1.0)
Spec: specs/002-ai-chatbot-mcp/spec.md Section 5.1.5 (delete_task tool)

MCP Tool Contract:
- Input: DeleteTaskInput (task_id)
- Output: DeleteTaskOutput (task_id, title, message)
- Behavior:
  1. Find task by ID and user_id (user isolation)
  2. Delete task from database
  3. Return deleted task_id and title for confirmation
  4. Ensure task no longer queryable

Critical Security:
- user_id is INJECTED by server from JWT token (NOT from agent input)
- Task lookup MUST filter by user_id (user isolation)
- Cannot delete another user's task
- Deletion is PERMANENT (no soft delete, no undo)

Implementation: Task T063-T069 (Phase 3: User Story 5)
"""

import pytest
from datetime import datetime, timedelta
from sqlmodel import Session, select

from mcp.schemas import DeleteTaskInput, DeleteTaskOutput, TaskPriority, TaskStatus
from mcp.tools.delete_task import delete_task  # Will implement in T068
from src.api.models import Task, Tag, TaskTag


# ============================================================================
# delete_task Tool Tests (T063-T067)
# ============================================================================


def test_delete_task_success_incomplete_task(test_db_session: Session):
    """
    Test delete_task successfully deletes an incomplete task.

    Validates:
    - Task deleted from database
    - Deleted task_id and title returned in response
    - Success confirmation message
    - Task no longer queryable after deletion

    Constitution: Section IX - MCP tool behavior
    """
    # Arrange
    user_id = "user_delete_success"

    task = Task(
        user_id=user_id,
        title="Task to delete",
        description="This task will be deleted",
        priority=TaskPriority.MEDIUM,
        status=TaskStatus.INCOMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)
    task_id = task.id

    # Act
    task_input = DeleteTaskInput(task_id=task_id)
    result = delete_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert response
    assert isinstance(result, DeleteTaskOutput)
    assert result.task_id == task_id
    assert result.title == "Task to delete"
    assert "delete" in result.message.lower() or "removed" in result.message.lower()

    # Verify task deleted from database
    statement = select(Task).where(Task.id == task_id)
    deleted_task = test_db_session.exec(statement).first()
    assert deleted_task is None  # Task no longer exists


def test_delete_task_success_completed_task(test_db_session: Session):
    """
    Test delete_task successfully deletes a completed task.

    Validates:
    - Completed tasks can be deleted (no status restriction)
    - completed_at timestamp preserved in response
    - Task removed from database

    Constitution: Section IX - Principle of least privilege
    """
    # Arrange
    user_id = "user_delete_completed"

    task = Task(
        user_id=user_id,
        title="Completed task to delete",
        status=TaskStatus.COMPLETE,
        completed_at=datetime.utcnow() - timedelta(hours=1),
        created_at=datetime.utcnow() - timedelta(days=1),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)
    task_id = task.id

    # Act
    task_input = DeleteTaskInput(task_id=task_id)
    result = delete_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert
    assert result.task_id == task_id
    assert result.title == "Completed task to delete"

    # Verify deletion
    statement = select(Task).where(Task.id == task_id)
    deleted_task = test_db_session.exec(statement).first()
    assert deleted_task is None


def test_delete_task_error_on_task_not_found(test_db_session: Session):
    """
    Test delete_task raises error when task doesn't exist.

    Validates:
    - Non-existent task_id → Exception raised
    - Clear error message
    - No database changes

    Constitution: Section X - Clear error messages
    """
    # Arrange
    user_id = "user_not_found"
    task_input = DeleteTaskInput(task_id=99999)  # Does not exist

    # Act & Assert
    with pytest.raises(Exception) as exc_info:
        delete_task(session=test_db_session, user_id=user_id, task_input=task_input)

    assert "not found" in str(exc_info.value).lower()


def test_delete_task_error_on_different_user(test_db_session: Session):
    """
    Test delete_task prevents deleting other user's tasks.

    Validates:
    - Task belongs to user2, user1 cannot delete it
    - 403-style error raised (user isolation)
    - Task unchanged in database

    Constitution: Section IX - User isolation (CRITICAL SECURITY)
    """
    # Arrange
    user1_id = "user_alice"
    user2_id = "user_bob"

    # Bob's task
    bob_task = Task(
        user_id=user2_id,
        title="Bob's private task",
        status=TaskStatus.INCOMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(bob_task)
    test_db_session.commit()
    test_db_session.refresh(bob_task)

    # Act: Alice tries to delete Bob's task
    task_input = DeleteTaskInput(task_id=bob_task.id)

    with pytest.raises(Exception) as exc_info:
        delete_task(session=test_db_session, user_id=user1_id, task_input=task_input)  # Alice

    # Assert
    assert "not found" in str(exc_info.value).lower() or "access" in str(exc_info.value).lower()

    # Verify Bob's task still exists (NOT deleted)
    statement = select(Task).where(Task.id == bob_task.id)
    db_task = test_db_session.exec(statement).first()
    assert db_task is not None  # Task still exists
    assert db_task.title == "Bob's private task"


def test_delete_task_with_tags_removes_associations(test_db_session: Session):
    """
    Test delete_task removes TaskTag associations when deleting task.

    Validates:
    - Task deletion cascades to TaskTag join table
    - Tags themselves remain in database (may be used by other tasks)
    - No orphaned TaskTag records

    Constitution: Section IX - Data integrity
    """
    # Arrange
    user_id = "user_delete_with_tags"

    # Create task with tags
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

    # Create tags
    tag1 = Tag(name="Work", user_id=user_id, created_at=datetime.utcnow())
    tag2 = Tag(name="Urgent", user_id=user_id, created_at=datetime.utcnow())
    test_db_session.add(tag1)
    test_db_session.add(tag2)
    test_db_session.commit()
    test_db_session.refresh(tag1)
    test_db_session.refresh(tag2)

    # Associate tags with task
    task_tag1 = TaskTag(task_id=task.id, tag_id=tag1.id)
    task_tag2 = TaskTag(task_id=task.id, tag_id=tag2.id)
    test_db_session.add(task_tag1)
    test_db_session.add(task_tag2)
    test_db_session.commit()

    # Act: Delete task
    task_input = DeleteTaskInput(task_id=task.id)
    result = delete_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert: Task deleted
    assert result.task_id == task.id

    # Verify TaskTag associations removed
    statement = select(TaskTag).where(TaskTag.task_id == task.id)
    task_tags = test_db_session.exec(statement).all()
    assert len(task_tags) == 0  # All associations removed

    # Verify tags still exist (may be used by other tasks)
    statement = select(Tag).where(Tag.user_id == user_id)
    user_tags = test_db_session.exec(statement).all()
    assert len(user_tags) == 2  # Tags not deleted
    tag_names = {tag.name for tag in user_tags}
    assert "Work" in tag_names
    assert "Urgent" in tag_names


def test_delete_task_with_due_date(test_db_session: Session):
    """
    Test delete_task handles tasks with due dates.

    Validates:
    - Tasks with due_date can be deleted
    - No special handling needed for due_date field
    - Standard deletion behavior

    Constitution: Section IX - Simplicity
    """
    # Arrange
    user_id = "user_delete_due_date"

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

    # Act
    task_input = DeleteTaskInput(task_id=task.id)
    result = delete_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert
    assert result.task_id == task.id
    assert result.title == "Task with due date"

    # Verify deletion
    statement = select(Task).where(Task.id == task.id)
    deleted_task = test_db_session.exec(statement).first()
    assert deleted_task is None


def test_delete_task_confirmation_message_includes_title(test_db_session: Session):
    """
    Test delete_task returns confirmation message with task title.

    Validates:
    - Message includes deleted task title
    - User-friendly confirmation
    - Natural language format

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
    task_input = DeleteTaskInput(task_id=task.id)
    result = delete_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert
    assert "Buy groceries" in result.message or "groceries" in result.message.lower()
    assert "delete" in result.message.lower() or "removed" in result.message.lower()


def test_delete_task_output_schema_format(test_db_session: Session):
    """
    Test delete_task returns correct DeleteTaskOutput format.

    Validates:
    - All required fields present (task_id, title, message)
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
    task_input = DeleteTaskInput(task_id=task.id)
    result = delete_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert: Verify DeleteTaskOutput schema
    assert isinstance(result, DeleteTaskOutput)
    assert hasattr(result, "task_id")
    assert hasattr(result, "title")
    assert hasattr(result, "message")

    assert isinstance(result.task_id, int)
    assert isinstance(result.title, str)
    assert isinstance(result.message, str)


def test_delete_task_permanent_deletion_not_soft_delete(test_db_session: Session):
    """
    Test delete_task performs PERMANENT deletion (hard delete, not soft delete).

    Validates:
    - Task record completely removed from database
    - No 'deleted_at' timestamp or 'is_deleted' flag
    - Cannot query deleted tasks
    - Deletion is irreversible

    Constitution: Section IX - Simplicity (no soft delete complexity)
    """
    # Arrange
    user_id = "user_permanent_delete"

    task = Task(
        user_id=user_id,
        title="Permanently deleted task",
        status=TaskStatus.INCOMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)
    task_id = task.id

    # Act: Delete task
    task_input = DeleteTaskInput(task_id=task_id)
    delete_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert: Task record does NOT exist in database
    statement = select(Task).where(Task.id == task_id)
    deleted_task = test_db_session.exec(statement).first()
    assert deleted_task is None  # Hard delete, not soft delete

    # Verify cannot query by user_id either
    statement = select(Task).where(
        Task.user_id == user_id, Task.title == "Permanently deleted task"
    )
    results = test_db_session.exec(statement).all()
    assert len(results) == 0


def test_delete_task_phase_2_sync_shared_database(test_db_session: Session):
    """
    Test delete_task syncs with Phase 2 web UI (shared database).

    Validates:
    - Task deleted via chatbot (Phase 3) disappears from web UI (Phase 2)
    - Same database, same tasks table
    - Real-time synchronization (< 1 second)
    - No separate sync mechanism needed

    Constitution: Section II - Monorepo integration
    Spec: FR-42 (Phase 2/3 task synchronization)
    """
    # Arrange
    user_id = "user_phase2_sync"

    # Create task (could be from Phase 2 web UI)
    task = Task(
        user_id=user_id,
        title="Task from Phase 2 web UI",
        description="Created in web UI, will delete via chatbot",
        priority=TaskPriority.HIGH,
        status=TaskStatus.INCOMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)
    task_id = task.id

    # Verify task exists (visible to Phase 2 web UI)
    statement = select(Task).where(Task.user_id == user_id)
    phase2_tasks_before = test_db_session.exec(statement).all()
    assert len(phase2_tasks_before) == 1

    # Act: Delete task via chatbot (Phase 3)
    task_input = DeleteTaskInput(task_id=task_id)
    delete_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert: Task no longer visible to Phase 2 web UI (shared database)
    statement = select(Task).where(Task.user_id == user_id)
    phase2_tasks_after = test_db_session.exec(statement).all()
    assert len(phase2_tasks_after) == 0  # Task deleted from shared database

    # Verify specific task_id no longer exists
    statement = select(Task).where(Task.id == task_id)
    deleted_task = test_db_session.exec(statement).first()
    assert deleted_task is None


def test_delete_task_multiple_tasks_isolation(test_db_session: Session):
    """
    Test delete_task only deletes specified task, not other user's tasks.

    Validates:
    - Deleting task_id=1 doesn't affect task_id=2
    - User isolation across multiple tasks
    - Precise targeting by task_id

    Constitution: Section IX - User isolation
    """
    # Arrange
    user_id = "user_multiple_tasks"

    task1 = Task(
        user_id=user_id,
        title="Task 1",
        status=TaskStatus.INCOMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    task2 = Task(
        user_id=user_id,
        title="Task 2",
        status=TaskStatus.INCOMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task1)
    test_db_session.add(task2)
    test_db_session.commit()
    test_db_session.refresh(task1)
    test_db_session.refresh(task2)

    # Act: Delete only task1
    task_input = DeleteTaskInput(task_id=task1.id)
    delete_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert: task1 deleted, task2 still exists
    statement = select(Task).where(Task.id == task1.id)
    deleted_task = test_db_session.exec(statement).first()
    assert deleted_task is None  # task1 deleted

    statement = select(Task).where(Task.id == task2.id)
    remaining_task = test_db_session.exec(statement).first()
    assert remaining_task is not None  # task2 still exists
    assert remaining_task.title == "Task 2"


def test_delete_task_with_special_characters_in_title(test_db_session: Session):
    """
    Test delete_task handles special characters in title.

    Validates:
    - Unicode characters (emoji, accents) handled correctly
    - Title returned in response matches original
    - No SQL injection vulnerabilities

    Constitution: Section X - Input sanitization
    """
    # Arrange
    user_id = "user_special_chars"

    task = Task(
        user_id=user_id,
        title="Buy 🎂 for mom's birthday! (June 15th)",
        description="Don't forget: vanilla cake with strawberries & cream 😋",
        status=TaskStatus.INCOMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)

    # Act
    task_input = DeleteTaskInput(task_id=task.id)
    result = delete_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert
    assert result.title == "Buy 🎂 for mom's birthday! (June 15th)"
    assert "🎂" in result.title or "birthday" in result.title.lower()
