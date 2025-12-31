# Frontend-Backend Integration Contract

**Feature**: Phase 2 Full-Stack Web Application
**Date**: 2025-12-15
**Branch**: `001-fullstack-web-app`
**Phase**: 1 (Design - Contracts)

## Purpose

This document defines how the Next.js frontend integrates with the FastAPI backend, including API client implementation, TypeScript type definitions, error handling, and environment configuration.

---

## 1. TypeScript Type Definitions

### Task Types

**File**: `frontend/types/api.ts`

```typescript
/**
 * Task entity matching backend SQLModel.
 * MUST align with backend/src/api/models.py Task model.
 */
export interface Task {
  id: number;
  user_id: string;
  title: string;
  description: string | null;
  status: "COMPLETE" | "INCOMPLETE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  due_date: string | null;          // ISO 8601 datetime string
  tags: string[];                    // Array of tag names
  recurrence: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  last_completed_at: string | null;  // ISO 8601 datetime string
  created_at: string;                // ISO 8601 datetime string
  updated_at: string;                // ISO 8601 datetime string
}

/**
 * Input for creating a new task.
 * Corresponds to backend CreateTaskRequest Pydantic model.
 */
export interface CreateTaskInput {
  title: string;                     // Required
  description?: string;              // Optional
  priority?: "LOW" | "MEDIUM" | "HIGH";
  due_date?: string;                 // ISO 8601 datetime string
  tags?: string[];
  recurrence?: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
}

/**
 * Input for updating an existing task.
 * All fields optional (partial update).
 * Corresponds to backend UpdateTaskRequest Pydantic model.
 */
export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: "COMPLETE" | "INCOMPLETE";
  priority?: "LOW" | "MEDIUM" | "HIGH";
  due_date?: string | null;
  tags?: string[];
  recurrence?: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
}

/**
 * Tag entity matching backend SQLModel.
 */
export interface Tag {
  id: number;
  user_id: string;
  name: string;
  created_at: string;  // ISO 8601 datetime string
}

/**
 * Input for creating a new tag.
 */
export interface CreateTagInput {
  name: string;
}

/**
 * API error response.
 */
export interface ApiError {
  detail: string | ValidationError[];
}

/**
 * Pydantic validation error (422 response).
 */
export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}
```

---

## 2. API Client Implementation

### Base Fetch Wrapper

**File**: `frontend/lib/api.ts`

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FetchOptions extends RequestInit {
  headers?: HeadersInit;
}

/**
 * Fetch wrapper with automatic JWT token attachment and error handling.
 *
 * Features:
 * - Auto-attaches JWT token from localStorage
 * - Handles 401 (redirect to login)
 * - Handles 403 (show error toast)
 * - Handles network errors (show retry option)
 * - Type-safe request/response
 */
async function fetchWithAuth<T>(url: string, options: FetchOptions = {}): Promise<T> {
  // Step 1: Get JWT token from localStorage
  const token = localStorage.getItem("auth_token");

  // Step 2: Attach Authorization header
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { "Authorization": `Bearer ${token}` }),
      ...options.headers,
    },
  });

  // Step 3: Handle error responses
  if (!response.ok) {
    // 401 Unauthorized: Token missing, expired, or invalid
    if (response.status === 401) {
      localStorage.removeItem("auth_token");
      window.location.href = "/login?error=session_expired";
      throw new Error("Session expired. Please login again.");
    }

    // 403 Forbidden: Valid token but accessing another user's data
    if (response.status === 403) {
      throw new Error("Access denied. You can only access your own data.");
    }

    // 404 Not Found
    if (response.status === 404) {
      throw new Error("Resource not found.");
    }

    // 422 Unprocessable Entity: Validation error
    if (response.status === 422) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Validation error.");
    }

    // Network or server errors
    throw new Error(`API error: ${response.statusText}`);
  }

  // Step 4: Parse and return JSON response
  // Handle 204 No Content (DELETE responses)
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
```

### API Methods

```typescript
/**
 * Type-safe API client with all backend endpoints.
 * Usage: import { api } from '@/lib/api'
 */
export const api = {
  // Task endpoints
  getTasks: async (userId: string, params?: {
    status?: "COMPLETE" | "INCOMPLETE";
    priority?: "LOW" | "MEDIUM" | "HIGH";
    tags?: string;
    search?: string;
    sort?: "due_date" | "priority" | "title" | "created_at";
    order?: "asc" | "desc";
    offset?: number;
    limit?: number;
  }): Promise<Task[]> => {
    const queryParams = new URLSearchParams(
      params as Record<string, string>
    ).toString();
    const url = `/api/${userId}/tasks${queryParams ? `?${queryParams}` : ""}`;
    return fetchWithAuth<Task[]>(url);
  },

  getTask: async (userId: string, taskId: number): Promise<Task> => {
    return fetchWithAuth<Task>(`/api/${userId}/tasks/${taskId}`);
  },

  createTask: async (userId: string, data: CreateTaskInput): Promise<Task> => {
    return fetchWithAuth<Task>(`/api/${userId}/tasks`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateTask: async (
    userId: string,
    taskId: number,
    data: UpdateTaskInput
  ): Promise<Task> => {
    return fetchWithAuth<Task>(`/api/${userId}/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteTask: async (userId: string, taskId: number): Promise<void> => {
    return fetchWithAuth<void>(`/api/${userId}/tasks/${taskId}`, {
      method: "DELETE",
    });
  },

  toggleTaskStatus: async (
    userId: string,
    taskId: number,
    status: "COMPLETE" | "INCOMPLETE"
  ): Promise<Task> => {
    return fetchWithAuth<Task>(`/api/${userId}/tasks/${taskId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  // Tag endpoints
  getTags: async (userId: string): Promise<Tag[]> => {
    return fetchWithAuth<Tag[]>(`/api/${userId}/tags`);
  },

  createTag: async (userId: string, data: CreateTagInput): Promise<Tag> => {
    return fetchWithAuth<Tag>(`/api/${userId}/tags`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  deleteTag: async (userId: string, tagId: number): Promise<void> => {
    return fetchWithAuth<void>(`/api/${userId}/tags/${tagId}`, {
      method: "DELETE",
    });
  },
};
```

---

## 3. Environment Variables

### Backend (.env)

**File**: `backend/.env`

```bash
# CRITICAL: Must match frontend BETTER_AUTH_SECRET
BETTER_AUTH_SECRET=your-32-character-secret-here-abc123xyz

# PostgreSQL connection string (Neon or local)
DATABASE_URL=postgresql://user:password@host:port/database

# API server configuration
HOST=0.0.0.0
PORT=8000

# CORS allowed origin (frontend URL)
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)

**File**: `frontend/.env.local`

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# CRITICAL: Must match backend BETTER_AUTH_SECRET
BETTER_AUTH_SECRET=your-32-character-secret-here-abc123xyz

# Better Auth configuration
BETTER_AUTH_URL=http://localhost:3000/api/auth
```

### Environment Validation

**Backend** (Pydantic Settings):
```python
# backend/src/api/config.py
from pydantic_settings import BaseSettings
from pydantic import validator

class Settings(BaseSettings):
    better_auth_secret: str
    database_url: str
    host: str = "0.0.0.0"
    port: int = 8000
    frontend_url: str = "http://localhost:3000"

    @validator('better_auth_secret')
    def validate_secret_length(cls, v):
        if len(v) < 32:
            raise ValueError(
                f'BETTER_AUTH_SECRET must be at least 32 characters. '
                f'Current length: {len(v)}'
            )
        return v

    @validator('database_url')
    def validate_database_url(cls, v):
        if not v.startswith('postgresql://'):
            raise ValueError('DATABASE_URL must be a PostgreSQL connection string')
        return v

    class Config:
        env_file = '.env'

settings = Settings()  # Raises error on startup if invalid
```

**Frontend** (TypeScript):
```typescript
// frontend/lib/env.ts
function validateEnv() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'BETTER_AUTH_SECRET must be at least 32 characters. ' +
      'Add it to .env.local file.'
    );
  }
}

validateEnv(); // Run on module load

export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  authSecret: process.env.BETTER_AUTH_SECRET!,
};
```

---

## 4. Error Handling Patterns

### Component-Level Error Handling

```typescript
"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Task } from "@/types/api";

export function TaskList() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getTasks(user.id);
      setTasks(data);
    } catch (err) {
      // fetchWithAuth already handled 401 (redirect to login)
      // Show user-friendly error message
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="text-red-600">
        <p>{error}</p>
        <button onClick={fetchTasks}>Retry</button>
      </div>
    );
  }

  // Render tasks...
}
```

### Toast Notifications for Errors

```typescript
// components/Toast.tsx
"use client";

import { useEffect, useState } from "react";

export interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  duration?: number;
}

export function useToast() {
  const [toast, setToast] = useState<ToastProps | null>(null);

  const showToast = (props: ToastProps) => {
    setToast(props);
    setTimeout(() => setToast(null), props.duration || 3000);
  };

  return { toast, showToast };
}

// Usage in component
const { toast, showToast } = useToast();

try {
  await api.deleteTask(userId, taskId);
  showToast({ message: "Task deleted successfully", type: "success" });
} catch (err) {
  showToast({
    message: err instanceof Error ? err.message : "Failed to delete task",
    type: "error",
  });
}
```

---

## 5. Development Workflow

### Running Both Services Locally

**Terminal 1 - Backend**:
```bash
cd backend
pip install -r requirements.txt
export BETTER_AUTH_SECRET="your-32-char-secret"
export DATABASE_URL="postgresql://user:password@localhost:5432/todo_db"
uvicorn src.api.main:app --reload --port 8000
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
echo "BETTER_AUTH_SECRET=your-32-char-secret" >> .env.local
npm run dev
```

**Access**:
- Backend API: http://localhost:8000
- Backend Docs: http://localhost:8000/docs (FastAPI auto-generated)
- Frontend: http://localhost:3000

---

## 6. Integration Testing

### API Contract Validation

Use the `api_contract_validator` agent to verify frontend-backend alignment:

```bash
# After implementing both frontend and backend
Create the api_contract_validator agent and run it to check frontend/backend alignment
```

**Checks Performed**:
- Endpoint paths match spec exactly (`/api/{user_id}/tasks`)
- Request payload types align (TypeScript ↔ Pydantic)
- Response payload types align
- Frontend handles all error codes (401, 403, 404, 422, 500)
- `Authorization: Bearer <token>` header included in all protected requests
- TypeScript interfaces match Pydantic models (Task, Tag)

### Integration Test Example

```typescript
// frontend/__tests__/integration/api.test.ts
import { api } from "@/lib/api";

describe("API Integration Tests", () => {
  const testUserId = "test_user_123";

  beforeEach(() => {
    // Mock JWT token
    localStorage.setItem("auth_token", "mock-token");
  });

  it("fetches tasks with correct Authorization header", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    await api.getTasks(testUserId);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          "Authorization": "Bearer mock-token",
        }),
      })
    );
  });

  it("redirects to login on 401 Unauthorized", async () => {
    delete window.location;
    window.location = { href: "" } as any;

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
    });

    await expect(api.getTasks(testUserId)).rejects.toThrow();
    expect(window.location.href).toContain("/login");
  });
});
```

---

## 7. Deployment Configuration

### Docker Compose (Development)

**File**: `docker-compose.yml` (repository root)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: todo_user
      POSTGRES_PASSWORD: todo_password
      POSTGRES_DB: todo_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://todo_user:todo_password@postgres:5432/todo_db
      BETTER_AUTH_SECRET: your-32-char-secret-here
      FRONTEND_URL: http://localhost:3000
    ports:
      - "8000:8000"
    depends_on:
      - postgres
    volumes:
      - ./backend:/app

  frontend:
    build: ./frontend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000
      BETTER_AUTH_SECRET: your-32-char-secret-here
    ports:
      - "3000:3000"
    depends_on:
      - backend
    volumes:
      - ./frontend:/app

volumes:
  postgres_data:
```

**Usage**:
```bash
docker-compose up --build
```

---

## Next Steps

1. ✅ Integration Contract Complete: TypeScript types, API client, environment config
2. ⏭️ Frontend Implementation: Implement `frontend/lib/api.ts` using `api_client_generator` skill
3. ⏭️ Backend Implementation: Implement `backend/src/api/auth.py` using `jwt_middleware_generator` skill
4. ⏭️ Contract Validation: Run `api_contract_validator` agent
5. ⏭️ Integration Testing: Write tests for all API methods

---

**Integration Contract Complete**: All frontend-backend integration patterns documented. Ready for implementation.
