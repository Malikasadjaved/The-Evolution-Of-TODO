# Implementation Tasks: UI Components for Task Management

**Feature**: `002-ui-components`
**Created**: 2025-12-12
**Status**: Ready for Implementation
**Input Source**: User Stories from [spec.md](./spec.md), Architecture from [plan.md](./plan.md)

---

## Overview

This document provides an ordered, executable task list for implementing the UI Components feature. Tasks are organized by user story to enable independent implementation and testing of each story.

**Total Tasks**: 72 tasks across 12 phases
**Parallel Opportunities**: 45 parallelizable tasks
**Estimated MVP Scope**: Phase 1-5 (US1-US3) = 35 tasks

---

## Implementation Strategy

### Delivery Approach

1. **MVP First**: Implement P0 user stories (US1-US3) for basic task management
2. **Incremental**: Each user story is independently testable and deployable
3. **Parallel Execution**: Many tasks within each phase can run in parallel
4. **Test Coverage**: Aim for ≥85% coverage per component

### User Story Phases

- **Phase 1**: Setup (dependencies, infrastructure)
- **Phase 2**: Foundational (shared components needed by all stories)
- **Phase 3-5**: P0 Stories (US1-US3) - Critical path for MVP
- **Phase 6-8**: P1 Stories (US9, US4, US5) - Enhanced functionality
- **Phase 9-11**: P2-P3 Stories (US6-US8) - Advanced features
- **Phase 12**: Polish & Integration

---

## Phase 1: Setup & Dependencies

**Goal**: Install dependencies and set up project infrastructure for component development.

**Tasks**:

- [ ] T001 Install @headlessui/react@^2.2.0 for accessible UI components
- [ ] T002 Install react-hook-form@^7.54.0 for form management
- [ ] T003 Install zod@^3.24.0 for schema validation
- [ ] T004 Install @hookform/resolvers@^3.9.0 to integrate Zod with React Hook Form
- [ ] T005 Install @testing-library/react@^16.1.0 @testing-library/jest-dom@^6.6.3 for component testing
- [ ] T006 Install @playwright/test@^1.49.0 for E2E testing
- [ ] T007 Install @heroicons/react@^2.2.0 for UI icons
- [ ] T008 Create frontend/__tests__/factories/ directory for test utilities
- [ ] T009 [P] Create test factory in frontend/__tests__/factories/task.ts with createMockTask and createMockTasks functions
- [ ] T010 [P] Create error utility in frontend/lib/utils/errors.ts with getErrorMessage function
- [ ] T011 Configure Jest with React Testing Library in jest.config.js
- [ ] T012 Configure Playwright with browsers and test settings in playwright.config.ts

**Validation**: All dependencies installed, test configuration working, can run `npm test` and `npx playwright test`

---

## Phase 2: Foundational Components & Hooks

**Goal**: Build shared UI primitives and custom hooks needed by all user stories.

**Independent Test**: Each component/hook can be tested in isolation with unit tests before use in stories.

### Shared UI Primitives

- [ ] T013 [P] Write tests for Button component in frontend/__tests__/components/ui/Button.test.tsx
- [ ] T014 [P] Implement Button component in frontend/components/ui/Button.tsx with variants (primary, secondary, danger, ghost) and sizes
- [ ] T015 [P] Write tests for Input component in frontend/__tests__/components/ui/Input.test.tsx
- [ ] T016 [P] Implement Input component in frontend/components/ui/Input.tsx with label, error, and helper text support
- [ ] T017 [P] Write tests for Select component in frontend/__tests__/components/ui/Select.test.tsx
- [ ] T018 [P] Implement Select component in frontend/components/ui/Select.tsx with label and error support
- [ ] T019 [P] Write tests for Badge component in frontend/__tests__/components/ui/Badge.test.tsx
- [ ] T020 [P] Implement Badge component in frontend/components/ui/Badge.tsx with variants and removable option

### Core Infrastructure Components

- [ ] T021 Write tests for Toast component in frontend/__tests__/components/Toast.test.tsx covering ToastProvider and useToast hook
- [ ] T022 Implement Toast system in frontend/lib/hooks/useToast.ts with ToastContext, ToastProvider, and useToast hook
- [ ] T023 Implement ToastContainer component in frontend/components/Toast.tsx with portal rendering and auto-dismiss
- [ ] T024 Write tests for Modal component in frontend/__tests__/components/Modal.test.tsx covering focus trap and keyboard navigation
- [ ] T025 Implement Modal component in frontend/components/Modal.tsx using Headless UI Dialog with backdrop, ESC close, and focus management

### Custom Hooks

- [ ] T026 [P] Write tests for useDebounce hook in frontend/__tests__/hooks/useDebounce.test.ts
- [ ] T027 [P] Implement useDebounce hook in frontend/lib/hooks/useDebounce.ts for search input debouncing
- [ ] T028 [P] Write tests for useModal hook in frontend/__tests__/hooks/useModal.test.ts
- [ ] T029 [P] Implement useModal hook in frontend/lib/hooks/useModal.ts for modal state management
- [ ] T030 Write tests for useTasks hook in frontend/__tests__/hooks/useTasks.test.ts covering fetch, mutations, and optimistic updates
- [ ] T031 Implement useTasks hook in frontend/lib/hooks/useTasks.ts with toggleComplete, createTask, updateTask, deleteTask, and optimistic update patterns

**Validation**: All foundational components render correctly, hooks work in isolation, test coverage ≥85%

---

## Phase 3: User Story 1 - View and Browse Tasks (P0)

**Goal**: Display all user tasks in a visual list with loading, empty, and error states. Responsive design for mobile/tablet/desktop.

**Independent Test**: Login, navigate to dashboard, verify tasks display with all details (title, priority, tags, due date, status). Test empty state, loading state, and error state.

**Priority**: P0 - Critical (MVP Foundation)

### Tasks

- [ ] T032 [US1] Write tests for TaskItem component in frontend/__tests__/components/TaskItem.test.tsx covering rendering, priority badges, tags, due dates, and completed state
- [ ] T033 [US1] Implement TaskItem component in frontend/components/TaskItem.tsx with task display, priority badge, tags, due date, completion styling
- [ ] T034 [US1] Write tests for TaskList component in frontend/__tests__/components/TaskList.test.tsx covering task fetch, loading state, empty state, error state, and responsive layout
- [ ] T035 [US1] Implement TaskList component in frontend/components/TaskList.tsx with useTasks hook, loading skeleton, empty state, error state with retry
- [ ] T036 [US1] Add responsive grid layout to TaskList (single column mobile, 2 columns tablet, 3 columns desktop) using Tailwind breakpoints
- [ ] T037 [US1] Integrate TaskList into frontend/app/page.tsx with session authentication check
- [ ] T038 [US1] Add ToastProvider to frontend/app/layout.tsx to enable global toast notifications
- [ ] T039 [US1] Write E2E test in frontend/e2e/view-tasks.spec.ts covering login → dashboard → view tasks scenarios from spec.md

**Validation**: ✅ User can view task list ✅ Loading/empty/error states work ✅ Responsive on all screen sizes ✅ E2E test passes

---

## Phase 4: User Story 2 - Mark Tasks Complete/Incomplete (P0)

**Goal**: Enable users to toggle task completion via checkbox with immediate visual feedback and API persistence.

**Independent Test**: Click checkbox on any task, verify strikethrough/opacity change, verify persistence after page refresh.

**Priority**: P0 - Critical (Core Interaction)

### Tasks

- [ ] T040 [US2] Add checkbox to TaskItem component with checked state bound to task.completed
- [ ] T041 [US2] Add onToggle callback prop to TaskItem and wire to checkbox onChange event
- [ ] T042 [US2] Update TaskList to pass toggleComplete from useTasks hook to TaskItem's onToggle prop
- [ ] T043 [US2] Add loading spinner overlay to TaskItem when isLoading prop is true
- [ ] T044 [US2] Update TaskItem tests to cover checkbox interaction and loading state
- [ ] T045 [US2] Update TaskList tests to cover optimistic updates and error rollback for toggle
- [ ] T046 [US2] Write E2E test in frontend/e2e/toggle-completion.spec.ts covering toggle scenarios and persistence from spec.md

**Validation**: ✅ Checkbox toggles completion ✅ Visual feedback immediate ✅ Optimistic update with rollback on error ✅ Persists after refresh ✅ E2E test passes

---

## Phase 5: User Story 3 - Create New Tasks (P0)

**Goal**: Enable users to create new tasks via form with validation (title, description, priority, tags, due date, recurrence).

**Independent Test**: Click "New Task", fill form, submit, verify new task appears in list.

**Priority**: P0 - Critical (Core CRUD)

### Tasks

- [ ] T047 [US3] Create Zod schema in frontend/lib/schemas/taskFormSchema.ts with validation rules from data-model.md
- [ ] T048 [US3] Write tests for useTaskForm hook in frontend/__tests__/hooks/useTaskForm.test.ts covering form state, validation, submission
- [ ] T049 [US3] Implement useTaskForm hook in frontend/lib/hooks/useTaskForm.ts using React Hook Form + Zod resolver
- [ ] T050 [US3] Write tests for TaskForm component in frontend/__tests__/components/TaskForm.test.tsx covering create mode, validation errors, submission
- [ ] T051 [US3] Implement TaskForm component in frontend/components/TaskForm.tsx with all form fields (title, description, priority, tags, due date, recurrence)
- [ ] T052 [US3] Add tag input UI to TaskForm with add/remove functionality and SUGGESTED_TAGS from data-model.md
- [ ] T053 [US3] Add "New Task" button to TaskList component that opens Modal with TaskForm in create mode
- [ ] T054 [US3] Wire TaskForm submission to useTasks createTask method in TaskList
- [ ] T055 [US3] Add success toast notification on task creation
- [ ] T056 [US3] Add error toast notification on create failure
- [ ] T057 [US3] Update TaskList tests to cover create flow with modal open/close
- [ ] T058 [US3] Write E2E test in frontend/e2e/create-task.spec.ts covering all creation scenarios from spec.md

**Validation**: ✅ Form validates all fields ✅ Creates task with all data ✅ Success/error notifications ✅ Modal closes on success ✅ E2E test passes

---

## Phase 6: User Story 9 - View Priority and Status Indicators (P1)

**Goal**: Add color-coded priority badges and overdue indicators for visual scanning.

**Independent Test**: Create tasks with different priorities and due dates, verify badges display correctly.

**Priority**: P1 - High (Visual UX)

### Tasks

- [ ] T059 [P] [US9] Create utility function getPriorityClasses in frontend/lib/utils/priority.ts mapping Priority to Tailwind classes
- [ ] T060 [P] [US9] Create utility functions for date formatting (formatDueDate, isOverdue) in frontend/lib/utils/date.ts
- [ ] T061 [US9] Update TaskItem to display priority badge using getPriorityClasses with color coding (RED=HIGH, YELLOW=MEDIUM, GREEN=LOW)
- [ ] T062 [US9] Update TaskItem to display overdue indicator when isOverdue returns true
- [ ] T063 [US9] Update TaskItem tests to verify priority badge colors and overdue indicator display
- [ ] T064 [US9] Write E2E test in frontend/e2e/visual-indicators.spec.ts covering priority and overdue scenarios from spec.md

**Validation**: ✅ Priority badges color-coded ✅ Overdue indicator shows ✅ Completed tasks have strikethrough ✅ E2E test passes

---

## Phase 7: User Story 4 - Edit Existing Tasks (P1)

**Goal**: Enable users to edit tasks via pre-populated form.

**Independent Test**: Click "Edit" on task, modify fields, save, verify changes in list.

**Priority**: P1 - High (Task Maintenance)

### Tasks

- [ ] T065 [US4] Add Edit button to TaskItem component with onClick callback prop
- [ ] T066 [US4] Update TaskList to handle edit button click, open Modal with TaskForm in edit mode with selected task
- [ ] T067 [US4] Update TaskForm to support edit mode with pre-populated form values from task prop
- [ ] T068 [US4] Update useTaskForm hook to handle edit mode and call useTasks updateTask method
- [ ] T069 [US4] Update TaskForm tests to cover edit mode with pre-population
- [ ] T070 [US4] Update TaskList tests to cover edit flow
- [ ] T071 [US4] Write E2E test in frontend/e2e/edit-task.spec.ts covering edit scenarios from spec.md

**Validation**: ✅ Form pre-populates with task data ✅ Updates task on submit ✅ Cancel doesn't save ✅ E2E test passes

---

## Phase 8: User Story 5 - Delete Tasks (P1)

**Goal**: Enable users to delete tasks with confirmation dialog.

**Independent Test**: Click "Delete", confirm in dialog, verify task removed from list.

**Priority**: P1 - High (Task Maintenance)

### Tasks

- [ ] T072 [P] [US5] Write tests for ConfirmDialog component in frontend/__tests__/components/ConfirmDialog.test.tsx
- [ ] T073 [P] [US5] Implement ConfirmDialog component in frontend/components/ConfirmDialog.tsx wrapping Modal with confirm/cancel buttons
- [ ] T074 [US5] Add Delete button to TaskItem component with onClick callback prop
- [ ] T075 [US5] Update TaskList to handle delete button click, open ConfirmDialog with task details
- [ ] T076 [US5] Wire ConfirmDialog confirm action to useTasks deleteTask method
- [ ] T077 [US5] Add success/error toast notifications for delete operations
- [ ] T078 [US5] Update TaskItem tests to include delete button
- [ ] T079 [US5] Update TaskList tests to cover delete flow with confirmation
- [ ] T080 [US5] Write E2E test in frontend/e2e/delete-task.spec.ts covering delete scenarios from spec.md

**Validation**: ✅ Confirmation dialog shows task title ✅ Cancel doesn't delete ✅ Confirm deletes and shows toast ✅ E2E test passes

---

## Phase 9: User Story 6 - Search Tasks by Keyword (P2)

**Goal**: Enable real-time keyword search filtering (300ms debounce).

**Independent Test**: Type keyword in search bar, verify only matching tasks display.

**Priority**: P2 - Medium (Power User Feature)

### Tasks

- [ ] T081 [P] [US6] Create SearchBar component in frontend/components/SearchBar.tsx with debounced input using useDebounce hook
- [ ] T082 [P] [US6] Write tests for SearchBar component in frontend/__tests__/components/SearchBar.test.tsx
- [ ] T083 [US6] Add search state to TaskList component with debouncedSearch
- [ ] T084 [US6] Implement search filtering logic in TaskList using matchesFilters utility from data-model.md
- [ ] T085 [US6] Add SearchBar to TaskList component with onSearchChange callback
- [ ] T086 [US6] Add empty state for zero search results with "No tasks found matching '[keyword]'" message
- [ ] T087 [US6] Update TaskList tests to cover search functionality
- [ ] T088 [US6] Write E2E test in frontend/e2e/search-tasks.spec.ts covering search scenarios from spec.md

**Validation**: ✅ Search debounces at 300ms ✅ Filters by title/description ✅ Empty state shows ✅ Clear search resets ✅ E2E test passes

---

## Phase 10: User Story 7 - Filter Tasks (P2)

**Goal**: Enable filtering by status, priority, and tags with AND logic.

**Independent Test**: Select filter options, verify only matching tasks display with filter chips.

**Priority**: P2 - Medium (Organization)

### Tasks

- [ ] T089 [P] [US7] Create FilterPanel component in frontend/components/FilterPanel.tsx with status, priority, and tag filters
- [ ] T090 [P] [US7] Write tests for FilterPanel component in frontend/__tests__/components/FilterPanel.test.tsx
- [ ] T091 [US7] Add filter state to TaskList component with TaskFilters interface from data-model.md
- [ ] T092 [US7] Implement filter logic in TaskList using matchesFilters utility with AND logic
- [ ] T093 [US7] Add FilterPanel to TaskList with onFilterChange callback
- [ ] T094 [US7] Create FilterChips component in frontend/components/FilterChips.tsx to display active filters
- [ ] T095 [US7] Add "Clear Filters" button to reset all filters
- [ ] T096 [US7] Update TaskList tests to cover filter functionality with multiple filters
- [ ] T097 [US7] Write E2E test in frontend/e2e/filter-tasks.spec.ts covering filter scenarios from spec.md

**Validation**: ✅ Filters apply with AND logic ✅ Filter chips display ✅ Clear filters resets ✅ E2E test passes

---

## Phase 11: User Story 8 - Sort Tasks (P3)

**Goal**: Enable sorting by due date, priority, title, created date.

**Independent Test**: Select sort option, verify task order changes.

**Priority**: P3 - Low (Nice-to-Have)

### Tasks

- [ ] T098 [P] [US8] Create SortDropdown component in frontend/components/SortDropdown.tsx with sort options
- [ ] T099 [P] [US8] Write tests for SortDropdown component in frontend/__tests__/components/SortDropdown.test.tsx
- [ ] T100 [US8] Add sort state to TaskList component with SortOption interface from data-model.md
- [ ] T101 [US8] Implement sortTasks utility function in TaskList using comparators from data-model.md
- [ ] T102 [US8] Add SortDropdown to TaskList with onSortChange callback
- [ ] T103 [US8] Update TaskList tests to cover sort functionality
- [ ] T104 [US8] Write E2E test in frontend/e2e/sort-tasks.spec.ts covering sort scenarios from spec.md

**Validation**: ✅ Sorts by all criteria ✅ Sort selection indicated ✅ E2E test passes

---

## Phase 12: Polish & Cross-Cutting Concerns

**Goal**: Final integration, performance optimization, accessibility audit, and comprehensive testing.

### Tasks

- [ ] T105 [P] Add loading skeleton placeholders to TaskList for better perceived performance
- [ ] T106 [P] Add React.memo to TaskItem component for performance optimization with large lists
- [ ] T107 [P] Add useMemo to TaskList for filtered/sorted task computation
- [ ] T108 [P] Add useCallback to TaskList for memoized event handlers
- [ ] T109 Run accessibility audit with axe-core on all components and fix violations
- [ ] T110 Test keyboard navigation (Tab, Enter, ESC, Arrow keys) across all components
- [ ] T111 Verify ARIA labels and roles on all interactive elements per contracts/component-api.md
- [ ] T112 Test responsive design on all breakpoints (375px, 768px, 1024px, 1440px)
- [ ] T113 Write comprehensive integration test in frontend/e2e/full-workflow.spec.ts covering complete user journey (login → create → edit → complete → filter → delete)
- [ ] T114 Run all tests and verify ≥85% code coverage threshold
- [ ] T115 Fix any failing tests or coverage gaps
- [ ] T116 Run type checking with `npm run type-check` and fix all TypeScript errors
- [ ] T117 Run linter with `npm run lint` and fix all ESLint warnings
- [ ] T118 Format code with Prettier `npm run format`
- [ ] T119 Test with 500+ tasks to verify performance meets SC-008 (no degradation)
- [ ] T120 Document any known issues or future enhancements in spec.md
- [ ] T121 Create demo video or screenshots for documentation

**Validation**: ✅ All tests pass ✅ Coverage ≥85% ✅ No accessibility violations ✅ Performance targets met ✅ Production-ready

---

## Dependency Graph

### User Story Completion Order

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← Must complete before any user story
    ↓
    ├─→ Phase 3 (US1: View Tasks) ← MVP Critical Path Start
    │       ↓
    ├─→ Phase 4 (US2: Toggle Completion) ← Depends on US1 for TaskItem
    │       ↓
    ├─→ Phase 5 (US3: Create Tasks) ← Depends on US1 for TaskList integration
    │       ↓
    ├─→ Phase 6 (US9: Visual Indicators) ← Enhances US1 TaskItem
    │
    ├─→ Phase 7 (US4: Edit Tasks) ← Depends on US1, US3 (TaskForm)
    │
    ├─→ Phase 8 (US5: Delete Tasks) ← Depends on US1
    │
    ├─→ Phase 9 (US6: Search) ← Depends on US1 (TaskList)
    │
    ├─→ Phase 10 (US7: Filters) ← Depends on US1 (TaskList)
    │
    └─→ Phase 11 (US8: Sort) ← Depends on US1 (TaskList)
            ↓
    Phase 12 (Polish) ← After all features complete
```

**Critical Dependencies**:
- Phase 2 (Foundational) BLOCKS all user stories
- US1 (View Tasks) BLOCKS US2, US4, US5, US6, US7, US8, US9
- US3 (Create Tasks) BLOCKS US4 (shared TaskForm)

**Independent Stories** (can be implemented in parallel after US1):
- US6 (Search), US7 (Filters), US8 (Sort) are independent of each other
- US4 (Edit) and US5 (Delete) are independent of each other
- US9 (Visual Indicators) is independent enhancement

---

## Parallel Execution Examples

### Phase 2 (Foundational) - Maximum Parallelism

**Parallel Group 1** (UI Primitives - 4 agents):
- Agent A: T013-T014 (Button)
- Agent B: T015-T016 (Input)
- Agent C: T017-T018 (Select)
- Agent D: T019-T020 (Badge)

**Sequential**: T021-T025 (Toast + Modal - require completion of above)

**Parallel Group 2** (Hooks - 3 agents):
- Agent A: T026-T027 (useDebounce)
- Agent B: T028-T029 (useModal)
- Agent C: T030-T031 (useTasks)

### Phase 3 (US1) - Parallel Implementation

**Parallel Group**:
- Agent A: T032-T033 (TaskItem component)
- Agent B: T034-T036 (TaskList component)

**Sequential**: T037-T039 (Integration + E2E)

### Phase 4-11 - Story-Level Parallelism

After Phase 3 completes:
- Agent A: Phase 4 (US2 - Toggle)
- Agent B: Phase 5 (US3 - Create)
- Agent C: Phase 6 (US9 - Indicators)

After Phase 5 completes:
- Agent A: Phase 7 (US4 - Edit, needs TaskForm)
- Agent B: Phase 8 (US5 - Delete)
- Agent C: Phase 9 (US6 - Search)
- Agent D: Phase 10 (US7 - Filters)
- Agent E: Phase 11 (US8 - Sort)

---

## MVP Scope Recommendation

**Minimum Viable Product**: Phases 1-5 (35 tasks)
- ✅ Setup & Foundational (T001-T031)
- ✅ US1: View Tasks (T032-T039)
- ✅ US2: Toggle Completion (T040-T046)
- ✅ US3: Create Tasks (T047-T058)

**First Enhancement**: Add Phase 6 (US9: Visual Indicators) for better UX

**Full Feature**: All phases (121 tasks) for complete functionality

---

## Success Metrics

- **Task Atomicity**: Each task references specific file path ✅
- **Story Independence**: Each user story has independent test criteria ✅
- **Parallel Opportunities**: 45/121 tasks marked [P] for parallelization ✅
- **Test Coverage Target**: ≥85% per constitution requirements ✅
- **Story Completeness**: All 9 user stories from spec.md included ✅

---

**Ready for Implementation**: Start with Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (US1 MVP)

**Next Command**: Begin implementation with `/sp.implement` or start TDD workflow with Phase 1 tasks