"""
delete_task MCP Tool - Permanently delete task.

This tool is called by the OpenAI Agent when the user wants to permanently
remove a task. The agent identifies the task by ID or title from the user's
natural language message.

Constitution: .specify/memory/phase-3-constitution.md (v1.1.0)
Spec: specs/002-ai-chatbot-mcp/spec.md Section 5.1.5

MCP Tool Contract:
- Input: DeleteTaskInput (task_id)
- Output: DeleteTaskOutput (task_id, title, message)
- Behavior:
  1. Find task by ID and user_id (user isolation)
  2. Store task title for confirmation message
  3. Delete task from database (hard delete, not soft delete)
  4. Delete associated TaskTag records (cascade)
  5. Return confirmation with task_id and title

Critical Security:
- user_id is INJECTED by server from JWT token (NOT from agent input)
- Task lookup MUST filter by user_id (user isolation)
- Cannot delete another user's task
- Deletion is PERMANENT (no undo, no soft delete)

Phase 2 Integration:
- Same database as Phase 2 web UI
- Task deleted via chatbot disappears from web UI immediately
- Real-time synchronization (< 1 second)

Implementation: Task T068-T069 (Phase 3: User Story 5)
"""

from sqlmodel import Session, select

from mcp.schemas import DeleteTaskInput, DeleteTaskOutput
from src.api.models import Task, TaskTag


def delete_task(session: Session, user_id: str, task_input: DeleteTaskInput) -> DeleteTaskOutput:
    """
    Permanently delete task by task_id.

    This function is called by the MCP server after the OpenAI Agent
    has identified which task to delete.

    Args:
        session: Database session (injected by MCP server)
        user_id: User identifier from JWT token (injected by MCP server)
        task_input: Task ID to delete

    Returns:
        DeleteTaskOutput: Deleted task_id, title, and confirmation message

    Raises:
        Exception: If task not found or access denied

    Example:
        >>> task_input = DeleteTaskInput(task_id=42)
        >>> result = delete_task(session, "user_123", task_input)
        >>> result.task_id
        42
        >>> result.title
        "Buy groceries"
        >>> result.message
        "Task 'Buy groceries' has been permanently deleted."
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

    # Step 2: Store task title for confirmation message (before deletion)
    task_title = task.title

    # Step 3: Delete associated TaskTag records first (avoid foreign key constraint)
    statement = select(TaskTag).where(TaskTag.task_id == task.id)
    task_tags = session.exec(statement).all()
    for task_tag in task_tags:
        session.delete(task_tag)
    session.commit()

    # Step 4: Delete task from database (PERMANENT hard delete)
    session.delete(task)
    session.commit()

    # Step 5: Return confirmation with task details
    return DeleteTaskOutput(
        task_id=task_input.task_id,
        title=task_title,
        message=f"Task '{task_title}' has been permanently deleted.",
    )
