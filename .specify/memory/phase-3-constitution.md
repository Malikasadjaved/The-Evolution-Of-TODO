<!--
Sync Impact Report:
- Version change: 1.0.0 → 1.1.0
- Updated: 2025-12-25
- Reason: MINOR version - Added cloud-native readiness for Phase 4 transition
- New sections:
  - XIV. Cloud-Native Architecture Requirements (12-factor app, health checks, graceful shutdown)
  - XV. Conversation History Management (token limits, truncation strategy)
  - XVI. Resilience & Error Handling (circuit breaker, timeouts, fallbacks)
  - XVII. Observable Operations (structured logging contract, PII protection)
- Rationale: Ensures Phase 3 implementation is Kubernetes-ready for seamless Phase 4 deployment
- Phase 4 dependencies: Health checks, config externalization, stateless guarantees
- Breaking changes: None - all additions are backward compatible
- Templates requiring updates:
  - ⚠ Update plan-template.md to include cloud-native requirements
  - ⚠ Update tasks-template.md to include health check and logging tasks
- Follow-up TODOs:
  - Implement health check endpoints (/health, /ready)
  - Add graceful shutdown handlers (SIGTERM, SIGINT)
  - Implement conversation history truncation
  - Add circuit breaker for OpenAI API calls
  - Implement structured JSON logging
-->

# Phase 3: Todo AI Chatbot Constitution v1.1.0

## Project Overview

**Objective:** Create an AI-powered chatbot interface for managing todos through natural language using MCP (Model Context Protocol) server architecture.

**Development Approach:** Agentic Dev Stack workflow using Claude Code and Spec-Kit Plus:
1. **Write Specification** → Define agent behaviors and MCP tool contracts
2. **Generate Plan** → Design stateless architecture and conversation flow
3. **Break into Tasks** → Create atomic, testable implementation tasks
4. **Implement via Claude Code** → NO manual coding - AI generates all code
5. **Review & Document** → Record prompts, iterations, and decisions

---

## Core Principles

### I. Foundational Principles (NON-NEGOTIABLE)

#### Principle 1: Agentic Development Supremacy

**NO human shall write production code directly.**

- All implementation flows through Claude Code exclusively
- Workflow sequence is sacred: Spec → Plan → Tasks → Implementation
- Every code artifact must be AI-generated with full provenance
- Human role: Architect, reviewer, prompt engineer - never implementer
- **Audit Trail Required:** Document every prompt, every iteration, every decision point

**Rationale:** This project validates agentic development methodology. Manual coding invalidates the experiment.

#### Principle 2: Radical Statelessness

**The server is a pure function: Request → Response. No memory between invocations.**

The Stateless Covenant:
```
∀ request: server_state_before = server_state_after = ∅
```

- FastAPI holds ZERO conversation context in RAM
- No session objects, no in-memory caches, no global state
- Process crash = zero data loss
- Load balancer can route request N to server A, request N+1 to server B
- Database is the single source of truth for all state

**What This Means In Practice:**
- ✅ Fetch conversation history from DB on every request
- ✅ Append new message to DB before processing
- ✅ Store agent response to DB before returning
- ✅ Server can restart mid-conversation without user impact
- ❌ No `conversation_cache = {}`
- ❌ No `@lru_cache` on conversation data
- ❌ No "active sessions" tracking

**Rationale:** Horizontal scalability, fault tolerance, and demonstrating modern cloud-native architecture. **Critical for Phase 4 Kubernetes deployment.**

#### Principle 3: MCP as the Universal Interface

**All AI-to-application interactions flow through MCP tools. No exceptions.**

- MCP Server is the sole interface between intelligence (agent) and state (database)
- Agent cannot touch database directly
- Agent cannot call FastAPI endpoints
- Agent cannot access file system
- Agent has ONE power: invoke MCP tools

Architecture Law:
```
Agent → MCP Tool → Database Operation → Response → Agent
```

**Rationale:** Standardized, auditable, replaceable AI integration. Agent vendors can change; MCP contract remains.

---

### II. Four-Layer Architecture

**The system MUST follow this strict four-layer separation:**

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: PRESENTATION (ChatKit UI)                         │
│  Responsibility: Render chat, capture user input            │
│  Tech: OpenAI ChatKit                                       │
│  Communication: HTTP POST to Layer 2                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: API GATEWAY (FastAPI Endpoint)                    │
│  Responsibility: Request orchestration, no business logic   │
│  Tech: Python FastAPI                                       │
│  Operations:                                                │
│    1. Authenticate user_id                                  │
│    2. Load conversation from DB                             │
│    3. Append user message to DB                             │
│    4. Invoke Layer 3                                        │
│    5. Store agent response to DB                            │
│    6. Return response                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: INTELLIGENCE (OpenAI Agent)                       │
│  Responsibility: Intent understanding, tool orchestration   │
│  Tech: OpenAI Agents SDK                                    │
│  Input: Full conversation history + new message             │
│  Output: Natural language response + tool invocations       │
│  Constraint: Can ONLY interact via Layer 4                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 4: TOOL EXECUTION (MCP Server)                       │
│  Responsibility: Task operations, data persistence          │
│  Tech: Official MCP SDK + SQLModel                          │
│  Tools: add_task, list_tasks, complete_task,                │
│         delete_task, update_task                            │
│  Constraint: Must be stateless, DB-backed                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 5: PERSISTENCE (Neon PostgreSQL)                     │
│  Tables: tasks, conversations, messages                     │
│  Responsibility: Single source of truth                     │
└─────────────────────────────────────────────────────────────┘
```

**Layer Boundary Rules:**
- Layer N can only call Layer N+1
- No skipping layers (Agent → Database is FORBIDDEN)
- Each layer is independently testable with mocks

**Rationale:** Clear separation of concerns enables independent testing, scalability, and maintainability.

---

### III. Database Schema Constitution

#### Table 1: tasks (from Phase 2 - Extended)

```sql
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,  -- Security boundary
    title VARCHAR(500) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_user_id (user_id),
    INDEX idx_user_completed (user_id, completed)
);
```

**Constraints:**
- Every task MUST have user_id (no orphaned tasks)
- Title cannot be empty
- Completed defaults to false
- Timestamps auto-managed

#### Table 2: conversations (NEW for Phase 3)

```sql
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_user_id (user_id)
);
```

**Purpose:** Track chat sessions, enable conversation resumption

#### Table 3: messages (NEW for Phase 3)

```sql
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL,
    user_id VARCHAR(255) NOT NULL,  -- Denormalized for security
    role VARCHAR(20) NOT NULL,      -- 'user' | 'assistant'
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    INDEX idx_conversation (conversation_id),
    INDEX idx_user_conversation (user_id, conversation_id)
);
```

**Constraints:**
- Role must be 'user' or 'assistant'
- Cascade delete when conversation deleted
- Ordering by created_at for history reconstruction

**Migration Strategy:**
- Use SQLModel `create_all()` for development
- For production, implement Alembic migrations
- Never drop columns - only add new ones

---

### IV. MCP Tools Specification

**Each tool does ONE thing well. Tools are atomic and idempotent where possible.**

#### Tool 1: add_task

**Purpose:** Create one new task

```python
def add_task(
    user_id: str,      # Required: Security boundary
    title: str,        # Required: What needs doing
    description: str = ""  # Optional: Additional context
) -> dict:
    """
    Returns:
        {
            "task_id": int,
            "status": "created",
            "title": str
        }
    """
```

**Behavior:**
- Insert new row in tasks table
- Auto-generate task_id
- Set completed=False, timestamps=now()
- Return confirmation with task_id

**Error Cases:**
- Empty title → `{"error": "Title cannot be empty"}`
- Database error → `{"error": "Failed to create task", "details": "..."}`

#### Tool 2: list_tasks

**Purpose:** Retrieve tasks with filtering

```python
def list_tasks(
    user_id: str,
    status: str = "all"  # "all" | "pending" | "completed"
) -> dict:
    """
    Returns:
        {
            "tasks": [
                {"id": 1, "title": "...", "completed": false, "created_at": "..."},
                ...
            ],
            "count": int,
            "filter": str
        }
    """
```

**Behavior:**
- Query tasks WHERE user_id = ? AND (completed filter)
- Order by created_at DESC (newest first)
- Return array of task objects

**Error Cases:**
- Invalid status → Default to "all"
- No tasks found → Return empty array (not an error)

#### Tool 3: complete_task

**Purpose:** Mark task as done

```python
def complete_task(
    user_id: str,
    task_id: int
) -> dict:
    """
    Returns:
        {
            "task_id": int,
            "status": "completed",
            "title": str
        }
    """
```

**Behavior:**
- UPDATE tasks SET completed=true, updated_at=now() WHERE id=? AND user_id=?
- Return confirmation with task title

**Error Cases:**
- Task not found → `{"error": "Task not found", "task_id": ...}`
- Already completed → Still return success (idempotent)

#### Tool 4: delete_task

**Purpose:** Remove task permanently

```python
def delete_task(
    user_id: str,
    task_id: int
) -> dict:
    """
    Returns:
        {
            "task_id": int,
            "status": "deleted",
            "title": str  # Title before deletion
        }
    """
```

**Behavior:**
- Fetch task title first (for confirmation message)
- DELETE FROM tasks WHERE id=? AND user_id=?
- Return confirmation with deleted title

**Error Cases:**
- Task not found → `{"error": "Task not found"}`

#### Tool 5: update_task

**Purpose:** Modify task details

```python
def update_task(
    user_id: str,
    task_id: int,
    title: str = None,        # Optional: new title
    description: str = None   # Optional: new description
) -> dict:
    """
    Returns:
        {
            "task_id": int,
            "status": "updated",
            "title": str  # New title
        }
    """
```

**Behavior:**
- Build UPDATE query with provided fields
- Update updated_at timestamp
- Return confirmation with new values

**Error Cases:**
- Task not found → `{"error": "Task not found"}`
- No fields provided → `{"error": "No fields to update"}`

**CRITICAL RULE:** MCP tools NEVER call each other. Agent orchestrates multi-tool workflows.

---

### V. Agent Behavior Constitution

**Agent Prime Directive: Understand intent, not keywords. Be helpful, be conversational, be accurate.**

#### Natural Language Understanding Mandates

- Agent must interpret intent, not match keywords
- Support conversational references ("the first one", "that task", "the meeting")
- Handle ambiguity by asking clarifying questions
- Maintain context through database-stored history, not memory

#### Tool Selection Logic

- Parse user intent to determine appropriate tool
- Chain multiple tools when necessary (list then delete, list then complete)
- Always confirm actions with friendly, specific responses
- Never expose technical details (task_ids are internal, use task names)

#### Error Handling Standards

- Task not found: Suggest listing tasks or provide task names
- Invalid operation: Explain why and suggest alternatives
- Database errors: Graceful degradation with retry suggestion
- Never crash - always respond with helpful message

#### Conversational Context Rules

**Problem:** User says "mark the first one as done" - what's "the first one"?

**Solution:** Agent reads conversation history from database

```python
# Previous messages in conversation:
# User: "Show my tasks"
# Assistant: "You have 3 tasks: 1) Buy groceries, 2) Call mom, 3) Pay bills"
# User: "Mark the first one as done"

# Agent resolves: "the first one" = task_id from previous list
```

**Implementation:**
- Agent receives full conversation history
- Agent extracts context from previous messages
- Agent resolves pronouns/references to concrete task_ids

---

### VI. Technology Stack Constraints (IMMUTABLE)

| Component | Technology | Version | Rationale |
|-----------|-----------|---------|-----------|
| **Frontend** | OpenAI ChatKit | Latest | Official, maintained, integrated |
| **Backend** | Python FastAPI | 0.104+ | Async, fast, OpenAPI auto-docs |
| **AI Framework** | OpenAI Agents SDK | Latest | Native OpenAI integration |
| **MCP** | Official MCP SDK | Latest | Standard protocol compliance |
| **ORM** | SQLModel | Latest | Pydantic + SQLAlchemy hybrid |
| **Database** | Neon Serverless PostgreSQL | Latest | Serverless, scalable, generous free tier |
| **Auth** | Better Auth | Latest | Modern, secure, easy integration |
| **Migrations** | Alembic | Latest | Industry standard for SQLAlchemy |

#### Forbidden Substitutions

- ❌ **Not** LangChain (too complex for this scope)
- ❌ **Not** React/Vue (ChatKit is the requirement)
- ❌ **Not** Flask/Django (FastAPI chosen for async)
- ❌ **Not** SQLite (must be production-ready)
- ❌ **Not** raw SQLAlchemy (SQLModel provides better typing)
- ❌ **Not** custom auth (security is non-trivial)

---

### VII. Single Endpoint Doctrine

**One Endpoint to Rule Them All:**
```
POST /api/chat/{user_id}
```

**Request Schema:**
```json
{
  "conversation_id": 123,  // Optional: omit to start new conversation
  "message": "Add a task to buy groceries"
}
```

**Response Schema:**
```json
{
  "conversation_id": 123,
  "response": "I've added 'Buy groceries' to your task list!",
  "tool_calls": [
    {
      "tool": "add_task",
      "parameters": {"user_id": "user123", "title": "Buy groceries"},
      "result": {"task_id": 42, "status": "created"}
    }
  ]
}
```

**Why Single Endpoint?:**
- Agent determines which operations to perform
- Natural language handles routing (not URL paths)
- Simplified client implementation
- Easier to version and maintain
- Reflects modern AI-first API design

**Forbidden Endpoints:**
- ❌ POST /api/tasks - That's what MCP tools are for
- ❌ GET /api/tasks/{id} - Agent uses list_tasks
- ❌ PUT /api/tasks/{id} - Agent uses update_task
- ❌ DELETE /api/tasks/{id} - Agent uses delete_task

**Exception:** Health check endpoints (GET /health, GET /ready) are permitted for infrastructure monitoring.

---

### VIII. Security & Privacy Rules

#### 1. User Isolation is Sacred

```python
# EVERY database query MUST filter by user_id
# ✅ Correct
tasks = session.query(Task).filter(
    Task.user_id == user_id,
    Task.id == task_id
).first()

# ❌ FORBIDDEN - Cross-user data leak
tasks = session.query(Task).filter(Task.id == task_id).first()
```

#### 2. Authentication Token Validation

```python
from fastapi import Depends, HTTPException
from better_auth import verify_token

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        user = verify_token(token)
        return user.id
    except InvalidTokenError:
        raise HTTPException(401, "Invalid authentication")

# Use in endpoint
@app.post("/api/chat/{user_id}")
async def chat(
    user_id: str,
    current_user: str = Depends(get_current_user)
):
    if user_id != current_user:
        raise HTTPException(403, "Cannot access other user's data")
```

#### 3. Input Validation

```python
from pydantic import BaseModel, Field, validator

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=5000)
    conversation_id: Optional[int] = None

    @validator('message')
    def sanitize_message(cls, v):
        # Remove null bytes, excessive whitespace
        return ' '.join(v.split())
```

#### 4. SQL Injection Prevention

- ✅ Always use SQLModel/SQLAlchemy ORM (parameterized queries)
- ❌ Never construct raw SQL with f-strings
- ✅ Use bound parameters for any dynamic queries

#### 5. Secrets Management

```python
# ✅ Correct - Environment variables
import os
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# ❌ FORBIDDEN - Hardcoded secrets
OPENAI_API_KEY = "sk-xxxxxxxxxxxxxxxx"
```

---

### IX. Testing Strategy

#### Test Pyramid

```
        ┌─────────────┐
        │  E2E Tests  │  ← Full conversation flows
        │     (5)     │
        └─────────────┘
       ┌───────────────┐
       │ Integration   │  ← API + Agent + MCP + DB
       │     (15)      │
       └───────────────┘
      ┌─────────────────┐
      │  Unit Tests     │  ← Individual functions
      │      (50)       │
      └─────────────────┘
```

#### Required Test Coverage

**Unit Tests (Backend):**
- Each MCP tool with success/error cases
- Database models (CRUD operations)
- Utility functions
- Minimum: 80% code coverage

**Integration Tests:**
- API endpoint with mock agent
- Agent with mock MCP server
- MCP server with test database
- Full request flow (API → Agent → MCP → DB)

**E2E Tests:**
- Complete conversation: create → list → complete → delete
- Context retention across messages
- Error recovery flows
- Multi-tool workflows

---

### X. Agentic Development Workflow

#### The Sacred Workflow

```
┌─────────────────────────────────────────────────────┐
│ Phase 1: SPECIFICATION                               │
│ ✓ Write complete specs for architecture             │
│ ✓ Define agent behaviors                            │
│ ✓ Document MCP tool contracts                       │
│ ✓ Design database schema                            │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ Phase 2: PLANNING (via Claude Code)                 │
│ ✓ Generate implementation plan                      │
│ ✓ Identify dependencies                             │
│ ✓ Sequence tasks                                    │
│ ✓ Estimate complexity                               │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ Phase 3: TASK BREAKDOWN (via Claude Code)           │
│ ✓ Decompose plan into atomic tasks                  │
│ ✓ Define acceptance criteria                        │
│ ✓ Identify test requirements                        │
│ ✓ Prioritize tasks                                  │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ Phase 4: IMPLEMENTATION (via Claude Code)           │
│ ✓ Execute each task via AI                          │
│ ✓ Generate code + tests                             │
│ ✓ Review and iterate                                │
│ ✓ Document decisions                                │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ Phase 5: REVIEW & DOCUMENTATION                      │
│ ✓ Document all prompts used                         │
│ ✓ Analyze iterations and failures                   │
│ ✓ Extract lessons learned                           │
│ ✓ Create prompt templates                           │
└─────────────────────────────────────────────────────┘
```

#### Documentation Requirements

Create `AGENTIC_DEV_LOG.md` to track:
- Session number, date, duration, goal
- Prompts used (verbatim)
- Issues encountered with root causes and solutions
- Lessons learned
- Code generated (file paths and line counts)
- Next steps

---

### XI. Monitoring & Observability

#### Logging Standards

**Structure:** Use structured logging (JSON format)

```python
import logging
import json

logger = logging.getLogger(__name__)

# ✅ Structured log
logger.info(json.dumps({
    "event": "mcp_tool_invoked",
    "tool": "add_task",
    "user_id": user_id[:8] + "***",  # Partially redacted
    "execution_time_ms": 45,
    "status": "success"
}))

# ❌ Unstructured log
logger.info(f"User {user_id} added task: {title}")  # Leaks PII
```

**Log Levels:**
- **DEBUG**: Function entry/exit, variable values (dev only)
- **INFO**: Successful operations, tool invocations
- **WARNING**: Recoverable errors, deprecated usage
- **ERROR**: Failures requiring attention
- **CRITICAL**: System-level failures

#### Metrics to Track

| Metric | Purpose | Alert Threshold |
|--------|---------|-----------------|
| **Request latency** | User experience | P95 > 2 seconds |
| **Error rate** | System health | >5% in 5 minutes |
| **Tool call distribution** | Usage patterns | N/A (informational) |
| **DB query time** | Performance bottleneck | P95 > 500ms |
| **Agent token usage** | Cost management | >10k tokens/request |
| **Conversation length** | Context window risk | >50 messages |

---

### XII. Deployment Requirements

#### OpenAI ChatKit Domain Configuration (CRITICAL)

**THIS STEP IS MANDATORY FOR PRODUCTION**

**Step-by-Step Domain Allowlist Process:**

1. **Deploy Frontend First**
   ```bash
   # Deploy to get production URL
   vercel --prod  # or: netlify deploy --prod
   # Result: https://todo-ai-chatbot.vercel.app
   ```

2. **Add Domain to OpenAI Allowlist**
   - Navigate to: https://platform.openai.com/settings/organization/security/domain-allowlist
   - Click "Add domain"
   - Enter: https://todo-ai-chatbot.vercel.app (no trailing slash)
   - Save and wait for approval (usually instant)

3. **Retrieve Domain Key**
   - After approval, OpenAI displays a domain-specific key
   - Copy this key (format: dk-xxxxxxxxxxxxx)

4. **Configure Frontend**
   ```bash
   # Add to Vercel environment variables
   vercel env add NEXT_PUBLIC_OPENAI_DOMAIN_KEY production
   # Paste the domain key when prompted
   ```

5. **Redeploy**
   ```bash
   vercel --prod
   ```

6. **Verify**
   - Visit your production URL
   - Open browser console
   - Check for ChatKit initialization success
   - Send test message

**Common Pitfalls:**
- ❌ Adding www. when your URL doesn't have it
- ❌ Adding trailing slash: https://example.com/ ← wrong
- ❌ Using http:// instead of https://
- ❌ Forgetting to redeploy after adding domain key

---

### XIII. Success Criteria & Acceptance Tests

#### Functional Requirements (All Must Pass)

1. **Task Creation**
   - [ ] User says "Add buy milk" → Task created
   - [ ] Task appears in subsequent list
   - [ ] Confirmation message includes task title
   - [ ] Empty title rejected gracefully

2. **Task Listing**
   - [ ] "Show my tasks" → All tasks displayed
   - [ ] "What's pending" → Only incomplete tasks
   - [ ] "What have I done" → Only completed tasks
   - [ ] Empty list handled gracefully

3. **Task Completion**
   - [ ] "Mark task 1 as done" → Task completed
   - [ ] "Done with groceries" → Correct task completed
   - [ ] Completed task no longer in pending list
   - [ ] Already completed task handled gracefully

4. **Task Deletion**
   - [ ] "Delete task 2" → Task removed
   - [ ] "Remove the meeting task" → Correct task deleted
   - [ ] Deleted task no longer in any list
   - [ ] Non-existent task handled gracefully

5. **Task Update**
   - [ ] "Change task 1 to 'Call mom tonight'" → Title updated
   - [ ] Updated title appears in list
   - [ ] Can update description separately

6. **Conversation Context**
   - [ ] User: "Show tasks" → Agent: "You have 3 tasks..."
   - [ ] User: "Complete the first one" → Agent resolves reference
   - [ ] Context maintained for 10+ message conversation

7. **Multi-User Isolation**
   - [ ] User A's tasks not visible to User B
   - [ ] User A cannot complete User B's tasks
   - [ ] Two users can operate simultaneously

8. **Stateless Resilience**
   - [ ] Server restart mid-conversation → Conversation resumes
   - [ ] No data loss on process kill
   - [ ] Load balancer can route to any server instance

#### Technical Requirements (All Must Pass)

1. **Architecture Compliance**
   - [ ] Zero server-side state in memory
   - [ ] All operations go through MCP tools
   - [ ] Single `/api/chat` endpoint only
   - [ ] Agent uses OpenAI Agents SDK
   - [ ] MCP uses Official MCP SDK

2. **Database Schema**
   - [ ] Tasks table with all required fields
   - [ ] Conversations table implemented
   - [ ] Messages table with proper FKs
   - [ ] Proper indexes for query performance

3. **Security**
   - [ ] All queries scoped by user_id
   - [ ] Authentication required on endpoints
   - [ ] No SQL injection vulnerabilities
   - [ ] Secrets in environment variables
   - [ ] Input validation on all user inputs

4. **Testing**
   - [ ] Unit tests for all MCP tools
   - [ ] Integration tests for API endpoint
   - [ ] E2E test for complete conversation flow
   - [ ] Test coverage >80%

5. **Documentation**
   - [ ] Architecture diagram in specs/
   - [ ] MCP tools specification complete
   - [ ] Agent behavior documented
   - [ ] Setup instructions tested on fresh machine
   - [ ] Agentic development log maintained

6. **Deployment**
   - [ ] Backend deploys to production
   - [ ] Frontend deploys to production
   - [ ] Domain added to OpenAI allowlist
   - [ ] Environment variables configured
   - [ ] Health checks passing

---

## NEW SECTIONS FOR v1.1.0 (Cloud-Native Readiness)

### XIV. Cloud-Native Architecture Requirements

**These requirements ensure seamless transition to Phase 4 (Kubernetes deployment).**

#### 12-Factor App Compliance

**1. Configuration Externalization**

All environment-specific configuration MUST be in environment variables, never hardcoded.

```python
# ✅ CORRECT
import os

DATABASE_URL = os.getenv("DATABASE_URL")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
AUTH_SECRET = os.getenv("AUTH_SECRET")
PORT = int(os.getenv("PORT", "8000"))
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# ❌ FORBIDDEN
DATABASE_URL = "postgresql://localhost:5432/todo"
OPENAI_API_KEY = "sk-xxxxxxxxxxxxxxxx"
```

**Required Environment Variables:**
- `DATABASE_URL` - Neon PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key
- `AUTH_SECRET` - Better Auth secret (min 32 chars)
- `PORT` - Server port (default: 8000)
- `ENVIRONMENT` - "development" | "production"
- `LOG_LEVEL` - "DEBUG" | "INFO" | "WARNING" | "ERROR"

**Rationale:** Enables deployment across environments (dev/staging/prod) without code changes. **Critical for Phase 4 Helm charts.**

---

**2. Health Check Endpoints (MANDATORY)**

Kubernetes requires health checks for pod lifecycle management. FastAPI MUST implement these endpoints.

```python
from fastapi import FastAPI, HTTPException
from sqlmodel import Session, select

app = FastAPI()

@app.get("/health")
async def health_check():
    """
    Liveness probe - is the application process running?

    Kubernetes uses this to restart pods that are frozen or crashed.
    Should be lightweight - no external dependencies.
    """
    return {"status": "healthy", "service": "todo-chatbot"}

@app.get("/ready")
async def readiness_check():
    """
    Readiness probe - is the application ready to handle traffic?

    Kubernetes uses this to decide when to route traffic to the pod.
    Should verify all critical dependencies are accessible.
    """
    checks = {
        "database": "unknown",
        "openai_api": "unknown"
    }

    # Check database connection
    try:
        with Session(engine) as session:
            session.exec(select(1))
        checks["database"] = "ok"
    except Exception as e:
        checks["database"] = f"error: {str(e)}"
        raise HTTPException(503, detail={"status": "not ready", "checks": checks})

    return {"status": "ready", "checks": checks}
```

**Health Check Requirements:**
- `/health` must respond in <500ms
- `/health` must not check external dependencies (DB, APIs)
- `/ready` must verify all critical dependencies
- `/ready` failure should return HTTP 503 (Service Unavailable)

**Rationale:** Without health checks, Kubernetes cannot manage pod lifecycle. **Phase 4 blocker if missing.**

---

**3. Graceful Shutdown**

When Kubernetes terminates a pod, it sends SIGTERM signal. Application must handle this gracefully.

```python
import signal
import sys
import logging
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)
active_requests = 0

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown.
    FastAPI 0.104+ recommended pattern.
    """
    # Startup
    logger.info("Application starting up...")
    signal.signal(signal.SIGTERM, handle_sigterm)
    signal.signal(signal.SIGINT, handle_sigint)

    yield

    # Shutdown
    logger.info("Application shutting down...")
    await graceful_shutdown()

def handle_sigterm(signum, frame):
    """Handle Kubernetes pod termination (SIGTERM)"""
    logger.warning("SIGTERM received - initiating graceful shutdown")
    sys.exit(0)

async def graceful_shutdown():
    """Gracefully shut down the application."""
    max_wait = 30
    waited = 0
    while active_requests > 0 and waited < max_wait:
        logger.info(f"Waiting for {active_requests} active requests...")
        await asyncio.sleep(1)
        waited += 1

    logger.info("Closing database connections...")
    engine.dispose()
    logger.info("Graceful shutdown complete")

app = FastAPI(lifespan=lifespan)
```

**Rationale:** Prevents data loss and request failures during pod termination. **Phase 4 requirement for zero-downtime deployments.**

---

**4. Port Binding & Network Configuration**

FastAPI must be accessible from outside the container.

```python
import os
import uvicorn

# ✅ CORRECT - Bind to 0.0.0.0 (all interfaces)
PORT = int(os.getenv("PORT", "8000"))

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",  # CRITICAL: Must be 0.0.0.0, not 127.0.0.1
        port=PORT,
        log_level=os.getenv("LOG_LEVEL", "info").lower()
    )
```

**Why 0.0.0.0 is Critical:**
- `127.0.0.1` (localhost) - Only accessible from inside container → Kubernetes probes fail
- `0.0.0.0` (all interfaces) - Accessible from Kubernetes network → Works correctly

**Rationale:** Without 0.0.0.0 binding, Kubernetes cannot reach the application. **Phase 4 blocker.**

---

### XV. Conversation History Management

**Token Budget (HARD LIMITS):**

OpenAI models have context window limits. Without proper management, long conversations will exceed limits and crash.

```python
class ConversationManager:
    """Manages conversation history with token budget awareness"""

    # Token budget allocation
    MAX_CONTEXT_TOKENS = 8000      # Reserve for conversation history
    SYSTEM_PROMPT_TOKENS = 2000    # Reserve for system prompt
    RESPONSE_TOKENS = 2000          # Reserve for agent response

    # Approximation: 1 token ≈ 4 characters
    CHARS_PER_TOKEN = 4
    MAX_CONTEXT_CHARS = MAX_CONTEXT_TOKENS * CHARS_PER_TOKEN  # 32,000 chars

    # Message limits
    MAX_MESSAGES = 50                    # Absolute maximum messages to load
    RECENT_MESSAGES_ALWAYS_INCLUDE = 10  # Always keep last 10 messages
```

**Truncation Strategy:**

```python
@staticmethod
async def load_conversation_history(
    db: Session,
    conversation_id: int,
    user_id: str
) -> List[Dict[str, str]]:
    """
    Load conversation history with intelligent truncation.

    Strategy:
    1. Load last 50 messages (prevents unbounded queries)
    2. Calculate total character count
    3. If > 32,000 chars, compress older messages
    4. Always keep last 10 messages intact
    """
    messages = db.exec(
        select(Message)
        .where(
            Message.conversation_id == conversation_id,
            Message.user_id == user_id
        )
        .order_by(Message.created_at.asc())
        .limit(ConversationManager.MAX_MESSAGES)
    ).all()

    if not messages:
        return []

    history = [
        {"role": msg.role, "content": msg.content}
        for msg in messages
    ]

    total_chars = sum(len(msg["content"]) for msg in history)

    if total_chars <= ConversationManager.MAX_CONTEXT_CHARS:
        return history

    return ConversationManager._compress_history(history)

@staticmethod
def _compress_history(history: List[Dict]) -> List[Dict]:
    """Compress history by summarizing old messages."""
    if len(history) <= ConversationManager.RECENT_MESSAGES_ALWAYS_INCLUDE:
        return history

    old_messages = history[:-ConversationManager.RECENT_MESSAGES_ALWAYS_INCLUDE]
    recent_messages = history[-ConversationManager.RECENT_MESSAGES_ALWAYS_INCLUDE:]

    # Extract key actions
    task_actions = []
    for msg in old_messages:
        content_lower = msg["content"].lower()
        if "added" in content_lower:
            task_actions.append("created tasks")
        elif "completed" in content_lower:
            task_actions.append("completed tasks")
        elif "deleted" in content_lower:
            task_actions.append("deleted tasks")

    action_summary = ", ".join(set(task_actions)) if task_actions else "managed tasks"
    summary = {
        "role": "system",
        "content": f"[Earlier: User {action_summary}. {len(old_messages)} messages summarized.]"
    }

    return [summary] + recent_messages
```

**Rationale:** Without history management, long conversations will crash with "context length exceeded" errors. **Runtime blocker.**

---

### XVI. Resilience & Error Handling

**Circuit Breaker Pattern (RECOMMENDED)**

Protect against cascading failures when OpenAI API is down or slow.

```python
from enum import Enum
from datetime import datetime, timedelta

class CircuitState(Enum):
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Failing, reject fast
    HALF_OPEN = "half_open"  # Testing recovery

class CircuitBreaker:
    """Circuit breaker for OpenAI API calls."""

    def __init__(
        self,
        failure_threshold: int = 3,
        recovery_timeout: int = 60,
        timeout_seconds: int = 30
    ):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.timeout = timeout_seconds

        self.failure_count = 0
        self.last_failure_time = None
        self.state = CircuitState.CLOSED

    async def call(self, func, *args, **kwargs):
        """Execute function with circuit breaker protection."""
        if self.state == CircuitState.OPEN:
            if self._should_attempt_recovery():
                self.state = CircuitState.HALF_OPEN
            else:
                raise CircuitBreakerOpenError("Circuit breaker OPEN")

        try:
            result = await asyncio.wait_for(
                func(*args, **kwargs),
                timeout=self.timeout
            )

            if self.state == CircuitState.HALF_OPEN:
                self._record_success()

            return result

        except Exception as e:
            self._record_failure()
            raise

    def _record_failure(self):
        """Record failure and potentially open circuit"""
        self.failure_count += 1
        self.last_failure_time = datetime.utcnow()

        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN

    def _record_success(self):
        """Record success and close circuit"""
        self.failure_count = 0
        self.state = CircuitState.CLOSED

    def _should_attempt_recovery(self) -> bool:
        """Check if enough time passed to try recovery"""
        if not self.last_failure_time:
            return True

        time_since_failure = datetime.utcnow() - self.last_failure_time
        return time_since_failure.total_seconds() > self.recovery_timeout

class CircuitBreakerOpenError(Exception):
    """Raised when circuit breaker is open"""
    pass
```

**Rationale:** Without resilience patterns, system becomes brittle. Circuit breaker provides **graceful degradation.**

---

### XVII. Observable Operations (Structured Logging)

**All logs MUST be structured JSON for Kubernetes log aggregation.**

```python
import logging
import json
from datetime import datetime

class StructuredLogger:
    """Structured JSON logger for Kubernetes environments."""

    def __init__(self, name: str):
        self.logger = logging.getLogger(name)

    def _log(self, level: str, event: str, **kwargs):
        """Internal method to create structured log entry"""
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": level,
            "event": event,
            **kwargs
        }

        log_entry = {k: v for k, v in log_entry.items() if v is not None}
        log_message = json.dumps(log_entry)

        if level == "INFO":
            self.logger.info(log_message)
        elif level == "ERROR":
            self.logger.error(log_message)
        # ... other levels

    def info(self, event: str, **kwargs):
        """Log INFO level event"""
        self._log("INFO", event, **kwargs)

# Usage
logger = StructuredLogger(__name__)
logger.info(
    "mcp_tool_call",
    tool="add_task",
    user_id_hash=user_id[:8] + "***",
    execution_ms=45,
    success=True
)
```

**PII Protection Rules:**

```python
def hash_user_id(user_id: str) -> str:
    """Hash user_id for logging - show first 8 chars only"""
    if len(user_id) <= 8:
        return user_id + "***"
    return user_id[:8] + "***"

# ✅ SAFE to log
logger.info("task_created", user_id_hash=hash_user_id(user_id), task_id=42)

# ❌ NEVER log these
# logger.info("task_created", task_title=title)  # User content
# logger.info("task_created", message=message)   # User message
```

**Rationale:** Structured JSON logs enable powerful filtering, alerting, and debugging. **Critical for Phase 4/5 operations.**

---

## Governance

### Amendment Procedure

Amendments require:
1. Clear rationale and impact analysis
2. User approval
3. Version bump following semantic versioning:
   - MAJOR: Breaking changes to architecture or principles
   - MINOR: New section added or significant expansion
   - PATCH: Clarifications, typo fixes, non-semantic changes
4. Update to dependent templates (spec, plan, tasks)
5. Amendment history tracked in Sync Impact Report

### Compliance

- All PRs and code reviews MUST verify compliance with constitution principles
- Deviations MUST be explicitly justified and documented in ADR
- Use `.specify/memory/phase-3-constitution.md` as authoritative source
- Agentic development is NON-NEGOTIABLE - zero manual coding

### Versioning & Dates

**Version:** 1.1.0 | **Ratified:** 2025-12-25 | **Last Amended:** 2025-12-25

**v1.1.0 Changes:**
- Added Section XIV: Cloud-Native Architecture Requirements
- Added Section XV: Conversation History Management
- Added Section XVI: Resilience & Error Handling
- Added Section XVII: Observable Operations

---

## Quick Reference Card

### Core Principles (Remember These)

1. ✅ **Stateless**: Server forgets everything after request
2. ✅ **MCP Only**: Agent → MCP tools → Database (no shortcuts)
3. ✅ **Single Endpoint**: One /api/chat for all operations
4. ✅ **DB is Truth**: All state in PostgreSQL
5. ✅ **Agentic Dev**: Zero manual coding
6. ✅ **Cloud-Native**: 12-factor app, health checks, graceful shutdown (NEW in v1.1.0)
7. ✅ **Token Budget**: MAX_CONTEXT_TOKENS = 8,000 (NEW in v1.1.0)
8. ✅ **Resilient**: Circuit breaker for API failures (NEW in v1.1.0)
9. ✅ **Observable**: Structured JSON logging (NEW in v1.1.0)

### Quick Checks

- "Can I store this in memory?" → **NO** (database only)
- "Should agent access DB directly?" → **NO** (use MCP tool)
- "Can I add a REST endpoint for tasks?" → **NO** (agent handles routing)
- "Can I manually write this function?" → **NO** (Claude Code generates)
- "Does my query filter by user_id?" → **MUST** (security boundary)
- "Does my app bind to 0.0.0.0?" → **MUST** (Kubernetes requirement) [NEW]
- "Do I have /health and /ready endpoints?" → **MUST** (Kubernetes probes) [NEW]
- "Is conversation history truncated?" → **MUST** (token limit) [NEW]
- "Do I log to stdout as JSON?" → **MUST** (Kubernetes logging) [NEW]

### Forbidden Practices (The "Never" List)

1. ❌ **Never** store state in module-level variables
2. ❌ **Never** bypass MCP tools for direct DB access from agent
3. ❌ **Never** use `pickle` for serialization (security risk)
4. ❌ **Never** log sensitive data (API keys, user messages, passwords)
5. ❌ **Never** use `eval()` or `exec()` on user input
6. ❌ **Never** commit `.env` files to git
7. ❌ **Never** return raw exceptions to users
8. ❌ **Never** skip input validation
9. ❌ **Never** manually write production code (violates agentic dev principle)
10. ❌ **Never** cache conversation state in memory (defeats stateless design)
11. ❌ **Never** bind to 127.0.0.1 (use 0.0.0.0 for containers) [NEW]
12. ❌ **Never** write logs to files (use stdout for Kubernetes) [NEW]
13. ❌ **Never** hardcode configuration (use environment variables) [NEW]
14. ❌ **Never** load unlimited conversation history (respect token limits) [NEW]

---

**End of Phase 3 Constitution v1.1.0**

This constitution is comprehensive, production-ready, and cloud-native. It serves as:
1. **A design document** for implementation
2. **A compliance checklist** for review
3. **A teaching resource** for agentic development methodology
4. **A Phase 4 preparation guide** for Kubernetes deployment

Use it wisely. Build with discipline. Ship with confidence.
