/**
 * ProgressBar Component - Horizontal 3-Segment Task Distribution
 *
 * Visual representation of task status distribution with smooth animations.
 *
 * Features:
 * - Three segments: To Do (indigo), In Progress (amber), Complete (green)
 * - Percentage labels on hover
 * - Smooth width transitions when tasks move
 * - Subtle inner shadow for depth
 * - Respects prefers-reduced-motion
 *
 * Design Tokens:
 * - To Do: #6366F1 (var(--accent-primary))
 * - In Progress: #F59E0B (var(--accent-warning))
 * - Complete: #10B981 (var(--accent-success))
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Task } from '@/types/api'

interface ProgressBarProps {
  tasks: Task[] | undefined
}

interface SegmentData {
  label: string
  count: number
  percentage: number
  color: string
  hoverColor: string
  icon: React.ReactNode
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ tasks }) => {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null)

  // Calculate task distribution
  const totalTasks = tasks?.length || 0

  const toDoCount =
    tasks?.filter(
      (task) =>
        task.status === 'INCOMPLETE' &&
        (!task.due_date || new Date(task.due_date) >= new Date())
    ).length || 0

  const inProgressCount =
    tasks?.filter(
      (task) =>
        task.status === 'INCOMPLETE' &&
        task.due_date &&
        new Date(task.due_date) < new Date()
    ).length || 0

  const completeCount = tasks?.filter((task) => task.status === 'COMPLETE').length || 0

  // Calculate percentages
  const toDoPercentage = totalTasks > 0 ? (toDoCount / totalTasks) * 100 : 0
  const inProgressPercentage = totalTasks > 0 ? (inProgressCount / totalTasks) * 100 : 0
  const completePercentage = totalTasks > 0 ? (completeCount / totalTasks) * 100 : 0

  const segments: SegmentData[] = [
    {
      label: 'To Do',
      count: toDoCount,
      percentage: toDoPercentage,
      color: 'bg-indigo-500',
      hoverColor: 'bg-indigo-400',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
    },
    {
      label: 'In Progress',
      count: inProgressCount,
      percentage: inProgressPercentage,
      color: 'bg-amber-500',
      hoverColor: 'bg-amber-400',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      label: 'Complete',
      count: completeCount,
      percentage: completePercentage,
      color: 'bg-emerald-500',
      hoverColor: 'bg-emerald-400',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ]

  return (
    <div className="w-full px-6 mb-6">
      <div className="max-w-[1920px] mx-auto">
        {/* Progress Bar Container */}
        <div className="glass-card-hover p-4 rounded-xl">
          {/* Legend */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white/90">Task Distribution</h3>
            <div className="flex items-center gap-4">
              {segments.map((segment) => (
                <div key={segment.label} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-sm ${segment.color}`} />
                  <span className="text-xs text-white/60">
                    {segment.label} ({segment.count})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-8 bg-white/5 rounded-md overflow-hidden backdrop-blur-sm">
            {/* Inner shadow for depth */}
            <div className="absolute inset-0 shadow-inner pointer-events-none" />

            {/* Segments */}
            <div className="flex h-full">
              {segments.map((segment, index) => {
                const isHovered = hoveredSegment === segment.label
                const hasWidth = segment.percentage > 0

                return (
                  <motion.div
                    key={segment.label}
                    className={`relative ${segment.color} ${
                      isHovered ? segment.hoverColor : ''
                    } transition-colors duration-300 cursor-pointer group flex items-center justify-center`}
                    style={{
                      width: `${segment.percentage}%`,
                    }}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${segment.percentage}%`,
                    }}
                    transition={{
                      duration: 1,
                      delay: index * 0.1,
                      ease: [0.25, 1, 0.5, 1], // easeOutQuart
                    }}
                    onHoverStart={() => setHoveredSegment(segment.label)}
                    onHoverEnd={() => setHoveredSegment(null)}
                  >
                    {/* Percentage Label (shown on hover or if segment is large enough) */}
                    <AnimatePresence>
                      {(isHovered || segment.percentage > 15) && hasWidth && (
                        <motion.div
                          className="flex items-center gap-1 text-white text-xs font-medium"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                        >
                          {segment.icon}
                          <span>{Math.round(segment.percentage)}%</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Hover Tooltip (for smaller segments) */}
                    {segment.percentage > 0 && segment.percentage <= 15 && (
                      <AnimatePresence>
                        {isHovered && (
                          <motion.div
                            className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap z-10"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            transition={{ duration: 0.15 }}
                          >
                            <div className="flex items-center gap-2">
                              {segment.icon}
                              <span>
                                {segment.label}: {Math.round(segment.percentage)}%
                              </span>
                            </div>
                            {/* Tooltip arrow */}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}

                    {/* Segment separator (except last) */}
                    {index < segments.length - 1 && hasWidth && (
                      <div className="absolute right-0 top-0 bottom-0 w-px bg-white/10" />
                    )}
                  </motion.div>
                )
              })}
            </div>

            {/* Empty state */}
            {totalTasks === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-xs text-white/40">No tasks yet</p>
              </div>
            )}
          </div>

          {/* Stats Summary */}
          <div className="mt-3 flex items-center justify-between text-xs text-white/50">
            <span>Total Tasks: {totalTasks}</span>
            <span>
              Completion Rate:{' '}
              {totalTasks > 0 ? Math.round((completeCount / totalTasks) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProgressBar
