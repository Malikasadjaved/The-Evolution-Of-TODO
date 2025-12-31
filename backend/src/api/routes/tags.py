"""
Tag CRUD endpoints (Phase 9 - User Story 7).

All endpoints enforce:
1. JWT authentication (Depends on get_current_user)
2. Authorization check (token user_id == URL user_id)
3. User isolation (filter by current_user from token)
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select
from typing import List

from ..auth import get_current_user
from ..db import get_session
from ..models import Tag

router = APIRouter()


# ============================================================================
# Request/Response Models
# ============================================================================


class TagCreate(BaseModel):
    """Request body for creating a tag."""

    name: str


class TagResponse(BaseModel):
    """Response model for tag data."""

    id: int
    user_id: str
    name: str
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# Endpoints
# ============================================================================


@router.get("/api/{user_id}/tags", response_model=List[TagResponse])
async def list_tags(
    user_id: str,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    T115: List all tags for a user (GET /api/{user_id}/tags).

    Security:
    - Filters by current_user (from token), NOT user_id (from URL)
    - Returns only the authenticated user's tags

    Returns:
    - 200: List of tags
    - 401: Invalid/missing JWT token
    - 403: Access denied (token user_id != URL user_id)
    """
    # Step 1: Authorization check
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Access denied")

    # Step 2: Fetch tags (filter by token user_id)
    tags = session.exec(
        select(Tag).where(Tag.user_id == current_user).order_by(Tag.created_at)
    ).all()

    return tags


@router.post("/api/{user_id}/tags", status_code=201, response_model=TagResponse)
async def create_tag(
    user_id: str,
    tag_data: TagCreate,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    T116: Create a new tag (POST /api/{user_id}/tags).

    Security:
    - Associates tag with current_user (from token), NOT user_id (from URL)
    - Prevents duplicate tag names for same user

    Returns:
    - 201: Tag created successfully
    - 400: Duplicate tag name
    - 401: Invalid/missing JWT token
    - 403: Access denied (token user_id != URL user_id)
    """
    # Step 1: Authorization check
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Access denied")

    # Step 2: Check for duplicate tag
    existing_tag = session.exec(
        select(Tag).where(Tag.user_id == current_user, Tag.name == tag_data.name)
    ).first()

    if existing_tag:
        raise HTTPException(
            status_code=400, detail=f"Tag '{tag_data.name}' already exists for this user"
        )

    # Step 3: Create tag (associate with token user_id)
    tag = Tag(
        user_id=current_user,
        name=tag_data.name,
        created_at=datetime.utcnow(),
    )
    session.add(tag)
    session.commit()
    session.refresh(tag)

    return tag


@router.delete("/api/{user_id}/tags/{tag_id}")
async def delete_tag(
    user_id: str,
    tag_id: int,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    T117: Delete a tag (DELETE /api/{user_id}/tags/{tag_id}).

    Security:
    - Verifies tag belongs to current_user (from token)
    - Cascade deletes TaskTag associations (SQLModel handles this)

    Returns:
    - 200: Tag deleted successfully
    - 401: Invalid/missing JWT token
    - 403: Access denied (tag doesn't belong to user)
    - 404: Tag not found
    """
    # Step 1: Authorization check
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Access denied")

    # Step 2: Fetch tag (verify ownership)
    tag = session.exec(select(Tag).where(Tag.id == tag_id, Tag.user_id == current_user)).first()

    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    # Step 3: Delete tag (cascade deletes TaskTag associations)
    session.delete(tag)
    session.commit()

    return {"message": "Tag deleted successfully"}
