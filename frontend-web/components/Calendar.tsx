/**
 * Calendar Widget Component
 *
 * Modern, interactive calendar with task integration:
 * - Shows current month with date grid
 * - Highlights today's date
 * - Shows colored dots for tasks (by priority)
 * - Click dates to filter tasks
 * - Navigate between months
 * - Glassmorphism styling
 */

'use client'

import { useState, useMemo } from 'react'
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

    // First day of month (0 = Sunday, 1 = Monday, etc.)
    const firstDay = new Date(year, month, 1).getDay()

    // Days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    // Days in previous month
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

    // Next month's leading days (to fill 6 rows)
    const remainingDays = 42 - days.length // 6 rows × 7 days = 42
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        tasks: [],
      })
    }

    return days
  }, [firstDay, daysInMonth, daysInPrevMonth, tasksByDate])

  // Days of week
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="bg-white/8 backdrop-blur-lg border border-purple-400/20 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-center">
          <h4 className="text-white font-semibold text-sm">
            {monthName} {year}
          </h4>
          <button
            onClick={goToToday}
            className="text-purple-400 text-xs hover:text-purple-300 transition-colors"
          >
            Today
          </button>
        </div>

        <button
          onClick={goToNextMonth}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-white/40 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((item, index) => {
          const tasksForDay = item.tasks
          const highPriorityCount = tasksForDay.filter((t) => t.priority === 'HIGH').length
          const mediumPriorityCount = tasksForDay.filter((t) => t.priority === 'MEDIUM').length
          const lowPriorityCount = tasksForDay.filter((t) => t.priority === 'LOW').length

          return (
            <button
              key={index}
              onClick={() => item.isCurrentMonth && handleDateClick(item.day)}
              disabled={!item.isCurrentMonth}
              className={`
                aspect-square rounded-lg text-xs font-medium
                transition-all relative
                ${
                  item.isCurrentMonth
                    ? 'text-white hover:bg-white/10'
                    : 'text-white/20 cursor-default'
                }
                ${isToday(item.day) && item.isCurrentMonth && 'bg-purple-500/40 ring-2 ring-purple-400/50'}
                ${isSelected(item.day) && item.isCurrentMonth && 'bg-pink-500/40 ring-2 ring-pink-400/50'}
              `}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <span>{item.day}</span>

                {/* Task Dots */}
                {item.isCurrentMonth && tasksForDay.length > 0 && (
                  <div className="flex gap-0.5 mt-1">
                    {highPriorityCount > 0 && (
                      <div className="w-1 h-1 rounded-full bg-red-400" />
                    )}
                    {mediumPriorityCount > 0 && (
                      <div className="w-1 h-1 rounded-full bg-yellow-400" />
                    )}
                    {lowPriorityCount > 0 && (
                      <div className="w-1 h-1 rounded-full bg-green-400" />
                    )}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-white/60">High</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="text-white/60">Med</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-white/60">Low</span>
            </div>
          </div>
          <span className="text-white/40">
            {tasks.filter((t) => t.due_date).length} scheduled
          </span>
        </div>
      </div>
    </div>
  )
}
