/**
 * Design Tokens - Central Design System Configuration
 *
 * Single source of truth for design system values.
 * Following 2025 best practices for consistency and maintainability.
 *
 * Usage:
 * import { BUTTON_SIZES, TYPOGRAPHY, COLORS } from '@/lib/design-tokens'
 */

// ============================================================================
// BUTTON SYSTEM (2025 Standards)
// ============================================================================

export const BUTTON_SIZES = {
  sm: {
    padding: 'px-3 py-2',
    fontSize: 'text-sm',
    minHeight: 'min-h-[32px]',
    iconSize: 'w-4 h-4',
    useCase: 'Compact actions, mobile',
  },
  md: {
    padding: 'px-4 py-3',
    fontSize: 'text-base',
    minHeight: 'min-h-[40px]',
    iconSize: 'w-5 h-5',
    useCase: 'Default, most common',
  },
  lg: {
    padding: 'px-6 py-4',
    fontSize: 'text-lg',
    minHeight: 'min-h-[48px]',
    iconSize: 'w-6 h-6',
    useCase: 'Primary CTAs',
  },
  xl: {
    padding: 'px-8 py-5',
    fontSize: 'text-xl',
    minHeight: 'min-h-[56px]',
    iconSize: 'w-7 h-7',
    useCase: 'Hero sections, landing pages',
  },
} as const

export const ICON_BUTTON_SIZES = {
  sm: {
    dimensions: 'w-6 h-6',
    iconSize: 'w-3 h-3',
    borderRadius: 'rounded',
  },
  md: {
    dimensions: 'w-8 h-8',
    iconSize: 'w-4 h-4',
    borderRadius: 'rounded-lg',
  },
  lg: {
    dimensions: 'w-10 h-10',
    iconSize: 'w-5 h-5',
    borderRadius: 'rounded-lg',
  },
} as const

// ============================================================================
// TYPOGRAPHY SCALE (Harmonious 1.25 Ratio - Major Third)
// ============================================================================

export const TYPOGRAPHY = {
  xs: {
    size: 'text-xs',
    pxSize: '12px',
    lineHeight: 'leading-tight',
    letterSpacing: 'tracking-wide',
    useCase: 'Badges, captions, helper text',
  },
  sm: {
    size: 'text-sm',
    pxSize: '14px',
    lineHeight: 'leading-normal',
    letterSpacing: 'tracking-normal',
    useCase: 'Form labels, descriptions',
  },
  base: {
    size: 'text-base',
    pxSize: '16px',
    lineHeight: 'leading-relaxed',
    letterSpacing: 'tracking-normal',
    useCase: 'Body text, buttons',
  },
  lg: {
    size: 'text-lg',
    pxSize: '20px',
    lineHeight: 'leading-relaxed',
    letterSpacing: 'tracking-normal',
    useCase: 'Section headings',
  },
  xl: {
    size: 'text-xl',
    pxSize: '25px',
    lineHeight: 'leading-snug',
    letterSpacing: 'tracking-tight',
    useCase: 'Page headings',
  },
  '2xl': {
    size: 'text-2xl',
    pxSize: '32px',
    lineHeight: 'leading-tight',
    letterSpacing: 'tracking-tight',
    useCase: 'Hero headings',
  },
  '3xl': {
    size: 'text-3xl',
    pxSize: '40px',
    lineHeight: 'leading-tight',
    letterSpacing: 'tracking-tighter',
    useCase: 'Landing page titles',
  },
  '4xl': {
    size: 'text-4xl',
    pxSize: '64px',
    lineHeight: 'leading-none',
    letterSpacing: 'tracking-tighter',
    useCase: 'Hero sections',
  },
} as const

export const FONT_WEIGHTS = {
  light: 'font-light',      // 300
  normal: 'font-normal',    // 400
  medium: 'font-medium',    // 500
  semibold: 'font-semibold',// 600
  bold: 'font-bold',        // 700
} as const

// ============================================================================
// COLOR SYSTEM
// ============================================================================

export const COLORS = {
  // Priority-based colors
  priority: {
    HIGH: {
      bg: 'bg-red-500',
      text: 'text-red-400',
      border: 'border-red-400',
      glow: 'shadow-red-500/30',
    },
    MEDIUM: {
      bg: 'bg-yellow-500',
      text: 'text-yellow-400',
      border: 'border-yellow-400',
      glow: 'shadow-yellow-500/30',
    },
    LOW: {
      bg: 'bg-green-500',
      text: 'text-green-400',
      border: 'border-green-400',
      glow: 'shadow-green-500/30',
    },
  },

  // Accent colors (matches CSS variables)
  accent: {
    primary: '#6366f1',      // Indigo
    secondary: '#8b5cf6',    // Purple
    success: '#10b981',      // Emerald
    warning: '#f59e0b',      // Amber
    danger: '#ef4444',       // Red
    info: '#06b6d4',         // Cyan
  },

  // Background colors (CSS variables)
  background: {
    primary: 'var(--bg-primary)',
    secondary: 'var(--bg-secondary)',
    tertiary: 'var(--bg-tertiary)',
  },

  // Glassmorphism
  glass: {
    background: 'bg-white/8',
    backdropBlur: 'backdrop-blur-lg',
    border: 'border border-purple-400/20',
  },

  // Text opacity levels (CSS variables for better consistency)
  text: {
    primary: 'var(--text-primary)',          // Almost white
    secondary: 'var(--text-secondary)',      // Light slate
    muted: 'var(--text-muted)',              // Muted slate
    tertiary: 'var(--text-tertiary)',        // 40% opacity
  },

  // Border colors (CSS variables)
  border: {
    default: 'var(--border-default)',
    focus: 'var(--border-focus)',
    hover: 'var(--border-hover)',
  },

  // Glow effects (CSS variables)
  glow: {
    primary: 'var(--glow-primary)',
    success: 'var(--glow-success)',
    warning: 'var(--glow-warning)',
    danger: 'var(--glow-danger)',
    info: 'var(--glow-info)',
  },
} as const

// ============================================================================
// SPACING & LAYOUT
// ============================================================================

export const SPACING = {
  // Component gaps
  gap: {
    xs: 'gap-1',    // 4px
    sm: 'gap-2',    // 8px
    md: 'gap-4',    // 16px
    lg: 'gap-6',    // 24px
    xl: 'gap-8',    // 32px
  },

  // Padding presets
  padding: {
    card: 'p-4',           // 16px
    section: 'p-6',        // 24px
    page: 'p-8',           // 32px
  },

  // Border radius
  radius: {
    sm: 'rounded',         // 4px
    md: 'rounded-lg',      // 8px
    lg: 'rounded-xl',      // 12px
    full: 'rounded-full',  // 9999px
  },
} as const

// ============================================================================
// ANIMATION PRESETS (Framer Motion)
// ============================================================================

export const ANIMATION_PRESETS = {
  // Spring physics (default)
  spring: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 17,
  },

  // Smooth spring (for larger elements)
  smoothSpring: {
    type: 'spring' as const,
    stiffness: 260,
    damping: 20,
  },

  // Fast spring (for micro-interactions)
  fastSpring: {
    type: 'spring' as const,
    stiffness: 600,
    damping: 25,
  },

  // Hover scale (buttons, cards)
  hoverScale: {
    scale: 1.02,
  },

  // Tap scale
  tapScale: {
    scale: 0.98,
  },

  // Lift effect (cards)
  liftEffect: {
    y: -8,
    scale: 1.02,
  },

  // Stagger delay (for lists)
  stagger: {
    delay: 0.05, // 50ms per item
  },
} as const

// ============================================================================
// ACCESSIBILITY
// ============================================================================

export const ACCESSIBILITY = {
  // Touch targets (Apple HIG, Material Design)
  touchTarget: {
    minimum: 'min-h-[44px] min-w-[44px]',  // 44px x 44px
  },

  // Focus ring
  focusRing: {
    default: 'focus:ring-2 focus:ring-purple-400 focus:outline-none',
    offset: 'focus:ring-offset-2',
  },

  // Contrast ratios (WCAG AA)
  contrast: {
    normal: '4.5:1',      // Normal text
    large: '3:1',         // Large text (18px+)
    interactive: '3:1',   // Interactive elements
  },
} as const

// ============================================================================
// BREAKPOINTS (Responsive Design)
// ============================================================================

export const BREAKPOINTS = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px', // Extra large
} as const

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get button classes for a specific size
 */
export const getButtonSizeClasses = (size: keyof typeof BUTTON_SIZES): string => {
  const config = BUTTON_SIZES[size]
  return `${config.padding} ${config.fontSize} ${config.minHeight}`
}

/**
 * Get icon button classes for a specific size
 */
export const getIconButtonSizeClasses = (size: keyof typeof ICON_BUTTON_SIZES): string => {
  const config = ICON_BUTTON_SIZES[size]
  return `${config.dimensions} ${config.borderRadius}`
}

/**
 * Get typography classes for a specific scale
 */
export const getTypographyClasses = (scale: keyof typeof TYPOGRAPHY): string => {
  const config = TYPOGRAPHY[scale]
  return `${config.size} ${config.lineHeight} ${config.letterSpacing}`
}

/**
 * Get priority color classes
 */
export const getPriorityClasses = (priority: 'HIGH' | 'MEDIUM' | 'LOW') => {
  return COLORS.priority[priority]
}
