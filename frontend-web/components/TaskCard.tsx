/**
 * TaskCard Component - Animated Glassmorphism Task Card
 *
 * Features:
 * - Enhanced Framer Motion animations (stagger, hover, tap)
 * - Priority-based glow effects
 * - Animated checkbox with checkmark drawing
 * - Smooth spring physics (< 400ms for all animations)
 * - Layout animations for smooth repositioning
 * - Delete animation (slide right + fade + height collapse)
 * - Creation animation (slide down + pop scale)
 */

'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/Badge'
import { IconButton } from '@/components/ui/IconButton'
import { Checkbox } from '@/components/ui/Checkbox'
import { TaskQuickActions } from '@/components/TaskQuickActions'
import { COLORS } from '@/lib/design-tokens'
import { cardInteraction, layoutTransition } from '@/lib/animations'
import type { Task } from '@/types/api'

interface TaskCardProps {
  task: Task
  index?: number // For stagger animation
  onClick?: () => void
  onDelete?: (task: Task) => void
  onToggleStatus?: (taskId: number, status: 'COMPLETE' | 'INCOMPLETE') => void
  onEdit?: (task: Task) => void
  onUpdatePriority?: (taskId: number, priority: 'LOW' | 'MEDIUM' | 'HIGH') => void
  onCheckboxClick?: (task: Task) => void
}

export function TaskCard({ task, index = 0, onClick, onDelete, onToggleStatus, onEdit, onUpdatePriority, onCheckboxClick }: TaskCardProps) {
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

  // Get priority border color (4px left border)
  const getPriorityBorderColor = (): string => {
    switch (task.priority) {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{
        opacity: 0,
        x: 100,
        height: 0,
        marginBottom: 0,
        transition: {
          opacity: { duration: 0.2 },
          x: { duration: 0.3 },
          height: { duration: 0.2, delay: 0.15 },
          marginBottom: { duration: 0.2, delay: 0.15 },
        },
      }}
      transition={{
        delay: index * 0.05, // Stagger by 50ms
        type: 'spring',
        stiffness: 400,
        damping: 25,
        mass: 0.8,
      }}
      {...cardInteraction}
      layout
      onClick={onClick}
      className={`
        group
        relative
        bg-white/8 backdrop-blur-lg
        border border-purple-400/20
        border-b border-white/5
        border-l-4
        rounded-xl
        p-6
        shadow-lg shadow-purple-500/10
        ${priorityGlow[task.priority]}
        transition-all duration-300
        cursor-pointer
        hover:bg-white/[0.03]
      `}
      style={{
        borderLeftColor: getPriorityBorderColor(),
      }}
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

      {/* Quick Actions Menu (Three-Dot Dropdown) */}
      <div className="absolute top-3 right-3 z-10">
        <TaskQuickActions
          task={task}
          onEdit={onEdit ? () => onEdit(task) : undefined}
          onDelete={onDelete ? () => onDelete(task) : undefined}
          onUpdatePriority={onUpdatePriority ? (priority) => onUpdatePriority(task.id, priority) : undefined}
        />
      </div>

      {/* Header: Custom Checkbox + Title + Priority Badge with Glow */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1">
          {onToggleStatus && (
            <div
              className="mt-0.5"
              onClick={(e) => {
                e.stopPropagation();
                if (onCheckboxClick) {
                  onCheckboxClick(task);
                } else {
                  const newStatus = task.status === 'COMPLETE' ? 'INCOMPLETE' : 'COMPLETE';
                  onToggleStatus(task.id, newStatus);
                }
              }}
            >
              <Checkbox
                checked={task.status === 'COMPLETE'}
                onChange={() => {}} // Controlled by the div onClick for specific behavior
                priority={task.priority}
                aria-label={task.status === 'COMPLETE' ? 'Mark incomplete' : 'Mark complete'}
              />
            </div>
          )}

          <h3 className={`text-white font-semibold text-lg flex-1 line-clamp-2 transition-all duration-200 ${
            task.status === 'COMPLETE' ? 'line-through opacity-60' : ''
          }`}>
            {task.title}
          </h3>
        </div>

        {/* Priority Badge with Glow Effect */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 400 }}
          className={`
            ${task.priority === 'HIGH' ? 'glow-danger' : ''}
            ${task.priority === 'MEDIUM' ? 'glow-warning' : ''}
            ${task.priority === 'LOW' ? 'glow-success' : ''}
          `}
          style={{
            boxShadow:
              task.priority === 'HIGH'
                ? `0 0 10px ${COLORS.accent.danger}50`
                : task.priority === 'MEDIUM'
                ? `0 0 10px ${COLORS.accent.warning}50`
                : task.priority === 'LOW'
                ? `0 0 10px ${COLORS.accent.success}50`
                : 'none',
          }}
        >
          <Badge variant={getPriorityColor(task.priority)} size="sm">
            {task.priority}
          </Badge>
        </motion.div>
      </div>

      {/* Description with Truncation */}
      {task.description && (
        <p
          className="text-sm mb-4 line-clamp-1 truncate"
          style={{
            color: 'var(--text-tertiary)',
            maxWidth: '80%',
          }}
        >
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
            isOverdue ? (
              /* Overdue Date - Pulsing Animation */
              <motion.div
                className="flex items-center gap-2"
                style={{ color: COLORS.accent.danger }}
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                {/* Warning Icon */}
                <span className="text-base" role="img" aria-label="Overdue warning">
                  ⚠️
                </span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium">{formatDueDate(task.due_date)}</span>
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-xs bg-red-500/20 px-2 py-0.5 rounded"
                >
                  Overdue
                </motion.span>
              </motion.div>
            ) : (
              /* Normal Date */
              <div className="flex items-center gap-2 text-white/60">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium">{formatDueDate(task.due_date)}</span>
              </div>
            )
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
