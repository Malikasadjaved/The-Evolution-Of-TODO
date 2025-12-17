# API Endpoint Contracts: Full-Stack Web Application

**Feature**: Phase 2 Full-Stack Web Application
**Date**: 2025-12-15
**Branch**: `001-fullstack-web-app`
**Phase**: 1 (Design - Contracts)

## Purpose

This document defines all REST API endpoints, request/response schemas, authentication requirements, and error codes for the backend API. Frontend MUST implement these contracts exactly.

**Base URL**: `http://localhost:8000` (development), `https://api.yourdomain.com` (production)

---

## Authentication

### JWT Token Format

All protected endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

**Token Payload:**
```json
{
  "user_id": "abc123",
  "email": "user@example.com",
  "exp": 1735084800,
  "iat": 1734480000
}
```

**Token Issuance**: Handled by Better Auth on frontend (not backend)
**Token Verification**: Backend middleware (`auth.py`) verifies signature using `BETTER_AUTH_SECRET`

---

## Error Response Format

All error responses follow this format:

```json
{
  "detail": "Error message"
}
```

### HTTP Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid request body |
| 401 | Unauthorized | Missing/invalid/expired JWT token |
| 403 | Forbidden | Valid token but accessing another user's data |
| 404 | Not Found | Resource doesn't exist |
| 422 | Unprocessable Entity | Pydantic validation error |
| 500 | Internal Server Error | Unexpected server error |

---

## 1. Task Endpoints

### 1.1 List All Tasks

**GET** `/api/{user_id}/tasks`

**Description**: Get all tasks for the authenticated user with optional filters.

**Authentication**: Required (JWT)

**Path Parameters**:
- `user_id` (string): User ID (MUST match token `user_id`)

**Query Parameters** (all optional):

| Parameter | Type | Values | Description |
|-----------|------|--------|-------------|
| `status` | string | `INCOMPLETE`, `COMPLETE` | Filter by status |
| `priority` | string | `LOW`, `MEDIUM`, `HIGH` | Filter by priority |
| `tags` | string | Comma-separated tag names | Filter by tags (e.g., "Work,Home") |
| `search` | string | Any text | Search title/description |
| `sort` | string | `due_date`, `priority`, `title`, `created_at` | Sort field |
| `order` | string | `asc`, `desc` | Sort order |
| `offset` | integer | ≥0 | Pagination offset (default: 0) |
| `limit` | integer | 1-100 | Pagination limit (default: 50) |

**Request Example**:
```http
GET /api/user123/tasks?status=INCOMPLETE&priority=HIGH&sort=due_date&order=asc HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response 200 (Success)**:
```json
[
  {
    "id": 1,
    "user_id": "user123",
    "title": "Complete project documentation",
    "description": "Write API docs and README",
    "status": "INCOMPLETE",
    "priority": "HIGH",
    "due_date": "2025-12-20T23:59:59Z",
    "tags": ["Work", "Documentation"],
    "recurrence": "NONE",
    "created_at": "2025-12-01T10:00:00Z",
    "updated_at": "2025-12-15T14:30:00Z"
  },
  {
    "id": 2,
    "user_id": "user123",
    "title": "Buy groceries",
    "description": null,
    "status": "INCOMPLETE",
    "priority": "MEDIUM",
    "due_date": "2025-12-16T18:00:00Z",
    "tags": ["Home"],
    "recurrence": "WEEKLY",
    "created_at": "2025-12-10T09:00:00Z",
    "updated_at": "2025-12-10T09:00:00Z"
  }
]
```

**Response 401 (Unauthorized)**:
```json
{
  "detail": "Missing authentication token"
}
```

**Response 403 (Forbidden)**:
```json
{
  "detail": "Access denied: You can only access your own tasks"
}
```

---

### 1.2 Get Single Task

**GET** `/api/{user_id}/tasks/{task_id}`

**Description**: Get a single task by ID.

**Authentication**: Required (JWT)

**Path Parameters**:
- `user_id` (string): User ID (MUST match token `user_id`)
- `task_id` (integer): Task ID

**Request Example**:
```http
GET /api/user123/tasks/1 HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response 200 (Success)**:
```json
{
  "id": 1,
  "user_id": "user123",
  "title": "Complete project documentation",
  "description": "Write API docs and README",
  "status": "INCOMPLETE",
  "priority": "HIGH",
  "due_date": "2025-12-20T23:59:59Z",
  "tags": ["Work", "Documentation"],
  "recurrence": "NONE",
  "created_at": "2025-12-01T10:00:00Z",
  "updated_at": "2025-12-15T14:30:00Z"
}
```

**Response 403 (Forbidden)** - Accessing another user's task:
```json
{
  "detail": "Task not found"
}
```

**Response 404 (Not Found)** - Task doesn't exist:
```json
{
  "detail": "Task not found"
}
```

---

### 1.3 Create Task

**POST** `/api/{user_id}/tasks`

**Description**: Create a new task.

**Authentication**: Required (JWT)

**Path Parameters**:
- `user_id` (string): User ID (MUST match token `user_id`)

**Request Body**:
```json
{
  "title": "Complete project documentation",
  "description": "Write API docs and README",
  "priority": "HIGH",
  "due_date": "2025-12-20T23:59:59Z",
  "tags": ["Work", "Documentation"],
  "recurrence": "NONE"
}
```

**Request Schema**:
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `title` | string | Yes | 1-200 chars | Task title |
| `description` | string | No | 0-2000 chars | Task description |
| `priority` | enum | No | LOW, MEDIUM, HIGH | Priority (default: MEDIUM) |
| `due_date` | datetime | No | ISO 8601 format | Deadline (optional) |
| `tags` | array[string] | No | Tag names | Tags to apply |
| `recurrence` | enum | No | NONE, DAILY, WEEKLY, MONTHLY, YEARLY | Recurrence (default: NONE) |

**Response 201 (Created)**:
```json
{
  "id": 3,
  "user_id": "user123",
  "title": "Complete project documentation",
  "description": "Write API docs and README",
  "status": "INCOMPLETE",
  "priority": "HIGH",
  "due_date": "2025-12-20T23:59:59Z",
  "tags": ["Work", "Documentation"],
  "recurrence": "NONE",
  "created_at": "2025-12-15T17:00:00Z",
  "updated_at": "2025-12-15T17:00:00Z"
}
```

**Response 422 (Validation Error)**:
```json
{
  "detail": [
    {
      "loc": ["body", "title"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

**IMPORTANT**: Task is created with `user_id` from JWT token (NOT from URL parameter). This prevents privilege escalation.

---

### 1.4 Update Task

**PUT** `/api/{user_id}/tasks/{task_id}`

**Description**: Update an existing task (full update).

**Authentication**: Required (JWT)

**Path Parameters**:
- `user_id` (string): User ID (MUST match token `user_id`)
- `task_id` (integer): Task ID

**Request Body** (all fields optional for partial update):
```json
{
  "title": "Complete project documentation (updated)",
  "description": "Write API docs, README, and inline comments",
  "status": "INCOMPLETE",
  "priority": "MEDIUM",
  "due_date": "2025-12-22T23:59:59Z",
  "tags": ["Work"],
  "recurrence": "NONE"
}
```

**Response 200 (Success)**:
```json
{
  "id": 1,
  "user_id": "user123",
  "title": "Complete project documentation (updated)",
  "description": "Write API docs, README, and inline comments",
  "status": "INCOMPLETE",
  "priority": "MEDIUM",
  "due_date": "2025-12-22T23:59:59Z",
  "tags": ["Work"],
  "recurrence": "NONE",
  "created_at": "2025-12-01T10:00:00Z",
  "updated_at": "2025-12-15T17:30:00Z"
}
```

**Response 403 (Forbidden)** - Updating another user's task:
```json
{
  "detail": "Task not found"
}
```

**Response 404 (Not Found)**:
```json
{
  "detail": "Task not found"
}
```

---

### 1.5 Delete Task

**DELETE** `/api/{user_id}/tasks/{task_id}`

**Description**: Delete a task permanently.

**Authentication**: Required (JWT)

**Path Parameters**:
- `user_id` (string): User ID (MUST match token `user_id`)
- `task_id` (integer): Task ID

**Request Example**:
```http
DELETE /api/user123/tasks/1 HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response 204 (No Content)** - Success (no body)

**Response 403 (Forbidden)** - Deleting another user's task:
```json
{
  "detail": "Task not found"
}
```

**Response 404 (Not Found)**:
```json
{
  "detail": "Task not found"
}
```

---

### 1.6 Toggle Task Status

**PATCH** `/api/{user_id}/tasks/{task_id}/status`

**Description**: Mark task as complete or incomplete. For recurring tasks, auto-reschedules when marked complete.

**Authentication**: Required (JWT)

**Path Parameters**:
- `user_id` (string): User ID (MUST match token `user_id`)
- `task_id` (integer): Task ID

**Request Body**:
```json
{
  "status": "COMPLETE"
}
```

**Response 200 (Success)** - Non-recurring task:
```json
{
  "id": 1,
  "user_id": "user123",
  "title": "Complete project documentation",
  "description": "Write API docs and README",
  "status": "COMPLETE",
  "priority": "HIGH",
  "due_date": "2025-12-20T23:59:59Z",
  "tags": ["Work"],
  "recurrence": "NONE",
  "created_at": "2025-12-01T10:00:00Z",
  "updated_at": "2025-12-15T18:00:00Z"
}
```

**Response 200 (Success)** - Recurring task (auto-rescheduled):
```json
{
  "id": 2,
  "user_id": "user123",
  "title": "Buy groceries",
  "description": null,
  "status": "INCOMPLETE",
  "priority": "MEDIUM",
  "due_date": "2025-12-23T18:00:00Z",
  "tags": ["Home"],
  "recurrence": "WEEKLY",
  "last_completed_at": "2025-12-15T18:00:00Z",
  "created_at": "2025-12-10T09:00:00Z",
  "updated_at": "2025-12-15T18:00:00Z"
}
```

**Recurring Task Logic**:
- When marked COMPLETE:
  1. Update `last_completed_at` to current timestamp
  2. Calculate next due date:
     - DAILY: `due_date + 1 day`
     - WEEKLY: `due_date + 7 days`
     - MONTHLY: `due_date + 1 month`
     - YEARLY: `due_date + 1 year`
  3. Reset `status` to INCOMPLETE
  4. Return updated task with new due date

---

## 2. Tag Endpoints

### 2.1 List All Tags

**GET** `/api/{user_id}/tags`

**Description**: Get all tags for the authenticated user.

**Authentication**: Required (JWT)

**Path Parameters**:
- `user_id` (string): User ID (MUST match token `user_id`)

**Request Example**:
```http
GET /api/user123/tags HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response 200 (Success)**:
```json
[
  {
    "id": 1,
    "user_id": "user123",
    "name": "Work",
    "created_at": "2025-12-01T10:00:00Z"
  },
  {
    "id": 2,
    "user_id": "user123",
    "name": "Home",
    "created_at": "2025-12-01T10:00:00Z"
  }
]
```

---

### 2.2 Create Tag

**POST** `/api/{user_id}/tags`

**Description**: Create a new custom tag.

**Authentication**: Required (JWT)

**Path Parameters**:
- `user_id` (string): User ID (MUST match token `user_id`)

**Request Body**:
```json
{
  "name": "Urgent"
}
```

**Response 201 (Created)**:
```json
{
  "id": 3,
  "user_id": "user123",
  "name": "Urgent",
  "created_at": "2025-12-15T18:30:00Z"
}
```

**Response 400 (Duplicate Tag)**:
```json
{
  "detail": "Tag 'Urgent' already exists"
}
```

---

### 2.3 Delete Tag

**DELETE** `/api/{user_id}/tags/{tag_id}`

**Description**: Delete a tag. Removes tag from all tasks.

**Authentication**: Required (JWT)

**Path Parameters**:
- `user_id` (string): User ID (MUST match token `user_id`)
- `tag_id` (integer): Tag ID

**Request Example**:
```http
DELETE /api/user123/tags/3 HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response 204 (No Content)** - Success (no body)

**Response 404 (Not Found)**:
```json
{
  "detail": "Tag not found"
}
```

---

## 3. Health Check Endpoint

### 3.1 Health Check

**GET** `/health`

**Description**: Check if API is running (no authentication required).

**Authentication**: Not required

**Request Example**:
```http
GET /health HTTP/1.1
```

**Response 200 (Success)**:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-15T18:45:00Z"
}
```

---

## 4. CORS Configuration

### Allowed Origins
- **Development**: `http://localhost:3000` (Next.js dev server)
- **Production**: `https://yourdomain.com` (frontend domain)

### Allowed Methods
- GET, POST, PUT, PATCH, DELETE, OPTIONS

### Allowed Headers
- Authorization, Content-Type

### Example CORS Configuration (FastAPI)
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Development
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
```

---

## 5. Security Requirements

### Authentication Middleware
- ALL endpoints (except `/health`) MUST verify JWT token
- Token verification via `Depends(get_current_user)` middleware
- Extract `user_id` from verified token payload

### Authorization Checks
- Verify token `user_id` matches URL `user_id`
- If mismatch → 403 Forbidden
- If match → proceed with request

### Data Filtering
- ALL database queries MUST filter by `user_id` from token
- NEVER filter by `user_id` from URL (security vulnerability)

### Example Authorization Pattern
```python
@app.get("/api/{user_id}/tasks")
async def get_tasks(
    user_id: str,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Step 1: Authorization check
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Access denied")

    # Step 2: Data filtering (use token user_id, NOT URL user_id)
    tasks = session.exec(
        select(Task).where(Task.user_id == current_user)
    ).all()

    return tasks
```

---

## 6. Testing Requirements

### API Contract Tests
- Frontend MUST handle ALL documented error codes (401, 403, 404, 422, 500)
- TypeScript interfaces MUST match Pydantic models exactly
- Request/response payloads MUST match schemas

### Critical Path Tests (Backend)
- JWT verification (valid, expired, invalid signature, malformed, missing)
- Authorization (token user_id matches URL user_id)
- User isolation (database queries filter by token user_id)
- CRUD operations (list, get, create, update, delete)
- Recurring task logic (auto-reschedule on completion)

---

## Next Steps

1. ✅ API Contracts Complete: All endpoints documented with schemas
2. ⏭️ Frontend Integration: Implement `frontend/lib/api.ts` using `api_client_generator` skill
3. ⏭️ Backend Implementation: Implement `backend/src/api/routes/tasks.py`
4. ⏭️ Contract Validation: Run `api_contract_validator` agent after implementation
5. ⏭️ Testing: Write integration tests for all endpoints

---

**API Contracts Complete**: All REST endpoints documented with request/response schemas, authentication requirements, and error codes. Ready for implementation.
