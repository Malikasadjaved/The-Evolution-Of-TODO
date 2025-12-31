/**
 * Button Component - Purple Kanban Design System
 *
 * Glassmorphism button with 4 variants:
 * - primary: Coral gradient with pink shadow glow
 * - secondary: Transparent with purple border
 * - danger: Solid red
 * - ghost: Transparent hover effect
 *
 * All variants include smooth 300ms transitions and hover effects.
 */

import React from 'react'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button variant
   * - primary: Coral gradient (default)
   * - secondary: Purple border
   * - danger: Red solid
   * - ghost: Transparent
   */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'

  /**
   * Button size
   * - sm: Small (px-4 py-2, text-sm)
   * - md: Medium (px-6 py-3, text-base) - default
   * - lg: Large (px-8 py-4, text-lg)
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * Full width button
   */
  fullWidth?: boolean

  /**
   * Disable button
   */
  disabled?: boolean

  /**
   * Loading state (shows spinner)
   */
  loading?: boolean

  /**
   * Button content
   */
  children: React.ReactNode
}

/**
 * Get variant-specific Tailwind classes
 */
const getVariantClasses = (variant: ButtonProps['variant']): string => {
  switch (variant) {
    case 'primary':
      return [
        'bg-gradient-to-r from-pink-500 to-orange-400',
        'hover:shadow-lg hover:shadow-pink-500/50',
        'hover:-translate-y-0.5',
        'text-white',
      ].join(' ')

    case 'secondary':
      return [
        'border border-purple-400',
        'bg-transparent',
        'hover:bg-purple-500/10',
        'text-white',
      ].join(' ')

    case 'danger':
      return [
        'bg-red-500',
        'hover:bg-red-600',
        'hover:shadow-lg hover:shadow-red-500/50',
        'text-white',
      ].join(' ')

    case 'ghost':
      return [
        'bg-transparent',
        'hover:bg-white/5',
        'text-white',
      ].join(' ')

    default:
      return getVariantClasses('primary')
  }
}

/**
 * Get size-specific Tailwind classes
 */
const getSizeClasses = (size: ButtonProps['size']): string => {
  switch (size) {
    case 'sm':
      return 'px-4 py-2 text-sm'
    case 'md':
      return 'px-6 py-3 text-base'
    case 'lg':
      return 'px-8 py-4 text-lg'
    default:
      return getSizeClasses('md')
  }
}

/**
 * Button Component
 *
 * @example
 * // Primary button (coral gradient)
 * <Button variant="primary">Create Task</Button>
 *
 * @example
 * // Secondary button (purple border)
 * <Button variant="secondary">Cancel</Button>
 *
 * @example
 * // Danger button (red)
 * <Button variant="danger">Delete</Button>
 *
 * @example
 * // Ghost button (transparent)
 * <Button variant="ghost">Learn More</Button>
 *
 * @example
 * // Loading state
 * <Button loading>Saving...</Button>
 *
 * @example
 * // Disabled state
 * <Button disabled>Submit</Button>
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      disabled = false,
      loading = false,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      'rounded-lg',
      'font-semibold',
      'transition-all duration-300 ease-in-out',
      'focus:outline-none',
      'focus:ring-2 focus:ring-purple-400/50',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'disabled:hover:translate-y-0',
      'relative',
      'inline-flex items-center justify-center gap-2',
    ]

    const variantClasses = getVariantClasses(variant)
    const sizeClasses = getSizeClasses(size)
    const widthClass = fullWidth ? 'w-full' : ''

    const allClasses = [
      ...baseClasses,
      variantClasses,
      sizeClasses,
      widthClass,
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <button
        ref={ref}
        className={allClasses}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
