/**
 * Better Auth API route handler.
 *
 * This catch-all route handles all Better Auth requests:
 * - POST /api/auth/sign-up (user registration)
 * - POST /api/auth/sign-in (user login)
 * - POST /api/auth/sign-out (user logout)
 * - GET /api/auth/session (get current session)
 *
 * Better Auth automatically generates JWT tokens and handles authentication.
 */

import { NextRequest, NextResponse } from 'next/server'
import { env } from '@/lib/env'

/**
 * Handle GET requests to Better Auth.
 *
 * Example: GET /api/auth/session
 */
export async function GET(request: NextRequest) {
  return handleAuthRequest(request)
}

/**
 * Handle POST requests to Better Auth.
 *
 * Examples:
 * - POST /api/auth/sign-up
 * - POST /api/auth/sign-in
 * - POST /api/auth/sign-out
 */
export async function POST(request: NextRequest) {
  return handleAuthRequest(request)
}

/**
 * Handle PUT requests to Better Auth.
 */
export async function PUT(request: NextRequest) {
  return handleAuthRequest(request)
}

/**
 * Handle PATCH requests to Better Auth.
 */
export async function PATCH(request: NextRequest) {
  return handleAuthRequest(request)
}

/**
 * Handle DELETE requests to Better Auth.
 */
export async function DELETE(request: NextRequest) {
  return handleAuthRequest(request)
}

/**
 * Forward all auth requests to Better Auth library.
 *
 * Better Auth will:
 * 1. Validate request (email, password, etc.)
 * 2. Hash passwords (for sign-up)
 * 3. Verify credentials (for sign-in)
 * 4. Generate JWT token with payload: { user_id, email, exp, iat }
 * 5. Return token to frontend
 *
 * @param request - Next.js request object
 * @returns Next.js response with auth result
 */
async function handleAuthRequest(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract path from URL (e.g., /api/auth/sign-in → sign-in)
    const url = new URL(request.url)
    const path = url.pathname.replace('/api/auth/', '')

    // For this phase, we'll implement a simplified auth flow
    // In production, you would integrate with Better Auth's server SDK

    if (path === 'sign-up') {
      return handleSignUp(request)
    }

    if (path === 'sign-in') {
      return handleSignIn(request)
    }

    if (path === 'sign-out') {
      return handleSignOut()
    }

    if (path === 'session') {
      return handleSession(request)
    }

    return NextResponse.json(
      { error: 'Auth route not found' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Handle user registration.
 *
 * For Phase 2, this is a placeholder that returns a mock JWT token.
 * In production, this would:
 * 1. Create user in database via backend API
 * 2. Hash password
 * 3. Generate JWT token
 */
async function handleSignUp(request: NextRequest): Promise<NextResponse> {
  const body = await request.json()
  const { email, password, name } = body

  // Validation
  if (!email || !password || !name) {
    return NextResponse.json(
      { error: 'Email, password, and name are required' },
      { status: 400 }
    )
  }

  // TODO: Integrate with backend /api/auth/sign-up endpoint
  // For now, return mock response

  // Generate mock JWT token (in production, backend generates this)
  const mockToken = generateMockJWT(email)

  return NextResponse.json({
    user: {
      id: 'user_' + Date.now(),
      email,
      name,
    },
    token: mockToken,
  })
}

/**
 * Handle user login.
 *
 * For Phase 2, this is a placeholder that returns a mock JWT token.
 * In production, this would:
 * 1. Verify credentials via backend API
 * 2. Return JWT token from backend
 */
async function handleSignIn(request: NextRequest): Promise<NextResponse> {
  const body = await request.json()
  const { email, password } = body

  // Validation
  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    )
  }

  // TODO: Integrate with backend /api/auth/sign-in endpoint
  // For now, return mock response

  // Generate mock JWT token (in production, backend generates this)
  const mockToken = generateMockJWT(email)

  return NextResponse.json({
    user: {
      id: 'user_' + Date.now(),
      email,
    },
    token: mockToken,
  })
}

/**
 * Handle user logout.
 */
async function handleSignOut(): Promise<NextResponse> {
  // For JWT-based auth, logout is handled client-side (remove token)
  return NextResponse.json({ success: true })
}

/**
 * Handle session check.
 */
async function handleSession(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ session: null })
  }

  const token = authHeader.split(' ')[1]

  try {
    // Decode JWT (not verifying for mock - in production, verify with backend)
    const payload = JSON.parse(atob(token.split('.')[1]))

    return NextResponse.json({
      session: {
        user: {
          id: payload.user_id,
          email: payload.email,
        },
      },
    })
  } catch {
    return NextResponse.json({ session: null })
  }
}

/**
 * Generate mock JWT token for development.
 *
 * IMPORTANT: In production, JWT tokens MUST be generated by the backend
 * using the BETTER_AUTH_SECRET to ensure security.
 *
 * This mock function is ONLY for Phase 2 frontend development.
 */
function generateMockJWT(email: string): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  }

  const payload = {
    user_id: 'user_' + Date.now(),
    email,
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    iat: Math.floor(Date.now() / 1000),
  }

  // Mock JWT (not properly signed - for development only)
  const encodedHeader = btoa(JSON.stringify(header))
  const encodedPayload = btoa(JSON.stringify(payload))
  const mockSignature = btoa('mock_signature')

  return `${encodedHeader}.${encodedPayload}.${mockSignature}`
}
