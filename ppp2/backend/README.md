# Todo API - Backend

FastAPI backend for the Todo application with multi-user support and JWT authentication.

---

## Tech Stack

- **Framework:** FastAPI
- **ORM:** SQLModel
- **Database:** Neon PostgreSQL (Serverless)
- **Authentication:** JWT tokens (verified from Better Auth)
- **Python:** 3.11+

---

## Project Structure

```
backend/
├── src/
│   └── api/
│       ├── main.py           # FastAPI app entry point
│       ├── models.py         # Database models (User, Task)
│       ├── db.py             # Database connection
│       ├── auth.py           # JWT verification middleware
│       └── routes/
│           └── tasks.py      # Task CRUD endpoints
├── tests/                    # Backend tests
├── requirements.txt          # Python dependencies
├── Dockerfile               # Container image
└── .env                     # Environment variables
```

---

## Setup

### 1. Prerequisites

- Python 3.11+
- Neon PostgreSQL account
- pip or poetry

### 2. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Environment Variables

Create `.env` file:

```bash
# Database
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Authentication
BETTER_AUTH_SECRET=your-secret-key-here-minimum-32-characters
JWT_ALGORITHM=HS256

# CORS
FRONTEND_URL=http://localhost:3000
```

### 4. Run the Server

```bash
# Development mode (with hot reload)
uvicorn src.api.main:app --reload --port 8000

# Production mode
uvicorn src.api.main:app --host 0.0.0.0 --port 8000
```

### 5. Access API Documentation

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

---

## API Endpoints

### Health Check

```http
GET /health
```

Returns API health status.

---

### Task Management

All endpoints require JWT authentication header:
```
Authorization: Bearer <jwt_token>
```

#### Get All Tasks
```http
GET /api/{user_id}/tasks?status=all&priority=HIGH&sort=created
```

**Query Parameters:**
- `status`: "all" | "pending" | "completed"
- `priority`: "HIGH" | "MEDIUM" | "LOW"
- `sort`: "created" | "title" | "due_date" | "priority"

#### Create Task
```http
POST /api/{user_id}/tasks
Content-Type: application/json

{
  "title": "Complete project",
  "description": "Finish Phase II",
  "priority": "HIGH",
  "tags": ["work", "urgent"],
  "due_date": "2025-12-15T23:59:59Z",
  "task_type": "scheduled",
  "recurrence_pattern": "NONE"
}
```

#### Get Single Task
```http
GET /api/{user_id}/tasks/{task_id}
```

#### Update Task
```http
PUT /api/{user_id}/tasks/{task_id}
Content-Type: application/json

{
  "title": "Updated title",
  "priority": "MEDIUM"
}
```

#### Delete Task
```http
DELETE /api/{user_id}/tasks/{task_id}
```

#### Toggle Completion
```http
PATCH /api/{user_id}/tasks/{task_id}/complete
```

#### Search Tasks
```http
GET /api/{user_id}/tasks/search?keyword=project
```

---

## Authentication Flow

1. **Frontend:** User logs in via Better Auth
2. **Better Auth:** Issues JWT token with user info
3. **Frontend:** Includes token in API requests:
   ```
   Authorization: Bearer <jwt_token>
   ```
4. **Backend:** Verifies token signature using `BETTER_AUTH_SECRET`
5. **Backend:** Extracts user ID from token
6. **Backend:** Filters data by authenticated user ID
7. **Backend:** Returns user-specific data

### JWT Payload Structure

```json
{
  "sub": "user_abc123",
  "email": "user@example.com",
  "name": "John Doe",
  "exp": 1734567890
}
```

---

## Database Schema

### users
| Column | Type | Description |
|--------|------|-------------|
| id | STRING | Primary key (from Better Auth) |
| email | STRING | Unique email |
| name | STRING | Display name |
| created_at | TIMESTAMP | Account creation |

### tasks
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| user_id | STRING | Foreign key to users |
| title | STRING | Task title |
| description | TEXT | Task details |
| priority | ENUM | HIGH/MEDIUM/LOW |
| tags | TEXT | JSON array |
| due_date | TIMESTAMP | Deadline |
| task_type | STRING | scheduled/activity |
| recurrence_pattern | ENUM | Recurrence type |
| completed | BOOLEAN | Completion status |
| completed_at | TIMESTAMP | When completed |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update |

---

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/test_tasks.py -v
```

---

## Docker

### Build Image
```bash
docker build -t todo-api .
```

### Run Container
```bash
docker run -p 8000:8000 --env-file .env todo-api
```

### Docker Compose
```bash
# From project root
docker-compose up backend
```

---

## Security

### User Isolation
- All endpoints verify `user_id` matches authenticated user
- Users cannot access other users' tasks
- 403 Forbidden returned for unauthorized access

### Input Validation
- Pydantic models validate all request data
- SQL injection prevented by SQLModel parameterization
- Title length: 1-200 characters
- Description length: max 1000 characters

### CORS
- Configured to allow frontend origin only
- Credentials enabled for cookies
- All HTTP methods allowed for API routes

---

## Error Handling

### 400 Bad Request
Invalid input data (validation error)

### 401 Unauthorized
Missing or invalid JWT token

### 403 Forbidden
User attempting to access another user's resources

### 404 Not Found
Task ID does not exist

### 500 Internal Server Error
Unexpected server error (check logs)

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| DATABASE_URL | Yes | - | Neon PostgreSQL connection string |
| BETTER_AUTH_SECRET | Yes | - | Shared secret with frontend (min 32 chars) |
| JWT_ALGORITHM | No | HS256 | JWT signing algorithm |
| FRONTEND_URL | No | http://localhost:3000 | Frontend URL for CORS |

---

## Troubleshooting

### Database Connection Error
- Verify DATABASE_URL is correct
- Check Neon PostgreSQL is accessible
- Ensure SSL mode is required: `?sslmode=require`

### Authentication Fails
- Verify BETTER_AUTH_SECRET matches frontend
- Check JWT token is valid and not expired
- Ensure Authorization header format: `Bearer <token>`

### CORS Errors
- Verify FRONTEND_URL matches your frontend origin
- Check frontend sends credentials: `credentials: 'include'`

---

## Production Deployment

### Checklist
- [ ] Set strong BETTER_AUTH_SECRET (32+ random characters)
- [ ] Use production DATABASE_URL
- [ ] Set FRONTEND_URL to production domain
- [ ] Disable debug mode (set `echo=False` in db.py)
- [ ] Use production ASGI server (uvicorn with workers)
- [ ] Enable HTTPS
- [ ] Set up monitoring and logging
- [ ] Configure database connection pooling
- [ ] Set up automated backups

### Recommended: Uvicorn with Workers
```bash
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## Contributing

1. Follow PEP 8 style guide
2. Add type hints to all functions
3. Write tests for new features
4. Update API documentation
5. Keep dependencies minimal

---

## License

MIT
