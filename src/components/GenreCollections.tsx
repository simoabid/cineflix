import React, { useState, useEffect } from 'react';
import ContentCarousel from './ContentCarousel';
import { getMovieGenres, getTVGenres, discoverMoviesByGenre, discoverTVShowsByGenre } from '../services/tmdb';
import { Movie, TVShow } from '../types';

interface GenreSection {
  id: number;
  name: string;
  type: 'movie' | 'tv';
  items: (Movie | TVShow)[];
  loading: boolean;
  page: number;
  hasMore: boolean;
}

const GenreCollections: React.FC = () => {
  const [genreSections, setGenreSections] = useState<GenreSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGenresAndContent();
  }, []);

  const fetchGenresAndContent = async () => {
    try {
      setLoading(true);

      // Fetch all genres for both movies and TV shows
      const [movieGenres, tvGenres] = await Promise.all([
        getMovieGenres(),
        getTVGenres()
      ]);

      // Select top genres to display (limit to prevent API overload)
      const topMovieGenres = movieGenres.slice(0, 8);
      const topTVGenres = tvGenres.slice(0, 8);

      // Create genre sections with staggered loading
      const sections: GenreSection[] = [];

      // Load movie genres first
      for (const genre of topMovieGenres) {
        const items = await fetchMoviesByGenre(genre.id, 1);
        sections.push({
          id: genre.id,
          name: genre.name,
          type: 'movie',
          items: items,
          loading: false,
          page: 1,
          hasMore: items.length === 20
        });
      }

      // Add TV show genres
      for (const genre of topTVGenres) {
        const items = await fetchTVShowsByGenre(genre.id, 1);
        sections.push({
          id: genre.id,
          name: genre.name,
          type: 'tv',
          items: items,
          loading: false,
          page: 1,
          hasMore: items.length === 20
        });
      }

      setGenreSections(sections);
    } catch (error) {
      console.error('Error fetching genres and content:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMoviesByGenre = async (genreId: number, page: number): Promise<Movie[]> => {
    try {
      const response = await discoverMoviesByGenre(genreId, page);
      return response.results;
    } catch (error) {
      console.error(`Error fetching movies for genre ${genreId}:`, error);
      return [];
    }
  };

  const fetchTVShowsByGenre = async (genreId: number, page: number): Promise<TVShow[]> => {
    try {
      const response = await discoverTVShowsByGenre(genreId, page);
      return response.results;
    } catch (error) {
      console.error(`Error fetching TV shows for genre ${genreId}:`, error);
      return [];
    }
  };



  if (loading) {
    return (
      <div className="space-y-8">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="px-4 md:px-8">
            <div className="h-8 bg-gray-800 rounded animate-pulse mb-4 w-48"></div>
            <div className="flex space-x-4 overflow-hidden">
              {[...Array(6)].map((_, itemIndex) => (
                <div key={itemIndex} className="flex-shrink-0">
                  <div className="w-48 h-72 bg-gray-800 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {genreSections.map((section, index) => (
        <div key={`${section.type}-${section.id}`}>
          <ContentCarousel
            title={`${section.name} ${section.type === 'movie' ? 'Movies' : 'TV Shows'}`}
            items={section.items}
            type={section.type}
          />
        </div>
      ))}
    </div>
  );
};

export default GenreCollections;
