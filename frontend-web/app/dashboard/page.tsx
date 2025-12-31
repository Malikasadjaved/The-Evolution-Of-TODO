/**
 * Dashboard Page - Kanban Board
 *
 * Full-featured task management dashboard with:
 * - 2-column Kanban board (INCOMPLETE | COMPLETE)
 * - Task cards with glassmorphism styling
 * - Search and filter functionality
 * - Right sidebar with calendar and upcoming tasks
 * - Create, update, delete tasks
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { SearchBar } from '@/components/SearchBar'
import { SortDropdown } from '@/components/SortDropdown'
import { TaskCard } from '@/components/TaskCard'
import { TaskForm } from '@/components/TaskForm'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { EmptyState } from '@/components/EmptyState'
import { Calendar } from '@/components/Calendar'
import { useAuth } from '@/hooks/useAuth'
import { useTasks, useDeleteTask, useToggleTaskStatus } from '@/hooks/useTasks'
import { useToast } from '@/components/ui/Toast'
import { useNotifications } from '@/hooks/useNotifications'
import type { Task } from '@/types/api'

type ViewMode = 'board' | 'list'
type TaskStatus = 'INCOMPLETE' | 'COMPLETE'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAuth()

  const [viewMode, setViewMode] = useState<ViewMode>('board')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterTags, setFilterTags] = useState<string>('all')
  const [sortField, setSortField] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<string>('asc')

  // Fetch tasks with all filters and sorting (backend filtering)
  const { data: tasks, isLoading: isLoadingTasks } = useTasks(
    user?.id,
    searchQuery,
    filterStatus !== 'all' ? filterStatus : undefined,
    filterPriority !== 'all' ? filterPriority : undefined,
    filterTags !== 'all' ? filterTags : undefined,
    sortField || undefined,
    sortOrder || undefined
  )
  const deleteTask = useDeleteTask()
  const toggleTaskStatus = useToggleTaskStatus()
  const { toast } = useToast()

  // Notifications
  const { permission, requestPermission, checkUpcomingDeadlines } = useNotifications()

  // Task form modal state
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined)

  // Delete confirmation state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<Task | undefined>(undefined)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  // Request notification permission on mount
  useEffect(() => {
    if (isAuthenticated && permission === 'default') {
      requestPermission()
    }
  }, [isAuthenticated, permission, requestPermission])

  // Interval timer: Check for upcoming deadlines every 5 minutes
  useEffect(() => {
    if (!isAuthenticated || !tasks || tasks.length === 0) {
      return
    }

    // Initial check
    checkUpcomingDeadlines(tasks)

    // Set up interval (5 minutes = 300,000ms)
    const interval = setInterval(() => {
      checkUpcomingDeadlines(tasks)
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [isAuthenticated, tasks, checkUpcomingDeadlines])

  // Handler: Open create task modal
  const handleCreateTask = () => {
    setSelectedTask(undefined)
    setIsTaskFormOpen(true)
  }

  // Handler: Open edit task modal
  const handleEditTask = (task: Task) => {
    setSelectedTask(task)
    setIsTaskFormOpen(true)
  }

  // Handler: Close task form modal
  const handleCloseTaskForm = () => {
    setIsTaskFormOpen(false)
    setSelectedTask(undefined)
  }

  // Handler: Open delete confirmation
  const handleDeleteTask = (task: Task) => {
    setTaskToDelete(task)
    setIsDeleteDialogOpen(true)
  }

  // Handler: Confirm delete
  const handleConfirmDelete = async () => {
    if (!taskToDelete || !user) return

    try {
      await deleteTask.mutateAsync({
        userId: user.id,
        taskId: taskToDelete.id,
      })
      toast.success('Task deleted successfully!')
      setIsDeleteDialogOpen(false)
      setTaskToDelete(undefined)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to delete task'
      toast.error(message)
    }
  }

  // Handler: Cancel delete
  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false)
    setTaskToDelete(undefined)
  }

  // Handler: Open Chat Assistant with authentication token
  const handleOpenChatAssistant = () => {
    // Get JWT token from localStorage
    const token = localStorage.getItem('auth_token')

    if (token) {
      // Pass token to chatbot via URL parameter for session sharing
      window.open(`http://localhost:3001?auth_token=${encodeURIComponent(token)}`, '_blank')
    } else {
      // No token - open chatbot and let it handle auth redirect
      window.open('http://localhost:3001', '_blank')
    }
  }

  // Handler: Toggle task status (complete/incomplete)
  const handleToggleStatus = async (
    taskId: number,
    status: 'COMPLETE' | 'INCOMPLETE'
  ) => {
    if (!user) return

    try {
      await toggleTaskStatus.mutateAsync({
        userId: user.id,
        taskId,
        status,
      })
      // toast.success(
      //   status === 'COMPLETE' ? 'Task marked complete!' : 'Task marked incomplete'
      // )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update task status'
      toast.error(message)
    }
  }

  // Show loading state
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mb-4"></div>
          <p className="text-white/60">Loading...</p>
        </div>
      </div>
    )
  }

  // All filtering now handled by backend (search, status, priority, tags)
  const filteredTasks = tasks

  // Group tasks by status
  const incompleteTasks = filteredTasks?.filter(
    (task) => task.status === 'INCOMPLETE'
  )
  const completeTasks = filteredTasks?.filter(
    (task) => task.status === 'COMPLETE'
  )

  // Get unique tags from all tasks
  const allTags = Array.from(
    new Set((tasks || []).flatMap((task) => task.tags || []))
  )

  // Column configuration
  const columns: Array<{
    status: TaskStatus
    title: string
    tasks: Task[] | undefined
    color: string
    dotColor: string
  }> = [
    {
      status: 'INCOMPLETE',
      title: 'To Do',
      tasks: incompleteTasks,
      color: 'border-red-400/30',
      dotColor: 'bg-red-400',
    },
    {
      status: 'COMPLETE',
      title: 'Complete',
      tasks: completeTasks,
      color: 'border-green-400/30',
      dotColor: 'bg-green-400',
    },
  ]

  return (
    <div className="min-h-screen flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-purple-900/80 dark:bg-purple-900/80 backdrop-blur-lg border-b border-purple-400/20 p-4 relative z-50">
          <div className="max-w-[1800px] mx-auto">
            {/* View Mode Tabs + Search + Filters */}
            <div className="flex items-center gap-4 mb-4">
              {/* View Mode Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('board')}
                  className={`
                    px-4 py-2 rounded-lg font-medium transition-all
                    ${
                      viewMode === 'board'
                        ? 'bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow-lg shadow-pink-500/50'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }
                  `}
                >
                  Board
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`
                    px-4 py-2 rounded-lg font-medium transition-all
                    ${
                      viewMode === 'list'
                        ? 'bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow-lg shadow-pink-500/50'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }
                  `}
                >
                  List
                </button>
              </div>

              {/* Search Bar (debounced, backend filtering) */}
              <SearchBar
                onSearchChange={setSearchQuery}
                placeholder="Search tasks..."
                initialValue={searchQuery}
              />

              {/* Filters */}
              <Select
                value={filterPriority}
                onChange={(value) => setFilterPriority(value)}
                options={[
                  { value: 'all', label: 'All Priorities' },
                  { value: 'HIGH', label: 'High Priority' },
                  { value: 'MEDIUM', label: 'Medium Priority' },
                  { value: 'LOW', label: 'Low Priority' },
                ]}
                placeholder="All Priorities"
              />

              {allTags.length > 0 && (
                <Select
                  value={filterTags}
                  onChange={(value) => setFilterTags(value)}
                  options={[
                    { value: 'all', label: 'All Tags' },
                    ...allTags.map((tag) => ({ value: tag, label: tag })),
                  ]}
                  placeholder="All Tags"
                />
              )}

              {/* Sort Dropdown */}
              <SortDropdown
                onSortChange={(sort, order) => {
                  setSortField(sort)
                  setSortOrder(order)
                }}
                initialSort={sortField as any}
                initialOrder={sortOrder as any}
              />

              {/* Clear Filters Button - Show when any filter is active */}
              {(searchQuery || filterStatus !== 'all' || filterPriority !== 'all' || filterTags !== 'all' || sortField) && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearchQuery('')
                    setFilterStatus('all')
                    setFilterPriority('all')
                    setFilterTags('all')
                    setSortField('')
                    setSortOrder('asc')
                  }}
                  className="text-white/60 hover:text-white"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Clear Filters
                </Button>
              )}

              {/* Chat Assistant Button */}
              <button
                onClick={handleOpenChatAssistant}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-blue-600 transition-all shadow-lg shadow-purple-500/30 flex items-center"
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
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                Chat Assistant
              </button>

              {/* Create Task Button */}
              <Button variant="primary" onClick={handleCreateTask}>
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New Task
              </Button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-white/60">Total:</span>
                <span className="text-white font-semibold">
                  {filteredTasks?.length || 0}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/60">To Do:</span>
                <span className="text-red-400 font-semibold">
                  {incompleteTasks?.length || 0}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/60">Complete:</span>
                <span className="text-green-400 font-semibold">
                  {completeTasks?.length || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Blocked Warning */}
        {permission === 'denied' && (
          <div className="bg-red-500/20 border border-red-400/50 backdrop-blur-lg p-4">
            <div className="max-w-[1800px] mx-auto flex items-center gap-3">
              <svg
                className="w-6 h-6 text-red-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex-1">
                <p className="text-red-200 font-medium">
                  Notifications Blocked
                </p>
                <p className="text-red-300/80 text-sm">
                  You won&apos;t receive reminders for upcoming deadlines. Enable notifications in your browser settings to get notified when tasks are due soon.
                </p>
              </div>
              <button
                onClick={requestPermission}
                className="px-4 py-2 bg-red-500/30 hover:bg-red-500/40 border border-red-400/50 text-red-200 rounded-lg transition-all"
              >
                Enable Notifications
              </button>
            </div>
          </div>
        )}

        {/* Kanban Board */}
        {viewMode === 'board' && (
          <div className="flex-1 overflow-x-auto p-6">
            <div className="max-w-[1800px] mx-auto">
              {isLoadingTasks ? (
                <LoadingSkeleton type="board" count={3} />
              ) : tasks && tasks.length === 0 ? (
                <EmptyState
                  type={
                    searchQuery
                      ? 'no-search-results'
                      : filterStatus !== 'all' || filterPriority !== 'all' || filterTags !== 'all'
                      ? 'no-filtered-tasks'
                      : 'no-tasks'
                  }
                  searchQuery={searchQuery}
                  onAction={() => {
                    if (searchQuery) {
                      setSearchQuery('')
                    } else if (filterStatus !== 'all' || filterPriority !== 'all' || filterTags !== 'all') {
                      setFilterStatus('all')
                      setFilterPriority('all')
                      setFilterTags('all')
                    } else {
                      handleCreateTask()
                    }
                  }}
                />
              ) : (
                <div className="grid grid-cols-3 gap-6">
                  {columns.map((column) => (
                    <div key={column.status} className="flex flex-col">
                      {/* Column Header */}
                      <div
                        className={`
                        bg-white/8 backdrop-blur-lg
                        border ${column.color}
                        rounded-xl p-4 mb-4
                      `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-3 h-3 rounded-full ${column.dotColor}`}
                            ></div>
                            <h2 className="text-white font-semibold text-lg">
                              {column.title}
                            </h2>
                            <span className="text-white/60 text-sm">
                              {column.tasks?.length || 0}
                            </span>
                          </div>
                          <button className="text-white/60 hover:text-white transition-colors">
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Task Cards */}
                      <div className="space-y-4 flex-1">
                        {column.tasks?.length === 0 ? (
                          <div className="bg-white/5 backdrop-blur-lg border border-purple-400/10 rounded-xl p-8 text-center">
                            <p className="text-white/40 text-sm">
                              No tasks in this column
                            </p>
                          </div>
                        ) : (
                          column.tasks?.map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              onClick={() => handleEditTask(task)}
                              onDelete={handleDeleteTask}
                              onToggleStatus={handleToggleStatus}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white/8 backdrop-blur-lg border border-purple-400/20 rounded-xl p-6">
                <p className="text-white/60 text-center">
                  List view coming soon...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="w-[320px] bg-purple-900/60 backdrop-blur-lg border-l border-purple-400/20 p-6 overflow-y-auto">
        {/* User Profile */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-orange-400 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {user.name?.[0]?.toUpperCase() ||
                  user.email[0]?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold">
                {user.name || user.email}
              </h3>
              <p className="text-white/60 text-sm">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="mb-8">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-purple-400"
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
            Calendar
          </h3>
          <Calendar tasks={tasks} />
        </div>

        {/* Upcoming Tasks */}
        <div>
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Upcoming
          </h3>
          <div className="space-y-3">
            {tasks
              ?.filter(
                (task) =>
                  task.due_date &&
                  task.status !== 'COMPLETE' &&
                  new Date(task.due_date) >= new Date()
              )
              .sort(
                (a, b) =>
                  new Date(a.due_date!).getTime() -
                  new Date(b.due_date!).getTime()
              )
              .slice(0, 5)
              .map((task) => (
                <div
                  key={task.id}
                  className="bg-white/8 backdrop-blur-lg border border-purple-400/20 rounded-lg p-3 hover:bg-white/12 transition-colors cursor-pointer"
                >
                  <p className="text-white text-sm font-medium mb-1">
                    {task.title}
                  </p>
                  <p className="text-white/60 text-xs">
                    {new Date(task.due_date!).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              ))}
            {(!tasks ||
              tasks.filter(
                (task) =>
                  task.due_date &&
                  task.status !== 'COMPLETE' &&
                  new Date(task.due_date) >= new Date()
              ).length === 0) && (
              <div className="bg-white/8 backdrop-blur-lg border border-purple-400/20 rounded-lg p-6 text-center">
                <p className="text-white/40 text-sm">No upcoming tasks</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Form Modal */}
      {user && (
        <TaskForm
          isOpen={isTaskFormOpen}
          onClose={handleCloseTaskForm}
          userId={user.id}
          task={selectedTask}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteTask.isPending}
      />
    </div>
  )
}
