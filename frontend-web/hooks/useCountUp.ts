/**
 * useCountUp Hook - Animated Number Counting
 *
 * Smoothly animates number transitions with spring physics.
 * Used for progress indicators and stat cards.
 *
 * Features:
 * - Spring-based easing (easeOutQuart)
 * - Respects prefers-reduced-motion
 * - Configurable duration
 * - Integer or decimal output
 */

'use client'

import { useEffect, useRef, useState } from 'react'

interface UseCountUpOptions {
  duration?: number // Animation duration in milliseconds
  decimals?: number // Number of decimal places (0 for integers)
  easing?: (t: number) => number // Easing function
}

/**
 * easeOutQuart easing function
 * Starts fast, decelerates smoothly
 */
const easeOutQuart = (t: number): number => {
  return 1 - Math.pow(1 - t, 4)
}

export const useCountUp = (
  endValue: number,
  options: UseCountUpOptions = {}
): number => {
  const { duration = 1000, decimals = 0, easing = easeOutQuart } = options

  const [currentValue, setCurrentValue] = useState(0)
  const startValueRef = useRef(0)
  const startTimeRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    // Check for prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    if (prefersReducedMotion) {
      // Skip animation if user prefers reduced motion
      setCurrentValue(endValue)
      return
    }

    // Reset animation
    startValueRef.current = currentValue
    startTimeRef.current = null

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp
      }

      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easing(progress)

      const startValue = startValueRef.current
      const delta = endValue - startValue
      const newValue = startValue + delta * easedProgress

      // Round to specified decimal places
      const roundedValue =
        decimals === 0
          ? Math.round(newValue)
          : Math.round(newValue * Math.pow(10, decimals)) / Math.pow(10, decimals)

      setCurrentValue(roundedValue)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        // Ensure we end exactly at the target value
        setCurrentValue(endValue)
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [endValue, duration, decimals, easing])

  return currentValue
}

export default useCountUp
