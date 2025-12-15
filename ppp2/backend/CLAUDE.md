```markdown
# Backend Development Guidelines

## Stack
- **Framework**: FastAPI
- **ORM**: SQLModel
- **Database**: Neon PostgreSQL (Serverless)
- **Auth**: JWT tokens (verified from Better Auth)

## Project Structure
backend/
├── src/
│   └── api/
│       ├── main.py           # FastAPI app entry point
│       ├── models.py         # SQLModel database models
│       ├── db.py             # Database connection
│       ├── auth.py           # JWT verification middleware
│       └── routes/
│           ├── tasks.py      # Task CRUD endpoints
│           └── users.py      # User-related endpoints
├── tests/
├── requirements.txt
└── .env

## API Conventions

### Authentication
All routes require JWT token in header:
Authorization: Bearer

### Route Structure
- Base path: `/api/`
- User-scoped: `/api/{user_id}/tasks`
- Always filter by authenticated user

### Request/Response
- Use Pydantic models for validation
- Return JSON responses
- Handle errors with `HTTPException`

### Error Responses
```python
from fastapi import HTTPException

# 401 Unauthorized
raise HTTPException(status_code=401, detail="Invalid or missing token")

# 404 Not Found
raise HTTPException(status_code=404, detail="Task not found")

# 403 Forbidden
raise HTTPException(status_code=403, detail="Not authorized to access this task")

Database Models

Use SQLModel for all models:
from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    title: str
    description: Optional[str] = None
    priority: str = "MEDIUM"  # HIGH, MEDIUM, LOW
    tags: str = ""  # JSON string
    due_date: Optional[datetime] = None
    completed: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

Running Tests

pytest tests/ -v --cov=src

Environment Variables

Required in .env:
- DATABASE_URL - Neon PostgreSQL connection string
- BETTER_AUTH_SECRET - Shared secret with frontend
- JWT_ALGORITHM - Default: HS256
