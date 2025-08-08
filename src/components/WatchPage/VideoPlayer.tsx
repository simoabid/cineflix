import React, { useState, useRef, useEffect } from 'react';
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

interface VideoPlayerProps {
  content: Movie | TVShow;
  trailer?: Video;
  onClose: () => void;
  watchProgress?: WatchProgress | null;
  onProgressUpdate: (progress: WatchProgress) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  content,
  trailer,
  onClose,
  watchProgress,
  onProgressUpdate
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [hideControlsTimeout, setHideControlsTimeout] = useState<number | null>(null);

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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setPlayerState(prev => ({
        ...prev,
        duration: video.duration,
        loading: false
      }));

      // Resume from saved progress
      if (watchProgress) {
        video.currentTime = watchProgress.currentTime;
      }
    };

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      const duration = video.duration;
      const percentage = duration > 0 ? (currentTime / duration) * 100 : 0;

      setPlayerState(prev => ({
        ...prev,
        currentTime,
        duration
      }));

      // Update watch progress
      if (duration > 0) {
        const progress: WatchProgress = {
          contentId: content.id,
          contentType: 'title' in content ? 'movie' : 'tv',
          currentTime,
          duration,
          percentage,
          lastWatched: new Date().toISOString()
        };
        onProgressUpdate(progress);
      }
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const buffered = (video.buffered.end(0) / video.duration) * 100;
        setPlayerState(prev => ({ ...prev, buffered }));
      }
    };

    const handlePlay = () => {
      setPlayerState(prev => ({ ...prev, isPlaying: true }));
    };

    const handlePause = () => {
      setPlayerState(prev => ({ ...prev, isPlaying: false }));
    };

    const handleVolumeChange = () => {
      setPlayerState(prev => ({
        ...prev,
        volume: video.volume,
        isMuted: video.muted
      }));
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [content.id, watchProgress, onProgressUpdate]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          video.currentTime = Math.min(video.duration, video.currentTime + 10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          video.volume = Math.min(1, video.volume + 0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          video.volume = Math.max(0, video.volume - 0.1);
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
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [playerState.isFullscreen]);

  const showControlsTemporarily = () => {
    setShowControls(true);
    if (hideControlsTimeout) {
      clearTimeout(hideControlsTimeout);
    }
    const timeout = setTimeout(() => {
      setShowControls(false);
    }, 3000);
    setHideControlsTimeout(timeout);
  };

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
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
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
      setPlayerState(prev => ({ ...prev, isFullscreen: true }));
    } else {
      document.exitFullscreen();
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
      console.error('Picture-in-picture error:', error);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const progressBar = progressRef.current;
    if (!video || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    video.currentTime = percentage * video.duration;
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
  };

  const changeQuality = (quality: string) => {
    setPlayerState(prev => ({ ...prev, quality }));
    setShowQualityMenu(false);
    setShowSettings(false);
    showControlsTemporarily();
    // In a real app, this would switch the video source
    console.log('Quality changed to:', quality);
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
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = playerState.duration > 0 
    ? (playerState.currentTime / playerState.duration) * 100 
    : 0;

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
          poster={`https://image.tmdb.org/t/p/original${content.backdrop_path}`}
        >
          {trailer && (
            <source 
              src={`https://www.youtube.com/watch?v=${trailer.key}`} 
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