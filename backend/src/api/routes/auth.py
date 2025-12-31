# mypy: ignore-errors
"""
Authentication routes for user registration and login.

Endpoints:
- POST /api/auth/sign-up - Register a new user
- POST /api/auth/sign-in - Login an existing user
- POST /api/auth/sign-out - Logout (returns 200 OK)
- GET /api/auth/session - Get current user session
"""

import time
from datetime import datetime, timedelta
from typing import Optional
from uuid import uuid4

import jwt
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, EmailStr
from sqlmodel import Session, select

from ..config import settings
from ..db import get_session
from ..models import User
from mcp.utils.logger import StructuredLogger

logger = StructuredLogger(service_name="auth-api")
router = APIRouter(prefix="/api/auth", tags=["auth"])


# Request/Response Models
class SignUpRequest(BaseModel):
    """Sign-up request."""

    email: EmailStr
    password: str
    name: str


class SignInRequest(BaseModel):
    """Sign-in request."""

    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    """Authentication response with JWT token."""

    token: str
    user: dict


# Helper Functions
def hash_password(password: str) -> str:
    """Hash password (simplified for development)."""
    return f"hashed_{password}"


def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash."""
    return hashed == f"hashed_{password}"


def create_jwt_token(user_id: str, email: str) -> str:
    """Create JWT token for authenticated user."""
    now = int(time.time())
    exp = now + (24 * 60 * 60)  # 24 hours in seconds
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": exp,
        "iat": now,
    }
    token = jwt.encode(payload, settings.better_auth_secret, algorithm="HS256")
    return token


# Routes
@router.post("/sign-up", response_model=AuthResponse, status_code=201)
async def sign_up(request: SignUpRequest, session: Session = Depends(get_session)):
    """Register a new user."""
    # Check if email already exists
    existing = session.exec(select(User).where(User.email == request.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    # Create new user with generated UUID
    user = User(
        id=str(uuid4()),  # Generate UUID for user
        email=request.email,
        name=request.name,
        password_hash=hash_password(request.password),
        created_at=datetime.utcnow(),
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    logger.info(
        event="user_registered",
        message="New user registered successfully",
        user_id=user.id,  # Will be hashed by StructuredLogger
    )

    # Generate JWT token
    token = create_jwt_token(user.id, user.email)

    return AuthResponse(
        token=token,
        user={"id": user.id, "email": user.email, "name": user.name},
    )


@router.post("/sign-in", response_model=AuthResponse)
async def sign_in(request: SignInRequest, session: Session = Depends(get_session)):
    """Login an existing user."""
    logger.debug(
        event="sign_in_attempt",
        message="User sign-in attempt",
        user_email_provided=bool(request.email),  # Boolean, not email
    )
    try:
        # Find user by email
        user = session.exec(select(User).where(User.email == request.email)).first()

        # Check if user exists and has a password_hash
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # If user has no password_hash (created by Better Auth), reject backend sign-in
        if not user.password_hash:
            raise HTTPException(status_code=401, detail="Please use the main login page")

        # Verify password
        if not verify_password(request.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        logger.info(
            event="user_signed_in",
            message="User signed in successfully",
            user_id=user.id,  # Will be hashed by StructuredLogger
        )

        # Generate JWT token
        token = create_jwt_token(user.id, user.email)

        return AuthResponse(
            token=token,
            user={"id": user.id, "email": user.email, "name": user.name},
        )
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        logger.error(
            event="sign_in_error",
            message="Sign-in failed due to unexpected error",
            error_type=type(e).__name__,
            # Do NOT log str(e) - may contain PII
        )
        raise HTTPException(
            status_code=500,
            detail="Sign-in failed. Please try again or contact support."
        )


@router.get("/test")
async def test():
    """Test endpoint."""
    return {"status": "working"}


@router.post("/sign-out")
async def sign_out():
    """Logout endpoint (client-side handles token removal)."""
    return {"status": "success"}


@router.get("/session")
async def get_session_endpoint(
    authorization: Optional[str] = Header(None),
    session: Session = Depends(get_session),
):
    """Get current user session from JWT token."""
    if not authorization or not authorization.startswith("Bearer "):
        return {"session": None}

    token = authorization.split(" ")[1]

    try:
        # Decode JWT
        payload = jwt.decode(token, settings.better_auth_secret, algorithms=["HS256"])
        user_id = payload.get("user_id")

        # Fetch user from database
        user = session.exec(select(User).where(User.id == user_id)).first()

        if not user:
            return {"session": None}

        return {
            "session": {
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "name": user.name,
                }
            }
        }

    except jwt.ExpiredSignatureError:
        return {"session": None}
    except jwt.InvalidTokenError:
        return {"session": None}
