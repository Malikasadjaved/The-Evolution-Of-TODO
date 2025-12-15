# API Integration Contracts

**Date**: 2025-12-10
**Feature**: UI Components for Task Management
**Phase**: Phase 1 - Design & Contracts

## Overview

This document defines the integration patterns between UI components and the existing API client (`frontend/lib/api.ts`). All components use the API client exclusively - no direct fetch calls.

---

## 1. API Client Interface

**Location**: `frontend/lib/api.ts` (✅ Already exists)

### Available Methods

```typescript
// Task Management
getTasks(userId: string): Promise<Task[]>
createTask(userId: string, data: CreateTaskData): Promise<Task>
updateTask(userId: string, taskId: number, data: UpdateTaskData): Promise<Task>
deleteTask(userId: string, taskId: number): Promise<void>
toggleComplete(userId: string, taskId: number): Promise<Task>

// Search & Filter (Future Enhancement)
searchTasks(userId: string, query: string): Promise<Task[]>
filterTasks(userId: string, filters: FilterParams): Promise<Task[]>
```

### Type Definitions

```typescript
// Request types
interface CreateTaskData {
  title: string
  description: string
  priority: Priority
  tags: string[]
  due_date: string | null  // ISO date (YYYY-MM-DD)
  recurrence: Recurrence
}

interface UpdateTaskData {
  title?: string
  description?: string
  priority?: Priority
  tags?: string[]
  due_date?: string | null
  recurrence?: Recurrence
}

// Response types
interface Task {
  id: number
  user_id: string
  title: string
  description: string
  priority: Priority
  tags: string[]
  completed: boolean
  created_at: string  // ISO timestamp
  due_date: string | null
  recurrence: Recurrence
  task_type: 'scheduled' | 'activity'
}

type Priority = 'HIGH' | 'MEDIUM' | 'LOW'
type Recurrence = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
```

---

## 2. Error Handling Strategy

### Error Types

```typescript
// API errors follow this shape (from backend)
interface APIError {
  detail: string  // User-friendly error message
  status: number  // HTTP status code
}

// Network errors
interface NetworkError extends Error {
  name: 'NetworkError'
  message: string
}
```

### Error Extraction Utility

```typescript
// Location: frontend/lib/utils/errors.ts
export function getErrorMessage(error: unknown): string {
  // API error response
  if (error && typeof error === 'object' && 'detail' in error) {
    return (error as APIError).detail
  }

  // Network error
  if (error instanceof Error) {
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      return 'Network error. Please check your connection and try again.'
    }
    return error.message
  }

  // Unknown error
  return 'An unexpected error occurred. Please try again.'
}
```

### Component-Level Error Handling

```typescript
// Pattern: Catch at hook level, display via toast
const { addToast } = useToast()

try {
  const task = await api.createTask(userId, data)
  addToast({ type: 'success', message: 'Task created successfully!' })
  return task
} catch (err) {
  const message = getErrorMessage(err)
  addToast({ type: 'error', message })
  throw err  // Re-throw for component-level handling if needed
}
```

---

## 3. Authentication Integration

### Session Management

```typescript
// Location: frontend/lib/auth-client.ts (✅ Already exists)
import { useSession } from './auth-client'

// In component
function TaskList() {
  const session = useSession()

  // Guard: Redirect if not authenticated
  if (!session) {
    redirect('/login')
  }

  const userId = session.user.id

  // Use userId for API calls
  const { tasks, loading, error } = useTasks(userId)

  // ...
}
```

### Session Type

```typescript
interface Session {
  user: {
    id: string
    email: string
    name: string
    image?: string
  }
  expiresAt: Date
}
```

---

## 4. Request/Response Flow Patterns

### Pattern 1: Simple Fetch (Read-Only)

```typescript
// useTasks hook - Initial fetch
const [tasks, setTasks] = useState<Task[]>([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

useEffect(() => {
  const fetchTasks = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getTasks(userId)
      setTasks(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  fetchTasks()
}, [userId])
```

### Pattern 2: Optimistic Update (Toggle Completion)

```typescript
// useTasks hook - Toggle with rollback
const toggleComplete = async (taskId: number) => {
  const task = tasks.find(t => t.id === taskId)
  if (!task) return

  // 1. Update UI immediately (optimistic)
  setTasks(prev => prev.map(t =>
    t.id === taskId ? { ...t, completed: !t.completed } : t
  ))

  try {
    // 2. Send request to API
    await api.toggleComplete(userId, taskId)

    // 3. Success toast
    addToast({
      type: 'success',
      message: task.completed ? 'Task marked incomplete' : 'Task completed!'
    })
  } catch (err) {
    // 4. Rollback on error
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, completed: task.completed } : t
    ))

    // 5. Error toast
    const message = getErrorMessage(err)
    addToast({ type: 'error', message })
  }
}
```

### Pattern 3: Create with Feedback

```typescript
// useTasks hook - Create task
const createTask = async (data: CreateTaskData) => {
  try {
    // 1. Send request
    const newTask = await api.createTask(userId, data)

    // 2. Update local state
    setTasks(prev => [newTask, ...prev])

    // 3. Success feedback
    addToast({ type: 'success', message: 'Task created successfully!' })

    return newTask
  } catch (err) {
    // 4. Error feedback
    const message = getErrorMessage(err)
    addToast({ type: 'error', message })

    // 5. Re-throw for form handling
    throw err
  }
}
```

### Pattern 4: Update with Loading State

```typescript
// useTasks hook - Update task
const updateTask = async (taskId: number, data: UpdateTaskData) => {
  // 1. Mark task as loading
  setMutatingTaskIds(prev => new Set(prev).add(taskId))

  try {
    // 2. Send request
    const updatedTask = await api.updateTask(userId, taskId, data)

    // 3. Update local state
    setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t))

    // 4. Success feedback
    addToast({ type: 'success', message: 'Task updated successfully!' })

    return updatedTask
  } catch (err) {
    // 5. Error feedback
    const message = getErrorMessage(err)
    addToast({ type: 'error', message })
    throw err
  } finally {
    // 6. Clear loading state
    setMutatingTaskIds(prev => {
      const next = new Set(prev)
      next.delete(taskId)
      return next
    })
  }
}
```

### Pattern 5: Delete with Confirmation

```typescript
// TaskList component - Delete flow
const [deleteConfirmTask, setDeleteConfirmTask] = useState<Task | null>(null)

const handleDeleteClick = (task: Task) => {
  setDeleteConfirmTask(task)
}

const handleConfirmDelete = async () => {
  if (!deleteConfirmTask) return

  const taskId = deleteConfirmTask.id

  // Optimistic delete
  setTasks(prev => prev.filter(t => t.id !== taskId))

  try {
    await api.deleteTask(userId, taskId)
    addToast({ type: 'success', message: 'Task deleted successfully!' })
  } catch (err) {
    // Rollback
    setTasks(prev => [deleteConfirmTask, ...prev])
    const message = getErrorMessage(err)
    addToast({ type: 'error', message })
  } finally {
    setDeleteConfirmTask(null)
  }
}

// JSX
<ConfirmDialog
  isOpen={!!deleteConfirmTask}
  onCancel={() => setDeleteConfirmTask(null)}
  onConfirm={handleConfirmDelete}
  title="Delete Task"
  message={`Are you sure you want to delete "${deleteConfirmTask?.title}"?`}
/>
```

---

## 5. Data Transformation Patterns

### Form Data → API Request

```typescript
// TaskForm component
const onSubmit = async (formData: TaskFormData) => {
  // Transform form data to API format
  const apiData: CreateTaskData = {
    title: formData.title.trim(),
    description: formData.description?.trim() || '',
    priority: formData.priority,
    tags: formData.tags,
    due_date: formData.dueDate || null,  // undefined → null
    recurrence: formData.recurrence,
  }

  await createTask(apiData)
}
```

### API Response → Display Format

```typescript
// Task date formatting
function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return 'No due date'

  const date = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const taskDate = new Date(date)
  taskDate.setHours(0, 0, 0, 0)

  const diffDays = Math.floor((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`
  if (diffDays === 0) return 'Due today'
  if (diffDays === 1) return 'Due tomorrow'
  return `Due in ${diffDays} days`
}

// Task priority colors
function getPriorityColor(priority: Priority): string {
  switch (priority) {
    case 'HIGH': return 'text-red-600 bg-red-50'
    case 'MEDIUM': return 'text-yellow-600 bg-yellow-50'
    case 'LOW': return 'text-green-600 bg-green-50'
  }
}
```

---

## 6. Loading States

### Initial Load

```typescript
if (loading) {
  return (
    <div className="flex items-center justify-center py-12">
      <Spinner size="lg" />
      <span className="ml-2 text-gray-600">Loading tasks...</span>
    </div>
  )
}
```

### Empty State

```typescript
if (!loading && tasks.length === 0) {
  return (
    <div className="text-center py-12">
      <h3 className="text-lg font-medium text-gray-900">No tasks yet</h3>
      <p className="mt-1 text-sm text-gray-500">
        Get started by creating your first task.
      </p>
      <Button onClick={handleCreateClick} className="mt-4">
        Create Task
      </Button>
    </div>
  )
}
```

### Error State

```typescript
if (error) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex">
        <ErrorIcon className="h-5 w-5 text-red-600" />
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">Error loading tasks</h3>
          <p className="mt-1 text-sm text-red-700">{error}</p>
          <Button variant="secondary" onClick={refetch} className="mt-2">
            Try Again
          </Button>
        </div>
      </div>
    </div>
  )
}
```

### Item Loading State

```typescript
<TaskItem
  task={task}
  onToggle={toggleComplete}
  isLoading={isTaskLoading(task.id)}
/>

// In TaskItem
{isLoading && (
  <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
    <Spinner size="sm" />
  </div>
)}
```

---

## 7. Caching Strategy

### No External Cache
- Use React state as single source of truth
- Refetch on component mount
- Optimistic updates for immediate feedback
- No localStorage/sessionStorage caching (keep data fresh)

### Future Enhancement: React Query
If caching/sync becomes complex, consider React Query:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const { data: tasks } = useQuery({
  queryKey: ['tasks', userId],
  queryFn: () => api.getTasks(userId),
})

const toggleMutation = useMutation({
  mutationFn: (taskId: number) => api.toggleComplete(userId, taskId),
  onMutate: async (taskId) => {
    // Optimistic update
    await queryClient.cancelQueries(['tasks', userId])
    const previousTasks = queryClient.getQueryData(['tasks', userId])
    queryClient.setQueryData(['tasks', userId], (old) => /* ... */)
    return { previousTasks }
  },
  onError: (err, variables, context) => {
    // Rollback
    queryClient.setQueryData(['tasks', userId], context.previousTasks)
  },
})
```

---

## 8. API Client Configuration

### Base URL & Headers

```typescript
// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',  // Send cookies for Better Auth
  })

  if (!response.ok) {
    const error = await response.json()
    throw error
  }

  return response.json()
}
```

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Integration Checklist

**Gates**:
- ✅ All API calls go through `lib/api.ts` client
- ✅ No direct `fetch()` calls in components
- ✅ Error handling at hook level
- ✅ User feedback via toast notifications
- ✅ Optimistic updates for better UX
- ✅ Loading states for all async operations
- ✅ Authentication via Better Auth session
- ✅ Type safety end-to-end (TypeScript)
- ✅ Rollback on API errors

**Ready for**: Implementation (TDD Phase 2)
