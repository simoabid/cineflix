import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Star, Calendar } from 'lucide-react';
import { getImageUrl } from '../services/tmdb';

interface HeroItem {
  id: number;
  title: string;
  overview: string;
  backdrop_path: string | null;
  poster_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  trailerKey?: string;
}

interface HeroCarouselProps {
  items: HeroItem[];
  onTrailerClick: (trailerKey?: string) => void;
  type: 'movie' | 'tv';
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({ items, onTrailerClick, type }) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (isAutoPlaying && items.length > 1) {
      const interval = setInterval(nextSlide, 5000);
      return () => clearInterval(interval);
    }
  }, [isAutoPlaying, items.length]);

  const handleMouseEnter = () => {
    setIsAutoPlaying(false);
  };

  const handleMouseLeave = () => {
    setIsAutoPlaying(true);
  };

  if (!items.length) return null;

  const currentItem = items[currentIndex];

  return (
    <div 
      className="relative h-[70vh] md:h-[85vh] overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={getImageUrl(currentItem.backdrop_path, 'original')}
          alt={currentItem.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = getImageUrl(currentItem.poster_path, 'original');
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex items-end">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 pb-8 md:pb-16">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              {currentItem.title}
            </h1>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm">{currentItem.vote_average.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  {(currentItem.release_date || currentItem.first_air_date)?.split('-')[0]}
                </span>
              </div>
            </div>

            <p className="text-gray-300 mb-6 line-clamp-3 md:line-clamp-4">
              {currentItem.overview}
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => navigate(`/watch/${type}/${currentItem.id}`)}
                className="flex items-center gap-2 bg-white text-black hover:bg-gray-200 px-6 py-3 rounded-md transition-colors font-semibold"
                aria-label={`Watch ${currentItem.title} now`}
              >
                <Play className="w-5 h-5" />
                Watch Now
              </button>
              <button
                onClick={() => onTrailerClick(currentItem.trailerKey)}
                className="flex items-center gap-2 bg-gray-700/80 hover:bg-gray-600 text-white px-6 py-3 rounded-md transition-colors"
                aria-label={`Watch ${currentItem.title} trailer`}
              >
                <Play className="w-5 h-5" />
                Watch Trailer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {items.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded-full transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-2 rounded-full transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Navigation Dots */}
      {items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-white' : 'bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroCarousel;
