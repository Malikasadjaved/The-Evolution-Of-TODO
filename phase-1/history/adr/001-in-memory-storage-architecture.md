# ADR-001: In-Memory Storage Architecture

> **Scope**: Data persistence strategy for Python CLI Todo Application

- **Status:** Accepted
- **Date:** 2025-12-06
- **Feature:** todo-cli-app (all tiers)
- **Context:** Python CLI Todo Application requiring fast, simple task storage with no external dependencies

<!-- Significance checklist:
     1) Impact: YES - Affects entire data layer and architecture
     2) Alternatives: YES - Database, file persistence, or in-memory
     3) Scope: YES - Cross-cutting concern affecting all features
-->

## Decision

**Use pure in-memory storage with Python built-in data structures (lists and dictionaries) for all task data.**

Storage implementation:
- **Primary structure:** `List[Task]` for sequential storage and iteration
- **Index structure:** `Dict[int, int]` mapping task ID to list position for O(1) lookups
- **ID generation:** Auto-incrementing integer counter
- **No persistence:** Data lost when application exits (by design)
- **Thread safety:** Not required (single-threaded CLI application)

## Consequences

### Positive

- **Simplicity:** Zero external dependencies, no database setup, no file I/O complexity
- **Performance:** O(1) lookups by ID, O(n) scans acceptable for < 10,000 tasks
- **Testability:** Easy to mock, reset, and verify in unit tests
- **Constitutional compliance:** Satisfies constitution requirement for in-memory storage (Section II)
- **Fast development:** No schema migrations, no file format versioning
- **Predictability:** Deterministic behavior, no disk failures or corruption issues

### Negative

- **No persistence:** All data lost on application exit (session-only)
- **Memory constraints:** Limited to available RAM (acceptable for CLI use case)
- **No multi-process support:** Cannot share data between application instances
- **No data recovery:** No backups, undo, or version history
- **Scale limitations:** Impractical for > 100,000 tasks (not a requirement)

## Alternatives Considered

### Alternative A: SQLite File Database
- **Approach:** Use `sqlite3` stdlib module with local `.db` file
- **Pros:** Persistence across sessions, SQL query power, ACID guarantees
- **Cons:** File I/O overhead, schema migrations, file corruption risk, violates constitution requirement (Section II: "in-memory only")
- **Why rejected:** Constitution explicitly requires in-memory storage; persistence not needed for CLI tool

### Alternative B: JSON File Persistence
- **Approach:** Serialize task list to JSON file on disk
- **Pros:** Human-readable, easy to edit manually, simple backup
- **Cons:** File I/O on every operation, JSON serialization overhead (datetime conversions), file locking issues, violates constitution
- **Why rejected:** Constitution mandates no file system persistence; adds complexity without hackathon value

### Alternative C: Pickle Serialization
- **Approach:** Python `pickle` module for object persistence
- **Pros:** Native Python serialization, preserves object structure
- **Cons:** Security risks (untrusted pickle files), not human-readable, violates constitution
- **Why rejected:** Security concerns, constitution violation, unnecessary for in-memory requirement

## Implementation Notes

**Core modules affected:**
- `src/todo/storage.py` (TaskStorage class)
- All CRUD operations maintain list-dict consistency
- Test coverage: 100% (see tests/test_storage.py)

**Performance characteristics:**
- Add task: O(1)
- Get by ID: O(1) via dict index
- Update: O(1)
- Delete: O(n) worst case (list removal + reindex)
- List all: O(n)
- Search/filter: O(n) scan (acceptable for CLI)

**Data integrity guarantees:**
- Unique ID enforcement (auto-increment)
- No orphaned dict references (cleanup on delete)
- Immutable task IDs (enforced by storage layer)

## References

- Constitution: `.specify/memory/constitution.md` (Section II: In-Memory Storage Architecture)
- Feature Spec: `specs/001-todo-cli-app/spec.md`
- Implementation: `src/todo/storage.py`
- Tests: `tests/test_storage.py` (100% coverage, 20+ tests)
- Related ADRs: None (foundational decision)
