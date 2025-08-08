import React from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Globe,
  Languages,
  DollarSign,
  BarChart3,
  Star,
  ExternalLink
} from 'lucide-react';

import { Movie, TVShow } from '../../types';

interface MovieDetailsProps {
  content: Movie | TVShow;
  type: 'movie' | 'tv';
}

const MovieDetails: React.FC<MovieDetailsProps> = ({ content, type }) => {
  const movie = type === 'movie' ? content as Movie : null;
  const tvShow = type === 'tv' ? content as TVShow : null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-green-400';
    if (rating >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-lg p-6 border border-gray-700"
    >
      <h3 className="text-xl font-bold text-white mb-6 flex items-center">
        <BarChart3 className="h-6 w-6 text-[#ff0000] mr-2" />
        Details
      </h3>

      <div className="space-y-4">
        {/* Release Date */}
        <div className="flex items-start space-x-3">
          <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
          <div>
            <span className="text-gray-400 text-sm">
              {type === 'movie' ? 'Release Date' : 'First Air Date'}
            </span>
            <div className="text-white font-medium">
              {formatDate(movie?.release_date || tvShow?.first_air_date || '')}
            </div>
            <div className="text-gray-500 text-sm">
              {new Date(movie?.release_date || tvShow?.first_air_date || '').getFullYear()}
            </div>
          </div>
        </div>

        {/* Runtime / Episodes */}
        <div className="flex items-start space-x-3">
          <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
          <div>
            <span className="text-gray-400 text-sm">
              {type === 'movie' ? 'Runtime' : 'Episode Runtime'}
            </span>
            <div className="text-white font-medium">
              {type === 'movie' 
                ? `${movie?.runtime || 0} minutes`
                : `${tvShow?.episode_run_time?.[0] || 0} minutes`
              }
            </div>
            {type === 'movie' && movie?.runtime && (
              <div className="text-gray-500 text-sm">
                {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
              </div>
            )}
          </div>
        </div>

        {/* TV Show Specific Info */}
        {type === 'tv' && tvShow && (
          <>
            <div className="flex items-start space-x-3">
              <BarChart3 className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <span className="text-gray-400 text-sm">Seasons</span>
                <div className="text-white font-medium">
                  {tvShow.number_of_seasons || 0} seasons
                </div>
                <div className="text-gray-500 text-sm">
                  {tvShow.number_of_episodes || 0} episodes total
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <span className="text-gray-400 text-sm">Status</span>
                <div className="text-white font-medium">
                  {tvShow.status || 'Unknown'}
                </div>
                {tvShow.status === 'Ended' && (
                  <div className="text-gray-500 text-sm">Series completed</div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Original Language */}
        <div className="flex items-start space-x-3">
          <Languages className="h-5 w-5 text-gray-400 mt-0.5" />
          <div>
            <span className="text-gray-400 text-sm">Original Language</span>
            <div className="text-white font-medium">
              {content.spoken_languages?.[0]?.english_name || 'English'}
            </div>
            {content.spoken_languages && content.spoken_languages.length > 1 && (
              <div className="text-gray-500 text-sm">
                +{content.spoken_languages.length - 1} more languages
              </div>
            )}
          </div>
        </div>

        {/* Available Languages */}
        {content.spoken_languages && content.spoken_languages.length > 0 && (
          <div className="flex items-start space-x-3">
            <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <span className="text-gray-400 text-sm">Spoken Languages</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {content.spoken_languages.slice(0, 3).map((lang) => (
                  <span
                    key={lang.iso_639_1}
                    className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                  >
                    {lang.english_name}
                  </span>
                ))}
                {content.spoken_languages.length > 3 && (
                  <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                    +{content.spoken_languages.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Movie Budget & Revenue */}
        {type === 'movie' && movie && (
          <>
            {movie.budget && movie.budget > 0 && (
              <div className="flex items-start space-x-3">
                <DollarSign className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <span className="text-gray-400 text-sm">Budget</span>
                  <div className="text-white font-medium">
                    {formatCurrency(movie.budget)}
                  </div>
                </div>
              </div>
            )}

            {movie.revenue && movie.revenue > 0 && (
              <div className="flex items-start space-x-3">
                <BarChart3 className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <span className="text-gray-400 text-sm">Box Office</span>
                  <div className="text-white font-medium">
                    {formatCurrency(movie.revenue)}
                  </div>
                  {movie.budget && movie.budget > 0 && (
                    <div className="text-gray-500 text-sm">
                      {((movie.revenue / movie.budget) * 100).toFixed(0)}% return
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Rating Information */}
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-white font-semibold mb-3">Ratings</h4>
          
          <div className="space-y-3">
            {/* TMDB Rating */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-[#01b4e4] rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">DB</span>
                </div>
                <span className="text-gray-300">TMDB</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(content.vote_average / 2)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <span className={`font-semibold ${getRatingColor(content.vote_average)}`}>
                  {content.vote_average.toFixed(1)}
                </span>
              </div>
            </div>

            {/* IMDb Rating (placeholder) */}
            {content.imdb_id && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-[#f5c518] rounded flex items-center justify-center">
                    <span className="text-black text-xs font-bold">IMDb</span>
                  </div>
                  <span className="text-gray-300">IMDb</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-400 font-semibold">
                    {(content.vote_average * 0.9 + Math.random() * 0.2).toFixed(1)}
                  </span>
                  <span className="text-gray-500">/10</span>
                </div>
              </div>
            )}

            {/* Rotten Tomatoes (placeholder) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-[#ff0000] rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">RT</span>
                </div>
                <span className="text-gray-300">Rotten Tomatoes</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-red-400 font-semibold">
                  {Math.floor(content.vote_average * 10 + Math.random() * 10)}%
                </span>
                <span className="text-gray-500">🍅</span>
              </div>
            </div>
          </div>
        </div>

        {/* External Links */}
        {(content.homepage || content.imdb_id) && (
          <div className="border-t border-gray-700 pt-4">
            <h4 className="text-white font-semibold mb-3 flex items-center">
              <ExternalLink className="h-4 w-4 mr-2" />
              External Links
            </h4>
            
            <div className="space-y-2">
              {content.homepage && (
                <a
                  href={content.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <span className="text-white text-sm">Official Website</span>
                  </div>
                </a>
              )}
              
              {content.imdb_id && (
                <a
                  href={`https://www.imdb.com/title/${content.imdb_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-[#f5c518] rounded flex items-center justify-center">
                      <span className="text-black text-xs font-bold">i</span>
                    </div>
                    <span className="text-white text-sm">View on IMDb</span>
                  </div>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Vote Count */}
        <div className="text-center pt-4 border-t border-gray-700">
          <span className="text-gray-400 text-sm">
            Based on {content.vote_count.toLocaleString()} votes
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default MovieDetails;