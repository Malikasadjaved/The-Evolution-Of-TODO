# Backend Development Guide - Phase 2

## Overview

This is the FastAPI backend for the Phase 2 Full-Stack Todo Application.

**Tech Stack**:
- Python 3.11+
- FastAPI 0.109+ (Web framework)
- SQLModel 0.0.14+ (ORM)
- PostgreSQL 15+ via Neon (Database)
- PyJWT (Authentication)
- pytest (Testing)

## Project Structure

```
backend/
├── src/
│   └── api/
│       ├── __init__.py
│       ├── main.py              # FastAPI app initialization, CORS
│       ├── config.py            # Pydantic Settings validation
│       ├── auth.py              # JWT verification middleware
│       ├── db.py                # SQLModel engine, session management
│       ├── models.py            # Database models (User, Task, Tag, TaskTag)
│       └── routes/
│           ├── __init__.py
│           └── tasks.py         # Task CRUD endpoints
├── tests/
│   ├── __init__.py
│   ├── conftest.py              # pytest fixtures
│   ├── test_auth.py             # JWT verification tests (100% coverage required)
│   └── test_tasks.py            # CRUD + user isolation tests (100% coverage required)
├── .env                         # Environment variables (DO NOT COMMIT)
├── .env.example                 # Environment template
├── requirements.txt             # Python dependencies
├── pyproject.toml               # Black, mypy, pytest configuration
└── .flake8                      # Flake8 configuration
```

## Setup Instructions

### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Configure Environment

Copy `.env.example` to `.env` and update:

```bash
cp .env.example .env
```

**Required Variables**:
- `BETTER_AUTH_SECRET`: ✅ Already generated (EWNhWQFikqssCNiZtGZrUVK32lnGWoobrM9ttp8ezE8)
- `DATABASE_URL`: 🔴 Replace with your Neon PostgreSQL connection string
- `FRONTEND_URL`: Default `http://localhost:3000`

### 4. Run Server

```bash
# Development (with auto-reload)
uvicorn src.api.main:app --reload --port 8000

# Production
uvicorn src.api.main:app --host 0.0.0.0 --port 8000
```

**Access**:
- API: http://localhost:8000
- Swagger Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Development Workflow

### Code Quality

```bash
# Format code
black src/ tests/

# Lint
flake8 src/ tests/

# Type check
mypy src/
```

### Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src/api --cov-report=html

# Run specific test file
pytest tests/test_auth.py -v

# Run specific test
pytest tests/test_auth.py::test_valid_jwt_token -v
```

**Test Coverage Requirements** (Constitution Section VIII):
- ✅ **100% MANDATORY** for critical paths:
  - `src/api/auth.py` (JWT verification)
  - `src/api/routes/tasks.py` (CRUD + user isolation)
- ✅ **60% minimum** overall coverage

### Database Management

```bash
# Initialize tables (development only)
python -c "from src.api.db import create_tables; create_tables()"

# For production, use Alembic migrations
```

## Critical Security Requirements

### 1. JWT Verification (100% Test Coverage)

**ALL protected endpoints MUST**:
- Verify JWT token signature using `BETTER_AUTH_SECRET`
- Extract `user_id` from token payload
- Use `Depends(get_current_user)` middleware

**Example**:
```python
from src.api.auth import get_current_user

@app.get("/api/{user_id}/tasks")
async def get_tasks(
    user_id: str,
    current_user: str = Depends(get_current_user),  # ← CRITICAL
    session: Session = Depends(get_session)
):
    # current_user is extracted from JWT token
    ...
```

### 2. Authorization Check

**Verify token `user_id` matches URL `user_id`**:

```python
# Step 1: Authorization check
if user_id != current_user:
    raise HTTPException(status_code=403, detail="Access denied")
```

### 3. Data Filtering (User Isolation)

**ALWAYS filter by `current_user` (from token), NEVER by `user_id` (from URL)**:

```python
# ✅ CORRECT - Filter by token user_id
tasks = session.exec(
    select(Task).where(Task.user_id == current_user)
).all()

# ❌ WRONG - Security vulnerability!
tasks = session.exec(
    select(Task).where(Task.user_id == user_id)  # URL can be manipulated!
).all()
```

## API Endpoints

All endpoints documented in `specs/001-fullstack-web-app/contracts/api-endpoints.md`.

**Authentication Flow**:
1. Frontend: User signs up/logs in via Better Auth
2. Frontend: Better Auth issues JWT token
3. Frontend: Attaches token to all API requests (`Authorization: Bearer <token>`)
4. Backend: Verifies token signature (`auth.py::get_current_user`)
5. Backend: Checks authorization (`user_id == current_user`)
6. Backend: Filters data by `current_user`

## Common Commands

```bash
# Start development server
uvicorn src.api.main:app --reload --port 8000

# Run tests with coverage
pytest --cov=src/api --cov-report=html

# Format all code
black src/ tests/

# Type check
mypy src/

# Lint
flake8 src/ tests/

# Install new dependency
pip install <package>
pip freeze > requirements.txt
```

## Troubleshooting

### `BETTER_AUTH_SECRET must be at least 32 characters`
✅ **Fixed**: Secret is already 43 characters (EWNhWQFikqssCNiZtGZrUVK32lnGWoobrM9ttp8ezE8)

### `could not connect to server: Connection refused` (PostgreSQL)
🔴 **Action Required**: Update `DATABASE_URL` in `.env` with your Neon connection string

### `ModuleNotFoundError: No module named 'fastapi'`
```bash
source venv/bin/activate  # Activate virtual environment
pip install -r requirements.txt
```

### `401 Unauthorized` on all requests
- Check JWT token is present in `Authorization: Bearer <token>` header
- Verify `BETTER_AUTH_SECRET` matches frontend exactly
- Check token hasn't expired

### `403 Forbidden` when accessing tasks
- Verify token `user_id` matches URL `user_id`
- Check database queries filter by `current_user` (from token)

## Next Steps

1. ✅ **Phase 1 (Setup)**: Complete
2. ⏭️ **Phase 2 (Foundational)**: Implement core infrastructure
   - T011-T023: Database models, JWT middleware, health check
3. ⏭️ **Phase 3 (US1 - Authentication)**: Write authentication tests
4. ⏭️ **Phase 4+ (User Stories)**: Implement features incrementally

---

**Backend Setup Complete**: Ready for Phase 2 (Foundational) implementation.
