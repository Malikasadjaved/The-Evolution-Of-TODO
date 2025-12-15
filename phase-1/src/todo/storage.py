"""In-memory storage for tasks with O(1) lookups."""

from datetime import datetime
from typing import Dict, List, Optional

from src.todo.models import Task, Priority, RecurrencePattern
from src.todo import scheduler
from src.todo import persistence

# Module state - in-memory storage
tasks: List[Task] = []
task_index: Dict[int, int] = {}  # {task_id: list_index} for O(1) lookup
next_task_id: int = 1


def create_task(
    title: str,
    description: str = "",
    priority: Priority = Priority.MEDIUM,
    tags: Optional[List[str]] = None,
    due_date: Optional[datetime] = None,
    recurrence: Optional[RecurrencePattern] = None,
    reminder_offset: Optional[float] = None,
) -> Task:
    """Create a new task with auto-generated ID.

    Args:
        title: Task title (required, non-empty)
        description: Task description (optional)
        priority: Priority level (default MEDIUM)
        tags: List of tags (default empty list)
        due_date: Optional due date/time
        recurrence: Optional recurrence pattern
        reminder_offset: Optional reminder time in hours before due_date

    Returns:
        Created Task object with auto-generated ID

    Raises:
        ValueError: If title is empty or validation fails
    """
    global next_task_id

    if tags is None:
        tags = []

    task = Task(
        id=next_task_id,
        title=title,
        description=description,
        priority=priority,
        tags=tags,
        due_date=due_date,
        recurrence=recurrence,
        reminder_offset=reminder_offset,
    )

    tasks.append(task)
    task_index[task.id] = len(tasks) - 1
    next_task_id += 1

    # Auto-save after creation (User Story 2)
    persistence.save_tasks(tasks)

    return task


def get_task(task_id: int) -> Optional[Task]:
    """Retrieve task by ID using O(1) lookup.

    Args:
        task_id: Task identifier

    Returns:
        Task object if found, None otherwise
    """
    idx = task_index.get(task_id)
    if idx is not None and 0 <= idx < len(tasks):
        return tasks[idx]
    return None


def get_all_tasks() -> List[Task]:
    """Retrieve all tasks.

    Returns:
        List of all Task objects (may be empty)
    """
    return tasks


def update_task(task_id: int, **updates) -> bool:
    """Update task fields by ID.

    Args:
        task_id: Task identifier
        **updates: Keyword arguments for fields to update

    Returns:
        True if task updated, False if task not found

    Raises:
        ValueError: If updates violate validation rules
    """
    idx = task_index.get(task_id)
    if idx is None:
        return False

    task = tasks[idx]

    # Apply updates
    for key, value in updates.items():
        if hasattr(task, key):
            setattr(task, key, value)

    # Re-validate task (will raise ValueError if invalid)
    task.__post_init__()

    # Auto-save after update (User Story 2)
    persistence.save_tasks(tasks)

    return True


def delete_task(task_id: int) -> bool:
    """Delete task by ID and rebuild index.

    Args:
        task_id: Task identifier

    Returns:
        True if task deleted, False if task not found
    """
    idx = task_index.get(task_id)
    if idx is None:
        return False

    # Remove task from list
    del tasks[idx]

    # Rebuild index for all remaining tasks
    task_index.clear()
    for i, task in enumerate(tasks):
        task_index[task.id] = i

    # Auto-save after deletion (User Story 2)
    persistence.save_tasks(tasks)

    return True


def mark_complete(task_id: int) -> Optional[Task]:
    """Mark task as complete.

    Args:
        task_id: Task identifier

    Returns:
        New recurring task instance if task has recurrence pattern,
        None if task has no recurrence or task not found

    Side Effects:
        Sets task.status = "complete"
        Sets task.completed_date = datetime.now()
        If recurrence pattern set: Creates new task instance
    """
    task = get_task(task_id)
    if task is None:
        return None

    # Mark current task as complete
    task.status = "complete"
    task.completed_date = datetime.now()

    # If recurring, create new instance
    if task.recurrence and task.due_date:
        new_task = scheduler.create_recurring_instance(task, next_task_id)
        tasks.append(new_task)
        task_index[new_task.id] = len(tasks) - 1
        globals()["next_task_id"] += 1

        # Auto-save after marking complete + creating recurring instance (User Story 2)
        persistence.save_tasks(tasks)
        return new_task

    # Auto-save after marking complete (User Story 2)
    persistence.save_tasks(tasks)
    return None


def mark_incomplete(task_id: int) -> bool:
    """Mark task as incomplete.

    Args:
        task_id: Task identifier

    Returns:
        True if task updated, False if task not found

    Side Effects:
        Sets task.status = "incomplete"
        Clears task.completed_date = None
    """
    task = get_task(task_id)
    if task is None:
        return False

    task.status = "incomplete"
    task.completed_date = None

    # Auto-save after marking incomplete (User Story 2)
    persistence.save_tasks(tasks)

    return True
