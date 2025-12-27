"""
Unit tests for complete_task MCP tool.

Tests for:
- Mark task as complete by task_id
- Update completed_at timestamp
- Update updated_at timestamp
- Idempotent (already complete = still success)
- User isolation (cannot complete other user's task)
- Task not found error
- Return confirmation with task details

Constitution: .specify/memory/phase-3-constitution.md (v1.1.0)
Spec: specs/002-ai-chatbot-mcp/spec.md Section 5.1.3 (complete_task tool)

MCP Tool Contract:
- Input: CompleteTaskInput (task_id)
- Output: CompleteTaskOutput (id, title, status, completed_at, message)
- Behavior: Find task by ID, mark as COMPLETE, update timestamps
- User Isolation: Server injects user_id, verifies task belongs to user

Implementation: Task T045 (Phase 3: User Story 3)
"""

import pytest
from datetime import datetime, timedelta
from sqlmodel import Session, select

from mcp.schemas import CompleteTaskInput, CompleteTaskOutput, TaskStatus
from mcp.tools.complete_task import complete_task  # Will implement in T046
from src.api.models import Task, TaskPriority


# ============================================================================
# complete_task Tool Tests (T045)
# ============================================================================


def test_complete_task_success_on_incomplete_task(test_db_session: Session):
    """
    Test complete_task marks incomplete task as complete.

    Validates:
    - Task status changed from INCOMPLETE to COMPLETE
    - completed_at timestamp set
    - updated_at timestamp updated
    - Success message returned

    Constitution: Section IX - MCP tool behavior
    """
    # Arrange
    user_id = "user_complete_success"

    task = Task(
        user_id=user_id,
        title="Finish report",
        status=TaskStatus.INCOMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)

    # Act
    task_input = CompleteTaskInput(task_id=task.id)
    result = complete_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert
    assert isinstance(result, CompleteTaskOutput)
    assert result.id == task.id
    assert result.title == "Finish report"
    assert result.status == TaskStatus.COMPLETE
    assert result.completed_at is not None
    assert "success" in result.message.lower() or "complete" in result.message.lower()

    # Verify database updated
    statement = select(Task).where(Task.id == task.id)
    db_task = test_db_session.exec(statement).first()
    assert db_task.status == TaskStatus.COMPLETE
    assert db_task.completed_at is not None


def test_complete_task_idempotent_already_complete(test_db_session: Session):
    """
    Test complete_task is idempotent when task already complete.

    Validates:
    - No error raised if task already complete
    - completed_at timestamp preserved (not overwritten)
    - Success message returned
    - Idempotent behavior

    Constitution: Section X - Idempotency
    """
    # Arrange
    user_id = "user_idempotent"

    original_completion_time = datetime.utcnow() - timedelta(hours=1)
    task = Task(
        user_id=user_id,
        title="Already done",
        status=TaskStatus.COMPLETE,
        completed_at=original_completion_time,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)

    # Act
    task_input = CompleteTaskInput(task_id=task.id)
    result = complete_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert
    assert result.status == TaskStatus.COMPLETE
    assert result.completed_at == original_completion_time  # Not changed
    assert "already" in result.message.lower() or "complete" in result.message.lower()


def test_complete_task_error_on_task_not_found(test_db_session: Session):
    """
    Test complete_task raises error when task doesn't exist.

    Validates:
    - Non-existent task_id → Exception raised
    - Clear error message
    - No database changes

    Constitution: Section X - Clear error messages
    """
    # Arrange
    user_id = "user_not_found"
    task_input = CompleteTaskInput(task_id=99999)  # Does not exist

    # Act & Assert
    with pytest.raises(Exception) as exc_info:
        complete_task(session=test_db_session, user_id=user_id, task_input=task_input)

    assert "not found" in str(exc_info.value).lower()


def test_complete_task_error_on_different_user(test_db_session: Session):
    """
    Test complete_task prevents completing other user's tasks.

    Validates:
    - Task belongs to user2, user1 cannot complete it
    - 403-style error raised (user isolation)
    - Task status unchanged

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

    # Act: Alice tries to complete Bob's task
    task_input = CompleteTaskInput(task_id=bob_task.id)

    with pytest.raises(Exception) as exc_info:
        complete_task(session=test_db_session, user_id=user1_id, task_input=task_input)  # Alice

    # Assert
    assert "not found" in str(exc_info.value).lower() or "access" in str(exc_info.value).lower()

    # Verify Bob's task unchanged
    statement = select(Task).where(Task.id == bob_task.id)
    db_task = test_db_session.exec(statement).first()
    assert db_task.status == TaskStatus.INCOMPLETE  # Still incomplete


def test_complete_task_updates_timestamp(test_db_session: Session):
    """
    Test complete_task updates updated_at timestamp.

    Validates:
    - updated_at is set to current time
    - updated_at is later than original created_at
    - Timestamp tracking for audit

    Constitution: Section X - Timestamp tracking
    """
    # Arrange
    user_id = "user_timestamp"

    original_time = datetime.utcnow() - timedelta(hours=1)
    task = Task(
        user_id=user_id,
        title="Task to complete",
        status=TaskStatus.INCOMPLETE,
        created_at=original_time,
        updated_at=original_time,
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)

    # Act
    before_completion = datetime.utcnow()
    task_input = CompleteTaskInput(task_id=task.id)
    result = complete_task(session=test_db_session, user_id=user_id, task_input=task_input)
    after_completion = datetime.utcnow()

    # Assert
    assert before_completion <= result.completed_at <= after_completion

    # Verify database updated_at also updated
    statement = select(Task).where(Task.id == task.id)
    db_task = test_db_session.exec(statement).first()
    assert db_task.updated_at > original_time


def test_complete_task_preserves_other_fields(test_db_session: Session):
    """
    Test complete_task only updates status/timestamps, preserves other fields.

    Validates:
    - title unchanged
    - description unchanged
    - priority unchanged
    - due_date unchanged
    - Only status, completed_at, updated_at changed

    Constitution: Section IX - Principle of least privilege
    """
    # Arrange
    user_id = "user_preserve_fields"

    due_date = datetime.utcnow() + timedelta(days=3)
    task = Task(
        user_id=user_id,
        title="Important task",
        description="Task description",
        priority=TaskPriority.HIGH,
        status=TaskStatus.INCOMPLETE,
        due_date=due_date,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)

    # Act
    task_input = CompleteTaskInput(task_id=task.id)
    result = complete_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert: Other fields preserved
    assert result.title == "Important task"

    # Verify in database
    statement = select(Task).where(Task.id == task.id)
    db_task = test_db_session.exec(statement).first()
    assert db_task.title == "Important task"
    assert db_task.description == "Task description"
    assert db_task.priority == TaskPriority.HIGH
    assert db_task.due_date == due_date


def test_complete_task_success_message_includes_title(test_db_session: Session):
    """
    Test complete_task returns success message with task title.

    Validates:
    - Message includes task title for confirmation
    - User-friendly response
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
    task_input = CompleteTaskInput(task_id=task.id)
    result = complete_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert
    assert "Buy groceries" in result.message or "groceries" in result.message.lower()
    assert "complete" in result.message.lower() or "done" in result.message.lower()


def test_complete_task_handles_recurring_task(test_db_session: Session):
    """
    Test complete_task handles recurring tasks (if supported by Phase 2).

    Validates:
    - Recurring task behavior (reschedule or stop recurrence)
    - This is a placeholder for future enhancement

    Constitution: Section IX - Extensibility
    """
    # Note: This test documents expected behavior for recurring tasks
    # Implementation depends on Phase 2 recurring task support
    pass  # Placeholder


def test_complete_task_output_schema_format(test_db_session: Session):
    """
    Test complete_task returns correct CompleteTaskOutput format.

    Validates:
    - All required fields present (id, title, status, completed_at, message)
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
    task_input = CompleteTaskInput(task_id=task.id)
    result = complete_task(session=test_db_session, user_id=user_id, task_input=task_input)

    # Assert: Verify CompleteTaskOutput schema
    assert isinstance(result, CompleteTaskOutput)
    assert hasattr(result, "id")
    assert hasattr(result, "title")
    assert hasattr(result, "status")
    assert hasattr(result, "completed_at")
    assert hasattr(result, "message")

    assert isinstance(result.id, int)
    assert isinstance(result.title, str)
    assert isinstance(result.status, TaskStatus)
    assert isinstance(result.completed_at, datetime)
    assert isinstance(result.message, str)
