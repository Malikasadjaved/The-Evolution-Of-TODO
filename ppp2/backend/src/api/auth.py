"""
JWT authentication middleware for FastAPI.

Verifies JWT tokens issued by Better Auth.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from typing import Optional
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# JWT configuration
SECRET_KEY = os.getenv("BETTER_AUTH_SECRET")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

if not SECRET_KEY:
    raise ValueError("BETTER_AUTH_SECRET environment variable is not set")

# Security scheme
security = HTTPBearer()


class CurrentUser:
    """Represents the authenticated user from JWT token."""

    def __init__(self, user_id: str, email: str, name: str):
        self.id = user_id
        self.email = email
        self.name = name


def verify_token(token: str) -> dict:
    """
    Verify JWT token and extract payload.

    Args:
        token: JWT token string

    Returns:
        Decoded token payload

    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> CurrentUser:
    """
    FastAPI dependency to get the current authenticated user.

    Usage:
        @app.get("/api/{user_id}/tasks")
        def get_tasks(
            user_id: str,
            current_user: CurrentUser = Depends(get_current_user)
        ):
            # Verify user_id matches authenticated user
            if user_id != current_user.id:
                raise HTTPException(status_code=403, detail="Forbidden")
            ...

    Args:
        credentials: HTTP Bearer credentials from request header

    Returns:
        CurrentUser object with user information

    Raises:
        HTTPException: If token is invalid or missing
    """
    token = credentials.credentials
    payload = verify_token(token)

    # Extract user information from token
    # Adjust field names based on your Better Auth JWT payload structure
    user_id = payload.get("sub") or payload.get("userId") or payload.get("id")
    email = payload.get("email")
    name = payload.get("name")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: user ID not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return CurrentUser(user_id=user_id, email=email or "", name=name or "")


def verify_user_access(user_id: str, current_user: CurrentUser) -> None:
    """
    Verify that the authenticated user matches the requested user_id.

    Args:
        user_id: User ID from URL path
        current_user: Authenticated user from JWT

    Raises:
        HTTPException: If user IDs don't match (403 Forbidden)
    """
    if user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this resource"
        )


# Optional: Create JWT tokens (if you need to issue tokens from FastAPI)
def create_access_token(data: dict, expires_delta: Optional[int] = None) -> str:
    """
    Create a JWT access token.

    Args:
        data: Data to encode in the token
        expires_delta: Token expiration time in minutes

    Returns:
        Encoded JWT token string
    """
    from datetime import datetime, timedelta

    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + timedelta(minutes=expires_delta)
    else:
        expire = datetime.utcnow() + timedelta(minutes=10080)  # 7 days default

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt
