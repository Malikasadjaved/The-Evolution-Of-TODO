/**
 * Select Component - Purple Kanban Design System
 *
 * Custom glassmorphism dropdown select matching Input styling:
 * - Trigger: Same styling as Input component
 * - Dropdown: Glassmorphic with backdrop blur
 * - Items: Hover effect with purple highlight
 *
 * Features:
 * - Keyboard navigation (arrow keys, enter, escape)
 * - Click outside to close
 * - Smooth animations
 * - Label and error support
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps {
  /**
   * Select label (displayed above select)
   */
  label?: string

  /**
   * Available options
   */
  options: SelectOption[]

  /**
   * Currently selected value
   */
  value?: string

  /**
   * Placeholder text when no value selected
   */
  placeholder?: string

  /**
   * Callback when value changes
   */
  onChange?: (value: string) => void

  /**
   * Error message (displayed below select in red)
   */
  error?: string

  /**
   * Disabled state
   */
  disabled?: boolean

  /**
   * Full width select
   */
  fullWidth?: boolean

  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * Select Component
 *
 * @example
 * // Basic select
 * <Select
 *   options={[
 *     { value: 'high', label: 'High Priority' },
 *     { value: 'medium', label: 'Medium Priority' },
 *     { value: 'low', label: 'Low Priority' },
 *   ]}
 *   placeholder="Select priority"
 *   onChange={(value) => console.log(value)}
 * />
 *
 * @example
 * // Select with label
 * <Select
 *   label="Priority"
 *   options={priorityOptions}
 *   value={selectedPriority}
 *   onChange={setPriority}
 * />
 *
 * @example
 * // Select with error
 * <Select
 *   label="Status"
 *   options={statusOptions}
 *   error="Please select a status"
 * />
 */
export const Select: React.FC<SelectProps> = ({
  label,
  options,
  value,
  placeholder = 'Select an option',
  onChange,
  error,
  disabled = false,
  fullWidth = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Get selected option label
  const selectedOption = options.find((opt) => opt.value === value)
  const displayValue = selectedOption?.label || placeholder

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (isOpen && focusedIndex >= 0) {
          const option = options[focusedIndex]
          if (!option.disabled) {
            onChange?.(option.value)
            setIsOpen(false)
          }
        } else {
          setIsOpen(true)
        }
        break

      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        break

      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          setFocusedIndex((prev) => {
            const next = prev + 1
            return next >= options.length ? 0 : next
          })
        }
        break

      case 'ArrowUp':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          setFocusedIndex((prev) => {
            const next = prev - 1
            return next < 0 ? options.length - 1 : next
          })
        }
        break
    }
  }

  // Handle option click
  const handleOptionClick = (option: SelectOption) => {
    if (option.disabled) return
    onChange?.(option.value)
    setIsOpen(false)
    setFocusedIndex(-1)
  }

  const triggerClasses = [
    'bg-white/5',
    'border',
    error ? 'border-red-400' : 'border-purple-400/30',
    'rounded-lg',
    'px-3 py-2',
    'text-white',
    'transition-all duration-300',
    'focus:outline-none',
    'focus:ring-2',
    error ? 'focus:ring-red-400/50' : 'focus:ring-purple-400/50',
    error ? 'focus:border-red-400' : 'focus:border-purple-400',
    'cursor-pointer',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'flex items-center justify-between gap-2',
    fullWidth ? 'w-full' : '',
    !selectedOption && 'text-gray-400',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col gap-1 ${fullWidth ? 'w-full' : ''}`}
    >
      {/* Label */}
      {label && (
        <label className="text-sm font-medium text-white/80">{label}</label>
      )}

      {/* Trigger Button */}
      <div
        className={triggerClasses}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex-1 text-left truncate">{displayValue}</span>

        {/* Chevron Icon */}
        <svg
          className={`w-5 h-5 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 top-full mt-1 w-full bg-purple-900/95 backdrop-blur-xl border border-purple-400/20 rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
          role="listbox"
        >
          {options.map((option, index) => (
            <div
              key={option.value}
              className={[
                'px-3 py-2',
                'cursor-pointer',
                'transition-colors duration-150',
                'text-white',
                option.disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-purple-500/20',
                focusedIndex === index && 'bg-purple-500/20',
                value === option.value && 'bg-purple-500/30 font-medium',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleOptionClick(option)}
              onMouseEnter={() => setFocusedIndex(index)}
              role="option"
              aria-selected={value === option.value}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-400 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

export default Select
