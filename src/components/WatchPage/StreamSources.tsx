import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  CheckCircle,
  Clock,
  Shield
} from 'lucide-react';

import { StreamSource } from '../../types';

interface StreamSourcesProps {
  sources: StreamSource[];
  onSourceSelect?: (source: StreamSource) => void;
  selectedSource?: StreamSource | null;
}

const StreamSources: React.FC<StreamSourcesProps> = ({ sources, onSourceSelect, selectedSource }) => {
  const [loadingSource, setLoadingSource] = useState<string | null>(null);

  // Group sources by service provider
  const rivestreamSources = sources.filter(source => source.id.startsWith('rivestream_server_'));
  const rivestreamS2Sources = sources.filter(source => source.id.startsWith('rivestream_s2_'));
  const vidsrcSources = sources.filter(source => source.id.startsWith('vidsrc_api_'));
  const vidsrcPremiumSources = sources.filter(source => source.id.startsWith('vidsrc_premium_'));
  const smashystreamSources = sources.filter(source => source.id.startsWith('smashystream_'));
  const movies111Sources = sources.filter(source => source.id.startsWith('111movies_'));
  const otherSources = sources.filter(source => 
    !source.id.startsWith('rivestream_server_') && 
    !source.id.startsWith('rivestream_s2_') &&
    !source.id.startsWith('vidsrc_api_') &&
    !source.id.startsWith('vidsrc_premium_') &&
    !source.id.startsWith('smashystream_') &&
    !source.id.startsWith('111movies_')
  );



  const handleSelectSource = async (source: StreamSource) => {
    // Don't allow selection of placeholder sources
    if (source.url === '') {
      return;
    }

    setLoadingSource(source.id);
    
    // Simulate loading time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setLoadingSource(null);
    
    // Update parent component
    if (onSourceSelect) {
      onSourceSelect(source);
    }
    
    console.log('Loading stream from:', source.name, source.url);
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case '4K':
        return 'text-purple-400 bg-purple-500/20';
      case 'FHD':
        return 'text-blue-400 bg-blue-500/20';
      case 'HD':
        return 'text-green-400 bg-green-500/20';
      case 'SD':
        return 'text-yellow-400 bg-yellow-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };



  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hls':
        return '🎬';
      case 'direct':
        return '⚡';
      case 'mp4':
        return '📹';
      default:
        return '🔗';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Play className="h-6 w-6 text-[#ff0000]" />
          <h2 className="text-2xl font-bold text-white">Stream Sources</h2>
          <span className="px-2 py-1 bg-[#ff0000] text-white text-sm rounded-full">
            {sources.length} Available
          </span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Clock className="h-4 w-4" />
          <span>Auto-quality based on connection</span>
        </div>
      </div>

      {/* Selected Source Info */}
      {selectedSource && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#ff0000]/10 border border-[#ff0000]/30 rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Now Streaming</h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm">Live</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Source:</span>
              <div className="text-white font-medium">{selectedSource.name}</div>
            </div>
            <div>
              <span className="text-gray-400">Quality:</span>
              <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getQualityColor(selectedSource.quality)}`}>
                {selectedSource.quality}
              </div>
            </div>
            <div>
              <span className="text-gray-400">Size:</span>
              <div className="text-white font-medium">{selectedSource.fileSize}</div>
            </div>
            <div>
              <span className="text-gray-400">Type:</span>
              <div className="text-white font-medium flex items-center space-x-1">
                <span>{getTypeIcon(selectedSource.type)}</span>
                <span>{selectedSource.type.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

            {/* Compact Sources Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* 1st - Vidjoy Card */}
        {otherSources.filter(s => s.id === 'vidjoy_player').length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => {
              const vidjoySource = otherSources.find(s => s.id === 'vidjoy_player');
              if (vidjoySource && vidjoySource.url !== '') handleSelectSource(vidjoySource);
            }}
            className={`relative rounded-lg p-4 border-2 transition-all duration-300 cursor-pointer ${
              otherSources.some(s => s.id === 'vidjoy_player' && selectedSource?.id === s.id)
                ? 'border-[#ff0000] bg-[#ff0000]/10' 
                : 'bg-gray-800 border-gray-700 hover:border-gray-600 hover:bg-gray-750'
            }`}
          >
            {/* Active Indicator */}
            {otherSources.some(s => s.id === 'vidjoy_player' && selectedSource?.id === s.id) && (
              <div className="absolute top-2 right-2 w-3 h-3 bg-[#ff0000] rounded-full">
                <div className="w-2 h-2 bg-white rounded-full absolute top-0.5 left-0.5"></div>
              </div>
            )}

            {/* Service Icon/Branding */}
            <div className="flex flex-col items-center text-center">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mb-2">
                <span className="text-lg">🎬</span>
              </div>
              
              {/* Service Name */}
              <h3 className="text-white font-medium text-sm mb-1 leading-tight">
                Vidjoy
              </h3>

              {/* Status Text */}
              <p className="text-gray-400 text-xs mb-2">
                {otherSources.some(s => s.id === 'vidjoy_player' && selectedSource?.id === s.id) ? (
                  <span className="text-[#ff0000] font-medium">✓ Active</span>
                ) : otherSources.some(s => s.id === 'vidjoy_player' && loadingSource === s.id) ? (
                  <span className="text-yellow-400">Loading...</span>
                ) : (
                  'Click to switch'
                )}
              </p>

              {/* Quality Badge */}
              <div className="inline-flex items-center px-2 py-1 rounded text-xs font-medium text-purple-400 bg-purple-500/20">
                FHD
              </div>

              {/* Loading Spinner */}
              {otherSources.some(s => s.id === 'vidjoy_player' && loadingSource === s.id) && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80 rounded-lg">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#ff0000] border-t-transparent"></div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* 2nd - CinemaOS Card */}
        {otherSources.filter(s => s.id === 'cinemaos_player').length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => {
              const cinemaosSource = otherSources.find(s => s.id === 'cinemaos_player');
              if (cinemaosSource && cinemaosSource.url !== '') handleSelectSource(cinemaosSource);
            }}
            className={`relative rounded-lg p-4 border-2 transition-all duration-300 cursor-pointer ${
              otherSources.some(s => s.id === 'cinemaos_player' && selectedSource?.id === s.id)
                ? 'border-[#ff0000] bg-[#ff0000]/10' 
                : 'bg-gray-800 border-gray-700 hover:border-gray-600 hover:bg-gray-750'
            }`}
          >
            {/* Active Indicator */}
            {otherSources.some(s => s.id === 'cinemaos_player' && selectedSource?.id === s.id) && (
              <div className="absolute top-2 right-2 w-3 h-3 bg-[#ff0000] rounded-full">
                <div className="w-2 h-2 bg-white rounded-full absolute top-0.5 left-0.5"></div>
              </div>
            )}

            {/* Service Icon/Branding */}
            <div className="flex flex-col items-center text-center">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mb-2">
                <span className="text-lg">🎭</span>
            </div>

              {/* Service Name */}
              <h3 className="text-white font-medium text-sm mb-1 leading-tight">
                CinemaOS
              </h3>

              {/* Status Text */}
              <p className="text-gray-400 text-xs mb-2">
                {otherSources.some(s => s.id === 'cinemaos_player' && selectedSource?.id === s.id) ? (
                  <span className="text-[#ff0000] font-medium">✓ Active</span>
                ) : otherSources.some(s => s.id === 'cinemaos_player' && loadingSource === s.id) ? (
                  <span className="text-yellow-400">Loading...</span>
                ) : (
                  'Click to switch'
                )}
              </p>

              {/* Quality Badge */}
              <div className="inline-flex items-center px-2 py-1 rounded text-xs font-medium text-blue-400 bg-blue-500/20">
                FHD
              </div>

              {/* Loading Spinner */}
              {otherSources.some(s => s.id === 'cinemaos_player' && loadingSource === s.id) && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80 rounded-lg">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#ff0000] border-t-transparent"></div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* 3rd - RiveStream S2 Card */}
        {rivestreamS2Sources.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => rivestreamS2Sources.length > 0 && handleSelectSource(rivestreamS2Sources[0])}
            className={`relative rounded-lg p-4 border-2 transition-all duration-300 cursor-pointer ${
              rivestreamS2Sources.some(s => selectedSource?.id === s.id)
                ? 'border-[#ff0000] bg-[#ff0000]/10' 
                : 'bg-gray-800 border-gray-700 hover:border-gray-600 hover:bg-gray-750'
            }`}
          >
            {/* Active Indicator */}
            {rivestreamS2Sources.some(s => selectedSource?.id === s.id) && (
              <div className="absolute top-2 right-2 w-3 h-3 bg-[#ff0000] rounded-full">
                <div className="w-2 h-2 bg-white rounded-full absolute top-0.5 left-0.5"></div>
              </div>
            )}

            {/* Service Icon/Branding */}
            <div className="flex flex-col items-center text-center">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-lg flex items-center justify-center mb-2">
                <span className="text-lg">🚀</span>
              </div>
              
              {/* Service Name */}
              <h3 className="text-white font-medium text-sm mb-1 leading-tight">
                RiveStream S2
              </h3>

              {/* Status Text */}
              <p className="text-gray-400 text-xs mb-2">
                {rivestreamS2Sources.some(s => selectedSource?.id === s.id) ? (
                  <span className="text-[#ff0000] font-medium">✓ Active</span>
                ) : rivestreamS2Sources.some(s => loadingSource === s.id) ? (
                  <span className="text-yellow-400">Loading...</span>
                ) : (
                  'Server 2 Variant'
                )}
              </p>

              {/* Quality Badge */}
              {rivestreamS2Sources.length > 0 && (
                <div className="inline-flex items-center px-2 py-1 rounded text-xs font-medium text-purple-400 bg-purple-500/20">
                  4K
                </div>
              )}

              {/* Loading Spinner */}
              {rivestreamS2Sources.some(s => loadingSource === s.id) && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80 rounded-lg">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#ff0000] border-t-transparent"></div>
                </div>
                      )}
                    </div>
          </motion.div>
        )}

        {/* 4th - VidSrc Premium Card */}
        {vidsrcPremiumSources.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            onClick={() => vidsrcPremiumSources.length > 0 && handleSelectSource(vidsrcPremiumSources[0])}
            className={`relative rounded-lg p-4 border-2 transition-all duration-300 cursor-pointer ${
              vidsrcPremiumSources.some(s => selectedSource?.id === s.id)
                ? 'border-[#ff0000] bg-[#ff0000]/10' 
                : 'bg-gray-800 border-gray-700 hover:border-gray-600 hover:bg-gray-750'
            }`}
          >
            {/* Active Indicator */}
            {vidsrcPremiumSources.some(s => selectedSource?.id === s.id) && (
              <div className="absolute top-2 right-2 w-3 h-3 bg-[#ff0000] rounded-full">
                <div className="w-2 h-2 bg-white rounded-full absolute top-0.5 left-0.5"></div>
              </div>
            )}

            {/* Service Icon/Branding */}
            <div className="flex flex-col items-center text-center">
              <div className="w-8 h-8 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-lg flex items-center justify-center mb-2">
                <span className="text-lg">⭐</span>
              </div>
              
              {/* Service Name */}
              <h3 className="text-white font-medium text-sm mb-1 leading-tight">
                VidSrc Premium
              </h3>

              {/* Status Text */}
              <p className="text-gray-400 text-xs mb-2">
                {vidsrcPremiumSources.some(s => selectedSource?.id === s.id) ? (
                  <span className="text-[#ff0000] font-medium">✓ Active</span>
                ) : vidsrcPremiumSources.some(s => loadingSource === s.id) ? (
                  <span className="text-yellow-400">Loading...</span>
                ) : (
                  'API 4 Premium'
                )}
              </p>

              {/* Quality Badge */}
              {vidsrcPremiumSources.length > 0 && (
                <div className="inline-flex items-center px-2 py-1 rounded text-xs font-medium text-amber-400 bg-amber-500/20">
                  4K
                </div>
              )}

              {/* Loading Spinner */}
              {vidsrcPremiumSources.some(s => loadingSource === s.id) && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80 rounded-lg">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#ff0000] border-t-transparent"></div>
                    </div>
              )}
            </div>
          </motion.div>
        )}

        {/* 5th - Rivestream Card with Internal Options */}
        {rivestreamSources.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`relative rounded-lg p-4 border-2 transition-all duration-300 ${
              rivestreamSources.some(s => selectedSource?.id === s.id)
                ? 'border-[#ff0000] bg-[#ff0000]/10' 
                : 'bg-gray-800 border-gray-700 hover:border-gray-600'
            }`}
          >
            {/* Active Indicator */}
            {rivestreamSources.some(s => selectedSource?.id === s.id) && (
              <div className="absolute top-2 right-2 w-3 h-3 bg-[#ff0000] rounded-full">
                <div className="w-2 h-2 bg-white rounded-full absolute top-0.5 left-0.5"></div>
              </div>
            )}

            {/* Rivestream Header */}
            <div className="flex flex-col items-center text-center mb-3">
              <div className="w-8 h-8 bg-[#ff0000]/20 rounded-lg flex items-center justify-center mb-2">
                <span className="text-lg">📡</span>
              </div>
              <h3 className="text-white font-medium text-sm mb-1">Rivestream</h3>
              <p className="text-gray-400 text-xs mb-2">
                {rivestreamSources.some(s => selectedSource?.id === s.id) ? (
                  <span className="text-[#ff0000] font-medium">✓ Active</span>
                ) : (
                  'Multiple servers'
                )}
              </p>
            </div>

            {/* Server Options */}
            <div className="space-y-1">
              {rivestreamSources.map((source) => {
                const isLoading = loadingSource === source.id;
                const isSelected = selectedSource?.id === source.id;
                const isDefault = source.id === 'rivestream_server_2';
                const serverNum = source.id.split('_')[2];
                
                return (
                  <button
                    key={source.id}
                    onClick={() => handleSelectSource(source)}
                    disabled={isLoading}
                    className={`w-full px-2 py-1 rounded text-xs font-medium transition-all duration-300 flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#ff0000] text-white'
                        : isLoading
                        ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Server {serverNum}</span>
                      {isDefault && !isSelected && (
                        <span className="text-blue-400">★</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                      ) : isSelected ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <div className={`w-2 h-2 rounded-full ${getQualityColor(source.quality).includes('purple') ? 'bg-purple-400' : getQualityColor(source.quality).includes('blue') ? 'bg-blue-400' : 'bg-green-400'}`}></div>
                      )}
                      <span className="text-xs">{source.quality}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* VidSrc Card with Internal Options */}
        {vidsrcSources.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className={`relative rounded-lg p-4 border-2 transition-all duration-300 ${
              vidsrcSources.some(s => selectedSource?.id === s.id)
                ? 'border-[#ff0000] bg-[#ff0000]/10' 
                : 'bg-gray-800 border-gray-700 hover:border-gray-600'
            }`}
          >
            {/* Active Indicator */}
            {vidsrcSources.some(s => selectedSource?.id === s.id) && (
              <div className="absolute top-2 right-2 w-3 h-3 bg-[#ff0000] rounded-full">
                <div className="w-2 h-2 bg-white rounded-full absolute top-0.5 left-0.5"></div>
              </div>
            )}

            {/* VidSrc Header */}
            <div className="flex flex-col items-center text-center mb-3">
              <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center mb-2">
                <span className="text-lg">🎥</span>
              </div>
              <h3 className="text-white font-medium text-sm mb-1">VidSrc</h3>
              <p className="text-gray-400 text-xs mb-2">
                {vidsrcSources.some(s => selectedSource?.id === s.id) ? (
                  <span className="text-[#ff0000] font-medium">✓ Active</span>
                ) : (
                  '4 API variants'
                )}
              </p>
            </div>

            {/* API Options */}
            <div className="space-y-1">
              {vidsrcSources.map((source) => {
                const isLoading = loadingSource === source.id;
                const isSelected = selectedSource?.id === source.id;
                const apiNum = source.id.split('_')[2];
                
                // Get API description
                const getAPIDescription = (api: string) => {
                  switch(api) {
                    case '1': return 'Multi Server';
                    case '2': return 'Multi Language';
                    case '3': return 'Multi Embeds';
                    case '4': return 'Premium';
                    default: return `API ${api}`;
                  }
                };
                
                return (
                  <button
                    key={source.id}
                    onClick={() => handleSelectSource(source)}
                    disabled={isLoading}
                    className={`w-full px-2 py-1 rounded text-xs font-medium transition-all duration-300 flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#ff0000] text-white'
                        : isLoading
                        ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center space-x-1">
                      <span>API {apiNum}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-xs">{getAPIDescription(apiNum)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                      ) : isSelected ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <div className={`w-2 h-2 rounded-full ${source.isAdFree ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                      )}
                      <span className="text-xs">{source.quality}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* SmashyStream Card */}
        {smashystreamSources.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => smashystreamSources.length > 0 && handleSelectSource(smashystreamSources[0])}
            className={`relative rounded-lg p-4 border-2 transition-all duration-300 cursor-pointer ${
              smashystreamSources.some(s => selectedSource?.id === s.id)
                ? 'border-[#ff0000] bg-[#ff0000]/10' 
                : 'bg-gray-800 border-gray-700 hover:border-gray-600 hover:bg-gray-750'
            }`}
          >
            {/* Active Indicator */}
            {smashystreamSources.some(s => selectedSource?.id === s.id) && (
              <div className="absolute top-2 right-2 w-3 h-3 bg-[#ff0000] rounded-full">
                <div className="w-2 h-2 bg-white rounded-full absolute top-0.5 left-0.5"></div>
              </div>
            )}

            {/* Service Icon/Branding */}
            <div className="flex flex-col items-center text-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center mb-2">
                <span className="text-lg">⚡</span>
              </div>
              
              {/* Service Name */}
              <h3 className="text-white font-medium text-sm mb-1 leading-tight">
                SmashyStream
              </h3>

              {/* Status Text */}
              <p className="text-gray-400 text-xs mb-2">
                {smashystreamSources.some(s => selectedSource?.id === s.id) ? (
                  <span className="text-[#ff0000] font-medium">✓ Active</span>
                ) : smashystreamSources.some(s => loadingSource === s.id) ? (
                  <span className="text-yellow-400">Loading...</span>
                ) : (
                  'Click to switch'
                )}
              </p>

              {/* Quality Badge */}
              {smashystreamSources.length > 0 && (
                <div className="inline-flex items-center px-2 py-1 rounded text-xs font-medium text-blue-400 bg-blue-500/20">
                  FHD
                </div>
              )}

              {/* Loading Spinner */}
              {smashystreamSources.some(s => loadingSource === s.id) && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80 rounded-lg">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#ff0000] border-t-transparent"></div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* 111movies Card */}
        {movies111Sources.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={() => movies111Sources.length > 0 && handleSelectSource(movies111Sources[0])}
            className={`relative rounded-lg p-4 border-2 transition-all duration-300 cursor-pointer ${
              movies111Sources.some(s => selectedSource?.id === s.id)
                ? 'border-[#ff0000] bg-[#ff0000]/10' 
                : 'bg-gray-800 border-gray-700 hover:border-gray-600 hover:bg-gray-750'
            }`}
          >
            {/* Active Indicator */}
            {movies111Sources.some(s => selectedSource?.id === s.id) && (
              <div className="absolute top-2 right-2 w-3 h-3 bg-[#ff0000] rounded-full">
                <div className="w-2 h-2 bg-white rounded-full absolute top-0.5 left-0.5"></div>
              </div>
            )}

            {/* Service Icon/Branding */}
            <div className="flex flex-col items-center text-center">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg flex items-center justify-center mb-2">
                <span className="text-lg">🎯</span>
              </div>
              
              {/* Service Name */}
              <h3 className="text-white font-medium text-sm mb-1 leading-tight">
                111movies
              </h3>

              {/* Status Text */}
              <p className="text-gray-400 text-xs mb-2">
                {movies111Sources.some(s => selectedSource?.id === s.id) ? (
                  <span className="text-[#ff0000] font-medium">✓ Active</span>
                ) : movies111Sources.some(s => loadingSource === s.id) ? (
                  <span className="text-yellow-400">Loading...</span>
                ) : (
                  'Click to switch'
                )}
              </p>

              {/* Quality Badge */}
              {movies111Sources.length > 0 && (
                <div className="inline-flex items-center px-2 py-1 rounded text-xs font-medium text-orange-400 bg-orange-500/20">
                  HD
                </div>
              )}

              {/* Loading Spinner */}
              {movies111Sources.some(s => loadingSource === s.id) && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80 rounded-lg">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#ff0000] border-t-transparent"></div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Other Streaming Services */}
        {otherSources.filter(s => s.id !== 'vidjoy_player' && s.id !== 'cinemaos_player').map((source, index) => {
          const isPlaceholder = source.url === '';
          const isLoading = loadingSource === source.id;
          const isSelected = selectedSource?.id === source.id;
          const isBeech = source.id === 'beech_player';
          const isVidFast = source.id === 'vidfast_player';
          
          return (
            <motion.div
              key={source.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (index + 1) * 0.05 }}
              onClick={() => !isPlaceholder && !isLoading && handleSelectSource(source)}
              className={`relative rounded-lg p-4 border-2 transition-all duration-300 cursor-pointer ${
                isSelected 
                  ? 'border-[#ff0000] bg-[#ff0000]/10' 
                  : isPlaceholder 
                  ? 'bg-gray-800/50 border-gray-700/50 opacity-60 cursor-not-allowed' 
                  : 'bg-gray-800 border-gray-700 hover:border-gray-600 hover:bg-gray-750'
              }`}
            >
              {/* Active Indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-3 h-3 bg-[#ff0000] rounded-full">
                  <div className="w-2 h-2 bg-white rounded-full absolute top-0.5 left-0.5"></div>
                  </div>
              )}

              {/* Service Icon/Branding */}
              <div className="flex flex-col items-center text-center">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                  isBeech ? 'bg-green-500/20' : 
                  isVidFast ? 'bg-cyan-500/20' : 'bg-gray-700'
                }`}>
                  <span className="text-lg">
                    {isBeech ? '🌳' : 
                     isVidFast ? '⚡' : getTypeIcon(source.type)}
                  </span>
                </div>
                
                {/* Service Name */}
                <h3 className="text-white font-medium text-sm mb-1 leading-tight">
                  {source.name}
                </h3>

                {/* Status Text */}
                <p className="text-gray-400 text-xs mb-2">
                  {isSelected ? (
                    <span className="text-[#ff0000] font-medium">✓ Active</span>
                  ) : isLoading ? (
                    <span className="text-yellow-400">Loading...</span>
                  ) : isPlaceholder ? (
                    'Coming Soon'
                  ) : (
                    'Click to switch'
                  )}
                </p>

                {/* Quality Badge */}
                {!isPlaceholder && (
                  <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getQualityColor(source.quality)}`}>
                    {source.quality}
                  </div>
                )}

                {/* Loading Spinner */}
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800/80 rounded-lg">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#ff0000] border-t-transparent"></div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-gray-800/50 rounded-lg p-6 border border-gray-700"
      >
        <h3 className="text-white font-semibold mb-3 flex items-center">
          <Shield className="h-5 w-5 text-[#ff0000] mr-2" />
          Streaming Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
          <div className="space-y-2">
            <p>• Vidjoy provides reliable FHD streaming</p>
            <p>• CinemaOS has built-in ad reduction features</p>
            <p>• RiveStream S2 offers dedicated Server 2 variant</p>
            <p>• VidSrc Premium delivers premium 4K quality</p>
            <p>• Rivestream servers offer multiple quality options</p>
          </div>
          <div className="space-y-2">
            <p>• VidSrc Premium uses advanced API 4 technology</p>
            <p>• RiveStream S2 provides premium ad-free experience</p>
            <p>• Rivestream has 3 server variants for reliability</p>
            <p>• Try different servers if one doesn't work</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default StreamSources;