/**
 * useAuth Hook - Authentication State Management
 *
 * React Query-powered authentication hook that manages:
 * - User session state
 * - Sign in / Sign up / Sign out
 * - JWT token storage
 * - Automatic session validation
 *
 * Usage:
 *   const { user, isLoading, signIn, signUp, signOut } = useAuth()
 */

'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { env } from '@/lib/env'

// ============================================================================
// Types
// ============================================================================

export interface User {
  id: string
  email: string
  name?: string
}

export interface SignInInput {
  email: string
  password: string
}

export interface SignUpInput {
  email: string
  password: string
  name: string
}

export interface AuthResponse {
  user: User
  token: string
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get JWT token from localStorage
 */
const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

/**
 * Store JWT token in localStorage
 */
const storeToken = (token: string): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem('auth_token', token)
}

/**
 * Remove JWT token from localStorage
 */
const removeToken = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem('auth_token')
}

/**
 * Decode JWT token to extract user info (client-side only, not verified)
 */
const decodeToken = (token: string): User | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return {
      id: payload.user_id,
      email: payload.email,
      name: payload.name,
    }
  } catch {
    return null
  }
}

/**
 * Fetch current session from token
 */
const fetchSession = async (): Promise<User | null> => {
  const token = getStoredToken()
  if (!token) return null

  // Decode token to get user info
  const user = decodeToken(token)
  if (!user) {
    removeToken()
    return null
  }

  // Optionally validate token with backend
  // For now, we trust the token if it decodes successfully
  return user
}

/**
 * Sign in with email and password
 */
const signIn = async (input: SignInInput): Promise<AuthResponse> => {
  const response = await fetch(`${env.NEXT_PUBLIC_BETTER_AUTH_URL}/sign-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Sign in failed')
  }

  const data: AuthResponse = await response.json()
  storeToken(data.token)
  return data
}

/**
 * Sign up with email, password, and name
 */
const signUp = async (input: SignUpInput): Promise<AuthResponse> => {
  const response = await fetch(`${env.NEXT_PUBLIC_BETTER_AUTH_URL}/sign-up`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Sign up failed')
  }

  const data: AuthResponse = await response.json()
  storeToken(data.token)
  return data
}

/**
 * Sign out (clear token and session)
 */
const signOut = async (): Promise<void> => {
  removeToken()

  // Optionally notify backend
  try {
    await fetch(`${env.NEXT_PUBLIC_BETTER_AUTH_URL}/sign-out`, {
      method: 'POST',
    })
  } catch {
    // Ignore errors - token is already removed locally
  }
}

// ============================================================================
// useAuth Hook
// ============================================================================

/**
 * useAuth Hook
 *
 * Provides authentication state and methods.
 *
 * @example
 * // In a component
 * const { user, isLoading, signIn, signUp, signOut } = useAuth()
 *
 * // Check if user is authenticated
 * if (isLoading) return <Loading />
 * if (!user) return <LoginPage />
 *
 * // Sign in
 * await signIn({ email, password })
 *
 * // Sign up
 * await signUp({ email, password, name })
 *
 * // Sign out
 * await signOut()
 */
export const useAuth = () => {
  const queryClient = useQueryClient()
  const router = useRouter()

  // Query: Fetch current session
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['session'],
    queryFn: fetchSession,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  })

  // Mutation: Sign in
  const signInMutation = useMutation({
    mutationFn: signIn,
    onSuccess: data => {
      // Update session cache
      queryClient.setQueryData(['session'], data.user)
      // Redirect to dashboard
      router.push('/dashboard')
    },
  })

  // Mutation: Sign up
  const signUpMutation = useMutation({
    mutationFn: signUp,
    onSuccess: data => {
      // Update session cache
      queryClient.setQueryData(['session'], data.user)
      // Redirect to dashboard
      router.push('/dashboard')
    },
  })

  // Mutation: Sign out
  const signOutMutation = useMutation({
    mutationFn: signOut,
    onSuccess: () => {
      // Clear session cache
      queryClient.setQueryData(['session'], null)
      // Redirect to login
      router.push('/login')
    },
  })

  return {
    // State
    user,
    isLoading,
    isAuthenticated: !!user,
    error,

    // Methods
    signIn: signInMutation.mutateAsync,
    signUp: signUpMutation.mutateAsync,
    signOut: signOutMutation.mutateAsync,

    // Mutation states
    isSigningIn: signInMutation.isPending,
    isSigningUp: signUpMutation.isPending,
    isSigningOut: signOutMutation.isPending,

    // Errors
    signInError: signInMutation.error,
    signUpError: signUpMutation.error,
    signOutError: signOutMutation.error,
  }
}

export default useAuth
