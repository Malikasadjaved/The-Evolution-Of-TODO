# User Isolation Security Patterns

Complete guide for enforcing user isolation in multi-tenant applications.

## Security Principle

**Critical Rule**: Users must ONLY access their own data. Every database query MUST filter by the authenticated user's ID from the JWT token.

## The Attack Vector

### Vulnerable Code (IDOR - Insecure Direct Object Reference)

```python
# ❌ CRITICAL SECURITY VULNERABILITY
@app.get("/api/tasks/{task_id}")
async def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.get(Task, task_id)
    return task

# Attack: User A can access User B's tasks by guessing task IDs
# curl /api/tasks/123  (User A's task)
# curl /api/tasks/456  (User B's task - UNAUTHORIZED ACCESS!)
```

### Secure Code (User Isolation Enforced)

```python
# ✅ SECURE: User isolation enforced
@app.get("/api/tasks/{task_id}")
async def get_task(
    task_id: int,
    current_user_id: str = Depends(verify_token),
    db: Session = Depends(get_db)
):
    # Query with user_id filter
    statement = select(Task).where(
        Task.id == task_id,
        Task.user_id == current_user_id  # CRITICAL: Filter by token user_id
    )
    task = db.exec(statement).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return task

# Now User A cannot access User B's tasks
# curl /api/tasks/456 -> 404 (task belongs to User B, filtered out)
```

## User Isolation Patterns

### Pattern 1: URL Parameter Validation

**Scenario**: URL includes `user_id` parameter

```python
@app.get("/api/user/{user_id}/tasks")
async def get_user_tasks(
    user_id: str,
    current_user_id: str = Depends(verify_token),
    db: Session = Depends(get_db)
):
    # CRITICAL: Verify URL user_id matches token user_id
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

**Why 403 (not 401)**:
- 401: Authentication missing or invalid (no token)
- 403: Authenticated but not authorized (wrong user)

### Pattern 2: Resource-Level Isolation

**Scenario**: Global endpoint with automatic user filtering

```python
@app.get("/api/tasks")
async def get_tasks(
    current_user_id: str = Depends(verify_token),
    db: Session = Depends(get_db)
):
    # Automatically filter by current user
    statement = select(Task).where(Task.user_id == current_user_id)
    tasks = db.exec(statement).all()
    
    return {"tasks": tasks}

# No way to access other users' tasks
```

### Pattern 3: Create with Enforced user_id

**Scenario**: Creating resources for the authenticated user

```python
from pydantic import BaseModel

class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    # Note: No user_id field (enforced from token)

@app.post("/api/tasks")
async def create_task(
    task_data: TaskCreate,
    current_user_id: str = Depends(verify_token),
    db: Session = Depends(get_db)
):
    # ✅ SECURE: Override user_id with token value
    task = Task(
        **task_data.dict(),
        user_id=current_user_id  # Enforced from JWT, not request body
    )
    
    db.add(task)
    db.commit()
    db.refresh(task)
    
    return task

# Even if attacker sends: {"title": "...", "user_id": "victim_id"}
# user_id is ignored and overridden with current_user_id from token
```

### Pattern 4: Update with Ownership Verification

**Scenario**: Updating existing resources

```python
class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    completed: bool | None = None

@app.patch("/api/tasks/{task_id}")
async def update_task(
    task_id: int,
    task_data: TaskUpdate,
    current_user_id: str = Depends(verify_token),
    db: Session = Depends(get_db)
):
    # Get task with user isolation
    statement = select(Task).where(
        Task.id == task_id,
        Task.user_id == current_user_id  # Verify ownership
    )
    task = db.exec(statement).first()
    
    if not task:
        # 404 (not 403) - don't reveal if task exists
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update only provided fields
    update_data = task_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)
    
    # NEVER allow user_id to be updated
    task.user_id = current_user_id  # Enforce ownership
    
    db.add(task)
    db.commit()
    db.refresh(task)
    
    return task
```

### Pattern 5: Delete with Ownership Verification

```python
@app.delete("/api/tasks/{task_id}")
async def delete_task(
    task_id: int,
    current_user_id: str = Depends(verify_token),
    db: Session = Depends(get_db)
):
    # Get task with user isolation
    statement = select(Task).where(
        Task.id == task_id,
        Task.user_id == current_user_id
    )
    task = db.exec(statement).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(task)
    db.commit()
    
    return {"message": "Task deleted"}
```

## Advanced Patterns

### Pattern 6: Relationship-Based Isolation

**Scenario**: Tasks with subtasks, comments, etc.

```python
class Comment(SQLModel, table=True):
    id: int = Field(primary_key=True)
    task_id: int = Field(foreign_key="tasks.id")
    user_id: str = Field(foreign_key="users.id")  # Comment author
    content: str

@app.get("/api/tasks/{task_id}/comments")
async def get_comments(
    task_id: int,
    current_user_id: str = Depends(verify_token),
    db: Session = Depends(get_db)
):
    # Verify task ownership
    task_statement = select(Task).where(
        Task.id == task_id,
        Task.user_id == current_user_id  # User must own task
    )
    task = db.exec(task_statement).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Get comments for this task
    comment_statement = select(Comment).where(Comment.task_id == task_id)
    comments = db.exec(comment_statement).all()
    
    return {"comments": comments}
```

### Pattern 7: Shared Resources with Permissions

**Scenario**: Tasks shared between users

```python
class TaskShare(SQLModel, table=True):
    id: int = Field(primary_key=True)
    task_id: int = Field(foreign_key="tasks.id")
    shared_with_user_id: str = Field(foreign_key="users.id")
    permission: str  # "read", "write", "admin"

@app.get("/api/tasks/{task_id}")
async def get_task(
    task_id: int,
    current_user_id: str = Depends(verify_token),
    db: Session = Depends(get_db)
):
    # Check if user owns task OR has been granted access
    task_statement = select(Task).where(Task.id == task_id)
    task = db.exec(task_statement).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check ownership
    if task.user_id == current_user_id:
        return task  # Owner has full access
    
    # Check shared access
    share_statement = select(TaskShare).where(
        TaskShare.task_id == task_id,
        TaskShare.shared_with_user_id == current_user_id
    )
    share = db.exec(share_statement).first()
    
    if not share:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return task
```

## Database Query Patterns

### Using SQLModel select()

```python
from sqlmodel import select

# ✅ CORRECT: User isolation
statement = select(Task).where(
    Task.user_id == current_user_id
)
tasks = db.exec(statement).all()
```

### Using SQLAlchemy Query

```python
# ✅ CORRECT: User isolation
tasks = db.query(Task).filter(
    Task.user_id == current_user_id
).all()
```

### Multiple Filters

```python
# ✅ CORRECT: User isolation + other filters
statement = select(Task).where(
    Task.user_id == current_user_id,  # ALWAYS include this
    Task.completed == False,
    Task.priority == "high"
).order_by(Task.due_date)

tasks = db.exec(statement).all()
```

## Testing User Isolation

### Unit Test Example

```python
import pytest
from fastapi.testclient import TestClient

def test_user_cannot_access_other_users_tasks(client, user_a_token, user_b_token):
    """Test that User A cannot access User B's tasks"""
    
    # User B creates a task
    response_b = client.post(
        "/api/tasks",
        json={"title": "User B's secret task"},
        headers={"Authorization": f"Bearer {user_b_token}"}
    )
    assert response_b.status_code == 200
    task_b_id = response_b.json()["id"]
    
    # User A tries to access User B's task
    response_a = client.get(
        f"/api/tasks/{task_b_id}",
        headers={"Authorization": f"Bearer {user_a_token}"}
    )
    
    # Should return 404 (not 403, to avoid leaking task existence)
    assert response_a.status_code == 404

def test_user_can_only_see_own_tasks(client, user_a_token, user_b_token):
    """Test that users only see their own tasks in list"""
    
    # User A creates tasks
    for i in range(3):
        client.post(
            "/api/tasks",
            json={"title": f"User A task {i}"},
            headers={"Authorization": f"Bearer {user_a_token}"}
        )
    
    # User B creates tasks
    for i in range(2):
        client.post(
            "/api/tasks",
            json={"title": f"User B task {i}"},
            headers={"Authorization": f"Bearer {user_b_token}"}
        )
    
    # User A gets tasks
    response_a = client.get(
        "/api/tasks",
        headers={"Authorization": f"Bearer {user_a_token}"}
    )
    assert len(response_a.json()["tasks"]) == 3  # Only A's tasks
    
    # User B gets tasks
    response_b = client.get(
        "/api/tasks",
        headers={"Authorization": f"Bearer {user_b_token}"}
    )
    assert len(response_b.json()["tasks"]) == 2  # Only B's tasks
```

## Common Vulnerabilities

### Vulnerability 1: Missing user_id Filter

```python
# ❌ VULNERABILITY: No user isolation
@app.get("/api/tasks")
async def get_tasks(db: Session = Depends(get_db)):
    tasks = db.exec(select(Task)).all()  # Returns ALL users' tasks!
    return {"tasks": tasks}
```

### Vulnerability 2: Trusting URL Parameter

```python
# ❌ VULNERABILITY: URL user_id not verified
@app.get("/api/user/{user_id}/tasks")
async def get_tasks(user_id: str, db: Session = Depends(get_db)):
    # No token verification!
    statement = select(Task).where(Task.user_id == user_id)
    tasks = db.exec(statement).all()
    return {"tasks": tasks}

# Attack: Change URL to access other users
# /api/user/victim_id/tasks
```

### Vulnerability 3: Accepting user_id in Request Body

```python
# ❌ VULNERABILITY: user_id from untrusted source
class TaskCreate(BaseModel):
    user_id: str  # ❌ Client can set this!
    title: str

@app.post("/api/tasks")
async def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    new_task = Task(**task.dict())  # Uses client-provided user_id!
    db.add(new_task)
    db.commit()
    return new_task

# Attack: {"user_id": "victim_id", "title": "Malicious task"}
```

### Vulnerability 4: Information Leakage

```python
# ❌ INFORMATION LEAKAGE: Reveals task existence
@app.get("/api/tasks/{task_id}")
async def get_task(
    task_id: int,
    current_user_id: str = Depends(verify_token),
    db: Session = Depends(get_db)
):
    task = db.get(Task, task_id)
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.user_id != current_user_id:
        # ❌ LEAKS: Attacker knows task exists
        raise HTTPException(status_code=403, detail="Not your task")
    
    return task

# ✅ SECURE: Use 404 for both cases
if not task or task.user_id != current_user_id:
    raise HTTPException(status_code=404, detail="Task not found")
```

## Security Checklist

- [ ] ALL queries filter by `user_id == current_user_id`
- [ ] URL `user_id` parameters verified against JWT token (403 if mismatch)
- [ ] Resource creation enforces `user_id` from token (ignore request body)
- [ ] Resource updates verify ownership before modification
- [ ] Resource deletion verifies ownership before deletion
- [ ] Use 404 (not 403) to avoid leaking resource existence
- [ ] Never trust client-provided `user_id` values
- [ ] Test that users cannot access each other's resources
- [ ] Audit all database queries for missing user filters
- [ ] Use Depends(verify_token) on ALL protected routes
