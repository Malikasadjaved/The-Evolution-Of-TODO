/**
 * Better Auth API route handler.
 *
 * This catch-all route proxies all Better Auth requests to the backend:
 * - POST /api/auth/sign-up (user registration)
 * - POST /api/auth/sign-in (user login)
 * - POST /api/auth/sign-out (user logout)
 * - GET /api/auth/session (get current session)
 *
 * All requests are forwarded to: http://localhost:8000/api/auth/*
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
 * Proxy all auth requests to the backend API.
 *
 * Frontend request flow:
 * 1. User submits form on /signup
 * 2. useSignUp() calls POST /api/auth/sign-up
 * 3. This handler proxies to backend: http://localhost:8000/api/auth/sign-up
 * 4. Backend validates, creates user, returns JWT token
 * 5. Frontend stores token in localStorage
 * 6. Frontend redirects to /dashboard
 *
 * @param request - Next.js request object
 * @returns Response from backend
 */
async function handleAuthRequest(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract the auth endpoint path (e.g., /api/auth/sign-in → sign-in)
    const url = new URL(request.url)
    const path = url.pathname.replace('/api/auth', '') // Remove /api/auth prefix

    // Build backend URL
    const backendUrl = `${env.NEXT_PUBLIC_API_URL}/api/auth${path}`

    console.log(`[Auth Proxy] ${request.method} ${path} → ${backendUrl}`)

    // Prepare request body
    let body: string | undefined
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      body = await request.text()
    }

    // Prepare headers for backend request
    const headers = new Headers()
    headers.set('Content-Type', 'application/json')

    // Forward Authorization header if present
    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      headers.set('authorization', authHeader)
    }

    // Make request to backend
    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      body,
    })

    // Get response body
    const responseBody = await response.text()

    console.log(`[Auth Proxy] Response: ${response.status}`)

    // Return response with same status
    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('[Auth Proxy] Error:', error)
    return NextResponse.json(
      { error: 'Authentication service unavailable', details: String(error) },
      { status: 503 }
    )
  }
}
