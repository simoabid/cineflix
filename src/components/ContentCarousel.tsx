import React, { useRef, useState, useEffect } from 'react';
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

const ContentCarousel: React.FC<ContentCarouselProps> = ({ title, items, type }) => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);


  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', checkScrollButtons);
      return () => scrollElement.removeEventListener('scroll', checkScrollButtons);
    }
  }, [items]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = window.innerWidth > 768 ? 600 : 300;
      const currentScroll = scrollRef.current.scrollLeft;
      const newScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      scrollRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    }
  };

  const getTitle = (item: Movie | TVShow) => {
    return 'title' in item ? item.title : item.name;
  };

  const getReleaseYear = (item: Movie | TVShow) => {
    const date = 'release_date' in item ? item.release_date : item.first_air_date;
    return date ? new Date(date).getFullYear() : '';
  };



  return (
    <div className="relative group px-4 md:px-8 py-0">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
        {title}
      </h2>
      
      <div className="relative">
        {/* Navigation Buttons */}
        <button
          onClick={() => scroll('left')}
          className={`absolute left-0 top-0 bottom-0 z-20 bg-black/60 hover:bg-black/80 text-white p-3 rounded-r-lg transition-all duration-300 ${
            !canScrollLeft ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'
          } backdrop-blur-sm`}
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <button
          onClick={() => scroll('right')}
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
          {items.map((item) => (
            <div
              key={item.id}
              className="relative flex-shrink-0 cursor-pointer"
              onMouseEnter={() => setHoveredItem(item.id)}
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
                    src={getImageUrl(item.poster_path, 'w500')}
                    alt={getTitle(item)}
                    className="w-full h-full object-cover rounded"
                    onError={handleImageError}
                  />
                  
                  {/* Enhanced Hover Effect with Meaningful Buttons */}
                  <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent rounded transition-all duration-300 ${
                    hoveredItem === item.id 
                      ? 'opacity-100 scale-105' 
                      : 'opacity-0 scale-100'
                  }`}>
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
                  {getTitle(item).length > 25 
                    ? getTitle(item).substring(0, 25) + '...' 
                    : getTitle(item)
                  }
                </h3>
                <div className="flex items-center space-x-2 text-xs">
                  <div className="flex items-center">
                    <span className="text-yellow-400 mr-1">★</span>
                    <span className="text-gray-300">{item.vote_average?.toFixed(1) || 'N/A'}</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-400">
                    {getReleaseYear(item)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContentCarousel;
