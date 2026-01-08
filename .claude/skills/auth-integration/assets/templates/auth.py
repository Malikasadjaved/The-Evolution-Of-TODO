"""
JWT Authentication Middleware for FastAPI + Better Auth

This module provides production-ready JWT token verification.
Integrates with Better Auth's JWT token format.

Usage:
    from .auth import verify_token

    @app.get("/api/user/{user_id}/tasks")
    async def get_tasks(
        user_id: str,
        current_user_id: str = Depends(verify_token)
    ):
        if user_id != current_user_id:
            raise HTTPException(status_code=403, detail="Forbidden")
        # ... query database
"""

from typing import Optional

import jwt
from fastapi import Depends, Header, HTTPException

from .config import settings  # Import your Settings class


async def verify_token(authorization: str = Header(None)) -> str:
    """
    Verify JWT token from Authorization header and extract user_id.

    Args:
        authorization: Authorization header value (e.g., "Bearer <token>")

    Returns:
        str: User ID extracted from token payload

    Raises:
        HTTPException 401: Missing, expired, or invalid token

    Example:
        @app.get("/api/user/{user_id}/tasks")
        async def get_tasks(
            user_id: str,
            current_user_id: str = Depends(verify_token)
        ):
            if user_id != current_user_id:
                raise HTTPException(status_code=403, detail="Forbidden")
    """
    # Step 1: Check if Authorization header exists
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Missing Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Step 2: Verify Bearer scheme
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid Authorization header format. Expected 'Bearer <token>'",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Step 3: Extract token
    token = authorization.replace("Bearer ", "", 1).strip()

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Token is empty",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Step 4: Verify token signature and decode payload
    try:
        payload = jwt.decode(
            token,
            settings.better_auth_secret,
            algorithms=["HS256"],
            options={"verify_exp": True},  # Verify expiration
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token signature",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.DecodeError:
        raise HTTPException(
            status_code=401,
            detail="Token decode error. Malformed token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Step 5: Extract user_id from payload
    user_id = payload.get("user_id") or payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Token payload missing user_id",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user_id


async def get_optional_user(authorization: str = Header(None)) -> Optional[str]:
    """
    Extract user_id from token if present, otherwise return None.
    Use for endpoints that support both authenticated and anonymous access.

    Args:
        authorization: Authorization header value

    Returns:
        Optional[str]: User ID if token valid, None otherwise

    Example:
        @app.get("/api/tasks/public")
        async def get_public_tasks(user_id: Optional[str] = Depends(get_optional_user)):
            if user_id:
                # Return user's private tasks
            else:
                # Return public tasks
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None

    try:
        return await verify_token(authorization)
    except HTTPException:
        return None
