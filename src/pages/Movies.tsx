import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Movie } from '../types';
import { 
  getTrendingMovies, 
  getPopularMovies, 
  getTopRatedMovies, 
  getNowPlayingMovies, 
  getUpcomingMovies,
  getMovieGenres,
  discoverMoviesByGenre,
  getMovieVideos
} from '../services/tmdb';
import HeroCarousel from '../components/HeroCarousel';
import ContentCarousel from '../components/ContentCarousel';
import FilterBar from '../components/FilterBar';

interface MoviesProps {}

interface HeroSlide {
  id: number;
  title: string;
  overview: string;
  backdrop_path: string | null;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
  trailerKey?: string;
}

const Movies: React.FC<MoviesProps> = () => {
  const [heroMovies, setHeroMovies] = useState<HeroSlide[]>([]);
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [nowPlayingMovies, setNowPlayingMovies] = useState<Movie[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  const [genreRows, setGenreRows] = useState<{ [key: string]: Movie[] }>({});
  const [genres, setGenres] = useState<any[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Cache for genre data
  const genreCache = useMemo(() => new Map(), []);

  const fetchHeroMovies = useCallback(async () => {
    try {
      // Use trending movies for hero section
      const trending = await getTrendingMovies(1);
      const featured = trending.results.slice(0, 5);
      
      // Fetch trailer data for each featured movie
      const heroData = await Promise.all(
        featured.map(async (movie) => {
          try {
            const videos = await getMovieVideos(movie.id);
            const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube');
            return {
              ...movie,
              title: movie.title,
              trailerKey: trailer?.key
            };
          } catch (error) {
            console.error(`Error fetching videos for movie ${movie.id}:`, error);
            return {
              ...movie,
              title: movie.title,
              trailerKey: undefined
            };
          }
        })
      );
      
      setHeroMovies(heroData);
    } catch (error) {
      console.error('Error fetching hero movies:', error);
    }
  }, []);

  const fetchGenreMovies = useCallback(async (genreId: number) => {
    if (genreCache.has(genreId)) {
      return genreCache.get(genreId);
    }
    
    try {
      const response = await discoverMoviesByGenre(genreId, 1);
      genreCache.set(genreId, response.results);
      return response.results;
    } catch (error) {
      console.error(`Error fetching movies for genre ${genreId}:`, error);
      return [];
    }
  }, [genreCache]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [
        trending,
        popular,
        topRated,
        nowPlaying,
        upcoming,
        genreList
      ] = await Promise.all([
        getTrendingMovies(1),
        getPopularMovies(1),
        getTopRatedMovies(1),
        getNowPlayingMovies(1),
        getUpcomingMovies(1),
        getMovieGenres()
      ]);

      setTrendingMovies(trending.results);
      setPopularMovies(popular.results);
      setTopRatedMovies(topRated.results);
      setNowPlayingMovies(nowPlaying.results);
      setUpcomingMovies(upcoming.results);
      setGenres(genreList);

      // Fetch movies for each genre
      const genreMoviesData: { [key: string]: Movie[] } = {};
      await Promise.all(
        genreList.map(async (genre) => {
          const movies = await fetchGenreMovies(genre.id);
          genreMoviesData[genre.name] = movies;
        })
      );
      setGenreRows(genreMoviesData);

      // Initialize filtered movies with trending
      setFilteredMovies(trending.results);
    } catch (error) {
      console.error('Error fetching movies data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchGenreMovies]);

  useEffect(() => {
    fetchAllData();
    fetchHeroMovies();
  }, [fetchAllData, fetchHeroMovies]);

  // Filter logic
  useEffect(() => {
    let filtered = [...trendingMovies, ...popularMovies, ...topRatedMovies, ...nowPlayingMovies, ...upcomingMovies];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(movie => 
        movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.overview.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply genre filter
    if (selectedGenre) {
      const genreId = genres.find(g => g.name === selectedGenre)?.id;
      if (genreId) {
        const genreMovies = genreRows[selectedGenre] || [];
        filtered = [...filtered, ...genreMovies];
        filtered = filtered.filter(movie => movie.genre_ids.includes(genreId));
      }
    }

    // Apply year filter
    if (selectedYear) {
      filtered = filtered.filter(movie => 
        movie.release_date?.startsWith(selectedYear)
      );
    }

    // Apply rating filter
    if (selectedRating > 0) {
      filtered = filtered.filter(movie => movie.vote_average >= selectedRating);
    }

    // Remove duplicates
    const uniqueMovies = filtered.filter((movie, index, self) => 
      index === self.findIndex(m => m.id === movie.id)
    );

    setFilteredMovies(uniqueMovies);
  }, [searchQuery, selectedGenre, selectedYear, selectedRating, trendingMovies, popularMovies, topRatedMovies, nowPlayingMovies, upcomingMovies, genres, genreRows]);

  const handleWatchTrailer = (trailerKey?: string) => {
    if (trailerKey) {
      window.open(`https://www.youtube.com/watch?v=${trailerKey}`, '_blank');
    }
  };

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 30 }, (_, i) => (currentYear - i).toString());
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Carousel */}
      {heroMovies.length > 0 && (
        <HeroCarousel
          items={heroMovies}
          onTrailerClick={handleWatchTrailer}
          type="movie"
        />
      )}

      {/* Filter Bar */}
      <FilterBar
        genres={genres}
        years={years}
        searchQuery={searchQuery}
        selectedGenre={selectedGenre}
        selectedYear={selectedYear}
        selectedRating={selectedRating}
        showFilters={showFilters}
        onSearchChange={setSearchQuery}
        onGenreChange={setSelectedGenre}
        onYearChange={setSelectedYear}
        onRatingChange={setSelectedRating}
        onToggleFilters={() => setShowFilters(!showFilters)}
      />

      {/* Content Rows */}
      <div className="px-4 sm:px-8 py-8 space-y-12">
        {searchQuery || selectedGenre || selectedYear || selectedRating > 0 ? (
          // Filtered results
          filteredMovies.length > 0 ? (
            <ContentCarousel
              title="Search Results"
              items={filteredMovies}
              type="movie"
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No movies found matching your criteria</p>
            </div>
          )
        ) : (
          // Default rows
          <>
            <ContentCarousel
              title="Trending Now"
              items={trendingMovies}
              type="movie"
            />
            
            <ContentCarousel
              title="Popular on CineFlix"
              items={popularMovies}
              type="movie"
            />
            
            <ContentCarousel
              title="Top Rated"
              items={topRatedMovies}
              type="movie"
            />
            
            <ContentCarousel
              title="Now Playing"
              items={nowPlayingMovies}
              type="movie"
            />

            <ContentCarousel
              title="Upcoming"
              items={upcomingMovies}
              type="movie"
            />

            {/* Genre Rows */}
            {genres.map((genre) => {
              const movies = genreRows[genre.name];
              return movies && movies.length > 0 ? (
                <ContentCarousel
                  key={genre.id}
                  title={genre.name}
                  items={movies}
                  type="movie"
                />
              ) : null;
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default Movies;
