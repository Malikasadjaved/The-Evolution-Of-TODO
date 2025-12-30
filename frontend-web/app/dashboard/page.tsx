/**
 * Dashboard Page - Professional Blue Tech Design
 *
 * Master-level dashboard with:
 * - Modern glassmorphism UI matching landing page
 * - Comprehensive task management (CRUD operations)
 * - Advanced search, filters, and sorting
 * - Interactive Kanban board with drag-drop ready
 * - Calendar integration with task indicators
 * - Real-time stats and analytics
 * - Smooth Framer Motion animations
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { SearchBar } from '@/components/SearchBar'
import { PremiumSearchBar } from '@/components/PremiumSearchBar'
import { SortDropdown } from '@/components/SortDropdown'
import { TaskCard } from '@/components/TaskCard'
import { TaskForm } from '@/components/TaskForm'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { EmptyState } from '@/components/EmptyState'
import { Calendar } from '@/components/Calendar'
import { UserMenu } from '@/components/UserMenu'
import { ChatBox } from '@/components/ChatBox'
import { CommandPalette } from '@/components/CommandPalette'
import { FABGroup } from '@/components/FABGroup'
import { StatsGrid } from '@/components/StatsGrid'
import { useAuth } from '@/hooks/useAuth'
import { useTasks, useDeleteTask, useToggleTaskStatus } from '@/hooks/useTasks'
import { useToast } from '@/components/ui/Toast'
import { useNotifications } from '@/hooks/useNotifications'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
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
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true)

  // Command palette and chatbox state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isChatBoxOpen, setIsChatBoxOpen] = useState(false)
  const chatBoxRef = useRef<{ toggleChat: () => void } | null>(null)

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

  // Handler: Open Chat Assistant in new tab (legacy - now integrated)
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
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update task status'
      toast.error(message)
    }
  }

  // Handler: Apply filter from command palette
  const handleApplyFilter = (filter: { type: string; value: string }) => {
    if (filter.type === 'priority') {
      setFilterPriority(filter.value)
    } else if (filter.type === 'status') {
      setFilterStatus(filter.value)
    }
  }

  // Handler: Open chatbox programmatically
  const handleOpenChatBox = () => {
    setIsChatBoxOpen((prev) => !prev)
  }

  // Handler: ChatBox toggle callback
  const handleChatBoxToggle = (isOpen: boolean) => {
    setIsChatBoxOpen(isOpen)
  }

  // Setup global keyboard shortcuts
  useKeyboardShortcuts({
    onOpenCommandPalette: () => {
      // Command palette has its own keyboard handling (Cmd+K)
      // This is just for consistency
    },
    onNewTask: handleCreateTask,
    onOpenAIChat: handleOpenChatBox,
    onEscape: () => {
      setIsTaskFormOpen(false)
      setIsDeleteDialogOpen(false)
    },
  })

  // Show loading state
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mb-4"></div>
          <p className="text-white/60">Loading your workspace...</p>
        </motion.div>
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

  // Calculate productivity stats
  const totalTasks = filteredTasks?.length || 0
  const completedToday = filteredTasks?.filter(
    (task) =>
      task.status === 'COMPLETE' &&
      task.updated_at &&
      new Date(task.updated_at).toDateString() === new Date().toDateString()
  ).length || 0
  const completionRate =
    totalTasks > 0 ? Math.round((completeTasks?.length || 0) / totalTasks * 100) : 0

  // Column configuration
  const columns: Array<{
    status: TaskStatus
    title: string
    tasks: Task[] | undefined
    gradient: string
    iconColor: string
    icon: React.ReactNode
  }> = [
    {
      status: 'INCOMPLETE',
      title: 'To Do',
      tasks: incompleteTasks,
      gradient: 'from-blue-500/10 to-cyan-500/10',
      iconColor: 'text-blue-400',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      ),
    },
    {
      status: 'COMPLETE',
      title: 'Complete',
      tasks: completeTasks,
      gradient: 'from-green-500/10 to-emerald-500/10',
      iconColor: 'text-green-400',
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
    },
  ]

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 dark:from-slate-900 dark:via-blue-950 dark:to-slate-900 light:from-gray-50 light:via-blue-50 light:to-gray-50 transition-colors duration-500">
      {/* AI Tech Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Gradient Mesh - Animated Floating Orbs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/20 dark:bg-blue-500/20 light:bg-blue-400/15 rounded-full blur-3xl animate-floating-orbs" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-cyan-500/15 dark:bg-cyan-500/15 light:bg-cyan-400/10 rounded-full blur-3xl animate-floating-orbs" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 dark:bg-purple-500/10 light:bg-purple-400/8 rounded-full blur-3xl animate-floating-orbs" style={{ animationDelay: '4s' }} />

        {/* Scanline Effect (subtle) */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-2 animate-scanline opacity-30" />

        {/* Neural Network Grid Pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03] dark:opacity-[0.03] light:opacity-[0.02]">
          <defs>
            <pattern id="neural-grid" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="50" cy="50" r="1.5" fill="currentColor" className="text-cyan-400" />
              <line x1="50" y1="50" x2="100" y2="0" stroke="currentColor" strokeWidth="0.5" className="text-cyan-400/50" />
              <line x1="50" y1="50" x2="0" y2="100" stroke="currentColor" strokeWidth="0.5" className="text-cyan-400/50" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#neural-grid)" />
        </svg>

        {/* Data Stream Effect - Vertical Lines */}
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute w-px h-32 bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent animate-data-stream"
            style={{
              left: `${20 + i * 20}%`,
              animationDelay: `${i * 0.8}s`,
            }}
          />
        ))}
      </div>
      {/* Redesigned Simplified Header */}
      <motion.header
        className="relative bg-white/5 dark:bg-white/5 light:bg-white/80 backdrop-blur-xl border-b border-blue-500/20 dark:border-blue-500/20 light:border-gray-200 sticky top-0 z-50 transition-colors duration-300"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Holographic Top Border Effect */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent dark:via-cyan-400/50 light:via-blue-400/50 animate-holographic-shift" style={{ backgroundSize: '200% 100%' }} />
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          {/* Single Row: Logo + Greeting + Stats + User Menu */}
          <div className="flex items-center justify-between gap-6">
            {/* Left: Logo and Greeting */}
            <div className="flex items-center gap-4">
              <motion.div
                className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg dark:shadow-cyan-500/30 light:shadow-blue-500/30"
                whileHover={{
                  scale: 1.05,
                  rotate: 5,
                  boxShadow: '0 0 20px rgba(6, 182, 212, 0.5)',
                }}
                whileTap={{ scale: 0.95 }}
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </motion.div>
              <div>
                <h1 className="text-xl font-bold dark:text-white light:text-gray-900 transition-colors">
                  Dashboard
                </h1>
                <p className="text-sm dark:text-gray-400 light:text-gray-600 transition-colors">
                  Welcome back, {user.name || user.email.split('@')[0]}
                </p>
              </div>
            </div>

            {/* Center: Premium Search Bar */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-4">
              <PremiumSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onCommandPaletteOpen={() => setIsCommandPaletteOpen(true)}
                placeholder="Search tasks..."
              />
            </div>

            {/* Right: User Menu + Toggle Panel */}
            <div className="flex items-center gap-3">
              {/* Toggle Right Panel */}
              <motion.button
                onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-blue-500/20 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={isRightPanelOpen ? 'Hide sidebar' : 'Show sidebar'}
              >
                <svg
                  className={`w-5 h-5 text-cyan-400 transition-transform ${
                    isRightPanelOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                  />
                </svg>
              </motion.button>

              {/* User Menu */}
              <UserMenu />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Notification Warning Banner */}
      <AnimatePresence>
        {permission === 'denied' && (
          <motion.div
            className="bg-red-500/10 border-b border-red-400/30 backdrop-blur-lg"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="max-w-[1920px] mx-auto px-6 py-3">
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-red-400 flex-shrink-0"
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
                <p className="text-sm text-red-200 flex-1">
                  Notifications blocked. Enable to receive deadline reminders.
                </p>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={requestPermission}
                >
                  Enable
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Grid Section - NEW */}
      <StatsGrid tasks={tasks} />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Kanban Board */}
        <motion.main
          className="flex-1 overflow-y-auto p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="max-w-[1920px] mx-auto">
            {isLoadingTasks ? (
              <LoadingSkeleton type="board" count={3} />
            ) : tasks && tasks.length === 0 ? (
              <EmptyState
                type={
                  searchQuery
                    ? 'no-search-results'
                    : filterPriority !== 'all' || filterTags !== 'all'
                    ? 'no-filtered-tasks'
                    : 'no-tasks'
                }
                searchQuery={searchQuery}
                onAction={() => {
                  if (searchQuery) {
                    setSearchQuery('')
                  } else if (filterPriority !== 'all' || filterTags !== 'all') {
                    setFilterPriority('all')
                    setFilterTags('all')
                  } else {
                    handleCreateTask()
                  }
                }}
              />
            ) : (
              <div className="grid grid-cols-2 gap-6">
                {columns.map((column, columnIndex) => (
                  <motion.div
                    key={column.status}
                    className="flex flex-col"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: columnIndex * 0.1 }}
                  >
                    {/* Column Header */}
                    <div
                      className={`bg-gradient-to-br ${column.gradient} backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6 mb-6 shadow-lg`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                            <svg
                              className={`w-6 h-6 ${column.iconColor}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              {column.icon}
                            </svg>
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-white">
                              {column.title}
                            </h2>
                            <p className="text-sm text-gray-400">
                              {column.tasks?.length || 0} tasks
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Progress Ring */}
                          <div className="relative w-16 h-16">
                            <svg className="w-16 h-16 transform -rotate-90">
                              <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                                className="text-white/10"
                              />
                              <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                                strokeLinecap="round"
                                className={column.iconColor}
                                strokeDasharray={`${
                                  ((column.tasks?.length || 0) / totalTasks) * 176
                                } 176`}
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-sm font-bold text-white">
                                {totalTasks > 0
                                  ? Math.round(
                                      ((column.tasks?.length || 0) / totalTasks) * 100
                                    )
                                  : 0}
                                %
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Task Cards */}
                    <div className="space-y-4 flex-1 min-h-[500px]">
                      <AnimatePresence mode="popLayout">
                        {column.tasks?.length === 0 ? (
                          <motion.div
                            className="bg-white/5 backdrop-blur-lg border border-blue-500/10 rounded-2xl p-12 text-center"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                          >
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                              <svg
                                className="w-8 h-8 text-gray-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                />
                              </svg>
                            </div>
                            <p className="text-gray-400 text-sm">
                              No tasks in this column
                            </p>
                          </motion.div>
                        ) : (
                          column.tasks?.map((task, index) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              index={index}
                              onClick={() => handleEditTask(task)}
                              onDelete={handleDeleteTask}
                              onToggleStatus={handleToggleStatus}
                            />
                          ))
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.main>

        {/* Right Sidebar Panel */}
        <AnimatePresence>
          {isRightPanelOpen && (
            <motion.aside
              className="w-[380px] bg-white/5 backdrop-blur-xl border-l border-blue-500/20 overflow-y-auto"
              initial={{ x: 380, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 380, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="p-6 space-y-6">
                {/* Calendar Widget */}
                <motion.div
                  className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-lg border border-blue-500/20 rounded-2xl p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-cyan-400"
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
                    <h3 className="text-lg font-semibold text-white">Calendar</h3>
                  </div>
                  <Calendar tasks={tasks} />
                </motion.div>

                {/* Upcoming Tasks */}
                <motion.div
                  className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-lg border border-purple-500/20 rounded-2xl p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
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
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                      Upcoming Deadlines
                    </h3>
                  </div>

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
                      .map((task, index) => (
                        <motion.div
                          key={task.id}
                          className="bg-white/5 backdrop-blur-lg border border-purple-500/20 rounded-xl p-4 hover:bg-white/10 transition-colors cursor-pointer group"
                          onClick={() => handleEditTask(task)}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + index * 0.05 }}
                          whileHover={{ scale: 1.02, x: -2 }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-white text-sm font-medium flex-1 group-hover:text-cyan-300 transition-colors">
                              {task.title}
                            </p>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                task.priority === 'HIGH'
                                  ? 'bg-red-500/20 text-red-300'
                                  : task.priority === 'MEDIUM'
                                  ? 'bg-yellow-500/20 text-yellow-300'
                                  : 'bg-green-500/20 text-green-300'
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-gray-400"
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
                            <p className="text-xs text-gray-400">
                              {new Date(task.due_date!).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                        </motion.div>
                      ))}

                    {(!tasks ||
                      tasks.filter(
                        (task) =>
                          task.due_date &&
                          task.status !== 'COMPLETE' &&
                          new Date(task.due_date) >= new Date()
                      ).length === 0) && (
                      <div className="bg-white/5 backdrop-blur-lg border border-purple-500/20 rounded-xl p-8 text-center">
                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg
                            className="w-6 h-6 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <p className="text-gray-400 text-sm">
                          No upcoming deadlines
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
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

      {/* Command Palette */}
      <CommandPalette
        tasks={tasks}
        onCreateTask={handleCreateTask}
        onOpenAIChat={handleOpenChatBox}
        onSelectTask={handleEditTask}
        onApplyFilter={handleApplyFilter}
        isOpen={isCommandPaletteOpen}
        onOpenChange={setIsCommandPaletteOpen}
      />

      {/* Floating Action Button Group */}
      <FABGroup
        onCreateTask={handleCreateTask}
        onOpenAIChat={handleOpenChatBox}
        showAIChat={true}
      />

      {/* Integrated AI Chatbot */}
      <ChatBox isOpen={isChatBoxOpen} onToggle={handleChatBoxToggle} />
    </div>
  )
}
