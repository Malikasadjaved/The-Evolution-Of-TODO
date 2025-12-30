/**
 * CalendarTooltip Component - Enhanced Date Preview
 *
 * Professional tooltip for calendar dates showing:
 * - Task count for the date
 * - Preview of first 2-3 tasks (truncated)
 * - "View all →" link for more tasks
 * - Arrow pointer to date
 * - Dark background with glassmorphism
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { Task } from '@/types/api'

interface CalendarTooltipProps {
  tasks: Task[]
  isVisible: boolean
  position?: 'top' | 'bottom'
}

export function CalendarTooltip({
  tasks,
  isVisible,
  position = 'top',
}: CalendarTooltipProps) {
  if (tasks.length === 0) return null

  const displayTasks = tasks.slice(0, 3)
  const hasMore = tasks.length > 3

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: position === 'top' ? 5 : -5, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position === 'top' ? 5 : -5, scale: 0.95 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className={`
            absolute ${position === 'top' ? '-top-2 -translate-y-full' : '-bottom-2 translate-y-full'}
            left-1/2 -translate-x-1/2
            z-50 pointer-events-none
          `}
        >
          {/* Tooltip Container */}
          <div className="relative">
            {/* Arrow Pointer */}
            <div
              className={`
                absolute left-1/2 -translate-x-1/2
                ${position === 'top' ? 'bottom-0 translate-y-full' : 'top-0 -translate-y-full'}
                w-0 h-0
                border-l-[6px] border-l-transparent
                border-r-[6px] border-r-transparent
                ${
                  position === 'top'
                    ? 'border-t-[6px] border-t-gray-900/95'
                    : 'border-b-[6px] border-b-gray-900/95'
                }
              `}
            />

            {/* Tooltip Content */}
            <div className="bg-gray-900/95 backdrop-blur-xl border border-purple-500/30 rounded-lg shadow-2xl shadow-purple-500/20 p-3 min-w-[200px] max-w-[280px]">
              {/* Header */}
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                <div className="w-5 h-5 bg-purple-500/20 rounded-md flex items-center justify-center">
                  <svg
                    className="w-3 h-3 text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-white">
                  {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Task List */}
              <div className="space-y-2">
                {displayTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-2"
                  >
                    {/* Priority Indicator Dot */}
                    <div
                      className={`
                        mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0
                        ${
                          task.priority === 'HIGH'
                            ? 'bg-red-400'
                            : task.priority === 'MEDIUM'
                            ? 'bg-yellow-400'
                            : 'bg-green-400'
                        }
                      `}
                    />

                    {/* Task Title (truncated) */}
                    <p className="text-xs text-white/80 leading-tight truncate">
                      {task.title}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* "View all" link */}
              {hasMore && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-2 pt-2 border-t border-white/10"
                >
                  <div className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors">
                    <span className="font-medium">View all {tasks.length}</span>
                    <svg
                      className="w-3 h-3"
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
                    </svg>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
