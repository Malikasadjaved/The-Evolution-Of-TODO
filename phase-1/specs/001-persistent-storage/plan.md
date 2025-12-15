# Implementation Plan: Persistent Data Storage

**Branch**: `001-persistent-storage` | **Date**: 2025-12-07 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/001-persistent-storage/spec.md`

**Note**: This template is filled in by the `/sp.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add persistent storage to the Python CLI Todo Application to prevent data loss when the application terminates. The system will use JSON-based file storage with automatic backup recovery, file locking for concurrency control, and seamless integration with the existing in-memory architecture. All task data (metadata, priority, tags, dates, recurrence) will be automatically saved after every modification and restored on application startup.

## Technical Context

**Language/Version**: Python 3.9+ (using dataclasses, type hints, pathlib)
**Primary Dependencies**:
- `json` (stdlib) - JSON serialization/deserialization
- `pathlib` (stdlib) - Cross-platform file paths
- `filelock` - File locking for concurrency control (new dependency)
- `colorama` - Terminal output (existing)
- `python-dateutil` - Date parsing (existing)
- `pytest`, `black`, `flake8`, `mypy` - Testing and quality tools (existing)

**Storage**: JSON files on local filesystem
- Primary: `~/.todo-app/tasks.json` (or platform-specific app data directory)
- Backup: `~/.todo-app/tasks.json.backup`
- Lock file: `~/.todo-app/tasks.json.lock`

**Testing**: pytest with ≥85% coverage requirement
- Unit tests: Task serialization/deserialization, file I/O operations
- Integration tests: Full save/load cycles, backup recovery, concurrent access
- Edge cases: Corruption handling, permission errors, large datasets

**Target Platform**: Cross-platform CLI (Windows, macOS, Linux)
**Project Type**: Single Python package (src/todo/)
**Performance Goals**:
- Load time: <2 seconds for 1000+ tasks
- Save time: <1 second per operation
- File I/O: Atomic writes to prevent corruption

**Constraints**:
- Backward compatibility: No breaking changes to existing in-memory API
- Constitution compliance: Extend (not replace) in-memory storage
- Test coverage: ≥90% for new storage module
- No external databases: JSON files only

**Scale/Scope**:
- Support: 1000+ tasks without degradation
- File size: Expect ~1-5MB for 1000 tasks (JSON)
- Concurrency: Single user, multiple instances prevented via file locking

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Clean Code & Pythonic Design ✅
- **Status**: PASS
- **Compliance**: Uses dataclasses, type hints, pathlib (stdlib), descriptive names
- **Action**: Follow PEP 8, document public APIs, keep functions <50 lines

### Principle II: Enhanced In-Memory Storage Architecture ⚠️ AMENDMENT REQUIRED
- **Status**: REQUIRES CONSTITUTION AMENDMENT
- **Current**: "Task data MUST be stored exclusively in memory... No external database or file system persistence (in-memory only)"
- **Conflict**: This feature adds file-based persistence to disk
- **Resolution Strategy**: Hybrid architecture - maintain in-memory as primary, add persistence as transparent layer
- **Justification**: User requirement for data survival across sessions is incompatible with pure in-memory storage
- **Proposed Amendment**: "Task data MUST be stored in memory for fast access, with optional file-based persistence to survive application restarts"
- **Action**: Get user approval for constitution amendment before implementation

### Principle III: Three-Tier Feature Architecture ✅
- **Status**: PASS
- **Tier Assignment**: This is a foundation feature that enables all three tiers
- **Impact**: Persistence layer transparent to existing features, no tier-specific changes needed

### Principle IV: Reusable Intelligence & Agent-Driven Development ✅
- **Status**: PASS
- **Compliance**: Using Claude Code agent-driven planning with PHR creation
- **Action**: Consider creating reusable "persistence" skill for future features

### Principle V: Proper Python Project Structure ✅
- **Status**: PASS
- **Module**: Extends `src/todo/storage.py` with save/load methods
- **New Module**: May add `src/todo/persistence.py` for file I/O separation
- **Tests**: Add `tests/test_persistence.py` for file operations

### Principle VI: Test-First Development (TDD) ✅
- **Status**: PASS
- **Approach**: Write tests first for serialization, file I/O, backup, locking
- **Coverage Target**: ≥90% for new persistence module (exceeds ≥85% requirement)
- **Action**: Follow red-green-refactor cycle

### Principle VII: Enhanced User Experience & Error Handling ✅
- **Status**: PASS
- **UX**: Transparent auto-save, no user action required
- **Error Handling**: Graceful degradation on corruption (backup restore), file lock errors (clear message)
- **Action**: Display save/load status messages, handle all I/O exceptions

### Summary
- **Blockers**: 1 (Constitution Amendment Required - Principle II)
- **Passes**: 6 of 7 principles
- **Action Required**: User must approve constitution amendment to permit file-based persistence before proceeding to implementation

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output (/sp.plan command)
├── data-model.md        # Phase 1 output (/sp.plan command)
├── quickstart.md        # Phase 1 output (/sp.plan command)
├── contracts/           # Phase 1 output (/sp.plan command)
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
src/todo/
├── __init__.py
├── models.py              # Task dataclass, enums (existing)
├── storage.py             # In-memory CRUD operations (existing - will extend)
├── persistence.py         # NEW: File I/O, serialization, backup, locking
├── commands.py            # Command handlers (existing)
├── filters.py             # Search/filter/sort (existing)
├── scheduler.py           # Recurring tasks (existing)
├── notifications.py       # Reminders (existing)
└── cli.py                 # CLI interface (existing)

tests/
├── __init__.py
├── test_models.py         # Task model tests (existing)
├── test_storage.py        # In-memory storage tests (existing - will extend)
├── test_persistence.py    # NEW: File I/O, backup, locking tests
├── test_commands.py       # Command tests (existing)
├── test_filters.py        # Filter/sort tests (existing)
├── test_scheduler.py      # Recurring task tests (existing)
├── test_notifications.py  # Reminder tests (existing)
└── test_cli.py            # CLI tests (existing)

main.py                    # Entry point (existing - may need load on startup)
requirements.txt           # Dependencies (will add filelock)
```

**Structure Decision**: Single Python package structure (existing). This feature adds one new module (`persistence.py`) and extends the existing `storage.py` module with save/load hooks. The persistence layer is implemented as a separate module to maintain separation of concerns (in-memory operations vs. file I/O), making the code more testable and following the Open/Closed Principle.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| File-based persistence (Principle II violation) | User requirement: data must survive app termination/crashes | Pure in-memory storage loses all data on exit, making app unusable for real-world scenarios |
| New dependency: `filelock` | Prevent data corruption from concurrent app instances | Python stdlib lacks cross-platform file locking; manual locking implementations are error-prone and platform-specific |

**Justification Summary**: The constitution violation is necessary to meet the core user requirement. The hybrid architecture (in-memory + persistence) maintains the performance benefits of in-memory storage while adding data durability. This is a justified complexity increase with no simpler alternative that satisfies the requirement.
