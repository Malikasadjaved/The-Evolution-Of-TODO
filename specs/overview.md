# Todo App - Project Overview

**Version:** 2.0.0 (Phase II)
**Created:** December 2024
**Status:** In Progress

## Purpose

A comprehensive todo application that evolves across three phases:
- **Phase I:** Console/CLI application (✅ Complete)
- **Phase II:** Multi-user web application (🔄 In Progress)
- **Phase III:** AI chatbot with MCP integration (📋 Planned)

This project serves as a demonstration of spec-driven development using Claude Code and Spec-Kit Plus, showcasing the evolution from a simple CLI tool to a production-ready full-stack application with AI capabilities.

---

## Current Phase: Phase II - Full-Stack Web Application

### Objective

Transform the Phase I console application into a modern, secure, multi-user web application with persistent cloud storage, JWT authentication, and user isolation.

### Key Features

**Primary Tier (MVP)**
1. User authentication (signup/signin with Better Auth)
2. Create, read, update, delete tasks
3. Mark tasks complete/incomplete
4. Task details (title, description, status)
5. User-isolated data (each user sees only their tasks)

**Intermediate Tier**
6. Priority management (HIGH, MEDIUM, LOW)
7. Tags and categories (Work, Home, custom tags)
8. Scheduled tasks (created date, due date, overdue detection)
9. Search and filter (by keyword, status, priority, tags)
10. Sort tasks (by due date, priority, title, created date)

**Advanced Tier**
11. Recurring tasks (DAILY, WEEKLY, MONTHLY, YEARLY auto-reschedule)
12. Due date & time reminders (desktop/browser notifications)

---

## Tech Stack

### Backend
- **Framework:** FastAPI 0.109+
- **Language:** Python 3.11+ (currently 3.14)
- **ORM:** SQLModel 0.0.16+
- **Database:** Neon Serverless PostgreSQL
- **Authentication:** PyJWT 2.8.0 (JWT token verification)
- **Testing:** pytest 7.4.4, pytest-asyncio, httpx

### Frontend
- **Framework:** Next.js 16+ (App Router)
- **Runtime:** React 19+
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 3.4+
- **Authentication:** Better Auth 1.4+ (JWT token generation)
- **State Management:** TanStack Query (React Query) 5.90+
- **Testing:** Jest 29.7.0, React Testing Library 14.1+

### Development Tools
- **Spec-Driven:** Claude Code + Spec-Kit Plus
- **Version Control:** Git with feature branch workflow
- **Constitution:** `.specify/memory/phase-2-constitution.md` (v1.1.0)
- **Architecture:** Monorepo with separate backend/frontend

---

## Project Structure

```
hackathon-todo/
├── .spec-kit/                  # Spec-Kit Plus configuration
│   ├── config.yaml             # Project-level configuration
│   └── agents.yaml             # Agent and skill definitions
├── specs/                      # Specifications
│   ├── overview.md             # This file
│   ├── architecture.md         # System architecture
│   └── 001-fullstack-web-app/  # Phase 2 feature specs
│       ├── spec.md             # User stories & requirements
│       ├── plan.md             # Technical design decisions
│       ├── tasks.md            # Implementation task breakdown
│       ├── data-model.md       # Database schema
│       ├── contracts/          # API contracts
│       ├── architecture/       # Architectural decisions
│       └── checklists/         # Quality gates
├── backend/                    # FastAPI backend
│   ├── src/api/                # API implementation
│   ├── tests/                  # pytest test suite
│   ├── .env                    # Environment variables
│   └── CLAUDE.md               # Backend-specific guide
├── frontend/                   # Next.js frontend
│   ├── app/                    # Next.js App Router pages
│   ├── components/             # React components
│   ├── lib/                    # API client, auth
│   ├── types/                  # TypeScript types
│   └── CLAUDE.md               # Frontend-specific guide
├── phase-1/                    # Phase 1 CLI app (archived)
├── history/                    # Prompt History Records
├── CLAUDE.md                   # Root development guide
└── docker-compose.yml          # Multi-service orchestration
```

---

## Authentication Architecture

### JWT Flow (Better Auth + FastAPI)

1. **User Signs Up/In** → Better Auth (frontend) generates JWT token
2. **Token Storage** → Stored in browser localStorage
3. **API Requests** → Frontend auto-attaches `Authorization: Bearer <token>` header
4. **Backend Verification** → FastAPI middleware (`get_current_user`) verifies JWT signature
5. **User Extraction** → Token payload decoded to extract `user_id`
6. **Authorization Check** → URL `user_id` must match token `user_id` (403 Forbidden otherwise)
7. **Data Filtering** → All database queries filter by token `user_id` (user isolation)

**Shared Secret:** `BETTER_AUTH_SECRET` environment variable (≥32 characters) must match in both frontend and backend.

---

## API Endpoints

All endpoints require JWT authentication (`Authorization: Bearer <token>` header).

### Task Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/{user_id}/tasks` | List all user tasks (with search, filter, sort) |
| POST | `/api/{user_id}/tasks` | Create a new task |
| GET | `/api/{user_id}/tasks/{id}` | Get task details |
| PUT | `/api/{user_id}/tasks/{id}` | Update a task |
| DELETE | `/api/{user_id}/tasks/{id}` | Delete a task |
| PATCH | `/api/{user_id}/tasks/{id}/complete` | Toggle task completion |
| PATCH | `/api/{user_id}/tasks/{id}/status` | Update task status (flexible) |

### Tag Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/{user_id}/tags` | List all user tags |
| POST | `/api/{user_id}/tags` | Create a new tag |
| DELETE | `/api/{user_id}/tags/{id}` | Delete a tag |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sign-up` | Register new user |
| POST | `/sign-in` | Login existing user |
| POST | `/sign-out` | Logout user |
| GET | `/session` | Get current session |

---

## Security Requirements

### Critical Security Checks (100% Test Coverage Required)

1. **JWT Verification** (`backend/src/api/auth.py`)
   - Verify token signature using `BETTER_AUTH_SECRET`
   - Check token expiration
   - Validate payload structure (`user_id` present)
   - Return 401 Unauthorized on any failure

2. **Authorization Check** (all protected endpoints)
   - Compare URL `user_id` with token `user_id`
   - Return 403 Forbidden if mismatch
   - Prevent users from accessing other users' data

3. **User Isolation** (all database queries)
   - Filter by token `user_id` (from `get_current_user`)
   - NEVER filter by URL `user_id` (can be manipulated)
   - Enforce at database query level

---

## Testing Strategy

### Coverage Requirements
- **Overall Minimum:** 60%
- **Critical Paths:** 100% (authentication, user isolation, security)

### Critical Modules (100% Coverage Mandatory)
- `backend/src/api/auth.py` - JWT verification
- `backend/src/api/routes/tasks.py` - CRUD + user isolation
- `frontend/lib/api.ts` - API client with JWT auto-attachment

### Test Suite Status
- ✅ **43 tests passing** (9 auth + 4 tags + 30 tasks)
- ✅ 100% coverage on critical security paths
- ⏳ Overall coverage: ~51% (target: 60%)

---

## Development Workflow

### Spec-Kit Plus Phases

1. **Constitution** → Define project principles (`.specify/memory/phase-2-constitution.md`)
2. **Specification** → Write user stories and requirements (`/sp.specify`)
3. **Planning** → Design architecture and data models (`/sp.plan`)
4. **Tasks** → Break down into testable implementation tasks (`/sp.tasks`)
5. **Implementation** → TDD (Red-Green-Refactor) with agents
6. **Audit** → Run security and contract validation agents

### Quality Gates

**Before Implementation:**
- No `[NEEDS CLARIFICATION]` markers in spec
- Success criteria are measurable
- Edge cases identified

**Before Deployment:**
- 60% overall test coverage
- 100% critical path coverage
- No hardcoded secrets
- All tests passing

---

## Current Status

### Completed ✅
- Backend API (all endpoints implemented)
- JWT authentication & user isolation
- Database models (User, Task, Tag, TaskTag)
- 43 passing tests with 100% critical coverage
- Frontend infrastructure (Next.js, TypeScript, Tailwind)
- API client with JWT auto-attachment

### In Progress 🔄
- Frontend UI components (TaskList, TaskItem, TaskForm)
- User authentication pages (Login, Signup)
- Dashboard layout and routing

### Planned 📋
- Phase III: AI chatbot with MCP tools integration
- Deployment to production (Vercel + Neon)
- Performance optimization
- Comprehensive E2E testing

---

## Performance Targets

- **API Latency (P95):** < 200ms
- **UI Interaction:** < 100ms
- **Initial Page Load:** < 3s
- **Concurrent Users:** 10-100

---

## Environment Configuration

### Required Variables (Backend)
- `BETTER_AUTH_SECRET` - JWT signing secret (≥32 characters)
- `DATABASE_URL` - PostgreSQL connection string (Neon)
- `HOST` - API server host (default: 0.0.0.0)
- `PORT` - API server port (default: 8000)
- `FRONTEND_URL` - CORS allowed origin (default: http://localhost:3000)

### Required Variables (Frontend)
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:8000)
- `BETTER_AUTH_SECRET` - Must match backend exactly
- `BETTER_AUTH_URL` - Better Auth API route (default: http://localhost:3000/api/auth)

---

## Next Steps

1. **Complete Phase II Implementation**
   - Finish frontend UI components
   - Reach 60% overall test coverage
   - Deploy to staging environment

2. **Phase III Planning**
   - Define MCP tool specifications
   - Design chatbot conversation flow
   - Plan AI integration architecture

3. **Production Readiness**
   - Set up CI/CD pipeline
   - Configure production environment
   - Implement monitoring and logging

---

## References

- **Main Constitution:** `.specify/memory/phase-2-constitution.md`
- **Architecture Details:** `specs/architecture.md`
- **API Contracts:** `specs/001-fullstack-web-app/contracts/api-endpoints.md`
- **Development Guide:** `CLAUDE.md` (root, backend, frontend)
- **Project Repository:** [GitHub URL - TBD]

---

**Last Updated:** 2024-12-24
**Maintained By:** Claude Code + Spec-Kit Plus workflow
