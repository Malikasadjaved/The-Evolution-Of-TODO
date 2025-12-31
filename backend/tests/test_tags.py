"""
Tests for Tag CRUD operations (Phase 9 - User Story 7).

Test coverage requirements:
- Tag creation and validation
- Duplicate tag prevention
- Tag deletion with cascade to task_tags
- User isolation (tags are user-scoped)

All tests follow TDD methodology:
1. Write test FIRST (verify FAIL)
2. Implement feature
3. Verify test PASS
"""

import pytest
from datetime import datetime
from httpx import AsyncClient
from sqlmodel import Session, select

from src.api.models import Tag, Task, TaskTag, TaskStatus, TaskPriority


@pytest.mark.asyncio
async def test_create_tag(
    client: AsyncClient,
    test_jwt_token: str,
    test_db_session: Session,
):
    """
    T110: Test that POST /api/{user_id}/tags creates a custom tag.

    Verifies:
    - Tag creation returns 201
    - Tag name is stored correctly
    - Tag is associated with the correct user
    - Created tag has an ID
    """
    tag_data = {
        "name": "Work",
    }

    response = await client.post(
        "/api/test_user_123/tags",
        json=tag_data,
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    assert response.status_code == 201
    created_tag = response.json()
    assert created_tag["name"] == "Work"
    assert created_tag["user_id"] == "test_user_123"
    assert "id" in created_tag
    assert "created_at" in created_tag

    # Verify tag persisted in database
    tag_in_db = test_db_session.exec(
        select(Tag).where(Tag.name == "Work", Tag.user_id == "test_user_123")
    ).first()
    assert tag_in_db is not None
    assert tag_in_db.name == "Work"


@pytest.mark.asyncio
async def test_duplicate_tag(
    client: AsyncClient,
    test_jwt_token: str,
    test_db_session: Session,
):
    """
    T111: Test that creating a duplicate tag returns 400.

    Verifies:
    - Cannot create tag with same name for same user
    - Error message is clear
    - Database constraint enforced
    """
    # Create first tag
    tag = Tag(
        user_id="test_user_123",
        name="Work",
        created_at=datetime.utcnow(),
    )
    test_db_session.add(tag)
    test_db_session.commit()

    # Attempt to create duplicate
    tag_data = {
        "name": "Work",
    }

    response = await client.post(
        "/api/test_user_123/tags",
        json=tag_data,
        headers={"Authorization": f"Bearer {test_jwt_token}"},
    )

    assert response.status_code == 400
    error = response.json()
    assert "already exists" in error["detail"].lower()


@pytest.mark.asyncio
async def test_delete_tag_removes_from_tasks(
    client: AsyncClient,
    test_jwt_token: str,
    test_db_session: Session,
):
    """
    T112: Test that deleting a tag removes it from all tasks (cascade delete).

    Verifies:
    - Tag deletion returns 200
    - Tag is removed from database
    - TaskTag entries are cascade deleted
    - Tasks themselves are not deleted (only the association)
    """
    # Create tag
    tag = Tag(
        user_id="test_user_123",
        name="Work",
        created_at=datetime.utcnow(),
    )
    test_db_session.add(tag)
    test_db_session.commit()
    test_db_session.refresh(tag)

    # Create task
    task = Task(
        user_id="test_user_123",
        title="Tagged Task",
        status=TaskStatus.INCOMPLETE,
        priority=TaskPriority.MEDIUM,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(task)
    test_db_session.commit()
    test_db_session.refresh(task)

    # Associate tag with task
    task_tag = TaskTag(task_id=task.id, tag_id=tag.id)
    test_db_session.add(task_tag)
    test_db_session.commit()

    # Delete tag
    response = await client.delete(
        f"/api/test_user_123/tags/{tag.id}", headers={"Authorization": f"Bearer {test_jwt_token}"}
    )

    assert response.status_code == 200

    # Verify tag deleted
    tag_in_db = test_db_session.exec(select(Tag).where(Tag.id == tag.id)).first()
    assert tag_in_db is None

    # Verify TaskTag association deleted (cascade)
    task_tag_in_db = test_db_session.exec(select(TaskTag).where(TaskTag.tag_id == tag.id)).first()
    assert task_tag_in_db is None

    # Verify task still exists (not deleted)
    task_in_db = test_db_session.exec(select(Task).where(Task.id == task.id)).first()
    assert task_in_db is not None


@pytest.mark.asyncio
async def test_list_tags_user_isolation(
    client: AsyncClient,
    test_jwt_token: str,
    test_user_2_jwt_token: str,
    test_db_session: Session,
):
    """
    T113: Test that GET /api/{user_id}/tags enforces user isolation.

    Verifies:
    - User A can only see their own tags
    - User B cannot see User A's tags
    - Tag filtering by token user_id (not URL user_id)
    """
    # Create tags for User A
    tag_a1 = Tag(
        user_id="test_user_123",
        name="Work",
        created_at=datetime.utcnow(),
    )
    tag_a2 = Tag(
        user_id="test_user_123",
        name="Home",
        created_at=datetime.utcnow(),
    )
    test_db_session.add(tag_a1)
    test_db_session.add(tag_a2)

    # Create tag for User B
    tag_b = Tag(
        user_id="test_user_456",
        name="Personal",
        created_at=datetime.utcnow(),
    )
    test_db_session.add(tag_b)
    test_db_session.commit()

    # User A requests their tags
    response_a = await client.get(
        "/api/test_user_123/tags", headers={"Authorization": f"Bearer {test_jwt_token}"}
    )

    assert response_a.status_code == 200
    tags_a = response_a.json()
    assert len(tags_a) == 2
    tag_names_a = [tag["name"] for tag in tags_a]
    assert "Work" in tag_names_a
    assert "Home" in tag_names_a
    assert "Personal" not in tag_names_a  # User B's tag

    # User B requests their tags
    response_b = await client.get(
        "/api/test_user_456/tags", headers={"Authorization": f"Bearer {test_user_2_jwt_token}"}
    )

    assert response_b.status_code == 200
    tags_b = response_b.json()
    assert len(tags_b) == 1
    assert tags_b[0]["name"] == "Personal"
