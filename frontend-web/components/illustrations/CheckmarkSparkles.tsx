/**
 * CheckmarkSparkles Illustration
 *
 * Celebratory SVG illustration for completed tasks empty state.
 * Features a large checkmark with sparkles/stars around it.
 *
 * Design:
 * - Circular background with gradient (green/cyan)
 * - Large checkmark icon (bold stroke)
 * - 4 sparkle/star particles around the circle
 * - Subtle pulse animation on sparkles
 */

'use client'

import { motion } from 'framer-motion'

interface CheckmarkSparklesProps {
  className?: string
}

export const CheckmarkSparkles: React.FC<CheckmarkSparklesProps> = ({
  className = 'w-24 h-24',
}) => {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gradient for circle background */}
        <linearGradient id="checkmark-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.2" />
        </linearGradient>

        {/* Glow filter */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Circle Background */}
      <motion.circle
        cx="60"
        cy="60"
        r="35"
        fill="url(#checkmark-gradient)"
        stroke="#10b981"
        strokeWidth="2"
        opacity="0.4"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.4 }}
        transition={{
          duration: 0.5,
          type: 'spring',
          stiffness: 200,
        }}
      />

      {/* Checkmark Icon */}
      <motion.path
        d="M45 60 L54 69 L75 48"
        stroke="#10b981"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter="url(#glow)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          duration: 0.6,
          delay: 0.2,
          type: 'spring',
          stiffness: 100,
        }}
      />

      {/* Sparkle 1 - Top Right */}
      <motion.g
        initial={{ scale: 0, rotate: 0 }}
        animate={{
          scale: [0, 1, 0.9, 1],
          rotate: [0, 0, 180, 360],
        }}
        transition={{
          duration: 1.2,
          delay: 0.5,
          repeat: Infinity,
          repeatDelay: 2,
        }}
      >
        <path
          d="M85 25 L87 30 L92 32 L87 34 L85 39 L83 34 L78 32 L83 30 Z"
          fill="#06b6d4"
          opacity="0.8"
        />
      </motion.g>

      {/* Sparkle 2 - Top Left */}
      <motion.g
        initial={{ scale: 0, rotate: 0 }}
        animate={{
          scale: [0, 1, 0.9, 1],
          rotate: [0, 0, -180, -360],
        }}
        transition={{
          duration: 1.2,
          delay: 0.7,
          repeat: Infinity,
          repeatDelay: 2,
        }}
      >
        <path
          d="M30 30 L32 35 L37 37 L32 39 L30 44 L28 39 L23 37 L28 35 Z"
          fill="#10b981"
          opacity="0.8"
        />
      </motion.g>

      {/* Sparkle 3 - Bottom Right */}
      <motion.g
        initial={{ scale: 0, rotate: 0 }}
        animate={{
          scale: [0, 1, 0.9, 1],
          rotate: [0, 0, 180, 360],
        }}
        transition={{
          duration: 1.2,
          delay: 0.9,
          repeat: Infinity,
          repeatDelay: 2,
        }}
      >
        <path
          d="M95 70 L97 75 L102 77 L97 79 L95 84 L93 79 L88 77 L93 75 Z"
          fill="#10b981"
          opacity="0.8"
        />
      </motion.g>

      {/* Sparkle 4 - Bottom Left */}
      <motion.g
        initial={{ scale: 0, rotate: 0 }}
        animate={{
          scale: [0, 1, 0.9, 1],
          rotate: [0, 0, -180, -360],
        }}
        transition={{
          duration: 1.2,
          delay: 1.1,
          repeat: Infinity,
          repeatDelay: 2,
        }}
      >
        <path
          d="M20 75 L22 80 L27 82 L22 84 L20 89 L18 84 L13 82 L18 80 Z"
          fill="#06b6d4"
          opacity="0.8"
        />
      </motion.g>

      {/* Small dots (confetti particles) */}
      <motion.circle
        cx="100"
        cy="50"
        r="2"
        fill="#10b981"
        initial={{ opacity: 0, y: 0 }}
        animate={{
          opacity: [0, 1, 0],
          y: [0, 10, 20],
        }}
        transition={{
          duration: 2,
          delay: 0.8,
          repeat: Infinity,
          repeatDelay: 1,
        }}
      />
      <motion.circle
        cx="15"
        cy="55"
        r="2"
        fill="#06b6d4"
        initial={{ opacity: 0, y: 0 }}
        animate={{
          opacity: [0, 1, 0],
          y: [0, -10, -20],
        }}
        transition={{
          duration: 2,
          delay: 1,
          repeat: Infinity,
          repeatDelay: 1,
        }}
      />
    </svg>
  )
}

export default CheckmarkSparkles
