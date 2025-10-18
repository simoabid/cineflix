import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Play, 
  Heart, 
  Share, 
  Star,
  ChevronLeft,
  Bookmark,
  Clock
} from 'lucide-react';

import { Movie, TVShow, Video, WatchProgress, StreamSource, DownloadOption, TorrentSource } from '../types';
import { getMovieDetails, getTVShowDetails, getMovieVideos, getTVShowVideos, getSimilarMovies, getSimilarTVShows, getPosterUrl, getImageUrl } from '../services/tmdb';
import { useMyList } from '../hooks/useMyList';
import { myListService } from '../services/myListService';
import { rivestreamService } from '../services/rivestreamService';
import { SmashyStreamService } from '../services/smashystream';
import { Movies111Service } from '../services/111movies';
import LoadingSkeleton from '../components/LoadingSkeleton';
import VideoFrame from '../components/WatchPage/VideoFrame';
import StreamSources from '../components/WatchPage/StreamSources';
import DownloadOptions from '../components/WatchPage/DownloadOptions';
import TorrentSources from '../components/WatchPage/TorrentSources';
import MovieDetails from '../components/WatchPage/MovieDetails';

import SimilarContent from '../components/WatchPage/SimilarContent';
import UserRating from '../components/WatchPage/UserRating';

interface WatchPageProps {
  type: 'movie' | 'tv';
}

/**
 * Validate and parse a route id parameter.
 * Returns a positive integer id or null if invalid.
 * Exported to allow unit testing of validation behavior.
 * @param idParam - route id param (string | undefined)
 */
export function validateAndParseId(idParam?: string | undefined): number | null {
  if (!idParam) return null;
  const parsed = Number(idParam);
  if (!Number.isFinite(parsed) || isNaN(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
    return null;
  }
  return parsed;
}

/**
 * Select a sensible default source from a list of stream sources.
 * Prioritizes vidjoy_player, rivestream_server_2, Premium reliability, then first available.
 * Exported for testability as a pure function.
 * @param sources - array of stream sources
 */
export function selectDefaultSource(sources: StreamSource[] | null): StreamSource | null {
  if (!sources || sources.length === 0) return null;
  return sources.find(s => s.id === 'vidjoy_player') ||
         sources.find(s => s.id === 'rivestream_server_2') ||
         sources.find(s => s.reliability === 'Premium') ||
         sources[0];
}

/**
 * Transform raw third-party source entries into standardized StreamSource objects.
 * Exported for testability. This function assumes the shape of the input
 * is similar to what SmashyStreamService / Movies111Service produce.
 * @param rawSources - raw sources array from provider
 * @param subtitleProvider - function that returns supported subtitles
 */
export function transformProviderSources(rawSources: any[] = [], subtitleProvider: () => string[] = () => []): StreamSource[] {
  return (rawSources || []).map(source => ({
    id: source.id,
    name: source.name,
    url: source.url,
    type: source.type,
    quality: source.quality,
    fileSize: source.fileSize,
    reliability: source.reliability,
    isAdFree: source.isAdFree,
    language: source.language,
    subtitles: subtitleProvider()
  }));
}

/**
 * Fetch all stream, download and torrent sources for a piece of content.
 * This is the orchestrator extracted from component logic. It returns a normalized
 * result object and does not mutate component state. It includes validation of
 * incoming params and will throw informative errors for the caller to handle.
 * Exported for unit testing.
 * @param options - object containing contentId, type, season, episode
 */
export async function fetchAllSources(options: {
  contentId: number;
  type: 'movie' | 'tv';
  season?: number;
  episode?: number;
}): Promise<{
  streamSources: StreamSource[];
  downloadOptions: DownloadOption[];
  torrentSources: TorrentSource[];
}> {
  const { contentId, type, season, episode } = options;

  if (!contentId || !Number.isInteger(contentId) || contentId <= 0) {
    throw new Error('Invalid contentId provided to fetchAllSources');
  }
  if (type !== 'movie' && type !== 'tv') {
    throw new Error('Invalid content type provided to fetchAllSources');
  }

  // Acquire rivestream data from service (may throw)
  const rivestreamOptions: any = {
    contentType: type,
    tmdbId: contentId
  };
  if (type === 'tv') {
    rivestreamOptions.season = season;
    rivestreamOptions.episode = episode;
  }

  const rivestreamResult = await rivestreamService.getAllContentData(rivestreamOptions);
  const rivestreamSources: StreamSource[] = rivestreamResult.streamSources || [];
  const downloadOptions: DownloadOption[] = rivestreamResult.downloadOptions || [];
  const torrentSources: TorrentSource[] = rivestreamResult.torrentSources || [];

  // Attempt to gather SmashyStream sources (non-blocking)
  let smashyStreamSources: StreamSource[] = [];
  try {
    if (type === 'movie') {
      const raw = SmashyStreamService.generateMovieSources(contentId);
      smashyStreamSources = transformProviderSources(raw, SmashyStreamService.getSupportedSubtitleLanguages);
    } else {
      const raw = SmashyStreamService.generateTVSource(contentId, season || 1, episode || 1);
      smashyStreamSources = transformProviderSources(raw, SmashyStreamService.getSupportedSubtitleLanguages);
    }
  } catch (err) {
    // swallow provider-specific errors to allow fallbacks; caller handles logging
  }

  // Attempt to gather Movies111 sources (non-blocking)
  let movies111Sources: StreamSource[] = [];
  try {
    if (type === 'movie') {
      const raw = Movies111Service.generateMovieSources(contentId);
      movies111Sources = transformProviderSources(raw, Movies111Service.getSupportedSubtitleLanguages);
    } else {
      const raw = Movies111Service.generateTVSource(contentId, season || 1, episode || 1);
      movies111Sources = transformProviderSources(raw, Movies111Service.getSupportedSubtitleLanguages);
    }
  } catch (err) {
    // swallow provider-specific errors to allow fallbacks; caller handles logging
  }

  const allStreamSources = [...(rivestreamSources || []), ...smashyStreamSources, ...movies111Sources];

  return {
    streamSources: allStreamSources,
    downloadOptions: downloadOptions || [],
    torrentSources: torrentSources || []
  };
}

/**
 * Fetch content details, videos and similar content in parallel.
 * Validates responses and throws if the minimal expected fields are missing.
 * Exported for testing.
 * @param contentId - numeric TMDB id
 * @param type - 'movie' | 'tv'
 */
export async function fetchContentData(contentId: number, type: 'movie' | 'tv'): Promise<{
  contentData: Movie | TVShow;
  videosData: Video[];
  similarData: { results: (Movie | TVShow)[] } | any;
}> {
  if (!contentId || !Number.isInteger(contentId) || contentId <= 0) {
    throw new Error('Invalid contentId provided to fetchContentData');
  }

  let contentData: Movie | TVShow;
  let videosData: Video[];
  let similarData: any;

  if (type === 'movie') {
    [contentData, videosData, similarData] = await Promise.all([
      getMovieDetails(contentId),
      getMovieVideos(contentId),
      getSimilarMovies(contentId)
    ]);
  } else {
    [contentData, videosData, similarData] = await Promise.all([
      getTVShowDetails(contentId),
      getTVShowVideos(contentId),
      getSimilarTVShows(contentId)
    ]);
  }

  // Basic validation of returned content
  if (!contentData || typeof (contentData as any).id !== 'number') {
    throw new Error('Content data is missing or invalid from TMDB');
  }
  if (!Array.isArray(videosData)) {
    videosData = [];
  }
  if (!similarData) {
    similarData = { results: [] };
  }

  return { contentData, videosData, similarData };
}

/**
 * Centralized error panel used across the watch page and intended for use
 * by route/loader error boundaries. Exported so route-level error handlers
 * can render a consistent UI for failures.
 * @param props.message - human readable error message to display
 * @param props.onRetry - optional retry callback to allow the host to retry loading
 */
export const ErrorPanel: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div className="min-h-screen bg-[#0f0f0f] pt-16 flex items-center justify-center">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-white mb-4">Content Not Found</h2>
      <p className="text-gray-400 mb-6">{message}</p>
      <div className="flex items-center justify-center gap-4">
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-[#ff0000] text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  </div>
);

const WatchPage: React.FC<WatchPageProps> = ({ type }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isInList, addToList, removeFromList } = useMyList();

  // State management
  const [content, setContent] = useState<Movie | TVShow | null>(null);

  const [videos, setVideos] = useState<Video[]>([]);
  const [similarContent, setSimilarContent] = useState<(Movie | TVShow)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [watchProgress, setWatchProgress] = useState<WatchProgress | null>(null);
  const [userRating, setUserRating] = useState<number>(0);

  const [activeSection, setActiveSection] = useState<'stream' | 'download' | 'torrent'>('stream');
  const [isLiked, setIsLiked] = useState(false);
  const [selectedSource, setSelectedSource] = useState<StreamSource | null>(null);

  // Rivestream data - fetched from the service
  const [streamSources, setStreamSources] = useState<StreamSource[]>([]);
  const [downloadOptions, setDownloadOptions] = useState<DownloadOption[]>([]);
  const [torrentSources, setTorrentSources] = useState<TorrentSource[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [sourcesError, setSourcesError] = useState<string | null>(null);

  // TV Show specific state
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);

  // Wrapper around the orchestrator to update component state.
  // Kept as a stable reference inside the component.
  const fetchStreamingSources = async (contentId: number) => {
    if (!contentId) return;

    try {
      setSourcesLoading(true);
      setSourcesError(null);

      const { streamSources: fetchedStreamSources, downloadOptions: fetchedDownloads, torrentSources: fetchedTorrents } =
        await fetchAllSources({
          contentId,
          type,
          season: selectedSeason,
          episode: selectedEpisode
        });

      // Fallback behavior if no sources
      if ((fetchedStreamSources?.length || 0) === 0 && (fetchedDownloads?.length || 0) === 0 && (fetchedTorrents?.length || 0) === 0) {
        throw new Error('No streaming sources available for this content');
      }

      setStreamSources(fetchedStreamSources);
      setDownloadOptions(fetchedDownloads);
      setTorrentSources(fetchedTorrents);

      const defaultSource = selectDefaultSource(fetchedStreamSources);
      setSelectedSource(defaultSource);
    } catch (err) {
      console.error('Error fetching streaming sources:', err);
      const message = err instanceof Error ? err.message : 'Failed to load streaming sources';
      setSourcesError(message);

      // Provide defensive fallback sources so UI remains usable
      const fallbackSources: StreamSource[] = [
        {
          id: 'vidjoy_player',
          name: 'Vidjoy',
          url: `https://vidjoy.pro/embed/${type}/${contentId}${type === 'tv' ? `/${selectedSeason}/${selectedEpisode}` : ''}`,
          type: 'hls',
          quality: 'FHD',
          fileSize: 'Auto',
          reliability: 'Premium',
          isAdFree: true,
          language: 'English',
          subtitles: ['English']
        },
        {
          id: 'rivestream_server_2',
          name: 'Rivestream Server 2',
          url: `https://rivestream.org/embed/agg?type=${type}&id=${contentId}${type === 'tv' ? `&season=${selectedSeason}&episode=${selectedEpisode}` : ''}`,
          type: 'hls',
          quality: 'HD',
          fileSize: 'Auto',
          reliability: 'Premium',
          isAdFree: true,
          language: 'English',
          subtitles: ['English']
        }
      ];

      // Try to append provider fallbacks but don't fail if they error
      try {
        let raw: any[] = [];
        if (type === 'movie') {
          raw = SmashyStreamService.generateMovieSources(contentId);
        } else {
          raw = SmashyStreamService.generateTVSource(contentId, selectedSeason, selectedEpisode);
        }
        fallbackSources.push(...transformProviderSources(raw, SmashyStreamService.getSupportedSubtitleLanguages));
      } catch (fallbackError) {
        console.warn('SmashyStream fallback failed:', fallbackError);
      }

      try {
        let raw: any[] = [];
        if (type === 'movie') {
          raw = Movies111Service.generateMovieSources(contentId);
        } else {
          raw = Movies111Service.generateTVSource(contentId, selectedSeason, selectedEpisode);
        }
        fallbackSources.push(...transformProviderSources(raw, Movies111Service.getSupportedSubtitleLanguages));
      } catch (fallbackError) {
        console.warn('111movies fallback failed:', fallbackError);
      }

      setStreamSources(fallbackSources);
      setDownloadOptions([]);
      setTorrentSources([]);
      setSelectedSource(selectDefaultSource(fallbackSources));
    } finally {
      setSourcesLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);

        const contentId = validateAndParseId(id);
        if (!contentId) {
          setError('Invalid content identifier.');
          setLoading(false);
          return;
        }

        const { contentData, videosData, similarData } = await fetchContentData(contentId, type);

        if (!isMounted) return;

        setContent(contentData);
        setVideos(videosData || []);
        setSimilarContent(similarData.results || []);

        // Load watch progress from localStorage (defensive parsing)
        try {
          const savedProgress = localStorage.getItem(`watch_progress_${type}_${contentId}`);
          if (savedProgress) {
            setWatchProgress(JSON.parse(savedProgress));
          }
        } catch (storageErr) {
          console.warn('Failed to parse saved watch progress:', storageErr);
        }

        // Load user rating from localStorage
        try {
          const savedRating = localStorage.getItem(`user_rating_${type}_${contentId}`);
          if (savedRating) {
            setUserRating(parseInt(savedRating));
          }
        } catch (storageErr) {
          console.warn('Failed to parse saved user rating:', storageErr);
        }

        // Check if content is liked
        try {
          setIsLiked(myListService.isLiked((contentData as any).id, type));
        } catch (listErr) {
          console.warn('Failed to check like status:', listErr);
        }

        // Fetch streaming sources
        await fetchStreamingSources((contentData as any).id);
      } catch (err) {
        console.error('Error fetching content:', err);
        const message = err instanceof Error ? err.message : 'Failed to load content. Please try again.';
        if (isMounted) setError(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchContent();

    return () => {
      isMounted = false;
    };
    // contentId (id) and type are the primary external inputs; keep dependency array explicit
  }, [id, type, selectedSeason, selectedEpisode]);

  // Separate useEffect for TV show episode/season changes to refetch sources only
  useEffect(() => {
    if (content && type === 'tv') {
      fetchStreamingSources((content as any).id);
    }
    // Only refetch when season/episode change or content/type changes
  }, [selectedSeason, selectedEpisode, content, type]);

  const handleAddToList = () => {
    if (!content) return;

    if (isInList((content as any).id, type)) {
      // Find the item to remove by content ID
      const items = myListService.getMyList();
      const itemToRemove = items.find(item => 
        item.contentId === (content as any).id && item.contentType === type
      );
      if (itemToRemove) {
        removeFromList(itemToRemove.id);
      }
    } else {
      addToList(content, type);
    }
  };

  const handleLike = () => {
    if (!content) return;
    
    try {
      if (isLiked) {
        myListService.unlikeContent((content as any).id, type);
        setIsLiked(false);
      } else {
        myListService.likeContent(content, type);
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      setError('Failed to update like status.');
    }
  };

  const handleShare = () => {
    if (navigator.share && content) {
      navigator.share({
        title: (content as any).title || (content as any).name,
        text: (content as any).overview,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href).catch(() => {
        console.log('Copy to clipboard failed');
      });
      // Show toast notification
      console.log('Link copied to clipboard');
    }
  };

  const handleRating = (rating: number) => {
    setUserRating(rating);
    try {
      const contentIdKey = validateAndParseId(id) ?? null;
      if (contentIdKey) {
        localStorage.setItem(`user_rating_${type}_${contentIdKey}`, rating.toString());
      }
    } catch (err) {
      console.warn('Failed to save user rating:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] pt-16">
        <LoadingSkeleton />
      </div>
    );
  }

  if (error || !content) {
    return <ErrorPanel message={error || 'The requested content could not be found.'} onRetry={() => {
      // Retry triggers the same effect by navigating to the same route programmatically (re-mount)
      // or simply re-invoking fetchStreamingSources if content is present.
      if (content) {
        fetchStreamingSources((content as any).id);
      } else {
        // Try to re-parse id and re-run effect by forcing a navigation to same path
        navigate(0);
      }
    }} />;
  }

  const title = (content as any).title || (content as any).name || '';
  const releaseDate = (content as any).release_date || (content as any).first_air_date || '';
  const runtime = type === 'movie' ? (content as Movie).runtime : (content as TVShow).episode_run_time?.[0];
  const trailer = videos.find(v => v.type === 'Trailer') || videos[0];

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-16">
      {/* Header */}
      <motion.header 
        className="bg-[#0f0f0f]/90 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-8xl mx-auto px-6 sm:px-8 lg:px-12 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="h-5 w-5 mr-2" />
                Back
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">{title}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  {releaseDate && <span>{new Date(releaseDate).getFullYear()}</span>}
                  {runtime && <span>{runtime} min</span>}
                  <span className="px-2 py-1 border border-gray-500 rounded text-xs">PG-13</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <motion.button
                onClick={handleAddToList}
                className="p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Heart className={`h-5 w-5 ${isInList((content as any).id, type) ? 'text-[#ff0000] fill-current' : ''}`} />
              </motion.button>
              <motion.button
                onClick={handleLike}
                className="p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Heart className={`h-5 w-5 ${isLiked ? 'text-[#ff0000] fill-current' : ''}`} />
              </motion.button>
              <motion.button
                onClick={handleShare}
                className="p-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Share className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content Area - Video Frame + Details */}
      <section className="py-8 bg-[#0f0f0f]">
        <div className="max-w-8xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Video Frame */}
            <div className="lg:col-span-3">
              <VideoFrame
                content={content}
                watchProgress={watchProgress}
                onProgressUpdate={setWatchProgress}
                selectedSource={selectedSource}
              />
            </div>

            {/* Details Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                {/* Details Header */}
                <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
                  <h2 className="text-white font-semibold text-lg">Details</h2>
                </div>
                
                {/* Movie Details Content */}
                <div className="p-4">
                  <MovieDetails content={content} type={type} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TV Show Episode Selection */}
      {type === 'tv' && content && (
        <section className="py-8 bg-[#0f0f0f]">
          <div className="max-w-8xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <h3 className="text-white font-semibold text-lg mb-4">Episode Selection</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-400 text-sm font-medium mb-2">
                    Season
                  </label>
                  <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(parseInt(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ff0000] focus:border-transparent"
                  >
                    {Array.from({ length: (content as TVShow).number_of_seasons || 1 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Season {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm font-medium mb-2">
                    Episode
                  </label>
                  <select
                    value={selectedEpisode}
                    onChange={(e) => setSelectedEpisode(parseInt(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ff0000] focus:border-transparent"
                  >
                    {Array.from({ length: 20 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Episode {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {sourcesLoading && (
                <div className="mt-4 flex items-center text-gray-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent mr-2"></div>
                  <span>Loading episode sources...</span>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Streaming Options Section */}
      <section className="py-16 bg-[#0f0f0f]">
        <div className="max-w-8xl mx-auto px-6 sm:px-8 lg:px-12">
          {/* Section Navigation */}
          <div className="flex flex-wrap gap-4 mb-8">
            <button
              onClick={() => setActiveSection('stream')}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                activeSection === 'stream'
                  ? 'bg-[#ff0000] text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Stream Sources
            </button>
            <button
              onClick={() => setActiveSection('download')}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                activeSection === 'download'
                  ? 'bg-[#ff0000] text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Download Options
            </button>
            <button
              onClick={() => setActiveSection('torrent')}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                activeSection === 'torrent'
                  ? 'bg-[#ff0000] text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Torrent Sources
            </button>
          </div>

          {/* Active Section Content */}
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Loading State */}
            {sourcesLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#ff0000] border-t-transparent mx-auto mb-4"></div>
                  <p className="text-white text-lg">Loading streaming sources...</p>
                  <p className="text-gray-400 text-sm mt-2">Connecting to Rivestream servers</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {sourcesError && !sourcesLoading && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 mb-6">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white text-sm">!</span>
                  </div>
                  <h3 className="text-red-400 font-semibold">Streaming Sources Error</h3>
                </div>
                <p className="text-red-300 text-sm">{sourcesError}</p>
                <button
                  onClick={() => content && fetchStreamingSources((content as any).id)}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Retry Loading Sources
                </button>
              </div>
            )}

            {/* Content Sections */}
            {!sourcesLoading && (
              <>
                {activeSection === 'stream' && (
                  <StreamSources 
                    sources={streamSources} 
                    onSourceSelect={setSelectedSource}
                    selectedSource={selectedSource}
                  />
                )}
                {activeSection === 'download' && (
                  <DownloadOptions options={downloadOptions} />
                )}
                {activeSection === 'torrent' && (
                  <TorrentSources sources={torrentSources} />
                )}
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* Similar Content */}
      <SimilarContent
        content={similarContent}
        title={`More like "${title}"`}
        type={type}
      />
    </div>
  );
};

export default WatchPage;