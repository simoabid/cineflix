import { CollectionDetails, FranchiseProgress, MarathonSession, Movie } from '../types';

const COLLECTIONS_STORAGE_KEY = 'cineflix_collections_progress';
const MARATHON_STORAGE_KEY = 'cineflix_marathon_sessions';

export class CollectionsService {
  private static getStoredProgress(): { [collectionId: number]: FranchiseProgress } {
    const stored = localStorage.getItem(COLLECTIONS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  }

  private static saveProgress(progress: { [collectionId: number]: FranchiseProgress }): void {
    localStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(progress));
  }

  private static getStoredSessions(): { [collectionId: number]: MarathonSession } {
    const stored = localStorage.getItem(MARATHON_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  }

  private static saveSessions(sessions: { [collectionId: number]: MarathonSession }): void {
    localStorage.setItem(MARATHON_STORAGE_KEY, JSON.stringify(sessions));
  }

  // Progress tracking methods
  static markFilmWatched(collectionId: number, filmId: number): void {
    const allProgress = this.getStoredProgress();
    const progress = allProgress[collectionId] || {
      watched_films: [],
      total_films: 0,
      completion_percentage: 0,
      viewing_order: 'release' as const
    };

    if (!progress.watched_films.includes(filmId)) {
      progress.watched_films.push(filmId);
      progress.completion_percentage = (progress.watched_films.length / progress.total_films) * 100;
      progress.last_watched = new Date().toISOString();
    }

    allProgress[collectionId] = progress;
    this.saveProgress(allProgress);
  }

  static markFilmUnwatched(collectionId: number, filmId: number): void {
    const allProgress = this.getStoredProgress();
    const progress = allProgress[collectionId];
    
    if (progress) {
      progress.watched_films = progress.watched_films.filter(id => id !== filmId);
      progress.completion_percentage = (progress.watched_films.length / progress.total_films) * 100;
      allProgress[collectionId] = progress;
      this.saveProgress(allProgress);
    }
  }

  static getFranchiseProgress(collectionId: number): FranchiseProgress | null {
    const allProgress = this.getStoredProgress();
    return allProgress[collectionId] || null;
  }

  static initializeFranchiseProgress(collection: CollectionDetails): FranchiseProgress {
    const allProgress = this.getStoredProgress();
    
    if (!allProgress[collection.id]) {
      const progress: FranchiseProgress = {
        watched_films: [],
        total_films: collection.film_count,
        completion_percentage: 0,
        viewing_order: 'release',
        current_film: collection.parts[0],
        next_film: collection.parts[1]
      };
      
      allProgress[collection.id] = progress;
      this.saveProgress(allProgress);
      return progress;
    }
    
    return allProgress[collection.id];
  }

  static updateViewingOrder(collectionId: number, order: 'release' | 'chronological'): void {
    const allProgress = this.getStoredProgress();
    const progress = allProgress[collectionId];
    
    if (progress) {
      progress.viewing_order = order;
      allProgress[collectionId] = progress;
      this.saveProgress(allProgress);
    }
  }

  // Marathon session methods
  static startMarathonSession(collection: CollectionDetails, viewingOrder: 'release' | 'chronological' = 'release'): MarathonSession {
    const sessions = this.getStoredSessions();
    
    const session: MarathonSession = {
      collection_id: collection.id,
      current_film_index: 0,
      viewing_order: viewingOrder,
      started_at: new Date().toISOString(),
      completed_films: [],
      total_runtime_watched: 0,
      breaks_taken: 0
    };
    
    sessions[collection.id] = session;
    this.saveSessions(sessions);
    
    // Initialize progress if not exists
    this.initializeFranchiseProgress(collection);
    
    return session;
  }

  static getMarathonSession(collectionId: number): MarathonSession | null {
    const sessions = this.getStoredSessions();
    return sessions[collectionId] || null;
  }

  static updateMarathonProgress(collectionId: number, filmIndex: number, runtime: number): void {
    const sessions = this.getStoredSessions();
    const session = sessions[collectionId];
    
    if (session) {
      session.current_film_index = filmIndex;
      session.total_runtime_watched += runtime;
      sessions[collectionId] = session;
      this.saveSessions(sessions);
    }
  }

  static pauseMarathonSession(collectionId: number): void {
    const sessions = this.getStoredSessions();
    const session = sessions[collectionId];
    
    if (session) {
      session.paused_at = new Date().toISOString();
      sessions[collectionId] = session;
      this.saveSessions(sessions);
    }
  }

  static resumeMarathonSession(collectionId: number): void {
    const sessions = this.getStoredSessions();
    const session = sessions[collectionId];
    
    if (session) {
      delete session.paused_at;
      sessions[collectionId] = session;
      this.saveSessions(sessions);
    }
  }

  static completeMarathonSession(collectionId: number): void {
    const sessions = this.getStoredSessions();
    delete sessions[collectionId];
    this.saveSessions(sessions);
  }

  // Statistics and analytics
  static getCollectionStats(): {
    totalCollections: number;
    completedCollections: number;
    inProgressCollections: number;
    totalWatchTime: number;
    averageCompletion: number;
  } {
    const allProgress = this.getStoredProgress();
    const progressValues = Object.values(allProgress);
    
    const completed = progressValues.filter(p => p.completion_percentage === 100).length;
    const inProgress = progressValues.filter(p => p.completion_percentage > 0 && p.completion_percentage < 100).length;
    const totalWatchTime = progressValues.reduce((total, p) => {
      return total + (p.total_films * (p.completion_percentage / 100) * 120); // Estimate 2h per film
    }, 0);
    
    const averageCompletion = progressValues.length > 0 
      ? progressValues.reduce((sum, p) => sum + p.completion_percentage, 0) / progressValues.length 
      : 0;

    return {
      totalCollections: progressValues.length,
      completedCollections: completed,
      inProgressCollections: inProgress,
      totalWatchTime: Math.round(totalWatchTime),
      averageCompletion: Math.round(averageCompletion)
    };
  }

  static getRecommendedCollections(collections: CollectionDetails[]): CollectionDetails[] {
    const allProgress = this.getStoredProgress();
    
    // Get user's preferred genres from completed collections
    const completedCollections = Object.entries(allProgress)
      .filter(([_, progress]) => progress.completion_percentage === 100)
      .map(([id, _]) => parseInt(id));
    
    const preferredGenres = new Set<string>();
    collections.forEach(collection => {
      if (completedCollections.includes(collection.id)) {
        collection.genre_categories.forEach(genre => preferredGenres.add(genre));
      }
    });
    
    // Recommend collections with similar genres that aren't completed
    return collections
      .filter(collection => {
        const progress = allProgress[collection.id];
        return !progress || progress.completion_percentage < 100;
      })
      .filter(collection => {
        return collection.genre_categories.some(genre => preferredGenres.has(genre));
      })
      .slice(0, 6);
  }

  static getContinueWatching(collections: CollectionDetails[]): CollectionDetails[] {
    const allProgress = this.getStoredProgress();
    
    return collections
      .filter(collection => {
        const progress = allProgress[collection.id];
        return progress && progress.completion_percentage > 0 && progress.completion_percentage < 100;
      })
      .sort((a, b) => {
        const progressA = allProgress[a.id];
        const progressB = allProgress[b.id];
        const dateA = new Date(progressA.last_watched || '').getTime();
        const dateB = new Date(progressB.last_watched || '').getTime();
        return dateB - dateA; // Most recent first
      })
      .slice(0, 6);
  }

  // Utility methods
  static enhanceCollectionsWithProgress(collections: CollectionDetails[]): CollectionDetails[] {
    const allProgress = this.getStoredProgress();
    
    return collections.map(collection => ({
      ...collection,
      user_progress: allProgress[collection.id] || null,
      completion_progress: allProgress[collection.id]?.completion_percentage || 0
    }));
  }

  static exportProgressData(): string {
    const progress = this.getStoredProgress();
    const sessions = this.getStoredSessions();
    
    return JSON.stringify({
      progress,
      sessions,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  static importProgressData(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      if (parsed.progress) {
        this.saveProgress(parsed.progress);
      }
      if (parsed.sessions) {
        this.saveSessions(parsed.sessions);
      }
      return true;
    } catch (error) {
      console.error('Error importing progress data:', error);
      return false;
    }
  }
}

export default CollectionsService;
