import { MyListItem, CustomCollection, ListStats, FilterOptions, ListPreferences, BulkOperation } from '../types/myList';
import { Movie, TVShow } from '../types';

class MyListService {
  private storageKey = 'cineflix_my_list';
  private collectionsKey = 'cineflix_collections';
  private preferencesKey = 'cineflix_list_preferences';

  // Get all list items
  getMyList(): MyListItem[] {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : [];
  }

  // Add item to list
  addToList(content: Movie | TVShow, contentType: 'movie' | 'tv'): MyListItem {
    const items = this.getMyList();
    const existingItem = items.find(item => 
      item.contentId === content.id && item.contentType === contentType
    );

    if (existingItem) {
      return existingItem;
    }

    const newItem: MyListItem = {
      id: `${content.id}-${contentType}-${Date.now()}`,
      contentId: content.id,
      contentType,
      content,
      dateAdded: new Date().toISOString(),
      status: 'notStarted',
      progress: 0,
      priority: 'medium',
      customTags: [],
      estimatedRuntime: this.calculateRuntime(content, contentType),
      isInContinueWatching: false,
      isLiked: false
    };

    items.push(newItem);
    this.saveList(items);
    return newItem;
  }

  // Remove item from list
  removeFromList(itemId: string): void {
    const items = this.getMyList().filter(item => item.id !== itemId);
    this.saveList(items);
  }

  // Like/Unlike content methods
  toggleLike(contentId: number, contentType: 'movie' | 'tv'): boolean {
    const items = this.getMyList();
    const existingItem = items.find(item => 
      item.contentId === contentId && item.contentType === contentType
    );

    if (existingItem) {
      // Toggle like status for existing item
      existingItem.isLiked = !existingItem.isLiked;
      existingItem.likedAt = existingItem.isLiked ? new Date().toISOString() : undefined;
      this.saveList(items);
      return existingItem.isLiked;
    }

    return false;
  }

  // Check if content is liked
  isLiked(contentId: number, contentType: 'movie' | 'tv'): boolean {
    const items = this.getMyList();
    const item = items.find(item => 
      item.contentId === contentId && item.contentType === contentType
    );
    return item?.isLiked || false;
  }

  // Get all liked content
  getLikedContent(): MyListItem[] {
    return this.getMyList().filter(item => item.isLiked);
  }

  // Like content (add to list if not exists and mark as liked)
  likeContent(content: any, contentType: 'movie' | 'tv'): MyListItem {
    const items = this.getMyList();
    const existingItem = items.find(item => 
      item.contentId === content.id && item.contentType === contentType
    );

    if (existingItem) {
      // Update existing item
      existingItem.isLiked = true;
      existingItem.likedAt = new Date().toISOString();
      this.saveList(items);
      return existingItem;
    } else {
      // Create new item and mark as liked
      const newItem: MyListItem = {
        id: `${content.id}-${contentType}-${Date.now()}`,
        contentId: content.id,
        contentType,
        content,
        dateAdded: new Date().toISOString(),
        status: 'notStarted',
        progress: 0,
        priority: 'medium',
        customTags: [],
        estimatedRuntime: this.calculateRuntime(content, contentType),
        isInContinueWatching: false,
        isLiked: true,
        likedAt: new Date().toISOString()
      };

      items.push(newItem);
      this.saveList(items);
      return newItem;
    }
  }

  // Unlike content
  unlikeContent(contentId: number, contentType: 'movie' | 'tv'): void {
    const items = this.getMyList();
    const item = items.find(item => 
      item.contentId === contentId && item.contentType === contentType
    );

    if (item) {
      item.isLiked = false;
      item.likedAt = undefined;
      this.saveList(items);
    }
  }

  // Update item
  updateItem(itemId: string, updates: Partial<MyListItem>): void {
    const items = this.getMyList();
    const index = items.findIndex(item => item.id === itemId);
    
    if (index !== -1) {
      items[index] = { ...items[index], ...updates };
      this.saveList(items);
    }
  }

  // Check if item is in list
  isInList(contentId: number, contentType: 'movie' | 'tv'): boolean {
    const items = this.getMyList();
    return items.some(item => 
      item.contentId === contentId && item.contentType === contentType
    );
  }

  // Get filtered and sorted items
  getFilteredItems(filters: FilterOptions, sortBy: string, sortDirection: 'asc' | 'desc'): MyListItem[] {
    let items = this.getMyList();

    // Apply filters
    if (filters.contentType !== 'all') {
      items = items.filter(item => {
        if (filters.contentType === 'documentary') {
          return item.content.genre_ids?.includes(99) || 
                 item.content.genres?.some(g => g.name.toLowerCase().includes('documentary'));
        }
        return item.contentType === filters.contentType;
      });
    }

    if (filters.status !== 'all') {
      items = items.filter(item => item.status === filters.status);
    }

    if (filters.genres.length > 0) {
      items = items.filter(item => 
        item.content.genre_ids?.some(id => filters.genres.includes(id)) ||
        item.content.genres?.some(g => filters.genres.includes(g.id))
      );
    }

    if (filters.customTags.length > 0) {
      items = items.filter(item => 
        filters.customTags.some(tag => item.customTags.includes(tag))
      );
    }

    if (filters.priority !== 'all') {
      items = items.filter(item => item.priority === filters.priority);
    }

    // Apply liked filter
    if (filters.liked !== 'all') {
      items = items.filter(item => {
        if (filters.liked === 'liked') {
          return item.isLiked === true;
        } else if (filters.liked === 'notLiked') {
          return item.isLiked === false;
        }
        return true;
      });
    }

    // Apply date filters
    if (filters.dateAdded !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateAdded) {
        case 'lastWeek':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'lastMonth':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'lastYear':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      items = items.filter(item => new Date(item.dateAdded) >= filterDate);
    }

    // Apply runtime filters
    if (filters.runtime !== 'all') {
      items = items.filter(item => {
        const runtime = item.estimatedRuntime;
        switch (filters.runtime) {
          case 'short':
            return runtime <= 90;
          case 'medium':
            return runtime > 90 && runtime <= 150;
          case 'long':
            return runtime > 150;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    items.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'dateAdded':
          aValue = new Date(a.dateAdded);
          bValue = new Date(b.dateAdded);
          break;
        case 'title':
          aValue = (a.content as any).title || (a.content as any).name || '';
          bValue = (b.content as any).title || (b.content as any).name || '';
          break;
        case 'rating':
          aValue = a.content.vote_average;
          bValue = b.content.vote_average;
          break;
        case 'runtime':
          aValue = a.estimatedRuntime;
          bValue = b.estimatedRuntime;
          break;
        case 'releaseYear':
          aValue = new Date((a.content as any).release_date || (a.content as any).first_air_date || '1900');
          bValue = new Date((b.content as any).release_date || (b.content as any).first_air_date || '1900');
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return items;
  }

  // Search items
  searchItems(query: string, includeNotes: boolean = true, includeTags: boolean = true): MyListItem[] {
    const items = this.getMyList();
    const searchQuery = query.toLowerCase();

    return items.filter(item => {
      const title = ((item.content as any).title || (item.content as any).name || '').toLowerCase();
      const overview = (item.content.overview || '').toLowerCase();
      
      let matches = title.includes(searchQuery) || overview.includes(searchQuery);

      if (includeNotes && item.personalNotes) {
        matches = matches || item.personalNotes.toLowerCase().includes(searchQuery);
      }

      if (includeTags && item.customTags.length > 0) {
        matches = matches || item.customTags.some(tag => tag.toLowerCase().includes(searchQuery));
      }

      return matches;
    });
  }

  // Get list statistics
  getListStats(): ListStats {
    const items = this.getMyList();
    const totalItems = items.length;
    const totalMovies = items.filter(item => item.contentType === 'movie').length;
    const totalTVShows = items.filter(item => item.contentType === 'tv').length;
    const totalHours = Math.round(items.reduce((sum, item) => sum + item.estimatedRuntime, 0) / 60);
    
    const completedItems = items.filter(item => item.status === 'completed').length;
    const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    
    const ratedItems = items.filter(item => item.personalRating);
    const averageRating = ratedItems.length > 0 
      ? ratedItems.reduce((sum, item) => sum + (item.personalRating || 0), 0) / ratedItems.length 
      : 0;

    // Genre distribution
    const genreDistribution: { [key: string]: number } = {};
    items.forEach(item => {
      item.content.genres?.forEach(genre => {
        genreDistribution[genre.name] = (genreDistribution[genre.name] || 0) + 1;
      });
    });

    // Status distribution
    const statusDistribution = {
      notStarted: items.filter(item => item.status === 'notStarted').length,
      inProgress: items.filter(item => item.status === 'inProgress').length,
      completed: items.filter(item => item.status === 'completed').length,
      dropped: items.filter(item => item.status === 'dropped').length
    };

    // Monthly additions (last 12 months)
    const monthlyAdditions: { [key: string]: number } = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().substring(0, 7);
      monthlyAdditions[monthKey] = 0;
    }

    items.forEach(item => {
      const monthKey = item.dateAdded.substring(0, 7);
      if (monthlyAdditions.hasOwnProperty(monthKey)) {
        monthlyAdditions[monthKey]++;
      }
    });

    return {
      totalItems,
      totalMovies,
      totalTVShows,
      totalHours,
      completionRate,
      averageRating: Math.round(averageRating * 10) / 10,
      genreDistribution,
      statusDistribution,
      monthlyAdditions
    };
  }

  // Bulk operations
  performBulkOperation(operation: BulkOperation): void {
    const items = this.getMyList();
    
    operation.itemIds.forEach(itemId => {
      const index = items.findIndex(item => item.id === itemId);
      if (index === -1) return;

      switch (operation.type) {
        case 'remove':
          items.splice(index, 1);
          break;
        case 'markWatched':
          items[index].status = 'completed';
          items[index].progress = 100;
          break;
        case 'markUnwatched':
          items[index].status = 'notStarted';
          items[index].progress = 0;
          break;
        case 'setPriority':
          items[index].priority = operation.payload;
          break;
        case 'addTags':
          const newTags = operation.payload.filter((tag: string) => !items[index].customTags.includes(tag));
          items[index].customTags.push(...newTags);
          break;
        case 'removeTags':
          items[index].customTags = items[index].customTags.filter(tag => !operation.payload.includes(tag));
          break;
      }
    });

    this.saveList(items);
  }

  // Custom Collections
  getCollections(): CustomCollection[] {
    const stored = localStorage.getItem(this.collectionsKey);
    return stored ? JSON.parse(stored) : [];
  }

  createCollection(name: string, description?: string): CustomCollection {
    const collections = this.getCollections();
    const newCollection: CustomCollection = {
      id: `collection_${Date.now()}`,
      name,
      description,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: false
    };

    collections.push(newCollection);
    localStorage.setItem(this.collectionsKey, JSON.stringify(collections));
    return newCollection;
  }

  // Preferences
  getPreferences(): ListPreferences {
    const stored = localStorage.getItem(this.preferencesKey);
    return stored ? JSON.parse(stored) : {
      defaultViewMode: 'grid',
      defaultSortOption: 'dateAdded',
      defaultSortDirection: 'desc',
      autoRemoveCompleted: false,
      autoRemoveAfterDays: 30,
      showProgressBars: true,
      enableNotifications: true,
      compactModeItemsPerRow: 10
    };
  }

  savePreferences(preferences: ListPreferences): void {
    localStorage.setItem(this.preferencesKey, JSON.stringify(preferences));
  }

  // Helper methods
  private saveList(items: MyListItem[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }

  private calculateRuntime(content: Movie | TVShow, contentType: 'movie' | 'tv'): number {
    if (contentType === 'movie') {
      return (content as Movie).runtime || 120; // Default 2 hours
    } else {
      const tvShow = content as TVShow;
      const episodeRuntime = tvShow.episode_run_time?.[0] || 45; // Default 45 min per episode
      const episodes = tvShow.number_of_episodes || 20; // Default 20 episodes
      return episodeRuntime * episodes;
    }
  }

  // Continue watching items
  getContinueWatching(): MyListItem[] {
    return this.getMyList()
      .filter(item => item.status === 'inProgress' && item.progress > 0 && item.progress < 100)
      .sort((a, b) => new Date(b.lastWatched || b.dateAdded).getTime() - new Date(a.lastWatched || a.dateAdded).getTime())
      .slice(0, 10);
  }

  // Recently added items
  getRecentlyAdded(limit: number = 10): MyListItem[] {
    return this.getMyList()
      .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
      .slice(0, limit);
  }

  // Get all unique tags
  getAllTags(): string[] {
    const items = this.getMyList();
    const allTags = items.flatMap(item => item.customTags);
    return [...new Set(allTags)].sort();
  }
}

export const myListService = new MyListService();
