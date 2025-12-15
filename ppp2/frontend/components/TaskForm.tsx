/**
 * TaskForm Component
 *
 * Form for creating and editing tasks.
 * Uses React Hook Form with Zod validation.
 *
 * Features:
 * - All task fields (title, description, priority, tags, due date, recurrence)
 * - Tag management with add/remove
 * - Form validation
 * - Loading state
 * - Error messages
 * - Works for both create and edit modes
 */

'use client'

import { useState, KeyboardEvent } from 'react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useTaskForm } from '@/lib/hooks/useTaskForm'
import type { Task } from '@/lib/types'
import type { TaskFormData } from '@/lib/schemas/taskFormSchema'

export interface TaskFormProps {
  task?: Task | null
  onSubmit: (data: TaskFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function TaskForm({ task, onSubmit, onCancel, isLoading = false }: TaskFormProps) {
  const { form, handleSubmit, isEditMode } = useTaskForm({
    task,
    onSubmit,
  })

  const [tagInput, setTagInput] = useState('')
  const tags = form.watch('tags')

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      form.setValue('tags', [...tags, trimmedTag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    form.setValue(
      'tags',
      tags.filter((t) => t !== tagToRemove)
    )
  }

  const handleTagInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <Input
        label="Title"
        {...form.register('title')}
        error={form.formState.errors.title?.message}
        placeholder="Enter task title"
        disabled={isLoading}
        required
      />

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          {...form.register('description')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
          placeholder="Enter task description (optional)"
          disabled={isLoading}
        />
        {form.formState.errors.description && (
          <p className="mt-1 text-sm text-red-600">
            {form.formState.errors.description.message}
          </p>
        )}
      </div>

      {/* Priority */}
      <Select
        label="Priority"
        {...form.register('priority')}
        error={form.formState.errors.priority?.message}
        options={[
          { value: 'HIGH', label: 'High' },
          { value: 'MEDIUM', label: 'Medium' },
          { value: 'LOW', label: 'Low' },
        ]}
        disabled={isLoading}
        required
      />

      {/* Tags */}
      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
          Tags
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            placeholder="Add a tag"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
            disabled={isLoading}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleAddTag}
            disabled={isLoading || !tagInput.trim()}
          >
            Add
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="default"
                onRemove={() => handleRemoveTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Due Date */}
      <Input
        label="Due Date"
        type="date"
        {...form.register('dueDate')}
        error={form.formState.errors.dueDate?.message}
        disabled={isLoading}
      />

      {/* Recurrence */}
      <Select
        label="Recurrence"
        {...form.register('recurrence')}
        options={[
          { value: 'NONE', label: 'None' },
          { value: 'DAILY', label: 'Daily' },
          { value: 'WEEKLY', label: 'Weekly' },
          { value: 'MONTHLY', label: 'Monthly' },
          { value: 'YEARLY', label: 'Yearly' },
        ]}
        disabled={isLoading}
      />

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {isEditMode ? 'Update Task' : 'Create Task'}
        </Button>
      </div>
    </form>
  )
}
