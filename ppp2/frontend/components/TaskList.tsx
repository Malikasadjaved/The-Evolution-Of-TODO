/**
 * TaskList Component
 *
 * Container component that displays a list of tasks.
 * Handles task selection, edit, delete operations.
 *
 * Features:
 * - Empty state when no tasks
 * - Loading state
 * - Error state
 * - Responsive grid/list layout
 * - Integration with TaskItem component
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TaskItem } from '@/components/TaskItem'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import type { Task } from '@/lib/types'

export interface TaskListProps {
  tasks: Task[]
  loading?: boolean
  error?: string | null
  onToggleComplete: (taskId: number) => void
  onEdit: (task: Task) => void
  onDelete: (taskId: number) => void
  isTaskLoading: (taskId: number) => boolean
}

export function TaskList({
  tasks,
  loading = false,
  error = null,
  onToggleComplete,
  onEdit,
  onDelete,
  isTaskLoading,
}: TaskListProps) {
  const [deleteConfirmTask, setDeleteConfirmTask] = useState<Task | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteClick = (task: Task) => {
    setDeleteConfirmTask(task)
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirmTask) return

    setIsDeleting(true)
    try {
      await onDelete(deleteConfirmTask.id)
      setDeleteConfirmTask(null)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    setDeleteConfirmTask(null)
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        <span className="ml-3 text-gray-600">Loading tasks...</span>
      </div>
    )
  }

  // Error state
  if (error) {
    const isAuthError = error.toLowerCase().includes('authentication') || error.toLowerCase().includes('log in')

    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">Error loading tasks</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
            {isAuthError && (
              <div className="mt-4">
                <Link
                  href="/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Go to Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new task.
        </p>
      </div>
    )
  }

  // Task list
  return (
    <>
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={onToggleComplete}
            onEdit={onEdit}
            onDelete={() => handleDeleteClick(task)}
            isLoading={isTaskLoading(task.id)}
          />
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmTask !== null}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Task?"
        message={`Are you sure you want to delete "${deleteConfirmTask?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  )
}
