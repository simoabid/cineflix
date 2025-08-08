import React, { useState, useEffect, useMemo } from 'react';
import { 
  Grid, 
  List, 
  MoreHorizontal, 
  Filter, 
  Search, 
  Plus, 
  Download, 
  BarChart3, 
  Settings,
  Play,
  Clock,
  Star,
  Calendar,
  Tag,
  Trash2,
  Edit3,
  CheckSquare,
  Square
} from 'lucide-react';
import { myListService } from '../services/myListService';
import { MyListItem, ViewMode, FilterOptions, ListStats, SortOption, SortDirection } from '../types/myList';
import MyListHeader from '../components/MyList/MyListHeader';
import FilterBar from '../components/MyList/FilterBar';
import QuickActions from '../components/MyList/QuickActions';
import ListContent from '../components/MyList/ListContent';
import EmptyState from '../components/MyList/EmptyState';
import BulkActions from '../components/MyList/BulkActions';
import StatsModal from '../components/MyList/StatsModal';
import ExportModal from '../components/MyList/ExportModal';

const MyListPage: React.FC = () => {
  // State management
  const [items, setItems] = useState<MyListItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MyListItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('dateAdded');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    contentType: 'all',
    status: 'all',
    genres: [],
    dateAdded: 'all',
    rating: 'all',
    runtime: 'all',
    releaseYear: 'all',
    customTags: [],
    priority: 'all',
    liked: 'all'
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Update filtered items when filters, sort, or search change
  useEffect(() => {
    applyFiltersAndSort();
  }, [items, filters, sortBy, sortDirection, searchQuery]);

  // Load user preferences
  useEffect(() => {
    const preferences = myListService.getPreferences();
    setViewMode(preferences.defaultViewMode);
    setSortBy(preferences.defaultSortOption);
    setSortDirection(preferences.defaultSortDirection);
  }, []);

  const loadData = () => {
    setIsLoading(true);
    try {
      const myListItems = myListService.getMyList();
      setItems(myListItems);
    } catch (error) {
      console.error('Error loading My List:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let result = myListService.getFilteredItems(filters, sortBy, sortDirection);
    
    if (searchQuery.trim()) {
      result = myListService.searchItems(searchQuery);
      // Apply filters to search results
      result = result.filter(item => {
        if (filters.contentType !== 'all' && item.contentType !== filters.contentType) return false;
        if (filters.status !== 'all' && item.status !== filters.status) return false;
        if (filters.priority !== 'all' && item.priority !== filters.priority) return false;
        return true;
      });
    }
    
    setFilteredItems(result);
  };

  // Calculate stats
  const stats = useMemo(() => {
    return myListService.getListStats();
  }, [items]);

  // Continue watching items
  const continueWatchingItems = useMemo(() => {
    return myListService.getContinueWatching();
  }, [items]);

  // Recently added items
  const recentlyAddedItems = useMemo(() => {
    return myListService.getRecentlyAdded();
  }, [items]);

  // Handle item updates
  const handleUpdateItem = (itemId: string, updates: Partial<MyListItem>) => {
    myListService.updateItem(itemId, updates);
    loadData();
  };

  // Handle item removal
  const handleRemoveItem = (itemId: string) => {
    myListService.removeFromList(itemId);
    loadData();
    setSelectedItems(prev => prev.filter(id => id !== itemId));
  };

  // Handle bulk operations
  const handleBulkOperation = (operation: any) => {
    myListService.performBulkOperation(operation);
    loadData();
    setSelectedItems([]);
    setShowBulkActions(false);
  };

  // Handle item selection
  const handleItemSelect = (itemId: string, selected: boolean) => {
    if (selected) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item.id));
    }
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Handle sort changes
  const handleSortChange = (newSortBy: SortOption, newDirection?: SortDirection) => {
    setSortBy(newSortBy);
    if (newDirection) {
      setSortDirection(newDirection);
    } else {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    }
  };

  // Handle view mode change
  const handleViewModeChange = (newViewMode: ViewMode) => {
    setViewMode(newViewMode);
    // Save preference
    const preferences = myListService.getPreferences();
    myListService.savePreferences({ ...preferences, defaultViewMode: newViewMode });
  };

  // Show bulk actions when items are selected
  useEffect(() => {
    setShowBulkActions(selectedItems.length > 0);
  }, [selectedItems]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-netflix-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-netflix-red mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-netflix-black text-white pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <MyListHeader
          stats={stats}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
          onStatsClick={() => setShowStatsModal(true)}
          onExportClick={() => setShowExportModal(true)}
          selectedCount={selectedItems.length}
          totalCount={filteredItems.length}
        />

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search your list..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-700 focus:border-netflix-red focus:outline-none focus:ring-1 focus:ring-netflix-red"
            />
          </div>
        </div>

        {/* Filter Bar */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          availableTags={myListService.getAllTags()}
        />

        {/* Quick Actions Section */}
        {(continueWatchingItems.length > 0 || recentlyAddedItems.length > 0) && (
          <QuickActions
            continueWatching={continueWatchingItems}
            recentlyAdded={recentlyAddedItems}
            onItemUpdate={handleUpdateItem}
            onItemRemove={handleRemoveItem}
          />
        )}

        {/* Bulk Actions */}
        {showBulkActions && (
          <BulkActions
            selectedItems={selectedItems}
            onBulkOperation={handleBulkOperation}
            onSelectAll={handleSelectAll}
            onClearSelection={() => setSelectedItems([])}
            isAllSelected={selectedItems.length === filteredItems.length}
          />
        )}

        {/* Main Content */}
        {filteredItems.length === 0 ? (
          <EmptyState
            hasItems={items.length > 0}
            searchQuery={searchQuery}
            onClearFilters={() => {
              setFilters({
                contentType: 'all',
                status: 'all',
                genres: [],
                dateAdded: 'all',
                rating: 'all',
                runtime: 'all',
                releaseYear: 'all',
                customTags: [],
                priority: 'all',
                liked: 'all'
              });
              setSearchQuery('');
            }}
          />
        ) : (
          <ListContent
            items={filteredItems}
            viewMode={viewMode}
            selectedItems={selectedItems}
            onItemSelect={handleItemSelect}
            onItemUpdate={handleUpdateItem}
            onItemRemove={handleRemoveItem}
          />
        )}

        {/* Modals */}
        {showStatsModal && (
          <StatsModal
            stats={stats}
            items={items}
            onClose={() => setShowStatsModal(false)}
          />
        )}

        {showExportModal && (
          <ExportModal
            items={selectedItems.length > 0 
              ? filteredItems.filter(item => selectedItems.includes(item.id))
              : filteredItems
            }
            onClose={() => setShowExportModal(false)}
          />
        )}
      </div>
    </div>
  );
};

export default MyListPage;
