"""
Task management API endpoints.

All endpoints require JWT authentication and enforce user isolation.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select
from typing import Optional
import json
from datetime import datetime

from ..models import (
    Task, TaskCreate, TaskUpdate, TaskResponse, Priority, RecurrencePattern
)
from ..db import get_session
from ..auth import get_current_user, verify_user_access, CurrentUser

router = APIRouter(prefix="/api", tags=["tasks"])


@router.get("/{user_id}/tasks", response_model=list[TaskResponse])
def get_tasks(
    user_id: str,
    status_filter: Optional[str] = Query(None, alias="status"),
    priority_filter: Optional[Priority] = Query(None, alias="priority"),
    sort_by: Optional[str] = Query("created", alias="sort"),
    current_user: CurrentUser = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Get all tasks for the authenticated user.

    Query Parameters:
    - status: "all" | "pending" | "completed"
    - priority: "HIGH" | "MEDIUM" | "LOW"
    - sort: "created" | "title" | "due_date" | "priority"
    """
    # Verify user has access
    verify_user_access(user_id, current_user)

    # Build query
    statement = select(Task).where(Task.user_id == user_id)

    # Apply status filter
    if status_filter == "completed":
        statement = statement.where(Task.completed == True)
    elif status_filter == "pending":
        statement = statement.where(Task.completed == False)

    # Apply priority filter
    if priority_filter:
        statement = statement.where(Task.priority == priority_filter)

    # Apply sorting
    if sort_by == "title":
        statement = statement.order_by(Task.title)
    elif sort_by == "due_date":
        statement = statement.order_by(Task.due_date.desc())
    elif sort_by == "priority":
        # Custom priority order: HIGH > MEDIUM > LOW
        statement = statement.order_by(
            Task.priority.desc()
        )
    else:  # Default: created
        statement = statement.order_by(Task.created_at.desc())

    # Execute query
    tasks = session.exec(statement).all()

    # Convert to response models
    return [TaskResponse.from_task(task) for task in tasks]


@router.post("/{user_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    user_id: str,
    task_data: TaskCreate,
    current_user: CurrentUser = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Create a new task for the authenticated user."""
    # Verify user has access
    verify_user_access(user_id, current_user)

    # Convert tags list to JSON string
    tags_json = json.dumps(task_data.tags) if task_data.tags else "[]"

    # Create task
    task = Task(
        user_id=user_id,
        title=task_data.title,
        description=task_data.description,
        priority=task_data.priority,
        tags=tags_json,
        due_date=task_data.due_date,
        task_type=task_data.task_type,
        recurrence_pattern=task_data.recurrence_pattern,
    )

    session.add(task)
    session.commit()
    session.refresh(task)

    return TaskResponse.from_task(task)


@router.get("/{user_id}/tasks/{task_id}", response_model=TaskResponse)
def get_task(
    user_id: str,
    task_id: int,
    current_user: CurrentUser = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get a specific task by ID."""
    # Verify user has access
    verify_user_access(user_id, current_user)

    # Get task
    task = session.get(Task, task_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found"
        )

    # Verify task belongs to user
    if task.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this task"
        )

    return TaskResponse.from_task(task)


@router.put("/{user_id}/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    user_id: str,
    task_id: int,
    task_data: TaskUpdate,
    current_user: CurrentUser = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update a task."""
    # Verify user has access
    verify_user_access(user_id, current_user)

    # Get task
    task = session.get(Task, task_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found"
        )

    # Verify task belongs to user
    if task.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update this task"
        )

    # Update fields
    if task_data.title is not None:
        task.title = task_data.title
    if task_data.description is not None:
        task.description = task_data.description
    if task_data.priority is not None:
        task.priority = task_data.priority
    if task_data.tags is not None:
        task.tags = json.dumps(task_data.tags)
    if task_data.due_date is not None:
        task.due_date = task_data.due_date
    if task_data.task_type is not None:
        task.task_type = task_data.task_type
    if task_data.recurrence_pattern is not None:
        task.recurrence_pattern = task_data.recurrence_pattern

    task.updated_at = datetime.utcnow()

    session.add(task)
    session.commit()
    session.refresh(task)

    return TaskResponse.from_task(task)


@router.delete("/{user_id}/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    user_id: str,
    task_id: int,
    current_user: CurrentUser = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Delete a task."""
    # Verify user has access
    verify_user_access(user_id, current_user)

    # Get task
    task = session.get(Task, task_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found"
        )

    # Verify task belongs to user
    if task.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this task"
        )

    session.delete(task)
    session.commit()


@router.patch("/{user_id}/tasks/{task_id}/complete", response_model=TaskResponse)
def toggle_task_completion(
    user_id: str,
    task_id: int,
    current_user: CurrentUser = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Toggle task completion status."""
    # Verify user has access
    verify_user_access(user_id, current_user)

    # Get task
    task = session.get(Task, task_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found"
        )

    # Verify task belongs to user
    if task.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this task"
        )

    # Toggle completion
    task.completed = not task.completed

    if task.completed:
        task.completed_at = datetime.utcnow()
    else:
        task.completed_at = None

    task.updated_at = datetime.utcnow()

    session.add(task)
    session.commit()
    session.refresh(task)

    return TaskResponse.from_task(task)


@router.get("/{user_id}/tasks/search", response_model=list[TaskResponse])
def search_tasks(
    user_id: str,
    keyword: str = Query(..., min_length=1),
    current_user: CurrentUser = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Search tasks by keyword in title or description.

    Query Parameters:
    - keyword: Search term (case-insensitive)
    """
    # Verify user has access
    verify_user_access(user_id, current_user)

    # Search in title and description
    keyword_pattern = f"%{keyword}%"
    statement = select(Task).where(
        Task.user_id == user_id,
        (Task.title.ilike(keyword_pattern) | Task.description.ilike(keyword_pattern))
    )

    tasks = session.exec(statement).all()

    return [TaskResponse.from_task(task) for task in tasks]
