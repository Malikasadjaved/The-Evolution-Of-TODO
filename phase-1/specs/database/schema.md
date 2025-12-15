# Database Schema - Phase II Web Application

## Database Provider
**Neon PostgreSQL** (Serverless)

## Tables

### users
Managed by Better Auth authentication system.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | STRING | PRIMARY KEY | User identifier from Better Auth |
| email | STRING | UNIQUE, NOT NULL | User email address |
| name | STRING | NOT NULL | User display name |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Account creation timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `email`

---

### tasks
User's todo tasks with full feature support.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO INCREMENT | Task identifier |
| user_id | STRING | FOREIGN KEY → users.id, NOT NULL | Owner of the task |
| title | STRING(200) | NOT NULL | Task title |
| description | TEXT | NULLABLE | Task description |
| priority | ENUM | NOT NULL, DEFAULT 'MEDIUM' | HIGH, MEDIUM, LOW |
| tags | TEXT | NOT NULL, DEFAULT '[]' | JSON array of tags |
| due_date | TIMESTAMP | NULLABLE | Task deadline |
| task_type | STRING | NOT NULL, DEFAULT 'activity' | 'scheduled' or 'activity' |
| recurrence_pattern | ENUM | NOT NULL, DEFAULT 'NONE' | NONE, DAILY, WEEKLY, MONTHLY, YEARLY |
| completed | BOOLEAN | NOT NULL, DEFAULT FALSE | Completion status |
| completed_at | TIMESTAMP | NULLABLE | When task was completed |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Task creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `user_id` (for filtering by user)
- INDEX on `completed` (for status filtering)
- INDEX on `priority` (for priority filtering)
- INDEX on `due_date` (for date sorting/filtering)

**Foreign Keys:**
- `user_id` REFERENCES `users(id)` ON DELETE CASCADE

---

## Computed Fields

### is_overdue
**Type:** Virtual/Computed (not stored)
**Logic:**
```python
is_overdue = (due_date is not None)
             AND (completed == False)
             AND (due_date < current_time)
```

---

## Data Integrity Rules

1. **User Isolation:**
   - All tasks MUST be associated with a user_id
   - API queries MUST filter by authenticated user_id
   - Users cannot access tasks from other users

2. **Completion Logic:**
   - When `completed` changes from FALSE → TRUE:
     - Set `completed_at` to current timestamp
   - When `completed` changes from TRUE → FALSE:
     - Set `completed_at` to NULL

3. **Recurrence Logic:**
   - If `recurrence_pattern` is not NONE:
     - `due_date` must be set
     - When task is marked complete, create new task instance with next due date
   - If `recurrence_pattern` is NONE:
     - Task is one-time only

4. **Task Type:**
   - `scheduled`: Must have `due_date` set
   - `activity`: `due_date` is optional

5. **Tags Format:**
   - Stored as JSON array string: `["work", "urgent", "personal"]`
   - Empty tags: `[]`
   - Frontend parses JSON to display/edit tags

---

## Migrations

### Initial Migration (001_initial_schema.sql)
```sql
-- Create users table
CREATE TABLE users (
    id VARCHAR PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tasks table
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    priority VARCHAR(10) NOT NULL DEFAULT 'MEDIUM',
    tags TEXT NOT NULL DEFAULT '[]',
    due_date TIMESTAMP,
    task_type VARCHAR(20) NOT NULL DEFAULT 'activity',
    recurrence_pattern VARCHAR(20) NOT NULL DEFAULT 'NONE',
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
```

---

## Sample Data

### User
```json
{
  "id": "user_abc123",
  "email": "john@example.com",
  "name": "John Doe",
  "created_at": "2025-12-10T10:00:00Z"
}
```

### Task
```json
{
  "id": 1,
  "user_id": "user_abc123",
  "title": "Complete hackathon project",
  "description": "Finish Phase II implementation",
  "priority": "HIGH",
  "tags": "[\"work\", \"hackathon\", \"urgent\"]",
  "due_date": "2025-12-15T23:59:59Z",
  "task_type": "scheduled",
  "recurrence_pattern": "NONE",
  "completed": false,
  "completed_at": null,
  "created_at": "2025-12-10T10:00:00Z",
  "updated_at": "2025-12-10T10:00:00Z"
}
```

---

## Connection String Format

```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

**Environment Variable:** `DATABASE_URL`

**Example:**
```
DATABASE_URL=postgresql://user:pass@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```
