# Full Authorization Integration Guide (Cross-Platform)

This document provides a comprehensive overview of the authentication and authorization system implemented in the Todo Application, specifically optimized for cross-platform stability (Windows/Linux).

## 1. Architecture Overview

The system uses a **Stateless JWT (JSON Web Token)** architecture. Authentication is handled by the backend, which issues tokens that the frontend stores and attaches to subsequent requests.

- **Backend**: FastAPI (Python)
- **Frontend**: Next.js (Web) & React (Chatbot)
- **Auth Provider**: Custom implementation using `PyJWT` and `SQLModel`.

## 2. JWT Middleware Implementation

### Token Generation (`backend/src/api/routes/auth.py`)
Tokens are generated using the `HS256` algorithm and a secret key (`BETTER_AUTH_SECRET`).

```python
def create_jwt_token(user_id: str, email: str) -> str:
    now = int(time.time())
    exp = now + (24 * 60 * 60) # 24 hours
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": exp,
        "iat": now,
    }
    return jwt.encode(payload, settings.better_auth_secret, algorithm="HS256")
```

### Verification Middleware (`backend/src/api/auth.py`)
Every protected endpoint uses a dependency to verify the token:

1. Extract `Authorization: Bearer <token>` header.
2. Decode and verify signature using the secret.
3. Validate expiration (`exp`).
4. Extract `user_id` and provide it to the route handler.

## 3. Critical Fixes & Error Resolving

### Issue 1: Windows `[Errno 22] Invalid argument` (LOGGING CRASH)
**Status**: ✅ FIXED

**Detail**: When running on Windows (especially under Uvicorn with reload), logging special characters or emojis (🚀, ✅) to `stdout` causes a crash if the encoding is not explicitly set to UTF-8.

**Resolution**: Force UTF-8 encoding in the logger initialization:
```python
# backend/mcp/utils/logger.py
import sys
import io

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", line_buffering=True)
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", line_buffering=True)
```
Additionally, all technical emojis were removed from middleware logs in `backend/src/api/main.py`.

### Issue 2: PostgreSQL Schema Mismatch (`psycopg.errors.CannotCoerce`)
**Status**: ✅ FIXED

**Detail**: The registration flow was sending `int(time.time())` for the `created_at` field, but the PostgreSQL database (Neon) expected a `TIMESTAMP`.

**Resolution**: Updated the `User` model instantiation to use `datetime.utcnow()`:
```python
# backend/src/api/routes/auth.py
user = User(
    ...,
    created_at=datetime.utcnow(),
)
```

### Issue 3: Multi-Frontend CORS Conflicts
**Status**: ✅ FIXED

**Detail**: The application has two frontends (Web on port 3000 and Chatbot on port 3001) that both need to access the same API.

**Resolution**: Configured a dynamic CORS middleware that parses the `FRONTEND_URL` environment variable:
```python
# backend/src/api/main.py
frontend_origins = [url.strip() for url in settings.frontend_url.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 4. Security Requirements (Constitution Compliance)

1. **User Isolation**: NEVER use `user_id` from a URL to query the database. ALWAYS use the `user_id` extracted from the verified JWT.
2. **Secret Rotation**: `BETTER_AUTH_SECRET` must be at least 32 characters. If compromised, rotate it immediately and all users will be logged out.
3. **Password Security**: Passwords are never stored in plain text. A hashing mechanism (`hash_password`) is used before storage.

## 5. Development Workflow

- **Local Development**: Ensure `.env` contains `BETTER_AUTH_SECRET` and `DATABASE_URL`.
- **Testing**: Run `pytest tests/test_auth.py` to verify the JWT flow (100% coverage target).
- **Logs**: JSON logs are output to `stdout` for cloud-native visibility.

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)
