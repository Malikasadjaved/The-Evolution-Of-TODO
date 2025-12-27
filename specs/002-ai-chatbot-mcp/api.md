# API Reference: Phase 3 AI Chatbot with MCP Architecture

**Version**: 3.0.0
**Base URL**: `http://localhost:8000` (development) | `https://your-domain.com` (production)
**Protocol**: HTTP/1.1, HTTPS
**Content-Type**: `application/json`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Endpoints](#endpoints)
   - [POST /api/{user_id}/chat](#post-apiuser_idchat)
   - [GET /health](#get-health)
   - [GET /ready](#get-ready)
4. [Schemas](#schemas)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Examples](#examples)
8. [Interactive Documentation](#interactive-documentation)

---

## Overview

The Phase 3 API provides a conversational interface for task management powered by OpenAI Agents and Model Context Protocol (MCP) tools.

**Key Features**:
- Natural language task management (add, list, update, complete, delete)
- Stateless architecture (all state persisted in PostgreSQL)
- JWT-based authentication (shared with Phase 2 web UI)
- User isolation (strict authorization checks)
- Cloud-native health probes (Kubernetes-compatible)
- Resilient error handling (circuit breaker pattern)

**Architecture**:
```
Frontend (Port 3001) → FastAPI (Port 8000) → OpenAI Agents SDK → MCP Tools → PostgreSQL (Neon)
                                ↓
                         Conversation History (DB)
```

---

## Authentication

All protected endpoints require **JWT Bearer token** authentication.

### How It Works

1. **User signs up/logs in** via Better Auth (Phase 2)
2. **Better Auth issues JWT token** (HS256 algorithm, 1-hour expiration)
3. **Frontend stores token** in browser localStorage
4. **Frontend attaches token** to all API requests in `Authorization` header
5. **Backend verifies token** using `BETTER_AUTH_SECRET` from `.env`

### JWT Token Structure

```json
{
  "user_id": "user_abc123",
  "email": "user@example.com",
  "exp": 1735324800,  // Expiration timestamp (Unix)
  "iat": 1735321200   // Issued at timestamp (Unix)
}
```

### Authorization Header Format

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important**:
- Token must start with `Bearer ` (note the space)
- Token signature is verified using `BETTER_AUTH_SECRET`
- Expired tokens return `401 Unauthorized`
- Token `user_id` must match URL `{user_id}` parameter (or `403 Forbidden`)

### Getting a Token (Phase 2 Better Auth)

```bash
# Sign up
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "name": "John Doe"
  }'

# Response includes JWT token
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_abc123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

---

## Endpoints

### POST /api/{user_id}/chat

**Send a message to the AI chatbot and get a response.**

#### Description

This is the main conversational endpoint for natural language task management. The AI agent:
1. Understands user intent from natural language
2. Calls appropriate MCP tools (`add_task`, `list_tasks`, `update_task`, `complete_task`, `delete_task`)
3. Persists conversation history in PostgreSQL
4. Returns natural language response

**Stateless Architecture**: Each request loads full conversation history from the database, enabling server restarts without losing context.

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | string | Yes | User identifier (must match JWT token `user_id`) |

#### Request Headers

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer <jwt_token>` | Yes |
| `Content-Type` | `application/json` | Yes |

#### Request Body

```json
{
  "message": "Add a task to buy groceries",
  "conversation_id": 42  // Optional - omit for new conversation
}
```

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `message` | string | Yes | 1-10000 characters | User's natural language message |
| `conversation_id` | integer | No | Must be valid conversation ID | Continue existing conversation (omit to start new) |

#### Response (200 OK)

```json
{
  "message": "I've created a task to buy groceries for you.",
  "conversation_id": 42
}
```

| Field | Type | Description |
|-------|------|-------------|
| `message` | string | AI assistant's natural language response |
| `conversation_id` | integer | Conversation ID (new or existing) |

#### Errors

| Status Code | Error | Description | Example Response |
|-------------|-------|-------------|------------------|
| **401 Unauthorized** | Missing/invalid JWT token | Token not provided, expired, or invalid signature | `{"detail": "Token has expired. Please login again."}` |
| **403 Forbidden** | Authorization failure | Token `user_id` doesn't match URL `user_id` | `{"detail": "Access denied: You can only access your own conversations"}` |
| **404 Not Found** | Conversation not found | Invalid `conversation_id` provided | `{"detail": "Conversation not found: 999"}` |
| **422 Unprocessable Entity** | Validation error | Invalid request body (e.g., `message` too long) | `{"detail": [{"loc": ["body", "message"], "msg": "ensure this value has at most 10000 characters"}]}` |
| **500 Internal Server Error** | OpenAI API error | Agent call failed (rate limit, timeout, etc.) | `{"error": "Chat service temporarily unavailable", "message": "Our AI assistant is currently unavailable. Please try again later or use the web interface."}` |

#### Example Request (curl)

**Start New Conversation**:
```bash
curl -X POST http://localhost:8000/api/user_abc123/chat \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Add a task to buy groceries"
  }'
```

**Continue Existing Conversation**:
```bash
curl -X POST http://localhost:8000/api/user_abc123/chat \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Mark the groceries task as complete",
    "conversation_id": 42
  }'
```

#### Example Response

```json
{
  "message": "I've marked 'Buy groceries' as complete. Great job!",
  "conversation_id": 42
}
```

#### Behavior Details

**New Conversation** (no `conversation_id`):
1. Creates new `Conversation` record in database
2. Stores user message as `Message` (role: USER)
3. Calls OpenAI Agent with empty conversation history
4. Stores assistant response as `Message` (role: ASSISTANT)
5. Returns assistant message + new conversation ID

**Continue Conversation** (with `conversation_id`):
1. Loads existing `Conversation` from database
2. Verifies conversation belongs to authenticated user (403 if not)
3. Loads all messages from conversation (chronological order)
4. Stores user message
5. Calls OpenAI Agent with full conversation history
6. Stores assistant response
7. Returns assistant message + same conversation ID

**Conversation Persistence**:
- All messages stored in PostgreSQL `message` table
- Conversation history loaded on every request (stateless)
- Agent resolves contextual references ("it", "the first one", etc.) using history
- Server restarts don't lose conversation state

---

### GET /health

**Liveness probe - verify server is running.**

#### Description

Fast health check endpoint for Kubernetes liveness probes. Returns immediately without checking external dependencies (database, OpenAI API).

**Use Case**: Kubernetes restarts container if this endpoint fails.

**Response Time**: < 500ms

#### Authentication

❌ **No authentication required** (public endpoint)

#### Response (200 OK)

```json
{
  "status": "healthy",
  "timestamp": "2025-12-26T18:30:00.000000"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Always `"healthy"` if server responds |
| `timestamp` | string | Current UTC timestamp (ISO 8601 format) |

#### Example Request (curl)

```bash
curl http://localhost:8000/health
```

#### Example Response

```json
{
  "status": "healthy",
  "timestamp": "2025-12-26T18:30:00.123456"
}
```

#### Kubernetes Configuration

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 10
  periodSeconds: 30
  timeoutSeconds: 5
  failureThreshold: 3
```

---

### GET /ready

**Readiness probe - verify server can accept traffic.**

#### Description

Readiness check endpoint for Kubernetes readiness probes. Verifies:
1. ✅ **Database connectivity** (REQUIRED) - PostgreSQL connection test
2. ⚠️ **OpenAI API connectivity** (OPTIONAL) - Currently skipped (logged as warning)

**Use Case**: Kubernetes routes traffic only if this endpoint returns 200.

**Response Time**: < 2 seconds

#### Authentication

❌ **No authentication required** (public endpoint)

#### Response (200 OK - Ready)

```json
{
  "status": "ready",
  "checks": {
    "database": "ok",
    "openai": "skipped"
  },
  "timestamp": "2025-12-26T18:30:00.000000"
}
```

#### Response (503 Service Unavailable - Not Ready)

```json
{
  "status": "not_ready",
  "checks": {
    "database": "failed",
    "openai": "not_checked"
  },
  "error": "Database connection failed",
  "timestamp": "2025-12-26T18:30:00.000000"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `"ready"` or `"not_ready"` |
| `checks.database` | string | `"ok"`, `"failed"`, or `"unknown"` |
| `checks.openai` | string | `"ok"`, `"skipped"`, or `"not_checked"` |
| `error` | string | Error message (only present if not ready) |
| `timestamp` | string | Current UTC timestamp (ISO 8601 format) |

#### Example Request (curl)

```bash
curl http://localhost:8000/ready
```

#### Example Responses

**Success (Database OK)**:
```json
{
  "status": "ready",
  "checks": {
    "database": "ok",
    "openai": "skipped"
  },
  "timestamp": "2025-12-26T18:30:00.123456"
}
```

**Failure (Database Down)**:
```json
{
  "status": "not_ready",
  "checks": {
    "database": "failed",
    "openai": "not_checked"
  },
  "error": "Database connection failed",
  "timestamp": "2025-12-26T18:30:00.123456"
}
```

#### Kubernetes Configuration

```yaml
readinessProbe:
  httpGet:
    path: /ready
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 10
  timeoutSeconds: 2
  successThreshold: 1
  failureThreshold: 3
```

---

## Schemas

### ChatRequest

Request body for `POST /api/{user_id}/chat`.

```json
{
  "message": "string (1-10000 characters, required)",
  "conversation_id": "integer (optional)"
}
```

**TypeScript Type**:
```typescript
interface ChatRequest {
  message: string;           // Required: User's message (1-10000 chars)
  conversation_id?: number;  // Optional: Continue existing conversation
}
```

**Python Type (Pydantic)**:
```python
from pydantic import BaseModel, Field
from typing import Optional

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=10000)
    conversation_id: Optional[int] = None
```

**Validation Rules**:
- `message`: Required, 1-10000 characters (422 if violated)
- `conversation_id`: Optional, must be valid integer (422 if invalid format)

### ChatResponse

Response body for `POST /api/{user_id}/chat`.

```json
{
  "message": "string (required)",
  "conversation_id": "integer (required)"
}
```

**TypeScript Type**:
```typescript
interface ChatResponse {
  message: string;          // Required: AI assistant's response
  conversation_id: number;  // Required: Conversation ID (new or existing)
}
```

**Python Type (Pydantic)**:
```python
class ChatResponse(BaseModel):
    message: str = Field(..., description="Assistant's response")
    conversation_id: int = Field(..., description="Conversation ID")
```

### HealthResponse

Response body for `GET /health`.

```json
{
  "status": "healthy",
  "timestamp": "2025-12-26T18:30:00.000000"
}
```

**TypeScript Type**:
```typescript
interface HealthResponse {
  status: "healthy";
  timestamp: string;  // ISO 8601 format
}
```

### ReadinessResponse

Response body for `GET /ready`.

```json
{
  "status": "ready" | "not_ready",
  "checks": {
    "database": "ok" | "failed" | "unknown",
    "openai": "ok" | "skipped" | "not_checked"
  },
  "error": "string (optional)",
  "timestamp": "2025-12-26T18:30:00.000000"
}
```

**TypeScript Type**:
```typescript
interface ReadinessResponse {
  status: "ready" | "not_ready";
  checks: {
    database: "ok" | "failed" | "unknown";
    openai: "ok" | "skipped" | "not_checked";
  };
  error?: string;  // Present only when status is "not_ready"
  timestamp: string;  // ISO 8601 format
}
```

---

## Error Handling

### Error Response Format

All errors follow FastAPI's standard error format:

```json
{
  "detail": "Error message here"
}
```

**For validation errors (422)**:
```json
{
  "detail": [
    {
      "loc": ["body", "message"],
      "msg": "ensure this value has at most 10000 characters",
      "type": "value_error.any_str.max_length"
    }
  ]
}
```

### HTTP Status Codes

| Code | Name | When It Occurs | Client Action |
|------|------|----------------|---------------|
| **200** | OK | Request successful | Continue normal flow |
| **401** | Unauthorized | Missing/invalid/expired JWT token | Redirect to login, request new token |
| **403** | Forbidden | Token user_id ≠ URL user_id | Show error, verify user accessing own data |
| **404** | Not Found | Conversation ID doesn't exist | Create new conversation (omit conversation_id) |
| **422** | Unprocessable Entity | Invalid request body | Fix validation errors, retry |
| **500** | Internal Server Error | OpenAI API error, database error | Retry with exponential backoff, show fallback UI |
| **503** | Service Unavailable | Readiness check failed (database down) | Wait and retry, show maintenance message |

### Error Scenarios

#### 1. Missing JWT Token (401)

```bash
curl -X POST http://localhost:8000/api/user_abc123/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

# Response: 401 Unauthorized
{
  "detail": "Missing authentication token"
}
```

#### 2. Expired JWT Token (401)

```bash
curl -X POST http://localhost:8000/api/user_abc123/chat \
  -H "Authorization: Bearer <expired-token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

# Response: 401 Unauthorized
{
  "detail": "Token has expired. Please login again."
}
```

#### 3. Invalid Signature (401)

```bash
curl -X POST http://localhost:8000/api/user_abc123/chat \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

# Response: 401 Unauthorized
{
  "detail": "Invalid authentication token"
}
```

#### 4. User Isolation Violation (403)

```bash
# Token is for user_xyz789, but trying to access user_abc123's chat
curl -X POST http://localhost:8000/api/user_abc123/chat \
  -H "Authorization: Bearer <token-for-user_xyz789>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

# Response: 403 Forbidden
{
  "detail": "Access denied: You can only access your own conversations"
}
```

#### 5. Conversation Not Found (404)

```bash
curl -X POST http://localhost:8000/api/user_abc123/chat \
  -H "Authorization: Bearer <valid-token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "conversation_id": 999999}'

# Response: 404 Not Found
{
  "detail": "Conversation not found: 999999"
}
```

#### 6. Message Too Long (422)

```bash
curl -X POST http://localhost:8000/api/user_abc123/chat \
  -H "Authorization: Bearer <valid-token>" \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"$(python -c 'print(\"a\" * 10001)')\"}"

# Response: 422 Unprocessable Entity
{
  "detail": [
    {
      "loc": ["body", "message"],
      "msg": "ensure this value has at most 10000 characters",
      "type": "value_error.any_str.max_length"
    }
  ]
}
```

#### 7. OpenAI API Error (500)

```bash
# Occurs when OpenAI API is down, rate limited, or times out
curl -X POST http://localhost:8000/api/user_abc123/chat \
  -H "Authorization: Bearer <valid-token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

# Response: 500 Internal Server Error
{
  "error": "Chat service temporarily unavailable",
  "message": "Our AI assistant is currently unavailable. Please try again later or use the web interface."
}
```

**Client Handling**:
- Retry with exponential backoff (5s, 10s, 20s)
- Show fallback UI (redirect to Phase 2 web interface)
- Circuit breaker prevents cascading failures (opens after 5 consecutive failures)

---

## Rate Limiting

### Current Implementation

**Phase 3 does NOT enforce rate limits** at the application level.

**Natural Rate Limiting**:
- OpenAI API has built-in rate limits (varies by tier)
- Circuit breaker pattern prevents abuse (opens after 5 consecutive failures)
- Cost-based limiting (users responsible for OpenAI API costs)

### OpenAI API Rate Limits (Typical)

| Tier | Requests/min | Tokens/min |
|------|--------------|------------|
| Free | 3 | 40,000 |
| Pay-as-you-go | 60 | 200,000 |
| Enterprise | Custom | Custom |

**When limit exceeded**: `openai.error.RateLimitError` → 500 response

### Future Implementation (Production)

Consider adding application-level rate limiting:
```python
# Example with slowapi
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/{user_id}/chat")
@limiter.limit("10/minute")  # 10 requests per minute per IP
async def chat(...):
    ...
```

---

## Examples

### Complete Conversation Flow

**1. Start Conversation - Add Task**:
```bash
curl -X POST http://localhost:8000/api/user_abc123/chat \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"message": "Add a task to buy groceries"}'

# Response:
{
  "message": "I've created a task to buy groceries for you.",
  "conversation_id": 42
}
```

**2. Continue Conversation - List Tasks**:
```bash
curl -X POST http://localhost:8000/api/user_abc123/chat \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me my tasks", "conversation_id": 42}'

# Response:
{
  "message": "You have 1 task: Buy groceries (pending).",
  "conversation_id": 42
}
```

**3. Continue Conversation - Complete Task (Context-Aware)**:
```bash
curl -X POST http://localhost:8000/api/user_abc123/chat \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"message": "Mark it as complete", "conversation_id": 42}'
# Agent resolves "it" = "Buy groceries" from conversation history

# Response:
{
  "message": "I've marked 'Buy groceries' as complete. Great job!",
  "conversation_id": 42
}
```

**4. Continue Conversation - Delete Task**:
```bash
curl -X POST http://localhost:8000/api/user_abc123/chat \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"message": "Delete the groceries task", "conversation_id": 42}'

# Response:
{
  "message": "I've deleted the task 'Buy groceries'.",
  "conversation_id": 42
}
```

### Advanced Natural Language Examples

**High Priority Task with Due Date**:
```bash
curl -X POST http://localhost:8000/api/user_abc123/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Add a high priority task: Finish hackathon project by Friday"}'

# Agent extracts: title, priority=HIGH, due_date=2025-12-29
```

**Filter Tasks by Status**:
```bash
curl -X POST http://localhost:8000/api/user_abc123/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "What are my pending tasks?"}'

# Agent calls: list_tasks(status=INCOMPLETE)
```

**Multi-Tool Chaining**:
```bash
curl -X POST http://localhost:8000/api/user_abc123/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Add a task to call Mom and show me all my tasks"}'

# Agent calls: add_task() → list_tasks()
```

### TypeScript/JavaScript Client

```typescript
interface ChatClient {
  baseUrl: string;
  token: string;
}

async function sendMessage(
  client: ChatClient,
  userId: string,
  message: string,
  conversationId?: number
): Promise<ChatResponse> {
  const response = await fetch(`${client.baseUrl}/api/${userId}/chat`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${client.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      conversation_id: conversationId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Chat request failed');
  }

  return response.json();
}

// Usage
const client = {
  baseUrl: 'http://localhost:8000',
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
};

const result = await sendMessage(
  client,
  'user_abc123',
  'Add a task to buy milk'
);

console.log(result.message);  // "I've created a task to buy milk for you."
console.log(result.conversation_id);  // 42
```

### Python Client

```python
import requests
from typing import Optional

class ChatClient:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url
        self.token = token

    def send_message(
        self,
        user_id: str,
        message: str,
        conversation_id: Optional[int] = None
    ) -> dict:
        """Send message to chatbot and get response."""
        response = requests.post(
            f"{self.base_url}/api/{user_id}/chat",
            headers={
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json",
            },
            json={
                "message": message,
                "conversation_id": conversation_id,
            },
        )
        response.raise_for_status()
        return response.json()

# Usage
client = ChatClient(
    base_url="http://localhost:8000",
    token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
)

result = client.send_message(
    user_id="user_abc123",
    message="Add a task to buy milk"
)

print(result["message"])  # "I've created a task to buy milk for you."
print(result["conversation_id"])  # 42
```

---

## Interactive Documentation

### Swagger UI (ReDoc)

FastAPI auto-generates interactive API documentation:

**Swagger UI** (interactive, test requests):
- **URL**: http://localhost:8000/docs
- **Features**: Try out API calls directly in browser, see schemas, download OpenAPI spec

**ReDoc** (clean, readable):
- **URL**: http://localhost:8000/redoc
- **Features**: Clean documentation layout, search, dark mode

**OpenAPI JSON Spec**:
- **URL**: http://localhost:8000/openapi.json
- **Use**: Import into Postman, Insomnia, or generate client SDKs

### Postman Collection

**Import OpenAPI Spec**:
1. Open Postman
2. Import → Link → `http://localhost:8000/openapi.json`
3. Configure environment variables:
   - `BASE_URL`: `http://localhost:8000`
   - `JWT_TOKEN`: `<your-token>`
   - `USER_ID`: `<your-user-id>`

---

## Best Practices

### Client Implementation

1. **Store JWT Token Securely**:
   - Browser: `localStorage` (acceptable for demo, use `httpOnly` cookies in production)
   - Mobile: Secure storage (Keychain/Keystore)
   - Server-to-server: Environment variables

2. **Handle Token Expiration**:
   ```typescript
   async function sendMessageWithRetry(message: string) {
     try {
       return await sendMessage(client, userId, message);
     } catch (error) {
       if (error.status === 401) {
         // Token expired - refresh or redirect to login
         await refreshToken();
         return await sendMessage(client, userId, message);
       }
       throw error;
     }
   }
   ```

3. **Implement Exponential Backoff**:
   ```typescript
   async function sendWithBackoff(message: string, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await sendMessage(client, userId, message);
       } catch (error) {
         if (error.status === 500 && i < maxRetries - 1) {
           const delay = Math.pow(2, i) * 1000;  // 1s, 2s, 4s
           await sleep(delay);
           continue;
         }
         throw error;
       }
     }
   }
   ```

4. **Display Loading States**:
   - Chat requests can take 2-5 seconds (OpenAI API call)
   - Show typing indicator while waiting
   - Disable input during request

5. **Persist Conversation ID**:
   ```typescript
   // Store conversation ID after first message
   const result = await sendMessage(client, userId, "Hello");
   localStorage.setItem('conversationId', result.conversation_id.toString());

   // Continue conversation
   const conversationId = parseInt(localStorage.getItem('conversationId'));
   await sendMessage(client, userId, "Show tasks", conversationId);
   ```

---

## Support & Resources

- **Interactive Docs**: http://localhost:8000/docs
- **OpenAPI Spec**: http://localhost:8000/openapi.json
- **Quickstart Guide**: `specs/002-ai-chatbot-mcp/quickstart.md`
- **MCP Tools Reference**: `specs/002-ai-chatbot-mcp/mcp-tools.md`
- **Architecture Spec**: `specs/002-ai-chatbot-mcp/spec.md`

---

**API Documentation Complete** ✅
**Last Updated**: 2025-12-26
**Version**: 3.0.0 (Phase 3: AI Chatbot with MCP Architecture)
