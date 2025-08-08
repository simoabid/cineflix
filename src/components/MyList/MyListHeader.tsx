import React from 'react';
import { 
  Grid, 
  List, 
  MoreHorizontal, 
  BarChart3, 
  Download, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { ViewMode, SortOption, SortDirection, ListStats } from '../../types/myList';

interface MyListHeaderProps {
  stats: ListStats;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortBy: SortOption;
  sortDirection: SortDirection;
  onSortChange: (sortBy: SortOption, direction?: SortDirection) => void;
  onStatsClick: () => void;
  onExportClick: () => void;
  selectedCount: number;
  totalCount: number;
}

const MyListHeader: React.FC<MyListHeaderProps> = ({
  stats,
  viewMode,
  onViewModeChange,
  sortBy,
  sortDirection,
  onSortChange,
  onStatsClick,
  onExportClick,
  selectedCount,
  totalCount
}) => {
  const getSortIcon = (option: SortOption) => {
    if (sortBy !== option) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const formatHours = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return `${days}d ${remainingHours}h`;
  };

  return (
    <div className="mb-8">
      {/* Title and Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">My List</h1>
          <div className="flex flex-wrap gap-4 text-gray-400">
            <span>{stats.totalItems} items</span>
            <span>•</span>
            <span>{stats.totalMovies} movies</span>
            <span>•</span>
            <span>{stats.totalTVShows} TV shows</span>
            <span>•</span>
            <span>{formatHours(stats.totalHours)} total</span>
            {stats.completionRate > 0 && (
              <>
                <span>•</span>
                <span>{stats.completionRate}% completed</span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-4 lg:mt-0">
          <button
            onClick={onStatsClick}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Stats</span>
          </button>
          
          <button
            onClick={onExportClick}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Selection Info */}
      {selectedCount > 0 && (
        <div className="bg-netflix-red/10 border border-netflix-red/20 rounded-lg p-4 mb-6">
          <p className="text-netflix-red">
            {selectedCount} of {totalCount} items selected
          </p>
        </div>
      )}

      {/* View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm mr-2">View:</span>
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-netflix-red text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            
            <button
              onClick={() => onViewModeChange('list')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-netflix-red text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </button>
            
            <button
              onClick={() => onViewModeChange('compact')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                viewMode === 'compact' 
                  ? 'bg-netflix-red text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <MoreHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Compact</span>
            </button>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm mr-2">Sort by:</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onSortChange('dateAdded')}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                sortBy === 'dateAdded' 
                  ? 'bg-netflix-red text-white' 
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Date Added
              {getSortIcon('dateAdded')}
            </button>
            
            <button
              onClick={() => onSortChange('title')}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                sortBy === 'title' 
                  ? 'bg-netflix-red text-white' 
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Title
              {getSortIcon('title')}
            </button>
            
            <button
              onClick={() => onSortChange('rating')}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                sortBy === 'rating' 
                  ? 'bg-netflix-red text-white' 
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Rating
              {getSortIcon('rating')}
            </button>
            
            <button
              onClick={() => onSortChange('runtime')}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                sortBy === 'runtime' 
                  ? 'bg-netflix-red text-white' 
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <span className="hidden sm:inline">Runtime</span>
              <span className="sm:hidden">Time</span>
              {getSortIcon('runtime')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyListHeader;
