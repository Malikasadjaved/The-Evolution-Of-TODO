/**
 * IconButton Component - Icon-only button variant
 *
 * Specialized button for icon-only actions with:
 * - Square aspect ratio
 * - Consistent icon sizing
 * - Accessible with required aria-label
 * - Framer Motion animations
 * - Multiple visual styles
 *
 * Usage:
 * <IconButton variant="view" icon={EyeIcon} aria-label="View details" onClick={...} />
 * <IconButton variant="delete" icon={TrashIcon} aria-label="Delete task" onClick={...} />
 */

'use client'

import React from 'react'
import { motion } from 'framer-motion'

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /**
   * Visual variant
   * - view: Purple theme for view/eye actions
   * - edit: Blue theme for edit actions
   * - delete: Red theme for delete actions
   * - ghost: Transparent for minimal actions
   */
  variant?: 'view' | 'edit' | 'delete' | 'ghost'

  /**
   * Button size
   * - sm: 24px (w-6 h-6) - Compact
   * - md: 32px (w-8 h-8) - Default
   * - lg: 40px (w-10 h-10) - Larger
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * Icon element to render (SVG or React component)
   */
  icon?: React.ReactNode

  /**
   * REQUIRED: Accessible label for screen readers
   */
  'aria-label': string

  /**
   * Disabled state
   */
  disabled?: boolean
}

/**
 * Get variant-specific classes
 */
const getVariantClasses = (variant: IconButtonProps['variant']): string => {
  switch (variant) {
    case 'view':
      return [
        'bg-purple-500/20 hover:bg-purple-500/30',
        'border border-purple-400/30 hover:border-purple-400/50',
        'text-purple-300',
      ].join(' ')

    case 'edit':
      return [
        'bg-blue-500/20 hover:bg-blue-500/30',
        'border border-blue-400/30 hover:border-blue-400/50',
        'text-blue-300',
      ].join(' ')

    case 'delete':
      return [
        'bg-red-500/20 hover:bg-red-500/30',
        'border border-red-400/30 hover:border-red-400/50',
        'text-red-400',
      ].join(' ')

    case 'ghost':
      return [
        'bg-transparent hover:bg-white/10',
        'border border-transparent',
        'text-white/60 hover:text-white',
      ].join(' ')

    default:
      return getVariantClasses('ghost')
  }
}

/**
 * Get size-specific classes
 */
const getSizeClasses = (size: IconButtonProps['size']): string => {
  switch (size) {
    case 'sm':
      return 'w-6 h-6 rounded'  // 24px
    case 'md':
      return 'w-8 h-8 rounded-lg'  // 32px
    case 'lg':
      return 'w-10 h-10 rounded-lg'  // 40px
    default:
      return getSizeClasses('md')
  }
}

/**
 * Get icon size classes
 */
const getIconSize = (size: IconButtonProps['size']): string => {
  switch (size) {
    case 'sm':
      return 'w-3 h-3'  // 12px icon
    case 'md':
      return 'w-4 h-4'  // 16px icon
    case 'lg':
      return 'w-5 h-5'  // 20px icon
    default:
      return getIconSize('md')
  }
}

/**
 * IconButton Component
 *
 * @example
 * // View button
 * <IconButton
 *   variant="view"
 *   icon={<EyeIcon />}
 *   aria-label="View task details"
 *   onClick={() => router.push(`/tasks/${id}`)}
 * />
 *
 * @example
 * // Delete button
 * <IconButton
 *   variant="delete"
 *   icon={<TrashIcon />}
 *   aria-label="Delete task"
 *   onClick={handleDelete}
 * />
 *
 * @example
 * // Custom SVG icon
 * <IconButton
 *   variant="edit"
 *   aria-label="Edit task"
 *   icon={
 *     <svg className="w-4 h-4" fill="none" stroke="currentColor">
 *       <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
 *     </svg>
 *   }
 * />
 */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = 'ghost',
      size = 'md',
      icon,
      disabled = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      'inline-flex items-center justify-center',
      'transition-all duration-200',
      'focus:outline-none',
      'focus:ring-2 focus:ring-purple-400',
      'disabled:opacity-40 disabled:cursor-not-allowed',
      'flex-shrink-0',
    ]

    const variantClasses = getVariantClasses(variant)
    const sizeClasses = getSizeClasses(size)
    const iconSizeClass = getIconSize(size)

    const allClasses = [
      ...baseClasses,
      variantClasses,
      sizeClasses,
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <motion.button
        ref={ref}
        className={allClasses}
        disabled={disabled}
        whileHover={!disabled ? { scale: 1.1, rotate: variant === 'delete' ? -5 : 5 } : {}}
        whileTap={!disabled ? { scale: 0.9 } : {}}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        {...(props as any)}
      >
        {icon && (
          <div className={iconSizeClass}>
            {icon}
          </div>
        )}
      </motion.button>
    )
  }
)

IconButton.displayName = 'IconButton'

export default IconButton
