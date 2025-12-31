/**
 * Checkbox Component - Custom Animated Checkbox with Priority-Based Colors
 *
 * Features:
 * - Priority-based border and fill colors
 * - Scale animation on check/uncheck
 * - Smooth hover transitions
 * - Animated checkmark SVG (path drawing)
 * - Fully accessible (keyboard, screen readers)
 *
 * Usage:
 * <Checkbox
 *   checked={task.status === 'COMPLETE'}
 *   onChange={(checked) => onToggle(checked)}
 *   priority="HIGH"
 *   aria-label="Mark task complete"
 * />
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { COLORS } from '@/lib/design-tokens'

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  priority?: 'LOW' | 'MEDIUM' | 'HIGH'
  disabled?: boolean
  'aria-label'?: string
  className?: string
}

export function Checkbox({
  checked,
  onChange,
  priority = 'MEDIUM',
  disabled = false,
  'aria-label': ariaLabel,
  className = '',
}: CheckboxProps) {
  // Get priority color (hex values from design tokens)
  const getPriorityColor = (): string => {
    switch (priority) {
      case 'HIGH':
        return COLORS.accent.danger // #EF4444
      case 'MEDIUM':
        return COLORS.accent.warning // #F59E0B
      case 'LOW':
        return COLORS.accent.success // #10B981
      default:
        return '#6B7280' // Gray-500
    }
  }

  const priorityColor = getPriorityColor()

  const handleClick = () => {
    if (!disabled) {
      onChange(!checked)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      handleClick()
    }
  }

  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      whileHover={!disabled ? { scale: 1.1 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      animate={{
        scale: checked ? [1, 1.2, 1] : 1,
      }}
      transition={{
        duration: 0.3,
        ease: 'easeInOut',
      }}
      className={`
        relative
        w-5 h-5
        rounded-md
        border-2
        transition-all
        duration-200
        flex-shrink-0
        focus:outline-none
        focus:ring-2
        focus:ring-purple-400/50
        focus:ring-offset-2
        focus:ring-offset-transparent
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      style={{
        borderColor: checked
          ? priorityColor
          : 'rgba(255, 255, 255, 0.3)',
        backgroundColor: checked
          ? priorityColor
          : 'transparent',
      }}
    >
      {/* Animated Checkmark */}
      <AnimatePresence mode="wait">
        {checked && (
          <motion.svg
            key="checkmark"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            exit={{ pathLength: 0, opacity: 0 }}
            transition={{
              duration: 0.3,
              ease: 'easeOut',
            }}
            className="absolute inset-0 w-full h-full text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <motion.path d="M5 13l4 4L19 7" />
          </motion.svg>
        )}
      </AnimatePresence>

      {/* Hover glow effect */}
      {!disabled && (
        <motion.div
          className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none"
          whileHover={{ opacity: 0.3 }}
          style={{
            boxShadow: `0 0 10px ${priorityColor}50`,
          }}
        />
      )}
    </motion.button>
  )
}
