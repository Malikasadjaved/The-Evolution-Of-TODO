/**
 * TaskCard Component - Glassmorphism Task Card
 *
 * Features:
 * - Glassmorphic design with purple glow
 * - Priority badge (HIGH/MEDIUM/LOW)
 * - Status badge (INCOMPLETE/IN_PROGRESS/COMPLETE)
 * - Due date with overdue indicator
 * - Hover effect: -translate-y-1 with purple shadow
 * - Click to open task detail modal
 * - Drag and drop support (future)
 */

import { Badge } from '@/components/ui/Badge'
import type { Task } from '@/types/api'

interface TaskCardProps {
  task: Task
  onClick?: () => void
  onDelete?: (task: Task) => void
  onToggleStatus?: (taskId: number, status: 'COMPLETE' | 'INCOMPLETE') => void
}

export function TaskCard({ task, onClick, onDelete, onToggleStatus }: TaskCardProps) {
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

    // Check if today
    if (d.toDateString() === today.toDateString()) {
      return 'Today'
    }

    // Check if tomorrow
    if (d.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    }

    // Format as MMM DD
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Get priority color
  const getPriorityColor = (
    priority: 'LOW' | 'MEDIUM' | 'HIGH'
  ): 'low' | 'medium' | 'high' => {
    return priority.toLowerCase() as 'low' | 'medium' | 'high'
  }

  // Handle delete click (prevent card click)
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(task)
    }
  }

  // Handle checkbox toggle (prevent card click)
  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onToggleStatus) {
      const newStatus = task.status === 'COMPLETE' ? 'INCOMPLETE' : 'COMPLETE'
      onToggleStatus(task.id, newStatus)
    }
  }

  return (
    <div
      onClick={onClick}
      className="
        group
        relative
        bg-white/8 backdrop-blur-lg
        border border-purple-400/20
        rounded-xl
        p-4
        shadow-lg shadow-purple-500/10
        hover:-translate-y-1
        hover:shadow-2xl hover:shadow-purple-500/30
        hover:border-purple-400/40
        transition-all duration-300
        cursor-pointer
      "
    >
      {/* Action Buttons (appear on hover) */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
        {/* View Details Button */}
        <a
          href={`/dashboard/tasks/${task.id}`}
          onClick={(e) => e.stopPropagation()}
          className="
            w-8 h-8
            bg-purple-500/20 hover:bg-purple-500/30
            border border-purple-400/30 hover:border-purple-400/50
            rounded-lg
            flex items-center justify-center
            transition-all duration-200
          "
          aria-label="View details"
        >
          <svg
            className="w-4 h-4 text-purple-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </a>

        {/* Delete Button */}
        {onDelete && (
          <button
            onClick={handleDeleteClick}
            className="
              w-8 h-8
              bg-red-500/20 hover:bg-red-500/30
              border border-red-400/30 hover:border-red-400/50
              rounded-lg
              flex items-center justify-center
              transition-all duration-200
            "
            aria-label="Delete task"
          >
            <svg
              className="w-4 h-4 text-red-400"
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
          </button>
        )}
      </div>
      {/* Header: Checkbox + Title + Priority Badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1">
          {/* Checkbox for toggling status */}
          {onToggleStatus && (
            <button
              onClick={handleToggleClick}
              className="
                mt-0.5 flex-shrink-0
                w-5 h-5
                rounded
                border-2
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-purple-400/50
              "
              style={{
                borderColor: task.status === 'COMPLETE' ? '#a78bfa' : '#9333ea40',
                backgroundColor: task.status === 'COMPLETE' ? '#a78bfa' : 'transparent',
              }}
              aria-label={task.status === 'COMPLETE' ? 'Mark incomplete' : 'Mark complete'}
            >
              {task.status === 'COMPLETE' && (
                <svg
                  className="w-full h-full text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          )}
          {/* Title with strikethrough when complete */}
          <h3
            className={`
              text-white font-semibold text-lg flex-1 line-clamp-2 transition-all duration-200
              ${task.status === 'COMPLETE' ? 'line-through opacity-60' : ''}
            `}
          >
            {task.title}
          </h3>
        </div>
        <Badge variant={getPriorityColor(task.priority)} size="sm">
          {task.priority}
        </Badge>
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
          {task.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-md"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-md">
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer: Due Date + Recurrence + Status */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-purple-400/10">
        {/* Due Date & Recurrence */}
        <div className="flex items-center gap-3">
          {/* Due Date */}
          {task.due_date ? (
            <div
              className={`flex items-center gap-2 ${
                isOverdue ? 'text-red-400' : 'text-white/60'
              }`}
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm font-medium">
                {formatDueDate(task.due_date)}
              </span>
              {isOverdue && (
                <span className="text-xs bg-red-500/20 px-2 py-0.5 rounded">
                  Overdue
                </span>
              )}
            </div>
          ) : (
            <div className="text-white/40 text-sm">No due date</div>
          )}

          {/* Recurrence Indicator */}
          {task.recurrence && task.recurrence !== 'NONE' && (
            <div
              className="flex items-center gap-1.5 text-purple-300"
              title={`Repeats ${task.recurrence.toLowerCase()}`}
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
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

        {/* Status Badge */}
        <Badge
          variant={
            task.status === 'COMPLETE'
              ? 'low'
              : task.status === 'IN_PROGRESS'
                ? 'medium'
                : 'info'
          }
          size="sm"
        >
          {task.status === 'COMPLETE'
            ? '✓ Done'
            : task.status === 'IN_PROGRESS'
              ? 'In Progress'
              : 'To Do'}
        </Badge>
      </div>

      {/* Recurrence Indicator */}
      {task.recurrence && task.recurrence !== 'NONE' && (
        <div className="absolute top-3 left-3">
          <svg
            className="w-4 h-4 text-purple-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  )
}
