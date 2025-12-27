# mypy: ignore-errors
"""
add_task MCP Tool - Create new task from natural language.

This tool is called by the OpenAI Agent when the user wants to create a task.
The agent extracts structured data (title, priority, due date, tags) from the
user's natural language message and passes it to this tool.

Constitution: .specify/memory/phase-3-constitution.md (v1.1.0)
Spec: specs/002-ai-chatbot-mcp/spec.md Section 5.1.1

MCP Tool Contract:
- Input: AddTaskInput (title, description, priority, due_date, tags)
- Output: AddTaskOutput (task with id, user_id, timestamps)
- Behavior:
  1. Create task in database with user_id (injected by server from JWT)
  2. Create/lookup tags by name AND user_id (user-scoped tags)
  3. Associate tags with task via TaskTag join table
  4. Return full task object with tag names

Critical Security:
- user_id is INJECTED by server from JWT token (NOT from agent input)
- Tags are user-scoped (same tag name can exist for different users)
- All database queries filter by user_id for isolation

Implementation: Task T025 (Phase 3: User Story 1)
"""

from datetime import datetime
from typing import List
from sqlmodel import Session, select

from mcp.schemas import AddTaskInput, AddTaskOutput, TaskStatus
from src.api.models import Task, Tag, TaskTag


def add_task(session: Session, user_id: str, task_input: AddTaskInput) -> AddTaskOutput:
    """
    Create new task from structured input.

    This function is called by the MCP server after the OpenAI Agent
    has extracted structured data from the user's natural language message.

    Args:
        session: Database session (injected by MCP server)
        user_id: User identifier from JWT token (injected by MCP server)
        task_input: Validated task parameters from agent

    Returns:
        AddTaskOutput: Created task with ID, timestamps, and associated tags

    Raises:
        SQLAlchemyError: If database operation fails

    Example:
        >>> task_input = AddTaskInput(
        ...     title="Complete Phase 3",
        ...     priority=TaskPriority.HIGH,
        ...     tags=["Work", "Urgent"]
        ... )
        >>> result = add_task(session, "user_123", task_input)
        >>> result.id
        42
        >>> result.tags
        ["Urgent", "Work"]
    """
    # Step 1: Create task entity
    task = Task(
        user_id=user_id,  # CRITICAL: Injected by server, NOT from agent
        title=task_input.title,
        description=task_input.description,
        priority=task_input.priority,
        status=TaskStatus.INCOMPLETE,  # New tasks always start incomplete
        due_date=task_input.due_date,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    session.add(task)
    session.commit()
    session.refresh(task)

    # Step 2: Handle tags (if provided)
    tag_names: List[str] = []

    if task_input.tags:
        # Filter out whitespace-only tags and deduplicate
        raw_tags = task_input.tags
        cleaned_tags = [tag.strip() for tag in raw_tags if tag and tag.strip()]
        unique_tags = list(dict.fromkeys(cleaned_tags))  # Preserve order, remove duplicates

        for tag_name in unique_tags:
            # Truncate tag if exceeds max length (50 characters)
            if len(tag_name) > 50:
                tag_name = tag_name[:50]

            # Lookup or create tag (user-scoped)
            statement = select(Tag).where(
                Tag.name == tag_name, Tag.user_id == user_id  # CRITICAL: User isolation
            )
            existing_tag = session.exec(statement).first()

            if existing_tag:
                tag = existing_tag
            else:
                # Create new tag for this user
                tag = Tag(name=tag_name, user_id=user_id, created_at=datetime.utcnow())
                session.add(tag)
                session.commit()
                session.refresh(tag)

            # Associate tag with task
            task_tag = TaskTag(task_id=task.id, tag_id=tag.id)
            session.add(task_tag)
            tag_names.append(tag_name)

        session.commit()

    # Step 3: Build output response
    return AddTaskOutput(
        id=task.id,
        user_id=task.user_id,
        title=task.title,
        description=task.description,
        priority=task.priority,
        status=task.status,
        due_date=task.due_date,
        tags=sorted(tag_names),  # Return tags in alphabetical order
        created_at=task.created_at,
        updated_at=task.updated_at,
    )
