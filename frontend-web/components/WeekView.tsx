/**
 * WeekView Component - Horizontal Weekly Calendar
 *
 * Weekly calendar view showing:
 * - 7 days horizontally (current week)
 * - More task detail per day
 * - Time blocks if tasks have specific times
 * - Smooth slide animation when changing weeks
 */

'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Task } from '@/types/api'

interface WeekViewProps {
  tasks?: Task[]
  onDateClick?: (date: Date) => void
  selectedDate?: Date | null
}

export function WeekView({ tasks = [], onDateClick, selectedDate }: WeekViewProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day
    return new Date(today.getFullYear(), today.getMonth(), diff)
  })

  // Generate week days
  const weekDays = useMemo(() => {
    const days: Array<{
      date: Date
      dayName: string
      dayNumber: number
      isToday: boolean
      tasks: Task[]
    }> = []

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart)
      date.setDate(currentWeekStart.getDate() + i)
      date.setHours(0, 0, 0, 0)

      const dateKey = date.toISOString().split('T')[0]
      const dayTasks = tasks.filter((task) => {
        if (!task.due_date) return false
        const taskDate = new Date(task.due_date)
        taskDate.setHours(0, 0, 0, 0)
        return taskDate.toISOString().split('T')[0] === dateKey
      })

      days.push({
        date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        isToday: date.getTime() === today.getTime(),
        tasks: dayTasks,
      })
    }

    return days
  }, [currentWeekStart, tasks])

  // Navigation
  const goToPreviousWeek = () => {
    setCurrentWeekStart((prev) => {
      const newDate = new Date(prev)
      newDate.setDate(prev.getDate() - 7)
      return newDate
    })
  }

  const goToNextWeek = () => {
    setCurrentWeekStart((prev) => {
      const newDate = new Date(prev)
      newDate.setDate(prev.getDate() + 7)
      return newDate
    })
  }

  const goToCurrentWeek = () => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day
    setCurrentWeekStart(new Date(today.getFullYear(), today.getMonth(), diff))
  }

  // Check if date is selected
  const isSelected = (date: Date) => {
    if (!selectedDate) return false
    const dateKey = date.toISOString().split('T')[0]
    const selectedKey = selectedDate.toISOString().split('T')[0]
    return dateKey === selectedKey
  }

  // Check if date is overdue
  const isOverdue = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  // Check if date is soon (within 3 days)
  const isDueSoon = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const threeDaysFromNow = new Date(today)
    threeDaysFromNow.setDate(today.getDate() + 3)
    return date >= today && date <= threeDaysFromNow
  }

  // Get week range display
  const weekRangeDisplay = useMemo(() => {
    const start = weekDays[0]?.date
    const end = weekDays[6]?.date
    if (!start || !end) return ''

    const startMonth = start.toLocaleDateString('en-US', { month: 'short' })
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' })

    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`
    } else {
      return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${start.getFullYear()}`
    }
  }, [weekDays])

  return (
    <div className="space-y-4">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between">
        <motion.button
          whileHover={{ scale: 1.1, x: -2 }}
          whileTap={{ scale: 0.9 }}
          onClick={goToPreviousWeek}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white min-h-[32px] min-w-[32px] flex items-center justify-center"
          aria-label="Previous week"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </motion.button>

        <div className="text-center">
          <motion.p
            key={weekRangeDisplay}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white font-semibold text-sm"
          >
            {weekRangeDisplay}
          </motion.p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={goToCurrentWeek}
            className="text-purple-400 text-xs hover:text-purple-300 transition-colors"
          >
            This Week
          </motion.button>
        </div>

        <motion.button
          whileHover={{ scale: 1.1, x: 2 }}
          whileTap={{ scale: 0.9 }}
          onClick={goToNextWeek}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white min-h-[32px] min-w-[32px] flex items-center justify-center"
          aria-label="Next week"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </motion.button>
      </div>

      {/* Week Days Grid */}
      <div className="grid grid-cols-7 gap-2">
        <AnimatePresence mode="popLayout">
          {weekDays.map((day, index) => {
            const hasOverdueTasks = day.tasks.some(
              (task) => task.status === 'INCOMPLETE' && isOverdue(day.date)
            )
            const hasSoonTasks = day.tasks.some(
              (task) => task.status === 'INCOMPLETE' && isDueSoon(day.date)
            )

            return (
              <motion.button
                key={`${currentWeekStart.getTime()}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05, type: 'spring', stiffness: 300 }}
                onClick={() => onDateClick?.(day.date)}
                className={`
                  relative rounded-xl p-3 transition-all
                  ${day.isToday ? 'bg-gradient-to-br from-indigo-600/40 to-purple-600/40 ring-2 ring-indigo-400/50 shadow-lg shadow-indigo-500/30' : 'bg-white/5 hover:bg-white/10'}
                  ${isSelected(day.date) ? 'ring-2 ring-pink-400/50 bg-pink-500/20' : ''}
                  ${hasOverdueTasks && !day.isToday ? 'bg-red-500/10 border border-red-500/30' : ''}
                  ${hasSoonTasks && !hasOverdueTasks && !day.isToday ? 'border border-orange-400/30' : ''}
                `}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Day Name & Number */}
                <div className="text-center mb-2">
                  <p className="text-xs text-white/60 font-medium">{day.dayName}</p>
                  <p
                    className={`text-lg font-bold ${
                      day.isToday ? 'text-white' : 'text-white/80'
                    }`}
                  >
                    {day.dayNumber}
                  </p>
                </div>

                {/* Task Count Badge */}
                {day.tasks.length > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center"
                  >
                    <span className="text-xs font-bold text-white">
                      {day.tasks.length}
                    </span>
                  </motion.div>
                )}

                {/* Task Dots (Priority Indicators) */}
                {day.tasks.length > 0 && (
                  <div className="flex justify-center gap-1">
                    {day.tasks
                      .slice(0, 3)
                      .map((task) => (
                        <div
                          key={task.id}
                          className={`w-1.5 h-1.5 rounded-full ${
                            task.priority === 'HIGH'
                              ? 'bg-red-400'
                              : task.priority === 'MEDIUM'
                              ? 'bg-yellow-400'
                              : 'bg-green-400'
                          }`}
                        />
                      ))}
                    {day.tasks.length > 3 && (
                      <span className="text-xs text-white/60">...</span>
                    )}
                  </div>
                )}

                {/* Today Indicator */}
                {day.isToday && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-400 rounded-full shadow-lg shadow-indigo-400/50" />
                )}
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
