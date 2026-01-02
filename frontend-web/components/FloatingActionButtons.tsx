/**
 * FloatingActionButtons Component - Minimal Slide-Out Menu Design
 *
 * Clean, minimal floating button with slide-out menu:
 * - Single small button (always visible)
 * - Slide-out menu with clean animation
 * - Minimal design, no complex gestures
 * - Glassmorphic design matching dashboard theme
 * - Keyboard accessible (Tab, Enter, Escape)
 * - Clear visual feedback and states
 * - 44px+ touch targets for accessibility
 *
 * Features:
 * - Click to open/close menu
 * - Clean slide animation
 * - Simple, intuitive UX
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MoreVertical, Plus, MessageSquare } from 'lucide-react'

export interface FloatingActionButtonsProps {
  /** Callback when user clicks Add Task */
  onCreateTask?: () => void

  /** Callback when user clicks AI Chat */
  onOpenAIChat?: () => void

  /** Whether to show AI Chat option */
  showAIChat?: boolean

  /** Custom position (default: bottom-right) */
  position?: {
    bottom?: string
    right?: string
  }
}

type MenuItem = {
  id: 'create' | 'chat'
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  gradient: string
  shadow: string
}

const menuItems: MenuItem[] = [
  {
    id: 'create',
    icon: Plus,
    label: 'New Task',
    description: 'Create a new task',
    gradient: 'from-blue-500 to-cyan-500',
    shadow: 'shadow-cyan-500/30',
  },
  {
    id: 'chat',
    icon: MessageSquare,
    label: 'AI Chat',
    description: 'Chat with AI assistant',
    gradient: 'from-blue-500 to-cyan-500',
    shadow: 'shadow-cyan-500/30',
  },
]

export function FloatingActionButtons({
  onCreateTask,
  onOpenAIChat,
  showAIChat = true,
  position = { bottom: '1.5rem', right: '1.5rem' },
}: FloatingActionButtonsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleItemClick = (itemId: 'create' | 'chat') => {
    if (itemId === 'create') {
      onCreateTask?.()
    } else if (itemId === 'chat') {
      onOpenAIChat?.()
    }
    setIsOpen(false)
  }

  // Filter items based on showAIChat prop
  const visibleItems = showAIChat ? menuItems : [menuItems[0]]

  return (
    <div
      ref={containerRef}
      className="fixed z-40"
      style={{
        bottom: position.bottom,
        right: position.right,
      }}
    >
      {/* Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 80 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 80 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="mb-3 w-64"
          >
            {/* Glassmorphic Menu Container */}
            <div className="relative">
              {/* Gradient background mesh */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-cyan-500/5 rounded-2xl" />
              <div className="absolute inset-0 bg-gradient-to-bl from-purple-500/10 to-transparent blur-3xl rounded-2xl" />

              {/* Main menu card */}
              <div className="relative bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/10">
                {/* Decorative top border */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

                {/* Menu Items */}
                <div className="py-3">
                  {visibleItems.map((item, index) => {
                    const Icon = item.icon

                    return (
                      <motion.button
                        key={item.id}
                        onClick={() => handleItemClick(item.id)}
                        className={`
                          w-full flex items-center gap-3 px-3 py-3
                          transition-all duration-200
                          relative overflow-hidden
                          ${index !== visibleItems.length - 1 ? 'border-b border-white/5' : ''}
                        `}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        aria-label={item.label}
                      >
                        {/* Hover gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

                        {/* Icon */}
                        <div className={`
                          relative z-10 w-9 h-9 rounded-lg
                          bg-gradient-to-br ${item.gradient}
                          flex items-center justify-center
                          shadow-md ${item.shadow}
                          transition-all duration-200
                          hover:scale-110 hover:${item.shadow.replace('/30', '/50')}
                        `}>
                          {/* Inner glow */}
                          <div className={`absolute inset-0 rounded-lg bg-gradient-to-br ${item.gradient} blur-md opacity-50`} />
                          <Icon className="w-4.5 h-4.5 text-white relative z-10" />
                        </div>

                        {/* Text */}
                        <div className="flex-1 text-left relative z-10">
                          <div className="text-white font-semibold text-sm">{item.label}</div>
                          <div className="text-white/50 text-xs leading-tight">{item.description}</div>
                        </div>

                        {/* Arrow indicator */}
                        <motion.svg
                          className="w-4 h-4 text-cyan-400/60 relative z-10"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          animate={{ x: 6, opacity: 0.6 }}
                          transition={{ duration: 0.2 }}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </motion.svg>

                        {/* Active indicator */}
                        <motion.div
                          className="absolute top-1/2 -translate-y-1/2 -left-2 w-1 h-1 bg-cyan-400 rounded-full"
                          initial={{ scale: 0 }}
                          whileHover={{ scale: 1 }}
                        />
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-14 h-14 rounded-2xl
          bg-white/5 backdrop-blur-xl
          border border-white/10
          shadow-lg shadow-white/5
          flex items-center justify-center
          relative overflow-hidden
          transition-all duration-300
          hover:bg-white/10 hover:border-white/20
          hover:shadow-xl hover:shadow-white/10
          focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-slate-900
        "
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open menu"
        aria-expanded={isOpen}
      >
        {/* Icon rotates when menu is open */}
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        >
          <MoreVertical className="w-6 h-6 text-white/80" />
        </motion.div>

        {/* Dot indicator when menu is open */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute top-2 right-2 w-2 h-2 bg-cyan-400 rounded-full"
            />
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}

export default FloatingActionButtons
