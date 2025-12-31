/**
 * LoadingSkeleton Component - Animated loading placeholders
 *
 * Provides skeleton screens for better perceived performance
 * while content is loading.
 *
 * Features:
 * - Pulse animation
 * - Glassmorphism design matching TaskCard
 * - Configurable count for multiple skeletons
 * - Responsive layout
 */

interface LoadingSkeletonProps {
  count?: number
  type?: 'card' | 'list' | 'board'
}

export function LoadingSkeleton({ count = 3, type = 'card' }: LoadingSkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i)

  if (type === 'board') {
    return (
      <div className="grid grid-cols-3 gap-6">
        {[0, 1, 2].map((columnIndex) => (
          <div key={columnIndex} className="flex flex-col gap-4">
            {/* Column Header Skeleton */}
            <div className="bg-white/8 backdrop-blur-lg border border-purple-400/20 rounded-xl p-4 animate-pulse">
              <div className="h-6 bg-white/10 rounded w-24"></div>
            </div>

            {/* Task Card Skeletons */}
            {skeletons.map((index) => (
              <TaskCardSkeleton key={`${columnIndex}-${index}`} />
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (type === 'list') {
    return (
      <div className="flex flex-col gap-4">
        {skeletons.map((index) => (
          <TaskCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {skeletons.map((index) => (
        <TaskCardSkeleton key={index} />
      ))}
    </div>
  )
}

function TaskCardSkeleton() {
  return (
    <div className="bg-white/8 backdrop-blur-lg border border-purple-400/20 rounded-xl p-4 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1">
          {/* Checkbox skeleton */}
          <div className="mt-0.5 w-5 h-5 bg-white/10 rounded"></div>

          {/* Title skeleton */}
          <div className="flex-1">
            <div className="h-6 bg-white/10 rounded w-3/4 mb-2"></div>
          </div>
        </div>

        {/* Priority badge skeleton */}
        <div className="h-6 w-16 bg-white/10 rounded-full"></div>
      </div>

      {/* Description skeleton */}
      <div className="mb-4 space-y-2">
        <div className="h-4 bg-white/10 rounded w-full"></div>
        <div className="h-4 bg-white/10 rounded w-5/6"></div>
      </div>

      {/* Tags skeleton */}
      <div className="flex gap-2 mb-4">
        <div className="h-6 w-16 bg-white/10 rounded-md"></div>
        <div className="h-6 w-20 bg-white/10 rounded-md"></div>
      </div>

      {/* Footer skeleton */}
      <div className="flex items-center justify-between pt-3 border-t border-purple-400/10">
        <div className="h-4 w-24 bg-white/10 rounded"></div>
        <div className="h-6 w-20 bg-white/10 rounded-full"></div>
      </div>
    </div>
  )
}
