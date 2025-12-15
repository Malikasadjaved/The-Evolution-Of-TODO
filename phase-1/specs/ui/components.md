# UI Components Specification

## Design System

### Color Palette

**Priority Colors:**
- HIGH: Red (#EF4444) - bg-red-500
- MEDIUM: Yellow (#F59E0B) - bg-yellow-500
- LOW: Green (#10B981) - bg-green-500

**Status Colors:**
- Completed: Gray (#9CA3AF) - text-gray-400
- Pending: Default text color
- Overdue: Red (#DC2626) - text-red-600

**UI Colors:**
- Primary: Blue (#3B82F6) - bg-blue-600
- Secondary: Gray (#6B7280) - bg-gray-600
- Success: Green (#10B981) - bg-green-600
- Danger: Red (#EF4444) - bg-red-600

### Typography
- Headings: font-bold
- Body: font-normal
- Small text: text-sm
- Large text: text-lg

### Spacing
- Compact: p-2, gap-2
- Default: p-4, gap-4
- Spacious: p-6, gap-6

---

## Core Components

### 1. AuthProvider
**File:** `components/AuthProvider.tsx`

**Purpose:** Provides authentication context to entire app

**Props:**
- `children: ReactNode`

**Features:**
- Wraps app in Better Auth session provider
- Provides `useSession()` hook to components
- Handles session loading state
- Manages authentication state globally

**Usage:**
```tsx
<AuthProvider>
  <App />
</AuthProvider>
```

---

### 2. TaskList
**File:** `components/TaskList.tsx`

**Purpose:** Display list of tasks with filters and sorting

**Props:**
```typescript
{
  userId: string
  initialFilters?: {
    status?: 'all' | 'pending' | 'completed'
    priority?: 'HIGH' | 'MEDIUM' | 'LOW'
    sort?: 'created' | 'title' | 'due_date' | 'priority'
  }
}
```

**State:**
- `tasks: Task[]` - List of tasks
- `loading: boolean` - Loading state
- `filters: FilterState` - Active filters
- `sortBy: string` - Current sort

**Features:**
- Fetch tasks from API on mount
- Display tasks in grid or list view
- Show loading skeleton
- Show empty state when no tasks
- Handle errors with toast notifications
- Real-time updates on CRUD operations

**Layout:**
```
┌─────────────────────────────────────┐
│ Search Bar              [+ New Task]│
├─────────────────────────────────────┤
│ Filters: [All] [Pending] [Completed]│
│ Sort: [Created ▼]                   │
├─────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐    │
│ │ Task Card 1 │ │ Task Card 2 │    │
│ └─────────────┘ └─────────────┘    │
│ ┌─────────────┐ ┌─────────────┐    │
│ │ Task Card 3 │ │ Task Card 4 │    │
│ └─────────────┘ └─────────────┘    │
└─────────────────────────────────────┘
```

---

### 3. TaskCard / TaskItem
**File:** `components/TaskItem.tsx`

**Purpose:** Display individual task with actions

**Props:**
```typescript
{
  task: Task
  onUpdate: (taskId: number) => void
  onDelete: (taskId: number) => void
  onToggleComplete: (taskId: number) => void
}
```

**Features:**
- Priority indicator (colored badge)
- Tags display (chips/badges)
- Due date with overdue warning
- Completion checkbox
- Edit and delete buttons
- Hover actions
- Click to expand/collapse description

**Layout:**
```
┌──────────────────────────────────────────┐
│ [✓] Task Title                  [H] [🏷] │
│     Short description...                 │
│     📅 Due: Dec 15, 2025 [!OVERDUE]     │
│     [Edit] [Delete]                      │
└──────────────────────────────────────────┘
```

**States:**
- Default: White background
- Completed: Gray background, strikethrough text
- Overdue: Red border, red due date text
- Hover: Shadow, show action buttons

---

### 4. TaskForm
**File:** `components/TaskForm.tsx`

**Purpose:** Create or edit a task

**Props:**
```typescript
{
  userId: string
  task?: Task  // If editing
  onSuccess: (task: Task) => void
  onCancel: () => void
}
```

**State:**
- `formData: TaskFormData`
- `errors: Record<string, string>`
- `isSubmitting: boolean`

**Fields:**
- Title (text input, required)
- Description (textarea, optional)
- Priority (select or button group)
- Tags (tag input with autocomplete)
- Due Date (date picker)
- Due Time (time picker, optional)
- Task Type (radio: scheduled/activity)
- Recurrence (select, if scheduled)

**Validation:**
- Title: 1-200 characters, required
- Description: max 1000 characters
- Due date: must be future date (if scheduled task)
- Real-time validation on blur
- Show error messages below fields

**Layout:**
```
┌──────────────────────────────────────┐
│ Title: [_________________________] * │
│ Description: [_____________________ │
│              _______________________│
│              _____________________] │
│ Priority: (•) HIGH ( ) MEDIUM ( ) LOW│
│ Tags: [work] [urgent] [+Add]         │
│ Due Date: [📅 Dec 15, 2025]         │
│ Due Time: [⏰ 11:59 PM]             │
│ Type: ( ) Scheduled (•) Activity     │
│ Recurrence: [None ▼]                 │
│                                      │
│ [Cancel] [Save Task]                 │
└──────────────────────────────────────┘
```

---

### 5. SearchBar
**File:** `components/SearchBar.tsx`

**Purpose:** Search tasks by keyword

**Props:**
```typescript
{
  userId: string
  onResults: (tasks: Task[]) => void
  placeholder?: string
}
```

**Features:**
- Input field with search icon
- Debounced search (300ms)
- Clear button (X)
- Loading indicator
- Keyboard shortcuts (Ctrl/Cmd+K)

**Layout:**
```
┌────────────────────────────────┐
│ 🔍 Search tasks...         [X] │
└────────────────────────────────┘
```

---

### 6. FilterPanel
**File:** `components/FilterPanel.tsx`

**Purpose:** Filter tasks by multiple criteria

**Props:**
```typescript
{
  onFilterChange: (filters: FilterState) => void
  activeFilters: FilterState
}
```

**Filters:**
- Status: All | Pending | Completed
- Priority: All | HIGH | MEDIUM | LOW
- Tags: Multi-select with checkboxes
- Date: Today | This Week | Overdue | Custom Range

**Features:**
- Active filters shown as removable chips
- Apply and Clear buttons
- Filter count badge
- Collapsible on mobile

**Layout:**
```
┌─────────────────────┐
│ Filters             │
├─────────────────────┤
│ Status:             │
│ ( ) All             │
│ (•) Pending         │
│ ( ) Completed       │
├─────────────────────┤
│ Priority:           │
│ [✓] HIGH            │
│ [✓] MEDIUM          │
│ [ ] LOW             │
├─────────────────────┤
│ Tags:               │
│ [✓] work            │
│ [ ] personal        │
│ [ ] urgent          │
├─────────────────────┤
│ [Apply] [Clear]     │
└─────────────────────┘
```

---

### 7. Modal
**File:** `components/Modal.tsx`

**Purpose:** Reusable modal dialog

**Props:**
```typescript
{
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}
```

**Features:**
- Backdrop overlay (dim background)
- Close on backdrop click
- Close button (X)
- Escape key to close
- Focus trap
- Responsive sizing

**Usage:**
```tsx
<Modal isOpen={showModal} onClose={closeModal} title="Create Task">
  <TaskForm />
</Modal>
```

---

### 8. ConfirmDialog
**File:** `components/ConfirmDialog.tsx`

**Purpose:** Confirmation dialog for destructive actions

**Props:**
```typescript
{
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}
```

**Layout:**
```
┌───────────────────────────────┐
│ ⚠ Delete Task?                │
├───────────────────────────────┤
│ Are you sure you want to      │
│ delete "Complete project"?    │
│ This action cannot be undone. │
│                               │
│ [Cancel] [Delete]             │
└───────────────────────────────┘
```

---

### 9. Toast / Notification
**File:** `components/Toast.tsx`

**Purpose:** Show temporary success/error messages

**Props:**
```typescript
{
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number  // ms, default 3000
  onClose?: () => void
}
```

**Features:**
- Auto-dismiss after duration
- Close button
- Stack multiple toasts
- Slide-in animation
- Position: top-right

**Layout:**
```
┌──────────────────────────┐
│ ✓ Task created!      [X] │
└──────────────────────────┘
```

---

### 10. LoadingSpinner
**File:** `components/LoadingSpinner.tsx`

**Purpose:** Loading indicator

**Props:**
```typescript
{
  size?: 'sm' | 'md' | 'lg'
  color?: string
}
```

**Variants:**
- Spinner icon (rotating)
- Skeleton loader (for content)
- Progress bar (for operations)

---

### 11. EmptyState
**File:** `components/EmptyState.tsx`

**Purpose:** Show when no data available

**Props:**
```typescript
{
  title: string
  message: string
  icon?: ReactNode
  action?: {
    label: string
    onClick: () => void
  }
}
```

**Layout:**
```
┌─────────────────────────┐
│                         │
│      📝 (icon)         │
│   No tasks yet          │
│ Create your first task  │
│   [+ Add Task]          │
│                         │
└─────────────────────────┘
```

---

## Page Components

### Dashboard (app/page.tsx)
**Layout:**
```
┌──────────────────────────────────────────┐
│ Header: [Logo] [Search] [User Menu]      │
├──────┬───────────────────────────────────┤
│      │ Dashboard                         │
│ Side │ ┌───────────────────────────────┐ │
│ bar  │ │ Quick Stats:                  │ │
│      │ │ 5 Pending • 2 Overdue • 3 Done│ │
│ [+]  │ └───────────────────────────────┘ │
│ All  │                                   │
│ Work │ <TaskList />                      │
│ Home │                                   │
│      │                                   │
└──────┴───────────────────────────────────┘
```

### Login Page (app/login/page.tsx)
**Layout:**
```
┌─────────────────────────────┐
│                             │
│   📝 Todo App              │
│                             │
│   Email: [_____________]    │
│   Password: [__________]    │
│   [ ] Remember me           │
│                             │
│   [Sign In]                 │
│                             │
│   Don't have an account?    │
│   Sign Up                   │
└─────────────────────────────┘
```

---

## Responsive Breakpoints

- **Mobile:** < 768px
  - Single column layout
  - Bottom navigation
  - Collapsible filters
  - Full-width modals

- **Tablet:** 768px - 1023px
  - 2-column grid for tasks
  - Drawer-style sidebar
  - Modal max-width: 90%

- **Desktop:** ≥ 1024px
  - 3-column grid for tasks
  - Fixed sidebar
  - Modal max-width: 600px

---

## Accessibility

### ARIA Labels
- Buttons: `aria-label` for icon buttons
- Forms: `aria-describedby` for errors
- Modals: `role="dialog"`, `aria-modal="true"`
- Live regions: `aria-live="polite"` for toasts

### Keyboard Navigation
- Tab order: logical flow
- Escape: close modals/dropdowns
- Enter: submit forms
- Arrow keys: navigate lists
- Shortcuts: Ctrl+K (search), N (new task)

### Focus Management
- Visible focus indicators
- Focus trap in modals
- Return focus after modal close

---

## Performance Optimizations

1. **Lazy Loading:**
   - Use `React.lazy()` for modals and forms
   - Load task list progressively (virtual scrolling)

2. **Memoization:**
   - `React.memo()` for TaskItem
   - `useMemo()` for filtered/sorted tasks
   - `useCallback()` for event handlers

3. **Debouncing:**
   - Search input: 300ms
   - Filter changes: 200ms

4. **Optimistic Updates:**
   - Update UI immediately
   - Revert on API error

5. **Image Optimization:**
   - Use Next.js `<Image>` component
   - Lazy load images below fold
