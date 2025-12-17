# Feature Specification: Full-Stack Web Application (Phase 2)

**Feature Branch**: `001-fullstack-web-app`
**Created**: 2025-12-15
**Status**: Draft
**Input**: User description: "Phase 2: Full-Stack Web Application - Transform Phase 1 CLI todo app into a modern multi-user web application with persistent storage. Tech Stack: Next.js 16+ (frontend), FastAPI (backend), SQLModel (ORM), Neon PostgreSQL (database), Better Auth (authentication). Features: All three tiers (Primary: User auth + 5 basic CRUD operations, Intermediate: Priority, tags, search, filter, sort, Advanced: Recurring tasks, reminders). JWT authentication with user isolation. Monorepo structure with Spec-Kit Plus. Follow phase-2-constitution.md requirements."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - User Authentication & Account Management (Priority: P0)

A new user can create an account and sign in to access their personal task management workspace.

**Why this priority**: Foundation for multi-user system. Without authentication, no other features can work. This is the absolute prerequisite for Phase 2 - transforms single-user CLI into multi-user web application.

**Independent Test**: Can be fully tested by creating an account, signing in, signing out, and verifying that sessions are properly managed. Delivers immediate value: secure, isolated user workspaces.

**Acceptance Scenarios**:

1. **Given** I am a new user on the signup page, **When** I provide a valid email and password, **Then** my account is created and I am automatically signed in
2. **Given** I have an existing account, **When** I enter correct credentials on the login page, **Then** I am signed in and redirected to my dashboard
3. **Given** I am signed in, **When** I click the sign out button, **Then** my session ends and I am redirected to the login page
4. **Given** I enter an invalid email format, **When** I attempt to sign up, **Then** I see a clear validation error message
5. **Given** I enter an email that already exists, **When** I attempt to sign up, **Then** I see an error indicating the email is already registered
6. **Given** I enter incorrect password, **When** I attempt to sign in, **Then** I see an authentication error without revealing whether the email exists

---

### User Story 2 - Create and View Tasks (Priority: P1)

As an authenticated user, I can add new tasks to my list and view all my tasks in one place.

**Why this priority**: Core value proposition of a todo app. Users need to capture tasks before they can do anything else with them. First slice of actual task management functionality.

**Independent Test**: Can be fully tested by signing in, creating several tasks with different properties, and verifying they appear in the task list. Delivers standalone value: basic task capture and display.

**Acceptance Scenarios**:

1. **Given** I am signed in and on the dashboard, **When** I click "Add Task" and enter a title, **Then** a new task is created and appears in my task list
2. **Given** I am creating a task, **When** I provide a title and optional description, **Then** the task is saved with both fields
3. **Given** I have created multiple tasks, **When** I view my dashboard, **Then** I see all my tasks with their titles, descriptions, and status indicators
4. **Given** I have no tasks, **When** I view my dashboard, **Then** I see a helpful empty state message encouraging me to create my first task
5. **Given** another user has tasks, **When** I view my dashboard, **Then** I only see my own tasks, never other users' tasks

---

### User Story 3 - Update and Delete Tasks (Priority: P1)

As a user, I can modify task details and remove tasks I no longer need.

**Why this priority**: Essential CRUD operations. Users need to correct mistakes, update information, and remove completed or irrelevant tasks. Completes basic task lifecycle management.

**Independent Test**: Can be fully tested by creating a task, editing its title/description, and then deleting it. Delivers standalone value: full control over task data.

**Acceptance Scenarios**:

1. **Given** I have a task, **When** I click edit and change the title, **Then** the task is updated with the new title
2. **Given** I have a task, **When** I click edit and modify the description, **Then** the description is saved correctly
3. **Given** I have a task, **When** I click delete and confirm, **Then** the task is permanently removed from my list
4. **Given** I have a task, **When** I click delete but cancel the confirmation, **Then** the task remains unchanged
5. **Given** I attempt to edit another user's task via API, **When** the request is processed, **Then** I receive a 403 Forbidden error

---

### User Story 4 - Mark Tasks Complete/Incomplete (Priority: P1)

As a user, I can toggle tasks between complete and incomplete states to track my progress.

**Why this priority**: Core productivity feature. Users need to mark accomplishments and see what's left to do. Provides immediate satisfaction and progress tracking.

**Independent Test**: Can be fully tested by creating tasks and toggling their completion status. Delivers standalone value: progress tracking and task lifecycle completion.

**Acceptance Scenarios**:

1. **Given** I have an incomplete task, **When** I click the checkbox, **Then** the task is marked as complete with a visual indicator
2. **Given** I have a complete task, **When** I click the checkbox again, **Then** the task is marked as incomplete
3. **Given** I mark a task complete, **When** I refresh the page, **Then** the task remains in the completed state
4. **Given** I complete a task, **When** the state changes, **Then** a completion timestamp is recorded

---

### User Story 5 - View Task Details (Priority: P2)

As a user, I can click on any task to see its full details in an expanded view.

**Why this priority**: Enhances usability for tasks with long descriptions or detailed information. Keeps the main list clean while providing access to full details.

**Independent Test**: Can be fully tested by creating a task with a long description and viewing it in detail view. Delivers standalone value: better information architecture.

**Acceptance Scenarios**:

1. **Given** I have a task with a long description, **When** I click on the task, **Then** I see the full details including complete description
2. **Given** I am viewing task details, **When** I click close or back, **Then** I return to the main task list
3. **Given** I am viewing task details, **When** the data loads, **Then** I see all task properties including creation date and last updated timestamp

---

### User Story 6 - Assign Task Priority (Priority: P2)

As a user, I can assign priority levels (High, Medium, Low) to my tasks to organize by importance.

**Why this priority**: Helps users focus on what matters most. Common productivity pattern that enhances basic task management with prioritization.

**Independent Test**: Can be fully tested by creating tasks with different priorities and verifying they display correctly. Delivers standalone value: importance-based task organization.

**Acceptance Scenarios**:

1. **Given** I am creating a task, **When** I select "High" priority, **Then** the task is created with High priority and displays a visual indicator
2. **Given** I have a task, **When** I edit it and change the priority to "Low", **Then** the priority updates and the visual indicator changes accordingly
3. **Given** I have not specified a priority, **When** I create a task, **Then** it defaults to "Medium" priority
4. **Given** I have tasks with different priorities, **When** I view my list, **Then** I can visually distinguish them by color-coded badges

---

### User Story 7 - Organize Tasks with Tags (Priority: P2)

As a user, I can add tags/categories (Work, Home, or custom) to organize tasks by context.

**Why this priority**: Enables flexible categorization beyond priority. Users can group related tasks and filter by context (work vs personal, projects, etc.).

**Independent Test**: Can be fully tested by creating tasks with different tags and verifying tag display and assignment. Delivers standalone value: context-based task organization.

**Acceptance Scenarios**:

1. **Given** I am creating a task, **When** I add the "Work" tag, **Then** the task is created with that tag and displays it as a badge
2. **Given** I am creating a task, **When** I create a custom tag "Shopping", **Then** the new tag is created and added to the task
3. **Given** I have a task, **When** I add multiple tags ("Work" and "Urgent"), **Then** both tags are displayed on the task
4. **Given** I have a task with tags, **When** I remove a tag, **Then** the tag is removed from that task only

---

### User Story 8 - Schedule Tasks with Due Dates (Priority: P2)

As a user, I can set due dates on tasks to manage deadlines and time-sensitive work.

**Why this priority**: Critical for deadline-driven work. Enables users to plan ahead and identify overdue items. Foundation for time-based task management.

**Independent Test**: Can be fully tested by creating tasks with various due dates (past, present, future) and verifying overdue detection. Delivers standalone value: deadline management.

**Acceptance Scenarios**:

1. **Given** I am creating a task, **When** I set a due date for tomorrow, **Then** the task shows the due date in the task list
2. **Given** I have a task with a due date in the past, **When** I view my tasks, **Then** the task displays an "overdue" indicator
3. **Given** I am editing a task, **When** I remove the due date, **Then** the task becomes an "activity" type with no deadline
4. **Given** I set a due date, **When** I save the task, **Then** the task type is automatically set to "scheduled"

---

### User Story 9 - Search Tasks by Keyword (Priority: P2)

As a user, I can search for tasks by typing keywords that match the title or description.

**Why this priority**: Essential for power users with many tasks. Enables quick retrieval of specific tasks without scrolling through long lists.

**Independent Test**: Can be fully tested by creating tasks with distinct keywords and searching for them. Delivers standalone value: fast task retrieval.

**Acceptance Scenarios**:

1. **Given** I have tasks with various titles, **When** I type "meeting" in the search box, **Then** I see only tasks containing "meeting" in title or description
2. **Given** I am searching, **When** I clear the search box, **Then** all tasks are displayed again
3. **Given** I search for a keyword that doesn't exist, **When** the search completes, **Then** I see a "no results" message
4. **Given** I am typing in the search box, **When** I pause typing, **Then** the search results update automatically after a brief delay

---

### User Story 10 - Filter Tasks by Status, Priority, and Tags (Priority: P2)

As a user, I can filter my task list to show only tasks matching specific criteria (status, priority, tags, date range).

**Why this priority**: Enables focused views of tasks. Users can see "only incomplete tasks" or "only high priority work items" to reduce cognitive load.

**Independent Test**: Can be fully tested by applying various filter combinations and verifying correct task display. Delivers standalone value: customizable task views.

**Acceptance Scenarios**:

1. **Given** I have both complete and incomplete tasks, **When** I filter by "Incomplete", **Then** I see only incomplete tasks
2. **Given** I have tasks with different priorities, **When** I filter by "High" priority, **Then** I see only high-priority tasks
3. **Given** I have tasks with various tags, **When** I filter by "Work" tag, **Then** I see only tasks tagged with "Work"
4. **Given** I have applied multiple filters, **When** I clear all filters, **Then** I see all my tasks again
5. **Given** I combine filters (status: incomplete AND priority: high), **When** the filters apply, **Then** I see tasks matching ALL criteria

---

### User Story 11 - Sort Tasks by Different Criteria (Priority: P2)

As a user, I can sort my task list by due date, priority, creation date, or alphabetically.

**Why this priority**: Provides different mental models for task organization. Some users think chronologically, others by importance or alphabetically.

**Independent Test**: Can be fully tested by creating tasks with different properties and cycling through sort options. Delivers standalone value: flexible task ordering.

**Acceptance Scenarios**:

1. **Given** I have tasks with various due dates, **When** I sort by "Due Date", **Then** tasks are ordered from soonest to latest (with no due date at the end)
2. **Given** I have tasks with different priorities, **When** I sort by "Priority", **Then** tasks are ordered High → Medium → Low
3. **Given** I am viewing sorted tasks, **When** I reverse the sort order, **Then** the tasks display in the opposite sequence
4. **Given** I have selected a sort option, **When** I refresh the page, **Then** my sort preference is preserved

---

### User Story 12 - Set Up Recurring Tasks (Priority: P3)

As a user, I can mark tasks as recurring (daily, weekly, monthly, yearly) so they automatically recreate when completed.

**Why this priority**: Automates repetitive task creation. Valuable for habits, routines, and regular obligations (weekly team meeting, monthly report).

**Independent Test**: Can be fully tested by creating a recurring task, completing it, and verifying a new instance is created. Delivers standalone value: automated task management.

**Acceptance Scenarios**:

1. **Given** I am creating a task, **When** I mark it as "Weekly" recurring, **Then** the task is created with a recurrence pattern indicator
2. **Given** I have a weekly recurring task, **When** I mark it complete, **Then** a new task is created for next week with the same title and details
3. **Given** I have a recurring task, **When** I edit the recurrence pattern to "Monthly", **Then** future instances will recur monthly instead
4. **Given** I have a recurring task, **When** I stop the recurrence, **Then** no new instances are created after completion

---

### User Story 13 - Receive Due Date Reminders (Priority: P3)

As a user, I can receive notifications before tasks are due so I don't miss deadlines.

**Why this priority**: Proactive deadline management. Reduces stress and missed deadlines by alerting users before due dates arrive.

**Independent Test**: Can be fully tested by creating a task due soon and verifying notification delivery. Delivers standalone value: proactive deadline awareness.

**Acceptance Scenarios**:

1. **Given** I have a task due in 1 hour, **When** the reminder time arrives, **Then** I receive a browser notification
2. **Given** I have granted notification permission, **When** a reminder triggers, **Then** I see a clear notification with the task title and due time
3. **Given** I have a task due tomorrow, **When** the day-before reminder triggers, **Then** I am notified 24 hours in advance
4. **Given** I have multiple tasks due soon, **When** reminders trigger, **Then** I receive separate notifications for each task

---

### Edge Cases

- **Empty State**: What happens when a new user has no tasks? Display helpful empty state with "Create your first task" CTA
- **Overdue Tasks**: How does the system handle tasks with due dates in the past? Display with overdue indicator ([!]) and highlight in red
- **Invalid Due Dates**: What happens when a user tries to set a due date with an invalid format? Show validation error with expected format (YYYY-MM-DD)
- **Long Task Titles**: How does the UI handle task titles exceeding 200 characters? Enforce 200-character limit with character counter during input
- **Concurrent Edits**: What happens if two browser tabs edit the same task simultaneously? Last write wins (optimistic concurrency), no conflict resolution
- **Network Failures**: How does the app handle API errors or offline state? Show error toast with retry option, maintain UI state for user edits
- **Missing Authentication**: What happens if JWT token expires while user is active? Automatically redirect to login with a "Session expired" message
- **Cross-User Access Attempts**: What happens if a user tries to access another user's task via URL manipulation? Return 403 Forbidden error, log security event
- **Tag Deletion**: What happens when a user deletes a tag that's assigned to tasks? Remove tag from all tasks (soft delete, tag remains in history)
- **Bulk Operations**: How does the system handle selecting/deleting many tasks at once? Not supported in Phase 2 (would require bulk API and UI selection)
- **Search Performance**: How does search perform with hundreds of tasks? Backend indexes task titles/descriptions for fast full-text search
- **Filter Combinations**: What happens when filters result in zero tasks? Display "No tasks match your filters" with active filters shown and a clear button
- **Timezone Handling**: How are due dates/times handled across timezones? All timestamps stored in UTC, displayed in user's browser timezone
- **Password Reset**: What happens when a user forgets their password? Not implemented in Phase 2 (would require email service integration)
- **Account Deletion**: Can users delete their account? Not supported in Phase 2 (manual admin operation required)

## Requirements *(mandatory)*

### Functional Requirements

**Authentication & User Management**
- **FR-001**: System MUST allow users to create accounts with email and password
- **FR-002**: System MUST validate email format and password strength (minimum 8 characters) during signup
- **FR-003**: System MUST authenticate users via email/password login
- **FR-004**: System MUST issue JWT tokens upon successful authentication containing user_id, email, expiration, and issued-at timestamp
- **FR-005**: System MUST verify JWT tokens on every API request and extract authenticated user identity
- **FR-006**: System MUST enforce user isolation: users can only access their own tasks, never other users' data
- **FR-007**: System MUST redirect unauthenticated users to login page when accessing protected routes
- **FR-008**: System MUST allow users to sign out, ending their session

**Task CRUD Operations (Primary Tier)**
- **FR-009**: System MUST allow authenticated users to create tasks with a required title (1-200 characters)
- **FR-010**: System MUST allow optional description field (max 1000 characters) when creating tasks
- **FR-011**: System MUST auto-assign unique integer IDs to each task
- **FR-012**: System MUST record created_at timestamp (UTC) when tasks are created
- **FR-013**: System MUST record updated_at timestamp (UTC) when tasks are modified
- **FR-014**: System MUST display all tasks for the authenticated user in a list view
- **FR-015**: System MUST allow users to view full task details including title, description, status, created date, and updated date
- **FR-016**: System MUST allow users to update task title and description
- **FR-017**: System MUST allow users to delete tasks with a confirmation dialog
- **FR-018**: System MUST allow users to mark tasks as complete or incomplete
- **FR-019**: System MUST record completed_at timestamp when a task is marked complete
- **FR-020**: System MUST clear completed_at timestamp when a task is marked incomplete

**Priority Management (Intermediate Tier)**
- **FR-021**: System MUST allow users to assign priority levels: HIGH, MEDIUM, or LOW
- **FR-022**: System MUST default new tasks to MEDIUM priority if not specified
- **FR-023**: System MUST display visual priority indicators (colored badges) in task list
- **FR-024**: System MUST allow users to change task priority at any time

**Tags & Categories (Intermediate Tier)**
- **FR-025**: System MUST provide predefined tags: Work, Home, Personal
- **FR-026**: System MUST allow users to create custom tags
- **FR-027**: System MUST allow assigning multiple tags to a single task
- **FR-028**: System MUST display tags as colored badges on tasks
- **FR-029**: System MUST allow users to remove tags from tasks

**Scheduled Tasks (Intermediate Tier)**
- **FR-030**: System MUST allow users to set optional due dates on tasks
- **FR-031**: System MUST support date-only due dates (no time component required)
- **FR-032**: System MUST automatically categorize tasks as "scheduled" (with due date) or "activity" (no due date)
- **FR-033**: System MUST detect and flag tasks with due dates in the past as "overdue"
- **FR-034**: System MUST display overdue indicator ([!] badge) on overdue tasks

**Search & Filter (Intermediate Tier)**
- **FR-035**: System MUST provide keyword search across task titles and descriptions (case-insensitive)
- **FR-036**: System MUST allow filtering by task status (all, pending, completed)
- **FR-037**: System MUST allow filtering by priority level (high, medium, low)
- **FR-038**: System MUST allow filtering by tags (single or multiple tags)
- **FR-039**: System MUST allow filtering by date range (today, this week, overdue, custom range)
- **FR-040**: System MUST support combining multiple filters with AND logic
- **FR-041**: System MUST debounce search input to avoid excessive API calls (300ms delay)

**Sort Tasks (Intermediate Tier)**
- **FR-042**: System MUST allow sorting by due date (ascending/descending, tasks without due dates appear last)
- **FR-043**: System MUST allow sorting by priority (HIGH → MEDIUM → LOW or reverse)
- **FR-044**: System MUST allow alphabetical sorting by title (A-Z or Z-A)
- **FR-045**: System MUST allow sorting by creation date (newest or oldest first)
- **FR-046**: System MUST persist sort preference in browser storage (localStorage)

**Recurring Tasks (Advanced Tier)**
- **FR-047**: System MUST support recurrence patterns: DAILY, WEEKLY, BIWEEKLY, MONTHLY, YEARLY
- **FR-048**: System MUST automatically create a new task instance when a recurring task is marked complete
- **FR-049**: System MUST preserve title, description, priority, and tags in new recurring task instances
- **FR-050**: System MUST calculate next due date based on recurrence pattern
- **FR-051**: System MUST allow users to stop recurrence on any recurring task
- **FR-052**: System MUST display recurrence indicator (🔁 icon) on recurring tasks

**Due Date & Time Reminders (Advanced Tier)**
- **FR-053**: System MUST allow users to set due time in addition to due date (HH:MM 24-hour format)
- **FR-054**: System MUST send browser notifications for upcoming deadlines (1 hour before, 1 day before)
- **FR-055**: System MUST request user permission for browser notifications
- **FR-056**: System MUST display upcoming deadlines in dashboard summary view
- **FR-057**: System MUST allow users to configure reminder intervals per task

**API & Backend Requirements**
- **FR-058**: Backend MUST implement RESTful API with endpoints: GET/POST /api/{user_id}/tasks, GET/PUT/DELETE /api/{user_id}/tasks/{id}, PATCH /api/{user_id}/tasks/{id}/complete
- **FR-059**: All API endpoints MUST require valid JWT token in Authorization header (except auth endpoints)
- **FR-060**: All API endpoints MUST verify that token user_id matches URL user_id (prevent privilege escalation)
- **FR-061**: All database queries MUST filter by authenticated user_id from token (never use URL user_id)
- **FR-062**: API MUST return appropriate HTTP status codes: 200 OK, 201 Created, 204 No Content, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 422 Unprocessable Entity
- **FR-063**: API MUST return structured error responses with error code, message, and optional field details
- **FR-064**: Backend MUST use SQLModel ORM for all database operations
- **FR-065**: Backend MUST use Pydantic models for request/response validation

**Frontend Requirements**
- **FR-066**: Frontend MUST be built with Next.js 16+ using App Router
- **FR-067**: Frontend MUST attach JWT token to all API requests automatically
- **FR-068**: Frontend MUST redirect to login page on 401 Unauthorized responses
- **FR-069**: Frontend MUST display user-friendly error messages on API failures
- **FR-070**: Frontend MUST use optimistic UI updates for task toggle/edit operations
- **FR-071**: Frontend MUST provide visual loading states during API requests
- **FR-072**: Frontend MUST be responsive and work on mobile devices (viewport: 320px - 1920px)

### Key Entities

- **User**: Represents an authenticated user account
  - Properties: user_id (unique identifier), email (unique, validated), password (hashed with bcrypt), name, created_at
  - Relationships: Has many Tasks

- **Task**: Represents a single todo item
  - Properties: id (unique integer), title (1-200 chars), description (optional, max 1000 chars), completed (boolean), created_at, updated_at, completed_at (optional)
  - Primary tier properties: id, user_id, title, description, completed, created_at, updated_at, completed_at
  - Intermediate tier properties: priority (HIGH/MEDIUM/LOW), due_date (optional datetime), task_type (scheduled/activity)
  - Advanced tier properties: recurrence_pattern (optional: DAILY/WEEKLY/MONTHLY/YEARLY)
  - Relationships: Belongs to User, Has many Tags (many-to-many)

- **Tag**: Represents a category or label for organizing tasks
  - Properties: id (unique integer), name (unique string), color (hex color code for UI display)
  - Predefined tags: Work, Home, Personal
  - User-created tags: Custom tags created by users
  - Relationships: Has many Tasks (many-to-many via TaskTag join table)

- **TaskTag**: Join table for many-to-many relationship between Tasks and Tags
  - Properties: task_id (foreign key), tag_id (foreign key)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete account creation and first task in under 3 minutes
- **SC-002**: Users can find a specific task using search in under 10 seconds (for lists with 100+ tasks)
- **SC-003**: All API endpoints respond in under 200ms for simple queries (single task retrieval, task creation)
- **SC-004**: Task list pages load in under 2 seconds on initial load, under 1 second on navigation
- **SC-005**: 90% of users successfully complete primary task flows (create, view, edit, delete, toggle) on first attempt without help
- **SC-006**: System maintains 99.5% uptime during business hours (9 AM - 6 PM local time)
- **SC-007**: Zero data leakage incidents: no user can access another user's tasks under any circumstances
- **SC-008**: System handles 100 concurrent users without performance degradation (< 10% response time increase)
- **SC-009**: All critical paths (authentication, CRUD operations, user isolation) have 100% test coverage
- **SC-010**: Overall test coverage is at least 60% for backend and frontend codebases
- **SC-011**: Browser notifications for due date reminders arrive within 1 minute of scheduled time
- **SC-012**: Recurring tasks create new instances within 1 second of completing the current instance
- **SC-013**: Filters and sorting operations complete in under 500ms even with 500+ tasks
- **SC-014**: Mobile users on 4G connections experience page loads under 3 seconds

## Assumptions & Constraints *(optional)*

### Assumptions

1. **User Base**: Targeting individual users and small teams (< 50 users) for initial deployment
2. **Browser Support**: Modern browsers only (Chrome 100+, Firefox 100+, Safari 15+, Edge 100+)
3. **Network**: Users have reliable internet connection (no offline mode in Phase 2)
4. **Authentication**: Users manage their own passwords (no SSO or social login in Phase 2)
5. **Email Service**: Email notifications (password reset, account verification) not implemented in Phase 2
6. **Mobile Apps**: No native mobile apps; responsive web app accessed via mobile browsers
7. **Data Retention**: User data retained indefinitely; no automatic deletion or archiving
8. **Timezone**: All timestamps stored in UTC, displayed in user's browser timezone
9. **Language**: English only (no i18n/l10n in Phase 2)
10. **Accessibility**: Basic WCAG 2.1 AA compliance (keyboard navigation, screen reader support for critical flows)

### Constraints

1. **Technology Stack**: MUST use Next.js 16+, FastAPI, SQLModel, PostgreSQL, Better Auth (per constitution)
2. **Development Timeline**: Phase 2 designed for hackathon timeline (rapid iteration, MVP focus)
3. **Database**: MUST use Neon Serverless PostgreSQL (no local database option)
4. **Test Coverage**: MUST achieve ≥60% overall coverage, 100% for critical paths (per constitution)
5. **Authentication**: MUST use Better Auth with JWT tokens (no custom auth implementation)
6. **API Design**: MUST follow RESTful conventions with /api/{user_id}/tasks pattern
7. **Monorepo**: MUST use monorepo structure with frontend/, backend/, specs/ directories
8. **No Backward Compatibility**: Phase 2 is a fresh start; no migration from Phase 1 CLI data
9. **Browser Notifications**: Require user permission grant; gracefully degrade if permission denied
10. **Deployment**: Frontend on Vercel, Backend on Railway/Render, Database on Neon (cloud-only, no on-premise)

## Out of Scope *(optional)*

The following features are explicitly NOT included in Phase 2:

1. **SSO/OAuth Integration**: No social login (Google, GitHub, etc.)
2. **Password Reset via Email**: Requires email service integration (Sendgrid, AWS SES)
3. **Email Notifications**: All reminders are browser-based only
4. **Account Deletion**: Manual admin operation, no self-service
5. **Team Collaboration**: No task sharing, assignment to others, or team workspaces
6. **Task Comments/Notes**: No threaded discussions or activity logs on tasks
7. **File Attachments**: No ability to attach documents or images to tasks
8. **Subtasks/Checklist Items**: No hierarchical task structure
9. **Task Templates**: No saved templates for recurring task structures
10. **Custom Fields**: No user-defined task properties beyond core fields
11. **Task Dependencies**: No "this task blocks that task" relationships
12. **Time Tracking**: No pomodoro timer or work session tracking
13. **Analytics/Reports**: No task completion statistics or productivity dashboards
14. **Import/Export**: No CSV/JSON import or bulk export functionality
15. **Offline Mode**: No service worker or offline-first capabilities
16. **Real-time Collaboration**: No WebSocket-based live updates when multiple users edit same data
17. **API Rate Limiting**: No per-user request throttling (rely on infrastructure-level protection)
18. **Advanced Search**: No full-text search with operators (AND, OR, NOT), just simple keyword matching
19. **Bulk Operations**: No multi-select with bulk delete/tag/priority changes
20. **Keyboard Shortcuts**: No global hotkeys for quick task creation or navigation
21. **Dark Mode**: No theme switching (light mode only)
22. **Calendar View**: No month/week grid view of scheduled tasks
23. **Mobile Native Apps**: Responsive web only, no iOS/Android apps
24. **Internationalization**: English only, no multi-language support
25. **Custom Reminder Times**: Fixed reminder intervals only (1 hour, 1 day before)

## Dependencies *(optional)*

### External Services

1. **Better Auth**: Third-party authentication library for user signup/signin and JWT token issuance
2. **Neon PostgreSQL**: Serverless database hosting (requires account and connection string)
3. **Vercel**: Frontend hosting and deployment (optional but recommended)
4. **Railway or Render**: Backend API hosting (optional but recommended for production)

### Internal Prerequisites

1. **Phase 2 Constitution**: All implementation must follow `.specify/memory/phase-2-constitution.md` requirements
2. **Monorepo Setup**: frontend/, backend/, specs/ directories must be created before implementation
3. **Environment Variables**: DATABASE_URL, BETTER_AUTH_SECRET, NEXT_PUBLIC_API_URL must be configured
4. **Docker Compose**: Local development environment must be set up before coding begins
5. **Git Workflow**: Feature branch `001-fullstack-web-app` must be active

### Architectural Prerequisites

1. **User Table**: Better Auth creates user table; backend must reference it for foreign keys
2. **JWT Middleware**: Backend auth.py middleware must be implemented before any protected endpoints
3. **API Client**: Frontend lib/api.ts wrapper must be created before any API calls
4. **Database Migrations**: SQLModel.metadata.create_all() must run on backend startup

### Development Tool Dependencies

1. **Backend**: Python 3.11+, FastAPI, SQLModel, pydantic-settings, pytest, black, flake8, mypy
2. **Frontend**: Node.js 18+, Next.js 16+, TypeScript, Tailwind CSS, Jest, React Testing Library
3. **Database**: PostgreSQL client (psycopg2 or psycopg3) for Neon connection
4. **Containerization**: Docker and Docker Compose for local development

## Related Documents *(optional)*

- **Constitution**: `.specify/memory/phase-2-constitution.md` - Phase 2 development principles and requirements
- **Architecture Diagram**: To be created in `specs/001-fullstack-web-app/architecture.md` during planning phase
- **API Specification**: To be created in `specs/api/rest-endpoints.md` during planning phase
- **Database Schema**: To be created in `specs/database/schema.md` during planning phase
- **UI Components**: To be created in `specs/ui/components.md` during planning phase
- **Authentication Flow**: See Section VI of constitution for detailed 5-step JWT flow
- **Agent Configuration**: `.spec-kit/agents.yaml` - Spec validator, security auditor, and API contract agents
- **Phase 1 Reference**: `phase-1/` - Completed CLI application for business logic reference (do not import code)
