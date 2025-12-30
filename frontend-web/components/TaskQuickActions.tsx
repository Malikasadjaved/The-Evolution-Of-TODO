/**
 * TaskQuickActions Component - Three-Dot Dropdown Menu
 *
 * Features:
 * - Three-dot icon (⋮) visible on task card hover
 * - Animated dropdown menu with glassmorphism
 * - Quick actions: Edit, Delete, Move to In Progress, Set Priority
 * - Priority submenu (HIGH/MEDIUM/LOW)
 * - Smooth AnimatePresence transitions
 * - Click-outside-to-close behavior
 *
 * Usage:
 * <TaskQuickActions
 *   task={task}
 *   onEdit={() => handleEdit(task)}
 *   onDelete={() => handleDelete(task)}
 *   onUpdateStatus={(status) => handleStatusChange(task.id, status)}
 *   onUpdatePriority={(priority) => handlePriorityChange(task.id, priority)}
 * />
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Task } from '@/types/api'

interface TaskQuickActionsProps {
  task: Task
  onEdit?: () => void
  onDelete?: () => void
  onUpdateStatus?: (status: 'INCOMPLETE' | 'IN_PROGRESS' | 'COMPLETE') => void
  onUpdatePriority?: (priority: 'LOW' | 'MEDIUM' | 'HIGH') => void
}

export function TaskQuickActions({
  task,
  onEdit,
  onDelete,
  onUpdateStatus,
  onUpdatePriority,
}: TaskQuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showPrioritySubmenu, setShowPrioritySubmenu] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowPrioritySubmenu(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        setShowPrioritySubmenu(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(false)
    onEdit?.()
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(false)
    onDelete?.()
  }

  const handleMoveToInProgress = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(false)
    onUpdateStatus?.('IN_PROGRESS')
  }

  const handleSetPriority = (priority: 'LOW' | 'MEDIUM' | 'HIGH') => (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(false)
    setShowPrioritySubmenu(false)
    onUpdatePriority?.(priority)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Three-Dot Button */}
      <motion.button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="
          p-1.5
          rounded-lg
          transition-all
          duration-200
          hover:bg-white/10
          focus:outline-none
          focus:ring-2
          focus:ring-purple-400/50
          opacity-0
          group-hover:opacity-100
        "
        aria-label="Task actions"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <svg
          className="w-5 h-5 text-white/60 hover:text-white"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 25,
            }}
            className="
              absolute
              right-0
              top-full
              mt-2
              w-56
              bg-white/10
              backdrop-blur-md
              border
              border-purple-400/20
              rounded-lg
              shadow-xl
              shadow-black/50
              overflow-hidden
              z-50
            "
            onClick={(e) => e.stopPropagation()}
          >
            {/* Edit */}
            {onEdit && (
              <motion.button
                onClick={handleEdit}
                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                className="
                  w-full
                  px-4
                  py-3
                  flex
                  items-center
                  gap-3
                  text-left
                  text-white/90
                  hover:text-white
                  transition-colors
                  border-b
                  border-purple-400/10
                "
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <span className="text-sm font-medium">Edit</span>
              </motion.button>
            )}

            {/* Delete */}
            {onDelete && (
              <motion.button
                onClick={handleDelete}
                whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                className="
                  w-full
                  px-4
                  py-3
                  flex
                  items-center
                  gap-3
                  text-left
                  text-red-400
                  hover:text-red-300
                  transition-colors
                  border-b
                  border-purple-400/10
                "
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span className="text-sm font-medium">Delete</span>
              </motion.button>
            )}

            {/* Mark as Incomplete (if currently complete) */}
            {onUpdateStatus && task.status === 'COMPLETE' && (
              <motion.button
                onClick={handleMoveToInProgress}
                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                className="
                  w-full
                  px-4
                  py-3
                  flex
                  items-center
                  gap-3
                  text-left
                  text-white/90
                  hover:text-white
                  transition-colors
                  border-b
                  border-purple-400/10
                "
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
                <span className="text-sm font-medium">Move to In Progress</span>
              </motion.button>
            )}

            {/* Set Priority (with submenu) */}
            {onUpdatePriority && (
              <div className="relative">
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowPrioritySubmenu(!showPrioritySubmenu)
                  }}
                  whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                  className="
                    w-full
                    px-4
                    py-3
                    flex
                    items-center
                    justify-between
                    gap-3
                    text-left
                    text-white/90
                    hover:text-white
                    transition-colors
                  "
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                      />
                    </svg>
                    <span className="text-sm font-medium">Set Priority</span>
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform ${showPrioritySubmenu ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.button>

                {/* Priority Submenu */}
                <AnimatePresence>
                  {showPrioritySubmenu && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="bg-black/30 border-t border-purple-400/10"
                    >
                      {/* HIGH Priority */}
                      <motion.button
                        onClick={handleSetPriority('HIGH')}
                        whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                        className="
                          w-full
                          px-6
                          py-2.5
                          flex
                          items-center
                          gap-3
                          text-left
                          text-red-400
                          hover:text-red-300
                          transition-colors
                        "
                      >
                        <div className="w-3 h-3 bg-red-500 rounded-full" />
                        <span className="text-sm font-medium">HIGH</span>
                      </motion.button>

                      {/* MEDIUM Priority */}
                      <motion.button
                        onClick={handleSetPriority('MEDIUM')}
                        whileHover={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}
                        className="
                          w-full
                          px-6
                          py-2.5
                          flex
                          items-center
                          gap-3
                          text-left
                          text-yellow-400
                          hover:text-yellow-300
                          transition-colors
                        "
                      >
                        <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                        <span className="text-sm font-medium">MEDIUM</span>
                      </motion.button>

                      {/* LOW Priority */}
                      <motion.button
                        onClick={handleSetPriority('LOW')}
                        whileHover={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                        className="
                          w-full
                          px-6
                          py-2.5
                          flex
                          items-center
                          gap-3
                          text-left
                          text-green-400
                          hover:text-green-300
                          transition-colors
                        "
                      >
                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                        <span className="text-sm font-medium">LOW</span>
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
