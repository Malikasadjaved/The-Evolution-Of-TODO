/**
 * CommandPalette Component - Spotlight/Raycast-style Command Center
 *
 * Features:
 * - Global search across all tasks (fuzzy matching)
 * - Quick actions (Add task, Show filters, AI chat)
 * - Keyboard shortcuts (Cmd/Ctrl+K to open, Arrow keys to navigate, Enter to execute)
 * - Recent tasks display
 * - Instant command execution
 * - Smooth animations with Framer Motion
 *
 * Keyboard Shortcuts:
 * - Cmd/Ctrl+K: Open/close palette
 * - Cmd/Ctrl+N: Quick add task
 * - ESC: Close palette
 * - Arrow Up/Down: Navigate commands
 * - Enter: Execute selected command
 */

'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import type { Task } from '@/types/api'

export interface CommandPaletteProps {
  /** All tasks for searching */
  tasks?: Task[]

  /** Callback when user wants to create a task */
  onCreateTask?: () => void

  /** Callback when user wants to open AI chat */
  onOpenAIChat?: () => void

  /** Callback when user selects a task */
  onSelectTask?: (task: Task) => void

  /** Callback when applying filters */
  onApplyFilter?: (filter: { type: string; value: string }) => void

  /** External control: is command palette open */
  isOpen?: boolean

  /** Callback when palette open state changes */
  onOpenChange?: (isOpen: boolean) => void
}

interface Command {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  action: () => void
  category: 'action' | 'filter' | 'task' | 'recent'
  searchTerms?: string[]
}

/**
 * Fuzzy search utility - matches partial strings across words
 */
function fuzzyMatch(text: string, query: string): boolean {
  if (!query) return true

  const searchText = text.toLowerCase()
  const searchQuery = query.toLowerCase().trim()

  // Simple fuzzy matching: check if all characters appear in order
  let queryIndex = 0
  for (let i = 0; i < searchText.length && queryIndex < searchQuery.length; i++) {
    if (searchText[i] === searchQuery[queryIndex]) {
      queryIndex++
    }
  }

  return queryIndex === searchQuery.length
}

/**
 * Get priority badge color
 */
function getPriorityColor(priority?: string): string {
  switch (priority) {
    case 'HIGH':
      return 'bg-red-500/20 text-red-300'
    case 'MEDIUM':
      return 'bg-yellow-500/20 text-yellow-300'
    case 'LOW':
      return 'bg-green-500/20 text-green-300'
    default:
      return 'bg-gray-500/20 text-gray-300'
  }
}

export function CommandPalette({
  tasks = [],
  onCreateTask,
  onOpenAIChat,
  onSelectTask,
  onApplyFilter,
  isOpen: externalIsOpen,
  onOpenChange,
}: CommandPaletteProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Use external isOpen if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
  const setIsOpen = (value: boolean | ((prev: boolean) => boolean)) => {
    const newValue = typeof value === 'function' ? value(isOpen) : value
    if (onOpenChange) {
      onOpenChange(newValue)
    } else {
      setInternalIsOpen(newValue)
    }
  }

  // Define quick action commands
  const quickActions: Command[] = useMemo(() => [
    {
      id: 'create-task',
      label: 'Create new task',
      description: 'Add a new task to your list',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      action: () => {
        setIsOpen(false)
        onCreateTask?.()
      },
      category: 'action',
      searchTerms: ['add', 'new', 'create', 'task'],
    },
    {
      id: 'ai-chat',
      label: 'Ask AI Assistant',
      description: 'Chat with your AI task helper',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      action: () => {
        setIsOpen(false)
        onOpenAIChat?.()
      },
      category: 'action',
      searchTerms: ['ai', 'chat', 'assistant', 'help', 'ask'],
    },
    {
      id: 'filter-high',
      label: 'Show high priority tasks',
      description: 'Filter by high priority',
      icon: (
        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      action: () => {
        setIsOpen(false)
        onApplyFilter?.({ type: 'priority', value: 'HIGH' })
      },
      category: 'filter',
      searchTerms: ['high', 'priority', 'urgent', 'filter'],
    },
    {
      id: 'filter-medium',
      label: 'Show medium priority tasks',
      description: 'Filter by medium priority',
      icon: (
        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      action: () => {
        setIsOpen(false)
        onApplyFilter?.({ type: 'priority', value: 'MEDIUM' })
      },
      category: 'filter',
      searchTerms: ['medium', 'priority', 'filter'],
    },
    {
      id: 'filter-incomplete',
      label: 'Show incomplete tasks',
      description: 'Filter by status: incomplete',
      icon: (
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      action: () => {
        setIsOpen(false)
        onApplyFilter?.({ type: 'status', value: 'INCOMPLETE' })
      },
      category: 'filter',
      searchTerms: ['incomplete', 'todo', 'pending', 'filter', 'status'],
    },
    {
      id: 'filter-complete',
      label: 'Show completed tasks',
      description: 'Filter by status: complete',
      icon: (
        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      action: () => {
        setIsOpen(false)
        onApplyFilter?.({ type: 'status', value: 'COMPLETE' })
      },
      category: 'filter',
      searchTerms: ['complete', 'done', 'finished', 'filter', 'status'],
    },
  ], [onCreateTask, onOpenAIChat, onApplyFilter])

  // Convert tasks to commands
  const taskCommands: Command[] = useMemo(() => {
    return (tasks || []).slice(0, 10).map((task) => ({
      id: `task-${task.id}`,
      label: task.title,
      description: task.description || `${task.priority} priority`,
      icon: (
        <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      action: () => {
        setIsOpen(false)
        onSelectTask?.(task)
      },
      category: 'task',
      searchTerms: [task.title, task.description || '', task.priority || '', ...(task.tags || [])],
    }))
  }, [tasks, onSelectTask])

  // Filter commands based on search query
  const filteredCommands = useMemo(() => {
    const allCommands = [...quickActions, ...taskCommands]

    if (!searchQuery.trim()) {
      return allCommands
    }

    return allCommands.filter((command) => {
      const searchText = [command.label, command.description, ...(command.searchTerms || [])].join(' ')
      return fuzzyMatch(searchText, searchQuery)
    })
  }, [quickActions, taskCommands, searchQuery])

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {
      action: [],
      filter: [],
      task: [],
      recent: [],
    }

    filteredCommands.forEach((command) => {
      groups[command.category].push(command)
    })

    return groups
  }, [filteredCommands])

  // Reset selected index when filtered commands change
  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredCommands])

  // Global keyboard shortcut (Cmd/Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+K: Toggle command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
        setSearchQuery('')
        setSelectedIndex(0)
      }

      // ESC: Close palette
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredCommands.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length)
        break

      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length)
        break

      case 'Enter':
        e.preventDefault()
        filteredCommands[selectedIndex]?.action()
        break
    }
  }

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Command Palette Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-[101]"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <div className="bg-slate-900/95 backdrop-blur-2xl border border-blue-500/30 rounded-2xl shadow-2xl overflow-hidden mx-4">
              {/* Gradient mesh background */}
              <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl" />
              </div>

              {/* Search Input */}
              <div className="relative p-4 border-b border-blue-500/20">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>

                  <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search tasks, actions, or type a command..."
                    className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-lg"
                    autoComplete="off"
                  />

                  {/* Keyboard shortcut hint */}
                  <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">
                    <kbd className="font-mono">ESC</kbd>
                  </div>
                </div>
              </div>

              {/* Commands List */}
              <div className="relative max-h-[400px] overflow-y-auto p-2">
                {filteredCommands.length === 0 ? (
                  // Empty state
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-400 text-sm">No results found</p>
                    <p className="text-gray-500 text-xs mt-1">Try a different search term</p>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {/* Quick Actions */}
                    {groupedCommands.action.length > 0 && (
                      <motion.div
                        key="actions-group"
                        className="mb-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <div className="px-3 py-1 text-xs text-gray-500 font-semibold uppercase tracking-wider">
                          Quick Actions
                        </div>
                        <div className="space-y-1">
                          {groupedCommands.action.map((command, index) => {
                            const globalIndex = filteredCommands.indexOf(command)
                            const isSelected = globalIndex === selectedIndex

                            return (
                              <motion.button
                                key={command.id}
                                onClick={command.action}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left ${
                                  isSelected
                                    ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/40'
                                    : 'hover:bg-white/5 border border-transparent'
                                }`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.02 }}
                                whileHover={{ x: 4 }}
                              >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  isSelected ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-400'
                                }`}>
                                  {command.icon}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-medium truncate">{command.label}</p>
                                  {command.description && (
                                    <p className="text-sm text-gray-400 truncate">{command.description}</p>
                                  )}
                                </div>

                                {isSelected && (
                                  <kbd className="hidden sm:block text-xs text-gray-400 bg-white/5 px-2 py-1 rounded font-mono">
                                    ↵
                                  </kbd>
                                )}
                              </motion.button>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}

                    {/* Filters */}
                    {groupedCommands.filter.length > 0 && (
                      <motion.div
                        key="filters-group"
                        className="mb-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <div className="px-3 py-1 text-xs text-gray-500 font-semibold uppercase tracking-wider">
                          Filters
                        </div>
                        <div className="space-y-1">
                          {groupedCommands.filter.map((command, index) => {
                            const globalIndex = filteredCommands.indexOf(command)
                            const isSelected = globalIndex === selectedIndex

                            return (
                              <motion.button
                                key={command.id}
                                onClick={command.action}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                                  isSelected
                                    ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/40'
                                    : 'hover:bg-white/5 border border-transparent'
                                }`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: groupedCommands.action.length * 0.02 + index * 0.02 }}
                                whileHover={{ x: 4 }}
                              >
                                <div className="flex-shrink-0">
                                  {command.icon}
                                </div>

                                <p className="text-white text-sm truncate">{command.label}</p>
                              </motion.button>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}

                    {/* Tasks */}
                    {groupedCommands.task.length > 0 && (
                      <motion.div
                        key="tasks-group"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <div className="px-3 py-1 text-xs text-gray-500 font-semibold uppercase tracking-wider">
                          Tasks ({tasks?.length || 0})
                        </div>
                        <div className="space-y-1">
                          {groupedCommands.task.map((command, index) => {
                            const globalIndex = filteredCommands.indexOf(command)
                            const isSelected = globalIndex === selectedIndex
                            const taskId = Number(command.id.replace('task-', ''))
                            const task = tasks?.find((t) => t.id === taskId)

                            return (
                              <motion.button
                                key={command.id}
                                onClick={command.action}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left ${
                                  isSelected
                                    ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/40'
                                    : 'hover:bg-white/5 border border-transparent'
                                }`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: (groupedCommands.action.length + groupedCommands.filter.length) * 0.02 + index * 0.02 }}
                                whileHover={{ x: 4 }}
                              >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  isSelected ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-gray-400'
                                }`}>
                                  {command.icon}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-medium truncate">{command.label}</p>
                                  {command.description && (
                                    <p className="text-xs text-gray-400 truncate">{command.description}</p>
                                  )}
                                </div>

                                {task?.priority && (
                                  <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                                    {task.priority}
                                  </span>
                                )}
                              </motion.button>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>

              {/* Footer with keyboard shortcuts hint */}
              <div className="relative border-t border-blue-500/20 px-4 py-3 bg-gradient-to-r from-blue-500/5 to-cyan-500/5">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <kbd className="px-2 py-1 bg-white/5 rounded font-mono">↑↓</kbd>
                      <span>Navigate</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="px-2 py-1 bg-white/5 rounded font-mono">↵</kbd>
                      <span>Select</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="px-2 py-1 bg-white/5 rounded font-mono">ESC</kbd>
                      <span>Close</span>
                    </div>
                  </div>

                  <div className="hidden sm:block">
                    <span className="text-gray-500">Tip: Press</span>
                    {' '}
                    <kbd className="px-2 py-1 bg-white/5 rounded font-mono">⌘K</kbd>
                    {' '}
                    <span className="text-gray-500">anytime</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
