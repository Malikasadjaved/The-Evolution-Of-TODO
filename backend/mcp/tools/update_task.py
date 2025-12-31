"""
update_task MCP Tool - Update task details.

This tool is called by the OpenAI Agent when the user wants to modify
an existing task. The agent extracts the task identifier and updated
fields from the user's natural language message.

Constitution: .specify/memory/phase-3-constitution.md (v1.1.0)
Spec: specs/002-ai-chatbot-mcp/spec.md Section 5.1.4

MCP Tool Contract:
- Input: UpdateTaskInput (task_id, optional: title, description, priority, due_date, tags)
- Output: UpdateTaskOutput (updated task with message)
- Behavior:
  1. Find task by ID and user_id (user isolation)
  2. Validate at least one field provided (besides task_id)
  3. Update only provided fields (partial updates)
  4. Handle tag updates (remove old, add new)
  5. Update updated_at timestamp
  6. Return full task object with success message

Critical Security:
- user_id is INJECTED by server from JWT token (NOT from agent input)
- Task lookup MUST filter by user_id (user isolation)
- Cannot update another user's task
- Tags are user-scoped (same tag name can exist for different users)

Partial Updates:
- Only provided fields are updated
- Other fields preserved
- Status NOT updated (use complete_task tool for status changes)

Implementation: Task T060-T061 (Phase 3: User Story 4)
"""

from datetime import datetime
from typing import List
from sqlmodel import Session, select

from mcp.schemas import UpdateTaskInput, UpdateTaskOutput
from src.api.models import Task, Tag, TaskTag


def update_task(session: Session, user_id: str, task_input: UpdateTaskInput) -> UpdateTaskOutput:
    """
    Update task details by task_id.

    This function is called by the MCP server after the OpenAI Agent
    has extracted which task to update and what fields to change.

    Args:
        session: Database session (injected by MCP server)
        user_id: User identifier from JWT token (injected by MCP server)
        task_input: Task ID and fields to update

    Returns:
        UpdateTaskOutput: Updated task details with success message

    Raises:
        Exception: If task not found, access denied, or no fields provided

    Example:
        >>> task_input = UpdateTaskInput(
        ...     task_id=42,
        ...     title="Updated title",
        ...     priority=TaskPriority.HIGH
        ... )
        >>> result = update_task(session, "user_123", task_input)
        >>> result.title
        "Updated title"
        >>> result.message
        "Task 'Updated title' successfully updated."
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

    # Step 2: Validate at least one field provided (besides task_id)
    # Note: We use model_dump(exclude_unset=True) to distinguish between
    # "field not provided" vs "field explicitly set to None"
    provided_fields = task_input.model_dump(exclude_unset=True)
    provided_fields.pop("task_id", None)  # Remove task_id from field count

    if not provided_fields:
        raise Exception(
            "No fields to update. Please provide at least one field: "
            "title, description, priority, due_date, or tags."
        )

    # Step 3: Update provided fields
    # Use provided_fields to handle explicit None values (e.g., clearing due_date)
    if "title" in provided_fields:
        task.title = task_input.title

    if "description" in provided_fields:
        task.description = task_input.description

    if "priority" in provided_fields:
        task.priority = task_input.priority

    if "due_date" in provided_fields:
        task.due_date = task_input.due_date

    # Step 4: Update updated_at timestamp
    task.updated_at = datetime.utcnow()

    # Step 5: Handle tag updates (if provided)
    tag_names: List[str] = []

    if "tags" in provided_fields:
        # Remove old tag associations
        statement = select(TaskTag).where(TaskTag.task_id == task.id)
        old_task_tags = session.exec(statement).all()
        for old_task_tag in old_task_tags:
            session.delete(old_task_tag)
        session.commit()

        # Add new tags (similar to add_task)
        if task_input.tags:  # If not empty list
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
    else:
        # Tags not provided - preserve existing tags
        statement = select(TaskTag).where(TaskTag.task_id == task.id)
        task_tags = session.exec(statement).all()
        for task_tag in task_tags:
            statement = select(Tag).where(Tag.id == task_tag.tag_id)
            tag = session.exec(statement).first()
            if tag:
                tag_names.append(tag.name)

    # Step 6: Persist task updates
    session.add(task)
    session.commit()
    session.refresh(task)

    # Step 7: Build output response
    return UpdateTaskOutput(
        id=task.id,
        title=task.title,
        description=task.description,
        priority=task.priority,
        status=task.status,
        due_date=task.due_date,
        tags=sorted(tag_names),  # Return tags in alphabetical order
        updated_at=task.updated_at,
        message=f"Task '{task.title}' successfully updated.",
    )
