# CORS Configuration Guide

Complete guide for configuring Cross-Origin Resource Sharing between Vercel frontend and Railway backend.

## CORS Fundamentals

### What is CORS?

CORS (Cross-Origin Resource Sharing) is a browser security feature that restricts web pages from making requests to a different domain than the one serving the page.

**Example**:
```
Frontend: https://frontend.vercel.app
Backend:  https://backend.railway.app
         ^
         Different origins -> CORS required
```

### The CORS Handshake

```
1. Browser makes request from frontend.vercel.app
   ↓
2. Request goes to backend.railway.app
   ↓
3. Backend checks: "Is frontend.vercel.app in my allow list?"
   ↓
4a. YES -> Adds CORS headers -> Request proceeds
4b. NO  -> No CORS headers -> Browser blocks response
```

## Backend Configuration (FastAPI on Railway)

### Standard CORS Setup

**File**: `backend/src/api/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings

app = FastAPI()

# Parse frontend URL(s) from environment variable
frontend_origins = [
    url.strip() 
    for url in settings.frontend_url.split(",")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,  # Required for cookies/auth headers
    allow_methods=["*"],     # GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],     # Authorization, Content-Type, etc.
)

@app.get("/health")
async def health():
    return {"status": "healthy"}
```

### Environment Variable

**Railway**:
```bash
# Single frontend
FRONTEND_URL=https://frontend.vercel.app

# Multiple frontends (web + chatbot)
FRONTEND_URL=https://web.vercel.app,https://chatbot.vercel.app

# Include localhost for local development
FRONTEND_URL=http://localhost:3000,https://frontend.vercel.app
```

### Configuration Options

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `allow_origins` | List of URLs | Which domains can make requests |
| `allow_credentials` | `True` | Allow cookies and Authorization headers |
| `allow_methods` | `["*"]` | All HTTP methods (GET, POST, PUT, DELETE) |
| `allow_headers` | `["*"]` | All headers (Authorization, Content-Type) |

**Security Note**: In production, use specific origins instead of `allow_origins=["*"]`.

## Frontend Configuration (Next.js on Vercel)

### API Client Setup

**File**: `frontend-web/lib/api.ts`

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('auth_token')
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include',  // Send cookies
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  })
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  
  return response.json()
}
```

**Key Settings**:
- `credentials: 'include'`: Sends cookies with cross-origin requests
- `Authorization: Bearer <token>`: JWT token for authentication

### Environment Variables

**Vercel**:
```bash
NEXT_PUBLIC_API_URL=https://backend.railway.app
```

## CORS Testing

### Test CORS Preflight

```bash
curl -I -X OPTIONS https://backend.railway.app/api/user/tasks \
  -H "Origin: https://frontend.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization"
```

**Expected Response**:
```
HTTP/2 200
access-control-allow-origin: https://frontend.vercel.app
access-control-allow-credentials: true
access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS
access-control-allow-headers: Authorization, Content-Type
```

### Test Actual Request

```bash
curl https://backend.railway.app/health \
  -H "Origin: https://frontend.vercel.app"
```

**Expected Response**:
```
HTTP/2 200
access-control-allow-origin: https://frontend.vercel.app
access-control-allow-credentials: true

{"status":"healthy"}
```

## Common CORS Errors

### Error 1: No 'Access-Control-Allow-Origin' Header

**Symptom**:
```
Access to fetch at 'https://backend.railway.app/api/tasks' from origin
'https://frontend.vercel.app' has been blocked by CORS policy: No
'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Cause**: Backend's `FRONTEND_URL` doesn't include the frontend domain

**Fix**:
```bash
# Check current value
railway variables list

# Update with correct URL
railway variables set FRONTEND_URL="https://frontend.vercel.app"

# CRITICAL: Redeploy backend (CORS changes require restart)
railway up
```

### Error 2: Origin Not in Allow List

**Symptom**: Same as Error 1, but `FRONTEND_URL` is set

**Cause**: Typo in URL (trailing slash, wrong protocol, etc.)

**Fix**:
```bash
# Ensure exact match (no trailing slash)
CORRECT: https://frontend.vercel.app
WRONG:   https://frontend.vercel.app/
WRONG:   http://frontend.vercel.app  (http vs https)
```

### Error 3: Credentials Not Allowed

**Symptom**:
```
The value of the 'Access-Control-Allow-Origin' header in the response must not
be the wildcard '*' when the request's credentials mode is 'include'.
```

**Cause**: Using `allow_origins=["*"]` with `credentials: 'include'`

**Fix**: Use specific origins:
```python
allow_origins=["https://frontend.vercel.app"]  # Not ["*"]
```

### Error 4: CORS Works in Dev, Fails in Production

**Symptom**: localhost works, production fails

**Cause**: `FRONTEND_URL` only has localhost

**Fix**:
```bash
# Include both local and production URLs
FRONTEND_URL=http://localhost:3000,https://frontend.vercel.app
```

### Error 5: CORS Updated but Still Failing

**Symptom**: Changed `FRONTEND_URL` but error persists

**Cause**: Railway service not restarted

**Fix**:
```bash
# Force redeploy to apply environment changes
railway up
```

**Why**: FastAPI reads `settings.frontend_url` at startup, not per-request.

## CORS Debugging Checklist

When debugging CORS issues, check these in order:

### Backend (Railway)

- [ ] `FRONTEND_URL` environment variable set
- [ ] Value matches Vercel URL exactly (no trailing slash)
- [ ] Protocol correct (`https://` for production)
- [ ] Backend redeployed after environment change
- [ ] CORS middleware added to FastAPI app
- [ ] `allow_credentials=True` in middleware

**Verify**:
```bash
railway variables list | grep FRONTEND_URL
```

### Frontend (Vercel)

- [ ] `NEXT_PUBLIC_API_URL` points to Railway backend
- [ ] `credentials: 'include'` in fetch requests
- [ ] `Authorization` header included (if using JWT)

**Verify**:
```bash
vercel env ls
```

### Network (Browser DevTools)

- [ ] Open DevTools > Network tab
- [ ] Look for OPTIONS preflight request
- [ ] Check response headers for `access-control-allow-origin`
- [ ] Check actual request headers for `Origin`

## Advanced CORS Scenarios

### Multiple Frontends

**Scenario**: Web app + Chatbot UI both need backend access

**Solution**:
```bash
FRONTEND_URL=https://web.vercel.app,https://chatbot.vercel.app
```

**Backend automatically parses comma-separated list**:
```python
frontend_origins = [url.strip() for url in settings.frontend_url.split(",")]
```

### Dynamic Origin Validation

**Scenario**: Allow subdomains (e.g., `*.vercel.app`)

**Solution** (advanced):
```python
from fastapi.middleware.cors import CORSMiddleware

def is_allowed_origin(origin: str) -> bool:
    allowed_patterns = [
        "https://frontend.vercel.app",
        r"https://.*\.vercel\.app",  # Any Vercel preview deployment
    ]
    import re
    return any(re.match(pattern, origin) for pattern in allowed_patterns)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Local Development + Production

**Scenario**: Support both localhost and production

**Solution**:
```bash
# Development
FRONTEND_URL=http://localhost:3000,http://localhost:3001

# Production
FRONTEND_URL=http://localhost:3000,https://frontend.vercel.app

# Both (for Railway staging environment)
FRONTEND_URL=http://localhost:3000,https://staging.vercel.app,https://frontend.vercel.app
```

## CORS Headers Reference

| Header | Purpose | Example |
|--------|---------|---------|
| `Access-Control-Allow-Origin` | Which origin can access | `https://frontend.vercel.app` |
| `Access-Control-Allow-Credentials` | Allow cookies/auth | `true` |
| `Access-Control-Allow-Methods` | Allowed HTTP methods | `GET, POST, PUT, DELETE, OPTIONS` |
| `Access-Control-Allow-Headers` | Allowed headers | `Authorization, Content-Type` |
| `Access-Control-Max-Age` | Preflight cache duration | `86400` (24 hours) |

## Security Best Practices

### Production Configuration

```python
# ✅ GOOD: Specific origins
allow_origins=[
    "https://frontend.vercel.app",
    "https://chatbot.vercel.app",
]

# ❌ BAD: Wildcard in production
allow_origins=["*"]
```

### Environment-Specific CORS

```python
from .config import settings

if settings.environment == "production":
    allowed_origins = ["https://frontend.vercel.app"]
elif settings.environment == "staging":
    allowed_origins = ["https://staging.vercel.app"]
else:  # development
    allowed_origins = ["http://localhost:3000", "http://localhost:3001"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Audit CORS Configuration

```python
# Log allowed origins on startup
@app.on_event("startup")
async def startup_event():
    logger.info(f"CORS allowed origins: {frontend_origins}")
```

Check Railway logs to verify correct origins.

## Troubleshooting Workflow

```
CORS Error?
    ↓
1. Check Browser DevTools Network Tab
    - OPTIONS request sent?
    - Response has access-control-allow-origin header?
    ↓
2. Check Railway Logs
    - CORS middleware loaded?
    - Allowed origins logged correctly?
    ↓
3. Test with curl
    - Preflight request works?
    - Actual request works?
    ↓
4. Verify Environment Variables
    - FRONTEND_URL set on Railway?
    - NEXT_PUBLIC_API_URL set on Vercel?
    ↓
5. Redeploy Backend
    - Railway service restarted?
    - Changes applied?
```
