import React, { useState, useCallback } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Genre } from '../types';

interface FilterBarProps {
  genres: Genre[];
  years: string[];
  searchQuery: string;
  selectedGenre: string;
  selectedYear: string;
  selectedRating: number;
  showFilters: boolean;
  onSearchChange: (query: string) => void;
  onGenreChange: (genre: string) => void;
  onYearChange: (year: string) => void;
  onRatingChange: (rating: number) => void;
  onToggleFilters: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  genres,
  years,
  searchQuery,
  selectedGenre,
  selectedYear,
  selectedRating,
  showFilters,
  onSearchChange,
  onGenreChange,
  onYearChange,
  onRatingChange,
  onToggleFilters,
}) => {
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDebouncedSearch(value);
    
    // Debounce search input
    const timeoutId = setTimeout(() => {
      onSearchChange(value);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [onSearchChange]);

  const handleClearFilters = () => {
    onSearchChange('');
    onGenreChange('');
    onYearChange('');
    onRatingChange(0);
    setDebouncedSearch('');
  };

  const hasActiveFilters = searchQuery || selectedGenre || selectedYear || selectedRating > 0;

  return (
    <div className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4">
        {/* Search Bar */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search TV shows..."
              value={debouncedSearch}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-red-600 transition-colors"
              aria-label="Search TV shows"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <button
            onClick={onToggleFilters}
            className="md:hidden flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Toggle filters"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Desktop Filters */}
        <div className="hidden md:flex items-center gap-4">
          <select
            value={selectedGenre}
            onChange={(e) => onGenreChange(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-red-600 transition-colors"
            aria-label="Filter by genre"
          >
            <option value="">All Genres</option>
            {genres.map((genre) => (
              <option key={genre.id} value={genre.name}>
                {genre.name}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-red-600 transition-colors"
            aria-label="Filter by year"
          >
            <option value="">All Years</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <label htmlFor="rating-slider" className="text-sm text-gray-400">
              Min Rating: {selectedRating || 0}
            </label>
            <input
              id="rating-slider"
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={selectedRating}
              onChange={(e) => onRatingChange(parseFloat(e.target.value))}
              className="w-32 accent-red-600"
              aria-label="Filter by minimum rating"
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Mobile Filters */}
        {showFilters && (
          <div className="md:hidden space-y-4 mt-4 p-4 bg-gray-800 rounded-lg">
            <select
              value={selectedGenre}
              onChange={(e) => onGenreChange(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-red-600 transition-colors"
              aria-label="Filter by genre"
            >
              <option value="">All Genres</option>
              {genres.map((genre) => (
                <option key={genre.id} value={genre.name}>
                  {genre.name}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => onYearChange(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-red-600 transition-colors"
              aria-label="Filter by year"
            >
              <option value="">All Years</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <div className="space-y-2">
              <label htmlFor="mobile-rating-slider" className="text-sm text-gray-400">
                Min Rating: {selectedRating || 0}
              </label>
              <input
                id="mobile-rating-slider"
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={selectedRating}
                onChange={(e) => onRatingChange(parseFloat(e.target.value))}
                className="w-full accent-red-600"
                aria-label="Filter by minimum rating"
              />
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="w-full px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
