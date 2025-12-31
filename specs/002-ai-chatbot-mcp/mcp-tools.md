# MCP Tools Reference: Phase 3 AI Chatbot

**Model Context Protocol (MCP) Tools for Natural Language Task Management**

Version: 3.0.0

---

## Table of Contents

1. [Overview](#overview)
2. [Tool Architecture](#tool-architecture)
3. [Security & User Isolation](#security--user-isolation)
4. [Tools Reference](#tools-reference)
   - [1. add_task](#1-add_task)
   - [2. list_tasks](#2-list_tasks)
   - [3. complete_task](#3-complete_task)
   - [4. update_task](#4-update_task)
   - [5. delete_task](#5-delete_task)
5. [Common Types](#common-types)
6. [Error Handling](#error-handling)
7. [Integration Examples](#integration-examples)

---

## Overview

The Phase 3 AI Chatbot uses **5 MCP tools** that translate natural language into database operations. These tools are invoked by the OpenAI Agent when it understands user intent from conversational messages.

### What is MCP?

**Model Context Protocol (MCP)** is a standardized protocol for AI agents to interact with external systems. In Phase 3:
- **OpenAI Agent** understands natural language and decides which tool to call
- **MCP Server** (`backend/mcp/`) hosts the 5 tools as Python functions
- **Tools** execute database operations (PostgreSQL via SQLModel)
- **Response** is formatted as natural language by the agent

### Tool Catalog

| # | Tool Name | Purpose | User Story |
|---|-----------|---------|------------|
| 1 | `add_task` | Create new task from natural language | US1: Add task via chat |
| 2 | `list_tasks` | Query and filter tasks | US2: List tasks via chat |
| 3 | `complete_task` | Mark task as done | US3: Complete task via chat |
| 4 | `update_task` | Modify task properties | US4: Update task via chat |
| 5 | `delete_task` | Permanently remove task | US5: Delete task via chat |

---

## Tool Architecture

### Request Flow

```
User Message
    ↓
OpenAI Agent (GPT-4o)
    ↓
Extracts Intent + Parameters
    ↓
Calls MCP Tool (Python function)
    ↓
Tool validates input
    ↓
Tool queries PostgreSQL (filtered by user_id)
    ↓
Tool returns structured output
    ↓
Agent formats as natural language
    ↓
User sees response
```

### Example Flow

**User Input**: "Add a high priority task to finish the hackathon project by Friday"

**Agent Processing**:
1. Intent: Create task
2. Extracted data:
   - `title`: "Finish hackathon project"
   - `priority`: HIGH
   - `due_date`: 2025-12-29 (inferred from "Friday")
   - `tags`: [] (none mentioned)

**MCP Tool Call**:
```python
add_task(
    session=db_session,
    user_id="user_abc123",  # Injected by server from JWT token
    task_input=AddTaskInput(
        title="Finish hackathon project",
        priority=TaskPriority.HIGH,
        due_date=datetime(2025, 12, 29)
    )
)
```

**Tool Response**:
```python
AddTaskOutput(
    id=42,
    user_id="user_abc123",
    title="Finish hackathon project",
    priority="HIGH",
    status="INCOMPLETE",
    due_date=datetime(2025, 12, 29),
    tags=[],
    created_at=datetime(2025, 12, 26, 18, 30),
    updated_at=datetime(2025, 12, 26, 18, 30)
)
```

**Agent Response**: "I've created a high priority task to finish the hackathon project, due Friday."

---

## Security & User Isolation

### Critical Security Model

All MCP tools follow **strict user isolation**:

1. **user_id is INJECTED by server** from JWT token (NOT from agent input)
2. **All database queries filter by user_id** (users can only access their own data)
3. **Tags are user-scoped** (same tag name can exist for different users)
4. **Cannot access another user's tasks** (returns "Task not found" instead of "Access denied")

### Why User Isolation Matters

**Without Isolation** (❌ INSECURE):
```python
# BAD: Agent could manipulate user_id parameter
task_input = {"user_id": "victim_user", "title": "Hack their data"}
add_task(session, task_input)  # Would create task for victim!
```

**With Isolation** (✅ SECURE):
```python
# GOOD: user_id injected by server from verified JWT token
task_input = {"title": "My task"}  # No user_id in input
add_task(session, user_id="authenticated_user", task_input)  # Server provides user_id
```

### JWT Token Verification

Before calling any MCP tool, the backend:
1. Extracts JWT token from `Authorization: Bearer <token>` header
2. Verifies signature using `BETTER_AUTH_SECRET`
3. Checks expiration timestamp
4. Extracts `user_id` from token payload
5. Passes `user_id` to tool function (user cannot manipulate this)

**Security Guarantee**: Even if the agent is compromised or misbehaves, it **cannot access another user's data** because `user_id` is controlled by the server, not the agent.

---

## Tools Reference

### 1. add_task

**Create new task from natural language input.**

#### Purpose

Allows users to create tasks via conversational language. The agent extracts structured data (title, priority, due date, tags) from freeform text.

#### Use Cases

- "Add a task to buy groceries"
- "Create a high priority task: Finish report by tomorrow"
- "New task: Call Mom tomorrow with tag Personal"
- "Add urgent task to fix production bug ASAP"

#### Input Schema

```python
class AddTaskInput(BaseModel):
    title: str                        # Required: 1-500 characters
    description: Optional[str]        # Optional: max 2000 characters
    priority: TaskPriority            # Optional: LOW/MEDIUM/HIGH (default: MEDIUM)
    due_date: Optional[datetime]      # Optional: ISO 8601 datetime
    tags: Optional[List[str]]         # Optional: list of tag names
```

**Field Details**:
- `title`: **Required**. Task name (1-500 chars). Agent extracts main action from user message.
- `description`: Optional. Additional details (max 2000 chars). Agent includes context if available.
- `priority`: Optional. Defaults to `MEDIUM`. Agent infers from keywords like "urgent", "high priority", "low priority".
- `due_date`: Optional. ISO 8601 datetime. Agent parses relative dates ("tomorrow", "Friday", "next week").
- `tags`: Optional. List of strings (max 50 chars each). Agent extracts from keywords or explicit tags.

#### Output Schema

```python
class AddTaskOutput(BaseModel):
    id: int                           # Created task ID (database auto-increment)
    user_id: str                      # Owner user ID (from JWT token)
    title: str                        # Task title
    description: Optional[str]        # Task description (if provided)
    priority: TaskPriority            # Task priority (LOW/MEDIUM/HIGH)
    status: TaskStatus                # Always INCOMPLETE for new tasks
    due_date: Optional[datetime]      # Due date (if provided)
    tags: List[str]                   # Associated tags (sorted alphabetically)
    created_at: datetime              # Creation timestamp (UTC)
    updated_at: datetime              # Last update timestamp (UTC)
```

#### Behavior

1. Creates new `Task` record in database with `status=INCOMPLETE`
2. For each tag name:
   - Looks up tag by name AND `user_id` (user-scoped tags)
   - Creates new tag if doesn't exist for this user
   - Associates tag with task via `TaskTag` join table
3. Returns full task object with auto-generated ID and timestamps

#### Example Request/Response

**Natural Language Input**:
```
"Add a high priority task: Finish hackathon project by Friday with tags Work and Urgent"
```

**Agent Extracts**:
```python
AddTaskInput(
    title="Finish hackathon project",
    priority=TaskPriority.HIGH,
    due_date=datetime(2025, 12, 29),  # Agent parses "Friday"
    tags=["Work", "Urgent"]
)
```

**Tool Output**:
```python
AddTaskOutput(
    id=42,
    user_id="user_abc123",
    title="Finish hackathon project",
    description=None,
    priority=TaskPriority.HIGH,
    status=TaskStatus.INCOMPLETE,
    due_date=datetime(2025, 12, 29, 23, 59, 59),
    tags=["Urgent", "Work"],  # Sorted alphabetically
    created_at=datetime(2025, 12, 26, 18, 30, 0),
    updated_at=datetime(2025, 12, 26, 18, 30, 0)
)
```

**Agent Response**:
```
"I've created a high priority task to finish the hackathon project, due Friday.
Tagged as Work and Urgent."
```

#### Error Cases

| Error | Cause | Example |
|-------|-------|---------|
| **ValidationError** | Title missing or empty | `{"title": ""}` → 422 validation error |
| **ValidationError** | Title too long | `{"title": "a" * 501}` → 422 validation error |
| **ValidationError** | Description too long | `{"description": "a" * 2001}` → 422 validation error |
| **DatabaseError** | Database connection failed | PostgreSQL down → 500 internal error |

#### User Isolation

✅ **Security**: `user_id` is **injected by server** from JWT token, NOT from agent input.

```python
# Server code (secure):
user_id = extract_user_from_jwt(request.headers["Authorization"])  # From token
result = add_task(session, user_id, task_input)  # Server controls user_id
```

**Tag Isolation**: Tags are user-scoped. If User A creates tag "Work" and User B creates tag "Work", they are stored as separate records in the database (same name, different `user_id`).

---

### 2. list_tasks

**Query and filter tasks with optional filters.**

#### Purpose

Retrieve user's tasks with optional filtering by status, priority, or tag. Supports natural language queries like "show my high priority tasks" or "what tasks are pending?".

#### Use Cases

- "Show me my tasks"
- "What are my high priority tasks?"
- "List pending tasks"
- "Show completed tasks tagged Work"
- "What tasks are due this week?"

#### Input Schema

```python
class ListTasksInput(BaseModel):
    status: Optional[TaskStatus]      # Optional: INCOMPLETE/COMPLETE
    priority: Optional[TaskPriority]  # Optional: LOW/MEDIUM/HIGH
    tag: Optional[str]                # Optional: filter by tag name
    limit: int = 50                   # Optional: 1-100 (default: 50)
```

**Field Details**:
- `status`: Optional. Filter by completion status. Agent infers from keywords like "pending", "completed", "done".
- `priority`: Optional. Filter by priority level. Agent infers from "high priority", "low priority", etc.
- `tag`: Optional. Filter by single tag name (exact match, case-sensitive). Agent extracts from "tagged Work" or "with tag Personal".
- `limit`: Optional. Maximum tasks to return (1-100, default 50). Prevents overloading agent context.

#### Output Schema

```python
class TaskSummary(BaseModel):
    id: int
    title: str
    description: Optional[str]
    priority: TaskPriority
    status: TaskStatus
    due_date: Optional[datetime]
    tags: List[str]                   # All tags for this task (sorted)
    created_at: datetime

class ListTasksOutput(BaseModel):
    tasks: List[TaskSummary]          # Task summaries (newest first)
    count: int                        # Number of tasks returned
```

#### Behavior

1. Queries `Task` table filtered by `user_id` (user isolation)
2. Applies optional filters (status, priority, tag)
3. If tag filter specified:
   - Joins `Task → TaskTag → Tag`
   - Filters by tag name AND `user_id` (user-scoped tags)
4. Orders results by `created_at DESC` (newest first)
5. Applies `limit` (default 50, max 100)
6. For each task, loads associated tags
7. Returns task summaries with total count

#### Example Request/Response

**Natural Language Input**:
```
"Show me my high priority tasks"
```

**Agent Extracts**:
```python
ListTasksInput(
    priority=TaskPriority.HIGH,
    limit=50
)
```

**Tool Output**:
```python
ListTasksOutput(
    tasks=[
        TaskSummary(
            id=42,
            title="Finish hackathon project",
            description="Complete all features and tests",
            priority=TaskPriority.HIGH,
            status=TaskStatus.INCOMPLETE,
            due_date=datetime(2025, 12, 29, 23, 59, 59),
            tags=["Urgent", "Work"],
            created_at=datetime(2025, 12, 26, 18, 30, 0)
        ),
        TaskSummary(
            id=38,
            title="Fix production bug",
            description=None,
            priority=TaskPriority.HIGH,
            status=TaskStatus.COMPLETE,
            due_date=None,
            tags=[],
            created_at=datetime(2025, 12, 25, 14, 20, 0)
        )
    ],
    count=2
)
```

**Agent Response**:
```
"You have 2 high priority tasks:
1. Finish hackathon project (pending, due Friday) - tagged Urgent, Work
2. Fix production bug (complete)"
```

#### Error Cases

| Error | Cause | Example |
|-------|-------|---------|
| **ValidationError** | Invalid status enum | `{"status": "INVALID"}` → 422 validation error |
| **ValidationError** | Limit out of range | `{"limit": 0}` or `{"limit": 101}` → 422 validation error |
| **ValidationError** | Invalid priority enum | `{"priority": "EXTREME"}` → 422 validation error |
| **DatabaseError** | Database connection failed | PostgreSQL down → 500 internal error |

#### User Isolation

✅ **Security**: All queries filtered by `user_id` from JWT token.

```python
# Query always includes user_id filter:
statement = select(Task).where(Task.user_id == user_id)
```

**Tag Filter Isolation**: When filtering by tag, the query ensures tag belongs to the authenticated user:
```python
# Tag filter with user isolation:
statement = (
    statement
    .join(TaskTag, Task.id == TaskTag.task_id)
    .join(Tag, TaskTag.tag_id == Tag.id)
    .where(Tag.name == task_input.tag, Tag.user_id == user_id)
)
```

**Result**: User can only see their own tasks, even if they try to filter by another user's tag name.

---

### 3. complete_task

**Mark task as complete (done).**

#### Purpose

Allows users to mark tasks as done via conversational language. The agent identifies the task by ID (from prior conversation context) or title.

#### Use Cases

- "Mark the groceries task as complete"
- "Complete task 42"
- "I finished the report task"
- "Mark it as done" (contextual reference)

#### Input Schema

```python
class CompleteTaskInput(BaseModel):
    task_id: int                      # Required: ID of task to complete
```

**Field Details**:
- `task_id`: **Required**. Database ID of task to mark complete. Agent resolves from context or user-provided ID.

#### Output Schema

```python
class CompleteTaskOutput(BaseModel):
    id: int                           # Task ID
    title: str                        # Task title
    status: TaskStatus                # Always COMPLETE
    completed_at: Optional[datetime]  # Completion timestamp (UTC)
    message: str                      # Success message
```

#### Behavior

1. Finds task by `id` AND `user_id` (user isolation)
2. If task not found → raises exception (task doesn't exist or access denied)
3. If task already complete → returns success (idempotent, preserves original `completed_at`)
4. Otherwise:
   - Sets `status = COMPLETE`
   - Sets `completed_at = current UTC time`
   - Updates `updated_at = current UTC time`
5. Returns confirmation with task details

**Idempotency**: Calling `complete_task` multiple times on the same task is safe and returns success without error.

#### Example Request/Response

**Natural Language Input**:
```
"Mark the hackathon task as complete"
```

**Agent Extracts** (from conversation history):
```python
# Agent retrieves task_id from prior list_tasks result
CompleteTaskInput(task_id=42)
```

**Tool Output**:
```python
CompleteTaskOutput(
    id=42,
    title="Finish hackathon project",
    status=TaskStatus.COMPLETE,
    completed_at=datetime(2025, 12, 26, 19, 45, 0),
    message="Task 'Finish hackathon project' marked as complete."
)
```

**Agent Response**:
```
"Great! I've marked 'Finish hackathon project' as complete. Well done!"
```

#### Example: Idempotent Behavior

**Second Call** (task already complete):
```python
CompleteTaskInput(task_id=42)  # Same task
```

**Tool Output**:
```python
CompleteTaskOutput(
    id=42,
    title="Finish hackathon project",
    status=TaskStatus.COMPLETE,
    completed_at=datetime(2025, 12, 26, 19, 45, 0),  # Original timestamp preserved
    message="Task 'Finish hackathon project' is already marked as complete."
)
```

**Agent Response**:
```
"That task is already complete!"
```

#### Error Cases

| Error | Cause | Example | Response |
|-------|-------|---------|----------|
| **Task not found** | Invalid task_id or access denied | `{"task_id": 999}` | Exception: "Task not found: 999. It may not exist or you don't have permission to access it." |
| **ValidationError** | task_id not an integer | `{"task_id": "abc"}` | 422 validation error |
| **DatabaseError** | Database connection failed | PostgreSQL down | 500 internal error |

#### User Isolation

✅ **Security**: Task lookup filters by `user_id` from JWT token.

```python
# Query includes user_id filter (user isolation):
statement = select(Task).where(
    Task.id == task_input.task_id,
    Task.user_id == user_id  # Cannot complete another user's task
)
```

**Why "Task not found" instead of "Access denied"?**
- Security best practice: Don't leak information about other users' tasks
- Prevents enumeration attacks (attacker can't discover other users' task IDs)
- Same error message whether task doesn't exist or belongs to another user

---

### 4. update_task

**Modify task properties (title, description, priority, due date, tags).**

#### Purpose

Allows users to update existing tasks via conversational language. Supports partial updates (only specified fields are changed).

#### Use Cases

- "Change the hackathon task priority to low"
- "Update task 42 title to 'Finish Phase 3'"
- "Set due date for groceries task to tomorrow"
- "Add tag Work to the report task"
- "Remove the due date from task 15"

#### Input Schema

```python
class UpdateTaskInput(BaseModel):
    task_id: int                      # Required: ID of task to update
    title: Optional[str]              # Optional: 1-500 characters
    description: Optional[str]        # Optional: max 2000 characters
    priority: Optional[TaskPriority]  # Optional: LOW/MEDIUM/HIGH
    due_date: Optional[datetime]      # Optional: ISO 8601 datetime (None = clear)
    tags: Optional[List[str]]         # Optional: new tag list (replaces old tags)
```

**Field Details**:
- `task_id`: **Required**. Database ID of task to update.
- `title`: Optional. New task title (1-500 chars). Only updates if provided.
- `description`: Optional. New description (max 2000 chars). Only updates if provided.
- `priority`: Optional. New priority level. Only updates if provided.
- `due_date`: Optional. New due date. Set to `None` to clear due date.
- `tags`: Optional. New tag list (replaces ALL old tags). Set to `[]` to remove all tags.

**Partial Updates**: Only provided fields are updated. Other fields remain unchanged.

#### Output Schema

```python
class UpdateTaskOutput(BaseModel):
    id: int
    title: str
    description: Optional[str]
    priority: TaskPriority
    status: TaskStatus               # Status NOT updated (use complete_task)
    due_date: Optional[datetime]
    tags: List[str]                  # Sorted alphabetically
    updated_at: datetime             # Last update timestamp
    message: str                     # Summary of changes
```

#### Behavior

1. Finds task by `id` AND `user_id` (user isolation)
2. If task not found → raises exception
3. Validates at least one field provided (besides `task_id`)
4. Updates only provided fields
5. Handles tag updates:
   - Removes all old `TaskTag` associations
   - Creates/lookups new tags (user-scoped)
   - Associates new tags with task
6. If tags not provided → preserves existing tags
7. Updates `updated_at` timestamp
8. Returns full task object with success message

#### Example Request/Response

**Natural Language Input**:
```
"Change the hackathon task priority to low and remove the due date"
```

**Agent Extracts**:
```python
UpdateTaskInput(
    task_id=42,
    priority=TaskPriority.LOW,
    due_date=None  # Explicitly set to None to clear
)
```

**Tool Output**:
```python
UpdateTaskOutput(
    id=42,
    title="Finish hackathon project",  # Unchanged
    description="Complete all features and tests",  # Unchanged
    priority=TaskPriority.LOW,  # Updated
    status=TaskStatus.INCOMPLETE,  # Unchanged (use complete_task)
    due_date=None,  # Cleared
    tags=["Urgent", "Work"],  # Unchanged (not provided in input)
    updated_at=datetime(2025, 12, 26, 20, 15, 0),
    message="Task 'Finish hackathon project' successfully updated."
)
```

**Agent Response**:
```
"I've updated the task priority to LOW and removed the due date."
```

#### Example: Replace Tags

**Natural Language Input**:
```
"Change task 42 tags to Personal and Home"
```

**Agent Extracts**:
```python
UpdateTaskInput(
    task_id=42,
    tags=["Personal", "Home"]  # Replaces old tags
)
```

**Tool Output**:
```python
UpdateTaskOutput(
    id=42,
    title="Finish hackathon project",
    description="Complete all features and tests",
    priority=TaskPriority.LOW,
    status=TaskStatus.INCOMPLETE,
    due_date=None,
    tags=["Home", "Personal"],  # Old tags ["Urgent", "Work"] replaced
    updated_at=datetime(2025, 12, 26, 20, 20, 0),
    message="Task 'Finish hackathon project' successfully updated."
)
```

#### Error Cases

| Error | Cause | Example | Response |
|-------|-------|---------|----------|
| **Task not found** | Invalid task_id or access denied | `{"task_id": 999}` | Exception: "Task not found: 999. It may not exist or you don't have permission to access it." |
| **No fields provided** | Only task_id specified | `{"task_id": 42}` | Exception: "No fields to update. Please provide at least one field: title, description, priority, due_date, or tags." |
| **ValidationError** | Title too long | `{"task_id": 42, "title": "a" * 501}` | 422 validation error |
| **DatabaseError** | Database connection failed | PostgreSQL down | 500 internal error |

#### User Isolation

✅ **Security**: Task lookup and tag operations filtered by `user_id` from JWT token.

```python
# Task lookup with user isolation:
statement = select(Task).where(
    Task.id == task_input.task_id,
    Task.user_id == user_id
)

# Tag lookup/creation with user isolation:
statement = select(Tag).where(
    Tag.name == tag_name,
    Tag.user_id == user_id  # User-scoped tags
)
```

---

### 5. delete_task

**Permanently delete task from database.**

#### Purpose

Allows users to permanently remove tasks via conversational language. **Deletion is permanent** (no undo, no soft delete).

#### Use Cases

- "Delete the groceries task"
- "Remove task 42"
- "Delete all completed tasks" (agent would call this tool multiple times)
- "Get rid of the old tasks"

#### Input Schema

```python
class DeleteTaskInput(BaseModel):
    task_id: int                      # Required: ID of task to delete
```

**Field Details**:
- `task_id`: **Required**. Database ID of task to delete permanently.

#### Output Schema

```python
class DeleteTaskOutput(BaseModel):
    task_id: int                      # Deleted task ID
    title: str                        # Title of deleted task (for confirmation)
    message: str                      # Confirmation message
```

#### Behavior

1. Finds task by `id` AND `user_id` (user isolation)
2. If task not found → raises exception
3. Stores task title (for confirmation message before deletion)
4. Deletes all `TaskTag` associations (cascade delete)
5. Deletes `Task` record from database (**PERMANENT hard delete**)
6. Returns confirmation with task ID and title

**Warning**: Deletion is **irreversible**. Task cannot be recovered after deletion.

**Phase 2 Integration**: Task deleted via chatbot disappears from Phase 2 web UI immediately (< 1 second) because both share the same PostgreSQL database.

#### Example Request/Response

**Natural Language Input**:
```
"Delete the groceries task"
```

**Agent Extracts**:
```python
DeleteTaskInput(task_id=15)
```

**Tool Output**:
```python
DeleteTaskOutput(
    task_id=15,
    title="Buy groceries",
    message="Task 'Buy groceries' has been permanently deleted."
)
```

**Agent Response**:
```
"I've permanently deleted the task 'Buy groceries'."
```

#### Error Cases

| Error | Cause | Example | Response |
|-------|-------|---------|----------|
| **Task not found** | Invalid task_id or access denied | `{"task_id": 999}` | Exception: "Task not found: 999. It may not exist or you don't have permission to access it." |
| **ValidationError** | task_id not an integer | `{"task_id": "abc"}` | 422 validation error |
| **DatabaseError** | Database connection failed | PostgreSQL down | 500 internal error |

#### User Isolation

✅ **Security**: Task lookup filters by `user_id` from JWT token.

```python
# Task deletion with user isolation:
statement = select(Task).where(
    Task.id == task_input.task_id,
    Task.user_id == user_id  # Cannot delete another user's task
)
```

**Cascade Delete**: When task is deleted, all associated `TaskTag` records are automatically removed (foreign key constraint).

---

## Common Types

### TaskPriority Enum

```python
class TaskPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
```

**Usage**: Agent infers priority from natural language:
- "urgent", "important", "critical" → HIGH
- "low priority", "not urgent" → LOW
- (default) → MEDIUM

### TaskStatus Enum

```python
class TaskStatus(str, Enum):
    INCOMPLETE = "INCOMPLETE"
    COMPLETE = "COMPLETE"
```

**Usage**:
- New tasks always start as `INCOMPLETE`
- Use `complete_task` tool to mark as `COMPLETE`
- `update_task` does NOT change status (design decision)

### Datetime Format

All datetime fields use **ISO 8601 format** with UTC timezone:

```python
datetime(2025, 12, 26, 18, 30, 0)  # Python datetime object
# → "2025-12-26T18:30:00.000000"  # ISO 8601 string
```

**Agent Parsing**: Agent understands relative dates:
- "tomorrow" → next day at 23:59:59
- "Friday" → next Friday at 23:59:59
- "next week" → 7 days from now
- "in 3 hours" → current time + 3 hours

---

## Error Handling

### Common Error Patterns

#### 1. Task Not Found (User Isolation)

**Error Message**:
```
"Task not found: {task_id}. It may not exist or you don't have permission to access it."
```

**Causes**:
- Task ID doesn't exist in database
- Task belongs to another user (access denied)
- Task was deleted

**Why combined message?**
- Security: Don't leak information about other users' tasks
- Same error for "doesn't exist" and "access denied"

**Agent Handling**: Agent rephrases as friendly message:
```
"I couldn't find that task. Could you try listing your tasks to get the correct ID?"
```

#### 2. Validation Errors (422)

**Pydantic Validation**: All input schemas validated before tool execution.

**Examples**:
- Title too long (> 500 chars)
- Invalid priority enum ("EXTREME")
- Limit out of range (< 1 or > 100)
- Invalid datetime format

**Error Format** (FastAPI standard):
```json
{
  "detail": [
    {
      "loc": ["body", "title"],
      "msg": "ensure this value has at most 500 characters",
      "type": "value_error.any_str.max_length"
    }
  ]
}
```

#### 3. Database Errors (500)

**Causes**:
- PostgreSQL connection failed
- Query timeout
- Constraint violation (rare, prevented by validation)

**Agent Handling**: Circuit breaker pattern prevents cascading failures:
- After 5 consecutive errors → circuit opens (stop calling OpenAI)
- Wait 60 seconds → circuit half-opens (retry)
- If retry succeeds → circuit closes (resume normal operation)

---

## Integration Examples

### Python Integration

```python
from sqlmodel import Session
from mcp.tools import add_task, list_tasks, complete_task, update_task, delete_task
from mcp.schemas import (
    AddTaskInput, ListTasksInput, CompleteTaskInput,
    UpdateTaskInput, DeleteTaskInput, TaskPriority
)

# Add task
task_input = AddTaskInput(
    title="Finish report",
    priority=TaskPriority.HIGH,
    tags=["Work", "Urgent"]
)
result = add_task(session, user_id="user_123", task_input=task_input)
print(f"Created task {result.id}: {result.title}")

# List tasks
list_input = ListTasksInput(priority=TaskPriority.HIGH, limit=10)
result = list_tasks(session, user_id="user_123", task_input=list_input)
print(f"Found {result.count} high priority tasks")

# Complete task
complete_input = CompleteTaskInput(task_id=result.tasks[0].id)
result = complete_task(session, user_id="user_123", task_input=complete_input)
print(result.message)

# Update task
update_input = UpdateTaskInput(task_id=42, priority=TaskPriority.LOW)
result = update_task(session, user_id="user_123", task_input=update_input)
print(result.message)

# Delete task
delete_input = DeleteTaskInput(task_id=42)
result = delete_task(session, user_id="user_123", task_input=delete_input)
print(result.message)
```

### TypeScript Integration (Frontend)

```typescript
// Call chat endpoint with natural language
const response = await fetch(`${API_URL}/api/${userId}/chat`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: "Add a high priority task to finish the report by tomorrow",
    conversation_id: conversationId, // Optional
  }),
});

const data = await response.json();
console.log(data.message);  // "I've created a high priority task..."
console.log(data.conversation_id);  // 42
```

**Note**: Frontend doesn't call MCP tools directly. It sends natural language to `/api/{user_id}/chat`, and the backend handles tool invocation.

---

## Testing MCP Tools

### Unit Tests

```python
import pytest
from mcp.tools import add_task
from mcp.schemas import AddTaskInput, TaskPriority

def test_add_task_creates_task_with_tags(test_db_session, test_user):
    """Test add_task creates task and associates tags."""
    # Arrange
    task_input = AddTaskInput(
        title="Test task",
        priority=TaskPriority.HIGH,
        tags=["Work", "Urgent"]
    )

    # Act
    result = add_task(test_db_session, test_user.id, task_input)

    # Assert
    assert result.id is not None
    assert result.title == "Test task"
    assert result.priority == TaskPriority.HIGH
    assert result.status == TaskStatus.INCOMPLETE
    assert sorted(result.tags) == ["Urgent", "Work"]
```

**Test Coverage**: 100% required for all MCP tools (Constitution Section VIII).

**Test Files**:
- `tests/unit/test_add_task_tool.py` (15 tests)
- `tests/unit/test_list_tasks_tool.py` (12 tests)
- `tests/unit/test_complete_task_tool.py` (8 tests)
- `tests/unit/test_update_task_tool.py` (14 tests)
- `tests/unit/test_delete_task_tool.py` (7 tests)

---

## Conclusion

The **5 MCP tools** provide a robust, secure, and user-friendly interface for natural language task management. Key highlights:

✅ **User Isolation**: Strict security model prevents cross-user data access
✅ **Idempotent Operations**: Safe to retry without side effects
✅ **Partial Updates**: Flexible update_task tool for modifying specific fields
✅ **Natural Language**: Agent translates conversational text to structured calls
✅ **Type Safety**: Pydantic validation ensures data integrity
✅ **100% Test Coverage**: All tools thoroughly tested

**Next Steps**:
- Explore agent client implementation: `backend/src/api/services/agent.py`
- Review conversation management: `backend/mcp/utils/conversation_manager.py`
- Test tools interactively: http://localhost:8000/docs

---

**MCP Tools Documentation Complete** ✅
**Last Updated**: 2025-12-26
**Version**: 3.0.0 (Phase 3: AI Chatbot with MCP Architecture)
