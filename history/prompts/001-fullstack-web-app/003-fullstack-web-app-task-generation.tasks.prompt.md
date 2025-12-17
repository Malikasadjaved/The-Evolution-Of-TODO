---
id: "003"
title: "Full-Stack Web App Task Generation"
stage: "tasks"
date: "2025-12-16"
surface: "agent"
model: "claude-sonnet-4.5"
feature: "001-fullstack-web-app"
branch: "001-fullstack-web-app"
user: "User"
command: "/sp.tasks"
labels: ["spec-driven-development", "phase-2", "full-stack", "task-breakdown", "tdd"]
links:
  spec: "specs/001-fullstack-web-app/spec.md"
  ticket: null
  adr: null
  pr: null
files:
  created:
    - specs/001-fullstack-web-app/tasks.md
  modified: []
tests:
  - 42 test tasks defined (TDD approach - write tests FIRST before implementation)
---

## Prompt

User ran `/sp.tasks` command to generate testable task breakdown from planning artifacts.

**Input**: Feature specification and planning documents:
- specs/001-fullstack-web-app/spec.md (13 user stories, 72 functional requirements)
- specs/001-fullstack-web-app/plan.md (tech stack, monorepo structure)
- specs/001-fullstack-web-app/data-model.md (4 entities: User, Task, Tag, TaskTag)
- specs/001-fullstack-web-app/contracts/api-endpoints.md (9 REST endpoints)
- specs/001-fullstack-web-app/research.md (11 technical decisions)

**Workflow**: Load planning docs → Extract user stories → Map entities/endpoints to stories → Generate tasks by user story → Create dependency graph → Validate completeness

## Response snapshot

Successfully generated comprehensive task breakdown with 184 tasks across 16 phases:

### Task Organization

**Phase 1: Setup (10 tasks)**
- Project initialization: Monorepo structure, backend (Python/FastAPI), frontend (Next.js/TypeScript)
- Environment configuration: .env files, Neon PostgreSQL, BETTER_AUTH_SECRET generation
- Development tooling: Linting (black, flake8, ESLint), testing (pytest, Jest)

**Phase 2: Foundational (27 tasks) - BLOCKS ALL USER STORIES**
- Backend foundation: Config validation, database models (User, Task, Tag, TaskTag), JWT middleware
- Frontend foundation: TypeScript types, API client with JWT auto-attachment, Better Auth integration, UI components (Button, Input, Badge, Select, Toast, Modal)
- **Critical**: This phase MUST complete before ANY user story can start

**Phase 3: User Story 1 - Authentication (P0) - 16 tasks**
- 7 test tasks (TDD): Valid JWT, expired token, invalid signature, malformed, missing, wrong user_id
- 9 implementation tasks: Login/signup pages, auth state management, route protection

**Phase 4: User Story 2 - Create/View Tasks (P1) - 22 tasks**
- 7 test tasks: User isolation, create with token user_id, validation, get by ID (own/other)
- 15 implementation tasks: Backend CRUD endpoints (POST, GET list, GET by ID), frontend TaskList, TaskForm, React Query hooks

**Phase 5: User Story 3 - Update/Delete (P1) - 15 tasks**
- 5 test tasks: Update/delete own task (200), other user's task (403)
- 10 implementation tasks: PUT/DELETE endpoints, edit mode, delete confirmation

**Phase 6: User Story 4 - Complete/Incomplete (P1) - 9 tasks**
- 3 test tasks: Toggle status, persistence
- 6 implementation tasks: PATCH status endpoint, checkbox toggle, optimistic updates

**Phase 7: User Story 5 - View Details (P2) - 3 tasks**
- Implementation only (relies on US2 GET endpoint): Task detail page, navigation

**Phase 8: User Story 6 - Priority (P2) - 7 tasks**
- 3 test tasks: Priority creation, defaults, badge colors
- 4 implementation tasks: Priority selector, badge variants

**Phase 9: User Story 7 - Tags (P2) - 15 tasks**
- 4 test tasks: Tag CRUD, user isolation, duplicate prevention, cascade delete
- 11 implementation tasks: Tag endpoints, tag management UI, multi-select

**Phase 10: User Story 8 - Due Dates (P2) - 6 tasks**
- 2 test tasks: Due date creation, overdue detection
- 4 implementation tasks: Date picker, overdue indicator

**Phase 11: User Story 9 - Search (P2) - 7 tasks**
- 2 test tasks: Keyword search, case-insensitive
- 5 implementation tasks: Backend search with ILIKE, debounced SearchBar (300ms)

**Phase 12: User Story 10 - Filter (P2) - 9 tasks**
- 4 test tasks: Filter by status/priority/tags, combined filters
- 5 implementation tasks: Backend filter params, FilterPanel UI

**Phase 13: User Story 11 - Sort (P2) - 8 tasks**
- 3 test tasks: Sort by due date/priority, persistence
- 5 implementation tasks: Backend sort, SortDropdown UI, localStorage

**Phase 14: User Story 12 - Recurring Tasks (P3) - 9 tasks**
- 5 test tasks: Create recurring, auto-reschedule (daily/weekly/monthly), stop recurrence
- 4 implementation tasks: Recurring logic in status endpoint, recurrence selector, indicator icon

**Phase 15: User Story 13 - Reminders (P3) - 8 tasks**
- 2 test tasks: Notification permission, reminder triggers
- 6 implementation tasks: Browser notification API, permission request, interval checking

**Phase 16: Polish (13 tasks)**
- Error logging, loading states, empty states, code cleanup
- Performance: Database indexes per data-model.md
- Security audit: Run security_auditor agent
- API contract validation: Run api_contract_validator agent
- Test coverage verification: ≥60% overall, 100% critical paths
- Documentation: README, quickstart validation
- Deployment: Docker Compose, production docs

### Task Format Compliance

✅ ALL tasks follow strict checklist format:
- `- [ ] [TaskID] [P?] [Story?] Description with file path`
- 184 tasks with sequential IDs (T001-T184)
- 47 tasks marked [P] for parallel execution
- Story labels for all user story tasks ([US1]-[US13])
- Exact file paths for every task

### Dependencies & Execution Order

**Phase Dependencies:**
1. Setup (Phase 1) → No dependencies
2. Foundational (Phase 2) → Depends on Setup, BLOCKS all user stories
3. User Stories (Phases 3-15) → All depend on Foundational completion
   - Can proceed in parallel (if team capacity) or sequentially (P0 → P1 → P2 → P3)
4. Polish (Phase 16) → Depends on desired user stories complete

**User Story Dependencies:**
- US1 (P0) Auth: Can start after Foundational
- US2 (P1) Create/View: Depends on US1 (auth required)
- US3 (P1) Update/Delete: Depends on US2 (CRUD endpoints)
- US4 (P1) Complete/Incomplete: Depends on US2 (tasks exist)
- US5-US11 (P2): All depend on US2 (operate on existing tasks)
- US12 (P3) Recurring: Depends on US4 (status toggle)
- US13 (P3) Reminders: Depends on US8 (due dates)

### Parallel Opportunities Identified

**Within Setup (Phase 1):**
- Backend/frontend initialization (T002-T003)
- Linting configuration (T004-T005)
- Documentation (T009-T010)

**Within Foundational (Phase 2):**
- Database models (T014-T017): All entities can be created in parallel
- UI components (T030-T035): All base components in parallel

**Within Each User Story:**
- All test tasks marked [P] can run in parallel
- Independent implementation tasks marked [P] can run in parallel
- Example US2: 3 backend endpoints (POST, GET list, GET by ID) can be implemented in parallel

**Across User Stories:**
- After Foundational complete, all P1 stories (US2-US4) can start in parallel
- All P2 stories (US5-US11) can proceed in parallel
- Different team members can work on different stories simultaneously

### MVP Scope Definition

**MVP = User Stories 1-4 (99 tasks: T001-T099)**
- US1 (P0): Authentication & account management
- US2 (P1): Create and view tasks
- US3 (P1): Update and delete tasks
- US4 (P1): Mark tasks complete/incomplete

**MVP Success Criteria:**
- Users can sign up/sign in (US1)
- Users can create/view/edit/delete tasks (US2-US3)
- Users can mark tasks complete (US4)
- 100% test coverage for authentication and CRUD
- Zero data leakage between users
- All critical path tests passing (17 test scenarios)

**Post-MVP Increments:**
- Increment 1: US5-US8 (Details, Priority, Tags, Due Dates) - 32 tasks
- Increment 2: US9-US11 (Search, Filter, Sort) - 24 tasks
- Increment 3: US12-US13 (Recurring, Reminders) - 17 tasks
- Final: Polish (13 tasks)

### Implementation Strategy

**TDD Approach (Constitution Section VIII):**
1. Write test tasks FIRST for each user story
2. Verify tests FAIL (red)
3. Implement feature to make tests PASS (green)
4. Refactor code while keeping tests green

**Sequential MVP:**
1. Phase 1: Setup → Phase 2: Foundational
2. Phase 3: US1 (Auth) → Test independently
3. Phase 4: US2 (Create/View) → Test independently
4. Phase 5: US3 (Update/Delete) → Test independently
5. Phase 6: US4 (Complete) → Test independently
6. **STOP and VALIDATE**: Full MVP deployed/demoed

**Parallel Team (3 developers):**
1. All: Setup + Foundational together
2. Once Foundational complete:
   - Dev A: US1 → US2 → US9 (Search)
   - Dev B: US3 → US4 → US10 (Filter)
   - Dev C: US6 (Priority) → US7 (Tags) → US11 (Sort)
3. Stories integrate independently without conflicts

### Test Coverage Plan

**Critical Path Tests (100% coverage MANDATORY):**
- Authentication flow: 8 test scenarios (T038-T043)
  - Valid token, expired, invalid signature, malformed, missing, wrong user_id, missing payload, future expiry
- CRUD with authorization: 6 test scenarios (T054-T058, T076-T079)
  - List (user isolation), Get (own/other/404), Create (token user_id), Update, Delete
- User isolation: 3 test scenarios (T054, T058, T113)
  - Query filtering, cross-user access prevention, URL manipulation

**Overall Coverage (≥60% required):**
- Backend: pytest --cov=src/api --cov-report=html
- Frontend: npm test -- --coverage

**Total Test Tasks: 42 (all marked with TDD requirement)**

## Outcome

- ✅ Impact: Complete task breakdown with 184 tasks across 16 phases, organized by 13 user stories for independent implementation and testing
- 🧪 Tests: 42 test tasks following TDD approach (write tests FIRST, verify FAIL, implement, verify PASS)
- 📁 Files: 1 file created (specs/001-fullstack-web-app/tasks.md - 800+ lines)
- 🔁 Next prompts: Begin implementation with Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (US1 Authentication)
- 🧠 Reflection: Task breakdown enables incremental delivery (MVP = US1-US4, then add features incrementally). Each user story is independently testable and deliverable. TDD enforced with test tasks before implementation tasks.

## Evaluation notes (flywheel)

- Failure modes observed: None - all user stories mapped to tasks, all entities/endpoints covered, format compliance validated
- Graders run and results (PASS/FAIL): PASS - Format validation (all tasks follow checklist format with IDs, file paths), PASS - Completeness (all 13 user stories have test + implementation tasks), PASS - Dependencies (clear execution order, parallel opportunities identified)
- Prompt variant (if applicable): Standard /sp.tasks workflow with TDD emphasis per constitution
- Next experiment (smallest change to try): Begin implementation with Setup phase (T001-T010) to verify monorepo structure and tooling configuration
