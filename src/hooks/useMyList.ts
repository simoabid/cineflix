import { useState, useEffect, useCallback } from 'react';
import { myListService } from '../services/myListService';
import { MyListItem } from '../types/myList';
import { Movie, TVShow } from '../types';

export const useMyList = () => {
  const [myListItems, setMyListItems] = useState<MyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load my list items
  const loadMyList = useCallback(() => {
    setIsLoading(true);
    try {
      const items = myListService.getMyList();
      setMyListItems(items);
    } catch (error) {
      console.error('Error loading My List:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check if item is in list
  const isInList = useCallback((contentId: number, contentType: 'movie' | 'tv') => {
    return myListService.isInList(contentId, contentType);
  }, []);

  // Add item to list
  const addToList = useCallback((content: Movie | TVShow, contentType: 'movie' | 'tv') => {
    try {
      const newItem = myListService.addToList(content, contentType);
      setMyListItems(prev => [...prev, newItem]);
      return newItem;
    } catch (error) {
      console.error('Error adding to My List:', error);
      throw error;
    }
  }, []);

  // Remove item from list
  const removeFromList = useCallback((itemId: string) => {
    try {
      myListService.removeFromList(itemId);
      setMyListItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error removing from My List:', error);
      throw error;
    }
  }, []);

  // Remove by content ID
  const removeByContentId = useCallback((contentId: number, contentType: 'movie' | 'tv') => {
    try {
      const items = myListService.getMyList();
      const itemToRemove = items.find(item => 
        item.contentId === contentId && item.contentType === contentType
      );
      
      if (itemToRemove) {
        removeFromList(itemToRemove.id);
      }
    } catch (error) {
      console.error('Error removing from My List:', error);
      throw error;
    }
  }, [removeFromList]);

  // Update item
  const updateItem = useCallback((itemId: string, updates: Partial<MyListItem>) => {
    try {
      myListService.updateItem(itemId, updates);
      setMyListItems(prev => 
        prev.map(item => 
          item.id === itemId ? { ...item, ...updates } : item
        )
      );
    } catch (error) {
      console.error('Error updating My List item:', error);
      throw error;
    }
  }, []);

  // Update progress
  const updateProgress = useCallback((contentId: number, contentType: 'movie' | 'tv', progress: number) => {
    try {
      const items = myListService.getMyList();
      const item = items.find(item => 
        item.contentId === contentId && item.contentType === contentType
      );
      
      if (item) {
        const status = progress >= 100 ? 'completed' : progress > 0 ? 'inProgress' : 'notStarted';
        updateItem(item.id, { 
          progress, 
          status,
          lastWatched: new Date().toISOString(),
          isInContinueWatching: progress > 0 && progress < 100
        });
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  }, [updateItem]);

  // Get list stats
  const getStats = useCallback(() => {
    return myListService.getListStats();
  }, []);

  // Get continue watching items
  const getContinueWatching = useCallback(() => {
    return myListService.getContinueWatching();
  }, []);

  // Get recently added items
  const getRecentlyAdded = useCallback((limit?: number) => {
    return myListService.getRecentlyAdded(limit);
  }, []);

  // Toggle item in list
  const toggleInList = useCallback((content: Movie | TVShow, contentType: 'movie' | 'tv') => {
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
