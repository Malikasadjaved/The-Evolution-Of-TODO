/**
 * UserMenu Component - Enhanced Header User Menu
 *
 * Features:
 * - Avatar with user initials (or profile photo if available)
 * - Online status indicator (green dot)
 * - Dropdown menu:
 *   - User name + email at top
 *   - Settings option
 *   - Theme toggle (Dark/Light/System)
 *   - Keyboard shortcuts link
 *   - Divider
 *   - Sign out
 * - Keyboard accessible (Escape to close)
 * - Framer Motion animations
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { ANIMATION_PRESETS, ACCESSIBILITY } from '@/lib/design-tokens'

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { user, signOut, isSigningOut } = useAuth()
  const { theme, setTheme } = useTheme()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
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

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
  }

  // Don't show menu if no user
  if (!user) {
    return null
  }

  // Get user initials for avatar
  const getInitials = () => {
    if (user.name) {
      const parts = user.name.split(' ')
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      }
      return user.name.substring(0, 2).toUpperCase()
    }
    return user.email.charAt(0).toUpperCase()
  }

  const isDark = theme === 'dark'

  return (
    <div className="relative z-[100]" ref={menuRef}>
      {/* User Button */}
      <motion.button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-2 py-2
          ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'}
          border ${isDark ? 'border-blue-500/20' : 'border-gray-300'}
          rounded-xl
          transition-colors cursor-pointer
          ${ACCESSIBILITY.focusRing.default}
          min-h-[44px]
        `}
        whileHover={ANIMATION_PRESETS.hoverScale}
        whileTap={ANIMATION_PRESETS.tapScale}
        aria-label="User menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar with online status */}
        <div className="relative">
          <div
            className={`
            w-8 h-8
            bg-gradient-to-br from-cyan-500 to-blue-600
            rounded-full border-2 ${isDark ? 'border-cyan-400/40' : 'border-blue-400/40'}
            flex items-center justify-center
            shadow-lg ${isDark ? 'shadow-cyan-500/30' : 'shadow-blue-500/30'}
          `}
          >
            <span className="text-white font-semibold text-sm">{getInitials()}</span>
          </div>
          {/* Online status indicator */}
          <span
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-[#0f1729] rounded-full"
            aria-label="Online"
          />
        </div>

        {/* User Info (hidden on mobile) */}
        <div className="hidden md:block text-sm text-left max-w-[150px]">
          <div className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {user.name || 'User'}
          </div>
          <div className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {user.email}
          </div>
        </div>

        {/* Dropdown Arrow */}
        <motion.svg
          className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`
              absolute right-0 mt-2 w-72
              ${isDark ? 'bg-[#1a2234]' : 'bg-white'}
              border ${isDark ? 'border-blue-500/20' : 'border-gray-200'}
              rounded-xl shadow-2xl
              overflow-hidden
              backdrop-blur-xl
            `}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={ANIMATION_PRESETS.smoothSpring}
          >
            {/* User Info Section */}
            <div
              className={`
              px-4 py-3 border-b ${isDark ? 'border-blue-500/20' : 'border-gray-200'}
              flex items-center gap-3
            `}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div
                  className={`
                  w-10 h-10
                  bg-gradient-to-br from-cyan-500 to-blue-600
                  rounded-full border-2 ${isDark ? 'border-cyan-400/40' : 'border-blue-400/40'}
                  flex items-center justify-center
                  shadow-lg ${isDark ? 'shadow-cyan-500/30' : 'shadow-blue-500/30'}
                `}
                >
                  <span className="text-white font-semibold text-base">{getInitials()}</span>
                </div>
                {/* Online status */}
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-[#1a2234] rounded-full" />
              </div>

              {/* User details */}
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {user.name || 'User'}
                </div>
                <div
                  className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  {user.email}
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              {/* Settings */}
              <button
                className={`
                  w-full px-4 py-2.5 text-left text-sm
                  ${isDark ? 'text-white hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50'}
                  transition-colors
                  flex items-center gap-3
                `}
                onClick={() => {
                  setIsOpen(false)
                  // TODO: Navigate to settings page
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Settings
              </button>

              {/* Theme Toggle Section */}
              <div
                className={`
                px-4 py-2 border-t border-b ${isDark ? 'border-blue-500/10' : 'border-gray-100'}
              `}
              >
                <div className={`text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Theme
                </div>
                <div className="flex gap-2">
                  {/* Light Theme */}
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`
                      flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all
                      ${
                        theme === 'light'
                          ? 'bg-blue-500 text-white shadow-md'
                          : isDark
                          ? 'bg-white/5 text-gray-400 hover:bg-white/10'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    <svg className="w-4 h-4 mx-auto mb-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Light
                  </button>

                  {/* Dark Theme */}
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`
                      flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all
                      ${
                        theme === 'dark'
                          ? 'bg-cyan-500 text-white shadow-md'
                          : isDark
                          ? 'bg-white/5 text-gray-400 hover:bg-white/10'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    <svg className="w-4 h-4 mx-auto mb-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                    Dark
                  </button>

                  {/* System Theme */}
                  <button
                    onClick={() => handleThemeChange('system')}
                    className={`
                      flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all
                      ${
                        theme === 'system'
                          ? 'bg-purple-500 text-white shadow-md'
                          : isDark
                          ? 'bg-white/5 text-gray-400 hover:bg-white/10'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    <svg className="w-4 h-4 mx-auto mb-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Auto
                  </button>
                </div>
              </div>

              {/* Keyboard Shortcuts */}
              <button
                className={`
                  w-full px-4 py-2.5 text-left text-sm
                  ${isDark ? 'text-white hover:bg-white/5' : 'text-gray-700 hover:bg-gray-50'}
                  transition-colors
                  flex items-center gap-3
                `}
                onClick={() => {
                  setIsOpen(false)
                  // TODO: Open keyboard shortcuts modal
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
                Keyboard Shortcuts
                <span
                  className={`ml-auto text-xs font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                >
                  ?
                </span>
              </button>

              {/* Divider */}
              <div className={`my-1 border-t ${isDark ? 'border-blue-500/10' : 'border-gray-100'}`} />

              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className={`
                  w-full px-4 py-2.5 text-left text-sm
                  ${isDark ? 'text-red-400 hover:bg-red-900/10' : 'text-red-600 hover:bg-red-50'}
                  transition-colors
                  flex items-center gap-3
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default UserMenu
