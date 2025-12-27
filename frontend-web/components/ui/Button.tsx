/**
 * Button Component - Purple Kanban Design System
 *
 * Glassmorphism button with 4 variants:
 * - primary: Coral gradient with pink shadow glow
 * - secondary: Transparent with purple border
 * - danger: Solid red
 * - ghost: Transparent hover effect
 *
 * Features:
 * - Smooth 300ms transitions and hover effects
 * - Ripple effect on click (Material Design inspired)
 * - Spring physics animations
 */

'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'

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
   * Button size (2025 standards with minimum touch targets)
   * - sm: Small (px-3 py-2, text-sm, 32px min-height) - Compact actions, mobile
   * - md: Medium (px-4 py-3, text-base, 40px min-height) - Default, most common
   * - lg: Large (px-6 py-4, text-lg, 48px min-height) - Primary CTAs
   * - xl: Extra Large (px-8 py-5, text-xl, 56px min-height) - Hero sections, landing pages
   */
  size?: 'sm' | 'md' | 'lg' | 'xl'

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
 * Get size-specific Tailwind classes (2025 standards)
 */
const getSizeClasses = (size: ButtonProps['size']): string => {
  switch (size) {
    case 'sm':
      return 'px-3 py-2 text-sm min-h-[32px]'  // Compact, mobile-friendly
    case 'md':
      return 'px-4 py-3 text-base min-h-[40px]'  // Default, 44px touch target
    case 'lg':
      return 'px-6 py-4 text-lg min-h-[48px]'  // Primary CTAs
    case 'xl':
      return 'px-8 py-5 text-xl min-h-[56px]'  // Hero sections, landing pages
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
      onClick,
      ...props
    },
    ref
  ) => {
    const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])

    const baseClasses = [
      'rounded-lg',
      'font-medium',  // 2025 standard: 500 weight for better readability
      'transition-all duration-300 ease-in-out',
      'focus:outline-none',
      'focus:ring-2 focus:ring-purple-400',  // 100% opacity for visibility
      'disabled:opacity-40 disabled:cursor-not-allowed',  // Better distinction
      'disabled:hover:translate-y-0',
      'relative overflow-hidden',
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

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return

      // Create ripple effect
      const button = e.currentTarget
      const rect = button.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const newRipple = { x, y, id: Date.now() }

      setRipples((prev) => [...prev, newRipple])

      // Remove ripple after animation
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id))
      }, 600)

      onClick?.(e)
    }

    return (
      <motion.button
        ref={ref}
        className={allClasses}
        disabled={disabled || loading}
        onClick={handleClick}
        whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
        whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        {...props}
      >
        {/* Ripple effects */}
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="absolute rounded-full bg-white/30 pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: 10,
              height: 10,
              marginLeft: -5,
              marginTop: -5,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 20, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}

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
        <span className="relative z-10">{children}</span>
      </motion.button>
    )
  }
)

Button.displayName = 'Button'

export default Button
