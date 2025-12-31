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

## Current Status & Next Steps

### ✅ **Completed Phases**
1. ✅ **Phase 1 (Setup)**: Project structure, configs, dependencies
2. ✅ **Phase 2 (Core Features)**: Authentication, CRUD, API integration
3. ✅ **Phase 2.5 (Modern UI/UX)**: Framer Motion animations, glassmorphism, gradient mesh

### 🚧 **In Progress**
- **Phase 2.6 (Design System)**: Button & typography standardization
  - Button component refinement (font-weight, sizes, touch targets)
  - Typography scale harmonization (1.25 ratio)
  - Design tokens system

### 📋 **Planned**
- Custom font loading (Inter or similar)
- IconButton component variant
- Accessibility audit (WCAG AA compliance)
- Performance optimization (lazy loading, code splitting)

---

## 🚀 Quick Start (Running Frontend)

> **📌 FOR CLAUDE: When user says "run frontend" or "start frontend-web"**

```bash
# Navigate to frontend directory
cd "D:\new project\Hackthon 2\To-do-app\frontend-web"

# Install dependencies (if first time or package.json changed)
npm install --legacy-peer-deps

# Start development server
npm run dev

# Expected output:
# ✓ Next.js 16.0.10 (Turbopack)
# ✓ Local: http://localhost:3000
# ✓ Ready in 3-4s
```

**Access**: http://localhost:3000

**Common Issues**:
- Port 3000 in use → Kill process: `Stop-Process -Id <pid> -Force`
- Lock file error → Delete: `rm -f .next/dev/lock`
- Module not found → Reinstall: `npm install --legacy-peer-deps`

---

## 🎨 Design System Standards (Phase 2.5+)

### **Animation System (Framer Motion)**
```tsx
import { motion, AnimatePresence } from 'framer-motion'

// Spring physics (default settings)
<motion.div
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
>
  Interactive Element
</motion.div>

// Stagger effect (for lists)
{items.map((item, index) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}  // 50ms stagger
  />
))}

// Layout animations (sliding indicators)
<motion.div layoutId="activeTab" />  // Shared element transitions
```

### **Button Component Standards**

**Sizes** (defined in `components/ui/Button.tsx`):
| Size | Padding | Font Size | Min Height | Use Case |
|------|---------|-----------|------------|----------|
| sm | `px-3 py-2` | `text-sm` (14px) | 32px | Compact actions, mobile |
| md | `px-4 py-3` | `text-base` (16px) | 40px | Default, most common |
| lg | `px-6 py-4` | `text-lg` (18px) | 48px | Primary CTAs |
| xl | `px-8 py-5` | `text-xl` (20px) | 56px | Hero sections |

**Variants**:
- `primary`: Coral gradient (pink-500 → orange-400)
- `secondary`: Purple border, transparent background
- `danger`: Solid red (destructive actions)
- `ghost`: Transparent (subtle actions)

**Features**:
- ✅ Ripple effect on click (Material Design)
- ✅ Spring physics (hover: scale 1.02, tap: scale 0.98)
- ✅ Loading state with spinner
- ✅ Disabled state (40% opacity)
- ✅ Focus ring (2px purple, 100% opacity)

**Usage**:
```tsx
import { Button } from '@/components/ui/Button'

<Button variant="primary" size="md">Submit</Button>
<Button variant="secondary" loading>Loading...</Button>
<Button variant="danger" disabled>Delete</Button>
```

**⚠️ IMPORTANT**: NEVER use native `<button>` tags. Always use the Button component for consistency.

### **Typography Scale (2025 Standard)**

**Harmonious 1.25 Ratio (Major Third)**:
```tsx
text-xs:    12px  (badges, captions)
text-sm:    14px  (form labels, helper text)
text-base:  16px  (body text, buttons)
text-lg:    20px  (section headings)
text-xl:    25px  (page headings)
text-2xl:   32px  (hero headings)
text-3xl:   40px  (landing page titles)
text-4xl:   64px  (hero sections)
```

**Font Weights**:
- `font-light` (300): Subtitles, captions
- `font-normal` (400): Body text
- `font-medium` (500): **Buttons, secondary headings**
- `font-semibold` (600): Primary headings
- `font-bold` (700): Emphasis, callouts

**Line Heights** (set explicitly):
- Body text: `leading-relaxed` (1.625)
- Headings: `leading-tight` (1.25)
- Buttons: `leading-normal` (1.5)

**Example**:
```tsx
<h1 className="text-4xl font-bold leading-tight">Hero Title</h1>
<p className="text-lg font-normal leading-relaxed">Subtitle text</p>
<Button className="text-base font-medium">Action</Button>
```

### **Color System**

**Glassmorphism**:
```css
background: rgba(255, 255, 255, 0.08);
backdrop-filter: blur(20px);
border: 1px solid rgba(139, 92, 246, 0.2);
```

**Gradient Mesh** (background):
```css
/* Animated floating orbs */
background:
  radial-gradient(circle at 20% 30%, rgba(168, 85, 247, 0.15) 0%, transparent 50%),
  radial-gradient(circle at 80% 70%, rgba(236, 72, 153, 0.12) 0%, transparent 50%);
animation: floatingOrbs 20s ease-in-out infinite;
```

**Priority-Based Colors**:
- HIGH: `bg-red-500`, `text-red-400` (danger, urgent)
- MEDIUM: `bg-yellow-500`, `text-yellow-400` (warning, important)
- LOW: `bg-green-500`, `text-green-400` (success, normal)

### **Accessibility Requirements**

**Touch Targets** (mobile):
- Minimum: 44px x 44px (Apple HIG, Material Design)
- Implementation: `min-h-[44px] min-w-[44px]`

**Contrast Ratios** (WCAG AA):
- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- Interactive elements: 3:1 minimum

**Keyboard Navigation**:
- All interactive elements must be focusable
- Focus ring: 2px solid, 100% opacity
- Tab order follows visual order

**Screen Readers**:
- Icon-only buttons: `aria-label` required
- Loading states: `aria-busy="true"`
- Disabled states: `aria-disabled="true"`

---

## 📁 Component Structure

```
components/
├── ui/                          # Design system components
│   ├── Button.tsx               # ✅ Primary button (with ripple)
│   ├── Badge.tsx                # Status indicators
│   ├── Input.tsx                # Form inputs
│   ├── Select.tsx               # Dropdowns
│   └── Toast.tsx                # Notifications
├── TaskCard.tsx                 # ✅ Animated task display
├── TaskForm.tsx                 # Task create/edit modal
├── Calendar.tsx                 # ✅ Animated calendar widget
├── LoadingSkeleton.tsx          # ✅ Shimmer loading states
├── SearchBar.tsx                # Debounced search
├── SortDropdown.tsx             # Sort controls
├── ConfirmDialog.tsx            # Confirmation modals
└── EmptyState.tsx               # Empty state illustrations
```

**✅ = Enhanced with Framer Motion animations**

---

**Frontend Ready**: Modern UI/UX with animations complete. Design system standardization in progress.
