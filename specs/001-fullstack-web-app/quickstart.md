# Quickstart Guide: Full-Stack Web Application

**Feature**: Phase 2 Full-Stack Web Application
**Date**: 2025-12-15
**Branch**: `001-fullstack-web-app`
**Phase**: 1 (Design)

## Purpose

This guide provides step-by-step instructions to set up and run the full-stack web application locally for development.

**Prerequisites**:
- Python 3.11+ installed
- Node.js 18+ and npm installed
- PostgreSQL 15+ installed (or Neon account)
- Git installed

**Estimated Setup Time**: 15-20 minutes

---

## Quick Start (TL;DR)

```bash
# 1. Clone repository
git clone <repo-url>
cd To-do-app
git checkout 001-fullstack-web-app

# 2. Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your secrets
uvicorn src.api.main:app --reload --port 8000

# 3. Frontend setup (new terminal)
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local with your secrets
npm run dev

# 4. Access
# Backend: http://localhost:8000
# Frontend: http://localhost:3000
```

---

## Step 1: Prerequisites Installation

### 1.1 Install Python 3.11+

**Windows**:
```bash
# Download from https://www.python.org/downloads/
# Check version
python --version
```

**macOS** (using Homebrew):
```bash
brew install python@3.11
python3.11 --version
```

**Linux** (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install python3.11 python3.11-venv python3-pip
python3.11 --version
```

### 1.2 Install Node.js 18+

**Windows/macOS**:
```bash
# Download from https://nodejs.org/ (LTS version)
# Check version
node --version
npm --version
```

**Linux** (Ubuntu/Debian):
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version
```

### 1.3 Install PostgreSQL

**Option A: Local PostgreSQL**

**Windows**:
```bash
# Download from https://www.postgresql.org/download/windows/
# Install and note your password
```

**macOS** (using Homebrew):
```bash
brew install postgresql@15
brew services start postgresql@15
createdb todo_db
```

**Linux** (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb todo_db
```

**Option B: Neon Serverless (Recommended for Development)**

1. Go to https://neon.tech/
2. Sign up for free account
3. Create new project "todo-app"
4. Create database "todo_db"
5. Copy connection string (looks like: `postgresql://user:password@host:port/todo_db`)

---

## Step 2: Backend Setup

### 2.1 Navigate to Backend Directory

```bash
cd backend
```

### 2.2 Create Python Virtual Environment

**Windows**:
```bash
python -m venv venv
venv\Scripts\activate
```

**macOS/Linux**:
```bash
python3.11 -m venv venv
source venv/bin/activate
```

You should see `(venv)` in your terminal prompt.

### 2.3 Install Python Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**Expected dependencies**:
- FastAPI 0.109+
- SQLModel 0.0.14+
- PyJWT (JWT verification)
- psycopg2-binary (PostgreSQL driver)
- python-dotenv (environment variables)
- uvicorn (ASGI server)
- pytest + pytest-asyncio (testing)

### 2.4 Configure Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` file:
```bash
# CRITICAL: Must be at least 32 characters
# Generate with: python -c "import secrets; print(secrets.token_urlsafe(32))"
BETTER_AUTH_SECRET=your-32-character-secret-here-abc123xyz

# PostgreSQL connection string
# Local: postgresql://user:password@localhost:5432/todo_db
# Neon: postgresql://user:password@host:port/todo_db (from Neon dashboard)
DATABASE_URL=postgresql://user:password@localhost:5432/todo_db

# API server configuration
HOST=0.0.0.0
PORT=8000

# CORS allowed origin (frontend URL)
FRONTEND_URL=http://localhost:3000
```

**Generate Secret**:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the output and paste into `BETTER_AUTH_SECRET`.

### 2.5 Initialize Database

```bash
# Option 1: Using Python REPL
python
>>> from src.api.db import create_tables
>>> create_tables()
>>> exit()

# Option 2: Using script (if provided)
python scripts/init_db.py
```

This creates all tables (users, tasks, tags, task_tags) in PostgreSQL.

### 2.6 Run Backend Server

```bash
uvicorn src.api.main:app --reload --port 8000
```

**Expected output**:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using StatReload
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Verify backend is running**:
- Open browser: http://localhost:8000/health
- Expected response: `{"status":"healthy","timestamp":"2025-12-15T..."}`

**API Documentation**:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 2.7 Run Backend Tests (Optional)

In a new terminal (with venv activated):
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
pytest
```

**Expected**:
- 60%+ overall coverage
- 100% coverage for auth, CRUD, user isolation tests

---

## Step 3: Frontend Setup

### 3.1 Navigate to Frontend Directory

Open a **new terminal** (keep backend running):
```bash
cd frontend
```

### 3.2 Install Node Dependencies

```bash
npm install
```

**Expected dependencies**:
- Next.js 16+
- React 19+
- TypeScript 5.x
- Tailwind CSS 3.4+
- Better Auth (authentication)
- React Query (TanStack Query)
- Zod (validation)
- Jest + React Testing Library (testing)

### 3.3 Configure Environment Variables

Copy the example environment file:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` file:
```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# CRITICAL: Must match backend BETTER_AUTH_SECRET
BETTER_AUTH_SECRET=your-32-character-secret-here-abc123xyz

# Better Auth configuration
BETTER_AUTH_URL=http://localhost:3000/api/auth
```

**IMPORTANT**: Use the **SAME secret** as backend `.env` file.

### 3.4 Run Frontend Development Server

```bash
npm run dev
```

**Expected output**:
```
   ▲ Next.js 16.0.0
   - Local:        http://localhost:3000
   - Network:      http://192.168.1.x:3000

 ✓ Ready in 2.3s
```

**Verify frontend is running**:
- Open browser: http://localhost:3000
- You should see the landing page

### 3.5 Run Frontend Tests (Optional)

In a new terminal:
```bash
cd frontend
npm test
```

**Run with coverage**:
```bash
npm test -- --coverage
```

---

## Step 4: Verify Full Integration

### 4.1 Sign Up for New Account

1. Open http://localhost:3000/signup
2. Enter email, password, name
3. Click "Sign Up"
4. Better Auth creates user account + issues JWT token
5. Redirected to dashboard (http://localhost:3000/dashboard)

### 4.2 Create a Test Task

1. On dashboard, click "New Task"
2. Fill form:
   - Title: "Test my todo app"
   - Description: "Verify full-stack integration works"
   - Priority: HIGH
   - Due Date: Tomorrow
   - Tags: "Work"
3. Click "Create Task"
4. Task appears in list with HIGH priority badge

### 4.3 Verify JWT Authentication

1. Open browser DevTools (F12)
2. Go to Network tab
3. Create/update a task
4. Find API request (e.g., POST /api/{user_id}/tasks)
5. Check Request Headers:
   - Should see: `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
6. Check Response: 201 Created with task data

### 4.4 Verify User Isolation (Security Test)

1. While logged in as User A, copy your user_id from URL (e.g., `/dashboard` shows user_id)
2. Open browser console (F12)
3. Run:
   ```javascript
   fetch('http://localhost:8000/api/OTHER_USER_ID/tasks', {
     headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') }
   }).then(r => r.json()).then(console.log)
   ```
4. Expected response: `{ "detail": "Access denied: You can only access your own tasks" }` (403 Forbidden)
5. ✅ **User isolation working**: User A cannot access User B's tasks

---

## Step 5: Development Workflow

### 5.1 Running Both Services

Keep **two terminals** open:

**Terminal 1 - Backend**:
```bash
cd backend
source venv/bin/activate
uvicorn src.api.main:app --reload --port 8000
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

### 5.2 Making Code Changes

**Backend** (src/api/):
- Edit Python files
- Uvicorn auto-reloads on save (watch for reload message)
- Test: http://localhost:8000/docs

**Frontend** (app/, components/, lib/):
- Edit TypeScript/TSX files
- Next.js Fast Refresh updates browser immediately
- No manual refresh needed

### 5.3 Database Changes

**Add new field to Task model**:
1. Edit `backend/src/api/models.py`
2. Update SQLModel class (e.g., add `is_archived: bool = Field(default=False)`)
3. Drop and recreate tables (development only):
   ```python
   python
   >>> from src.api.db import engine
   >>> from sqlmodel import SQLModel
   >>> SQLModel.metadata.drop_all(engine)
   >>> SQLModel.metadata.create_all(engine)
   ```
4. For production, use Alembic migrations

### 5.4 API Changes

**Add new endpoint**:
1. Define route in `backend/src/api/routes/tasks.py`
2. Update `frontend/types/api.ts` with new types
3. Add method to `frontend/lib/api.ts`
4. Run `api_contract_validator` agent to verify alignment

---

## Step 6: Testing

### 6.1 Backend Unit Tests

```bash
cd backend
source venv/bin/activate
pytest -v
```

**Run specific test file**:
```bash
pytest tests/test_auth.py -v
```

**Run with coverage**:
```bash
pytest --cov=src/api --cov-report=html
open htmlcov/index.html  # View coverage report
```

### 6.2 Frontend Component Tests

```bash
cd frontend
npm test
```

**Run specific test file**:
```bash
npm test TaskItem.test.tsx
```

**Run in watch mode**:
```bash
npm test -- --watch
```

### 6.3 Integration Tests

```bash
# Backend integration tests
cd backend
pytest tests/test_tasks.py -v

# Frontend API client tests
cd frontend
npm test lib/api.test.ts
```

---

## Step 7: Deployment (Production)

### 7.1 Backend Deployment (Render, Railway, etc.)

**Environment Variables** (set in hosting platform):
```bash
BETTER_AUTH_SECRET=<production-secret-32-chars>
DATABASE_URL=<neon-production-connection-string>
FRONTEND_URL=https://yourdomain.com
```

**Build Command**:
```bash
pip install -r requirements.txt
```

**Start Command**:
```bash
uvicorn src.api.main:app --host 0.0.0.0 --port $PORT
```

### 7.2 Frontend Deployment (Vercel, Netlify, etc.)

**Environment Variables**:
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
BETTER_AUTH_SECRET=<production-secret-32-chars>
BETTER_AUTH_URL=https://yourdomain.com/api/auth
```

**Build Command**:
```bash
npm run build
```

**Start Command**:
```bash
npm start
```

---

## Troubleshooting

### Backend Issues

**Error**: `ModuleNotFoundError: No module named 'fastapi'`
- **Fix**: Activate venv and run `pip install -r requirements.txt`

**Error**: `BETTER_AUTH_SECRET must be at least 32 characters`
- **Fix**: Generate new secret: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
- Add to `.env` file

**Error**: `could not connect to server: Connection refused`
- **Fix**: Start PostgreSQL service:
  - macOS: `brew services start postgresql@15`
  - Linux: `sudo systemctl start postgresql`
  - Windows: Start PostgreSQL from Services

**Error**: `relation "tasks" does not exist`
- **Fix**: Initialize database tables:
  ```python
  python
  >>> from src.api.db import create_tables
  >>> create_tables()
  ```

### Frontend Issues

**Error**: `Module not found: Can't resolve '@/lib/api'`
- **Fix**: Run `npm install` in frontend directory

**Error**: `BETTER_AUTH_SECRET must be at least 32 characters`
- **Fix**: Add secret to `.env.local` (same as backend `.env`)

**Error**: `fetch failed` or `ECONNREFUSED`
- **Fix**: Ensure backend is running on port 8000

**Error**: `Session expired. Please login again.` (401)
- **Fix**: JWT token expired. Login again at http://localhost:3000/login

### CORS Issues

**Error**: `Access to fetch... blocked by CORS policy`
- **Fix**: Check `FRONTEND_URL` in backend `.env` matches frontend URL
- Verify CORS middleware in `backend/src/api/main.py`

---

## Next Steps

1. ✅ Development Environment Setup: Complete
2. ⏭️ Implement Backend: Use `jwt_middleware_generator` skill for `auth.py`
3. ⏭️ Implement Frontend: Use `api_client_generator` skill for `lib/api.ts`
4. ⏭️ Write Tests: Achieve 60% overall, 100% critical path coverage
5. ⏭️ Run Security Audit: Use `security_auditor` agent on backend
6. ⏭️ Validate API Contracts: Use `api_contract_validator` agent

---

## Useful Commands Cheat Sheet

```bash
# Backend
cd backend
source venv/bin/activate          # Activate venv
uvicorn src.api.main:app --reload # Run server
pytest                            # Run tests
pytest --cov=src/api              # Run with coverage

# Frontend
cd frontend
npm run dev                       # Run dev server
npm test                          # Run tests
npm run build                     # Production build
npm run type-check                # TypeScript check

# Git
git status                        # Check status
git add .                         # Stage changes
git commit -m "message"           # Commit
git push origin 001-fullstack-web-app  # Push to branch

# Database
psql -U user -d todo_db           # Connect to PostgreSQL
\dt                               # List tables
SELECT * FROM tasks;              # Query tasks
```

---

**Quickstart Guide Complete**: All setup instructions documented. Ready for implementation phase.
