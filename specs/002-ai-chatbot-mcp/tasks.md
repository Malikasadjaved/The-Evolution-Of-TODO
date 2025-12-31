# Tasks: AI Chatbot with MCP Architecture

**Input**: Design documents from `/specs/002-ai-chatbot-mcp/`
**Prerequisites**: plan.md, spec.md, Phase 3 constitution v1.1.0

**Tests**: Included (≥85% coverage target) - 50+ unit, 15+ integration, 5+ E2E tests per spec.md

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1-US7) this task belongs to
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for Phase 3 monorepo integration

- [ ] T001 Create backend/mcp/ directory structure (server.py, tools/, utils/, schemas.py)
- [ ] T002 Create frontend-chatbot/ directory structure (src/components/, src/lib/, src/pages/)
- [ ] T003 [P] Create backend/tests/ structure (unit/, integration/, e2e/)
- [ ] T004 [P] Initialize Python dependencies file backend/requirements-phase3.txt (FastAPI, SQLModel, OpenAI SDK, MCP SDK, pytest)
- [ ] T005 [P] Initialize frontend-chatbot/package.json with Next.js 16+, TypeScript, OpenAI ChatKit dependencies
- [ ] T006 [P] Create backend/mcp/__init__.py and backend/mcp/tools/__init__.py
- [ ] T007 [P] Create .env.example files for backend (DATABASE_URL, OPENAI_API_KEY, AUTH_SECRET, PORT, ENVIRONMENT)
- [ ] T008 [P] Create frontend-chatbot/.env.local.example (NEXT_PUBLIC_API_URL)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure MUST be complete before ANY user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Models (Shared)

- [ ] T009 [P] Create Conversation model in backend/src/models/conversation.py (id, user_id, created_at, updated_at, indexes)
- [ ] T010 [P] Create Message model in backend/src/models/message.py (id, conversation_id, user_id, role, content, created_at, indexes, cascade delete)
- [ ] T011 [P] Write unit tests for Conversation model in backend/tests/unit/test_models.py (3 tests: create, cascade delete, indexes)
- [ ] T012 [P] Write unit tests for Message model in backend/tests/unit/test_models.py (3 tests: user role, assistant role, invalid role)
- [ ] T013 Create Alembic migration for conversations and messages tables in backend/alembic/versions/

### MCP Infrastructure

- [ ] T014 [P] Create MCP tool input/output schemas in backend/mcp/schemas.py (AddTaskInput, AddTaskOutput, ListTasksInput, etc.)
- [ ] T015 [P] Implement ConversationManager class in backend/mcp/utils/conversation_manager.py (load_conversation_history, _compress_history, MAX_CONTEXT_TOKENS=8000)
- [ ] T016 [P] Write unit tests for ConversationManager in backend/tests/unit/test_conversation_manager.py (4 tests: under limit, over limit, keep last 10, summarize)
- [ ] T017 [P] Implement CircuitBreaker class in backend/mcp/utils/circuit_breaker.py (CircuitState enum, call method, failure tracking, recovery)
- [ ] T018 [P] Implement StructuredLogger class in backend/mcp/utils/logger.py (JSON logging, PII protection, log levels)

### Health Checks & Cloud-Native

- [ ] T019 [P] Implement GET /health endpoint in backend/src/api/main.py (liveness check, < 500ms response)
- [ ] T020 [P] Implement GET /ready endpoint in backend/src/api/main.py (readiness check, database + OpenAI connectivity verification)
- [ ] T021 [P] Implement graceful shutdown handlers in backend/src/api/main.py (SIGTERM, SIGINT, lifespan context manager)
- [ ] T022 [P] Configure server to bind to 0.0.0.0 (not 127.0.0.1) in backend/src/api/main.py with PORT env variable

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Add Task via Natural Language (Priority: P1) 🎯 MVP

**Goal**: Users can create tasks using natural language through the chatbot. Tasks appear in both chatbot and Phase 2 web UI.

**Independent Test**: User sends "Add a task to buy groceries tomorrow at 5pm" and task appears in both UIs with correct title, due date, and time.

### Unit Tests for add_task Tool

- [ ] T023 [P] [US1] Test add_task success with all fields in backend/tests/unit/test_mcp_tools.py
- [ ] T024 [P] [US1] Test add_task success with minimal fields (title only) in backend/tests/unit/test_mcp_tools.py
- [ ] T025 [P] [US1] Test add_task error on empty title in backend/tests/unit/test_mcp_tools.py
- [ ] T026 [P] [US1] Test add_task error on invalid priority in backend/tests/unit/test_mcp_tools.py
- [ ] T027 [P] [US1] Test add_task error on invalid due_date format in backend/tests/unit/test_mcp_tools.py
- [ ] T028 [P] [US1] Test add_task user isolation (cannot create task for other user) in backend/tests/unit/test_mcp_tools.py

### Implementation for add_task Tool

- [ ] T029 [US1] Implement add_task function in backend/mcp/tools/add_task.py (input validation, database insert, return AddTaskOutput)
- [ ] T030 [US1] Register add_task tool in backend/mcp/tools/__init__.py export

### Integration Tests for User Story 1

- [ ] T031 [US1] Integration test: Agent calls add_task via chat endpoint in backend/tests/integration/test_agent_orchestration.py
- [ ] T032 [US1] Integration test: Task created via chatbot appears in Phase 2 database in backend/tests/integration/test_phase2_integration.py

**Checkpoint**: User Story 1 functional - users can create tasks via natural language

---

## Phase 4: User Story 2 - List and Filter Tasks via Conversation (Priority: P1)

**Goal**: Users can view and filter their tasks using natural language queries. Essential for verifying tasks were created.

**Independent Test**: User asks "Show me all high priority tasks" and chatbot displays only HIGH priority tasks.

### Unit Tests for list_tasks Tool

- [ ] T033 [P] [US2] Test list_tasks success with all tasks in backend/tests/unit/test_mcp_tools.py
- [ ] T034 [P] [US2] Test list_tasks filter by status (pending) in backend/tests/unit/test_mcp_tools.py
- [ ] T035 [P] [US2] Test list_tasks filter by status (completed) in backend/tests/unit/test_mcp_tools.py
- [ ] T036 [P] [US2] Test list_tasks filter by priority in backend/tests/unit/test_mcp_tools.py
- [ ] T037 [P] [US2] Test list_tasks filter by tag in backend/tests/unit/test_mcp_tools.py
- [ ] T038 [P] [US2] Test list_tasks empty list (no tasks) in backend/tests/unit/test_mcp_tools.py
- [ ] T039 [P] [US2] Test list_tasks pagination (50+ tasks) in backend/tests/unit/test_mcp_tools.py
- [ ] T040 [P] [US2] Test list_tasks user isolation (cannot see other user's tasks) in backend/tests/unit/test_mcp_tools.py

### Implementation for list_tasks Tool

- [ ] T041 [US2] Implement list_tasks function in backend/mcp/tools/list_tasks.py (filter by status/priority/tag, order by created_at DESC, return ListTasksOutput)
- [ ] T042 [US2] Register list_tasks tool in backend/mcp/tools/__init__.py export

### Integration Tests for User Story 2

- [ ] T043 [US2] Integration test: Agent calls list_tasks via chat endpoint in backend/tests/integration/test_agent_orchestration.py
- [ ] T044 [US2] Integration test: Multi-tool workflow (add_task → list_tasks) in backend/tests/integration/test_agent_orchestration.py

**Checkpoint**: User Stories 1 AND 2 functional - users can create and view tasks

---

## Phase 5: User Story 3 - Mark Tasks Complete via Conversation (Priority: P1)

**Goal**: Users can mark tasks as complete using natural language. Completes core task lifecycle (create → list → complete).

**Independent Test**: User says "Mark 'finish report' as done" and task status changes to COMPLETE in both chatbot and web UI.

### Unit Tests for complete_task Tool

- [ ] T045 [P] [US3] Test complete_task success on incomplete task in backend/tests/unit/test_mcp_tools.py
- [ ] T046 [P] [US3] Test complete_task idempotent (already complete) in backend/tests/unit/test_mcp_tools.py
- [ ] T047 [P] [US3] Test complete_task error on task not found in backend/tests/unit/test_mcp_tools.py
- [ ] T048 [P] [US3] Test complete_task error on task belongs to different user in backend/tests/unit/test_mcp_tools.py
- [ ] T049 [P] [US3] Test complete_task updates updated_at timestamp in backend/tests/unit/test_mcp_tools.py
- [ ] T050 [P] [US3] Test complete_task recurring task creates new instance (if Phase 2 supports) in backend/tests/unit/test_mcp_tools.py

### Implementation for complete_task Tool

- [ ] T051 [US3] Implement complete_task function in backend/mcp/tools/complete_task.py (find task, update status=COMPLETE, update timestamp, return CompleteTaskOutput)
- [ ] T052 [US3] Register complete_task tool in backend/mcp/tools/__init__.py export

### Integration Tests for User Story 3

- [ ] T053 [US3] Integration test: Agent calls complete_task via chat endpoint in backend/tests/integration/test_agent_orchestration.py
- [ ] T054 [US3] Integration test: Complete task syncs to Phase 2 web UI in backend/tests/integration/test_phase2_integration.py

**Checkpoint**: MVP COMPLETE - Users can create, list, and complete tasks (P1 user stories done)

---

## Phase 6: User Story 4 - Update Task Details (Priority: P2)

**Goal**: Users can modify task properties (title, description, priority, tags, due_date) through conversation.

**Independent Test**: User says "Change the deadline for 'finish report' to next Monday" and due date updates in both UIs.

### Unit Tests for update_task Tool

- [ ] T055 [P] [US4] Test update_task success on title in backend/tests/unit/test_mcp_tools.py
- [ ] T056 [P] [US4] Test update_task success on multiple fields in backend/tests/unit/test_mcp_tools.py
- [ ] T057 [P] [US4] Test update_task error on task not found in backend/tests/unit/test_mcp_tools.py
- [ ] T058 [P] [US4] Test update_task error on no fields provided in backend/tests/unit/test_mcp_tools.py
- [ ] T059 [P] [US4] Test update_task user isolation in backend/tests/unit/test_mcp_tools.py

### Implementation for update_task Tool

- [ ] T060 [US4] Implement update_task function in backend/mcp/tools/update_task.py (find task, update fields, return UpdateTaskOutput with changes)
- [ ] T061 [US4] Register update_task tool in backend/mcp/tools/__init__.py export

### Integration Tests for User Story 4

- [ ] T062 [US4] Integration test: Agent calls update_task via chat endpoint in backend/tests/integration/test_agent_orchestration.py

**Checkpoint**: User Story 4 functional - users can update task properties

---

## Phase 7: User Story 5 - Delete Tasks (Priority: P2)

**Goal**: Users can remove tasks they no longer need using natural language.

**Independent Test**: User says "Delete the task about buying groceries" and task disappears from both UIs.

### Unit Tests for delete_task Tool

- [ ] T063 [P] [US5] Test delete_task success in backend/tests/unit/test_mcp_tools.py
- [ ] T064 [P] [US5] Test delete_task error on task not found in backend/tests/unit/test_mcp_tools.py
- [ ] T065 [P] [US5] Test delete_task error on task belongs to different user in backend/tests/unit/test_mcp_tools.py
- [ ] T066 [P] [US5] Test delete_task returns deleted task title in backend/tests/unit/test_mcp_tools.py
- [ ] T067 [P] [US5] Test delete_task confirms task no longer queryable in backend/tests/unit/test_mcp_tools.py

### Implementation for delete_task Tool

- [ ] T068 [US5] Implement delete_task function in backend/mcp/tools/delete_task.py (find task, save title, delete, return DeleteTaskOutput)
- [ ] T069 [US5] Register delete_task tool in backend/mcp/tools/__init__.py export

### Integration Tests for User Story 5

- [ ] T070 [US5] Integration test: Agent calls delete_task via chat endpoint in backend/tests/integration/test_agent_orchestration.py
- [ ] T071 [US5] Integration test: Delete task syncs to Phase 2 web UI in backend/tests/integration/test_phase2_integration.py

**Checkpoint**: User Story 5 functional - users can delete tasks

---

## Phase 8: User Story 6 - Conversation Context and History (Priority: P2)

**Goal**: Chatbot remembers conversation context so users can refer to previous messages without repeating information.

**Independent Test**: User says "Create a task to review code" then "Change it to high priority" and chatbot correctly identifies "it" refers to the just-created task.

### Implementation for Chat Endpoint

- [ ] T072 [P] [US6] Create ChatRequest Pydantic model in backend/src/api/chat.py (conversation_id optional, message required 1-5000 chars)
- [ ] T073 [P] [US6] Create ChatResponse Pydantic model in backend/src/api/chat.py (conversation_id, message_id, response, tool_calls)
- [ ] T074 [US6] Implement POST /api/chat/{user_id} endpoint in backend/src/api/chat.py (JWT validation, load/create conversation, append user message, load history via ConversationManager, invoke agent, store response, return ChatResponse)
- [ ] T075 [US6] Register chat endpoint in backend/src/api/main.py router

### Integration Tests for Chat Endpoint

- [ ] T076 [P] [US6] Test chat endpoint creates new conversation on first message in backend/tests/integration/test_chat_endpoint.py
- [ ] T077 [P] [US6] Test chat endpoint continues existing conversation in backend/tests/integration/test_chat_endpoint.py
- [ ] T078 [P] [US6] Test chat endpoint stores user message to database in backend/tests/integration/test_chat_endpoint.py
- [ ] T079 [P] [US6] Test chat endpoint stores assistant response to database in backend/tests/integration/test_chat_endpoint.py
- [ ] T080 [P] [US6] Test chat endpoint error on invalid JWT token (401) in backend/tests/integration/test_chat_endpoint.py
- [ ] T081 [P] [US6] Test chat endpoint error on token user_id mismatch (403) in backend/tests/integration/test_chat_endpoint.py
- [ ] T082 [P] [US6] Test chat endpoint error on conversation not found (404) in backend/tests/integration/test_chat_endpoint.py
- [ ] T083 [P] [US6] Test chat endpoint error on invalid message format (422) in backend/tests/integration/test_chat_endpoint.py

**Checkpoint**: User Story 6 functional - chatbot maintains conversation context

---

## Phase 9: User Story 7 - Multi-Turn Task Creation (Priority: P3)

**Goal**: Users can create complex tasks through guided multi-turn conversation instead of single command.

**Independent Test**: User starts with "Create a task" and chatbot guides through title, priority, due date, and tags.

### Implementation for Agent Client

- [ ] T084 [P] [US7] Create AgentClient class in backend/mcp/utils/agent_client.py (initialize OpenAI client, register 5 MCP tools, chat method)
- [ ] T085 [US7] Implement tool registration in AgentClient.chat method (add_task, list_tasks, complete_task, delete_task, update_task with schemas)
- [ ] T086 [US7] Implement conversation history handling in AgentClient.chat (build messages array, call OpenAI Agents API with tools)
- [ ] T087 [US7] Implement tool execution logic in AgentClient._execute_tool (parse tool_calls, inject user_id, execute MCP tools, collect results)
- [ ] T088 [US7] Integrate CircuitBreaker with AgentClient for OpenAI API calls (wrap OpenAI call with circuit_breaker.call)

### Integration Tests for Agent Orchestration

- [ ] T089 [P] [US7] Test agent uses conversation context (pronouns "the first one") in backend/tests/integration/test_agent_orchestration.py
- [ ] T090 [P] [US7] Test agent calls multiple tools in sequence in backend/tests/integration/test_agent_orchestration.py
- [ ] T091 [P] [US7] Test agent error on OpenAI API timeout in backend/tests/integration/test_agent_orchestration.py
- [ ] T092 [P] [US7] Test circuit breaker opens after failures in backend/tests/integration/test_agent_orchestration.py
- [ ] T093 [P] [US7] Test agent error on invalid tool parameters in backend/tests/integration/test_agent_orchestration.py

**Checkpoint**: All P1-P3 user stories complete - full chatbot functionality implemented

---

## Phase 10: Frontend & End-to-End Testing

**Purpose**: User interface and complete conversation flow testing

### Frontend Implementation

- [ ] T094 [P] Create ChatInterface component in frontend-chatbot/src/components/ChatInterface.tsx (render messages, capture input, send POST to /api/chat, handle loading/errors)
- [ ] T095 [P] Create API client in frontend-chatbot/src/lib/api.ts (sendMessage function, JWT attachment from localStorage, error handling for 401/403/503)
- [ ] T096 [P] Create main chat page in frontend-chatbot/src/pages/index.tsx (integrate ChatInterface, authentication check)
- [ ] T097 [P] Create TypeScript types in frontend-chatbot/src/types/api.ts (ChatRequest, ChatResponse, Message interfaces)
- [ ] T098 Configure frontend environment variables in frontend-chatbot/.env.local (NEXT_PUBLIC_API_URL)

### End-to-End Tests

- [ ] T099 [P] E2E test: Create → List → Complete → Delete flow in backend/tests/e2e/test_conversation_flows.py (full conversation, verify database state)
- [ ] T100 [P] E2E test: Context retention across messages in backend/tests/e2e/test_conversation_flows.py (list → "complete the first one")
- [ ] T101 [P] E2E test: Error recovery (task not found) in backend/tests/e2e/test_conversation_flows.py (graceful error handling)
- [ ] T102 [P] E2E test: Multi-tool workflow (list then complete) in backend/tests/e2e/test_conversation_flows.py (agent calls list_tasks → complete_task)
- [ ] T103 [P] E2E test: Conversation persistence after server restart in backend/tests/e2e/test_conversation_flows.py (simulate restart, verify context preserved)

**Checkpoint**: Frontend complete, all E2E tests passing

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Production readiness improvements affecting multiple user stories

### Documentation & Validation

- [ ] T104 [P] Create quickstart.md in specs/002-ai-chatbot-mcp/ (local setup instructions, environment variables, test steps)
- [ ] T105 [P] Update main README.md with Phase 3 setup instructions and architecture diagram
- [ ] T106 [P] Create API documentation using OpenAPI spec from FastAPI auto-docs
- [ ] T107 Run quickstart.md validation end-to-end on fresh environment

### Code Quality & Performance

- [ ] T108 [P] Run Black formatter on all backend Python files
- [ ] T109 [P] Run Flake8 linter on backend code (fix any issues)
- [ ] T110 [P] Run Mypy type checker on backend code (fix any type errors)
- [ ] T111 [P] Run ESLint on frontend TypeScript files
- [ ] T112 Verify test coverage ≥ 85% (run pytest --cov)
- [ ] T113 Performance test: Verify chat endpoint < 5s P95 response time
- [ ] T114 Performance test: Verify conversation history load < 500ms for 50 messages

### Security Hardening

- [ ] T115 [P] Security audit: Verify all database queries filter by user_id from JWT (not URL)
- [ ] T116 [P] Security audit: Verify JWT validation on all protected endpoints
- [ ] T117 [P] Security audit: Verify input sanitization prevents injection
- [ ] T118 [P] Security audit: Verify no PII in production logs (user_id hashed)
- [ ] T119 [P] Security audit: Verify no secrets in source code (all in env vars)

### Deployment Readiness

- [ ] T120 [P] Create Dockerfile for backend service (multi-stage build, non-root user, PORT env var)
- [ ] T121 [P] Create docker-compose.yml for local development (backend, frontend-chatbot, database)
- [ ] T122 [P] Create deployment checklist (health checks, env vars, migrations, monitoring)
- [ ] T123 Verify health check endpoints return 200 (GET /health, GET /ready)
- [ ] T124 Verify graceful shutdown works (send SIGTERM, verify active requests complete)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - **BLOCKS all user stories**
- **User Stories (Phase 3-9)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if team staffed)
  - Or sequentially in priority order: US1 → US2 → US3 (MVP) → US4 → US5 → US6 → US7
- **Frontend & E2E (Phase 10)**: Depends on US1-US6 completion (US7 optional)
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (Add Task)**: Can start after Foundational - No dependencies on other stories
- **US2 (List Tasks)**: Can start after Foundational - May integrate with US1 but independently testable
- **US3 (Complete Task)**: Can start after Foundational - May integrate with US1/US2 but independently testable
- **US4 (Update Task)**: Can start after Foundational - Independent
- **US5 (Delete Task)**: Can start after Foundational - Independent
- **US6 (Conversation Context)**: Depends on US1-US3 (needs tools to orchestrate)
- **US7 (Multi-Turn Creation)**: Depends on US1, US6 (builds on context and add_task)

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- MCP tools before integration tests
- Chat endpoint before frontend
- Unit tests can run in parallel (marked [P])
- Models can run in parallel within a story (marked [P])

### Parallel Opportunities (Marked [P])

**Phase 1 (Setup)**: All 8 tasks can run in parallel

**Phase 2 (Foundational)**:
- T009-T010 (models) in parallel
- T011-T012 (model tests) in parallel
- T014-T018 (infrastructure) in parallel
- T019-T022 (health checks) in parallel

**Phase 3 (US1)**: T023-T028 (unit tests) in parallel

**Phase 4 (US2)**: T033-T040 (unit tests) in parallel

**Phase 5 (US3)**: T045-T050 (unit tests) in parallel

**Phase 6 (US4)**: T055-T059 (unit tests) in parallel

**Phase 7 (US5)**: T063-T067 (unit tests) in parallel

**Phase 8 (US6)**: T072-T073, T076-T083 (tests) in parallel

**Phase 9 (US7)**: T084, T089-T093 in parallel after T085-T088 complete

**Phase 10 (Frontend)**: T094-T098 (frontend), T099-T103 (E2E tests) in parallel

**Phase 11 (Polish)**: T104-T106, T108-T111, T115-T119, T120-T122 can all run in parallel

---

## Parallel Example: User Story 1 (Add Task)

```bash
# Launch all unit tests for US1 together (different test cases):
Task: "Test add_task success with all fields"
Task: "Test add_task success with minimal fields"
Task: "Test add_task error on empty title"
Task: "Test add_task error on invalid priority"
Task: "Test add_task error on invalid due_date"
Task: "Test add_task user isolation"

# Then implement tool:
Task: "Implement add_task function in backend/mcp/tools/add_task.py"

# Then integration tests in parallel:
Task: "Integration test: Agent calls add_task via chat endpoint"
Task: "Integration test: Task created via chatbot appears in Phase 2"
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only)

**Minimum Viable Product**: Create, list, and complete tasks via chatbot

1. Complete Phase 1: Setup (8 tasks)
2. Complete Phase 2: Foundational (14 tasks) - **CRITICAL BLOCKER**
3. Complete Phase 3: User Story 1 - Add Task (10 tasks)
4. Complete Phase 4: User Story 2 - List Tasks (12 tasks)
5. Complete Phase 5: User Story 3 - Complete Task (10 tasks)
6. **STOP and VALIDATE**: Test MVP independently (create → list → complete flow)
7. Deploy/demo MVP if ready

**Total MVP Tasks**: 54 tasks
**MVP Deliverable**: Users can manage tasks (create, view, complete) through natural conversation

### Incremental Delivery (Recommended)

1. **Foundation**: Setup + Foundational (22 tasks) → Infrastructure ready
2. **MVP**: Add User Stories 1-3 (32 tasks) → Test independently → Deploy/Demo
3. **Enhancement 1**: Add User Story 4 - Update (7 tasks) → Test independently → Deploy/Demo
4. **Enhancement 2**: Add User Story 5 - Delete (9 tasks) → Test independently → Deploy/Demo
5. **Enhancement 3**: Add User Story 6 - Context (12 tasks) → Test independently → Deploy/Demo
6. **Enhancement 4**: Add User Story 7 - Multi-Turn (10 tasks) → Test independently → Deploy/Demo
7. **Production**: Frontend + E2E + Polish (31 tasks) → Full production deployment

Each increment adds value without breaking previous functionality.

### Parallel Team Strategy

With multiple developers after Foundational phase completes:

1. **Team completes Setup + Foundational together** (22 tasks)
2. **Once Foundational done, parallelize user stories**:
   - Developer A: User Story 1 (Add Task)
   - Developer B: User Story 2 (List Tasks)
   - Developer C: User Story 3 (Complete Task)
3. **After MVP (US1-US3) validated**:
   - Developer A: User Story 4 (Update Task)
   - Developer B: User Story 5 (Delete Task)
   - Developer C: User Story 6 (Conversation Context)
4. **Final Sprint**:
   - Developer A: User Story 7 (Multi-Turn)
   - Developer B: Frontend (Phase 10)
   - Developer C: Polish (Phase 11)

---

## Task Summary

**Total Tasks**: 124 tasks

**By Phase**:
- Phase 1 (Setup): 8 tasks
- Phase 2 (Foundational): 14 tasks
- Phase 3 (US1 - Add Task): 10 tasks
- Phase 4 (US2 - List Tasks): 12 tasks
- Phase 5 (US3 - Complete Task): 10 tasks
- Phase 6 (US4 - Update Task): 7 tasks
- Phase 7 (US5 - Delete Task): 9 tasks
- Phase 8 (US6 - Conversation Context): 12 tasks
- Phase 9 (US7 - Multi-Turn Creation): 10 tasks
- Phase 10 (Frontend & E2E): 10 tasks
- Phase 11 (Polish): 22 tasks

**By Priority**:
- P1 (MVP - US1-US3): 54 tasks (Setup + Foundational + US1-US3)
- P2 (Enhancements - US4-US6): 28 tasks
- P3 (Nice-to-Have - US7): 10 tasks
- Infrastructure (Frontend, E2E, Polish): 32 tasks

**Parallelizable Tasks**: 73 tasks marked [P] (59% can run in parallel within phases)

**Test Tasks**: 50 unit tests + 15 integration tests + 5 E2E tests = 70 test tasks (56% of total)

---

## Notes

- **[P] tasks**: Different files, no dependencies - can run in parallel
- **[Story] label**: Maps task to specific user story for traceability
- **Each user story is independently completable and testable**
- **Verify tests fail before implementing** (TDD approach)
- **Commit after each task or logical group**
- **Stop at any checkpoint to validate story independently**
- **MVP scope**: User Stories 1-3 (Add, List, Complete tasks)
- **Avoid**: Vague tasks, same file conflicts, cross-story dependencies that break independence
- **Constitution compliance**: All tasks follow Phase 3 constitution v1.1.0 (statelessness, MCP boundary, single endpoint, cloud-native)

---

**Status**: ✅ READY FOR IMPLEMENTATION
**Next Step**: Begin with Phase 1 (Setup) tasks T001-T008
**Validation Format**: All 124 tasks follow required checkbox format with ID, [P] marker where applicable, [Story] label for user story phases, and exact file paths
