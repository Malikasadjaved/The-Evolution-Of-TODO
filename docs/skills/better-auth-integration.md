# Better Auth Integration - Complete Guide

> **Battle-tested implementation from production-ready Todo App**
> **⏱️ Setup time: < 5 minutes with copy-paste**

## Table of Contents

1. [Quick Start (1-Minute Setup)](#1-quick-start-1-minute-setup)
2. [Backend Integration (FastAPI + JWT)](#2-backend-integration-fastapi--jwt)
3. [Frontend Integration (Next.js + Better Auth)](#3-frontend-integration-nextjs--better-auth)
4. [Common Errors & Solutions](#4-common-errors--solutions-from-our-experience)
5. [Production Checklist](#5-production-checklist)
6. [Debugging Guide](#6-debugging-guide)

---

## 1. Quick Start (1-Minute Setup)

### Step 1: Generate Secret Key

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Output example:** `EWNhWQFikqssCNiZtGZrUVK32lnGWoobrM9ttp8ezE8` (43 characters)

### Step 2: Backend Environment (`.env`)

```bash
# CRITICAL: Must be at least 32 characters
BETTER_AUTH_SECRET=EWNhWQFikqssCNiZtGZrUVK32lnGWoobrM9ttp8ezE8

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/todo_db

# CORS (comma-separated for multiple frontends)
FRONTEND_URL=http://localhost:3000,http://localhost:3001

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=True
```

### Step 3: Frontend Environment (`.env.local`)

```bash
# Backend API URL (client-side)
NEXT_PUBLIC_API_URL=http://localhost:8000

# CRITICAL: Must match backend EXACTLY
NEXT_PUBLIC_BETTER_AUTH_SECRET=EWNhWQFikqssCNiZtGZrUVK32lnGWoobrM9ttp8ezE8

# Better Auth URL (frontend)
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000/api/auth
```

### Step 4: Install Dependencies

**Backend:**
```bash
pip install fastapi pyjwt pydantic pydantic-settings
```

**Frontend:**
```bash
npm install zod
```

### Step 5: Verification

```bash
# Backend
curl http://localhost:8000/health
# Expected: {"status":"healthy","timestamp":"..."}

# Frontend (after sign-up)
# Check localStorage: auth_token should exist
```

---

## 2. Backend Integration (FastAPI + JWT)

### 2.1 Configuration with Validation

**File:** `backend/src/api/config.py`

```python
"""
Configuration module with Pydantic Settings validation.

Environment variables are validated on application startup.
If validation fails, the application will not start.
"""

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with validation."""

    # Authentication (CRITICAL: Must be at least 32 characters)
    better_auth_secret: str

    # Database
    database_url: str

    # API Server
    host: str = "0.0.0.0"
    port: int = 8000

    # CORS (comma-separated list for multiple frontends)
    frontend_url: str = "http://localhost:3000,http://localhost:3001"

    # Debug mode
    debug: bool = True

    @field_validator("better_auth_secret")
    @classmethod
    def validate_secret_length(cls, v: str) -> str:
        """Validate BETTER_AUTH_SECRET is at least 32 characters."""
        if len(v) < 32:
            raise ValueError(
                f"BETTER_AUTH_SECRET must be at least 32 characters. "
                f"Current length: {len(v)}. "
                f'Generate with: python -c "import secrets; print(secrets.token_urlsafe(32))"'
            )
        return v

    @field_validator("database_url")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        """Validate DATABASE_URL is a valid connection string."""
        if not (v.startswith("postgresql://") or v.startswith("sqlite:///")):
            raise ValueError(
                "DATABASE_URL must be a valid database connection string. "
                "Supported: postgresql:// or sqlite:///"
            )
        return v

    class Config:
        """Pydantic configuration."""
        env_file = ".env"
        case_sensitive = False


# Initialize settings (validates on import)
settings = Settings()
```

### 2.2 JWT Validation Middleware

**File:** `backend/src/api/auth.py`

```python
"""
JWT authentication middleware.

This module provides JWT token verification for protected endpoints.
CRITICAL: 100% test coverage required.
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
```

### 2.3 JWT Token Generation

**File:** `backend/src/api/routes/auth.py` (excerpt)

```python
from datetime import datetime, timedelta
import jwt

def create_jwt_token(user_id: str, email: str) -> str:
    """Create JWT token for authenticated user."""
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(hours=24),  # 24 hour expiry
        "iat": datetime.utcnow(),
    }
    token = jwt.encode(payload, settings.better_auth_secret, algorithm="HS256")
    return token


@router.post("/sign-up", response_model=AuthResponse, status_code=201)
async def sign_up(request: SignUpRequest, session: Session = Depends(get_session)):
    """Register a new user."""
    # Check if email already exists
    existing = session.exec(select(User).where(User.email == request.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    # Create new user with generated UUID
    user = User(
        id=str(uuid4()),
        email=request.email,
        name=request.name,
        password_hash=hash_password(request.password),
        created_at=datetime.utcnow(),
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    # Generate JWT token
    token = create_jwt_token(user.id, user.email)

    return AuthResponse(
        token=token,
        user={"id": user.id, "email": user.email, "name": user.name},
    )
```

### 2.4 CORS Configuration

**File:** `backend/src/api/main.py` (excerpt)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings

app = FastAPI(title="Todo App API")

# Parse comma-separated frontend URLs
frontend_origins = [url.strip() for url in settings.frontend_url.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,  # ["http://localhost:3000", "http://localhost:3001"]
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
```

### 2.5 Protected Endpoint Example

```python
from fastapi import Depends
from .auth import get_current_user

@app.get("/api/{user_id}/tasks")
async def get_tasks(
    user_id: str,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Step 1: Authorization check (CRITICAL)
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Access denied")

    # Step 2: Data filtering (ALWAYS use current_user from token)
    tasks = session.exec(
        select(Task).where(Task.user_id == current_user)  # ← Use token user_id
    ).all()

    return {"tasks": tasks}
```

---

## 3. Frontend Integration (Next.js + Better Auth)

### 3.1 Environment Validation

**File:** `frontend-web/lib/env.ts`

```typescript
import { z } from 'zod'

const envSchema = z.object({
  /**
   * Backend API base URL (client-side).
   * Used by lib/api.ts for browser-initiated API requests.
   */
  NEXT_PUBLIC_API_URL: z.string().url({
    message: 'NEXT_PUBLIC_API_URL must be a valid URL',
  }),

  /**
   * Backend API base URL (server-side).
   * Used by Next.js API routes for server-to-server communication within Docker.
   */
  API_URL: z.string().url({
    message: 'API_URL must be a valid URL',
  }).optional().default(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'),

  /**
   * Better Auth secret key (shared with backend).
   * CRITICAL: Must be ≥32 characters and match backend BETTER_AUTH_SECRET.
   */
  NEXT_PUBLIC_BETTER_AUTH_SECRET: z
    .string()
    .min(32, {
      message: 'NEXT_PUBLIC_BETTER_AUTH_SECRET must be at least 32 characters',
    }),

  /**
   * Better Auth callback URL.
   */
  NEXT_PUBLIC_BETTER_AUTH_URL: z.string().url({
    message: 'NEXT_PUBLIC_BETTER_AUTH_URL must be a valid URL',
  }),
})

const parseEnv = () => {
  try {
    return envSchema.parse({
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      API_URL: process.env.API_URL,
      NEXT_PUBLIC_BETTER_AUTH_SECRET: process.env.NEXT_PUBLIC_BETTER_AUTH_SECRET,
      NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      console.error('❌ Environment validation failed:')
      messages.forEach(msg => console.error(`  - ${msg}`))
      throw new Error(`Environment validation failed:\n${messages.join('\n')}`)
    }
    throw error
  }
}

export const env = parseEnv()
export type Env = z.infer<typeof envSchema>
```

### 3.2 Authentication Hooks

**File:** `frontend-web/lib/auth.ts`

```typescript
import { env } from './env'

/**
 * Sign up hook.
 */
export const useSignUp = () => {
  return {
    signUp: async (data: { email: string; password: string; name: string }) => {
      const response = await fetch(`${env.NEXT_PUBLIC_BETTER_AUTH_URL}/sign-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Sign up failed')
      }

      const result = await response.json()

      // Store token in localStorage
      if (result.token) {
        localStorage.setItem('auth_token', result.token)
      }

      return result
    },
  }
}

/**
 * Sign in hook.
 */
export const useSignIn = () => {
  return {
    signIn: async (data: { email: string; password: string }) => {
      const response = await fetch(`${env.NEXT_PUBLIC_BETTER_AUTH_URL}/sign-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Sign in failed')
      }

      const result = await response.json()

      // Store token in localStorage
      if (result.token) {
        localStorage.setItem('auth_token', result.token)
      }

      return result
    },
  }
}

/**
 * Sign out hook.
 */
export const useSignOut = () => {
  return {
    signOut: async () => {
      // Clear token from localStorage
      localStorage.removeItem('auth_token')

      // Optional: Call backend to invalidate session
      await fetch(`${env.NEXT_PUBLIC_BETTER_AUTH_URL}/sign-out`, {
        method: 'POST',
      })

      // Redirect to login
      window.location.href = '/login'
    },
  }
}

/**
 * Session hook.
 */
export const useSession = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

  if (!token) {
    return { data: null, isLoading: false }
  }

  // Decode JWT to extract user info (client-side only, not verified)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return {
      data: {
        user: {
          id: payload.user_id,
          email: payload.email,
        },
      },
      isLoading: false,
    }
  } catch {
    return { data: null, isLoading: false }
  }
}
```

### 3.3 Auth Proxy Route (Docker-Compatible)

**File:** `frontend-web/app/api/auth/[...all]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function GET(request: NextRequest) {
  return handleAuthRequest(request)
}

export async function POST(request: NextRequest) {
  return handleAuthRequest(request)
}

async function handleAuthRequest(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract the auth endpoint path
    const url = new URL(request.url)
    const path = url.pathname.replace('/api/auth', '')

    // Build backend URL (use API_URL for Docker networking)
    const backendUrl = `${env.API_URL}/api/auth${path}`

    console.log(`[Auth Proxy] ${request.method} ${path} → ${backendUrl}`)

    // Prepare request body
    let body: string | undefined
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      body = await request.text()
    }

    // Prepare headers
    const headers = new Headers()
    headers.set('Content-Type', 'application/json')

    // Forward Authorization header if present
    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      headers.set('authorization', authHeader)
    }

    // Make request to backend
    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      body,
    })

    const responseBody = await response.text()

    console.log(`[Auth Proxy] Response: ${response.status}`)

    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('[Auth Proxy] Error:', error)
    return NextResponse.json(
      { error: 'Authentication service unavailable', details: String(error) },
      { status: 503 }
    )
  }
}
```

### 3.4 Usage in Components

```typescript
'use client'
import { useSignUp, useSignIn, useSession } from '@/lib/auth'
import { useState } from 'react'

export default function SignUpPage() {
  const { signUp } = useSignUp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await signUp({ email, password, name })
      window.location.href = '/dashboard'
    } catch (error) {
      console.error('Sign up failed:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Sign Up</button>
    </form>
  )
}
```

---

## 4. Common Errors & Solutions (From Our Experience)

### Error 1: `BETTER_AUTH_SECRET must be at least 32 characters`

**Symptom:** Backend fails to start with validation error.

**Root Cause:** Secret key is too short.

**Solution:**
```bash
# Generate a new 32+ character secret
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Copy output to both .env files (MUST match exactly)
```

**Verification:**
```bash
# Check length
echo "EWNhWQFikqssCNiZtGZrUVK32lnGWoobrM9ttp8ezE8" | wc -c
# Should output 44 (43 chars + newline)
```

---

### Error 2: `503 Service Unavailable` on Auth Endpoints

**Symptom:** Frontend shows 503 error when signing up/in.

**Root Cause:** Frontend trying to reach backend at `localhost:8000` from inside Docker container.

**Solution:**

**Docker Compose Environment:**
```yaml
# docker-compose.yml
services:
  frontend-web:
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000  # Client-side
      - API_URL=http://backend:8000                # Server-side (Docker network)
```

**Verification:**
```bash
docker logs todo-frontend-web --tail 20
# Should see: [Auth Proxy] POST /sign-up → http://backend:8000/api/auth/sign-up
# NOT:         [Auth Proxy] POST /sign-up → http://localhost:8000/api/auth/sign-up
```

---

### Error 3: CORS Error (`Access-Control-Allow-Origin`)

**Symptom:** Browser console shows CORS error.

**Root Cause:** Backend not allowing frontend origin.

**Solution:**

**Backend `.env`:**
```bash
# Allow multiple frontends (comma-separated)
FRONTEND_URL=http://localhost:3000,http://localhost:3001
```

**Verification:**
```bash
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: authorization" \
     -X OPTIONS \
     http://localhost:8000/api/auth/sign-in

# Should return:
# Access-Control-Allow-Origin: http://localhost:3000
# Access-Control-Allow-Credentials: true
```

---

### Error 4: `401 Unauthorized` on Protected Endpoints

**Symptom:** API returns 401 even with valid token.

**Root Cause:** Token format incorrect or secret mismatch.

**Solution:**

**Check token format:**
```typescript
// Correct format: "Bearer <token>"
const token = localStorage.getItem('auth_token')
const headers = {
  'Authorization': `Bearer ${token}`  // ← Note the "Bearer " prefix
}
```

**Check secret match:**
```bash
# Backend
grep BETTER_AUTH_SECRET backend/.env

# Frontend
grep BETTER_AUTH_SECRET frontend-web/.env.local

# MUST be identical!
```

**Verification:**
```bash
# Decode token payload (client-side only, for debugging)
TOKEN="eyJhbGc..."
echo $TOKEN | cut -d. -f2 | base64 -d | jq .

# Should show:
# {
#   "user_id": "123e4567-e89b-12d3-a456-426614174000",
#   "email": "user@example.com",
#   "exp": 1735344000,
#   "iat": 1735257600
# }
```

---

### Error 5: Token Expired

**Symptom:** `Token has expired. Please login again.`

**Root Cause:** Token expiry time exceeded (default 24 hours).

**Solution:**

**Extend expiry time (backend):**
```python
# backend/src/api/routes/auth.py
def create_jwt_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(days=7),  # ← 7 days instead of 24 hours
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, settings.better_auth_secret, algorithm="HS256")
```

**Handle expiry gracefully (frontend):**
```typescript
try {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  })

  if (response.status === 401) {
    // Token expired - redirect to login
    localStorage.removeItem('auth_token')
    window.location.href = '/login?error=session_expired'
  }
} catch (error) {
  // Handle error
}
```

---

### Error 6: `Cannot find module '@/types'` (TypeScript)

**Symptom:** Build fails with module not found error.

**Root Cause:** Path alias not configured correctly.

**Solution:**

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",  // ← Required for path aliases
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Docker: Include tsconfig.json in build:**
```dockerfile
# .dockerignore - Remove this line if present:
# tsconfig.json  ← DELETE THIS LINE
```

---

## 5. Production Checklist

### Security

- [ ] **Environment Variables**
  - [ ] `BETTER_AUTH_SECRET` is ≥32 characters
  - [ ] Secret is unique per environment (dev, staging, prod)
  - [ ] `.env` files excluded from git (in `.gitignore`)
  - [ ] Secrets stored in secure vault (AWS Secrets Manager, etc.)

- [ ] **CORS Configuration**
  - [ ] `FRONTEND_URL` only allows trusted origins
  - [ ] No wildcard (`*`) in production
  - [ ] HTTPS URLs in production

- [ ] **JWT Security**
  - [ ] Token expiry time appropriate (≤24 hours recommended)
  - [ ] Tokens transmitted over HTTPS only
  - [ ] No sensitive data in JWT payload

### Testing

- [ ] **Backend Tests**
  - [ ] JWT validation: 100% coverage (`test_auth.py`)
  - [ ] User isolation: Verified with integration tests
  - [ ] Error cases: 401, 403, token expiry

- [ ] **Frontend Tests**
  - [ ] Sign-up flow works
  - [ ] Sign-in flow works
  - [ ] Token stored in localStorage
  - [ ] Protected routes redirect unauthenticated users

### Monitoring

- [ ] **Logging**
  - [ ] Auth failures logged (without exposing passwords)
  - [ ] JWT verification errors tracked
  - [ ] CORS errors monitored

- [ ] **Metrics**
  - [ ] Sign-up success rate
  - [ ] Sign-in success rate
  - [ ] Token expiry rate
  - [ ] 401/403 error rate

---

## 6. Debugging Guide

### Symptom: Token validation fails

**Check 1: Secret Match**
```bash
# Backend
echo $BETTER_AUTH_SECRET

# Frontend
echo $NEXT_PUBLIC_BETTER_AUTH_SECRET

# MUST be identical
```

**Check 2: Token Format**
```bash
# Should be: "Bearer <token>"
# Check browser DevTools → Network → Request Headers → Authorization
```

**Check 3: Token Signature**
```python
# Test JWT decoding (Python)
import jwt
token = "eyJhbGc..."
secret = "EWNhWQFikqssCNiZtGZrUVK32lnGWoobrM9ttp8ezE8"

try:
    payload = jwt.decode(token, secret, algorithms=["HS256"])
    print("✓ Valid token:", payload)
except jwt.ExpiredSignatureError:
    print("✗ Token expired")
except jwt.InvalidTokenError:
    print("✗ Invalid token signature")
```

---

### Symptom: CORS errors

**Check 1: Origin Header**
```bash
# Browser DevTools → Network → Request Headers
# Look for: Origin: http://localhost:3000
```

**Check 2: Backend CORS Config**
```bash
# Should see in logs on startup:
# CORS origins: ['http://localhost:3000', 'http://localhost:3001']
```

**Check 3: Preflight Request**
```bash
curl -v -X OPTIONS http://localhost:8000/api/auth/sign-in \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST"

# Should return 200 OK with CORS headers
```

---

### Symptom: 401 errors

**Check 1: Token Present**
```javascript
// Browser console
localStorage.getItem('auth_token')
// Should return token string
```

**Check 2: Token Attached**
```javascript
// Browser DevTools → Network → Request Headers
// Should see: Authorization: Bearer eyJhbGc...
```

**Check 3: Backend Validation**
```bash
# Backend logs should show:
# INFO - → POST /api/user123/tasks from 127.0.0.1
# If 401: Check JWT verification in auth.py
```

---

### Symptom: 403 errors

**Check 1: User ID Match**
```typescript
// user_id from URL should match user_id from token
const token = localStorage.getItem('auth_token')
const payload = JSON.parse(atob(token.split('.')[1]))
console.log('Token user_id:', payload.user_id)
console.log('URL user_id:', window.location.pathname.split('/')[2])
// Should be identical
```

**Check 2: Authorization Logic**
```python
# Backend route should have:
if user_id != current_user:
    raise HTTPException(status_code=403, detail="Access denied")
```

---

## Battle-Tested Implementation Notes

### What We Learned

1. **Secret Length Matters**: PyJWT requires ≥32 characters. Use `secrets.token_urlsafe(32)` which generates 43 chars.

2. **Docker Networking**: Server-side requests (Next.js API routes) need `http://backend:8000`, client-side needs `http://localhost:8000`.

3. **CORS is Strict**: Must explicitly allow credentials and specific origins. Wildcards don't work with credentials.

4. **Token Storage**: localStorage is simple but vulnerable to XSS. For production, consider httpOnly cookies.

5. **Error Messages**: Generic "Invalid token" prevents user enumeration. Never expose "user not found" vs "wrong password".

### Performance Tips

- JWT verification is fast (~1ms) but check token expiry first to fail fast
- Cache validated tokens in memory for 5-10 seconds to reduce CPU
- Use connection pooling for database queries after auth

### Production Gotchas

- Token expiry should be shorter in production (4-8 hours)
- Refresh tokens should be implemented for better UX
- Rate limit auth endpoints to prevent brute force
- Monitor 401/403 rates - spikes indicate security issues

---

## Quick Reference

### Environment Variables

| Variable | Location | Example | Required |
|----------|----------|---------|----------|
| `BETTER_AUTH_SECRET` | Backend `.env` | `EWNhWQFikq...` | ✅ |
| `NEXT_PUBLIC_BETTER_AUTH_SECRET` | Frontend `.env.local` | `EWNhWQFikq...` | ✅ |
| `DATABASE_URL` | Backend `.env` | `postgresql://...` | ✅ |
| `FRONTEND_URL` | Backend `.env` | `http://localhost:3000` | ✅ |
| `NEXT_PUBLIC_API_URL` | Frontend `.env.local` | `http://localhost:8000` | ✅ |
| `API_URL` | Frontend `.env.local` (Docker) | `http://backend:8000` | Docker only |

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful auth operation |
| 201 | Created | User registered successfully |
| 400 | Bad Request | Invalid input (email exists, weak password) |
| 401 | Unauthorized | Missing/invalid/expired token |
| 403 | Forbidden | Valid token, wrong user |
| 500 | Server Error | Backend exception |
| 503 | Service Unavailable | Backend unreachable |

### Common Commands

```bash
# Generate secret
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Test backend health
curl http://localhost:8000/health

# Test sign-up
curl -X POST http://localhost:8000/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Test protected endpoint
curl http://localhost:8000/api/user123/tasks \
  -H "Authorization: Bearer eyJhbGc..."

# Check Docker logs
docker logs todo-backend --tail 50
docker logs todo-frontend-web --tail 50
```

---

**✅ Implementation Complete!** You now have a production-ready Better Auth integration with JWT authentication, tested and proven in a real application.
