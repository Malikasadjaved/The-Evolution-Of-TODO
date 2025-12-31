/**
 * ClearCompletedButton Component - Bulk Delete Completed Tasks
 *
 * Features:
 * - Ghost button with subtle border
 * - Hover: background turns slightly red (destructive action)
 * - Confirmation dialog before clearing
 * - Shows count of tasks to be deleted
 * - Accessible with proper ARIA labels
 */

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ConfirmDialog'

interface ClearCompletedButtonProps {
  completedCount: number
  onClearCompleted: () => Promise<void>
  isLoading?: boolean
}

export const ClearCompletedButton: React.FC<ClearCompletedButtonProps> = ({
  completedCount,
  onClearCompleted,
  isLoading = false,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleConfirm = async () => {
    await onClearCompleted()
    setIsDialogOpen(false)
  }

  if (completedCount === 0) {
    return null
  }

  return (
    <>
      <motion.div
        className="mt-4 flex justify-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <motion.button
          className="px-4 py-2 text-sm font-medium text-white/60 bg-transparent border border-white/10 rounded-lg hover:bg-red-500/20 hover:border-red-400/30 hover:text-red-300 transition-all min-h-[40px] min-w-[44px]"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsDialogOpen(true)}
          disabled={isLoading}
          aria-label={`Clear ${completedCount} completed ${completedCount === 1 ? 'task' : 'tasks'}`}
        >
          <div className="flex items-center gap-2">
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Clear completed ({completedCount})
          </div>
        </motion.button>
      </motion.div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleConfirm}
        title="Clear Completed Tasks"
        message={`Are you sure you want to delete ${completedCount} completed ${
          completedCount === 1 ? 'task' : 'tasks'
        }? This action cannot be undone.`}
        confirmText="Clear All"
        cancelText="Cancel"
        variant="danger"
        isLoading={isLoading}
      />
    </>
  )
}

export default ClearCompletedButton
