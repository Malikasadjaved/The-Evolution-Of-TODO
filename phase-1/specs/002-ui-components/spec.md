# Feature Specification: UI Components for Task Management

**Feature Branch**: `002-ui-components`
**Created**: 2025-12-10
**Status**: Draft
**Input**: User description: "Feature: UI Components for Task Management - Build the remaining React components needed for the Phase II web application to enable full task management functionality including TaskList, TaskForm, TaskItem, Modal, Toast, and ConfirmDialog components with full CRUD operations, filters, search, and sorting."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View and Browse Tasks (Priority: P0 - Critical)

A user can view all their tasks in a visual list, see task details at a glance (title, priority, tags, due date, completion status), and quickly assess their workload and priorities.

**Why this priority**: Core MVP functionality - users cannot use the application without being able to see their tasks. This is the foundation upon which all other features build.

**Independent Test**: Can be fully tested by logging in, navigating to dashboard, and verifying that tasks are displayed with all relevant details visible. Delivers immediate value by allowing users to see their task list.

**Acceptance Scenarios**:

1. **Given** I am logged in as a user with 5 tasks, **When** I navigate to the dashboard, **Then** I see all 5 tasks displayed with titles, priorities, tags, due dates, and completion status
2. **Given** I am logged in as a new user with no tasks, **When** I navigate to the dashboard, **Then** I see an empty state message with a "Create Task" call-to-action button
3. **Given** I am viewing my task list, **When** tasks are loading from the API, **Then** I see a loading skeleton placeholder
4. **Given** task data fails to load, **When** the API returns an error, **Then** I see an error message with a "Retry" button
5. **Given** I am viewing tasks on mobile, **When** screen width is less than 768px, **Then** tasks are displayed in a single-column list view
6. **Given** I am viewing tasks on desktop, **When** screen width is 1024px or greater, **Then** tasks are displayed in a multi-column grid view

---

### User Story 2 - Mark Tasks Complete/Incomplete (Priority: P0 - Critical)

A user can quickly toggle task completion status by clicking a checkbox, allowing for rapid task management without navigating away from the list view.

**Why this priority**: Essential for basic task management - users need to mark work as done. This is the primary interaction pattern for todo applications.

**Independent Test**: Can be tested by clicking the checkbox on any task and verifying the task's visual state changes (strikethrough, opacity) and completion status persists after page refresh.

**Acceptance Scenarios**:

1. **Given** I have an incomplete task, **When** I click the completion checkbox, **Then** the task is marked complete, appears with strikethrough text, and the change persists after page refresh
2. **Given** I have a completed task, **When** I click the completion checkbox, **Then** the task is marked incomplete, strikethrough is removed, and the change persists
3. **Given** I toggle a task's completion, **When** the API request is in progress, **Then** the checkbox shows a loading state
4. **Given** the API request fails, **When** I attempt to toggle completion, **Then** I see an error notification and the checkbox reverts to its original state

---

### User Story 3 - Create New Tasks (Priority: P0 - Critical)

A user can create a new task by filling out a form with title, description, priority, tags, due date, task type, and recurrence settings, enabling them to add work items to their list.

**Why this priority**: Core CRUD operation - users cannot build their task list without the ability to create tasks. Required for MVP.

**Independent Test**: Can be tested by clicking "New Task" button, filling out the form, submitting, and verifying the new task appears in the task list.

**Acceptance Scenarios**:

1. **Given** I click "New Task", **When** I fill in only the required title field and submit, **Then** a new task is created with default values for optional fields
2. **Given** I am creating a task, **When** I fill in all fields (title, description, priority, tags, due date, task type, recurrence) and submit, **Then** a new task is created with all specified values
3. **Given** I submit the form with an empty title, **When** validation runs, **Then** I see an error message "Title is required" below the title field
4. **Given** I enter a title with 201 characters, **When** validation runs, **Then** I see an error message "Title must be 200 characters or less"
5. **Given** I successfully create a task, **When** the API request completes, **Then** I see a success notification "Task created!" and the form modal closes
6. **Given** the API request fails, **When** I submit the form, **Then** I see an error notification with the error message and the form remains open

---

### User Story 4 - Edit Existing Tasks (Priority: P1 - High)

A user can edit any task by clicking an "Edit" button, modifying fields in a pre-populated form, and saving changes to update the task details.

**Why this priority**: Essential for task maintenance - users need to update tasks as requirements change. Very common workflow but not required for initial MVP.

**Independent Test**: Can be tested by clicking "Edit" on any task, modifying one or more fields, saving, and verifying changes appear in the task list.

**Acceptance Scenarios**:

1. **Given** I click "Edit" on a task, **When** the edit form opens, **Then** all existing task fields are pre-populated with current values
2. **Given** I am editing a task, **When** I modify the title and submit, **Then** the task is updated with the new title and changes persist
3. **Given** I am editing a task, **When** I click "Cancel", **Then** no changes are saved and the form modal closes
4. **Given** I modify a task's priority from HIGH to LOW, **When** I submit, **Then** the task's priority badge updates from red to green in the task list

---

### User Story 5 - Delete Tasks (Priority: P1 - High)

A user can delete a task by clicking a "Delete" button and confirming the destructive action in a confirmation dialog, removing unwanted tasks from their list.

**Why this priority**: Important for task maintenance but less critical than create/read operations. Users can work around deletion by marking tasks complete.

**Independent Test**: Can be tested by clicking "Delete" on any task, confirming in the dialog, and verifying the task is removed from the list.

**Acceptance Scenarios**:

1. **Given** I click "Delete" on a task, **When** the confirmation dialog appears, **Then** I see the task title in the confirmation message "Are you sure you want to delete '[Task Title]'?"
2. **Given** a confirmation dialog is open, **When** I click "Cancel", **Then** the task is not deleted and the dialog closes
3. **Given** a confirmation dialog is open, **When** I click "Delete", **Then** the task is removed from the list and I see a success notification "Task deleted!"
4. **Given** the API delete request fails, **When** I confirm deletion, **Then** I see an error notification and the task remains in the list

---

### User Story 6 - Search Tasks by Keyword (Priority: P2 - Medium)

A user can search for tasks by typing keywords in a search bar, with results filtering in real-time to show only matching tasks based on title or description content.

**Why this priority**: Enhances usability for users with many tasks but not required for basic task management. Power user feature.

**Independent Test**: Can be tested by typing a keyword in the search bar and verifying only tasks containing that keyword in title or description are displayed.

**Acceptance Scenarios**:

1. **Given** I have 10 tasks, **When** I type "project" in the search bar, **Then** only tasks with "project" in the title or description are displayed
2. **Given** I am typing in the search bar, **When** I pause typing for 300ms, **Then** the search is executed (debounced)
3. **Given** search results are displayed, **When** I clear the search bar, **Then** all tasks are displayed again
4. **Given** no tasks match my search, **When** search completes, **Then** I see an empty state message "No tasks found matching '[keyword]'"

---

### User Story 7 - Filter Tasks by Status, Priority, or Tags (Priority: P2 - Medium)

A user can apply filters to view only tasks matching specific criteria (completed/pending status, priority level, or tags), helping them focus on relevant subsets of their work.

**Why this priority**: Enhances organization for users with many tasks. Not essential for basic usage but valuable for productivity.

**Independent Test**: Can be tested by selecting filter options and verifying only matching tasks are displayed, with filter chips shown above the list.

**Acceptance Scenarios**:

1. **Given** I select "Pending" status filter, **When** filter is applied, **Then** only incomplete tasks are displayed
2. **Given** I select "HIGH" priority filter, **When** filter is applied, **Then** only high-priority tasks are displayed
3. **Given** I select both status and priority filters, **When** filters are applied, **Then** only tasks matching BOTH criteria are displayed (AND logic)
4. **Given** I have active filters, **When** I click "Clear Filters", **Then** all tasks are displayed and filter selections are reset
5. **Given** I have applied filters, **When** filters are active, **Then** I see filter chips displayed above the task list showing which filters are applied

---

### User Story 8 - Sort Tasks by Different Criteria (Priority: P3 - Low)

A user can sort tasks by created date, title, due date, or priority, allowing them to view their tasks in their preferred order for better organization.

**Why this priority**: Nice-to-have feature for organization. Users can work effectively with default sorting (newest first).

**Independent Test**: Can be tested by selecting different sort options and verifying task order changes accordingly.

**Acceptance Scenarios**:

1. **Given** I select "Due Date (earliest first)" sort, **When** sort is applied, **Then** tasks are ordered with nearest due dates first, followed by tasks without due dates
2. **Given** I select "Priority (HIGH→LOW)" sort, **When** sort is applied, **Then** tasks are ordered by priority: HIGH, then MEDIUM, then LOW
3. **Given** I select "Title (A-Z)" sort, **When** sort is applied, **Then** tasks are ordered alphabetically by title
4. **Given** a sort option is selected, **When** viewing the task list, **Then** the current sort is indicated in the sort dropdown

---

### User Story 9 - View Priority and Status Indicators (Priority: P1 - High)

A user can visually distinguish tasks by priority (color-coded badges) and identify overdue tasks (red warning indicators), enabling quick visual scanning of their task list.

**Why this priority**: Critical for usability - visual cues greatly improve task management efficiency and are expected in modern task applications.

**Independent Test**: Can be tested by creating tasks with different priorities and due dates, then verifying visual indicators display correctly.

**Acceptance Scenarios**:

1. **Given** I have a HIGH priority task, **When** viewing the task list, **Then** the task displays a red priority badge
2. **Given** I have a MEDIUM priority task, **When** viewing the task list, **Then** the task displays a yellow priority badge
3. **Given** I have a LOW priority task, **When** viewing the task list, **Then** the task displays a green priority badge
4. **Given** I have a task with a due date in the past, **When** viewing the task list, **Then** the task displays a red "OVERDUE" indicator with an exclamation icon
5. **Given** I have a completed task, **When** viewing the task list, **Then** the task displays with strikethrough text and reduced opacity

---

### Edge Cases

- What happens when I try to create a task with only whitespace in the title field? (Should be rejected with validation error)
- How does the system handle extremely long descriptions (e.g., 10,000 characters)? (Should be truncated in list view with "Read more" link)
- What happens if I rapidly toggle a task's completion status multiple times? (Should queue requests or show loading state)
- How does the search handle special characters or regex patterns? (Should escape/sanitize input)
- What happens when filtering returns zero results? (Should show empty state with active filters displayed)
- How does the form handle concurrent edits (two tabs editing the same task)? (Last write wins, but acceptable for MVP)
- What happens if the API is slow or times out? (Should show loading states with timeout messages)
- How does the system handle very large task lists (1000+ tasks)? (May need pagination or virtual scrolling in future, but load all for MVP)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display all tasks belonging to the authenticated user in a visual list or grid format
- **FR-002**: System MUST show a loading skeleton while fetching tasks from the API
- **FR-003**: System MUST display an empty state with "Create Task" call-to-action when user has no tasks
- **FR-004**: System MUST allow users to toggle task completion status via checkbox with visual feedback (strikethrough, opacity change)
- **FR-005**: System MUST persist completion status changes via API and maintain state after page refresh
- **FR-006**: System MUST provide a form for creating new tasks with fields: title (required), description, priority, tags, due date, task type, recurrence
- **FR-007**: System MUST validate title field as required with 1-200 character limit
- **FR-008**: System MUST validate description field with 1000 character limit
- **FR-009**: System MUST display validation errors below form fields in real-time
- **FR-010**: System MUST display success notifications ("Task created!", "Task updated!", "Task deleted!")
- **FR-011**: System MUST display error notifications when API requests fail with user-friendly messages
- **FR-012**: System MUST provide edit functionality that pre-populates form with existing task data
- **FR-013**: System MUST allow users to cancel form submissions without saving changes
- **FR-014**: System MUST display confirmation dialog before deleting tasks with task title in message
- **FR-015**: System MUST remove deleted tasks from the list and persist deletion via API
- **FR-016**: System MUST provide search functionality that filters tasks by keyword in title or description (case-insensitive)
- **FR-017**: System MUST debounce search input with 300ms delay
- **FR-018**: System MUST provide filter controls for status (all/pending/completed), priority (HIGH/MEDIUM/LOW), and tags
- **FR-019**: System MUST apply multiple filters with AND logic (all conditions must match)
- **FR-020**: System MUST display active filters as removable chips above task list
- **FR-021**: System MUST provide sort options: created date, title, due date, priority
- **FR-022**: System MUST indicate current sort selection in UI
- **FR-023**: System MUST display priority badges with color coding (RED for HIGH, YELLOW for MEDIUM, GREEN for LOW)
- **FR-024**: System MUST display "OVERDUE" indicator with red styling for tasks past due date
- **FR-025**: System MUST display tags as chips/badges on each task
- **FR-026**: System MUST format due dates in human-readable format (e.g., "Dec 15, 2025")
- **FR-027**: System MUST display tasks in grid layout on desktop (≥1024px) and list layout on mobile (<768px)
- **FR-028**: System MUST show hover state on tasks with shadow and action buttons
- **FR-029**: System MUST provide modal dialog component with backdrop overlay, ESC key close, and focus trap
- **FR-030**: System MUST auto-dismiss toast notifications after 3 seconds with manual close option
- **FR-031**: System MUST retrieve authenticated user ID from session for all API calls
- **FR-032**: System MUST handle API errors gracefully with retry options where appropriate

### Key Entities

- **Task**: Represents a user's todo item with properties: id, user_id, title, description, priority, tags, due_date, task_type, recurrence_pattern, completed, completed_at, created_at, updated_at, is_overdue
- **User Session**: Contains authenticated user information (id, email, name) from Better Auth JWT
- **Filter State**: Represents active filters including status, priority, tags, and date range
- **Form State**: Represents task form data during create/edit operations including validation errors

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view their complete task list within 2 seconds of page load
- **SC-002**: Users can create a new task in under 30 seconds from clicking "New Task" to seeing it in the list
- **SC-003**: Users can toggle task completion with immediate visual feedback (under 100ms) and API confirmation
- **SC-004**: Search filters task list in under 300ms after user stops typing
- **SC-005**: All filter and sort operations complete in under 500ms
- **SC-006**: Form validation provides immediate feedback (under 100ms) when users blur form fields
- **SC-007**: 95% of users successfully complete their first CRUD operation (create, edit, delete) without errors
- **SC-008**: Task list remains responsive and usable with up to 500 tasks loaded
- **SC-009**: All interactive elements are keyboard accessible with visible focus indicators
- **SC-010**: All components render without console errors or warnings in browser dev tools
- **SC-011**: Application works correctly on mobile (≥375px width), tablet (768-1023px), and desktop (≥1024px) screen sizes
- **SC-012**: No data loss occurs during failed API requests (optimistic updates revert on error)
