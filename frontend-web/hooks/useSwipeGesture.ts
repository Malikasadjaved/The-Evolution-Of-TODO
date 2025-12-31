/**
 * useSwipeGesture Hook - Touch Swipe Detection
 *
 * Detects swipe gestures on mobile devices:
 * - Swipe right: Mark task complete
 * - Swipe left: Reveal delete button
 *
 * Features:
 * - Touch-based gesture detection
 * - Configurable swipe threshold (default: 50px)
 * - Velocity-based detection for natural feel
 * - Supports left, right, up, down swipes
 * - Prevents accidental swipes (minimum distance)
 *
 * @example
 * ```tsx
 * const swipeHandlers = useSwipeGesture({
 *   onSwipeLeft: () => console.log('Delete'),
 *   onSwipeRight: () => console.log('Complete'),
 *   threshold: 50
 * })
 *
 * <div {...swipeHandlers}>Swipeable content</div>
 * ```
 */

'use client'

import { useRef, useCallback, TouchEvent } from 'react'

export interface SwipeGestureOptions {
  /** Callback when swiped left */
  onSwipeLeft?: () => void

  /** Callback when swiped right */
  onSwipeRight?: () => void

  /** Callback when swiped up */
  onSwipeUp?: () => void

  /** Callback when swiped down */
  onSwipeDown?: () => void

  /** Minimum distance in pixels to trigger swipe (default: 50) */
  threshold?: number

  /** Maximum time in ms for swipe to be valid (default: 500) */
  maxDuration?: number

  /** Prevent default touch behavior */
  preventDefault?: boolean
}

export interface SwipeState {
  startX: number
  startY: number
  startTime: number
  isSwiping: boolean
}

export interface SwipeHandlers {
  onTouchStart: (e: TouchEvent) => void
  onTouchMove: (e: TouchEvent) => void
  onTouchEnd: (e: TouchEvent) => void
}

/**
 * Hook to detect swipe gestures on touch devices
 */
export function useSwipeGesture(options: SwipeGestureOptions): SwipeHandlers {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    maxDuration = 500,
    preventDefault = false,
  } = options

  const swipeState = useRef<SwipeState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    isSwiping: false,
  })

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (preventDefault) {
        e.preventDefault()
      }

      const touch = e.touches[0]
      swipeState.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
        isSwiping: true,
      }
    },
    [preventDefault]
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!swipeState.current.isSwiping) return

      if (preventDefault) {
        e.preventDefault()
      }
    },
    [preventDefault]
  )

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!swipeState.current.isSwiping) return

      if (preventDefault) {
        e.preventDefault()
      }

      const touch = e.changedTouches[0]
      const endX = touch.clientX
      const endY = touch.clientY
      const endTime = Date.now()

      const deltaX = endX - swipeState.current.startX
      const deltaY = endY - swipeState.current.startY
      const duration = endTime - swipeState.current.startTime

      // Reset swipe state
      swipeState.current.isSwiping = false

      // Check if swipe is within time limit
      if (duration > maxDuration) {
        return
      }

      // Calculate absolute distances
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      // Determine if horizontal or vertical swipe
      const isHorizontal = absX > absY

      // Horizontal swipe
      if (isHorizontal && absX >= threshold) {
        if (deltaX > 0) {
          // Swipe right
          onSwipeRight?.()
        } else {
          // Swipe left
          onSwipeLeft?.()
        }
      }
      // Vertical swipe
      else if (!isHorizontal && absY >= threshold) {
        if (deltaY > 0) {
          // Swipe down
          onSwipeDown?.()
        } else {
          // Swipe up
          onSwipeUp?.()
        }
      }
    },
    [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, maxDuration, preventDefault]
  )

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  }
}

/**
 * Simplified hook for horizontal swipes only (most common use case)
 */
export function useHorizontalSwipe(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  threshold = 50
): SwipeHandlers {
  return useSwipeGesture({
    onSwipeLeft,
    onSwipeRight,
    threshold,
  })
}

/**
 * Simplified hook for vertical swipes only
 */
export function useVerticalSwipe(
  onSwipeUp?: () => void,
  onSwipeDown?: () => void,
  threshold = 50
): SwipeHandlers {
  return useSwipeGesture({
    onSwipeUp,
    onSwipeDown,
    threshold,
  })
}
