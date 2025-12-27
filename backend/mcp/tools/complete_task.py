"""
complete_task MCP Tool - Mark task as complete.

This tool is called by the OpenAI Agent when the user wants to mark
a task as done. The agent identifies the task by ID or title from
the user's natural language message.

Constitution: .specify/memory/phase-3-constitution.md (v1.1.0)
Spec: specs/002-ai-chatbot-mcp/spec.md Section 5.1.3

MCP Tool Contract:
- Input: CompleteTaskInput (task_id)
- Output: CompleteTaskOutput (id, title, status, completed_at, message)
- Behavior:
  1. Find task by ID and user_id (user isolation)
  2. Mark task status as COMPLETE
  3. Set completed_at timestamp
  4. Update updated_at timestamp
  5. Return confirmation with task details

Critical Security:
- user_id is INJECTED by server from JWT token (NOT from agent input)
- Task lookup MUST filter by user_id (user isolation)
- Cannot complete another user's task

Idempotency:
- If task already complete, return success (no error)
- Preserve original completed_at timestamp

Implementation: Task T046 (Phase 3: User Story 3)
"""

from datetime import datetime
from sqlmodel import Session, select

from mcp.schemas import CompleteTaskInput, CompleteTaskOutput, TaskStatus
from src.api.models import Task


def complete_task(
    session: Session, user_id: str, task_input: CompleteTaskInput
) -> CompleteTaskOutput:
    """
    Mark task as complete by task_id.

    This function is called by the MCP server after the OpenAI Agent
    has identified which task to mark complete.

    Args:
        session: Database session (injected by MCP server)
        user_id: User identifier from JWT token (injected by MCP server)
        task_input: Task ID to mark complete

    Returns:
        CompleteTaskOutput: Task details with completion confirmation

    Raises:
        Exception: If task not found or access denied

    Example:
        >>> task_input = CompleteTaskInput(task_id=42)
        >>> result = complete_task(session, "user_123", task_input)
        >>> result.status
        TaskStatus.COMPLETE
        >>> result.message
        "Task 'Buy groceries' marked as complete."
    """
    # Step 1: Find task with user isolation
    statement = select(Task).where(
        Task.id == task_input.task_id, Task.user_id == user_id  # CRITICAL: User isolation
    )
    task = session.exec(statement).first()

    if task is None:
        raise Exception(
            f"Task not found: {task_input.task_id}. "
            "It may not exist or you don't have permission to access it."
        )

    # Step 2: Check if already complete (idempotent)
    if task.status == TaskStatus.COMPLETE:
        # Already complete - return success without changes
        return CompleteTaskOutput(
            id=task.id,
            title=task.title,
            status=task.status,
            completed_at=task.completed_at,
            message=f"Task '{task.title}' is already marked as complete.",
        )

    # Step 3: Mark as complete
    task.status = TaskStatus.COMPLETE
    task.completed_at = datetime.utcnow()
    task.updated_at = datetime.utcnow()

    session.add(task)
    session.commit()
    session.refresh(task)

    # Step 4: Return confirmation
    return CompleteTaskOutput(
        id=task.id,
        title=task.title,
        status=task.status,
        completed_at=task.completed_at,
        message=f"Task '{task.title}' marked as complete.",
    )
