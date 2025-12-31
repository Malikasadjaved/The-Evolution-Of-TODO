/**
 * EmptyState Component - Displays when no content is available
 *
 * Features:
 * - Friendly messaging
 * - Call-to-action button
 * - Icon illustrations
 * - Contextual messages based on state
 * - Floating animations for celebration states
 * - CheckmarkSparkles illustration for completed tasks
 */

'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { CheckmarkSparkles } from '@/components/illustrations/CheckmarkSparkles'

interface EmptyStateProps {
  type:
    | 'no-tasks'
    | 'no-search-results'
    | 'no-filtered-tasks'
    | 'completed-empty'
    | 'dashboard-empty'
  onAction?: () => void
  searchQuery?: string
}

export function EmptyState({ type, onAction, searchQuery }: EmptyStateProps) {
  const getContent = () => {
    switch (type) {
      case 'completed-empty':
        return {
          icon: <CheckmarkSparkles className="w-24 h-24" />,
          title: 'All caught up!',
          titleClassName: 'text-lg font-semibold',
          message: 'Complete a task to see it here ✨',
          messageClassName: 'text-sm text-white/50',
          actionLabel: null,
          floating: true,
        }

      case 'dashboard-empty':
        return {
          icon: (
            <svg
              className="w-32 h-32 text-purple-400/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          ),
          title: 'Ready to be productive?',
          titleClassName: 'text-2xl font-bold',
          message: 'Create your first task to get started',
          messageClassName: 'text-base text-white/60',
          actionLabel: 'Add Task',
          floating: false,
        }

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
          titleClassName: 'text-2xl font-semibold',
          message:
            'Get started by creating your first task. Organize your work and boost your productivity!',
          messageClassName: 'text-white/60',
          actionLabel: 'Create Task',
          floating: false,
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
          title: 'No tasks match your search',
          titleClassName: 'text-xl font-semibold',
          message: searchQuery
            ? `No results for "${searchQuery}". Try different keywords.`
            : 'Try different keywords or clear your search.',
          messageClassName: 'text-sm text-white/60',
          actionLabel: 'Clear Search',
          floating: false,
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
          titleClassName: 'text-xl font-semibold',
          message: 'Try adjusting your filters to see more tasks, or create a new task.',
          messageClassName: 'text-white/60',
          actionLabel: 'Clear Filters',
          floating: false,
        }

      default:
        return {
          icon: null,
          title: 'No content',
          titleClassName: 'text-2xl font-semibold',
          message: '',
          messageClassName: 'text-white/60',
          actionLabel: 'Go Back',
          floating: false,
        }
    }
  }

  const content = getContent()

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Icon with optional floating animation */}
      {content.icon && (
        <motion.div
          className="mb-6"
          animate={
            content.floating
              ? {
                  y: [0, -5, 0],
                }
              : {}
          }
          transition={
            content.floating
              ? {
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
              : {}
          }
        >
          {content.icon}
        </motion.div>
      )}

      {/* Title */}
      <h3 className={`text-white mb-3 ${content.titleClassName}`}>{content.title}</h3>

      {/* Message */}
      <p className={`text-center max-w-md mb-8 ${content.messageClassName}`}>
        {content.message}
      </p>

      {/* Action Button */}
      {onAction && content.actionLabel && (
        <Button onClick={onAction} variant="primary">
          {content.actionLabel}
        </Button>
      )}
    </div>
  )
}
