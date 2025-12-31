# Todo App - Monorepo (Phase I → Phase II → Phase III)

## 🏗️ Monorepo Architecture

This is a **MONOREPO** containing three phases of evolution:

### Phase I: Python CLI Application (✅ Completed)
- **Location**: `/phase-1/` (preserved for reference)
- **Tech**: Python CLI with in-memory storage
- **Features**: CRUD operations, priority, tags, recurring tasks, reminders
- **Tests**: 317 passing, 85% coverage

### Phase II: Full-Stack Web Application (✅ Completed)
- **Frontend**: Next.js 16+ (`/frontend-web/`)
- **Backend**: FastAPI (`/backend/src/`)
- **Database**: Neon PostgreSQL (shared)
- **Auth**: Better Auth with JWT
- **Spec**: `specs/001-fullstack-web-app/`
- **Features**: User authentication, task CRUD via web UI

### Phase III: AI Chatbot with MCP Architecture (🚧 In Progress)
- **Frontend**: OpenAI ChatKit (`/frontend-chatbot/`)
- **Backend**: MCP Server (`/backend/mcp/`)
- **AI**: OpenAI Agents SDK
- **Database**: Same Neon PostgreSQL (shared with Phase II)
- **Auth**: Same Better Auth (shared with Phase II)
- **Spec**: `specs/002-ai-chatbot-mcp/`
- **Constitution**: `.specify/memory/phase-3-constitution.md`
- **Features**: Manage todos via natural language conversation

## 🎯 Why Monorepo?

**Shared Components:**
- ✅ Task models (Task, User, Tag, Conversation, Message) - defined once, used everywhere
- ✅ Database (Neon PostgreSQL) - single source of truth
- ✅ Authentication (Better Auth JWT) - tokens work across web + chatbot
- ✅ No code duplication - DRY principle maintained

**Project Structure:**
```
To-do-app/  (Monorepo Root)
├── backend/
│   ├── src/              # Phase 2: FastAPI REST API
│   ├── mcp/              # Phase 3: MCP Server (5 tools)
│   └── tests/            # Tests for both phases
├── frontend-web/         # Phase 2: Next.js Web UI
├── frontend-chatbot/     # Phase 3: OpenAI ChatKit UI
├── specs/
│   ├── 001-fullstack-web-app/   # Phase 2 spec
│   └── 002-ai-chatbot-mcp/      # Phase 3 spec
├── .specify/memory/
│   ├── constitution.md           # Phase 1 principles
│   ├── phase-2-constitution.md   # Phase 2 constitution
│   └── phase-3-constitution.md   # Phase 3 constitution
└── history/
    ├── prompts/          # Prompt History Records (PHRs)
    └── adr/              # Architecture Decision Records
```

## 📖 Specifications (Spec-Kit Plus)

All specifications are organized in `/specs/`:
- `specs/001-fullstack-web-app/` - Phase 2: Web app spec, plan, tasks
- `specs/002-ai-chatbot-mcp/` - Phase 3: AI chatbot spec, plan, tasks
- `specs/overview.md` - Project overview and phase status
- `specs/architecture.md` - Cross-phase architecture decisions

## 🚀 Running the Application

### Phase II: Full-Stack Web App

**Local Development:**
```bash
# Backend (FastAPI)
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn src.api.main:app --reload --port 8000

# Frontend (Next.js) - separate terminal
cd frontend-web
npm install
npm run dev

# Access: http://localhost:3000
```

**Docker Compose:**
```bash
docker-compose up
```

### Phase III: AI Chatbot (In Development)
```bash
# MCP Server
cd backend/mcp
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python server.py

# ChatKit UI
cd frontend-chatbot
npm install
npm run dev

# Access: http://localhost:3001
```

## 👨‍💻 Development Workflow

1. **Read constitutions**: See `.specify/memory/` for phase-specific principles
2. **Follow Spec → Plan → Tasks → Implementation** workflow
3. **Backend**: See `backend/CLAUDE.md`
4. **Frontend (Web)**: See `frontend-web/CLAUDE.md`
5. **Frontend (Chatbot)**: See `frontend-chatbot/CLAUDE.md` (when created)
6. **Test authentication flow** end-to-end for both web and chatbot




# Python CLI Todo Application

[![Tests](https://img.shields.io/badge/tests-317%20passing-brightgreen)](https://github.com/Malikasadjaved/Python-Todo-Cli-App)
[![Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen)](https://github.com/Malikasadjaved/Python-Todo-Cli-App)
[![Python](https://img.shields.io/badge/python-3.9%2B-blue)](https://www.python.org/downloads/)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Code Style](https://img.shields.io/badge/code%20style-black-black)](https://github.com/psf/black)

A feature-rich command-line todo application built with **Test-Driven Development (TDD)** and **Spec-Driven Development (SDD)**, featuring three-tier progressive architecture: Primary (CRUD), Intermediate (Organization), and Advanced (Automation).

> **🎯 Hackathon Project:** Built with rigorous software engineering practices - 317 comprehensive tests, 85% code coverage, clean architecture, and professional-grade code quality.

## Features

### Primary Tier - Core Operations
- ✅ Add tasks with title, description, priority, and tags
- ✅ View all tasks with visual indicators
- ✅ Update task details
- ✅ Delete tasks with confirmation
- ✅ Status Mark submenu (Complete/Incomplete with A/B selection)

### Intermediate Tier - Organization
- 🏷️ Priority management (HIGH/MEDIUM/LOW)
- 🏷️ Tags and categories (Work/Home + custom)
- 📅 Scheduled tasks with due dates and overdue detection
- 🔍 Search tasks by keyword
- 🎯 Filter by status, priority, tags, or date
- 📊 Sort by due date, priority, title, or created date

### Advanced Tier - Automation
- 🔄 Recurring tasks (DAILY/WEEKLY/MONTHLY/YEARLY)
- ⏰ Due date and time reminders with desktop notifications

### Data Persistence
- 💾 **Automatic JSON storage** - All tasks saved to disk automatically
- 🔒 **File locking** - Prevents data corruption from multiple instances
- ⚡ **Atomic writes** - Safe saves with automatic backup recovery
- 📍 **Platform-specific paths:**
  - Windows: `%APPDATA%\todo-app\tasks.json`
  - macOS: `~/Library/Application Support/todo-app/tasks.json`
  - Linux: `~/.local/share/todo-app/tasks.json`

## Installation

### Prerequisites
- Python 3.9 or higher
- pip package manager

### Setup

1. Clone the repository:
```bash
git clone https://github.com/Malikasadjaved/Python-Todo-Cli-App.git
cd Python-Todo-Cli-App
```

2. Create and activate virtual environment:
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Install development dependencies (optional, for testing):
```bash
pip install -r requirements-dev.txt
```

## Usage

Run the application:
```bash
python main.py
```

### Date & Time Formats

**Due Date Input:**
- Format: `YYYY-MM-DD` or `YYYY-MM-DD HH:MM` (24-hour time)
- Examples:
  - `2025-12-25` (date only, defaults to 00:00)
  - `2025-12-25 14:30` (specific time: 2:30 PM)

**Timezone Handling:**
- All times are in local system timezone
- Overdue detection uses current local time

### Recurrence Patterns

**Available Patterns:**
- **DAILY:** Repeats every day at the same time
- **WEEKLY:** Repeats every 7 days from completion date
- **BIWEEKLY:** Repeats every 14 days from completion date
- **MONTHLY:** Repeats on the same day next month (edge case: Jan 31 → Feb 28/29)
- **YEARLY:** Repeats on the same date next year (handles Feb 29 leap years)

**Behavior:**
- When you mark a recurring task as complete, a new task instance is automatically created
- The new task has the next due date calculated based on the recurrence pattern
- All other properties (title, description, priority, tags, reminder) are preserved

**Edge Cases Handled:**
- **Month-end dates:** Jan 31 with monthly recurrence becomes Feb 28 (or 29 in leap years)
- **Leap years:** Feb 29 with yearly recurrence becomes Feb 28 in non-leap years

### Notification Behavior

**Desktop Notifications:**
- Cross-platform system notifications using `plyer` library
- Supported on Windows, macOS, and Linux

**Reminder Configuration:**
- Set reminder offset when creating or updating tasks
- Offset is specified in hours before the due date/time
- Example: For a task due at 2:00 PM with 1-hour reminder, notification triggers at 1:00 PM

**Notification Timing:**
- The notification system runs in the background when the app is active
- Reminders trigger at the calculated time (due_date - reminder_offset)
- Each task can have one reminder configuration

### Menu Navigation

The application presents a menu organized by feature tier:

```
=== Python CLI Todo Application ===

PRIMARY TIER - Core Operations:
1. Add Task
2. View All Tasks
3. Update Task
4. Delete Task
5. Status Mark (Complete/Incomplete)

INTERMEDIATE TIER - Organization:
6. Search Tasks
7. Filter Tasks
8. Sort Tasks

ADVANCED TIER - Automation:
9. Recurring Tasks (Automatic)
10. Reminders (Automatic)

0. Exit
```

Enter a number or keyword (e.g., "add", "list", "search") to select an option.

### Examples

**Add a task:**
```
Choose option: 1
Enter title: Team meeting
Enter description: Weekly sync with development team

Select Priority:
  1. HIGH
  2. MEDIUM (default)
  3. LOW
Enter choice (1-3) [2]: 1

Tags (comma-separated): Work, Meeting
Due date (YYYY-MM-DD or YYYY-MM-DD HH:MM): 2025-12-10 14:00

Select Recurrence (optional):
  1. DAILY
  2. WEEKLY
  3. BIWEEKLY
  4. MONTHLY
  5. YEARLY
  0. None (no recurrence)
Enter choice (0-5) [0]: 2
```

**Search tasks:**
```
Choose option: 6
Enter keyword: meeting
Found 3 tasks matching 'meeting'
```

**Filter tasks:**
```
Choose option: 7
Filter by status (complete/incomplete/all): incomplete
Filter by priority (HIGH/MEDIUM/LOW/all): HIGH
Found 5 tasks matching criteria
```

## Development

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src/todo --cov-report=html

# Run specific test file
pytest tests/test_models.py -v
```

### Code Quality

```bash
# Format code
black src/ tests/

# Lint code
flake8 src/ tests/

# Type checking
mypy src/ --strict
```

### Project Structure

```
To-do-app/
├── src/
│   └── todo/
│       ├── __init__.py
│       ├── models.py          # Task data model, enums
│       ├── storage.py         # In-memory CRUD operations
│       ├── commands.py        # Business logic
│       ├── filters.py         # Search, filter, sort
│       ├── scheduler.py       # Recurring tasks
│       ├── notifications.py   # Reminders
│       └── cli.py             # CLI interface
├── tests/
│   ├── conftest.py           # Shared fixtures
│   ├── test_models.py
│   ├── test_storage.py
│   ├── test_commands.py
│   ├── test_filters.py
│   ├── test_scheduler.py
│   ├── test_notifications.py
│   └── test_cli.py
├── main.py                   # Entry point
├── requirements.txt
├── requirements-dev.txt
├── pyproject.toml
├── .flake8
└── README.md
```

## Architecture

- **Storage**: In-memory with list + dict index for O(1) lookups
- **Testing**: TDD approach with ≥85% coverage requirement
- **Code Quality**: PEP 8 compliant, type-hinted, formatted with black
- **Design**: Layered architecture with separation of concerns

## Dependencies

### Runtime
- `colorama` - Colored terminal output
- `python-dateutil` - Recurrence calculation
- `plyer` - Cross-platform desktop notifications

### Development
- `pytest` - Testing framework
- `pytest-cov` - Coverage reporting
- `black` - Code formatter
- `flake8` - Linter
- `mypy` - Static type checker

## Performance

- Handles 1000+ tasks without degradation
- All operations complete in < 1 second
- O(1) lookup complexity for task retrieval

## Test Coverage

**Total Tests:** 317 passing ✅

**Coverage by Module:**
- `storage.py`: 100% - Core CRUD operations
- `filters.py`: 100% - Search/filter/sort
- `notifications.py`: 100% - Reminder system
- `models.py`: 98% - Data models and validation
- `persistence.py`: 95% - JSON storage and file operations
- `scheduler.py`: 90% - Recurring task logic
- `commands.py`: 83% - Business logic layer
- `cli.py`: 76% - Interactive CLI (presentation layer)

**Overall:** 85% (Core business logic: 90-100%)

The CLI layer has lower coverage as it's the interactive presentation layer. All core business logic is thoroughly tested with TDD approach.

## Project Status

**PRODUCTION READY** 🎉

✅ 15 features complete (12 original + 3 UX enhancements)
✅ 317 tests passing (85% coverage)
✅ Code formatted with black
✅ Flake8 compliant
✅ Type-hinted
✅ Clean architecture

See `DEPLOYMENT.md` for detailed deployment and usage guide.

## Documentation

- **README.md** - This file (quick start guide)
- **DEPLOYMENT.md** - Detailed deployment and usage guide
- **PROJECT_SUMMARY.md** - Complete project overview
- **REQUIREMENTS_VERIFICATION.md** - Constitution compliance report
- **FEATURE_F013_SUMMARY.md** - Latest feature (selection menus)
- **CLAUDE.md** - Development guidelines for Claude Code

## Contributing

Contributions are welcome! This project follows:
- **Test-Driven Development (TDD)** - Write tests first
- **Spec-Driven Development (SDD)** - Plan before coding
- **Clean Code** - PEP 8, type hints, documentation

See `CLAUDE.md` for detailed development workflow.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Claude Code](https://claude.ai/code) using TDD and SDD methodologies
- Developed as part of a hackathon project
- Demonstrates professional software engineering practices
