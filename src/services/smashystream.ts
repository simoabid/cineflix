/**
 * SmashyStream API Service
 * Handles URL generation for SmashyStream player embed endpoints
 */

export interface SmashyStreamOptions {
  subLang?: string; // Default subtitle language (e.g., 'Arabic', 'English')
}

export class SmashyStreamService {
  private static readonly BASE_URL = 'https://player.smashy.stream';

  /**
   * Generate movie embed URL
   * @param id - TMDB ID or IMDb ID (with tt prefix)
   * @param options - Additional options like subtitle language
   */
  static getMovieEmbedUrl(id: string | number, options?: SmashyStreamOptions): string {
    const baseUrl = `${this.BASE_URL}/movie/${id}`;
    
    if (options?.subLang) {
      return `${baseUrl}?subLang=${encodeURIComponent(options.subLang)}`;
    }
    
    return baseUrl;
  }

  /**
   * Generate TV show embed URL
   * @param id - TMDB ID or IMDb ID (with tt prefix)
   * @param season - Season number
   * @param episode - Episode number
   * @param options - Additional options like subtitle language
   */
  static getTVEmbedUrl(
    id: string | number, 
    season: number, 
    episode: number, 
    options?: SmashyStreamOptions
  ): string {
    let baseUrl = `${this.BASE_URL}/tv/${id}?s=${season}&e=${episode}`;
    
    if (options?.subLang) {
      baseUrl += `&subLang=${encodeURIComponent(options.subLang)}`;
    }
    
    return baseUrl;
  }

  /**
   * Generate anime embed URL using AniList ID
   * @param anilistId - AniList anime ID
   * @param episode - Episode number
   * @param options - Additional options like subtitle language
   */
  static getAnimeEmbedUrlAniList(
    anilistId: number, 
    episode: number, 
    options?: SmashyStreamOptions
  ): string {
    let baseUrl = `${this.BASE_URL}/anime?anilist=${anilistId}&e=${episode}`;
    
    if (options?.subLang) {
      baseUrl += `&subLang=${encodeURIComponent(options.subLang)}`;
    }
    
    return baseUrl;
  }

  /**
   * Generate anime embed URL using MyAnimeList ID
   * @param malId - MyAnimeList anime ID
   * @param episode - Episode number
   * @param options - Additional options like subtitle language
   */
  static getAnimeEmbedUrlMAL(
    malId: number, 
    episode: number, 
    options?: SmashyStreamOptions
  ): string {
    let baseUrl = `${this.BASE_URL}/anime?mal=${malId}&e=${episode}`;
    
    if (options?.subLang) {
      baseUrl += `&subLang=${encodeURIComponent(options.subLang)}`;
    }
    
    return baseUrl;
  }

  /**
   * Validate if ID is an IMDb ID (starts with 'tt')
   */
  static isImdbId(id: string): boolean {
    return typeof id === 'string' && id.startsWith('tt');
  }

  /**
   * Generate single SmashyStream source for a movie (TMDB ID only)
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
      id: `smashystream_movie_${tmdbId}`,
      name: 'SmashyStream',
      url: this.getMovieEmbedUrl(tmdbId),
      type: 'hls' as const,
      quality: 'FHD' as const,
      reliability: 'Premium' as const,
      isAdFree: true,
      language: 'Multi',
      fileSize: 'Auto'
    }];
  }

  /**
   * Generate single SmashyStream source for a TV show episode (TMDB ID only)
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
      id: `smashystream_tv_${tmdbId}_s${season}e${episode}`,
      name: `SmashyStream S${season}E${episode}`,
      url: this.getTVEmbedUrl(tmdbId, season, episode),
      type: 'hls' as const,
      quality: 'FHD' as const,
      reliability: 'Premium' as const,
      isAdFree: true,
      language: 'Multi',
      fileSize: 'Auto'
    }];
  }

  /**
   * Get supported subtitle languages
   */
  static getSupportedSubtitleLanguages(): string[] {
    return [
      'English',
      'Spanish',
      'French',
      'German',
      'Italian',
      'Portuguese',
      'Russian',
      'Japanese',
      'Korean',
      'Chinese',
      'Arabic',
      'Turkish',
      'Hindi',
      'Dutch',
      'Swedish',
      'Norwegian',
      'Danish',
      'Finnish'
    ];
  }
}

export default SmashyStreamService;