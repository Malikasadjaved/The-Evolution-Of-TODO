"""
JWT authentication middleware.

This module provides JWT token verification for protected endpoints.
CRITICAL: 100% test coverage required (Constitution Section VIII).
"""

import jwt
from fastapi import Header, HTTPException

from .config import settings


async def get_current_user(authorization: str = Header(None)) -> str:
    """
    Extract and verify JWT token from Authorization header.

    This dependency MUST be used on ALL protected endpoints.

    Args:
        authorization: Authorization header value (format: "Bearer <token>")

    Returns:
        str: user_id extracted from validated JWT token

    Raises:
        HTTPException 401: If token is missing, invalid, expired, or malformed

    Usage:
        @app.get("/api/{user_id}/tasks")
        async def get_tasks(
            user_id: str,
            current_user: str = Depends(get_current_user),  # ← CRITICAL
        ):
            # current_user is the validated user_id from JWT token
            # Always use current_user for database queries, NOT user_id from URL
            ...

    Test Coverage (100% MANDATORY):
        - Valid JWT token → Returns user_id
        - Expired JWT token → 401 Unauthorized
        - Invalid signature → 401 Unauthorized
        - Malformed token → 401 Unauthorized
        - Missing Authorization header → 401 Unauthorized
        - Missing user_id in payload → 401 Unauthorized
    """
    # Step 1: Check if Authorization header is present
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authentication token")

    # Step 2: Check if header format is correct ("Bearer <token>")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authentication token format")

    # Step 3: Extract token
    token = authorization.split(" ")[1]

    try:
        # Step 4: Verify token signature and decode payload
        payload = jwt.decode(token, settings.better_auth_secret, algorithms=["HS256"])

        # Step 5: Extract user_id from payload
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload: missing user_id")

        return user_id

    except jwt.ExpiredSignatureError:
        # Token has expired
        raise HTTPException(status_code=401, detail="Token has expired. Please login again.")

    except jwt.InvalidTokenError:
        # Token signature is invalid or token is malformed
        raise HTTPException(status_code=401, detail="Invalid authentication token")
