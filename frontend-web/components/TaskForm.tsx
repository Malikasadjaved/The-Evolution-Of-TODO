/**
 * TaskForm Component - Modern Blue/Cyan Glassmorphism Task Modal
 *
 * Professional task creation/editing modal matching dashboard theme:
 * - Blue (#6366F1) to Cyan (#06B6D4) gradient header
 * - Glassmorphism design with backdrop-blur(20px)
 * - Framer Motion animations with spring physics
 * - Priority badges with color-coded visual indicators
 * - 44x44px minimum touch targets for accessibility
 *
 * Features:
 * - All task fields: title, description, priority, due_date, tags, recurrence
 * - Real-time form validation with shake animations
 * - Loading states with spinner
 * - Error handling with toast notifications
 * - Optimistic updates via React Query
 * - Keyboard navigation (ESC to close, Tab order)
 */

'use client'

import { useState, FormEvent, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { useCreateTask, useUpdateTask } from '@/hooks/useTasks'
import type { Task } from '@/types/api'

interface TaskFormProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  task?: Task // If provided, edit mode; otherwise create mode
}

/**
 * Priority Badge Component
 * Visual indicator for task priority with color-coded styling
 */
const PriorityBadge: React.FC<{ priority: 'LOW' | 'MEDIUM' | 'HIGH'; isSelected: boolean }> = ({
  priority,
  isSelected,
}) => {
  const styles = {
    HIGH: {
      bg: isSelected ? 'bg-red-500/30' : 'bg-red-500/10',
      border: 'border-red-400',
      text: 'text-red-400',
      icon: '🔥',
    },
    MEDIUM: {
      bg: isSelected ? 'bg-amber-500/30' : 'bg-amber-500/10',
      border: 'border-amber-400',
      text: 'text-amber-400',
      icon: '⚡',
    },
    LOW: {
      bg: isSelected ? 'bg-green-500/30' : 'bg-green-500/10',
      border: 'border-green-400',
      text: 'text-green-400',
      icon: '✓',
    },
  }

  const style = styles[priority]

  return (
    <div
      className={`
        ${style.bg} ${style.border} ${style.text}
        border rounded-lg px-3 py-2
        transition-all duration-300
        ${isSelected ? 'ring-2 ring-offset-2 ring-offset-[#0f0820] ring-current scale-105' : ''}
      `}
    >
      <span className="mr-2 text-base">{style.icon}</span>
      <span className="font-medium text-sm">{priority}</span>
    </div>
  )
}

export function TaskForm({ isOpen, onClose, userId, task }: TaskFormProps) {
  const { toast } = useToast()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()

  const isEditMode = !!task

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM')
  const [dueDate, setDueDate] = useState('')
  const [tags, setTags] = useState('')
  const [recurrence, setRecurrence] = useState<'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>(
    'NONE'
  )

  // Validation errors
  const [errors, setErrors] = useState<{
    title?: string
    description?: string
    dueDate?: string
  }>({})

  // Initialize form with task data if editing
  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setPriority(task.priority)
      setDueDate(task.due_date || '')
      setTags(task.tags?.join(', ') || '')
      setRecurrence(task.recurrence)
    } else {
      // Reset form for create mode
      setTitle('')
      setDescription('')
      setPriority('MEDIUM')
      setDueDate('')
      setTags('')
      setRecurrence('NONE')
    }
    setErrors({})
  }, [task, isOpen])

  // Validate form
  const validate = (): boolean => {
    const newErrors: {
      title?: string
      description?: string
      dueDate?: string
    } = {}

    if (!title.trim()) {
      newErrors.title = 'Title is required'
    } else if (title.length > 200) {
      newErrors.title = 'Title must be 200 characters or less'
    }

    if (description && description.length > 1000) {
      newErrors.description = 'Description must be 1000 characters or less'
    }

    if (dueDate) {
      const date = new Date(dueDate)
      if (isNaN(date.getTime())) {
        newErrors.dueDate = 'Invalid date format'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    // Parse tags
    const tagArray = tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)

    try {
      if (isEditMode) {
        // Update existing task
        await updateTask.mutateAsync({
          userId,
          taskId: task.id,
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          due_date: dueDate || undefined,
          tags: tagArray.length > 0 ? tagArray : undefined,
          recurrence,
        })
        toast.success('Task updated successfully!')
      } else {
        // Create new task
        await createTask.mutateAsync({
          userId,
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          due_date: dueDate || undefined,
          tags: tagArray.length > 0 ? tagArray : undefined,
          recurrence,
        })
        toast.success('Task created successfully!')
      }

      onClose()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save task'
      toast.error(message)
    }
  }

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const isLoading = createTask.isPending || updateTask.isPending

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            className="relative w-full max-w-2xl bg-white/10 backdrop-blur-xl border border-blue-500/20 rounded-2xl shadow-2xl shadow-cyan-500/20 overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-5 flex items-center justify-between">
              <motion.h2
                className="text-2xl font-bold text-white"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                {isEditMode ? '✏️ Edit Task' : '✨ Create New Task'}
              </motion.h2>

              {/* Close Button - Icon only with 44x44px touch target */}
              <motion.button
                onClick={onClose}
                className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors duration-300"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Close modal"
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </motion.button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Title Input */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter task title..."
                    autoFocus
                    className={`
                      w-full px-4 py-3 pl-11
                      bg-white/5 backdrop-blur-sm
                      border ${errors.title ? 'border-red-400 shake' : 'border-blue-500/20'}
                      rounded-xl
                      text-white placeholder-white/40
                      focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50
                      transition-all duration-300
                    `}
                    required
                  />
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                {errors.title && (
                  <motion.p
                    className="text-red-400 text-sm mt-1 flex items-center gap-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.title}
                  </motion.p>
                )}
              </motion.div>

              {/* Description Textarea */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details about your task..."
                  rows={4}
                  className={`
                    w-full px-4 py-3
                    bg-white/5 backdrop-blur-sm
                    border ${errors.description ? 'border-red-400' : 'border-blue-500/20'}
                    rounded-xl
                    text-white placeholder-white/40
                    focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50
                    transition-all duration-300
                    resize-none
                  `}
                />
                {errors.description && (
                  <p className="text-red-400 text-sm mt-1">{errors.description}</p>
                )}
              </motion.div>

              {/* Priority Selection - Visual Badges */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <label className="block text-sm font-medium text-white/80 mb-3">Priority</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['HIGH', 'MEDIUM', 'LOW'] as const).map((p) => (
                    <motion.button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      <PriorityBadge priority={p} isSelected={priority === p} />
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Due Date */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-sm font-medium text-white/80 mb-2">Due Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={`
                      w-full px-4 py-3 pl-11
                      bg-white/5 backdrop-blur-sm
                      border ${errors.dueDate ? 'border-red-400' : 'border-blue-500/20'}
                      rounded-xl
                      text-white
                      focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50
                      transition-all duration-300
                      [color-scheme:dark]
                    `}
                  />
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                {errors.dueDate && (
                  <p className="text-red-400 text-sm mt-1">{errors.dueDate}</p>
                )}
              </motion.div>

              {/* Tags Input */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <label className="block text-sm font-medium text-white/80 mb-2">Tags</label>
                <div className="relative">
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Work, Personal, Urgent (comma-separated)"
                    className={`
                      w-full px-4 py-3 pl-11
                      bg-white/5 backdrop-blur-sm
                      border border-blue-500/20
                      rounded-xl
                      text-white placeholder-white/40
                      focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50
                      transition-all duration-300
                    `}
                  />
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                </div>
              </motion.div>

              {/* Recurrence Dropdown */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-sm font-medium text-white/80 mb-2">Recurrence</label>
                <select
                  value={recurrence}
                  onChange={(e) =>
                    setRecurrence(
                      e.target.value as 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
                    )
                  }
                  className={`
                    w-full px-4 py-3
                    bg-white/5 backdrop-blur-sm
                    border border-blue-500/20
                    rounded-xl
                    text-white
                    focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50
                    transition-all duration-300
                    cursor-pointer
                  `}
                >
                  <option value="NONE" className="bg-gray-900">
                    No Recurrence
                  </option>
                  <option value="DAILY" className="bg-gray-900">
                    Daily
                  </option>
                  <option value="WEEKLY" className="bg-gray-900">
                    Weekly
                  </option>
                  <option value="MONTHLY" className="bg-gray-900">
                    Monthly
                  </option>
                  <option value="YEARLY" className="bg-gray-900">
                    Yearly
                  </option>
                </select>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                className="flex gap-3 pt-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
              >
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={isLoading}
                  disabled={isLoading}
                >
                  {isLoading
                    ? isEditMode
                      ? 'Updating...'
                      : 'Creating...'
                    : isEditMode
                      ? 'Update Task'
                      : 'Create Task'}
                </Button>
              </motion.div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
