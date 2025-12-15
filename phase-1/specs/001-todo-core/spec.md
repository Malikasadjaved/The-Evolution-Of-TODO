# Feature Specification: Python CLI Todo Application

**Feature Branch**: `001-todo-core`
**Created**: 2025-12-06
**Status**: Draft
**Input**: User description: "We are building a Python CLI Todo Application with three-tier architecture (Primary, Intermediate, Advanced). PRIMARY TIER: 1.Add Task with title, description, priority (HIGH/MEDIUM/LOW), tags (Work/Home/custom), optional due date. 2.View All Tasks with status indicators, priority levels, tags, due dates, overdue flags. 3.Update Task - modify title, description, priority, tags, due date. 4.Delete Task with confirmation. 5.Mark Complete/Incomplete with timestamp. INTERMEDIATE TIER: 6.Priority Management (HIGH/MEDIUM/LOW levels). 7.Tags & Categories (Work/Home + custom tags, multiple per task). 8.Scheduled Tasks (created date, due date, overdue detection, task types: scheduled vs activity). 9.Search & Filter (by keyword in title/description, by status, by priority, by date, by tags, combinable filters). 10.Sort Tasks (by due date, priority, alphabetically, created date). ADVANCED TIER: 11.Recurring Tasks (DAILY/WEEKLY/MONTHLY/YEARLY auto-reschedule when completed). 12.Due Date & Time Reminders (desktop/browser notifications, configurable reminder times). All features must follow constitution requirements: in-memory storage, ≥85% test coverage, TDD, clean code, proper Python structure."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Basic Task Management (Priority: P1)

As a user, I want to create, view, update, delete, and mark tasks complete so that I can manage my daily todo items effectively.

**Why this priority**: This is the foundation of the todo application. Without basic CRUD operations, no other features can function. This represents the minimum viable product (MVP).

**Independent Test**: Can be fully tested by running the CLI, creating a task, viewing it in the list, updating its details, marking it complete, and deleting it. Delivers immediate value as a functional todo list.

**Acceptance Scenarios**:

1. **Given** no existing tasks, **When** user creates a task with title "Buy groceries", **Then** task is added with auto-incremented ID and default priority MEDIUM
2. **Given** user has 5 tasks, **When** user views all tasks, **Then** all 5 tasks are displayed with ID, title, status, priority, and due date
3. **Given** a task with ID 3 exists, **When** user updates its title to "Buy groceries and milk", **Then** the task title is updated while preserving ID and other fields
4. **Given** a task with ID 2 exists, **When** user deletes it after confirming (y/n), **Then** the task is removed from the list
5. **Given** an incomplete task with ID 1, **When** user marks it complete, **Then** status changes to complete and completion timestamp is recorded
6. **Given** a completed task, **When** user marks it incomplete, **Then** status changes back to incomplete

---

### User Story 2 - Task Organization with Priorities and Tags (Priority: P2)

As a user, I want to assign priorities and tags to my tasks so that I can organize them by importance and category (Work, Home, etc.).

**Why this priority**: Enhances basic task management by adding organizational structure. Enables users to focus on high-priority items and categorize tasks by context.

**Independent Test**: Can be tested by creating tasks with different priorities and tags, viewing them with visual priority indicators, and verifying tasks are properly categorized.

**Acceptance Scenarios**:

1. **Given** creating a new task, **When** user selects priority HIGH, **Then** task is marked with [H] indicator in the list
2. **Given** creating a new task, **When** user adds tags "Work" and "Urgent", **Then** both tags are displayed alongside the task
3. **Given** a task exists, **When** user updates its priority from MEDIUM to LOW, **Then** the priority indicator changes to [L]
4. **Given** multiple tasks with different priorities, **When** user views the list, **Then** HIGH priority tasks are visually distinct (colored red if colorama enabled)
5. **Given** a task with tag "Home", **When** user adds a custom tag "Weekend", **Then** task displays both tags: [Home] [Weekend]

---

### User Story 3 - Scheduled Tasks with Due Dates (Priority: P3)

As a user, I want to assign due dates to tasks and see overdue indicators so that I can meet deadlines and manage time-sensitive work.

**Why this priority**: Adds time-based task management, essential for deadline-driven work. Builds on basic task management and organization features.

**Independent Test**: Can be tested by creating tasks with due dates, waiting for dates to pass, and verifying overdue indicators appear automatically.

**Acceptance Scenarios**:

1. **Given** creating a new task, **When** user sets due date to "2025-12-10", **Then** task type is automatically set to "scheduled" and due date is stored
2. **Given** a task with due date in the past, **When** user views the list, **Then** task shows [!] overdue indicator in red
3. **Given** a task without a due date, **When** user views the list, **Then** task type is "activity" (no deadline)
4. **Given** a scheduled task, **When** user updates its due date to next week, **Then** overdue flag is removed if previously overdue
5. **Given** creating a task, **When** user sets due date with time component "2025-12-10 14:30", **Then** both date and time are stored for reminder purposes

---

### User Story 4 - Search and Filter Tasks (Priority: P4)

As a user, I want to search tasks by keyword and filter by status, priority, date, and tags so that I can quickly find relevant tasks in a large list.

**Why this priority**: Critical for usability when task lists grow beyond 10-20 items. Enables power users to efficiently manage hundreds of tasks.

**Independent Test**: Can be tested by creating 50+ tasks with varied attributes, then using search and filters to verify correct subsets are returned.

**Acceptance Scenarios**:

1. **Given** 30 tasks with various titles, **When** user searches for keyword "meeting", **Then** only tasks containing "meeting" in title or description are shown
2. **Given** 20 incomplete and 15 completed tasks, **When** user filters by status "incomplete", **Then** only 20 incomplete tasks are displayed
3. **Given** tasks with mixed priorities, **When** user filters by priority HIGH, **Then** only HIGH priority tasks are shown
4. **Given** tasks with various due dates, **When** user filters by "overdue", **Then** only tasks past their due date are shown
5. **Given** tasks with tags Work and Home, **When** user filters by tag "Work", **Then** only Work-tagged tasks are shown
6. **Given** multiple filters active, **When** user applies both "status: incomplete" AND "priority: HIGH", **Then** only incomplete HIGH priority tasks are shown (AND logic)

---

### User Story 5 - Sort Tasks by Different Criteria (Priority: P5)

As a user, I want to sort my task list by due date, priority, title, or created date so that I can view tasks in the order most relevant to my current needs.

**Why this priority**: Enhances list usability by allowing users to organize view dynamically. Complements search/filter for managing large lists.

**Independent Test**: Can be tested by creating 20 tasks with varied attributes, applying different sort orders, and verifying correct sequence.

**Acceptance Scenarios**:

1. **Given** tasks with various due dates, **When** user sorts by due date ascending, **Then** tasks are ordered from earliest to latest due date, with no-due-date tasks at the end
2. **Given** tasks with mixed priorities, **When** user sorts by priority descending, **Then** tasks are ordered HIGH → MEDIUM → LOW
3. **Given** tasks with various titles, **When** user sorts alphabetically A-Z, **Then** tasks are ordered alphabetically by title
4. **Given** tasks created at different times, **When** user sorts by created date newest first, **Then** most recently created tasks appear at the top
5. **Given** a sorted list, **When** user changes sort criteria, **Then** current sort indicator is updated in the list header

---

### User Story 6 - Recurring Tasks (Priority: P6)

As a user, I want to create recurring tasks that automatically reschedule when completed so that I don't have to manually recreate repetitive tasks like "weekly team meeting".

**Why this priority**: Automates repetitive task management, saving time for users with regular routines. Represents intelligent automation tier.

**Independent Test**: Can be tested by creating a recurring task, marking it complete, and verifying a new instance is automatically created with the next due date calculated.

**Acceptance Scenarios**:

1. **Given** creating a task, **When** user sets recurrence to WEEKLY, **Then** task is marked as recurring with pattern "weekly"
2. **Given** a weekly recurring task due Monday, **When** user marks it complete on Monday, **Then** a new task instance is created with due date next Monday
3. **Given** a monthly recurring task, **When** marked complete, **Then** next instance is created with due date one month from original due date
4. **Given** a recurring task, **When** user stops recurrence, **Then** future instances are not created after completion
5. **Given** a recurring task with tags and priority, **When** new instance is created, **Then** it inherits title, description, priority, and tags from original

---

### User Story 7 - Due Date Reminders (Priority: P7)

As a user, I want to receive notifications before task due dates so that I don't miss deadlines.

**Why this priority**: Proactive deadline management reduces stress and improves task completion rates. Represents intelligent automation tier.

**Independent Test**: Can be tested by creating a task with due date and reminder, waiting for reminder time, and verifying notification is delivered.

**Acceptance Scenarios**:

1. **Given** a task with due date tomorrow at 2pm, **When** user sets reminder for "1 hour before", **Then** notification is scheduled for tomorrow at 1pm
2. **Given** a scheduled reminder, **When** reminder time is reached, **Then** desktop notification appears with task title and due time
3. **Given** multiple tasks with reminders, **When** viewing task list, **Then** upcoming deadlines section shows tasks due in next 24 hours
4. **Given** a task with reminder, **When** user completes the task before reminder time, **Then** reminder is cancelled
5. **Given** a task with reminder, **When** user updates the due date, **Then** reminder is rescheduled based on new due date

---

### Edge Cases

- What happens when user enters an empty title? → Error message: "Task title cannot be empty"
- What happens when user tries to delete a non-existent task ID? → Error message: "Error: Task with ID {id} not found"
- What happens when user enters an invalid due date format? → Error message: "Error: Invalid date format. Use YYYY-MM-DD"
- What happens when user enters an invalid priority level? → Error message: "Error: Priority must be HIGH, MEDIUM, or LOW"
- What happens when user tries to mark a non-existent task complete? → Error message: "Error: Task with ID {id} not found"
- What happens when user applies multiple filters that return no results? → Message: "No tasks match the selected criteria"
- What happens when user creates a task with due date in the past? → Task is created but immediately flagged as overdue with [!] indicator
- What happens when user sets recurring pattern on a task without a due date? → Error message: "Error: Recurring tasks must have a due date"
- What happens when search keyword matches no tasks? → Message: "No tasks found matching '{keyword}'"
- What happens when application is restarted? → All data is lost (in-memory storage, no persistence)

## Requirements *(mandatory)*

### Functional Requirements

**PRIMARY TIER - Core CRUD Operations**

- **FR-001**: System MUST allow users to create a new task with a required title and optional description
- **FR-002**: System MUST auto-assign a unique integer ID to each new task (auto-increment)
- **FR-003**: System MUST set new tasks to "incomplete" status by default
- **FR-004**: System MUST allow users to optionally assign priority (HIGH, MEDIUM, LOW) when creating a task, defaulting to MEDIUM
- **FR-005**: System MUST allow users to optionally add one or more tags (Work, Home, or custom) when creating a task
- **FR-006**: System MUST allow users to optionally set a due date (YYYY-MM-DD format) when creating a task
- **FR-007**: System MUST display all tasks in a list view showing ID, title, description (truncated if long), status, priority, tags, and due date
- **FR-008**: System MUST display visual status indicators: [✓] for complete, [ ] for incomplete
- **FR-009**: System MUST display visual priority indicators: [H] for HIGH, [M] for MEDIUM, [L] for LOW
- **FR-010**: System MUST display [!] indicator for tasks past their due date (overdue)
- **FR-011**: System MUST display an empty state message "No tasks found" when task list is empty
- **FR-012**: System MUST allow users to update task title, description, priority, tags, and due date by task ID
- **FR-013**: System MUST preserve task ID, created date, and completion status during updates
- **FR-014**: System MUST validate that task ID exists before allowing update operations
- **FR-015**: System MUST allow users to delete a task by ID
- **FR-016**: System MUST prompt for confirmation (y/n) before deleting a task
- **FR-017**: System MUST validate that task ID exists before allowing delete operations
- **FR-018**: System MUST allow users to mark a task complete or incomplete by ID
- **FR-019**: System MUST record a completion timestamp when marking a task complete
- **FR-020**: System MUST validate that task ID exists before allowing status change operations

**INTERMEDIATE TIER - Organization & Usability**

- **FR-021**: System MUST support three priority levels: HIGH, MEDIUM, LOW (enum or string constants)
- **FR-022**: System MUST display priority levels with color coding (if colorama enabled): Red for HIGH, Yellow for MEDIUM, Green for LOW
- **FR-023**: System MUST support predefined tags: Work, Home
- **FR-024**: System MUST allow users to create custom tags (user-defined strings)
- **FR-025**: System MUST allow multiple tags per task (stored as set or list)
- **FR-026**: System MUST display tags in task view with visual separators (e.g., [Work] [Home])
- **FR-027**: System MUST auto-set created_date timestamp when task is created
- **FR-028**: System MUST allow users to specify an optional due_date when creating or updating tasks
- **FR-029**: System MUST support task types: "scheduled" (has due date) and "activity" (no due date)
- **FR-030**: System MUST auto-detect overdue status when current date/time exceeds due_date
- **FR-031**: System MUST allow users to search tasks by keyword in title or description (case-insensitive)
- **FR-032**: System MUST allow users to filter tasks by status (complete or incomplete)
- **FR-033**: System MUST allow users to filter tasks by priority level (HIGH, MEDIUM, or LOW)
- **FR-034**: System MUST allow users to filter tasks by date (due today, this week, overdue, or custom date range)
- **FR-035**: System MUST allow users to filter tasks by tag(s)
- **FR-036**: System MUST support combining multiple filters using AND logic
- **FR-037**: System MUST display search/filter result count and applied criteria
- **FR-038**: System MUST allow users to sort tasks by due date (ascending/descending, nulls last)
- **FR-039**: System MUST allow users to sort tasks by priority (HIGH → MEDIUM → LOW or reverse)
- **FR-040**: System MUST allow users to sort tasks alphabetically by title (A-Z or Z-A)
- **FR-041**: System MUST allow users to sort tasks by created date (newest/oldest first)
- **FR-042**: System MUST display current sort order indicator in list header

**ADVANCED TIER - Intelligent Features**

- **FR-043**: System MUST support recurrence patterns: DAILY, WEEKLY, BIWEEKLY, MONTHLY, YEARLY
- **FR-044**: System MUST allow users to set a recurrence pattern when creating or updating a task
- **FR-045**: System MUST validate that recurring tasks have a due date (cannot be activity type)
- **FR-046**: System MUST auto-create a new task instance when a recurring task is marked complete
- **FR-047**: System MUST preserve title, description, priority, and tags in new recurring task instance
- **FR-048**: System MUST calculate next due date based on recurrence pattern (e.g., weekly = current due date + 7 days)
- **FR-049**: System MUST allow users to stop recurrence or set an end date for recurring tasks
- **FR-050**: System MUST allow users to set due dates with optional time component (HH:MM format, 24-hour)
- **FR-051**: System MUST allow users to schedule reminder notifications before due date/time (e.g., 1 hour, 1 day before)
- **FR-052**: System MUST deliver desktop notifications (OS-level) at reminder time
- **FR-053**: System MUST display task title and due time in reminder notifications
- **FR-054**: System MUST display upcoming deadlines section showing tasks due in next 24 hours
- **FR-055**: System MUST cancel reminder when task is completed before reminder time
- **FR-056**: System MUST reschedule reminder when task due date is updated

**CONSTITUTIONAL REQUIREMENTS**

- **FR-057**: System MUST store all task data exclusively in memory using Python data structures (no external database or file persistence)
- **FR-058**: System MUST use appropriate built-in data structures (lists, dicts, sets) for task storage
- **FR-059**: System MUST ensure task ID uniqueness through auto-increment mechanism
- **FR-060**: System MUST support O(1) or O(log n) lookup operations by task ID
- **FR-061**: System MUST maintain data integrity (no orphaned references) across all CRUD operations

### Key Entities

- **Task**: Represents a todo item with metadata
  - Attributes: id (unique integer), title (required string), description (optional string), priority (HIGH/MEDIUM/LOW enum), tags (set of strings), status (complete/incomplete), task_type (scheduled/activity), created_date (timestamp), due_date (optional timestamp), completed_date (optional timestamp), recurrence (enum: NONE/DAILY/WEEKLY/BIWEEKLY/MONTHLY/YEARLY)
  - Relationships: None (tasks are independent entities)

- **Priority**: Enumeration of priority levels
  - Values: HIGH, MEDIUM, LOW

- **TaskType**: Enumeration of task classifications
  - Values: SCHEDULED (has due date), ACTIVITY (no deadline)

- **RecurrencePattern**: Enumeration of recurrence frequencies
  - Values: NONE, DAILY, WEEKLY, BIWEEKLY, MONTHLY, YEARLY

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a new task in under 30 seconds
- **SC-002**: Users can view all tasks with full details (priority, tags, status, due dates) in under 2 seconds
- **SC-003**: Users can find a specific task using search or filter in under 10 seconds
- **SC-004**: System maintains ≥85% test coverage across all modules (models, storage, commands, filters, scheduler, notifications)
- **SC-005**: System passes all quality gates (black, flake8, mypy) with Grade A or B
- **SC-006**: Users can complete all basic CRUD operations (add, view, update, delete, mark complete) without errors in a single session
- **SC-007**: System handles lists of 1000+ tasks without noticeable performance degradation (< 1 second for view/search operations)
- **SC-008**: 95% of user input validation errors display helpful, actionable error messages (no Python tracebacks shown to user)
- **SC-009**: Users can complete intermediate tier features (search, filter, sort) with 90% task completion rate on first attempt
- **SC-010**: Recurring tasks auto-create next instance within 1 second of marking previous instance complete
- **SC-011**: Reminder notifications are delivered within 10 seconds of scheduled reminder time
- **SC-012**: System supports concurrent editing of 10+ tasks without data loss or corruption

### User Satisfaction Metrics

- **SC-013**: Users can navigate the three-tier menu system without referring to help documentation
- **SC-014**: Color-coded priority indicators improve task prioritization efficiency by reducing time spent identifying high-priority items
- **SC-015**: Overdue indicators are immediately noticeable, reducing missed deadline incidents
- **SC-016**: Search and filter features reduce time to find specific tasks by at least 70% compared to manual scanning
- **SC-017**: Recurring task feature eliminates need to manually recreate repetitive tasks, saving user time

## Assumptions

- **A-001**: Users have Python 3.9+ installed on their system
- **A-002**: Users are comfortable with command-line interfaces and keyboard input
- **A-003**: Users accept that data is lost when application is closed (in-memory storage, no persistence)
- **A-004**: Users have basic understanding of due dates and task priorities
- **A-005**: Desktop notification delivery depends on OS support (Windows, macOS, Linux)
- **A-006**: Users enter dates in YYYY-MM-DD format and times in HH:MM 24-hour format
- **A-007**: System clock is accurate for overdue detection and reminder scheduling
- **A-008**: Colorama library is optionally installed for colored output (gracefully degrades if missing)
- **A-009**: Users have permission to receive desktop notifications (OS-level permissions configured)
- **A-010**: Recurring task calculation uses simple date arithmetic (e.g., monthly = same day next month, handles month-end edge cases)

## Dependencies

- **Standard Library**: Python 3.9+ (datetime, enum, typing)
- **Testing**: pytest, pytest-cov (dev dependency)
- **Code Quality**: black, flake8, mypy (dev dependency)
- **Optional**: colorama (for colored CLI output, gracefully degrades if not installed)
- **Optional (Advanced Tier)**: plyer or desktop-notifier (for cross-platform desktop notifications)
- **Optional (Advanced Tier)**: python-dateutil (for recurrence calculation if stdlib insufficient)

## Out of Scope

- **Persistence**: No file system or database storage (data lost on application exit)
- **Multi-user support**: Single-user application (no user authentication or accounts)
- **Cloud sync**: No synchronization across devices
- **Voice input**: Deferred to future enhancement (v3.0.0+)
- **Web interface**: CLI only (no browser-based UI)
- **Mobile app**: Desktop CLI only
- **Export/import**: No data export to CSV, JSON, or other formats
- **Collaboration**: No task sharing or assignment to other users
- **Attachments**: No file attachments to tasks
- **Subtasks**: No hierarchical task structures or subtask relationships
- **Task dependencies**: No task prerequisite or blocking relationships
- **Calendar integration**: No integration with external calendar applications (Google Calendar, Outlook)
- **Email reminders**: Desktop notifications only (no email delivery)
