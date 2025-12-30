/**
 * ChatMessage Component - Individual message bubble
 *
 * Features:
 * - Differentiates user vs assistant messages
 * - Glassmorphism styling with gradient accents
 * - Smooth entrance animations
 * - Markdown-like text formatting (bold, code blocks)
 * - Timestamp display
 */

'use client'

import { motion } from 'framer-motion'
import type { Message } from '@/types/api'

export interface ChatMessageProps {
  message: Message
  index: number
}

export function ChatMessage({ message, index }: ChatMessageProps) {
  const isUser = message.role === 'USER'
  const isAssistant = message.role === 'ASSISTANT'

  // Format timestamp (e.g., "2:30 PM")
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  // Parse content for basic formatting (bold, code)
  const formatContent = (text: string) => {
    // Replace **text** with <strong>text</strong>
    let formatted = text.replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="font-semibold text-white">$1</strong>'
    )
    // Replace `code` with styled code blocks
    formatted = formatted.replace(
      /`(.*?)`/g,
      '<code class="px-2 py-0.5 bg-slate-800/80 rounded text-cyan-300 font-mono text-sm">$1</code>'
    )
    return formatted
  }

  return (
    <motion.div
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
        delay: index * 0.05,
      }}
    >
      {/* Avatar */}
      {isAssistant && (
        <motion.div
          className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.05 + 0.1 }}
        >
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
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </motion.div>
      )}

      {isUser && (
        <motion.div
          className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.05 + 0.1 }}
        >
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
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </motion.div>
      )}

      {/* Message Bubble */}
      <div className={`flex flex-col gap-1 max-w-[75%] ${isUser ? 'items-end' : ''}`}>
        <motion.div
          className={`
            backdrop-blur-lg border rounded-2xl p-4
            ${
              isUser
                ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30 rounded-tr-none'
                : 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 rounded-tl-none'
            }
          `}
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <p
            className="text-sm text-gray-200 leading-relaxed break-words"
            dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
          />
        </motion.div>

        {/* Timestamp */}
        <motion.p
          className="text-xs text-gray-500 px-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.05 + 0.2 }}
        >
          {formatTime(message.created_at)}
        </motion.p>
      </div>
    </motion.div>
  )
}
