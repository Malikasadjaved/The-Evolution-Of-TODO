"""
list_tasks MCP Tool - List and filter tasks from database.

This tool is called by the OpenAI Agent when the user wants to view their tasks.
The agent can specify filters (status, priority, tag) based on the user's
natural language query (e.g., "show me high priority tasks").

Constitution: .specify/memory/phase-3-constitution.md (v1.1.0)
Spec: specs/002-ai-chatbot-mcp/spec.md Section 5.1.2

MCP Tool Contract:
- Input: ListTasksInput (status, priority, tag, limit)
- Output: ListTasksOutput (tasks[], count)
- Behavior:
  1. Query tasks filtered by user_id (injected by server)
  2. Apply optional filters (status, priority, tag)
  3. Order by created_at DESC (newest first)
  4. Apply limit (default 50, max 100)
  5. Load associated tags for each task
  6. Return task summaries with count

Critical Security:
- user_id is INJECTED by server from JWT token (NOT from agent input)
- All queries filter by user_id for isolation
- Tags are user-scoped (same tag name can exist for different users)

Implementation: Task T034 (Phase 3: User Story 2)
"""

from typing import List
from sqlmodel import Session, select, col

from mcp.schemas import ListTasksInput, ListTasksOutput, TaskSummary
from src.api.models import Task, Tag, TaskTag


def list_tasks(session: Session, user_id: str, task_input: ListTasksInput) -> ListTasksOutput:
    """
    List and filter tasks for authenticated user.

    This function is called by the MCP server after the OpenAI Agent
    has determined which filters to apply based on the user's natural
    language query.

    Args:
        session: Database session (injected by MCP server)
        user_id: User identifier from JWT token (injected by MCP server)
        task_input: Filter parameters from agent (status, priority, tag, limit)

    Returns:
        ListTasksOutput: Task summaries with count

    Example:
        >>> task_input = ListTasksInput(
        ...     status=TaskStatus.INCOMPLETE,
        ...     priority=TaskPriority.HIGH,
        ...     limit=10
        ... )
        >>> result = list_tasks(session, "user_123", task_input)
        >>> result.count
        5
        >>> result.tasks[0].title
        "Finish urgent report"
    """
    # Step 1: Build query with user isolation
    statement = select(Task).where(Task.user_id == user_id)

    # Step 2: Apply filters (if provided)
    if task_input.status is not None:
        statement = statement.where(Task.status == task_input.status)

    if task_input.priority is not None:
        statement = statement.where(Task.priority == task_input.priority)

    if task_input.tag is not None:
        # Filter by tag (user-scoped tag lookup)
        # Join Task → TaskTag → Tag
        statement = (
            statement.join(TaskTag, Task.id == TaskTag.task_id)
            .join(Tag, TaskTag.tag_id == Tag.id)
            .where(
                Tag.name == task_input.tag,
                Tag.user_id == user_id,  # CRITICAL: User isolation for tags
            )
        )

    # Step 3: Order by created_at DESC (newest first)
    statement = statement.order_by(col(Task.created_at).desc())

    # Step 4: Apply limit
    statement = statement.limit(task_input.limit)

    # Step 5: Execute query
    tasks = session.exec(statement).all()

    # Step 6: Build task summaries with tags
    task_summaries: List[TaskSummary] = []

    for task in tasks:
        # Load tags for this task
        tag_statement = (
            select(Tag).join(TaskTag, Tag.id == TaskTag.tag_id).where(TaskTag.task_id == task.id)
        )
        task_tags = session.exec(tag_statement).all()
        tag_names = sorted([tag.name for tag in task_tags])

        # Create task summary
        summary = TaskSummary(
            id=task.id,
            title=task.title,
            description=task.description,
            priority=task.priority,
            status=task.status,
            due_date=task.due_date,
            tags=tag_names,
            created_at=task.created_at,
        )
        task_summaries.append(summary)

    # Step 7: Return output
    return ListTasksOutput(tasks=task_summaries, count=len(task_summaries))
