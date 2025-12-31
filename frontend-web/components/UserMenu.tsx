'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { user, signOut, isSigningOut } = useAuth()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  // Don't show menu if no user
  if (!user) {
    return null
  }

  return (
    <div className="relative z-[100]" ref={menuRef}>
      {/* User Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center gap-3 px-3 py-2
          bg-gray-100 dark:bg-white/5 rounded-lg
          hover:bg-gray-200 dark:hover:bg-white/10
          transition-colors cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-purple-500
        "
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        {/* Avatar */}
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-500 rounded-full border-2 border-purple-400/40 flex items-center justify-center">
          <span className="text-white font-semibold text-sm">
            {user.email.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* User Info */}
        <div className="text-sm text-left">
          <div className="font-medium text-gray-900 dark:text-white">
            {user.name || 'User'}
          </div>
          <div className="text-gray-600 dark:text-white/60 text-xs">
            {user.email.length > 20 ? `${user.email.substring(0, 20)}...` : user.email}
          </div>
        </div>

        {/* Dropdown Arrow */}
        <svg
          className={`w-4 h-4 text-gray-500 dark:text-white/60 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="
            fixed mt-2 w-64
            bg-white dark:bg-gray-800
            border border-gray-200 dark:border-purple-400/20
            rounded-lg shadow-xl
            overflow-hidden
            z-[99999]
          "
          style={{
            top: menuRef.current ? menuRef.current.getBoundingClientRect().bottom + 8 : 0,
            right: menuRef.current ? window.innerWidth - menuRef.current.getBoundingClientRect().right : 0,
          }}
        >
          {/* User Info Section */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-purple-400/20">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {user.name || 'User'}
            </div>
            <div className="text-xs text-gray-600 dark:text-white/60 break-all">
              {user.email}
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {/* Profile Link (placeholder for future) */}
            <button
              className="
                w-full px-4 py-2 text-left text-sm
                text-gray-700 dark:text-white/80
                hover:bg-gray-100 dark:hover:bg-white/5
                transition-colors
                flex items-center gap-2
              "
              onClick={() => {
                setIsOpen(false)
                // TODO: Navigate to profile page
              }}
            >
              <svg
                className="w-4 h-4"
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
              View Profile
            </button>

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="
                w-full px-4 py-2 text-left text-sm
                text-red-600 dark:text-red-400
                hover:bg-red-50 dark:hover:bg-red-900/10
                transition-colors
                flex items-center gap-2
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              {isSigningOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
