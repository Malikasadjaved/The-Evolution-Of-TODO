/**
 * SortDropdown Component
 *
 * Dropdown for selecting task sort order.
 *
 * Features:
 * - Sort by due date, priority, title, created date
 * - Visual indicator of current sort
 */

'use client'

import { ChevronDownIcon } from '@heroicons/react/24/outline'
import type { SortOption } from '@/lib/types'

export interface SortDropdownProps {
  value: SortOption
  onChange: (value: SortOption) => void
}

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: 'dueDate', label: 'Due Date' },
  { value: 'priority', label: 'Priority' },
  { value: 'title', label: 'Title (A-Z)' },
  { value: 'createdAt', label: 'Created Date' },
]

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const currentLabel = sortOptions.find((opt) => opt.value === value)?.label || 'Sort by'

  return (
    <div className="relative inline-block text-left">
      <label htmlFor="sort" className="sr-only">
        Sort tasks
      </label>
      <div className="relative">
        <select
          id="sort"
          value={value}
          onChange={(e) => onChange(e.target.value as SortOption)}
          className="block w-full appearance-none rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronDownIcon className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    </div>
  )
}
