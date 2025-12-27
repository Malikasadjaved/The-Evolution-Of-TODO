# Architecture: Phase 3 AI Chatbot with MCP

**Comprehensive Architecture Documentation for Natural Language Task Management**

Version: 3.0.0

---

## Table of Contents

1. [Overview](#overview)
2. [Four-Layer Architecture](#four-layer-architecture)
3. [Request Flow](#request-flow)
4. [MCP Tool Flow](#mcp-tool-flow)
5. [Data Flow (Phase 2 ↔ Phase 3)](#data-flow-phase-2--phase-3)
6. [Component Diagram](#component-diagram)
7. [Security Architecture](#security-architecture)
8. [Deployment Architecture](#deployment-architecture)
9. [Technology Stack](#technology-stack)

---

## Overview

Phase 3 introduces **AI-powered natural language task management** using OpenAI Agents SDK and Model Context Protocol (MCP) tools. The system follows a **stateless, cloud-native architecture** where all state is persisted in PostgreSQL.

**Key Characteristics**:
- ✅ **Stateless**: No in-memory sessions (conversation history loaded from database on each request)
- ✅ **Monorepo**: Shares database and authentication with Phase 2 web UI
- ✅ **User Isolation**: Strict JWT-based authentication with user_id filtering
- ✅ **Cloud-Native**: Kubernetes-ready with health probes and graceful shutdown
- ✅ **Resilient**: Circuit breaker pattern prevents cascading failures

---

## Four-Layer Architecture

### High-Level View

```
┌─────────────────────────────────────────────────────────────────┐
│                        Layer 1: Presentation                     │
│                                                                   │
│  ┌──────────────────────┐        ┌──────────────────────┐       │
│  │  Next.js ChatKit UI  │        │  Next.js Web UI      │       │
│  │  (Port 3001)         │        │  (Port 3000)         │       │
│  │  Phase 3             │        │  Phase 2             │       │
│  └──────────┬───────────┘        └──────────┬───────────┘       │
│             │                               │                    │
└─────────────┼───────────────────────────────┼────────────────────┘
              │                               │
              │ HTTP/JSON                     │ HTTP/JSON
              │ JWT Bearer Token              │ JWT Bearer Token
              ▼                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Layer 2: API Gateway                      │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              FastAPI Application (Port 8000)               │ │
│  │  ┌──────────────────┐        ┌──────────────────────┐     │ │
│  │  │  Chat Endpoint   │        │  REST Endpoints      │     │ │
│  │  │  /api/{uid}/chat │        │  /api/{uid}/tasks    │     │ │
│  │  └────────┬─────────┘        └──────────┬───────────┘     │ │
│  │           │                              │                 │ │
│  │  ┌────────▼──────────────────────────────▼───────────────┐│ │
│  │  │          JWT Authentication Middleware                ││ │
│  │  │  (Verifies token, extracts user_id)                   ││ │
│  │  └────────┬──────────────────────────────────────────────┘│ │
│  └───────────┼─────────────────────────────────────────────── │ │
└──────────────┼─────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Layer 3: Business Logic                      │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    OpenAI Agent Client                      │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │  • Understands natural language                       │  │ │
│  │  │  • Decides which MCP tool to call                     │  │ │
│  │  │  • Formats responses as natural language              │  │ │
│  │  └────────────────────┬─────────────────────────────────┘  │ │
│  └────────────────────────┼──────────────────────────────────── │
│                           │                                      │
│  ┌────────────────────────▼──────────────────────────────────┐ │
│  │                    MCP Tool Layer                          │ │
│  │  ┌────────┐ ┌─────────┐ ┌──────────┐ ┌────────┐ ┌──────┐ │ │
│  │  │  add   │ │  list   │ │ complete │ │ update │ │delete│ │ │
│  │  │  task  │ │  tasks  │ │   task   │ │  task  │ │ task │ │ │
│  │  └───┬────┘ └────┬────┘ └─────┬────┘ └───┬────┘ └──┬───┘ │ │
│  └──────┼───────────┼────────────┼──────────┼─────────┼────── │
└─────────┼───────────┼────────────┼──────────┼─────────┼────────┘
          │           │            │          │         │
          ▼           ▼            ▼          ▼         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Layer 4: Data Persistence                   │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              PostgreSQL Database (Neon)                     │ │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────────┐ ┌─────────┐  │ │
│  │  │ User │ │ Task │ │ Tag  │ │ Conversation │ │ Message │  │ │
│  │  └──────┘ └──────┘ └──────┘ └──────────────┘ └─────────┘  │ │
│  │  (Phase 2 + Phase 3 share same database models)            │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Components | Responsibilities |
|-------|-----------|------------------|
| **1. Presentation** | Next.js ChatKit UI, Next.js Web UI | User interface, JWT storage, API calls |
| **2. API Gateway** | FastAPI, JWT middleware, CORS | Request validation, authentication, routing |
| **3. Business Logic** | OpenAI Agent, MCP Tools | Natural language processing, database operations |
| **4. Data Persistence** | PostgreSQL (Neon) | Task storage, user data, conversation history |

---

## Request Flow

### Complete Conversation Request Flow

```mermaid
sequenceDiagram
    autonumber
    participant User as User (Browser)
    participant UI as ChatKit UI
    participant API as FastAPI
    participant Auth as JWT Middleware
    participant Chat as Chat Endpoint
    participant DB as PostgreSQL
    participant Agent as OpenAI Agent
    participant Tool as MCP Tool

    User->>UI: Types message: "Add a task to buy milk"
    UI->>UI: Get JWT token from localStorage
    UI->>API: POST /api/{user_id}/chat<br/>Authorization: Bearer <token><br/>Body: {message, conversation_id}

    API->>Auth: Validate JWT token
    Auth->>Auth: Extract user_id from token
    Auth->>Auth: Verify signature & expiration
    Auth-->>API: Return user_id or 401 error

    API->>Chat: Handle chat request
    Chat->>Chat: Check user_id == token user_id<br/>(403 if mismatch)

    Chat->>DB: Load or create Conversation
    DB-->>Chat: Conversation object

    Chat->>DB: Save user message (role: USER)
    DB-->>Chat: Message saved

    Chat->>DB: Load conversation history
    DB-->>Chat: All messages (chronological)

    Chat->>Agent: call_openai_agent(user_id, history, message)
    Agent->>Agent: Understand intent: "Add task"
    Agent->>Agent: Extract parameters:<br/>title="Buy milk"
    Agent->>Tool: add_task(session, user_id, input)
    Tool->>DB: INSERT INTO task (user_id, title, ...)
    DB-->>Tool: Task created (id=42)
    Tool-->>Agent: AddTaskOutput(id=42, title="Buy milk", ...)
    Agent->>Agent: Format natural language response
    Agent-->>Chat: "I've created a task to buy milk."

    Chat->>DB: Save assistant message (role: ASSISTANT)
    DB-->>Chat: Message saved

    Chat-->>API: ChatResponse(message, conversation_id)
    API-->>UI: 200 OK: {message, conversation_id}
    UI->>UI: Display agent response
    UI->>User: Shows "I've created a task to buy milk."
```

### Request Flow Summary

**23 Steps** from user input to response:

1. **User Input**: User types natural language message
2. **JWT Retrieval**: UI gets token from localStorage
3. **HTTP Request**: POST to `/api/{user_id}/chat` with token
4-7. **Authentication**: JWT middleware validates token
8. **Authorization**: Check token user_id matches URL user_id
9-10. **Conversation Management**: Load or create conversation
11-12. **User Message Storage**: Save message to database
13-14. **History Loading**: Load full conversation context
15. **Agent Invocation**: Call OpenAI Agent with context
16-17. **Intent Understanding**: Agent parses natural language
18-19. **Tool Execution**: Agent calls MCP tool
20. **Database Operation**: Tool creates task (filtered by user_id)
21. **Tool Response**: Return structured output
22. **Natural Language Formatting**: Agent converts to friendly text
23. **Message Storage**: Save assistant response to database
24-26. **HTTP Response**: Return to frontend, display to user

### Stateless Architecture

**Key Design**: Each request is **completely independent**. Server maintains **zero in-memory session state**.

```
Request 1: "Add a task to buy milk"
    ↓
Server loads conversation history from DB
    ↓
Agent processes with full context
    ↓
Response saved to DB
    ↓
Server forgets everything (stateless)

[SERVER RESTART - No state lost]

Request 2: "Mark it as complete"  (contextual reference)
    ↓
Server loads SAME conversation history from DB
    ↓
Agent resolves "it" = "Buy milk" from history
    ↓
Response saved to DB
```

**Benefits**:
- ✅ Server restarts don't lose conversation state
- ✅ Load balancing works (any server can handle any request)
- ✅ Horizontal scaling (no sticky sessions)
- ✅ Kubernetes-friendly (pods can be killed/recreated)

---

## MCP Tool Flow

### How Agent Calls MCP Tools

```mermaid
flowchart TD
    A[User Message:<br/>'Add a task to buy milk'] --> B[OpenAI Agent Client]
    B --> C{Understand Intent}
    C --> D[Intent: Create Task]
    D --> E{Extract Parameters}
    E --> F[title: 'Buy milk'<br/>priority: MEDIUM<br/>tags: null]
    F --> G[Select MCP Tool:<br/>add_task]

    G --> H[MCP Tool: add_task]
    H --> I{Validate Input Schema<br/>Pydantic}
    I -->|Valid| J[Execute Database Query]
    I -->|Invalid| K[Return 422 Validation Error]

    J --> L{Apply User Isolation Filter<br/>WHERE user_id = ?}
    L --> M[Create Task Record]
    M --> N[Handle Tags<br/>user-scoped]
    N --> O[Return AddTaskOutput]

    O --> P[Agent Formats Response]
    P --> Q[Natural Language:<br/>'I created a task to buy milk']
    Q --> R[Return to User]

    K --> R

    style H fill:#e1f5ff
    style L fill:#ffe1e1
    style Q fill:#e1ffe1
```

### MCP Tool Invocation Pattern

```python
# Agent decides which tool to call based on intent
user_message = "Add a task to buy milk"

# Agent extracts structured data
tool_name = "add_task"  # Agent's decision
tool_input = AddTaskInput(
    title="Buy milk",
    priority=TaskPriority.MEDIUM,
    tags=None
)

# Server injects user_id from JWT token (security!)
user_id = extract_from_jwt(request.headers["Authorization"])

# Tool execution (database operation with user isolation)
result = tools[tool_name](
    session=db_session,
    user_id=user_id,  # INJECTED by server, NOT from agent
    task_input=tool_input
)

# Agent formats response as natural language
agent_response = format_response(result)
# → "I've created a task to buy milk for you."
```

### Tool Security Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Agent's Perspective                       │
│  (Agent sees ONLY task parameters, NOT user_id)             │
│                                                              │
│  Input:  {"title": "Buy milk", "priority": "MEDIUM"}        │
│  Output: {"id": 42, "title": "Buy milk", ...}               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Server's Perspective                      │
│  (Server INJECTS user_id from verified JWT token)           │
│                                                              │
│  1. Extract JWT token from Authorization header             │
│  2. Verify signature using BETTER_AUTH_SECRET                │
│  3. Extract user_id from token payload                       │
│  4. Pass user_id to tool function (agent can't control this)│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database Query (User Isolation)            │
│                                                              │
│  SELECT * FROM task                                          │
│  WHERE user_id = 'user_abc123'  -- From JWT token           │
│    AND id = 42                  -- From agent input          │
│                                                              │
│  CRITICAL: user_id controlled by SERVER, not agent          │
└─────────────────────────────────────────────────────────────┘
```

**Security Guarantee**: Even if agent is compromised or misbehaves, it **cannot access another user's data** because `user_id` is injected by the server from the verified JWT token.

---

## Data Flow (Phase 2 ↔ Phase 3)

### Monorepo Data Sharing

```
┌──────────────────────────────────────────────────────────────────┐
│                          Monorepo Architecture                    │
│                                                                    │
│  ┌────────────────────┐              ┌────────────────────┐      │
│  │   Phase 2 Web UI   │              │  Phase 3 Chatbot  │      │
│  │   (Port 3000)      │              │   (Port 3001)      │      │
│  │                    │              │                    │      │
│  │  ┌──────────────┐  │              │  ┌──────────────┐  │      │
│  │  │ Task List    │  │              │  │ Chat Window  │  │      │
│  │  │ (CRUD UI)    │  │              │  │ (Natural Lang)│  │      │
│  │  └──────┬───────┘  │              │  └──────┬───────┘  │      │
│  └─────────┼──────────┘              └─────────┼──────────┘      │
│            │                                   │                  │
│            │ REST API                          │ Chat API         │
│            │ (Structured)                      │ (Conversational) │
└────────────┼───────────────────────────────────┼──────────────────┘
             │                                   │
             ▼                                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend (Port 8000)                    │
│                                                                    │
│  ┌──────────────────────┐        ┌──────────────────────┐        │
│  │   REST Endpoints     │        │   Chat Endpoint      │        │
│  │   /api/{uid}/tasks   │        │   /api/{uid}/chat    │        │
│  │                      │        │                      │        │
│  │   CRUD operations    │        │   Natural language   │        │
│  │   (direct DB query)  │        │   (via MCP tools)    │        │
│  └─────────┬────────────┘        └─────────┬────────────┘        │
│            │                               │                      │
│            │                               │                      │
│            │     ┌─────────────────────────┘                      │
│            │     │                                                │
│            ▼     ▼                                                │
│  ┌────────────────────────────────────────────────────────┐      │
│  │              SQLModel ORM (Shared Models)              │      │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────────────┐       │      │
│  │  │ User │  │ Task │  │ Tag  │  │ Conversation │       │      │
│  │  └──────┘  └──────┘  └──────┘  └──────────────┘       │      │
│  └────────────────────┬───────────────────────────────────┘      │
└───────────────────────┼──────────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│              PostgreSQL Database (Neon - Shared)                  │
│                                                                    │
│  Tables:                                                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  user          (id, email, name, created_at)                │ │
│  │  task          (id, user_id, title, priority, status, ...)  │ │
│  │  tag           (id, user_id, name, created_at)              │ │
│  │  tasktag       (task_id, tag_id)                            │ │
│  │  conversation  (id, user_id, created_at, updated_at)        │ │
│  │  message       (id, conversation_id, user_id, role, content)│ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  All tables include user_id for isolation                         │
└──────────────────────────────────────────────────────────────────┘
```

### Real-Time Synchronization Example

**Scenario**: User adds task via chatbot, then checks web UI

```
Time    │ Action                           │ Database State
────────┼──────────────────────────────────┼───────────────────────────
00:00   │ User opens Phase 3 chatbot       │ user.tasks = []
        │                                  │
00:05   │ User: "Add task to buy milk"     │
        │ Chatbot calls add_task tool      │
00:06   │ Task inserted into database      │ user.tasks = [Task(id=42)]
        │                                  │
00:10   │ User switches to Phase 2 web UI  │
00:11   │ Web UI fetches /api/{uid}/tasks  │
00:12   │ Web UI displays task             │ Task visible (< 1 sec delay)
        │ "Buy milk" appears in list       │
────────┼──────────────────────────────────┼───────────────────────────
```

**Synchronization Guarantee**: < 1 second delay because both UIs query the **same database**.

### Data Flow Patterns

**Phase 2 → Database**:
```
Web UI → REST API → Direct SQLModel Query → PostgreSQL
(Structured CRUD operations)
```

**Phase 3 → Database**:
```
Chatbot UI → Chat API → OpenAI Agent → MCP Tool → SQLModel Query → PostgreSQL
(Natural language → Structured operations)
```

**Shared Models**:
- ✅ `User` model (Phase 2 + Phase 3 authentication)
- ✅ `Task` model (Phase 2 CRUD + Phase 3 MCP tools)
- ✅ `Tag` model (Phase 2 tags + Phase 3 tags, user-scoped)
- ✅ `Conversation` model (Phase 3 only)
- ✅ `Message` model (Phase 3 only)

---

## Component Diagram

### Backend Components

```mermaid
graph TB
    subgraph "FastAPI Application"
        Main[main.py<br/>App initialization, CORS, middleware]
        Auth[auth.py<br/>JWT verification middleware]
        Config[config.py<br/>Pydantic settings]
        DB[db.py<br/>SQLModel engine, sessions]
        Models[models.py<br/>User, Task, Tag, Conversation, Message]

        Main --> Auth
        Main --> Config
        Main --> DB
        DB --> Models

        subgraph "Routes"
            TasksRoute[tasks.py<br/>REST CRUD endpoints]
            ChatRoute[chat.py<br/>Chat endpoint]
            AuthRoute[auth.py<br/>Better Auth integration]
            TagsRoute[tags.py<br/>Tag management]

            TasksRoute --> Auth
            ChatRoute --> Auth
            AuthRoute --> Auth
            TagsRoute --> Auth
        end

        Main --> TasksRoute
        Main --> ChatRoute
        Main --> AuthRoute
        Main --> TagsRoute

        subgraph "Services"
            AgentClient[agent.py<br/>OpenAI Agent integration]
            ChatService[chat service logic]

            ChatRoute --> AgentClient
            ChatRoute --> ChatService
        end

        subgraph "MCP Server"
            MCPTools[MCP Tools]

            subgraph "Tools"
                AddTask[add_task.py]
                ListTasks[list_tasks.py]
                CompleteTask[complete_task.py]
                UpdateTask[update_task.py]
                DeleteTask[delete_task.py]
            end

            MCPTools --> AddTask
            MCPTools --> ListTasks
            MCPTools --> CompleteTask
            MCPTools --> UpdateTask
            MCPTools --> DeleteTask

            AddTask --> Models
            ListTasks --> Models
            CompleteTask --> Models
            UpdateTask --> Models
            DeleteTask --> Models
        end

        AgentClient --> MCPTools

        subgraph "Utils"
            ConvMgr[conversation_manager.py<br/>Load/save conversation history]
            Logger[logger.py<br/>Structured JSON logging]
            Circuit[circuit_breaker.py<br/>Resilience pattern]

            ChatRoute --> ConvMgr
            ChatRoute --> Logger
            AgentClient --> Circuit
        end
    end

    subgraph "Database"
        Neon[(PostgreSQL<br/>Neon)]
    end

    Models --> Neon

    style Main fill:#e1f5ff
    style Auth fill:#ffe1e1
    style MCPTools fill:#e1ffe1
    style Neon fill:#fff4e1
```

### Frontend Components

```
┌────────────────────────────────────────────────────────────┐
│                    Frontend Structure                       │
│                                                            │
│  ┌──────────────────────┐   ┌──────────────────────┐     │
│  │  Phase 2: Web UI     │   │  Phase 3: Chatbot   │     │
│  │  (frontend-web/)     │   │  (frontend-chatbot/) │     │
│  │                      │   │                      │     │
│  │  Next.js App Router  │   │  Next.js App Router  │     │
│  │  ┌────────────────┐  │   │  ┌────────────────┐  │     │
│  │  │ app/           │  │   │  │ app/           │  │     │
│  │  │  dashboard/    │  │   │  │  chat/         │  │     │
│  │  │   tasks/       │  │   │  │   page.tsx     │  │     │
│  │  │    page.tsx    │  │   │  │                │  │     │
│  │  └────────────────┘  │   │  └────────────────┘  │     │
│  │                      │   │                      │     │
│  │  ┌────────────────┐  │   │  ┌────────────────┐  │     │
│  │  │ components/    │  │   │  │ components/    │  │     │
│  │  │  TaskList.tsx  │  │   │  │  ChatWindow.tsx│  │     │
│  │  │  TaskForm.tsx  │  │   │  │  MessageList   │  │     │
│  │  └────────────────┘  │   │  └────────────────┘  │     │
│  │                      │   │                      │     │
│  │  ┌────────────────┐  │   │  ┌────────────────┐  │     │
│  │  │ lib/           │  │   │  │ lib/           │  │     │
│  │  │  api.ts        │  │   │  │  chatApi.ts    │  │     │
│  │  │  (REST client) │  │   │  │  (Chat client) │  │     │
│  │  └────────────────┘  │   │  └────────────────┘  │     │
│  │                      │   │                      │     │
│  │  Uses REST API       │   │  Uses Chat API      │     │
│  │  /api/{uid}/tasks    │   │  /api/{uid}/chat    │     │
│  └──────────────────────┘   └──────────────────────┘     │
└────────────────────────────────────────────────────────────┘
```

### Module Responsibilities

| Module | File | Responsibility |
|--------|------|----------------|
| **Application** | `main.py` | App initialization, CORS, middleware, health probes |
| **Authentication** | `auth.py` | JWT token verification, user_id extraction |
| **Configuration** | `config.py` | Environment variables, Pydantic settings validation |
| **Database** | `db.py` | SQLModel engine, session management, table creation |
| **Models** | `models.py` | Database schema (User, Task, Tag, Conversation, Message) |
| **REST Routes** | `routes/tasks.py` | CRUD endpoints for Phase 2 web UI |
| **Chat Route** | `routes/chat.py` | Natural language endpoint for Phase 3 chatbot |
| **Agent Client** | `services/agent.py` | OpenAI Agent SDK integration, tool registration |
| **MCP Tools** | `mcp/tools/*.py` | 5 tools (add, list, complete, update, delete) |
| **Conversation Mgr** | `mcp/utils/conversation_manager.py` | Load/save conversation history |
| **Structured Logger** | `mcp/utils/logger.py` | JSON logging for cloud platforms |
| **Circuit Breaker** | `mcp/utils/circuit_breaker.py` | Resilience pattern for OpenAI API calls |

---

## Security Architecture

### Authentication & Authorization Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    1. User Sign Up / Login                       │
│                      (Better Auth - Phase 2)                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    2. JWT Token Issued                           │
│                                                                   │
│  Payload:                                                        │
│  {                                                               │
│    "user_id": "user_abc123",                                     │
│    "email": "user@example.com",                                  │
│    "exp": 1735324800,  // Expiration (1 hour)                   │
│    "iat": 1735321200   // Issued at                             │
│  }                                                               │
│                                                                   │
│  Signed with: BETTER_AUTH_SECRET (HS256)                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                 3. Client Stores Token                           │
│                   (localStorage or httpOnly cookie)              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              4. Client Attaches Token to Requests                │
│                                                                   │
│  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│               5. Server Verifies Token (JWT Middleware)          │
│                                                                   │
│  Step 1: Extract token from Authorization header                │
│  Step 2: Verify signature using BETTER_AUTH_SECRET               │
│  Step 3: Check expiration timestamp                              │
│  Step 4: Extract user_id from payload                            │
│  Step 5: Return user_id or raise 401 Unauthorized                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│               6. Authorization Check (Route Handler)             │
│                                                                   │
│  if user_id != current_user:                                     │
│      raise HTTPException(403, "Access denied")                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│            7. Database Query (User Isolation Filter)             │
│                                                                   │
│  SELECT * FROM task                                              │
│  WHERE user_id = 'user_abc123'  -- From JWT token               │
│                                                                   │
│  CRITICAL: Always filter by user_id from token                   │
└─────────────────────────────────────────────────────────────────┘
```

### Defense in Depth

**Layer 1: Network Security**
- CORS middleware (only allows `FRONTEND_URL`)
- HTTPS enforced (production)

**Layer 2: Authentication**
- JWT token verification (HS256 signature)
- Token expiration check (1-hour TTL)
- BETTER_AUTH_SECRET stored in environment (not in code)

**Layer 3: Authorization**
- URL user_id vs token user_id match check
- Returns 403 Forbidden on mismatch

**Layer 4: Data Access**
- All database queries filter by `user_id` from token
- User-scoped tags (same name, different users)
- Cannot query another user's data

**Layer 5: Error Messages**
- "Task not found" instead of "Access denied" (prevents enumeration)
- Generic error messages (don't leak internal details)

---

## Deployment Architecture

### Kubernetes Deployment

```
┌─────────────────────────────────────────────────────────────────┐
│                      Kubernetes Cluster                          │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                       Ingress                               │ │
│  │  (HTTPS Termination, Load Balancing)                        │ │
│  └────────┬───────────────────────────┬─────────────────────── │ │
│           │                           │                          │
│           ▼                           ▼                          │
│  ┌─────────────────┐        ┌─────────────────┐                │
│  │  Frontend Pod   │        │  Frontend Pod   │                │
│  │  (Chatbot UI)   │        │  (Web UI)       │                │
│  │  Port 3001      │        │  Port 3000      │                │
│  └────────┬────────┘        └────────┬────────┘                │
│           │                           │                          │
│           └───────────┬───────────────┘                          │
│                       │                                          │
│                       ▼                                          │
│           ┌─────────────────────────┐                           │
│           │   Backend Service       │                           │
│           │   (ClusterIP)           │                           │
│           └────────┬────────────────┘                           │
│                    │                                             │
│        ┌───────────┼───────────┐                                │
│        ▼           ▼           ▼                                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                           │
│  │Backend  │ │Backend  │ │Backend  │                           │
│  │Pod 1    │ │Pod 2    │ │Pod 3    │                           │
│  │Port 8000│ │Port 8000│ │Port 8000│                           │
│  └────┬────┘ └────┬────┘ └────┬────┘                           │
│       │           │           │                                 │
│       │ Liveness: /health    │                                 │
│       │ Readiness: /ready    │                                 │
│       └───────────┼───────────┘                                 │
└───────────────────┼─────────────────────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  PostgreSQL (Neon)    │
        │  (Serverless, External)│
        └───────────────────────┘
```

### Health Probes

**Liveness Probe** (`/health`):
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 10
  periodSeconds: 30
  timeoutSeconds: 5
  failureThreshold: 3
```

**Readiness Probe** (`/ready`):
```yaml
readinessProbe:
  httpGet:
    path: /ready
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 10
  timeoutSeconds: 2
  successThreshold: 1
  failureThreshold: 3
```

### Graceful Shutdown

```python
# Lifespan context manager in main.py
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database
    create_tables()

    yield  # Server running

    # Shutdown: Wait for active requests (max 30s)
    engine.dispose()  # Close database connections
```

**Shutdown Flow**:
1. Kubernetes sends `SIGTERM` signal
2. FastAPI stops accepting new requests
3. Waits for active requests to complete (max 30s)
4. Closes database connections
5. Pod terminated

---

## Technology Stack

### Backend Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Web Framework** | FastAPI | 0.109+ | High-performance async API |
| **ASGI Server** | Uvicorn | 0.27+ | Production ASGI server |
| **ORM** | SQLModel | 0.0.16+ | Type-safe database ORM |
| **Database** | PostgreSQL | 15+ | Primary data store (Neon) |
| **DB Driver** | psycopg | 3.2+ | PostgreSQL adapter (binary) |
| **Authentication** | PyJWT | 2.8+ | JWT token verification |
| **AI Agent** | OpenAI SDK | 1.40+ | Agents API integration |
| **Token Counting** | tiktoken | 0.7+ | Conversation context management |
| **Validation** | Pydantic | 2.x | Request/response validation |
| **Testing** | pytest | 7.4+ | Unit/integration/E2E tests |
| **Code Quality** | black, flake8, mypy | Latest | Formatting, linting, type checking |
| **Logging** | python-json-logger | 2.0+ | Structured JSON logging |

### Frontend Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | Next.js | 14.0+ | React framework with SSR |
| **Runtime** | Node.js | 18.0+ | JavaScript runtime |
| **Package Manager** | npm | 9.0+ | Dependency management |
| **Language** | TypeScript | 5.3+ | Type-safe JavaScript |
| **Linting** | ESLint | 8.56+ | Code quality |
| **Formatting** | Prettier | 3.2+ | Code formatting |

### Infrastructure Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Database** | Neon PostgreSQL | Serverless PostgreSQL (shared Phase 2 + 3) |
| **Container** | Docker | Application containerization |
| **Orchestration** | Kubernetes | Container orchestration (optional) |
| **CI/CD** | GitHub Actions | Automated testing and deployment |
| **Monitoring** | Structured Logs | JSON logs for cloud platforms |

---

## Architecture Principles

### 1. Stateless Design (Constitution Section II)

**Principle**: No in-memory session state. All state persisted in database.

**Implementation**:
- Conversation history stored in PostgreSQL `message` table
- Each request loads full conversation context from database
- Server restarts don't lose conversation state
- Load balancing works (any pod can handle any request)

### 2. User Isolation (Constitution Section IX)

**Principle**: Users can only access their own data.

**Implementation**:
- JWT token provides authenticated `user_id`
- All database queries filter by `user_id`
- Tags are user-scoped (same name, different owners)
- URL `user_id` must match token `user_id` (403 if mismatch)

### 3. Cloud-Native Architecture (Constitution Section XIV)

**Principle**: Kubernetes-ready with health probes and graceful shutdown.

**Implementation**:
- Liveness probe: `/health` (fast, no dependencies)
- Readiness probe: `/ready` (checks database)
- Graceful shutdown: Wait for active requests (max 30s)
- Structured JSON logging (cloud platform friendly)

### 4. Resilience (Constitution Section XVI)

**Principle**: Graceful degradation when dependencies fail.

**Implementation**:
- Circuit breaker for OpenAI API calls (opens after 5 failures)
- User message saved BEFORE calling OpenAI (preserves context)
- Fallback to Phase 2 web UI if chatbot unavailable
- Detailed error messages with recovery suggestions

### 5. Monorepo Sharing (Constitution Section XVII)

**Principle**: Share database and models between Phase 2 and Phase 3.

**Implementation**:
- Same PostgreSQL database (Neon)
- Shared SQLModel models (User, Task, Tag)
- Phase 3 adds Conversation + Message models
- Real-time synchronization (< 1 second delay)

---

## Conclusion

Phase 3 architecture combines **natural language processing** (OpenAI Agents), **secure multi-tenancy** (JWT + user isolation), and **cloud-native design** (stateless, health probes, graceful shutdown) to deliver a production-ready AI chatbot.

**Key Architectural Decisions**:
- ✅ **Stateless**: No in-memory sessions (Kubernetes-friendly)
- ✅ **Monorepo**: Share database with Phase 2 (DRY principle)
- ✅ **MCP Tools**: Modular design (5 independent tools)
- ✅ **User Isolation**: Server-injected user_id (security)
- ✅ **Resilience**: Circuit breaker + graceful degradation

**Next Steps**:
- Deploy to Kubernetes with Helm charts
- Add monitoring (Prometheus metrics)
- Implement caching (Redis for conversation history)
- Add more MCP tools (search, analytics, etc.)

---

**Architecture Documentation Complete** ✅
**Last Updated**: 2025-12-26
**Version**: 3.0.0 (Phase 3: AI Chatbot with MCP Architecture)
