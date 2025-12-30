/**
 * DeadlineItem Component - Individual Deadline Display with Quick Actions
 *
 * Features:
 * - Priority dot indicator (6px circle)
 * - Relative time label with color coding
 * - Visual urgency indicators (colored left border)
 * - Quick complete checkbox
 * - Hover state with edit icon
 * - Click to open task detail modal
 * - Fade-out animation on completion
 *
 * Usage:
 * <DeadlineItem
 *   task={task}
 *   onClick={() => handleEditTask(task)}
 *   onToggleComplete={(taskId) => handleToggleStatus(taskId, 'COMPLETE')}
 * />
 */

'use client'

import { motion } from 'framer-motion'
import { Checkbox } from '@/components/ui/Checkbox'
import { formatRelativeTime, getUrgencyBorderColor } from '@/lib/utils/formatRelativeTime'
import { Task } from '@/types/api'
import { useState } from 'react'

interface DeadlineItemProps {
  task: Task
  index?: number // For stagger animation
  onClick: () => void // Open task detail
  onToggleComplete: (taskId: number) => void // Mark complete
}

export function DeadlineItem({
  task,
  index = 0,
  onClick,
  onToggleComplete,
}: DeadlineItemProps) {
  const [isCompleting, setIsCompleting] = useState(false)

  if (!task.due_date) return null

  const { label, color, bgColor, urgency, isCritical } = formatRelativeTime(task.due_date)
  const borderColor = getUrgencyBorderColor(urgency)

  const handleCheckboxToggle = async (checked: boolean) => {
    if (checked) {
      setIsCompleting(true)
      // Delay for animation
      setTimeout(() => {
        onToggleComplete(task.id)
      }, 300)
    }
  }

  // Priority dot color
  const getPriorityDotColor = () => {
    switch (task.priority) {
      case 'HIGH':
        return 'bg-red-500'
      case 'MEDIUM':
        return 'bg-yellow-500'
      case 'LOW':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{
        opacity: isCompleting ? 0 : 1,
        x: isCompleting ? -20 : 0,
        scale: isCompleting ? 0.95 : 1,
      }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
        delay: index * 0.05, // Stagger animation
      }}
      whileHover={{ x: -2, scale: 1.01 }}
      className={`
        relative
        group
        bg-white/5 backdrop-blur-lg
        border border-purple-500/20
        ${borderColor}
        border-l-4
        rounded-xl
        p-4
        hover:bg-white/10
        transition-all
        duration-200
        cursor-pointer
        ${isCritical ? 'animate-pulse' : ''}
        ${bgColor}
      `}
    >
      {/* Main content area - clickable */}
      <div
        onClick={onClick}
        className="flex items-start gap-3 mb-3"
      >
        {/* Priority dot */}
        <div
          className={`
            ${getPriorityDotColor()}
            w-[6px] h-[6px]
            rounded-full
            flex-shrink-0
            mt-2
          `}
          aria-label={`${task.priority} priority`}
        />

        {/* Task title */}
        <h4 className="text-white text-sm font-medium flex-1 truncate group-hover:text-cyan-300 transition-colors">
          {task.title}
        </h4>

        {/* Edit icon (visible on hover) */}
        <svg
          className="w-4 h-4 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      </div>

      {/* Time info and checkbox */}
      <div className="flex items-center justify-between gap-4">
        {/* Time information */}
        <div className="flex items-center gap-2 flex-1">
          {/* Calendar icon */}
          <svg
            className="w-4 h-4 text-gray-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>

          <div className="flex flex-col gap-0.5">
            {/* Relative time (color-coded) */}
            <span className={`text-xs font-medium ${color}`}>
              {label}
            </span>

            {/* Absolute date */}
            <span className="text-xs text-gray-500">
              {new Date(task.due_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Quick complete checkbox */}
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={task.status === 'COMPLETE'}
            onChange={handleCheckboxToggle}
            priority={task.priority}
            aria-label={`Mark "${task.title}" as complete`}
          />
        </div>
      </div>
    </motion.div>
  )
}
