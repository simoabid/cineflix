import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CollectionDetails } from '../types';
import { getPosterUrl, getBackdropUrl } from '../services/tmdb';
import { Play, Calendar, Clock, Star, Film } from 'lucide-react';

/**
 * Ensure the value is an array, returning an empty array otherwise.
 * Exported for unit testing.
 *
 * @template T
 * @param {T[] | undefined | null} value - The value that should be an array.
 * @returns {T[]} A guaranteed array (possibly empty).
 */
export const ensureArray = <T,>(value: T[] | undefined | null): T[] => {
  return Array.isArray(value) ? value : [];
};

/**
 * Safely parse a number, returning a fallback if parsing fails.
 * Exported for unit testing.
 *
 * @param {unknown} value - The value to coerce to number.
 * @param {number} [fallback=0] - The fallback to return if coercion fails.
 * @returns {number} A finite number or the fallback.
 */
export const safeNumber = (value: unknown, fallback = 0): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Safely return a string, or fallback if value is not a non-empty string.
 * Exported for unit testing.
 *
 * @param {unknown} value - The value to validate as a string.
 * @param {string} [fallback=''] - The fallback string when validation fails.
 * @returns {string} A trimmed string or the fallback.
 */
export const safeString = (value: unknown, fallback = ''): string => {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
};

/**
 * Parse a year from a date string. If parsing fails, returns the current year.
 * Exported for unit testing.
 *
 * @param {unknown} dateInput - Input that represents a date (string, Date, etc).
 * @returns {number} The parsed full year or the current year on failure.
 */
export const parseYear = (dateInput: unknown): number => {
  try {
    const d = new Date(String(dateInput || ''));
    const y = d.getFullYear();
    return Number.isFinite(y) ? y : new Date().getFullYear();
  } catch {
    return new Date().getFullYear();
  }
};

/**
 * Format runtime from minutes into a human friendly string (e.g. "2h 10m" or "45m").
 * Exported for unit testing.
 *
 * @param {number} minutes - Total runtime in minutes.
 * @returns {string} Human readable runtime.
 */
export const formatRuntime = (minutes: number): string => {
  const mins = safeNumber(minutes, 0);
  const hours = Math.floor(mins / 60);
  const remainingMinutes = mins % 60;
  if (hours === 0) return `${remainingMinutes}m`;
  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Map internal franchise type to a display label.
 * Exported for unit testing.
 *
 * @param {string} type - Internal franchise type identifier.
 * @returns {string} Human-friendly type label.
 */
export const getTypeDisplayName = (type: string): string => {
  const t = safeString(type, 'incomplete_series').toLowerCase();
  const typeMap: { [key: string]: string } = {
    trilogy: 'Trilogy',
    quadrilogy: 'Quadrilogy',
    pentology: 'Pentology',
    hexalogy: 'Hexalogy',
    septology: 'Septology',
    octology: 'Octology',
    nonology: 'Nonology',
    extended_series: 'Extended Series',
    incomplete_series: 'Series',
  };
  return typeMap[t] || 'Series';
};

/**
 * Map franchise status to a tailwind color class.
 * Exported for unit testing.
 *
 * @param {string} status - Status string (e.g., 'complete', 'ongoing').
 * @returns {string} Tailwind CSS background color class.
 */
export const getStatusColor = (status: string): string => {
  const s = safeString(status, 'unknown').toLowerCase();
  switch (s) {
    case 'complete':
      return 'bg-green-600';
    case 'ongoing':
      return 'bg-blue-600';
    case 'incomplete':
      return 'bg-yellow-600';
    default:
      return 'bg-gray-600';
  }
};

/**
 * Calculate user progress percentage for a collection.
 * Exported for unit testing.
 *
 * @param {CollectionDetails} collection - Collection metadata containing film count and user progress.
 * @returns {number} Progress percentage (0-100).
 */
export const calculateProgress = (collection: CollectionDetails): number => {
  const filmCount = safeNumber(collection?.film_count, 0);
  if (filmCount === 0) return 0;
  const watched = ensureArray(collection?.user_progress?.watched_films).length;
  return (watched / filmCount) * 100;
};

/**
 * Props for FranchiseCard component.
 * @prop collection - The collection metadata to render.
 * @prop onClick - Optional click handler that receives the collection.
 */
interface FranchiseCardProps {
  collection: CollectionDetails;
  onClick?: (collection: CollectionDetails) => void;
}

/**
 * FranchiseCard
 *
 * Renders a card representing a film franchise/collection. The component
 * uses defensive guards for incoming metadata to avoid runtime errors
 * when some fields are missing or malformed.
 */
const FranchiseCard: React.FC<FranchiseCardProps> = ({ collection, onClick }) => {
  const navigate = useNavigate();

  // Defensive local variables derived from collection
  const parts = ensureArray(collection?.parts);
  const genreCategories = ensureArray(collection?.genre_categories);
  const filmCount = safeNumber(collection?.film_count, 0);
  const totalRuntime = safeNumber(collection?.total_runtime, 0);
  const backdropPath = safeString(collection?.backdrop_path, '');
  const statusRaw = safeString(collection?.status, 'unknown');
  const statusLabel = statusRaw.charAt(0).toUpperCase() + statusRaw.slice(1);
  const typeLabel = getTypeDisplayName(safeString(collection?.type, 'incomplete_series'));
  const firstYear = parseYear(collection?.first_release_date);
  const latestYear = parseYear(collection?.latest_release_date);

  const progress = calculateProgress(collection);

  const handleClick = () => {
    if (onClick) {
      onClick(collection);
    } else {
      navigate(`/collection/${collection.id}`);
    }
  };

  return (
    <div
      className="relative group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:z-10"
      onClick={handleClick}
    >
      {/* Main Card */}
      <div className="relative bg-gray-900 rounded-lg overflow-hidden shadow-lg">
        {/* Cover Image */}
        <div className="relative h-64 w-full overflow-hidden bg-gray-900">
          {backdropPath ? (
            <img
              src={getBackdropUrl(backdropPath, 'w780')}
              alt={collection.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/fallback-poster.jpg'; // A generic fallback
                target.onerror = null;
              }}
            />
          ) : parts && parts.length > 0 ? (
            <div className={`grid h-full w-full ${parts.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {parts.slice(0, parts.length >= 4 ? 4 : 2).map((film) => (
                <img
                  key={film.id}
                  src={getPosterUrl(film.poster_path, 'w342')}
                  alt={film.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/fallback-poster.jpg';
                    target.onerror = null;
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <Film className="w-16 h-16 text-gray-500" />
            </div>
          )}
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

          {/* Status Badge */}
          <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(statusRaw)}`}>
            {statusLabel}
          </div>

          {/* Type Badge */}
          <div className="absolute top-3 right-3 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-medium">
            {typeLabel}
          </div>

          {/* Play Button Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-red-600 rounded-full p-4 transform scale-75 group-hover:scale-100 transition-transform">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title */}
          <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-red-400 transition-colors">
            {collection.name}
          </h3>

          {/* Stats Row */}
          <div className="flex items-center space-x-4 text-gray-400 text-sm mb-3">
            <div className="flex items-center space-x-1">
              <Film className="w-4 h-4" />
              <span>{filmCount} Films</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{formatRuntime(totalRuntime)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{firstYear}-{latestYear}</span>
            </div>
          </div>

          {/* Progress Bar */}
          {progress > 0 && (
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-400">Progress</span>
                <span className="text-sm text-white">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Description */}
          <p className="text-gray-300 text-sm line-clamp-2 mb-3">
            {collection.overview || `Experience the complete ${collection.name} franchise with all ${filmCount} films.`}
          </p>

          {/* Genres */}
          <div className="flex flex-wrap gap-1 mb-3">
            {genreCategories.slice(0, 3).map((genre, index) => (
              <span
                key={index}
                className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-xs"
              >
                {genre}
              </span>
            ))}
            {genreCategories.length > 3 && (
              <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-xs">
                +{genreCategories.length - 3}
              </span>
            )}
          </div>

          {/* Poster Collage */}
          <div className="flex -space-x-2 mb-3">
            {parts.slice(0, 4).map((film, index) => (
              <div
                key={film.id}
                className="relative w-8 h-12 border-2 border-gray-900 rounded overflow-hidden"
                style={{ zIndex: 4 - index }}
              >
                <img
                  src={getPosterUrl(film.poster_path, 'w92')}
                  alt={film.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    // Fallback to small themed poster placeholder
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTIiIGhlaWdodD0iMTM4IiB2aWV3Qm94PSIwIDAgOTIgMTM4IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iOTIiIGhlaWdodD0iMTM4IiBmaWxsPSIjMTQxNDE0Ii8+CjxyZWN0IHg9IjMiIHk9IjMiIHdpZHRoPSI4NiIgaGVpZ2h0PSIxMzIiIHJ4PSI0IiBmaWxsPSIjMkEyQTJBIiBzdHJva2U9IiMzNzQxNTEiIHN0cm9rZS13aWR0aD0iMSIvPgo8c3ZnIHg9IjM2IiB5PSI1OSIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiPgo8cGF0aCBkPSJNMTQgMlYyMEwxOSAxNVYxMUwxNCA2VjJaIiBmaWxsPSIjRTUwOTE0Ii8+CjxwYXRoIGQ9Ik0xMyAySDVDMy45IDIgMyAyLjkgMyA0VjIwQzMgMjEuMSAzLjkgMjIgNSAyMkgxM1YyWiIgZmlsbD0iI0U1MDkxNCIvPgo8L3N2Zz4KPC9zdmc+';
                    target.onerror = null; // Prevent infinite loop
                  }}
                />
              </div>
            ))}
            {parts.length > 4 && (
              <div className="w-8 h-12 bg-gray-700 border-2 border-gray-900 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">+{parts.length - 4}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click
                handleClick(); // Navigate to detail page
              }}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Start Marathon</span>
            </button>
            <button className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded-lg transition-colors">
              <Star className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FranchiseCard;