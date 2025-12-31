/**
 * ConfettiEffect Component - Celebration Animation
 *
 * Triggers a confetti burst animation when tasks are completed.
 * Uses canvas-confetti library for high-performance particle effects.
 *
 * Features:
 * - 20-30 particles per burst
 * - Brand colors (purple, pink, cyan)
 * - 2-second duration
 * - Respects prefers-reduced-motion
 * - Can target specific elements or screen center
 */

'use client'

import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'

interface ConfettiEffectProps {
  /** Trigger the effect when this prop changes to true */
  trigger: boolean
  /** Origin position (0-1 range). Default: center */
  origin?: { x: number; y: number }
  /** Number of particles (default: 25) */
  particleCount?: number
  /** Spread angle in degrees (default: 60) */
  spread?: number
  /** Colors to use (default: brand colors) */
  colors?: string[]
  /** Duration in milliseconds (default: 2000) */
  duration?: number
}

export const ConfettiEffect: React.FC<ConfettiEffectProps> = ({
  trigger,
  origin = { x: 0.5, y: 0.5 },
  particleCount = 25,
  spread = 60,
  colors = ['#a855f7', '#ec4899', '#06b6d4'], // purple, pink, cyan
  duration = 2000,
}) => {
  const lastTriggerRef = useRef(trigger)

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches

    if (prefersReducedMotion) {
      return // Skip animation
    }

    // Only fire when trigger changes from false to true
    if (trigger && !lastTriggerRef.current) {
      fireConfetti()
    }

    lastTriggerRef.current = trigger
  }, [trigger])

  const fireConfetti = () => {
    const end = Date.now() + duration

    // Continuous confetti burst
    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: spread,
        origin: origin,
        colors: colors,
        gravity: 1,
        scalar: 0.8,
        drift: 0,
        ticks: 200,
      })

      confetti({
        particleCount: 2,
        angle: 120,
        spread: spread,
        origin: origin,
        colors: colors,
        gravity: 1,
        scalar: 0.8,
        drift: 0,
        ticks: 200,
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    // Initial burst
    confetti({
      particleCount: particleCount,
      spread: spread * 2,
      origin: origin,
      colors: colors,
      gravity: 1.2,
      scalar: 1,
      drift: 0.5,
      ticks: 150,
    })

    // Start continuous animation
    frame()
  }

  return null // This component doesn't render anything
}

/**
 * Utility function to trigger confetti from a specific element
 */
export const triggerConfettiFromElement = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect()
  const x = (rect.left + rect.width / 2) / window.innerWidth
  const y = (rect.top + rect.height / 2) / window.innerHeight

  // Check if user prefers reduced motion
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches

  if (prefersReducedMotion) {
    return // Skip animation
  }

  confetti({
    particleCount: 30,
    spread: 70,
    origin: { x, y },
    colors: ['#a855f7', '#ec4899', '#06b6d4'],
    gravity: 1.2,
    scalar: 1.2,
    drift: 0,
    ticks: 200,
  })
}

/**
 * Utility function to trigger celebration confetti (center screen)
 */
export const triggerCelebrationConfetti = () => {
  // Check if user prefers reduced motion
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches

  if (prefersReducedMotion) {
    return // Skip animation
  }

  const duration = 3000
  const end = Date.now() + duration

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: ['#a855f7', '#ec4899', '#06b6d4', '#10b981'],
    })

    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: ['#a855f7', '#ec4899', '#06b6d4', '#10b981'],
    })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  }

  frame()
}

export default ConfettiEffect
