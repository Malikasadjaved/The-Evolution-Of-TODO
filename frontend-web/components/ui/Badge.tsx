/**
 * Badge Component - Purple Kanban Design System
 *
 * Colored badges for priority and status indicators:
 * - high: Red (high priority / urgent)
 * - medium: Yellow (medium priority / in progress)
 * - low: Green (low priority / completed)
 * - info: Blue (informational / default status)
 *
 * All badges use glassmorphism with colored backgrounds and borders.
 */

import React from 'react'

export interface BadgeProps {
  /**
   * Badge variant (determines color scheme)
   * - high: Red (high priority)
   * - medium: Yellow (medium priority)
   * - low: Green (low priority)
   * - info: Blue (informational/status)
   */
  variant?: 'high' | 'medium' | 'low' | 'info'

  /**
   * Badge size
   * - sm: Small (px-2 py-0.5, text-xs)
   * - md: Medium (px-3 py-1, text-xs) - default
   * - lg: Large (px-4 py-1.5, text-sm)
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * Badge content
   */
  children: React.ReactNode

  /**
   * Optional icon (displayed before text)
   */
  icon?: React.ReactNode

  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * Get variant-specific Tailwind classes
 */
const getVariantClasses = (variant: BadgeProps['variant']): string => {
  switch (variant) {
    case 'high':
      return [
        'bg-red-500/20',
        'text-red-300',
        'border border-red-400/30',
      ].join(' ')

    case 'medium':
      return [
        'bg-yellow-500/20',
        'text-yellow-300',
        'border border-yellow-400/30',
      ].join(' ')

    case 'low':
      return [
        'bg-green-500/20',
        'text-green-300',
        'border border-green-400/30',
      ].join(' ')

    case 'info':
      return [
        'bg-blue-500/20',
        'text-blue-300',
        'border border-blue-400/30',
      ].join(' ')

    default:
      return getVariantClasses('info')
  }
}

/**
 * Get size-specific Tailwind classes
 */
const getSizeClasses = (size: BadgeProps['size']): string => {
  switch (size) {
    case 'sm':
      return 'px-2 py-0.5 text-xs'
    case 'md':
      return 'px-3 py-1 text-xs'
    case 'lg':
      return 'px-4 py-1.5 text-sm'
    default:
      return getSizeClasses('md')
  }
}

/**
 * Badge Component
 *
 * @example
 * // High priority badge (red)
 * <Badge variant="high">HIGH PRIORITY</Badge>
 *
 * @example
 * // Medium priority badge (yellow)
 * <Badge variant="medium">MEDIUM</Badge>
 *
 * @example
 * // Low priority badge (green)
 * <Badge variant="low">LOW</Badge>
 *
 * @example
 * // Info/status badge (blue)
 * <Badge variant="info">IN PROGRESS</Badge>
 *
 * @example
 * // Badge with icon
 * <Badge variant="high" icon={<AlertIcon />}>
 *   URGENT
 * </Badge>
 *
 * @example
 * // Small badge
 * <Badge variant="low" size="sm">DONE</Badge>
 *
 * @example
 * // Large badge
 * <Badge variant="medium" size="lg">REVIEW</Badge>
 */
export const Badge: React.FC<BadgeProps> = ({
  variant = 'info',
  size = 'md',
  children,
  icon,
  className = '',
}) => {
  const baseClasses = [
    'inline-flex',
    'items-center',
    'gap-1',
    'rounded-full',
    'font-semibold',
    'uppercase',
    'tracking-wide',
    'transition-all duration-200',
    'whitespace-nowrap',
  ]

  const variantClasses = getVariantClasses(variant)
  const sizeClasses = getSizeClasses(size)

  const allClasses = [
    ...baseClasses,
    variantClasses,
    sizeClasses,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={allClasses}>
      {icon && <span className="inline-flex items-center">{icon}</span>}
      {children}
    </span>
  )
}

/**
 * Utility function to get badge variant from priority level
 *
 * @example
 * const priority = 'HIGH'
 * const variant = getBadgeVariantFromPriority(priority)
 * // Returns: 'high'
 */
export const getBadgeVariantFromPriority = (
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
): 'high' | 'medium' | 'low' => {
  const map = {
    HIGH: 'high' as const,
    MEDIUM: 'medium' as const,
    LOW: 'low' as const,
  }
  return map[priority]
}

/**
 * Utility function to get badge variant from task status
 *
 * @example
 * const status = 'COMPLETE'
 * const variant = getBadgeVariantFromStatus(status)
 * // Returns: 'low' (green for completed)
 */
export const getBadgeVariantFromStatus = (
  status: 'COMPLETE' | 'INCOMPLETE'
): 'low' | 'info' => {
  return status === 'COMPLETE' ? 'low' : 'info'
}

export default Badge
