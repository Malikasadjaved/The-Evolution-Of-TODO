/**
 * Calendar Widget Component - Enhanced with Framer Motion
 *
 * Modern, interactive calendar with task integration:
 * - Animated month transitions
 * - Hover effects and tooltips
 * - Task indicators with priority colors
 * - Smooth entry/exit animations
 * - Professional glassmorphism styling
 */

'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Task } from '@/types/api'

interface CalendarProps {
  tasks?: Task[]
  onDateClick?: (date: Date) => void
  selectedDate?: Date | null
}

export function Calendar({ tasks = [], onDateClick, selectedDate }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  // Get calendar data
  const { monthName, year, firstDay, daysInMonth, daysInPrevMonth } = useMemo(() => {
    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long' })
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    return { monthName, year, firstDay, daysInMonth, daysInPrevMonth }
  }, [currentDate])

  // Get tasks by date
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>()

    tasks.forEach((task) => {
      if (task.due_date) {
        const dateKey = new Date(task.due_date).toISOString().split('T')[0]
        if (!map.has(dateKey)) {
          map.set(dateKey, [])
        }
        map.get(dateKey)!.push(task)
      }
    })

    return map
  }, [tasks])

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    )
  }

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    )
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Check if date is today
  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    )
  }

  // Check if date is selected
  const isSelected = (day: number) => {
    if (!selectedDate) return false
    return (
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    )
  }

  // Get tasks for a specific date
  const getTasksForDate = (day: number) => {
    const dateKey = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    )
      .toISOString()
      .split('T')[0]
    return tasksByDate.get(dateKey) || []
  }

  // Handle date click
  const handleDateClick = (day: number) => {
    const clickedDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    )
    onDateClick?.(clickedDate)
  }

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: Array<{
      day: number
      isCurrentMonth: boolean
      tasks: Task[]
    }> = []

    // Previous month's trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        tasks: [],
      })
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        tasks: getTasksForDate(day),
      })
    }

    // Next month's leading days
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        tasks: [],
      })
    }

    return days
  }, [firstDay, daysInMonth, daysInPrevMonth, tasksByDate])

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white/8 backdrop-blur-lg border border-purple-400/20 rounded-xl p-4"
    >
      {/* Header with animated navigation */}
      <div className="flex items-center justify-between mb-4">
        <motion.button
          whileHover={{ scale: 1.1, x: -2 }}
          whileTap={{ scale: 0.9 }}
          onClick={goToPreviousMonth}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </motion.button>

        <div className="text-center">
          <motion.h4
            key={`${monthName}-${year}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="text-white font-semibold text-sm"
          >
            {monthName} {year}
          </motion.h4>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={goToToday}
            className="text-purple-400 text-xs hover:text-purple-300 transition-colors"
          >
            Today
          </motion.button>
        </div>

        <motion.button
          whileHover={{ scale: 1.1, x: 2 }}
          whileTap={{ scale: 0.9 }}
          onClick={goToNextMonth}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </motion.button>
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, index) => (
          <motion.div
            key={day}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
            className="text-center text-xs font-medium text-white/40 py-1"
          >
            {day}
          </motion.div>
        ))}
      </div>

      {/* Calendar Days with animations */}
      <div className="grid grid-cols-7 gap-1">
        <AnimatePresence mode="popLayout">
          {calendarDays.map((item, index) => {
            const tasksForDay = item.tasks
            const highPriorityCount = tasksForDay.filter((t) => t.priority === 'HIGH').length
            const mediumPriorityCount = tasksForDay.filter((t) => t.priority === 'MEDIUM').length
            const lowPriorityCount = tasksForDay.filter((t) => t.priority === 'LOW').length

            return (
              <motion.button
                key={`${currentDate.getMonth()}-${index}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.01, type: 'spring', stiffness: 300 }}
                whileHover={item.isCurrentMonth ? {
                  scale: 1.15,
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  transition: { duration: 0.2 }
                } : {}}
                whileTap={item.isCurrentMonth ? { scale: 0.95 } : {}}
                onClick={() => item.isCurrentMonth && handleDateClick(item.day)}
                disabled={!item.isCurrentMonth}
                className={`
                  aspect-square rounded-lg text-xs font-medium
                  transition-all relative group
                  ${item.isCurrentMonth ? 'text-white' : 'text-white/20 cursor-default'}
                  ${isToday(item.day) && item.isCurrentMonth && 'bg-purple-500/40 ring-2 ring-purple-400/50'}
                  ${isSelected(item.day) && item.isCurrentMonth && 'bg-pink-500/40 ring-2 ring-pink-400/50'}
                `}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span>{item.day}</span>

                  {/* Animated Task Dots */}
                  {item.isCurrentMonth && tasksForDay.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex gap-0.5 mt-1"
                    >
                      {highPriorityCount > 0 && (
                        <motion.div
                          whileHover={{ scale: 1.5 }}
                          className="w-1 h-1 rounded-full bg-red-400"
                        />
                      )}
                      {mediumPriorityCount > 0 && (
                        <motion.div
                          whileHover={{ scale: 1.5 }}
                          className="w-1 h-1 rounded-full bg-yellow-400"
                        />
                      )}
                      {lowPriorityCount > 0 && (
                        <motion.div
                          whileHover={{ scale: 1.5 }}
                          className="w-1 h-1 rounded-full bg-green-400"
                        />
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Tooltip on hover */}
                {item.isCurrentMonth && tasksForDay.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    className="absolute -top-8 left-1/2 -translate-x-1/2 bg-purple-900/95 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {tasksForDay.length} task{tasksForDay.length > 1 ? 's' : ''}
                  </motion.div>
                )}
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Legend with pulse animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 pt-4 border-t border-white/10"
      >
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-1"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-red-400"
              />
              <span className="text-white/60">High</span>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-1"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                className="w-2 h-2 rounded-full bg-yellow-400"
              />
              <span className="text-white/60">Med</span>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-1"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
                className="w-2 h-2 rounded-full bg-green-400"
              />
              <span className="text-white/60">Low</span>
            </motion.div>
          </div>
          <span className="text-white/40">
            {tasks.filter((t) => t.due_date).length} scheduled
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}
