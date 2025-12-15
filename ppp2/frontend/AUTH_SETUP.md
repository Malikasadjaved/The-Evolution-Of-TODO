# Better Auth Setup - Authentication Documentation

This document describes the Better Auth authentication system configured for the Next.js frontend.

## Overview

The authentication system uses [Better Auth](https://better-auth.com/) with JWT token support to authenticate users against the FastAPI backend.

## Architecture

### Components

1. **Auth Configuration** (`lib/auth.ts`)
   - Server-side Better Auth configuration
   - SQLite database for user storage
   - Email/password authentication enabled
   - Session management with cookie caching

2. **Auth Client** (`lib/auth-client.ts`)
   - Client-side auth functions
   - Exports: `signIn`, `signUp`, `signOut`, `useSession`

3. **API Route Handler** (`app/api/auth/[...all]/route.ts`)
   - Handles all auth endpoints (signin, signup, signout, etc.)
   - Processes GET and POST requests

4. **Auth Provider** (`components/AuthProvider.tsx`)
   - Client component that wraps the app
   - Provides session context to all child components

5. **Login Page** (`app/login/page.tsx`)
   - Email/password login form
   - Client-side validation
   - Error handling with user-friendly messages

6. **Signup Page** (`app/signup/page.tsx`)
   - User registration form with name, email, password
   - Password confirmation validation
   - Client-side form validation

## Authentication Flow

### 1. User Registration (Signup)

```
User fills signup form → signUp.email() → Better Auth API → User created in DB
→ Session created → Redirect to dashboard
```

### 2. User Login

```
User fills login form → signIn.email() → Better Auth API → Verify credentials
→ Session created with JWT → Store in httpOnly cookie → Redirect to dashboard
```

### 3. Protected Routes

```
User visits protected page → useSession() hook → Check session
→ If authenticated: show content
→ If not authenticated: redirect to /login
```

### 4. API Requests to Backend

```
Frontend → getAuthToken() → Extract JWT from session
→ Add Authorization: Bearer <token> header → FastAPI backend
→ Backend verifies JWT → Returns user-specific data
```

## File Structure

```
frontend/
├── app/
│   ├── layout.tsx                    # Root layout with AuthProvider
│   ├── page.tsx                      # Home/Dashboard (protected)
│   ├── login/
│   │   └── page.tsx                  # Login page
│   ├── signup/
│   │   └── page.tsx                  # Signup page
│   └── api/
│       └── auth/
│           └── [...all]/route.ts     # Auth API handler
├── components/
│   └── AuthProvider.tsx              # Session provider component
├── lib/
│   ├── auth.ts                       # Server auth config
│   ├── auth-client.ts                # Client auth functions
│   ├── api.ts                        # Backend API client with auth
│   └── types.ts                      # TypeScript types
└── .env.local                        # Environment variables
```

## Environment Variables

Required in `.env.local`:

```bash
# Better Auth Secret (minimum 32 characters)
# Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET=your-secret-key-here-minimum-32-characters

# Better Auth URL (your frontend URL)
BETTER_AUTH_URL=http://localhost:3000

# Backend API URL (FastAPI backend)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Usage Examples

### Using Auth in Components

```tsx
"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function ProfileComponent() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  if (isPending) return <div>Loading...</div>;
  if (!session) {
    router.push("/login");
    return null;
  }

  return (
    <div>
      <h1>Welcome, {session.user.name}!</h1>
      <p>Email: {session.user.email}</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}
```

### Making Authenticated API Calls

The `api` client in `lib/api.ts` automatically includes the JWT token:

```tsx
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

export function TaskList() {
  const { data: session } = useSession();

  const loadTasks = async () => {
    if (!session) return;

    const tasks = await api.getTasks(session.user.id);
    // tasks are fetched with Authorization: Bearer <token>
  };

  // ...
}
```

## Security Features

1. **Secure Cookies**: Session stored in httpOnly cookies (not accessible via JavaScript)
2. **JWT Tokens**: Stateless authentication with signed tokens
3. **HTTPS Ready**: Configure for production with HTTPS
4. **CSRF Protection**: Built-in CSRF protection
5. **Password Requirements**: Minimum 6 characters (configurable)
6. **Email Validation**: Client-side and server-side validation

## Session Management

- **Session Duration**: Configurable (default: based on Better Auth settings)
- **Cookie Cache**: 5 minutes cache for better performance
- **Auto-refresh**: Sessions refresh automatically
- **Secure Storage**: httpOnly cookies prevent XSS attacks

## Backend Integration

The JWT token from Better Auth is sent to the FastAPI backend with every API request:

```typescript
// In lib/api.ts
const token = await getAuthToken();
headers["Authorization"] = `Bearer ${token}`;
```

The backend should:
1. Verify the JWT signature
2. Extract user information (user_id, email, name)
3. Return user-specific data

## Error Handling

The authentication system handles these errors gracefully:

- **Invalid credentials**: "Invalid email or password"
- **User already exists**: "Failed to create account"
- **Network errors**: "Network error. Please check your connection"
- **Session expired**: Auto-redirect to login page (401)
- **Unauthorized access**: "Authentication required. Please log in."

## Development

### Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit:
- Homepage: http://localhost:3000
- Login: http://localhost:3000/login
- Signup: http://localhost:3000/signup

### Database

Better Auth uses SQLite for local development:
- Database file: `auth.db` (auto-created)
- Contains users, sessions, and verification tokens

### Testing Authentication

1. Start the backend API: `cd .. && uvicorn main:app --reload`
2. Start the frontend: `npm run dev`
3. Visit http://localhost:3000/signup
4. Create a test account
5. Login and verify session

## Troubleshooting

### "Authentication required" errors

- Ensure `BETTER_AUTH_SECRET` is set and >= 32 characters
- Check that `BETTER_AUTH_URL` matches your frontend URL
- Verify backend API is running

### Session not persisting

- Clear browser cookies
- Check that `BETTER_AUTH_SECRET` hasn't changed
- Verify `.env.local` is loaded (restart dev server)

### API calls return 401

- Check that JWT token is included in Authorization header
- Verify backend can decode the JWT token
- Ensure backend and frontend share the same secret (if applicable)

## Next Steps

1. Implement backend JWT verification
2. Add protected routes middleware
3. Create task management components
4. Add profile management
5. Implement password reset flow
6. Add email verification (optional)

## Resources

- [Better Auth Documentation](https://better-auth.com/docs)
- [Next.js Authentication](https://nextjs.org/docs/authentication)
- [FastAPI JWT](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/)
