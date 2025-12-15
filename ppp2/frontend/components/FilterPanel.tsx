/**
 * FilterPanel Component
 *
 * Filter controls for tasks (status, priority, tags, date range).
 *
 * Features:
 * - Status filter (all, active, completed)
 * - Priority filter (all, high, medium, low)
 * - Tag filter (multi-select)
 * - Date range filter
 * - Clear all filters
 */

'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { TaskFilters } from '@/lib/types'

export interface FilterPanelProps {
  filters: TaskFilters
  onChange: (filters: TaskFilters) => void
  availableTags: string[]
}

export function FilterPanel({ filters, onChange, availableTags }: FilterPanelProps) {
  const handleStatusChange = (completed: boolean | undefined) => {
    onChange({ ...filters, completed })
  }

  const handlePriorityChange = (priority: 'HIGH' | 'MEDIUM' | 'LOW' | undefined) => {
    onChange({ ...filters, priority })
  }

  const handleTagToggle = (tag: string) => {
    const currentTags = filters.tags || []
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag]
    onChange({ ...filters, tags: newTags.length > 0 ? newTags : undefined })
  }

  const handleClearFilters = () => {
    onChange({
      search: filters.search, // Keep search
      completed: undefined,
      priority: undefined,
      tags: undefined,
    })
  }

  const hasActiveFilters =
    filters.completed !== undefined ||
    filters.priority !== undefined ||
    (filters.tags && filters.tags.length > 0)

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            Clear all
          </Button>
        )}
      </div>

      {/* Status Filter */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Status</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleStatusChange(undefined)}
            className={`px-3 py-1 text-xs rounded-md border ${
              filters.completed === undefined
                ? 'bg-blue-100 border-blue-300 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => handleStatusChange(false)}
            className={`px-3 py-1 text-xs rounded-md border ${
              filters.completed === false
                ? 'bg-blue-100 border-blue-300 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => handleStatusChange(true)}
            className={`px-3 py-1 text-xs rounded-md border ${
              filters.completed === true
                ? 'bg-blue-100 border-blue-300 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Priority Filter */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Priority</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handlePriorityChange(undefined)}
            className={`px-3 py-1 text-xs rounded-md border ${
              filters.priority === undefined
                ? 'bg-blue-100 border-blue-300 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => handlePriorityChange('HIGH')}
            className={`px-3 py-1 text-xs rounded-md border ${
              filters.priority === 'HIGH'
                ? 'bg-red-100 border-red-300 text-red-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            High
          </button>
          <button
            type="button"
            onClick={() => handlePriorityChange('MEDIUM')}
            className={`px-3 py-1 text-xs rounded-md border ${
              filters.priority === 'MEDIUM'
                ? 'bg-yellow-100 border-yellow-300 text-yellow-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Medium
          </button>
          <button
            type="button"
            onClick={() => handlePriorityChange('LOW')}
            className={`px-3 py-1 text-xs rounded-md border ${
              filters.priority === 'LOW'
                ? 'bg-blue-100 border-blue-300 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Low
          </button>
        </div>
      </div>

      {/* Tag Filter */}
      {availableTags.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Tags</label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => {
              const isSelected = filters.tags?.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 text-xs rounded-md border ${
                    isSelected
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
