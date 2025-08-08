/**
 * 111movies API Service
 * Handles URL generation for 111movies player embed endpoints
 */

export class Movies111Service {
  private static readonly BASE_URL = 'https://111movies.com';

  /**
   * Generate movie embed URL
   * @param id - TMDB ID or IMDb ID (with tt prefix)
   */
  static getMovieEmbedUrl(id: string | number): string {
    return `${this.BASE_URL}/movie/${id}`;
  }

  /**
   * Generate TV show embed URL
   * @param id - TMDB ID or IMDb ID (with tt prefix)
   * @param season - Season number
   * @param episode - Episode number
   */
  static getTVEmbedUrl(id: string | number, season: number, episode: number): string {
    return `${this.BASE_URL}/tv/${id}/${season}/${episode}`;
  }

  /**
   * Validate if ID is an IMDb ID (starts with 'tt')
   */
  static isImdbId(id: string): boolean {
    return typeof id === 'string' && id.startsWith('tt');
  }

  /**
   * Generate single 111movies source for a movie (TMDB ID only)
   */
  static generateMovieSources(tmdbId: number): Array<{
    id: string;
    name: string;
    url: string;
    type: 'direct' | 'hls' | 'mp4';
    quality: 'SD' | 'HD' | 'FHD' | '4K';
    reliability: 'Fast' | 'Stable' | 'Premium';
    isAdFree: boolean;
    language?: string;
    fileSize?: string;
  }> {
    return [{
      id: `111movies_movie_${tmdbId}`,
      name: '111movies',
      url: this.getMovieEmbedUrl(tmdbId),
      type: 'hls' as const,
      quality: 'HD' as const,
      reliability: 'Stable' as const,
      isAdFree: false, // 111movies typically has ads
      language: 'Multi',
      fileSize: 'Auto'
    }];
  }

  /**
   * Generate single 111movies source for a TV show episode (TMDB ID only)
   */
  static generateTVSource(
    tmdbId: number, 
    season: number, 
    episode: number
  ): Array<{
    id: string;
    name: string;
    url: string;
    type: 'direct' | 'hls' | 'mp4';
    quality: 'SD' | 'HD' | 'FHD' | '4K';
    reliability: 'Fast' | 'Stable' | 'Premium';
    isAdFree: boolean;
    language?: string;
    fileSize?: string;
  }> {
    return [{
      id: `111movies_tv_${tmdbId}_s${season}e${episode}`,
      name: `111movies S${season}E${episode}`,
      url: this.getTVEmbedUrl(tmdbId, season, episode),
      type: 'hls' as const,
      quality: 'HD' as const,
      reliability: 'Stable' as const,
      isAdFree: false, // 111movies typically has ads
      language: 'Multi',
      fileSize: 'Auto'
    }];
  }

  /**
   * Get supported subtitle languages (basic set)
   */
  static getSupportedSubtitleLanguages(): string[] {
    return [
      'English',
      'Spanish',
      'French',
      'German',
      'Portuguese',
      'Russian',
      'Italian',
      'Dutch'
    ];
  }
}

export default Movies111Service;