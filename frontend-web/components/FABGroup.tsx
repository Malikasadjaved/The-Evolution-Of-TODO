/**
 * FABGroup Component - Floating Action Button Group
 *
 * Modern FAB pattern with:
 * - Main FAB: Create Task (blue/cyan gradient, 56px)
 * - Secondary FAB: AI Chat (positioned above main, 48px)
 * - Expandable labels on hover
 * - Smooth Framer Motion animations with spring physics
 * - Position: fixed bottom-right (with proper spacing)
 * - Touch-friendly (44px+ touch targets)
 * - Accessible (ARIA labels, keyboard navigation)
 *
 * Design inspired by Material Design 3.0
 */

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface FABGroupProps {
  /** Callback when user clicks Add Task FAB */
  onCreateTask?: () => void

  /** Callback when user clicks AI Chat FAB */
  onOpenAIChat?: () => void

  /** Whether to show the AI Chat FAB */
  showAIChat?: boolean

  /** Custom position (default: bottom-right) */
  position?: {
    bottom?: string
    right?: string
  }
}

export function FABGroup({
  onCreateTask,
  onOpenAIChat,
  showAIChat = true,
  position = { bottom: '1.5rem', right: '1.5rem' },
}: FABGroupProps) {
  const [showLabels, setShowLabels] = useState(false)

  return (
    <div
      className="fixed z-40 flex flex-col items-end gap-3"
      style={{
        bottom: position.bottom,
        right: position.right,
      }}
      onMouseEnter={() => setShowLabels(true)}
      onMouseLeave={() => setShowLabels(false)}
    >
      {/* Secondary FAB: AI Chat */}
      <AnimatePresence>
        {showAIChat && (
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, scale: 0, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.05 }}
          >
            {/* Label */}
            <AnimatePresence>
              {showLabels && (
                <motion.div
                  className="bg-slate-900/95 backdrop-blur-xl border border-purple-500/30 rounded-lg px-3 py-2 shadow-lg"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                >
                  <p className="text-white text-sm font-medium whitespace-nowrap">
                    AI Assistant
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Button */}
            <motion.button
              onClick={onOpenAIChat}
              className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full shadow-2xl flex items-center justify-center group relative"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              aria-label="Open AI Assistant"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-blue-400 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />

              {/* Icon */}
              <svg
                className="w-7 h-7 text-white relative z-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB: Create Task */}
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {/* Label */}
        <AnimatePresence>
          {showLabels && (
            <motion.div
              className="bg-slate-900/95 backdrop-blur-xl border border-blue-500/30 rounded-lg px-3 py-2 shadow-lg"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30, delay: 0.05 }}
            >
              <p className="text-white text-sm font-medium whitespace-nowrap">
                New Task
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Button */}
        <motion.button
          onClick={onCreateTask}
          className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full shadow-2xl flex items-center justify-center group relative"
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          aria-label="Create new task"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />

          {/* Icon - Plus sign */}
          <svg
            className="w-8 h-8 text-white relative z-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </motion.button>
      </motion.div>
    </div>
  )
}
