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
from sqlmodel import Session, select

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
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> List[Task]:
    """
    List all tasks for the authenticated user.

    Security:
    - Requires valid JWT token
    - user_id must match token user_id
    - Filters by token user_id (not URL user_id)
    """
    # Authorization check
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Access denied")

    # Fetch tasks (filter by token user_id)
    statement = select(Task).where(Task.user_id == current_user)
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
    statement = select(Task).where(
        Task.id == task_id, Task.user_id == current_user
    )
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

    # Create task
    task = Task(
        user_id=current_user,  # CRITICAL: Use token user_id
        title=request["title"],
        description=request.get("description"),
        priority=request.get("priority", TaskPriority.MEDIUM),
        due_date=request.get("due_date"),
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
    statement = select(Task).where(
        Task.id == task_id, Task.user_id == current_user
    )
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
        task.due_date = request["due_date"]
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
    statement = select(Task).where(
        Task.id == task_id, Task.user_id == current_user
    )
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
    statement = select(Task).where(
        Task.id == task_id, Task.user_id == current_user
    )
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
    else:
        task.completed_at = None

    task.updated_at = datetime.utcnow()

    session.add(task)
    session.commit()
    session.refresh(task)

    return task
