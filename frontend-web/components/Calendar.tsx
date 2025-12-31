/**
 * Calendar Widget Component - PROMPT 4 Enhanced
 *
 * Professional calendar with advanced features:
 * - Today's date: Gradient ring + glow effect
 * - Task indicators: Colored dots (max 3 visible)
 * - Date hover: Tooltip with task preview
 * - Enhanced navigation: 32x32px arrows with animations
 * - Date filtering: Click to filter task list
 * - View modes: Month/Week toggle
 * - Deadline warnings: Orange (soon), Red (overdue)
 * - Keyboard navigation: Arrow keys to navigate dates
 * - Smooth Framer Motion animations throughout
 */

'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Task } from '@/types/api'
import { CalendarTooltip } from './CalendarTooltip'
import { WeekView } from './WeekView'

interface CalendarProps {
  tasks?: Task[]
  onDateClick?: (date: Date) => void
  selectedDate?: Date | null
}

type ViewMode = 'month' | 'week'

export function Calendar({ tasks = [], onDateClick, selectedDate }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [hoveredDay, setHoveredDay] = useState<number | null>(null)
  const [focusedDayIndex, setFocusedDayIndex] = useState<number | null>(null)
  const calendarRef = useRef<HTMLDivElement>(null)

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

  // Check if date is overdue
  const isOverdue = (day: number) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dateToCheck = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    )
    dateToCheck.setHours(0, 0, 0, 0)
    return dateToCheck < today
  }

  // Check if date is due soon (within 3 days)
  const isDueSoon = (day: number) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dateToCheck = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    )
    dateToCheck.setHours(0, 0, 0, 0)
    const threeDaysFromNow = new Date(today)
    threeDaysFromNow.setDate(today.getDate() + 3)
    return dateToCheck >= today && dateToCheck <= threeDaysFromNow
  }

  // Keyboard navigation (arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!calendarRef.current?.contains(document.activeElement)) return
      if (focusedDayIndex === null) return

      const calendarDaysCount = calendarDays.length
      let newIndex = focusedDayIndex

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          newIndex = focusedDayIndex > 0 ? focusedDayIndex - 1 : focusedDayIndex
          break
        case 'ArrowRight':
          e.preventDefault()
          newIndex =
            focusedDayIndex < calendarDaysCount - 1
              ? focusedDayIndex + 1
              : focusedDayIndex
          break
        case 'ArrowUp':
          e.preventDefault()
          newIndex = focusedDayIndex >= 7 ? focusedDayIndex - 7 : focusedDayIndex
          break
        case 'ArrowDown':
          e.preventDefault()
          newIndex =
            focusedDayIndex < calendarDaysCount - 7
              ? focusedDayIndex + 7
              : focusedDayIndex
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          const day = calendarDays[focusedDayIndex]
          if (day.isCurrentMonth) {
            handleDateClick(day.day)
          }
          break
      }

      setFocusedDayIndex(newIndex)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [focusedDayIndex]) // Removed calendarDays dependency to fix circular reference

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

  // If week view, render WeekView component
  if (viewMode === 'week') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white/8 backdrop-blur-lg border border-purple-400/20 rounded-xl p-4"
        ref={calendarRef}
      >
        {/* View Toggle */}
        <div className="flex items-center justify-center mb-4">
          <div className="inline-flex items-center bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setViewMode('month')}
              className="px-3 py-1 text-xs font-medium text-white/60 hover:text-white transition-colors rounded-md"
            >
              Month
            </button>
            <motion.button
              layoutId="viewToggle"
              onClick={() => setViewMode('week')}
              className="px-3 py-1 text-xs font-medium text-white bg-purple-500/30 rounded-md"
            >
              Week
            </motion.button>
          </div>
        </div>

        <WeekView tasks={tasks} onDateClick={onDateClick} selectedDate={selectedDate} />
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white/8 backdrop-blur-lg border border-purple-400/20 rounded-xl p-4"
      ref={calendarRef}
    >
      {/* View Toggle */}
      <div className="flex items-center justify-center mb-4">
        <div className="inline-flex items-center bg-white/5 rounded-lg p-1">
          <motion.button
            layoutId="viewToggle"
            onClick={() => setViewMode('month')}
            className="px-3 py-1 text-xs font-medium text-white bg-purple-500/30 rounded-md"
          >
            Month
          </motion.button>
          <button
            onClick={() => setViewMode('week')}
            className="px-3 py-1 text-xs font-medium text-white/60 hover:text-white transition-colors rounded-md"
          >
            Week
          </button>
        </div>
      </div>

      {/* Header with animated navigation */}
      <div className="flex items-center justify-between mb-4">
        {/* Enhanced Navigation Arrow - 32x32px */}
        <motion.button
          whileHover={{ scale: 1.1, x: -3, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
          whileTap={{ scale: 0.9 }}
          onClick={goToPreviousMonth}
          className="min-w-[32px] min-h-[32px] w-8 h-8 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white flex items-center justify-center"
          aria-label="Previous month"
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

        {/* Enhanced Navigation Arrow - 32x32px */}
        <motion.button
          whileHover={{ scale: 1.1, x: 3, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
          whileTap={{ scale: 0.9 }}
          onClick={goToNextMonth}
          className="min-w-[32px] min-h-[32px] w-8 h-8 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white flex items-center justify-center"
          aria-label="Next month"
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
            const isTodayDate = isToday(item.day) && item.isCurrentMonth
            const isSelectedDate = isSelected(item.day) && item.isCurrentMonth
            const hasOverdueTasks = tasksForDay.some(
              (task) => task.status === 'INCOMPLETE' && isOverdue(item.day)
            )
            const hasSoonTasks = tasksForDay.some(
              (task) => task.status === 'INCOMPLETE' && isDueSoon(item.day)
            )

            // Get unique priority dots (max 3)
            const priorityDots: Array<'HIGH' | 'MEDIUM' | 'LOW'> = []
            if (tasksForDay.some((t) => t.priority === 'HIGH')) priorityDots.push('HIGH')
            if (tasksForDay.some((t) => t.priority === 'MEDIUM')) priorityDots.push('MEDIUM')
            if (tasksForDay.some((t) => t.priority === 'LOW')) priorityDots.push('LOW')
            const hasMoreThanThree = tasksForDay.length > 3

            return (
              <motion.div
                key={`${currentDate.getMonth()}-${index}`}
                className="relative"
                onMouseEnter={() => item.isCurrentMonth && setHoveredDay(item.day)}
                onMouseLeave={() => setHoveredDay(null)}
                onFocus={() => {
                  setFocusedDayIndex(index)
                }}
              >
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: 1,
                    scale: isTodayDate ? 1.1 : 1,
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.01, type: 'spring', stiffness: 300 }}
                  whileHover={
                    item.isCurrentMonth
                      ? {
                          scale: 1.15,
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          transition: { duration: 0.2 },
                        }
                      : {}
                  }
                  whileTap={item.isCurrentMonth ? { scale: 0.95 } : {}}
                  onClick={() => item.isCurrentMonth && handleDateClick(item.day)}
                  disabled={!item.isCurrentMonth}
                  className={`
                    aspect-square rounded-lg text-xs font-medium
                    transition-all relative group w-full
                    ${item.isCurrentMonth ? 'text-white cursor-pointer' : 'text-white/20 cursor-default'}
                    ${
                      isTodayDate &&
                      'bg-gradient-to-br from-indigo-600/40 to-purple-600/40 ring-2 ring-[length:2px] shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                    }
                    ${
                      isTodayDate
                        ? 'ring-[image:linear-gradient(135deg,#6366F1,#8B5CF6)]'
                        : ''
                    }
                    ${isSelectedDate && !isTodayDate && 'bg-pink-500/40 ring-2 ring-pink-400/50'}
                    ${
                      hasOverdueTasks &&
                      !isTodayDate &&
                      !isSelectedDate &&
                      'bg-red-500/10 border border-red-500/40'
                    }
                    ${
                      hasSoonTasks &&
                      !hasOverdueTasks &&
                      !isTodayDate &&
                      !isSelectedDate &&
                      'border border-orange-400/30'
                    }
                    ${focusedDayIndex === index && 'ring-2 ring-cyan-400/50'}
                  `}
                  style={
                    isTodayDate
                      ? {
                          background:
                            'linear-gradient(135deg, rgba(99, 102, 241, 0.4), rgba(139, 92, 246, 0.4))',
                          boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)',
                        }
                      : {}
                  }
                  aria-label={`${item.day} ${monthName} ${year}${
                    tasksForDay.length > 0 ? `, ${tasksForDay.length} tasks` : ''
                  }`}
                  tabIndex={item.isCurrentMonth ? 0 : -1}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span>{item.day}</span>

                    {/* Enhanced Task Dots (4px diameter, max 3 + "..." indicator) */}
                    {item.isCurrentMonth && tasksForDay.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-0.5 mt-1"
                      >
                        {priorityDots.slice(0, 3).map((priority, dotIndex) => (
                          <motion.div
                            key={`${priority}-${dotIndex}`}
                            whileHover={{ scale: 1.5 }}
                            className={`w-[4px] h-[4px] rounded-full ${
                              priority === 'HIGH'
                                ? 'bg-red-400'
                                : priority === 'MEDIUM'
                                ? 'bg-amber-400'
                                : 'bg-green-400'
                            }`}
                          />
                        ))}
                        {hasMoreThanThree && (
                          <span className="text-[8px] text-white/60 ml-0.5">...</span>
                        )}
                      </motion.div>
                    )}
                  </div>

                  {/* Overdue Pulse Animation */}
                  {hasOverdueTasks && item.isCurrentMonth && (
                    <motion.div
                      className="absolute inset-0 rounded-lg border-2 border-red-500/60 pointer-events-none"
                      animate={{
                        opacity: [0.5, 1, 0.5],
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  )}
                </motion.button>

                {/* Enhanced Tooltip with Task Preview */}
                {item.isCurrentMonth && hoveredDay === item.day && (
                  <CalendarTooltip
                    tasks={tasksForDay}
                    isVisible={hoveredDay === item.day}
                    position="top"
                  />
                )}
              </motion.div>
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
