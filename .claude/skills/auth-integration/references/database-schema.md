# PostgreSQL Schema Compliance Guide

Complete guide for maintaining PostgreSQL schema compliance in Python applications with SQLModel.

## The Timestamp Type Mismatch Problem

### Root Cause

PostgreSQL has strict type checking. Using Python `int` for PostgreSQL `TIMESTAMP` columns causes a type coercion error.

**Error**:
```
psycopg.errors.CannotCoerce: cannot cast type integer to timestamp without time zone
```

### Why This Happens

```python
import time

# ❌ WRONG: Unix timestamp (integer)
created_at = int(time.time())  # 1704470400 (integer)

# PostgreSQL TIMESTAMP column expects datetime object
# psycopg2/psycopg3 cannot automatically convert int → timestamp
```

### Solution

```python
from datetime import datetime

# ✅ CORRECT: Python datetime object
created_at = datetime.utcnow()  # 2024-01-05 12:00:00 (datetime)

# psycopg automatically converts datetime → PostgreSQL TIMESTAMP
```

## SQLModel Best Practices

### Model Definition with Timestamps

```python
from datetime import datetime
from typing import Optional
from sqlmodel import Field, SQLModel

class Task(SQLModel, table=True):
    """
    Task model with proper timestamp handling.
    """
    __tablename__ = "tasks"
    
    # Primary key
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Foreign key (user isolation)
    user_id: str = Field(foreign_key="users.id", index=True)
    
    # Task data
    title: str = Field(max_length=200)
    description: Optional[str] = None
    completed: bool = Field(default=False)
    priority: str = Field(default="medium")  # low, medium, high
    
    # Timestamps (CRITICAL: Use datetime, not int)
    created_at: datetime = Field(
        default_factory=datetime.utcnow,  # Auto-set on creation
        nullable=False
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,  # Auto-set on creation
        nullable=False,
        sa_column_kwargs={"onupdate": datetime.utcnow}  # Auto-update on modification
    )
    
    # Optional: Due date
    due_date: Optional[datetime] = None

class User(SQLModel, table=True):
    """
    User model for Better Auth integration.
    """
    __tablename__ = "users"
    
    id: str = Field(primary_key=True)  # Better Auth user ID
    email: str = Field(unique=True, index=True)
    name: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column_kwargs={"onupdate": datetime.utcnow}
    )
```

### Migration Script

```python
from sqlmodel import create_engine, SQLModel
from .models import Task, User
from .config import settings

# Create engine
engine = create_engine(settings.database_url)

def create_tables():
    """
    Create all tables.
    Run once during initial setup.
    """
    SQLModel.metadata.create_all(engine)
    print("✅ Tables created")

def drop_tables():
    """
    Drop all tables.
    WARNING: This deletes all data!
    """
    SQLModel.metadata.drop_all(engine)
    print("⚠️ Tables dropped")

if __name__ == "__main__":
    create_tables()
```

## CRUD Operations with Proper Timestamps

### Create (Insert)

```python
from datetime import datetime
from sqlmodel import Session, select

def create_task(
    db: Session,
    user_id: str,
    title: str,
    description: str = None
) -> Task:
    """
    Create a new task with automatic timestamps.
    """
    task = Task(
        user_id=user_id,
        title=title,
        description=description,
        # created_at and updated_at set automatically
    )
    
    db.add(task)
    db.commit()
    db.refresh(task)
    
    return task
```

### Update

```python
def update_task(
    db: Session,
    task_id: int,
    user_id: str,
    **updates
) -> Task:
    """
    Update task and refresh updated_at timestamp.
    """
    # Get task with user isolation
    statement = select(Task).where(
        Task.id == task_id,
        Task.user_id == user_id
    )
    task = db.exec(statement).first()
    
    if not task:
        raise ValueError("Task not found")
    
    # Update fields
    for key, value in updates.items():
        setattr(task, key, value)
    
    # Manually update timestamp (if onupdate not working)
    task.updated_at = datetime.utcnow()
    
    db.add(task)
    db.commit()
    db.refresh(task)
    
    return task
```

### Read with Timestamp Filtering

```python
from datetime import datetime, timedelta

def get_recent_tasks(
    db: Session,
    user_id: str,
    days: int = 7
) -> list[Task]:
    """
    Get tasks created in the last N days.
    """
    since = datetime.utcnow() - timedelta(days=days)
    
    statement = select(Task).where(
        Task.user_id == user_id,
        Task.created_at >= since  # Timestamp comparison
    ).order_by(Task.created_at.desc())
    
    tasks = db.exec(statement).all()
    return tasks

def get_overdue_tasks(
    db: Session,
    user_id: str
) -> list[Task]:
    """
    Get tasks past their due date.
    """
    now = datetime.utcnow()
    
    statement = select(Task).where(
        Task.user_id == user_id,
        Task.due_date < now,  # Past due
        Task.completed == False
    )
    
    tasks = db.exec(statement).all()
    return tasks
```

## Common Timestamp Patterns

### Pattern 1: Auto-Update Timestamp

```python
# SQLModel with SQLAlchemy onupdate
from sqlmodel import Field
from datetime import datetime

class Model(SQLModel, table=True):
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column_kwargs={
            "onupdate": datetime.utcnow,  # Auto-update on UPDATE
            "server_default": "NOW()"      # PostgreSQL default
        }
    )
```

### Pattern 2: Soft Delete with Timestamp

```python
class Task(SQLModel, table=True):
    # Soft delete
    deleted_at: Optional[datetime] = None
    is_deleted: bool = Field(default=False)
    
    def soft_delete(self):
        """Mark task as deleted"""
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()

# Query only non-deleted tasks
statement = select(Task).where(
    Task.user_id == user_id,
    Task.is_deleted == False
)
```

### Pattern 3: Timestamp Range Queries

```python
from datetime import datetime, timedelta

# Tasks created this week
week_start = datetime.utcnow() - timedelta(days=7)
statement = select(Task).where(
    Task.created_at >= week_start
)

# Tasks created between two dates
start_date = datetime(2024, 1, 1)
end_date = datetime(2024, 1, 31)
statement = select(Task).where(
    Task.created_at >= start_date,
    Task.created_at < end_date
)
```

## Timezone Considerations

### Use UTC Everywhere

```python
from datetime import datetime, timezone

# ✅ CORRECT: UTC timezone-aware
created_at = datetime.now(timezone.utc)

# ❌ WRONG: Naive datetime (no timezone)
created_at = datetime.now()  # Local time, ambiguous

# ✅ CORRECT: UTC timezone-naive (recommended for PostgreSQL)
created_at = datetime.utcnow()
```

### PostgreSQL Timezone Columns

```python
# Option 1: TIMESTAMP (no timezone, store UTC)
created_at: datetime = Field(default_factory=datetime.utcnow)

# Option 2: TIMESTAMPTZ (with timezone)
from sqlalchemy import Column, DateTime
from sqlmodel import Field

class Task(SQLModel, table=True):
    created_at: datetime = Field(
        sa_column=Column(
            DateTime(timezone=True),
            default=datetime.utcnow
        )
    )
```

**Recommendation**: Use `TIMESTAMP` (without timezone) and always store UTC.

## Alembic Migrations (Advanced)

### Initial Migration

```python
"""create tasks table

Revision ID: 001
"""

from alembic import op
import sqlalchemy as sa
from datetime import datetime

def upgrade():
    op.create_table(
        'tasks',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('completed', sa.Boolean(), default=False),
        sa.Column(
            'created_at',
            sa.DateTime(),
            nullable=False,
            server_default=sa.text('NOW()')  # PostgreSQL default
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(),
            nullable=False,
            server_default=sa.text('NOW()'),
            onupdate=datetime.utcnow
        ),
    )

def downgrade():
    op.drop_table('tasks')
```

### Add Timestamp Columns to Existing Table

```python
"""add timestamps to users

Revision ID: 002
"""

from alembic import op
import sqlalchemy as sa

def upgrade():
    # Add columns with default value
    op.add_column(
        'users',
        sa.Column(
            'created_at',
            sa.DateTime(),
            nullable=False,
            server_default=sa.text('NOW()')
        )
    )
    op.add_column(
        'users',
        sa.Column(
            'updated_at',
            sa.DateTime(),
            nullable=False,
            server_default=sa.text('NOW()')
        )
    )

def downgrade():
    op.drop_column('users', 'updated_at')
    op.drop_column('users', 'created_at')
```

## Testing Database Models

### Unit Test with Fixtures

```python
import pytest
from datetime import datetime
from sqlmodel import Session, create_engine, SQLModel
from .models import Task

@pytest.fixture
def db_session():
    """Create in-memory SQLite database for testing"""
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        yield session

def test_task_creation_timestamps(db_session):
    """Test that timestamps are auto-set on creation"""
    before = datetime.utcnow()
    
    task = Task(
        user_id="user_123",
        title="Test task"
    )
    db_session.add(task)
    db_session.commit()
    db_session.refresh(task)
    
    after = datetime.utcnow()
    
    # Verify timestamps are within expected range
    assert before <= task.created_at <= after
    assert before <= task.updated_at <= after
    assert task.created_at == task.updated_at  # Same on creation

def test_task_update_timestamp(db_session):
    """Test that updated_at changes on update"""
    # Create task
    task = Task(user_id="user_123", title="Original")
    db_session.add(task)
    db_session.commit()
    db_session.refresh(task)
    
    original_created = task.created_at
    original_updated = task.updated_at
    
    # Wait a moment (to ensure timestamp difference)
    import time
    time.sleep(0.1)
    
    # Update task
    task.title = "Updated"
    task.updated_at = datetime.utcnow()  # Manual update
    db_session.add(task)
    db_session.commit()
    db_session.refresh(task)
    
    # Verify timestamps
    assert task.created_at == original_created  # Unchanged
    assert task.updated_at > original_updated   # Changed
```

## Common Errors and Fixes

### Error 1: CannotCoerce Integer to Timestamp

```python
# ❌ WRONG
import time
task.created_at = int(time.time())

# ✅ CORRECT
from datetime import datetime
task.created_at = datetime.utcnow()
```

### Error 2: Naive Datetime Warning

```python
# Warning: DatetimeWithoutTZWarning

# ✅ Use UTC consistently
from datetime import datetime
task.created_at = datetime.utcnow()
```

### Error 3: Timestamp Format in JSON

```python
from datetime import datetime
import json

# ❌ WRONG: datetime not JSON serializable
json.dumps({"created_at": datetime.utcnow()})

# ✅ CORRECT: Convert to ISO string
from pydantic import BaseModel

class TaskResponse(BaseModel):
    created_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Or manually
task_dict = {
    "created_at": task.created_at.isoformat()
}
```

## Schema Validation Checklist

- [ ] All timestamp fields use `datetime` type (not `int`)
- [ ] `created_at` has `default_factory=datetime.utcnow`
- [ ] `updated_at` has `default_factory=datetime.utcnow`
- [ ] Optional timestamps (like `due_date`) use `Optional[datetime]`
- [ ] Consistent UTC usage (`datetime.utcnow()`)
- [ ] JSON serialization handles datetime (`.isoformat()`)
- [ ] Database migrations include proper timestamp columns
- [ ] Tests verify timestamp auto-setting and updates
