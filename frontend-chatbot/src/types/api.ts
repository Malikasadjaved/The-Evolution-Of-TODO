/**
 * API Type Definitions - Phase 3 AI Chatbot Frontend
 *
 * This module provides comprehensive TypeScript types for all API interactions
 * between the frontend and FastAPI backend. These types ensure type safety and
 * align with the backend Pydantic models.
 *
 * Constitution: .specify/memory/phase-3-constitution.md (v1.1.0)
 * Spec: specs/002-ai-chatbot-mcp/spec.md Section 8.4 (TypeScript Types)
 *
 * Type Alignment:
 * - Frontend TypeScript interfaces ↔ Backend Pydantic models
 * - Ensures compile-time type safety for API requests/responses
 * - Prevents runtime errors due to mismatched data structures
 *
 * Usage:
 * ```typescript
 * import type { ChatRequest, ChatResponse, Message } from '@/types/api';
 *
 * const request: ChatRequest = {
 *   message: "Add a task to buy groceries",
 *   conversation_id: 42
 * };
 * ```
 */

// ============================================================================
// Enums
// ============================================================================

/**
 * Message role in conversation
 * - USER: Message sent by the user
 * - ASSISTANT: Message sent by the AI assistant
 * - SYSTEM: System message (future use for context/instructions)
 */
export enum MessageRole {
  USER = "user",
  ASSISTANT = "assistant",
  SYSTEM = "system",
}

/**
 * Task priority levels
 * Aligns with backend TaskPriority enum
 */
export enum TaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

/**
 * Task status
 * Aligns with backend TaskStatus enum
 */
export enum TaskStatus {
  INCOMPLETE = "INCOMPLETE",
  COMPLETE = "COMPLETE",
}

/**
 * MCP Tool names
 * Corresponds to the 5 MCP tools available to the OpenAI Agent
 */
export enum ToolName {
  ADD_TASK = "add_task",
  LIST_TASKS = "list_tasks",
  COMPLETE_TASK = "complete_task",
  UPDATE_TASK = "update_task",
  DELETE_TASK = "delete_task",
}

// ============================================================================
// Message Types
// ============================================================================

/**
 * Message in conversation history
 *
 * Represents a single message (user or assistant) in a conversation.
 * Used for displaying chat history in the UI.
 *
 * @property id - Unique message identifier (client-side generated or from DB)
 * @property role - Message sender (user or assistant)
 * @property content - Message text content
 * @property timestamp - When the message was created
 * @property conversation_id - Optional: ID of the conversation this message belongs to
 */
export interface Message {
  id: string;
  role: MessageRole | "user" | "assistant"; // Allow string literals for flexibility
  content: string;
  timestamp: Date;
  conversation_id?: number;
}

/**
 * Message create request (stored in database)
 *
 * Backend model: src.api.models.Message
 */
export interface MessageCreate {
  conversation_id: number;
  user_id: string;
  role: MessageRole;
  content: string;
}

// ============================================================================
// Chat Request/Response Types
// ============================================================================

/**
 * Chat request payload
 *
 * Sent to POST /api/{user_id}/chat
 *
 * @property message - User's natural language message (1-10000 characters)
 * @property conversation_id - Optional: Continue existing conversation
 *
 * Backend model: src.api.routes.chat.ChatRequest
 */
export interface ChatRequest {
  message: string;
  conversation_id?: number;
}

/**
 * Chat response payload
 *
 * Received from POST /api/{user_id}/chat
 *
 * @property message - AI assistant's response message
 * @property conversation_id - Conversation ID (created or existing)
 *
 * Backend model: src.api.routes.chat.ChatResponse
 */
export interface ChatResponse {
  message: string;
  conversation_id: number;
}

// ============================================================================
// Conversation Types
// ============================================================================

/**
 * Conversation metadata
 *
 * Represents a conversation thread between user and assistant.
 *
 * @property id - Unique conversation identifier
 * @property user_id - User who owns this conversation
 * @property created_at - When conversation started
 * @property updated_at - When conversation was last updated
 *
 * Backend model: src.api.models.Conversation
 */
export interface Conversation {
  id: number;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// Task Types (for MCP tool responses)
// ============================================================================

/**
 * Task model (returned by MCP tools)
 *
 * Represents a todo task. Returned by list_tasks, add_task, update_task.
 *
 * @property id - Unique task identifier
 * @property title - Task title (1-500 characters)
 * @property description - Optional task description (max 2000 characters)
 * @property priority - Task priority level
 * @property status - Task completion status
 * @property due_date - Optional due date (ISO 8601 string)
 * @property tags - List of tag names associated with task
 * @property created_at - When task was created
 * @property updated_at - When task was last modified
 * @property completed_at - When task was marked complete (if applicable)
 *
 * Backend model: src.api.models.Task + mcp.schemas.*TaskOutput
 */
export interface Task {
  id: number;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date?: string | null; // ISO 8601 format
  tags: string[];
  created_at: string; // ISO 8601 format
  updated_at: string; // ISO 8601 format
  completed_at?: string | null; // ISO 8601 format
}

// ============================================================================
// MCP Tool Call Types
// ============================================================================

/**
 * Tool call executed by OpenAI Agent
 *
 * Represents a function call made by the AI agent to one of the 5 MCP tools.
 * Used for debugging and tool execution tracking.
 *
 * @property name - Name of the MCP tool being called
 * @property arguments - Arguments passed to the tool (JSON object)
 * @property result - Result returned by the tool (if available)
 */
export interface ToolCall {
  name: ToolName | string;
  arguments: Record<string, unknown>;
  result?: unknown;
}

/**
 * Add task tool input
 *
 * Backend model: mcp.schemas.AddTaskInput
 */
export interface AddTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  due_date?: string; // ISO 8601 format
  tags?: string[];
}

/**
 * List tasks tool input
 *
 * Backend model: mcp.schemas.ListTasksInput
 */
export interface ListTasksInput {
  status?: TaskStatus;
  priority?: TaskPriority;
  tag?: string;
  search?: string;
}

/**
 * Update task tool input
 *
 * Backend model: mcp.schemas.UpdateTaskInput
 */
export interface UpdateTaskInput {
  task_id: number;
  title?: string;
  description?: string;
  priority?: TaskPriority;
  due_date?: string | null; // ISO 8601 format or null to clear
  tags?: string[];
}

/**
 * Complete task tool input
 *
 * Backend model: mcp.schemas.CompleteTaskInput
 */
export interface CompleteTaskInput {
  task_id: number;
}

/**
 * Delete task tool input
 *
 * Backend model: mcp.schemas.DeleteTaskInput
 */
export interface DeleteTaskInput {
  task_id: number;
}

// ============================================================================
// Error Response Types
// ============================================================================

/**
 * Generic error response from backend
 *
 * Returned by FastAPI when an HTTP error occurs.
 *
 * @property detail - Error message (string or structured object)
 */
export interface ErrorResponse {
  detail: string | ErrorDetail;
}

/**
 * Structured error detail
 *
 * Used for 500 errors with additional context.
 *
 * @property error - Error message
 * @property message - Optional additional context
 */
export interface ErrorDetail {
  error: string;
  message?: string;
}

/**
 * Validation error response (422 Unprocessable Entity)
 *
 * Returned by FastAPI when request validation fails.
 *
 * @property detail - Array of validation errors
 */
export interface ValidationErrorResponse {
  detail: ValidationError[];
}

/**
 * Individual validation error
 *
 * @property loc - Location of the error (e.g., ["body", "message"])
 * @property msg - Error message
 * @property type - Error type (e.g., "value_error.missing")
 */
export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

// ============================================================================
// API Client Configuration Types
// ============================================================================

/**
 * API client configuration options
 *
 * @property baseURL - Base URL for API requests (e.g., http://localhost:8000)
 * @property timeout - Request timeout in milliseconds
 * @property retries - Number of retry attempts for failed requests
 */
export interface APIConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
}

/**
 * JWT token payload (decoded)
 *
 * Standard JWT claims + custom claims from Better Auth
 *
 * @property sub - Subject (user ID)
 * @property user_id - User identifier (Better Auth)
 * @property email - User email
 * @property exp - Expiration timestamp (Unix epoch)
 * @property iat - Issued at timestamp (Unix epoch)
 */
export interface JWTPayload {
  sub?: string;
  user_id?: string;
  email?: string;
  exp: number;
  iat: number;
}

// ============================================================================
// UI State Types
// ============================================================================

/**
 * Chat interface state
 *
 * Used for managing ChatInterface component state.
 *
 * @property messages - Array of conversation messages
 * @property isLoading - Whether a request is in progress
 * @property error - Current error message (if any)
 * @property conversationId - Active conversation ID
 */
export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  conversationId: number | null;
}

/**
 * User authentication state
 *
 * @property isAuthenticated - Whether user is logged in
 * @property userId - User identifier (from JWT)
 * @property token - JWT token
 */
export interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  token: string | null;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard: Check if value is a valid MessageRole
 */
export function isMessageRole(value: unknown): value is MessageRole {
  return (
    typeof value === "string" &&
    (value === "user" || value === "assistant" || value === "system")
  );
}

/**
 * Type guard: Check if error response has structured detail
 */
export function isStructuredErrorDetail(
  detail: unknown
): detail is ErrorDetail {
  return (
    typeof detail === "object" &&
    detail !== null &&
    "error" in detail &&
    typeof (detail as ErrorDetail).error === "string"
  );
}

/**
 * Type guard: Check if response is a validation error
 */
export function isValidationErrorResponse(
  response: unknown
): response is ValidationErrorResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "detail" in response &&
    Array.isArray((response as ValidationErrorResponse).detail)
  );
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Make all properties of T optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Extract keys of T where value type is V
 */
export type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

/**
 * Make specific keys K of T required
 */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;
