# Todo App Frontend

A modern, full-stack todo application frontend built with Next.js 15, TypeScript, and Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.7 (Strict Mode)
- **Styling**: Tailwind CSS 3.4
- **Authentication**: Better Auth
- **UI**: React 19

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Backend API running at `http://localhost:8000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and configure:
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:8000)
- `BETTER_AUTH_SECRET`: Secret key for Better Auth
- `BETTER_AUTH_URL`: Frontend URL (default: http://localhost:3000)

3. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
frontend/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home/Dashboard page
│   ├── globals.css          # Global styles with Tailwind
│   ├── login/               # Login page
│   ├── signup/              # Signup page
│   └── api/                 # API routes
│       └── auth/            # Better Auth endpoints
├── components/              # React components
│   ├── TaskList.tsx
│   ├── TaskForm.tsx
│   ├── TaskItem.tsx
│   └── AuthProvider.tsx
├── lib/                     # Utility functions
│   ├── types.ts            # TypeScript type definitions
│   ├── api.ts              # Backend API client
│   ├── auth.ts             # Better Auth configuration
│   └── auth-client.ts      # Auth client for components
├── public/                  # Static assets
├── next.config.js          # Next.js configuration
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
└── Dockerfile              # Production Docker image
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Features

- Server-side rendering with Next.js 15 App Router
- Type-safe API calls with TypeScript
- Responsive design with Tailwind CSS
- Dark mode support
- User authentication with Better Auth
- Task management (CRUD operations)
- Priority-based task organization
- Due date reminders
- Real-time task statistics

## Docker

Build and run with Docker:

```bash
# Build the image
docker build -t todo-frontend .

# Run the container
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://api:8000 todo-frontend
```

## Development Guidelines

See [CLAUDE.md](./CLAUDE.md) for detailed development guidelines and best practices.

## API Integration

The frontend communicates with the FastAPI backend at `NEXT_PUBLIC_API_URL`. All API calls are made through the `lib/api.ts` client with JWT token authentication.

### Example API Call

```typescript
import { api } from '@/lib/api';

// Get all tasks
const tasks = await api.getTasks();

// Create a task
const newTask = await api.createTask({
  title: 'Complete project',
  priority: Priority.HIGH,
  due_date: '2025-12-31T23:59:59Z'
});
```

## TypeScript Types

All API types are defined in `lib/types.ts` and match the backend API contracts:

- `Task` - Task model
- `User` - User model
- `Priority` - Priority enum (low, medium, high)
- `CreateTaskInput` - Task creation payload
- `UpdateTaskInput` - Task update payload
- `ApiResponse<T>` - Generic API response wrapper

## Contributing

1. Follow the TypeScript strict mode guidelines
2. Use functional React components with hooks
3. Prefer server components over client components
4. Keep components small and focused
5. Write meaningful commit messages

## License

MIT
