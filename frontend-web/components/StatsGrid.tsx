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
 * - Count-up number animations (easeOutQuart)
 * - Icon backgrounds with hover state transitions
 * - Trending indicators (up/down arrows)
 * - Color-coded by metric type
 * - Framer Motion stagger animations
 * - Responsive: 4 cols desktop, 2 cols tablet, 1 col mobile
 * - Respects prefers-reduced-motion
 */

'use client'

import { motion } from 'framer-motion'
import { Task } from '@/types/api'
import { useCountUp } from '@/hooks/useCountUp'

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

  // Animated values (count-up effect)
  const animatedTotal = useCountUp(totalTasks, { duration: 1000 })
  const animatedCompletedToday = useCountUp(completedToday, { duration: 1000 })
  const animatedInProgress = useCountUp(inProgressTasks, { duration: 1000 })
  const animatedOverdue = useCountUp(overdueTasks, { duration: 1000 })

  const stats: StatCard[] = [
    {
      title: 'Total Tasks',
      value: animatedTotal,
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
      gradient: 'indigo',
      iconBg: 'bg-indigo-500/10 group-hover:bg-indigo-500/20',
      iconColor: 'text-indigo-400',
      trendValue: 12,
      trendDirection: 'up',
      trendColor: 'text-green-400',
    },
    {
      title: 'Completed Today',
      value: animatedCompletedToday,
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
      gradient: 'green',
      iconBg: 'bg-green-500/10 group-hover:bg-green-500/20',
      iconColor: 'text-green-400',
      trendValue: 8,
      trendDirection: 'up',
      trendColor: 'text-green-400',
    },
    {
      title: 'In Progress',
      value: animatedInProgress,
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
      gradient: 'amber',
      iconBg: 'bg-amber-500/10 group-hover:bg-amber-500/20',
      iconColor: 'text-amber-400',
      trendValue: 5,
      trendDirection: 'down',
      trendColor: 'text-amber-400',
    },
    {
      title: 'Overdue',
      value: animatedOverdue,
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
      gradient: 'red',
      iconBg: 'bg-red-500/10 group-hover:bg-red-500/20',
      iconColor: 'text-red-400',
      trendValue: 2,
      trendDirection: overdueTasks > 0 ? 'up' : 'down',
      trendColor: overdueTasks > 0 ? 'text-red-400' : 'text-green-400',
    },
  ]

  // Helper function to get gradient overlay CSS variable
  const getGradientOverlay = (gradientType: string) => {
    return `var(--gradient-${gradientType})`
  }

  return (
    <section
      className="p-4 sm:p-6 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6"
      aria-label="Task statistics"
      role="region"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          className="glass-card-hover p-4 sm:p-6 rounded-xl relative overflow-hidden group cursor-pointer min-h-[140px] sm:min-h-[160px]"
          style={{
            background: `${getGradientOverlay(stat.gradient)}, var(--glass-bg)`,
          }}
          role="article"
          aria-label={`${stat.title}: ${Math.round(stat.value)}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: index * 0.1,
            type: 'spring',
            stiffness: 300,
            damping: 25,
          }}
          whileHover={{
            scale: 1.02,
            y: -2,
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
            transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
          }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Icon and Trend Indicator */}
          <div className="flex items-start justify-between mb-2 sm:mb-3 relative z-10">
            <div
              className={`p-2 sm:p-3 ${stat.iconBg} rounded-lg transition-colors duration-300`}
              aria-hidden="true"
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

          {/* Animated Value */}
          <p className="text-2xl sm:text-3xl font-bold mb-1 relative z-10" style={{ color: 'var(--text-primary)' }}>
            {Math.round(stat.value)}
          </p>

          {/* Label */}
          <p className="text-xs sm:text-sm relative z-10" style={{ color: 'var(--text-secondary)' }}>
            {stat.title}
          </p>

          {/* Trend Value */}
          {stat.trendValue && (
            <div className="mt-2 flex items-center gap-1 relative z-10">
              <span className={`text-xs font-medium ${stat.trendColor}`}>
                {stat.trendDirection === 'up' ? '+' : '-'}
                {stat.trendValue}%
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                vs last week
              </span>
            </div>
          )}
        </motion.div>
      ))}
    </section>
  )
}

export default StatsGrid
