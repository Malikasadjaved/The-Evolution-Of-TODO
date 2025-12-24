# System Architecture - Phase II Full-Stack Web Application

**Version:** 2.0.0
**Last Updated:** 2024-12-24
**Status:** Active

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Components](#system-components)
3. [Authentication Architecture](#authentication-architecture)
4. [Data Flow](#data-flow)
5. [Database Schema](#database-schema)
6. [API Architecture](#api-architecture)
7. [Security Architecture](#security-architecture)
8. [Frontend Architecture](#frontend-architecture)
9. [Deployment Architecture](#deployment-architecture)
10. [Quality Attributes](#quality-attributes)

---

## Architecture Overview

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Next.js 16 Frontend (React 19 + TypeScript)          │ │
│  │  - App Router                                          │ │
│  │  - Better Auth Client (JWT generation)                │ │
│  │  - TanStack Query (state management)                  │ │
│  │  - Tailwind CSS (styling)                             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS (JWT in header)
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend (Python)                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Middleware Layer                                      │ │
│  │  - CORS (allow frontend origin)                       │ │
│  │  - JWT Verification (get_current_user)                │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  API Routes                                            │ │
│  │  - /api/{user_id}/tasks   (CRUD)                      │ │
│  │  - /api/{user_id}/tags    (Tag management)            │ │
│  │  - /sign-up, /sign-in     (Authentication)            │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Business Logic                                        │ │
│  │  - User isolation enforcement                         │ │
│  │  - Recurring task calculation                         │ │
│  │  - Search/filter/sort logic                           │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Data Layer (SQLModel ORM)                            │ │
│  │  - User, Task, Tag, TaskTag models                    │ │
│  │  - Relationship management                            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓ PostgreSQL Protocol
┌─────────────────────────────────────────────────────────────┐
│            Neon Serverless PostgreSQL (Cloud)                │
│  - Tables: users, tasks, tags, task_tags                    │
│  - Indexes: user_id, status, priority, created_at           │
│  - Constraints: Foreign keys, NOT NULL, UNIQUE              │
└─────────────────────────────────────────────────────────────┘
```

### Architecture Style

**Three-Tier Web Application**

1. **Presentation Tier** (Frontend)
   - Next.js React application
   - Runs in user's browser
   - Handles UI rendering and user interactions

2. **Application Tier** (Backend)
   - FastAPI REST API server
   - Business logic and authentication
   - Runs on server (local or cloud)

3. **Data Tier** (Database)
   - PostgreSQL database (Neon)
   - Persistent storage
   - Relational data with ACID guarantees

---

## System Components

### Frontend Components

```
frontend/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Auth route group (unauthenticated)
│   │   ├── login/page.tsx      # Login page
│   │   └── signup/page.tsx     # Signup page
│   ├── (dashboard)/            # Dashboard route group (protected)
│   │   ├── layout.tsx          # Dashboard layout with nav
│   │   ├── page.tsx            # Task list (main dashboard)
│   │   └── tasks/[id]/page.tsx # Task detail page
│   ├── api/auth/[...all]/      # Better Auth API route
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Landing page
├── components/                 # React components
│   ├── ui/                     # Reusable UI primitives
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   └── Select.tsx
│   ├── TaskList.tsx            # Task list container
│   ├── TaskItem.tsx            # Individual task row
│   ├── TaskForm.tsx            # Create/edit task form
│   └── ThemeToggle.tsx         # Dark mode toggle
├── lib/                        # Core libraries
│   ├── api.ts                  # API client (fetchWithAuth)
│   ├── auth.ts                 # Better Auth client
│   └── env.ts                  # Environment validation
├── hooks/                      # React hooks
│   ├── useTasks.ts             # React Query hooks
│   ├── useAuth.ts              # Auth state management
│   └── useTheme.tsx            # Theme management
└── types/                      # TypeScript definitions
    └── api.ts                  # API types (Task, Tag, etc.)
```

### Backend Components

```
backend/
├── src/api/
│   ├── main.py                 # FastAPI app initialization
│   ├── config.py               # Pydantic Settings (env validation)
│   ├── auth.py                 # JWT verification middleware
│   ├── db.py                   # SQLModel engine & session
│   ├── models.py               # Database models
│   └── routes/
│       ├── tasks.py            # Task CRUD endpoints
│       ├── tags.py             # Tag management endpoints
│       └── auth.py             # Authentication endpoints
└── tests/
    ├── conftest.py             # Pytest fixtures
    ├── test_auth.py            # JWT verification tests
    ├── test_tasks.py           # Task CRUD + isolation tests
    └── test_tags.py            # Tag management tests
```

---

## Authentication Architecture

### Better Auth + JWT Flow

```
┌──────────────┐
│   Browser    │
│  (Frontend)  │
└──────┬───────┘
       │
       │ 1. User submits email + password
       ├─────────────────────────────────────────────┐
       │                                             │
       │                                             ↓
       │                                    ┌─────────────────┐
       │                                    │  Better Auth    │
       │                                    │  (Backend)      │
       │                                    └────────┬────────┘
       │                                             │
       │ 2. JWT token returned                      │ Validates
       │ <───────────────────────────────────────────┤ credentials
       │                                             │ & generates JWT
       ├─ Store token in localStorage                │
       │                                             │
       │ 3. API request with Authorization header    │
       ├────────────────────────────────────────────>│
       │    Authorization: Bearer <token>            │
       │                                             ↓
       │                                    ┌─────────────────┐
       │                                    │  JWT Middleware │
       │                                    │  (get_current_  │
       │                                    │   user)         │
       │                                    └────────┬────────┘
       │                                             │
       │                                             │ 4. Verify signature
       │                                             │    Check expiration
       │                                             │    Extract user_id
       │                                             │
       │                                             ↓
       │                                    ┌─────────────────┐
       │                                    │  API Route      │
       │ 5. Response with user's data       │  Handler        │
       │ <───────────────────────────────────┤                │
       │                                    │  - Check auth   │
       │                                    │  - Filter by    │
       │                                    │    token user_id│
       │                                    └─────────────────┘
```

### JWT Token Structure

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "exp": 1735776000,  // Expiration timestamp
  "iat": 1735689600   // Issued at timestamp
}
```

**Signature:**
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  BETTER_AUTH_SECRET
)
```

### Security Checks

1. **Frontend** (Better Auth):
   - ✅ Hash password before sending
   - ✅ Store token securely (localStorage)
   - ✅ Auto-attach to all API requests
   - ✅ Clear token on logout

2. **Backend** (FastAPI):
   - ✅ Verify JWT signature (HMAC-SHA256)
   - ✅ Check token expiration (`exp` claim)
   - ✅ Validate payload structure (`user_id` present)
   - ✅ Return 401 on any verification failure

3. **Authorization**:
   - ✅ Compare URL `user_id` with token `user_id`
   - ✅ Return 403 if mismatch
   - ✅ Filter all database queries by token `user_id`

---

## Data Flow

### Task Creation Flow

```
1. User fills out task form
   └─> TaskForm.tsx component

2. Form submission triggers API call
   └─> useTasks.useCreateTask() hook

3. API client auto-attaches JWT token
   └─> fetchWithAuth('/api/{user_id}/tasks', { method: 'POST', body: {...} })
      └─> Headers: { Authorization: 'Bearer <token>' }

4. Backend receives request
   └─> FastAPI CORS middleware (check origin)
   └─> get_current_user() middleware (verify JWT)
      └─> Extract user_id from token: "user123"

5. Route handler processes request
   └─> POST /api/{user_id}/tasks
      └─> Authorization check: user_id == current_user
      └─> Create task: task.user_id = current_user (from token!)
      └─> session.add(task)
      └─> session.commit()

6. Database persists task
   └─> Neon PostgreSQL
      └─> INSERT INTO tasks (user_id, title, ...) VALUES ('user123', ...)

7. Response sent back to frontend
   └─> { id: 42, title: "...", user_id: "user123", ... }

8. React Query updates cache
   └─> Task list re-renders with new task
```

### Task List Retrieval Flow

```
1. Dashboard page mounts
   └─> useTasks() hook triggered

2. API request sent
   └─> GET /api/{user_id}/tasks?status=all&sort=created_at

3. Backend filters by token user_id
   └─> SELECT * FROM tasks WHERE user_id = 'user123' ORDER BY created_at

4. Database returns only user's tasks
   └─> [{ id: 1, title: "Task 1", user_id: "user123" }, ...]

5. Frontend renders tasks
   └─> TaskList.tsx maps over tasks → TaskItem.tsx
```

---

## Database Schema

### Entity-Relationship Diagram

```
┌─────────────────┐
│     User        │
├─────────────────┤
│ id (PK)         │──────┐
│ email (UNIQUE)  │      │
│ name            │      │
│ created_at      │      │
└─────────────────┘      │
                         │ 1
                         │
                         │ N
                  ┌──────┴──────────┐
                  │      Task       │
                  ├─────────────────┤
                  │ id (PK)         │
                  │ user_id (FK)    │
                  │ title           │
                  │ description     │
                  │ status          │
                  │ priority        │
                  │ due_date        │
                  │ recurrence      │
                  │ completed_at    │
                  │ created_at      │
                  │ updated_at      │
                  └──────┬──────────┘
                         │ N
                         │
                         │ M:N via TaskTag
                         │
                         │ N
                  ┌──────┴──────────┐
                  │  TaskTag (Join) │
                  ├─────────────────┤
                  │ task_id (FK)    │
                  │ tag_id (FK)     │
                  └──────┬──────────┘
                         │
                         │ N
                         │
┌─────────────────┐      │
│      Tag        │      │
├─────────────────┤      │
│ id (PK)         │──────┘
│ user_id (FK)    │
│ name            │
│ color           │
│ created_at      │
└─────────────────┘
```

### Table Definitions

**users**
- `id` (VARCHAR, PK) - UUID from Better Auth
- `email` (VARCHAR, UNIQUE, NOT NULL, INDEX)
- `name` (VARCHAR, NOT NULL)
- `created_at` (TIMESTAMP, NOT NULL)

**tasks**
- `id` (SERIAL, PK)
- `user_id` (VARCHAR, FK → users.id, NOT NULL, INDEX)
- `title` (VARCHAR(200), NOT NULL)
- `description` (TEXT, NULLABLE)
- `status` (ENUM: INCOMPLETE, COMPLETE)
- `priority` (ENUM: LOW, MEDIUM, HIGH)
- `due_date` (TIMESTAMP, NULLABLE)
- `recurrence` (ENUM: NONE, DAILY, WEEKLY, MONTHLY, YEARLY)
- `completed_at` (TIMESTAMP, NULLABLE)
- `last_completed_at` (TIMESTAMP, NULLABLE)
- `created_at` (TIMESTAMP, NOT NULL)
- `updated_at` (TIMESTAMP, NOT NULL)

**tags**
- `id` (SERIAL, PK)
- `user_id` (VARCHAR, FK → users.id, NOT NULL, INDEX)
- `name` (VARCHAR(50), NOT NULL)
- `color` (VARCHAR(20), NULLABLE)
- `created_at` (TIMESTAMP, NOT NULL)

**task_tags** (join table)
- `task_id` (INTEGER, FK → tasks.id, NOT NULL)
- `tag_id` (INTEGER, FK → tags.id, NOT NULL)
- Primary Key: (task_id, tag_id)

### Indexes

- `users.email` (UNIQUE)
- `tasks.user_id` (for filtering by user)
- `tasks.status` (for status filtering)
- `tasks.created_at` (for sorting)
- `tags.user_id` (for filtering by user)

---

## API Architecture

### REST API Design Principles

1. **Resource-Based URLs**
   - `/api/{user_id}/tasks` - Collection
   - `/api/{user_id}/tasks/{id}` - Individual resource

2. **HTTP Methods**
   - GET - Retrieve resources
   - POST - Create resources
   - PUT - Update entire resource
   - PATCH - Partial update
   - DELETE - Remove resource

3. **Status Codes**
   - 200 OK - Successful GET, PUT, PATCH
   - 201 Created - Successful POST
   - 204 No Content - Successful DELETE
   - 400 Bad Request - Invalid input
   - 401 Unauthorized - Missing/invalid token
   - 403 Forbidden - Authorization failure
   - 404 Not Found - Resource not found
   - 422 Unprocessable Entity - Validation error
   - 500 Internal Server Error - Server error

### Endpoint Specification

See `specs/001-fullstack-web-app/contracts/api-endpoints.md` for detailed API contract.

---

## Security Architecture

### Defense in Depth

**Layer 1: Frontend**
- ✅ Input validation (client-side)
- ✅ XSS prevention (React escapes by default)
- ✅ HTTPS only (CSP headers)
- ✅ Secure token storage (localStorage with domain restrictions)

**Layer 2: Network**
- ✅ CORS restrictions (only allow frontend origin)
- ✅ HTTPS encryption (TLS 1.2+)
- ✅ Rate limiting (future enhancement)

**Layer 3: API Gateway**
- ✅ JWT verification (all protected endpoints)
- ✅ Authorization checks (user_id validation)
- ✅ Input validation (Pydantic models)

**Layer 4: Application**
- ✅ User isolation (filter by token user_id)
- ✅ SQL injection prevention (parameterized queries via SQLModel)
- ✅ No hardcoded secrets (environment variables)

**Layer 5: Database**
- ✅ Foreign key constraints
- ✅ NOT NULL constraints
- ✅ UNIQUE constraints (email)
- ✅ Connection pooling (SQLModel engine)

### Threat Model & Mitigations

| Threat | Mitigation |
|--------|------------|
| **Token theft** | Short expiration (7 days), HTTPS only, secure storage |
| **Token replay** | Expiration check, HTTPS prevents MITM |
| **User impersonation** | JWT signature verification, user_id validation |
| **Data leakage** | Filter by token user_id, authorization checks |
| **SQL injection** | Parameterized queries (SQLModel ORM) |
| **XSS** | React escapes output, CSP headers |
| **CSRF** | SameSite cookies, CORS restrictions |

---

## Frontend Architecture

### State Management Strategy

**Server State** (TanStack Query)
- Task data from API
- Automatic caching, refetching, optimistic updates
- Handles loading, error states

**Client State** (React useState/Context)
- Form inputs
- UI toggles (modals, dropdowns)
- Theme preference (dark/light mode)

**Authentication State** (localStorage + custom hooks)
- JWT token storage
- User session info (decoded from JWT)

### Component Hierarchy

```
App (layout.tsx)
└── Dashboard Layout (dashboard/layout.tsx)
    ├── Navigation Bar
    │   ├── Logo
    │   ├── User Menu
    │   └── Theme Toggle
    └── Main Content
        └── Task List Page (dashboard/page.tsx)
            ├── TaskFilters (search, status, priority)
            ├── TaskList
            │   └── TaskItem (map over tasks)
            │       ├── Checkbox (toggle completion)
            │       ├── Task Details (title, description)
            │       ├── Priority Badge
            │       ├── Due Date
            │       └── Actions (edit, delete)
            └── AddTaskButton
                └── TaskForm (modal)
```

---

## Deployment Architecture

### Development Environment

```
localhost:3000 (Frontend - Next.js dev server)
     ↓ HTTP
localhost:8000 (Backend - uvicorn)
     ↓ PostgreSQL protocol
Neon Cloud (Database - ep-fancy-resonance-ad38zyof)
```

### Production Environment (Planned)

```
Vercel Edge Network (Frontend CDN)
     ↓ HTTPS
Railway/Fly.io (Backend API server)
     ↓ PostgreSQL protocol (TLS)
Neon Cloud (Database - production instance)
```

---

## Quality Attributes

### Performance

- **API Latency (P95):** < 200ms
- **Frontend Time to Interactive:** < 3s
- **Database Query Time:** < 50ms
- **Concurrent Users:** 10-100

### Scalability

- **Horizontal Scaling:** Backend stateless (JWT), can run multiple instances
- **Database Scaling:** Neon auto-scales connections
- **Caching Strategy:** React Query cache (5 min TTL)

### Availability

- **Target Uptime:** 99.9%
- **Database:** Neon built-in HA
- **Error Handling:** Graceful degradation, user-friendly error messages

### Security

- **Authentication:** JWT with HS256
- **Authorization:** Role-based (user isolation)
- **Data Encryption:** HTTPS/TLS in transit, Neon encryption at rest
- **Secrets Management:** Environment variables (never committed)

### Maintainability

- **Code Coverage:** 60% overall, 100% critical paths
- **Documentation:** CLAUDE.md at each level, inline comments
- **Versioning:** Git feature branches, semantic versioning
- **Testing:** Automated unit tests (pytest, Jest), TDD workflow

---

## Technology Decisions

### Why FastAPI?
- ✅ Modern Python framework (async support)
- ✅ Automatic OpenAPI docs (Swagger)
- ✅ Type hints with Pydantic validation
- ✅ High performance (comparable to Node.js)

### Why Next.js 16?
- ✅ React Server Components (better performance)
- ✅ App Router (file-based routing)
- ✅ Built-in optimizations (image, font, code splitting)
- ✅ Vercel deployment integration

### Why SQLModel?
- ✅ Combines SQLAlchemy + Pydantic
- ✅ Type safety (Python type hints)
- ✅ Easy migration to Alembic later
- ✅ Works with PostgreSQL, SQLite (testing)

### Why Neon PostgreSQL?
- ✅ Serverless (scales to zero)
- ✅ Free tier sufficient for hackathon
- ✅ Fast connection times
- ✅ Built-in backups and HA

### Why Better Auth?
- ✅ Modern auth library (replaces NextAuth.js)
- ✅ JWT support out of the box
- ✅ TypeScript-first
- ✅ Framework agnostic (works with FastAPI backend)

---

## References

- **Spec-Kit Config:** `.spec-kit/config.yaml`
- **Constitution:** `.specify/memory/phase-2-constitution.md`
- **API Contracts:** `specs/001-fullstack-web-app/contracts/api-endpoints.md`
- **Data Model:** `specs/001-fullstack-web-app/data-model.md`
- **Development Guide:** `CLAUDE.md` (root, backend, frontend)

---

**Document Version:** 1.0.0
**Last Reviewed:** 2024-12-24
**Next Review:** End of Phase II implementation
