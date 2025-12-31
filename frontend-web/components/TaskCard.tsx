/**
 * TaskCard Component - Animated Glassmorphism Task Card
 *
 * Features:
 * - Framer Motion animations (stagger, hover, tap)
 * - Priority-based glow effects
 * - Animated checkbox with checkmark drawing
 * - Smooth spring physics
 * - Layout animations
 */

'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/Badge'
import { IconButton } from '@/components/ui/IconButton'
import type { Task } from '@/types/api'

interface TaskCardProps {
  task: Task
  index?: number // For stagger animation
  onClick?: () => void
  onDelete?: (task: Task) => void
  onToggleStatus?: (taskId: number, status: 'COMPLETE' | 'INCOMPLETE') => void
}

export function TaskCard({ task, index = 0, onClick, onDelete, onToggleStatus }: TaskCardProps) {
  // Check if task is overdue
  const isOverdue =
    task.due_date &&
    task.status !== 'COMPLETE' &&
    new Date(task.due_date) < new Date()

  // Format due date
  const formatDueDate = (date: string | null): string => {
    if (!date) return ''
    const d = new Date(date)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (d.toDateString() === today.toDateString()) {
      return 'Today'
    }
    if (d.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Get priority color
  const getPriorityColor = (
    priority: 'LOW' | 'MEDIUM' | 'HIGH'
  ): 'low' | 'medium' | 'high' => {
    return priority.toLowerCase() as 'low' | 'medium' | 'high'
  }

  // Priority-based glow colors
  const priorityGlow = {
    HIGH: 'hover:shadow-red-500/30 hover:border-red-400/50',
    MEDIUM: 'hover:shadow-yellow-500/30 hover:border-yellow-400/50',
    LOW: 'hover:shadow-green-500/30 hover:border-green-400/50',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        delay: index * 0.05, // Stagger by 50ms
        type: 'spring',
        stiffness: 260,
        damping: 20
      }}
      whileHover={{
        y: -8,
        scale: 1.02,
        transition: { type: 'spring', stiffness: 400, damping: 10 }
      }}
      whileTap={{ scale: 0.98 }}
      layout
      onClick={onClick}
      className={`
        group
        relative
        bg-white/8 backdrop-blur-lg
        border border-purple-400/20
        rounded-xl
        p-4
        shadow-lg shadow-purple-500/10
        ${priorityGlow[task.priority]}
        transition-all duration-300
        cursor-pointer
      `}
    >
      {/* Gradient overlay for completed tasks */}
      {task.status === 'COMPLETE' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl pointer-events-none"
        />
      )}

      {/* Priority glow effect (animated) */}
      <motion.div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${
            task.priority === 'HIGH' ? 'rgba(239, 68, 68, 0.15)' :
            task.priority === 'MEDIUM' ? 'rgba(234, 179, 8, 0.15)' :
            'rgba(34, 197, 94, 0.15)'
          }, transparent 70%)`,
        }}
      />

      {/* Action Buttons - Modern IconButton components */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
        <Link href={`/dashboard/tasks/${task.id}`} onClick={(e) => e.stopPropagation()}>
          <IconButton
            variant="view"
            size="md"
            aria-label="View task details"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            }
          />
        </Link>

        {onDelete && (
          <IconButton
            variant="delete"
            size="md"
            aria-label="Delete task"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(task)
            }}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            }
          />
        )}
      </div>

      {/* Header: Animated Checkbox + Title + Priority Badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1">
          {onToggleStatus && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation()
                const newStatus = task.status === 'COMPLETE' ? 'INCOMPLETE' : 'COMPLETE'
                onToggleStatus(task.id, newStatus)
              }}
              className="mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
              style={{
                borderColor: task.status === 'COMPLETE' ? '#a78bfa' : '#9333ea40',
                backgroundColor: task.status === 'COMPLETE' ? '#a78bfa' : 'transparent',
              }}
              aria-label={task.status === 'COMPLETE' ? 'Mark incomplete' : 'Mark complete'}
            >
              <AnimatePresence mode="wait">
                {task.status === 'COMPLETE' && (
                  <motion.svg
                    key="checkmark"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    exit={{ pathLength: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="w-full h-full text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <motion.path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </motion.svg>
                )}
              </AnimatePresence>
            </motion.button>
          )}

          <h3 className={`text-white font-semibold text-lg flex-1 line-clamp-2 transition-all duration-200 ${
            task.status === 'COMPLETE' ? 'line-through opacity-60' : ''
          }`}>
            {task.title}
          </h3>
        </div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          <Badge variant={getPriorityColor(task.priority)} size="sm">
            {task.priority}
          </Badge>
        </motion.div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-white/60 text-sm mb-4 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {task.tags.slice(0, 3).map((tag, tagIndex) => (
            <motion.span
              key={tagIndex}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05 + tagIndex * 0.05 }}
              whileHover={{ scale: 1.1 }}
              className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-md"
            >
              {tag}
            </motion.span>
          ))}
          {task.tags.length > 3 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.1 }}
              className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-md"
            >
              +{task.tags.length - 3}
            </motion.span>
          )}
        </div>
      )}

      {/* Footer: Due Date + Recurrence + Status */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-purple-400/10">
        <div className="flex items-center gap-3">
          {task.due_date ? (
            <div className={`flex items-center gap-2 ${isOverdue ? 'text-red-400' : 'text-white/60'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium">{formatDueDate(task.due_date)}</span>
              {isOverdue && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-xs bg-red-500/20 px-2 py-0.5 rounded"
                >
                  Overdue
                </motion.span>
              )}
            </div>
          ) : (
            <div className="text-white/40 text-sm">No due date</div>
          )}

          {task.recurrence && task.recurrence !== 'NONE' && (
            <div className="flex items-center gap-1.5 text-purple-300" title={`Repeats ${task.recurrence.toLowerCase()}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-xs font-medium">
                {task.recurrence === 'DAILY' && 'Daily'}
                {task.recurrence === 'WEEKLY' && 'Weekly'}
                {task.recurrence === 'MONTHLY' && 'Monthly'}
                {task.recurrence === 'YEARLY' && 'Yearly'}
              </span>
            </div>
          )}
        </div>

        <Badge variant={task.status === 'COMPLETE' ? 'low' : 'info'} size="sm">
          {task.status === 'COMPLETE' ? '✓ Done' : 'To Do'}
        </Badge>
      </div>

      {/* Recurrence Icon */}
      {task.recurrence && task.recurrence !== 'NONE' && (
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute top-3 left-3"
        >
          <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        </motion.div>
      )}
    </motion.div>
  )
}
