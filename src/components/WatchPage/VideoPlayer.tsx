import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  X,
  Settings,
  PictureInPicture2
} from 'lucide-react';

import { Movie, TVShow, Video, WatchProgress, VideoPlayerState } from '../../types';

export interface Logger {
  log: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
}

/**
 * Normalize a candidate media URL string.
 * Returns a fully-qualified URL string or null if the input is invalid.
 * Exported for unit testing.
 */
export const normalizeMediaUrl = (url?: string | null): string | null => {
  if (!url) return null;
  try {
    // If it's already a full URL, new URL will validate it.
    const normalized = new URL(url, window.location.origin).toString();
    return normalized;
  } catch (err) {
    // Try to be lenient for common TMDB poster paths (they're not full URLs)
    try {
      if (url.startsWith('/')) {
        return new URL(url, 'https://image.tmdb.org').toString();
      }
    } catch {
      // fall through to null
    }
    return null;
  }
};

/**
 * Parse a YouTube key or URL and extract the video id if possible.
 * Accepts common forms like 'abc123', 'https://youtu.be/abc123', 'https://www.youtube.com/watch?v=abc123'
 * Exported for unit testing.
 */
export const parseYouTubeKey = (keyOrUrl?: string | null): string | null => {
  if (!keyOrUrl) return null;
  const candidate = keyOrUrl.trim();
  // If it's already an 11+ char id (YouTube ids are typically 11 chars)
  const idMatch = candidate.match(/^[a-zA-Z0-9_-]{8,}$/);
  if (idMatch) return candidate;

  // Try to extract from common URL patterns
  try {
    const u = new URL(candidate, 'https://www.youtube.com');
    if (u.hostname.includes('youtu')) {
      // For youtu.be/ID
      const shortMatch = u.pathname.split('/').filter(Boolean)[0];
      if (shortMatch && /^[a-zA-Z0-9_-]{8,}$/.test(shortMatch)) return shortMatch;
      // For watch?v=ID
      const v = u.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{8,}$/.test(v)) return v;
    }
  } catch {
    // Not a URL; fallback null
  }

  // No valid id found
  return null;
};

/**
 * Normalize playback configuration provided from outside.
 * Exported for unit testing.
 */
export const normalizePlaybackConfig = (cfg?: Partial<VideoPlayerState>): Partial<VideoPlayerState> => {
  const defaultCfg: Partial<VideoPlayerState> = {
    playbackRate: 1,
    quality: '1080p',
    subtitles: {
      enabled: false,
      language: 'English'
    },
    volume: 1,
    isMuted: false
  };

  if (!cfg) return defaultCfg;

  const normalized: Partial<VideoPlayerState> = {
    playbackRate: typeof cfg.playbackRate === 'number' ? cfg.playbackRate : defaultCfg.playbackRate,
    quality: typeof cfg.quality === 'string' ? cfg.quality : defaultCfg.quality,
    subtitles: cfg.subtitles
      ? {
          enabled: Boolean((cfg.subtitles as any).enabled),
          language: (cfg.subtitles as any).language ?? defaultCfg.subtitles!.language
        }
      : defaultCfg.subtitles,
    volume: typeof cfg.volume === 'number' ? Math.min(1, Math.max(0, cfg.volume)) : defaultCfg.volume,
    isMuted: typeof cfg.isMuted === 'boolean' ? cfg.isMuted : defaultCfg.isMuted
  };

  return normalized;
};

interface VideoPlayerProps {
  content: Movie | TVShow;
  trailer?: Video;
  onClose: () => void;
  watchProgress?: WatchProgress | null;
  onProgressUpdate: (progress: WatchProgress) => void;
  /**
   * Optional external dependencies to enable injecting mocks for logging/analytics in tests.
   */
  deps?: {
    logger?: Logger;
    analytics?: (event: string, payload?: any) => void;
  };
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  content,
  trailer,
  onClose,
  watchProgress,
  onProgressUpdate,
  deps
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [hideControlsTimeout, setHideControlsTimeout] = useState<number | null>(null);

  const logger: Logger = deps?.logger ?? console;
  const analytics = deps?.analytics ?? (() => {});

  const [playerState, setPlayerState] = useState<VideoPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    isFullscreen: false,
    isPictureInPicture: false,
    playbackRate: 1,
    quality: '1080p',
    subtitles: {
      enabled: false,
      language: 'English'
    },
    buffered: 0,
    loading: true
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);

  const qualityOptions = ['4K', '1080p', '720p', '480p'];
  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const subtitleLanguages = ['Off', 'English', 'Spanish', 'French', 'German'];

  // Memoize poster URL and source URL to avoid recomputation each render.
  const posterUrl = useMemo(() => {
    const backdropPath = (content as any)?.backdrop_path;
    if (!backdropPath) return undefined;
    const candidate = `https://image.tmdb.org/t/p/original${backdropPath}`;
    return normalizeMediaUrl(candidate) ?? undefined;
  }, [content]);

  const sourceSrc = useMemo(() => {
    if (!trailer?.key) return null;
    const parsed = parseYouTubeKey(trailer.key) ?? trailer.key;
    const candidate = `https://www.youtube.com/watch?v=${parsed}`;
    return normalizeMediaUrl(candidate);
  }, [trailer?.key]);

  /**
   * Resume logic extracted for readability and reuse.
   */
  const resumeFromWatchProgress = useCallback(
    (video: HTMLVideoElement | null) => {
      if (!video) return;
      if (watchProgress && typeof watchProgress.currentTime === 'number') {
        try {
          video.currentTime = Math.min(video.duration, Math.max(0, watchProgress.currentTime));
        } catch (err) {
          logger.warn('Failed to resume video time from watchProgress:', err);
        }
      }
    },
    [watchProgress, logger]
  );

  /**
   * Handler for 'loadedmetadata' event - sets duration and resumes from progress if present.
   */
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setPlayerState(prev => ({
      ...prev,
      duration: video.duration,
      loading: false
    }));

    resumeFromWatchProgress(video);
  }, [resumeFromWatchProgress]);

  /**
   * Build watch progress payload helper.
   */
  const buildWatchProgress = useCallback(
    (currentTime: number, duration: number): WatchProgress => {
      const percentage = duration > 0 ? (currentTime / duration) * 100 : 0;
      return {
        contentId: (content as any)?.id,
        contentType: 'title' in content ? 'movie' : 'tv',
        currentTime,
        duration,
        percentage,
        lastWatched: new Date().toISOString()
      };
    },
    [content]
  );

  /**
   * Handler for 'timeupdate' event - updates current time and sends progress to parent.
   */
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const currentTime = video.currentTime;
    const duration = video.duration;

    setPlayerState(prev => ({
      ...prev,
      currentTime,
      duration
    }));

    // Update watch progress only when duration is valid to avoid division by zero.
    if (duration > 0) {
      const progress = buildWatchProgress(currentTime, duration);
      try {
        if (typeof onProgressUpdate === 'function') {
          onProgressUpdate(progress);
        }
      } catch (err) {
        logger.error('onProgressUpdate threw an error:', err);
      }
    }
  }, [buildWatchProgress, onProgressUpdate, logger]);

  /**
   * Handler for progressive buffering updates.
   */
  const handleProgress = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (video.buffered.length > 0 && video.duration > 0) {
        const buffered = (video.buffered.end(0) / video.duration) * 100;
        setPlayerState(prev => ({ ...prev, buffered }));
      }
    } catch (err) {
      // Guard against invalid buffered ranges
      logger.warn('Buffered progress calculation failed:', err);
    }
  }, [logger]);

  const handlePlay = useCallback(() => {
    setPlayerState(prev => ({ ...prev, isPlaying: true }));
    try {
      analytics('play');
    } catch {
      // ignore analytics failures
    }
  }, [analytics]);

  const handlePause = useCallback(() => {
    setPlayerState(prev => ({ ...prev, isPlaying: false }));
    try {
      analytics('pause');
    } catch {
      // ignore analytics failures
    }
  }, [analytics]);

  const handleVolumeChangeEvent = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setPlayerState(prev => ({
      ...prev,
      volume: video.volume,
      isMuted: video.muted
    }));
  }, []);

  /**
   * Handle playback errors and report them via provided logger.
   */
  const handleError = useCallback(() => {
    const video = videoRef.current;
    const error = video?.error;
    setPlayerState(prev => ({ ...prev, loading: false }));
    if (error) {
      logger.error('Video playback error:', error);
    } else {
      logger.error('Unknown video playback error occurred.');
    }
  }, [logger]);

  /**
   * Handle stalled network events explicitly for clearer logging.
   */
  const handleStalled = useCallback(() => {
    logger.warn('Video element stalled - possible network issue.');
  }, [logger]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChangeEvent);
    video.addEventListener('error', handleError);
    video.addEventListener('stalled', handleStalled);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChangeEvent);
      video.removeEventListener('error', handleError);
      video.removeEventListener('stalled', handleStalled);
    };
  }, [
    handleLoadedMetadata,
    handleTimeUpdate,
    handleProgress,
    handlePlay,
    handlePause,
    handleVolumeChangeEvent,
    handleError,
    handleStalled
  ]);

  /**
   * Small helpers used by keyboard handler for clarity and testability.
   */
  const seekBy = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(video.duration, Math.max(0, video.currentTime + seconds));
  };

  const changeVolumeBy = (delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = Math.min(1, Math.max(0, video.volume + delta));
    video.muted = video.volume === 0;
  };

  /**
   * Keyboard shortcuts handler - broken out for readability and testability.
   */
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekBy(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekBy(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          changeVolumeBy(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          changeVolumeBy(-0.1);
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'Escape':
          if (playerState.isFullscreen) {
            toggleFullscreen();
          } else {
            onClose();
          }
          break;
      }
    },
    // toggle* functions are defined later but referenced dynamically; they are recreated each render,
    // so we don't add them as dependencies to avoid excessive re-subscription. We keep playerState and onClose.
    // This is acceptable because the handler uses latest values at invocation time.
    [playerState.isFullscreen, onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const showControlsTemporarily = () => {
    setShowControls(true);
    if (hideControlsTimeout) {
      clearTimeout(hideControlsTimeout);
    }
    const timeout = window.setTimeout(() => {
      setShowControls(false);
    }, 3000);
    setHideControlsTimeout(timeout);
  };

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      // Playback may fail due to autoplay policies; gracefully handle promise rejection.
      const playPromise = video.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise.catch(err => {
          logger.warn('Play request rejected:', err);
        });
      }
      try {
        analytics('play_attempt');
      } catch {
        // ignore analytics failures
      }
    } else {
      video.pause();
    }
    showControlsTemporarily();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    showControlsTemporarily();
    try {
      analytics('mute_toggle', { muted: video.muted });
    } catch {
      // ignore analytics failures
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => {
        logger.warn('Failed to enter fullscreen:', err);
      });
      setPlayerState(prev => ({ ...prev, isFullscreen: true }));
    } else {
      document.exitFullscreen().catch(err => {
        logger.warn('Failed to exit fullscreen:', err);
      });
      setPlayerState(prev => ({ ...prev, isFullscreen: false }));
    }
  };

  const togglePictureInPicture = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (video !== document.pictureInPictureElement) {
        await video.requestPictureInPicture();
        setPlayerState(prev => ({ ...prev, isPictureInPicture: true }));
      } else {
        await document.exitPictureInPicture();
        setPlayerState(prev => ({ ...prev, isPictureInPicture: false }));
      }
    } catch (error) {
      logger.error('Picture-in-picture error:', error);
    }
  };

  /**
   * Seek handler. Calculate the target time based on click position relative to the progress bar.
   * Note: we guard against invalid widths and durations to prevent NaN/Infinity issues.
   */
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const progressBar = progressRef.current;
    if (!video || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width || 1; // guard against zero width
    const percentage = Math.min(Math.max(clickX / width, 0), 1);
    const targetTime = percentage * (video.duration || 0);

    // Apply the calculated seek target
    try {
      video.currentTime = targetTime;
    } catch (err) {
      logger.warn('Seeking failed:', err);
    }

    showControlsTemporarily();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const volume = parseFloat(e.target.value);
    video.volume = volume;
    video.muted = volume === 0;
  };

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setPlayerState(prev => ({ ...prev, playbackRate: rate }));
    setShowSettings(false);
    showControlsTemporarily();
    try {
      analytics('playback_rate_change', { rate });
    } catch {
      // ignore
    }
  };

  const changeQuality = (quality: string) => {
    setPlayerState(prev => ({ ...prev, quality }));
    setShowQualityMenu(false);
    setShowSettings(false);
    showControlsTemporarily();
    // In a real app, this would switch the video source
    logger.log('Quality changed to:', quality);
    try {
      analytics('quality_change', { quality });
    } catch {
      // ignore
    }
  };

  const changeSubtitle = (language: string) => {
    setPlayerState(prev => ({
      ...prev,
      subtitles: {
        enabled: language !== 'Off',
        language
      }
    }));
    setShowSubtitleMenu(false);
    setShowSettings(false);
    showControlsTemporarily();
    try {
      analytics('subtitle_change', { language });
    } catch {
      // ignore
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Memoize derived progress percentage to avoid recalculations on unrelated state updates.
  const progressPercentage = useMemo(
    () =>
      playerState.duration > 0
        ? (playerState.currentTime / playerState.duration) * 100
        : 0,
    [playerState.currentTime, playerState.duration]
  );

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <motion.div
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseMove={showControlsTemporarily}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          onClick={togglePlayPause}
          poster={posterUrl}
        >
          {sourceSrc && (
            <source
              src={sourceSrc}
              type="video/mp4"
            />
          )}
          Your browser does not support the video tag.
        </video>

        {/* Loading Spinner */}
        {playerState.loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#ff0000] border-t-transparent"></div>
          </div>
        )}

        {/* Controls Overlay */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Top Controls */}
              <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h2 className="text-2xl font-bold text-white">
                    {'title' in content ? content.title : content.name}
                  </h2>
                  {playerState.subtitles.enabled && (
                    <span className="px-2 py-1 bg-black/50 text-white text-sm rounded">
                      CC
                    </span>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Center Play/Pause Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={togglePlayPause}
                  className="p-4 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors opacity-0 hover:opacity-100"
                >
                  {playerState.isPlaying ? (
                    <Pause className="h-12 w-12" />
                  ) : (
                    <Play className="h-12 w-12" />
                  )}
                </button>
              </div>

              {/* Bottom Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                {/* Progress Bar */}
                <div
                  ref={progressRef}
                  className="relative w-full h-2 bg-white/30 rounded-full mb-4 cursor-pointer group"
                  onClick={handleSeek}
                >
                  {/* Buffered Progress */}
                  <div
                    className="absolute inset-y-0 left-0 bg-white/50 rounded-full"
                    style={{ width: `${playerState.buffered}%` }}
                  />
                  {/* Watch Progress */}
                  <div
                    className="absolute inset-y-0 left-0 bg-[#ff0000] rounded-full"
                    style={{ width: `${progressPercentage}%` }}
                  />
                  {/* Progress Handle */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-[#ff0000] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ left: `${progressPercentage}%`, transform: 'translateX(-50%) translateY(-50%)' }}
                  />
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Play/Pause */}
                    <button
                      onClick={togglePlayPause}
                      className="p-2 text-white hover:text-[#ff0000] transition-colors"
                    >
                      {playerState.isPlaying ? (
                        <Pause className="h-6 w-6" />
                      ) : (
                        <Play className="h-6 w-6" />
                      )}
                    </button>

                    {/* Volume */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={toggleMute}
                        className="p-2 text-white hover:text-[#ff0000] transition-colors"
                      >
                        {playerState.isMuted || playerState.volume === 0 ? (
                          <VolumeX className="h-6 w-6" />
                        ) : (
                          <Volume2 className="h-6 w-6" />
                        )}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={playerState.isMuted ? 0 : playerState.volume}
                        onChange={handleVolumeChange}
                        className="w-20 accent-[#ff0000]"
                      />
                    </div>

                    {/* Time Display */}
                    <span className="text-white text-sm">
                      {formatTime(playerState.currentTime)} / {formatTime(playerState.duration)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Settings */}
                    <div className="relative">
                      <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="p-2 text-white hover:text-[#ff0000] transition-colors"
                      >
                        <Settings className="h-6 w-6" />
                      </button>

                      {/* Settings Menu */}
                      <AnimatePresence>
                        {showSettings && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-full right-0 mb-2 bg-black/90 text-white rounded-lg py-2 min-w-48"
                          >
                            {/* Quality */}
                            <button
                              onClick={() => setShowQualityMenu(!showQualityMenu)}
                              className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center justify-between"
                            >
                              <span>Quality</span>
                              <span className="text-sm text-gray-400">{playerState.quality}</span>
                            </button>

                            {showQualityMenu && (
                              <div className="bg-black/95 py-1">
                                {qualityOptions.map((quality) => (
                                  <button
                                    key={quality}
                                    onClick={() => changeQuality(quality)}
                                    className={`w-full px-8 py-2 text-left text-sm hover:bg-white/10 ${
                                      playerState.quality === quality ? 'text-[#ff0000]' : ''
                                    }`}
                                  >
                                    {quality}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Subtitles */}
                            <button
                              onClick={() => setShowSubtitleMenu(!showSubtitleMenu)}
                              className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center justify-between"
                            >
                              <span>Subtitles</span>
                              <span className="text-sm text-gray-400">
                                {playerState.subtitles.enabled ? playerState.subtitles.language : 'Off'}
                              </span>
                            </button>

                            {showSubtitleMenu && (
                              <div className="bg-black/95 py-1">
                                {subtitleLanguages.map((language) => (
                                  <button
                                    key={language}
                                    onClick={() => changeSubtitle(language)}
                                    className={`w-full px-8 py-2 text-left text-sm hover:bg-white/10 ${
                                      (language === 'Off' && !playerState.subtitles.enabled) ||
                                      (language !== 'Off' && playerState.subtitles.language === language)
                                        ? 'text-[#ff0000]' : ''
                                    }`}
                                  >
                                    {language}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Playback Speed */}
                            <div className="border-t border-white/20 mt-2 pt-2">
                              <div className="px-4 py-1 text-sm text-gray-400">Speed</div>
                              {playbackRates.map((rate) => (
                                <button
                                  key={rate}
                                  onClick={() => changePlaybackRate(rate)}
                                  className={`w-full px-4 py-2 text-left text-sm hover:bg-white/10 ${
                                    playerState.playbackRate === rate ? 'text-[#ff0000]' : ''
                                  }`}
                                >
                                  {rate}x
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Picture in Picture */}
                    <button
                      onClick={togglePictureInPicture}
                      className="p-2 text-white hover:text-[#ff0000] transition-colors"
                    >
                      <PictureInPicture2 className="h-6 w-6" />
                    </button>

                    {/* Fullscreen */}
                    <button
                      onClick={toggleFullscreen}
                      className="p-2 text-white hover:text-[#ff0000] transition-colors"
                    >
                      {playerState.isFullscreen ? (
                        <Minimize className="h-6 w-6" />
                      ) : (
                        <Maximize className="h-6 w-6" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default VideoPlayer;