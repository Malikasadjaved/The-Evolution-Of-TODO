/**
 * StatsGrid Component - Professional Dashboard Stats Cards
 *
 * Modern 4-column grid displaying key metrics:
 * - Total Tasks (blue)
 * - Completed Today (green)
 * - In Progress (amber)
 * - Overdue Tasks (red)
 *
 * Features:
 * - Large 3xl font for numbers
 * - Icon backgrounds with hover state transitions
 * - Trending indicators (up/down arrows)
 * - Color-coded by metric type
 * - Framer Motion stagger animations
 * - Responsive: 4 cols desktop, 2 cols tablet, 1 col mobile
 */

'use client'

import { motion } from 'framer-motion'
import { Task } from '@/types/api'

interface StatsGridProps {
  tasks: Task[] | undefined
}

interface StatCard {
  title: string
  value: number
  icon: React.ReactNode
  gradient: string
  iconBg: string
  iconColor: string
  trendValue?: number
  trendDirection?: 'up' | 'down'
  trendColor?: string
}

export const StatsGrid: React.FC<StatsGridProps> = ({ tasks }) => {
  // Calculate stats
  const totalTasks = tasks?.length || 0
  const completedToday =
    tasks?.filter(
      (task) =>
        task.status === 'COMPLETE' &&
        task.updated_at &&
        new Date(task.updated_at).toDateString() === new Date().toDateString()
    ).length || 0

  const inProgressTasks =
    tasks?.filter(
      (task) =>
        task.status === 'INCOMPLETE' &&
        task.due_date &&
        new Date(task.due_date) >= new Date()
    ).length || 0

  const overdueTasks =
    tasks?.filter(
      (task) =>
        task.status === 'INCOMPLETE' &&
        task.due_date &&
        new Date(task.due_date) < new Date()
    ).length || 0

  const stats: StatCard[] = [
    {
      title: 'Total Tasks',
      value: totalTasks,
      icon: (
        <svg
          className="w-6 h-6"
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
      ),
      gradient: 'from-blue-500/10 to-cyan-500/10',
      iconBg: 'bg-blue-500/10 group-hover:bg-blue-500/20',
      iconColor: 'text-blue-400',
      trendValue: 12,
      trendDirection: 'up',
      trendColor: 'text-green-400',
    },
    {
      title: 'Completed Today',
      value: completedToday,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      gradient: 'from-green-500/10 to-emerald-500/10',
      iconBg: 'bg-green-500/10 group-hover:bg-green-500/20',
      iconColor: 'text-green-400',
      trendValue: 8,
      trendDirection: 'up',
      trendColor: 'text-green-400',
    },
    {
      title: 'In Progress',
      value: inProgressTasks,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      gradient: 'from-amber-500/10 to-yellow-500/10',
      iconBg: 'bg-amber-500/10 group-hover:bg-amber-500/20',
      iconColor: 'text-amber-400',
      trendValue: 5,
      trendDirection: 'down',
      trendColor: 'text-amber-400',
    },
    {
      title: 'Overdue',
      value: overdueTasks,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      gradient: 'from-red-500/10 to-rose-500/10',
      iconBg: 'bg-red-500/10 group-hover:bg-red-500/20',
      iconColor: 'text-red-400',
      trendValue: 2,
      trendDirection: overdueTasks > 0 ? 'up' : 'down',
      trendColor: overdueTasks > 0 ? 'text-red-400' : 'text-green-400',
    },
  ]

  return (
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          className={`
            p-5 rounded-xl
            bg-gradient-to-br ${stat.gradient}
            dark:border-slate-700/50 light:border-gray-200
            border
            hover:border-blue-500/30
            transition-all
            group
            cursor-pointer
            backdrop-blur-sm
          `}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: index * 0.1,
            type: 'spring',
            stiffness: 300,
            damping: 25,
          }}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Icon and Trend Indicator */}
          <div className="flex items-start justify-between mb-3">
            <div
              className={`p-3 ${stat.iconBg} rounded-lg transition-colors duration-300`}
            >
              <div className={stat.iconColor}>{stat.icon}</div>
            </div>

            {/* Trending Arrow */}
            {stat.trendDirection && (
              <motion.svg
                className={`w-4 h-4 ${stat.trendColor}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 + 0.2 }}
                style={{
                  transform:
                    stat.trendDirection === 'down' ? 'rotate(180deg)' : 'none',
                }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </motion.svg>
            )}
          </div>

          {/* Value */}
          <p className="text-3xl font-bold mb-1 dark:text-white light:text-gray-900">
            {stat.value}
          </p>

          {/* Label */}
          <p className="text-sm dark:text-slate-400 light:text-gray-600">
            {stat.title}
          </p>

          {/* Trend Value (optional) */}
          {stat.trendValue && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={`text-xs font-medium ${stat.trendColor}`}
              >
                {stat.trendDirection === 'up' ? '+' : '-'}
                {stat.trendValue}%
              </span>
              <span className="text-xs dark:text-slate-500 light:text-gray-500">
                vs last week
              </span>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  )
}

export default StatsGrid
