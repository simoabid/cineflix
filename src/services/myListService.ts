import { MyListItem, CustomCollection, ListStats, FilterOptions, ListPreferences, BulkOperation } from '../types/myList';
import { Movie, TVShow } from '../types';

/**
 * Lightweight storage abstraction to allow injection and testing.
 */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

/**
 * Minimal logger interface for contextual logging injection.
 */
export interface LoggerLike {
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
  debug?(...args: any[]): void;
}

/**
 * Error thrown when input validation fails.
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Error thrown when storage operations fail.
 */
export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Pure helper: safely parse a JSON string and return a default on failure.
 * Exported for unit testing.
 */
export function parseStoredJSON<T>(raw: string | null, fallback: T): T {
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Pure helper: calculate runtime for movies or TV shows.
 * Exported for unit testing.
 */
export function calculateRuntimePure(content: Movie | TVShow, contentType: 'movie' | 'tv'): number {
  if (contentType === 'movie') {
    return (content as Movie).runtime || 120; // Default 2 hours
  } else {
    const tvShow = content as TVShow;
    const episodeRuntime = (tvShow.episode_run_time && tvShow.episode_run_time[0]) || 45; // Default 45 min per episode
    const episodes = tvShow.number_of_episodes || 20; // Default 20 episodes
    return episodeRuntime * episodes;
  }
}

/**
 * Main service for managing the user's list.
 * Constructor accepts optional storage and logger implementations for testability.
 */
class MyListService {
  private storageKey = 'cineflix_my_list';
  private collectionsKey = 'cineflix_collections';
  private preferencesKey = 'cineflix_list_preferences';

  constructor(private storage: StorageLike = localStorage, private logger: LoggerLike = console) {}

  // ----------------------
  // Internal helpers
  // ----------------------

  private safeGetItem<T>(key: string, fallback: T): T {
    try {
      const raw = this.storage.getItem(key);
      return parseStoredJSON<T>(raw, fallback);
    } catch (err) {
      this.logger.error('Storage read failed for key:', key, err);
      return fallback;
    }
  }

  private safeSetItem(key: string, value: any): void {
    try {
      this.storage.setItem(key, JSON.stringify(value));
    } catch (err) {
      this.logger.error('Storage write failed for key:', key, err);
      throw new StorageError(`Failed to save data for key ${key}`);
    }
  }

  private validateContentType(contentType: any): asserts contentType is 'movie' | 'tv' {
    if (contentType !== 'movie' && contentType !== 'tv') {
      throw new ValidationError('contentType must be "movie" or "tv"');
    }
  }

  private validateId(id: any): asserts id is string {
    if (typeof id !== 'string' || id.trim() === '') {
      throw new ValidationError('id must be a non-empty string');
    }
  }

  private findItemIndex(items: MyListItem[], predicate: (item: MyListItem) => boolean): number {
    return items.findIndex(predicate);
  }

  // ----------------------
  // Public API methods
  // ----------------------

  /**
   * Get all list items.
   * @returns Array of MyListItem
   */
  getMyList(): MyListItem[] {
    return this.safeGetItem<MyListItem[]>(this.storageKey, []);
  }

  /**
   * Add an item to the list if it doesn't already exist.
   * @param content Movie or TV show object
   * @param contentType 'movie' | 'tv'
   * @returns The created or existing MyListItem
   */
  addToList(content: Movie | TVShow, contentType: 'movie' | 'tv'): MyListItem {
    this.validateContentType(contentType);
    if (!content || (content as any).id == null) {
      throw new ValidationError('content must be provided and contain an id');
    }

    const items = this.getMyList();
    const existingItem = items.find(item => item.contentId === (content as any).id && item.contentType === contentType);

    if (existingItem) return existingItem;

    const newItem: MyListItem = {
      id: `${(content as any).id}-${contentType}-${Date.now()}`,
      contentId: (content as any).id,
      contentType,
      content,
      dateAdded: new Date().toISOString(),
      status: 'notStarted',
      progress: 0,
      priority: 'medium',
      customTags: [],
      estimatedRuntime: calculateRuntimePure(content, contentType),
      isInContinueWatching: false,
      isLiked: false
    };

    items.push(newItem);
    this.saveList(items);
    return newItem;
  }

  /**
   * Remove an item from the list by its internal id.
   * @param itemId string id of the list item
   */
  removeFromList(itemId: string): void {
    this.validateId(itemId);
    const items = this.getMyList().filter(item => item.id !== itemId);
    this.saveList(items);
  }

  /**
   * Toggle the liked state for content in the list.
   * @param contentId numeric id of the content
   * @param contentType 'movie' | 'tv'
   * @returns the new liked state (true/false)
   */
  toggleLike(contentId: number, contentType: 'movie' | 'tv'): boolean {
    if (typeof contentId !== 'number') throw new ValidationError('contentId must be a number');
    this.validateContentType(contentType);

    const items = this.getMyList();
    const index = this.findItemIndex(items, item => item.contentId === contentId && item.contentType === contentType);
    if (index === -1) return false;

    items[index].isLiked = !items[index].isLiked;
    items[index].likedAt = items[index].isLiked ? new Date().toISOString() : undefined;
    this.saveList(items);
    return items[index].isLiked;
  }

  /**
   * Check whether a piece of content is liked.
   * @param contentId number
   * @param contentType 'movie' | 'tv'
   */
  isLiked(contentId: number, contentType: 'movie' | 'tv'): boolean {
    if (typeof contentId !== 'number') throw new ValidationError('contentId must be a number');
    this.validateContentType(contentType);
    const item = this.getMyList().find(i => i.contentId === contentId && i.contentType === contentType);
    return Boolean(item?.isLiked);
  }

  /**
   * Get all items that are liked.
   */
  getLikedContent(): MyListItem[] {
    return this.getMyList().filter(item => item.isLiked);
  }

  /**
   * Like content; ensures the content is present in the list.
   * @param content any movie/tv object with an id
   * @param contentType 'movie' | 'tv'
   */
  likeContent(content: any, contentType: 'movie' | 'tv'): MyListItem {
    this.validateContentType(contentType);
    if (!content || content.id == null) throw new ValidationError('content must be provided and contain an id');

    const items = this.getMyList();
    const index = this.findItemIndex(items, item => item.contentId === content.id && item.contentType === contentType);

    if (index !== -1) {
      items[index].isLiked = true;
      items[index].likedAt = new Date().toISOString();
      this.saveList(items);
      return items[index];
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
      estimatedRuntime: calculateRuntimePure(content, contentType),
      isInContinueWatching: false,
      isLiked: true,
      likedAt: new Date().toISOString()
    };

    items.push(newItem);
    this.saveList(items);
    return newItem;
  }

  /**
   * Unlike content (if present in list).
   * @param contentId number
   * @param contentType 'movie' | 'tv'
   */
  unlikeContent(contentId: number, contentType: 'movie' | 'tv'): void {
    if (typeof contentId !== 'number') throw new ValidationError('contentId must be a number');
    this.validateContentType(contentType);

    const items = this.getMyList();
    const index = this.findItemIndex(items, item => item.contentId === contentId && item.contentType === contentType);
    if (index === -1) return;

    items[index].isLiked = false;
    items[index].likedAt = undefined;
    this.saveList(items);
  }

  /**
   * Update an existing item by id with provided partial updates.
   * @param itemId string id of the item
   * @param updates partial item fields to update
   */
  updateItem(itemId: string, updates: Partial<MyListItem>): void {
    this.validateId(itemId);
    if (!updates || typeof updates !== 'object') throw new ValidationError('updates must be an object');

    const items = this.getMyList();
    const index = this.findItemIndex(items, item => item.id === itemId);
    if (index === -1) return;

    items[index] = { ...items[index], ...updates };
    this.saveList(items);
  }

  /**
   * Check whether a content entry exists in the list.
   * @param contentId number
   * @param contentType 'movie' | 'tv'
   */
  isInList(contentId: number, contentType: 'movie' | 'tv'): boolean {
    if (typeof contentId !== 'number') throw new ValidationError('contentId must be a number');
    this.validateContentType(contentType);
    return this.getMyList().some(item => item.contentId === contentId && item.contentType === contentType);
  }

  /**
   * Get filtered and sorted items according to provided options.
   * @param filters FilterOptions
   * @param sortBy string
   * @param sortDirection 'asc' | 'desc'
   */
  getFilteredItems(filters: FilterOptions, sortBy: string, sortDirection: 'asc' | 'desc'): MyListItem[] {
    if (!filters || typeof filters !== 'object') throw new ValidationError('filters must be provided');
    const itemsCopy = [...this.getMyList()];
    let items = itemsCopy;

    // Apply filters
    if (filters.contentType !== 'all') {
      items = items.filter(item => {
        if (filters.contentType === 'documentary') {
          return item.content.genre_ids?.includes(99) ||
                 item.content.genres?.some(g => (g.name || '').toLowerCase().includes('documentary'));
        }
        return item.contentType === filters.contentType;
      });
    }

    if (filters.status !== 'all') {
      items = items.filter(item => item.status === filters.status);
    }

    if (filters.genres && filters.genres.length > 0) {
      items = items.filter(item =>
        item.content.genre_ids?.some(id => filters.genres.includes(id)) ||
        item.content.genres?.some((g: any) => filters.genres.includes(g.id))
      );
    }

    if (filters.customTags && filters.customTags.length > 0) {
      items = items.filter(item => filters.customTags.some(tag => item.customTags.includes(tag)));
    }

    if (filters.priority && filters.priority !== 'all') {
      items = items.filter(item => item.priority === filters.priority);
    }

    if (filters.liked && filters.liked !== 'all') {
      items = items.filter(item => {
        if (filters.liked === 'liked') return item.isLiked === true;
        if (filters.liked === 'notLiked') return item.isLiked === false;
        return true;
      });
    }

    // Date filters
    if (filters.dateAdded && filters.dateAdded !== 'all') {
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

    // Runtime filters
    if (filters.runtime && filters.runtime !== 'all') {
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

    // Sorting
    items.sort((a, b) => {
      let aValue: any;
      let bValue: any;

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
          aValue = a.content.vote_average ?? 0;
          bValue = b.content.vote_average ?? 0;
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

  /**
   * Search items by query, optionally including notes and tags.
   * @param query string to search
   * @param includeNotes boolean
   * @param includeTags boolean
   */
  searchItems(query: string, includeNotes: boolean = true, includeTags: boolean = true): MyListItem[] {
    if (typeof query !== 'string') throw new ValidationError('query must be a string');
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

  /**
   * Compute list statistics.
   */
  getListStats(): ListStats {
    const items = this.getMyList();
    const totalItems = items.length;
    const totalMovies = items.filter(item => item.contentType === 'movie').length;
    const totalTVShows = items.filter(item => item.contentType === 'tv').length;
    const totalHours = Math.round(items.reduce((sum, item) => sum + (item.estimatedRuntime || 0), 0) / 60);

    const completedItems = items.filter(item => item.status === 'completed').length;
    const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    const ratedItems = items.filter(item => item.personalRating != null);
    const averageRating = ratedItems.length > 0
      ? ratedItems.reduce((sum, item) => sum + (item.personalRating || 0), 0) / ratedItems.length
      : 0;

    const genreDistribution: { [key: string]: number } = {};
    items.forEach(item => {
      item.content.genres?.forEach((genre: any) => {
        genreDistribution[genre.name] = (genreDistribution[genre.name] || 0) + 1;
      });
    });

    const statusDistribution = {
      notStarted: items.filter(item => item.status === 'notStarted').length,
      inProgress: items.filter(item => item.status === 'inProgress').length,
      completed: items.filter(item => item.status === 'completed').length,
      dropped: items.filter(item => item.status === 'dropped').length
    };

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

  /**
   * Perform bulk operations on multiple items.
   * @param operation BulkOperation
   */
  performBulkOperation(operation: BulkOperation): void {
    if (!operation || !Array.isArray(operation.itemIds)) {
      throw new ValidationError('operation must contain an itemIds array');
    }
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
          {
            const newTags = (operation.payload || []).filter((tag: string) => !items[index].customTags.includes(tag));
            items[index].customTags.push(...newTags);
          }
          break;
        case 'removeTags':
          items[index].customTags = items[index].customTags.filter(tag => !(operation.payload || []).includes(tag));
          break;
        default:
          this.logger.warn('Unknown bulk operation type:', (operation as any).type);
      }
    });

    this.saveList(items);
  }

  /**
   * Get all custom collections.
   */
  getCollections(): CustomCollection[] {
    return this.safeGetItem<CustomCollection[]>(this.collectionsKey, []);
  }

  /**
   * Create a new custom collection.
   * @param name string
   * @param description optional string
   */
  createCollection(name: string, description?: string): CustomCollection {
    if (!name || typeof name !== 'string') throw new ValidationError('name must be a non-empty string');
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
    this.safeSetItem(this.collectionsKey, collections);
    return newCollection;
  }

  /**
   * Get list preferences (with reasonable defaults).
   */
  getPreferences(): ListPreferences {
    return this.safeGetItem<ListPreferences>(this.preferencesKey, {
      defaultViewMode: 'grid',
      defaultSortOption: 'dateAdded',
      defaultSortDirection: 'desc',
      autoRemoveCompleted: false,
      autoRemoveAfterDays: 30,
      showProgressBars: true,
      enableNotifications: true,
      compactModeItemsPerRow: 10
    });
  }

  /**
   * Save list preferences.
   * @param preferences ListPreferences
   */
  savePreferences(preferences: ListPreferences): void {
    if (!preferences || typeof preferences !== 'object') throw new ValidationError('preferences must be an object');
    this.safeSetItem(this.preferencesKey, preferences);
  }

  /**
   * Persist the provided list of items.
   * @param items MyListItem[]
   */
  private saveList(items: MyListItem[]): void {
    this.safeSetItem(this.storageKey, items);
  }

  /**
   * Calculate runtime using pure helper (kept private to preserve API).
   */
  private calculateRuntime(content: Movie | TVShow, contentType: 'movie' | 'tv'): number {
    return calculateRuntimePure(content, contentType);
  }

  /**
   * Return items that are eligible for continue watching.
   */
  getContinueWatching(): MyListItem[] {
    return this.getMyList()
      .filter(item => item.status === 'inProgress' && item.progress > 0 && item.progress < 100)
      .sort((a, b) => new Date(b.lastWatched || b.dateAdded).getTime() - new Date(a.lastWatched || a.dateAdded).getTime())
      .slice(0, 10);
  }

  /**
   * Get recently added items limited by `limit`.
   * @param limit number (default 10)
   */
  getRecentlyAdded(limit: number = 10): MyListItem[] {
    if (typeof limit !== 'number' || limit <= 0) throw new ValidationError('limit must be a positive number');
    return this.getMyList()
      .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
      .slice(0, limit);
  }

  /**
   * Return all unique custom tags across the list.
   */
  getAllTags(): string[] {
    const items = this.getMyList();
    const allTags = items.flatMap(item => item.customTags || []);
    return [...new Set(allTags)].sort();
  }
}

export const myListService = new MyListService();