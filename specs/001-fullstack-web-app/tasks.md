# Tasks: Full-Stack Web Application (Phase 2)

**Input**: Design documents from `specs/001-fullstack-web-app/`
**Prerequisites**: ✅ plan.md, ✅ spec.md (13 user stories), ✅ research.md, ✅ data-model.md, ✅ contracts/

**Tests**: Test tasks are included following TDD approach (Section VIII of constitution). Write tests FIRST, ensure they FAIL, then implement to make them PASS.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo**: `backend/` (Python FastAPI), `frontend/` (Next.js TypeScript)
- **Backend paths**: `backend/src/api/`, `backend/tests/`
- **Frontend paths**: `frontend/app/`, `frontend/components/`, `frontend/lib/`, `frontend/__tests__/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create monorepo directory structure (backend/, frontend/, specs/)
- [ ] T002 [P] Initialize backend: Create backend/requirements.txt with FastAPI 0.109+, SQLModel 0.0.14+, PyJWT, psycopg2, pytest, black, flake8, mypy
- [ ] T003 [P] Initialize frontend: Run `npx create-next-app@latest frontend --typescript --tailwind --app` with Next.js 16+
- [ ] T004 [P] Configure backend linting: Setup black, flake8, mypy in backend/pyproject.toml
- [ ] T005 [P] Configure frontend linting: Setup ESLint and Prettier in frontend/.eslintrc.json
- [ ] T006 Create environment templates: backend/.env.example and frontend/.env.local.example with all required variables
- [ ] T007 Setup Neon PostgreSQL database and obtain DATABASE_URL connection string
- [ ] T008 Generate BETTER_AUTH_SECRET: Run `python -c "import secrets; print(secrets.token_urlsafe(32))"` and add to .env files
- [ ] T009 [P] Create backend CLAUDE.md with Phase 2 backend development guide
- [ ] T010 [P] Create frontend CLAUDE.md with Phase 2 frontend development guide

**Checkpoint**: Project structure and tooling ready for implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Backend Foundation

- [ ] T011 Create backend/src/api/config.py with Pydantic Settings validation for BETTER_AUTH_SECRET (≥32 chars) and DATABASE_URL
- [ ] T012 Create backend/src/api/db.py with SQLModel engine, session factory, and get_session dependency
- [ ] T013 Create backend/src/api/models.py with TaskStatus, TaskPriority, TaskRecurrence enums
- [ ] T014 [P] Implement User model in backend/src/api/models.py (id, email, name, created_at)
- [ ] T015 [P] Implement Task model in backend/src/api/models.py (all fields from data-model.md with user_id foreign key)
- [ ] T016 [P] Implement Tag model in backend/src/api/models.py (id, user_id, name, created_at)
- [ ] T017 [P] Implement TaskTag join table model in backend/src/api/models.py
- [ ] T018 Create backend/src/api/auth.py with get_current_user dependency: Extract JWT from Authorization header, verify signature with PyJWT, return user_id
- [ ] T019 Create backend/src/api/main.py with FastAPI app initialization and CORS middleware (allow http://localhost:3000)
- [ ] T020 Add health check endpoint GET /health in backend/src/api/main.py (no auth required)
- [ ] T021 Create backend/src/api/routes/__init__.py (empty router module)
- [ ] T022 Test database connection: Run create_tables() to verify PostgreSQL schema creation
- [ ] T023 Write backend/tests/conftest.py with pytest fixtures: test_db_session, test_jwt_token, test_user

### Frontend Foundation

- [ ] T024 Create frontend/types/api.ts with TypeScript interfaces: Task, CreateTaskInput, UpdateTaskInput, Tag, CreateTagInput, ApiError
- [ ] T025 Create frontend/lib/env.ts with environment validation: Verify BETTER_AUTH_SECRET ≥32 characters on module load
- [ ] T026 Create frontend/lib/api.ts with fetchWithAuth wrapper: Auto-attach JWT, handle 401 (redirect /login), 403 (toast), 422 (validation)
- [ ] T027 Install Better Auth: Run `npm install better-auth` in frontend/
- [ ] T028 Create frontend/lib/auth.ts with Better Auth client initialization using BETTER_AUTH_SECRET
- [ ] T029 Create frontend/app/api/auth/[...all]/route.ts with Better Auth API handler for signup/signin/signout
- [ ] T030 [P] Create frontend/components/ui/Button.tsx with variants (primary, secondary, danger, ghost)
- [ ] T031 [P] Create frontend/components/ui/Input.tsx with validation states (error, success, disabled)
- [ ] T032 [P] Create frontend/components/ui/Badge.tsx for priority/status/tag display
- [ ] T033 [P] Create frontend/components/ui/Select.tsx dropdown component
- [ ] T034 [P] Create frontend/components/Toast.tsx with useToast hook for error/success messages
- [ ] T035 [P] Create frontend/components/Modal.tsx with ConfirmDialog variant
- [ ] T036 Install React Query: Run `npm install @tanstack/react-query` in frontend/
- [ ] T037 Create frontend/app/layout.tsx with QueryClientProvider wrapper and Tailwind globals.css import

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - User Authentication & Account Management (Priority: P0) 🎯 MVP

**Goal**: New users can create accounts and sign in to access their personal task management workspace

**Independent Test**: Create account, sign in, sign out, verify sessions managed correctly

### Tests for User Story 1 (TDD - Write FIRST, ensure they FAIL)

- [ ] T038 [P] [US1] Write backend/tests/test_auth.py::test_valid_jwt_token: Verify get_current_user returns user_id from valid token
- [ ] T039 [P] [US1] Write backend/tests/test_auth.py::test_expired_jwt_token: Verify 401 Unauthorized when token expired
- [ ] T040 [P] [US1] Write backend/tests/test_auth.py::test_invalid_signature: Verify 401 when token signature invalid
- [ ] T041 [P] [US1] Write backend/tests/test_auth.py::test_malformed_token: Verify 401 when token malformed (not base64)
- [ ] T042 [P] [US1] Write backend/tests/test_auth.py::test_missing_token: Verify 401 when Authorization header missing
- [ ] T043 [P] [US1] Write backend/tests/test_auth.py::test_wrong_user_id_in_payload: Verify 401 when user_id missing from payload
- [ ] T044 [P] [US1] Write frontend/__tests__/components/AuthProvider.test.tsx: Test auth state management (logged in/out)

### Implementation for User Story 1

- [ ] T045 [US1] Verify backend/src/api/auth.py get_current_user correctly extracts user_id from JWT (should make T038-T043 PASS)
- [ ] T046 [US1] Create frontend/hooks/useAuth.ts with Better Auth hooks: useSession, useSignUp, useSignIn, useSignOut
- [ ] T047 [P] [US1] Create frontend/app/(auth)/login/page.tsx with email/password form calling useSignIn
- [ ] T048 [P] [US1] Create frontend/app/(auth)/signup/page.tsx with email/password/name form calling useSignUp
- [ ] T049 [US1] Create frontend/components/AuthProvider.tsx wrapping Better Auth session provider
- [ ] T050 [US1] Add AuthProvider to frontend/app/layout.tsx to wrap all routes
- [ ] T051 [US1] Create frontend/app/page.tsx landing page with "Sign Up" and "Login" buttons
- [ ] T052 [US1] Add route protection middleware: Redirect to /login if unauthenticated on dashboard routes
- [ ] T053 [US1] Run all auth tests (T038-T044) and verify they PASS

**Checkpoint**: At this point, users can create accounts, sign in, sign out - US1 fully functional

---

## Phase 4: User Story 2 - Create and View Tasks (Priority: P1)

**Goal**: Authenticated users can add new tasks and view all their tasks in one place

**Independent Test**: Sign in, create several tasks with different properties, verify they appear in task list

### Tests for User Story 2 (TDD - Write FIRST, ensure they FAIL)

- [ ] T054 [P] [US2] Write backend/tests/test_tasks.py::test_list_tasks_returns_only_user_tasks: User A sees only their tasks, not User B's
- [ ] T055 [P] [US2] Write backend/tests/test_tasks.py::test_create_task_uses_token_user_id: Task created with token user_id, not URL user_id
- [ ] T056 [P] [US2] Write backend/tests/test_tasks.py::test_create_task_validation: Verify 422 when title missing
- [ ] T057 [P] [US2] Write backend/tests/test_tasks.py::test_get_task_by_id_own_task: User can get their own task (200)
- [ ] T058 [P] [US2] Write backend/tests/test_tasks.py::test_get_task_by_id_other_user: User cannot get other user's task (403)
- [ ] T059 [P] [US2] Write frontend/__tests__/components/TaskList.test.tsx: Test task list rendering with mock data
- [ ] T060 [P] [US2] Write frontend/__tests__/components/TaskForm.test.tsx: Test task creation form validation

### Implementation for User Story 2

- [ ] T061 [US2] Create backend/src/api/routes/tasks.py with APIRouter
- [ ] T062 [P] [US2] Implement POST /api/{user_id}/tasks in backend/src/api/routes/tasks.py: Create task with token user_id, return 201
- [ ] T063 [P] [US2] Implement GET /api/{user_id}/tasks in backend/src/api/routes/tasks.py: List tasks filtered by token user_id (verify user_id matches)
- [ ] T064 [P] [US2] Implement GET /api/{user_id}/tasks/{task_id} in backend/src/api/routes/tasks.py: Get single task with user isolation
- [ ] T065 [US2] Mount tasks router in backend/src/api/main.py with /api prefix
- [ ] T066 [P] [US2] Implement api.getTasks in frontend/lib/api.ts calling GET /api/{user_id}/tasks
- [ ] T067 [P] [US2] Implement api.createTask in frontend/lib/api.ts calling POST /api/{user_id}/tasks
- [ ] T068 [P] [US2] Implement api.getTask in frontend/lib/api.ts calling GET /api/{user_id}/tasks/{id}
- [ ] T069 [US2] Create frontend/hooks/useTasks.ts with React Query hooks: useTasksQuery, useCreateTaskMutation
- [ ] T070 [US2] Create frontend/components/TaskForm.tsx with title, description fields and Create button
- [ ] T071 [US2] Create frontend/components/TaskItem.tsx displaying task title, description, status badge
- [ ] T072 [US2] Create frontend/components/TaskList.tsx rendering TaskItem components with empty state
- [ ] T073 [US2] Create frontend/app/(dashboard)/layout.tsx with sidebar navigation
- [ ] T074 [US2] Create frontend/app/(dashboard)/page.tsx (dashboard) with TaskList and "New Task" button showing TaskForm modal
- [ ] T075 [US2] Run all US2 tests (T054-T060) and verify they PASS

**Checkpoint**: Users can create tasks and view their task list - US2 fully functional

---

## Phase 5: User Story 3 - Update and Delete Tasks (Priority: P1)

**Goal**: Users can modify task details and remove tasks they no longer need

**Independent Test**: Create task, edit title/description, delete task

### Tests for User Story 3 (TDD - Write FIRST, ensure they FAIL)

- [ ] T076 [P] [US3] Write backend/tests/test_tasks.py::test_update_task_own_task: User can update their own task (200)
- [ ] T077 [P] [US3] Write backend/tests/test_tasks.py::test_update_task_other_user: User cannot update other user's task (403)
- [ ] T078 [P] [US3] Write backend/tests/test_tasks.py::test_delete_task_own_task: User can delete their own task (204)
- [ ] T079 [P] [US3] Write backend/tests/test_tasks.py::test_delete_task_other_user: User cannot delete other user's task (403)
- [ ] T080 [P] [US3] Write frontend/__tests__/components/ConfirmDialog.test.tsx: Test delete confirmation modal

### Implementation for User Story 3

- [ ] T081 [P] [US3] Implement PUT /api/{user_id}/tasks/{task_id} in backend/src/api/routes/tasks.py: Update task with user isolation
- [ ] T082 [P] [US3] Implement DELETE /api/{user_id}/tasks/{task_id} in backend/src/api/routes/tasks.py: Delete task with user isolation
- [ ] T083 [P] [US3] Implement api.updateTask in frontend/lib/api.ts calling PUT /api/{user_id}/tasks/{id}
- [ ] T084 [P] [US3] Implement api.deleteTask in frontend/lib/api.ts calling DELETE /api/{user_id}/tasks/{id}
- [ ] T085 [US3] Add useUpdateTaskMutation and useDeleteTaskMutation to frontend/hooks/useTasks.ts
- [ ] T086 [US3] Add edit mode to frontend/components/TaskForm.tsx (pre-populate fields for editing)
- [ ] T087 [US3] Create frontend/components/ConfirmDialog.tsx for delete confirmation
- [ ] T088 [US3] Add "Edit" button to frontend/components/TaskItem.tsx opening TaskForm modal in edit mode
- [ ] T089 [US3] Add "Delete" button to frontend/components/TaskItem.tsx opening ConfirmDialog
- [ ] T090 [US3] Run all US3 tests (T076-T080) and verify they PASS

**Checkpoint**: Users can edit and delete tasks - US3 fully functional

---

## Phase 6: User Story 4 - Mark Tasks Complete/Incomplete (Priority: P1)

**Goal**: Users can toggle tasks between complete and incomplete states to track progress

**Independent Test**: Create tasks, toggle completion status, verify visual updates

### Tests for User Story 4 (TDD - Write FIRST, ensure they FAIL)

- [ ] T091 [P] [US4] Write backend/tests/test_tasks.py::test_toggle_task_status_complete: Mark task complete updates status and completed_at
- [ ] T092 [P] [US4] Write backend/tests/test_tasks.py::test_toggle_task_status_incomplete: Mark task incomplete clears completed_at
- [ ] T093 [P] [US4] Write backend/tests/test_tasks.py::test_toggle_status_persists: Status persists after refresh

### Implementation for User Story 4

- [ ] T094 [US4] Implement PATCH /api/{user_id}/tasks/{task_id}/status in backend/src/api/routes/tasks.py: Toggle status with user isolation
- [ ] T095 [US4] Implement api.toggleTaskStatus in frontend/lib/api.ts calling PATCH /api/{user_id}/tasks/{id}/status
- [ ] T096 [US4] Add useToggleTaskStatusMutation to frontend/hooks/useTasks.ts with optimistic updates
- [ ] T097 [US4] Add checkbox to frontend/components/TaskItem.tsx calling toggleTaskStatus on click
- [ ] T098 [US4] Add strikethrough styling to completed tasks in frontend/components/TaskItem.tsx
- [ ] T099 [US4] Run all US4 tests (T091-T093) and verify they PASS

**Checkpoint**: Users can mark tasks complete/incomplete - US4 fully functional

---

## Phase 7: User Story 5 - View Task Details (Priority: P2)

**Goal**: Users can click on any task to see its full details in an expanded view

**Independent Test**: Create task with long description, view in detail view

### Implementation for User Story 5 (Minimal tests - relies on US2 GET endpoint)

- [ ] T100 [US5] Create frontend/app/(dashboard)/tasks/[id]/page.tsx displaying full task details
- [ ] T101 [US5] Add "View Details" link to frontend/components/TaskItem.tsx linking to /tasks/[id]
- [ ] T102 [US5] Add "Back to Dashboard" button in task detail page

**Checkpoint**: Users can view full task details - US5 fully functional

---

## Phase 8: User Story 6 - Assign Task Priority (Priority: P2)

**Goal**: Users can assign priority levels (High, Medium, Low) to organize by importance

**Independent Test**: Create tasks with different priorities, verify visual indicators

### Tests for User Story 6 (TDD - Write FIRST, ensure they FAIL)

- [ ] T103 [P] [US6] Write backend/tests/test_tasks.py::test_create_task_with_priority: Task created with HIGH priority
- [ ] T104 [P] [US6] Write backend/tests/test_tasks.py::test_priority_defaults_to_medium: Task without priority defaults to MEDIUM
- [ ] T105 [P] [US6] Write frontend/__tests__/components/ui/Badge.test.tsx: Test priority badge colors

### Implementation for User Story 6

- [ ] T106 [US6] Add priority select dropdown to frontend/components/TaskForm.tsx (HIGH, MEDIUM, LOW options)
- [ ] T107 [US6] Display priority badge in frontend/components/TaskItem.tsx using Badge component
- [ ] T108 [US6] Add priority color variants to frontend/components/ui/Badge.tsx (red=HIGH, yellow=MEDIUM, green=LOW)
- [ ] T109 [US6] Run all US6 tests (T103-T105) and verify they PASS

**Checkpoint**: Users can assign and view task priorities - US6 fully functional

---

## Phase 9: User Story 7 - Organize Tasks with Tags (Priority: P2)

**Goal**: Users can add tags/categories (Work, Home, or custom) to organize tasks by context

**Independent Test**: Create tasks with different tags, verify tag display and assignment

### Tests for User Story 7 (TDD - Write FIRST, ensure they FAIL)

- [ ] T110 [P] [US7] Write backend/tests/test_tags.py::test_create_tag: Create custom tag returns 201
- [ ] T111 [P] [US7] Write backend/tests/test_tags.py::test_duplicate_tag: Creating duplicate tag returns 400
- [ ] T112 [P] [US7] Write backend/tests/test_tags.py::test_delete_tag_removes_from_tasks: Deleting tag removes it from all tasks
- [ ] T113 [P] [US7] Write backend/tests/test_tags.py::test_list_tags_user_isolation: User A cannot see User B's tags

### Implementation for User Story 7

- [ ] T114 [US7] Create backend/src/api/routes/tags.py with APIRouter
- [ ] T115 [P] [US7] Implement GET /api/{user_id}/tags in backend/src/api/routes/tags.py: List tags filtered by token user_id
- [ ] T116 [P] [US7] Implement POST /api/{user_id}/tags in backend/src/api/routes/tags.py: Create tag with user isolation
- [ ] T117 [P] [US7] Implement DELETE /api/{user_id}/tags/{tag_id} in backend/src/api/routes/tags.py: Delete tag with cascade
- [ ] T118 [US7] Mount tags router in backend/src/api/main.py
- [ ] T119 [P] [US7] Implement api.getTags, api.createTag, api.deleteTag in frontend/lib/api.ts
- [ ] T120 [US7] Create frontend/hooks/useTags.ts with React Query hooks
- [ ] T121 [US7] Add tag multi-select to frontend/components/TaskForm.tsx
- [ ] T122 [US7] Display tag badges in frontend/components/TaskItem.tsx
- [ ] T123 [US7] Add tag management section to dashboard (create/delete tags)
- [ ] T124 [US7] Run all US7 tests (T110-T113) and verify they PASS

**Checkpoint**: Users can create and assign tags - US7 fully functional

---

## Phase 10: User Story 8 - Schedule Tasks with Due Dates (Priority: P2)

**Goal**: Users can set due dates on tasks to manage deadlines and time-sensitive work

**Independent Test**: Create tasks with various due dates (past, present, future), verify overdue detection

### Tests for User Story 8 (TDD - Write FIRST, ensure they FAIL)

- [ ] T125 [P] [US8] Write backend/tests/test_tasks.py::test_task_with_due_date: Task created with due_date field
- [ ] T126 [P] [US8] Write backend/tests/test_tasks.py::test_overdue_detection: Task with past due_date flagged as overdue

### Implementation for User Story 8

- [ ] T127 [US8] Add due_date datetime picker to frontend/components/TaskForm.tsx
- [ ] T128 [US8] Display due_date in frontend/components/TaskItem.tsx with formatted date
- [ ] T129 [US8] Add overdue indicator ([!] badge) in frontend/components/TaskItem.tsx when due_date < now and status=INCOMPLETE
- [ ] T130 [US8] Run all US8 tests (T125-T126) and verify they PASS

**Checkpoint**: Users can schedule tasks with due dates - US8 fully functional

---

## Phase 11: User Story 9 - Search Tasks by Keyword (Priority: P2)

**Goal**: Users can search for tasks by typing keywords that match title or description

**Independent Test**: Create tasks with distinct keywords, search for them

### Tests for User Story 9 (TDD - Write FIRST, ensure they FAIL)

- [ ] T131 [P] [US9] Write backend/tests/test_tasks.py::test_search_by_keyword: GET /tasks?search=meeting returns matching tasks
- [ ] T132 [P] [US9] Write backend/tests/test_tasks.py::test_search_case_insensitive: Search is case-insensitive

### Implementation for User Story 9

- [ ] T133 [US9] Add search query parameter to GET /api/{user_id}/tasks in backend/src/api/routes/tasks.py (filter title/description with ILIKE)
- [ ] T134 [US9] Create frontend/components/SearchBar.tsx with debounced input (300ms delay)
- [ ] T135 [US9] Create frontend/hooks/useDebounce.ts hook
- [ ] T136 [US9] Add SearchBar to dashboard page updating useTasks query with search param
- [ ] T137 [US9] Run all US9 tests (T131-T132) and verify they PASS

**Checkpoint**: Users can search tasks by keyword - US9 fully functional

---

## Phase 12: User Story 10 - Filter Tasks by Status, Priority, and Tags (Priority: P2)

**Goal**: Users can filter task list to show only tasks matching specific criteria

**Independent Test**: Apply various filter combinations, verify correct task display

### Tests for User Story 10 (TDD - Write FIRST, ensure they FAIL)

- [ ] T138 [P] [US10] Write backend/tests/test_tasks.py::test_filter_by_status: GET /tasks?status=INCOMPLETE returns only incomplete tasks
- [ ] T139 [P] [US10] Write backend/tests/test_tasks.py::test_filter_by_priority: GET /tasks?priority=HIGH returns only high priority
- [ ] T140 [P] [US10] Write backend/tests/test_tasks.py::test_filter_by_tags: GET /tasks?tags=Work,Home returns tasks with Work OR Home tags
- [ ] T141 [P] [US10] Write backend/tests/test_tasks.py::test_combined_filters: Filters can be combined with AND logic

### Implementation for User Story 10

- [ ] T142 [US10] Add status, priority, tags query parameters to GET /api/{user_id}/tasks in backend/src/api/routes/tasks.py
- [ ] T143 [US10] Create frontend/components/FilterPanel.tsx with status, priority, tags dropdowns
- [ ] T144 [US10] Add FilterPanel to dashboard page updating useTasks query with filter params
- [ ] T145 [US10] Add "Clear Filters" button to FilterPanel
- [ ] T146 [US10] Run all US10 tests (T138-T141) and verify they PASS

**Checkpoint**: Users can filter tasks - US10 fully functional

---

## Phase 13: User Story 11 - Sort Tasks by Different Criteria (Priority: P2)

**Goal**: Users can sort task list by due date, priority, creation date, or alphabetically

**Independent Test**: Create tasks with different properties, cycle through sort options

### Tests for User Story 11 (TDD - Write FIRST, ensure they FAIL)

- [ ] T147 [P] [US11] Write backend/tests/test_tasks.py::test_sort_by_due_date: GET /tasks?sort=due_date&order=asc returns tasks ordered by due_date
- [ ] T148 [P] [US11] Write backend/tests/test_tasks.py::test_sort_by_priority: GET /tasks?sort=priority returns HIGH → MEDIUM → LOW
- [ ] T149 [P] [US11] Write backend/tests/test_tasks.py::test_sort_persists: Sort preference persists in localStorage

### Implementation for User Story 11

- [ ] T150 [US11] Add sort, order query parameters to GET /api/{user_id}/tasks in backend/src/api/routes/tasks.py
- [ ] T151 [US11] Create frontend/components/SortDropdown.tsx with sort field and direction options
- [ ] T152 [US11] Add SortDropdown to dashboard page updating useTasks query
- [ ] T153 [US11] Save sort preference to localStorage and load on mount
- [ ] T154 [US11] Run all US11 tests (T147-T149) and verify they PASS

**Checkpoint**: Users can sort tasks - US11 fully functional

---

## Phase 14: User Story 12 - Set Up Recurring Tasks (Priority: P3)

**Goal**: Users can mark tasks as recurring (daily, weekly, monthly, yearly) for automatic recreation when completed

**Independent Test**: Create recurring task, complete it, verify new instance created

### Tests for User Story 12 (TDD - Write FIRST, ensure they FAIL)

- [ ] T155 [P] [US12] Write backend/tests/test_tasks.py::test_create_recurring_task: Task created with recurrence=WEEKLY
- [ ] T156 [P] [US12] Write backend/tests/test_tasks.py::test_complete_recurring_task_reschedules: Completing weekly task creates new instance +7 days
- [ ] T157 [P] [US12] Write backend/tests/test_tasks.py::test_recurring_daily: DAILY recurrence adds +1 day
- [ ] T158 [P] [US12] Write backend/tests/test_tasks.py::test_recurring_monthly: MONTHLY recurrence adds +1 month
- [ ] T159 [P] [US12] Write backend/tests/test_tasks.py::test_stop_recurrence: Changing recurrence to NONE stops future instances

### Implementation for User Story 12

- [ ] T160 [US12] Add recurring task logic to PATCH /api/{user_id}/tasks/{id}/status in backend/src/api/routes/tasks.py: When status=COMPLETE and recurrence!=NONE, update last_completed_at, calculate next due_date, reset status to INCOMPLETE
- [ ] T161 [US12] Add recurrence select dropdown to frontend/components/TaskForm.tsx (NONE, DAILY, WEEKLY, MONTHLY, YEARLY)
- [ ] T162 [US12] Display recurrence indicator (🔁 icon) in frontend/components/TaskItem.tsx when recurrence!=NONE
- [ ] T163 [US12] Run all US12 tests (T155-T159) and verify they PASS

**Checkpoint**: Users can create recurring tasks - US12 fully functional

---

## Phase 15: User Story 13 - Receive Due Date Reminders (Priority: P3)

**Goal**: Users can receive notifications before tasks are due to avoid missing deadlines

**Independent Test**: Create task due soon, verify notification delivery

### Tests for User Story 13 (TDD - Write FIRST, ensure they FAIL)

- [ ] T164 [P] [US13] Write frontend/__tests__/hooks/useNotifications.test.ts: Test notification permission request
- [ ] T165 [P] [US13] Write frontend/__tests__/hooks/useNotifications.test.ts: Test reminder triggers for tasks due in 1 hour

### Implementation for User Story 13

- [ ] T166 [US13] Create frontend/hooks/useNotifications.ts with requestPermission and scheduleReminder functions
- [ ] T167 [US13] Add notification permission request on dashboard mount
- [ ] T168 [US13] Add reminder scheduling logic: Check tasks due in 1 hour or 1 day, send browser notification
- [ ] T169 [US13] Add interval timer to check for upcoming deadlines every 5 minutes
- [ ] T170 [US13] Display "Notifications blocked" warning if permission denied
- [ ] T171 [US13] Run all US13 tests (T164-T165) and verify they PASS

**Checkpoint**: Users receive due date reminders - US13 fully functional

---

## Phase 16: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T172 [P] Add comprehensive error logging to backend/src/api/main.py with request/response logging middleware
- [ ] T173 [P] Add loading states to all frontend components (TaskList, TaskForm, etc.)
- [ ] T174 [P] Add empty states with helpful messages and CTAs (e.g., "Create your first task")
- [ ] T175 Code cleanup: Remove unused imports, fix type warnings, run black/prettier
- [ ] T176 Performance: Add database indexes per data-model.md (user_id, status, priority, due_date)
- [ ] T177 [P] Security audit: Run security_auditor agent on backend/src/api/ to verify JWT verification on all protected endpoints
- [ ] T178 [P] API contract validation: Run api_contract_validator agent to verify frontend TypeScript types match backend Pydantic models
- [ ] T179 [P] Add comprehensive README.md with quickstart instructions from quickstart.md
- [ ] T180 Run pytest with coverage: Verify ≥60% overall, 100% for backend/src/api/auth.py and backend/src/api/routes/tasks.py
- [ ] T181 Run frontend tests with coverage: npm test -- --coverage
- [ ] T182 Manual QA: Follow quickstart.md validation steps end-to-end
- [ ] T183 [P] Create Docker Compose setup for local development (backend, frontend, postgres)
- [ ] T184 Add deployment documentation for production (Vercel, Railway, Neon)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-15)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P0 → P1 → P2 → P3)
- **Polish (Phase 16)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P0) Authentication**: Can start after Foundational - No dependencies on other stories
- **US2 (P1) Create/View Tasks**: Depends on US1 (auth required)
- **US3 (P1) Update/Delete**: Depends on US2 (needs task CRUD endpoints)
- **US4 (P1) Complete/Incomplete**: Depends on US2 (needs tasks to exist)
- **US5 (P2) View Details**: Depends on US2 (uses same GET endpoint)
- **US6 (P2) Priority**: Can implement with US2 (priority field already in model)
- **US7 (P2) Tags**: Depends on US2 (tags apply to tasks)
- **US8 (P2) Due Dates**: Can implement with US2 (due_date field already in model)
- **US9 (P2) Search**: Depends on US2 (searches existing tasks)
- **US10 (P2) Filter**: Depends on US2 (filters existing tasks)
- **US11 (P2) Sort**: Depends on US2 (sorts existing tasks)
- **US12 (P3) Recurring**: Depends on US4 (status toggle triggers recurrence)
- **US13 (P3) Reminders**: Depends on US8 (reminders based on due dates)

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Backend endpoints before frontend API calls
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002-T005, T009-T010)
- Backend Foundation tasks marked [P] can run in parallel (T014-T017, T030-T035)
- All tests for a user story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members (after Foundational complete)

---

## Parallel Example: User Story 2

```bash
# Launch all tests for User Story 2 together:
Task: "Write backend/tests/test_tasks.py::test_list_tasks_returns_only_user_tasks"
Task: "Write backend/tests/test_tasks.py::test_create_task_uses_token_user_id"
Task: "Write backend/tests/test_tasks.py::test_create_task_validation"
Task: "Write backend/tests/test_tasks.py::test_get_task_by_id_own_task"
Task: "Write backend/tests/test_tasks.py::test_get_task_by_id_other_user"
Task: "Write frontend/__tests__/components/TaskList.test.tsx"
Task: "Write frontend/__tests__/components/TaskForm.test.tsx"

# Launch parallel backend implementations:
Task: "Implement POST /api/{user_id}/tasks"
Task: "Implement GET /api/{user_id}/tasks"
Task: "Implement GET /api/{user_id}/tasks/{task_id}"

# Launch parallel frontend API implementations:
Task: "Implement api.getTasks in frontend/lib/api.ts"
Task: "Implement api.createTask in frontend/lib/api.ts"
Task: "Implement api.getTask in frontend/lib/api.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1-4 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Authentication) - **TEST INDEPENDENTLY**
4. Complete Phase 4: User Story 2 (Create/View) - **TEST INDEPENDENTLY**
5. Complete Phase 5: User Story 3 (Update/Delete) - **TEST INDEPENDENTLY**
6. Complete Phase 6: User Story 4 (Complete/Incomplete) - **TEST INDEPENDENTLY**
7. **STOP and VALIDATE**: Full MVP with auth + basic CRUD
8. Deploy/demo if ready

**MVP Success Criteria**:
- Users can sign up and sign in (US1)
- Users can create and view tasks (US2)
- Users can edit and delete tasks (US3)
- Users can mark tasks complete (US4)
- 100% test coverage for authentication and CRUD
- Zero data leakage between users
- All critical path tests passing

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 (Auth) → Test independently → Deploy/Demo
3. Add US2-4 (CRUD) → Test independently → Deploy/Demo (MVP!)
4. Add US5-8 (Details, Priority, Tags, Due Dates) → Test independently → Deploy/Demo
5. Add US9-11 (Search, Filter, Sort) → Test independently → Deploy/Demo
6. Add US12-13 (Recurring, Reminders) → Test independently → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (Auth) → US2 (Create/View) → US9 (Search)
   - Developer B: US3 (Update/Delete) → US4 (Complete) → US10 (Filter)
   - Developer C: US6 (Priority) → US7 (Tags) → US11 (Sort)
3. Stories complete and integrate independently

---

## Test Coverage Requirements (Constitution Section VIII)

### Critical Path Coverage: 100% Mandatory

**MUST achieve 100% test coverage for:**
- `backend/src/api/auth.py` - JWT verification (T038-T043)
- `backend/src/api/routes/tasks.py` - CRUD with user isolation (T054-T079)
- `frontend/lib/api.ts` - API client with JWT auto-attachment

**Critical Test Scenarios:**
1. ✅ Authentication flow (8 tests): Valid token, expired, invalid signature, malformed, missing, wrong user_id, missing payload, future expiry
2. ✅ CRUD with authorization (6 tests): List (user isolation), Get (own/other/404), Create (token user_id), Update, Delete
3. ✅ User isolation (3 tests): Query filtering, cross-user access prevention, URL manipulation

### Overall Coverage: 60% Minimum

- Backend: ≥60% overall (run `pytest --cov=src/api --cov-report=html`)
- Frontend: ≥60% overall (run `npm test -- --coverage`)

### Test Execution

```bash
# Backend tests
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
pytest -v
pytest --cov=src/api --cov-report=html

# Frontend tests
cd frontend
npm test
npm test -- --coverage
```

---

## Notes

- **[P]** tasks = different files, no dependencies, can run in parallel
- **[Story]** label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- **TDD Workflow**: Write test → Verify it FAILS → Implement → Verify it PASSES → Refactor
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- **Security**: ALWAYS filter database queries by token `user_id`, NEVER by URL `user_id`
- **Test First**: All test tasks (T038-T171) MUST be written before their corresponding implementation tasks

---

**Total Tasks**: 184 tasks across 16 phases
**MVP Tasks**: T001-T099 (99 tasks for US1-US4)
**Test Tasks**: 42 test tasks following TDD approach
**Parallel Opportunities**: 47 tasks marked [P] can run in parallel
**Critical Path**: Phase 1 → Phase 2 → (Phase 3-15 in parallel or priority order) → Phase 16

**Ready for Implementation**: All tasks are specific, testable, and include exact file paths. Each user story is independently deliverable.
