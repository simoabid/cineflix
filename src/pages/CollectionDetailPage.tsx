import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Play, 
  Plus, 
  Share2, 
  Download, 
  ChevronLeft, 
  Star, 
  Clock, 
  Calendar, 
  Film, 
  Users,
  Trophy,
  TrendingUp,
  BarChart3,
  Shuffle,
  List,
  Grid,
  Filter,
  Search,
  MoreHorizontal,
  PlayCircle,
  Heart,
  Bookmark,
  Settings
} from 'lucide-react';
import { CollectionDetails, Movie, ViewingOrder } from '../types';
import { getCollectionDetails, getImageUrl, getPosterUrl, getBackdropUrl } from '../services/tmdb';
import CollectionsService from '../services/collectionsService';
import AddToListButton from '../components/AddToListButton';
import LikeButton from '../components/LikeButton';
import LoadingSkeleton from '../components/LoadingSkeleton';
import TimelineView from '../components/TimelineView';

type TabType = 'overview' | 'movies' | 'timeline' | 'cast' | 'trivia' | 'related';
type ViewMode = 'grid' | 'list' | 'timeline';
type SortOption = 'release' | 'chronological' | 'rating' | 'title';

const CollectionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // State management
  const [collection, setCollection] = useState<CollectionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('release');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllMovies, setShowAllMovies] = useState(false);
  const [marathonMode, setMarathonMode] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<'release' | 'chronological'>('release');

  useEffect(() => {
    if (id) {
      fetchCollectionDetails(parseInt(id));
    }
  }, [id]);

  const fetchCollectionDetails = async (collectionId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const details = await getCollectionDetails(collectionId);
      if (details) {
        // Enhance with user progress
        const enhancedDetails = CollectionsService.enhanceCollectionsWithProgress([details])[0];
        setCollection(enhancedDetails);
      } else {
        setError('Collection not found');
      }
    } catch (err) {
      console.error('Error fetching collection details:', err);
      setError('Failed to load collection details');
    } finally {
      setLoading(false);
    }
  };

  const handleStartWatching = () => {
    if (!collection || !collection.parts.length) return;
    
    // Start marathon session
    CollectionsService.startMarathonSession(collection, viewingOrder);
    
    // Navigate to first movie
    const firstMovie = collection.parts[0];
    navigate(`/movie/${firstMovie.id}`);
  };

  const handleAddAllToList = () => {
    if (!collection) return;
    
    collection.parts.forEach(movie => {
      // Add each movie to the user's list
      // This would integrate with the existing MyList service
      console.log('Adding to list:', movie.title);
    });
  };

  const formatRuntime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours === 0) return `${remainingMinutes}m`;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getProgress = (): number => {
    if (!collection?.user_progress) return 0;
    return (collection.user_progress.watched_films.length / collection.film_count) * 100;
  };

  const getWatchedCount = (): number => {
    return collection?.user_progress?.watched_films.length || 0;
  };

  const getSortedMovies = (): Movie[] => {
    if (!collection) return [];
    
    let movies = [...collection.parts];
    
    switch (sortBy) {
      case 'chronological':
        return movies.sort((a, b) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime());
      case 'rating':
        return movies.sort((a, b) => b.vote_average - a.vote_average);
      case 'title':
        return movies.sort((a, b) => a.title.localeCompare(b.title));
      case 'release':
      default:
        return movies;
    }
  };

  const getFilteredMovies = (): Movie[] => {
    let movies = getSortedMovies();
    
    if (searchQuery) {
      movies = movies.filter(movie => 
        movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.overview.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return showAllMovies ? movies : movies.slice(0, 6);
  };

  const isMovieWatched = (movieId: number): boolean => {
    return collection?.user_progress?.watched_films.includes(movieId) || false;
  };

  const toggleMovieWatched = (movieId: number) => {
    if (!collection) return;
    
    if (isMovieWatched(movieId)) {
      CollectionsService.markFilmUnwatched(collection.id, movieId);
    } else {
      CollectionsService.markFilmWatched(collection.id, movieId);
    }
    
    // Refresh collection data
    fetchCollectionDetails(collection.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-netflix-black">
        <LoadingSkeleton />
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen bg-netflix-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-white mb-4">{error || 'Collection not found'}</h1>
          <Link to="/collections" className="text-netflix-red hover:underline">
            Back to Collections
          </Link>
        </div>
      </div>
    );
  }

  const progress = getProgress();
  const watchedCount = getWatchedCount();

  return (
    <div className="min-h-screen bg-netflix-black">
      {/* Hero Section */}
      <div className="relative h-screen overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={getBackdropUrl(collection.backdrop_path, 'w1280')}
            alt={collection.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-netflix-black via-netflix-black/80 to-netflix-black/40"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-transparent to-transparent"></div>
        </div>

        {/* Navigation */}
        <div className="absolute top-24 left-8 z-10">
          <Link
            to="/collections"
            className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back to Collections</span>
          </Link>
        </div>

        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-8 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              {/* Collection Poster */}
              <div className="lg:col-span-1">
                <div className="relative max-w-sm mx-auto lg:mx-0">
                  <img
                    src={getPosterUrl(collection.poster_path, 'w500')}
                    alt={collection.name}
                    className="w-full rounded-lg shadow-2xl"
                  />
                  {/* Progress Ring Overlay */}
                  {progress > 0 && (
                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-netflix-black rounded-full flex items-center justify-center border-4 border-netflix-red">
                      <span className="text-white text-sm font-bold">{Math.round(progress)}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Collection Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Title and Badges */}
                <div>
                  <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-4">
                    {collection.name}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-4 mb-6">
                    <span className="bg-netflix-red text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {collection.film_count} {collection.film_count === 1 ? 'Movie' : 'Movies'}
                    </span>
                    <span className="bg-gray-700 text-white px-3 py-1 rounded-full text-sm">
                      {collection.type.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      collection.status === 'complete' ? 'bg-green-600 text-white' :
                      collection.status === 'ongoing' ? 'bg-blue-600 text-white' :
                      'bg-yellow-600 text-black'
                    }`}>
                      {collection.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Collection Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4">
                    <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{(collection.parts.reduce((sum, movie) => sum + movie.vote_average, 0) / collection.parts.length).toFixed(1)}</div>
                    <div className="text-gray-300 text-sm">Avg Rating</div>
                  </div>
                  <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4">
                    <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{formatRuntime(collection.total_runtime)}</div>
                    <div className="text-gray-300 text-sm">Total Runtime</div>
                  </div>
                  <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4">
                    <Calendar className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{new Date(collection.first_release_date).getFullYear()}</div>
                    <div className="text-gray-300 text-sm">First Release</div>
                  </div>
                  <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4">
                    <Trophy className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{watchedCount}/{collection.film_count}</div>
                    <div className="text-gray-300 text-sm">Watched</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={handleStartWatching}
                    className="flex items-center bg-white text-black px-8 py-3 rounded-md font-semibold hover:bg-gray-200 transition-all duration-300 hover:scale-105"
                  >
                    <Play className="w-5 h-5 mr-2 fill-current" />
                    {progress > 0 && progress < 100 ? 'Continue Watching' : 'Start Watching'}
                  </button>
                  
                  <button
                    onClick={handleAddAllToList}
                    className="flex items-center bg-gray-600/70 backdrop-blur-sm text-white px-8 py-3 rounded-md font-semibold hover:bg-gray-600/90 transition-all duration-300 hover:scale-105"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add All to My List
                  </button>
                  
                  <button className="flex items-center bg-gray-600/70 backdrop-blur-sm text-white px-6 py-3 rounded-md font-semibold hover:bg-gray-600/90 transition-all duration-300">
                    <Share2 className="w-5 h-5 mr-2" />
                    Share
                  </button>
                  
                  <button className="flex items-center bg-gray-600/70 backdrop-blur-sm text-white px-6 py-3 rounded-md font-semibold hover:bg-gray-600/90 transition-all duration-300">
                    <Download className="w-5 h-5 mr-2" />
                    Download All
                  </button>
                </div>

                {/* Progress Bar */}
                {progress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-300">
                      <span>Collection Progress</span>
                      <span>{watchedCount} of {collection.film_count} watched</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-netflix-red h-2 rounded-full animate-progress-fill"
                        style={{ '--progress-width': `${progress}%` } as any}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="sticky top-20 z-40 bg-netflix-black/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: Film },
              { id: 'movies', label: 'Movies', icon: Grid },
              { id: 'timeline', label: 'Timeline', icon: BarChart3 },
              { id: 'cast', label: 'Cast & Crew', icon: Users },
              { id: 'trivia', label: 'Trivia & Facts', icon: Trophy },
              { id: 'related', label: 'Related Collections', icon: TrendingUp }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-netflix-red text-white'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 tab-content">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Collection Description */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">About This Collection</h2>
                <p className="text-gray-300 text-lg leading-relaxed">
                  {collection.overview || `The ${collection.name} collection brings together all the films in this beloved franchise. Experience the complete story arc from beginning to end, watching as characters develop and stories unfold across multiple films. Perfect for marathon viewing or revisiting your favorite moments.`}
                </p>
              </div>

              {/* Featured Movies */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Movies in Collection</h2>
                  <div className="flex items-center space-x-4">
                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-gray-800 rounded-lg p-1">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded ${viewMode === 'grid' ? 'bg-netflix-red text-white' : 'text-gray-400 hover:text-white'}`}
                      >
                        <Grid className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded ${viewMode === 'list' ? 'bg-netflix-red text-white' : 'text-gray-400 hover:text-white'}`}
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Sort Options */}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2"
                    >
                      <option value="release">Release Order</option>
                      <option value="chronological">Chronological</option>
                      <option value="rating">Rating</option>
                      <option value="title">Title</option>
                    </select>
                  </div>
                </div>

                {/* Search */}
                {collection.film_count > 6 && (
                  <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search movies in this collection..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-lg border border-gray-600 focus:border-netflix-red focus:outline-none"
                    />
                  </div>
                )}

                {/* Movies Grid/List */}
                <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6' : 'space-y-4'}`}>
                  {getFilteredMovies().map((movie, index) => (
                    <div key={movie.id} className={`relative group ${viewMode === 'list' ? 'flex space-x-4 bg-gray-800/50 rounded-lg p-4' : ''}`}>
                      {viewMode === 'grid' ? (
                        /* Grid View */
                        <div className="relative collection-card">
                          <Link to={`/movie/${movie.id}`}>
                            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
                              <img
                                src={getPosterUrl(movie.poster_path, 'w500')}
                                alt={movie.title}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              
                              {/* Watch Status Indicator */}
                              <div className={`absolute top-3 left-3 w-3 h-3 rounded-full ${
                                isMovieWatched(movie.id) ? 'bg-green-500' : 'bg-gray-500'
                              }`}></div>
                              
                              {/* Movie Number */}
                              <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-sm font-bold">
                                #{index + 1}
                              </div>
                              
                              {/* Hover Overlay */}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      navigate(`/movie/${movie.id}`);
                                    }}
                                    className="bg-white text-black p-3 rounded-full hover:bg-gray-200 transition-colors"
                                  >
                                    <Play className="w-5 h-5" />
                                  </button>
                                  <AddToListButton
                                    content={movie}
                                    contentType="movie"
                                    variant="icon"
                                    className="bg-gray-600/70 p-3 rounded-full hover:bg-gray-600"
                                    showText={false}
                                  />
                                  <LikeButton
                                    content={movie}
                                    contentType="movie"
                                    variant="icon"
                                    className="bg-gray-600/70 p-3 rounded-full hover:bg-gray-600"
                                    showText={false}
                                  />
                                </div>
                              </div>
                            </div>
                          </Link>
                          
                          {/* Movie Info */}
                          <div className="mt-3">
                            <h3 className="text-white font-semibold truncate">{movie.title}</h3>
                            <div className="flex items-center justify-between text-sm text-gray-400 mt-1">
                              <span>{new Date(movie.release_date).getFullYear()}</span>
                              <div className="flex items-center">
                                <Star className="w-4 h-4 text-yellow-400 mr-1" />
                                <span>{movie.vote_average.toFixed(1)}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => toggleMovieWatched(movie.id)}
                              className={`mt-2 w-full py-2 rounded text-sm font-medium transition-colors ${
                                isMovieWatched(movie.id)
                                  ? 'bg-green-600 text-white hover:bg-green-700'
                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              }`}
                            >
                              {isMovieWatched(movie.id) ? 'Watched' : 'Mark as Watched'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* List View */
                        <div className="flex w-full space-x-4">
                          <Link to={`/movie/${movie.id}`} className="flex-shrink-0">
                            <img
                              src={getPosterUrl(movie.poster_path, 'w185')}
                              alt={movie.title}
                              className="w-20 h-28 object-cover rounded"
                            />
                          </Link>
                          <div className="flex-grow">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-white font-semibold text-lg">{movie.title}</h3>
                                <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                                  <span>{new Date(movie.release_date).getFullYear()}</span>
                                  <div className="flex items-center">
                                    <Star className="w-4 h-4 text-yellow-400 mr-1" />
                                    <span>{movie.vote_average.toFixed(1)}</span>
                                  </div>
                                  <span>{movie.runtime ? formatRuntime(movie.runtime) : 'N/A'}</span>
                                </div>
                                <p className="text-gray-300 text-sm mt-2 line-clamp-2">{movie.overview}</p>
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                <button
                                  onClick={() => toggleMovieWatched(movie.id)}
                                  className={`px-3 py-1 rounded text-xs font-medium ${
                                    isMovieWatched(movie.id)
                                      ? 'bg-green-600 text-white'
                                      : 'bg-gray-700 text-gray-300'
                                  }`}
                                >
                                  {isMovieWatched(movie.id) ? 'Watched' : 'Unwatched'}
                                </button>
                                <button className="text-gray-400 hover:text-white">
                                  <MoreHorizontal className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* View All Button */}
                {collection.film_count > 6 && !showAllMovies && (
                  <div className="text-center mt-8">
                    <button
                      onClick={() => setShowAllMovies(true)}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                    >
                      View All {collection.film_count} Movies
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-32 space-y-6">
                {/* Quick Actions */}
                <div className="bg-gray-800/50 rounded-lg p-6">
                  <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={handleStartWatching}
                      className="w-full flex items-center justify-center bg-netflix-red hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-colors"
                    >
                      <PlayCircle className="w-5 h-5 mr-2" />
                      {progress > 0 && progress < 100 ? 'Continue Watching' : 'Start from Beginning'}
                    </button>
                    
                    {progress > 0 && progress < 100 && (
                      <button className="w-full flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors">
                        <Shuffle className="w-5 h-5 mr-2" />
                        Skip to Unwatched
                      </button>
                    )}
                    
                    <button
                      onClick={() => setMarathonMode(!marathonMode)}
                      className={`w-full flex items-center justify-center py-3 rounded-lg font-medium transition-colors ${
                        marathonMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                      }`}
                    >
                      <Clock className="w-5 h-5 mr-2" />
                      {marathonMode ? 'Marathon Mode On' : 'Enable Marathon Mode'}
                    </button>
                  </div>
                </div>

                {/* Viewing Order */}
                <div className="bg-gray-800/50 rounded-lg p-6">
                  <h3 className="text-white font-semibold mb-4">Viewing Order</h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="viewingOrder"
                        value="release"
                        checked={viewingOrder === 'release'}
                        onChange={(e) => setViewingOrder(e.target.value as 'release' | 'chronological')}
                        className="text-netflix-red mr-3"
                      />
                      <span className="text-gray-300">Release Order</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="viewingOrder"
                        value="chronological"
                        checked={viewingOrder === 'chronological'}
                        onChange={(e) => setViewingOrder(e.target.value as 'release' | 'chronological')}
                        className="text-netflix-red mr-3"
                      />
                      <span className="text-gray-300">Chronological Order</span>
                    </label>
                  </div>
                </div>

                {/* Collection Metadata */}
                <div className="bg-gray-800/50 rounded-lg p-6">
                  <h3 className="text-white font-semibold mb-4">Collection Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Genres:</span>
                      <span className="text-white">{collection.genre_categories.join(', ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Studio:</span>
                      <span className="text-white">{collection.studio}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={`capitalize ${
                        collection.status === 'complete' ? 'text-green-400' :
                        collection.status === 'ongoing' ? 'text-blue-400' :
                        'text-yellow-400'
                      }`}>
                        {collection.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Span:</span>
                      <span className="text-white">
                        {new Date(collection.first_release_date).getFullYear()} - {new Date(collection.latest_release_date).getFullYear()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Your Progress */}
                {progress > 0 && (
                  <div className="bg-gray-800/50 rounded-lg p-6">
                    <h3 className="text-white font-semibold mb-4">Your Progress</h3>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white mb-1">{Math.round(progress)}%</div>
                        <div className="text-gray-400 text-sm">Complete</div>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-netflix-red h-2 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="text-center text-gray-400 text-sm">
                        {watchedCount} of {collection.film_count} movies watched
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Other tab content would go here */}
        {activeTab === 'movies' && (
          <div className="text-center text-white py-16 tab-content">
            <Film className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold mb-2">Movies Tab</h2>
            <p className="text-gray-400">Complete filmography with advanced sorting and filtering options.</p>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="tab-content">
            <TimelineView collection={collection} />
          </div>
        )}

        {activeTab === 'cast' && (
          <div className="text-center text-white py-16 tab-content">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold mb-2">Cast & Crew</h2>
            <p className="text-gray-400 mb-8">Recurring actors, directors, and key personnel across the franchise.</p>
            <div className="bg-gray-800/30 rounded-lg p-8">
              <p className="text-gray-500">Feature coming soon...</p>
              <p className="text-gray-600 text-sm mt-2">
                This section will show cast members who appeared in multiple films, director changes across the franchise, and character evolution.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'trivia' && (
          <div className="text-center text-white py-16 tab-content">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold mb-2">Trivia & Facts</h2>
            <p className="text-gray-400 mb-8">Behind-the-scenes information and interesting easter eggs.</p>
            <div className="bg-gray-800/30 rounded-lg p-8">
              <p className="text-gray-500">Feature coming soon...</p>
              <p className="text-gray-600 text-sm mt-2">
                This section will include production secrets, easter eggs, filming locations, and franchise connections.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'related' && (
          <div className="text-center text-white py-16 tab-content">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold mb-2">Related Collections</h2>
            <p className="text-gray-400 mb-8">Similar franchises and spin-off collections you might enjoy.</p>
            <div className="bg-gray-800/30 rounded-lg p-8">
              <p className="text-gray-500">Feature coming soon...</p>
              <p className="text-gray-600 text-sm mt-2">
                This section will recommend similar franchises, spin-offs, and collections based on your preferences.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionDetailPage;