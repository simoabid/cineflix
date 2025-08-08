import React from 'react';
import { Film, Sparkles } from 'lucide-react';

const CollectionsLoading: React.FC = () => {
  return (
    <div className="min-h-screen bg-netflix-black text-white">
      {/* Hero Section Skeleton */}
      <div className="relative h-[70vh] bg-gradient-to-br from-gray-800 via-gray-900 to-netflix-black overflow-hidden">
        {/* Animated background particles */}
        <div className="absolute inset-0">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              <Sparkles className="w-4 h-4 text-red-500/30" />
            </div>
          ))}
        </div>

        {/* Hero content skeleton */}
        <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-netflix-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
          <div className="space-y-4">
            {/* Title skeleton with shimmer */}
            <div className="relative overflow-hidden">
              <div className="h-16 bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 rounded-lg w-96 animate-pulse" />
            </div>
            
            {/* Description skeleton */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-700 rounded w-full max-w-2xl animate-pulse" />
              <div className="h-4 bg-gray-700 rounded w-3/4 max-w-2xl animate-pulse" />
            </div>
            
            {/* Stats skeleton */}
            <div className="flex gap-6 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gray-700 rounded animate-pulse" />
                <div className="h-4 bg-gray-700 rounded w-16 animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gray-700 rounded animate-pulse" />
                <div className="h-4 bg-gray-700 rounded w-20 animate-pulse" />
              </div>
            </div>
            
            {/* Buttons skeleton */}
            <div className="flex gap-4 mt-8">
              <div className="h-12 bg-red-600/30 rounded w-40 animate-pulse" />
              <div className="h-12 bg-gray-700/30 rounded w-36 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="container mx-auto px-4 py-8">
        {/* Loading indicator with film icon */}
        <div className="flex items-center justify-center mb-12">
          <div className="relative">
            <Film className="w-12 h-12 text-red-500 animate-spin" style={{ animationDuration: '3s' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
            </div>
          </div>
          <div className="ml-4 space-y-2">
            <div className="text-xl font-semibold text-white">Loading Collections</div>
            <div className="text-gray-400">Discovering amazing franchises...</div>
          </div>
        </div>

        {/* Filter bar skeleton */}
        <div className="flex flex-wrap gap-4 mb-8 p-4 bg-gray-900/50 rounded-lg">
          <div className="h-10 bg-gray-700 rounded w-32 animate-pulse" />
          <div className="h-10 bg-gray-700 rounded w-28 animate-pulse" />
          <div className="h-10 bg-gray-700 rounded w-36 animate-pulse" />
          <div className="h-10 bg-gray-700 rounded w-24 animate-pulse" />
        </div>

        {/* Categories skeleton */}
        <div className="space-y-12">
          {Array.from({ length: 4 }).map((_, categoryIndex) => (
            <div key={categoryIndex} className="space-y-6">
              {/* Category title */}
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-red-500/30 rounded animate-pulse" />
                <div className="h-8 bg-gray-700 rounded w-48 animate-pulse" />
              </div>
              
              {/* Collection cards grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {Array.from({ length: 10 }).map((_, cardIndex) => (
                  <div 
                    key={cardIndex} 
                    className="group relative animate-pulse"
                    style={{ animationDelay: `${cardIndex * 0.1}s` }}
                  >
                    {/* Card container */}
                    <div className="relative bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700/50 hover:border-red-500/30 transition-all duration-300">
                      {/* Poster collage skeleton */}
                      <div className="aspect-[3/4] bg-gradient-to-br from-gray-700 to-gray-800 relative overflow-hidden">
                        {/* Simulated poster grid */}
                        <div className="grid grid-cols-2 h-full gap-1 p-1">
                          {Array.from({ length: 4 }).map((_, posterIndex) => (
                            <div 
                              key={posterIndex}
                              className="bg-gray-600 rounded animate-pulse"
                              style={{ animationDelay: `${posterIndex * 0.2}s` }}
                            />
                          ))}
                        </div>
                        
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-50" />
                      </div>
                      
                      {/* Card content */}
                      <div className="p-4 space-y-3">
                        {/* Title */}
                        <div className="h-5 bg-gray-700 rounded w-3/4 animate-pulse" />
                        
                        {/* Stats */}
                        <div className="flex justify-between items-center">
                          <div className="h-4 bg-gray-700 rounded w-16 animate-pulse" />
                          <div className="h-4 bg-gray-700 rounded w-12 animate-pulse" />
                        </div>
                        
                        {/* Progress bar */}
                        <div className="space-y-2">
                          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-red-500/30 rounded-full animate-pulse"
                              style={{ width: `${Math.random() * 100}%` }}
                            />
                          </div>
                          <div className="h-3 bg-gray-700 rounded w-20 animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>


    </div>
  );
};

export default CollectionsLoading;
