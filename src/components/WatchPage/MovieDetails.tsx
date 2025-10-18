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

/**
 * Format a number as USD currency without fractional digits.
 * Exported for unit tests.
 * @param amount - The amount in USD to format.
 * @returns Formatted currency string (e.g. "$1,000").
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format an ISO date string into a human readable date.
 * Returns "Unknown" for missing or invalid dates to avoid showing "Invalid Date".
 * Exported for unit tests.
 * @param dateString - ISO date string (e.g. "2023-08-21")
 * @returns Localized date string or "Unknown" if invalid.
 */
export const formatDate = (dateString?: string | null): string => {
  if (!dateString) return 'Unknown';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Safely extracts the year from an ISO date string.
 * Returns empty string if date is missing or invalid.
 * Exported for unit tests.
 * @param dateString - ISO date string
 * @returns Year as string (e.g. "2023") or empty string.
 */
export const getYearFromDate = (dateString?: string | null): string => {
  if (!dateString) return '';
  const y = new Date(dateString).getFullYear();
  return Number.isNaN(y) ? '' : String(y);
};

/**
 * Determine rating color class based on numeric rating.
 * Exported for unit tests.
 * @param rating - Numeric rating (0-10)
 * @returns Tailwind color class string.
 */
export const getRatingColor = (rating: number = 0): string => {
  if (rating >= 8) return 'text-green-400';
  if (rating >= 6) return 'text-yellow-400';
  return 'text-red-400';
};

/**
 * Return the primary language name or fallback to "English".
 * Exported for unit tests.
 * @param content - Movie or TVShow object
 * @returns English name of primary spoken language.
 */
export const getPrimaryLanguage = (content: Movie | TVShow): string => {
  const firstLang = content.spoken_languages && content.spoken_languages[0];
  return firstLang?.english_name || firstLang?.name || 'English';
};

/**
 * Returns an object describing spoken language tags (first up to `limit` items)
 * and the number of additional languages available.
 * Exported for unit tests.
 * @param content - Movie or TVShow object
 * @param limit - Maximum number of tags to return
 * @returns { tags: string[], extraCount: number }
 */
export const getSpokenLanguageTags = (content: Movie | TVShow, limit = 3): { tags: string[]; extraCount: number } => {
  const langs = content.spoken_languages || [];
  // Normalize to readable names and filter out missing entries.
  const normalizedNames = langs.map((l) => l?.english_name || l?.name || '').filter(Boolean);
  const tags = normalizedNames.slice(0, limit);
  const extraCount = Math.max(0, normalizedNames.length - tags.length);
  return { tags, extraCount };
};

/**
 * Sanitize API response content to ensure expected fields exist with safe defaults.
 * This prevents runtime errors in the UI when backend responses omit fields.
 * This function is intentionally conservative: it only fills defaults for
 * the fields that the component relies on for rendering.
 * @param content - Raw API content for Movie or TVShow
 * @returns Sanitized copy of the content with safe defaults applied.
 */
export const sanitizeContent = <T extends Movie | TVShow>(content: T): T => {
  // Use object spread to avoid mutating the original object.
  const sanitized: any = {
    ...content,
    release_date: (content as any).release_date || '',
    first_air_date: (content as any).first_air_date || '',
    runtime: (content as any).runtime || 0,
    episode_run_time: (content as any).episode_run_time || [],
    number_of_seasons: (content as any).number_of_seasons || 0,
    number_of_episodes: (content as any).number_of_episodes || 0,
    status: (content as any).status || 'Unknown',
    spoken_languages: (content as any).spoken_languages || [],
    budget: (content as any).budget || 0,
    revenue: (content as any).revenue || 0,
    vote_average: typeof (content as any).vote_average === 'number' ? (content as any).vote_average : 0,
    imdb_id: (content as any).imdb_id || '',
    homepage: (content as any).homepage || '',
    vote_count: (content as any).vote_count || 0,
  };

  return sanitized as T;
};

/**
 * Format runtime in minutes for display.
 * Returns "0 minutes" if unknown.
 * Exported for unit tests.
 * @param movie - Movie object (may be null)
 * @param tvShow - TVShow object (may be null)
 * @param type - 'movie' | 'tv'
 * @returns Formatted runtime string (e.g. "120 minutes")
 */
export const formatRuntimeMinutes = (movie: Movie | null, tvShow: TVShow | null, type: 'movie' | 'tv'): string => {
  if (type === 'movie') {
    const minutes = movie?.runtime ?? 0;
    return `${minutes} minutes`;
  } else {
    const minutes = tvShow?.episode_run_time?.[0] ?? 0;
    return `${minutes} minutes`;
  }
};

/**
 * MovieDetails component
 *
 * Renders detailed metadata for a movie or TV show.
 * The component accepts content that comes directly from the API and uses
 * internal helpers to sanitize and format fields, preventing rendering errors
 * caused by missing backend data.
 */
const MovieDetails: React.FC<MovieDetailsProps> = ({ content, type }) => {
  // Centralize input sanitation to avoid sprinkling defensive checks throughout the JSX.
  const data = sanitizeContent(content);

  const movie = type === 'movie' ? (data as Movie) : null;
  const tvShow = type === 'tv' ? (data as TVShow) : null;

  const languageTags = getSpokenLanguageTags(data, 3);

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
              {formatDate(type === 'movie' ? movie?.release_date : tvShow?.first_air_date)}
            </div>
            <div className="text-gray-500 text-sm">
              {getYearFromDate(type === 'movie' ? movie?.release_date : tvShow?.first_air_date)}
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
              {formatRuntimeMinutes(movie, tvShow, type)}
            </div>
            {type === 'movie' && movie?.runtime ? (
              <div className="text-gray-500 text-sm">
                {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
              </div>
            ) : null}
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
              {getPrimaryLanguage(data)}
            </div>
            {data.spoken_languages && data.spoken_languages.length > 1 && (
              <div className="text-gray-500 text-sm">
                +{data.spoken_languages.length - 1} more languages
              </div>
            )}
          </div>
        </div>

        {/* Available Languages */}
        {data.spoken_languages && data.spoken_languages.length > 0 && (
          <div className="flex items-start space-x-3">
            <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <span className="text-gray-400 text-sm">Spoken Languages</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {languageTags.tags.map((lang) => (
                  <span
                    key={lang}
                    className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                  >
                    {lang}
                  </span>
                ))}
                {languageTags.extraCount > 0 && (
                  <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                    +{languageTags.extraCount} more
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
                        i < Math.floor(data.vote_average / 2)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <span className={`font-semibold ${getRatingColor(data.vote_average)}`}>
                  {data.vote_average.toFixed(1)}
                </span>
              </div>
            </div>

            {/* IMDb Rating (placeholder) */}
            {data.imdb_id && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-[#f5c518] rounded flex items-center justify-center">
                    <span className="text-black text-xs font-bold">IMDb</span>
                  </div>
                  <span className="text-gray-300">IMDb</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-400 font-semibold">
                    {(data.vote_average * 0.9 + Math.random() * 0.2).toFixed(1)}
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
                  {Math.floor(data.vote_average * 10 + Math.random() * 10)}%
                </span>
                <span className="text-gray-500">🍅</span>
              </div>
            </div>
          </div>
        </div>

        {/* External Links */}
        {(data.homepage || data.imdb_id) && (
          <div className="border-t border-gray-700 pt-4">
            <h4 className="text-white font-semibold mb-3 flex items-center">
              <ExternalLink className="h-4 w-4 mr-2" />
              External Links
            </h4>
            
            <div className="space-y-2">
              {data.homepage && (
                <a
                  href={data.homepage}
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
              
              {data.imdb_id && (
                <a
                  href={`https://www.imdb.com/title/${data.imdb_id}`}
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
            Based on {data.vote_count.toLocaleString()} votes
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default MovieDetails;