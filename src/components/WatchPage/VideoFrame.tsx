import React, { useState, useEffect } from 'react';
import { 
  RotateCcw,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Movie, TVShow, WatchProgress, StreamSource } from '../../types';

interface VideoFrameProps {
  content: Movie | TVShow;
  watchProgress?: WatchProgress | null;
  onProgressUpdate?: (progress: WatchProgress) => void;
  selectedSource?: StreamSource;
}

/**
 * Pure helper: format title from Movie | TVShow
 * Exported for unit tests.
 * @param content Movie or TVShow object
 * @returns display title string
 */
export const formatTitle = (content: Movie | TVShow): string => {
  if (!content || typeof content !== 'object') return '';
  return 'title' in content ? (content.title || '') : (content.name || '');
};

/**
 * Pure helper: build a full image URL given TMDB path or return placeholder.
 * Exported for unit tests.
 * @param backdropPath path string (may be null/undefined)
 * @returns full image URL or placeholder path
 */
export const buildImageUrl = (backdropPath?: string | null): string => {
  if (typeof backdropPath === 'string' && backdropPath.trim().length > 0) {
    return `https://image.tmdb.org/t/p/original${backdropPath}`;
  }
  // Fallback placeholder if no backdrop available
  return '/placeholder-backdrop.png';
};

/**
 * Pure helper: validate a StreamSource shape and URL.
 * Exported for unit tests.
 * @param source StreamSource | undefined | null
 * @returns boolean indicating whether source is valid and supported
 */
export const isValidSource = (source?: StreamSource | null): boolean => {
  if (!source || typeof source !== 'object') return false;
  if (!source.url || typeof source.url !== 'string') return false;
  // Only allow http(s) iframe sources for safety
  try {
    const url = new URL(source.url);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Normalize a StreamSource, returning null when invalid.
 * Exported for unit tests and to centralize runtime guard logic.
 * @param source optional StreamSource
 * @returns StreamSource or null
 */
export const normalizeSource = (source?: StreamSource | null): StreamSource | null => {
  return isValidSource(source) ? (source as StreamSource) : null;
};

/**
 * Extract a backdrop/poster path from Movie | TVShow in a safe way.
 * Exported for unit tests.
 * @param content Movie or TVShow
 * @returns backdrop path string or undefined
 */
export const normalizeBackdropPath = (content: Movie | TVShow): string | undefined => {
  if (!content || typeof content !== 'object') return undefined;
  return (content as any).backdrop_path || (content as any).poster_path || undefined;
};

/**
 * VideoFrame component
 * Renders a streaming iframe or poster/backdrop when no source is selected.
 * Runtime guards ensure optional props are validated before use.
 *
 * Public contract remains unchanged.
 */
const VideoFrame: React.FC<VideoFrameProps> = ({
  content,
  watchProgress,
  selectedSource
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Normalize incoming optional props at runtime to avoid scattering guards
  const validSource = normalizeSource(selectedSource);

  const handleReload = () => {
    setHasError(false);
    setIsLoading(true);
    // Reload video source (actual reload handled by parent change or iframe re-mount)
  };

  // Small handlers extracted for clarity and single responsibility
  const handleIframeError = () => {
    setHasError(true);
  };

  const handleIframeLoad = () => {
    setHasError(false);
  };

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [selectedSource]);

  // Defensive validation: if a selectedSource is present but invalid, show error state
  useEffect(() => {
    if (selectedSource) {
      const ns = normalizeSource(selectedSource);
      if (!ns) {
        setHasError(true);
        setIsLoading(false);
        return;
      }
    } else {
      // Reset error when no source selected
      setHasError(false);
    }
  }, [selectedSource]);

  const displayTitle = formatTitle(content);
  const backdropUrl = buildImageUrl(normalizeBackdropPath(content));

  return (
    <div className="relative bg-black rounded-lg overflow-hidden group">
      {/* Video Container */}
      <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-black">
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-[#ff0000] animate-spin mx-auto mb-4" />
              <p className="text-white text-lg">Loading video...</p>
              <p className="text-gray-400 text-sm mt-2">
                {validSource ? `Connecting to ${validSource.name}` : (selectedSource ? `Connecting to ${selectedSource.name || 'source'}` : 'Preparing stream')}
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {hasError && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-white text-lg mb-2">Failed to load video</p>
              <p className="text-gray-400 text-sm mb-4">
                {selectedSource && !isValidSource(selectedSource)
                  ? 'Selected source is unsupported or has an invalid URL'
                  : 'Unable to connect to the selected source'}
              </p>
              <button
                onClick={handleReload}
                className="flex items-center px-4 py-2 bg-[#ff0000] text-white rounded-lg hover:bg-red-700 transition-colors mx-auto"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Video Content */}
        {!isLoading && !hasError && (
          <>
            {validSource ? (
              /* Streaming Player */
              <iframe
                src={validSource.url}
                className="w-full h-full streaming-iframe"
                frameBorder="0"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                title={`${validSource.name} - ${displayTitle}`}
                onError={handleIframeError}
                onLoad={handleIframeLoad}
                sandbox="allow-scripts allow-same-origin allow-presentation allow-fullscreen"
                referrerPolicy="no-referrer"
                style={{
                  filter: 'none',
                  isolation: 'isolate',
                  pointerEvents: 'auto'
                }}
              />
            ) : (
              /* Background Image/Poster when no source selected */
              <div className="absolute inset-0">
                <img
                  src={backdropUrl}
                  alt={displayTitle}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-white text-lg mb-2">Select a source to start watching</p>
                    <p className="text-gray-400 text-sm">Choose from the available streaming sources above</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Source Info */}
        {validSource && !isLoading && (
          <div className="absolute top-4 right-4">
            <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1">
              <span className="text-white text-sm font-medium">{validSource.name}</span>
              <span className="text-green-400 text-xs ml-2">{validSource.quality}</span>
              {validSource.id === 'cinemaos_player' && (
                <span className="text-blue-400 text-xs ml-2">Enhanced</span>
              )}
            </div>
          </div>
        )}


      </div>

      {/* Video Info Footer */}
      <div className="bg-gray-900 p-4 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold text-lg">
              {displayTitle}
            </h3>
            <p className="text-gray-400 text-sm">
              {validSource ? `Streaming from ${validSource.name}` : 'Select a source to start watching'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm">Quality:</span>
            <span className="text-[#ff0000] text-sm font-medium">
              {validSource?.quality || 'Auto'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoFrame;