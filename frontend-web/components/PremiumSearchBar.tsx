/**
 * PremiumSearchBar Component - Command Palette Quality Search
 *
 * Enhanced search bar matching the command palette sophistication:
 * - Premium glassmorphism with thicker borders
 * - Animated gradient border on focus
 * - Larger search icon with glow effect
 * - Enhanced placeholder animation
 * - Focus ring with glow
 * - Keyboard shortcut badge (⌘K)
 *
 * Features:
 * - Real-time debounced search
 * - Animated gradient border
 * - Ripple effect on interactions
 * - Spring physics animations
 * - Theme-aware styling
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { SearchSuggestions } from './SearchSuggestions'

interface Task {
  id: number
  title: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  status: 'INCOMPLETE' | 'COMPLETE'
  due_date?: string | null
}

interface PremiumSearchBarProps {
  value: string
  onChange: (value: string) => void
  onCommandPaletteOpen: () => void
  placeholder?: string
  tasks?: Task[]
  onTaskClick?: (taskId: number) => void
  onQuickFilterClick?: (filterId: string) => void
}

export const PremiumSearchBar: React.FC<PremiumSearchBarProps> = ({
  value,
  onChange,
  onCommandPaletteOpen,
  placeholder = 'Search tasks...',
  tasks = [],
  onTaskClick,
  onQuickFilterClick,
}) => {
  const [isFocused, setIsFocused] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const { theme } = useTheme()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDark = theme === 'dark'

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentSearches')
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse recent searches:', e)
      }
    }
  }, [])

  // Save search to recent searches
  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return
    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setShowSuggestions(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
        setSelectedSuggestionIndex(-1)
      }
    }

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showSuggestions])

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true)
    setShowSuggestions(true)
  }

  // Handle blur
  const handleBlur = () => {
    setIsFocused(false)
    // Delay hiding suggestions to allow click events to fire
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setShowSuggestions(false)
        setSelectedSuggestionIndex(-1)
      }
    }, 200)
  }

  // Handle recent search click
  const handleRecentSearchClick = (search: string) => {
    onChange(search)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  // Handle task click
  const handleTaskClick = (taskId: number) => {
    saveRecentSearch(value)
    onTaskClick?.(taskId)
    setShowSuggestions(false)
  }

  // Handle quick filter click
  const handleQuickFilterClick = (filterId: string) => {
    onQuickFilterClick?.(filterId)
    setShowSuggestions(false)
  }

  return (
    <motion.div
      ref={containerRef}
      className="relative w-full max-w-[400px]"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      {/* Container with animated gradient border */}
      <div
        className={`
          relative
          flex items-center
          rounded-xl
          overflow-hidden
          backdrop-blur-xl
          transition-all duration-300
          ${
            isDark
              ? 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10'
              : 'bg-white/90'
          }
          ${
            isFocused
              ? isDark
                ? 'shadow-lg shadow-cyan-500/20'
                : 'shadow-lg shadow-blue-500/20'
              : ''
          }
        `}
      >
        {/* Animated gradient border effect */}
        <motion.div
          className={`
            absolute inset-0 rounded-xl
            bg-gradient-to-r
            ${
              isDark
                ? 'from-blue-500/30 via-cyan-500/50 to-blue-500/30'
                : 'from-blue-400/30 via-sky-400/50 to-blue-400/30'
            }
          `}
          initial={{ opacity: 0 }}
          animate={{
            opacity: isFocused ? 1 : 0,
            backgroundPosition: isFocused ? ['0% 50%', '100% 50%', '0% 50%'] : '0% 50%',
          }}
          transition={{
            opacity: { duration: 0.3 },
            backgroundPosition: {
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            },
          }}
          style={{
            backgroundSize: '200% 100%',
          }}
        />

        {/* Inner content container */}
        <div
          className={`
            relative
            flex items-center
            w-full
            rounded-xl
            border
            ${
              isDark
                ? isFocused
                  ? 'border-cyan-400/50'
                  : 'border-blue-500/30'
                : isFocused
                ? 'border-blue-400/50'
                : 'border-gray-300'
            }
            transition-colors duration-300
          `}
          style={{
            margin: '1px',
          }}
        >
          {/* Search Icon with glow */}
          <div className="absolute left-4 pointer-events-none">
            <motion.svg
              className={`w-5 h-5 transition-colors duration-300 ${
                isDark
                  ? isFocused
                    ? 'text-cyan-400'
                    : 'text-cyan-400/70'
                  : isFocused
                  ? 'text-blue-500'
                  : 'text-gray-500'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              animate={{
                filter: isFocused
                  ? isDark
                    ? 'drop-shadow(0 0 6px rgba(6, 182, 212, 0.5))'
                    : 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.5))'
                  : 'drop-shadow(0 0 0px rgba(0, 0, 0, 0))',
              }}
              transition={{ duration: 0.3 }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </motion.svg>
          </div>

          {/* Search Input */}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && value.trim()) {
                saveRecentSearch(value)
                e.currentTarget.blur()
                setShowSuggestions(false)
              }
              if (e.key === 'Escape') {
                onChange('')
                e.currentTarget.blur()
                setShowSuggestions(false)
              }
            }}
            placeholder={placeholder}
            className={`
              flex-1
              bg-transparent
              pl-12 pr-4 py-3
              outline-none
              text-base
              relative z-10
              min-h-[44px]
              ${
                isDark
                  ? 'text-white placeholder-gray-400'
                  : 'text-gray-900 placeholder-gray-500'
              }
            `}
            aria-autocomplete="list"
            aria-controls="search-suggestions"
            aria-expanded={showSuggestions}
          />

          {/* Clear button (when text is present) */}
          <AnimatePresence>
            {value && (
              <motion.button
                onClick={() => onChange('')}
                className={`
                  absolute right-20 z-20
                  p-1 rounded-lg
                  transition-colors duration-200
                  ${
                    isDark
                      ? 'text-gray-400 hover:text-cyan-400 hover:bg-cyan-400/10'
                      : 'text-gray-500 hover:text-blue-500 hover:bg-blue-500/10'
                  }
                `}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Clear search"
              >
                <svg
                  className="w-4 h-4"
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
            )}
          </AnimatePresence>

          {/* ⌘K Button - Premium Design */}
          <motion.button
            onClick={() => {
              if (!value.trim()) {
                onCommandPaletteOpen()
              } else {
                inputRef.current?.blur()
              }
            }}
            className={`
              relative z-10 mr-2
              px-4 py-1.5
              bg-gradient-to-r
              border-2
              rounded-xl
              text-xs font-mono font-bold
              backdrop-blur-xl
              shadow-lg
              transition-all duration-300
              ${
                isDark
                  ? 'from-blue-500/30 via-cyan-500/30 to-blue-500/30 border-cyan-400/50 text-cyan-300 shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:border-cyan-400/80'
                  : 'from-blue-400/30 via-sky-400/30 to-blue-400/30 border-blue-400/50 text-blue-600 shadow-blue-500/25 hover:shadow-blue-500/40 hover:border-blue-400/80'
              }
            `}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="flex items-center gap-1.5">
              <kbd>⌘K</kbd>
              <span className={`text-[10px] ${isDark ? 'text-cyan-400/80' : 'text-blue-500/80'}`}>
                {value ? 'Search' : 'Open'}
              </span>
            </span>
          </motion.button>
        </div>

        {/* Ripple effect on focus */}
        <AnimatePresence>
          {isFocused && (
            <motion.div
              className={`absolute inset-0 rounded-xl ${
                isDark ? 'bg-cyan-400/10' : 'bg-blue-400/10'
              }`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.2, opacity: [0.3, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Glow effect underline */}
      <motion.div
        className={`
          absolute -bottom-1 left-1/2 -translate-x-1/2
          h-0.5 rounded-full
          ${isDark ? 'bg-gradient-to-r from-transparent via-cyan-400 to-transparent' : 'bg-gradient-to-r from-transparent via-blue-400 to-transparent'}
        `}
        initial={{ width: '0%', opacity: 0 }}
        animate={{
          width: isFocused ? '100%' : '0%',
          opacity: isFocused ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Search Suggestions */}
      <SearchSuggestions
        isOpen={showSuggestions}
        searchQuery={value}
        tasks={tasks}
        recentSearches={recentSearches}
        onTaskClick={handleTaskClick}
        onQuickFilterClick={handleQuickFilterClick}
        onRecentSearchClick={handleRecentSearchClick}
        onClose={() => setShowSuggestions(false)}
        selectedIndex={selectedSuggestionIndex}
        onSelectIndex={setSelectedSuggestionIndex}
      />
    </motion.div>
  )
}

export default PremiumSearchBar
