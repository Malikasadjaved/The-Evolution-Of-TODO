/**
 * QuickAddButton Component - Floating Quick Add Action
 *
 * Features:
 * - Premium gradient background (Indigo → Purple)
 * - 40x40px size with border-radius 12px
 * - Hover scale animation with enhanced shadow
 * - Keyboard shortcut: "N" key
 * - Ripple effect on click
 * - Opens task creation modal/form
 * - Accessible with ARIA labels
 *
 * Design:
 * - Gradient: linear-gradient(135deg, #6366F1, #8B5CF6)
 * - Shadow: Glow effect on hover
 * - Icon: Plus symbol (white)
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { ANIMATION_PRESETS, ACCESSIBILITY } from '@/lib/design-tokens'

interface QuickAddButtonProps {
  onClick?: () => void
  tooltip?: string
}

export const QuickAddButton: React.FC<QuickAddButtonProps> = ({
  onClick,
  tooltip = 'Quick Add Task (N)',
}) => {
  const [showRipple, setShowRipple] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Keyboard shortcut: "N" key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input
      if (
        e.key === 'n' &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        onClick?.()
        triggerRipple()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClick])

  const triggerRipple = () => {
    setShowRipple(true)
    setTimeout(() => setShowRipple(false), 600)
  }

  const handleClick = () => {
    onClick?.()
    triggerRipple()
  }

  return (
    <div className="relative">
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            className={`
              absolute bottom-full left-1/2 -translate-x-1/2 mb-2
              px-3 py-1.5 rounded-lg whitespace-nowrap
              text-xs font-medium
              ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-900 text-white'}
              shadow-lg
              pointer-events-none
            `}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
          >
            {tooltip}
            {/* Arrow */}
            <div
              className={`
              absolute top-full left-1/2 -translate-x-1/2
              border-4 border-transparent
              ${isDark ? 'border-t-gray-800' : 'border-t-gray-900'}
            `}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Add Button */}
      <motion.button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          relative
          w-10 h-10
          bg-gradient-to-br from-[#6366F1] to-[#8B5CF6]
          rounded-xl
          flex items-center justify-center
          shadow-lg shadow-purple-500/30
          transition-shadow duration-300
          hover:shadow-xl hover:shadow-purple-500/50
          ${ACCESSIBILITY.focusRing.default}
          overflow-hidden
          group
        `}
        whileHover={{
          scale: 1.05,
          rotate: 90,
        }}
        whileTap={{
          scale: 0.95,
          rotate: 90,
        }}
        transition={ANIMATION_PRESETS.spring}
        aria-label={tooltip}
      >
        {/* Gradient Overlay (shimmer effect) */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: 'linear',
            repeatDelay: 3,
          }}
        />

        {/* Plus Icon */}
        <svg
          className="w-5 h-5 text-white relative z-10 transition-transform group-hover:scale-110"
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

        {/* Ripple Effect */}
        <AnimatePresence>
          {showRipple && (
            <motion.span
              className="absolute inset-0 bg-white/30 rounded-xl"
              initial={{ scale: 0, opacity: 0.6 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            />
          )}
        </AnimatePresence>
      </motion.button>

      {/* Pulse Ring (attention grabber on first load) */}
      <motion.div
        className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] opacity-40"
        initial={{ scale: 1, opacity: 0.4 }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.4, 0, 0.4],
        }}
        transition={{
          duration: 2,
          repeat: 3, // Pulse 3 times on mount
          ease: 'easeInOut',
        }}
      />
    </div>
  )
}

export default QuickAddButton
