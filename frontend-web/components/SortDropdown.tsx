/**
 * SortDropdown Component - Modern Glassmorphic Design
 *
 * Animated custom dropdown with glassmorphism styling and localStorage persistence.
 * Features smooth Framer Motion animations and intuitive UX.
 *
 * Features:
 * - Animated dropdown with Framer Motion
 * - Glassmorphic design matching dashboard theme
 * - Sort by: due_date, priority, created_at, title
 * - Toggle order: ascending/descending
 * - Icon-based sort options
 * - Persists preferences to localStorage
 * - Keyboard accessible
 * - Smooth hover and active states
 */

'use client'

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  Flag,
  Clock,
  type LucideIcon
} from 'lucide-react';

type SortField = 'due_date' | 'priority' | 'created_at' | 'title' | '';
type SortOrder = 'asc' | 'desc';

interface SortOption {
  value: SortField;
  label: string;
  icon: LucideIcon;
  description: string;
}

const sortOptions: SortOption[] = [
  {
    value: 'due_date',
    label: 'Due Date',
    icon: Calendar,
    description: 'Sort by deadline',
  },
  {
    value: 'priority',
    label: 'Priority',
    icon: Flag,
    description: 'Sort by importance',
  },
  {
    value: 'created_at',
    label: 'Created',
    icon: Clock,
    description: 'Sort by creation date',
  },
  {
    value: 'title',
    label: 'Title',
    icon: ArrowUpDown,
    description: 'Sort alphabetically',
  },
];

interface SortDropdownProps {
  /**
   * Callback when sort changes
   */
  onSortChange: (sort: SortField, order: SortOrder) => void;

  /**
   * Initial sort field
   */
  initialSort?: SortField;

  /**
   * Initial sort order
   */
  initialOrder?: SortOrder;
}

/**
 * SortDropdown Component
 *
 * @example
 * <SortDropdown
 *   onSortChange={(sort, order) => {
 *     setSort(sort);
 *     setOrder(order);
 *   }}
 * />
 */
export const SortDropdown: React.FC<SortDropdownProps> = ({
  onSortChange,
  initialSort = '',
  initialOrder = 'asc',
}) => {
  const [sortField, setSortField] = useState<SortField>(initialSort);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialOrder);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedSort = localStorage.getItem('taskSortField') as SortField | null;
    const savedOrder = localStorage.getItem('taskSortOrder') as SortOrder | null;

    if (savedSort) setSortField(savedSort);
    if (savedOrder) setSortOrder(savedOrder);

    // Notify parent of loaded values
    if (savedSort || savedOrder) {
      onSortChange(savedSort || initialSort, savedOrder || initialOrder);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle sort field change
  const handleSortFieldChange = (newSort: SortField) => {
    setSortField(newSort);
    localStorage.setItem('taskSortField', newSort);
    onSortChange(newSort, sortOrder);
    setIsOpen(false);
  };

  // Handle sort order toggle
  const handleSortOrderChange = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    localStorage.setItem('taskSortOrder', newOrder);
    onSortChange(sortField, newOrder);
  };

  // Handle clear sort
  const handleClearSort = () => {
    setSortField('');
    setSortOrder('asc');
    localStorage.removeItem('taskSortField');
    localStorage.removeItem('taskSortOrder');
    onSortChange('', 'asc');
    setIsOpen(false);
  };

  // Get current sort option
  const currentSortOption = sortOptions.find(opt => opt.value === sortField);
  const CurrentIcon = currentSortOption?.icon || ArrowUpDown;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-3 px-4 py-2.5 rounded-xl border
          transition-all duration-300
          min-h-[44px] min-w-[180px]
          focus:outline-none focus:ring-2 focus:ring-cyan-400/50
          ${isOpen
            ? 'bg-cyan-500/20 border-cyan-400/50 shadow-lg shadow-cyan-500/20'
            : 'bg-white/5 border-blue-500/20 hover:bg-white/10 hover:border-cyan-400/30'
          }
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Sort by ${currentSortOption?.label || 'None'}`}
      >
        {/* Sort Icon */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ArrowUpDown className="w-5 h-5 text-cyan-400" />
        </motion.div>

        {/* Sort Label */}
        <span className="text-sm font-medium text-white/90 flex-1 text-left">
          {currentSortOption?.label || 'Sort'}
        </span>

        {/* Chevron */}
        <motion.svg
          className="w-4 h-4 text-white/60"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </motion.svg>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="
                absolute top-full left-0 mt-2 w-[280px]
                bg-slate-900/95 backdrop-blur-xl
                border border-cyan-500/20 rounded-2xl
                shadow-2xl shadow-cyan-500/20
                overflow-hidden z-50
              "
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-white/10">
                <h3 className="text-sm font-semibold text-white/90">
                  Sort Options
                </h3>
              </div>

              {/* Sort Options */}
              <div className="p-2 space-y-1">
                {sortOptions.map((option) => {
                  const Icon = option.icon;
                  const isActive = sortField === option.value;

                  return (
                    <motion.button
                      key={option.value}
                      onClick={() => handleSortFieldChange(option.value)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                        transition-all duration-200
                        min-h-[44px]
                        ${isActive
                          ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30'
                          : 'hover:bg-white/5 border border-transparent'
                        }
                      `}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-white/60'}`} />
                      <div className="flex-1 text-left">
                        <div className={`text-sm font-medium ${isActive ? 'text-white' : 'text-white/70'}`}>
                          {option.label}
                        </div>
                        <div className="text-xs text-white/50">
                          {option.description}
                        </div>
                      </div>
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 bg-cyan-400 rounded-full"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Order Toggle (only when sort is active) */}
              {sortField && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-white/10 p-2"
                >
                  <motion.button
                    onClick={handleSortOrderChange}
                    className="
                      w-full flex items-center justify-center gap-3
                      px-3 py-2.5 rounded-xl
                      bg-gradient-to-r from-purple-500/20 to-pink-500/20
                      border border-purple-400/30
                      hover:from-purple-500/30 hover:to-pink-500/30
                      transition-all duration-200
                      min-h-[44px]
                    "
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {sortOrder === 'asc' ? (
                      <ArrowUp className="w-5 h-5 text-purple-400" />
                    ) : (
                      <ArrowDown className="w-5 h-5 text-purple-400" />
                    )}
                    <span className="text-sm font-medium text-white/90">
                      {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                    </span>
                    <span className="text-xs text-white/50">
                      ({sortField === 'priority' ? (sortOrder === 'asc' ? 'Low → High' : 'High → Low') : 'A → Z'})
                    </span>
                  </motion.button>
                </motion.div>
              )}

              {/* Clear Button */}
              <div className="border-t border-white/10 p-2">
                <motion.button
                  onClick={handleClearSort}
                  className="
                    w-full flex items-center justify-center gap-2
                    px-3 py-2.5 rounded-xl
                    text-white/50 hover:text-white/80
                    hover:bg-white/5
                    transition-all duration-200
                    min-h-[44px]
                  "
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  <span className="text-sm font-medium">Clear Sort</span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Active Sort Indicator */}
      {sortField && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full border-2 border-slate-900"
        />
      )}
    </div>
  );
};

export default SortDropdown;
