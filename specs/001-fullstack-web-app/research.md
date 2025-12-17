# Research & Technical Decisions: Full-Stack Web Application

**Feature**: Phase 2 Full-Stack Web Application
**Date**: 2025-12-15
**Branch**: `001-fullstack-web-app`
**Phase**: 0 (Research)

## Purpose

This document records all technical decisions, their rationale, and alternatives considered during the planning phase. All decisions align with Phase 2 Constitution v1.1.0 requirements.

---

## 1. Backend Framework: FastAPI

### Decision
Use **FastAPI 0.109+** as the backend web framework.

### Rationale
- **Constitution Mandated** (Section IV): FastAPI is specified in Phase 2 constitution
- **Async Support**: Native async/await for high-performance I/O operations
- **Automatic Validation**: Pydantic models provide request/response validation
- **OpenAPI Documentation**: Auto-generated API docs at `/docs`
- **Type Safety**: Full TypeScript-like type hints in Python
- **JWT Integration**: Easy integration with PyJWT for token verification
- **SQLModel Compatibility**: Works seamlessly with SQLModel ORM

### Alternatives Considered
- **Flask**: Rejected - synchronous only, manual validation, less type safety
- **Django**: Rejected - too heavyweight for API-only backend, ORM incompatible with SQLModel
- **Express.js (Node)**: Rejected - would require JavaScript backend, constitution specifies Python

### References
- FastAPI Documentation: https://fastapi.tiangolo.com/
- Constitution Section IV: Backend Technology Stack

---

## 2. ORM: SQLModel

### Decision
Use **SQLModel 0.0.14+** for database modeling and queries.

### Rationale
- **Constitution Mandated** (Section IV): SQLModel specified in Phase 2 constitution
- **Pydantic Integration**: Combines SQLAlchemy (ORM) + Pydantic (validation)
- **Type Safety**: Full type hints for models and queries
- **FastAPI Compatibility**: Seamless integration with FastAPI request/response models
- **SQL Injection Prevention**: Parameterized queries by default
- **Relationship Mapping**: Supports many-to-many relationships (Task ↔ Tag via TaskTag)

### Alternatives Considered
- **SQLAlchemy (raw)**: Rejected - more boilerplate, less integration with Pydantic
- **Tortoise ORM**: Rejected - smaller ecosystem, less mature
- **Peewee**: Rejected - lacks async support, smaller community

### References
- SQLModel Documentation: https://sqlmodel.tiangolo.com/
- Constitution Section IV: Backend Technology Stack

---

## 3. Database: PostgreSQL (Neon)

### Decision
Use **PostgreSQL 15+** via **Neon serverless** for persistent storage.

### Rationale
- **Constitution Mandated** (Section IV): PostgreSQL specified in Phase 2 constitution
- **ACID Compliance**: Ensures data integrity for multi-user environment
- **JSON Support**: Native JSONB for storing tag arrays efficiently
- **User Isolation**: Row-level filtering via WHERE clauses (user_id)
- **Neon Benefits**: Serverless (auto-scaling), free tier for development, instant branching
- **SQLModel Compatibility**: Full support for PostgreSQL features

### Alternatives Considered
- **SQLite**: Rejected - single-user file-based DB, no concurrent write support
- **MySQL**: Rejected - less robust JSON support, Neon only supports PostgreSQL
- **MongoDB**: Rejected - NoSQL incompatible with SQLModel, lacks ACID guarantees

### Database Configuration
- **Development**: Neon free tier (https://neon.tech/)
- **Connection String**: `postgresql://user:password@host:port/database`
- **Environment Variable**: `DATABASE_URL` (validated via Pydantic Settings)

### References
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Neon Documentation: https://neon.tech/docs/
- Constitution Section IV: Backend Technology Stack

---

## 4. Authentication: JWT via Better Auth

### Decision
Use **Better Auth** (frontend) for JWT token issuance + **PyJWT** (backend) for verification.

### Rationale
- **Constitution Mandated** (Section VI): JWT authentication specified
- **Stateless Authentication**: No server-side session storage required
- **Better Auth Benefits**: Handles signup/signin/token generation on frontend
- **Shared Secret**: Both frontend and backend use same `BETTER_AUTH_SECRET`
- **5-Step JWT Flow**: Login → Token Attachment → Verification → Authorization → Data Filtering
- **User Isolation**: Token contains `user_id` for database query filtering

### Token Payload
```json
{
  "user_id": "abc123",
  "email": "user@example.com",
  "exp": 1735084800,
  "iat": 1734480000
}
```

### Security Measures
- **Algorithm**: HS256 (HMAC-SHA256)
- **Expiry**: 7 days (development), 1 day (production)
- **Secret Length**: Minimum 32 characters (enforced via Pydantic validator)
- **Verification**: Every protected endpoint uses `Depends(get_current_user)` middleware
- **Authorization**: Token `user_id` MUST match URL `user_id` (403 if mismatch)

### Alternatives Considered
- **Session Cookies**: Rejected - requires server-side storage, not stateless
- **OAuth 2.0**: Rejected - overkill for simple todo app, adds complexity
- **Auth0/Clerk**: Rejected - third-party dependency, monthly cost, vendor lock-in

### References
- Better Auth Documentation: https://www.better-auth.com/docs/
- PyJWT Documentation: https://pyjwt.readthedocs.io/
- Constitution Section VI: 5-Step JWT Flow

---

## 5. Frontend Framework: Next.js 16+

### Decision
Use **Next.js 16+** with **App Router** for the frontend.

### Rationale
- **Constitution Mandated** (Section VII): Next.js 16+ specified
- **App Router**: File-based routing with React Server Components
- **Server Components**: SEO-friendly, reduced JavaScript bundle size
- **Client Components**: Interactive UI with React hooks (useState, useEffect)
- **API Routes**: Built-in API handler for Better Auth integration
- **TypeScript Support**: First-class TypeScript integration
- **Performance**: Automatic code splitting, image optimization, font optimization

### Alternatives Considered
- **Create React App**: Rejected - deprecated, no SSR, larger bundle size
- **Vite + React**: Rejected - lacks SSR/SSG, manual routing setup
- **Remix**: Rejected - smaller ecosystem, less mature than Next.js

### References
- Next.js Documentation: https://nextjs.org/docs
- Constitution Section VII: Frontend Architecture

---

## 6. Styling: Tailwind CSS

### Decision
Use **Tailwind CSS 3.4+** for styling.

### Rationale
- **Constitution Mandated** (Section VII): Tailwind CSS specified
- **Utility-First**: Compose styles using utility classes (no custom CSS)
- **Responsive Design**: Mobile-first breakpoints (sm:, md:, lg:)
- **Consistency**: Design system via tailwind.config.js (colors, spacing, fonts)
- **Performance**: PurgeCSS removes unused styles in production
- **Developer Experience**: IntelliSense autocomplete in VS Code

### Alternatives Considered
- **CSS Modules**: Rejected - more boilerplate, manual responsive breakpoints
- **Styled Components**: Rejected - runtime CSS-in-JS performance overhead
- **Bootstrap**: Rejected - opinionated components, larger bundle size

### References
- Tailwind CSS Documentation: https://tailwindcss.com/docs
- Constitution Section VII: Frontend Architecture

---

## 7. State Management: React Query + Context

### Decision
Use **React Query (TanStack Query)** for server state + **React Context** for global UI state.

### Rationale
- **Server State**: React Query handles data fetching, caching, invalidation
- **UI State**: React Context for auth user, theme, global modals
- **No Redux**: Avoids boilerplate, React Query handles most state needs
- **Optimistic Updates**: Update UI immediately, rollback on error
- **Automatic Refetching**: Re-fetch on window focus, network reconnect

### Alternatives Considered
- **Redux Toolkit**: Rejected - overkill for this app, more boilerplate
- **Zustand**: Rejected - React Query + Context sufficient for needs
- **Recoil**: Rejected - smaller ecosystem, experimental

### References
- React Query Documentation: https://tanstack.com/query/latest

---

## 8. Testing Strategy

### Decision
**Backend**: pytest + pytest-asyncio (60% overall coverage, 100% critical paths)
**Frontend**: Jest + React Testing Library

### Rationale
- **Constitution Mandated** (Section VIII): Test coverage requirements specified
- **Critical Path Coverage**: 100% for authentication, CRUD, user isolation (mandatory)
- **Overall Coverage**: 60% minimum
- **pytest Benefits**: Fixtures, async support, parametrized tests
- **RTL Benefits**: Test components like users interact with them

### Critical Path Test Scenarios
**Authentication Flow (8 scenarios):**
1. Valid JWT token → 200
2. Expired JWT token → 401
3. Invalid signature → 401
4. Malformed token → 401
5. Missing token → 401
6. Wrong user_id in token → 403
7. Token payload missing user_id → 401
8. Token with future expiry → 200

**CRUD with Authorization (6 scenarios):**
1. List tasks → returns only user's tasks (not other users')
2. Get own task by ID → 200
3. Get other user's task by ID → 403
4. Get non-existent task → 404
5. Create task → uses token user_id (not URL user_id)
6. Update/delete other user's task → 403

**User Isolation (3 scenarios):**
1. Query filtering → WHERE user_id = token_user_id
2. Cross-user access prevention → User A cannot access User B's tasks
3. URL manipulation → Changing URL user_id returns 403

### References
- pytest Documentation: https://docs.pytest.org/
- React Testing Library: https://testing-library.com/docs/react-testing-library/intro/
- Constitution Section VIII: Test-Driven Development

---

## 9. Monorepo Structure

### Decision
Use monorepo with **backend/** and **frontend/** at repository root.

### Rationale
- **Constitution Mandated** (Section II): Monorepo structure specified
- **Shared Documentation**: Single source of truth for specs/, .spec-kit/
- **Version Control**: Single git repository, coordinated releases
- **Development Workflow**: Run both services locally (backend: port 8000, frontend: port 3000)
- **Phase 1 Preservation**: phase-1/ directory untouched (READ-ONLY)

### Directory Structure
```
D:\new project\Hackthon 2\To-do-app/
├── backend/           # Python FastAPI application
├── frontend/          # Next.js application
├── specs/             # Spec-Kit Plus documentation
├── .spec-kit/         # Agent and skill definitions
├── phase-1/           # Phase 1 CLI (READ-ONLY, preserved)
└── ppp2/              # Previous Phase 2 attempt (archived)
```

### Alternatives Considered
- **Separate Repositories**: Rejected - harder to coordinate, duplicate documentation
- **Nx Monorepo**: Rejected - adds complexity for small project
- **Turborepo**: Rejected - Node-focused, Python backend not well supported

### References
- Constitution Section II: Project Structure

---

## 10. Environment Variable Validation

### Decision
Use **Pydantic Settings** (backend) and **TypeScript validation** (frontend) for environment variables.

### Rationale
- **Constitution Mandated** (Section X): Environment validation specified
- **Fail Fast**: Application crashes on startup if config invalid (not runtime)
- **Clear Error Messages**: Tells developer exactly what's wrong
- **Security**: Enforces BETTER_AUTH_SECRET minimum 32 characters

### Backend Validation (Pydantic Settings)
```python
from pydantic_settings import BaseSettings
from pydantic import validator

class Settings(BaseSettings):
    better_auth_secret: str
    database_url: str

    @validator('better_auth_secret')
    def validate_secret_length(cls, v):
        if len(v) < 32:
            raise ValueError(
                f'BETTER_AUTH_SECRET must be at least 32 characters. '
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
```

### Frontend Validation (TypeScript)
```typescript
function validateEnv() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('BETTER_AUTH_SECRET must be at least 32 characters');
  }
}
validateEnv(); // Run on module load
```

### References
- Pydantic Settings: https://docs.pydantic.dev/latest/concepts/pydantic_settings/
- Constitution Section X: Environment Variable Validation

---

## 11. Agent-Assisted Development

### Decision
Use **3 validation agents** and **2 code generation skills** defined in `.spec-kit/agents.yaml`.

### Rationale
- **Constitution Mandated** (Section XIII): Agent-assisted development specified
- **Validation Agents**: Automate security audits, spec validation, API contract checks
- **Code Generation Skills**: Generate JWT middleware and API client boilerplate
- **Quality Assurance**: Catch security issues early (JWT verification, user isolation)

### Agents
1. **spec_validator**: Validates specifications before implementation
2. **security_auditor**: Audits backend for security vulnerabilities
3. **api_contract_validator**: Ensures frontend-backend API alignment

### Skills
1. **jwt_middleware_generator**: Generates `backend/src/api/auth.py`
2. **api_client_generator**: Generates `frontend/lib/api.ts`

### Agent Creation Timeline
1. Constitution Phase (✅ Complete): Agents defined in `.spec-kit/agents.yaml`
2. Spec Writing Phase (✅ Complete): Specifications created
3. Agent Creation Phase (Next): Run spec_validator on specs
4. Implementation Phase: Use skills to generate boilerplate
5. Audit Phase: Run security_auditor after backend implementation
6. Integration Phase: Run api_contract_validator before testing

### References
- Agent Configuration: `.spec-kit/agents.yaml`
- Constitution Section XIII: Agent-Assisted Development

---

## Summary of Key Decisions

| Category | Decision | Rationale |
|----------|----------|-----------|
| Backend Framework | FastAPI 0.109+ | Async support, Pydantic validation, OpenAPI docs |
| ORM | SQLModel 0.0.14+ | Combines SQLAlchemy + Pydantic, type safety |
| Database | PostgreSQL 15+ (Neon) | ACID compliance, JSON support, serverless |
| Authentication | JWT (Better Auth + PyJWT) | Stateless, user isolation, 5-step flow |
| Frontend Framework | Next.js 16+ (App Router) | SSR, React Server Components, TypeScript |
| Styling | Tailwind CSS 3.4+ | Utility-first, responsive, design system |
| State Management | React Query + Context | Server state caching, global UI state |
| Testing | pytest + Jest/RTL | 60% overall, 100% critical paths |
| Monorepo | backend/ + frontend/ | Single source of truth, coordinated releases |
| Environment Validation | Pydantic Settings + TS | Fail fast on startup, clear error messages |
| Agents | 3 agents + 2 skills | Automate validation, generate boilerplate |

---

## Next Steps

1. ✅ Phase 0 (Research): Complete - All technical decisions documented
2. ⏭️ Phase 1 (Design): Generate `data-model.md` with database schema
3. ⏭️ Phase 1 (Contracts): Generate `contracts/api-endpoints.md` with REST API spec
4. ⏭️ Phase 1 (Quickstart): Generate `quickstart.md` with setup instructions
5. ⏭️ Phase 2 (Tasks): Run `/sp.tasks` to generate testable task breakdown

---

**Research Phase Complete**: All technical decisions align with Phase 2 Constitution v1.1.0. No NEEDS CLARIFICATION items remain. Ready to proceed to Phase 1: Design.
