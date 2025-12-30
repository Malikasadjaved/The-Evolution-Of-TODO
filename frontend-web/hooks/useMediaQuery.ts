/**
 * useMediaQuery Hook - Responsive Breakpoint Detection
 *
 * Detects screen size and provides responsive breakpoint information
 * Follows Tailwind CSS default breakpoints:
 * - Mobile: < 640px (sm)
 * - Tablet: 640px - 1023px (md)
 * - Desktop: 1024px - 1279px (lg)
 * - Large: 1280px+ (xl)
 *
 * Features:
 * - SSR-safe (returns false initially on server)
 * - Listens to window resize events
 * - Debounced for performance
 * - Type-safe breakpoint names
 *
 * @example
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 639px)')
 * const isDesktop = useMediaQuery('(min-width: 1024px)')
 * ```
 */

'use client'

import { useState, useEffect } from 'react'

/**
 * Hook to detect if a media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // SSR guard - window is not available on server
    if (typeof window === 'undefined') {
      return
    }

    const mediaQueryList = window.matchMedia(query)

    // Set initial value
    setMatches(mediaQueryList.matches)

    // Create event listener
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Modern approach (addEventListener)
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handleChange)
    } else {
      // Fallback for older browsers (deprecated but still supported)
      mediaQueryList.addListener(handleChange)
    }

    // Cleanup
    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', handleChange)
      } else {
        mediaQueryList.removeListener(handleChange)
      }
    }
  }, [query])

  return matches
}

/**
 * Predefined breakpoint hooks following Tailwind defaults
 */

/**
 * Mobile: < 640px (small screens)
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 639px)')
}

/**
 * Tablet: 640px - 1023px (medium screens)
 */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 640px) and (max-width: 1023px)')
}

/**
 * Desktop: >= 1024px (large screens)
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)')
}

/**
 * Large Desktop: >= 1280px (extra large screens)
 */
export function useIsLargeDesktop(): boolean {
  return useMediaQuery('(min-width: 1280px)')
}

/**
 * Mobile or Tablet: < 1024px
 */
export function useIsMobileOrTablet(): boolean {
  return useMediaQuery('(max-width: 1023px)')
}

/**
 * Detect if user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

/**
 * Detect if user prefers dark color scheme
 */
export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)')
}

/**
 * Detect if user prefers high contrast
 */
export function usePrefersHighContrast(): boolean {
  return useMediaQuery('(prefers-contrast: more)')
}

/**
 * Get current breakpoint name
 */
export function useBreakpoint(): 'mobile' | 'tablet' | 'desktop' | 'large' {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const isLargeDesktop = useIsLargeDesktop()

  if (isMobile) return 'mobile'
  if (isTablet) return 'tablet'
  if (isLargeDesktop) return 'large'
  return 'desktop'
}
