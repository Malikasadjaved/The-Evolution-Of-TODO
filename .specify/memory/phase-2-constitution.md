<!--
Sync Impact Report:
- Version change: 1.0.0 → 1.1.0
- Created: 2025-12-15
- Last Amended: 2025-12-15
- Reason: MINOR version bump - Added 4 critical missing sections
- Scope: Full-stack todo application with FastAPI backend and Next.js frontend
- Based on: Hackathon II - Todo Spec-Driven Development requirements
- Modified principles:
  - Added XIII. "Agent-Assisted Development" (NEW - CRITICAL)
  - Enhanced VI. "Authentication & Security" - Added detailed 5-step JWT flow with security anti-patterns
  - Enhanced VIII. "Test-Driven Development" - Added 100% mandatory critical path coverage requirements
  - Enhanced X. "Development Environment" - Added Pydantic Settings validation for backend
- Added sections:
  - Section XIII: Agent Configuration File (.spec-kit/agents.yaml)
  - Section XIII: Agent Creation Timeline
  - Section XIII: Agent vs Skill Usage table
  - Section VI: Detailed JWT Flow (5 critical steps)
  - Section VI: Security Anti-Patterns (WRONG vs CORRECT patterns)
  - Section VIII: Critical Path Coverage Requirements (100% mandatory)
  - Section VIII: Coverage Targets by Module table
  - Section X: Backend Validation with Pydantic Settings
  - Section X: Frontend Validation with TypeScript
- Removed sections: None
- Templates requiring updates:
  - Create .spec-kit/agents.yaml configuration file
  - Create spec-template.md for web features
  - Create plan-template.md for full-stack architecture
  - Create tasks-template.md for frontend + backend tasks
- Follow-up TODOs:
  - Create .spec-kit/agents.yaml with spec_validator, security_auditor, api_contract_validator
  - Set up monorepo structure (frontend/, backend/, specs/)
  - Configure Docker Compose for local development
  - Set up Better Auth + JWT integration with 5-step flow
  - Create Neon PostgreSQL database
  - Configure environment variables with Pydantic Settings validation
  - Implement 100% test coverage for critical paths (auth, CRUD, user isolation)
-->

# Phase 2: Full-Stack Web Application Constitution

## Project Overview

**Objective:** Transform the Phase 1 console application into a modern multi-user web application with persistent storage, authentication, and a responsive user interface.

**Development Approach:** Agentic Dev Stack workflow using Claude Code and Spec-Kit Plus:
1. **Write Specification** → Define feature requirements
2. **Generate Plan** → Design architecture and implementation strategy
3. **Break into Tasks** → Create testable, atomic tasks
4. **Implement via Claude Code** → TDD implementation with automated testing

---

## Core Principles

### I. Technology Stack & Architecture

**The application MUST use the following technology stack with strict adherence to modern best practices.**

#### Frontend Stack
- **Framework:** Next.js 16+ (App Router)
- **Language:** TypeScript (strict mode enabled)
- **Styling:** Tailwind CSS
- **Authentication:** Better Auth with JWT tokens
- **Testing:** Jest + React Testing Library
- **HTTP Client:** Fetch API with custom API client wrapper

#### Backend Stack
- **Framework:** FastAPI (Python 3.11+)
- **ORM:** SQLModel (combines SQLAlchemy + Pydantic)
- **Database:** Neon Serverless PostgreSQL
- **Authentication:** JWT verification middleware
- **Testing:** pytest + httpx (async client)
- **Migration:** SQLModel create_all() for development

#### Development Environment
- **Containerization:** Docker Compose for local development
- **Environment Management:** .env files with validation on startup
- **Monorepo Structure:** Organized frontend/, backend/, specs/ directories
- **Spec-Driven Development:** Spec-Kit Plus for structured specifications

**Rationale:** This stack provides a modern, scalable, type-safe foundation with excellent developer experience and production-ready capabilities.

---

### II. Monorepo Organization (NON-NEGOTIABLE)

**The project MUST follow the Spec-Kit Plus monorepo structure for effective Claude Code integration.**

Required structure:
```
To-do-app/
├── .spec-kit/                     # Spec-Kit configuration
│   └── config.yaml
├── specs/                         # Spec-Kit managed specifications
│   ├── overview.md                # Project overview
│   ├── architecture.md            # System architecture
│   ├── features/                  # Feature specifications
│   │   ├── task-crud.md
│   │   ├── authentication.md
│   │   ├── priority-tags.md
│   │   └── recurring-tasks.md
│   ├── api/                       # API specifications
│   │   └── rest-endpoints.md
│   ├── database/                  # Database specifications
│   │   └── schema.md
│   └── ui/                        # UI specifications
│       ├── components.md
│       └── pages.md
├── history/                       # Prompt History Records
│   ├── adr/                       # Architecture Decision Records
│   └── prompts/                   # PHR organized by feature
├── .specify/                      # Phase 1 artifacts (preserved)
│   ├── memory/
│   │   ├── constitution.md        # Phase 1 CLI constitution
│   │   └── phase-2-constitution.md  # This file
│   ├── templates/
│   ├── skills/
│   └── blueprints/
├── CLAUDE.md                      # Root Claude Code instructions
├── frontend/
│   ├── CLAUDE.md                  # Frontend-specific guidelines
│   ├── app/                       # Next.js app directory
│   ├── components/                # React components
│   ├── lib/                       # Utilities and API client
│   ├── __tests__/                 # Jest tests
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.local.example
├── backend/
│   ├── CLAUDE.md                  # Backend-specific guidelines
│   ├── src/
│   │   ├── api/
│   │   │   ├── main.py            # FastAPI app
│   │   │   ├── models.py          # SQLModel database models
│   │   │   ├── auth.py            # JWT middleware
│   │   │   ├── db.py              # Database connection
│   │   │   └── routes/            # API route handlers
│   │   │       └── tasks.py
│   │   └── __init__.py
│   ├── tests/                     # pytest tests
│   ├── requirements.txt
│   └── .env.example
├── phase-1/                       # Archived Phase 1 CLI app
├── ppp2/                          # Archived previous Phase 2 attempt
├── docker-compose.yml             # Local development containers
└── README.md                      # Project documentation
```

**Separation of concerns MUST be maintained:**
- **specs/** - What to build (requirements, contracts, acceptance criteria)
- **frontend/** - User interface and client-side logic
- **backend/** - API, business logic, database operations
- **CLAUDE.md files** - How to use specs and project conventions

**Rationale:** Monorepo structure enables Claude Code to work across frontend and backend in a single context, while Spec-Kit Plus provides organized, referenceable specifications.

---

### III. Three-Tier Feature Architecture (NON-NEGOTIABLE)

**The application MUST implement features across three progressive tiers: Primary, Intermediate, and Advanced.**

---

#### **PRIMARY TIER: Core CRUD Operations**

These foundational features are MANDATORY for Phase 2 MVP:

1. **User Authentication**
   - Sign up with email and password
   - Sign in with session management
   - Sign out and session termination
   - JWT token issuance and verification
   - User isolation (each user sees only their tasks)

2. **Add Task** (POST /api/{user_id}/tasks)
   - Title (required, 1-200 characters)
   - Description (optional, max 1000 characters)
   - Auto-assign unique integer ID
   - Set initial status to "incomplete"
   - Associate task with authenticated user
   - Record created_at timestamp
   - Return created task with HTTP 201

3. **View Task List** (GET /api/{user_id}/tasks)
   - Display all tasks for authenticated user only
   - Show: ID, Title, Description, Status, Created Date
   - Support pagination (offset/limit query params)
   - Visual status indicators in UI
   - Empty state when no tasks exist
   - Return JSON array of tasks

4. **View Single Task** (GET /api/{user_id}/tasks/{id})
   - Fetch task details by ID
   - Verify task belongs to authenticated user
   - Return 404 if not found or unauthorized
   - Display full task information in UI

5. **Update Task** (PUT /api/{user_id}/tasks/{id})
   - Modify title, description, or any editable field
   - Validate task ID exists and belongs to user
   - Update updated_at timestamp
   - Return updated task with HTTP 200
   - Validate input (title length, etc.)

6. **Delete Task** (DELETE /api/{user_id}/tasks/{id})
   - Remove task by ID
   - Verify task belongs to authenticated user
   - Return 204 No Content on success
   - Show confirmation dialog in UI before deletion
   - Handle 404 for non-existent tasks

7. **Mark Complete/Incomplete** (PATCH /api/{user_id}/tasks/{id}/complete)
   - Toggle task completion status
   - Record completed_at timestamp when marked complete
   - Clear completed_at when marked incomplete
   - Validate task exists and belongs to user
   - Update UI optimistically

---

#### **INTERMEDIATE TIER: Organization & Usability**

These features enhance task management and user experience:

8. **Priority Management**
   - Three levels: HIGH, MEDIUM, LOW
   - Add priority field to task model (enum or string)
   - Visual indicators in UI (colors, badges)
   - Default priority: MEDIUM for new tasks
   - Update API to accept/return priority
   - Filter tasks by priority

9. **Tags & Categories**
   - Predefined categories: Work, Home, Personal
   - Support custom user-defined tags
   - Many-to-many relationship (tasks can have multiple tags)
   - Tag CRUD operations (create, assign, remove)
   - Display tags in task list with color coding
   - Filter tasks by single or multiple tags

10. **Scheduled Tasks**
    - Add due_date field (optional datetime)
    - Task type: "scheduled" (with deadline) or "activity" (no deadline)
    - Overdue detection (computed property)
    - Display overdue indicator in UI ([!] badge)
    - Sort by due date (ascending/descending, nulls last)
    - Filter by date range (today, this week, overdue)

11. **Search & Filter**
    - Search by keyword (case-insensitive, searches title + description)
    - Filter by status (all, pending, completed)
    - Filter by priority (high, medium, low)
    - Filter by tags (AND/OR logic)
    - Filter by date range
    - Combine multiple filters with AND logic
    - Show active filters in UI with clear/reset option

12. **Sort Tasks**
    - Sort by due date (ascending/descending)
    - Sort by priority (HIGH → MEDIUM → LOW)
    - Sort alphabetically by title (A-Z, Z-A)
    - Sort by created date (newest/oldest first)
    - Persist sort preference in localStorage (frontend)
    - Display current sort order in UI

---

#### **ADVANCED TIER: Intelligent Features**

These features add automation and smart capabilities:

13. **Recurring Tasks**
    - Recurrence patterns: DAILY, WEEKLY, BIWEEKLY, MONTHLY, YEARLY
    - Add recurrence_pattern field (enum or string)
    - Auto-create new task instance when current one is completed
    - Preserve title, description, priority, tags in new instance
    - Calculate next due date based on pattern
    - Option to stop recurrence or set end date
    - Display recurrence indicator in UI (🔁 icon)

14. **Due Date & Time Reminders**
    - Set due date with time component (HH:MM, 24-hour format)
    - Reminder notifications before due date/time (1 hour, 1 day before)
    - Browser notifications (if user grants permission)
    - Email reminders (optional, requires email service integration)
    - Display upcoming deadlines in dashboard summary
    - Configurable reminder intervals per user

---

**Tier Dependencies:**
- Primary tier MUST be fully functional before Intermediate tier development begins
- Intermediate tier MUST be complete before Advanced tier work starts
- Each tier builds on the previous tier's data model and APIs
- No cross-tier dependencies within a tier (features can be developed independently)

**Rationale:** Three-tier architecture allows incremental development and delivery. Primary tier establishes MVP for hackathon demo, Intermediate tier adds power-user features, Advanced tier provides intelligent automation.

---

### IV. API Design & REST Principles

**All API endpoints MUST follow RESTful conventions and consistent patterns.**

#### Endpoint Structure

**Base URL:**
- Development: `http://localhost:8000`
- Production: `https://api.your-domain.com`

**All endpoints require JWT authentication** (except auth endpoints):
```
Authorization: Bearer <jwt_token>
```

**Standard Endpoints:**

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | /api/auth/signup | Create new user | `{email, password, name}` | `{user, token}` |
| POST | /api/auth/signin | Authenticate user | `{email, password}` | `{user, token}` |
| POST | /api/auth/signout | End session | None | `204 No Content` |
| GET | /api/{user_id}/tasks | List all tasks | Query params | `Array<Task>` |
| POST | /api/{user_id}/tasks | Create task | `{title, description, ...}` | `Task` (201) |
| GET | /api/{user_id}/tasks/{id} | Get task details | None | `Task` |
| PUT | /api/{user_id}/tasks/{id} | Update task | `{title, description, ...}` | `Task` |
| DELETE | /api/{user_id}/tasks/{id} | Delete task | None | `204 No Content` |
| PATCH | /api/{user_id}/tasks/{id}/complete | Toggle completion | `{completed: boolean}` | `Task` |

**Query Parameters (GET /api/{user_id}/tasks):**
- `status`: "all" | "pending" | "completed"
- `priority`: "high" | "medium" | "low"
- `tags`: comma-separated tag IDs
- `search`: keyword search (title + description)
- `sort`: "created" | "title" | "due_date" | "priority"
- `order`: "asc" | "desc"
- `offset`: pagination offset (default 0)
- `limit`: pagination limit (default 50, max 100)

#### Response Format

**Success Response (200/201):**
```json
{
  "data": { /* task object or array */ },
  "meta": {
    "total": 42,
    "offset": 0,
    "limit": 50
  }
}
```

**Error Response (4xx/5xx):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required and must be 1-200 characters",
    "details": [
      {
        "field": "title",
        "issue": "String must be at least 1 character"
      }
    ]
  }
}
```

#### HTTP Status Codes

- `200 OK` - Successful GET, PUT, PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - User doesn't own the resource
- `404 Not Found` - Resource doesn't exist
- `409 Conflict` - Duplicate resource (e.g., email already exists)
- `422 Unprocessable Entity` - Semantic validation error
- `500 Internal Server Error` - Server-side error

#### API Conventions

- Use Pydantic models for request/response validation
- Return JSON responses with proper Content-Type headers
- Handle errors with FastAPI HTTPException
- Log all errors with correlation IDs for debugging
- Validate user_id in URL matches authenticated user ID (prevent privilege escalation)
- Use UTC timestamps for all datetime fields (ISO 8601 format)
- Support CORS for frontend origin in development

**Rationale:** Consistent API design improves developer experience, enables frontend/backend teams to work independently, and makes the API self-documenting.

---

### V. Database & ORM Best Practices

**Database operations MUST use SQLModel ORM with proper patterns and validations.**

#### Database Schema

**Users Table** (managed by Better Auth):
```python
class User(SQLModel, table=True):
    id: str = Field(primary_key=True)  # UUID from Better Auth
    email: str = Field(unique=True, index=True)
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationship
    tasks: List["Task"] = Relationship(back_populates="user")
```

**Tasks Table:**
```python
class Task(SQLModel, table=True):
    # Primary fields
    id: int = Field(primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=1000)
    completed: bool = Field(default=False, index=True)

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: datetime | None = Field(default=None)

    # Intermediate tier fields
    priority: str = Field(default="MEDIUM")  # HIGH, MEDIUM, LOW
    due_date: datetime | None = Field(default=None, index=True)
    task_type: str = Field(default="activity")  # scheduled, activity

    # Advanced tier fields
    recurrence_pattern: str | None = Field(default=None)  # DAILY, WEEKLY, etc.

    # Relationships
    user: User = Relationship(back_populates="tasks")
    tags: List["Tag"] = Relationship(back_populates="tasks", link_model="TaskTag")
```

**Tags Table:**
```python
class Tag(SQLModel, table=True):
    id: int = Field(primary_key=True)
    name: str = Field(unique=True, index=True)
    color: str = Field(default="#6B7280")  # Hex color

    # Relationship
    tasks: List[Task] = Relationship(back_populates="tags", link_model="TaskTag")

class TaskTag(SQLModel, table=True):
    task_id: int = Field(foreign_key="task.id", primary_key=True)
    tag_id: int = Field(foreign_key="tag.id", primary_key=True)
```

#### Database Connection

```python
# backend/src/api/db.py
from sqlmodel import create_engine, Session
import os

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

engine = create_engine(DATABASE_URL, echo=True)

def get_session():
    with Session(engine) as session:
        yield session

def init_db():
    """Create all tables (development only)"""
    SQLModel.metadata.create_all(engine)
```

#### ORM Patterns

- Use SQLModel type hints for automatic validation
- Always use `with Session(engine)` for transactions
- Commit explicitly after mutations
- Use `get_session()` dependency injection in FastAPI routes
- Avoid N+1 queries: use `selectinload()` for relationships
- Index foreign keys and frequently filtered columns
- Use database-level constraints (unique, not null, foreign key)
- Handle IntegrityError for constraint violations

#### Migration Strategy

For development (Phase 2):
- Use `SQLModel.metadata.create_all(engine)` to create tables
- Drop and recreate tables when schema changes (acceptable for development)
- Seed database with test data after recreation
- Document all schema changes in `specs/database/schema.md`

For production (future):
- Migrate to Alembic for versioned migrations
- Never drop tables in production
- Use ALTER TABLE for schema changes
- Maintain backwards compatibility during migrations

**Rationale:** SQLModel provides type safety, automatic validation, and seamless integration with FastAPI. Simple create_all() approach accelerates development without migration complexity.

---

### VI. Authentication & Security

**Security MUST be implemented at every layer with defense in depth.**

#### Authentication Flow

1. **User Signup:**
   - Frontend: User fills signup form (email, password, name)
   - Better Auth: Validates input, hashes password (bcrypt), creates user
   - Better Auth: Issues JWT token with user ID and email
   - Frontend: Stores JWT in httpOnly cookie or localStorage
   - Backend: User record created in database via Better Auth

2. **User Signin:**
   - Frontend: User submits login form
   - Better Auth: Verifies email + password hash
   - Better Auth: Issues new JWT token
   - Frontend: Stores JWT for subsequent requests
   - Token payload: `{user_id, email, exp, iat}`

3. **API Request:**
   - Frontend: Includes JWT in `Authorization: Bearer <token>` header
   - Backend: JWT middleware extracts and verifies token
   - Backend: Checks signature using `BETTER_AUTH_SECRET`
   - Backend: Decodes token to get `user_id`
   - Backend: Validates `user_id` in URL matches token `user_id`
   - Backend: Executes request with authenticated user context
   - Backend: Filters all data by `user_id` (user isolation)

4. **User Signout:**
   - Frontend: Clears JWT from storage
   - Backend: Token remains valid until expiry (stateless)
   - Optional: Implement token blacklist for immediate revocation

#### JWT Configuration

**Shared Secret (CRITICAL):**
- Both frontend (Better Auth) and backend (FastAPI) MUST use same secret
- Environment variable: `BETTER_AUTH_SECRET`
- Minimum 32 characters, cryptographically random
- NEVER commit to version control
- Rotate secret periodically in production

**Token Settings:**
- Expiry: 7 days for development, 1 day for production
- Algorithm: HS256 (HMAC-SHA256)
- Include claims: `user_id`, `email`, `exp`, `iat`
- Verify signature on every request
- Reject expired tokens (HTTP 401)

#### Security Middleware (FastAPI)

```python
# backend/src/api/auth.py
from fastapi import Depends, HTTPException, Header
import jwt
import os

SECRET_KEY = os.getenv("BETTER_AUTH_SECRET")
ALGORITHM = "HS256"

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authentication token")

    token = authorization.split(" ")[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

#### User Isolation (CRITICAL)

**Every API endpoint MUST enforce user isolation:**
```python
@app.get("/api/{user_id}/tasks")
async def get_tasks(
    user_id: str,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Verify user_id in URL matches authenticated user
    if user_id != current_user:
        raise HTTPException(status_code=403, detail="Access denied")

    # Filter tasks by user_id
    tasks = session.exec(
        select(Task).where(Task.user_id == user_id)
    ).all()

    return tasks
```

#### Security Checklist

- [ ] All endpoints (except /auth/*) require valid JWT
- [ ] JWT signature verified on every request
- [ ] user_id in URL matches authenticated user_id from token
- [ ] All database queries filtered by user_id
- [ ] Passwords hashed with bcrypt (handled by Better Auth)
- [ ] HTTPS enforced in production
- [ ] CORS configured to allow only frontend origin
- [ ] SQL injection prevented (use parameterized queries via SQLModel)
- [ ] XSS prevented (React escapes by default, validate on backend)
- [ ] CSRF protection (SameSite cookies or CSRF tokens)
- [ ] Rate limiting on auth endpoints (prevent brute force)
- [ ] Input validation on all endpoints (Pydantic models)
- [ ] Error messages don't leak sensitive info
- [ ] Environment variables validated on startup
- [ ] Secrets stored in .env, never in code

#### Detailed JWT Flow (CRITICAL - 5 Steps)

**Step 1: User Login → Token Issuance**
- User submits email/password on frontend
- Better Auth validates credentials against database
- On success: Better Auth creates session AND issues JWT token
- JWT payload: `{user_id, email, exp, iat}`
- JWT signed with `BETTER_AUTH_SECRET` using HS256
- Frontend stores token (httpOnly cookie recommended, or localStorage)

**Step 2: API Request → Token Attachment**
- Frontend retrieves stored JWT token
- Includes in ALL API requests: `Authorization: Bearer <token>`
- Example:
```typescript
fetch('/api/user_123/tasks', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

**Step 3: Backend → Token Verification**
- FastAPI middleware intercepts request
- Extracts token from `Authorization: Bearer <token>` header
- Verifies signature using `BETTER_AUTH_SECRET`
- Checks expiration (reject if expired → 401)
- If invalid signature → 401 Unauthorized
- If valid → Decode payload, extract `user_id` and `email`

**Step 4: Backend → User Authorization (CRITICAL SECURITY CHECK)**
- Middleware decoded token: `{user_id: "abc123", email: "user@example.com"}`
- Request URL: `GET /api/abc123/tasks`
- **SECURITY CHECK:** Does token `user_id` match URL `user_id`?
  - If YES → User authorized, continue
  - If NO → 403 Forbidden (user trying to access another user's data!)
- This prevents privilege escalation attacks

**Step 5: Backend → Data Filtering (CRITICAL FOR USER ISOLATION)**
- Authorization passed (token user_id == URL user_id)
- Query database for tasks
- **ALWAYS filter by token user_id** (NOT URL user_id for security)
- Example:
```python
tasks = session.exec(
    select(Task).where(Task.user_id == current_user['user_id'])
).all()
```
- Return only tasks belonging to authenticated user
- User isolation enforced at database query level

#### Security Anti-Patterns (NEVER DO THIS)

❌ **WRONG - Using URL user_id for filtering:**
```python
# SECURITY VULNERABILITY - User can manipulate URL
tasks = session.exec(
    select(Task).where(Task.user_id == user_id_from_url)
).all()
```

✅ **CORRECT - Using token user_id for filtering:**
```python
# SECURE - Uses authenticated user from verified token
tasks = session.exec(
    select(Task).where(Task.user_id == current_user['user_id'])
).all()
```

**Rationale:** Layered security prevents unauthorized access, data breaches, and privilege escalation. JWT provides stateless authentication, and user isolation ensures data privacy in a multi-tenant system.

---

### VII. Frontend Architecture & React Patterns

**Frontend code MUST follow Next.js 16+ App Router conventions and React best practices.**

#### Directory Structure

```
frontend/
├── app/
│   ├── (auth)/              # Route group for auth pages
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/         # Route group for authenticated pages
│   │   ├── layout.tsx       # Dashboard layout with sidebar
│   │   ├── page.tsx         # Dashboard home (task list)
│   │   └── tasks/
│   │       ├── [id]/page.tsx  # Task detail page
│   │       └── new/page.tsx   # Create task page
│   ├── api/
│   │   └── auth/[...all]/route.ts  # Better Auth API route
│   ├── layout.tsx           # Root layout
│   ├── globals.css          # Tailwind directives
│   └── page.tsx             # Landing page
├── components/
│   ├── ui/                  # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   └── Select.tsx
│   ├── TaskList.tsx
│   ├── TaskItem.tsx
│   ├── TaskForm.tsx
│   ├── FilterPanel.tsx
│   └── SearchBar.tsx
├── lib/
│   ├── api.ts               # API client wrapper
│   ├── auth.ts              # Better Auth client
│   └── utils.ts             # Utility functions
├── hooks/
│   ├── useTasks.ts          # Task data fetching hook
│   ├── useAuth.ts           # Auth state hook
│   └── useDebounce.ts       # Debounce hook for search
└── __tests__/               # Jest + RTL tests
    ├── components/
    └── hooks/
```

#### Component Patterns

**Server Components (default):**
- Use for static content and data fetching on server
- No useState, useEffect, or browser APIs
- Fetch data directly in component (async function)
- Better SEO and performance

**Client Components ("use client"):**
- Use for interactivity (onClick, onChange, etc.)
- State management (useState, useContext)
- Browser APIs (localStorage, window, etc.)
- Third-party libraries that require browser

**Example - Server Component:**
```typescript
// app/(dashboard)/page.tsx
import { TaskList } from "@/components/TaskList";
import { api } from "@/lib/api";

export default async function DashboardPage() {
  const tasks = await api.getTasks(); // Fetch on server

  return (
    <div>
      <h1>My Tasks</h1>
      <TaskList initialTasks={tasks} />
    </div>
  );
}
```

**Example - Client Component:**
```typescript
"use client";

import { useState } from "react";
import { Task } from "@/types";

export function TaskList({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);

  const handleToggle = async (id: number) => {
    // Optimistic update
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    await api.toggleTask(id);
  };

  return (
    <ul>
      {tasks.map(task => (
        <TaskItem key={task.id} task={task} onToggle={handleToggle} />
      ))}
    </ul>
  );
}
```

#### State Management

- **Server State:** Use React Query (TanStack Query) or SWR for data fetching, caching
- **UI State:** Use useState for component-local state
- **Global State:** Use React Context for auth user, theme, etc.
- **Form State:** Use React Hook Form for complex forms
- **URL State:** Use Next.js searchParams for filters, pagination

**API Client (lib/api.ts):**
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("auth_token");

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": token ? `Bearer ${token}` : "",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  getTasks: () => fetchWithAuth("/api/{user_id}/tasks"),
  createTask: (data: CreateTaskInput) =>
    fetchWithAuth("/api/{user_id}/tasks", { method: "POST", body: JSON.stringify(data) }),
  // ... other endpoints
};
```

#### Styling with Tailwind CSS

- Use utility classes exclusively (no custom CSS unless necessary)
- Follow mobile-first responsive design (sm:, md:, lg: breakpoints)
- Use Tailwind config for custom colors, fonts (tailwind.config.js)
- Extract repeated patterns into components (not @apply)
- Use className prop for dynamic classes

```typescript
<button
  className={`
    px-4 py-2 rounded-md font-medium
    ${variant === "primary" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"}
    hover:opacity-90 transition-opacity
  `}
>
  {children}
</button>
```

**Rationale:** Next.js App Router provides modern routing with server components for better performance. Tailwind CSS accelerates UI development with utility-first approach.

---

### VIII. Test-Driven Development (NON-NEGOTIABLE)

**All features MUST follow TDD: Write tests → Tests fail (RED) → Implement → Tests pass (GREEN) → Refactor.**

#### Testing Requirements

**Backend (pytest):**
- Test coverage: ≥60% overall, ≥80% for critical paths (auth, CRUD operations)
- Test file naming: `test_<module>.py`
- Test function naming: `test_<function>_<scenario>_<expected_result>`
- Use fixtures for database session, test client, sample data
- Mock external dependencies (email service, notification service)
- Test all API endpoints: success cases, validation errors, auth failures
- Test database models: field validation, relationships, constraints

**Example Backend Test:**
```python
# backend/tests/test_tasks.py
from fastapi.testclient import TestClient
import pytest

def test_create_task_success(client: TestClient, auth_headers: dict):
    response = client.post(
        "/api/user123/tasks",
        json={"title": "Test Task", "description": "Test"},
        headers=auth_headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Task"
    assert "id" in data

def test_create_task_unauthorized(client: TestClient):
    response = client.post(
        "/api/user123/tasks",
        json={"title": "Test"}
    )
    assert response.status_code == 401

def test_create_task_validation_error(client: TestClient, auth_headers: dict):
    response = client.post(
        "/api/user123/tasks",
        json={"title": ""},  # Empty title
        headers=auth_headers
    )
    assert response.status_code == 422
```

**Frontend (Jest + React Testing Library):**
- Test coverage: ≥60% overall, ≥70% for components, hooks
- Test file naming: `<component>.test.tsx`
- Test user interactions, not implementation details
- Mock API calls with MSW (Mock Service Worker)
- Test accessibility (a11y) with jest-axe
- Test forms: validation, submission, error handling
- Test hooks: data fetching, state updates

**Example Frontend Test:**
```typescript
// __tests__/components/TaskItem.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { TaskItem } from "@/components/TaskItem";

describe("TaskItem", () => {
  const mockTask = {
    id: 1,
    title: "Test Task",
    completed: false,
  };

  it("renders task title", () => {
    render(<TaskItem task={mockTask} onToggle={jest.fn()} />);
    expect(screen.getByText("Test Task")).toBeInTheDocument();
  });

  it("calls onToggle when checkbox is clicked", () => {
    const mockToggle = jest.fn();
    render(<TaskItem task={mockTask} onToggle={mockToggle} />);

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(mockToggle).toHaveBeenCalledWith(1);
  });
});
```

#### Red-Green-Refactor Cycle

1. **RED:** Write failing test that specifies desired behavior
2. **Get user approval** for test cases (ensures alignment)
3. **Run tests** → verify they fail (proves test is valid)
4. **GREEN:** Implement minimal code to pass tests
5. **REFACTOR:** Improve code quality without changing behavior
6. **Repeat** for next feature/scenario

#### Test Organization

- Group related tests in `describe` blocks
- Use `beforeEach` for setup, `afterEach` for cleanup
- One assertion per test (when possible)
- Test edge cases: empty input, null values, boundary conditions
- Test error handling: network failures, validation errors, auth failures

#### Critical Path Coverage Requirements (100% MANDATORY)

These paths MUST have 100% test coverage:

**Authentication Flow (Backend):**
- ✅ User signup (success, duplicate email, validation errors)
- ✅ User login (success, wrong password, non-existent user)
- ✅ JWT token issuance (includes user_id, email, expiration)
- ✅ JWT token verification (valid, expired, invalid signature, malformed)
- ✅ Authorization check (token user_id matches URL user_id)
- ✅ Protected endpoint with valid token (200)
- ✅ Protected endpoint without token (401)
- ✅ Protected endpoint with wrong user_id (403)

**CRUD Operations with Authorization (Backend):**
- ✅ Create task (authenticated user, validation errors)
- ✅ List tasks (returns only user's tasks, not other users')
- ✅ Get task by ID (own task 200, other user's task 403, not found 404)
- ✅ Update task (own task 200, other user's task 403, validation errors)
- ✅ Delete task (own task 204, other user's task 403, not found 404)
- ✅ Toggle completion (own task 200, other user's task 403)

**User Isolation (Backend):**
- ✅ Query filtering (verify WHERE user_id = token_user_id)
- ✅ Cross-user access prevention (user A cannot access user B's tasks)
- ✅ Bulk operations respect user boundaries

#### Coverage Targets by Module

| Module | Minimum Coverage | Critical Paths Coverage |
|--------|------------------|------------------------|
| backend/src/api/auth.py | 100% | 100% (JWT verification) |
| backend/src/api/routes/tasks.py | 80% | 100% (CRUD + auth checks) |
| backend/src/api/models.py | 60% | N/A (SQLModel validation) |
| frontend/lib/api.ts | 90% | 100% (token attachment) |

**Rationale:** TDD ensures correctness, prevents regressions, serves as living documentation, and enables confident refactoring. 60% coverage balances quality with development speed for hackathon timeline.

---

### IX. Code Quality Standards

**All code MUST pass automated quality checks before committing.**

#### TypeScript (Frontend)

- **Strict mode enabled** in tsconfig.json
- No implicit `any` types
- Explicit return types for functions
- Use interfaces for object shapes
- Use type guards for runtime checks
- ESLint for linting (extends next/core-web-vitals)
- Prettier for formatting (integrated with ESLint)

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

#### Python (Backend)

- **Type hints required** for all function signatures
- Follow PEP 8 style guide
- Black for code formatting (line length: 88)
- Flake8 for linting (ignore E203, W503 for Black compatibility)
- mypy for static type checking (strict mode)
- isort for import sorting

**Formatting & Linting Commands:**
```bash
# Backend
black backend/
flake8 backend/
mypy backend/
isort backend/

# Frontend
npm run lint        # ESLint
npm run format      # Prettier
npm run type-check  # TypeScript
```

#### Documentation

- **README.md** MUST include: setup instructions, tech stack, architecture diagram, API endpoints
- **CLAUDE.md files** for Claude Code navigation (root, frontend, backend)
- **Inline comments** only for non-obvious logic (prefer self-documenting code)
- **Docstrings** for public functions (Google-style for Python, JSDoc for TypeScript)
- **API documentation** in specs/api/rest-endpoints.md (OpenAPI spec optional)
- **Database schema** in specs/database/schema.md with entity relationship diagram

#### Git Commit Messages

Format: `<type>(<scope>): <description>`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `test`: Add or update tests
- `docs`: Documentation changes
- `chore`: Build, dependencies, config

Examples:
- `feat(backend): add JWT authentication middleware`
- `feat(frontend): implement task creation form`
- `fix(api): prevent unauthorized access to other users' tasks`
- `test(tasks): add tests for task filtering by priority`

**Rationale:** Automated quality checks prevent bugs, enforce consistency, and make code reviews faster. Strict typing catches errors at compile time rather than runtime.

---

### X. Development Environment & Configuration

**Local development environment MUST be consistent across all developers using Docker Compose.**

#### Docker Compose Setup

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
    volumes:
      - ./backend:/app
    command: uvicorn src.api.main:app --host 0.0.0.0 --reload

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
      - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=todo_user
      - POSTGRES_PASSWORD=todo_password
      - POSTGRES_DB=todo_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

#### Environment Variables

**Backend (.env.example):**
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/todo_db

# Authentication
BETTER_AUTH_SECRET=your-super-secret-key-min-32-chars

# CORS
ALLOWED_ORIGINS=http://localhost:3000

# Optional
EMAIL_SERVICE_API_KEY=
SENTRY_DSN=
```

**Frontend (.env.local.example):**
```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Authentication
BETTER_AUTH_SECRET=same-as-backend-secret
BETTER_AUTH_URL=http://localhost:3000

# Optional
NEXT_PUBLIC_ANALYTICS_ID=
```

#### Environment Variable Validation (CRITICAL)

**Backend Validation (Pydantic Settings):**
```python
# backend/src/api/config.py
from pydantic_settings import BaseSettings
from pydantic import validator

class Settings(BaseSettings):
    better_auth_secret: str
    database_url: str
    allowed_origins: str = "http://localhost:3000"

    @validator('better_auth_secret')
    def validate_secret_length(cls, v):
        if len(v) < 32:
            raise ValueError(
                'BETTER_AUTH_SECRET must be at least 32 characters. '
                f'Current length: {len(v)}'
            )
        return v

    @validator('database_url')
    def validate_database_url(cls, v):
        if not v.startswith('postgresql://'):
            raise ValueError(
                'DATABASE_URL must be a valid PostgreSQL connection string'
            )
        return v

    class Config:
        env_file = '.env'

settings = Settings()  # Raises error if validation fails
```

**Frontend Validation:**
```typescript
// frontend/lib/config.ts
const requiredEnvVars = ['BETTER_AUTH_SECRET', 'DATABASE_URL'] as const;

export function validateEnv(): void {
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing env vars: ${missing.join(', ')}`);
  }

  if (process.env.BETTER_AUTH_SECRET!.length < 32) {
    throw new Error('BETTER_AUTH_SECRET must be at least 32 characters');
  }
}
```

#### Development Workflow

```bash
# First time setup
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
# Edit .env files with your values

# Start all services
docker-compose up

# Or run individually:
# Backend
cd backend
pip install -r requirements.txt
uvicorn src.api.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

**Rationale:** Docker Compose ensures consistent development environment, eliminates "works on my machine" issues, and simplifies onboarding. Environment validation prevents runtime errors from missing config.

---

### XI. Spec-Driven Development Workflow

**All feature development MUST follow the Spec-Kit Plus workflow with Claude Code.**

#### Workflow Steps

1. **Write Specification** (`/sp.specify`)
   - Create feature spec in `specs/features/<feature-name>.md`
   - Define user stories, acceptance criteria, edge cases
   - Specify API contracts (request/response)
   - Define UI mockups or wireframes
   - Identify dependencies and prerequisites

2. **Generate Architecture Plan** (`/sp.plan`)
   - Design data model changes (database schema)
   - Plan API endpoint structure
   - Design frontend component hierarchy
   - Identify architectural decisions (document in ADR if significant)
   - Break down into frontend/backend tasks
   - Estimate effort and dependencies

3. **Break into Tasks** (`/sp.tasks`)
   - Generate atomic, testable tasks from plan
   - Organize tasks by tier (Primary → Intermediate → Advanced)
   - Assign tasks to backend or frontend
   - Define acceptance criteria per task
   - Order tasks by dependency (topological sort)

4. **Implement via TDD** (`/sp.implement` or manual)
   - For each task:
     - Write tests first (RED phase)
     - Get user approval for tests
     - Implement minimal code (GREEN phase)
     - Refactor for quality (REFACTOR phase)
   - Run linters and type checkers
   - Commit with descriptive message

5. **Create PHR** (after completion)
   - Document session with Prompt History Record
   - Route to `history/prompts/<feature-name>/`
   - Include: prompt, response, files changed, tests added
   - Link to related ADRs if applicable

6. **Create ADR** (if applicable)
   - For architecturally significant decisions
   - Three-part test: Impact + Alternatives + Scope
   - Document in `history/adr/<sequence>-<title>.md`

#### Referencing Specs

**In Claude Code prompts:**
```
@specs/features/task-crud.md implement the create task feature
@specs/api/rest-endpoints.md implement GET /api/tasks endpoint
@specs/database/schema.md add priority field to tasks table
```

**In code comments:**
```python
# Implements: @specs/features/authentication.md - JWT middleware
```

#### Spec File Structure

**Feature Spec Template:**
```markdown
# Feature: <Name>

## User Stories
- As a <role>, I can <action> so that <benefit>

## Acceptance Criteria
### <Scenario 1>
- Given <precondition>
- When <action>
- Then <expected outcome>

## API Contracts
### Endpoint: <METHOD /path>
Request: <schema>
Response: <schema>
Errors: <codes and messages>

## UI Mockups
<screenshots or wireframes>

## Edge Cases
- <edge case 1>
- <edge case 2>

## Dependencies
- <feature or service dependency>
```

**Rationale:** Spec-driven development ensures alignment between requirements and implementation, provides clear documentation, and enables Claude Code to work autonomously within well-defined boundaries.

---

### XII. CLAUDE.md Guidelines

**Three CLAUDE.md files MUST provide context at different levels of the monorepo.**

#### Root CLAUDE.md

Purpose: Project overview, monorepo navigation, development workflow

Required sections:
- Project overview and current phase
- Spec-Kit structure explanation
- How to reference specs (@specs/features/<file>.md)
- Project structure (frontend/, backend/, specs/)
- Development workflow (spec → plan → tasks → implement)
- Commands to run services
- Links to key documentation

#### Frontend CLAUDE.md

Purpose: Frontend-specific patterns, conventions, tech stack

Required sections:
- Stack (Next.js 16+, TypeScript, Tailwind CSS)
- Component patterns (server vs client components)
- API client usage (lib/api.ts)
- Styling conventions (Tailwind utility classes)
- State management patterns
- Testing guidelines (Jest + RTL)
- File structure and routing

#### Backend CLAUDE.md

Purpose: Backend-specific patterns, conventions, tech stack

Required sections:
- Stack (FastAPI, SQLModel, PostgreSQL)
- Project structure (main.py, models.py, routes/, db.py)
- API conventions (REST, Pydantic, HTTPException)
- Database patterns (SQLModel, sessions, transactions)
- Authentication (JWT middleware usage)
- Testing guidelines (pytest, fixtures)
- Running and debugging

**Example Root CLAUDE.md:**
```markdown
# Todo App - Phase 2: Full-Stack Web Application

## Project Overview
Multi-user todo application with FastAPI backend and Next.js frontend.
Uses GitHub Spec-Kit Plus for spec-driven development.

## Spec-Kit Structure
Specifications are organized in /specs:
- /specs/overview.md - Project overview
- /specs/features/ - Feature specs (what to build)
- /specs/api/ - API endpoint specs
- /specs/database/ - Schema and model specs
- /specs/ui/ - Component and page specs

## How to Use Specs
1. Always read relevant spec before implementing
2. Reference specs with: @specs/features/task-crud.md
3. Update specs if requirements change

## Project Structure
- /frontend - Next.js 16+ app
- /backend - Python FastAPI server
- /specs - Spec-Kit Plus specifications
- /.specify - Phase 1 artifacts (preserved)

## Development Workflow
1. Read spec: @specs/features/[feature].md
2. Generate plan: /sp.plan
3. Break into tasks: /sp.tasks
4. Implement with TDD
5. Create PHR: /sp.phr

## Commands
# Start all services
docker-compose up

# Or individually:
# Frontend: cd frontend && npm run dev
# Backend: cd backend && uvicorn src.api.main:app --reload
```

**Rationale:** CLAUDE.md files provide context-aware instructions for Claude Code at different scopes, improving autonomous code generation and reducing errors.

---

### XIII. Agent-Assisted Development (CRITICAL)

**The project MUST use specialized agents for validation, auditing, and code generation.**

#### Agent Configuration File

Create `.spec-kit/agents.yaml`:
```yaml
agents:
  spec_validator:
    name: "Spec Validator Agent"
    purpose: "Validate specifications before implementation"
    triggers:
      - "Before starting implementation"
      - "After spec updates"
    validation_rules:
      - "All API endpoints have database models"
      - "JWT flow is consistent across all specs"
      - "All endpoints document auth requirements"
      - "Error responses are specified"
      - "Validation rules are defined"
      - "User isolation enforced in all CRUD specs"
    context_files:
      - "specs/**/*.md"
    output: "validation-report.md"

  security_auditor:
    name: "Security Audit Agent"
    purpose: "Audit implementation for security vulnerabilities"
    triggers:
      - "After implementing authentication"
      - "After implementing API endpoints"
      - "Before deployment"
    audit_checks:
      - "JWT verification on ALL protected endpoints"
      - "Token user_id matches URL user_id check present"
      - "Database queries filter by token user_id (NEVER URL user_id)"
      - "No hardcoded BETTER_AUTH_SECRET"
      - "Proper 401 vs 403 error responses"
      - "CORS configuration is secure"
      - "No SQL injection vulnerabilities"
    context_files:
      - "backend/src/**/*.py"
      - "specs/features/authentication.md"
    output: "security-audit-report.md"

  api_contract_validator:
    name: "API Contract Agent"
    purpose: "Ensure frontend-backend API alignment"
    triggers:
      - "After backend implementation"
      - "After frontend implementation"
      - "After API spec changes"
    validation_checks:
      - "Endpoint paths match spec exactly"
      - "Request/response types align"
      - "Frontend handles all error codes (401, 403, 404, 422)"
      - "Authorization headers included in all protected requests"
      - "TypeScript types match Pydantic models"
    context_files:
      - "specs/api/rest-endpoints.md"
      - "frontend/lib/api.ts"
      - "backend/src/api/routes/**/*.py"
    output: "api-contract-report.md"

skills:
  jwt_middleware_generator:
    name: "JWT Middleware Generator"
    purpose: "Generate FastAPI JWT verification middleware"
    input_specs:
      - "specs/features/authentication.md"
    output_files:
      - "backend/src/api/auth.py"
    pattern: |
      1. Extract token from Authorization: Bearer <token> header
      2. Verify signature with BETTER_AUTH_SECRET
      3. Check expiration
      4. Decode payload to get user_id and email
      5. Raise HTTPException 401 on any failure

  api_client_generator:
    name: "API Client Generator"
    purpose: "Generate type-safe frontend API client"
    input_specs:
      - "specs/api/rest-endpoints.md"
    output_files:
      - "frontend/lib/api.ts"
      - "frontend/types/api.ts"
    pattern: |
      1. Auto-attach JWT token to all requests
      2. Type-safe request/response
      3. Handle 401 (redirect to login)
      4. Handle 403 (show error)
      5. Handle network errors
```

#### Agent Creation Timeline

1. **Constitution Phase** (Current): Specify agents in `.spec-kit/agents.yaml`
2. **Spec Writing Phase**: Write detailed specs
3. **Agent Creation Phase**: Create Spec Validator Agent, run on specs
4. **Implementation Phase**: Use skills to generate boilerplate
5. **Audit Phase**: Create and run Security Audit Agent
6. **Integration Phase**: Create and run API Contract Agent

#### Agent vs Skill Usage

| Type | Purpose | When to Use | Command Pattern |
|------|---------|-------------|-----------------|
| **Skill** | Generate boilerplate code | Before manual implementation | `"Use the <skill_name> skill to generate <file>"` |
| **Agent** | Validate existing code | After implementation | `"Create the <agent_name> agent and RUN it"` |

**Rationale:** Agents automate validation, catch security issues early, and ensure frontend-backend alignment. Skills accelerate boilerplate generation following constitution patterns.

---

## Governance

**This Phase 2 constitution supersedes all development practices for the full-stack web application (Phase 2) and serves as the authoritative source of truth.**

### Amendment Procedure

- Amendments require: clear rationale, impact analysis, user approval
- Version bumps follow semantic versioning:
  - **MAJOR:** Breaking changes to architecture, tech stack, or tier redefinition
  - **MINOR:** New principle added, new feature tier, significant expansion
  - **PATCH:** Clarifications, typo fixes, non-semantic changes
- All amendments MUST update dependent specs and templates
- Amendment history tracked in Sync Impact Report (HTML comment at top)

### Compliance

- All PRs and code reviews MUST verify compliance with constitution principles
- Deviations MUST be explicitly justified and documented in ADR
- Complexity MUST be justified; simplicity preferred when equally effective
- Security MUST NOT be compromised for convenience or speed
- User isolation and authentication MUST be enforced at all layers
- Test coverage MUST meet minimums before merging
- Tier completion: Each tier must be fully functional before next tier begins

### Phase 1 Preservation

- Phase 1 CLI application in `phase-1/` directory is READ-ONLY
- Phase 1 constitution (`.specify/memory/constitution.md`) is preserved for reference
- Phase 1 skills, templates, and blueprints in `.specify/` remain available
- No Phase 2 changes should affect Phase 1 functionality

### Versioning & Dates

**Version:** 1.1.0 | **Ratified:** 2025-12-15 | **Last Amended:** 2025-12-15
