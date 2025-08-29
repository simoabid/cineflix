import { useState, useEffect, useCallback } from 'react';
import { myListService } from '../services/myListService';
import { MyListItem } from '../types/myList';
import { Movie, TVShow } from '../types';

type ContentType = 'movie' | 'tv';

type UseMyListOptions = {
  /**
   * Optional storage client to use for persistence operations.
   * Defaults to the app's myListService. Inject a mock or alternative implementation for testing.
   */
  storageClient?: typeof myListService;
  /**
   * Optional callback invoked when a persistence operation fails.
   * Receives the error as the single argument.
   */
  onPersistenceError?: (error: unknown) => void;
  /**
   * Optional retry/fallback handler invoked after onPersistenceError.
   * Handlers can implement retry logic or fallback behavior.
   */
  onRetry?: () => void;
};

type UseMyListReturn = {
  myListItems: MyListItem[];
  isLoading: boolean;
  isInList: (contentId: number, contentType: ContentType) => boolean;
  addToList: (content: Movie | TVShow, contentType: ContentType) => MyListItem | undefined;
  removeFromList: (itemId: string) => void;
  removeByContentId: (contentId: number, contentType: ContentType) => void;
  updateItem: (itemId: string, updates: Partial<MyListItem>) => void;
  updateProgress: (contentId: number, contentType: ContentType, progress: number) => void;
  toggleInList: (content: Movie | TVShow, contentType: ContentType) => boolean;
  getStats: () => any;
  getContinueWatching: () => MyListItem[];
  getRecentlyAdded: (limit?: number) => MyListItem[];
  loadMyList: () => void;
};

/**
 * Helper: determine item status from progress percentage.
 * Extracted to keep state transition logic simple and testable.
 */
const determineStatusFromProgress = (progress: number): MyListItem['status'] => {
  if (progress >= 100) return 'completed';
  if (progress > 0) return 'inProgress';
  return 'notStarted';
};

/**
 * Helper: find an item by content id and type from a list.
 */
const findItemByContent = (
  items: MyListItem[],
  contentId: number,
  contentType: ContentType
): MyListItem | undefined => {
  return items.find(item => item.contentId === contentId && item.contentType === contentType);
};

/**
 * useMyList
 *
 * Public hook to manage the user's "My List". Side-effects (persistence) are injectable via options,
 * and persistence errors are surfaced via callbacks to enable retries or fallback behavior in callers.
 *
 * The public interface (returned functions) remains stable for callers.
 *
 * @param options Optional injection points for storage client and error/retry handlers.
 * @returns An object containing list state and actions.
 */
export const useMyList = (options?: UseMyListOptions): UseMyListReturn => {
  const storageClient = options?.storageClient ?? myListService;
  const onPersistenceError = options?.onPersistenceError;
  const onRetry = options?.onRetry;

  const [myListItems, setMyListItems] = useState<MyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handlePersistenceError = useCallback((error: unknown, contextMessage?: string) => {
    // Centralized error handling for persistence failures.
    try {
      if (contextMessage) {
        console.error(contextMessage, error);
      } else {
        console.error('Persistence error:', error);
      }
      if (typeof onPersistenceError === 'function') {
        onPersistenceError(error);
      }
      if (typeof onRetry === 'function') {
        // Allow callers to decide if they want to attempt a retry/fallback.
        onRetry();
      }
    } catch (handlerError) {
      // Ensure we never swallow the original error silently if error handlers themselves fail.
      console.error('Error while handling persistence error:', handlerError);
    }
  }, [onPersistenceError, onRetry]);

  // Load my list items
  const loadMyList = useCallback(() => {
    setIsLoading(true);
    try {
      const items = storageClient.getMyList();
      setMyListItems(Array.isArray(items) ? items : []);
    } catch (error) {
      handlePersistenceError(error, 'Error loading My List:');
      // Preserve previous behavior of not throwing from load (e.g., mount effect).
    } finally {
      setIsLoading(false);
    }
  }, [storageClient, handlePersistenceError]);

  // Check if item is in list
  const isInList = useCallback((contentId: number, contentType: ContentType) => {
    try {
      return storageClient.isInList(contentId, contentType);
    } catch (error) {
      handlePersistenceError(error, 'Error checking item in My List:');
      return false;
    }
  }, [storageClient, handlePersistenceError]);

  // Add item to list
  const addToList = useCallback((content: Movie | TVShow, contentType: ContentType) => {
    try {
      const newItem = storageClient.addToList(content, contentType);
      setMyListItems(prev => [...prev, newItem]);
      return newItem;
    } catch (error) {
      handlePersistenceError(error, 'Error adding to My List:');
      throw error;
    }
  }, [storageClient, handlePersistenceError]);

  // Remove item from list
  const removeFromList = useCallback((itemId: string) => {
    try {
      storageClient.removeFromList(itemId);
      setMyListItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      handlePersistenceError(error, 'Error removing from My List:');
      throw error;
    }
  }, [storageClient, handlePersistenceError]);

  // Remove by content ID
  const removeByContentId = useCallback((contentId: number, contentType: ContentType) => {
    try {
      const items = storageClient.getMyList();
      const itemToRemove = findItemByContent(items, contentId, contentType);

      if (itemToRemove) {
        removeFromList(itemToRemove.id);
      }
    } catch (error) {
      handlePersistenceError(error, 'Error removing from My List by content id:');
      throw error;
    }
  }, [storageClient, removeFromList, handlePersistenceError]);

  // Update item
  const updateItem = useCallback((itemId: string, updates: Partial<MyListItem>) => {
    try {
      storageClient.updateItem(itemId, updates);
      setMyListItems(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, ...updates } : item
        )
      );
    } catch (error) {
      handlePersistenceError(error, 'Error updating My List item:');
      throw error;
    }
  }, [storageClient, handlePersistenceError]);

  // Update progress
  const updateProgress = useCallback((contentId: number, contentType: ContentType, progress: number) => {
    try {
      const items = storageClient.getMyList();
      const item = findItemByContent(items, contentId, contentType);

      if (item) {
        const status = determineStatusFromProgress(progress);
        updateItem(item.id, {
          progress,
          status,
          lastWatched: new Date().toISOString(),
          isInContinueWatching: progress > 0 && progress < 100
        });
      }
    } catch (error) {
      handlePersistenceError(error, 'Error updating progress:');
      throw error;
    }
  }, [storageClient, updateItem, handlePersistenceError]);

  // Get list stats
  const getStats = useCallback(() => {
    try {
      return storageClient.getListStats();
    } catch (error) {
      handlePersistenceError(error, 'Error getting My List stats:');
      return null;
    }
  }, [storageClient, handlePersistenceError]);

  // Get continue watching items
  const getContinueWatching = useCallback(() => {
    try {
      return storageClient.getContinueWatching();
    } catch (error) {
      handlePersistenceError(error, 'Error getting continue watching items:');
      return [];
    }
  }, [storageClient, handlePersistenceError]);

  // Get recently added items
  const getRecentlyAdded = useCallback((limit?: number) => {
    try {
      return storageClient.getRecentlyAdded(limit);
    } catch (error) {
      handlePersistenceError(error, 'Error getting recently added items:');
      return [];
    }
  }, [storageClient, handlePersistenceError]);

  // Toggle item in list
  const toggleInList = useCallback((content: Movie | TVShow, contentType: ContentType) => {
    const inList = isInList(content.id, contentType);

    if (inList) {
      removeByContentId(content.id, contentType);
      return false;
    } else {
      addToList(content, contentType);
      return true;
    }
  }, [isInList, removeByContentId, addToList]);

  // Load data on mount
  useEffect(() => {
    loadMyList();
  }, [loadMyList]);

  return {
    myListItems,
    isLoading,
    isInList,
    addToList,
    removeFromList,
    removeByContentId,
    updateItem,
    updateProgress,
    toggleInList,
    getStats,
    getContinueWatching,
    getRecentlyAdded,
    loadMyList
  };
};

export default useMyList;