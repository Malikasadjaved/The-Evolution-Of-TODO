/**
 * Input Component - Purple Kanban Design System
 *
 * Glassmorphism input with validation states:
 * - default: Purple border with glassmorphic background
 * - error: Red border with error message
 * - success: Green border
 * - disabled: Reduced opacity
 *
 * Features:
 * - Focus ring with purple glow
 * - Optional label and helper text
 * - Icon support (prefix/suffix)
 * - Smooth transitions
 */

import React from 'react'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Input label (displayed above input)
   */
  label?: string

  /**
   * Validation state
   * - default: Normal state
   * - error: Red border
   * - success: Green border
   */
  state?: 'default' | 'error' | 'success'

  /**
   * Error message (displayed below input in red)
   */
  error?: string

  /**
   * Helper text (displayed below input)
   */
  helperText?: string

  /**
   * Icon to display before input (prefix)
   */
  prefixIcon?: React.ReactNode

  /**
   * Icon to display after input (suffix)
   */
  suffixIcon?: React.ReactNode

  /**
   * Full width input
   */
  fullWidth?: boolean
}

/**
 * Get state-specific border classes
 */
const getStateClasses = (state: InputProps['state']): string => {
  switch (state) {
    case 'error':
      return 'border-red-400 focus:border-red-400 focus:ring-red-400/50'
    case 'success':
      return 'border-green-400 focus:border-green-400 focus:ring-green-400/50'
    case 'default':
    default:
      return 'border-purple-400/30 focus:border-purple-400 focus:ring-purple-400/50'
  }
}

/**
 * Input Component
 *
 * @example
 * // Basic input
 * <Input placeholder="Enter task title" />
 *
 * @example
 * // Input with label
 * <Input label="Task Title" placeholder="Enter title" />
 *
 * @example
 * // Input with error state
 * <Input
 *   label="Email"
 *   state="error"
 *   error="Invalid email address"
 *   placeholder="you@example.com"
 * />
 *
 * @example
 * // Input with success state
 * <Input
 *   label="Password"
 *   state="success"
 *   type="password"
 * />
 *
 * @example
 * // Input with prefix icon
 * <Input
 *   placeholder="Search tasks..."
 *   prefixIcon={<SearchIcon />}
 * />
 *
 * @example
 * // Input with suffix icon
 * <Input
 *   placeholder="Enter date"
 *   suffixIcon={<CalendarIcon />}
 * />
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      state = 'default',
      error,
      helperText,
      prefixIcon,
      suffixIcon,
      fullWidth = false,
      disabled = false,
      className = '',
      ...props
    },
    ref
  ) => {
    // Use error state if error message is provided
    const actualState = error ? 'error' : state

    const baseClasses = [
      'bg-white/5',
      'border',
      'rounded-lg',
      'px-3 py-2',
      'text-white',
      'placeholder:text-gray-400',
      'transition-all duration-300',
      'focus:outline-none',
      'focus:ring-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
    ]

    const stateClasses = getStateClasses(actualState)
    const widthClass = fullWidth ? 'w-full' : ''

    // Add padding for icons
    const paddingClasses = []
    if (prefixIcon) paddingClasses.push('pl-10')
    if (suffixIcon) paddingClasses.push('pr-10')

    const allClasses = [
      ...baseClasses,
      stateClasses,
      widthClass,
      ...paddingClasses,
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div className={`flex flex-col gap-1 ${fullWidth ? 'w-full' : ''}`}>
        {/* Label */}
        {label && (
          <label className="text-sm font-medium text-white/80">
            {label}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Prefix Icon */}
          {prefixIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
              {prefixIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            className={allClasses}
            disabled={disabled}
            {...props}
          />

          {/* Suffix Icon */}
          {suffixIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50">
              {suffixIcon}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-sm text-red-400 flex items-center gap-1">
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}

        {/* Helper Text */}
        {helperText && !error && (
          <p className="text-sm text-white/60">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
