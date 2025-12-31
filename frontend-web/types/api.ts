/**
 * TypeScript type definitions for API entities.
 * MUST align with backend Pydantic models in backend/src/api/models.py
 */

/**
 * Task entity matching backend SQLModel.
 */
export interface Task {
  id: number
  user_id: string
  title: string
  description: string | null
  status: 'INCOMPLETE' | 'COMPLETE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  due_date: string | null // ISO 8601 datetime string
  tags: string[] // Array of tag names
  recurrence: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  last_completed_at: string | null // ISO 8601 datetime string
  created_at: string // ISO 8601 datetime string
  updated_at: string // ISO 8601 datetime string
}

/**
 * Input for creating a new task.
 * Corresponds to backend CreateTaskRequest Pydantic model.
 */
export interface CreateTaskInput {
  title: string // Required, 1-200 characters
  description?: string // Optional, max 2000 characters
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' // Default: MEDIUM
  due_date?: string // ISO 8601 datetime string
  tags?: string[] // Array of tag names
  recurrence?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' // Default: NONE
}

/**
 * Input for updating an existing task.
 * All fields optional (partial update).
 */
export interface UpdateTaskInput {
  title?: string
  description?: string | null
  status?: 'INCOMPLETE' | 'COMPLETE'
  priority?: 'LOW' | 'MEDIUM' | 'HIGH'
  due_date?: string | null
  tags?: string[]
  recurrence?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
}

/**
 * Tag entity matching backend SQLModel.
 */
export interface Tag {
  id: number
  user_id: string
  name: string
  created_at: string // ISO 8601 datetime string
}

/**
 * Input for creating a new tag.
 */
export interface CreateTagInput {
  name: string // Required, 1-50 characters
}

/**
 * API error response structure.
 */
export interface ApiError {
  detail: string | ValidationError[]
}

/**
 * Pydantic validation error (422 response).
 */
export interface ValidationError {
  loc: (string | number)[]
  msg: string
  type: string
}

/**
 * Health check response.
 */
export interface HealthCheckResponse {
  status: string
  timestamp: string
}
