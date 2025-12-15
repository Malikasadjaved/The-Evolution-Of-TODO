# Tasks: Python CLI Todo Application

**Input**: Design documents from `/specs/001-todo-cli-app/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Included - Constitution mandates TDD with ≥85% test coverage

**Organization**: Tasks are grouped by user story (7 stories across 3 tiers) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US7)
- Include exact file paths in descriptions

## Path Conventions

Project uses single project structure at repository root:
- Source: `src/todo/`
- Tests: `tests/`
- Entry point: `main.py`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project directory structure (src/todo/, tests/, main.py)
- [ ] T002 Initialize Python project with requirements.txt and requirements-dev.txt
- [ ] T003 [P] Configure pyproject.toml for pytest, black, and mypy
- [ ] T004 [P] Configure .flake8 for linting (ignore E203, W503)
- [ ] T005 [P] Create conftest.py with shared fixtures in tests/conftest.py
- [ ] T006 [P] Create README.md with setup and usage instructions

**Checkpoint**: Project structure ready for development

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Create __init__.py files for src/todo/ and tests/
- [ ] T008 [P] Install runtime dependencies (colorama, python-dateutil, plyer)
- [ ] T009 [P] Install development dependencies (pytest, pytest-cov, black, flake8, mypy)
- [ ] T010 Verify environment setup (run pytest, black --check, flake8, mypy)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Basic Task Management (Priority: P1) 🎯 MVP

**Goal**: Establish MVP with core CRUD operations (add, view, update, delete, mark complete/incomplete)

**Independent Test**: User can create a task, view it, update its details, mark it complete, and delete it via CLI. Task list displays correctly with status indicators.

### Tests for User Story 1 (TDD - Write FIRST, ensure they FAIL)

**models.py tests:**

- [ ] T011 [P] [US1] Write test_task_creation_with_defaults in tests/test_models.py
- [ ] T012 [P] [US1] Write test_task_validation_empty_title in tests/test_models.py
- [ ] T013 [P] [US1] Write test_priority_enum_values in tests/test_models.py
- [ ] T014 [P] [US1] Write test_task_is_overdue_computed_property in tests/test_models.py
- [ ] T015 [P] [US1] Write test_task_type_computed_property in tests/test_models.py

**storage.py tests:**

- [ ] T016 [P] [US1] Write test_create_task_auto_id in tests/test_storage.py
- [ ] T017 [P] [US1] Write test_get_task_by_id_success in tests/test_storage.py
- [ ] T018 [P] [US1] Write test_get_task_not_found in tests/test_storage.py
- [ ] T019 [P] [US1] Write test_get_all_tasks_empty in tests/test_storage.py
- [ ] T020 [P] [US1] Write test_update_task_success in tests/test_storage.py
- [ ] T021 [P] [US1] Write test_update_task_not_found in tests/test_storage.py
- [ ] T022 [P] [US1] Write test_delete_task_rebuilds_index in tests/test_storage.py
- [ ] T023 [P] [US1] Write test_mark_complete_sets_timestamp in tests/test_storage.py
- [ ] T024 [P] [US1] Write test_mark_incomplete_clears_timestamp in tests/test_storage.py
- [ ] T025 [P] [US1] Write test_task_index_integrity in tests/test_storage.py

**commands.py tests:**

- [ ] T026 [P] [US1] Write test_add_task_command_success in tests/test_commands.py
- [ ] T027 [P] [US1] Write test_add_task_command_empty_title in tests/test_commands.py
- [ ] T028 [P] [US1] Write test_view_all_tasks_command in tests/test_commands.py
- [ ] T029 [P] [US1] Write test_update_task_command_success in tests/test_commands.py
- [ ] T030 [P] [US1] Write test_delete_task_command_confirmation in tests/test_commands.py
- [ ] T031 [P] [US1] Write test_mark_complete_command in tests/test_commands.py
- [ ] T032 [P] [US1] Write test_parse_priority_helper in tests/test_commands.py

**cli.py tests:**

- [ ] T033 [P] [US1] Write test_format_task_output in tests/test_cli.py
- [ ] T034 [P] [US1] Write test_menu_display in tests/test_cli.py

### Implementation for User Story 1

**Step 1: Models layer**

- [ ] T035 [P] [US1] Implement Priority enum (HIGH, MEDIUM, LOW) in src/todo/models.py
- [ ] T036 [P] [US1] Implement TaskType enum (SCHEDULED, ACTIVITY) in src/todo/models.py
- [ ] T037 [US1] Implement Task dataclass with all attributes in src/todo/models.py
- [ ] T038 [US1] Add is_overdue computed property to Task in src/todo/models.py
- [ ] T039 [US1] Add task_type computed property to Task in src/todo/models.py
- [ ] T040 [US1] Run tests for models.py (pytest tests/test_models.py -v)

**Step 2: Storage layer**

- [ ] T041 [US1] Initialize module state (tasks list, task_index dict, next_task_id) in src/todo/storage.py
- [ ] T042 [P] [US1] Implement create_task() function in src/todo/storage.py
- [ ] T043 [P] [US1] Implement get_task() function with O(1) lookup in src/todo/storage.py
- [ ] T044 [P] [US1] Implement get_all_tasks() function in src/todo/storage.py
- [ ] T045 [P] [US1] Implement update_task() function in src/todo/storage.py
- [ ] T046 [US1] Implement delete_task() function with index rebuild in src/todo/storage.py
- [ ] T047 [P] [US1] Implement mark_complete() function (basic, no recurrence) in src/todo/storage.py
- [ ] T048 [P] [US1] Implement mark_incomplete() function in src/todo/storage.py
- [ ] T049 [US1] Run tests for storage.py (pytest tests/test_storage.py -v)

**Step 3: Commands layer**

- [ ] T050 [US1] Implement CommandResult dataclass in src/todo/commands.py
- [ ] T051 [P] [US1] Implement parse_priority() helper in src/todo/commands.py
- [ ] T052 [P] [US1] Implement parse_date() helper in src/todo/commands.py
- [ ] T053 [P] [US1] Implement parse_tags() helper in src/todo/commands.py
- [ ] T054 [US1] Implement add_task_command() with validation in src/todo/commands.py
- [ ] T055 [P] [US1] Implement view_all_tasks_command() in src/todo/commands.py
- [ ] T056 [P] [US1] Implement update_task_command() in src/todo/commands.py
- [ ] T057 [P] [US1] Implement delete_task_command() with confirmation in src/todo/commands.py
- [ ] T058 [P] [US1] Implement mark_complete_command() (basic) in src/todo/commands.py
- [ ] T059 [P] [US1] Implement mark_incomplete_command() in src/todo/commands.py
- [ ] T060 [US1] Run tests for commands.py (pytest tests/test_commands.py -v)

**Step 4: CLI layer**

- [ ] T061 [US1] Initialize colorama in src/todo/cli.py
- [ ] T062 [P] [US1] Implement format_task() function with color coding in src/todo/cli.py
- [ ] T063 [P] [US1] Implement format_task_list() tabular display in src/todo/cli.py
- [ ] T064 [US1] Implement display_menu() organized by tier in src/todo/cli.py
- [ ] T065 [P] [US1] Implement handle_add_task() menu handler in src/todo/cli.py
- [ ] T066 [P] [US1] Implement handle_view_tasks() menu handler in src/todo/cli.py
- [ ] T067 [P] [US1] Implement handle_update_task() menu handler in src/todo/cli.py
- [ ] T068 [P] [US1] Implement handle_delete_task() menu handler in src/todo/cli.py
- [ ] T069 [P] [US1] Implement handle_mark_complete() menu handler in src/todo/cli.py
- [ ] T070 [P] [US1] Implement handle_mark_incomplete() menu handler in src/todo/cli.py
- [ ] T071 [US1] Implement main_loop() with menu navigation in src/todo/cli.py
- [ ] T072 [US1] Run tests for cli.py (pytest tests/test_cli.py -v)

**Step 5: Entry point**

- [ ] T073 [US1] Implement main.py entry point calling cli.main_loop()
- [ ] T074 [US1] Run full test suite (pytest --cov=src/todo --cov-report=term)
- [ ] T075 [US1] Verify coverage ≥85% for models, storage, commands
- [ ] T076 [US1] Run black formatting (black src/ tests/)
- [ ] T077 [US1] Run flake8 linting (flake8 src/ tests/)
- [ ] T078 [US1] Run mypy type checking (mypy src/ --strict)
- [ ] T079 [US1] Manual acceptance test: Create, view, update, delete, mark complete/incomplete tasks

**Checkpoint**: User Story 1 (MVP) is fully functional and independently testable. Users can manage basic tasks via CLI.

---

## Phase 4: User Story 2 - Task Organization with Priority and Tags (Priority: P2)

**Goal**: Add priority levels and tags for task organization

**Independent Test**: User can assign HIGH/MEDIUM/LOW priority and multiple tags (Work/Home/custom) when creating/updating tasks. Task list displays with visual priority indicators and tag labels.

**Note**: This builds on US1 models/storage/commands/cli but adds priority/tag-specific features already partially implemented in US1.

### Tests for User Story 2

- [ ] T080 [P] [US2] Write test_priority_validation_invalid_value in tests/test_models.py
- [ ] T081 [P] [US2] Write test_tags_multiple_per_task in tests/test_models.py
- [ ] T082 [P] [US2] Write test_tags_special_characters in tests/test_models.py
- [ ] T083 [P] [US2] Write test_priority_display_indicators in tests/test_cli.py

### Implementation for User Story 2

- [ ] T084 [US2] Add priority validation to Task model (reject invalid values) in src/todo/models.py
- [ ] T085 [US2] Add tag validation (no empty tags) to Task model in src/todo/models.py
- [ ] T086 [US2] Enhance parse_priority() with error messages in src/todo/commands.py
- [ ] T087 [US2] Enhance parse_tags() to handle custom tags in src/todo/commands.py
- [ ] T088 [US2] Update format_task() to display priority indicators [H]/[M]/[L] with colors in src/todo/cli.py
- [ ] T089 [US2] Update format_task() to display tags with visual separators in src/todo/cli.py
- [ ] T090 [US2] Run full test suite (pytest --cov=src/todo)
- [ ] T091 [US2] Manual acceptance test: Create tasks with various priorities and tags, verify display

**Checkpoint**: User Story 2 complete. Users can organize tasks by priority and tags.

---

## Phase 5: User Story 3 - Scheduled Tasks with Due Dates (Priority: P3)

**Goal**: Add due date functionality with overdue detection

**Independent Test**: User can set due dates on tasks. Tasks past due date display with [!] overdue indicator. Task list distinguishes scheduled vs activity tasks.

### Tests for User Story 3

- [ ] T092 [P] [US3] Write test_task_with_due_date in tests/test_models.py
- [ ] T093 [P] [US3] Write test_overdue_detection_logic in tests/test_models.py
- [ ] T094 [P] [US3] Write test_task_type_scheduled_vs_activity in tests/test_models.py
- [ ] T095 [P] [US3] Write test_parse_date_valid_formats in tests/test_commands.py
- [ ] T096 [P] [US3] Write test_parse_date_invalid_formats in tests/test_commands.py
- [ ] T097 [P] [US3] Write test_overdue_indicator_display in tests/test_cli.py

### Implementation for User Story 3

- [ ] T098 [US3] Enhance add_task_command() to accept due_date_str in src/todo/commands.py
- [ ] T099 [US3] Enhance update_task_command() to update due_date in src/todo/commands.py
- [ ] T100 [US3] Update parse_date() to handle YYYY-MM-DD and YYYY-MM-DD HH:MM in src/todo/commands.py
- [ ] T101 [US3] Update format_task() to display due dates in src/todo/cli.py
- [ ] T102 [US3] Update format_task() to show [!] for overdue tasks in src/todo/cli.py
- [ ] T103 [US3] Update handle_add_task() to prompt for due date in src/todo/cli.py
- [ ] T104 [US3] Update handle_update_task() to allow due date modification in src/todo/cli.py
- [ ] T105 [US3] Run full test suite (pytest --cov=src/todo)
- [ ] T106 [US3] Manual acceptance test: Create scheduled tasks, verify overdue detection

**Checkpoint**: User Story 3 complete. Users can manage tasks with deadlines and see overdue indicators.

---

## Phase 6: User Story 4 - Search and Filter Tasks (Priority: P4)

**Goal**: Add search by keyword and filter by status/priority/date/tags

**Independent Test**: User can search for "meeting" and see only matching tasks. User can filter by incomplete HIGH priority Work tasks and see correct results. Multiple filters combine with AND logic.

### Tests for User Story 4

- [ ] T107 [P] [US4] Write test_search_tasks_case_insensitive in tests/test_filters.py
- [ ] T108 [P] [US4] Write test_search_tasks_in_title_and_description in tests/test_filters.py
- [ ] T109 [P] [US4] Write test_filter_by_status in tests/test_filters.py
- [ ] T110 [P] [US4] Write test_filter_by_priority_multiple in tests/test_filters.py
- [ ] T111 [P] [US4] Write test_filter_by_tag in tests/test_filters.py
- [ ] T112 [P] [US4] Write test_filter_by_date_range in tests/test_filters.py
- [ ] T113 [P] [US4] Write test_filter_overdue in tests/test_filters.py
- [ ] T114 [P] [US4] Write test_filter_due_today in tests/test_filters.py
- [ ] T115 [P] [US4] Write test_filter_due_this_week in tests/test_filters.py
- [ ] T116 [P] [US4] Write test_combine_filters_and_logic in tests/test_filters.py

### Implementation for User Story 4

**filters.py module:**

- [ ] T117 [P] [US4] Implement search_tasks() in src/todo/filters.py
- [ ] T118 [P] [US4] Implement filter_by_status() in src/todo/filters.py
- [ ] T119 [P] [US4] Implement filter_by_priority() in src/todo/filters.py
- [ ] T120 [P] [US4] Implement filter_by_tag() in src/todo/filters.py
- [ ] T121 [P] [US4] Implement filter_by_date_range() in src/todo/filters.py
- [ ] T122 [P] [US4] Implement filter_overdue() in src/todo/filters.py
- [ ] T123 [P] [US4] Implement filter_due_today() in src/todo/filters.py
- [ ] T124 [P] [US4] Implement filter_due_this_week() in src/todo/filters.py
- [ ] T125 [P] [US4] Implement combine_filters() for AND logic in src/todo/filters.py
- [ ] T126 [P] [US4] Implement get_filter_summary() helper in src/todo/filters.py
- [ ] T127 [US4] Run tests for filters.py (pytest tests/test_filters.py -v)

**CLI integration:**

- [ ] T128 [P] [US4] Implement handle_search() menu handler in src/todo/cli.py
- [ ] T129 [P] [US4] Implement handle_filter() menu handler with multiple criteria in src/todo/cli.py
- [ ] T130 [US4] Update display_menu() to include search/filter options in src/todo/cli.py
- [ ] T131 [US4] Run full test suite (pytest --cov=src/todo)
- [ ] T132 [US4] Manual acceptance test: Search and filter with various criteria, verify results

**Checkpoint**: User Story 4 complete. Users can efficiently find tasks in large lists.

---

## Phase 7: User Story 5 - Sort Tasks by Different Criteria (Priority: P5)

**Goal**: Add sorting by due date, priority, alphabetically, or created date

**Independent Test**: User can sort by due date (earliest first) and see tasks ordered correctly with null dates at end. User can sort by priority (HIGH → MEDIUM → LOW).

### Tests for User Story 5

- [ ] T133 [P] [US5] Write test_sort_by_due_date_ascending in tests/test_filters.py
- [ ] T134 [P] [US5] Write test_sort_by_due_date_nulls_last in tests/test_filters.py
- [ ] T135 [P] [US5] Write test_sort_by_priority_descending in tests/test_filters.py
- [ ] T136 [P] [US5] Write test_sort_by_title_case_insensitive in tests/test_filters.py
- [ ] T137 [P] [US5] Write test_sort_by_created_date in tests/test_filters.py
- [ ] T138 [P] [US5] Write test_sort_stability in tests/test_filters.py

### Implementation for User Story 5

**filters.py module:**

- [ ] T139 [P] [US5] Implement sort_by_due_date() in src/todo/filters.py
- [ ] T140 [P] [US5] Implement sort_by_priority() in src/todo/filters.py
- [ ] T141 [P] [US5] Implement sort_by_title() in src/todo/filters.py
- [ ] T142 [P] [US5] Implement sort_by_created_date() in src/todo/filters.py
- [ ] T143 [P] [US5] Implement get_sort_description() helper in src/todo/filters.py
- [ ] T144 [US5] Run tests for filters.py sort functions (pytest tests/test_filters.py::test_sort* -v)

**CLI integration:**

- [ ] T145 [US5] Implement handle_sort() menu handler in src/todo/cli.py
- [ ] T146 [US5] Update display_menu() to include sort options in src/todo/cli.py
- [ ] T147 [US5] Display current sort order in task list header in src/todo/cli.py
- [ ] T148 [US5] Run full test suite (pytest --cov=src/todo)
- [ ] T149 [US5] Manual acceptance test: Sort by various criteria, verify ordering

**Checkpoint**: User Story 5 complete. Users can view tasks in preferred order.

---

## Phase 8: User Story 6 - Recurring Tasks (Priority: P6)

**Goal**: Add recurring task functionality with auto-rescheduling

**Independent Test**: User creates weekly recurring task "Team meeting" for Dec 13. When marked complete, new instance is auto-created for Dec 20 with same title, priority, and tags.

### Tests for User Story 6

- [ ] T150 [P] [US6] Write test_recurrence_pattern_enum in tests/test_models.py
- [ ] T151 [P] [US6] Write test_task_with_recurrence_requires_due_date in tests/test_models.py
- [ ] T152 [P] [US6] Write test_calculate_next_due_date_daily in tests/test_scheduler.py
- [ ] T153 [P] [US6] Write test_calculate_next_due_date_weekly in tests/test_scheduler.py
- [ ] T154 [P] [US6] Write test_calculate_next_due_date_monthly in tests/test_scheduler.py
- [ ] T155 [P] [US6] Write test_calculate_next_due_date_yearly in tests/test_scheduler.py
- [ ] T156 [P] [US6] Write test_recurrence_month_end_edge_case in tests/test_scheduler.py
- [ ] T157 [P] [US6] Write test_recurrence_leap_year_edge_case in tests/test_scheduler.py
- [ ] T158 [P] [US6] Write test_create_recurring_instance in tests/test_scheduler.py
- [ ] T159 [P] [US6] Write test_mark_complete_recurring_creates_new_task in tests/test_storage.py

### Implementation for User Story 6

**models.py:**

- [ ] T160 [US6] Implement RecurrencePattern enum (DAILY, WEEKLY, BIWEEKLY, MONTHLY, YEARLY) in src/todo/models.py
- [ ] T161 [US6] Add recurrence attribute to Task dataclass in src/todo/models.py
- [ ] T162 [US6] Add validation: recurrence requires due_date in src/todo/models.py
- [ ] T163 [US6] Run tests for models.py recurrence (pytest tests/test_models.py::test_recurrence* -v)

**scheduler.py module:**

- [ ] T164 [US6] Create scheduler.py module and import python-dateutil.rrule
- [ ] T165 [P] [US6] Implement calculate_next_due_date() using rrule in src/todo/scheduler.py
- [ ] T166 [US6] Implement create_recurring_instance() in src/todo/scheduler.py
- [ ] T167 [US6] Run tests for scheduler.py (pytest tests/test_scheduler.py -v)

**storage.py:**

- [ ] T168 [US6] Update mark_complete() to check for recurrence pattern in src/todo/storage.py
- [ ] T169 [US6] Update mark_complete() to call create_recurring_instance() in src/todo/storage.py
- [ ] T170 [US6] Run tests for storage.py recurrence (pytest tests/test_storage.py::test_mark_complete_recurring* -v)

**commands.py:**

- [ ] T171 [P] [US6] Implement parse_recurrence() helper in src/todo/commands.py
- [ ] T172 [US6] Update add_task_command() to accept recurrence_str in src/todo/commands.py
- [ ] T173 [US6] Update mark_complete_command() to return new recurring task in src/todo/commands.py
- [ ] T174 [US6] Run tests for commands.py recurrence (pytest tests/test_commands.py -v)

**CLI integration:**

- [ ] T175 [US6] Update handle_add_task() to prompt for recurrence pattern in src/todo/cli.py
- [ ] T176 [US6] Update handle_mark_complete() to display new recurring instance ID in src/todo/cli.py
- [ ] T177 [US6] Add handle_stop_recurrence() menu option in src/todo/cli.py
- [ ] T178 [US6] Update display_menu() to include recurring task management in src/todo/cli.py
- [ ] T179 [US6] Run full test suite (pytest --cov=src/todo)
- [ ] T180 [US6] Manual acceptance test: Create recurring task, complete it, verify new instance

**Checkpoint**: User Story 6 complete. Users can automate repeating tasks.

---

## Phase 9: User Story 7 - Due Date & Time Reminders (Priority: P7)

**Goal**: Add reminder notifications before due dates

**Independent Test**: User creates task due Dec 10 at 14:00 with 1-hour reminder. At 13:00, desktop notification appears with task title and due time. If system offline at reminder time, notification shows as OVERDUE when app next accessed.

### Tests for User Story 7

- [ ] T181 [P] [US7] Write test_reminder_dataclass in tests/test_models.py
- [ ] T182 [P] [US7] Write test_reminder_requires_due_date in tests/test_models.py
- [ ] T183 [P] [US7] Write test_parse_reminder_offset in tests/test_commands.py
- [ ] T184 [P] [US7] Write test_reminder_manager_add_reminder in tests/test_notifications.py
- [ ] T185 [P] [US7] Write test_reminder_manager_cancel_reminder in tests/test_notifications.py
- [ ] T186 [P] [US7] Write test_reminder_check_triggers_notification in tests/test_notifications.py
- [ ] T187 [P] [US7] Write test_reminder_cancelled_when_task_completed in tests/test_notifications.py
- [ ] T188 [P] [US7] Write test_missed_reminder_marked_overdue in tests/test_notifications.py

### Implementation for User Story 7

**models.py:**

- [ ] T189 [US7] Implement Reminder dataclass in src/todo/models.py
- [ ] T190 [US7] Add reminder_offset attribute to Task dataclass in src/todo/models.py
- [ ] T191 [US7] Run tests for models.py reminder (pytest tests/test_models.py::test_reminder* -v)

**notifications.py module:**

- [ ] T192 [US7] Create notifications.py module and import plyer, threading
- [ ] T193 [US7] Implement ReminderManager class with __init__ in src/todo/notifications.py
- [ ] T194 [P] [US7] Implement add_reminder() method in src/todo/notifications.py
- [ ] T195 [P] [US7] Implement cancel_reminder() method in src/todo/notifications.py
- [ ] T196 [US7] Implement start() method with daemon thread in src/todo/notifications.py
- [ ] T197 [US7] Implement stop() method in src/todo/notifications.py
- [ ] T198 [US7] Implement _check_loop() background thread function in src/todo/notifications.py
- [ ] T199 [US7] Implement _check_reminders() with time comparison in src/todo/notifications.py
- [ ] T200 [US7] Implement trigger_notification() using plyer in src/todo/notifications.py
- [ ] T201 [US7] Implement missed reminder handling (mark as OVERDUE) in src/todo/notifications.py
- [ ] T202 [US7] Run tests for notifications.py (pytest tests/test_notifications.py -v)

**commands.py:**

- [ ] T203 [P] [US7] Implement parse_reminder_offset() helper in src/todo/commands.py
- [ ] T204 [US7] Update add_task_command() to accept reminder_offset_str in src/todo/commands.py
- [ ] T205 [US7] Update add_task_command() to call ReminderManager.add_reminder() in src/todo/commands.py
- [ ] T206 [US7] Update mark_complete_command() to cancel reminder in src/todo/commands.py
- [ ] T207 [US7] Run tests for commands.py reminder (pytest tests/test_commands.py -v)

**CLI integration:**

- [ ] T208 [US7] Import and instantiate ReminderManager in src/todo/cli.py
- [ ] T209 [US7] Start ReminderManager background thread in main_loop() in src/todo/cli.py
- [ ] T210 [US7] Update handle_add_task() to prompt for reminder offset in src/todo/cli.py
- [ ] T211 [US7] Add handle_view_upcoming_reminders() menu option in src/todo/cli.py
- [ ] T212 [US7] Update display_menu() to include reminder options in src/todo/cli.py
- [ ] T213 [US7] Run full test suite (pytest --cov=src/todo)
- [ ] T214 [US7] Manual acceptance test: Create task with reminder, wait for notification (or mock time)

**Checkpoint**: User Story 7 complete. Users receive proactive deadline reminders.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements affecting multiple user stories

- [ ] T215 [P] Update README.md with all features and usage examples
- [ ] T216 [P] Add help text for complex features (search syntax, recurrence patterns, reminder formats) in src/todo/cli.py
- [ ] T217 [P] Add input validation error messages for all edge cases
- [ ] T218 [US1-US7] Code cleanup: Remove debug prints, refactor duplicated code
- [ ] T219 [US1-US7] Run final test suite with coverage report (pytest --cov=src/todo --cov-report=html)
- [ ] T220 [US1-US7] Verify coverage ≥85% for core modules (models, storage, commands, filters, scheduler)
- [ ] T221 [US1-US7] Run black formatting on entire codebase (black src/ tests/)
- [ ] T222 [US1-US7] Run flake8 linting (flake8 src/ tests/)
- [ ] T223 [US1-US7] Run mypy strict type checking (mypy src/ --strict)
- [ ] T224 [US1-US7] Performance validation: Test with 1000 tasks (create test_performance.py)
- [ ] T225 [US1-US7] Security review: Check for input injection, escape special characters
- [ ] T226 [US1-US7] Run quickstart.md validation (follow developer guide step-by-step)
- [ ] T227 [US1-US7] Final acceptance testing: All 7 user stories independently functional

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-9)**: All depend on Foundational phase completion
  - **US1** (Phase 3): Can start after Foundational - No dependencies on other stories
  - **US2** (Phase 4): Can start after Foundational - Builds on US1 but independently testable
  - **US3** (Phase 5): Can start after Foundational - Builds on US1 but independently testable
  - **US4** (Phase 6): Can start after Foundational - Independent (uses filters.py)
  - **US5** (Phase 7): Can start after US4 (shares filters.py) - Builds on filtering
  - **US6** (Phase 8): Can start after US1 (modifies mark_complete) - Independent scheduler module
  - **US7** (Phase 9): Can start after US1 (adds to add_task, mark_complete) - Independent notifications module
- **Polish (Phase 10)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Foundation for all other stories - provides core CRUD
- **US2 (P2)**: Enhances US1 models/CLI - independently testable
- **US3 (P3)**: Enhances US1 with dates - independently testable
- **US4 (P4)**: Independent filters module - no US1 modifications
- **US5 (P5)**: Extends US4 filters - independently testable
- **US6 (P6)**: Independent scheduler module, modifies US1 mark_complete - independently testable
- **US7 (P7)**: Independent notifications module, modifies US1 add/complete - independently testable

### Within Each User Story

1. **Tests FIRST** (TDD): Write tests, ensure they FAIL
2. **Models** before services/commands
3. **Storage/Commands** before CLI
4. **CLI handlers** last (integrate everything)
5. Run tests after each module
6. Verify story acceptance criteria

### Parallel Opportunities

**Setup Phase (Phase 1)**:
- T003, T004, T005, T006 can all run in parallel (different files)

**Foundational Phase (Phase 2)**:
- T008, T009 can run in parallel (independent installs)

**User Story 1 - Tests**:
- All test tasks (T011-T034) can run in parallel (different test files/functions)

**User Story 1 - Models**:
- T035, T036 can run in parallel (different enums)

**User Story 1 - Storage**:
- T042, T043, T044, T045, T047, T048 can run in parallel (independent functions)

**User Story 1 - Commands**:
- T051, T052, T053, T055, T056, T057, T058, T059 can run in parallel (independent functions)

**User Story 1 - CLI**:
- T062, T063, T065, T066, T067, T068, T069, T070 can run in parallel (independent handlers)

**Multiple User Stories in Parallel** (if team capacity allows):
- After Foundational phase, US1, US4, US6, US7 can start in parallel (independent modules)
- US2, US3, US5 build on US1, so start after US1 foundational elements

---

## Parallel Example: User Story 1

```bash
# Launch all test writing tasks together:
Task: "Write test_task_creation_with_defaults in tests/test_models.py"
Task: "Write test_task_validation_empty_title in tests/test_models.py"
Task: "Write test_priority_enum_values in tests/test_models.py"
# ... (all test tasks T011-T034)

# Launch all model enum tasks together:
Task: "Implement Priority enum (HIGH, MEDIUM, LOW) in src/todo/models.py"
Task: "Implement TaskType enum (SCHEDULED, ACTIVITY) in src/todo/models.py"

# Launch all independent storage functions together:
Task: "Implement create_task() function in src/todo/storage.py"
Task: "Implement get_task() function with O(1) lookup in src/todo/storage.py"
Task: "Implement get_all_tasks() function in src/todo/storage.py"
# ...

# Launch all command helpers together:
Task: "Implement parse_priority() helper in src/todo/commands.py"
Task: "Implement parse_date() helper in src/todo/commands.py"
Task: "Implement parse_tags() helper in src/todo/commands.py"
```

---

## Parallel Example: User Story 4 (Filters)

```bash
# All filter function implementations can run in parallel:
Task: "Implement search_tasks() in src/todo/filters.py"
Task: "Implement filter_by_status() in src/todo/filters.py"
Task: "Implement filter_by_priority() in src/todo/filters.py"
Task: "Implement filter_by_tag() in src/todo/filters.py"
Task: "Implement filter_by_date_range() in src/todo/filters.py"
Task: "Implement filter_overdue() in src/todo/filters.py"
Task: "Implement filter_due_today() in src/todo/filters.py"
Task: "Implement filter_due_this_week() in src/todo/filters.py"
# ...
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

**Goal**: Deliver working todo app ASAP

1. Complete Phase 1: Setup (T001-T006)
2. Complete Phase 2: Foundational (T007-T010)
3. Complete Phase 3: User Story 1 (T011-T079)
4. **STOP and VALIDATE**: Test US1 independently, deploy/demo
5. Coverage check: ≥85% for models, storage, commands
6. Manual acceptance: Create, view, update, delete, mark complete/incomplete

**Result**: Working CLI todo app with basic CRUD (MVP!)

### Incremental Delivery (Add Features Sequentially)

**Goal**: Add value incrementally without breaking existing features

1. Complete Setup + Foundational → Foundation ready
2. Add US1 → Test independently → **Deploy/Demo (MVP!)**
3. Add US2 (Priority/Tags) → Test independently → Deploy/Demo
4. Add US3 (Due Dates) → Test independently → Deploy/Demo
5. Add US4 (Search/Filter) → Test independently → Deploy/Demo
6. Add US5 (Sort) → Test independently → Deploy/Demo
7. Add US6 (Recurring) → Test independently → Deploy/Demo
8. Add US7 (Reminders) → Test independently → Deploy/Demo
9. Polish → Final QA → **Production Release**

**Each story adds value without breaking previous stories**

### Parallel Team Strategy

**Goal**: Maximum velocity with multiple developers

**Team Allocation** (after Foundational phase complete):

- **Developer A**: US1 (Primary Tier - CRUD) - BLOCKING for US2, US3
- **Developer B**: US4 (Intermediate Tier - Filters) - INDEPENDENT
- **Developer C**: US6 (Advanced Tier - Recurring) - INDEPENDENT
- **Developer D**: US7 (Advanced Tier - Reminders) - INDEPENDENT

**Sequencing**:

1. All developers complete Setup + Foundational together
2. After Foundational done:
   - Dev A starts US1 (others can start US4, US6, US7 in parallel)
   - Dev B completes US4, then picks up US5
   - Dev C completes US6
   - Dev D completes US7
3. After US1 done:
   - Dev A picks up US2, then US3
4. Integration and testing
5. Polish phase (all developers)

---

## Task Summary

**Total Tasks**: 227

**By Phase**:
- Phase 1 (Setup): 6 tasks
- Phase 2 (Foundational): 4 tasks
- Phase 3 (US1 - Basic CRUD): 69 tasks
- Phase 4 (US2 - Priority/Tags): 12 tasks
- Phase 5 (US3 - Due Dates): 15 tasks
- Phase 6 (US4 - Search/Filter): 26 tasks
- Phase 7 (US5 - Sort): 17 tasks
- Phase 8 (US6 - Recurring): 31 tasks
- Phase 9 (US7 - Reminders): 34 tasks
- Phase 10 (Polish): 13 tasks

**By User Story**:
- US1 (P1 - MVP): 69 tasks (30% of total)
- US2 (P2): 12 tasks (5%)
- US3 (P3): 15 tasks (7%)
- US4 (P4): 26 tasks (11%)
- US5 (P5): 17 tasks (7%)
- US6 (P6): 31 tasks (14%)
- US7 (P7): 34 tasks (15%)
- Setup/Foundational/Polish: 23 tasks (10%)

**Parallel Opportunities**: 120+ tasks marked [P] can run in parallel within their phase

**Independent Test Criteria**: Each user story (US1-US7) has clear acceptance criteria and can be tested independently

**Suggested MVP Scope**: Phase 1 + Phase 2 + Phase 3 (US1 only) = 79 tasks = Basic working todo app

---

## Notes

- **[P] tasks**: Different files, no dependencies - safe to parallelize
- **[US#] labels**: Map tasks to user stories for traceability
- **TDD mandated**: Constitution requires ≥85% coverage, so tests included
- **Independent stories**: Each US1-US7 delivers standalone value
- **Commit strategy**: Commit after each task or logical group
- **Checkpoints**: Stop after each phase to validate independently
- **Avoid**: Same file conflicts, cross-story dependencies that break independence

---

## Format Validation

✅ **All 227 tasks follow strict checklist format**:
- Checkbox: `- [ ]`
- Task ID: Sequential T001-T227
- [P] marker: Included where applicable (120+ parallel tasks)
- [Story] label: US1-US7 for user story tasks
- Description: Clear action with exact file path
- Examples:
  - ✅ `- [ ] T011 [P] [US1] Write test_task_creation_with_defaults in tests/test_models.py`
  - ✅ `- [ ] T035 [P] [US1] Implement Priority enum (HIGH, MEDIUM, LOW) in src/todo/models.py`
  - ✅ `- [ ] T117 [P] [US4] Implement search_tasks() in src/todo/filters.py`
