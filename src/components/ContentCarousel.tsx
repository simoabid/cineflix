import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Film, Tv } from 'lucide-react';
import { Movie, TVShow } from '../types';
import { getImageUrl } from '../services/tmdb';
import { handleImageError } from '../utils/imageLoader';
import AddToListButton from './AddToListButton';
import LikeButton from './LikeButton';

interface ContentCarouselProps {
  title: string;
  items: (Movie | TVShow)[];
  type: 'movie' | 'tv';
}

/**
 * Calculate the amount to scroll based on viewport width.
 * Exported as a pure helper for unit testing.
 * @param viewportWidth - The current viewport width (window.innerWidth)
 * @returns scroll amount in pixels
 */
export const calculateScrollAmount = (viewportWidth: number): number =>
  viewportWidth > 768 ? 600 : 300;

/**
 * Get the display title for a content item.
 * Exported as a pure helper for unit testing.
 * @param item - Movie or TVShow
 * @returns title string
 */
export const formatContentTitle = (item: Movie | TVShow): string =>
  item && (('title' in item && item.title) || ('name' in item && item.name)) ? ('title' in item ? item.title : item.name) : 'Untitled';

/**
 * Get the release year for a content item.
 * Exported as a pure helper for unit testing.
 * @param item - Movie or TVShow
 * @returns year string or empty string if not available
 */
export const formatContentReleaseYear = (item: Movie | TVShow): string => {
  const date = 'release_date' in item ? item.release_date : item.first_air_date;
  return date ? String(new Date(date).getFullYear()) : '';
};

/**
 * Determines if the container can scroll further to the left.
 * Exported as a pure helper for unit testing.
 * @param scrollLeft - current scrollLeft position
 * @returns boolean
 */
export const canScrollLeftCalc = (scrollLeft: number): boolean => scrollLeft > 0;

/**
 * Determines if the container can scroll further to the right.
 * Exported as a pure helper for unit testing.
 * @param scrollLeft - current scrollLeft position
 * @param scrollWidth - total scrollWidth of the container
 * @param clientWidth - visible clientWidth of the container
 * @param threshold - optional threshold buffer (default 10)
 * @returns boolean
 */
export const canScrollRightCalc = (
  scrollLeft: number,
  scrollWidth: number,
  clientWidth: number,
  threshold = 10
): boolean => scrollLeft < scrollWidth - clientWidth - threshold;

/**
 * Normalize and sanitize an incoming items list for the carousel.
 * Ensures the returned array contains objects with at least an `id`.
 * This is exported for testability and to centralize transformation logic.
 * @param items - raw incoming items which may be malformed
 * @returns sanitized array of Movie | TVShow
 */
export const transformContentItems = (items: unknown): (Movie | TVShow)[] => {
  if (!Array.isArray(items)) return [];
  return items
    .filter((it): it is Movie | TVShow => {
      return !!it && typeof it === 'object' && 'id' in (it as any) && ((typeof (it as any).id === 'number') || (typeof (it as any).id === 'string'));
    })
    .map((it) => {
      const obj = it as any;
      return {
        ...obj,
        poster_path: obj.poster_path ?? '',
        vote_average: typeof obj.vote_average === 'number' ? obj.vote_average : (obj.vote_average ? Number(obj.vote_average) || 0 : 0)
      } as Movie | TVShow;
    });
};

/**
 * ContentCarousel component: displays a horizontal scrollable list of movies or TV shows.
 *
 * Guards:
 * - If items is not an array or is empty, displays the title and a lightweight placeholder message.
 *
 * Internal helpers are extracted for readability and testability:
 * - renderItem: renders an individual card
 * - checkScrollButtons: updates left/right button state
 * - scrollContainer: performs a smooth scroll using calculateScrollAmount
 */
const ContentCarousel: React.FC<ContentCarouselProps> = ({ title, items, type }) => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);

  // Normalize and memoize items to avoid runtime issues with malformed props
  const safeItems = useMemo(() => transformContentItems(items), [items]);

  // Guard and error handling for malformed or empty items
  const isEmpty = safeItems.length === 0;

  useEffect(() => {
    checkScrollButtons();
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', checkScrollButtons);
      return () => scrollElement.removeEventListener('scroll', checkScrollButtons);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeItems]);

  /**
   * Check scroll button visibility based on current scroll state.
   * Separated for clarity and to allow easier testing of logic via helpers.
   */
  function checkScrollButtons() {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(canScrollLeftCalc(scrollLeft));
      setCanScrollRight(canScrollRightCalc(scrollLeft, scrollWidth, clientWidth));
    } else {
      setCanScrollLeft(false);
      setCanScrollRight(false);
    }
  }

  /**
   * Scrolls the container left or right using a calculated scroll amount.
   * Uses calculateScrollAmount to remain testable and deterministic.
   * @param direction - 'left' or 'right'
   */
  const scrollContainer = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = calculateScrollAmount(window.innerWidth);
      const currentScroll = scrollRef.current.scrollLeft;
      const newScroll = direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount;

      scrollRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    }
  };

  /**
   * Renders a single carousel item card.
   * Extracted to keep the main JSX lean and focused.
   * @param item - Movie or TVShow
   * @returns JSX element
   */
  const renderItem = (item: Movie | TVShow) => (
    <div
      key={item.id}
      className="relative flex-shrink-0 cursor-pointer"
      onMouseEnter={() => setHoveredItem(Number(item.id))}
      onMouseLeave={() => setHoveredItem(null)}
    >
      <Link to={`/${type}/${item.id}`}>
        <div className="relative aspect-[2/3] w-40 md:w-48 bg-gray-800 rounded">
          {/* Type Indicator - Top Left */}
          <div className="absolute top-2 left-2 z-10">
            <span className="text-xs font-bold px-2 py-1 rounded bg-black/70 text-white flex items-center space-x-1">
              {type === 'movie' ? (
                <>
                  <Film className="w-3 h-3" />
                  <span>MOVIE</span>
                </>
              ) : (
                <>
                  <Tv className="w-3 h-3" />
                  <span>TV</span>
                </>
              )}
            </span>
          </div>

          {/* Background Image - Vertical Poster */}
          <img
            src={getImageUrl(item.poster_path ?? '', 'w500')}
            alt={formatContentTitle(item)}
            className="w-full h-full object-cover rounded"
            onError={handleImageError}
          />

          {/* Enhanced Hover Effect with Meaningful Buttons */}
          <div
            className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent rounded transition-all duration-300 ${
              hoveredItem === Number(item.id) ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
            }`}
          >
            <div className="absolute bottom-0 left-0 right-0 p-4">
              {/* Refined Action Buttons with Button-Specific Tooltips */}
              <div className="flex items-center space-x-3">
                {/* Watch Now - Play Button (Netflix Red) */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate(`/watch/${type}/${item.id}`);
                  }}
                  className="relative w-12 h-12 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110"
                  title="Watch Now"
                >
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs text-white bg-black/80 px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap">
                    Watch Now
                  </span>
                  <Play className="w-6 h-6 text-black ml-0.5" />
                </button>

                {/* Add to My List Button */}
                <AddToListButton
                  content={item}
                  contentType={type}
                  variant="icon"
                  className="relative w-10 h-10 border border-white/30 rounded-full shadow-md hover:shadow-lg hover:scale-110"
                  showText={false}
                />

                {/* Like Button */}
                <LikeButton
                  content={item}
                  contentType={type}
                  variant="icon"
                  className="relative w-10 h-10 border border-white/30 rounded-full shadow-md hover:shadow-lg hover:scale-110"
                  showText={false}
                />
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Movie Info Below Card */}
      <div className="mt-2 px-1">
        <h3 className="text-white font-bold text-sm mb-1 truncate">
          {formatContentTitle(item).length > 25
            ? formatContentTitle(item).substring(0, 25) + '...'
            : formatContentTitle(item)}
        </h3>
        <div className="flex items-center space-x-2 text-xs">
          <div className="flex items-center">
            <span className="text-yellow-400 mr-1">★</span>
            <span className="text-gray-300">{typeof item.vote_average === 'number' ? item.vote_average.toFixed(1) : 'N/A'}</span>
          </div>
          <span className="text-gray-400">•</span>
          <span className="text-gray-400">{formatContentReleaseYear(item)}</span>
        </div>
      </div>
    </div>
  );

  // Memoize rendered items to avoid unnecessary re-renders
  const renderedItems = useMemo(() => safeItems.map((item) => renderItem(item)), [safeItems, hoveredItem, type]);

  // Render placeholder if items array is missing or empty
  if (isEmpty) {
    return (
      <div className="relative group px-4 md:px-8 py-0">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">{title}</h2>
        <div className="text-gray-400 text-sm">No items to display.</div>
      </div>
    );
  }

  return (
    <div className="relative group px-4 md:px-8 py-0">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">{title}</h2>

      <div className="relative">
        {/* Navigation Buttons */}
        <button
          onClick={() => scrollContainer('left')}
          className={`absolute left-0 top-0 bottom-0 z-20 bg-black/60 hover:bg-black/80 text-white p-3 rounded-r-lg transition-all duration-300 ${
            !canScrollLeft ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'
          } backdrop-blur-sm`}
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={() => scrollContainer('right')}
          className={`absolute right-0 top-0 bottom-0 z-20 bg-black/60 hover:bg-black/80 text-white p-3 rounded-l-lg transition-all duration-300 ${
            !canScrollRight ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'
          } backdrop-blur-sm`}
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Vertical Content Items */}
        <div
          ref={scrollRef}
          className="flex overflow-x-auto space-x-4 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {renderedItems}
        </div>
      </div>
    </div>
  );
};

export default ContentCarousel;