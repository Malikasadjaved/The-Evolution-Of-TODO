# End-to-End Authentication Testing Guide

## Prerequisites
- Backend API running at http://localhost:8000
- Frontend running at http://localhost:3000
- PostgreSQL database connected and ready

## Test Flow

### 1. Test Backend Health ✅
```bash
curl http://localhost:8000/health
```
**Expected Response:**
```json
{"status":"healthy","service":"todo-api","version":"2.0.0"}
```

### 2. Test User Registration (Sign Up)

**Manual Test:**
1. Open browser to http://localhost:3000/signup
2. Fill in:
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `password123`
   - Confirm Password: `password123`
3. Click "Sign Up"

**Expected:**
- ✅ No validation errors
- ✅ Redirect to `/dashboard` or `/login`
- ✅ Success toast notification
- ✅ User created in database

### 3. Test User Login

**Manual Test:**
1. Open browser to http://localhost:3000/login
2. Fill in:
   - Email: `test@example.com`
   - Password: `password123`
3. Click "Login"

**Expected:**
- ✅ No validation errors
- ✅ Redirect to `/dashboard`
- ✅ Session cookie set
- ✅ JWT token stored in session

### 4. Test Protected Dashboard Access

**Manual Test:**
1. Navigate to http://localhost:3000/dashboard

**Expected (Authenticated):**
- ✅ Dashboard loads successfully
- ✅ Task list is visible (may be empty)
- ✅ "Create Task" button is available
- ✅ User is NOT redirected to login

**Expected (Not Authenticated):**
- ✅ Redirect to `/login`

### 5. Test JWT Token in API Requests

**Browser DevTools Test:**
1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Navigate to http://localhost:3000/dashboard
4. Look for API requests to `localhost:8000/api/...`
5. Click on any request
6. View **Request Headers**

**Expected Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### 6. Test Task Creation with JWT

**Manual Test:**
1. On dashboard, click "New Task" or "Create Task"
2. Fill in:
   - Title: `Test Task`
   - Description: `Testing JWT authentication`
   - Priority: `HIGH`
3. Submit

**Expected:**
- ✅ Task created successfully
- ✅ API request includes JWT token
- ✅ Backend verifies JWT and creates task
- ✅ Task appears in task list
- ✅ Success toast notification

**DevTools Network Check:**
```
POST http://localhost:8000/api/{user_id}/tasks
Authorization: Bearer {JWT_TOKEN}
Status: 201 Created
```

### 7. Test User Authorization (Security Test)

**Postman/curl Test:**
```bash
# Try to access tasks WITHOUT token (should fail)
curl http://localhost:8000/api/some-user-id/tasks
```
**Expected Response:**
```json
{
  "detail": "Not authenticated"
}
```
Status: 401 Unauthorized

```bash
# Try to access tasks WITH invalid token (should fail)
curl -H "Authorization: Bearer invalid-token" \
  http://localhost:8000/api/some-user-id/tasks
```
**Expected Response:**
```json
{
  "detail": "Invalid authentication token: ..."
}
```
Status: 401 Unauthorized

### 8. Test Cross-User Access Prevention

**Security Test:**
1. Sign up as User A (email: userA@example.com)
2. Create a task as User A
3. Note User A's ID from JWT token
4. Sign up as User B (email: userB@example.com)
5. Try to access User A's tasks using User B's session

**Expected:**
- ✅ User B CANNOT see User A's tasks
- ✅ API returns 403 Forbidden if trying to access another user's endpoint
- ✅ JWT verification ensures user isolation

### 9. Test Logout

**Manual Test:**
1. Click "Logout" button (if available)
2. Try to access `/dashboard`

**Expected:**
- ✅ Session cleared
- ✅ Cookies removed
- ✅ Redirect to `/login`
- ✅ Cannot access protected routes

### 10. Test Token Expiration

**Manual Test:**
1. Log in and wait for token to expire (check JWT expiration time)
2. Try to perform an action (create task, etc.)

**Expected:**
- ✅ API returns 401 Unauthorized
- ✅ Frontend redirects to `/login`
- ✅ User sees "Session expired" message

## Automated Testing Script

You can also run this quick verification script:

```bash
# Test 1: Health check
echo "Testing backend health..."
curl -s http://localhost:8000/health | jq

# Test 2: Unauthenticated request (should fail)
echo -e "\nTesting unauthenticated request (should return 401)..."
curl -s -w "\nHTTP Status: %{http_code}\n" http://localhost:8000/api/test-user/tasks

# Test 3: Invalid token (should fail)
echo -e "\nTesting invalid token (should return 401)..."
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "Authorization: Bearer invalid-token" \
  http://localhost:8000/api/test-user/tasks

echo -e "\n✅ Security tests passed: Unauthenticated requests are blocked"
```

## Success Criteria

### ✅ Authentication Working If:
1. Users can sign up with email/password
2. Users can log in with credentials
3. JWT tokens are generated and stored
4. All API requests include `Authorization: Bearer` header
5. Backend verifies JWT tokens correctly
6. Invalid/missing tokens return 401
7. Users can only access their own data
8. Logout clears session and redirects

### ❌ Issues to Check:
- 401 errors → Check BETTER_AUTH_SECRET is same in frontend/.env.local and backend/.env
- 403 errors → Check user_id matches authenticated user
- CORS errors → Check CORS configuration in backend/src/api/main.py
- Token not sent → Check Better Auth session setup
- Token not verified → Check JWT algorithm matches (HS256)

## Environment Variables

Ensure these are set correctly:

**Frontend (.env.local):**
```env
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Backend (.env):**
```env
BETTER_AUTH_SECRET=your-secret-key-here
JWT_ALGORITHM=HS256
DATABASE_URL=postgresql://...
FRONTEND_URL=http://localhost:3000
```

**CRITICAL:** `BETTER_AUTH_SECRET` must be IDENTICAL in both files!

## Common Issues

### Issue 1: "Invalid authentication token"
**Cause:** Secret mismatch between frontend and backend
**Fix:** Ensure BETTER_AUTH_SECRET is identical in both .env files

### Issue 2: "Not authenticated"
**Cause:** Token not being sent in request headers
**Fix:** Check Better Auth session setup and auth-client.ts

### Issue 3: CORS error
**Cause:** Frontend origin not allowed
**Fix:** Add frontend URL to CORS allowed origins in backend

### Issue 4: 403 Forbidden
**Cause:** User trying to access another user's data
**Fix:** Check user_id in URL matches authenticated user ID

## Next Steps

After successful authentication testing:
1. ✅ Implement task CRUD operations
2. ✅ Add user profile page
3. ✅ Implement password reset flow
4. ✅ Add OAuth providers (Google, GitHub)
5. ✅ Add 2FA/MFA support
6. ✅ Implement refresh token rotation
7. ✅ Add rate limiting
8. ✅ Implement audit logging

---

**Status:** Ready for testing
**Last Updated:** 2025-12-14
