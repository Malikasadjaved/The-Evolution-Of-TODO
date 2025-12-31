/**
 * Task Detail Page
 *
 * Displays full details of a single task including:
 * - Title and description
 * - Priority and status
 * - Due date and completion date
 * - Tags
 * - Actions: Edit, Delete, Toggle Status
 */

'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import { useTask, useDeleteTask, useToggleTaskStatus } from '@/hooks/useTasks'
import { useToast } from '@/components/ui/Toast'
import { TaskForm } from '@/components/TaskForm'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useState } from 'react'
import type { Task } from '@/types/api'

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth()
  const taskId = parseInt(params.id as string)
  const { data: task, isLoading: isTaskLoading } = useTask(user?.id, taskId)
  const deleteTask = useDeleteTask()
  const toggleTaskStatus = useToggleTaskStatus()
  const { toast } = useToast()

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthLoading, isAuthenticated, router])

  // Handler: Delete task
  const handleDelete = async () => {
    if (!user || !task) return

    try {
      await deleteTask.mutateAsync({
        userId: user.id,
        taskId: task.id,
      })
      toast.success('Task deleted successfully!')
      router.push('/dashboard')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to delete task'
      toast.error(message)
    }
  }

  // Handler: Toggle status
  const handleToggleStatus = async () => {
    if (!user || !task) return

    const newStatus = task.status === 'COMPLETE' ? 'INCOMPLETE' : 'COMPLETE'

    try {
      await toggleTaskStatus.mutateAsync({
        userId: user.id,
        taskId: task.id,
        status: newStatus,
      })
      toast.success(
        newStatus === 'COMPLETE' ? 'Task marked complete!' : 'Task marked incomplete'
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update task status'
      toast.error(message)
    }
  }

  // Format date for display
  const formatDate = (date: string | null): string => {
    if (!date) return 'Not set'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Format datetime for display
  const formatDateTime = (date: string | null): string => {
    if (!date) return 'Not set'
    return new Date(date).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  // Get priority color
  const getPriorityColor = (
    priority: 'LOW' | 'MEDIUM' | 'HIGH'
  ): 'low' | 'medium' | 'high' => {
    return priority.toLowerCase() as 'low' | 'medium' | 'high'
  }

  // Loading state
  if (isAuthLoading || isTaskLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mb-4"></div>
          <p className="text-white/60">Loading task...</p>
        </div>
      </div>
    )
  }

  // Task not found
  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Task Not Found</h1>
          <p className="text-white/60 mb-8">The task you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="text-white/80 hover:text-white"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </Button>
        </div>

        {/* Task Detail Card */}
        <div className="bg-white/10 backdrop-blur-lg border border-purple-400/20 rounded-2xl p-8 shadow-2xl shadow-purple-500/20">
          {/* Title and Priority */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <h1
              className={`text-4xl font-bold text-white flex-1 ${
                task.status === 'COMPLETE' ? 'line-through opacity-60' : ''
              }`}
            >
              {task.title}
            </h1>
            <Badge variant={getPriorityColor(task.priority)} size="lg">
              {task.priority} Priority
            </Badge>
          </div>

          {/* Status Badge */}
          <div className="mb-6">
            <Badge
              variant={
                task.status === 'COMPLETE'
                  ? 'low'
                  : task.status === 'IN_PROGRESS'
                    ? 'medium'
                    : 'info'
              }
              size="lg"
            >
              {task.status === 'COMPLETE'
                ? '✓ Complete'
                : task.status === 'IN_PROGRESS'
                  ? 'In Progress'
                  : 'Incomplete'}
            </Badge>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-3">Description</h2>
            <p className="text-white/70 text-lg whitespace-pre-wrap">
              {task.description || 'No description provided.'}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Due Date */}
            <div>
              <h3 className="text-sm font-medium text-white/50 mb-2">Due Date</h3>
              <p className="text-white text-lg">{formatDate(task.due_date)}</p>
            </div>

            {/* Completion Date */}
            <div>
              <h3 className="text-sm font-medium text-white/50 mb-2">Completed At</h3>
              <p className="text-white text-lg">{formatDateTime(task.completed_at)}</p>
            </div>

            {/* Created Date */}
            <div>
              <h3 className="text-sm font-medium text-white/50 mb-2">Created</h3>
              <p className="text-white text-lg">{formatDateTime(task.created_at)}</p>
            </div>

            {/* Updated Date */}
            <div>
              <h3 className="text-sm font-medium text-white/50 mb-2">Last Updated</h3>
              <p className="text-white text-lg">{formatDateTime(task.updated_at)}</p>
            </div>
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-white/50 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-purple-500/20 text-purple-300 text-sm rounded-lg border border-purple-400/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 pt-6 border-t border-purple-400/20">
            <Button
              onClick={handleToggleStatus}
              variant={task.status === 'COMPLETE' ? 'secondary' : 'primary'}
            >
              {task.status === 'COMPLETE' ? 'Mark Incomplete' : 'Mark Complete'}
            </Button>
            <Button onClick={() => setIsEditModalOpen(true)} variant="secondary">
              Edit Task
            </Button>
            <Button onClick={() => setIsDeleteDialogOpen(true)} variant="danger">
              Delete Task
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <TaskForm
          task={task}
          onClose={() => setIsEditModalOpen(false)}
          userId={user.id}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && (
        <ConfirmDialog
          title="Delete Task"
          message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setIsDeleteDialogOpen(false)}
        />
      )}
    </div>
  )
}
