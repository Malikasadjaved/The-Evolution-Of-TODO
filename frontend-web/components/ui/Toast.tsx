/**
 * Toast Component - Blue Tech Design System
 *
 * Glassmorphism notification toasts with enhanced animations:
 * - success: Green left border + icon
 * - error: Red left border + icon
 * - info: Blue left border + icon
 * - warning: Yellow left border + icon
 *
 * Features:
 * - Slide-in animation from right (300ms spring)
 * - Smooth slide-out on dismiss (250ms ease-out)
 * - Auto-dismiss after duration (default: 4s)
 * - Manual dismiss with close button
 * - Stack multiple toasts vertically
 * - Respects prefers-reduced-motion
 */

'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toastVariants } from '@/lib/animations'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration?: number
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

/**
 * Get variant-specific classes
 */
const getVariantClasses = (type: Toast['type']): string => {
  switch (type) {
    case 'success':
      return 'border-l-green-400'
    case 'error':
      return 'border-l-red-400'
    case 'info':
      return 'border-l-blue-400'
    case 'warning':
      return 'border-l-yellow-400'
  }
}

/**
 * Get variant-specific icon
 */
const getIcon = (type: Toast['type']) => {
  switch (type) {
    case 'success':
      return (
        <svg
          className="w-5 h-5 text-green-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      )
    case 'error':
      return (
        <svg
          className="w-5 h-5 text-red-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      )
    case 'info':
      return (
        <svg
          className="w-5 h-5 text-blue-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      )
    case 'warning':
      return (
        <svg
          className="w-5 h-5 text-yellow-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      )
  }
}

/**
 * Individual Toast Component with Framer Motion
 */
const ToastItem: React.FC<{
  toast: Toast
  onClose: () => void
}> = ({ toast, onClose }) => {
  const variantClasses = getVariantClasses(toast.type)
  const icon = getIcon(toast.type)

  return (
    <motion.div
      variants={toastVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      className={[
        'bg-white/8 backdrop-blur-xl',
        'border border-blue-500/20',
        'rounded-xl p-4',
        'border-l-4',
        variantClasses,
        'shadow-lg shadow-blue-500/10',
        'min-w-[320px] max-w-md',
        'flex items-start gap-3',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Icon */}
      <div className="flex-shrink-0">{icon}</div>

      {/* Message */}
      <p className="flex-1 text-sm text-white leading-relaxed">
        {toast.message}
      </p>

      {/* Close Button */}
      <motion.button
        onClick={onClose}
        className="flex-shrink-0 text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Close notification"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </motion.button>
    </motion.div>
  )
}

/**
 * Toast Container Component with AnimatePresence
 */
export const ToastContainer: React.FC = () => {
  const context = useContext(ToastContext)
  if (!context) return null

  const { toasts, removeToast } = context

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onClose={() => removeToast(toast.id)} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

/**
 * Toast Provider Component
 *
 * Wrap your app with this provider to enable toast notifications.
 *
 * @example
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7)
    const newToast: Toast = { ...toast, id }

    setToasts((prev) => [...prev, newToast])

    // Auto-dismiss after duration (default 4 seconds)
    const duration = toast.duration ?? 4000
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

/**
 * useToast Hook
 *
 * Hook to show toast notifications from any component.
 *
 * @example
 * const { toast } = useToast()
 *
 * // Success toast
 * toast.success('Task created successfully!')
 *
 * // Error toast
 * toast.error('Failed to delete task')
 *
 * // Info toast
 * toast.info('Remember to set a due date')
 *
 * // Warning toast
 * toast.warning('This task is overdue')
 *
 * // Custom duration (in milliseconds)
 * toast.success('Saved!', 3000)
 */
export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }

  const { addToast } = context

  return {
    toast: {
      success: (message: string, duration?: number) =>
        addToast({ type: 'success', message, duration }),
      error: (message: string, duration?: number) =>
        addToast({ type: 'error', message, duration }),
      info: (message: string, duration?: number) =>
        addToast({ type: 'info', message, duration }),
      warning: (message: string, duration?: number) =>
        addToast({ type: 'warning', message, duration }),
    },
  }
}

export default ToastProvider
