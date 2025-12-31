# Implementation Plan: Full-Stack Web Application (Phase 2)

**Branch**: `001-fullstack-web-app` | **Date**: 2025-12-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-fullstack-web-app/spec.md`

**Note**: This template is filled in by the `/sp.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Transform Phase 1 CLI todo application into a modern multi-user web application with persistent storage, JWT authentication, and three-tier feature set (Primary: auth + CRUD, Intermediate: priority/tags/search/filter/sort, Advanced: recurring tasks/reminders). Backend: FastAPI + SQLModel + PostgreSQL. Frontend: Next.js 16+ + TypeScript + Tailwind CSS. Monorepo structure with Spec-Kit Plus. User isolation enforced at all layers (JWT verification, database queries, API endpoints).

## Technical Context

**Language/Version**: Python 3.11+ (backend), TypeScript 5.x (frontend), Node.js 18+ (frontend runtime)
**Primary Dependencies**: FastAPI 0.109+, SQLModel 0.0.14+, Next.js 16+, Better Auth (JWT), Tailwind CSS 3.4+, React 19+
**Storage**: PostgreSQL 15+ (Neon serverless recommended), JWT tokens (stateless auth)
**Testing**: pytest + pytest-asyncio (backend 60% overall, 100% critical paths), Jest + React Testing Library (frontend)
**Target Platform**: Linux/Windows server (backend), Modern browsers (frontend: Chrome 100+, Firefox 100+, Safari 15+)
**Project Type**: Web application (monorepo: backend/ + frontend/)
**Performance Goals**: API <200ms p95 latency, UI <100ms interaction response, <3s initial page load
**Constraints**: User isolation mandatory (zero data leakage SC-007), JWT verification on ALL protected endpoints, HTTPS in production
**Scale/Scope**: Multi-user (10-100 concurrent users initially), 13 user stories, 72 functional requirements, 3-tier architecture

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Constitution**: `.specify/memory/phase-2-constitution.md` (v1.1.0)

### ✅ Mandatory Requirements

- [x] **Three-Tier Architecture** (Section I): Primary (auth + 5 CRUD), Intermediate (priority, tags, search, filter, sort), Advanced (recurring, reminders) ✅
- [x] **User Isolation** (Section VI): JWT verification + database query filtering by token user_id ✅
- [x] **Test Coverage** (Section VIII): 60% overall, 100% critical paths (auth, CRUD, user isolation) ✅
- [x] **Tech Stack** (Section IV, V, VII): FastAPI + SQLModel + PostgreSQL (backend), Next.js 16+ + TypeScript + Tailwind (frontend) ✅
- [x] **Monorepo Structure** (Section II): backend/, frontend/, specs/ ✅
- [x] **Environment Validation** (Section X): Pydantic Settings (backend), TypeScript validation (frontend) ✅
- [x] **Agent-Assisted Development** (Section XIII): Agents defined in `.spec-kit/agents.yaml` ✅
- [x] **Spec-Driven Development** (Section XI): Feature spec created, plan follows spec ✅

### 🚨 Critical Security Gates

- [x] **5-Step JWT Flow** (Section VI): Login → Token Attachment → Verification → Authorization → Data Filtering ✅
- [x] **User Authorization**: Token user_id MUST match URL user_id (403 if mismatch) ✅
- [x] **Data Filtering**: Database queries MUST filter by token user_id (NEVER URL user_id) ✅
- [x] **No Hardcoded Secrets**: BETTER_AUTH_SECRET from environment only ✅
- [x] **CORS Configuration**: Allow only frontend origin ✅

### 📊 Test Coverage Gates

- [x] **Authentication Flow Tests** (8 scenarios): Valid token, expired, invalid signature, malformed, missing, wrong user_id ✅
- [x] **CRUD with Authorization Tests** (6 scenarios): List (user isolation), Get (own/other/404), Create, Update, Delete ✅
- [x] **User Isolation Tests** (3 scenarios): Query filtering, cross-user access prevention, URL manipulation ✅

### ⚠️ Complexity Justification

**No violations detected.** Plan follows constitution requirements without additional complexity.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output (/sp.plan command)
├── data-model.md        # Phase 1 output (/sp.plan command)
├── quickstart.md        # Phase 1 output (/sp.plan command)
├── contracts/           # Phase 1 output (/sp.plan command)
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   └── api/
│       ├── main.py              # FastAPI app initialization, CORS config
│       ├── config.py            # Pydantic Settings with validators
│       ├── auth.py              # JWT verification middleware (5-step flow)
│       ├── db.py                # SQLModel engine, session management
│       ├── models.py            # SQLModel entities (User, Task, Tag, TaskTag)
│       └── routes/
│           ├── __init__.py
│           ├── auth.py          # Better Auth integration (optional)
│           └── tasks.py         # Task CRUD endpoints with user isolation
├── tests/
│   ├── conftest.py              # pytest fixtures (test DB, auth tokens)
│   ├── test_auth.py             # JWT verification tests (8 scenarios)
│   ├── test_tasks.py            # CRUD + authorization tests (6 scenarios)
│   └── test_user_isolation.py  # User isolation tests (3 scenarios)
├── .env.example                 # Environment variable template
├── requirements.txt             # Python dependencies
├── Dockerfile                   # Container image (optional)
└── CLAUDE.md                    # Backend development guide

frontend/
├── app/
│   ├── (auth)/                  # Route group for auth pages
│   │   ├── login/page.tsx       # Login page
│   │   └── signup/page.tsx      # Signup page
│   ├── (dashboard)/             # Route group for authenticated pages
│   │   ├── layout.tsx           # Dashboard layout with sidebar
│   │   ├── page.tsx             # Task list (dashboard home)
│   │   └── tasks/
│   │       ├── [id]/page.tsx    # Task detail page
│   │       └── new/page.tsx     # Create task page
│   ├── api/
│   │   └── auth/[...all]/route.ts  # Better Auth API route
│   ├── layout.tsx               # Root layout (metadata, fonts)
│   ├── globals.css              # Tailwind directives
│   └── page.tsx                 # Landing page
├── components/
│   ├── ui/                      # Reusable UI components
│   │   ├── Button.tsx           # Button component with variants
│   │   ├── Input.tsx            # Input component with validation
│   │   ├── Badge.tsx            # Priority/status badge
│   │   └── Select.tsx           # Dropdown select
│   ├── TaskList.tsx             # Task list with optimistic updates
│   ├── TaskItem.tsx             # Individual task item
│   ├── TaskForm.tsx             # Create/edit task form
│   ├── FilterPanel.tsx          # Filter by status/priority/tags
│   ├── SearchBar.tsx            # Debounced search (300ms)
│   ├── SortDropdown.tsx         # Sort by date/priority/title
│   ├── Toast.tsx                # Toast notifications
│   └── Modal.tsx                # Modal dialogs
├── lib/
│   ├── api.ts                   # API client with JWT auto-attachment
│   ├── auth.ts                  # Better Auth client initialization
│   └── utils.ts                 # Utility functions (cn, formatDate)
├── hooks/
│   ├── useTasks.ts              # Task data fetching with React Query
│   ├── useAuth.ts               # Auth state management
│   └── useDebounce.ts           # Debounce hook (300ms)
├── types/
│   └── api.ts                   # TypeScript types (Task, CreateTaskInput, etc.)
├── __tests__/
│   ├── components/              # Component tests (Jest + RTL)
│   └── hooks/                   # Hook tests
├── .env.local.example           # Frontend environment variables
├── package.json                 # npm dependencies
├── tsconfig.json                # TypeScript configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── next.config.js               # Next.js configuration
└── CLAUDE.md                    # Frontend development guide

specs/
└── 001-fullstack-web-app/
    ├── spec.md                  # Feature specification (complete)
    ├── plan.md                  # This file (in progress)
    ├── research.md              # Phase 0 research (next)
    ├── data-model.md            # Phase 1 data model (next)
    ├── quickstart.md            # Phase 1 quick start guide (next)
    ├── contracts/               # Phase 1 API contracts (next)
    │   ├── api-endpoints.md     # REST API specification
    │   └── integration.md       # Frontend-backend integration
    ├── checklists/
    │   └── requirements.md      # Spec validation checklist (complete)
    └── tasks.md                 # Phase 2 task breakdown (via /sp.tasks)

.spec-kit/
└── agents.yaml                  # Agent and skill definitions (complete)

phase-1/                         # Phase 1 CLI app (READ-ONLY, preserved)
ppp2/                            # Previous Phase 2 attempt (archived)
```

**Structure Decision**: Monorepo with separate backend/ and frontend/ directories. Backend follows FastAPI conventions (src/api/ for application code, tests/ at root). Frontend follows Next.js 16 App Router structure (app/ for routes, components/ for reusable UI, lib/ for utilities). Spec-Kit Plus documentation in specs/001-fullstack-web-app/.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No complexity violations.** All architectural decisions align with Phase 2 Constitution v1.1.0 requirements. Monorepo structure, three-tier architecture, JWT authentication, and user isolation are all mandated by constitution.
