```markdown
# Frontend Development Guidelines

## Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Auth**: Better Auth with JWT

## Project Structure
frontend/
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home/Dashboard
│   ├── login/
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   └── api/
│       └── auth/
│           └── [...all]/route.ts  # Better Auth endpoints
├── components/
│   ├── TaskList.tsx
│   ├── TaskForm.tsx
│   ├── TaskItem.tsx
│   └── AuthProvider.tsx
├── lib/
│   ├── api.ts               # Backend API client
│   ├── auth.ts              # Better Auth config
│   └── types.ts             # TypeScript types
└── .env.local

## Component Patterns

### Server Components (Default)
Use for static content and initial data fetching:
```tsx
// app/page.tsx
export default async function DashboardPage() {
  // Fetch data on server
  return <TaskList />
}

Client Components

Only when needed for interactivity:
'use client'

import { useState } from 'react'

export function TaskForm() {
  const [title, setTitle] = useState('')
  // Interactive logic
}

API Client

All backend calls through /lib/api.ts:
import { getSession } from '@/lib/auth'

export const api = {
  async getTasks() {
    const session = await getSession()
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${session.user.id}/tasks`, {
      headers: {
        'Authorization': `Bearer ${session.token}`
      }
    })
    return response.json()
  }
}

Styling

- Use Tailwind CSS utility classes
- No inline styles
- Dark mode support with dark: prefix
- Responsive design with sm:, md:, lg: breakpoints

Authentication Flow

1. User signs up/logs in via Better Auth
2. Better Auth issues JWT token
3. Store token in session/cookies
4. Include token in all API requests to backend
5. Backend verifies token and returns user-specific data
