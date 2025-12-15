# Research: UI Components Technology Decisions

**Date**: 2025-12-10
**Feature**: UI Components for Task Management
**Phase**: Phase 0 - Research & Technology Selection

## Overview

This document captures technology decisions and best practices research for implementing React UI components in the Phase II web application.

---

## 1. Component Library Selection

### Decision: Headless UI + Custom Tailwind Components

**Rationale**:
- **Accessibility**: Headless UI provides built-in ARIA attributes, keyboard navigation, and focus management
- **Styling Control**: Full control over Tailwind styling without fighting component library defaults
- **Bundle Size**: ~15KB gzipped (minimal)
- **Next.js 15 Compatible**: Official Tailwind Labs product, optimized for Next.js
- **Type Safety**: First-class TypeScript support

**Alternatives Considered**:
1. **shadcn/ui**: Rejected - too opinionated, requires copying components into codebase
2. **Radix UI**: Rejected - larger bundle size (~45KB), more complex API
3. **Material-UI**: Rejected - heavy (300KB+), design system conflicts with Tailwind
4. **Vanilla Tailwind**: Rejected - would need to reimplement accessibility features

**Implementation Pattern**:
```typescript
import { Dialog, Transition } from '@headlessui/react'

// Modal with accessibility built-in
<Dialog open={isOpen} onClose={onClose}>
  <Transition.Child>
    <div className="fixed inset-0 bg-black/30" />
  </Transition.Child>
  <Dialog.Panel className="...tailwind classes">
    {children}
  </Dialog.Panel>
</Dialog>
```

---

## 2. Form Management & Validation

### Decision: React Hook Form + Zod

**Rationale**:
- **Performance**: Minimal re-renders (uncontrolled inputs by default)
- **Type Safety**: Zod provides TypeScript-first schema validation
- **Bundle Size**: React Hook Form (9KB) + Zod (13KB) = 22KB gzipped
- **Developer Experience**: Clean API, integrates with Tailwind forms
- **Validation**: Real-time, on-blur, and submit-time validation support

**Alternatives Considered**:
1. **Formik**: Rejected - larger bundle (40KB), more re-renders, slower
2. **Vanilla React State**: Rejected - verbose, error-prone, no schema validation
3. **Redux Form**: Rejected - deprecated, requires Redux

**Implementation Pattern**:
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const taskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
})

type TaskFormData = z.infer<typeof taskSchema>

function TaskForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema)
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('title')} />
      {errors.title && <span>{errors.title.message}</span>}
    </form>
  )
}
```

---

## 3. State Management Pattern

### Decision: React Hooks (useState, Custom Hooks)

**Rationale**:
- **Simplicity**: No global state needed for this feature scope
- **Colocation**: State lives close to where it's used
- **Performance**: Component-scoped state, no prop drilling
- **Zero Dependencies**: Built into React, no additional libraries

**Alternatives Considered**:
1. **Zustand**: Rejected - unnecessary for component-scoped state
2. **Redux**: Rejected - overkill, boilerplate heavy, slow
3. **Context API**: Rejected - causes unnecessary re-renders, not needed
4. **Jotai/Recoil**: Rejected - atomic state unnecessary for this scope

**Implementation Pattern**:
```typescript
// Custom hook for task list management
function useTasks(userId: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTasks()
  }, [userId])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const data = await api.getTasks(userId)
      setTasks(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const toggleComplete = async (taskId: number) => {
    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ))

    try {
      await api.toggleComplete(userId, taskId)
    } catch (err) {
      // Revert on error
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ))
      setError(getErrorMessage(err))
    }
  }

  return { tasks, loading, error, fetchTasks, toggleComplete }
}
```

---

## 4. Toast Notification System

### Decision: Custom React Context + Portal

**Rationale**:
- **Lightweight**: ~50 lines of code, no dependencies
- **Type Safe**: Full TypeScript control
- **Tailwind Styled**: Consistent with design system
- **Portal Rendering**: Renders at document root, avoids z-index issues

**Alternatives Considered**:
1. **react-hot-toast**: Rejected - adds 12KB for simple use case
2. **react-toastify**: Rejected - requires CSS import, styling conflicts
3. **Sonner**: Rejected - opinionated animations, less control

**Implementation Pattern**:
```typescript
// lib/hooks/useToast.ts
import { createContext, useContext, useState } from 'react'
import { createPortal } from 'react-dom'

type Toast = {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
}

const ToastContext = createContext<{
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}>({} as any)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36)
    setToasts(prev => [...prev, { ...toast, id }])
    setTimeout(() => removeToast(id), 3000)
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {createPortal(
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map(toast => (
            <ToastItem key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
```

---

## 5. Accessibility (A11Y) Patterns

### Decision: Headless UI + Manual ARIA + Keyboard Testing

**Rationale**:
- **WCAG 2.1 AA Compliance**: Required by spec
- **Headless UI**: Provides Dialog, Menu, Listbox with built-in accessibility
- **Manual ARIA**: Add to custom components (badges, task items)
- **Focus Management**: focus-trap-react for modals

**Key Requirements**:
1. **Keyboard Navigation**:
   - Tab/Shift+Tab: Navigate focusable elements
   - Enter/Space: Activate buttons/checkboxes
   - Escape: Close modals/dialogs
   - Arrow keys: Navigate lists (optional enhancement)

2. **ARIA Attributes**:
   - `aria-label`: Describe icon buttons ("Delete task", "Edit task")
   - `aria-labelledby`: Link modal title to dialog
   - `aria-describedby`: Link error messages to inputs
   - `role="alert"`: Toast notifications
   - `aria-live="polite"`: Dynamic content updates

3. **Focus Management**:
   - Focus modal first element on open
   - Return focus to trigger on close
   - Trap focus within modal
   - Visible focus indicators (Tailwind ring utilities)

**Implementation Pattern**:
```typescript
// Accessible task item
<div
  role="article"
  aria-labelledby={`task-${task.id}-title`}
  className="focus-within:ring-2 focus-within:ring-blue-500"
>
  <input
    type="checkbox"
    checked={task.completed}
    onChange={() => onToggle(task.id)}
    aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
  />
  <h3 id={`task-${task.id}-title`}>{task.title}</h3>
  <button
    onClick={() => onEdit(task)}
    aria-label={`Edit task "${task.title}"`}
  >
    <EditIcon aria-hidden="true" />
  </button>
</div>
```

---

## 6. Performance Optimizations

### Decision: React.memo + useMemo + useCallback (Selective)

**Rationale**:
- **Avoid Premature Optimization**: Only optimize when needed
- **React.memo**: Use for TaskItem (renders frequently)
- **useMemo**: Use for expensive computations (filtering, sorting)
- **useCallback**: Use for callbacks passed to memoized components

**When to Optimize**:
-  TaskItem: Many instances, frequent updates
-  Filter/sort operations: Expensive with 500+ tasks
- L TaskForm: Renders infrequently
- L Modal: Opens/closes, not in render loop

**Implementation Pattern**:
```typescript
// Memoized task item
export const TaskItem = React.memo(function TaskItem({ task, onToggle, onEdit, onDelete }: Props) {
  // Memoize callbacks to prevent child re-renders
  const handleToggle = useCallback(() => onToggle(task.id), [task.id, onToggle])
  const handleEdit = useCallback(() => onEdit(task), [task, onEdit])

  return (
    <div>
      <input type="checkbox" onChange={handleToggle} />
      {/* ... */}
    </div>
  )
})

// Memoized filtered/sorted tasks
const filteredTasks = useMemo(() => {
  return tasks
    .filter(t => filters.status === 'all' || t.completed === (filters.status === 'completed'))
    .sort((a, b) => sortFn(a, b, sortBy))
}, [tasks, filters, sortBy])
```

**Virtual Scrolling** (if needed for 1000+ tasks):
```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

const virtualizer = useVirtualizer({
  count: tasks.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 100, // estimate height
})
```

---

## 7. Testing Strategy

### Decision: React Testing Library + Playwright

**Rationale**:
- **User-Centric**: Tests mirror real user interactions
- **Fast Unit Tests**: React Testing Library for components
- **E2E Coverage**: Playwright for full user journeys
- **TypeScript Support**: Both tools first-class TypeScript

**Testing Pyramid**:
```
E2E Tests (Playwright)         ² 10% - Critical user journeys
  ‘                            
Integration Tests (RTL)         20% - Component interactions
  ‘                            
Unit Tests (RTL + Jest)         70% - Individual components
```

**Implementation Patterns**:

**Component Test (React Testing Library)**:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TaskList } from '@/components/TaskList'

describe('TaskList', () => {
  it('toggles task completion on checkbox click', async () => {
    const mockToggle = jest.fn()
    render(<TaskList tasks={mockTasks} onToggle={mockToggle} />)

    const checkbox = screen.getByRole('checkbox', { name: /complete project/i })
    fireEvent.click(checkbox)

    await waitFor(() => {
      expect(mockToggle).toHaveBeenCalledWith(1)
    })
  })
})
```

**E2E Test (Playwright)**:
```typescript
import { test, expect } from '@playwright/test'

test('user can create and complete a task', async ({ page }) => {
  await page.goto('http://localhost:3000')

  // Login
  await page.fill('[name="email"]', 'user@test.com')
  await page.fill('[name="password"]', 'password')
  await page.click('button:has-text("Sign In")')

  // Create task
  await page.click('button:has-text("New Task")')
  await page.fill('[name="title"]', 'Test Task')
  await page.click('button:has-text("Create")')

  // Verify task appears
  await expect(page.locator('text=Test Task')).toBeVisible()

  // Complete task
  await page.click('[aria-label*="Mark"]')
  await expect(page.locator('text=Test Task')).toHaveClass(/line-through/)
})
```

---

## 8. Responsive Design Strategy

### Decision: Mobile-First Tailwind + Breakpoint Utilities

**Rationale**:
- **Mobile Usage**: 60%+ of web traffic is mobile
- **Progressive Enhancement**: Start small, add complexity
- **Tailwind Breakpoints**: Built-in, consistent naming

**Breakpoints**:
```
mobile:  < 768px   (sm: default)
tablet:  768-1023px (md:)
desktop: e 1024px   (lg:)
```

**Layout Strategy**:
```typescript
// TaskList: Responsive grid
<div className="
  grid
  grid-cols-1           // Mobile: single column
  md:grid-cols-2        // Tablet: 2 columns
  lg:grid-cols-3        // Desktop: 3 columns
  gap-4
">
  {tasks.map(task => <TaskItem key={task.id} task={task} />)}
</div>

// TaskForm: Responsive modal
<Dialog.Panel className="
  w-full                // Mobile: full width
  max-w-md              // All: max 28rem
  mx-4                  // Mobile: margin
  md:mx-auto            // Tablet+: center
  p-6
">
  <form>...</form>
</Dialog.Panel>
```

---

## 9. Animation & Transitions

### Decision: Tailwind Transitions + Headless UI Transitions

**Rationale**:
- **Consistent**: Use Tailwind transition utilities
- **Performant**: CSS transitions (GPU-accelerated)
- **Accessible**: Respects `prefers-reduced-motion`

**Patterns**:
```typescript
// Modal entrance/exit
<Transition show={isOpen}>
  <Transition.Child
    enter="ease-out duration-300"
    enterFrom="opacity-0"
    enterTo="opacity-100"
    leave="ease-in duration-200"
    leaveFrom="opacity-100"
    leaveTo="opacity-0"
  >
    <div className="fixed inset-0 bg-black/30" />
  </Transition.Child>
</Transition>

// Toast slide-in
<div className="
  transform transition-all duration-300
  translate-x-0 opacity-100
  data-[state=closed]:translate-x-full
  data-[state=closed]:opacity-0
">
  Toast content
</div>

// Hover states
<button className="
  transition-colors duration-150
  hover:bg-blue-600
  active:bg-blue-700
">
  Button
</button>
```

---

## 10. Error Handling Patterns

### Decision: Error Boundaries + Toast Notifications + Inline Errors

**Rationale**:
- **Graceful Degradation**: Errors don't crash the app
- **User Feedback**: Clear, actionable error messages
- **Recovery**: Retry buttons where appropriate

**Implementation**:
```typescript
// Error boundary for component crashes
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 rounded">
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// API error handling with toast
try {
  await api.createTask(userId, data)
  addToast({ type: 'success', message: 'Task created!' })
} catch (error) {
  addToast({ type: 'error', message: getErrorMessage(error) })
}

// Inline form errors
{errors.title && (
  <p className="text-sm text-red-600" role="alert">
    {errors.title.message}
  </p>
)}
```

---

## Summary

**Technology Stack Selected**:
-  Headless UI for accessible components
-  React Hook Form + Zod for forms
-  Custom hooks for state management
-  Custom toast system with React Context
-  React Testing Library + Playwright
-  Tailwind CSS (mobile-first, responsive)
-  TypeScript strict mode

**Total Bundle Size Addition**: ~50KB gzipped (acceptable)

**Next Steps**: Proceed to Phase 1 (Design & Contracts)
