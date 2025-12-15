# Component API Contracts

**Date**: 2025-12-10
**Feature**: UI Components for Task Management
**Phase**: Phase 1 - Design & Contracts

## Overview

This document defines the TypeScript interfaces and props for all UI components in the task management feature. These contracts serve as the source of truth for component APIs before implementation.

---

## 1. TaskList Component

**Purpose**: Main container component that displays tasks with filtering, searching, and sorting capabilities.

**Location**: `frontend/components/TaskList.tsx`

### Props Interface

```typescript
interface TaskListProps {
  /** User ID from session (for API calls) */
  userId: string

  /** Initial filter state (optional - for deep linking) */
  initialFilters?: TaskFilters

  /** Initial sort option (optional - for persistence) */
  initialSort?: SortOption

  /** Callback when task is created (optional - for parent notifications) */
  onTaskCreated?: (task: Task) => void

  /** Callback when task is deleted (optional - for parent notifications) */
  onTaskDeleted?: (taskId: number) => void
}

interface TaskFilters {
  status: 'all' | 'active' | 'completed'
  priority: 'all' | 'HIGH' | 'MEDIUM' | 'LOW'
  tags: string[] // Empty array = all tags
  search: string  // Search in title/description
  dateRange?: {
    start: Date | null
    end: Date | null
  }
}

interface SortOption {
  field: 'dueDate' | 'priority' | 'title' | 'createdAt'
  direction: 'asc' | 'desc'
}
```

### State Shape

```typescript
interface TaskListState {
  tasks: Task[]
  loading: boolean
  error: string | null
  filters: TaskFilters
  sort: SortOption
  selectedTaskId: number | null  // For edit modal
  deleteConfirmTaskId: number | null  // For delete confirmation
}
```

### Events

- `onTaskToggle(taskId: number)`: Toggle task completion
- `onTaskEdit(task: Task)`: Open edit modal
- `onTaskDelete(taskId: number)`: Open delete confirmation
- `onFilterChange(filters: TaskFilters)`: Update filters
- `onSortChange(sort: SortOption)`: Update sort
- `onSearchChange(query: string)`: Update search (debounced)

---

## 2. TaskForm Component

**Purpose**: Form for creating or editing tasks with full validation.

**Location**: `frontend/components/TaskForm.tsx`

### Props Interface

```typescript
interface TaskFormProps {
  /** User ID from session (for API calls) */
  userId: string

  /** Mode: 'create' or 'edit' */
  mode: 'create' | 'edit'

  /** Existing task data (required for edit mode) */
  task?: Task

  /** Callback on successful submission */
  onSuccess: (task: Task) => void

  /** Callback on cancel/close */
  onCancel: () => void

  /** Show loading state externally (optional) */
  isLoading?: boolean
}
```

### Form Data Schema (Zod)

```typescript
const taskFormSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .refine(s => s.trim().length > 0, 'Title cannot be only whitespace'),

  description: z.string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional()
    .default(''),

  priority: z.enum(['HIGH', 'MEDIUM', 'LOW'], {
    required_error: 'Priority is required',
  }),

  tags: z.array(z.string())
    .default([]),

  dueDate: z.string() // ISO date string (YYYY-MM-DD)
    .optional()
    .refine(dateStr => {
      if (!dateStr) return true
      const date = new Date(dateStr)
      return date >= new Date() // Must be today or future
    }, 'Due date cannot be in the past'),

  recurrence: z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'])
    .default('NONE'),
})

type TaskFormData = z.infer<typeof taskFormSchema>
```

### State Shape

```typescript
interface TaskFormState {
  submitting: boolean
  error: string | null
  tagInput: string  // For tag creation input
  showRecurrenceOptions: boolean
}
```

### Events

- `onSubmit(data: TaskFormData)`: Submit form (handles both create and edit)
- `onTagAdd(tag: string)`: Add tag to task
- `onTagRemove(tag: string)`: Remove tag from task
- `onCancel()`: Close form without saving

---

## 3. TaskItem Component

**Purpose**: Individual task card with status, priority, tags, and actions.

**Location**: `frontend/components/TaskItem.tsx`

### Props Interface

```typescript
interface TaskItemProps {
  /** Task data to display */
  task: Task

  /** Callback when checkbox is toggled */
  onToggle: (taskId: number) => void

  /** Callback when edit button is clicked */
  onEdit: (task: Task) => void

  /** Callback when delete button is clicked */
  onDelete: (taskId: number) => void

  /** Show task as loading (during optimistic update) */
  isLoading?: boolean

  /** Compact mode (smaller card for mobile) */
  compact?: boolean
}
```

### Visual States

- **Default**: Normal display
- **Completed**: Strikethrough title, muted colors
- **Overdue**: Red due date badge
- **Loading**: Spinner overlay during mutation

### Accessibility

```typescript
// ARIA attributes
{
  role: 'article',
  'aria-labelledby': `task-${task.id}-title`,
  'aria-describedby': `task-${task.id}-description`,
}

// Checkbox
{
  'aria-label': `Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`,
}

// Action buttons
{
  'aria-label': `Edit task "${task.title}"`,
  'aria-label': `Delete task "${task.title}"`,
}
```

---

## 4. Modal Component

**Purpose**: Reusable modal dialog with focus trap and backdrop.

**Location**: `frontend/components/Modal.tsx`

### Props Interface

```typescript
interface ModalProps {
  /** Whether modal is open */
  isOpen: boolean

  /** Callback when modal should close */
  onClose: () => void

  /** Modal title (displayed in header) */
  title: string

  /** Modal content */
  children: React.ReactNode

  /** Footer content (optional - buttons, etc.) */
  footer?: React.ReactNode

  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl'

  /** Disable close on backdrop click */
  preventBackdropClose?: boolean

  /** Disable close on Escape key */
  preventEscapeClose?: boolean
}
```

### Behavior

- Focus trap: Tab/Shift+Tab cycles within modal
- Escape closes modal (unless `preventEscapeClose`)
- Backdrop click closes modal (unless `preventBackdropClose`)
- Focus returns to trigger element on close
- Scroll lock on body when open

---

## 5. Toast Component

**Purpose**: Global toast notification system for feedback.

**Location**: `frontend/components/Toast.tsx`

### Context API

```typescript
interface ToastContextValue {
  /** Add a new toast notification */
  addToast: (toast: Omit<Toast, 'id'>) => void

  /** Remove a toast by ID */
  removeToast: (id: string) => void

  /** Current active toasts */
  toasts: Toast[]
}

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number  // Auto-dismiss after N ms (default: 3000)
}
```

### Usage Pattern

```typescript
// In component
const { addToast } = useToast()

// Success
addToast({ type: 'success', message: 'Task created successfully!' })

// Error
addToast({ type: 'error', message: 'Failed to delete task. Please try again.' })

// Custom duration
addToast({ type: 'info', message: 'Reminder set', duration: 5000 })
```

### Toast Item Props

```typescript
interface ToastItemProps {
  toast: Toast
  onClose: (id: string) => void
}
```

---

## 6. ConfirmDialog Component

**Purpose**: Confirmation dialog for destructive actions.

**Location**: `frontend/components/ConfirmDialog.tsx`

### Props Interface

```typescript
interface ConfirmDialogProps {
  /** Whether dialog is open */
  isOpen: boolean

  /** Callback when dialog closes without confirming */
  onCancel: () => void

  /** Callback when user confirms action */
  onConfirm: () => void

  /** Dialog title */
  title: string

  /** Dialog message/description */
  message: string

  /** Confirm button text (default: "Confirm") */
  confirmText?: string

  /** Cancel button text (default: "Cancel") */
  cancelText?: string

  /** Variant for confirm button (default: "danger") */
  variant?: 'danger' | 'warning' | 'primary'

  /** Show loading state on confirm button */
  isLoading?: boolean
}
```

### Usage Pattern

```typescript
const [showConfirm, setShowConfirm] = useState(false)
const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null)

const handleDeleteClick = (taskId: number) => {
  setDeletingTaskId(taskId)
  setShowConfirm(true)
}

const handleConfirmDelete = async () => {
  if (deletingTaskId) {
    await deleteTask(deletingTaskId)
    setShowConfirm(false)
    setDeletingTaskId(null)
  }
}

<ConfirmDialog
  isOpen={showConfirm}
  onCancel={() => setShowConfirm(false)}
  onConfirm={handleConfirmDelete}
  title="Delete Task"
  message="Are you sure you want to delete this task? This action cannot be undone."
  confirmText="Delete"
  variant="danger"
/>
```

---

## 7. Shared UI Primitives

**Location**: `frontend/components/ui/`

### Button

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}
```

### Input

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftAddon?: React.ReactNode
  rightAddon?: React.ReactNode
}
```

### Select

```typescript
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Array<{ value: string; label: string }>
  placeholder?: string
}
```

### Badge

```typescript
interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md'
  removable?: boolean
  onRemove?: () => void
}
```

---

## Type Dependencies

All components depend on shared types from `frontend/lib/types.ts`:

```typescript
// Core entities (already defined in existing codebase)
interface Task {
  id: number
  user_id: string
  title: string
  description: string
  priority: Priority
  tags: string[]
  completed: boolean
  created_at: string  // ISO timestamp
  due_date: string | null  // ISO date (YYYY-MM-DD)
  recurrence: Recurrence
  task_type: 'scheduled' | 'activity'
}

type Priority = 'HIGH' | 'MEDIUM' | 'LOW'
type Recurrence = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
```

---

## Contract Validation

**Gates**:
- ✅ All props are typed with TypeScript interfaces
- ✅ All callbacks have clear parameter and return types
- ✅ All state shapes are documented
- ✅ Accessibility attributes are specified
- ✅ Events are named consistently (on + Verb)
- ✅ Optional props are clearly marked with `?`
- ✅ Complex validation logic uses Zod schemas

**Ready for**: Implementation (TDD Phase 2)
