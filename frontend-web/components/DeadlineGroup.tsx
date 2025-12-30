/**
 * DeadlineGroup Component - Collapsible Group for Deadline Items
 *
 * Features:
 * - Group deadlines by urgency (Overdue, Today, This Week, Later)
 * - Collapsible group headers
 * - Count badge showing number of items
 * - Color-coded section headers
 * - Smooth expand/collapse animations
 *
 * Usage:
 * <DeadlineGroup
 *   title="Overdue"
 *   count={3}
 *   color="text-red-400"
 *   defaultExpanded={true}
 * >
 *   {tasks.map(task => <DeadlineItem key={task.id} task={task} />)}
 * </DeadlineGroup>
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, ReactNode } from 'react'

interface DeadlineGroupProps {
  title: string // Group title (e.g., "Overdue", "Today")
  count: number // Number of items in this group
  color?: string // Header color (e.g., "text-red-400")
  bgColor?: string // Background tint (e.g., "bg-red-500/5")
  defaultExpanded?: boolean // Initially expanded
  children: ReactNode // DeadlineItem components
}

export function DeadlineGroup({
  title,
  count,
  color = 'text-white',
  bgColor = 'bg-white/5',
  defaultExpanded = true,
  children,
}: DeadlineGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  // Don't render if no items
  if (count === 0) return null

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div className="space-y-2">
      {/* Group Header */}
      <button
        onClick={toggleExpanded}
        className={`
          w-full
          flex items-center justify-between
          px-3 py-2
          rounded-lg
          ${bgColor}
          hover:bg-white/10
          transition-colors
          duration-200
          group
        `}
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${title} section`}
      >
        {/* Left side: Title and count */}
        <div className="flex items-center gap-3">
          {/* Expand/Collapse icon */}
          <motion.svg
            className={`w-4 h-4 ${color} transition-transform`}
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </motion.svg>

          {/* Title */}
          <h4 className={`text-sm font-semibold ${color}`}>
            {title}
          </h4>

          {/* Count badge */}
          <span
            className={`
              px-2 py-0.5
              text-xs font-medium
              rounded-full
              ${bgColor}
              ${color}
              border border-current/20
            `}
          >
            {count}
          </span>
        </div>

        {/* Right side: Chevron indicator */}
        <motion.svg
          className="w-4 h-4 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity"
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
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
        </motion.svg>
      </button>

      {/* Group Content (collapsible) */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.3, ease: 'easeInOut' },
              opacity: { duration: 0.2 },
            }}
            className="overflow-hidden space-y-2"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
