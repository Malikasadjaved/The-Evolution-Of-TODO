/**
 * SearchSuggestions Component - Smart Search Dropdown
 *
 * Features:
 * - Show on focus (before typing):
 *   - Recent searches (last 3-5)
 *   - Quick filters: "High Priority", "Due Today", "Overdue"
 * - Show while typing:
 *   - Live filtered task results
 *   - Highlight matching text
 *   - Show task count
 * - Keyboard navigation:
 *   - Arrow up/down to navigate
 *   - Enter to select
 *   - Escape to close
 * - Click to open task detail
 *
 * Design:
 * - Glassmorphism background
 * - Smooth animations
 * - Accessible ARIA labels
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { ANIMATION_PRESETS } from '@/lib/design-tokens'

interface Task {
  id: number
  title: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  status: 'INCOMPLETE' | 'COMPLETE'
  due_date?: string | null
}

interface SearchSuggestionsProps {
  isOpen: boolean
  searchQuery: string
  tasks: Task[]
  recentSearches?: string[]
  onTaskClick?: (taskId: number) => void
  onQuickFilterClick?: (filterId: string) => void
  onRecentSearchClick?: (search: string) => void
  onDeleteRecentSearch?: (search: string) => void
  onClose?: () => void
  selectedIndex?: number
  onSelectIndex?: (index: number) => void
}

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  isOpen,
  searchQuery,
  tasks,
  recentSearches = [],
  onTaskClick,
  onQuickFilterClick,
  onRecentSearchClick,
  onDeleteRecentSearch,
  onClose,
  selectedIndex = -1,
  onSelectIndex,
}) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Filter tasks based on search query
  const filteredTasks = searchQuery.trim()
    ? tasks.filter((task) =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const totalItems = searchQuery.trim()
        ? filteredTasks.length
        : recentSearches.length

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        onSelectIndex?.(selectedIndex < totalItems - 1 ? selectedIndex + 1 : 0)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        onSelectIndex?.(selectedIndex > 0 ? selectedIndex - 1 : totalItems - 1)
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault()
        // Handle selection based on current mode
        if (searchQuery.trim()) {
          if (selectedIndex < filteredTasks.length) {
            onTaskClick?.(filteredTasks[selectedIndex].id)
          }
        } else {
          if (selectedIndex < recentSearches.length) {
            onRecentSearchClick?.(recentSearches[selectedIndex])
          }
        }
      } else if (e.key === 'Escape') {
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    isOpen,
    selectedIndex,
    searchQuery,
    filteredTasks,
    recentSearches,
    onSelectIndex,
    onTaskClick,
    onRecentSearchClick,
    onClose,
  ])

  if (!isOpen) return null

  // Highlight matching text in search results
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text

    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark
          key={index}
          className={`${isDark ? 'bg-cyan-400/30 text-cyan-300' : 'bg-blue-200 text-blue-900'} rounded px-0.5`}
        >
          {part}
        </mark>
      ) : (
        <span key={index}>{part}</span>
      )
    )
  }

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'HIGH':
        return isDark ? 'text-red-400' : 'text-red-600'
      case 'MEDIUM':
        return isDark ? 'text-yellow-400' : 'text-yellow-600'
      case 'LOW':
        return isDark ? 'text-green-400' : 'text-green-600'
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`
            absolute top-full left-0 right-0 mt-2
            ${isDark ? 'bg-[#1a2234]' : 'bg-white'}
            border ${isDark ? 'border-blue-500/20' : 'border-gray-200'}
            rounded-xl shadow-2xl
            backdrop-blur-xl
            overflow-hidden
            z-50
            max-h-[400px]
            overflow-y-auto
          `}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={ANIMATION_PRESETS.smoothSpring}
        >
          {searchQuery.trim() ? (
            // Search Results Mode
            <>
              {filteredTasks.length > 0 ? (
                <>
                  {/* Results Header */}
                  <div
                    className={`
                    px-4 py-2 text-xs font-semibold uppercase tracking-wide
                    ${isDark ? 'text-gray-400 bg-white/5' : 'text-gray-600 bg-gray-50'}
                  `}
                  >
                    {filteredTasks.length} result{filteredTasks.length !== 1 ? 's' : ''}
                  </div>

                  {/* Task Results */}
                  {filteredTasks.map((task, index) => (
                    <motion.button
                      key={task.id}
                      onClick={() => onTaskClick?.(task.id)}
                      className={`
                        w-full px-4 py-3 text-left transition-colors
                        ${
                          selectedIndex === index
                            ? isDark
                              ? 'bg-cyan-500/20'
                              : 'bg-blue-100'
                            : isDark
                            ? 'hover:bg-white/5'
                            : 'hover:bg-gray-50'
                        }
                        border-b ${isDark ? 'border-blue-500/10' : 'border-gray-100'}
                        last:border-b-0
                        flex items-start gap-3
                      `}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      {/* Task Status Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        <div
                          className={`
                          w-5 h-5 rounded-full border-2 flex items-center justify-center
                          ${
                            task.status === 'COMPLETE'
                              ? isDark
                                ? 'border-green-400 bg-green-400/20'
                                : 'border-green-500 bg-green-100'
                              : isDark
                              ? 'border-gray-600'
                              : 'border-gray-400'
                          }
                        `}
                        >
                          {task.status === 'COMPLETE' && (
                            <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </div>
                      </div>

                      {/* Task Info */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium ${
                            isDark ? 'text-white' : 'text-gray-900'
                          }`}
                        >
                          {highlightText(task.title, searchQuery)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          {task.due_date && (
                            <span
                              className={`text-xs ${
                                isDark ? 'text-gray-400' : 'text-gray-600'
                              }`}
                            >
                              Due {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </>
              ) : (
                // No Results
                <div className="flex flex-col items-center justify-center py-8 px-4">
                  <svg
                    className={`w-12 h-12 mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    No tasks found
                  </p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    Try a different search term
                  </p>
                </div>
              )}
            </>
          ) : (
            // Default Mode (Recent Searches + Quick Filters)
            <>
              {/* Recent Searches */}
              {recentSearches.length > 0 ? (
                <>
                  <div
                    className={`
                    px-4 py-2 text-xs font-semibold uppercase tracking-wide
                    ${isDark ? 'text-gray-400 bg-white/5' : 'text-gray-600 bg-gray-50'}
                  `}
                  >
                    Recent Searches
                  </div>
                  {recentSearches.slice(0, 5).map((search, index) => (
                    <motion.div
                      key={search}
                      className={`
                        w-full px-4 py-2.5 transition-colors relative
                        ${
                          selectedIndex === index
                            ? isDark
                              ? 'bg-cyan-500/20'
                              : 'bg-blue-100'
                            : isDark
                            ? 'hover:bg-white/5'
                            : 'hover:bg-gray-50'
                        }
                        border-b ${isDark ? 'border-blue-500/10' : 'border-gray-100'}
                        flex items-center gap-3 group
                      `}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <button
                        onClick={() => onRecentSearchClick?.(search)}
                        className="flex items-center gap-3 flex-1 text-left"
                      >
                        <svg
                          className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
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
                        <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {search}
                        </span>
                      </button>

                      {/* Delete Button */}
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteRecentSearch?.(search)
                        }}
                        className={`
                          opacity-0 group-hover:opacity-100 transition-opacity
                          p-1.5 rounded-lg
                          ${isDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-100 text-red-600'}
                        `}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label="Delete recent search"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </motion.button>
                    </motion.div>
                  ))}
                </>
              ) : (
                // Empty state when no recent searches
                <div className="flex flex-col items-center justify-center py-8 px-4">
                  <svg
                    className={`w-12 h-12 mb-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    No recent searches
                  </p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    Your search history will appear here
                  </p>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default SearchSuggestions
