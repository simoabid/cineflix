import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  Search,
  User,
  Calendar,
  Shield,
  AlertTriangle,
  Signal,
  Globe,
  Link,
  FileDown,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';

import { TorrentSource } from '../../types';

interface TorrentSourcesProps {
  sources: TorrentSource[];
}

const TorrentSources: React.FC<TorrentSourcesProps> = ({ sources }) => {
  const [sortBy, setSortBy] = useState<'seeders' | 'size' | 'date' | 'quality'>('seeders');

  const handleMagnetLink = (magnetLink: string) => {
    // Open magnet link with default torrent client
    window.location.href = magnetLink;
  };

  const handleTorrentDownload = (torrentUrl: string) => {
    // Download torrent file
    const link = document.createElement('a');
    link.href = torrentUrl;
    link.download = 'movie.torrent';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyMagnetLink = async (magnetLink: string) => {
    try {
      await navigator.clipboard.writeText(magnetLink);
      // In a real app, show toast notification
      console.log('Magnet link copied to clipboard');
    } catch (error) {
      console.error('Failed to copy magnet link:', error);
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'BluRay':
        return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      case 'WEBRip':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'HDRip':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'TS':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'CAM':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'Excellent':
        return 'text-green-400';
      case 'Good':
        return 'text-blue-400';
      case 'Fair':
        return 'text-yellow-400';
      case 'Poor':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'Excellent':
        return <Signal className="h-4 w-4 text-green-400" />;
      case 'Good':
        return <Signal className="h-4 w-4 text-blue-400" />;
      case 'Fair':
        return <Signal className="h-4 w-4 text-yellow-400" />;
      case 'Poor':
        return <Signal className="h-4 w-4 text-red-400" />;
      default:
        return <Signal className="h-4 w-4 text-gray-400" />;
    }
  };

  const getSeederRatio = (seeders: number, leechers: number) => {
    const total = seeders + leechers;
    return total > 0 ? ((seeders / total) * 100).toFixed(1) : '0';
  };

  const sortedSources = [...sources].sort((a, b) => {
    switch (sortBy) {
      case 'seeders':
        return b.seeders - a.seeders;
      case 'size':
        return parseFloat(b.fileSize) - parseFloat(a.fileSize);
      case 'date':
        return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
      case 'quality':
        const qualityOrder = { 'BluRay': 5, 'WEBRip': 4, 'HDRip': 3, 'TS': 2, 'CAM': 1 };
        return (qualityOrder[b.quality] || 0) - (qualityOrder[a.quality] || 0);
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Search className="h-6 w-6 text-[#ff0000]" />
          <h2 className="text-2xl font-bold text-white">Torrent Sources</h2>
          <span className="px-2 py-1 bg-[#ff0000] text-white text-sm rounded-full">
            {sources.length} Available
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-[#ff0000] focus:outline-none"
          >
            <option value="seeders">Sort by Seeders</option>
            <option value="size">Sort by Size</option>
            <option value="date">Sort by Date</option>
            <option value="quality">Sort by Quality</option>
          </select>
        </div>
      </div>

      {/* VPN Warning */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4"
      >
        <div className="flex items-start space-x-3">
          <ShieldAlert className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-yellow-400 font-semibold mb-1">Privacy Recommendation</h3>
            <p className="text-yellow-200 text-sm">
              For your privacy and security, we recommend using a VPN when downloading torrents. 
              This helps protect your identity and ensures safe torrenting.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Torrent Sources */}
      <div className="space-y-4">
        {sortedSources.map((source, index) => (
          <motion.div
            key={source.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Source Info */}
              <div className="lg:col-span-5">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#ff0000]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Download className="h-6 w-6 text-[#ff0000]" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-white font-semibold text-lg truncate">{source.name}</h3>
                      {source.isTrusted && (
                        <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getQualityColor(source.quality)}`}>
                        {source.quality}
                      </span>
                      <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs">
                        {source.fileSize}
                      </span>
                      {source.releaseGroup && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                          {source.releaseGroup}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      {source.uploadedBy && (
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{source.uploadedBy}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(source.uploadDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="lg:col-span-3">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-green-400 font-semibold text-lg">{source.seeders}</div>
                    <div className="text-gray-400 text-sm">Seeders</div>
                  </div>
                  <div>
                    <div className="text-red-400 font-semibold text-lg">{source.leechers}</div>
                    <div className="text-gray-400 text-sm">Leechers</div>
                  </div>
                  <div>
                    <div className={`font-semibold text-lg ${getHealthColor(source.health)}`}>
                      {getSeederRatio(source.seeders, source.leechers)}%
                    </div>
                    <div className="text-gray-400 text-sm">Ratio</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-center space-x-2 mt-3">
                  {getHealthIcon(source.health)}
                  <span className={`text-sm font-medium ${getHealthColor(source.health)}`}>
                    {source.health}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="lg:col-span-4">
                <div className="flex flex-col space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <motion.button
                      onClick={() => handleMagnetLink(source.magnetLink)}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-[#ff0000] text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                                              <Link className="h-4 w-4" />
                      <span>Magnet</span>
                    </motion.button>
                    
                    {source.torrentFileUrl && (
                      <motion.button
                        onClick={() => handleTorrentDownload(source.torrentFileUrl!)}
                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <FileDown className="h-4 w-4" />
                        <span>File</span>
                      </motion.button>
                    )}
                  </div>
                  
                  <button
                    onClick={() => copyMagnetLink(source.magnetLink)}
                    className="w-full px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    Copy Magnet Link
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Torrent Guide */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-gray-800/50 rounded-lg p-6 border border-gray-700"
      >
        <h3 className="text-white font-semibold mb-4 flex items-center">
          <Shield className="h-5 w-5 text-[#ff0000] mr-2" />
          Torrent Guide & Safety Tips
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-white font-medium mb-2">How to Use Torrents</h4>
            <div className="space-y-2 text-sm text-gray-300">
              <p>• Install a torrent client (qBittorrent, Transmission, etc.)</p>
              <p>• Click "Magnet" to open directly in your torrent client</p>
              <p>• Or download the .torrent file and open it manually</p>
              <p>• Choose download location and start downloading</p>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-2">Quality Guide</h4>
            <div className="space-y-2 text-sm text-gray-300">
              <p>• <span className="text-purple-400">BluRay</span>: Best quality, largest file size</p>
              <p>• <span className="text-blue-400">WEBRip</span>: Good quality, moderate size</p>
              <p>• <span className="text-green-400">HDRip</span>: Decent quality, smaller size</p>
              <p>• <span className="text-yellow-400">TS/CAM</span>: Lower quality, avoid if possible</p>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-2">Health Indicators</h4>
            <div className="space-y-2 text-sm text-gray-300">
              <p>• <span className="text-green-400">Excellent</span>: High seeders, fast download</p>
              <p>• <span className="text-blue-400">Good</span>: Moderate seeders, reliable</p>
              <p>• <span className="text-yellow-400">Fair</span>: Low seeders, slower download</p>
              <p>• <span className="text-red-400">Poor</span>: Very few seeders, may stall</p>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-2">Safety Tips</h4>
            <div className="space-y-2 text-sm text-gray-300">
              <p>• Always use a VPN for privacy protection</p>
              <p>• Choose torrents from trusted uploaders</p>
              <p>• Scan downloaded files with antivirus</p>
              <p>• Seed after downloading to support the community</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-red-400 font-medium mb-1">Legal Disclaimer</p>
              <p className="text-red-300">
                Torrenting copyrighted content may be illegal in your jurisdiction. 
                Use these sources responsibly and in accordance with your local laws.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TorrentSources;