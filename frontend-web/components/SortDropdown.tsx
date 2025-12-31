/**
 * SortDropdown Component - Purple Kanban Design System
 *
 * Sort dropdown with glassmorphism styling and localStorage persistence.
 * Allows users to sort tasks by different criteria.
 *
 * Features:
 * - Sort by: due_date, priority, created_at, title
 * - Order: ascending/descending
 * - Persists preferences to localStorage
 * - Glassmorphic design
 * - Purple theme
 */

import React, { useState, useEffect } from 'react';

type SortField = 'due_date' | 'priority' | 'created_at' | 'title' | '';
type SortOrder = 'asc' | 'desc';

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

  // Handle sort field change
  const handleSortFieldChange = (newSort: SortField) => {
    setSortField(newSort);
    localStorage.setItem('taskSortField', newSort);
    onSortChange(newSort, sortOrder);
  };

  // Handle sort order change
  const handleSortOrderChange = (newOrder: SortOrder) => {
    setSortOrder(newOrder);
    localStorage.setItem('taskSortOrder', newOrder);
    onSortChange(sortField, newOrder);
  };

  return (
    <div className="flex items-center gap-3">
      {/* Sort Icon */}
      <div className="text-white/50 flex items-center gap-2">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
          />
        </svg>
        <span className="text-sm font-medium text-white/70">Sort by:</span>
      </div>

      {/* Sort Field Dropdown */}
      <select
        value={sortField}
        onChange={(e) => handleSortFieldChange(e.target.value as SortField)}
        className="
          bg-white/5
          border border-purple-400/30
          rounded-lg
          px-3 py-2
          text-white text-sm
          transition-all duration-300
          focus:outline-none
          focus:border-purple-400
          focus:ring-2
          focus:ring-purple-400/50
          cursor-pointer
        "
        aria-label="Sort field"
      >
        <option value="" className="bg-gray-900">None</option>
        <option value="due_date" className="bg-gray-900">Due Date</option>
        <option value="priority" className="bg-gray-900">Priority</option>
        <option value="created_at" className="bg-gray-900">Created Date</option>
        <option value="title" className="bg-gray-900">Title</option>
      </select>

      {/* Sort Order Dropdown (only show when sort field is selected) */}
      {sortField && (
        <select
          value={sortOrder}
          onChange={(e) => handleSortOrderChange(e.target.value as SortOrder)}
          className="
            bg-white/5
            border border-purple-400/30
            rounded-lg
            px-3 py-2
            text-white text-sm
            transition-all duration-300
            focus:outline-none
            focus:border-purple-400
            focus:ring-2
            focus:ring-purple-400/50
            cursor-pointer
          "
          aria-label="Sort order"
        >
          <option value="asc" className="bg-gray-900">
            {sortField === 'priority' ? 'LOW → HIGH' : 'Ascending'}
          </option>
          <option value="desc" className="bg-gray-900">
            {sortField === 'priority' ? 'HIGH → LOW' : 'Descending'}
          </option>
        </select>
      )}

      {/* Clear Sort Button (only show when sorting is active) */}
      {sortField && (
        <button
          type="button"
          onClick={() => {
            setSortField('');
            setSortOrder('asc');
            localStorage.removeItem('taskSortField');
            localStorage.removeItem('taskSortOrder');
            onSortChange('', 'asc');
          }}
          className="
            text-white/50 hover:text-white/80
            transition-colors duration-200
            p-1
          "
          aria-label="Clear sort"
          title="Clear sort"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SortDropdown;
