# Feature: Task CRUD Operations - Web Application

**Phase:** Phase II - Full-Stack Web Application
**Status:** In Progress
**Priority:** P0 (Critical)

---

## Overview

Transform the CLI-based task management system into a modern web application with multi-user support, authentication, and responsive UI.

---

## User Stories

### Authentication
- **As a user**, I can sign up with email and password
- **As a user**, I can sign in to access my tasks
- **As a user**, I can sign out securely
- **As a user**, I can only see and manage my own tasks

### Task Management (Primary Tier)
- **As a user**, I can create a new task with title, description, priority, tags, and due date
- **As a user**, I can view all my tasks in a list/grid view
- **As a user**, I can update any task details
- **As a user**, I can delete a task with confirmation
- **As a user**, I can mark a task as complete or incomplete

### Organization (Intermediate Tier)
- **As a user**, I can assign priority levels (HIGH, MEDIUM, LOW) to tasks
- **As a user**, I can add multiple tags to categorize tasks
- **As a user**, I can search tasks by keyword in title/description
- **As a user**, I can filter tasks by status, priority, or tags
- **As a user**, I can sort tasks by date, priority, or title

### Advanced Features (Advanced Tier)
- **As a user**, I can create recurring tasks (daily, weekly, monthly, yearly)
- **As a user**, I can set due dates with time for reminders
- **As a user**, I receive browser notifications for upcoming tasks
- **As a user**, I can see overdue tasks highlighted

---

## Acceptance Criteria

### Authentication Flow

#### Sign Up
✅ User can register with email, name, and password
✅ Email validation (valid format, unique)
✅ Password validation (minimum 8 characters)
✅ Error messages for invalid input
✅ Automatic redirect to dashboard after signup

#### Sign In
✅ User can login with email and password
✅ JWT token issued on successful login
✅ Token stored securely (httpOnly cookie)
✅ Error messages for wrong credentials
✅ Redirect to dashboard after login

#### Authentication State
✅ Unauthenticated users redirected to login page
✅ Authenticated users can access dashboard
✅ JWT token sent with all API requests
✅ Backend verifies token and filters data by user

---

### Task CRUD Operations

#### Create Task
**Endpoint:** `POST /api/{user_id}/tasks`

**Required:**
- Title (1-200 characters)

**Optional:**
- Description (max 1000 characters)
- Priority (HIGH/MEDIUM/LOW, default: MEDIUM)
- Tags (array of strings)
- Due date (ISO 8601 datetime)
- Task type (scheduled/activity)
- Recurrence pattern (NONE/DAILY/WEEKLY/MONTHLY/YEARLY)

**Response:** 201 Created with task object

**UI:**
- Form with all fields
- Real-time validation
- Tags input with autocomplete
- Date/time picker for due date
- Priority selector (dropdown or buttons)
- Recurrence options (if scheduled task)
- Cancel and Submit buttons
- Success/error notifications

---

#### View Tasks
**Endpoint:** `GET /api/{user_id}/tasks`

**Query Parameters:**
- `status`: "all" | "pending" | "completed"
- `priority`: "HIGH" | "MEDIUM" | "LOW"
- `sort`: "created" | "title" | "due_date" | "priority"

**Response:** 200 OK with array of tasks

**UI:**
- List view or grid view toggle
- Each task shows:
  - Title and description (truncated)
  - Priority indicator (color-coded)
  - Tags (as chips/badges)
  - Due date (formatted, with overdue flag)
  - Completion status (checkbox)
  - Edit and delete buttons
- Empty state when no tasks
- Loading state while fetching
- Filter controls (status, priority, tags)
- Sort dropdown
- Search bar

---

#### Update Task
**Endpoint:** `PUT /api/{user_id}/tasks/{task_id}`

**Request:** Task update object (partial updates allowed)

**Response:** 200 OK with updated task

**UI:**
- Same form as create, pre-filled with existing data
- All fields editable
- Validation on submit
- Cancel and Save buttons
- Success/error notifications

---

#### Delete Task
**Endpoint:** `DELETE /api/{user_id}/tasks/{task_id}`

**Response:** 204 No Content

**UI:**
- Confirmation modal:
  - "Are you sure you want to delete '[Task Title]'?"
  - Cancel and Delete buttons
- Success notification after deletion
- Task removed from list immediately

---

#### Toggle Completion
**Endpoint:** `PATCH /api/{user_id}/tasks/{task_id}/complete`

**Response:** 200 OK with updated task

**UI:**
- Checkbox in task list
- Click to toggle complete/incomplete
- Visual feedback (strikethrough, opacity change)
- Completion timestamp displayed
- If recurring: new task created with next due date

---

### Search & Filter

#### Search
**Endpoint:** `GET /api/{user_id}/tasks/search?keyword={term}`

**UI:**
- Search bar at top of page
- Real-time search (debounced)
- Highlight matching text in results
- Show match count
- Clear button

#### Filter
**UI:**
- Filter panel (sidebar or dropdown)
- Status filter: All | Pending | Completed
- Priority filter: All | HIGH | MEDIUM | LOW
- Tag filter: Multi-select with tag list
- Date filter: Today | This Week | Overdue | Custom range
- Apply and Clear buttons
- Active filters shown as removable chips

#### Sort
**UI:**
- Sort dropdown: Created (newest) | Created (oldest) | Title (A-Z) | Title (Z-A) | Due Date (earliest) | Due Date (latest) | Priority (HIGH→LOW) | Priority (LOW→HIGH)
- Current sort indicated

---

### Responsive Design

✅ Desktop (≥1024px): Sidebar + main content, grid view
✅ Tablet (768-1023px): Collapsible sidebar, list view
✅ Mobile (<768px): Bottom navigation, stacked cards

---

## Technical Requirements

### Frontend Stack
- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **Auth:** Better Auth with JWT
- **State:** React hooks (useState, useEffect)

### Backend Stack
- **Framework:** FastAPI
- **ORM:** SQLModel
- **Database:** Neon PostgreSQL
- **Auth:** JWT verification

### Security
- All API endpoints require valid JWT token
- User data isolation (users only see their own tasks)
- Input validation on frontend and backend
- SQL injection prevention (parameterized queries)
- XSS prevention (React escaping + CSP headers)

---

## Performance Requirements

- **API Response Time:** <500ms (p95)
- **Page Load Time:** <2s (initial load)
- **Search/Filter:** <200ms (with debouncing)
- **Database Queries:** Indexed columns for common filters

---

## Testing Requirements

### Backend Tests
- Unit tests for all API endpoints
- Authentication tests (valid/invalid tokens)
- Authorization tests (user isolation)
- Database tests (CRUD operations)
- Test coverage: ≥85%

### Frontend Tests
- Component tests (task list, form, auth)
- Integration tests (API calls, auth flow)
- E2E tests (signup → create task → complete → delete)

---

## API Error Responses

### 400 Bad Request
```json
{
  "detail": "Title is required and must be 1-200 characters"
}
```

### 401 Unauthorized
```json
{
  "detail": "Invalid or expired authentication token"
}
```

### 403 Forbidden
```json
{
  "detail": "You do not have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "detail": "Task with ID 123 not found"
}
```

---

## Future Enhancements (Phase III)

- Real-time updates with WebSockets
- Task collaboration (share tasks with other users)
- Task attachments (files, images)
- AI chatbot integration (MCP tools)
- Mobile apps (React Native)
- Offline support (PWA)
- Calendar view
- Analytics dashboard
