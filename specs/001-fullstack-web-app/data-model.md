# Data Model: Full-Stack Web Application

**Feature**: Phase 2 Full-Stack Web Application
**Date**: 2025-12-15
**Branch**: `001-fullstack-web-app`
**Phase**: 1 (Design)

## Purpose

This document defines the complete database schema, entity relationships, and validation rules for the full-stack web application. All entities use SQLModel (SQLAlchemy + Pydantic) for type-safe ORM operations.

---

## Entity Relationship Diagram (ERD)

```
┌──────────────┐
│     User     │
│──────────────│
│ id (PK)      │──┐
│ email        │  │
│ name         │  │
│ created_at   │  │
└──────────────┘  │
                  │ 1:N (One user has many tasks)
                  │
┌──────────────┐  │
│     Task     │  │
│──────────────│  │
│ id (PK)      │  │
│ user_id (FK) │←─┘
│ title        │
│ description  │
│ status       │
│ priority     │
│ due_date     │
│ recurrence   │
│ created_at   │
│ updated_at   │
└──────────────┘
       │
       │ N:M (Many-to-many through TaskTag)
       │
       ↓
┌──────────────┐       ┌──────────────┐
│   TaskTag    │       │     Tag      │
│──────────────│       │──────────────│
│ task_id (FK) │──────→│ id (PK)      │
│ tag_id (FK)  │       │ user_id (FK) │
└──────────────┘       │ name         │
                       │ created_at   │
                       └──────────────┘
```

---

## 1. User Entity

### Purpose
Represents an authenticated user account. Created by Better Auth during signup.

### SQLModel Definition

```python
from sqlmodel import Field, SQLModel, Relationship
from typing import Optional, List
from datetime import datetime

class User(SQLModel, table=True):
    """
    User account entity.
    Created by Better Auth during signup/signin.
    """
    __tablename__ = "users"

    id: str = Field(primary_key=True)  # UUID from Better Auth
    email: str = Field(unique=True, index=True, max_length=255)
    name: str = Field(max_length=255)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    tasks: List["Task"] = Relationship(back_populates="user")
    tags: List["Tag"] = Relationship(back_populates="user")
```

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | str | PRIMARY KEY, NOT NULL | User ID (UUID from Better Auth) |
| `email` | str | UNIQUE, NOT NULL, INDEX | User email address |
| `name` | str | NOT NULL | User display name |
| `created_at` | datetime | NOT NULL, DEFAULT NOW() | Account creation timestamp |

### Indexes
- `email` (UNIQUE INDEX): Fast lookup for login
- `id` (PRIMARY KEY): Fast lookup for user_id filtering

### Validation Rules
- `email`: Must be valid email format (handled by Better Auth)
- `name`: 1-255 characters

### Relationships
- **1:N with Task**: One user has many tasks
- **1:N with Tag**: One user has many custom tags

### Security Notes
- **User Isolation**: All tasks and tags MUST be filtered by `user_id`
- **Authentication**: User creation handled by Better Auth (not backend API)
- **Password**: Stored and hashed by Better Auth (bcrypt), not in this table

---

## 2. Task Entity

### Purpose
Represents a todo task with all three-tier features (Primary: CRUD, Intermediate: priority/tags/search, Advanced: recurring/reminders).

### SQLModel Definition

```python
from sqlmodel import Field, SQLModel, Relationship
from typing import Optional, List
from datetime import datetime
from enum import Enum

class TaskStatus(str, Enum):
    """Task completion status"""
    INCOMPLETE = "INCOMPLETE"
    COMPLETE = "COMPLETE"

class TaskPriority(str, Enum):
    """Task priority level (Intermediate tier)"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class TaskRecurrence(str, Enum):
    """Task recurrence pattern (Advanced tier)"""
    NONE = "NONE"
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    MONTHLY = "MONTHLY"
    YEARLY = "YEARLY"

class Task(SQLModel, table=True):
    """
    Todo task entity with three-tier features.
    CRITICAL: Always filter by user_id for user isolation.
    """
    __tablename__ = "tasks"

    # Primary Key
    id: Optional[int] = Field(default=None, primary_key=True)

    # Foreign Key (CRITICAL: User isolation)
    user_id: str = Field(foreign_key="users.id", index=True)

    # Primary Tier: Basic CRUD fields
    title: str = Field(max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    status: TaskStatus = Field(default=TaskStatus.INCOMPLETE)

    # Intermediate Tier: Priority, Tags, Search, Filter, Sort
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM)
    due_date: Optional[datetime] = Field(default=None)

    # Advanced Tier: Recurring tasks
    recurrence: TaskRecurrence = Field(default=TaskRecurrence.NONE)
    last_completed_at: Optional[datetime] = Field(default=None)

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: Optional["User"] = Relationship(back_populates="tasks")
    task_tags: List["TaskTag"] = Relationship(
        back_populates="task",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
```

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | int | PRIMARY KEY, AUTO INCREMENT | Task ID |
| `user_id` | str | FOREIGN KEY, NOT NULL, INDEX | User who owns this task (CRITICAL for isolation) |
| `title` | str | NOT NULL, MAX 200 | Task title |
| `description` | str | NULLABLE, MAX 2000 | Task description (optional) |
| `status` | enum | NOT NULL, DEFAULT INCOMPLETE | INCOMPLETE or COMPLETE |
| `priority` | enum | NOT NULL, DEFAULT MEDIUM | LOW, MEDIUM, or HIGH |
| `due_date` | datetime | NULLABLE | Task deadline (optional) |
| `recurrence` | enum | NOT NULL, DEFAULT NONE | NONE, DAILY, WEEKLY, MONTHLY, YEARLY |
| `last_completed_at` | datetime | NULLABLE | Last completion timestamp (for recurring tasks) |
| `created_at` | datetime | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | datetime | NOT NULL, DEFAULT NOW() | Last update timestamp |

### Indexes
- `user_id` (INDEX): CRITICAL for fast user isolation queries
- `id` (PRIMARY KEY): Fast lookup by task ID
- Composite Index: `(user_id, status)` for filtering by user + status
- Composite Index: `(user_id, priority)` for filtering by user + priority
- Composite Index: `(user_id, due_date)` for filtering by user + due date

### Validation Rules
- `title`: 1-200 characters (required)
- `description`: 0-2000 characters (optional)
- `status`: INCOMPLETE or COMPLETE only
- `priority`: LOW, MEDIUM, or HIGH only
- `recurrence`: NONE, DAILY, WEEKLY, MONTHLY, or YEARLY only
- `due_date`: Future date only (optional)

### Relationships
- **N:1 with User**: Many tasks belong to one user
- **N:M with Tag** (via TaskTag): Many tasks can have many tags

### Business Rules

**Recurring Task Logic (Advanced Tier):**
- When a recurring task is marked COMPLETE:
  1. Update `last_completed_at` to current timestamp
  2. Calculate next due date based on `recurrence`:
     - DAILY: `due_date + 1 day`
     - WEEKLY: `due_date + 7 days`
     - MONTHLY: `due_date + 1 month`
     - YEARLY: `due_date + 1 year`
  3. Reset `status` to INCOMPLETE
  4. Task remains in list with new due date

**Overdue Detection:**
- Task is overdue if: `due_date < current_time AND status == INCOMPLETE`

### Security Notes
- **CRITICAL**: ALL queries MUST filter by `user_id` from JWT token (not URL)
- **Authorization Check**: Verify token `user_id` matches URL `user_id` (403 if mismatch)
- **User Isolation**: User A cannot access User B's tasks

---

## 3. Tag Entity

### Purpose
Represents a custom task category/label (Intermediate tier feature).

### SQLModel Definition

```python
from sqlmodel import Field, SQLModel, Relationship
from typing import Optional, List
from datetime import datetime

class Tag(SQLModel, table=True):
    """
    Custom task tag/category.
    CRITICAL: Tags are user-scoped (user isolation).
    """
    __tablename__ = "tags"

    # Primary Key
    id: Optional[int] = Field(default=None, primary_key=True)

    # Foreign Key (CRITICAL: User isolation)
    user_id: str = Field(foreign_key="users.id", index=True)

    # Tag Data
    name: str = Field(max_length=50, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: Optional["User"] = Relationship(back_populates="tags")
    task_tags: List["TaskTag"] = Relationship(
        back_populates="tag",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
```

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | int | PRIMARY KEY, AUTO INCREMENT | Tag ID |
| `user_id` | str | FOREIGN KEY, NOT NULL, INDEX | User who owns this tag (CRITICAL for isolation) |
| `name` | str | NOT NULL, MAX 50, INDEX | Tag name (e.g., "Work", "Home", "Urgent") |
| `created_at` | datetime | NOT NULL, DEFAULT NOW() | Creation timestamp |

### Indexes
- `user_id` (INDEX): CRITICAL for fast user isolation queries
- `name` (INDEX): Fast lookup for tag filtering
- UNIQUE Constraint: `(user_id, name)` to prevent duplicate tag names per user

### Validation Rules
- `name`: 1-50 characters, alphanumeric + spaces/hyphens
- `name`: Case-insensitive uniqueness per user (e.g., "Work" and "work" are duplicates)

### Relationships
- **N:1 with User**: Many tags belong to one user
- **N:M with Task** (via TaskTag): Many tags can be applied to many tasks

### Predefined Tags
- **Work**: Work-related tasks
- **Home**: Home-related tasks
- **Custom**: User can create unlimited custom tags

### Security Notes
- **CRITICAL**: ALL queries MUST filter by `user_id` from JWT token
- **User Isolation**: User A cannot see or use User B's tags

---

## 4. TaskTag Entity (Join Table)

### Purpose
Many-to-many relationship between Task and Tag (Intermediate tier feature).

### SQLModel Definition

```python
from sqlmodel import Field, SQLModel, Relationship
from typing import Optional

class TaskTag(SQLModel, table=True):
    """
    Join table for many-to-many Task ↔ Tag relationship.
    """
    __tablename__ = "task_tags"

    # Composite Primary Key
    task_id: int = Field(foreign_key="tasks.id", primary_key=True)
    tag_id: int = Field(foreign_key="tags.id", primary_key=True)

    # Relationships
    task: Optional["Task"] = Relationship(back_populates="task_tags")
    tag: Optional["Tag"] = Relationship(back_populates="task_tags")
```

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `task_id` | int | FOREIGN KEY, PRIMARY KEY | Task ID |
| `tag_id` | int | FOREIGN KEY, PRIMARY KEY | Tag ID |

### Indexes
- Composite Primary Key: `(task_id, tag_id)`
- Index on `task_id`: Fast lookup of all tags for a task
- Index on `tag_id`: Fast lookup of all tasks with a tag

### Validation Rules
- `task_id`: Must reference existing task
- `tag_id`: Must reference existing tag
- Uniqueness: Same (task_id, tag_id) pair cannot exist twice

### Relationships
- **N:1 with Task**: Many task-tag associations belong to one task
- **N:1 with Tag**: Many task-tag associations belong to one tag

### Cascade Behavior
- Delete Task → Delete all TaskTag entries (cascade delete)
- Delete Tag → Delete all TaskTag entries (cascade delete)

### Security Notes
- **User Isolation**: Verified implicitly through Task.user_id and Tag.user_id
- **No Direct Queries**: Join table is queried via Task or Tag relationships

---

## Database Schema (SQL DDL)

### PostgreSQL Schema

```sql
-- Users table (managed by Better Auth)
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- Tasks table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(2000),
    status VARCHAR(20) NOT NULL DEFAULT 'INCOMPLETE' CHECK (status IN ('INCOMPLETE', 'COMPLETE')),
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    due_date TIMESTAMP,
    recurrence VARCHAR(20) NOT NULL DEFAULT 'NONE' CHECK (recurrence IN ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY')),
    last_completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_user_id_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_user_id_priority ON tasks(user_id, priority);
CREATE INDEX idx_tasks_user_id_due_date ON tasks(user_id, due_date);

-- Tags table
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, name)
);

CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_tags_name ON tags(name);

-- TaskTags join table
CREATE TABLE task_tags (
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, tag_id)
);

CREATE INDEX idx_task_tags_task_id ON task_tags(task_id);
CREATE INDEX idx_task_tags_tag_id ON task_tags(tag_id);
```

---

## Database Migrations

### Initial Migration

Using SQLModel's `create_all()` method (development only):

```python
from sqlmodel import SQLModel, create_engine
from .config import settings

engine = create_engine(settings.database_url)

def create_tables():
    """Create all database tables. Run once during setup."""
    SQLModel.metadata.create_all(engine)
```

### Production Migrations

For production, use Alembic (SQLAlchemy migration tool):

```bash
# Install Alembic
pip install alembic

# Initialize Alembic
alembic init alembic

# Generate migration
alembic revision --autogenerate -m "Initial schema"

# Apply migration
alembic upgrade head
```

---

## Query Patterns (CRITICAL: User Isolation)

### ✅ CORRECT: Filter by Token user_id

```python
from sqlmodel import select, Session
from .auth import get_current_user

# Get all tasks for authenticated user
async def get_tasks(
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    tasks = session.exec(
        select(Task).where(Task.user_id == current_user)
    ).all()
    return tasks

# Get single task with authorization check
async def get_task(
    task_id: int,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    task = session.exec(
        select(Task).where(
            Task.id == task_id,
            Task.user_id == current_user  # CRITICAL: user isolation
        )
    ).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return task
```

### ❌ WRONG: Filter by URL user_id

```python
# SECURITY VULNERABILITY - DO NOT DO THIS
async def get_tasks(
    user_id: str,  # ← From URL, can be manipulated!
    session: Session = Depends(get_session)
):
    tasks = session.exec(
        select(Task).where(Task.user_id == user_id)  # ← WRONG!
    ).all()
    return tasks
```

---

## Testing Requirements (Constitution Section VIII)

### Critical Path Coverage: 100% Mandatory

**User Isolation Tests:**
1. Query filtering: Verify `WHERE user_id = token_user_id`
2. Cross-user access prevention: User A cannot access User B's tasks
3. URL manipulation: Changing URL `user_id` returns 403

**CRUD with Authorization Tests:**
1. List tasks: Returns only user's tasks (not other users')
2. Get task: Own task 200, other user's task 403, not found 404
3. Create task: Uses token `user_id` (not URL `user_id`)
4. Update task: Own task 200, other user's task 403
5. Delete task: Own task 204, other user's task 403
6. Tags: User can only see/use their own tags

---

## Next Steps

1. ✅ Data Model Complete: All entities defined with SQLModel
2. ⏭️ Contracts: Define REST API endpoints in `contracts/api-endpoints.md`
3. ⏭️ Quickstart: Generate setup instructions in `quickstart.md`
4. ⏭️ Implementation: Use `jwt_middleware_generator` skill to generate `backend/src/api/auth.py`
5. ⏭️ Testing: Write pytest tests for all entities (100% critical path coverage)

---

**Phase 1 (Data Model) Complete**: Database schema designed with user isolation, three-tier features, and SQLModel ORM. Ready for contract generation.
