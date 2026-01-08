# JWT Middleware Implementation Guide

Complete guide for implementing JWT authentication middleware with Better Auth and FastAPI.

## Architecture Overview

```
Frontend (Better Auth) -> Issues JWT Token
                              ↓
          Frontend stores token (localStorage/cookies)
                              ↓
          API Request with "Authorization: Bearer <token>"
                              ↓
          FastAPI Middleware verifies token
                              ↓
          Extracts user_id from payload
                              ↓
          Provides user_id to route handler
```

## Complete Middleware Implementation

### File: `backend/src/api/auth.py`

```python
"""
JWT Authentication Middleware for Better Auth Integration

This module provides JWT token verification for FastAPI routes.
It integrates with Better Auth's JWT token format and provides
user context for protected routes.
"""

from fastapi import HTTPException, Header, Depends
from typing import Optional
import jwt
from datetime import datetime
from .config import settings

class JWTVerificationError(Exception):
    """Base exception for JWT verification errors"""
    pass

class TokenMissingError(JWTVerificationError):
    """Token not provided in Authorization header"""
    pass

class TokenExpiredError(JWTVerificationError):
    """Token has expired"""
    pass

class TokenInvalidError(JWTVerificationError):
    """Token signature or format is invalid"""
    pass


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
            # ... query database
    """
    # Step 1: Check if Authorization header exists
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Missing Authorization header",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Step 2: Verify Bearer scheme
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid Authorization header format. Expected 'Bearer <token>'",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Step 3: Extract token
    token = authorization.replace("Bearer ", "", 1).strip()
    
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Token is empty",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Step 4: Verify token signature and decode payload
    try:
        payload = jwt.decode(
            token,
            settings.better_auth_secret,
            algorithms=["HS256"],
            options={"verify_exp": True}  # Verify expiration
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except jwt.InvalidSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token signature",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except jwt.DecodeError:
        raise HTTPException(
            status_code=401,
            detail="Token decode error. Malformed token.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Step 5: Extract user_id from payload
    user_id = payload.get("user_id") or payload.get("sub")
    
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Token payload missing user_id",
            headers={"WWW-Authenticate": "Bearer"}
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
```

## Usage Patterns

### Pattern 1: Protected Route (User-Specific Resource)

```python
from fastapi import APIRouter, Depends, HTTPException
from .auth import verify_token
from .database import get_db
from sqlmodel import Session, select

router = APIRouter()

@router.get("/api/user/{user_id}/tasks")
async def get_user_tasks(
    user_id: str,
    current_user_id: str = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Get tasks for a specific user.
    Enforces user isolation: URL user_id must match token user_id.
    """
    # Verify URL parameter matches authenticated user
    if user_id != current_user_id:
        raise HTTPException(
            status_code=403,
            detail="You can only access your own tasks"
        )
    
    # Query with user_id filter
    statement = select(Task).where(Task.user_id == current_user_id)
    tasks = db.exec(statement).all()
    
    return {"tasks": tasks}
```

### Pattern 2: Global Route with User Context

```python
@router.post("/api/tasks")
async def create_task(
    task_data: TaskCreate,
    current_user_id: str = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Create a new task for the authenticated user.
    User ID is automatically injected from JWT token.
    """
    # Create task with user_id from token (not from request body)
    task = Task(
        **task_data.dict(),
        user_id=current_user_id,  # Enforced from token
        created_at=datetime.utcnow()
    )
    
    db.add(task)
    db.commit()
    db.refresh(task)
    
    return task
```

### Pattern 3: Optional Authentication

```python
from .auth import get_optional_user

@router.get("/api/tasks/public")
async def get_public_tasks(
    user_id: Optional[str] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Get public tasks. If user is authenticated, also include their private tasks.
    """
    if user_id:
        # Authenticated: return user's private tasks
        statement = select(Task).where(Task.user_id == user_id)
    else:
        # Anonymous: return only public tasks
        statement = select(Task).where(Task.is_public == True)
    
    tasks = db.exec(statement).all()
    return {"tasks": tasks}
```

### Pattern 4: Public Routes (No Authentication)

```python
@router.get("/health")
async def health_check():
    """
    Public health check endpoint.
    No authentication required.
    """
    return {"status": "healthy"}

@router.post("/api/auth/sign-up")
async def sign_up(user_data: UserCreate):
    """
    Better Auth handles this endpoint.
    No JWT verification (user doesn't have token yet).
    """
    # Better Auth handles sign-up
    pass
```

## Route Protection Strategies

### 1. Exclude Public Routes

**Method 1: Route-level exclusion (Recommended)**

```python
# Public routes (no Depends(verify_token))
@router.get("/health")
@router.get("/ready")
@router.post("/api/auth/sign-in")
@router.post("/api/auth/sign-up")

# Protected routes (with Depends(verify_token))
@router.get("/api/user/{user_id}/tasks", dependencies=[Depends(verify_token)])
```

**Method 2: Middleware-level exclusion**

```python
from starlette.middleware.base import BaseHTTPMiddleware

class JWTMiddleware(BaseHTTPMiddleware):
    PUBLIC_PATHS = {
        "/health",
        "/ready",
        "/api/auth/sign-in",
        "/api/auth/sign-up",
        "/docs",
        "/openapi.json"
    }
    
    async def dispatch(self, request, call_next):
        # Skip authentication for public paths
        if request.url.path in self.PUBLIC_PATHS:
            return await call_next(request)
        
        # Verify token for protected paths
        authorization = request.headers.get("Authorization")
        if not authorization:
            return JSONResponse(
                status_code=401,
                content={"detail": "Missing Authorization header"}
            )
        
        # Extract and store user_id in request state
        request.state.user_id = await verify_token(authorization)
        
        return await call_next(request)

# Add middleware
app.add_middleware(JWTMiddleware)
```

## Better Auth JWT Token Format

### Token Payload Structure

```json
{
  "user_id": "user_123abc",
  "email": "user@example.com",
  "iat": 1609459200,
  "exp": 1609545600,
  "sub": "user_123abc"
}
```

**Key Fields**:
- `user_id` or `sub`: User identifier (use for database queries)
- `email`: User's email address
- `iat`: Issued at timestamp
- `exp`: Expiration timestamp

### Token Expiration Handling

```python
# Check expiration manually (PyJWT does this automatically)
import jwt
from datetime import datetime

try:
    payload = jwt.decode(token, secret, algorithms=["HS256"])
    
    # Manual expiration check (redundant if verify_exp=True)
    exp = payload.get("exp")
    if exp and datetime.fromtimestamp(exp) < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Token expired")
        
except jwt.ExpiredSignatureError:
    # PyJWT automatically raises this if verify_exp=True
    raise HTTPException(status_code=401, detail="Token expired")
```

## Environment Configuration

### Required Environment Variables

```bash
# Backend (Railway/Local)
BETTER_AUTH_SECRET=<43-character-secret>
BETTER_AUTH_URL=https://frontend.vercel.app/api/auth

# Frontend (Vercel/Local)
BETTER_AUTH_SECRET=<same-43-character-secret>
NEXT_PUBLIC_BETTER_AUTH_URL=https://frontend.vercel.app/api/auth
```

**Critical**: `BETTER_AUTH_SECRET` MUST be identical on both frontend and backend.

### Generate Secret

```bash
# Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

## Testing JWT Middleware

### Unit Test Example

```python
import pytest
from fastapi.testclient import TestClient
import jwt
from datetime import datetime, timedelta

def test_verify_token_success():
    """Test successful token verification"""
    # Create valid token
    payload = {
        "user_id": "user_123",
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    token = jwt.encode(payload, settings.better_auth_secret, algorithm="HS256")
    
    # Make request with token
    response = client.get(
        "/api/user/user_123/tasks",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200

def test_verify_token_missing():
    """Test missing token"""
    response = client.get("/api/user/user_123/tasks")
    assert response.status_code == 401
    assert "Missing Authorization header" in response.json()["detail"]

def test_verify_token_expired():
    """Test expired token"""
    payload = {
        "user_id": "user_123",
        "exp": datetime.utcnow() - timedelta(hours=1)  # Expired
    }
    token = jwt.encode(payload, settings.better_auth_secret, algorithm="HS256")
    
    response = client.get(
        "/api/user/user_123/tasks",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 401
    assert "expired" in response.json()["detail"].lower()

def test_verify_token_invalid_signature():
    """Test token with wrong signature"""
    payload = {"user_id": "user_123"}
    token = jwt.encode(payload, "wrong-secret", algorithm="HS256")
    
    response = client.get(
        "/api/user/user_123/tasks",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 401

def test_user_isolation():
    """Test that users can only access their own resources"""
    # User A's token
    payload_a = {"user_id": "user_a"}
    token_a = jwt.encode(payload_a, settings.better_auth_secret, algorithm="HS256")
    
    # Try to access User B's resources
    response = client.get(
        "/api/user/user_b/tasks",
        headers={"Authorization": f"Bearer {token_a}"}
    )
    
    assert response.status_code == 403
    assert "Forbidden" in response.json()["detail"]
```

### Manual Testing with curl

```bash
# 1. Sign up/login to get token
curl -X POST https://frontend.vercel.app/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Response: {"token": "eyJhbGc..."}

# 2. Use token in API requests
TOKEN="eyJhbGc..."

curl https://backend.railway.app/api/user/user_123/tasks \
  -H "Authorization: Bearer $TOKEN"

# Expected: 200 OK with tasks

# 3. Test with invalid token
curl https://backend.railway.app/api/user/user_123/tasks \
  -H "Authorization: Bearer invalid-token"

# Expected: 401 Unauthorized
```

## Security Best Practices

### 1. Never Trust URL Parameters for User ID

```python
# ❌ WRONG: Use URL user_id directly
@app.get("/api/user/{user_id}/tasks")
async def get_tasks(user_id: str):
    tasks = db.query(Task).where(Task.user_id == user_id).all()
    return tasks  # Security vulnerability!

# ✅ CORRECT: Verify URL user_id matches token
@app.get("/api/user/{user_id}/tasks")
async def get_tasks(
    user_id: str,
    current_user_id: str = Depends(verify_token)
):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    tasks = db.query(Task).where(Task.user_id == current_user_id).all()
    return tasks
```

### 2. Always Use Token user_id for Database Queries

```python
# ❌ WRONG: Use user_id from request body
@app.post("/api/tasks")
async def create_task(task: TaskCreate, current_user_id: str = Depends(verify_token)):
    new_task = Task(**task.dict())  # task.user_id could be forged!
    db.add(new_task)

# ✅ CORRECT: Override with token user_id
@app.post("/api/tasks")
async def create_task(task: TaskCreate, current_user_id: str = Depends(verify_token)):
    new_task = Task(
        **task.dict(exclude={"user_id"}),
        user_id=current_user_id  # Enforced from token
    )
    db.add(new_task)
```

### 3. Use HTTPException with WWW-Authenticate Header

```python
# ✅ CORRECT: Include WWW-Authenticate header for 401 responses
raise HTTPException(
    status_code=401,
    detail="Token expired",
    headers={"WWW-Authenticate": "Bearer"}
)
```

This tells the client to retry with a new Bearer token.
