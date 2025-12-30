/**
 * ChatInput Component - Message input field with send button
 *
 * Features:
 * - Auto-expanding textarea (up to 5 lines)
 * - Submit on Enter (Shift+Enter for newline)
 * - Disabled state during message sending
 * - Glassmorphism styling
 * - Smooth animations
 */

'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { motion } from 'framer-motion'

export interface ChatInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Handle Enter key (submit) vs Shift+Enter (newline)
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Handle form submission
  const handleSubmit = () => {
    const trimmed = message.trim()
    if (!trimmed || disabled) return

    onSendMessage(trimmed)
    setMessage('')

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  // Auto-expand textarea as user types
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)

    // Auto-resize textarea (max 5 lines)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      const maxHeight = 120 // ~5 lines
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`
    }
  }

  return (
    <div className="flex items-end gap-3">
      {/* Text Input */}
      <motion.div
        className="flex-1 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-lg border border-blue-500/30 rounded-xl overflow-hidden focus-within:border-cyan-400/50 transition-colors"
        whileHover={{ scale: 1.01 }}
        whileFocus={{ scale: 1.01 }}
      >
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Type your message..."
          rows={1}
          className="w-full bg-transparent text-white placeholder-gray-400 px-4 py-3 resize-none outline-none text-sm"
          style={{
            minHeight: '44px',
            maxHeight: '120px',
          }}
        />
      </motion.div>

      {/* Send Button */}
      <motion.button
        onClick={handleSubmit}
        disabled={!message.trim() || disabled}
        className={`
          w-11 h-11 rounded-xl flex items-center justify-center transition-all
          ${
            message.trim() && !disabled
              ? 'bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/50'
              : 'bg-white/5 border border-blue-500/20 cursor-not-allowed opacity-50'
          }
        `}
        whileHover={message.trim() && !disabled ? { scale: 1.05 } : {}}
        whileTap={message.trim() && !disabled ? { scale: 0.95 } : {}}
      >
        {disabled ? (
          // Loading spinner
          <motion.div
            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          />
        ) : (
          // Send icon
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        )}
      </motion.button>
    </div>
  )
}
