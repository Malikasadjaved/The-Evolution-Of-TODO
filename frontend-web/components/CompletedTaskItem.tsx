/**
 * CompletedTaskItem Component - Condensed View for Completed Tasks
 *
 * Displays completed tasks in a minimal, condensed format:
 * - Title with strikethrough (line-through)
 * - Reduced opacity (rgba(255, 255, 255, 0.5))
 * - Completion timestamp ("Completed 2 hours ago")
 * - Reduced vertical padding (12px)
 * - Hover state to reveal actions (edit, delete)
 *
 * Features:
 * - Framer Motion animations
 * - Relative time display (e.g., "2 hours ago", "yesterday")
 * - Accessible with proper ARIA labels
 */

'use client'

import { motion } from 'framer-motion'
import { Task } from '@/types/api'

interface CompletedTaskItemProps {
  task: Task
  index: number
  onClick?: () => void
  onDelete?: (task: Task) => void
  onToggleStatus?: (taskId: number, status: 'INCOMPLETE' | 'COMPLETE') => void
}

export const CompletedTaskItem: React.FC<CompletedTaskItemProps> = ({
  task,
  index,
  onClick,
  onDelete,
  onToggleStatus,
}) => {
  // Calculate relative time
  const getRelativeTime = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Recently'

    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} ${Math.floor(diffDays / 7) === 1 ? 'week' : 'weeks'} ago`

    return date.toLocaleDateString()
  }

  return (
    <motion.div
      className="bg-white/5 backdrop-blur-lg border border-blue-500/10 rounded-xl p-3 hover:bg-white/10 transition-colors cursor-pointer group relative"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{
        delay: index * 0.03,
        type: 'spring',
        stiffness: 300,
        damping: 25,
      }}
      whileHover={{ scale: 1.01, x: -2 }}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        {/* Checkbox (already checked) */}
        <motion.button
          className="flex-shrink-0 w-5 h-5 rounded-md bg-green-500/20 border-2 border-green-400 flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation()
            onToggleStatus?.(task.id, 'INCOMPLETE')
          }}
          aria-label="Mark as incomplete"
        >
          <motion.svg
            className="w-3 h-3 text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </motion.svg>
        </motion.button>

        {/* Task Info */}
        <div className="flex-1 min-w-0">
          {/* Title with strikethrough */}
          <h4 className="text-sm font-medium text-white/50 line-through truncate">
            {task.title}
          </h4>

          {/* Completion timestamp */}
          <p className="text-xs text-white/30 mt-0.5">
            Completed {getRelativeTime(task.updated_at)}
          </p>
        </div>

        {/* Action Buttons (visible on hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Delete Button */}
          <motion.button
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation()
              onDelete?.(task)
            }}
            aria-label="Delete task"
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

export default CompletedTaskItem
