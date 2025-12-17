"""
Test suite for Task CRUD API endpoints.

Tests for User Story 2 (Create and View Tasks) and User Story 3 (Update and Delete).

CRITICAL: 100% test coverage required for user isolation and authorization.
All tests must verify:
1. JWT token verification (get_current_user)
2. Authorization check (user_id from token matches URL user_id)
3. Data filtering by token user_id (NEVER by URL user_id)
"""

import pytest
from datetime import datetime
from fastapi import HTTPException
from httpx import AsyncClient
from sqlmodel import Session, select

from src.api.models import Task, TaskStatus, TaskPriority, TaskRecurrence


# ============================================================================
# User Story 2: Create and View Tasks (T054-T060)
# ============================================================================


@pytest.mark.asyncio
async def test_list_tasks_returns_only_user_tasks(
    client: AsyncClient,
    test_jwt_token: str,
    test_user_2_jwt_token: str,
    test_db_session: Session,
):
    """
    T054: Test that GET /api/{user_id}/tasks returns only the authenticated user's tasks.

    CRITICAL SECURITY TEST: User isolation

    Scenario:
    - User A (test_user_123) creates 2 tasks
    - User B (test_user_456) creates 1 task
    - User A requests their tasks
    - Should return ONLY User A's 2 tasks, never User B's task

    This verifies:
    - Database query filters by token user_id (not URL user_id)
    - No data leakage between users
    - Authorization check passes when user_id matches token
    """
    # Create tasks for User A (test_user_123)
    task_a1 = Task(
        user_id="test_user_123",
        title="User A Task 1",
        description="This belongs to User A",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.HIGH,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    task_a2 = Task(
        user_id="test_user_123",
        title="User A Task 2",
        description="This also belongs to User A",
        status=TaskStatus.COMPLETE,
        priority=TaskPriority.MEDIUM,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    # Create task for User B (test_user_456)
    task_b1 = Task(
        user_id="test_user_456",
        title="User B Task 1",
        description="This belongs to User B",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.LOW,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    test_db_session.add_all([task_a1, task_a2, task_b1])
    test_db_session.commit()

    # User A requests their tasks (with User A's JWT token)
    response = await client.get(
        "/api/test_user_123/tasks",
        headers={"Authorization": f"Bearer {test_jwt_token}"}
    )

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    tasks = response.json()
    assert isinstance(tasks, list), "Response should be a list of tasks"
    assert len(tasks) == 2, f"User A should have exactly 2 tasks, got {len(tasks)}"

    # Verify all returned tasks belong to User A
    task_titles = [task["title"] for task in tasks]
    assert "User A Task 1" in task_titles
    assert "User A Task 2" in task_titles
    assert "User B Task 1" not in task_titles, "SECURITY VIOLATION: User B's task leaked to User A"

    # Verify all tasks have correct user_id
    for task in tasks:
        assert task["user_id"] == "test_user_123", "All tasks must belong to test_user_123"


@pytest.mark.asyncio
async def test_create_task_uses_token_user_id(
    client: AsyncClient,
    test_jwt_token: str,
    test_db_session: Session,
):
    """
    T055: Test that POST /api/{user_id}/tasks creates task with token user_id, not URL user_id.

    CRITICAL SECURITY TEST: Token user_id enforcement

    Scenario:
    - User A (test_user_123) has valid JWT token
    - User A sends request to /api/test_user_123/tasks (matching)
    - Task should be created with user_id from token (test_user_123)

    Attack scenario prevented:
    - Attacker tries to create task for another user by changing URL
    - Authorization check should reject mismatched user_id (tested separately)
    - If bypassed, task MUST still use token user_id (defense in depth)
    """
    task_data = {
        "title": "Test Task",
        "description": "This should use token user_id",
        "priority": "HIGH",
    }

    response = await client.post(
        "/api/test_user_123/tasks",
        json=task_data,
        headers={"Authorization": f"Bearer {test_jwt_token}"}
    )

    assert response.status_code == 201, f"Expected 201, got {response.status_code}"

    created_task = response.json()
    assert created_task["title"] == "Test Task"
    assert created_task["user_id"] == "test_user_123", "Task must use token user_id"

    # Verify in database
    statement = select(Task).where(Task.title == "Test Task")
    db_task = test_db_session.exec(statement).first()

    assert db_task is not None, "Task should exist in database"
    assert db_task.user_id == "test_user_123", "Database task must have token user_id"


@pytest.mark.asyncio
async def test_create_task_validation_missing_title(
    client: AsyncClient,
    test_jwt_token: str,
):
    """
    T056: Test that POST /api/{user_id}/tasks returns 400 when title is missing.

    Validation test: Title is required field
    """
    task_data = {
        "description": "Task without title",
        "priority": "MEDIUM",
    }

    response = await client.post(
        "/api/test_user_123/tasks",
        json=task_data,
        headers={"Authorization": f"Bearer {test_jwt_token}"}
    )

    assert response.status_code == 400, f"Expected 400 for missing title, got {response.status_code}"

    error = response.json()
    assert "title" in error["detail"].lower(), "Error should mention missing title"


@pytest.mark.asyncio
async def test_get_task_by_id_own_task(
    client: AsyncClient,
    test_jwt_token: str,
    test_db_session: Session,
):
    """
    T057: Test that GET /api/{user_id}/tasks/{task_id} returns 200 for user's own task.

    Scenario:
    - User A creates a task
    - User A requests their own task by ID
    - Should return 200 with task details
    """
    # Create task for User A
    task = Task(
        user_id="test_user_123",
        title="User A's Task",
        description="This is User A's task",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.MEDIUM,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)

    # User A requests their own task
    response = await client.get(
        f"/api/test_user_123/tasks/{task.id}",
        headers={"Authorization": f"Bearer {test_jwt_token}"}
    )

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    returned_task = response.json()
    assert returned_task["id"] == task.id
    assert returned_task["title"] == "User A's Task"
    assert returned_task["user_id"] == "test_user_123"


@pytest.mark.asyncio
async def test_get_task_by_id_other_user_returns_403(
    client: AsyncClient,
    test_jwt_token: str,
    test_user_2_jwt_token: str,
    test_db_session: Session,
):
    """
    T058: Test that GET /api/{user_id}/tasks/{task_id} returns 403 for another user's task.

    CRITICAL SECURITY TEST: Cross-user access prevention

    Scenario:
    - User B (test_user_456) creates a task
    - User A (test_user_123) tries to access User B's task
    - Should return 403 Forbidden (authorization check fails)
    OR 404 Not Found (task doesn't exist in User A's filtered query)

    Attack scenario prevented:
    - User A knows task ID from another user
    - User A tries to access by guessing/enumerating IDs
    - System must prevent access (403 or 404, both acceptable)
    """
    # Create task for User B
    task = Task(
        user_id="test_user_456",
        title="User B's Private Task",
        description="User A should NOT see this",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.HIGH,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)

    # User A tries to access User B's task
    # First try: User A uses their own user_id in URL (authorization check passes)
    # But database query should filter by token user_id, so task not found
    response = await client.get(
        f"/api/test_user_123/tasks/{task.id}",
        headers={"Authorization": f"Bearer {test_jwt_token}"}
    )

    # Should return 404 (task doesn't exist for this user) or 403 (forbidden)
    assert response.status_code in [403, 404], \
        f"Expected 403 or 404 when accessing another user's task, got {response.status_code}"

    if response.status_code == 404:
        assert "not found" in response.json()["detail"].lower()
    elif response.status_code == 403:
        assert "denied" in response.json()["detail"].lower() or \
               "forbidden" in response.json()["detail"].lower()


# ============================================================================
# User Story 3: Update and Delete Tasks (T076-T080)
# ============================================================================


@pytest.mark.asyncio
async def test_update_task_own_task(
    client: AsyncClient,
    test_jwt_token: str,
    test_db_session: Session,
):
    """
    T076: Test that PUT /api/{user_id}/tasks/{task_id} returns 200 for user's own task.

    Scenario:
    - User A creates a task
    - User A updates their own task
    - Should return 200 with updated task
    """
    # Create task for User A
    task = Task(
        user_id="test_user_123",
        title="Original Title",
        description="Original description",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.LOW,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)

    # User A updates their task
    update_data = {
        "title": "Updated Title",
        "description": "Updated description",
        "priority": "HIGH",
    }

    response = await client.put(
        f"/api/test_user_123/tasks/{task.id}",
        json=update_data,
        headers={"Authorization": f"Bearer {test_jwt_token}"}
    )

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    updated_task = response.json()
    assert updated_task["id"] == task.id
    assert updated_task["title"] == "Updated Title"
    assert updated_task["description"] == "Updated description"
    assert updated_task["priority"] == "HIGH"
    assert updated_task["user_id"] == "test_user_123"


@pytest.mark.asyncio
async def test_update_task_other_user_returns_403(
    client: AsyncClient,
    test_jwt_token: str,
    test_db_session: Session,
):
    """
    T077: Test that PUT /api/{user_id}/tasks/{task_id} returns 403 for another user's task.

    CRITICAL SECURITY TEST: Cross-user update prevention

    Scenario:
    - User B creates a task
    - User A tries to update User B's task
    - Should return 403 Forbidden or 404 Not Found
    """
    # Create task for User B
    task = Task(
        user_id="test_user_456",
        title="User B's Task",
        description="User A should not modify this",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.MEDIUM,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)

    # User A tries to update User B's task
    update_data = {
        "title": "Malicious Update",
    }

    response = await client.put(
        f"/api/test_user_123/tasks/{task.id}",
        json=update_data,
        headers={"Authorization": f"Bearer {test_jwt_token}"}
    )

    assert response.status_code in [403, 404], \
        f"Expected 403 or 404 when updating another user's task, got {response.status_code}"

    # Verify task was NOT modified
    test_db_session.refresh(task)
    assert task.title == "User B's Task", "Task should not be modified"


@pytest.mark.asyncio
async def test_delete_task_own_task(
    client: AsyncClient,
    test_jwt_token: str,
    test_db_session: Session,
):
    """
    T078: Test that DELETE /api/{user_id}/tasks/{task_id} returns 200 for user's own task.

    Scenario:
    - User A creates a task
    - User A deletes their own task
    - Should return 200 and task should be deleted from database
    """
    # Create task for User A
    task = Task(
        user_id="test_user_123",
        title="Task to Delete",
        description="This will be deleted",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.LOW,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)
    task_id = task.id

    # User A deletes their task
    response = await client.delete(
        f"/api/test_user_123/tasks/{task_id}",
        headers={"Authorization": f"Bearer {test_jwt_token}"}
    )

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    # Verify task is deleted from database
    statement = select(Task).where(Task.id == task_id)
    deleted_task = test_db_session.exec(statement).first()
    assert deleted_task is None, "Task should be deleted from database"


@pytest.mark.asyncio
async def test_delete_task_other_user_returns_403(
    client: AsyncClient,
    test_jwt_token: str,
    test_db_session: Session,
):
    """
    T079: Test that DELETE /api/{user_id}/tasks/{task_id} returns 403 for another user's task.

    CRITICAL SECURITY TEST: Cross-user delete prevention

    Scenario:
    - User B creates a task
    - User A tries to delete User B's task
    - Should return 403 Forbidden or 404 Not Found
    - Task should remain in database
    """
    # Create task for User B
    task = Task(
        user_id="test_user_456",
        title="User B's Task",
        description="User A should not delete this",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.HIGH,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)
    task_id = task.id

    # User A tries to delete User B's task
    response = await client.delete(
        f"/api/test_user_123/tasks/{task_id}",
        headers={"Authorization": f"Bearer {test_jwt_token}"}
    )

    assert response.status_code in [403, 404], \
        f"Expected 403 or 404 when deleting another user's task, got {response.status_code}"

    # Verify task still exists in database
    statement = select(Task).where(Task.id == task_id)
    existing_task = test_db_session.exec(statement).first()
    assert existing_task is not None, "Task should still exist in database"
    assert existing_task.title == "User B's Task", "Task should be unchanged"


# ============================================================================
# User Story 4: Mark Tasks Complete/Incomplete (T091-T093)
# ============================================================================


@pytest.mark.asyncio
async def test_toggle_task_status_complete(
    client: AsyncClient,
    test_jwt_token: str,
    test_db_session: Session,
):
    """
    T091: Test that PATCH /api/{user_id}/tasks/{task_id}/status marks task complete.

    Scenario:
    - User A creates an incomplete task
    - User A toggles status to COMPLETE
    - Task status should be COMPLETE
    - completed_at should be set to current timestamp

    This verifies:
    - Status toggle endpoint works
    - completed_at is set when marking complete
    - Status persists in database
    """
    # Create incomplete task for User A
    task = Task(
        user_id="test_user_123",
        title="Task to Complete",
        description="This will be marked complete",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.MEDIUM,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)

    # Mark task as complete
    response = await client.patch(
        f"/api/test_user_123/tasks/{task.id}/status",
        json={"status": "COMPLETE"},
        headers={"Authorization": f"Bearer {test_jwt_token}"}
    )

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    updated_task = response.json()
    assert updated_task["id"] == task.id
    assert updated_task["status"] == "COMPLETE"
    assert updated_task["completed_at"] is not None, "completed_at should be set"

    # Verify in database
    test_db_session.refresh(task)
    assert task.status == TaskStatus.COMPLETE
    assert task.completed_at is not None


@pytest.mark.asyncio
async def test_toggle_task_status_incomplete(
    client: AsyncClient,
    test_jwt_token: str,
    test_db_session: Session,
):
    """
    T092: Test that PATCH /api/{user_id}/tasks/{task_id}/status marks task incomplete.

    Scenario:
    - User A creates a complete task (with completed_at set)
    - User A toggles status to INCOMPLETE
    - Task status should be INCOMPLETE
    - completed_at should be cleared (set to None)

    This verifies:
    - Status toggle endpoint works in reverse
    - completed_at is cleared when marking incomplete
    - Users can "uncomplete" tasks
    """
    # Create complete task for User A
    completed_time = datetime.utcnow()
    task = Task(
        user_id="test_user_123",
        title="Task to Mark Incomplete",
        description="This will be marked incomplete",
        status=TaskStatus.COMPLETE,
        priority=TaskPriority.HIGH,
        completed_at=completed_time,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)

    # Mark task as incomplete
    response = await client.patch(
        f"/api/test_user_123/tasks/{task.id}/status",
        json={"status": "INCOMPLETE"},
        headers={"Authorization": f"Bearer {test_jwt_token}"}
    )

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    updated_task = response.json()
    assert updated_task["id"] == task.id
    assert updated_task["status"] == "INCOMPLETE"
    assert updated_task["completed_at"] is None, "completed_at should be cleared"

    # Verify in database
    test_db_session.refresh(task)
    assert task.status == TaskStatus.INCOMPLETE
    assert task.completed_at is None


@pytest.mark.asyncio
async def test_toggle_status_other_user_returns_403(
    client: AsyncClient,
    test_jwt_token: str,
    test_db_session: Session,
):
    """
    T093: Test that PATCH /api/{user_id}/tasks/{task_id}/status returns 403 for another user's task.

    CRITICAL SECURITY TEST: Cross-user status toggle prevention

    Scenario:
    - User B creates a task
    - User A tries to toggle User B's task status
    - Should return 403 Forbidden or 404 Not Found
    - Task status should remain unchanged

    Attack scenario prevented:
    - User A tries to mark other users' tasks as complete
    - System must prevent cross-user status manipulation
    """
    # Create task for User B
    task = Task(
        user_id="test_user_456",
        title="User B's Task",
        description="User A should not toggle this",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.LOW,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)

    # User A tries to toggle User B's task status
    response = await client.patch(
        f"/api/test_user_123/tasks/{task.id}/status",
        json={"status": "COMPLETE"},
        headers={"Authorization": f"Bearer {test_jwt_token}"}
    )

    assert response.status_code in [403, 404], \
        f"Expected 403 or 404 when toggling another user's task, got {response.status_code}"

    # Verify task status unchanged
    test_db_session.refresh(task)
    assert task.status == TaskStatus.INCOMPLETE, "Task status should remain unchanged"
    assert task.completed_at is None, "completed_at should still be None"


# ============================================================================
# User Story 6: Assign Task Priority (T103-T104)
# ============================================================================


@pytest.mark.asyncio
async def test_create_task_with_priority(
    client: AsyncClient,
    test_jwt_token: str,
    test_db_session: Session,
):
    """
    T103: Test that tasks can be created with specific priority levels (HIGH, MEDIUM, LOW).

    Scenario:
    - User A creates a task with HIGH priority
    - Task should be created with priority set to HIGH
    - Priority should persist in database

    This verifies:
    - Priority field accepts HIGH/MEDIUM/LOW values
    - Priority is stored correctly in database
    """
    task_data = {
        "title": "High Priority Task",
        "description": "This task is urgent",
        "priority": "HIGH",
    }

    response = await client.post(
        "/api/test_user_123/tasks",
        json=task_data,
        headers={"Authorization": f"Bearer {test_jwt_token}"}
    )

    assert response.status_code == 201, f"Expected 201, got {response.status_code}"

    created_task = response.json()
    assert created_task["title"] == "High Priority Task"
    assert created_task["priority"] == "HIGH", "Priority should be HIGH"

    # Verify in database
    statement = select(Task).where(Task.title == "High Priority Task")
    db_task = test_db_session.exec(statement).first()

    assert db_task is not None, "Task should exist in database"
    assert db_task.priority == TaskPriority.HIGH, "Database task must have HIGH priority"


@pytest.mark.asyncio
async def test_priority_defaults_to_medium(
    client: AsyncClient,
    test_jwt_token: str,
    test_db_session: Session,
):
    """
    T104: Test that tasks without explicit priority default to MEDIUM.

    Scenario:
    - User A creates a task without specifying priority
    - Task should default to MEDIUM priority
    - Default priority should persist in database

    This verifies:
    - Priority field has correct default value
    - MEDIUM is the sensible default for new tasks
    """
    task_data = {
        "title": "Task Without Priority",
        "description": "No priority specified",
    }

    response = await client.post(
        "/api/test_user_123/tasks",
        json=task_data,
        headers={"Authorization": f"Bearer {test_jwt_token}"}
    )

    assert response.status_code == 201, f"Expected 201, got {response.status_code}"

    created_task = response.json()
    assert created_task["title"] == "Task Without Priority"
    assert created_task["priority"] == "MEDIUM", "Priority should default to MEDIUM"

    # Verify in database
    statement = select(Task).where(Task.title == "Task Without Priority")
    db_task = test_db_session.exec(statement).first()

    assert db_task is not None, "Task should exist in database"
    assert db_task.priority == TaskPriority.MEDIUM, "Database task must default to MEDIUM priority"
