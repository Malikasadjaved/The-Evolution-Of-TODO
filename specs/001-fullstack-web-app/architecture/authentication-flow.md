# Authentication Flow Architecture

**Feature**: Phase 2 Full-Stack Web Application
**Date**: 2025-12-15
**Branch**: `001-fullstack-web-app`
**Constitution**: `.specify/memory/phase-2-constitution.md` (Section VI)

## Purpose

This document provides a comprehensive overview of the JWT-based authentication architecture, including the complete 5-step flow, security guarantees, component interactions, and failure scenarios.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Diagram](#architecture-diagram)
3. [5-Step JWT Flow](#5-step-jwt-flow)
4. [Component Interactions](#component-interactions)
5. [Security Guarantees](#security-guarantees)
6. [Failure Scenarios](#failure-scenarios)
7. [Code References](#code-references)
8. [Testing Requirements](#testing-requirements)

---

## Overview

### Authentication Strategy

**Type**: JWT (JSON Web Token) - Stateless Authentication
**Token Issuer**: Better Auth (third-party authentication library on frontend)
**Token Verifier**: FastAPI backend (PyJWT library)
**Algorithm**: HS256 (HMAC-SHA256)
**Shared Secret**: `BETTER_AUTH_SECRET` (minimum 32 characters)

### Key Principles

1. **Stateless**: No server-side session storage - token contains all user information
2. **User Isolation**: Every API request filters data by authenticated `user_id` from token
3. **Defense in Depth**: Security enforced at multiple layers (middleware, routes, database queries)
4. **Fail Secure**: Any authentication failure results in 401 Unauthorized or 403 Forbidden

---

## Architecture Diagram

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER AUTHENTICATION FLOW                       │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐                ┌──────────────┐                ┌──────────────┐
│   Browser    │                │   Frontend   │                │   Backend    │
│  (User)      │                │  (Next.js)   │                │  (FastAPI)   │
└──────┬───────┘                └──────┬───────┘                └──────┬───────┘
       │                               │                               │
       │ 1. Login (email/password)     │                               │
       ├──────────────────────────────►│                               │
       │                               │                               │
       │                               │  ┌─────────────────┐          │
       │                               ├─►│  Better Auth    │          │
       │                               │  │  - Verify creds │          │
       │                               │  │  - Hash password│          │
       │                               │  │  - Issue JWT    │          │
       │                               │  └────────┬────────┘          │
       │                               │           │                   │
       │                               │◄──────────┘                   │
       │                               │  JWT Token                    │
       │  2. Store JWT (localStorage)  │                               │
       │◄──────────────────────────────┤                               │
       │                               │                               │
       │ 3. Create Task (with JWT)     │                               │
       ├──────────────────────────────►│                               │
       │                               │  Authorization: Bearer <JWT>  │
       │                               ├──────────────────────────────►│
       │                               │                               │
       │                               │                        ┌──────▼──────┐
       │                               │                        │ Middleware  │
       │                               │                        │ - Verify JWT│
       │                               │                        │ - Extract ID│
       │                               │                        └──────┬──────┘
       │                               │                               │
       │                               │                        ┌──────▼──────┐
       │                               │                        │ Route       │
       │                               │                        │ - Check Auth│
       │                               │                        │ - Filter DB │
       │                               │                        └──────┬──────┘
       │                               │                               │
       │                               │                        ┌──────▼──────┐
       │                               │                        │ Database    │
       │                               │                        │ - Query     │
       │                               │                        │   user_id   │
       │                               │                        └──────┬──────┘
       │                               │         201 Created           │
       │                               │◄──────────────────────────────┤
       │  4. Show new task             │                               │
       │◄──────────────────────────────┤                               │
       │                               │                               │
```

---

## 5-Step JWT Flow

### Step 1: User Login → Token Issuance

**Actor**: Better Auth (frontend authentication library)

**Process**:
1. User submits login form (email + password)
2. Better Auth validates credentials against database
3. If valid: Better Auth hashes password with bcrypt, verifies hash matches
4. Better Auth creates JWT token with payload:
   ```json
   {
     "user_id": "abc123",
     "email": "user@example.com",
     "exp": 1735084800,  // Expiry (7 days in dev, 1 day in prod)
     "iat": 1734480000   // Issued at
   }
   ```
5. Better Auth signs token with `BETTER_AUTH_SECRET` using HS256 algorithm
6. Returns token to frontend

**Frontend Code** (pseudocode):
```typescript
// app/login/page.tsx
const handleLogin = async (email: string, password: string) => {
  const { token, user } = await betterAuth.signIn({ email, password });

  // Store JWT token
  localStorage.setItem("auth_token", token);

  // Redirect to dashboard
  router.push("/dashboard");
};
```

**Security Notes**:
- Password NEVER sent to backend (Better Auth handles authentication)
- Token signed with shared secret (backend can verify signature)
- Token expiry enforced (prevents indefinite access)

---

### Step 2: API Request → Token Attachment

**Actor**: Frontend (Next.js application)

**Process**:
1. Frontend retrieves JWT token from localStorage
2. Includes token in `Authorization` header for ALL API requests
3. Header format: `Authorization: Bearer <token>`

**Frontend Code** (actual implementation):
```typescript
// lib/api.ts
async function fetchWithAuth<T>(url: string, options: FetchOptions = {}): Promise<T> {
  // Step 1: Get JWT token from localStorage
  const token = localStorage.getItem("auth_token");

  // Step 2: Attach Authorization header to all requests
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { "Authorization": `Bearer ${token}` }),
      ...options.headers,
    },
  });

  // ... error handling
  return response.json() as Promise<T>;
}

// Usage
const tasks = await api.getTasks(userId);
// Sends: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Security Notes**:
- Token attached automatically (developers can't forget)
- Token stored in localStorage (accessible to JavaScript)
- Alternative: httpOnly cookies (more secure, not implemented in Phase 2)

---

### Step 3: Backend → Token Verification

**Actor**: FastAPI Middleware (`backend/src/api/auth.py`)

**Process**:
1. Middleware intercepts ALL incoming requests (except `/health`)
2. Extracts token from `Authorization: Bearer <token>` header
3. Verifies token signature using `BETTER_AUTH_SECRET`
4. Checks token expiration (reject if expired)
5. Decodes token payload to extract `user_id` and `email`
6. If any step fails: Raise `HTTPException(401, detail="...")`
7. If successful: Return `user_id` to route handler

**Backend Code** (actual implementation):
```python
# backend/src/api/auth.py
from fastapi import Depends, HTTPException, Header
import jwt
from .config import settings

ALGORITHM = "HS256"

async def get_current_user(authorization: str = Header(None)):
    """
    JWT verification middleware.
    Extracts and verifies JWT token from Authorization header.
    Returns user_id if valid, raises HTTPException 401 if invalid.
    """
    # Step 1: Check Authorization header exists
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing authentication token"
        )

    # Step 2: Extract token
    token = authorization.split(" ")[1]

    try:
        # Step 3: Verify signature and decode payload
        payload = jwt.decode(
            token,
            settings.better_auth_secret,
            algorithms=[ALGORITHM]
        )

        # Step 4: Extract user_id from payload
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid token payload"
            )

        # Step 5: Return user_id for use in route handlers
        return user_id

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )
```

**Security Notes**:
- Signature verification prevents token tampering
- Expiration check prevents indefinite access
- Clear error messages for debugging (but no sensitive info leaked)

---

### Step 4: Backend → User Authorization (CRITICAL SECURITY CHECK)

**Actor**: FastAPI Route Handler (`backend/src/api/routes/tasks.py`)

**Process**:
1. Route receives `user_id` from URL path parameter
2. Route receives `current_user` from JWT middleware (Step 3)
3. **CRITICAL CHECK**: Does `user_id` from URL match `current_user` from token?
   - If **YES** → User is authorized, proceed to Step 5
   - If **NO** → Raise `HTTPException(403, detail="Access denied")`

**Backend Code** (actual implementation):
```python
# backend/src/api/routes/tasks.py
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from .auth import get_current_user
from .db import get_session
from .models import Task

router = APIRouter()

@router.get("/api/{user_id}/tasks")
async def get_tasks(
    user_id: str,                              # From URL path parameter
    current_user: str = Depends(get_current_user),  # From JWT token (verified)
    session: Session = Depends(get_session)
):
    # CRITICAL: Verify user_id in URL matches authenticated user
    if user_id != current_user:
        raise HTTPException(
            status_code=403,
            detail="Access denied: You can only access your own tasks"
        )

    # Authorization passed, proceed to Step 5 (data filtering)
    # ...
```

**Security Notes**:
- Prevents privilege escalation attacks
- 403 Forbidden (not 401) because token is valid, but user lacks permission
- This check prevents: `GET /api/OTHER_USER_ID/tasks` with valid token

**Attack Scenario Prevented**:
```bash
# Attacker (User A) tries to access User B's tasks
curl -H "Authorization: Bearer USER_A_TOKEN" \
     http://localhost:8000/api/USER_B_ID/tasks

# Response: 403 Forbidden
# { "detail": "Access denied: You can only access your own tasks" }
```

---

### Step 5: Backend → Data Filtering (CRITICAL FOR USER ISOLATION)

**Actor**: Database Query (SQLModel + PostgreSQL)

**Process**:
1. Authorization check passed (token `user_id` == URL `user_id`)
2. Query database for tasks
3. **CRITICAL**: Filter by `current_user` from token (NOT `user_id` from URL)
4. Return only tasks belonging to authenticated user

**Backend Code** (actual implementation):
```python
# backend/src/api/routes/tasks.py (continued from Step 4)
@router.get("/api/{user_id}/tasks")
async def get_tasks(
    user_id: str,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Step 4: Authorization check
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Access denied")

    # Step 5: Data filtering (CRITICAL - use current_user, NOT user_id)
    tasks = session.exec(
        select(Task).where(Task.user_id == current_user)  # ✅ CORRECT
        # NEVER: Task.user_id == user_id  # ❌ WRONG - user can manipulate URL!
    ).all()

    return tasks
```

**Security Anti-Pattern (NEVER DO THIS)**:
```python
# ❌ WRONG - SECURITY VULNERABILITY
@router.get("/api/{user_id}/tasks")
async def get_tasks_INSECURE(
    user_id: str,  # From URL - CAN BE MANIPULATED!
    session: Session = Depends(get_session)
):
    # NO JWT VERIFICATION - Anyone can call this!
    # NO AUTHORIZATION CHECK - user_id comes from untrusted URL!
    tasks = session.exec(
        select(Task).where(Task.user_id == user_id)  # ❌ WRONG!
    ).all()

    return tasks  # Data leak! Returns other users' tasks!
```

**Why This is WRONG**:
- No JWT verification → unauthenticated access
- Uses URL `user_id` → attacker can change URL to `/api/victim_id/tasks`
- Returns other users' data → privilege escalation attack

**Security Notes**:
- Filter by `current_user` from verified token (source of truth)
- Never filter by `user_id` from URL (untrusted input)
- Database enforces user isolation at query level

---

## Component Interactions

### Sequence Diagram: Successful Authentication

```
User         Frontend       Better Auth      Backend       Database
 │               │               │              │              │
 │  Login Form   │               │              │              │
 ├──────────────►│               │              │              │
 │               │  Verify Creds │              │              │
 │               ├──────────────►│              │              │
 │               │               │  Query User  │              │
 │               │               ├─────────────►│              │
 │               │               │◄─────────────┤              │
 │               │               │  User Found  │              │
 │               │  Issue JWT    │              │              │
 │               │◄──────────────┤              │              │
 │  JWT Token    │               │              │              │
 │◄──────────────┤               │              │              │
 │               │               │              │              │
 │  Store Token  │               │              │              │
 │  (localStorage)│              │              │              │
 │               │               │              │              │
 │  Create Task  │               │              │              │
 ├──────────────►│               │              │              │
 │               │  POST /api/{user_id}/tasks  │              │
 │               │  Authorization: Bearer <JWT> │              │
 │               ├─────────────────────────────►│              │
 │               │               │              │  Verify JWT  │
 │               │               │              │  (middleware)│
 │               │               │              │              │
 │               │               │              │  Check Auth  │
 │               │               │              │  (route)     │
 │               │               │              │              │
 │               │               │              │  INSERT Task │
 │               │               │              ├─────────────►│
 │               │               │              │◄─────────────┤
 │               │               │              │  Task Created│
 │               │  201 Created  │              │              │
 │               │◄─────────────────────────────┤              │
 │  Show Task    │               │              │              │
 │◄──────────────┤               │              │              │
```

---

## Security Guarantees

### Layer 1: JWT Signature Verification (Middleware)

**Guarantee**: Only tokens signed with `BETTER_AUTH_SECRET` are accepted
**Enforced By**: `backend/src/api/auth.py` (PyJWT library)
**Prevents**: Token tampering, forged tokens

### Layer 2: Token Expiration (Middleware)

**Guarantee**: Expired tokens are rejected (401 Unauthorized)
**Enforced By**: `backend/src/api/auth.py` (JWT `exp` claim check)
**Prevents**: Indefinite access with stolen tokens

### Layer 3: User Authorization (Route Handler)

**Guarantee**: Token `user_id` MUST match URL `user_id` (403 if mismatch)
**Enforced By**: `backend/src/api/routes/*.py` (manual check in every route)
**Prevents**: Privilege escalation (User A accessing User B's data)

### Layer 4: Data Filtering (Database Query)

**Guarantee**: ALL queries filter by `current_user` from token (NOT URL)
**Enforced By**: `backend/src/api/routes/*.py` (WHERE clause in every query)
**Prevents**: Data leakage across users

### Layer 5: Environment Validation (Startup)

**Guarantee**: `BETTER_AUTH_SECRET` ≥32 characters, validated on startup
**Enforced By**: `backend/src/api/config.py` (Pydantic Settings validators)
**Prevents**: Weak secrets, configuration errors

---

## Failure Scenarios

### Scenario 1: Missing JWT Token

**Request**:
```http
GET /api/user123/tasks HTTP/1.1
# No Authorization header
```

**Response**:
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "detail": "Missing authentication token"
}
```

**User Experience**: Frontend redirects to `/login?error=session_expired`

---

### Scenario 2: Expired JWT Token

**Request**:
```http
GET /api/user123/tasks HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Token expired (exp claim in the past)
```

**Response**:
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "detail": "Token has expired"
}
```

**User Experience**: Frontend clears localStorage, redirects to `/login`

---

### Scenario 3: Invalid Signature (Tampered Token)

**Request**:
```http
GET /api/user123/tasks HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Token signature doesn't match BETTER_AUTH_SECRET
```

**Response**:
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "detail": "Invalid token"
}
```

**User Experience**: Frontend clears localStorage, redirects to `/login`

---

### Scenario 4: Privilege Escalation Attempt

**Request**:
```http
GET /api/victim_user_id/tasks HTTP/1.1
Authorization: Bearer attacker_valid_token
# Attacker token is valid, but user_id doesn't match
```

**Response**:
```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "detail": "Access denied: You can only access your own tasks"
}
```

**User Experience**: Frontend shows error toast: "Access denied"

---

### Scenario 5: Malformed Token

**Request**:
```http
GET /api/user123/tasks HTTP/1.1
Authorization: Bearer not-a-valid-jwt-token
```

**Response**:
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "detail": "Invalid token"
}
```

**User Experience**: Frontend redirects to `/login`

---

## Code References

### Backend Files

| File | Purpose | Key Functions |
|------|---------|--------------|
| `backend/src/api/auth.py` | JWT verification middleware | `get_current_user()` |
| `backend/src/api/config.py` | Environment validation | `Settings` class with validators |
| `backend/src/api/models.py` | User entity definition | `User` SQLModel class |
| `backend/src/api/routes/tasks.py` | Task CRUD endpoints | All route handlers with auth checks |
| `backend/src/api/main.py` | FastAPI app initialization | CORS middleware configuration |

### Frontend Files

| File | Purpose | Key Functions |
|------|---------|--------------|
| `frontend/lib/api.ts` | API client with JWT auto-attachment | `fetchWithAuth()`, `api.*()` methods |
| `frontend/lib/auth.ts` | Better Auth client | `betterAuth.signIn()`, `betterAuth.signUp()` |
| `frontend/types/api.ts` | TypeScript type definitions | `Task`, `User`, `CreateTaskInput` |
| `frontend/app/login/page.tsx` | Login page | `handleLogin()` |
| `frontend/hooks/useAuth.ts` | Auth state management | `useAuth()` hook |

### Configuration Files

| File | Purpose |
|------|---------|
| `backend/.env` | Backend environment variables (BETTER_AUTH_SECRET, DATABASE_URL) |
| `frontend/.env.local` | Frontend environment variables (BETTER_AUTH_SECRET, NEXT_PUBLIC_API_URL) |
| `backend/.env.example` | Backend environment template |
| `frontend/.env.local.example` | Frontend environment template |

---

## Testing Requirements

### Critical Path Tests (100% Coverage MANDATORY)

**Authentication Flow Tests** (`backend/tests/test_auth.py`):
1. ✅ Valid JWT token → 200
2. ✅ Expired JWT token → 401
3. ✅ Invalid signature → 401
4. ✅ Malformed token → 401
5. ✅ Missing token → 401
6. ✅ Token with wrong user_id → 403
7. ✅ Token payload missing user_id → 401
8. ✅ Token with future expiry → 200

**User Isolation Tests** (`backend/tests/test_user_isolation.py`):
1. ✅ Query filtering → Verify `WHERE user_id = token_user_id`
2. ✅ Cross-user access prevention → User A cannot access User B's tasks
3. ✅ URL manipulation → Changing URL `user_id` returns 403

**CRUD with Authorization Tests** (`backend/tests/test_tasks.py`):
1. ✅ List tasks → Returns only user's tasks (not other users')
2. ✅ Get own task → 200
3. ✅ Get other user's task → 403
4. ✅ Get non-existent task → 404
5. ✅ Create task → Uses token `user_id` (not URL `user_id`)
6. ✅ Update/delete other user's task → 403

### Test Implementation Example

```python
# backend/tests/test_auth.py
import pytest
from fastapi.testclient import TestClient
import jwt
from datetime import datetime, timedelta
from src.api.main import app
from src.api.config import settings

client = TestClient(app)

def test_valid_jwt_token():
    """Test that valid JWT token allows access"""
    # Create valid token
    payload = {
        "user_id": "test_user",
        "email": "test@example.com",
        "exp": datetime.utcnow() + timedelta(days=1),
        "iat": datetime.utcnow()
    }
    token = jwt.encode(payload, settings.better_auth_secret, algorithm="HS256")

    # Make request with valid token
    response = client.get(
        "/api/test_user/tasks",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200

def test_expired_jwt_token():
    """Test that expired JWT token returns 401"""
    # Create expired token
    payload = {
        "user_id": "test_user",
        "email": "test@example.com",
        "exp": datetime.utcnow() - timedelta(days=1),  # Expired yesterday
        "iat": datetime.utcnow() - timedelta(days=2)
    }
    token = jwt.encode(payload, settings.better_auth_secret, algorithm="HS256")

    # Make request with expired token
    response = client.get(
        "/api/test_user/tasks",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Token has expired"

def test_privilege_escalation_attempt():
    """Test that User A cannot access User B's tasks"""
    # Create token for User A
    payload = {
        "user_id": "user_a",
        "email": "usera@example.com",
        "exp": datetime.utcnow() + timedelta(days=1),
        "iat": datetime.utcnow()
    }
    token_a = jwt.encode(payload, settings.better_auth_secret, algorithm="HS256")

    # User A tries to access User B's tasks
    response = client.get(
        "/api/user_b/tasks",  # ← Different user_id!
        headers={"Authorization": f"Bearer {token_a}"}
    )

    assert response.status_code == 403
    assert "Access denied" in response.json()["detail"]
```

---

## Environment Configuration

### Shared Secret Requirement

**CRITICAL**: Backend and frontend MUST use the **SAME** secret for JWT signing/verification.

**Backend** (`.env`):
```bash
BETTER_AUTH_SECRET=your-32-character-secret-here-abc123xyz
```

**Frontend** (`.env.local`):
```bash
BETTER_AUTH_SECRET=your-32-character-secret-here-abc123xyz
```

**Generate Secure Secret**:
```bash
# Option 1: Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Option 2: OpenSSL
openssl rand -base64 32
```

### Validation on Startup

**Backend** (`backend/src/api/config.py`):
```python
from pydantic_settings import BaseSettings
from pydantic import validator

class Settings(BaseSettings):
    better_auth_secret: str

    @validator('better_auth_secret')
    def validate_secret_length(cls, v):
        if len(v) < 32:
            raise ValueError(
                f'BETTER_AUTH_SECRET must be at least 32 characters. '
                f'Current length: {len(v)}'
            )
        return v

settings = Settings()  # Raises error on startup if invalid
```

---

## Production Considerations

### Token Expiry

**Development**: 7 days (easier testing)
**Production**: 1 day (better security)

### Token Storage

**Current Implementation**: localStorage (accessible to JavaScript)
**Production Recommendation**: httpOnly cookies (not accessible to JavaScript, prevents XSS attacks)

### HTTPS Enforcement

**Development**: HTTP allowed (localhost)
**Production**: HTTPS REQUIRED (prevents token interception)

### CORS Configuration

**Development**: Allow `http://localhost:3000`
**Production**: Allow only production frontend domain (`https://yourdomain.com`)

### Token Rotation

**Not Implemented in Phase 2**: Tokens remain valid until expiry
**Future Enhancement**: Implement token refresh mechanism (short-lived access tokens + long-lived refresh tokens)

---

## Summary

### Authentication Flow Checklist

- [x] **Step 1**: Better Auth issues JWT token after successful login
- [x] **Step 2**: Frontend auto-attaches token to all API requests
- [x] **Step 3**: Backend middleware verifies token signature and expiration
- [x] **Step 4**: Route handler checks token `user_id` matches URL `user_id`
- [x] **Step 5**: Database queries filter by token `user_id` (NOT URL)

### Security Checklist

- [x] JWT signature verified on every request
- [x] Token expiration enforced (401 if expired)
- [x] User authorization checked (403 if user_id mismatch)
- [x] Data filtered by authenticated user (user isolation)
- [x] Environment variables validated on startup
- [x] No hardcoded secrets in source code
- [x] CORS configured to allow only frontend origin
- [x] Clear error messages (no sensitive info leaked)

### Test Coverage Checklist

- [x] Authentication flow tests (8 scenarios)
- [x] User isolation tests (3 scenarios)
- [x] CRUD with authorization tests (6 scenarios)
- [x] 100% coverage for critical paths (mandatory)

---

**Authentication Flow Architecture Complete**: All 5 steps documented with diagrams, code examples, security guarantees, and test requirements. Ready for implementation.
