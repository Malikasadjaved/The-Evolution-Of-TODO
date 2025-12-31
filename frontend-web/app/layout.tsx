/**
 * Root Layout - Blue Tech Design System
 *
 * Features:
 * - Blue/cyan gradient background
 * - React Query provider for data fetching
 * - Toast provider for notifications
 * - Full-screen layout (no global nav - each page handles its own header)
 */

'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import './globals.css'
import { ToastProvider } from '@/components/ui/Toast'
import { ThemeProvider } from '@/hooks/useTheme'

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
            {/* Main Content Area - Full Screen */}
            <main className="min-h-screen">{children}</main>
            </ToastProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
