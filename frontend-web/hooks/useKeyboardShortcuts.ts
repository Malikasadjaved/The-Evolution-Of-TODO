/**
 * useKeyboardShortcuts Hook - Global Keyboard Navigation
 *
 * Manages global keyboard shortcuts for the application:
 * - Cmd/Ctrl+K: Open command palette
 * - Cmd/Ctrl+N: Quick add task
 * - Cmd/Ctrl+/: Open AI chat
 * - ESC: Close modals/dialogs
 *
 * Features:
 * - Cross-platform support (Mac: Cmd, Windows/Linux: Ctrl)
 * - Prevents conflicts with native browser shortcuts
 * - Accessible keyboard navigation
 */

'use client'

import { useEffect, useCallback } from 'react'

export interface KeyboardShortcutHandlers {
  /** Handler for Cmd/Ctrl+K (Command Palette) */
  onOpenCommandPalette?: () => void

  /** Handler for Cmd/Ctrl+N (New Task) */
  onNewTask?: () => void

  /** Handler for Cmd/Ctrl+/ (AI Chat) */
  onOpenAIChat?: () => void

  /** Handler for ESC (Close modals) */
  onEscape?: () => void
}

/**
 * Check if the key combination matches (cross-platform)
 */
function isModifierKey(e: KeyboardEvent): boolean {
  return e.metaKey || e.ctrlKey
}

/**
 * Global keyboard shortcuts hook
 */
export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  const {
    onOpenCommandPalette,
    onNewTask,
    onOpenAIChat,
    onEscape,
  } = handlers

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignore shortcuts when typing in input fields (except ESC)
      const isInputField =
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement

      // ESC always works (even in input fields)
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault()
        onEscape()
        return
      }

      // Skip other shortcuts if focused on input field
      if (isInputField && event.key !== 'Escape') {
        return
      }

      // Cmd/Ctrl+K: Open Command Palette
      if (isModifierKey(event) && event.key === 'k' && onOpenCommandPalette) {
        event.preventDefault()
        onOpenCommandPalette()
        return
      }

      // Cmd/Ctrl+N: New Task
      if (isModifierKey(event) && event.key === 'n' && onNewTask) {
        event.preventDefault()
        onNewTask()
        return
      }

      // Cmd/Ctrl+/: AI Chat
      if (isModifierKey(event) && event.key === '/' && onOpenAIChat) {
        event.preventDefault()
        onOpenAIChat()
        return
      }
    },
    [onOpenCommandPalette, onNewTask, onOpenAIChat, onEscape]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}

/**
 * Get platform-specific modifier key name
 */
export function getModifierKeyName(): string {
  const isMac =
    typeof window !== 'undefined' &&
    /Mac|iPhone|iPad|iPod/.test(window.navigator.userAgent)

  return isMac ? '⌘' : 'Ctrl'
}

/**
 * Format keyboard shortcut for display
 */
export function formatShortcut(key: string): string {
  const modifier = getModifierKeyName()
  return `${modifier}+${key.toUpperCase()}`
}
