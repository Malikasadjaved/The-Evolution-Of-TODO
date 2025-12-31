# Quickstart Guide: AI Chatbot with MCP Architecture

**Phase 3 Todo Application - Natural Language Task Management**

Get up and running with the AI-powered chatbot in 15 minutes.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Overview](#project-overview)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Running the Application](#running-the-application)
6. [Testing the Chatbot](#testing-the-chatbot)
7. [Troubleshooting](#troubleshooting)
8. [Next Steps](#next-steps)

---

## Prerequisites

Before starting, ensure you have the following installed:

### Required Software

| Software | Version | Check Command | Install URL |
|----------|---------|---------------|-------------|
| **Python** | 3.11+ | `python --version` | https://www.python.org/downloads/ |
| **Node.js** | 18.0+ | `node --version` | https://nodejs.org/ |
| **npm** | 9.0+ | `npm --version` | (Included with Node.js) |
| **Git** | Latest | `git --version` | https://git-scm.com/ |

### Required Accounts & API Keys

1. **PostgreSQL Database** (Choose one):
   - **Neon** (Recommended - Free serverless PostgreSQL): https://neon.tech/
   - **Local PostgreSQL**: https://www.postgresql.org/download/
   - **Supabase**: https://supabase.com/

2. **OpenAI API Key**:
   - Sign up: https://platform.openai.com/
   - Create API key: https://platform.openai.com/api-keys
   - **Cost**: ~$0.01-0.05 per conversation (GPT-4o pricing)

3. **Better Auth Secret** (Generated locally):
   - Will generate in setup steps below

---

## Project Overview

This is a **monorepo** containing Phase 2 (Web UI) and Phase 3 (AI Chatbot):

```
To-do-app/  (Monorepo Root)
├── backend/              # Shared FastAPI backend
│   ├── src/api/          # REST API (Phase 2) + Chat API (Phase 3)
│   ├── mcp/              # MCP Server with 5 tools (Phase 3)
│   ├── tests/            # Unit, integration, E2E tests
│   ├── alembic/          # Database migrations
│   ├── requirements.txt  # Base Python dependencies
│   └── requirements-phase3.txt  # Phase 3 dependencies (OpenAI, etc.)
│
├── frontend-web/         # Phase 2: Next.js Web UI (Port 3000)
├── frontend-chatbot/     # Phase 3: Next.js Chatbot UI (Port 3001)
│
├── specs/
│   ├── 001-fullstack-web-app/   # Phase 2 spec
│   └── 002-ai-chatbot-mcp/      # Phase 3 spec ← YOU ARE HERE
│
└── .specify/memory/
    ├── phase-2-constitution.md  # Phase 2 principles
    └── phase-3-constitution.md  # Phase 3 principles
```

**Architecture**: Monorepo ensures shared database models, authentication, and deployment.

---

## Backend Setup

### Step 1: Clone Repository

```bash
# Clone the repository
git clone <repository-url>
cd To-do-app

# Checkout the Phase 3 branch
git checkout 002-ai-chatbot-mcp
```

### Step 2: Create Python Virtual Environment

```bash
cd backend

# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

**Verify activation**: Your terminal prompt should show `(venv)`.

### Step 3: Install Python Dependencies

```bash
# Install base dependencies (Phase 2 + shared)
pip install --upgrade pip
pip install -r requirements.txt

# Install Phase 3 dependencies (OpenAI Agents SDK, tiktoken, etc.)
pip install -r requirements-phase3.txt
```

**Expected packages** (50+ total):
- FastAPI, Uvicorn (Web framework)
- SQLModel, psycopg (Database ORM + PostgreSQL driver)
- PyJWT (Authentication)
- OpenAI, tiktoken (AI Agents SDK)
- pytest, pytest-cov (Testing)
- black, flake8, mypy (Code quality)

### Step 4: Configure Environment Variables

```bash
# Copy environment template
cp .env.example .env
```

**Edit `.env` file** with your credentials:

```bash
# ============================================
# CRITICAL: JWT Secret (Generate first!)
# ============================================
# Generate with: python -c "import secrets; print(secrets.token_urlsafe(32))"
BETTER_AUTH_SECRET=<YOUR-43-CHARACTER-SECRET>

# ============================================
# Database (Choose one)
# ============================================
# Option 1: Neon (Recommended - Serverless PostgreSQL)
DATABASE_URL=postgresql://<user>:<password>@<neon-host>/<database>?sslmode=require

# Option 2: Local PostgreSQL
# DATABASE_URL=postgresql://postgres:password@localhost:5432/todo_db

# ============================================
# OpenAI API Key
# ============================================
OPENAI_API_KEY=sk-proj-<YOUR-OPENAI-API-KEY>

# ============================================
# Server Configuration (Defaults)
# ============================================
HOST=0.0.0.0
PORT=8000
FRONTEND_URL=http://localhost:3001  # Chatbot frontend port
ENVIRONMENT=development

# ============================================
# Advanced Configuration (Optional)
# ============================================
MAX_CONTEXT_TOKENS=8000  # Conversation context limit
# CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
# CIRCUIT_BREAKER_TIMEOUT_SECONDS=60
```

**How to generate `BETTER_AUTH_SECRET`:**

```bash
# Run in terminal (requires Python)
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Example output (43 characters):
# EWNhWQFikqssCNiZtGZrUVK32lnGWoobrM9ttp8ezE8
```

**Where to get `DATABASE_URL`:**

**Neon (Recommended):**
1. Sign up at https://neon.tech/
2. Create a new project
3. Copy connection string from dashboard (format: `postgresql://user:password@host/database?sslmode=require`)

**Local PostgreSQL:**
```bash
# Install PostgreSQL
# Create database
createdb todo_db

# Connection string
DATABASE_URL=postgresql://postgres:your-password@localhost:5432/todo_db
```

### Step 5: Run Database Migrations

```bash
# Initialize Alembic (first time only)
alembic upgrade head

# Create tables (alternative if Alembic not used)
python -c "from src.api.db import create_tables; create_tables()"
```

**Verify migration**: Check your Neon/PostgreSQL dashboard - you should see 5 tables created:
- `user`
- `task`
- `tag`
- `tasktag`
- `conversation`
- `message`

### Step 6: Verify Backend Installation

```bash
# Run tests to verify setup
pytest tests/ -v

# Expected output: ~117 tests passing

# Check code quality
black src/ tests/ --check
flake8 src/ tests/
mypy src/
```

---

## Frontend Setup

### Step 1: Navigate to Frontend Directory

```bash
# From project root
cd frontend-chatbot
```

### Step 2: Install Node.js Dependencies

```bash
# Install all packages from package.json
npm install

# Expected packages (100+ including dev dependencies):
# - next, react, react-dom (Framework)
# - typescript, @types/* (TypeScript support)
# - eslint, prettier (Code quality)
```

**Verify installation**:
```bash
npm list --depth=0

# Should show:
# - next@14.0.0
# - react@18.2.0
# - typescript@5.3.3
```

### Step 3: Configure Frontend Environment (Optional)

Create `frontend-chatbot/.env.local` if you need custom API URL:

```bash
# Default (works if backend runs on localhost:8000)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Note**: Frontend chatbot runs on port **3001** (Phase 2 web UI uses 3000).

### Step 4: Verify Frontend Installation

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Format check
npm run format -- --check
```

---

## Running the Application

### Option 1: Run Backend and Frontend Separately (Development)

**Terminal 1 - Backend:**
```bash
cd backend
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

uvicorn src.api.main:app --reload --port 8000
```

**Terminal 2 - Frontend Chatbot:**
```bash
cd frontend-chatbot
npm run dev
```

**Access the application:**
- **Frontend Chatbot UI**: http://localhost:3001
- **Backend API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### Option 2: Run with Docker Compose (Production-like)

```bash
# From project root
docker-compose up --build

# Access same URLs as above
```

---

## Testing the Chatbot

### 1. Sign Up / Log In

**Phase 3 uses Better Auth** (shared with Phase 2):

1. Open http://localhost:3001
2. Click "Sign Up" → Create account with email/password
3. You'll receive a JWT token (stored in browser localStorage)

### 2. Start a Conversation

**Try these natural language commands:**

#### Add Tasks
```
User: "Add a task to buy groceries"
Agent: "I've created a task to buy groceries for you."

User: "Add a high priority task: Finish hackathon project by Friday"
Agent: "I've added a high priority task with due date Friday."
```

#### List Tasks
```
User: "Show me my tasks"
Agent: "You have 2 tasks: 1. Buy groceries (pending), 2. Finish hackathon project (pending, HIGH priority, due Friday)"

User: "What are my high priority tasks?"
Agent: "You have 1 high priority task: Finish hackathon project (due Friday)"
```

#### Update Tasks
```
User: "Mark the groceries task as complete"
Agent: "I've marked 'Buy groceries' as complete."

User: "Change the hackathon project priority to medium"
Agent: "I've updated the task priority to MEDIUM."
```

#### Delete Tasks
```
User: "Delete the groceries task"
Agent: "I've deleted the task 'Buy groceries'."
```

#### Context-Aware Conversations
```
User: "Show my tasks"
Agent: "You have 2 tasks: 1. Buy milk, 2. Write report"

User: "Complete the first one"  # Agent resolves "the first one" = Buy milk
Agent: "I've marked 'Buy milk' as complete."
```

### 3. Verify Database State

**Check PostgreSQL/Neon Dashboard:**
- Tasks appear in `task` table
- Conversations appear in `conversation` table
- Messages appear in `message` table (USER and ASSISTANT roles)

**Or query via API:**
```bash
# Get JWT token from browser localStorage (F12 → Application → Local Storage)
TOKEN="<your-jwt-token>"

# List tasks via REST API
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/<user-id>/tasks
```

### 4. Test Advanced Features

**Multi-tool chaining:**
```
User: "Add a task to call Mom and show me all my tasks"
Agent: (Calls add_task → list_tasks in sequence)
```

**Error recovery:**
```
User: "Complete the task 'Nonexistent Task'"
Agent: "I couldn't find a task with that title. Could you try listing your tasks first?"

User: "Add a task to buy milk"
Agent: "I've created the task for you."  # System recovered
```

**Conversation persistence (stateless architecture):**
```
# Restart backend server (Ctrl+C, then uvicorn again)
# Continue same conversation by providing conversation_id
User: "Mark it as complete"  # "it" refers to task from before restart
Agent: (Loads conversation history from DB, resolves context)
```

---

## Troubleshooting

### Backend Issues

#### 1. `ModuleNotFoundError: No module named 'fastapi'`

**Cause**: Virtual environment not activated or dependencies not installed.

**Fix**:
```bash
cd backend
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

pip install -r requirements.txt -r requirements-phase3.txt
```

#### 2. `pydantic.errors.PydanticUserError: BETTER_AUTH_SECRET must be at least 32 characters`

**Cause**: Missing or short JWT secret in `.env`.

**Fix**:
```bash
# Generate new secret
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Copy output to .env file
BETTER_AUTH_SECRET=<generated-secret>
```

#### 3. `psycopg.OperationalError: connection to server failed`

**Cause**: Incorrect `DATABASE_URL` or database not running.

**Fix (Neon)**:
- Verify connection string from Neon dashboard
- Ensure `?sslmode=require` is appended
- Check Neon project is not paused

**Fix (Local PostgreSQL)**:
```bash
# Check PostgreSQL is running
pg_ctl status  # macOS/Linux
# Windows: Check Services → PostgreSQL

# Test connection
psql -U postgres -d todo_db

# If database doesn't exist
createdb todo_db
```

#### 4. `openai.error.AuthenticationError: Invalid API key`

**Cause**: Missing or incorrect OpenAI API key in `.env`.

**Fix**:
- Get API key from https://platform.openai.com/api-keys
- Ensure key starts with `sk-proj-` or `sk-`
- Check for trailing spaces in `.env` file

```bash
OPENAI_API_KEY=sk-proj-<YOUR-KEY-HERE>  # No quotes, no spaces
```

#### 5. `alembic.util.exc.CommandError: Can't locate revision`

**Cause**: Alembic not initialized or migrations not run.

**Fix**:
```bash
cd backend

# Run migrations
alembic upgrade head

# If that fails, create tables manually
python -c "from src.api.db import create_tables; create_tables()"
```

#### 6. Tests failing with `401 Unauthorized`

**Cause**: JWT token expired or incorrect secret.

**Fix**:
- Tests generate fresh tokens automatically
- Ensure `BETTER_AUTH_SECRET` in `.env` matches test fixtures

```bash
# Run tests with verbose output
pytest tests/ -v --tb=short
```

### Frontend Issues

#### 1. `Error: Cannot find module 'next'`

**Cause**: Node modules not installed.

**Fix**:
```bash
cd frontend-chatbot
npm install
```

#### 2. `Port 3001 is already in use`

**Cause**: Another process is using port 3001.

**Fix**:
```bash
# Windows - Find and kill process
netstat -ano | findstr :3001
taskkill /PID <process-id> /F

# macOS/Linux
lsof -ti:3001 | xargs kill -9

# Or use different port
npm run dev -- -p 3002
```

#### 3. `Failed to fetch from http://localhost:8000/api/...`

**Cause**: Backend not running or CORS issue.

**Fix**:
- Ensure backend is running: `uvicorn src.api.main:app --reload --port 8000`
- Check `FRONTEND_URL=http://localhost:3001` in backend `.env`
- Verify backend logs show CORS middleware loaded

### Database Issues

#### 1. "Table 'task' already exists" error

**Cause**: Running migrations multiple times.

**Fix**:
```bash
# Check current revision
alembic current

# Downgrade and re-run
alembic downgrade base
alembic upgrade head
```

#### 2. "Conversation not found" error

**Cause**: Frontend sending invalid `conversation_id`.

**Fix**:
- Clear browser localStorage (F12 → Application → Local Storage → Clear)
- Start new conversation (don't pass `conversation_id` in request)

#### 3. Slow database queries

**Cause**: Missing indexes or large conversation history.

**Fix**:
- Check Neon dashboard for slow queries
- Consider adding indexes on `user_id`, `conversation_id` columns
- Implement pagination for large conversation histories

### OpenAI API Issues

#### 1. `openai.error.RateLimitError: Rate limit exceeded`

**Cause**: Too many API calls in short time.

**Fix**:
- Wait 60 seconds before retrying
- Implement exponential backoff (already in `CircuitBreaker` class)
- Upgrade OpenAI account tier

#### 2. `openai.error.Timeout: Request timed out`

**Cause**: OpenAI API slow response.

**Fix**:
- Retry request (circuit breaker handles this automatically)
- Check OpenAI status: https://status.openai.com/

#### 3. High OpenAI costs

**Monitor usage**:
- OpenAI Dashboard: https://platform.openai.com/usage
- Typical cost: $0.01-0.05 per conversation
- Reduce `MAX_CONTEXT_TOKENS` in `.env` to lower costs

---

## Next Steps

### Explore Phase 3 Features

1. **Read the Architecture**:
   - Spec: `specs/002-ai-chatbot-mcp/spec.md`
   - Constitution: `.specify/memory/phase-3-constitution.md`
   - Plan: `specs/002-ai-chatbot-mcp/plan.md`

2. **Understand MCP Tools**:
   - Code: `backend/mcp/tools/`
   - 5 tools: `add_task`, `list_tasks`, `update_task`, `complete_task`, `delete_task`

3. **Run Tests**:
   ```bash
   # Unit tests (MCP tools, conversation manager, circuit breaker)
   pytest tests/unit/ -v

   # Integration tests (chat endpoint, agent client)
   pytest tests/integration/ -v

   # E2E tests (full conversation flows)
   pytest tests/e2e/ -v

   # Coverage report (target: ≥85%)
   pytest --cov=src/api --cov=mcp --cov-report=html
   open htmlcov/index.html
   ```

4. **Test Resilience**:
   - Circuit Breaker: Force 5 consecutive failures to open circuit
   - Graceful Degradation: Test with OpenAI API down (fallback to web UI)
   - Stateless Architecture: Restart backend mid-conversation, verify context preserved

### Development Workflow

1. **Make Changes**:
   ```bash
   # Format code
   black src/ tests/

   # Lint
   flake8 src/ tests/

   # Type check
   mypy src/
   ```

2. **Run Tests**:
   ```bash
   pytest tests/ -v
   ```

3. **Commit with PHR**:
   ```bash
   git add .
   git commit -m "feat: Add conversation export feature"
   # PHR automatically created in history/prompts/002-ai-chatbot-mcp/
   ```

### Deploy to Production

See deployment guide in `specs/002-ai-chatbot-mcp/deployment.md` (coming soon).

**Recommended platforms**:
- **Backend**: Railway, Render, Fly.io
- **Frontend**: Vercel, Netlify
- **Database**: Neon (serverless PostgreSQL)

---

## Support & Resources

### Documentation

- **Phase 3 Spec**: `specs/002-ai-chatbot-mcp/spec.md`
- **Phase 3 Constitution**: `.specify/memory/phase-3-constitution.md`
- **API Documentation**: http://localhost:8000/docs (Swagger UI)
- **Phase 2 Quickstart**: `specs/001-fullstack-web-app/quickstart.md`

### External Resources

- **OpenAI Agents SDK**: https://platform.openai.com/docs/guides/agents
- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **Next.js Documentation**: https://nextjs.org/docs
- **Neon Documentation**: https://neon.tech/docs
- **MCP Protocol Spec**: https://modelcontextprotocol.io/

### Community

- **GitHub Issues**: (Add your repository URL)
- **Discord**: (Add your Discord invite)
- **Email Support**: (Add your email)

---

## Congratulations! 🎉

You've successfully set up the Phase 3 AI Chatbot with MCP Architecture!

**What you've accomplished**:
✅ Installed Python, Node.js, and all dependencies
✅ Configured PostgreSQL database (Neon or local)
✅ Set up OpenAI API integration
✅ Ran database migrations
✅ Started backend API server
✅ Started frontend chatbot UI
✅ Tested natural language task management

**Next**: Try advanced features like multi-tool chaining, context retention, and error recovery. Happy hacking! 🚀
