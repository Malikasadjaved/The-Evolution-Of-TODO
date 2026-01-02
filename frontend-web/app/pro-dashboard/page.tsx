'use client'

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  Circle,
  Plus,
  Search,
  List,
  Grid3x3,
  Filter,
  Calendar,
  TrendingUp,
  Clock,
  AlertCircle,
  Trash2,
  Edit2,
  X,
  LayoutDashboard,
  CalendarDays,
  Menu,
  Bell,
  Star,
  Zap,
  Target,
  Save,
  LogOut,
  Sun,
  Moon,
  ChevronDown,
  Settings,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useSession, useSignOut } from '@/lib/auth'
import type { Task, CreateTaskInput, UpdateTaskInput } from '@/types/api'

const ProDashboard = () => {
  const router = useRouter()
  const { data: session } = useSession()
  const { signOut } = useSignOut()

  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'today' | 'upcoming' | 'complete'>(
    'all'
  )
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<
    'HIGH' | 'MEDIUM' | 'LOW' | 'all'
  >('all')
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<'due_date' | 'priority' | 'title'>('due_date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showTaskDrawer, setShowTaskDrawer] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [priorityMenuOpen, setPriorityMenuOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [newTask, setNewTask] = useState<{
    title: string
    description: string
    priority: 'LOW' | 'MEDIUM' | 'HIGH'
    due_date: string
    tags: string[]
  }>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    due_date: '',
    tags: [],
  })

  // Track if we've already fetched to prevent double calls in Strict Mode
  const hasFetched = useRef(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('pro-dashboard-theme')
    if (savedTheme === 'light') {
      setIsDarkMode(false)
    }
  }, [])

  // Close user menu and filter menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }

      // Close filter menu when clicking outside
      const filterMenu = document.getElementById('advanced-filter-menu')
      if (filterMenu && !filterMenu.contains(event.target as Node)) {
        filterMenu.classList.add('hidden')
      }
    }

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      // Always check filter menu clicks
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userMenuOpen])

  const fetchTasks = useCallback(async () => {
    if (!session?.user?.id) return

    try {
      setIsLoading(true)
      const fetchedTasks = await api.getTasks(session.user.id)
      setTasks(fetchedTasks)
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!session?.user?.id) {
      router.push('/login')
      return
    }

    // Prevent double fetch in React Strict Mode
    if (!hasFetched.current) {
      hasFetched.current = true
      fetchTasks()
    }
  }, [session?.user?.id, router, fetchTasks])

  const filteredTasks = useMemo(() => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    const filtered = tasks.filter(task => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))

      let matchesFilter = true
      switch (selectedFilter) {
        case 'all':
          matchesFilter = task.status === 'INCOMPLETE'
          break
        case 'today':
          const taskDate = task.due_date ? task.due_date.split('T')[0] : ''
          matchesFilter = task.status === 'INCOMPLETE' && taskDate === today
          break
        case 'upcoming':
          matchesFilter =
            task.status === 'INCOMPLETE' && !!task.due_date && new Date(task.due_date) > now
          break
        case 'complete':
          matchesFilter = task.status === 'COMPLETE'
          break
      }

      // Priority filter
      const matchesPriority =
        selectedPriorityFilter === 'all' || task.priority === selectedPriorityFilter

      // Tag filter (if task has tags and filter is active)
      const matchesTag =
        selectedTagFilter === 'all' || (task.tags && task.tags.includes(selectedTagFilter))

      return matchesSearch && matchesFilter && matchesPriority && matchesTag
    })

    // Apply sorting
    return filtered.sort((a, b) => {
      let comparison = 0

      if (sortField === 'due_date') {
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      } else if (sortField === 'priority') {
        const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 }
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority]
      } else if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title)
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [
    tasks,
    searchQuery,
    selectedFilter,
    selectedPriorityFilter,
    selectedTagFilter,
    sortField,
    sortOrder,
  ])

  const stats = useMemo(() => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    return {
      total: tasks.filter(t => t.status === 'INCOMPLETE').length,
      completed: tasks.filter(t => t.status === 'COMPLETE').length,
      inProgress: tasks.filter(t => t.status === 'INCOMPLETE').length,
      overdue: tasks.filter(
        t => t.status === 'INCOMPLETE' && t.due_date && new Date(t.due_date) < now
      ).length,
    }
  }, [tasks])

  const toggleComplete = async (taskId: number) => {
    if (!session?.user?.id) return

    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return

      const newStatus = task.status === 'COMPLETE' ? 'INCOMPLETE' : 'COMPLETE'
      await api.toggleTaskStatus(session.user.id, taskId, newStatus)
      // Update local state immediately for better UX
      setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, status: newStatus } : t)))
    } catch (error) {
      console.error('Failed to toggle task status:', error)
      // Refetch on error to sync state
      fetchTasks()
    }
  }

  const deleteTask = async (taskId: number) => {
    if (!session?.user?.id) return

    try {
      await api.deleteTask(session.user.id, taskId)
      // Update local state immediately for better UX
      setTasks(prev => prev.filter(t => t.id !== taskId))
    } catch (error) {
      console.error('Failed to delete task:', error)
      // Refetch on error to sync state
      fetchTasks()
    }
  }

  const addTask = async () => {
    if (!session?.user?.id || !newTask.title.trim()) return

    try {
      const createdTask = await api.createTask(session.user.id, newTask)
      setNewTask({
        title: '',
        description: '',
        priority: 'MEDIUM',
        due_date: '',
        tags: [],
      })
      setShowAddModal(false)
      // Add to local state immediately for better UX
      setTasks(prev => [...prev, createdTask])
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  const updateTask = async (taskId: number, updates: UpdateTaskInput) => {
    if (!session?.user?.id) return

    try {
      const updatedTask = await api.updateTask(session.user.id, taskId, updates)
      // Update local state immediately for better UX
      setTasks(prev => prev.map(t => (t.id === taskId ? updatedTask : t)))
    } catch (error) {
      console.error('Failed to update task:', error)
      // Refetch on error to sync state
      fetchTasks()
    }
  }

  const openTaskDetail = (task: Task) => {
    setSelectedTask(task)
    setShowTaskDrawer(true)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Failed to sign out:', error)
    }
  }

  const toggleTheme = () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)
    localStorage.setItem('pro-dashboard-theme', newTheme ? 'dark' : 'light')
  }

  // Dynamic theme classes helper - Professional Version
  const getThemeClasses = () => {
    if (isDarkMode) {
      // DARK MODE - Premium Dark Theme
      return {
        // Main Layout
        mainBg: 'bg-slate-950',
        sidebarBg: 'bg-slate-900',
        headerBg: 'bg-slate-900/95',

        // Cards & Surfaces
        cardBg: 'bg-slate-900',
        cardHover: 'hover:bg-slate-800/80',
        cardBorder: 'border-slate-800/50',
        cardShadow: 'shadow-lg shadow-black/20',

        // Stats Cards
        statCardBg: 'bg-gradient-to-br from-slate-800/60 to-slate-900/60',
        statCardBorder: 'border-slate-700/40',
        statCardHover: 'hover:border-purple-500/30 hover:shadow-purple-500/10',

        // Task Cards
        taskCard: 'bg-slate-800/40 backdrop-blur-sm',
        taskCardHover: 'hover:bg-slate-800/60 hover:border-purple-500/40',
        taskCardBorder: 'border-slate-700/50',

        // Inputs
        inputBg: 'bg-slate-800/50',
        inputBorder: 'border-slate-700/50',
        inputFocus: 'focus:border-purple-500/50 focus:bg-slate-800/70',
        inputText: 'text-slate-100 placeholder:text-slate-500',

        // Text Colors
        textPrimary: 'text-slate-100',
        textSecondary: 'text-slate-400',
        textMuted: 'text-slate-600',

        // Borders
        border: 'border-slate-800/50',
        borderStrong: 'border-slate-700',
        divider: 'border-slate-800',

        // Interactive Elements
        buttonSecondary: 'bg-slate-800 hover:bg-slate-700',
        dropdownBg: 'bg-slate-800',
        dropdownHover: 'hover:bg-slate-700/70',

        // Modal
        modalBackdrop: 'bg-black/60',
        modalBg: 'bg-slate-900',
        modalBorder: 'border-slate-700',

        // Shadows
        shadow: 'shadow-xl shadow-black/30',
        shadowLg: 'shadow-2xl shadow-black/40',
      }
    } else {
      // LIGHT MODE - Soft Professional Theme
      return {
        // Main Layout
        mainBg: 'bg-[#F8F9FA]',
        sidebarBg: 'bg-[#F5F5F7]',
        headerBg: 'bg-white/95',

        // Cards & Surfaces
        cardBg: 'bg-white',
        cardHover: 'hover:bg-gray-50/80',
        cardBorder: 'border-transparent',
        cardShadow: 'shadow-sm shadow-gray-200/50',

        // Stats Cards
        statCardBg: 'bg-white',
        statCardBorder: 'border-transparent',
        statCardHover: 'hover:shadow-md hover:shadow-purple-200/30',

        // Task Cards
        taskCard: 'bg-white',
        taskCardHover: 'hover:shadow-md hover:shadow-gray-300/30 hover:border-transparent',
        taskCardBorder: 'border-transparent',

        // Inputs
        inputBg: 'bg-white',
        inputBorder: 'border-gray-200',
        inputFocus:
          'focus:border-purple-400 focus:bg-white focus:shadow-sm focus:shadow-purple-200/20',
        inputText: 'text-gray-800 placeholder:text-gray-400',

        // Text Colors
        textPrimary: 'text-gray-800',
        textSecondary: 'text-gray-600',
        textMuted: 'text-gray-400',

        // Borders
        border: 'border-gray-200/50',
        borderStrong: 'border-gray-300',
        divider: 'border-gray-200/50',

        // Interactive Elements
        buttonSecondary: 'bg-gray-100 hover:bg-gray-200',
        dropdownBg: 'bg-white',
        dropdownHover: 'hover:bg-gray-50',

        // Modal
        modalBackdrop: 'bg-gray-900/20',
        modalBg: 'bg-white',
        modalBorder: 'border-gray-200/50',

        // Shadows
        shadow: 'shadow-lg shadow-gray-200/40',
        shadowLg: 'shadow-xl shadow-gray-300/30',
      }
    }
  }

  const themeClasses = getThemeClasses()

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'LOW':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const getPriorityDot = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-500'
      case 'MEDIUM':
        return 'bg-amber-500'
      case 'LOW':
        return 'bg-blue-500'
      default:
        return 'bg-slate-500'
    }
  }

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return 'No due date'
    const date = new Date(dueDate)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Edit Modal Component
  const TaskEditModal = ({
    task,
    onSave,
    onClose,
  }: {
    task: Task
    onSave: (id: number, updates: UpdateTaskInput) => void
    onClose: () => void
  }) => {
    const [editedTask, setEditedTask] = useState<UpdateTaskInput>({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
    })

    const handleSave = () => {
      onSave(task.id, editedTask)
      onClose()
    }

    return (
      <div
        className={`fixed inset-0 ${themeClasses.modalBackdrop} backdrop-blur-sm flex items-center justify-center z-50 p-4`}
      >
        <div
          className={`${themeClasses.modalBg} rounded-2xl border ${themeClasses.modalBorder} w-full max-w-lg ${themeClasses.shadowLg}`}
        >
          <div className={`flex items-center justify-between p-6 border-b ${themeClasses.divider}`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Edit2 className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className={`text-xl font-bold ${themeClasses.textPrimary}`}>Edit Task</h3>
            </div>
            <button
              onClick={onClose}
              className={`p-2 ${themeClasses.cardHover} rounded-lg transition-colors ${themeClasses.textPrimary}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${themeClasses.textPrimary}`}>
                Task Title
              </label>
              <input
                type="text"
                value={editedTask.title}
                onChange={e => setEditedTask({ ...editedTask, title: e.target.value })}
                className={`w-full px-4 py-3 ${themeClasses.inputBg} border ${themeClasses.inputBorder} rounded-lg ${themeClasses.inputFocus} focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${themeClasses.inputText}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${themeClasses.textPrimary}`}>
                Description
              </label>
              <textarea
                value={editedTask.description || ''}
                onChange={e => setEditedTask({ ...editedTask, description: e.target.value })}
                rows={4}
                className={`w-full px-4 py-3 ${themeClasses.inputBg} border ${themeClasses.inputBorder} rounded-lg ${themeClasses.inputFocus} focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none ${themeClasses.inputText}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${themeClasses.textPrimary}`}>
                  Priority
                </label>
                <select
                  value={editedTask.priority}
                  onChange={e =>
                    setEditedTask({
                      ...editedTask,
                      priority: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH',
                    })
                  }
                  className={`w-full px-4 py-3 ${themeClasses.inputBg} border ${themeClasses.inputBorder} rounded-lg ${themeClasses.inputFocus} focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${themeClasses.inputText}`}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${themeClasses.textPrimary}`}>
                  Due Date
                </label>
                <input
                  type="date"
                  value={editedTask.due_date}
                  onChange={e => setEditedTask({ ...editedTask, due_date: e.target.value })}
                  className={`w-full px-4 py-3 ${themeClasses.inputBg} border ${themeClasses.inputBorder} rounded-lg ${themeClasses.inputFocus} focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${themeClasses.inputText}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${themeClasses.textPrimary}`}>
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {task.tags?.map((tag, idx) => (
                    <span
                      key={idx}
                      className={`px-3 py-1 bg-purple-500/20 ${themeClasses.textPrimary} text-xs rounded-full border border-purple-500/30 flex items-center gap-1`}
                    >
                      {tag}
                      <button
                        onClick={() => {
                          const newTags = task.tags?.filter((_, i) => i !== idx) || []
                          setEditedTask({ ...editedTask, tags: newTags })
                        }}
                        className="hover:text-red-400 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add tag and press Enter"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      const newTag = e.currentTarget.value.trim()
                      const currentTags = task.tags || []
                      if (!currentTags.includes(newTag)) {
                        setEditedTask({ ...editedTask, tags: [...currentTags, newTag] })
                      }
                      e.currentTarget.value = ''
                    }
                  }}
                  className={`w-full px-4 py-3 ${themeClasses.inputBg} border ${themeClasses.inputBorder} rounded-lg ${themeClasses.inputFocus} focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${themeClasses.inputText}`}
                />
              </div>
            </div>
          </div>

          <div className={`flex items-center gap-3 p-6 border-t ${themeClasses.divider}`}>
            <button
              onClick={onClose}
              className={`flex-1 px-6 py-3 ${themeClasses.buttonSecondary} rounded-lg font-semibold transition-all ${themeClasses.textPrimary}`}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 text-white"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Overdue Badge Component
  const OverdueBadge = ({ dueDate }: { dueDate: string | null }) => {
    if (!dueDate) return null

    const now = new Date()
    const due = new Date(dueDate)
    const isOverdue = due < now

    if (!isOverdue) return null

    const daysOverdue = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))

    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-md text-xs font-medium border border-red-500/30 animate-pulse">
        <AlertCircle className="w-3 h-3" />
        {daysOverdue === 0 ? 'Due today' : `${daysOverdue}d overdue`}
      </div>
    )
  }

  // Due Soon Badge Component
  const DueSoonBadge = ({ dueDate }: { dueDate: string | null }) => {
    if (!dueDate) return null

    const now = new Date()
    const due = new Date(dueDate)
    const hoursUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursUntilDue < 0 || hoursUntilDue > 48) return null

    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 rounded-md text-xs font-medium border border-amber-500/30">
        <Clock className="w-3 h-3" />
        Due in {Math.floor(hoursUntilDue)}h
      </div>
    )
  }

  // Quick Actions Component
  const QuickActions = () => {
    const handleQuickAction = (actionType: string) => {
      const today = new Date().toISOString().split('T')[0]

      if (actionType === 'today') {
        setNewTask({
          title: '',
          description: '',
          priority: 'MEDIUM',
          due_date: today,
          tags: [],
        })
        setShowAddModal(true)
      } else if (actionType === 'high-priority') {
        setNewTask({
          title: '',
          description: '',
          priority: 'HIGH',
          due_date: '',
          tags: [],
        })
        setShowAddModal(true)
      }
    }

    return (
      <div className={`p-4 border-t ${themeClasses.divider}`}>
        <h3 className={`text-sm font-semibold ${themeClasses.textSecondary} mb-3`}>
          Quick Actions
        </h3>
        <div className="space-y-2">
          <button
            onClick={() => handleQuickAction('today')}
            className={`w-full flex items-center gap-3 px-4 py-3 ${themeClasses.taskCard} ${themeClasses.taskCardHover} border ${themeClasses.taskCardBorder} rounded-lg transition-all text-left group`}
          >
            <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
              <Calendar className="w-4 h-4 text-blue-400" />
            </div>
            <span className={`text-sm font-medium ${themeClasses.textPrimary}`}>
              Add task for today
            </span>
          </button>
          <button
            onClick={() => handleQuickAction('high-priority')}
            className={`w-full flex items-center gap-3 px-4 py-3 ${themeClasses.taskCard} ${themeClasses.taskCardHover} border ${themeClasses.taskCardBorder} rounded-lg transition-all text-left group`}
          >
            <div className="p-2 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition-colors">
              <AlertCircle className="w-4 h-4 text-red-400" />
            </div>
            <span className={`text-sm font-medium ${themeClasses.textPrimary}`}>
              Add high priority task
            </span>
          </button>
        </div>
      </div>
    )
  }

  if (!session?.user?.id) {
    return (
      <div
        className={`flex h-screen items-center justify-center ${themeClasses.mainBg} ${themeClasses.textPrimary}`}
      >
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className={themeClasses.textSecondary}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex h-screen overflow-hidden ${themeClasses.mainBg} ${themeClasses.textPrimary}`}
    >
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 ${themeClasses.sidebarBg} border-r ${themeClasses.border} flex flex-col overflow-hidden ${themeClasses.cardShadow}`}
      >
        <div className={`p-6 border-b ${themeClasses.divider}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${themeClasses.textPrimary}`}>TaskFlow Pro</h1>
              <p className={`text-xs ${themeClasses.textSecondary}`}>Advanced Dashboard</p>
            </div>
          </div>
        </div>

        <div ref={userMenuRef} className={`p-4 border-b ${themeClasses.divider} relative`}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:from-purple-500/20 hover:to-pink-500/20 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-sm font-semibold text-white">
                {session.user.email.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 text-left">
              <p className={`text-sm font-semibold ${themeClasses.textPrimary}`}>
                {session.user.email.split('@')[0]}
              </p>
              <p className={`text-xs ${themeClasses.textSecondary} truncate`}>
                {session.user.email}
              </p>
            </div>
            <ChevronDown
              className={`w-4 h-4 ${themeClasses.textSecondary} transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* User Dropdown Menu */}
          {userMenuOpen && (
            <div
              className={`absolute left-4 right-4 top-full mt-2 ${themeClasses.dropdownBg} border ${themeClasses.border} rounded-lg ${themeClasses.shadow} z-50 overflow-hidden`}
            >
              <div className="p-2">
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg ${themeClasses.dropdownHover} transition-colors text-left`}
                >
                  {isDarkMode ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-purple-400" />
                  )}
                  <span className={`text-sm font-medium ${themeClasses.textPrimary}`}>
                    {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                  </span>
                  <div
                    className={`ml-auto w-8 h-4 rounded-full transition-colors ${isDarkMode ? 'bg-purple-500' : 'bg-slate-400'} relative`}
                  >
                    <div
                      className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isDarkMode ? 'left-4' : 'left-0.5'}`}
                    ></div>
                  </div>
                </button>

                {/* Settings */}
                <button
                  onClick={() => {
                    setUserMenuOpen(false)
                    // Navigate to settings or show settings modal
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg ${themeClasses.dropdownHover} transition-colors text-left`}
                >
                  <Settings className={`w-4 h-4 ${themeClasses.textSecondary}`} />
                  <span className={`text-sm font-medium ${themeClasses.textPrimary}`}>
                    Settings
                  </span>
                </button>

                <div className={`my-2 border-t ${themeClasses.divider}`}></div>

                {/* Sign Out */}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
              selectedFilter === 'all'
                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                : `${themeClasses.cardHover} ${themeClasses.textPrimary}`
            }`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium">All Tasks</span>
            </div>
            <span
              className={`px-2 py-1 text-xs rounded-full ${themeClasses.buttonSecondary} ${themeClasses.textSecondary}`}
            >
              {stats.total}
            </span>
          </button>

          <button
            onClick={() => setSelectedFilter('today')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
              selectedFilter === 'today'
                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                : `${themeClasses.cardHover} ${themeClasses.textPrimary}`
            }`}
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5" />
              <span className="font-medium">Today</span>
            </div>
            <span
              className={`px-2 py-1 text-xs rounded-full ${themeClasses.buttonSecondary} ${themeClasses.textSecondary}`}
            >
              {
                tasks.filter(
                  t =>
                    t.status === 'INCOMPLETE' &&
                    t.due_date &&
                    t.due_date.split('T')[0] === new Date().toISOString().split('T')[0]
                ).length
              }
            </span>
          </button>

          <button
            onClick={() => setSelectedFilter('upcoming')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
              selectedFilter === 'upcoming'
                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                : `${themeClasses.cardHover} ${themeClasses.textPrimary}`
            }`}
          >
            <div className="flex items-center gap-3">
              <CalendarDays className="w-5 h-5" />
              <span className="font-medium">Upcoming</span>
            </div>
          </button>

          <button
            onClick={() => setSelectedFilter('complete')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
              selectedFilter === 'complete'
                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                : `${themeClasses.cardHover} ${themeClasses.textPrimary}`
            }`}
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Completed</span>
            </div>
            <span
              className={`px-2 py-1 text-xs rounded-full ${themeClasses.buttonSecondary} ${themeClasses.textSecondary}`}
            >
              {stats.completed}
            </span>
          </button>
        </nav>

        {/* Priority Filters */}
        <div className={`px-4 pb-2 border-b ${themeClasses.divider}`}>
          {/* Priority Menu Toggle */}
          <button
            onClick={() => setPriorityMenuOpen(!priorityMenuOpen)}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all mb-2 ${themeClasses.cardHover} ${themeClasses.textPrimary}`}
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-semibold">Priority</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${priorityMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Priority Submenu */}
          {priorityMenuOpen && (
            <div className="space-y-1 pl-2">
              <button
                onClick={() => setSelectedPriorityFilter('HIGH')}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all ${
                  selectedPriorityFilter === 'HIGH'
                    ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                    : `${themeClasses.cardHover} ${themeClasses.textPrimary}`
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${selectedPriorityFilter === 'HIGH' ? 'bg-red-400' : 'bg-slate-500'}`}
                  />
                  <span className="text-sm font-medium">High</span>
                </div>
                <span className={`text-xs ${themeClasses.textSecondary}`}>
                  {tasks.filter(t => t.priority === 'HIGH').length}
                </span>
              </button>
              <button
                onClick={() => setSelectedPriorityFilter('MEDIUM')}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all ${
                  selectedPriorityFilter === 'MEDIUM'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : `${themeClasses.cardHover} ${themeClasses.textPrimary}`
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${selectedPriorityFilter === 'MEDIUM' ? 'bg-amber-400' : 'bg-slate-500'}`}
                  />
                  <span className="text-sm font-medium">Medium</span>
                </div>
                <span className={`text-xs ${themeClasses.textSecondary}`}>
                  {tasks.filter(t => t.priority === 'MEDIUM').length}
                </span>
              </button>
              <button
                onClick={() => setSelectedPriorityFilter('LOW')}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all ${
                  selectedPriorityFilter === 'LOW'
                    ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                    : `${themeClasses.cardHover} ${themeClasses.textPrimary}`
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${selectedPriorityFilter === 'LOW' ? 'bg-green-400' : 'bg-slate-500'}`}
                  />
                  <span className="text-sm font-medium">Low</span>
                </div>
                <span className={`text-xs ${themeClasses.textSecondary}`}>
                  {tasks.filter(t => t.priority === 'LOW').length}
                </span>
              </button>
              <button
                onClick={() => setSelectedPriorityFilter('all')}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all ${
                  selectedPriorityFilter === 'all'
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                    : `${themeClasses.cardHover} ${themeClasses.textPrimary}`
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400" />
                  <span className="text-sm font-medium">All Priorities</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Tag Filters */}
        {(() => {
          const allTags = Array.from(new Set(tasks.flatMap(task => task.tags || [])))
          if (allTags.length === 0) return null

          return (
            <div className={`px-4 pb-2 border-b ${themeClasses.divider}`}>
              <h3 className={`text-xs font-semibold ${themeClasses.textSecondary} mb-3 uppercase`}>
                Tags
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedTagFilter('all')}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all ${
                    selectedTagFilter === 'all'
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                      : `${themeClasses.cardHover} ${themeClasses.textPrimary}`
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">All Tags</span>
                  </div>
                </button>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTagFilter(tag)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all ${
                      selectedTagFilter === tag
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                        : `${themeClasses.cardHover} ${themeClasses.textPrimary}`
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                        {tag}
                      </span>
                    </div>
                    <span className={`text-xs ${themeClasses.textSecondary}`}>
                      {tasks.filter(t => t.tags?.includes(tag)).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )
        })()}

        <div className={`p-4 border-t ${themeClasses.divider}`}>
          <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
            <p className={`text-sm font-semibold mb-2 ${themeClasses.textPrimary}`}>
              Progress Today
            </p>
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`flex-1 h-2 ${themeClasses.buttonSecondary} rounded-full overflow-hidden`}
              >
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                  style={{
                    width: `${stats.total > 0 ? (stats.completed / tasks.length) * 100 : 0}%`,
                  }}
                ></div>
              </div>
              <span className={`text-xs ${themeClasses.textSecondary}`}>
                {stats.completed}/{tasks.length}
              </span>
            </div>
            <p className={`text-xs ${themeClasses.textSecondary}`}>Keep crushing it!</p>
          </div>
        </div>

        <QuickActions />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header
          className={`${themeClasses.headerBg} backdrop-blur-xl border-b ${themeClasses.border} p-6 ${themeClasses.cardShadow}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`p-2 ${themeClasses.cardHover} rounded-lg transition-colors ${themeClasses.textPrimary}`}
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-2xl font-bold capitalize bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {selectedFilter === 'all' ? 'All Tasks' : selectedFilter}
                </h2>
                <p className={`text-sm ${themeClasses.textSecondary}`}>
                  Manage your tasks with style
                </p>
              </div>
            </div>
            <div className="flex items-center" gap-3>
              <button
                className={`p-2 ${themeClasses.cardHover} rounded-lg transition-colors relative ${themeClasses.textPrimary}`}
              >
                <Bell className="w-5 h-5" />
                {stats.overdue > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search
                className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${themeClasses.textSecondary}`}
              />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 ${themeClasses.inputBg} border ${themeClasses.inputBorder} rounded-lg ${themeClasses.inputFocus} focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all ${themeClasses.inputText}`}
              />
            </div>

            <div
              className={`flex items-center gap-2 p-1 ${themeClasses.buttonSecondary} rounded-lg border ${themeClasses.cardBorder}`}
            >
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'list'
                    ? 'bg-purple-500 text-white'
                    : `${themeClasses.textSecondary} hover:${themeClasses.textPrimary}`
                }`}
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'grid'
                    ? 'bg-purple-500 text-white'
                    : `${themeClasses.textSecondary} hover:${themeClasses.textPrimary}`
                }`}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
            </div>

            {/* Sort Field Dropdown */}
            <div className="relative">
              <select
                value={sortField}
                onChange={e => setSortField(e.target.value as 'due_date' | 'priority' | 'title')}
                className={`${themeClasses.buttonSecondary} border ${themeClasses.cardBorder} rounded-lg px-4 py-3 ${themeClasses.textPrimary} transition-all focus:outline-none focus:border-purple-500 cursor-pointer`}
              >
                <option value="due_date" className="bg-gray-900">
                  Sort by Due Date
                </option>
                <option value="priority" className="bg-gray-900">
                  Sort by Priority
                </option>
                <option value="title" className="bg-gray-900">
                  Sort by Title
                </option>
              </select>
            </div>

            {/* Sort Order Toggle */}
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className={`p-3 ${themeClasses.buttonSecondary} border ${themeClasses.cardBorder} rounded-lg transition-all ${themeClasses.textPrimary}`}
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {sortOrder === 'asc' ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingUp className="w-5 h-5 rotate-180" />
              )}
            </button>

            {/* Advanced Filters Button */}
            <div className="relative">
              <button
                onClick={e => {
                  e.stopPropagation()
                  const filterMenu = document.getElementById('advanced-filter-menu')
                  filterMenu?.classList.toggle('hidden')
                }}
                className={`p-3 ${themeClasses.buttonSecondary} border ${themeClasses.cardBorder} rounded-lg transition-all ${themeClasses.textPrimary}`}
              >
                <Filter className="w-5 h-5" />
              </button>
              <div
                id="advanced-filter-menu"
                className="hidden absolute right-0 top-full mt-2 z-50 w-64"
              >
                <div
                  className={`${themeClasses.dropdownBg} border ${themeClasses.border} rounded-lg ${themeClasses.shadow} overflow-hidden`}
                >
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setSelectedPriorityFilter('all')
                        document.getElementById('advanced-filter-menu')?.classList.add('hidden')
                      }}
                      className={`w-full px-3 py-2 rounded-lg ${themeClasses.dropdownHover} text-left text-sm ${themeClasses.textPrimary}`}
                    >
                      Clear Priority Filter
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTagFilter('all')
                        document.getElementById('advanced-filter-menu')?.classList.add('hidden')
                      }}
                      className={`w-full px-3 py-2 rounded-lg ${themeClasses.dropdownHover} text-left text-sm ${themeClasses.textPrimary}`}
                    >
                      Clear Tag Filter
                    </button>
                    {(selectedPriorityFilter !== 'all' || selectedTagFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setSelectedPriorityFilter('all')
                          setSelectedTagFilter('all')
                          document.getElementById('advanced-filter-menu')?.classList.add('hidden')
                        }}
                        className={`w-full px-3 py-2 rounded-lg hover:bg-purple-500/10 text-left text-sm text-purple-400 font-medium`}
                      >
                        Clear All Filters
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 flex items-center gap-2 text-white"
            >
              <Plus className="w-5 h-5" />
              Add Task
            </button>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="p-6 grid grid-cols-4 gap-4">
          {/* Active Tasks - Light Purple */}
          <div
            className={`p-5 rounded-xl ${
              isDarkMode ? themeClasses.statCardBg : 'bg-purple-50/50'
            } border ${themeClasses.statCardBorder} ${
              isDarkMode ? themeClasses.statCardHover : 'hover:shadow-lg hover:shadow-purple-200/40'
            } ${themeClasses.cardShadow} transition-all group`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                <Target className="w-6 h-6 text-purple-400" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <p className={`text-3xl font-bold mb-1 ${themeClasses.textPrimary}`}>{stats.total}</p>
            <p className={`text-sm ${themeClasses.textSecondary}`}>Active Tasks</p>
          </div>

          {/* Completed - Light Green */}
          <div
            className={`p-5 rounded-xl ${
              isDarkMode ? themeClasses.statCardBg : 'bg-green-50/50'
            } border ${themeClasses.statCardBorder} ${
              isDarkMode ? 'hover:border-green-500/30' : 'hover:shadow-lg hover:shadow-green-200/40'
            } ${themeClasses.cardShadow} transition-all group`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              </div>
              <Zap className="w-4 h-4 text-green-400" />
            </div>
            <p className={`text-3xl font-bold mb-1 ${themeClasses.textPrimary}`}>
              {stats.completed}
            </p>
            <p className={`text-sm ${themeClasses.textSecondary}`}>Completed</p>
          </div>

          {/* In Progress - Light Yellow */}
          <div
            className={`p-5 rounded-xl ${
              isDarkMode ? themeClasses.statCardBg : 'bg-amber-50/50'
            } border ${themeClasses.statCardBorder} ${
              isDarkMode ? 'hover:border-amber-500/30' : 'hover:shadow-lg hover:shadow-amber-200/40'
            } ${themeClasses.cardShadow} transition-all group`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                <Clock className="w-6 h-6 text-amber-400" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <p className={`text-3xl font-bold mb-1 ${themeClasses.textPrimary}`}>
              {stats.inProgress}
            </p>
            <p className={`text-sm ${themeClasses.textSecondary}`}>In Progress</p>
          </div>

          {/* Overdue - Light Pink */}
          <div
            className={`p-5 rounded-xl ${
              isDarkMode ? themeClasses.statCardBg : 'bg-rose-50/50'
            } border ${themeClasses.statCardBorder} ${
              isDarkMode ? 'hover:border-red-500/30' : 'hover:shadow-lg hover:shadow-rose-200/40'
            } ${themeClasses.cardShadow} transition-all group`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition-colors">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />
            </div>
            <p className={`text-3xl font-bold mb-1 ${themeClasses.textPrimary}`}>{stats.overdue}</p>
            <p className={`text-sm ${themeClasses.textSecondary}`}>Overdue</p>
          </div>
        </div>

        {/* Tasks List/Grid */}
        <div className="flex-1 overflow-y-auto p-6 pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
            </div>
          ) : viewMode === 'list' ? (
            <div className="space-y-3">
              {filteredTasks.map(task => (
                <div
                  key={task.id}
                  className={`group px-4 py-3 rounded-xl ${themeClasses.taskCard} border ${themeClasses.taskCardBorder} ${themeClasses.taskCardHover} ${themeClasses.cardShadow} transition-all cursor-pointer`}
                  onClick={() => openTaskDetail(task)}
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        toggleComplete(task.id)
                      }}
                      className="flex-shrink-0"
                    >
                      {task.status === 'COMPLETE' ? (
                        <CheckCircle2 className="w-6 h-6 text-green-400" />
                      ) : (
                        <Circle
                          className={`w-6 h-6 ${themeClasses.textMuted} hover:text-purple-400 transition-colors`}
                        />
                      )}
                    </button>

                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${getPriorityDot(task.priority)}`}
                    ></div>

                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-semibold ${themeClasses.textPrimary} ${
                          task.status === 'COMPLETE' ? `line-through ${themeClasses.textMuted}` : ''
                        }`}
                      >
                        {task.title}
                      </h3>
                      <p className={`text-sm ${themeClasses.textSecondary} truncate`}>
                        {task.description || 'No description'}
                      </p>
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {task.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/30"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}
                    >
                      {task.priority}
                    </span>

                    <div
                      className={`flex items-center gap-2 text-sm ${themeClasses.textSecondary}`}
                    >
                      <Calendar className="w-4 h-4" />
                      {formatDueDate(task.due_date)}
                    </div>

                    <div className="flex items-center gap-2">
                      <OverdueBadge dueDate={task.due_date} />
                      <DueSoonBadge dueDate={task.due_date} />
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          setTaskToEdit(task)
                          setShowEditModal(true)
                        }}
                        className={`p-2 ${themeClasses.cardHover} rounded-lg transition-colors ${themeClasses.textPrimary}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          deleteTask(task.id)
                        }}
                        className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {filteredTasks.map(task => (
                <div
                  key={task.id}
                  className={`group px-5 py-3 rounded-xl ${themeClasses.taskCard} border ${themeClasses.taskCardBorder} ${themeClasses.taskCardHover} ${themeClasses.cardShadow} transition-all cursor-pointer`}
                  onClick={() => openTaskDetail(task)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        toggleComplete(task.id)
                      }}
                    >
                      {task.status === 'COMPLETE' ? (
                        <CheckCircle2 className="w-6 h-6 text-green-400" />
                      ) : (
                        <Circle
                          className={`w-6 h-6 ${themeClasses.textMuted} hover:text-purple-400 transition-colors`}
                        />
                      )}
                    </button>
                    <div className={`w-3 h-3 rounded-full ${getPriorityDot(task.priority)}`}></div>
                  </div>

                  <h3
                    className={`font-semibold mb-2 ${themeClasses.textPrimary} ${
                      task.status === 'COMPLETE' ? `line-through ${themeClasses.textMuted}` : ''
                    }`}
                  >
                    {task.title}
                  </h3>
                  <p className={`text-sm ${themeClasses.textSecondary} mb-4 line-clamp-2`}>
                    {task.description || 'No description'}
                  </p>

                  {task.tags && task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {task.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/30"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col gap-2 mb-4">
                    <OverdueBadge dueDate={task.due_date} />
                    <DueSoonBadge dueDate={task.due_date} />
                  </div>

                  <div className="flex items-center justify-between">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}
                    >
                      {task.priority}
                    </span>
                    <div
                      className={`flex items-center gap-1 text-xs ${themeClasses.textSecondary}`}
                    >
                      <Calendar className="w-3 h-3" />
                      {task.due_date
                        ? new Date(task.due_date).toLocaleDateString('en-US', {
                            month: 'numeric',
                            day: 'numeric',
                          })
                        : 'No date'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && filteredTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <CheckCircle2 className={`w-16 h-16 ${themeClasses.textMuted} mb-4`} />
              <h3 className={`text-xl font-semibold mb-2 ${themeClasses.textPrimary}`}>
                No tasks found
              </h3>
              <p className={themeClasses.textSecondary}>Create a new task to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div
          className={`fixed inset-0 ${themeClasses.modalBackdrop} backdrop-blur-sm flex items-center justify-center z-50 p-4`}
        >
          <div
            className={`${themeClasses.modalBg} rounded-2xl border ${themeClasses.modalBorder} w-full max-w-lg ${themeClasses.shadowLg}`}
          >
            <div
              className={`flex items-center justify-between p-6 border-b ${themeClasses.divider}`}
            >
              <h3 className={`text-xl font-bold ${themeClasses.textPrimary}`}>Create New Task</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className={`p-2 ${themeClasses.cardHover} rounded-lg transition-colors ${themeClasses.textPrimary}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${themeClasses.textPrimary}`}>
                  Task Title
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Enter task title..."
                  className={`w-full px-4 py-3 ${themeClasses.inputBg} border ${themeClasses.inputBorder} rounded-lg ${themeClasses.inputFocus} focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all ${themeClasses.inputText}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${themeClasses.textPrimary}`}>
                  Description
                </label>
                <textarea
                  value={newTask.description}
                  onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Enter task description..."
                  rows={3}
                  className={`w-full px-4 py-3 ${themeClasses.inputBg} border ${themeClasses.inputBorder} rounded-lg ${themeClasses.inputFocus} focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all resize-none ${themeClasses.inputText}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${themeClasses.textPrimary}`}>
                    Priority
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={e =>
                      setNewTask({
                        ...newTask,
                        priority: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH',
                      })
                    }
                    className={`w-full px-4 py-3 ${themeClasses.inputBg} border ${themeClasses.inputBorder} rounded-lg ${themeClasses.inputFocus} focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all ${themeClasses.inputText}`}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${themeClasses.textPrimary}`}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={e => setNewTask({ ...newTask, due_date: e.target.value })}
                    className={`w-full px-4 py-3 ${themeClasses.inputBg} border ${themeClasses.inputBorder} rounded-lg ${themeClasses.inputFocus} focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all ${themeClasses.inputText}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${themeClasses.textPrimary}`}>
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {newTask.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className={`px-3 py-1 bg-purple-500/20 ${themeClasses.textPrimary} text-xs rounded-full border border-purple-500/30 flex items-center gap-1`}
                    >
                      {tag}
                      <button
                        onClick={() => {
                          const newTags = newTask.tags.filter((_, i) => i !== idx)
                          setNewTask({ ...newTask, tags: newTags })
                        }}
                        className="hover:text-red-400 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add tag and press Enter"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      const newTag = e.currentTarget.value.trim()
                      if (!newTask.tags.includes(newTag)) {
                        setNewTask({ ...newTask, tags: [...newTask.tags, newTag] })
                      }
                      e.currentTarget.value = ''
                    }
                  }}
                  className={`w-full px-4 py-3 ${themeClasses.inputBg} border ${themeClasses.inputBorder} rounded-lg ${themeClasses.inputFocus} focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all ${themeClasses.inputText}`}
                />
              </div>
            </div>

            <div className={`flex items-center gap-3 p-6 border-t ${themeClasses.divider}`}>
              <button
                onClick={() => setShowAddModal(false)}
                className={`flex-1 px-6 py-3 ${themeClasses.buttonSecondary} rounded-lg font-semibold transition-all ${themeClasses.textPrimary}`}
              >
                Cancel
              </button>
              <button
                onClick={addTask}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/20 text-white"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditModal && taskToEdit && (
        <TaskEditModal
          task={taskToEdit}
          onSave={updateTask}
          onClose={() => {
            setShowEditModal(false)
            setTaskToEdit(null)
          }}
        />
      )}

      {/* Task Detail Drawer */}
      {showTaskDrawer && selectedTask && (
        <div
          className={`fixed inset-0 ${themeClasses.modalBackdrop} backdrop-blur-sm z-50 flex justify-end`}
          onClick={() => setShowTaskDrawer(false)}
        >
          <div
            className={`w-full max-w-md ${themeClasses.modalBg} border-l ${themeClasses.modalBorder} ${themeClasses.shadowLg} overflow-y-auto`}
            onClick={e => e.stopPropagation()}
          >
            <div className={`p-6 border-b ${themeClasses.divider}`}>
              <div className="flex items-start justify-between mb-4">
                <h3 className={`text-2xl font-bold ${themeClasses.textPrimary}`}>
                  {selectedTask.title}
                </h3>
                <button
                  onClick={() => setShowTaskDrawer(false)}
                  className={`p-2 ${themeClasses.cardHover} rounded-lg transition-colors ${themeClasses.textPrimary}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(selectedTask.priority)}`}
                >
                  {selectedTask.priority}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    selectedTask.status === 'COMPLETE'
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : `${themeClasses.buttonSecondary} ${themeClasses.textPrimary}`
                  }`}
                >
                  {selectedTask.status}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className={`text-sm font-semibold ${themeClasses.textSecondary} mb-2`}>
                  Description
                </h4>
                <p className={themeClasses.textPrimary}>
                  {selectedTask.description || 'No description'}
                </p>
              </div>

              <div>
                <h4 className={`text-sm font-semibold ${themeClasses.textSecondary} mb-2`}>
                  Due Date
                </h4>
                <div className={`flex items-center gap-2 ${themeClasses.textPrimary}`}>
                  <Calendar className="w-4 h-4" />
                  {formatDueDate(selectedTask.due_date)}
                </div>
              </div>

              {selectedTask.tags && selectedTask.tags.length > 0 && (
                <div>
                  <h4 className={`text-sm font-semibold ${themeClasses.textSecondary} mb-2`}>
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTask.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/30"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className={`text-sm font-semibold ${themeClasses.textSecondary} mb-2`}>
                  Status Indicators
                </h4>
                <div className="flex flex-col gap-2">
                  <OverdueBadge dueDate={selectedTask.due_date} />
                  <DueSoonBadge dueDate={selectedTask.due_date} />
                </div>
              </div>

              <div>
                <h4 className={`text-sm font-semibold ${themeClasses.textSecondary} mb-2`}>
                  Created
                </h4>
                <p className={themeClasses.textPrimary}>
                  {new Date(selectedTask.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    toggleComplete(selectedTask.id)
                    setShowTaskDrawer(false)
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all text-white"
                >
                  {selectedTask.status === 'COMPLETE' ? 'Mark Incomplete' : 'Mark Complete'}
                </button>
                <button
                  onClick={() => {
                    deleteTask(selectedTask.id)
                    setShowTaskDrawer(false)
                  }}
                  className="px-6 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg font-semibold hover:bg-red-500/30 transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProDashboard
