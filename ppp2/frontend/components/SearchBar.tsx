/**
 * SearchBar Component
 *
 * Search input with debouncing for filtering tasks.
 *
 * Features:
 * - Debounced search (300ms)
 * - Clear button
 * - Search icon
 * - Keyboard shortcuts
 */

'use client'

import { useEffect, useState } from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useDebounce } from '@/lib/hooks/useDebounce'

export interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search tasks...',
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value)
  const debouncedValue = useDebounce(localValue, 300)

  useEffect(() => {
    onChange(debouncedValue)
  }, [debouncedValue, onChange])

  const handleClear = () => {
    setLocalValue('')
  }

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-10 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-3 hover:text-gray-600"
        >
          <XMarkIcon className="h-5 w-5 text-gray-400" />
        </button>
      )}
    </div>
  )
}
