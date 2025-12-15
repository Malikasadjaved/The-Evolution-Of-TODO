'use client'

import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { useToast, type Toast } from '@/lib/hooks/useToast'

interface ToastItemProps {
  toast: Toast
  onClose: (id: string) => void
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const { type, message, id } = toast

  const icons = {
    success: <CheckCircleIcon className="h-5 w-5 text-green-600" />,
    error: <ExclamationCircleIcon className="h-5 w-5 text-red-600" />,
    warning: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />,
    info: <InformationCircleIcon className="h-5 w-5 text-blue-600" />,
  }

  const colors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
  }

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg ${colors[type]} animate-slide-in`}
      role="alert"
    >
      <div className="flex-shrink-0">{icons[type]}</div>
      <p className="flex-1 text-sm font-medium text-gray-900">{message}</p>
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 rounded"
        aria-label="Close"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || toasts.length === 0) {
    return null
  }

  return createPortal(
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>,
    document.body
  )
}
