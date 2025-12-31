/**
 * TaskForm Component - Create/Edit Task Modal
 *
 * Features:
 * - Reusable form for creating and editing tasks
 * - All task fields: title, description, priority, due_date, tags, recurrence
 * - Form validation
 * - Loading states
 * - Error handling with toast notifications
 * - Optimistic updates via React Query
 */

'use client'

import { useState, FormEvent, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
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
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)

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

  const isLoading = createTask.isPending || updateTask.isPending

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? 'Edit Task' : 'Create New Task'}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <Input
          label="Title"
          type="text"
          placeholder="Enter task title..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          state={errors.title ? 'error' : 'default'}
          error={errors.title}
          fullWidth
          required
          prefixIcon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          }
        />

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Enter task description..."
            rows={4}
            className={`
              w-full px-4 py-3
              bg-purple-900/50 backdrop-blur-sm
              border ${errors.description ? 'border-red-400' : 'border-purple-400/30'}
              rounded-xl
              text-white placeholder-white/40
              focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20
              transition-all duration-200
              resize-none
            `}
          />
          {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
        </div>

        {/* Priority */}
        <Select
          label="Priority"
          value={priority}
          onChange={(value) => setPriority(value as 'LOW' | 'MEDIUM' | 'HIGH')}
          options={[
            { value: 'LOW', label: 'Low Priority' },
            { value: 'MEDIUM', label: 'Medium Priority' },
            { value: 'HIGH', label: 'High Priority' },
          ]}
          fullWidth
        />

        {/* Due Date */}
        <Input
          label="Due Date"
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          state={errors.dueDate ? 'error' : 'default'}
          error={errors.dueDate}
          fullWidth
          prefixIcon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          }
        />

        {/* Tags */}
        <Input
          label="Tags"
          type="text"
          placeholder="Work, Personal, Urgent (comma-separated)"
          value={tags}
          onChange={e => setTags(e.target.value)}
          fullWidth
          prefixIcon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
          }
        />

        {/* Recurrence */}
        <Select
          label="Recurrence"
          value={recurrence}
          onChange={(value) =>
            setRecurrence(value as 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY')
          }
          options={[
            { value: 'NONE', label: 'No Recurrence' },
            { value: 'DAILY', label: 'Daily' },
            { value: 'WEEKLY', label: 'Weekly' },
            { value: 'MONTHLY', label: 'Monthly' },
            { value: 'YEARLY', label: 'Yearly' },
          ]}
          fullWidth
        />

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
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
        </div>
      </form>
    </Modal>
  )
}
