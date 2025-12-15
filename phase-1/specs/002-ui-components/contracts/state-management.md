# State Management Contracts

**Date**: 2025-12-10
**Feature**: UI Components for Task Management
**Phase**: Phase 1 - Design & Contracts

## Overview

This document defines custom React hooks, state patterns, and state management contracts for the UI components. All state is component-scoped using React hooks - no global state management library needed.

---

## 1. useTasks Hook

**Purpose**: Fetch, cache, and mutate tasks for a given user.

**Location**: `frontend/lib/hooks/useTasks.ts`

### Hook Signature

```typescript
function useTasks(userId: string): UseTasksReturn

interface UseTasksReturn {
  // Data
  tasks: Task[]
  loading: boolean
  error: string | null

  // Mutations
  toggleComplete: (taskId: number) => Promise<void>
  createTask: (data: CreateTaskData) => Promise<Task>
  updateTask: (taskId: number, data: UpdateTaskData) => Promise<Task>
  deleteTask: (taskId: number) => Promise<void>

  // Utilities
  refetch: () => Promise<void>
  isTaskLoading: (taskId: number) => boolean
}
```

### State Shape

```typescript
interface UseTasksState {
  tasks: Task[]
  loading: boolean  // Initial fetch loading
  error: string | null
  mutatingTaskIds: Set<number>  // Track tasks being mutated
}
```

### Implementation Pattern

```typescript
export function useTasks(userId: string): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mutatingTaskIds, setMutatingTaskIds] = useState<Set<number>>(new Set())

  const { addToast } = useToast()

  // Initial fetch
  useEffect(() => {
    fetchTasks()
  }, [userId])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getTasks(userId)
      setTasks(data)
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      addToast({ type: 'error', message })
    } finally {
      setLoading(false)
    }
  }

  // Optimistic update pattern
  const toggleComplete = async (taskId: number) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    // Mark as mutating
    setMutatingTaskIds(prev => new Set(prev).add(taskId))

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ))

    try {
      await api.toggleComplete(userId, taskId)
      addToast({
        type: 'success',
        message: task.completed ? 'Task marked as incomplete' : 'Task completed!'
      })
    } catch (err) {
      // Rollback on error
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, completed: task.completed } : t
      ))
      const message = getErrorMessage(err)
      addToast({ type: 'error', message })
    } finally {
      setMutatingTaskIds(prev => {
        const next = new Set(prev)
        next.delete(taskId)
        return next
      })
    }
  }

  const createTask = async (data: CreateTaskData) => {
    try {
      const newTask = await api.createTask(userId, data)
      setTasks(prev => [newTask, ...prev])
      addToast({ type: 'success', message: 'Task created successfully!' })
      return newTask
    } catch (err) {
      const message = getErrorMessage(err)
      addToast({ type: 'error', message })
      throw err
    }
  }

  const updateTask = async (taskId: number, data: UpdateTaskData) => {
    setMutatingTaskIds(prev => new Set(prev).add(taskId))

    try {
      const updatedTask = await api.updateTask(userId, taskId, data)
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t))
      addToast({ type: 'success', message: 'Task updated successfully!' })
      return updatedTask
    } catch (err) {
      const message = getErrorMessage(err)
      addToast({ type: 'error', message })
      throw err
    } finally {
      setMutatingTaskIds(prev => {
        const next = new Set(prev)
        next.delete(taskId)
        return next
      })
    }
  }

  const deleteTask = async (taskId: number) => {
    setMutatingTaskIds(prev => new Set(prev).add(taskId))

    // Optimistic delete
    const deletedTask = tasks.find(t => t.id === taskId)
    setTasks(prev => prev.filter(t => t.id !== taskId))

    try {
      await api.deleteTask(userId, taskId)
      addToast({ type: 'success', message: 'Task deleted successfully!' })
    } catch (err) {
      // Rollback on error
      if (deletedTask) {
        setTasks(prev => [deletedTask, ...prev])
      }
      const message = getErrorMessage(err)
      addToast({ type: 'error', message })
      throw err
    } finally {
      setMutatingTaskIds(prev => {
        const next = new Set(prev)
        next.delete(taskId)
        return next
      })
    }
  }

  const isTaskLoading = (taskId: number) => mutatingTaskIds.has(taskId)

  return {
    tasks,
    loading,
    error,
    toggleComplete,
    createTask,
    updateTask,
    deleteTask,
    refetch: fetchTasks,
    isTaskLoading,
  }
}
```

---

## 2. useTaskForm Hook

**Purpose**: Manage form state, validation, and submission for task forms.

**Location**: `frontend/lib/hooks/useTaskForm.ts`

### Hook Signature

```typescript
function useTaskForm(options: UseTaskFormOptions): UseTaskFormReturn

interface UseTaskFormOptions {
  mode: 'create' | 'edit'
  task?: Task
  onSuccess: (task: Task) => void
  onCancel: () => void
  userId: string
}

interface UseTaskFormReturn {
  // React Hook Form methods
  register: UseFormRegister<TaskFormData>
  handleSubmit: UseFormHandleSubmit<TaskFormData>
  formState: FormState<TaskFormData>
  watch: UseFormWatch<TaskFormData>
  setValue: UseFormSetValue<TaskFormData>
  reset: UseFormReset<TaskFormData>

  // Custom handlers
  onSubmit: (data: TaskFormData) => Promise<void>
  onTagAdd: (tag: string) => void
  onTagRemove: (tag: string) => void

  // State
  submitting: boolean
  error: string | null
}
```

### Implementation Pattern

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { taskFormSchema, type TaskFormData } from './schemas'

export function useTaskForm(options: UseTaskFormOptions): UseTaskFormReturn {
  const { mode, task, onSuccess, onCancel, userId } = options
  const { addToast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize form with React Hook Form + Zod
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: mode === 'edit' && task ? {
      title: task.title,
      description: task.description,
      priority: task.priority,
      tags: task.tags,
      dueDate: task.due_date || undefined,
      recurrence: task.recurrence,
    } : {
      title: '',
      description: '',
      priority: 'MEDIUM',
      tags: [],
      dueDate: undefined,
      recurrence: 'NONE',
    }
  })

  const onSubmit = async (data: TaskFormData) => {
    try {
      setSubmitting(true)
      setError(null)

      if (mode === 'create') {
        const newTask = await api.createTask(userId, {
          title: data.title,
          description: data.description || '',
          priority: data.priority,
          tags: data.tags,
          due_date: data.dueDate || null,
          recurrence: data.recurrence,
        })
        addToast({ type: 'success', message: 'Task created successfully!' })
        onSuccess(newTask)
      } else if (mode === 'edit' && task) {
        const updatedTask = await api.updateTask(userId, task.id, {
          title: data.title,
          description: data.description || '',
          priority: data.priority,
          tags: data.tags,
          due_date: data.dueDate || null,
          recurrence: data.recurrence,
        })
        addToast({ type: 'success', message: 'Task updated successfully!' })
        onSuccess(updatedTask)
      }
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      addToast({ type: 'error', message })
    } finally {
      setSubmitting(false)
    }
  }

  const onTagAdd = (tag: string) => {
    const currentTags = form.watch('tags')
    if (!currentTags.includes(tag)) {
      form.setValue('tags', [...currentTags, tag])
    }
  }

  const onTagRemove = (tag: string) => {
    const currentTags = form.watch('tags')
    form.setValue('tags', currentTags.filter(t => t !== tag))
  }

  return {
    ...form,
    onSubmit: form.handleSubmit(onSubmit),
    onTagAdd,
    onTagRemove,
    submitting,
    error,
  }
}
```

---

## 3. useToast Hook

**Purpose**: Global toast notification state management.

**Location**: `frontend/lib/hooks/useToast.ts`

### Context & Hook

```typescript
interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7)
    const duration = toast.duration ?? 3000

    setToasts(prev => [...prev, { ...toast, id }])

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
```

---

## 4. useDebounce Hook

**Purpose**: Debounce search input for performance.

**Location**: `frontend/lib/hooks/useDebounce.ts`

### Hook Signature

```typescript
function useDebounce<T>(value: T, delay: number): T
```

### Implementation

```typescript
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
```

### Usage Example

```typescript
function SearchBar({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    onSearch(debouncedQuery)
  }, [debouncedQuery, onSearch])

  return (
    <input
      type="text"
      value={query}
      onChange={e => setQuery(e.target.value)}
      placeholder="Search tasks..."
    />
  )
}
```

---

## 5. useModal Hook

**Purpose**: Manage modal open/close state and return focus.

**Location**: `frontend/lib/hooks/useModal.ts`

### Hook Signature

```typescript
function useModal(): UseModalReturn

interface UseModalReturn {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}
```

### Implementation

```typescript
export function useModal(initialOpen = false): UseModalReturn {
  const [isOpen, setIsOpen] = useState(initialOpen)
  const triggerRef = useRef<HTMLElement | null>(null)

  const open = useCallback(() => {
    triggerRef.current = document.activeElement as HTMLElement
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    // Return focus to trigger element
    if (triggerRef.current) {
      triggerRef.current.focus()
      triggerRef.current = null
    }
  }, [])

  const toggle = useCallback(() => {
    if (isOpen) {
      close()
    } else {
      open()
    }
  }, [isOpen, open, close])

  return { isOpen, open, close, toggle }
}
```

---

## 6. Local Component State Patterns

### TaskList State

```typescript
function TaskList({ userId }: TaskListProps) {
  // Fetch & mutate tasks
  const { tasks, loading, error, toggleComplete, deleteTask } = useTasks(userId)

  // Filter/sort state
  const [filters, setFilters] = useState<TaskFilters>({
    status: 'all',
    priority: 'all',
    tags: [],
    search: '',
  })

  const [sort, setSort] = useState<SortOption>({
    field: 'dueDate',
    direction: 'asc',
  })

  // Modal state
  const editModal = useModal()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  // Confirm dialog state
  const [deleteConfirmTask, setDeleteConfirmTask] = useState<Task | null>(null)

  // Search debouncing
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Computed: filtered & sorted tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter(task => {
        // Status filter
        if (filters.status === 'active' && task.completed) return false
        if (filters.status === 'completed' && !task.completed) return false

        // Priority filter
        if (filters.priority !== 'all' && task.priority !== filters.priority) return false

        // Tags filter
        if (filters.tags.length > 0) {
          const hasTag = filters.tags.some(tag => task.tags.includes(tag))
          if (!hasTag) return false
        }

        // Search filter
        if (debouncedSearch) {
          const searchLower = debouncedSearch.toLowerCase()
          const matchesTitle = task.title.toLowerCase().includes(searchLower)
          const matchesDesc = task.description.toLowerCase().includes(searchLower)
          if (!matchesTitle && !matchesDesc) return false
        }

        return true
      })
      .sort((a, b) => {
        const direction = sort.direction === 'asc' ? 1 : -1
        if (sort.field === 'dueDate') {
          return compareDates(a.due_date, b.due_date) * direction
        }
        // ... other sort logic
      })
  }, [tasks, filters, sort, debouncedSearch])

  // ... component JSX
}
```

---

## State Management Principles

### 1. Colocation
- State lives in the component that uses it
- Share state via props, not global state
- Custom hooks extract reusable stateful logic

### 2. Optimistic Updates
- Update UI immediately for better UX
- Rollback on error
- Show loading indicator during mutation

### 3. Error Handling
- Catch errors at hook level
- Display user-friendly messages via toast
- Allow retry when appropriate

### 4. Performance
- Use `useMemo` for expensive computations (filter/sort)
- Use `useCallback` for callbacks passed to child components
- Debounce search input

### 5. Type Safety
- All state fully typed with TypeScript
- Zod schemas for runtime validation
- Generic hooks where appropriate

---

## Contract Validation

**Gates**:
- ✅ All hooks have clear input/output types
- ✅ Optimistic update pattern implemented
- ✅ Error handling at hook level
- ✅ Toast notifications integrated
- ✅ Debouncing for search
- ✅ Modal focus management
- ✅ No global state (Redux/Zustand) - all component-scoped

**Ready for**: Implementation (TDD Phase 2)
