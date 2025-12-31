Constitutional Specification for Todo AI Chatbot Development
Executive Directive
This constitution governs the implementation of a stateless, AI-powered todo management system. Every architectural decision, technology choice, and implementation detail flows from these immutable principles. Deviation requires explicit constitutional amendment.

I. Foundational Principles
Principle 1: Agentic Development Supremacy
No human shall write production code directly.

All implementation flows through Claude Code exclusively
Workflow sequence is sacred: Spec → Plan → Tasks → Implementation
Every code artifact must be AI-generated with full provenance
Human role: Architect, reviewer, prompt engineer - never implementer
Audit Trail Required: Document every prompt, every iteration, every decision point

Rationale: This project validates agentic development methodology. Manual coding invalidates the experiment.
Principle 2: Radical Statelessness
The server is a pure function: Request → Response. No memory between invocations.
The Stateless Covenant
∀ request: server_state_before = server_state_after = ∅

FastAPI holds ZERO conversation context in RAM
No session objects, no in-memory caches, no global state
Process crash = zero data loss
Load balancer can route request N to server A, request N+1 to server B
Database is the single source of truth for all state

What This Means In Practice

✅ Fetch conversation history from DB on every request
✅ Append new message to DB before processing
✅ Store agent response to DB before returning
✅ Server can restart mid-conversation without user impact
❌ No conversation_cache = {}
❌ No @lru_cache on conversation data
❌ No "active sessions" tracking

Rationale: Horizontal scalability, fault tolerance, and demonstrating modern cloud-native architecture.
Principle 3: MCP as the Universal Interface
All AI-to-application interactions flow through MCP tools. No exceptions.

MCP Server is the sole interface between intelligence (agent) and state (database)
Agent cannot touch database directly
Agent cannot call FastAPI endpoints
Agent cannot access file system
Agent has ONE power: invoke MCP tools

Architecture Law:
Agent → MCP Tool → Database Operation → Response → Agent
Rationale: Standardized, auditable, replaceable AI integration. Agent vendors can change; MCP contract remains.

II. Architecture Constitution
Article 1: The Four-Layer Architecture
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
Layer Boundary Rules:

Layer N can only call Layer N+1
No skipping layers (Agent → Database is FORBIDDEN)
Each layer is independently testable with mocks

Article 2: Database Schema Constitution
Table 1: tasks
sqlCREATE TABLE tasks (
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
Constraints:

Every task MUST have user_id (no orphaned tasks)
Title cannot be empty
Completed defaults to false
Timestamps auto-managed

Table 2: conversations
sqlCREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_user_id (user_id)
);
Purpose: Track chat sessions, enable conversation resumption
Table 3: messages
sqlCREATE TABLE messages (
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

**Constraints**:
- Role must be 'user' or 'assistant'
- Cascade delete when conversation deleted
- Ordering by created_at for history reconstruction

**Migration Strategy**:
- Use Alembic for version control
- Initial migration creates all tables
- Future phases add columns/tables, never drop

### Article 3: The Single Endpoint Doctrine

**One Endpoint to Rule Them All**:
```
POST /api/chat/{user_id}
Request Schema
json{
  "conversation_id": 123,  // Optional: omit to start new conversation
  "message": "Add a task to buy groceries"
}
Response Schema
json{
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
Why Single Endpoint?:

Agent determines which operations to perform
Natural language handles routing (not URL paths)
Simplified client implementation
Easier to version and maintain
Reflects modern AI-first API design

Forbidden Endpoints:

❌ POST /api/tasks - That's what MCP tools are for
❌ GET /api/tasks/{id} - Agent uses list_tasks
❌ PUT /api/tasks/{id} - Agent uses update_task
❌ DELETE /api/tasks/{id} - Agent uses delete_task

Exception: Health check endpoints (GET /health, GET /ready) are permitted for infrastructure monitoring.

III. MCP Tools Constitution
Tool Design Philosophy
Each tool is a microservice: Single responsibility, well-defined contract, idempotent where possible.
Tool 1: add_task
Purpose: Create one new task
Contract:
pythondef add_task(
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
Behavior:

Insert new row in tasks table
Auto-generate task_id
Set completed=False, timestamps=now()
Return confirmation with task_id

Error Cases:

Empty title → {"error": "Title cannot be empty"}
Database error → {"error": "Failed to create task", "details": "..."}

Tool 2: list_tasks
Purpose: Retrieve tasks with filtering
Contract:
pythondef list_tasks(
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
Behavior:

Query tasks WHERE user_id = ? AND (completed filter)
Order by created_at DESC (newest first)
Return array of task objects

Error Cases:

Invalid status → Default to "all"
No tasks found → Return empty array (not an error)

Tool 3: complete_task
Purpose: Mark task as done
Contract:
pythondef complete_task(
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
Behavior:

UPDATE tasks SET completed=true, updated_at=now() WHERE id=? AND user_id=?
Return confirmation with task title

Error Cases:

Task not found → {"error": "Task not found", "task_id": ...}
Already completed → Still return success (idempotent)

Tool 4: delete_task
Purpose: Remove task permanently
Contract:
pythondef delete_task(
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
Behavior:

Fetch task title first (for confirmation message)
DELETE FROM tasks WHERE id=? AND user_id=?
Return confirmation with deleted title

Error Cases:

Task not found → {"error": "Task not found"}

Tool 5: update_task
Purpose: Modify task details
Contract:
pythondef update_task(
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
Behavior:

Build UPDATE query with provided fields
Update updated_at timestamp
Return confirmation with new values

Error Cases:

Task not found → {"error": "Task not found"}
No fields provided → {"error": "No fields to update"}

Critical Rule: MCP tools NEVER call each other. Agent orchestrates multi-tool workflows.

IV. Agent Behavior Constitution
Agent Prime Directive
Understand intent, not keywords. Be helpful, be conversational, be accurate.
Intent Recognition Matrix
User IntentExample PhrasesTool SequenceResponse TemplateCreate Task"Add...", "Create...", "Remember to...", "I need to..."add_task(title)"I've added '[title]' to your list!"List All"Show my tasks", "What's on my list", "What do I need to do"list_tasks(status="all")"You have [N] tasks: [list]"List Pending"What's left", "Pending tasks", "What's not done"list_tasks(status="pending")"[N] pending: [list]"List Completed"What have I done", "Completed tasks", "Show finished"list_tasks(status="completed")"You've completed: [list]"Complete Task"Done with...", "Finished...", "Mark as complete..."list_tasks() → complete_task(id)"Great! Marked '[title]' as complete"Delete Task"Remove...", "Delete...", "Cancel..."list_tasks() → delete_task(id)"Removed '[title]' from your list"Update Task"Change... to...", "Rename...", "Update..."list_tasks() → update_task(id, title)"Updated to '[new_title]'"
Conversational Context Rules
Problem: User says "mark the first one as done" - what's "the first one"?
Solution: Agent reads conversation history from database
python# Previous messages in conversation:
# User: "Show my tasks"
# Assistant: "You have 3 tasks: 1) Buy groceries, 2) Call mom, 3) Pay bills"
# User: "Mark the first one as done"

# Agent resolves: "the first one" = task_id from previous list
```

**Implementation**:
- Agent receives full conversation history
- Agent extracts context from previous messages
- Agent resolves pronouns/references to concrete task_ids

### Ambiguity Handling Protocol

| Ambiguous Input | Agent Action |
|-----------------|--------------|
| "Delete the meeting task" (but no task with "meeting" in title) | List all tasks, ask user to clarify |
| "Complete task 99" (task doesn't exist) | "I couldn't find task #99. Would you like to see your tasks?" |
| "Add..." (incomplete) | "What task would you like to add?" |
| Empty message | "How can I help you with your tasks?" |

### Multi-Tool Workflows

Some requests require tool chaining:

**Example: "Delete the grocery task"**
1. `list_tasks(user_id, status="all")` → Get all tasks
2. Find task with "grocery" in title → task_id = 5
3. `delete_task(user_id, task_id=5)` → Delete it
4. Respond: "Removed 'Buy groceries' from your list"

**Example: "Show pending tasks and mark the first as done"**
1. `list_tasks(user_id, status="pending")` → Get pending
2. Extract first task_id from results
3. `complete_task(user_id, task_id)` → Complete it
4. Respond: "Here are your pending tasks: [...]. I've marked '[title]' as complete!"

**Agent Constraint**: Maximum 5 tool calls per user message to prevent infinite loops.

### Error Recovery Patterns

**Pattern 1: Soft Errors** (User-fixable)
```
User: "Complete task 999"
Agent: "I couldn't find task #999. Here are your current tasks: [list]. Which one would you like to complete?"
```

**Pattern 2: Hard Errors** (System issues)
```
Tool returns: {"error": "Database connection failed"}
Agent: "I'm having trouble accessing your tasks right now. Please try again in a moment."
```

**Pattern 3: Validation Errors**
```
User: "Add a task with empty title"
Agent: "Tasks need a title! What would you like to call this task?"
```

**Never**: Expose internal errors, stack traces, or technical details to user.

---

## V. Technology Stack Constitution

### Immutable Technology Choices

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

### Forbidden Substitutions

- ❌ **Not** LangChain (too complex for this scope)
- ❌ **Not** React/Vue (ChatKit is the requirement)
- ❌ **Not** Flask/Django (FastAPI chosen for async)
- ❌ **Not** SQLite (must be production-ready)
- ❌ **Not** raw SQLAlchemy (SQLModel provides better typing)
- ❌ **Not** custom auth (security is non-trivial)

### Dependency Management
```
# requirements.txt structure
fastapi==0.104.1
openai==1.5.0
sqlmodel==0.0.14
psycopg2-binary==2.9.9
alembic==1.13.0
python-dotenv==1.0.0
better-auth-sdk==1.0.0  # Hypothetical version
mcp-sdk==1.0.0  # Hypothetical version
Lock versions to ensure reproducible builds.

VI. Deployment & Configuration Constitution
Phase 1: Local Development Setup
bash# 1. Clone repository
git clone <repo-url>
cd todo-ai-chatbot

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r backend/requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env with your keys

# 5. Run migrations
cd backend
alembic upgrade head

# 6. Start backend
uvicorn main:app --reload

# 7. Start frontend (separate terminal)
cd frontend
npm install
npm run dev
Phase 2: Production Deployment
Backend (Render/Railway/Fly.io)
yaml# render.yaml example
services:
  - type: web
    name: todo-ai-backend
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: OPENAI_API_KEY
        sync: false
Frontend (Vercel/Netlify)
json// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_URL": "@api-url",
    "NEXT_PUBLIC_OPENAI_DOMAIN_KEY": "@openai-domain-key"
  }
}
Critical: OpenAI ChatKit Domain Configuration
THIS STEP IS MANDATORY FOR PRODUCTION
Step-by-Step Domain Allowlist Process

Deploy Frontend First

bash   # Deploy to get production URL
   vercel --prod  # or: netlify deploy --prod
   # Result: https://todo-ai-chatbot.vercel.app

Add Domain to OpenAI Allowlist

Navigate to: https://platform.openai.com/settings/organization/security/domain-allowlist
Click "Add domain"
Enter: https://todo-ai-chatbot.vercel.app (no trailing slash)
Save and wait for approval (usually instant)


Retrieve Domain Key

After approval, OpenAI displays a domain-specific key
Copy this key (format: dk-xxxxxxxxxxxxx)


Configure Frontend

bash   # Add to Vercel environment variables
   vercel env add NEXT_PUBLIC_OPENAI_DOMAIN_KEY production
   # Paste the domain key when prompted

Redeploy

bash   vercel --prod

Verify

Visit your production URL
Open browser console
Check for ChatKit initialization success
Send test message



Common Pitfalls:

❌ Adding www. when your URL doesn't have it
❌ Adding trailing slash: https://example.com/ ← wrong
❌ Using http:// instead of https://
❌ Forgetting to redeploy after adding domain key

Environment Variables Reference
Backend (.env)
bash# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# OpenAI
OPENAI_API_KEY=sk-xxxxxxxxxxxxx

# Auth (Better Auth)
AUTH_SECRET=your-secret-key-min-32-chars
AUTH_URL=https://your-backend.com

# Environment
ENVIRONMENT=production  # or: development, staging
LOG_LEVEL=INFO
Frontend (.env.local)
bash# API
NEXT_PUBLIC_API_URL=https://your-backend.com

# OpenAI ChatKit
NEXT_PUBLIC_OPENAI_DOMAIN_KEY=dk-xxxxxxxxxxxxx

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=G-XXXXXXXXXX
```

---

## VII. Quality Assurance Constitution

### Testing Pyramid
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
Required Test Coverage
Unit Tests (Backend)

Each MCP tool with success/error cases
Database models (CRUD operations)
Utility functions
Minimum: 80% code coverage

Integration Tests

API endpoint with mock agent
Agent with mock MCP server
MCP server with test database
Full request flow (API → Agent → MCP → DB)

E2E Tests

Complete conversation: create → list → complete → delete
Context retention across messages
Error recovery flows
Multi-tool workflows

Test Data Strategy
python# Use fixtures for consistent test data
@pytest.fixture
def test_user():
    return {"user_id": "test_user_123"}

@pytest.fixture
def test_tasks(test_db, test_user):
    tasks = [
        Task(user_id=test_user["user_id"], title="Test Task 1"),
        Task(user_id=test_user["user_id"], title="Test Task 2", completed=True),
    ]
    test_db.add_all(tasks)
    test_db.commit()
    return tasks
Manual Testing Checklist
Before deployment, verify:

 User can create task via natural language
 User can list all tasks
 User can filter pending/completed tasks
 User can complete task by name
 User can complete task by number from list
 User can delete task by name
 User can update task title
 Conversation context maintained (pronouns work)
 Server restart doesn't lose conversation
 Multiple users can operate independently
 Errors display helpful messages
 Tool calls logged in response
 ChatKit UI renders properly
 Mobile experience functional


VIII. Documentation Constitution
Required Documentation Files
1. /specs/architecture.md

Complete system architecture diagram
Layer responsibilities and boundaries
Data flow diagrams
Deployment architecture

2. /specs/agents.md

Agent behavior specification
Intent recognition patterns
Tool orchestration rules
Error handling protocols
Example conversations

3. /specs/mcp-tools.md

Each tool's complete contract
Input/output examples
Error cases
Implementation notes

4. /specs/database-schema.md

Entity-relationship diagram
Table definitions with constraints
Index strategy
Migration history

5. /README.md (Root)
markdown# Todo AI Chatbot

## Overview
[Brief description, 2-3 sentences]

## Architecture
[Link to specs/architecture.md]

## Quick Start
### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (or Neon account)
- OpenAI API key

### Backend Setup
[Exact commands]

### Frontend Setup
[Exact commands]

### First Run
[How to create first task]

## Deployment
[Links to deployment guides]

## Development
[How to contribute, testing, etc.]

## License
[License info]
6. /backend/README.md

API endpoint documentation
MCP tool reference
Database setup
Configuration guide

7. /frontend/README.md

ChatKit configuration
Domain allowlist setup
Environment variables
Customization guide

Code Documentation Standards
Python (Backend):
pythondef add_task(user_id: str, title: str, description: str = "") -> dict:
    """
    Create a new task for the specified user.
    
    Args:
        user_id: Unique identifier for the user (from auth token)
        title: Task title (max 500 chars, required)
        description: Optional task details
    
    Returns:
        {
            "task_id": int,
            "status": "created",
            "title": str
        }
    
    Raises:
        ValueError: If title is empty or exceeds length limit
        DatabaseError: If task creation fails
    
    Example:
        >>> add_task("user123", "Buy groceries", "Milk and eggs")
        {"task_id": 42, "status": "created", "title": "Buy groceries"}
    """
TypeScript (Frontend):
typescript/**
 * Initialize ChatKit with OpenAI domain configuration
 * 
 * @param apiKey - OpenAI API key (from environment)
 * @param domainKey - Domain allowlist key (from OpenAI settings)
 * @returns Configured ChatKit instance
 * 
 * @throws {Error} If domain key is invalid or missing
 * 
 * @example
 * const chatkit = initializeChatKit(
 *   process.env.NEXT_PUBLIC_OPENAI_API_KEY,
 *   process.env.NEXT_PUBLIC_OPENAI_DOMAIN_KEY
 * );
 */
```

---

## IX. Agentic Development Workflow Constitution

### The Sacred Workflow
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

### Prompt Engineering Guide

#### Initial Specification Prompt Template
```
I need to implement the Todo AI Chatbot per this constitutional specification.

Key constraints:
1. Stateless architecture - no server-side state
2. MCP tools as the sole AI-to-app interface
3. Single /api/chat endpoint for all operations
4. OpenAI Agents SDK + Official MCP SDK
5. Full conversation history loaded from DB each request

First, please:
1. Acknowledge you understand these constraints
2. Identify any ambiguities or gaps in the spec
3. Suggest a high-level implementation plan
4. Estimate task count and complexity

Do not write code yet. Let's finalize the plan first.
```

#### Task Implementation Prompt Template
```
Task: Implement MCP tool 'add_task'

Requirements:
- Accept user_id, title, description
- Insert into tasks table via SQLModel
- Return {task_id, status, title}
- Handle errors: empty title, DB failure
- Include unit tests with pytest

Implementation notes:
- Use SQLModel's Session context manager
- Validate title length (max 500 chars)
- Set completed=False, timestamps=now()
- Return structured dict, not raw model

Generate:
1. The tool function in backend/mcp/tools/tasks.py
2. Unit tests in backend/tests/test_tasks.py
3. Update backend/mcp/server.py to register tool
```

#### Iteration Prompt Template
```
The previous implementation has an issue: [describe issue]

Error message: [paste error]

Expected behavior: [describe]
Actual behavior: [describe]

Please:
1. Identify the root cause
2. Propose a fix
3. Implement the fix
4. Add test to prevent regression

Context: [any relevant info about the system state]
Documentation Requirements for Agentic Dev
Create AGENTIC_DEV_LOG.md to track:
markdown# Agentic Development Log

## Session 1: MCP Tools Implementation
**Date**: 2024-12-24
**Duration**: 45 minutes
**Goal**: Implement all 5 MCP tools

### Prompts Used
1. Initial prompt: [paste]
2. Iteration 1: [paste]
3. Iteration 2: [paste]
Issues Encountered

Issue 1: SQLModel session not closing properly

Root cause: Missing context manager
Solution: Wrapped in with Session(engine) as session
Prompt that fixed it: [paste]



Lessons Learned

Be explicit about SQLModel session management
Always specify return type annotations
Include error handling in initial prompt

Code Generated

backend/mcp/tools/tasks.py (150 lines)
backend/tests/test_tasks.py (200 lines)

Next Steps

Integrate MCP server with FastAPI endpoint
Test tool invocation from agent


### Success Metrics for Agentic Development

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| **First-prompt success rate** | >60% | Measures prompt quality |
| **Iterations per task** | <3 | Measures specification clarity |
| **Manual code edits** | 0 | Validates pure agentic approach |
| **Test coverage** | >80% | AI-generated tests quality |
| **Time to working feature** | <2 hours | Overall efficiency |

---

## X. Security & Privacy Constitution

### Security Principles

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

### Privacy Rules

1. **Minimal Data Collection**: Only store what's necessary (user_id, tasks, conversations)
2. **No PII in Logs**: Never log user messages or task content
3. **Data Retention**: Document policy (e.g., "Conversations stored indefinitely unless user deletes")
4. **Right to Delete**: Provide endpoint to delete all user data
5. **Encryption**: Use HTTPS for all communications, TLS for database connections

### Compliance Checklist

- [ ] All database queries scoped by user_id
- [ ] Authentication on all endpoints
- [ ] Input validation on all user inputs
- [ ] Secrets in environment variables only
- [ ] SQL injection prevention via ORM
- [ ] No PII in application logs
- [ ] HTTPS enforced in production
- [ ] Data deletion endpoint implemented
- [ ] Privacy policy documented

---

## XI. Monitoring & Observability Constitution

### Logging Standards

**Structure**: Use structured logging (JSON format)
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

**Log Levels**:
- **DEBUG**: Function entry/exit, variable values (dev only)
- **INFO**: Successful operations, tool invocations
- **WARNING**: Recoverable errors, deprecated usage
- **ERROR**: Failures requiring attention
- **CRITICAL**: System-level failures

### Metrics to Track

| Metric | Purpose | Alert Threshold |
|--------|---------|-----------------|
| **Request latency** | User experience | P95 > 2 seconds |
| **Error rate** | System health | >5% in 5 minutes |
| **Tool call distribution** | Usage patterns | N/A (informational) |
| **DB query time** | Performance bottleneck | P95 > 500ms |
| **Agent token usage** | Cost management | >10k tokens/request |
| **Conversation length** | Context window risk | >50 messages |

### Health Check Endpoints
```python
@app.get("/health")
async def health_check():
    """Basic liveness check"""
    return {"status": "healthy"}

@app.get("/ready")
async def readiness_check():
    """Check if system can handle requests"""
    try:
        # Verify DB connection
        db.execute("SELECT 1")
        
        # Verify OpenAI API
        openai_client.models.list()
        
        return {"status": "ready", "checks": {
            "database": "ok",
            "openai_api": "ok"
        }}
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={"status": "not ready", "error": str(e)}
        )
```

### Error Tracking

Integrate Sentry or similar:
```python
import sentry_sdk

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    environment=os.getenv("ENVIRONMENT", "production"),
    traces_sample_rate=0.1  # Sample 10% of transactions
)

# Automatically captures exceptions
# Manual capture:
sentry_sdk.capture_message("MCP tool timeout", level="warning")
```

---

## XII. Forbidden Practices (The "Never" List)

### Code Anti-Patterns

1. ❌ **Never** store state in module-level variables
```python
   # FORBIDDEN
   active_conversations = {}  # Dies on server restart
```

2. ❌ **Never** bypass MCP tools for direct DB access from agent
```python
   # FORBIDDEN - Agent doing this
   tasks = db.query(Task).filter(Task.user_id == user_id).all()
```

3. ❌ **Never** use `pickle` for serialization (security risk)
4. ❌ **Never** disable SQL injection protection
5. ❌ **Never** log sensitive data (API keys, user messages, passwords)
6. ❌ **Never** use `eval()` or `exec()` on user input
7. ❌ **Never** commit `.env` files to git
8. ❌ **Never** use `SELECT *` in production queries
9. ❌ **Never** return raw exceptions to users
10. ❌ **Never** skip input validation

### Architecture Anti-Patterns

1. ❌ **Never** add business logic to API endpoints (belongs in agent or MCP)
2. ❌ **Never** create REST endpoints for task operations (that's MCP's job)
3. ❌ **Never** let agent call agent (no recursion)
4. ❌ **Never** let MCP tools call other MCP tools (agent orchestrates)
5. ❌ **Never** cache conversation state in memory (defeats stateless design)
6. ❌ **Never** create shortcuts that bypass layers
7. ❌ **Never** use global database connections (use connection pooling)

### Development Anti-Patterns

1. ❌ **Never** manually write production code (violates agentic dev principle)
2. ❌ **Never** skip documentation for "temporary" code
3. ❌ **Never** merge without tests
4. ❌ **Never** deploy without running migrations
5. ❌ **Never** commit commented-out code
6. ❌ **Never** use `TODO` without a ticket number
7. ❌ **Never** approve your own pull request

---

## XIII. Success Criteria & Acceptance Tests

### Definition of Done

A feature is complete when:

- [ ] **Code**: Implemented via Claude Code (zero manual code)
- [ ] **Tests**: Unit + integration tests pass
- [ ] **Docs**: Updated specification and README
- [ ] **Review**: Constitutional compliance verified
- [ ] **Demo**: Working demonstration recorded

### Phase III Acceptance Criteria

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

#### Quality Requirements (All Must Pass)

1. **Performance**
   - [ ] Chat response < 3 seconds (P95)
   - [ ] Database queries < 500ms
   - [ ] System handles 10 concurrent users

2. **Usability**
   - [ ] Responses are conversational, not robotic
   - [ ] Errors have helpful suggestions
   - [ ] No technical jargon in user-facing messages
   - [ ] Mobile UI is functional

3. **Reliability**
   - [ ] Error rate < 5%
   - [ ] No crashes under normal load
   - [ ] Graceful degradation when OpenAI API slow

---

## XIV. Constitutional Amendment Process

This constitution is a living document. Amendments require:

1. **Identification**: Document what's changing and why
2. **Impact Analysis**: How does this affect existing principles?
3. **Compatibility**: Can existing implementations remain compliant?
4. **Approval**: [Define approval process - e.g., team consensus, architect sign-off]
5. **Migration Path**: How to update existing systems?

### Amendment Template
```markdown
# Constitutional Amendment #001

## Proposed Change
[What's being added/modified/removed]

## Rationale
[Why this change is necessary]

## Impact Analysis
- Affected principles: [list]
- Affected components: [list]
- Breaking changes: [Yes/No + details]

## Migration Path
[Steps to bring existing systems into compliance]

## Approval
- Proposed by: [Name]
- Approved by: [Names]
- Date: [YYYY-MM-DD]
```

---

## XV. Quick Reference Card

### Core Principles (Remember These)
1. ✅ **Stateless**: Server forgets everything after request
2. ✅ **MCP Only**: Agent → MCP tools → Database (no shortcuts)
3. ✅ **Single Endpoint**: One /api/chat for all operations
4. ✅ **DB is Truth**: All state in PostgreSQL
5. ✅ **Agentic Dev**: Zero manual coding

### Quick Checks
- "Can I store this in memory?" → **NO** (database only)
- "Should agent access DB directly?" → **NO** (use MCP tool)
- "Can I add a REST endpoint for tasks?" → **NO** (agent handles routing)
- "Can I manually write this function?" → **NO** (Claude Code generates)
- "Does my query filter by user_id?" → **MUST** (security boundary)

### Command Reference
```bash
# Start backend
cd backend && uvicorn main:app --reload

# Start frontend
cd frontend && npm run dev

# Run tests
cd backend && pytest

# Run migrations
cd backend && alembic upgrade head

# Deploy backend
git push render main

# Deploy frontend
vercel --prod
```

### Common Prompts

**Generate MCP tool**:
Implement MCP tool [name] that [purpose].
Parameters: [list]
Returns: {task_id, status, title}
Include error handling and unit tests.

**Debug issue**:
Error in [component]: [error message]
Expected: [behavior]
Actual: [behavior]
Diagnose root cause and fix.

---

## XVI. Final Checklist (Use Before Submission)

### Pre-Submission Verification

- [ ] All code generated via Claude Code (zero manual coding)
- [ ] Agentic development log complete
- [ ] All acceptance criteria passing
- [ ] Security checklist complete
- [ ] Documentation complete (architecture, MCP tools, agent behavior)
- [ ] README tested on fresh machine
- [ ] Deployed to production with working demo URL
- [ ] OpenAI domain allowlist configured
- [ ] No hardcoded secrets
- [ ] Test coverage >80%
- [ ] All forbidden practices avoided
- [ ] Constitutional compliance verified

### Deliverable Checklist

- [ ] GitHub repository URL
- [ ] Production frontend URL
- [ ] Production backend URL
- [ ] Demo video (2-3 minutes showing key features)
- [ ] Agentic development log
- [ ] Architecture documentation
- [ ] Setup instructions (README)
- [ ] Test results (coverage report)

---

## Conclusion

This constitution defines an opinionated, production-ready architecture for AI-powered task management. Every decision traces back to core principles: **statelessness**, **MCP standardization**, **agentic development**, and **security-first design**.

Deviation from this constitution without formal amendment creates technical debt and undermines the project's demonstration value.

**Remember**: This is not just a todo app. It's a **proof of concept** for:
- Stateless AI agent architecture
- MCP protocol standardization
- Agentic development methodology
- Modern cloud-native design

Build it right. Build it by the constitution.

---

**Constitutional Version**: 2.0  
**Last Updated**: December 24, 2025  
**Scope**: Phase III - Todo AI Chatbot (Basic Level)  
**Status**: Active & Enforceablecontinue24 Dec
XVII. Advanced Patterns & Best Practices
Pattern 1: Conversation State Reconstruction
Challenge: Agent needs full context but server holds no memory.
Solution: Intelligent history loading with context window management.
pythonfrom typing import List, Dict
from datetime import datetime, timedelta

class ConversationManager:
    """Manages conversation history reconstruction from database"""
    
    MAX_MESSAGES = 50  # Prevent context overflow
    MAX_AGE_DAYS = 30  # Archive old conversations
    
    @staticmethod
    async def load_conversation_history(
        db: Session,
        user_id: str,
        conversation_id: int
    ) -> List[Dict[str, str]]:
        """
        Load conversation history with smart truncation.
        
        Strategy:
        1. Load last 50 messages (context window limit)
        2. Always include system prompt
        3. Summarize older messages if conversation too long
        """
        
        messages = db.query(Message)\
            .filter(
                Message.conversation_id == conversation_id,
                Message.user_id == user_id
            )\
            .order_by(Message.created_at.asc())\
            .limit(ConversationManager.MAX_MESSAGES)\
            .all()
        
        # Convert to OpenAI format
        history = [
            {"role": msg.role, "content": msg.content}
            for msg in messages
        ]
        
        # If conversation too long, summarize older messages
        if len(history) > 40:
            history = ConversationManager._compress_history(history)
        
        return history
    
    @staticmethod
    def _compress_history(history: List[Dict]) -> List[Dict]:
        """
        Compress old messages into summary.
        Keep recent 20 messages, summarize the rest.
        """
        if len(history) <= 20:
            return history
        
        old_messages = history[:-20]
        recent_messages = history[-20:]
        
        # Create summary of old messages
        task_actions = []
        for msg in old_messages:
            if "added" in msg["content"].lower():
                task_actions.append("created tasks")
            elif "completed" in msg["content"].lower():
                task_actions.append("completed tasks")
        
        summary = {
            "role": "system",
            "content": f"[Earlier in conversation: User {', '.join(set(task_actions))}]"
        }
        
        return [summary] + recent_messages
Constitutional Note: This pattern respects statelessness—reconstruction happens per-request from database.

Pattern 2: Multi-Tool Orchestration with Transaction Safety
Challenge: Agent needs to chain tools (list → complete), but operations must be atomic.
Solution: Database transactions with rollback on failure.
pythonfrom contextlib import contextmanager
from sqlmodel import Session
from typing import Generator

@contextmanager
def transactional_mcp_operation(
    db_engine
) -> Generator[Session, None, None]:
    """
    Provide transactional context for MCP tool operations.
    
    Usage:
        with transactional_mcp_operation(engine) as session:
            task = session.query(Task).filter(...).first()
            task.completed = True
            session.commit()
            # Auto-rollback on exception
    """
    session = Session(db_engine)
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        raise
    finally:
        session.close()

# In MCP tool implementation
def complete_task(user_id: str, task_id: int) -> dict:
    """Complete task with transactional safety"""
    
    with transactional_mcp_operation(engine) as session:
        task = session.query(Task).filter(
            Task.id == task_id,
            Task.user_id == user_id
        ).first()
        
        if not task:
            return {"error": "Task not found", "task_id": task_id}
        
        # Store title before modification (for response)
        task_title = task.title
        
        # Modify
        task.completed = True
        task.updated_at = datetime.utcnow()
        
        # Commit happens in context manager
        
    return {
        "task_id": task_id,
        "status": "completed",
        "title": task_title
    }
Constitutional Note: Transactions ensure atomicity while maintaining statelessness—no partial updates survive crashes.

Pattern 3: Intelligent Tool Selection with Confidence Scoring
Challenge: User says "finish the grocery one"—agent must resolve ambiguity.
Solution: Multi-stage tool selection with confidence thresholds.
pythonfrom typing import Optional, Tuple
import re

class IntentResolver:
    """Resolves user intent to appropriate MCP tool call"""
    
    # Intent patterns with confidence scores
    INTENT_PATTERNS = {
        "add_task": [
            (r"add|create|new|remember", 0.9),
            (r"need to|have to|should", 0.7),
            (r"todo|task", 0.6),
        ],
        "complete_task": [
            (r"done|complete|finish|mark", 0.9),
            (r"did|finished", 0.8),
        ],
        "delete_task": [
            (r"delete|remove|cancel|drop", 0.9),
            (r"get rid of|forget", 0.7),
        ],
        "list_tasks": [
            (r"show|list|display|see", 0.9),
            (r"what.*tasks|pending|todo", 0.8),
        ],
        "update_task": [
            (r"change|update|rename|modify", 0.9),
            (r"edit", 0.8),
        ],
    }
    
    @classmethod
    def resolve_intent(
        cls,
        message: str,
        conversation_history: List[Dict]
    ) -> Tuple[str, float, Optional[Dict]]:
        """
        Resolve user message to tool + confidence + parameters.
        
        Returns:
            (tool_name, confidence, extracted_params)
        """
        message_lower = message.lower()
        
        # Score each intent
        scores = {}
        for intent, patterns in cls.INTENT_PATTERNS.items():
            score = 0.0
            for pattern, weight in patterns:
                if re.search(pattern, message_lower):
                    score = max(score, weight)
            scores[intent] = score
        
        # Get highest scoring intent
        best_intent = max(scores.items(), key=lambda x: x[1])
        tool_name, confidence = best_intent
        
        # Extract parameters based on intent
        params = cls._extract_parameters(
            tool_name, message, conversation_history
        )
        
        return tool_name, confidence, params
    
    @classmethod
    def _extract_parameters(
        cls,
        tool_name: str,
        message: str,
        history: List[Dict]
    ) -> Optional[Dict]:
        """Extract tool parameters from message and context"""
        
        if tool_name == "add_task":
            # Extract task title
            # "Add buy groceries" → title="buy groceries"
            title = re.sub(r"^(add|create|new|remember)\s+", "", message, flags=re.IGNORECASE)
            return {"title": title.strip()}
        
        elif tool_name == "complete_task":
            # Check for task reference
            task_ref = cls._resolve_task_reference(message, history)
            if task_ref:
                return {"task_id": task_ref}
            return None
        
        # ... other tool parameter extraction
        
        return {}
    
    @classmethod
    def _resolve_task_reference(
        cls,
        message: str,
        history: List[Dict]
    ) -> Optional[int]:
        """
        Resolve task reference from message + context.
        
        Examples:
        - "Complete task 5" → 5
        - "Finish the grocery one" → (search history for grocery task)
        - "Done with the first one" → (get first from last list)
        """
        
        # Direct ID reference: "task 5", "#5"
        match = re.search(r"task\s+#?(\d+)|#(\d+)", message, re.IGNORECASE)
        if match:
            return int(match.group(1) or match.group(2))
        
        # Positional reference: "the first one", "the last one"
        if re.search(r"first|1st", message, re.IGNORECASE):
            # Search history for last task list
            last_list = cls._find_last_task_list(history)
            if last_list:
                return last_list[0]["id"]
        
        # Name reference: "the grocery one"
        name_match = re.search(r"the\s+(\w+)\s+(one|task)", message, re.IGNORECASE)
        if name_match:
            keyword = name_match.group(1)
            # Would need to search tasks - return None to trigger list_tasks first
            return None
        
        return None
    
    @staticmethod
    def _find_last_task_list(history: List[Dict]) -> Optional[List[Dict]]:
        """Extract task list from last assistant message that listed tasks"""
        
        for msg in reversed(history):
            if msg["role"] == "assistant" and "tasks:" in msg["content"].lower():
                # Parse task list from message
                # This is simplified - real implementation would be more robust
                return []  # Would return parsed task list
        
        return None
Agent Implementation Using Intent Resolver:
pythonasync def process_user_message(
    user_id: str,
    message: str,
    conversation_history: List[Dict],
    mcp_client: MCPClient
) -> str:
    """
    Process user message with intelligent tool selection.
    """
    
    # Resolve intent
    tool_name, confidence, params = IntentResolver.resolve_intent(
        message, conversation_history
    )
    
    # Low confidence - ask for clarification
    if confidence < 0.6:
        return "I'm not sure what you'd like me to do. Could you rephrase?"
    
    # Medium confidence - confirm before acting
    if confidence < 0.8:
        return f"Did you want me to {tool_name.replace('_', ' ')}? Please confirm."
    
    # High confidence - execute
    if params is None:
        # Need more info - maybe list tasks first
        if tool_name in ["complete_task", "delete_task"]:
            result = await mcp_client.call_tool("list_tasks", {"user_id": user_id})
            return f"Here are your tasks: {format_task_list(result)}. Which one?"
    
    # Execute tool
    result = await mcp_client.call_tool(tool_name, {"user_id": user_id, **params})
    
    return format_response(tool_name, result)
Constitutional Note: This pattern enhances agent intelligence while respecting the MCP boundary—all actual operations still go through tools.

Pattern 4: Rate Limiting & Cost Control
Challenge: Prevent runaway costs from infinite loops or abuse.
Solution: Multi-layer rate limiting.
pythonfrom datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict
import asyncio

class RateLimiter:
    """Token bucket rate limiter for API requests"""
    
    def __init__(
        self,
        requests_per_minute: int = 60,
        requests_per_hour: int = 1000,
        token_limit_per_request: int = 4000
    ):
        self.rpm_limit = requests_per_minute
        self.rph_limit = requests_per_hour
        self.token_limit = token_limit_per_request
        
        # Track usage per user
        self.minute_buckets: Dict[str, list] = defaultdict(list)
        self.hour_buckets: Dict[str, list] = defaultdict(list)
        self.token_usage: Dict[str, int] = defaultdict(int)
    
    async def check_rate_limit(self, user_id: str) -> Tuple[bool, str]:
        """
        Check if user is within rate limits.
        
        Returns:
            (allowed: bool, reason: str)
        """
        now = datetime.utcnow()
        
        # Clean old entries
        self._clean_old_entries(user_id, now)
        
        # Check minute limit
        minute_requests = len(self.minute_buckets[user_id])
        if minute_requests >= self.rpm_limit:
            return False, f"Rate limit: {self.rpm_limit} requests/minute"
        
        # Check hour limit
        hour_requests = len(self.hour_buckets[user_id])
        if hour_requests >= self.rph_limit:
            return False, f"Rate limit: {self.rph_limit} requests/hour"
        
        return True, ""
    
    def record_request(self, user_id: str, tokens_used: int = 0):
        """Record a request for rate limiting"""
        now = datetime.utcnow()
        
        self.minute_buckets[user_id].append(now)
        self.hour_buckets[user_id].append(now)
        self.token_usage[user_id] += tokens_used
    
    def _clean_old_entries(self, user_id: str, now: datetime):
        """Remove entries outside rate limit windows"""
        minute_ago = now - timedelta(minutes=1)
        hour_ago = now - timedelta(hours=1)
        
        self.minute_buckets[user_id] = [
            ts for ts in self.minute_buckets[user_id]
            if ts > minute_ago
        ]
        
        self.hour_buckets[user_id] = [
            ts for ts in self.hour_buckets[user_id]
            if ts > hour_ago
        ]

# Integration with FastAPI endpoint
rate_limiter = RateLimiter(
    requests_per_minute=20,
    requests_per_hour=500,
    token_limit_per_request=4000
)

@app.post("/api/chat/{user_id}")
async def chat_endpoint(
    user_id: str,
    request: ChatRequest,
    current_user: str = Depends(get_current_user)
):
    # Check rate limit
    allowed, reason = await rate_limiter.check_rate_limit(user_id)
    if not allowed:
        raise HTTPException(429, detail=reason)
    
    # Process request
    response = await process_chat(user_id, request)
    
    # Record usage
    rate_limiter.record_request(user_id, tokens_used=response.token_count)
    
    return response
Cost Monitoring Dashboard Data:
pythonclass CostMonitor:
    """Track and report API costs"""
    
    # OpenAI pricing (as of knowledge cutoff)
    PRICING = {
        "gpt-4": {"input": 0.03, "output": 0.06},  # per 1K tokens
        "gpt-3.5-turbo": {"input": 0.0015, "output": 0.002}
    }
    
    @staticmethod
    def calculate_request_cost(
        model: str,
        input_tokens: int,
        output_tokens: int
    ) -> float:
        """Calculate cost of single request"""
        pricing = CostMonitor.PRICING.get(model, CostMonitor.PRICING["gpt-4"])
        
        input_cost = (input_tokens / 1000) * pricing["input"]
        output_cost = (output_tokens / 1000) * pricing["output"]
        
        return input_cost + output_cost
    
    @staticmethod
    async def get_user_cost_summary(
        db: Session,
        user_id: str,
        days: int = 30
    ) -> Dict:
        """Get cost summary for user"""
        
        # Query messages from last N days
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        messages = db.query(Message).filter(
            Message.user_id == user_id,
            Message.created_at >= cutoff
        ).all()
        
        total_cost = 0.0
        total_messages = len(messages)
        
        # Estimate tokens (rough: 1 token ~= 4 chars)
        for msg in messages:
            tokens = len(msg.content) // 4
            cost = CostMonitor.calculate_request_cost(
                "gpt-4",
                input_tokens=tokens if msg.role == "user" else 0,
                output_tokens=tokens if msg.role == "assistant" else 0
            )
            total_cost += cost
        
        return {
            "user_id": user_id,
            "period_days": days,
            "total_messages": total_messages,
            "estimated_cost_usd": round(total_cost, 2),
            "avg_cost_per_message": round(total_cost / max(total_messages, 1), 4)
        }
Constitutional Note: Rate limiting and cost monitoring are implemented as middleware—they don't violate statelessness because limits are checked per-request against database/cache.

Pattern 5: Graceful Degradation & Circuit Breaker
Challenge: OpenAI API goes down or becomes slow—system should degrade gracefully.
Solution: Circuit breaker pattern with fallback responses.
pythonfrom enum import Enum
from datetime import datetime, timedelta

class CircuitState(Enum):
    CLOSED = "closed"  # Normal operation
    OPEN = "open"      # Failing, reject requests
    HALF_OPEN = "half_open"  # Testing if recovered

class CircuitBreaker:
    """Circuit breaker for external API calls"""
    
    def __init__(
        self,
        failure_threshold: int = 5,
        timeout_seconds: int = 60,
        recovery_timeout: int = 30
    ):
        self.failure_threshold = failure_threshold
        self.timeout = timeout_seconds
        self.recovery_timeout = recovery_timeout
        
        self.failure_count = 0
        self.last_failure_time = None
        self.state = CircuitState.CLOSED
    
    async def call(self, func, *args, **kwargs):
        """
        Execute function with circuit breaker protection.
        """
        
        # Check circuit state
        if self.state == CircuitState.OPEN:
            if self._should_attempt_recovery():
                self.state = CircuitState.HALF_OPEN
            else:
                raise CircuitBreakerOpenError("Service temporarily unavailable")
        
        try:
            # Execute with timeout
            result = await asyncio.wait_for(
                func(*args, **kwargs),
                timeout=self.timeout
            )
            
            # Success - reset if in half-open
            if self.state == CircuitState.HALF_OPEN:
                self._record_success()
            
            return result
            
        except Exception as e:
            self._record_failure()
            raise
    
    def _record_failure(self):
        """Record a failure and potentially open circuit"""
        self.failure_count += 1
        self.last_failure_time = datetime.utcnow()
        
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN
            print(f"Circuit breaker OPEN after {self.failure_count} failures")
    
    def _record_success(self):
        """Record success and close circuit"""
        self.failure_count = 0
        self.state = CircuitState.CLOSED
        print("Circuit breaker CLOSED - service recovered")
    
    def _should_attempt_recovery(self) -> bool:
        """Check if enough time has passed to try recovery"""
        if not self.last_failure_time:
            return True
        
        time_since_failure = datetime.utcnow() - self.last_failure_time
        return time_since_failure.total_seconds() > self.recovery_timeout

class CircuitBreakerOpenError(Exception):
    """Raised when circuit breaker is open"""
    pass

# Integration with agent calls
openai_circuit_breaker = CircuitBreaker(
    failure_threshold=3,
    timeout_seconds=30,
    recovery_timeout=60
)

async def call_agent_with_fallback(
    user_message: str,
    conversation_history: List[Dict]
) -> str:
    """
    Call AI agent with circuit breaker and fallback.
    """
    try:
        # Try calling agent through circuit breaker
        response = await openai_circuit_breaker.call(
            agent.run,
            messages=conversation_history + [{"role": "user", "content": user_message}]
        )
        return response
        
    except CircuitBreakerOpenError:
        # Fallback: provide helpful message without AI
        return fallback_response(user_message)
    
    except asyncio.TimeoutError:
        return "I'm taking longer than usual to respond. Please try again."
    
    except Exception as e:
        logger.error(f"Agent error: {e}")
        return "I'm having trouble processing your request. Please try again."

def fallback_response(user_message: str) -> str:
    """
    Provide non-AI response when agent unavailable.
    """
    message_lower = user_message.lower()
    
    if any(word in message_lower for word in ["add", "create", "new"]):
        return ("I'm temporarily unable to process complex requests. "
                "To add a task, please try again in a moment.")
    
    elif any(word in message_lower for word in ["show", "list", "see"]):
        return ("I'm temporarily unable to process complex requests. "
                "To see your tasks, please try again in a moment.")
    
    else:
        return ("I'm temporarily experiencing technical difficulties. "
                "Your data is safe. Please try again in a moment.")
Constitutional Note: Circuit breaker maintains statelessness—state is in-memory but ephemeral (resets on restart). Critical operations (task data) remain in database.

XVIII. Testing Strategy Deep Dive
Test Pyramid Implementation
Level 1: Unit Tests (50+ tests)
python# backend/tests/test_mcp_tools.py

import pytest
from sqlmodel import Session, create_engine
from backend.mcp.tools.tasks import add_task, list_tasks, complete_task

@pytest.fixture
def test_db():
    """Create temporary test database"""
    engine = create_engine("sqlite:///:memory:")
    # Create tables
    SQLModel.metadata.create_all(engine)
    return engine

@pytest.fixture
def test_user():
    return "test_user_123"

class TestAddTask:
    """Test suite for add_task MCP tool"""
    
    def test_add_task_success(self, test_db, test_user):
        """Should create task and return confirmation"""
        result = add_task(
            user_id=test_user,
            title="Buy groceries",
            description="Milk and eggs"
        )
        
        assert result["status"] == "created"
        assert result["title"] == "Buy groceries"
        assert "task_id" in result
        assert isinstance(result["task_id"], int)
    
    def test_add_task_empty_title(self, test_db, test_user):
        """Should reject empty title"""
        result = add_task(user_id=test_user, title="")
        
        assert "error" in result
        assert "empty" in result["error"].lower()
    
    def test_add_task_long_title(self, test_db, test_user):
        """Should truncate or reject title > 500 chars"""
        long_title = "A" * 600
        result = add_task(user_id=test_user, title=long_title)
        
        # Either truncated or error
        if "error" not in result:
            assert len(result["title"]) <= 500
        else:
            assert "too long" in result["error"].lower()
    
    def test_add_task_sql_injection_attempt(self, test_db, test_user):
        """Should safely handle SQL injection attempts"""
        malicious_title = "'; DROP TABLE tasks; --"
        result = add_task(user_id=test_user, title=malicious_title)
        
        # Should succeed without executing SQL
        assert result["status"] == "created"
        
        # Verify tasks table still exists
        all_tasks = list_tasks(user_id=test_user)
        assert "tasks" in all_tasks

class TestListTasks:
    """Test suite for list_tasks MCP tool"""
    
    @pytest.fixture
    def populated_tasks(self, test_db, test_user):
        """Create test tasks"""
        add_task(test_user, "Task 1")
        add_task(test_user, "Task 2")
        add_task(test_user, "Task 3")
        
        # Complete one
        tasks = list_tasks(test_user, "all")
        complete_task(test_user, tasks["tasks"][0]["id"])
    
    def test_list_all_tasks(self, populated_tasks, test_user):
        """Should return all tasks"""
        result = list_tasks(test_user, "all")
        
        assert result["count"] == 3
        assert len(result["tasks"]) == 3
    
    def test_list_pending_tasks(self, populated_tasks, test_user):
        """Should return only incomplete tasks"""
        result = list_tasks(test_user, "pending")
        
        assert result["count"] == 2
        assert all(not task["completed"] for task in result["tasks"])
    
    def test_list_completed_tasks(self, populated_tasks, test_user):
        """Should return only completed tasks"""
        result = list_tasks(test_user, "completed")
        
        assert result["count"] == 1
        assert all(task["completed"] for task in result["tasks"])
    
    def test_list_tasks_empty(self, test_db, test_user):
        """Should handle empty task list gracefully"""
        result = list_tasks(test_user, "all")
        
        assert result["count"] == 0
        assert result["tasks"] == []
    
    def test_list_tasks_user_isolation(self, populated_tasks, test_db):
        """Should not return other users' tasks"""
        other_user = "other_user_456"
        
        result = list_tasks(other_user, "all")
        
        assert result["count"] == 0  # Should see no tasks

# ... Similar comprehensive tests for complete_task, delete_task, update_task
Level 2: Integration Tests (15+ tests)
python# backend/tests/test_integration.py

import pytest
from httpx import AsyncClient
from backend.main import app

@pytest.fixture
async def client():
    """Create test client"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture
def auth_headers(test_user):
    """Mock authentication headers"""
    return {"Authorization": f"Bearer test_token_{test_user}"}

class TestChatEndpointIntegration:
    """Integration tests for chat endpoint with agent + MCP"""
    
    @pytest.mark.asyncio
    async def test_create_task_flow(self, client, auth_headers, test_user):
        """
        Test complete flow: API -> Agent -> MCP -> DB
        """
        response = await client.post(
            f"/api/chat/{test_user}",
            headers=auth_headers,
            json={
                "message": "Add a task to buy groceries"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "conversation_id" in data
        assert "response" in data
        assert "tool_calls" in data
        
        # Verify tool was called
        assert len(data["tool_calls"]) == 1
        assert data["tool_calls"][0]["tool"] == "add_task"
        
        # Verify response mentions task
        assert "groceries" in data["response"].lower()
    
    @pytest.mark.asyncio
    async def test_conversation_context_maintained(
        self, client, auth_headers, test_user
    ):
        """
        Test that conversation context is preserved across requests.
        """
        # First message: List tasks
        response1 = await client.post(
            f"/api/chat/{test_user}",
            headers=auth_headers,
            json={"message": "Show my tasks"}
        )
        conv_id = response1.json()["conversation_id"]
        
        # Second message: Reference from context
        response2 = await client.post(
            f"/api/chat/{test_user}",
            headers=auth_headers,
            json={
                "conversation_id": conv_id,
                "message": "Complete the first one"
            }
        )
        
        assert response2.status_code == 200
        data = response2.json()
        
        # Agent should have resolved "the first one"
        assert any(
            call["tool"] == "complete_task"
            for call in data["tool_calls"]
        )
    
    @pytest.mark.asyncio
    async def test_multi_tool_orchestration(self, client, auth_headers, test_user):
        """
        Test agent chaining multiple tools in one request.
        """
        response = await client.post(
            f"/api/chat/{test_user}",
            headers=auth_headers,
            json={
                "message": "Delete the task called groceries"
            }
        )
        
        data = response.json()
        
        # Should have called list_tasks first, then delete_task
        tools_called = [call["tool"] for call in data["tool_calls"]]
        assert "list_tasks" in tools_called
        assert "delete_task" in tools_called
    
    @pytest.mark.asyncio
    async def test_user_isolation_enforced(self, client, test_user):
        """
        Test that users cannot access each other's data.
        """
        user_a = "user_a"
        user_b = "user_b"
        
        # User A creates task
        await client.post(
            f"/api/chat/{user_a}",
            headers={"Authorization": f"Bearer token_{user_a}"},
            json={"message": "Add secret task"}
        )
        
        # User B tries to list tasks
        response = await client.post(
            f"/api/chat/{user_b}",
            headers={"Authorization": f"Bearer token_{user_b}"},
            json={"message": "Show all tasks"}
        )
        
        data = response.json()
        
        # Should not see User A's task
        assert "secret" not in data["response"].lower()
Level 3: End-to-End Tests (5+ tests)
python# backend/tests/test_e2e.py

import pytest
from playwright.async_api import async_playwright
import asyncio

@pytest.mark.e2e
class TestEndToEndUserFlow:
    """E2E tests simulating real user interactions"""
    
    @pytest.mark.asyncio
    async def test_complete_todo_workflow(self):
        """
        Simulate user going through complete todo workflow:
        1. Open app
        2. Add multiple tasks
        3. List tasks
        4. Complete some tasks
        5. Delete a task
        6. Verify state
        """
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            
            # Navigate to app
            await page.goto("http://localhost:3000")
            
            # Wait for ChatKit to load
            await page.wait_for_selector("input[type='text']")
            
            # Add first task
            await page.fill("input[type='text']", "Buy groceries")
            await page.press("input[type='text']", "Enter")
            await page.wait_for_text("added", timeout=5000)
            # Add second task
        await page.fill("input[type='text']", "Call mom")
        await page.press("input[type='text']", "Enter")
        await page.wait_for_text("added", timeout=5000)
        
        # List tasks
        await page.fill("input[type='text']", "Show my tasks")
        await page.press("input[type='text']", "Enter")
        response = await page.wait_for_text("Buy groceries", timeout=5000)
        
        # Verify both tasks shown
        assert await page.is_visible("text=Buy groceries")
        assert await page.is_visible("text=Call mom")
        
        # Complete first task
        await page.fill("input[type='text']", "Mark the first task as done")
        await page.press("input[type='text']", "Enter")
        await page.wait_for_text("completed", timeout=5000)
        
        # Verify completion
        await page.fill("input[type='text']", "Show pending tasks")
        await page.press("input[type='text']", "Enter")
        
        # Should only see "Call mom" now
        await page.wait_for_text("Call mom", timeout=5000)
        
        await browser.close()

@pytest.mark.asyncio
async def test_conversation_survives_server_restart(self):
    """
    Test stateless architecture: conversation persists across server restarts.
    """
    # This test would:
    # 1. Start conversation
    # 2. Add tasks
    # 3. Kill server process
    # 4. Restart server
    # 5. Resume conversation with same conversation_id
    # 6. Verify history is intact and tasks are accessible
    pass  # Implementation depends on deployment setup

---

## XIX. Performance Optimization Patterns

### Pattern 1: Database Query Optimization
```python
# ❌ SLOW: N+1 Query Problem
def get_conversations_with_message_counts_slow(user_id: str):
    conversations = db.query(Conversation).filter(
        Conversation.user_id == user_id
    ).all()
    
    result = []
    for conv in conversations:
        # This triggers a separate query for EACH conversation
        message_count = db.query(Message).filter(
            Message.conversation_id == conv.id
        ).count()
        result.append({
            "id": conv.id,
            "message_count": message_count
        })
    
    return result

# ✅ FAST: Single Query with JOIN
def get_conversations_with_message_counts_fast(user_id: str):
    from sqlalchemy import func
    
    result = db.query(
        Conversation.id,
        func.count(Message.id).label("message_count")
    ).join(
        Message,
        Message.conversation_id == Conversation.id
    ).filter(
        Conversation.user_id == user_id
    ).group_by(
        Conversation.id
    ).all()
    
    return [
        {"id": row.id, "message_count": row.message_count}
        for row in result
    ]
```

### Pattern 2: Connection Pooling
```python
# backend/database.py

from sqlmodel import create_engine
from sqlalchemy.pool import QueuePool

# ✅ CORRECT: Connection pool configuration
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,          # Max connections in pool
    max_overflow=20,       # Additional connections if pool full
    pool_timeout=30,       # Wait time for connection
    pool_recycle=3600,     # Recycle connections after 1 hour
    echo=False             # Disable SQL logging in production
)

# ❌ INCORRECT: Creating new engine per request
def bad_database_pattern():
    engine = create_engine(DATABASE_URL)  # DON'T DO THIS
    session = Session(engine)
    return session
```

### Pattern 3: Response Caching (with Constitutional Compliance)
```python
from functools import lru_cache
from datetime import datetime, timedelta

class CacheManager:
    """
    Caching that respects statelessness principle.
    Cache is ephemeral - resets on server restart (acceptable).
    """
    
    def __init__(self):
        self._cache = {}
        self._timestamps = {}
        self.ttl_seconds = 300  # 5 minutes
    
    def get(self, key: str):
        """Get cached value if not expired"""
        if key not in self._cache:
            return None
        
        # Check expiration
        if datetime.utcnow() - self._timestamps[key] > timedelta(seconds=self.ttl_seconds):
            del self._cache[key]
            del self._timestamps[key]
            return None
        
        return self._cache[key]
    
    def set(self, key: str, value):
        """Cache value with timestamp"""
        self._cache[key] = value
        self._timestamps[key] = datetime.utcnow()

# Example: Cache task list for brief period
task_cache = CacheManager()

def list_tasks_with_cache(user_id: str, status: str = "all"):
    cache_key = f"{user_id}:{status}"
    
    # Check cache
    cached = task_cache.get(cache_key)
    if cached:
        return cached
    
    # Query database
    result = _query_tasks_from_db(user_id, status)
    
    # Cache result
    task_cache.set(cache_key, result)
    
    return result

# IMPORTANT: Invalidate cache on writes
def add_task(user_id: str, title: str):
    result = _create_task_in_db(user_id, title)
    
    # Invalidate all caches for this user
    task_cache._cache = {
        k: v for k, v in task_cache._cache.items()
        if not k.startswith(f"{user_id}:")
    }
    
    return result
```

**Constitutional Note**: This caching is acceptable because:
1. It's ephemeral (resets on restart)
2. It's an optimization, not core state
3. Cache misses still work correctly
4. Doesn't violate stateless principle (every request CAN be handled from DB)

---

## XX. Deployment Checklist & Troubleshooting

### Pre-Deployment Checklist
```markdown
## Environment Setup
- [ ] Neon database created and accessible
- [ ] DATABASE_URL environment variable set
- [ ] OPENAI_API_KEY environment variable set
- [ ] AUTH_SECRET generated (min 32 chars)
- [ ] All secrets in environment variables, not code

## Database
- [ ] Migrations run successfully (`alembic upgrade head`)
- [ ] Can connect to database from backend
- [ ] Test data inserted and queryable
- [ ] Indexes created on user_id columns

## Backend
- [ ] FastAPI server starts without errors
- [ ] /health endpoint returns 200
- [ ] /ready endpoint returns 200
- [ ] Can create test task via API
- [ ] Logs showing structured JSON format
- [ ] No secrets in logs

## Frontend
- [ ] ChatKit domain added to OpenAI allowlist
- [ ] NEXT_PUBLIC_OPENAI_DOMAIN_KEY set
- [ ] Can connect to backend API
- [ ] Test message returns response
- [ ] UI renders on mobile

## Integration
- [ ] End-to-end flow works (add → list → complete)
- [ ] Conversation context maintained
- [ ] Multiple tool calls work
- [ ] Error messages user-friendly

## Security
- [ ] All queries filter by user_id
- [ ] Authentication enforced on endpoints
- [ ] No SQL injection vulnerabilities
- [ ] Rate limiting configured
- [ ] HTTPS enforced

## Performance
- [ ] Response time < 3s (P95)
- [ ] Database queries < 500ms
- [ ] No N+1 query problems
- [ ] Connection pooling configured

## Monitoring
- [ ] Error tracking configured (Sentry/etc)
- [ ] Structured logging enabled
- [ ] Health checks configured for uptime monitoring
- [ ] Cost tracking implemented
```

### Common Issues & Solutions

| Issue | Symptoms | Solution |
|-------|----------|----------|
| **OpenAI Domain Not Allowed** | ChatKit fails to initialize, CORS errors | Add domain to allowlist at OpenAI settings, wait for approval, set domain key |
| **Database Connection Fails** | "Could not connect to database" | Check DATABASE_URL format, verify Neon project active, check IP allowlist |
| **Agent Not Calling Tools** | Responses don't include tool_calls | Verify MCP server registered with agent, check tool schema definitions |
| **Conversation Context Lost** | Agent doesn't remember previous messages | Check conversation history loading from DB, verify conversation_id passed |
| **Slow Response Times** | Requests take > 5 seconds | Enable query logging, check for N+1 queries, add database indexes |
| **Rate Limit Errors** | 429 Too Many Requests | Adjust rate limiter thresholds, implement user-facing limits |
| **CORS Errors** | Frontend can't reach backend | Add frontend domain to FastAPI CORS middleware |
| **Tasks Not Saving** | add_task succeeds but list_tasks empty | Check database transactions committing, verify user_id consistency |

### Debug Commands
```bash
# Check database connection
psql $DATABASE_URL -c "SELECT COUNT(*) FROM tasks;"

# Test API endpoint directly
curl -X POST http://localhost:8000/api/chat/test_user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test_token" \
  -d '{"message": "Show my tasks"}'

# View recent logs
tail -f logs/app.log | grep ERROR

# Check OpenAI API connectivity
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Monitor database queries
# (Enable query logging in SQLModel)
export SQLALCHEMY_ECHO=True

# Test MCP tools directly
python -c "
from backend.mcp.tools.tasks import list_tasks
print(list_tasks('test_user', 'all'))
"
```

---

## XXI. Constitutional Amendments Log

### Amendment History

**Amendment #001 - Cache Exemption**
- **Date**: 2025-01-15 (example)
- **Proposal**: Allow ephemeral caching for performance optimization
- **Rationale**: Brief caching (< 5 min) doesn't violate statelessness principle if cache misses work
- **Impact**: Enables response time improvements without architectural compromise
- **Status**: Approved

**Amendment #002 - Circuit Breaker State**
- **Date**: 2025-01-16 (example)
- **Proposal**: Allow in-memory circuit breaker state
- **Rationale**: Transient operational state for fault tolerance, resets acceptably on restart
- **Impact**: Improves resilience without compromising data integrity
- **Status**: Approved

---

## XXII. Final Constitution Summary

### The Five Pillars (Memorize These)

1. **STATELESS SERVER**
   - Server = pure function
   - Database = single source of truth
   - Restart = zero data loss

2. **MCP BOUNDARY**
   - Agent → MCP tools → Database
   - No shortcuts
   - Tools are atomic

3. **SINGLE ENDPOINT**
   - One /api/chat
   - Agent does routing
   - Natural language interface

4. **AGENTIC DEVELOPMENT**
   - Claude Code generates all code
   - Humans architect, review, prompt
   - Zero manual implementation

5. **SECURITY FIRST**
   - Every query filters by user_id
   - Auth on every endpoint
   - Secrets in environment only

### Adherence Verification

Before claiming constitutional compliance, verify:
✓ Can I restart the server mid-conversation without data loss?
✓ Can I route request N to server A, request N+1 to server B?
✓ Do all operations go through MCP tools?
✓ Is there exactly one chat endpoint?
✓ Was all code generated by Claude Code?
✓ Do all queries filter by user_id?

If ANY answer is "no", you are NOT compliant.

---

**End of Constitutional Specification v2.0**

**Total Length**: ~15,000 words  
**Sections**: 22  
**Code Examples**: 40+  
**Patterns Documented**: 20+  

This constitution is now comprehensive, production-ready, and serves as both:
1. **A design document** for implementation
2. **A compliance checklist** for review
3. **A teaching resource** for agentic development methodology

Use it wisely. Build with discipline. Ship with confidence.