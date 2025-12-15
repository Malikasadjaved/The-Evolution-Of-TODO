# Data Model: UI Components

**Date**: 2025-12-10
**Feature**: UI Components for Task Management
**Phase**: Phase 1 - Design & Contracts

## Overview

This document defines all data structures, type definitions, and schemas used by the UI components. All types are defined in TypeScript with runtime validation via Zod where appropriate.

---

## 1. Core Domain Types

**Location**: `frontend/lib/types.ts` ( Already exists - these are shared with backend)

### Task Entity

```typescript
interface Task {
  /** Unique task identifier */
  id: number

  /** Owner user ID (from Better Auth session) */
  user_id: string

  /** Task title (1-200 characters) */
  title: string

  /** Task description (0-1000 characters) */
  description: string

  /** Priority level */
  priority: Priority

  /** Task tags (e.g., ["Work", "Urgent", "Backend"]) */
  tags: string[]

  /** Completion status */
  completed: boolean

  /** Creation timestamp (ISO 8601) */
  created_at: string

  /** Due date (ISO 8601 date, YYYY-MM-DD) */
  due_date: string | null

  /** Recurrence pattern */
  recurrence: Recurrence

  /** Task type: scheduled (has due date) or activity (no due date) */
  task_type: 'scheduled' | 'activity'
}
```

### Enums

```typescript
/** Priority levels (high to low) */
type Priority = 'HIGH' | 'MEDIUM' | 'LOW'

/** Recurrence patterns */
type Recurrence = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
```

---

## 2. API Request/Response Types

### Create Task Request

```typescript
interface CreateTaskData {
  title: string
  description: string
  priority: Priority
  tags: string[]
  due_date: string | null  // ISO date (YYYY-MM-DD) or null
  recurrence: Recurrence
}
```

### Update Task Request

```typescript
interface UpdateTaskData {
  title?: string
  description?: string
  priority?: Priority
  tags?: string[]
  due_date?: string | null
  recurrence?: Recurrence
}
```

---

## 3. Form Data Types

### Task Form Data (Zod Schema)

```typescript
import { z } from 'zod'

export const taskFormSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .refine(
      (s) => s.trim().length > 0,
      'Title cannot be only whitespace'
    ),

  description: z.string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional()
    .default(''),

  priority: z.enum(['HIGH', 'MEDIUM', 'LOW'], {
    required_error: 'Priority is required',
  }),

  tags: z.array(z.string())
    .default([]),

  dueDate: z.string()
    .optional()
    .refine(
      (dateStr) => {
        if (!dateStr) return true
        const date = new Date(dateStr)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return date >= today
      },
      'Due date cannot be in the past'
    ),

  recurrence: z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'])
    .default('NONE'),
})

export type TaskFormData = z.infer<typeof taskFormSchema>
```

---

## 4. Filter & Sort Types

### Task Filters

```typescript
interface TaskFilters {
  /** Status filter */
  status: 'all' | 'active' | 'completed'

  /** Priority filter */
  priority: 'all' | Priority

  /** Tag filter (empty = all tags) */
  tags: string[]

  /** Search query (searches title + description) */
  search: string
}

/** Default filters */
const DEFAULT_FILTERS: TaskFilters = {
  status: 'all',
  priority: 'all',
  tags: [],
  search: '',
}
```

### Sort Options

```typescript
interface SortOption {
  field: 'dueDate' | 'priority' | 'title' | 'createdAt'
  direction: 'asc' | 'desc'
}

/** Default sort */
const DEFAULT_SORT: SortOption = {
  field: 'dueDate',
  direction: 'asc',
}
```

---

## 5. UI State Types

### Toast Notification

```typescript
interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number  // Auto-dismiss milliseconds (default: 3000)
}
```

### Loading State

```typescript
interface LoadingState {
  /** Global loading (initial fetch) */
  loading: boolean

  /** Per-task loading (during mutations) */
  mutatingTaskIds: Set<number>
}
```

---

## Contract Validation

**Gates**:
-  All types defined in TypeScript
-  Runtime validation with Zod for user input
-  Clear separation: domain types, API types, form types, UI types
-  Type safety end-to-end

**Ready for**: Implementation (TDD Phase 2)
