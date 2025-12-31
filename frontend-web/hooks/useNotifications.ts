/**
 * useNotifications Hook - Browser Notification Management
 *
 * Features:
 * - Request notification permissions
 * - Schedule reminders for tasks due soon (1 hour or 1 day before)
 * - Check for upcoming deadlines periodically (every 5 minutes)
 * - Display browser notifications with task details
 * - Track notification permission state
 *
 * Browser Notification API:
 * - Notification.permission: "granted" | "denied" | "default"
 * - Notification.requestPermission(): Promise<"granted" | "denied">
 * - new Notification(title, options): Display notification
 */

import { useState, useEffect, useCallback } from 'react'
import type { Task } from '@/types/api'

export type NotificationPermission = 'granted' | 'denied' | 'default'

interface UseNotificationsReturn {
  permission: NotificationPermission
  requestPermission: () => Promise<NotificationPermission>
  scheduleReminders: (tasks: Task[]) => void
  checkUpcomingDeadlines: (tasks: Task[]) => void
}

/**
 * Hook for managing browser notifications for task reminders.
 *
 * Features:
 * - Request notification permissions from user
 * - Schedule notifications for tasks due in 1 hour or 1 day
 * - Periodic checks every 5 minutes for upcoming deadlines
 * - Browser notification display with task title and due date
 *
 * @returns {UseNotificationsReturn} Notification functions and state
 *
 * @example
 * const { permission, requestPermission, checkUpcomingDeadlines } = useNotifications()
 *
 * // Request permission on mount
 * useEffect(() => {
 *   if (permission === 'default') {
 *     requestPermission()
 *   }
 * }, [permission])
 *
 * // Check for upcoming deadlines periodically
 * useEffect(() => {
 *   const interval = setInterval(() => {
 *     checkUpcomingDeadlines(tasks)
 *   }, 5 * 60 * 1000) // 5 minutes
 *
 *   return () => clearInterval(interval)
 * }, [tasks])
 */
export function useNotifications(): UseNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission>('default')

  // Initialize permission state from browser
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission as NotificationPermission)
    }
  }, [])

  /**
   * Request notification permission from user.
   *
   * @returns {Promise<NotificationPermission>} Permission state after request
   */
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Notifications not supported in this browser')
      return 'denied'
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result as NotificationPermission)
      return result as NotificationPermission
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return 'denied'
    }
  }, [])

  /**
   * Display a browser notification for a task.
   *
   * @param task - Task to notify about
   * @param timeUntilDue - Human-readable time until due (e.g., "1 hour", "1 day")
   */
  const showNotification = useCallback(
    (task: Task, timeUntilDue: string) => {
      if (permission !== 'granted') {
        return
      }

      if (typeof window === 'undefined' || !('Notification' in window)) {
        return
      }

      try {
        const notification = new Notification(`Task Due ${timeUntilDue}`, {
          body: `${task.title}${task.description ? `: ${task.description}` : ''}`,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `task-${task.id}`, // Prevent duplicate notifications
          requireInteraction: false,
          silent: false,
        })

        // Auto-close after 10 seconds
        setTimeout(() => {
          notification.close()
        }, 10000)

        // Click to navigate to task detail
        notification.onclick = () => {
          window.focus()
          window.location.href = `/dashboard/tasks/${task.id}`
          notification.close()
        }
      } catch (error) {
        console.error('Error showing notification:', error)
      }
    },
    [permission]
  )

  /**
   * Schedule reminders for tasks due soon (1 hour or 1 day).
   *
   * This function is deprecated in favor of checkUpcomingDeadlines.
   * Kept for backward compatibility.
   *
   * @param tasks - List of tasks to check
   */
  const scheduleReminders = useCallback(
    (tasks: Task[]) => {
      checkUpcomingDeadlines(tasks)
    },
    [permission, showNotification]
  )

  /**
   * Check for upcoming deadlines and send notifications.
   *
   * Triggers notifications for:
   * - Tasks due in approximately 1 hour (within 50-70 minutes)
   * - Tasks due in approximately 1 day (within 23-25 hours)
   *
   * @param tasks - List of tasks to check
   */
  const checkUpcomingDeadlines = useCallback(
    (tasks: Task[]) => {
      if (permission !== 'granted') {
        return
      }

      const now = new Date()
      const notifiedTasks = JSON.parse(
        localStorage.getItem('notifiedTasks') || '[]'
      ) as string[]

      tasks.forEach((task) => {
        // Skip completed tasks
        if (task.status === 'COMPLETE') {
          return
        }

        // Skip tasks without due date
        if (!task.due_date) {
          return
        }

        const dueDate = new Date(task.due_date)
        const timeUntilDue = dueDate.getTime() - now.getTime()

        // Convert to minutes
        const minutesUntilDue = Math.floor(timeUntilDue / (1000 * 60))

        // Check if already notified for this task and timeframe
        const notificationKey = `${task.id}-${minutesUntilDue > 60 ? '1day' : '1hour'}`

        if (notifiedTasks.includes(notificationKey)) {
          return
        }

        // Notify if due in approximately 1 hour (50-70 minutes)
        if (minutesUntilDue >= 50 && minutesUntilDue <= 70) {
          showNotification(task, 'in 1 Hour')
          notifiedTasks.push(notificationKey)
          localStorage.setItem('notifiedTasks', JSON.stringify(notifiedTasks))
        }

        // Notify if due in approximately 1 day (23-25 hours)
        else if (minutesUntilDue >= 23 * 60 && minutesUntilDue <= 25 * 60) {
          showNotification(task, 'in 1 Day')
          notifiedTasks.push(notificationKey)
          localStorage.setItem('notifiedTasks', JSON.stringify(notifiedTasks))
        }
      })

      // Clean up old notifications (remove entries for completed/deleted tasks)
      const currentTaskIds = tasks.map((t) => t.id.toString())
      const cleanedNotifications = notifiedTasks.filter((key) => {
        const taskId = key.split('-')[0]
        return currentTaskIds.includes(taskId)
      })
      localStorage.setItem('notifiedTasks', JSON.stringify(cleanedNotifications))
    },
    [permission, showNotification]
  )

  return {
    permission,
    requestPermission,
    scheduleReminders,
    checkUpcomingDeadlines,
  }
}
