---
name: auth-integration
description: |
  Implement production-hardened JWT authentication for FastAPI + Better Auth applications.
  Use when implementing JWT middleware, fixing Windows encoding issues (Errno 22), resolving
  PostgreSQL schema mismatches, and enforcing user isolation in database queries. Handles
  stateless JWT auth flow with cross-platform stability and comprehensive error handling.
---

# Auth Integration: JWT Authentication for FastAPI

Implement production-ready JWT authentication with Better Auth, designed for cross-platform reliability and PostgreSQL schema compliance.

## What This Skill Does

- Generates JWT verification middleware for FastAPI
- Fixes Windows-specific encoding errors (Errno 22)
- Enforces PostgreSQL timestamp schema compliance
- Implements user isolation in database queries
- Configures CORS for multi-origin frontends
- Provides comprehensive error handling (401, 403, 500)

## What This Skill Does NOT Do

- OAuth2 provider integration (Google, GitHub, etc.)
- Session-based authentication (uses stateless JWT)
- Database migrations (only models/queries)
- Frontend authentication UI

---

## JWT Authentication Flow

### 5-Step Stateless JWT Flow

```
1. Frontend calls Better Auth endpoint (/api/auth/sign-in)
   ↓
2. Better Auth issues JWT token (signed with BETTER_AUTH_SECRET)
   ↓
3. Frontend stores token (localStorage/cookies)
   ↓
4. Frontend includes token in API requests (Authorization: Bearer <token>)
   ↓
5. Backend middleware verifies token and extracts user_id
```

### Middleware Implementation

**File**: `backend/src/api/auth.py`

```python
from fastapi import HTTPException, Header
import jwt
from .config import settings

async def verify_token(authorization: str = Header(None)) -> str:
    """
    Extract and verify JWT token from Authorization header.
    Returns user_id for use in protected routes.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        payload = jwt.decode(
            token,
            settings.better_auth_secret,
            algorithms=["HS256"]
        )
        return payload["user_id"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

**Usage in Routes**:
```python
from fastapi import Depends
from .auth import verify_token

@app.get("/api/user/{user_id}/tasks")
async def get_tasks(user_id: str, current_user_id: str = Depends(verify_token)):
    # Verify URL user_id matches token user_id
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    # Query database with user isolation
    tasks = await db.query(Task).where(Task.user_id == current_user_id).all()
    return tasks
```

See `references/jwt-middleware.md` for complete middleware implementation.

---

## Windows Encoding Fix

### Problem: Windows stdout Encoding Error

**Error**:
```
[Errno 22] Invalid argument
UnicodeEncodeError: 'charmap' codec can't encode character
```

**Cause**: Windows uses CP1252 encoding by default, which can't handle emojis or Unicode characters in logs.

**Fix**: Force UTF-8 encoding at startup.

**File**: `backend/mcp/utils/logger.py` (or equivalent)

```python
import sys

# Force UTF-8 encoding on Windows
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(
        sys.stdout.buffer,
        encoding='utf-8',
        errors='replace'
    )
```

**Alternative**: Remove emojis from log messages.

See `references/windows-fixes.md` for detailed Windows compatibility guide.

---

## PostgreSQL Schema Compliance

### Problem: Timestamp Type Mismatch

**Error**:
```
psycopg.errors.CannotCoerce: cannot cast type integer to timestamp without time zone
```

**Cause**: Using `int(time.time())` for TIMESTAMP columns instead of `datetime`.

**Fix**: Always use `datetime.utcnow()` for timestamp fields.

```python
from datetime import datetime
from sqlmodel import Field, SQLModel

class Task(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# When inserting
task = Task(
    user_id=current_user_id,
    created_at=datetime.utcnow(),  # ✅ CORRECT
    # created_at=int(time.time()),  # ❌ WRONG
)
```

See `references/database-schema.md` for complete schema patterns.

---

## User Isolation Pattern

### Enforce User Context in ALL Queries

**Critical Rule**: Every database query MUST filter by `user_id` from JWT token.

```python
# ✅ CORRECT: User isolation enforced
@app.get("/api/user/{user_id}/tasks")
async def get_tasks(
    user_id: str,
    current_user_id: str = Depends(verify_token)
):
    # Verify URL parameter matches token
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    # Query with user_id filter
    tasks = await db.query(Task).where(
        Task.user_id == current_user_id
    ).all()
    return tasks

# ❌ WRONG: No user isolation (security vulnerability)
@app.get("/api/tasks")
async def get_tasks():
    tasks = await db.query(Task).all()  # Returns ALL users' tasks!
    return tasks
```

---

## CORS Multi-Origin Configuration

### Support Multiple Frontends

**Environment Variable** (Railway/Backend):
```bash
# Single frontend
FRONTEND_URL=https://frontend.vercel.app

# Multiple frontends (web + chatbot)
FRONTEND_URL=https://web.vercel.app,https://chatbot.vercel.app
```

**Backend Configuration**:
```python
from fastapi.middleware.cors import CORSMiddleware

# Parse comma-separated URLs
frontend_origins = [
    url.strip() 
    for url in settings.frontend_url.split(",")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Error Response Standards

| Status | Error | When to Use | Response Example |
|--------|-------|-------------|------------------|
| **401** | Unauthorized | Missing or invalid JWT token | `{"detail": "Missing token"}` |
| **401** | Unauthorized | Expired JWT token | `{"detail": "Token expired"}` |
| **403** | Forbidden | URL user_id != token user_id | `{"detail": "Forbidden"}` |
| **500** | Internal Error | Windows encoding issue | Fixed by UTF-8 forcing |
| **500** | Internal Error | Database type mismatch | Fixed by datetime enforcement |

### Middleware Error Handling

```python
async def verify_token(authorization: str = Header(None)) -> str:
    # 401: Missing token
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        payload = jwt.decode(token, settings.better_auth_secret, algorithms=["HS256"])
        return payload["user_id"]
    except jwt.ExpiredSignatureError:
        # 401: Expired token
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        # 401: Invalid signature
        raise HTTPException(status_code=401, detail="Invalid token")

# Route-level validation
@app.get("/api/user/{user_id}/tasks")
async def get_tasks(user_id: str, current_user_id: str = Depends(verify_token)):
    # 403: User mismatch
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
```

---

## Implementation Checklist

### Middleware Setup
- [ ] Create `backend/src/api/auth.py` with JWT verification
- [ ] Use `PyJWT` library for token decoding
- [ ] Extract `user_id` from token payload
- [ ] Raise 401 on missing/invalid/expired tokens

### Windows Compatibility
- [ ] Force UTF-8 encoding on Windows (`sys.platform == "win32"`)
- [ ] Remove emojis from log messages (or use UTF-8 wrapper)
- [ ] Test on Windows environment

### Database Schema
- [ ] Use `datetime.utcnow()` for TIMESTAMP columns
- [ ] NEVER use `int(time.time())` for timestamps
- [ ] Add `created_at` and `updated_at` to all models

### User Isolation
- [ ] All queries filter by `user_id == current_user_id`
- [ ] Verify URL user_id matches token user_id (403 if mismatch)
- [ ] No global queries (every query MUST have user filter)

### CORS Configuration
- [ ] Parse comma-separated `FRONTEND_URL` environment variable
- [ ] Set `allow_credentials=True` for JWT headers
- [ ] Redeploy backend after CORS changes

### Error Handling
- [ ] 401 for missing/invalid/expired tokens
- [ ] 403 for user_id mismatch
- [ ] Descriptive error messages in responses

---

## Reference Files

| File | When to Read |
|------|--------------|
| `references/jwt-middleware.md` | Complete JWT middleware implementation with Better Auth |
| `references/windows-fixes.md` | Windows encoding fixes, emoji handling, platform detection |
| `references/database-schema.md` | PostgreSQL schema patterns, timestamp handling, migrations |
| `references/user-isolation.md` | Security patterns, query filtering, user context enforcement |
| `references/error-handling.md` | Complete error taxonomy, status codes, response formats |
| `assets/templates/auth.py` | Production-ready JWT middleware template |
| `assets/templates/models.py` | SQLModel templates with proper timestamps |

---

## Example Usage

**User**: "Implement JWT authentication for my FastAPI backend"

**Claude**:
1. Reads codebase for existing auth patterns
2. Generates `backend/src/api/auth.py` using template
3. Updates routes to use `Depends(verify_token)`
4. Enforces user isolation in database queries
5. Configures CORS for frontend
6. Tests authentication flow

**User**: "Getting Errno 22 on Windows when logging"

**Claude**:
1. Detects Windows platform
2. Adds UTF-8 encoding wrapper to stdout
3. Optionally removes emojis from log messages
4. Tests logging on Windows

**User**: "Database error: cannot cast type integer to timestamp"

**Claude**:
1. Identifies `int(time.time())` usage
2. Replaces with `datetime.utcnow()`
3. Updates all models with timestamp fields
4. Verifies PostgreSQL schema compliance

---

**Skill Type**: Authentication | **Domain**: Backend Security | **Version**: 1.0.0
