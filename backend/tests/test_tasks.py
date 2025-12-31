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
from httpx import AsyncClient
from sqlmodel import Session, select

from src.api.models import Task, TaskStatus, TaskPriority, Tag, TaskTag


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
        "/api/test_user_123/tasks", headers={"Authorization": f"Bearer {test_jwt_token}"}
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
        headers={"Authorization": f"Bearer {test_jwt_token}"},
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
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    assert (
        response.status_code == 400
    ), f"Expected 400 for missing title, got {response.status_code}"

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
        f"/api/test_user_123/tasks/{task.id}", headers={"Authorization": f"Bearer {test_jwt_token}"}
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
        f"/api/test_user_123/tasks/{task.id}", headers={"Authorization": f"Bearer {test_jwt_token}"}
    )

    # Should return 404 (task doesn't exist for this user) or 403 (forbidden)
    assert response.status_code in [
        403,
        404,
    ], f"Expected 403 or 404 when accessing another user's task, got {response.status_code}"

    if response.status_code == 404:
        assert "not found" in response.json()["detail"].lower()
    elif response.status_code == 403:
        assert (
            "denied" in response.json()["detail"].lower()
            or "forbidden" in response.json()["detail"].lower()
        )


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
        headers={"Authorization": f"Bearer {test_jwt_token}"},
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
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    assert response.status_code in [
        403,
        404,
    ], f"Expected 403 or 404 when updating another user's task, got {response.status_code}"

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
        f"/api/test_user_123/tasks/{task_id}", headers={"Authorization": f"Bearer {test_jwt_token}"}
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
        f"/api/test_user_123/tasks/{task_id}", headers={"Authorization": f"Bearer {test_jwt_token}"}
    )

    assert response.status_code in [
        403,
        404,
    ], f"Expected 403 or 404 when deleting another user's task, got {response.status_code}"

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
        headers={"Authorization": f"Bearer {test_jwt_token}"},
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
        headers={"Authorization": f"Bearer {test_jwt_token}"},
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
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    assert response.status_code in [
        403,
        404,
    ], f"Expected 403 or 404 when toggling another user's task, got {response.status_code}"

    # Verify task status unchanged
    test_db_session.refresh(task)
    assert task.status == TaskStatus.INCOMPLETE, "Task status should remain unchanged"
    assert task.completed_at is None, "completed_at should still be None"


@pytest.mark.asyncio
async def test_mark_task_complete_endpoint(
    client: AsyncClient,
    test_jwt_token: str,
    test_db_session: Session,
):
    """
    Test PATCH /api/{user_id}/tasks/{task_id}/complete endpoint (Phase II documentation requirement).

    Scenario:
    - User A creates an incomplete task
    - User A marks task complete using /complete endpoint
    - Task status should toggle to COMPLETE
    - completed_at should be set

    This verifies:
    - /complete endpoint matches Phase II documentation
    - Toggles between INCOMPLETE and COMPLETE
    - Sets completed_at timestamp correctly
    """
    # Create incomplete task for User A
    task = Task(
        user_id="test_user_123",
        title="Task for /complete endpoint",
        description="Testing documentation-compliant endpoint",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.MEDIUM,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)

    # Mark task as complete using /complete endpoint
    response = await client.patch(
        f"/api/test_user_123/tasks/{task.id}/complete",
        headers={"Authorization": f"Bearer {test_jwt_token}"},
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

    # Toggle back to incomplete
    response = await client.patch(
        f"/api/test_user_123/tasks/{task.id}/complete",
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    assert response.status_code == 200
    updated_task = response.json()
    assert updated_task["status"] == "INCOMPLETE"
    assert updated_task["completed_at"] is None


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
        headers={"Authorization": f"Bearer {test_jwt_token}"},
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
        headers={"Authorization": f"Bearer {test_jwt_token}"},
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


# ============================================================================
# User Story 8: Schedule with Due Dates (T125-T126)
# ============================================================================


@pytest.mark.asyncio
async def test_task_with_due_date(
    client: AsyncClient,
    test_jwt_token: str,
    test_db_session: Session,
):
    """
    T125: Test that tasks can be created with a due_date field.

    Scenario:
    - User A creates a task with a due_date set to tomorrow
    - Task should be created with due_date stored correctly
    - due_date should persist in database

    This verifies:
    - due_date field accepts ISO 8601 datetime strings
    - due_date is stored correctly in database
    - due_date is returned in API response
    """
    from datetime import timedelta

    # Set due date to tomorrow at 5:00 PM
    tomorrow = datetime.utcnow() + timedelta(days=1)
    due_date_str = tomorrow.isoformat()

    task_data = {
        "title": "Task with Due Date",
        "description": "This task has a deadline",
        "due_date": due_date_str,
    }

    response = await client.post(
        "/api/test_user_123/tasks",
        json=task_data,
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    assert response.status_code == 201, f"Expected 201, got {response.status_code}"

    created_task = response.json()
    assert created_task["title"] == "Task with Due Date"
    assert created_task["due_date"] is not None, "due_date should be present"

    # Verify in database
    statement = select(Task).where(Task.title == "Task with Due Date")
    db_task = test_db_session.exec(statement).first()

    assert db_task is not None, "Task should exist in database"
    assert db_task.due_date is not None, "Database task must have due_date"
    # Verify the date is approximately correct (within 1 minute due to serialization)
    time_diff = abs((db_task.due_date - tomorrow).total_seconds())
    assert time_diff < 60, f"due_date should match expected value (diff: {time_diff}s)"


@pytest.mark.asyncio
async def test_overdue_detection(
    client: AsyncClient,
    test_jwt_token: str,
    test_db_session: Session,
):
    """
    T126: Test that overdue tasks can be detected when due_date < now and status=INCOMPLETE.

    Scenario:
    - User A creates a task with due_date in the past
    - Task status is INCOMPLETE
    - API should return the task with due_date field
    - Frontend can detect overdue by comparing due_date < now

    This verifies:
    - Tasks with past due_dates can be created
    - due_date field is accessible for overdue detection
    - Overdue logic can be implemented on frontend
    """
    from datetime import timedelta

    # Set due date to yesterday (overdue)
    yesterday = datetime.utcnow() - timedelta(days=1)
    due_date_str = yesterday.isoformat()

    task_data = {
        "title": "Overdue Task",
        "description": "This task is past its deadline",
        "due_date": due_date_str,
        "status": "INCOMPLETE",
    }

    response = await client.post(
        "/api/test_user_123/tasks",
        json=task_data,
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    assert response.status_code == 201, f"Expected 201, got {response.status_code}"

    created_task = response.json()
    assert created_task["title"] == "Overdue Task"
    assert created_task["status"] == "INCOMPLETE"
    assert created_task["due_date"] is not None, "due_date should be present"

    # Verify in database
    statement = select(Task).where(Task.title == "Overdue Task")
    db_task = test_db_session.exec(statement).first()

    assert db_task is not None, "Task should exist in database"
    assert db_task.due_date is not None, "Database task must have due_date"
    assert db_task.status == TaskStatus.INCOMPLETE, "Task should be INCOMPLETE"

    # Verify task is overdue (due_date < now)
    now = datetime.utcnow()
    assert db_task.due_date < now, "Task should be overdue (due_date in the past)"


# ============================================================================
# User Story 9: Search Tasks by Keyword (T131-T132)
# ============================================================================


@pytest.mark.asyncio
async def test_search_by_keyword(
    client: AsyncClient,
    test_jwt_token: str,
    test_db_session: Session,
):
    """
    T131: Test that GET /api/{user_id}/tasks?search=meeting returns matching tasks.

    Scenario:
    - User creates 3 tasks:
      - Task 1: title="Team meeting", description="Discuss project"
      - Task 2: title="Code review", description="Review PR for meeting scheduler"
      - Task 3: title="Shopping", description="Buy groceries"
    - User searches for "meeting"
    - Should return Task 1 (title match) and Task 2 (description match)
    - Should NOT return Task 3 (no match)

    This verifies:
    - Search filters by both title and description (OR logic)
    - Only matching tasks are returned
    - Search query parameter works correctly
    """
    # Create 3 tasks with different titles and descriptions
    task1 = Task(
        user_id="test_user_123",
        title="Team meeting",
        description="Discuss project timeline",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.HIGH,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    task2 = Task(
        user_id="test_user_123",
        title="Code review",
        description="Review PR for meeting scheduler feature",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.MEDIUM,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    task3 = Task(
        user_id="test_user_123",
        title="Shopping",
        description="Buy groceries and supplies",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.LOW,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    test_db_session.add_all([task1, task2, task3])
    test_db_session.commit()

    # Search for "meeting"
    response = await client.get(
        "/api/test_user_123/tasks?search=meeting",
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    tasks = response.json()
    assert isinstance(tasks, list), "Response should be a list of tasks"
    assert len(tasks) == 2, f"Expected 2 matching tasks, got {len(tasks)}"

    # Verify correct tasks are returned
    task_titles = [task["title"] for task in tasks]
    assert "Team meeting" in task_titles, "Task 1 should match (title contains 'meeting')"
    assert "Code review" in task_titles, "Task 2 should match (description contains 'meeting')"
    assert (
        "Shopping" not in task_titles
    ), "Task 3 should NOT match (no 'meeting' in title or description)"


@pytest.mark.asyncio
async def test_search_case_insensitive(
    client: AsyncClient,
    test_jwt_token: str,
    test_db_session: Session,
):
    """
    T132: Test that search is case-insensitive.

    Scenario:
    - User creates 3 tasks with different casing:
      - Task 1: title="URGENT MEETING"
      - Task 2: title="casual meeting"
      - Task 3: title="MeEtInG notes"
    - User searches for "meeting" (lowercase)
    - Should return all 3 tasks regardless of case

    This verifies:
    - Search uses ILIKE (case-insensitive)
    - Works for UPPERCASE, lowercase, and MixedCase
    """
    # Create 3 tasks with different casing
    task1 = Task(
        user_id="test_user_123",
        title="URGENT MEETING",
        description="Important discussion",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.HIGH,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    task2 = Task(
        user_id="test_user_123",
        title="casual meeting",
        description="Informal chat",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.LOW,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    task3 = Task(
        user_id="test_user_123",
        title="MeEtInG notes",
        description="Summary document",
        status=TaskStatus.COMPLETE,
        priority=TaskPriority.MEDIUM,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    test_db_session.add_all([task1, task2, task3])
    test_db_session.commit()

    # Search for "meeting" (lowercase)
    response = await client.get(
        "/api/test_user_123/tasks?search=meeting",
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    tasks = response.json()
    assert isinstance(tasks, list), "Response should be a list of tasks"
    assert len(tasks) == 3, f"Expected 3 matching tasks (case-insensitive), got {len(tasks)}"

    # Verify all 3 tasks are returned
    task_titles = [task["title"] for task in tasks]
    assert "URGENT MEETING" in task_titles, "Should match UPPERCASE"
    assert "casual meeting" in task_titles, "Should match lowercase"
    assert "MeEtInG notes" in task_titles, "Should match MixedCase"


# ============================================================================
# User Story 10: Filter Tasks by Status, Priority, and Tags (T138-T141)
# ============================================================================


@pytest.mark.asyncio
async def test_filter_by_status(
    client: AsyncClient,
    test_jwt_token: str,
    test_db_session: Session,
):
    """
    T138: Test that GET /api/{user_id}/tasks?status=INCOMPLETE returns only incomplete tasks.

    Scenario:
    - User creates 3 tasks:
      - Task 1: status=INCOMPLETE
      - Task 2: status=INCOMPLETE
      - Task 3: status=COMPLETE
    - User filters by status=INCOMPLETE
    - Should return Tasks 1 and 2

    This verifies:
    - Status filter works correctly
    - Only matching tasks are returned
    """
    # Create 3 tasks with different statuses
    task1 = Task(
        user_id="test_user_123",
        title="Incomplete task 1",
        description="Not started yet",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.HIGH,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    task2 = Task(
        user_id="test_user_123",
        title="Incomplete task 2",
        description="Also not done",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.MEDIUM,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    task3 = Task(
        user_id="test_user_123",
        title="Complete task",
        description="Already done",
        status=TaskStatus.COMPLETE,
        priority=TaskPriority.LOW,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    test_db_session.add_all([task1, task2, task3])
    test_db_session.commit()

    # Filter by status=INCOMPLETE
    response = await client.get(
        "/api/test_user_123/tasks?status=INCOMPLETE",
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    tasks = response.json()
    assert isinstance(tasks, list), "Response should be a list of tasks"
    assert len(tasks) == 2, f"Expected 2 incomplete tasks, got {len(tasks)}"

    # Verify correct tasks are returned
    task_titles = [task["title"] for task in tasks]
    assert "Incomplete task 1" in task_titles
    assert "Incomplete task 2" in task_titles
    assert "Complete task" not in task_titles


@pytest.mark.asyncio
async def test_filter_by_priority(
    client: AsyncClient,
    test_jwt_token: str,
    test_db_session: Session,
):
    """
    T139: Test that GET /api/{user_id}/tasks?priority=HIGH returns only high priority tasks.

    Scenario:
    - User creates 3 tasks with different priorities:
      - Task 1: priority=HIGH
      - Task 2: priority=MEDIUM
      - Task 3: priority=LOW
    - User filters by priority=HIGH
    - Should return only Task 1

    This verifies:
    - Priority filter works correctly
    - Only high priority tasks are returned
    """
    # Create 3 tasks with different priorities
    task1 = Task(
        user_id="test_user_123",
        title="High priority task",
        description="Critical issue",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.HIGH,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    task2 = Task(
        user_id="test_user_123",
        title="Medium priority task",
        description="Normal work",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.MEDIUM,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    task3 = Task(
        user_id="test_user_123",
        title="Low priority task",
        description="Can wait",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.LOW,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    test_db_session.add_all([task1, task2, task3])
    test_db_session.commit()

    # Filter by priority=HIGH
    response = await client.get(
        "/api/test_user_123/tasks?priority=HIGH",
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    tasks = response.json()
    assert isinstance(tasks, list), "Response should be a list of tasks"
    assert len(tasks) == 1, f"Expected 1 high priority task, got {len(tasks)}"

    # Verify correct task is returned
    assert tasks[0]["title"] == "High priority task"
    assert tasks[0]["priority"] == "HIGH"


@pytest.mark.asyncio
async def test_filter_by_tags(
    client: AsyncClient,
    test_jwt_token: str,
    test_db_session: Session,
):
    """
    T140: Test that GET /api/{user_id}/tasks?tags=Work,Home returns tasks with Work OR Home tags.

    Scenario:
    - User creates 4 tasks:
      - Task 1: tags=["Work"]
      - Task 2: tags=["Home"]
      - Task 3: tags=["Work", "Urgent"]
      - Task 4: tags=["Personal"]
    - User filters by tags=Work,Home
    - Should return Tasks 1, 2, and 3 (OR logic)

    This verifies:
    - Tags filter works correctly
    - Multiple tags use OR logic
    - Tasks with any matching tag are included
    """
    # Create tags
    tag_work = Tag(user_id="test_user_123", name="Work", created_at=datetime.utcnow())
    tag_home = Tag(user_id="test_user_123", name="Home", created_at=datetime.utcnow())
    tag_urgent = Tag(user_id="test_user_123", name="Urgent", created_at=datetime.utcnow())
    tag_personal = Tag(user_id="test_user_123", name="Personal", created_at=datetime.utcnow())

    test_db_session.add_all([tag_work, tag_home, tag_urgent, tag_personal])
    test_db_session.commit()
    test_db_session.refresh(tag_work)
    test_db_session.refresh(tag_home)
    test_db_session.refresh(tag_urgent)
    test_db_session.refresh(tag_personal)

    # Create 4 tasks
    task1 = Task(
        user_id="test_user_123",
        title="Work task",
        description="Office work",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.MEDIUM,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    task2 = Task(
        user_id="test_user_123",
        title="Home task",
        description="Household chores",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.LOW,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    task3 = Task(
        user_id="test_user_123",
        title="Urgent work task",
        description="Important meeting",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.HIGH,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    task4 = Task(
        user_id="test_user_123",
        title="Personal task",
        description="Private matter",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.LOW,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    test_db_session.add_all([task1, task2, task3, task4])
    test_db_session.commit()
    test_db_session.refresh(task1)
    test_db_session.refresh(task2)
    test_db_session.refresh(task3)
    test_db_session.refresh(task4)

    # Create task-tag associations
    test_db_session.add(TaskTag(task_id=task1.id, tag_id=tag_work.id))
    test_db_session.add(TaskTag(task_id=task2.id, tag_id=tag_home.id))
    test_db_session.add(TaskTag(task_id=task3.id, tag_id=tag_work.id))
    test_db_session.add(TaskTag(task_id=task3.id, tag_id=tag_urgent.id))
    test_db_session.add(TaskTag(task_id=task4.id, tag_id=tag_personal.id))
    test_db_session.commit()

    # Filter by tags=Work,Home (OR logic)
    response = await client.get(
        "/api/test_user_123/tasks?tags=Work,Home",
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    tasks = response.json()
    assert isinstance(tasks, list), "Response should be a list of tasks"
    assert len(tasks) == 3, f"Expected 3 tasks with Work or Home tags, got {len(tasks)}"

    # Verify correct tasks are returned
    task_titles = [task["title"] for task in tasks]
    assert "Work task" in task_titles
    assert "Home task" in task_titles
    assert "Urgent work task" in task_titles
    assert "Personal task" not in task_titles


@pytest.mark.asyncio
async def test_combined_filters(
    client: AsyncClient,
    test_jwt_token: str,
    test_db_session: Session,
):
    """
    T141: Test that filters can be combined with AND logic.

    Scenario:
    - User creates 4 tasks:
      - Task 1: status=INCOMPLETE, priority=HIGH, tags=["Work"]
      - Task 2: status=INCOMPLETE, priority=LOW, tags=["Work"]
      - Task 3: status=COMPLETE, priority=HIGH, tags=["Work"]
      - Task 4: status=INCOMPLETE, priority=HIGH, tags=["Personal"]
    - User filters by status=INCOMPLETE AND priority=HIGH AND tags=Work
    - Should return only Task 1

    This verifies:
    - Multiple filters can be combined
    - Filters use AND logic (all conditions must match)
    - Complex filtering works correctly
    """
    # Create tags
    tag_work = Tag(user_id="test_user_123", name="Work", created_at=datetime.utcnow())
    tag_personal = Tag(user_id="test_user_123", name="Personal", created_at=datetime.utcnow())

    test_db_session.add_all([tag_work, tag_personal])
    test_db_session.commit()
    test_db_session.refresh(tag_work)
    test_db_session.refresh(tag_personal)

    # Create 4 tasks with various combinations
    task1 = Task(
        user_id="test_user_123",
        title="High priority incomplete work task",
        description="Matches all filters",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.HIGH,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    task2 = Task(
        user_id="test_user_123",
        title="Low priority incomplete work task",
        description="Wrong priority",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.LOW,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    task3 = Task(
        user_id="test_user_123",
        title="High priority complete work task",
        description="Wrong status",
        status=TaskStatus.COMPLETE,
        priority=TaskPriority.HIGH,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    task4 = Task(
        user_id="test_user_123",
        title="High priority incomplete personal task",
        description="Wrong tags",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.HIGH,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    test_db_session.add_all([task1, task2, task3, task4])
    test_db_session.commit()
    test_db_session.refresh(task1)
    test_db_session.refresh(task2)
    test_db_session.refresh(task3)
    test_db_session.refresh(task4)

    # Create task-tag associations
    test_db_session.add(TaskTag(task_id=task1.id, tag_id=tag_work.id))
    test_db_session.add(TaskTag(task_id=task2.id, tag_id=tag_work.id))
    test_db_session.add(TaskTag(task_id=task3.id, tag_id=tag_work.id))
    test_db_session.add(TaskTag(task_id=task4.id, tag_id=tag_personal.id))
    test_db_session.commit()

    # Apply combined filters (AND logic)
    response = await client.get(
        "/api/test_user_123/tasks?status=INCOMPLETE&priority=HIGH&tags=Work",
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"

    tasks = response.json()
    assert isinstance(tasks, list), "Response should be a list of tasks"
    assert len(tasks) == 1, f"Expected 1 task matching all filters, got {len(tasks)}"

    # Verify correct task is returned
    assert tasks[0]["title"] == "High priority incomplete work task"
    assert tasks[0]["status"] == "INCOMPLETE"
    assert tasks[0]["priority"] == "HIGH"
    # Note: tags field is not included in Task model JSON response (uses relationships)


# ============================================================================
# User Story 11: Sort Tasks by Different Criteria (T147-T149)
# ============================================================================


@pytest.mark.asyncio
async def test_sort_by_due_date(
    client: AsyncClient,
    test_jwt_token: str,
    test_db_session: Session,
):
    """
    T147: Test that GET /api/{user_id}/tasks?sort=due_date&order=asc returns tasks sorted by due_date.

    Scenario:
    - Create 4 tasks with different due dates (today, tomorrow, next week, no due date)
    - Request tasks sorted by due_date ascending
    - Should return tasks in chronological order (earliest first)
    - Request tasks sorted by due_date descending
    - Should return tasks in reverse chronological order (latest first)
    - Tasks with no due_date should appear last (or first for descending)
    """
    from datetime import timedelta

    now = datetime.utcnow()

    # Create tasks with different due dates
    task_today = Task(
        user_id="test_user_123",
        title="Task due today",
        description="Due today",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.MEDIUM,
        due_date=now,
        created_at=now,
        updated_at=now,
    )
    task_tomorrow = Task(
        user_id="test_user_123",
        title="Task due tomorrow",
        description="Due tomorrow",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.MEDIUM,
        due_date=now + timedelta(days=1),
        created_at=now,
        updated_at=now,
    )
    task_next_week = Task(
        user_id="test_user_123",
        title="Task due next week",
        description="Due next week",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.MEDIUM,
        due_date=now + timedelta(days=7),
        created_at=now,
        updated_at=now,
    )
    task_no_due_date = Task(
        user_id="test_user_123",
        title="Task with no due date",
        description="No deadline",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.MEDIUM,
        due_date=None,
        created_at=now,
        updated_at=now,
    )

    test_db_session.add_all([task_today, task_tomorrow, task_next_week, task_no_due_date])
    test_db_session.commit()

    # Test ascending order (earliest first)
    response_asc = await client.get(
        "/api/test_user_123/tasks?sort=due_date&order=asc",
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    assert response_asc.status_code == 200, f"Expected 200, got {response_asc.status_code}"
    tasks_asc = response_asc.json()
    assert len(tasks_asc) == 4, f"Expected 4 tasks, got {len(tasks_asc)}"

    # Verify ascending order (tasks with due_date first, then null)
    assert tasks_asc[0]["title"] == "Task due today"
    assert tasks_asc[1]["title"] == "Task due tomorrow"
    assert tasks_asc[2]["title"] == "Task due next week"
    assert tasks_asc[3]["title"] == "Task with no due date"

    # Test descending order (latest first)
    response_desc = await client.get(
        "/api/test_user_123/tasks?sort=due_date&order=desc",
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    assert response_desc.status_code == 200, f"Expected 200, got {response_desc.status_code}"
    tasks_desc = response_desc.json()
    assert len(tasks_desc) == 4, f"Expected 4 tasks, got {len(tasks_desc)}"

    # Verify descending order (latest first, null last)
    assert tasks_desc[0]["title"] == "Task due next week"
    assert tasks_desc[1]["title"] == "Task due tomorrow"
    assert tasks_desc[2]["title"] == "Task due today"
    assert tasks_desc[3]["title"] == "Task with no due date"


@pytest.mark.asyncio
async def test_sort_by_priority(
    client: AsyncClient,
    test_jwt_token: str,
    test_db_session: Session,
):
    """
    T148: Test that GET /api/{user_id}/tasks?sort=priority returns tasks sorted by priority.

    Scenario:
    - Create 3 tasks with different priorities (HIGH, MEDIUM, LOW)
    - Request tasks sorted by priority (default descending: HIGH → MEDIUM → LOW)
    - Should return tasks in priority order
    """
    now = datetime.utcnow()

    # Create tasks with different priorities
    task_high = Task(
        user_id="test_user_123",
        title="High priority task",
        description="Important",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.HIGH,
        created_at=now,
        updated_at=now,
    )
    task_medium = Task(
        user_id="test_user_123",
        title="Medium priority task",
        description="Normal",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.MEDIUM,
        created_at=now,
        updated_at=now,
    )
    task_low = Task(
        user_id="test_user_123",
        title="Low priority task",
        description="Not urgent",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.LOW,
        created_at=now,
        updated_at=now,
    )

    test_db_session.add_all([task_low, task_medium, task_high])  # Add in random order
    test_db_session.commit()

    # Test priority sort (HIGH → MEDIUM → LOW)
    response = await client.get(
        "/api/test_user_123/tasks?sort=priority",
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    tasks = response.json()
    assert len(tasks) == 3, f"Expected 3 tasks, got {len(tasks)}"

    # Verify priority order (HIGH → MEDIUM → LOW)
    assert tasks[0]["priority"] == "HIGH"
    assert tasks[0]["title"] == "High priority task"
    assert tasks[1]["priority"] == "MEDIUM"
    assert tasks[1]["title"] == "Medium priority task"
    assert tasks[2]["priority"] == "LOW"
    assert tasks[2]["title"] == "Low priority task"


@pytest.mark.asyncio
async def test_sort_by_created_at(
    client: AsyncClient,
    test_jwt_token: str,
    test_db_session: Session,
):
    """
    T149 (Additional): Test that GET /api/{user_id}/tasks?sort=created_at&order=desc returns newest tasks first.

    Scenario:
    - Create 3 tasks with different created_at timestamps
    - Request tasks sorted by created_at descending (newest first)
    - Should return tasks in reverse chronological order
    """
    from datetime import timedelta

    now = datetime.utcnow()

    # Create tasks with different creation times
    task_oldest = Task(
        user_id="test_user_123",
        title="Oldest task",
        description="Created 2 days ago",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.MEDIUM,
        created_at=now - timedelta(days=2),
        updated_at=now - timedelta(days=2),
    )
    task_middle = Task(
        user_id="test_user_123",
        title="Middle task",
        description="Created yesterday",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.MEDIUM,
        created_at=now - timedelta(days=1),
        updated_at=now - timedelta(days=1),
    )
    task_newest = Task(
        user_id="test_user_123",
        title="Newest task",
        description="Created today",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.MEDIUM,
        created_at=now,
        updated_at=now,
    )

    test_db_session.add_all([task_oldest, task_middle, task_newest])
    test_db_session.commit()

    # Test descending order (newest first)
    response = await client.get(
        "/api/test_user_123/tasks?sort=created_at&order=desc",
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    tasks = response.json()
    assert len(tasks) == 3, f"Expected 3 tasks, got {len(tasks)}"

    # Verify descending order (newest first)
    assert tasks[0]["title"] == "Newest task"
    assert tasks[1]["title"] == "Middle task"
    assert tasks[2]["title"] == "Oldest task"


# ============================================================================
# User Story 12: Set Up Recurring Tasks (T155-T159)
# ============================================================================


@pytest.mark.asyncio
async def test_create_recurring_task(
    client: AsyncClient,
    test_jwt_token: str,
    test_db_session: Session,
):
    """
    T155: Test that tasks can be created with recurrence field.

    Scenario:
    - Create a task with recurrence=WEEKLY
    - Verify task is created with recurrence field set correctly
    - Verify default recurrence is NONE
    """
    from datetime import timedelta

    now = datetime.utcnow()
    tomorrow = now + timedelta(days=1)

    # Create task with WEEKLY recurrence
    response = await client.post(
        "/api/test_user_123/tasks",
        headers={"Authorization": f"Bearer {test_jwt_token}"},
        json={
            "title": "Weekly team meeting",
            "description": "Recurring weekly meeting",
            "priority": "MEDIUM",
            "due_date": tomorrow.isoformat(),
            "recurrence": "WEEKLY",
        },
    )

    assert response.status_code == 201, f"Expected 201, got {response.status_code}"
    task = response.json()

    assert task["title"] == "Weekly team meeting"
    assert task["recurrence"] == "WEEKLY"
    assert task["status"] == "INCOMPLETE"

    # Create task without recurrence (should default to NONE)
    response_default = await client.post(
        "/api/test_user_123/tasks",
        headers={"Authorization": f"Bearer {test_jwt_token}"},
        json={
            "title": "One-time task",
            "description": "Not recurring",
        },
    )

    assert response_default.status_code == 201
    task_default = response_default.json()
    assert task_default["recurrence"] == "NONE"


@pytest.mark.asyncio
async def test_complete_recurring_task_reschedules(
    client: AsyncClient,
    test_jwt_token: str,
    test_db_session: Session,
):
    """
    T156: Test that completing a recurring task reschedules it.

    Scenario:
    - Create a WEEKLY recurring task due tomorrow
    - Mark it as COMPLETE
    - Verify task status resets to INCOMPLETE
    - Verify due_date is rescheduled to +7 days from original
    - Verify last_completed_at is set
    """
    from datetime import timedelta

    now = datetime.utcnow()
    tomorrow = now + timedelta(days=1)

    # Create WEEKLY recurring task
    create_response = await client.post(
        "/api/test_user_123/tasks",
        headers={"Authorization": f"Bearer {test_jwt_token}"},
        json={
            "title": "Weekly report",
            "description": "Submit weekly report",
            "due_date": tomorrow.isoformat(),
            "recurrence": "WEEKLY",
        },
    )

    assert create_response.status_code == 201
    task = create_response.json()
    task_id = task["id"]
    original_due_date = datetime.fromisoformat(task["due_date"].replace("Z", "+00:00"))

    # Mark task as COMPLETE
    complete_response = await client.patch(
        f"/api/test_user_123/tasks/{task_id}/status",
        headers={"Authorization": f"Bearer {test_jwt_token}"},
        json={"status": "COMPLETE"},
    )

    assert complete_response.status_code == 200
    completed_task = complete_response.json()

    # Verify task was rescheduled
    assert completed_task["status"] == "INCOMPLETE", "Recurring task should reset to INCOMPLETE"
    assert completed_task["last_completed_at"] is not None, "last_completed_at should be set"

    # Verify due_date was pushed forward by 7 days
    new_due_date = datetime.fromisoformat(completed_task["due_date"].replace("Z", "+00:00"))
    expected_due_date = original_due_date + timedelta(days=7)

    # Allow 1 second tolerance for timing differences
    time_diff = abs((new_due_date - expected_due_date).total_seconds())
    assert (
        time_diff < 1
    ), f"Expected due_date to be +7 days, got {new_due_date} vs {expected_due_date}"


@pytest.mark.asyncio
async def test_recurring_daily(
    client: AsyncClient,
    test_jwt_token: str,
    test_db_session: Session,
):
    """
    T157: Test that DAILY recurrence adds +1 day.

    Scenario:
    - Create a DAILY recurring task
    - Complete it
    - Verify due_date is +1 day from original
    """
    from datetime import timedelta

    now = datetime.utcnow()
    tomorrow = now + timedelta(days=1)

    # Create DAILY recurring task
    create_response = await client.post(
        "/api/test_user_123/tasks",
        headers={"Authorization": f"Bearer {test_jwt_token}"},
        json={
            "title": "Daily standup",
            "due_date": tomorrow.isoformat(),
            "recurrence": "DAILY",
        },
    )

    assert create_response.status_code == 201
    task = create_response.json()
    task_id = task["id"]
    original_due_date = datetime.fromisoformat(task["due_date"].replace("Z", "+00:00"))

    # Mark as COMPLETE
    complete_response = await client.patch(
        f"/api/test_user_123/tasks/{task_id}/status",
        headers={"Authorization": f"Bearer {test_jwt_token}"},
        json={"status": "COMPLETE"},
    )

    assert complete_response.status_code == 200
    completed_task = complete_response.json()

    # Verify due_date was pushed forward by 1 day
    new_due_date = datetime.fromisoformat(completed_task["due_date"].replace("Z", "+00:00"))
    expected_due_date = original_due_date + timedelta(days=1)

    time_diff = abs((new_due_date - expected_due_date).total_seconds())
    assert time_diff < 1, "Expected due_date to be +1 day"


@pytest.mark.asyncio
async def test_recurring_monthly(
    client: AsyncClient,
    test_jwt_token: str,
    test_db_session: Session,
):
    """
    T158: Test that MONTHLY recurrence adds +1 month (approximately 30 days).

    Scenario:
    - Create a MONTHLY recurring task
    - Complete it
    - Verify due_date is approximately +30 days from original
    """
    from datetime import timedelta

    now = datetime.utcnow()
    next_month_day = now + timedelta(days=15)

    # Create MONTHLY recurring task
    create_response = await client.post(
        "/api/test_user_123/tasks",
        headers={"Authorization": f"Bearer {test_jwt_token}"},
        json={
            "title": "Monthly report",
            "due_date": next_month_day.isoformat(),
            "recurrence": "MONTHLY",
        },
    )

    assert create_response.status_code == 201
    task = create_response.json()
    task_id = task["id"]
    original_due_date = datetime.fromisoformat(task["due_date"].replace("Z", "+00:00"))

    # Mark as COMPLETE
    complete_response = await client.patch(
        f"/api/test_user_123/tasks/{task_id}/status",
        headers={"Authorization": f"Bearer {test_jwt_token}"},
        json={"status": "COMPLETE"},
    )

    assert complete_response.status_code == 200
    completed_task = complete_response.json()

    # Verify due_date was pushed forward by approximately 1 month (30 days)
    new_due_date = datetime.fromisoformat(completed_task["due_date"].replace("Z", "+00:00"))
    expected_due_date = original_due_date + timedelta(days=30)

    # Allow 1 day tolerance for month length differences
    time_diff = abs((new_due_date - expected_due_date).total_seconds())
    assert time_diff < 86400, "Expected due_date to be approximately +30 days"


@pytest.mark.asyncio
async def test_stop_recurrence(
    client: AsyncClient,
    test_jwt_token: str,
    test_db_session: Session,
):
    """
    T159: Test that changing recurrence to NONE stops future recurrences.

    Scenario:
    - Create a WEEKLY recurring task
    - Update recurrence to NONE
    - Complete the task
    - Verify task stays COMPLETE and doesn't reschedule
    """
    from datetime import timedelta

    now = datetime.utcnow()
    tomorrow = now + timedelta(days=1)

    # Create WEEKLY recurring task
    create_response = await client.post(
        "/api/test_user_123/tasks",
        headers={"Authorization": f"Bearer {test_jwt_token}"},
        json={
            "title": "Weekly task",
            "due_date": tomorrow.isoformat(),
            "recurrence": "WEEKLY",
        },
    )

    assert create_response.status_code == 201
    task = create_response.json()
    task_id = task["id"]
    original_due_date = task["due_date"]

    # Update recurrence to NONE
    update_response = await client.put(
        f"/api/test_user_123/tasks/{task_id}",
        headers={"Authorization": f"Bearer {test_jwt_token}"},
        json={"recurrence": "NONE"},
    )

    assert update_response.status_code == 200

    # Mark as COMPLETE
    complete_response = await client.patch(
        f"/api/test_user_123/tasks/{task_id}/status",
        headers={"Authorization": f"Bearer {test_jwt_token}"},
        json={"status": "COMPLETE"},
    )

    assert complete_response.status_code == 200
    completed_task = complete_response.json()

    # Verify task stays COMPLETE and doesn't reschedule
    assert completed_task["status"] == "COMPLETE", "Non-recurring task should stay COMPLETE"
    assert (
        completed_task["due_date"] == original_due_date
    ), "Due date should not change for non-recurring task"
    assert completed_task["recurrence"] == "NONE"
