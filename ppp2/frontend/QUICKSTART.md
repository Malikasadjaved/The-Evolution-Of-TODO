# Quick Start Guide - Authentication Setup

This guide will help you get the authentication system up and running quickly.

## Prerequisites

- Node.js 18+ installed
- Backend API running at http://localhost:8000
- Git (optional)

## Setup Steps

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

Edit `.env.local` file:

```bash
# Generate a secure secret (32+ characters)
openssl rand -base64 32
```

Copy the output and replace the `BETTER_AUTH_SECRET` value in `.env.local`:

```env
BETTER_AUTH_SECRET=<your-generated-secret-here>
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Start the Development Server

```bash
npm run dev
```

The app will be available at http://localhost:3000

### 4. Test Authentication

1. **Sign Up**: Visit http://localhost:3000/signup
   - Enter name, email, and password
   - Click "Sign up"
   - You'll be redirected to the dashboard

2. **Sign In**: Visit http://localhost:3000/login
   - Enter email and password
   - Click "Sign in"
   - You'll be redirected to the dashboard

3. **Protected Dashboard**: http://localhost:3000
   - Shows your user info
   - Requires authentication
   - Automatically redirects to login if not authenticated

## What's Included

### Authentication Features

- Email/password signup and login
- JWT token-based authentication
- Secure httpOnly cookie storage
- Session management
- Protected routes
- Auto-redirect to login for unauthenticated users
- Client-side form validation
- Error handling with user-friendly messages

### Files Created

**Core Auth Files:**
- `lib/auth.ts` - Server-side auth configuration
- `lib/auth-client.ts` - Client-side auth functions
- `app/api/auth/[...all]/route.ts` - Auth API handler

**UI Components:**
- `components/AuthProvider.tsx` - Session provider
- `app/login/page.tsx` - Login page
- `app/signup/page.tsx` - Signup page
- `app/layout.tsx` - Root layout (updated with AuthProvider)

**Supporting Files:**
- `lib/api.ts` - API client with auth token injection (already existed)
- `lib/types.ts` - TypeScript types (already existed)
- `.env.local` - Environment variables

## Authentication Flow

```
┌─────────────┐
│   Signup    │
│   /signup   │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  Better Auth API    │
│  Create User + JWT  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Store Session in   │
│  httpOnly Cookie    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   Dashboard (/)     │
│   Show User Info    │
└─────────────────────┘
```

## Testing Checklist

- [ ] Signup creates new user successfully
- [ ] Login with correct credentials works
- [ ] Login with wrong credentials shows error
- [ ] Protected dashboard requires authentication
- [ ] User info displays correctly on dashboard
- [ ] Sign out button works
- [ ] After sign out, dashboard redirects to login
- [ ] Session persists after page refresh

## API Integration

The auth system is ready to communicate with your FastAPI backend:

```typescript
// Example: Fetching user tasks
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

function MyComponent() {
  const { data: session } = useSession();

  const loadTasks = async () => {
    if (!session) return;

    // JWT token automatically included in Authorization header
    const tasks = await api.getTasks(session.user.id);
    console.log(tasks);
  };
}
```

## Common Issues

### "Authentication required" error

**Solution**: Ensure `BETTER_AUTH_SECRET` is set correctly in `.env.local`

```bash
# Generate new secret
openssl rand -base64 32

# Update .env.local
BETTER_AUTH_SECRET=<new-secret>

# Restart dev server
npm run dev
```

### Session not persisting

**Solution**: Clear browser cookies and restart dev server

```bash
# Stop dev server (Ctrl+C)
# Clear browser cookies (Dev Tools > Application > Cookies)
npm run dev
```

### Cannot connect to backend API

**Solution**: Verify backend is running

```bash
# In separate terminal, go to backend directory
cd ../backend  # or wherever your FastAPI backend is
uvicorn main:app --reload

# Should see: Uvicorn running on http://127.0.0.1:8000
```

## Next Steps

1. **Implement Backend JWT Verification**: Configure FastAPI to verify JWT tokens
2. **Add Protected Routes**: Protect other pages that require authentication
3. **Build Task Components**: Create TaskList, TaskForm, TaskItem components
4. **Add Profile Page**: Allow users to view/edit their profile
5. **Implement Password Reset**: Add forgot password functionality

## Resources

- [Better Auth Docs](https://better-auth.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)

## Need Help?

Check the detailed documentation:
- `AUTH_SETUP.md` - Complete authentication documentation
- `CLAUDE.md` - Frontend development guidelines
- `README.md` - Project overview

---

**Ready to go!** Start the backend, run `npm run dev`, and visit http://localhost:3000/signup to create your first user.
