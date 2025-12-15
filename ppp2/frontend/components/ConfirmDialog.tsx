/**
 * ConfirmDialog Component
 *
 * Reusable confirmation dialog for destructive actions.
 * Wraps the Modal component with pre-configured styling for confirmations.
 *
 * Features:
 * - Danger/Warning/Primary variants
 * - Custom button text
 * - Loading state on confirm button
 * - Warning icon
 * - Keyboard support (Enter/Escape)
 */

'use client'

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Modal } from '@/components/Modal'
import { Button } from '@/components/ui/Button'
import { clsx } from 'clsx'

export interface ConfirmDialogProps {
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'primary'
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onCancel,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  // Get button variant based on dialog variant
  const getButtonVariant = () => {
    switch (variant) {
      case 'danger':
        return 'danger'
      case 'warning':
        return 'secondary' // We'll style this manually
      case 'primary':
        return 'primary'
      default:
        return 'danger'
    }
  }

  // Get icon color based on variant
  const getIconColor = () => {
    switch (variant) {
      case 'danger':
        return 'text-red-600'
      case 'warning':
        return 'text-yellow-600'
      case 'primary':
        return 'text-blue-600'
      default:
        return 'text-red-600'
    }
  }

  const footer = (
    <>
      <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
        {cancelText}
      </Button>
      <Button
        variant={variant === 'warning' ? 'secondary' : getButtonVariant()}
        onClick={onConfirm}
        isLoading={isLoading}
        className={clsx(
          variant === 'danger' && 'bg-red-600 hover:bg-red-700 text-white',
          variant === 'warning' && 'bg-yellow-600 hover:bg-yellow-700 text-white',
          variant === 'primary' && 'bg-blue-600 hover:bg-blue-700 text-white'
        )}
      >
        {confirmText}
      </Button>
    </>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      footer={footer}
      size="sm"
      preventBackdropClose={isLoading}
      preventEscapeClose={isLoading}
    >
      <div className="flex gap-4">
        {/* Warning Icon */}
        <div className="flex-shrink-0">
          <div
            className={clsx(
              'w-12 h-12 rounded-full flex items-center justify-center',
              variant === 'danger' && 'bg-red-100',
              variant === 'warning' && 'bg-yellow-100',
              variant === 'primary' && 'bg-blue-100'
            )}
          >
            <ExclamationTriangleIcon
              className={clsx('h-6 w-6', getIconColor())}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Message */}
        <div className="flex-1">
          <p className="text-sm text-gray-600">{message}</p>
        </div>
      </div>
    </Modal>
  )
}
