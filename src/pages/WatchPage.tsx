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

  // Function to fetch all streaming sources
  const fetchStreamingSources = async (contentId: number) => {
    if (!contentId) return;

    try {
      setSourcesLoading(true);
      setSourcesError(null);
      
      const rivestreamOptions = {
        contentType: type,
        tmdbId: contentId,
        ...(type === 'tv' && { season: selectedSeason, episode: selectedEpisode })
      };

      // Fetch Rivestream sources
      const { streamSources: rivestreamSources, downloadOptions, torrentSources } = await rivestreamService.getAllContentData(rivestreamOptions);
      
      // Generate SmashyStream sources (always generate with TMDB ID)
      let smashyStreamSources: StreamSource[] = [];
      try {
        if (type === 'movie') {
          // Generate with TMDB ID (always available)
          smashyStreamSources = SmashyStreamService.generateMovieSources(contentId).map(source => ({
            id: source.id,
            name: source.name,
            url: source.url,
            type: source.type,
            quality: source.quality,
            fileSize: source.fileSize,
            reliability: source.reliability,
            isAdFree: source.isAdFree,
            language: source.language,
            subtitles: SmashyStreamService.getSupportedSubtitleLanguages()
          }));
        } else if (type === 'tv') {
          // Generate with TMDB ID (always available)
          smashyStreamSources = SmashyStreamService.generateTVSource(contentId, selectedSeason, selectedEpisode).map(source => ({
            id: source.id,
            name: source.name,
            url: source.url,
            type: source.type,
            quality: source.quality,
            fileSize: source.fileSize,
            reliability: source.reliability,
            isAdFree: source.isAdFree,
            language: source.language,
            subtitles: SmashyStreamService.getSupportedSubtitleLanguages()
          }));
        }
        
      } catch (smashyError) {
        console.warn('SmashyStream sources unavailable:', smashyError);
      }

      // Generate 111movies sources (always generate with TMDB ID)
      let movies111Sources: StreamSource[] = [];
      try {
        if (type === 'movie') {
          movies111Sources = Movies111Service.generateMovieSources(contentId).map(source => ({
            id: source.id,
            name: source.name,
            url: source.url,
            type: source.type,
            quality: source.quality,
            fileSize: source.fileSize,
            reliability: source.reliability,
            isAdFree: source.isAdFree,
            language: source.language,
            subtitles: Movies111Service.getSupportedSubtitleLanguages()
          }));
        } else if (type === 'tv') {
          movies111Sources = Movies111Service.generateTVSource(contentId, selectedSeason, selectedEpisode).map(source => ({
            id: source.id,
            name: source.name,
            url: source.url,
            type: source.type,
            quality: source.quality,
            fileSize: source.fileSize,
            reliability: source.reliability,
            isAdFree: source.isAdFree,
            language: source.language,
            subtitles: Movies111Service.getSupportedSubtitleLanguages()
          }));
        }
      } catch (movies111Error) {
        console.warn('111movies sources unavailable:', movies111Error);
      }

      // Combine all stream sources
      const allStreamSources = [...rivestreamSources, ...smashyStreamSources, ...movies111Sources];
      
      if (allStreamSources.length === 0 && downloadOptions.length === 0 && torrentSources.length === 0) {
        throw new Error('No streaming sources available for this content');
      }

      setStreamSources(allStreamSources);
      setDownloadOptions(downloadOptions);
      setTorrentSources(torrentSources);

      // Auto-select Vidjoy as default, then fallback to other premium sources
      if (allStreamSources.length > 0) {
        const defaultSource = allStreamSources.find(s => s.id === 'vidjoy_player') || 
                             allStreamSources.find(s => s.id === 'rivestream_server_2') || 
                             allStreamSources.find(s => s.reliability === 'Premium') || 
                             allStreamSources[0];
        setSelectedSource(defaultSource);
      } else {
        setSelectedSource(null);
      }

    } catch (error) {
      console.error('Error fetching streaming sources:', error);
      setSourcesError(error instanceof Error ? error.message : 'Failed to load streaming sources');
      
      // Fallback: provide basic sources even if API fails
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

      // Add SmashyStream fallback sources
      try {
        let smashyFallback: any[] = [];
        if (type === 'movie') {
          smashyFallback = SmashyStreamService.generateMovieSources(contentId);
        } else if (type === 'tv') {
          smashyFallback = SmashyStreamService.generateTVSource(contentId, selectedSeason, selectedEpisode);
        }
        
        const smashyFallbackSources = smashyFallback.map(source => ({
          id: source.id,
          name: source.name,
          url: source.url,
          type: source.type,
          quality: source.quality,
          fileSize: source.fileSize,
          reliability: source.reliability,
          isAdFree: source.isAdFree,
          language: source.language,
          subtitles: SmashyStreamService.getSupportedSubtitleLanguages()
        }));
        
        fallbackSources.push(...smashyFallbackSources);
      } catch (fallbackError) {
        console.warn('SmashyStream fallback failed:', fallbackError);
      }

      // Add 111movies fallback sources
      try {
        let movies111Fallback: any[] = [];
        if (type === 'movie') {
          movies111Fallback = Movies111Service.generateMovieSources(contentId);
        } else if (type === 'tv') {
          movies111Fallback = Movies111Service.generateTVSource(contentId, selectedSeason, selectedEpisode);
        }
        
        const movies111FallbackSources = movies111Fallback.map(source => ({
          id: source.id,
          name: source.name,
          url: source.url,
          type: source.type,
          quality: source.quality,
          fileSize: source.fileSize,
          reliability: source.reliability,
          isAdFree: source.isAdFree,
          language: source.language,
          subtitles: Movies111Service.getSupportedSubtitleLanguages()
        }));
        
        fallbackSources.push(...movies111FallbackSources);
      } catch (fallbackError) {
        console.warn('111movies fallback failed:', fallbackError);
      }

      setStreamSources(fallbackSources);
    } finally {
      setSourcesLoading(false);
    }
  };

  useEffect(() => {
    const fetchContent = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const contentId = parseInt(id);
        let contentData: Movie | TVShow;
        let videosData: Video[];
        let similarData: (Movie | TVShow)[];

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

        setContent(contentData);
        setVideos(videosData);
        setSimilarContent(similarData.results || []);

        // Load watch progress from localStorage
        const savedProgress = localStorage.getItem(`watch_progress_${type}_${contentId}`);
        if (savedProgress) {
          setWatchProgress(JSON.parse(savedProgress));
        }

        // Load user rating from localStorage
        const savedRating = localStorage.getItem(`user_rating_${type}_${contentId}`);
        if (savedRating) {
          setUserRating(parseInt(savedRating));
        }

        // Check if content is liked
        setIsLiked(myListService.isLiked(contentId, type));

        // Fetch Rivestream sources
        await fetchStreamingSources(contentId);

      } catch (err) {
        console.error('Error fetching content:', err);
        setError('Failed to load content. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [id, type]);

  // Separate useEffect for TV show episode changes
  useEffect(() => {
    if (content && type === 'tv') {
      fetchStreamingSources(content.id);
    }
  }, [selectedSeason, selectedEpisode]);



  const handleAddToList = () => {
    if (!content) return;

    if (isInList(content.id, type)) {
      // Find the item to remove by content ID
      const items = myListService.getMyList();
      const itemToRemove = items.find(item => 
        item.contentId === content.id && item.contentType === type
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
        myListService.unlikeContent(content.id, type);
        setIsLiked(false);
      } else {
        myListService.likeContent(content, type);
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleShare = () => {
    if (navigator.share && content) {
      navigator.share({
        title: content.title || content.name,
        text: content.overview,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // Show toast notification
      console.log('Link copied to clipboard');
    }
  };

  const handleRating = (rating: number) => {
    setUserRating(rating);
    localStorage.setItem(`user_rating_${type}_${id}`, rating.toString());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] pt-16">
        <LoadingSkeleton />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] pt-16 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Content Not Found</h2>
          <p className="text-gray-400 mb-6">{error || 'The requested content could not be found.'}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-[#ff0000] text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const title = content.title || content.name || '';
  const releaseDate = content.release_date || content.first_air_date || '';
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
                <Heart className={`h-5 w-5 ${isInList(content.id, type) ? 'text-[#ff0000] fill-current' : ''}`} />
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
                  onClick={() => content && fetchRivestreamSources(content.id)}
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