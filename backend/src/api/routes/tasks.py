"""
Task CRUD API Routes

RESTful endpoints for task management with JWT authentication.

CRITICAL: 100% test coverage required.
All endpoints must:
1. Verify JWT token (get_current_user)
2. Check authorization (user_id from token matches URL user_id)
3. Filter data by token user_id (NEVER by URL user_id)
"""

from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, case

from ..auth import get_current_user
from ..db import get_session
from ..models import Task, TaskStatus, TaskPriority, TaskRecurrence

router = APIRouter()


# ============================================================================
# Request/Response Models
# ============================================================================


class CreateTaskRequest:
    """Request body for creating a task"""

    title: str
    description: str | None = None
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: str | None = None
    tags: List[str] = []
    recurrence: TaskRecurrence = TaskRecurrence.NONE


class UpdateTaskRequest:
    """Request body for updating a task"""

    title: str | None = None
    description: str | None = None
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    due_date: str | None = None
    tags: List[str] | None = None
    recurrence: TaskRecurrence | None = None


# ============================================================================
# GET /api/{user_id}/tasks - List all tasks
# ============================================================================


@router.get("/api/{user_id}/tasks")
async def list_tasks(
    user_id: str,
    search: str | None = None,
    status: TaskStatus | None = None,
    priority: TaskPriority | None = None,
    tags: str | None = None,
    sort: str | None = None,
    order: str = "asc",
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> List[Task]:
    """
    List all tasks for the authenticated user.

    Query Parameters:
    - search: Optional keyword to filter tasks by title or description (case-insensitive)
    - status: Optional status filter (INCOMPLETE, COMPLETE)
    - priority: Optional priority filter (LOW, MEDIUM, HIGH)
    - tags: Optional comma-separated tags filter (OR logic - any tag matches)
    - sort: Optional sort field (due_date, priority, created_at, title)
    - order: Sort order (asc or desc, default: asc)

    Security:
    - Requires valid JWT token
    - user_id must match token user_id
    - Filters by token user_id (not URL user_id)
    """
    # Authorization check
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Access denied")

    # Build query (filter by token user_id)
    statement = select(Task).where(Task.user_id == current_user)

    # Add search filter if provided (case-insensitive search in title and description)
    if search:
        search_pattern = f"%{search}%"
        statement = statement.where(
            (Task.title.ilike(search_pattern)) | (Task.description.ilike(search_pattern))
        )

    # Add status filter if provided
    if status:
        statement = statement.where(Task.status == status)

    # Add priority filter if provided
    if priority:
        statement = statement.where(Task.priority == priority)

    # Add tags filter if provided (OR logic - task has ANY of the specified tags)
    if tags:
        from ..models import Tag, TaskTag

        tag_list = [tag.strip() for tag in tags.split(",")]

        # Join with TaskTag and Tag to filter by tag names
        # Find task IDs that have any of the specified tags
        tag_subquery = (
            select(TaskTag.task_id)
            .join(Tag, TaskTag.tag_id == Tag.id)
            .where(Tag.name.in_(tag_list))
            .where(Tag.user_id == current_user)
        )

        statement = statement.where(Task.id.in_(tag_subquery))

    # Add sorting if provided
    if sort:
        # For priority sorting, default to descending (HIGH first) for better UX
        # For other fields, default to ascending
        effective_order = order
        if sort == "priority" and order == "asc":
            # No explicit order provided for priority, default to descending
            effective_order = "desc"

        if sort == "due_date":
            # Sort by due_date with NULLS LAST for ascending, NULLS LAST for descending
            if order == "desc":
                statement = statement.order_by(Task.due_date.desc().nullslast())
            else:
                statement = statement.order_by(Task.due_date.asc().nullslast())

        elif sort == "priority":
            # Sort by priority: HIGH (3) → MEDIUM (2) → LOW (1)
            # Use CASE to map priority strings to numeric values for proper sorting
            # Default to descending (HIGH first) for better UX
            priority_order = case(
                (Task.priority == TaskPriority.HIGH, 3),
                (Task.priority == TaskPriority.MEDIUM, 2),
                (Task.priority == TaskPriority.LOW, 1),
                else_=0,
            )
            # Use effective_order which defaults to "desc" for priority
            if effective_order == "asc":
                statement = statement.order_by(priority_order.asc())
            else:
                statement = statement.order_by(priority_order.desc())

        elif sort == "created_at":
            if order == "desc":
                statement = statement.order_by(Task.created_at.desc())
            else:
                statement = statement.order_by(Task.created_at.asc())

        elif sort == "title":
            if order == "desc":
                statement = statement.order_by(Task.title.desc())
            else:
                statement = statement.order_by(Task.title.asc())

    tasks = session.exec(statement).all()

    return list(tasks)


# ============================================================================
# GET /api/{user_id}/tasks/{task_id} - Get single task
# ============================================================================


@router.get("/api/{user_id}/tasks/{task_id}")
async def get_task(
    user_id: str,
    task_id: int,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> Task:
    """
    Get a single task by ID.

    Security:
    - Requires valid JWT token
    - user_id must match token user_id
    - Task must belong to token user_id
    """
    # Authorization check
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Access denied")

    # Fetch task
    statement = select(Task).where(Task.id == task_id, Task.user_id == current_user)
    task = session.exec(statement).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return task


# ============================================================================
# POST /api/{user_id}/tasks - Create task
# ============================================================================


@router.post("/api/{user_id}/tasks", status_code=201)
async def create_task(
    user_id: str,
    request: dict,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> Task:
    """
    Create a new task.

    Security:
    - Requires valid JWT token
    - user_id must match token user_id
    - Task created with token user_id
    """
    # Authorization check
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Access denied")

    # Validate required fields
    if "title" not in request or not request["title"]:
        raise HTTPException(status_code=400, detail="Title is required")

    # Parse due_date if present (convert ISO string to datetime)
    due_date = None
    if "due_date" in request and request["due_date"]:
        try:
            due_date = datetime.fromisoformat(request["due_date"].replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            raise HTTPException(
                status_code=400, detail="Invalid due_date format. Use ISO 8601 format."
            )

    # Create task
    task = Task(
        user_id=current_user,  # CRITICAL: Use token user_id
        title=request["title"],
        description=request.get("description"),
        priority=request.get("priority", TaskPriority.MEDIUM),
        due_date=due_date,
        recurrence=request.get("recurrence", TaskRecurrence.NONE),
        status=TaskStatus.INCOMPLETE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    session.add(task)
    session.commit()
    session.refresh(task)

    return task


# ============================================================================
# PUT /api/{user_id}/tasks/{task_id} - Update task
# ============================================================================


@router.put("/api/{user_id}/tasks/{task_id}")
async def update_task(
    user_id: str,
    task_id: int,
    request: dict,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> Task:
    """
    Update an existing task.

    Security:
    - Requires valid JWT token
    - user_id must match token user_id
    - Task must belong to token user_id
    """
    # Authorization check
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Access denied")

    # Fetch task
    statement = select(Task).where(Task.id == task_id, Task.user_id == current_user)
    task = session.exec(statement).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Update fields
    if "title" in request:
        task.title = request["title"]
    if "description" in request:
        task.description = request["description"]
    if "status" in request:
        task.status = request["status"]
        if request["status"] == TaskStatus.COMPLETE:
            task.last_completed_at = datetime.utcnow()
    if "priority" in request:
        task.priority = request["priority"]
    if "due_date" in request:
        # Parse due_date if present (convert ISO string to datetime)
        if request["due_date"]:
            try:
                task.due_date = datetime.fromisoformat(request["due_date"].replace("Z", "+00:00"))
            except (ValueError, AttributeError):
                raise HTTPException(
                    status_code=400, detail="Invalid due_date format. Use ISO 8601 format."
                )
        else:
            task.due_date = None
    if "recurrence" in request:
        task.recurrence = request["recurrence"]

    task.updated_at = datetime.utcnow()

    session.add(task)
    session.commit()
    session.refresh(task)

    return task


# ============================================================================
# DELETE /api/{user_id}/tasks/{task_id} - Delete task
# ============================================================================


@router.delete("/api/{user_id}/tasks/{task_id}")
async def delete_task(
    user_id: str,
    task_id: int,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> dict:
    """
    Delete a task.

    Security:
    - Requires valid JWT token
    - user_id must match token user_id
    - Task must belong to token user_id
    """
    # Authorization check
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Access denied")

    # Fetch task
    statement = select(Task).where(Task.id == task_id, Task.user_id == current_user)
    task = session.exec(statement).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Delete task
    session.delete(task)
    session.commit()

    return {"message": "Task deleted successfully"}


# ============================================================================
# PATCH /api/{user_id}/tasks/{task_id}/status - Toggle status
# ============================================================================


@router.patch("/api/{user_id}/tasks/{task_id}/status")
async def toggle_task_status(
    user_id: str,
    task_id: int,
    request: dict,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> Task:
    """
    Toggle task status (INCOMPLETE ↔ COMPLETE).

    Security:
    - Requires valid JWT token
    - user_id must match token user_id
    - Task must belong to token user_id
    """
    # Authorization check
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Access denied")

    # Fetch task
    statement = select(Task).where(Task.id == task_id, Task.user_id == current_user)
    task = session.exec(statement).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Update status
    if "status" not in request:
        raise HTTPException(status_code=400, detail="Status is required")

    task.status = request["status"]

    # Set or clear completed_at based on status
    if request["status"] == TaskStatus.COMPLETE:
        task.completed_at = datetime.utcnow()

        # Handle recurring tasks
        if task.recurrence != TaskRecurrence.NONE:
            from datetime import timedelta

            # Save completion time
            task.last_completed_at = datetime.utcnow()

            # Calculate next due_date based on recurrence type
            if task.due_date:
                if task.recurrence == TaskRecurrence.DAILY:
                    task.due_date = task.due_date + timedelta(days=1)
                elif task.recurrence == TaskRecurrence.WEEKLY:
                    task.due_date = task.due_date + timedelta(days=7)
                elif task.recurrence == TaskRecurrence.MONTHLY:
                    task.due_date = task.due_date + timedelta(days=30)
                elif task.recurrence == TaskRecurrence.YEARLY:
                    task.due_date = task.due_date + timedelta(days=365)

            # Reset status to INCOMPLETE for next occurrence
            task.status = TaskStatus.INCOMPLETE
            task.completed_at = None  # Clear completed_at since it's now incomplete again
    else:
        task.completed_at = None

    task.updated_at = datetime.utcnow()

    session.add(task)
    session.commit()
    session.refresh(task)

    return task


# ============================================================================
# PATCH /api/{user_id}/tasks/{task_id}/complete - Mark task as complete
# ============================================================================


@router.patch("/api/{user_id}/tasks/{task_id}/complete")
async def mark_task_complete(
    user_id: str,
    task_id: int,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> Task:
    """
    Mark a task as complete (as per Phase II documentation).

    This endpoint toggles task completion status:
    - If INCOMPLETE → Mark as COMPLETE
    - If COMPLETE → Mark as INCOMPLETE

    Security:
    - Requires valid JWT token
    - user_id must match token user_id
    - Task must belong to token user_id

    Returns:
        Task: Updated task object
    """
    # Authorization check
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Access denied")

    # Fetch task (filter by token user_id)
    statement = select(Task).where(Task.id == task_id, Task.user_id == current_user)
    task = session.exec(statement).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Toggle completion status
    if task.status == TaskStatus.INCOMPLETE:
        task.status = TaskStatus.COMPLETE
        task.completed_at = datetime.utcnow()

        # Handle recurring tasks
        if task.recurrence != TaskRecurrence.NONE:
            from datetime import timedelta

            # Save completion time
            task.last_completed_at = datetime.utcnow()

            # Calculate next due_date based on recurrence type
            if task.due_date:
                if task.recurrence == TaskRecurrence.DAILY:
                    task.due_date = task.due_date + timedelta(days=1)
                elif task.recurrence == TaskRecurrence.WEEKLY:
                    task.due_date = task.due_date + timedelta(days=7)
                elif task.recurrence == TaskRecurrence.MONTHLY:
                    task.due_date = task.due_date + timedelta(days=30)
                elif task.recurrence == TaskRecurrence.YEARLY:
                    task.due_date = task.due_date + timedelta(days=365)

            # Reset status to INCOMPLETE for next occurrence
            task.status = TaskStatus.INCOMPLETE
            task.completed_at = None
    else:
        # If already complete, toggle back to incomplete
        task.status = TaskStatus.INCOMPLETE
        task.completed_at = None

    task.updated_at = datetime.utcnow()

    session.add(task)
    session.commit()
    session.refresh(task)

    return task
