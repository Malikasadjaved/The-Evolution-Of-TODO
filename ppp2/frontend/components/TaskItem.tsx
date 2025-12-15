/**
 * TaskItem Component
 *
 * Individual task card displaying all task information with interactive controls.
 * Features:
 * - Completion checkbox with optimistic updates
 * - Priority and tag badges
 * - Due date display with overdue indicator
 * - Edit and delete actions
 * - Loading state overlay
 * - Responsive compact mode
 * - Full accessibility support
 */

'use client'

import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { Task } from '@/lib/types'
import { formatDueDate } from '@/lib/utils/date'
import { getPriorityVariant } from '@/lib/utils/priority'
import { clsx } from 'clsx'

export interface TaskItemProps {
  task: Task
  onToggle: (taskId: number) => void
  onEdit: (task: Task) => void
  onDelete: (taskId: number) => void
  isLoading?: boolean
  compact?: boolean
}

export function TaskItem({
  task,
  onToggle,
  onEdit,
  onDelete,
  isLoading = false,
  compact = false,
}: TaskItemProps) {
  const formattedDueDate = formatDueDate(task.due_date)
  const priorityVariant = getPriorityVariant(task.priority)
  const showOverdue = task.is_overdue && !task.completed

  return (
    <article
      role="article"
      aria-label={task.title}
      className={clsx(
        'relative border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow',
        compact ? 'p-2' : 'p-4',
        task.completed && 'opacity-60'
      )}
    >
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center z-10">
          <div
            role="status"
            aria-label="Loading task"
            className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
          />
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          disabled={isLoading}
          aria-label={`Mark task "${task.title}" as complete`}
          className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3
            className={clsx(
              'text-base font-medium text-gray-900',
              task.completed && 'line-through',
              compact ? 'text-sm' : 'text-base'
            )}
          >
            {task.title}
          </h3>

          {/* Description */}
          {task.description && (
            <p
              className={clsx(
                'text-gray-600 mt-1',
                compact ? 'text-xs' : 'text-sm'
              )}
            >
              {task.description}
            </p>
          )}

          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {/* Priority Badge */}
            <Badge variant={priorityVariant}>{task.priority}</Badge>

            {/* Tags */}
            {task.tags.map((tag) => (
              <Badge key={tag} variant="default">
                {tag}
              </Badge>
            ))}

            {/* Overdue Indicator */}
            {showOverdue && (
              <Badge variant="error">Overdue</Badge>
            )}

            {/* Due Date */}
            {formattedDueDate && (
              <span className="text-xs text-gray-500 ml-auto">
                Due: {formattedDueDate}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-start gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(task)}
            disabled={isLoading}
            aria-label="Edit task"
            className="p-1.5"
          >
            <PencilIcon className="h-4 w-4 text-gray-600" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(task.id)}
            disabled={isLoading}
            aria-label="Delete task"
            className="p-1.5"
          >
            <TrashIcon className="h-4 w-4 text-gray-600 hover:text-red-600" />
          </Button>
        </div>
      </div>
    </article>
  )
}
