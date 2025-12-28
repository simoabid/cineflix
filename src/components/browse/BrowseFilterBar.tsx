import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Star, Calendar, SlidersHorizontal, Check, LayoutList } from 'lucide-react';
import { Genre } from '../../types';
import { BrowseFilters, SortOption, ViewMode, DisplayMode } from '../../types/browse';

interface BrowseFilterBarProps {
    filters: BrowseFilters;
    genres: Genre[];
    genreIcons: Record<number, string>;
    sortOptions: { value: SortOption; label: string }[];
    viewModeOptions: { mode: ViewMode; icon: React.ReactNode; label: string }[];
    displayModeOptions: { mode: DisplayMode; icon: React.ReactNode; label: string }[];
    onUpdateFilters: (updates: Partial<BrowseFilters>) => void;
    onToggleMobileFilters: () => void;
    inline?: boolean;
}

const BrowseFilterBar: React.FC<BrowseFilterBarProps> = ({
    filters,
    genres,
    genreIcons,
    sortOptions,
    viewModeOptions,
    displayModeOptions,
    onUpdateFilters,
    onToggleMobileFilters,
    inline = false,
}) => {
    const [showGenreDropdown, setShowGenreDropdown] = useState(false);
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const genreDropdownRef = useRef<HTMLDivElement>(null);
    const sortDropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (genreDropdownRef.current && !genreDropdownRef.current.contains(e.target as Node)) {
                setShowGenreDropdown(false);
            }
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
                setShowSortDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleGenre = (genreId: number) => {
        const newGenres = filters.genres.includes(genreId)
            ? filters.genres.filter(id => id !== genreId)
            : [...filters.genres, genreId];
        onUpdateFilters({ genres: newGenres });
    };

    const currentSortLabel = sortOptions.find(s => s.value === filters.sortBy)?.label || 'Sort';

    return (
        <div className={inline ? '' : 'sticky top-16 z-30 bg-[#0a0a0a]/95 border-b border-white/5'}>
            <div className={inline ? '' : 'max-w-7xl mx-auto px-4 md:px-8 lg:px-16'}>
                <div className={`flex items-center gap-4 ${inline ? '' : 'justify-between py-4'}`}>
                    {/* Desktop Filters */}
                    <div className="hidden md:flex items-center gap-3 flex-wrap">
                        {/* Genre Dropdown */}
                        <div className="relative" ref={genreDropdownRef}>
                            <button
                                onClick={() => setShowGenreDropdown(!showGenreDropdown)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filters.genres.length > 0
                                    ? 'bg-netflix-red/20 text-netflix-red border border-netflix-red/30'
                                    : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:border-white/20'
                                    }`}
                            >
                                <span>Genres</span>
                                {filters.genres.length > 0 && (
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-netflix-red text-white text-xs">
                                        {filters.genres.length}
                                    </span>
                                )}
                                <ChevronDown className={`w-4 h-4 transition-transform ${showGenreDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {showGenreDropdown && (
                                <div className="absolute top-full left-0 mt-2 w-[420px] bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl p-4 z-50">
                                    <div className="flex flex-wrap gap-2">
                                        {genres.map(genre => (
                                            <button
                                                key={genre.id}
                                                onClick={() => toggleGenre(genre.id)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors duration-150 ${filters.genres.includes(genre.id)
                                                    ? 'bg-netflix-red text-white'
                                                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                                    }`}
                                            >
                                                <span>{genreIcons[genre.id] || '🎬'}</span>
                                                <span>{genre.name}</span>
                                                {filters.genres.includes(genre.id) && (
                                                    <Check className="w-3.5 h-3.5" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    {filters.genres.length > 0 && (
                                        <button
                                            onClick={() => onUpdateFilters({ genres: [] })}
                                            className="w-full mt-3 py-2 text-sm text-gray-400 hover:text-white transition-colors border-t border-white/10"
                                        >
                                            Clear Selection
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Year Range */}
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <input
                                type="number"
                                min="1920"
                                max={filters.yearMax}
                                value={filters.yearMin}
                                onChange={(e) => onUpdateFilters({ yearMin: parseInt(e.target.value) || 1920 })}
                                className="w-16 bg-transparent text-sm text-white focus:outline-none"
                                placeholder="From"
                            />
                            <span className="text-gray-500">-</span>
                            <input
                                type="number"
                                min={filters.yearMin}
                                max={new Date().getFullYear()}
                                value={filters.yearMax}
                                onChange={(e) => onUpdateFilters({ yearMax: parseInt(e.target.value) || new Date().getFullYear() })}
                                className="w-16 bg-transparent text-sm text-white focus:outline-none"
                                placeholder="To"
                            />
                        </div>

                        {/* Rating Filter */}
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm text-gray-300">
                                {filters.minRating > 0 ? `${filters.minRating}+` : 'Any Rating'}
                            </span>
                            <input
                                type="range"
                                min="0"
                                max="9"
                                step="0.5"
                                value={filters.minRating}
                                onChange={(e) => onUpdateFilters({ minRating: parseFloat(e.target.value) })}
                                className="w-20 accent-netflix-red"
                            />
                        </div>

                        {/* Sort Dropdown */}
                        <div className="relative" ref={sortDropdownRef}>
                            <button
                                onClick={() => setShowSortDropdown(!showSortDropdown)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 hover:border-white/20 transition-all"
                            >
                                <span>{currentSortLabel}</span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {showSortDropdown && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-scale-in">
                                    {sortOptions.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => {
                                                onUpdateFilters({ sortBy: option.value });
                                                setShowSortDropdown(false);
                                            }}
                                            className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${filters.sortBy === option.value
                                                ? 'bg-netflix-red text-white'
                                                : 'text-gray-300 hover:bg-white/10'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile Filter Button */}
                    <button
                        onClick={onToggleMobileFilters}
                        className="md:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300"
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        <span>Filters</span>
                        {(filters.genres.length > 0 || filters.minRating > 0) && (
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-netflix-red text-white text-xs">
                                {filters.genres.length + (filters.minRating > 0 ? 1 : 0)}
                            </span>
                        )}
                    </button>

                    {/* Display Mode Toggle */}
                    <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
                        {displayModeOptions.map(option => (
                            <button
                                key={option.mode}
                                onClick={() => onUpdateFilters({ displayMode: option.mode })}
                                className={`p-2 rounded-lg transition-all ${filters.displayMode === option.mode
                                    ? 'bg-netflix-red text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                title={option.label}
                            >
                                {option.icon}
                            </button>
                        ))}
                    </div>

                    {/* View Mode Toggle */}
                    <div className={`flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10 ${filters.displayMode === 'grid' ? '' : 'hidden'}`}>
                        {viewModeOptions.map(option => (
                            <button
                                key={option.mode}
                                onClick={() => onUpdateFilters({ viewMode: option.mode })}
                                className={`p-2 rounded-lg transition-all ${filters.viewMode === option.mode
                                    ? 'bg-netflix-red text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                title={option.label}
                            >
                                {option.icon}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BrowseFilterBar;
