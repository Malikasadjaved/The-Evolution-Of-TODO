/**
 * NotificationBell Component - Header Notification System
 *
 * Features:
 * - Bell icon with red badge showing notification count
 * - Shake animation on new notification
 * - Dropdown with notification list
 * - "Mark all read" functionality
 * - Empty state with friendly message
 * - Keyboard accessible (Escape to close)
 *
 * Notifications shown:
 * - Tasks due soon (within 24 hours)
 * - Overdue tasks
 * - Task completions (if team feature added)
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { ANIMATION_PRESETS, ACCESSIBILITY } from '@/lib/design-tokens'

interface Notification {
  id: string
  type: 'due_soon' | 'overdue' | 'completed'
  title: string
  message: string
  timestamp: Date
  taskId?: number
  read: boolean
}

interface NotificationBellProps {
  notifications?: Notification[]
  onMarkAllRead?: () => void
  onNotificationClick?: (notification: Notification) => void
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  notifications = [],
  onMarkAllRead,
  onNotificationClick,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [shouldShake, setShouldShake] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const unreadCount = notifications.filter((n) => !n.read).length

  // Trigger shake animation when new notifications arrive
  useEffect(() => {
    if (unreadCount > 0) {
      setShouldShake(true)
      const timer = setTimeout(() => setShouldShake(false), 500)
      return () => clearTimeout(timer)
    }
  }, [unreadCount])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
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

  const handleNotificationClick = (notification: Notification) => {
    onNotificationClick?.(notification)
    setIsOpen(false)
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'due_soon':
        return (
          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
        )
      case 'overdue':
        return (
          <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        )
      case 'completed':
        return (
          <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        )
    }
  }

  return (
    <div className="relative">
      {/* Bell Button */}
      <motion.button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative p-2 rounded-xl
          ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'}
          border ${isDark ? 'border-blue-500/20' : 'border-gray-300'}
          transition-colors duration-200
          ${ACCESSIBILITY.focusRing.default}
          min-h-[44px] min-w-[44px]
          flex items-center justify-center
        `}
        animate={shouldShake ? { rotate: [0, -15, 15, -15, 15, 0] } : {}}
        transition={{ duration: 0.5 }}
        whileHover={ANIMATION_PRESETS.hoverScale}
        whileTap={ANIMATION_PRESETS.tapScale}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Bell Icon */}
        <svg
          className={`w-5 h-5 transition-colors ${
            isDark ? 'text-cyan-400' : 'text-gray-700'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full border-2 border-[#0f1729] shadow-lg"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={ANIMATION_PRESETS.fastSpring}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            className={`
              absolute right-0 mt-2 w-96 max-h-[500px] overflow-hidden
              ${isDark ? 'bg-[#1a2234]' : 'bg-white'}
              border ${isDark ? 'border-blue-500/20' : 'border-gray-200'}
              rounded-xl shadow-2xl
              backdrop-blur-xl
              z-50
            `}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={ANIMATION_PRESETS.smoothSpring}
          >
            {/* Header */}
            <div
              className={`
              px-4 py-3 border-b ${isDark ? 'border-blue-500/20' : 'border-gray-200'}
              flex items-center justify-between
            `}
            >
              <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Notifications
              </h3>
              {notifications.length > 0 && (
                <button
                  onClick={() => onMarkAllRead?.()}
                  className={`
                    text-sm font-medium transition-colors
                    ${isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 hover:text-blue-700'}
                  `}
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto max-h-[400px]">
              {notifications.length === 0 ? (
                // Empty State
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <svg
                    className={`w-16 h-16 mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p
                    className={`text-base font-medium ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    You're all caught up!
                  </p>
                  <p
                    className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}
                  >
                    No new notifications
                  </p>
                </div>
              ) : (
                notifications.map((notification, index) => (
                  <motion.button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`
                      w-full px-4 py-3 text-left transition-colors
                      ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}
                      ${!notification.read ? (isDark ? 'bg-blue-500/5' : 'bg-blue-50/50') : ''}
                      border-b ${isDark ? 'border-blue-500/10' : 'border-gray-100'}
                      last:border-b-0
                    `}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}
                        >
                          {notification.title}
                        </p>
                        <p
                          className={`text-xs mt-0.5 ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}
                        >
                          {notification.message}
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            isDark ? 'text-gray-500' : 'text-gray-500'
                          }`}
                        >
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>

                      {/* Unread Indicator */}
                      {!notification.read && (
                        <div className="flex-shrink-0">
                          <span className="block w-2 h-2 bg-cyan-400 rounded-full" />
                        </div>
                      )}
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Format timestamp as relative time (e.g., "5 minutes ago")
 */
function formatTimestamp(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  return date.toLocaleDateString()
}

export default NotificationBell
