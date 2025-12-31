/**
 * MobileDrawer Component - Slide-out Sidebar for Mobile
 *
 * Responsive drawer for mobile devices that slides in from the right
 * Contains the calendar widget and upcoming deadlines section
 *
 * Features:
 * - Slides in from right with spring physics animation
 * - Semi-transparent backdrop overlay
 * - Click outside to close
 * - ESC key to close
 * - Focus trap when open
 * - Full-height drawer on mobile
 * - Hidden on desktop (>= 1024px)
 * - ARIA attributes for accessibility
 * - Touch-friendly close button (44x44px minimum)
 *
 * @example
 * ```tsx
 * <MobileDrawer isOpen={isOpen} onClose={() => setIsOpen(false)}>
 *   <Calendar tasks={tasks} />
 * </MobileDrawer>
 * ```
 */

'use client'

import { useEffect, useRef, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useIsMobileOrTablet } from '@/hooks/useMediaQuery'

export interface MobileDrawerProps {
  /** Whether the drawer is open */
  isOpen: boolean

  /** Callback when drawer should close */
  onClose: () => void

  /** Content to display in drawer */
  children: ReactNode

  /** Optional title for drawer */
  title?: string

  /** Position of drawer (default: right) */
  position?: 'left' | 'right'
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  children,
  title = 'Sidebar',
  position = 'right',
}) => {
  const isMobileOrTablet = useIsMobileOrTablet()
  const drawerRef = useRef<HTMLDivElement>(null)

  // Focus trap: Focus first focusable element when opened
  useEffect(() => {
    if (!isOpen || !drawerRef.current) return

    const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements.length > 0) {
      focusableElements[0].focus()
    }
  }, [isOpen])

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (!isOpen) return

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  // Only render on mobile/tablet
  if (!isMobileOrTablet) {
    return null
  }

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  }

  const drawerVariants = {
    hidden: {
      x: position === 'right' ? '100%' : '-100%',
      opacity: 0,
    },
    visible: {
      x: 0,
      opacity: 1,
    },
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.aside
            ref={drawerRef}
            className={`fixed top-0 ${position === 'right' ? 'right-0' : 'left-0'} h-full w-[85vw] max-w-[380px] bg-white/10 dark:bg-white/5 backdrop-blur-xl border-${position === 'right' ? 'l' : 'r'} border-blue-500/20 overflow-y-auto z-[101] shadow-2xl`}
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white/10 dark:bg-white/5 backdrop-blur-xl border-b border-blue-500/20 px-4 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-white">
                {title}
              </h2>

              {/* Close Button - Touch-friendly 44x44px */}
              <button
                onClick={onClose}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400"
                aria-label="Close sidebar"
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {children}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

export default MobileDrawer
