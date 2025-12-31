/**
 * Login Page - Blue Tech Design System
 *
 * Features:
 * - Glassmorphism login form
 * - Email and password inputs
 * - Form validation
 * - Error handling with toast notifications
 * - Loading states
 * - Link to signup page
 */

'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/Toast'

export default function LoginPage() {
  const router = useRouter()
  const { signIn, isSigningIn, user } = useAuth()
  const { toast } = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  )

  // Get redirect_to parameter from URL synchronously to avoid race condition
  const getRedirectUrl = () => {
    if (typeof window === 'undefined') return '/dashboard'
    const urlParams = new URLSearchParams(window.location.search)
    const redirectParam = urlParams.get('redirect_to')
    return redirectParam ? decodeURIComponent(redirectParam) : '/dashboard'
  }

  const [redirectTo] = useState<string>(getRedirectUrl())

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      // Redirect to the specified URL or default to dashboard
      if (redirectTo.startsWith('http://localhost:3001')) {
        // External redirect to chatbot - pass auth token for session sharing
        const token = localStorage.getItem('auth_token')
        const chatbotUrl = token
          ? `${redirectTo}${redirectTo.includes('?') ? '&' : '?'}auth_token=${encodeURIComponent(token)}`
          : redirectTo
        window.location.href = chatbotUrl
      } else {
        router.push(redirectTo)
      }
    }
  }, [user, router, redirectTo])

  // Validate form
  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {}

    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    try {
      await signIn({ email, password })
      toast.success('Logged in successfully!')

      // After successful login, redirect will be handled by useEffect
      // when user state updates (includes automatic token passing for chatbot)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Sign in failed'
      toast.error(message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Login Card */}
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white/8 backdrop-blur-lg border border-blue-500/20 rounded-2xl shadow-2xl shadow-blue-500/20 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-white/60">Sign in to your account to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              state={errors.email ? 'error' : 'default'}
              error={errors.email}
              fullWidth
              prefixIcon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
              }
            />

            {/* Password Input */}
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              state={errors.password ? 'error' : 'default'}
              error={errors.password}
              fullWidth
              prefixIcon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              }
            />

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={isSigningIn}
              disabled={isSigningIn}
            >
              {isSigningIn ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-blue-500/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-900/95 text-white/60">
                Don't have an account?
              </span>
            </div>
          </div>

          {/* Sign Up Link */}
          <Button
            variant="secondary"
            fullWidth
            onClick={() => router.push('/signup')}
          >
            Create Account
          </Button>
        </div>

        {/* Footer */}
        <p className="text-center text-white/40 text-sm mt-8">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
