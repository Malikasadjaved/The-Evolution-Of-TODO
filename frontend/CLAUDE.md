# Frontend Development Guide - Phase 2

## Overview

This is the Next.js frontend for the Phase 2 Full-Stack Todo Application.

**Tech Stack**:
- Next.js 16+ (App Router)
- React 19+
- TypeScript 5.x
- Tailwind CSS 3.4+
- Better Auth (Authentication)
- React Query / TanStack Query (State management)
- Jest + React Testing Library (Testing)

## Project Structure

```
frontend/
├── app/
│   ├── (auth)/                  # Auth route group
│   │   ├── login/page.tsx       # Login page
│   │   └── signup/page.tsx      # Signup page
│   ├── (dashboard)/             # Protected route group
│   │   ├── layout.tsx           # Dashboard layout
│   │   ├── page.tsx             # Task list (dashboard home)
│   │   └── tasks/[id]/page.tsx  # Task detail page
│   ├── api/
│   │   └── auth/[...all]/route.ts  # Better Auth API route
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page ✅ CREATED
│   └── globals.css              # Tailwind directives ✅ CREATED
├── components/
│   ├── ui/                      # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   └── Select.tsx
│   ├── TaskList.tsx
│   ├── TaskItem.tsx
│   ├── TaskForm.tsx
│   ├── Toast.tsx
│   └── Modal.tsx
├── lib/
│   ├── api.ts                   # API client with JWT auto-attachment
│   ├── auth.ts                  # Better Auth client
│   └── utils.ts                 # Utility functions
├── hooks/
│   ├── useTasks.ts              # React Query hooks
│   ├── useAuth.ts               # Auth state management
│   └── useDebounce.ts           # Debounce hook
├── types/
│   └── api.ts                   # TypeScript interfaces (Task, Tag, etc.)
├── __tests__/
│   ├── components/
│   └── hooks/
├── .env.local                   # Environment variables (DO NOT COMMIT) ✅ CREATED
├── .env.local.example           # Environment template ✅ CREATED
├── package.json                 # Dependencies ✅ CREATED
├── tsconfig.json                # TypeScript config ✅ CREATED
├── tailwind.config.js           # Tailwind config ✅ CREATED
├── next.config.js               # Next.js config ✅ CREATED
├── .eslintrc.json               # ESLint config ✅ CREATED
├── .prettierrc                  # Prettier config ✅ CREATED
└── jest.config.js               # Jest config ✅ CREATED
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd frontend
npm install
```

**Expected Dependencies** (see `package.json`):
- Next.js 16+
- React 19+
- TypeScript 5.x
- Tailwind CSS 3.4+
- Better Auth
- TanStack Query
- Zod (validation)

### 2. Configure Environment

Copy `.env.local.example` to `.env.local` (already created):

```bash
# Already created with correct values:
# - NEXT_PUBLIC_API_URL=http://localhost:8000
# - BETTER_AUTH_SECRET=EWNhWQFikqssCNiZtGZrUVK32lnGWoobrM9ttp8ezE8
# - BETTER_AUTH_URL=http://localhost:3000/api/auth
```

✅ **Environment Ready**: All variables configured correctly

### 3. Run Development Server

```bash
npm run dev
```

**Access**:
- Frontend: http://localhost:3000
- Landing page with Login/Sign Up buttons

## Development Workflow

### Code Quality

```bash
# Lint
npm run lint

# Type check
npm run type-check

# Format (Prettier)
npx prettier --write .
```

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch

# Run specific test file
npm test TaskList.test.tsx
```

**Test Coverage Requirements**:
- ✅ **60% minimum** overall coverage
- Component tests for all UI components
- Integration tests for API client

## Authentication Flow

### 1. User Signs Up/Logs In

```typescript
// app/(auth)/login/page.tsx
import { useSignIn } from '@/hooks/useAuth'

const { signIn } = useSignIn()
await signIn({ email, password })
```

### 2. Better Auth Issues JWT Token

```typescript
// Automatic - Better Auth stores token in localStorage
// Token payload: { user_id, email, exp, iat }
```

### 3. API Client Auto-Attaches Token

```typescript
// lib/api.ts
const token = localStorage.getItem('auth_token')
const response = await fetch(`${API_BASE_URL}${url}`, {
  headers: {
    'Authorization': `Bearer ${token}`,  // Auto-attached
    ...
  },
})
```

### 4. Error Handling

```typescript
// 401 Unauthorized → Redirect to login
if (response.status === 401) {
  localStorage.removeItem('auth_token')
  window.location.href = '/login?error=session_expired'
}

// 403 Forbidden → Show error toast
if (response.status === 403) {
  showToast({ message: 'Access denied', type: 'error' })
}
```

## API Client Usage

```typescript
import { api } from '@/lib/api'

// List all tasks
const tasks = await api.getTasks(userId)

// Create task
const newTask = await api.createTask(userId, {
  title: 'Complete project',
  description: 'Write documentation',
  priority: 'HIGH',
})

// Update task
const updated = await api.updateTask(userId, taskId, {
  title: 'Updated title',
})

// Delete task
await api.deleteTask(userId, taskId)

// Toggle status
await api.toggleTaskStatus(userId, taskId, 'COMPLETE')
```

## React Query Hooks

```typescript
import { useTasks, useCreateTask } from '@/hooks/useTasks'

function TaskList() {
  // Fetch tasks (with caching, auto-refetch)
  const { data: tasks, isLoading } = useTasks(userId)

  // Create task mutation
  const createTask = useCreateTask()

  const handleCreate = async (data) => {
    await createTask.mutateAsync({
      userId,
      task: data,
    })
  }

  return <div>...</div>
}
```

## Styling with Tailwind

```tsx
// Example component
<button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
  Click Me
</button>

// Responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  ...
</div>

// Conditional classes
<div className={cn(
  "p-4 rounded",
  status === 'COMPLETE' && "bg-green-100",
  status === 'INCOMPLETE' && "bg-gray-100"
)}>
  ...
</div>
```

## Common Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint

# Type check
npm run type-check

# Run tests
npm test

# Install new dependency
npm install <package>
```

## Troubleshooting

### `BETTER_AUTH_SECRET must be at least 32 characters`
✅ **Fixed**: Secret is already 43 characters (matches backend)

### `Module not found: Can't resolve '@/lib/api'`
```bash
npm install  # Install all dependencies
```

### `fetch failed` or `ECONNREFUSED`
- Ensure backend is running on port 8000
- Check `NEXT_PUBLIC_API_URL` in `.env.local`

### `Session expired. Please login again.` (401)
- JWT token expired or invalid
- Login again at http://localhost:3000/login

### CORS Error
- Check backend `FRONTEND_URL` matches `http://localhost:3000`
- Verify CORS middleware in `backend/src/api/main.py`

## Next Steps

1. ✅ **Phase 1 (Setup)**: Complete
2. ⏭️ **Phase 2 (Foundational)**: Implement core infrastructure
   - T024-T037: TypeScript types, API client, Better Auth, UI components
3. ⏭️ **Phase 3 (US1 - Authentication)**: Build login/signup pages
4. ⏭️ **Phase 4+ (User Stories)**: Implement features incrementally

---

**Frontend Setup Complete**: Ready for Phase 2 (Foundational) implementation.
