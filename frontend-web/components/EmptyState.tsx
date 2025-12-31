/**
 * EmptyState Component - Displays when no content is available
 *
 * Features:
 * - Friendly messaging
 * - Call-to-action button
 * - Icon illustrations
 * - Contextual messages based on state
 */

import { Button } from '@/components/ui/Button'

interface EmptyStateProps {
  type: 'no-tasks' | 'no-search-results' | 'no-filtered-tasks'
  onAction?: () => void
  searchQuery?: string
}

export function EmptyState({ type, onAction, searchQuery }: EmptyStateProps) {
  const getContent = () => {
    switch (type) {
      case 'no-tasks':
        return {
          icon: (
            <svg
              className="w-24 h-24 text-purple-400/30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          ),
          title: 'No tasks yet',
          message: 'Get started by creating your first task. Organize your work and boost your productivity!',
          actionLabel: 'Create Task',
        }

      case 'no-search-results':
        return {
          icon: (
            <svg
              className="w-24 h-24 text-purple-400/30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          ),
          title: 'No results found',
          message: searchQuery
            ? `No tasks match "${searchQuery}". Try a different search term.`
            : 'No tasks match your search. Try a different search term.',
          actionLabel: 'Clear Search',
        }

      case 'no-filtered-tasks':
        return {
          icon: (
            <svg
              className="w-24 h-24 text-purple-400/30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
          ),
          title: 'No tasks match filters',
          message: 'Try adjusting your filters to see more tasks, or create a new task.',
          actionLabel: 'Clear Filters',
        }

      default:
        return {
          icon: null,
          title: 'No content',
          message: '',
          actionLabel: 'Go Back',
        }
    }
  }

  const content = getContent()

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Icon */}
      {content.icon && <div className="mb-6">{content.icon}</div>}

      {/* Title */}
      <h3 className="text-white text-2xl font-semibold mb-3">{content.title}</h3>

      {/* Message */}
      <p className="text-white/60 text-center max-w-md mb-8">{content.message}</p>

      {/* Action Button */}
      {onAction && (
        <Button onClick={onAction} variant="primary">
          {content.actionLabel}
        </Button>
      )}
    </div>
  )
}
