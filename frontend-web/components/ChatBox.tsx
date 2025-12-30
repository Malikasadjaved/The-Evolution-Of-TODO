/**
 * ChatBox Component - Integrated AI Chatbot
 *
 * Features:
 * - Floating chat button (bottom-right)
 * - Expandable chat panel with smooth animations
 * - Real-time message exchange with AI assistant
 * - Typing indicators and loading states
 * - Glassmorphism design matching dashboard aesthetic
 * - Quick action buttons for common tasks
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { ChatMessage } from '@/components/ChatMessage'
import { ChatInput } from '@/components/ChatInput'
import { useSendMessage } from '@/hooks/useChat'
import { useAuth } from '@/hooks/useAuth'
import type { Message } from '@/types/api'

export interface ChatBoxProps {
  /** Optional conversation ID to continue existing conversation */
  conversationId?: number

  /** Control open/close state externally */
  isOpen?: boolean

  /** Callback when chat is toggled */
  onToggle?: (isOpen: boolean) => void
}

export function ChatBox({
  conversationId: initialConversationId,
  isOpen: externalIsOpen,
  onToggle,
}: ChatBoxProps) {
  const { user } = useAuth()
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [conversationId, setConversationId] = useState<number | undefined>(
    initialConversationId
  )
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])

  const chatContainerRef = useRef<HTMLDivElement>(null)

  const sendMessage = useSendMessage()

  // Use external or internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen

  // Sync external state changes
  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setInternalIsOpen(externalIsOpen)
      if (externalIsOpen) {
        setHasNewMessage(false)
      }
    }
  }, [externalIsOpen])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current && isOpen) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages, isOpen])

  // Show notification badge when chat is closed and new message arrives
  useEffect(() => {
    if (!isOpen && messages && messages.length > 0) {
      setHasNewMessage(true)
    }
  }, [messages, isOpen])

  // Clear notification badge when opening chat
  const handleToggleChat = () => {
    const newState = !isOpen
    setInternalIsOpen(newState)
    onToggle?.(newState)
    if (newState) {
      setHasNewMessage(false)
    }
  }

  // Handler: Send message to AI assistant
  const handleSendMessage = async (message: string) => {
    if (!user) return

    // Add user message immediately (optimistic update)
    const userMessage: Message = {
      id: Date.now(),
      conversation_id: conversationId || 0,
      user_id: user.id,
      role: 'USER',
      content: message,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])

    try {
      const response = await sendMessage.mutateAsync({
        userId: user.id,
        message,
        conversationId,
      })

      // Update conversation ID if this is the first message
      if (!conversationId && response.conversation_id) {
        setConversationId(response.conversation_id)
      }

      // Add assistant response
      const assistantMessage: Message = {
        id: Date.now() + 1,
        conversation_id: response.conversation_id,
        user_id: user.id,
        role: 'ASSISTANT',
        content: response.message,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMessage])

      // Show notification if chat is closed
      if (!isOpen) {
        setHasNewMessage(true)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      // Remove optimistic user message on error
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id))
    }
  }

  // Quick action buttons for common tasks
  const quickActions = [
    { label: 'Add task for today', message: 'Add a task for today' },
    { label: 'Show my tasks', message: 'Show me all my tasks' },
    { label: 'What\'s due soon?', message: 'What tasks are due soon?' },
  ]

  return (
    <>
      {/* Chat Panel - No floating button, controlled by FABGroup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-6 right-6 z-50 w-[420px] h-[600px] bg-slate-900/95 backdrop-blur-2xl border border-blue-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Gradient mesh background */}
            <div className="absolute inset-0 pointer-events-none opacity-30">
              <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <motion.div
              className="relative bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl border-b border-blue-500/20 p-4"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
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
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">AI Assistant</h3>
                    <p className="text-xs text-gray-400">
                      {sendMessage.isPending ? 'Typing...' : 'Online'}
                    </p>
                  </div>
                </div>

                {/* Close Button */}
                <motion.button
                  onClick={handleToggleChat}
                  className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center transition-colors"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg
                    className="w-5 h-5 text-gray-400"
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
              </div>
            </motion.div>

            {/* Messages Container */}
            <div
              ref={chatContainerRef}
              className="relative flex-1 overflow-y-auto p-4 space-y-4"
            >
              {messages && messages.length > 0 ? (
                // Message list
                <AnimatePresence mode="popLayout">
                  {messages.map((message, index) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      index={index}
                    />
                  ))}
                </AnimatePresence>
              ) : (
                // Empty state with quick actions
                <motion.div
                  className="flex flex-col items-center justify-center h-full text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-8 h-8 text-cyan-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-white font-semibold mb-2">
                    Start a conversation
                  </h3>
                  <p className="text-sm text-gray-400 mb-6">
                    Ask me anything about your tasks!
                  </p>

                  {/* Quick Actions */}
                  <div className="space-y-2 w-full">
                    {quickActions.map((action, index) => (
                      <motion.button
                        key={action.label}
                        onClick={() => handleSendMessage(action.message)}
                        className="w-full bg-gradient-to-br from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20 border border-blue-500/20 hover:border-blue-500/40 rounded-xl p-3 text-sm text-white transition-all"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {action.label}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Typing Indicator */}
              {sendMessage.isPending && (
                <motion.div
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
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
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-lg border border-blue-500/20 rounded-2xl rounded-tl-none p-4">
                    <div className="flex gap-1">
                      <motion.div
                        className="w-2 h-2 bg-cyan-400 rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.6,
                          delay: 0,
                        }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-cyan-400 rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.6,
                          delay: 0.2,
                        }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-cyan-400 rounded-full"
                        animate={{ y: [0, -8, 0] }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.6,
                          delay: 0.4,
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input Area */}
            <motion.div
              className="relative bg-gradient-to-br from-blue-500/5 to-cyan-500/5 backdrop-blur-xl border-t border-blue-500/20 p-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <ChatInput
                onSendMessage={handleSendMessage}
                disabled={sendMessage.isPending}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
