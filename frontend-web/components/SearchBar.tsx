/**
 * SearchBar Component - Purple Kanban Design System
 *
 * Debounced search input with glassmorphism styling.
 * Updates search query with 300ms delay to avoid excessive API calls.
 *
 * Features:
 * - 300ms debounced input
 * - Search icon prefix
 * - Clear button when text is present
 * - Glassmorphic design
 * - Purple theme
 */

import React, { useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchBarProps {
  /**
   * Callback when search query changes (debounced)
   */
  onSearchChange: (query: string) => void;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Initial search value
   */
  initialValue?: string;
}

/**
 * SearchBar Component
 *
 * @example
 * <SearchBar
 *   onSearchChange={(query) => setSearchQuery(query)}
 *   placeholder="Search tasks..."
 * />
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  onSearchChange,
  placeholder = 'Search tasks...',
  initialValue = '',
}) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Call onSearchChange when debounced value updates
  React.useEffect(() => {
    onSearchChange(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearchChange]);

  // Clear search
  const handleClear = () => {
    setSearchTerm('');
  };

  return (
    <div className="relative w-full max-w-md">
      {/* Search Icon */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
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
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Input */}
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        className="
          w-full
          bg-white/5
          border border-purple-400/30
          rounded-lg
          pl-10 pr-10 py-2.5
          text-white
          placeholder:text-gray-400
          transition-all duration-300
          focus:outline-none
          focus:border-purple-400
          focus:ring-2
          focus:ring-purple-400/50
        "
      />

      {/* Clear Button */}
      {searchTerm && (
        <button
          type="button"
          onClick={handleClear}
          className="
            absolute right-3 top-1/2 -translate-y-1/2
            text-white/50 hover:text-white/80
            transition-colors duration-200
          "
          aria-label="Clear search"
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

export default SearchBar;
