# REST API Endpoints

## Base URL
- Development: `http://localhost:8000`
- Production: TBD

## Authentication
All endpoints require JWT token:
Authorization: Bearer

## Endpoints

### GET /api/{user_id}/tasks
List all tasks for authenticated user.

**Query Parameters:**
- `status`: "all" | "pending" | "completed"
- `priority`: "HIGH" | "MEDIUM" | "LOW"
- `sort`: "created" | "title" | "due_date"

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "user_id": "user_123",
    "title": "Complete project",
    "description": "Finish hackathon project",
    "priority": "HIGH",
    "tags": ["work", "urgent"],
    "due_date": "2025-12-15T10:00:00Z",
    "completed": false,
    "created_at": "2025-12-10T08:00:00Z",
    "updated_at": "2025-12-10T08:00:00Z"
  }
]

POST /api/{user_id}/tasks

Create a new task.

Request Body:
{
  "title": "New task",
  "description": "Task description",
  "priority": "MEDIUM",
  "tags": ["personal"],
  "due_date": "2025-12-20T15:00:00Z"
}

Response: 201 Created

GET /api/{user_id}/tasks/{id}

Get single task details.

Response: 200 OK or 404 Not Found

PUT /api/{user_id}/tasks/{id}

Update task.

Response: 200 OK or 404 Not Found

DELETE /api/{user_id}/tasks/{id}

Delete task.

Response: 204 No Content or 404 Not Found

PATCH /api/{user_id}/tasks/{id}/complete

Toggle task completion status.

Response: 200 OK
