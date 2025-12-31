/**
 * Root Layout - Purple Kanban Design System
 *
 * Features:
 * - Purple gradient background
 * - React Query provider for data fetching
 * - Toast provider for notifications
 * - Minimal top navigation (Logo + User profile)
 */

'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import './globals.css'
import { ToastProvider } from '@/components/ui/Toast'
import { ThemeProvider } from '@/hooks/useTheme'
import { ThemeToggle } from '@/components/ThemeToggle'
import { UserMenu } from '@/components/UserMenu'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Create QueryClient instance (one per request)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <html lang="en">
      <head>
        <title>Todo App - Phase 2</title>
        <meta
          name="description"
          content="Full-stack todo application with JWT authentication"
        />
      </head>
      <body>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <ToastProvider>
            {/* Minimal Top Navigation */}
            <nav className="relative z-50 h-[60px] bg-white/70 dark:bg-purple-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-purple-400/20 px-6 flex items-center justify-between transition-colors overflow-visible">
              {/* Logo */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 dark:from-pink-500 dark:to-orange-400 rounded-lg flex items-center justify-center shadow-lg">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  Todo App
                </span>
              </div>

              {/* Theme Toggle + User Profile */}
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <UserMenu />
              </div>
            </nav>

            {/* Main Content Area */}
            <main className="min-h-[calc(100vh-60px)]">{children}</main>
            </ToastProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
