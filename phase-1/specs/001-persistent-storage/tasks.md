# Tasks: Persistent Data Storage

**Input**: Design documents from `specs/001-persistent-storage/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/persistence-api.md

**Tests**: This project follows TDD (Test-Driven Development) per constitution. All test tasks are included and MUST be completed before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single Python package**: `src/todo/`, `tests/` at repository root
- All paths use forward slashes for cross-platform compatibility

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency installation

- [ ] T001 Add filelock==3.13.1 to requirements.txt
- [ ] T002 Install new dependency: pip install -r requirements.txt
- [ ] T003 Create new module src/todo/persistence.py (empty file with module docstring)
- [ ] T004 Create new test file tests/test_persistence.py (empty file with module docstring)

**Checkpoint**: Project structure ready for development

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core serialization infrastructure that ALL user stories depend on

**⚠️ CRITICAL**: User Story 1 cannot begin until JSON serialization is working

### Tests for JSON Serialization (Write First - TDD)

- [ ] T005 [P] Write test for Task→JSON→Task roundtrip in tests/test_persistence.py::test_task_serialization_roundtrip
- [ ] T006 [P] Write test for datetime ISO format conversion in tests/test_persistence.py::test_datetime_serialization
- [ ] T007 [P] Write test for Enum value conversion in tests/test_persistence.py::test_enum_serialization
- [ ] T008 [P] Write test for optional fields (None values) in tests/test_persistence.py::test_optional_fields_serialization
- [ ] T009 [P] Write test for schema version validation in tests/test_persistence.py::test_schema_version_validation

### Implementation for JSON Serialization

- [ ] T010 Implement TaskEncoder class in src/todo/persistence.py
- [ ] T011 Implement serialize_tasks() function in src/todo/persistence.py
- [ ] T012 Implement deserialize_tasks() function in src/todo/persistence.py
- [ ] T013 Implement _task_from_dict() helper function in src/todo/persistence.py
- [ ] T014 Implement _parse_datetime() helper function in src/todo/persistence.py
- [ ] T015 Implement _validate_schema_version() function in src/todo/persistence.py
- [ ] T016 Run tests: pytest tests/test_persistence.py::test_task_serialization_roundtrip -v (MUST PASS)
- [ ] T017 Run all serialization tests: pytest tests/test_persistence.py -k serialization -v (ALL MUST PASS)

### Platform-Specific Path Resolution

- [ ] T018 Write test for app data directory creation in tests/test_persistence.py::test_app_data_dir_creation
- [ ] T019 Implement get_app_data_dir() function in src/todo/persistence.py (Windows/macOS/Linux paths)
- [ ] T020 Define module constants STORAGE_DIR, TASKS_FILE, BACKUP_FILE, LOCK_FILE in src/todo/persistence.py
- [ ] T021 Run test: pytest tests/test_persistence.py::test_app_data_dir_creation -v (MUST PASS)

**Checkpoint**: Foundation ready - User Story 1 can begin

---

## Phase 3: User Story 1 - Data Persists Across Sessions (Priority: P1) 🎯 MVP

**Goal**: Users can create tasks, close the app, reopen it, and see all tasks restored with complete metadata

**Independent Test**: Add 3 tasks → exit app → reopen → verify all 3 tasks present with correct data

**Acceptance Scenarios**:
1. Create 3 tasks → exit via menu → reopen → all 3 tasks shown
2. Mark task complete → kill terminal → reopen → task still complete
3. Create 10 tasks with priorities/tags → close/reopen → metadata preserved
4. Create tasks with due dates/recurrence → close/reopen → dates intact

### Tests for User Story 1 (Write First - TDD)

#### File Locking Tests
- [ ] T022 [P] [US1] Write test for successful lock acquisition in tests/test_persistence.py::test_acquire_lock_success
- [ ] T023 [P] [US1] Write test for lock timeout (second instance) in tests/test_persistence.py::test_acquire_lock_blocks_second_instance
- [ ] T024 [P] [US1] Write test for lock release in tests/test_persistence.py::test_release_lock

#### Atomic Save Tests
- [ ] T025 [P] [US1] Write test for atomic write creates temp file in tests/test_persistence.py::test_atomic_write_creates_temp
- [ ] T026 [P] [US1] Write test for backup rotation in tests/test_persistence.py::test_atomic_write_creates_backup
- [ ] T027 [P] [US1] Write test for atomic rename in tests/test_persistence.py::test_atomic_write_renames

#### Load Tests
- [ ] T028 [P] [US1] Write test for loading existing file in tests/test_persistence.py::test_load_tasks_from_file
- [ ] T029 [P] [US1] Write test for loading non-existent file returns empty list in tests/test_persistence.py::test_load_tasks_empty_when_no_file
- [ ] T030 [P] [US1] Write test for backup recovery on corruption in tests/test_persistence.py::test_load_recovers_from_corruption

#### Integration Tests
- [ ] T031 [US1] Write integration test for full lifecycle in tests/test_persistence.py::test_full_save_load_cycle
- [ ] T032 [US1] Write integration test for multiple save/load cycles in tests/test_persistence.py::test_multiple_save_load_cycles

### Implementation for User Story 1

#### File Locking Implementation
- [ ] T033 [US1] Implement acquire_lock() function in src/todo/persistence.py
- [ ] T034 [US1] Implement release_lock() function in src/todo/persistence.py
- [ ] T035 [US1] Add module-level _file_lock variable in src/todo/persistence.py
- [ ] T036 [US1] Run locking tests: pytest tests/test_persistence.py -k lock -v (ALL MUST PASS)

#### Atomic Save Implementation
- [ ] T037 [US1] Implement _atomic_write() function in src/todo/persistence.py
- [ ] T038 [US1] Implement save_tasks() public function in src/todo/persistence.py
- [ ] T039 [US1] Add error handling for PermissionError in save_tasks()
- [ ] T040 [US1] Add error handling for OSError (disk full) in save_tasks()
- [ ] T041 [US1] Run atomic save tests: pytest tests/test_persistence.py -k atomic -v (ALL MUST PASS)

#### Load Implementation
- [ ] T042 [US1] Implement _load_from_file() function in src/todo/persistence.py
- [ ] T043 [US1] Implement load_tasks() public function with backup recovery in src/todo/persistence.py
- [ ] T044 [US1] Add corruption handling logic to load_tasks()
- [ ] T045 [US1] Add user-friendly error messages for load failures
- [ ] T046 [US1] Run load tests: pytest tests/test_persistence.py -k load -v (ALL MUST PASS)

#### Main Entry Point Integration
- [ ] T047 [US1] Update main.py: Add persistence.acquire_lock() at startup
- [ ] T048 [US1] Update main.py: Add loaded = persistence.load_tasks() after lock
- [ ] T049 [US1] Update main.py: Populate storage.tasks with loaded tasks
- [ ] T050 [US1] Update main.py: Rebuild storage.task_index from loaded tasks
- [ ] T051 [US1] Update main.py: Update storage.next_task_id based on loaded tasks
- [ ] T052 [US1] Update main.py: Add persistence.release_lock() in finally block
- [ ] T053 [US1] Run integration tests: pytest tests/test_persistence.py -k integration -v (ALL MUST PASS)

#### Manual Verification
- [ ] T054 [US1] Manual test: Create 3 tasks → exit gracefully → reopen → verify all present
- [ ] T055 [US1] Manual test: Create tasks → kill -9 terminal → reopen → verify persisted
- [ ] T056 [US1] Manual test: Verify JSON file created in correct platform-specific location

**Checkpoint**: User Story 1 complete - Basic persistence working, app survives restarts

---

## Phase 4: User Story 2 - Data Integrity During Updates (Priority: P2)

**Goal**: Task updates (title, description, priority, tags, due date) are immediately persisted and survive crashes

**Independent Test**: Create task → update multiple fields → kill terminal → reopen → verify updates saved

**Acceptance Scenarios**:
1. Update task title → kill terminal → reopen → title change persisted
2. Update tags on 3 tasks → exit gracefully → reopen → tag updates preserved
3. Change due date and priority → close app → reopen → both changes saved

### Tests for User Story 2 (Write First - TDD)

- [ ] T057 [P] [US2] Write test for auto-save on task creation in tests/test_storage.py::test_create_task_auto_saves
- [ ] T058 [P] [US2] Write test for auto-save on task update in tests/test_storage.py::test_update_task_auto_saves
- [ ] T059 [P] [US2] Write test for auto-save on task deletion in tests/test_storage.py::test_delete_task_auto_saves
- [ ] T060 [P] [US2] Write test for auto-save on mark complete in tests/test_storage.py::test_mark_complete_auto_saves

### Implementation for User Story 2

- [ ] T061 [US2] Add persistence.save_tasks(tasks) call to storage.create_task() in src/todo/storage.py
- [ ] T062 [US2] Add persistence.save_tasks(tasks) call to storage.update_task() in src/todo/storage.py
- [ ] T063 [US2] Add persistence.save_tasks(tasks) call to storage.delete_task() in src/todo/storage.py
- [ ] T064 [US2] Add persistence.save_tasks(tasks) call to storage.mark_complete() in src/todo/storage.py
- [ ] T065 [US2] Add persistence.save_tasks(tasks) call to storage.mark_incomplete() in src/todo/storage.py
- [ ] T066 [US2] Run auto-save tests: pytest tests/test_storage.py -k auto_save -v (ALL MUST PASS)

#### Manual Verification
- [ ] T067 [US2] Manual test: Update task title → kill terminal → reopen → verify change saved
- [ ] T068 [US2] Manual test: Update priority and tags → exit → reopen → verify both saved
- [ ] T069 [US2] Manual test: Delete task → kill terminal → reopen → verify deletion persisted

**Checkpoint**: User Story 2 complete - All CRUD operations auto-save, updates survive crashes

---

## Phase 5: User Story 3 - Automatic Save on Every Change (Priority: P3)

**Goal**: Transparent auto-save with <1 second latency, no explicit save command needed

**Independent Test**: Monitor storage file timestamp after each operation to verify immediate write

**Acceptance Scenarios**:
1. Add task → storage updated within 1 second
2. Delete task → storage reflects deletion immediately
3. Mark complete → completion status auto-saved

### Tests for User Story 3 (Write First - TDD)

- [ ] T070 [P] [US3] Write test for save latency <1 second in tests/test_persistence.py::test_save_performance_under_1_second
- [ ] T071 [P] [US3] Write test for large dataset (1000 tasks) load <2 seconds in tests/test_persistence.py::test_load_performance_1000_tasks
- [ ] T072 [P] [US3] Write test for file timestamp updates on save in tests/test_persistence.py::test_file_timestamp_updates

### Implementation for User Story 3

- [ ] T073 [US3] Add performance logging to save_tasks() in src/todo/persistence.py (optional, for debugging)
- [ ] T074 [US3] Verify no buffering delays in _atomic_write() (fsync already present)
- [ ] T075 [US3] Run performance tests: pytest tests/test_persistence.py -k performance -v (ALL MUST PASS)

#### Manual Verification
- [ ] T076 [US3] Manual test: Watch file timestamp → add task → verify <1s update
- [ ] T077 [US3] Manual test: Create 100 tasks → measure total time (should be fast)

**Checkpoint**: User Story 3 complete - Auto-save is transparent and performant

---

## Phase 6: Edge Cases & Error Handling

**Purpose**: Robust error handling for all edge cases from spec

### Tests for Edge Cases (Write First - TDD)

- [ ] T078 [P] Write test for corrupted JSON recovery in tests/test_persistence.py::test_corrupted_json_recovery
- [ ] T079 [P] Write test for missing required fields in tests/test_persistence.py::test_missing_fields_recovery
- [ ] T080 [P] Write test for invalid enum values in tests/test_persistence.py::test_invalid_enum_recovery
- [ ] T081 [P] Write test for concurrent access prevention in tests/test_persistence.py::test_concurrent_access_blocked
- [ ] T082 [P] Write test for permission denied graceful degradation in tests/test_persistence.py::test_permission_denied_degradation
- [ ] T083 [P] Write test for disk full graceful degradation in tests/test_persistence.py::test_disk_full_degradation

### Implementation for Edge Cases

- [ ] T084 Enhance load_tasks() error messages for corruption scenarios in src/todo/persistence.py
- [ ] T085 Add validation for required fields in _task_from_dict() in src/todo/persistence.py
- [ ] T086 Add try/except for invalid enum values with fallback defaults in src/todo/persistence.py
- [ ] T087 Test concurrent access: run two app instances → verify second shows error
- [ ] T088 Run all edge case tests: pytest tests/test_persistence.py -k edge -v (ALL MUST PASS)

**Checkpoint**: Edge cases handled gracefully, app never crashes from I/O errors

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final quality checks and documentation

- [ ] T089 [P] Run all tests: pytest tests/ -v (ALL MUST PASS)
- [ ] T090 [P] Check test coverage: pytest tests/test_persistence.py --cov=src/todo/persistence --cov-report=term-missing (MUST BE ≥90%)
- [ ] T091 [P] Check overall coverage: pytest tests/ --cov=src/todo --cov-report=term-missing (MUST BE ≥85%)
- [ ] T092 [P] Run black formatter: black src/ tests/
- [ ] T093 [P] Run flake8 linter: flake8 src/ tests/ (NO ERRORS)
- [ ] T094 [P] Run mypy type checker: mypy src/ (NO ERRORS)
- [ ] T095 Add docstrings to all public functions in src/todo/persistence.py
- [ ] T096 Update README.md with storage location documentation
- [ ] T097 Add help text showing storage file location when app starts
- [ ] T098 Create ADR for file-based persistence architecture decision
- [ ] T099 Update constitution.md Section II with approved amendment
- [ ] T100 Final manual verification: Follow quickstart.md verification steps

**Checkpoint**: Feature complete, all quality gates passed, ready for deployment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately ✅
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories ⚠️
- **User Story 1 (Phase 3)**: Depends on Foundational - MVP complete after this 🎯
- **User Story 2 (Phase 4)**: Depends on US1 (builds on load/save infrastructure)
- **User Story 3 (Phase 5)**: Depends on US2 (verifies auto-save performance)
- **Edge Cases (Phase 6)**: Depends on US1-3 (tests error scenarios)
- **Polish (Phase 7)**: Depends on all previous phases

### User Story Dependencies

- **US1 (P1)**: Independent after Foundational - Core persistence ✅
- **US2 (P2)**: Depends on US1 - Extends save hooks to all CRUD operations
- **US3 (P3)**: Depends on US2 - Validates performance of auto-save

### Within Each User Story (TDD Workflow)

1. **Write tests FIRST** (Red phase) - All [P] tests can run in parallel
2. **Run tests** - MUST FAIL initially
3. **Implement code** (Green phase) - Make tests pass
4. **Run tests again** - MUST PASS before proceeding
5. **Refactor** (Refactor phase) - Clean up code, tests still pass

### Parallel Opportunities

**Phase 1 (Setup)**: All tasks sequential (file creation)

**Phase 2 (Foundational)**:
- Tests T005-T009 can run in parallel (different test functions)
- Implementation T010-T015 mostly sequential (shared code)

**Phase 3 (User Story 1)**:
- Tests T022-T030 can run in parallel (different test functions)
- Implementation must be sequential within each subsection

**Phase 4 (User Story 2)**:
- Tests T057-T060 can run in parallel
- Implementation T061-T065 are quick edits, can be done in batch

**Phase 5 (User Story 3)**:
- Tests T070-T072 can run in parallel

**Phase 6 (Edge Cases)**:
- Tests T078-T083 can run in parallel

**Phase 7 (Polish)**:
- Tasks T089-T094 can run in parallel (different tools)

---

## Parallel Example: User Story 1 Tests

```bash
# Write all file locking tests together (in parallel if multiple developers):
Task T022: "Write test for successful lock acquisition"
Task T023: "Write test for lock timeout (second instance)"
Task T024: "Write test for lock release"

# Write all atomic save tests together:
Task T025: "Write test for atomic write creates temp file"
Task T026: "Write test for backup rotation"
Task T027: "Write test for atomic rename"

# After implementation, run all tests together:
pytest tests/test_persistence.py -k "lock or atomic or load" -v
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

**Timeline**: ~5 hours (following quickstart.md)

1. ✅ Phase 1: Setup (15 min) - T001-T004
2. ⚠️ Phase 2: Foundational (2 hours) - T005-T021
3. 🎯 Phase 3: User Story 1 (2.5 hours) - T022-T056
4. **STOP**: Validate MVP independently
5. **Demo**: Show working persistence to stakeholders

**MVP Deliverable**: Users can create tasks, close app, reopen, and see all data restored

### Incremental Delivery

1. **Foundation** (Phases 1-2) → Core serialization working
2. **+ US1** (Phase 3) → Basic persistence working 🎯 MVP
3. **+ US2** (Phase 4) → All updates auto-save
4. **+ US3** (Phase 5) → Performance validated
5. **+ Edge Cases** (Phase 6) → Production-ready robustness
6. **+ Polish** (Phase 7) → Full quality gates passed

Each increment is independently testable and deployable.

### Sequential vs Parallel

**If solo developer**: Execute phases 1→2→3→4→5→6→7 sequentially

**If team of 2**:
- After Phase 2 complete:
  - Developer A: US1 (Phase 3)
  - Developer B: Write tests for US2 (Phase 4)
- Merge and proceed

**If team of 3+**:
- After Phase 2 complete:
  - Dev A: US1
  - Dev B: Edge case tests (start early)
  - Dev C: Documentation/ADR prep

---

## Notes

- **TDD is mandatory** per constitution Principle VI - write tests before code
- **Coverage target**: ≥90% for persistence.py, ≥85% overall
- **[P] tasks**: Can run in parallel (different test functions or different files)
- **[Story] labels**: Map tasks to user stories for traceability
- **Red-Green-Refactor**: Tests fail → implement → tests pass → refactor
- **Checkpoint**: After US1 completion, you have a working MVP
- **Quality gates**: All T089-T094 must pass before marking feature complete
- **Constitution amendment**: Must be approved before merging (tracked in T099)

---

## Task Count Summary

- **Total Tasks**: 100
- **Setup (Phase 1)**: 4 tasks
- **Foundational (Phase 2)**: 17 tasks
- **User Story 1 (Phase 3)**: 35 tasks (including 11 test tasks)
- **User Story 2 (Phase 4)**: 13 tasks (including 4 test tasks)
- **User Story 3 (Phase 5)**: 8 tasks (including 3 test tasks)
- **Edge Cases (Phase 6)**: 11 tasks (including 6 test tasks)
- **Polish (Phase 7)**: 12 tasks

**Parallel Opportunities**: 35 tasks marked [P] can run in parallel

**Suggested MVP Scope**: Phases 1-3 (56 tasks, ~5 hours)
