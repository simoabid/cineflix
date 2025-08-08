import { WatchProgress, WatchingSession, ContentRating, BookmarkedScene, StreamSource, DownloadOption, TorrentSource } from '../types';

class WatchService {
  // Watch Progress Management
  saveWatchProgress(progress: WatchProgress): void {
    const key = `watch_progress_${progress.contentType}_${progress.contentId}`;
    localStorage.setItem(key, JSON.stringify(progress));
  }

  getWatchProgress(contentId: number, contentType: 'movie' | 'tv'): WatchProgress | null {
    const key = `watch_progress_${contentType}_${contentId}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  }

  getAllWatchProgress(): WatchProgress[] {
    const progress: WatchProgress[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('watch_progress_')) {
        const data = localStorage.getItem(key);
        if (data) {
          progress.push(JSON.parse(data));
        }
      }
    }
    return progress.sort((a, b) => new Date(b.lastWatched).getTime() - new Date(a.lastWatched).getTime());
  }

  // Watching Sessions Management
  startWatchingSession(contentId: number, contentType: 'movie' | 'tv'): WatchingSession {
    const session: WatchingSession = {
      id: Date.now().toString(),
      contentId,
      contentType,
      startedAt: new Date().toISOString(),
      watchTime: 0,
      progress: {
        contentId,
        contentType,
        currentTime: 0,
        duration: 0,
        percentage: 0,
        lastWatched: new Date().toISOString()
      },
      quality: '1080p',
      device: navigator.userAgent,
      ipAddress: 'Unknown' // In real app, this would be obtained from backend
    };

    const sessions = this.getWatchingSessions();
    sessions.push(session);
    localStorage.setItem('watching_sessions', JSON.stringify(sessions));
    
    return session;
  }

  endWatchingSession(sessionId: string): void {
    const sessions = this.getWatchingSessions();
    const updatedSessions = sessions.map(session => 
      session.id === sessionId 
        ? { ...session, endedAt: new Date().toISOString() }
        : session
    );
    localStorage.setItem('watching_sessions', JSON.stringify(updatedSessions));
  }

  getWatchingSessions(): WatchingSession[] {
    const saved = localStorage.getItem('watching_sessions');
    return saved ? JSON.parse(saved) : [];
  }

  // Content Rating Management
  rateContent(contentId: number, contentType: 'movie' | 'tv', rating: number, review?: string): void {
    const contentRating: ContentRating = {
      userId: 'current_user', // In real app, this would be actual user ID
      contentId,
      contentType,
      rating,
      review,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const key = `rating_${contentType}_${contentId}`;
    localStorage.setItem(key, JSON.stringify(contentRating));
  }

  getContentRating(contentId: number, contentType: 'movie' | 'tv'): ContentRating | null {
    const key = `rating_${contentType}_${contentId}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  }

  getAllRatings(): ContentRating[] {
    const ratings: ContentRating[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('rating_')) {
        const data = localStorage.getItem(key);
        if (data) {
          ratings.push(JSON.parse(data));
        }
      }
    }
    return ratings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Bookmarked Scenes Management
  addBookmark(bookmark: Omit<BookmarkedScene, 'id' | 'createdAt'>): BookmarkedScene {
    const newBookmark: BookmarkedScene = {
      ...bookmark,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };

    const bookmarks = this.getBookmarks(bookmark.contentId, bookmark.contentType);
    bookmarks.push(newBookmark);
    
    const key = `bookmarks_${bookmark.contentType}_${bookmark.contentId}`;
    localStorage.setItem(key, JSON.stringify(bookmarks));
    
    return newBookmark;
  }

  updateBookmark(bookmarkId: string, updates: Partial<BookmarkedScene>): void {
    // Find which content this bookmark belongs to
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('bookmarks_')) {
        const data = localStorage.getItem(key);
        if (data) {
          const bookmarks: BookmarkedScene[] = JSON.parse(data);
          const bookmarkIndex = bookmarks.findIndex(b => b.id === bookmarkId);
          
          if (bookmarkIndex !== -1) {
            bookmarks[bookmarkIndex] = { ...bookmarks[bookmarkIndex], ...updates };
            localStorage.setItem(key, JSON.stringify(bookmarks));
            break;
          }
        }
      }
    }
  }

  deleteBookmark(bookmarkId: string): void {
    // Find and remove bookmark from all content
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('bookmarks_')) {
        const data = localStorage.getItem(key);
        if (data) {
          const bookmarks: BookmarkedScene[] = JSON.parse(data);
          const filteredBookmarks = bookmarks.filter(b => b.id !== bookmarkId);
          
          if (filteredBookmarks.length !== bookmarks.length) {
            localStorage.setItem(key, JSON.stringify(filteredBookmarks));
            break;
          }
        }
      }
    }
  }

  getBookmarks(contentId: number, contentType: 'movie' | 'tv'): BookmarkedScene[] {
    const key = `bookmarks_${contentType}_${contentId}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  }

  getAllBookmarks(): BookmarkedScene[] {
    const bookmarks: BookmarkedScene[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('bookmarks_')) {
        const data = localStorage.getItem(key);
        if (data) {
          bookmarks.push(...JSON.parse(data));
        }
      }
    }
    return bookmarks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Mock Stream Sources (In real app, these would come from APIs)
  getStreamSources(contentId: number, contentType: 'movie' | 'tv'): Promise<StreamSource[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const sources: StreamSource[] = [
          {
            id: '1',
            name: 'Server 1',
            url: `https://stream.example.com/${contentType}/${contentId}/stream1`,
            type: 'hls',
            quality: 'FHD',
            fileSize: '2.1 GB',
            reliability: 'Fast',
            isAdFree: true,
            language: 'English',
            subtitles: ['English', 'Spanish', 'French']
          },
          {
            id: '2',
            name: 'Server 2',
            url: `https://stream.example.com/${contentType}/${contentId}/stream2`,
            type: 'direct',
            quality: '4K',
            fileSize: '4.5 GB',
            reliability: 'Premium',
            isAdFree: true,
            language: 'English',
            subtitles: ['English', 'Spanish', 'French', 'German']
          },
          {
            id: '3',
            name: 'Mirror 1',
            url: `https://mirror.example.com/${contentType}/${contentId}/mirror1`,
            type: 'mp4',
            quality: 'HD',
            fileSize: '1.4 GB',
            reliability: 'Stable',
            isAdFree: false,
            language: 'English',
            subtitles: ['English']
          }
        ];
        resolve(sources);
      }, 500);
    });
  }

  // Mock Download Options
  getDownloadOptions(contentId: number, contentType: 'movie' | 'tv'): Promise<DownloadOption[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const options: DownloadOption[] = [
          {
            id: '1',
            quality: '480p',
            format: 'MP4',
            fileSize: '800 MB',
            codec: 'H.264',
            url: `https://download.example.com/${contentType}/${contentId}/480p.mp4`,
            estimatedDownloadTime: '15 min'
          },
          {
            id: '2',
            quality: '720p',
            format: 'MP4',
            fileSize: '1.4 GB',
            codec: 'H.264',
            url: `https://download.example.com/${contentType}/${contentId}/720p.mp4`,
            estimatedDownloadTime: '25 min'
          },
          {
            id: '3',
            quality: '1080p',
            format: 'MKV',
            fileSize: '2.8 GB',
            codec: 'H.265',
            url: `https://download.example.com/${contentType}/${contentId}/1080p.mkv`,
            estimatedDownloadTime: '45 min'
          },
          {
            id: '4',
            quality: '4K',
            format: 'MKV',
            fileSize: '8.2 GB',
            codec: 'H.265',
            url: `https://download.example.com/${contentType}/${contentId}/4k.mkv`,
            estimatedDownloadTime: '2 hours'
          }
        ];
        resolve(options);
      }, 500);
    });
  }

  // Mock Torrent Sources
  getTorrentSources(contentId: number, contentType: 'movie' | 'tv'): Promise<TorrentSource[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const sources: TorrentSource[] = [
          {
            id: '1',
            name: 'BluRay 1080p',
            magnetLink: `magnet:?xt=urn:btih:${contentId}${contentType}example1`,
            quality: 'BluRay',
            fileSize: '12.5 GB',
            seeders: 1250,
            leechers: 45,
            health: 'Excellent',
            releaseGroup: 'YIFY',
            uploadedBy: 'TrustedUploader',
            isTrusted: true,
            uploadDate: '2024-01-15'
          },
          {
            id: '2',
            name: 'WEBRip 720p',
            magnetLink: `magnet:?xt=urn:btih:${contentId}${contentType}example2`,
            quality: 'WEBRip',
            fileSize: '4.2 GB',
            seeders: 890,
            leechers: 23,
            health: 'Good',
            releaseGroup: 'RARBG',
            uploadedBy: 'Uploader2',
            isTrusted: true,
            uploadDate: '2024-01-10'
          },
          {
            id: '3',
            name: 'HDRip 720p',
            magnetLink: `magnet:?xt=urn:btih:${contentId}${contentType}example3`,
            quality: 'HDRip',
            fileSize: '2.1 GB',
            seeders: 456,
            leechers: 78,
            health: 'Fair',
            releaseGroup: 'FGT',
            uploadedBy: 'Uploader3',
            isTrusted: false,
            uploadDate: '2024-01-08'
          }
        ];
        resolve(sources);
      }, 500);
    });
  }

  // Analytics and Statistics
  getWatchingStats(): {
    totalWatchTime: number;
    averageSession: number;
    mostWatchedType: 'movie' | 'tv';
    favoriteGenres: string[];
  } {
    const sessions = this.getWatchingSessions();
    const totalWatchTime = sessions.reduce((total, session) => total + session.watchTime, 0);
    const averageSession = sessions.length > 0 ? totalWatchTime / sessions.length : 0;
    
    const movieSessions = sessions.filter(s => s.contentType === 'movie').length;
    const tvSessions = sessions.filter(s => s.contentType === 'tv').length;
    const mostWatchedType = movieSessions > tvSessions ? 'movie' : 'tv';

    return {
      totalWatchTime,
      averageSession,
      mostWatchedType,
      favoriteGenres: [] // This would be calculated based on content data
    };
  }

  // Cleanup old data
  cleanupOldData(daysOld: number = 30): void {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    
    // Clean up old sessions
    const sessions = this.getWatchingSessions();
    const recentSessions = sessions.filter(session => 
      new Date(session.startedAt) > cutoffDate
    );
    localStorage.setItem('watching_sessions', JSON.stringify(recentSessions));
    
    console.log(`Cleaned up ${sessions.length - recentSessions.length} old watching sessions`);
  }
}

export const watchService = new WatchService();