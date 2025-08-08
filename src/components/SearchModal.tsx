import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  X, 
  Filter, 
  Star, 
  Globe, 
  Users, 
  Mic, 
  History, 
  TrendingUp,
  Play,
  Plus,
  Heart,
  BookmarkPlus,
  Grid,
  List,
  Sun,
  Moon
} from 'lucide-react';
import { Content, Genre } from '../types';
import { searchContent, getMovieGenres, getTVGenres, getPosterUrl } from '../services/tmdb';
import { useMyList } from '../hooks/useMyList';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

interface SearchFilters {
  genres: number[];
  releaseYear: { min: number; max: number };
  rating: { min: number; max: number };
  duration: { min: number; max: number };
  language: string;
  sortBy: 'relevance' | 'rating' | 'release_date' | 'popularity';
  sortOrder: 'asc' | 'desc';
}

interface SearchResult extends Content {
  runtime?: number;
  first_air_date?: string;
  release_date?: string;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, isDarkMode, onToggleTheme }) => {
  // Hooks
  const navigate = useNavigate();
  const { addToList, removeFromList, isInList, myListItems } = useMyList();
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'movie' | 'tv' | 'documentary' | 'kids'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [isVoiceSearch, setIsVoiceSearch] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingSearches] = useState<string[]>([
    'Marvel', 'Star Wars', 'Harry Potter', 'The Office', 'Breaking Bad', 
    'Stranger Things', 'Game of Thrones', 'The Batman', 'Top Gun', 'Avatar'
  ]);
  const [savedSearches, setSavedSearches] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Filters state
  const [filters, setFilters] = useState<SearchFilters>({
    genres: [],
    releaseYear: { min: 1900, max: new Date().getFullYear() },
    rating: { min: 0, max: 10 },
    duration: { min: 0, max: 300 },
    language: '',
    sortBy: 'relevance',
    sortOrder: 'desc'
  });

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load genres on mount
  useEffect(() => {
    const loadGenres = async () => {
      try {
        const [movieGenres, tvGenres] = await Promise.all([
          getMovieGenres(),
          getTVGenres()
        ]);
        // Combine and deduplicate genres
        const allGenres = [...movieGenres, ...tvGenres].reduce((acc, genre) => {
          if (!acc.find(g => g.id === genre.id)) {
            acc.push(genre);
          }
          return acc;
        }, [] as Genre[]);
        setGenres(allGenres);
      } catch (error) {
        console.error('Error loading genres:', error);
      }
    };
    
    loadGenres();
    
    // Load search history from localStorage
    const savedHistory = localStorage.getItem('search_history');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
    
    const savedRecent = localStorage.getItem('recent_searches');
    if (savedRecent) {
      setRecentSearches(JSON.parse(savedRecent));
    }
    
    const savedBookmarks = localStorage.getItem('saved_searches');
    if (savedBookmarks) {
      setSavedSearches(JSON.parse(savedBookmarks));
    }
  }, []);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          // This will be handled by parent component
        }
      }
      
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();
  
  const performSearch = useCallback(async (query: string, resetResults = true) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    
    try {
      const searchPage = resetResults ? 1 : page;
      const response = await searchContent(query, searchPage);
      
      let filteredResults = response.results;
      
      // Apply tab filter
      if (activeTab !== 'all') {
        filteredResults = filteredResults.filter(item => {
          if (activeTab === 'movie') return item.media_type === 'movie';
          if (activeTab === 'tv') return item.media_type === 'tv';
          if (activeTab === 'documentary') {
            return item.genre_ids.includes(99); // Documentary genre ID
          }
          if (activeTab === 'kids') {
            return item.genre_ids.includes(10751); // Family genre ID
          }
          return true;
        });
      }
      
      // Apply filters
      filteredResults = applyFilters(filteredResults);
      
      if (resetResults) {
        setSearchResults(filteredResults);
        setPage(1);
      } else {
        setSearchResults(prev => [...prev, ...filteredResults]);
      }
      
      setHasMore(response.page < response.total_pages);
      
      // Save to search history
      if (resetResults && query.trim()) {
        const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 20);
        setSearchHistory(newHistory);
        localStorage.setItem('search_history', JSON.stringify(newHistory));
        
        const newRecent = [query, ...recentSearches.filter(r => r !== query)].slice(0, 5);
        setRecentSearches(newRecent);
        localStorage.setItem('recent_searches', JSON.stringify(newRecent));
      }
      
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchHistory, recentSearches, activeTab, page, filters]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      performSearch(value, true);
    }, 300);
  };

  const applyFilters = (results: Content[]): SearchResult[] => {
    return results.filter(item => {
      // Genre filter
      if (filters.genres.length > 0) {
        const hasMatchingGenre = filters.genres.some(genreId => 
          item.genre_ids.includes(genreId)
        );
        if (!hasMatchingGenre) return false;
      }
      
      // Rating filter
      if (item.vote_average < filters.rating.min || item.vote_average > filters.rating.max) {
        return false;
      }
      
      // Year filter
      const year = item.media_type === 'movie' 
        ? new Date(item.release_date || '').getFullYear()
        : new Date(item.first_air_date || '').getFullYear();
      
      if (year < filters.releaseYear.min || year > filters.releaseYear.max) {
        return false;
      }
      
      return true;
    }) as SearchResult[];
  };

  const sortResults = (results: SearchResult[]): SearchResult[] => {
    return [...results].sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'rating':
          comparison = a.vote_average - b.vote_average;
          break;
        case 'release_date':
          const dateA = new Date(a.release_date || a.first_air_date || '').getTime();
          const dateB = new Date(b.release_date || b.first_air_date || '').getTime();
          comparison = dateA - dateB;
          break;
        case 'popularity':
          // Higher vote_average = more popular (using available data)
          comparison = a.vote_average - b.vote_average;
          break;
        default: // relevance
          return 0; // Keep original order from API
      }
      
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });
  };

  const handleSaveSearch = () => {
    if (searchQuery.trim() && !savedSearches.includes(searchQuery)) {
      const newSaved = [...savedSearches, searchQuery];
      setSavedSearches(newSaved);
      localStorage.setItem('saved_searches', JSON.stringify(newSaved));
    }
  };

  const startVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsVoiceSearch(true);
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        performSearch(transcript, true);
      };
      
      recognition.onend = () => {
        setIsVoiceSearch(false);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsVoiceSearch(false);
      };
      
      recognition.start();
    }
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
    performSearch(searchQuery, false);
  };

  const filteredAndSortedResults = sortResults(searchResults);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/80 backdrop-blur-sm">
      <div 
        ref={modalRef}
        className={`w-full max-w-7xl mx-4 mt-4 mb-8 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
          isDarkMode ? 'bg-gray-900/30' : 'bg-white/30'
        } backdrop-blur-xl border ${isDarkMode ? 'border-gray-700/30' : 'border-gray-200/30'}`}
        style={{ height: 'calc(100vh - 4rem)' }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDarkMode ? 'border-gray-700/30 bg-gray-800/20' : 'border-gray-200/30 bg-gray-50/20'
        }`}>
          <div className="flex items-center space-x-4 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-2xl">
              <div className="relative">
                <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search movies, TV shows, collections..."
                  className={`w-full pl-12 pr-12 py-4 rounded-xl text-lg outline-none transition-all duration-300 ${
                    isDarkMode 
                      ? 'bg-gray-800/50 text-white placeholder-gray-400 border border-gray-600/50 focus:border-netflix-red/50' 
                      : 'bg-white/50 text-gray-900 placeholder-gray-500 border border-gray-300/50 focus:border-netflix-red/50'
                  } focus:ring-2 focus:ring-netflix-red/20`}
                />
                {/* Voice Search Button */}
                <button
                  onClick={startVoiceSearch}
                  className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-colors ${
                    isVoiceSearch 
                      ? 'text-netflix-red bg-netflix-red/10' 
                      : isDarkMode 
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700/50' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                  }`}
                  title="Voice search"
                >
                  <Mic className={`w-5 h-5 ${isVoiceSearch ? 'animate-pulse' : ''}`} />
                </button>
              </div>
              
              {/* Quick Actions */}
              <div className="flex items-center space-x-2 mt-3">
                {searchQuery && (
                  <button
                    onClick={handleSaveSearch}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                      isDarkMode 
                        ? 'text-gray-400 hover:text-white hover:bg-gray-700/50' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                    }`}
                  >
                    <BookmarkPlus className="w-4 h-4" />
                    <span>Save Search</span>
                  </button>
                )}
                <kbd className={`px-2 py-1 text-xs rounded border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-gray-400' 
                    : 'bg-gray-100 border-gray-300 text-gray-500'
                }`}>
                  ⌘K
                </kbd>
              </div>
            </div>
            
            {/* Search Stats */}
            {searchResults.length > 0 && (
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {searchResults.length} results
              </div>
            )}
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className={`flex rounded-lg p-1 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-netflix-red text-white'
                    : isDarkMode
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-netflix-red text-white'
                    : isDarkMode
                      ? 'text-gray-400 hover:text-white'
                      : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            
            {/* Filters Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                showFilters
                  ? 'bg-netflix-red text-white'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
            
            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
              }`}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex h-full">
          {/* Sidebar - Filters and History */}
          <div className={`w-80 flex-shrink-0 border-r ${
            isDarkMode ? 'border-gray-700/30 bg-gray-800/20' : 'border-gray-200/30 bg-gray-50/20'
          } ${showFilters ? 'block' : 'hidden'}`}>
            <div className="p-6 h-full overflow-y-auto">
              {/* Category Tabs */}
              <div className="mb-6">
                <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Categories
                </h3>
                <div className="space-y-1">
                  {[
                    { id: 'all', label: 'All Content', icon: Globe },
                    { id: 'movie', label: 'Movies', icon: Play },
                    { id: 'tv', label: 'TV Shows', icon: Users },
                    { id: 'documentary', label: 'Documentaries', icon: Star },
                    { id: 'kids', label: 'Kids', icon: Heart }
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id as any)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeTab === id
                          ? 'bg-netflix-red text-white'
                          : isDarkMode
                            ? 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Options */}
              <div className="mb-6">
                <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Sort By
                </h3>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                  className={`w-full px-3 py-2 rounded-lg text-sm border transition-colors ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="relevance">Relevance</option>
                  <option value="rating">Rating</option>
                  <option value="release_date">Release Date</option>
                  <option value="popularity">Popularity</option>
                </select>
              </div>

              {/* Genre Filter */}
              <div className="mb-6">
                <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Genres
                </h3>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {genres.map(genre => (
                    <label key={genre.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.genres.includes(genre.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({ ...prev, genres: [...prev.genres, genre.id] }));
                          } else {
                            setFilters(prev => ({ ...prev, genres: prev.genres.filter(id => id !== genre.id) }));
                          }
                        }}
                        className="rounded border-gray-300 text-netflix-red focus:ring-netflix-red"
                      />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {genre.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rating Filter */}
              <div className="mb-6">
                <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Rating
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Min: {filters.rating.min}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.1"
                      value={filters.rating.min}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        rating: { ...prev.rating, min: parseFloat(e.target.value) }
                      }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Max: {filters.rating.max}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.1"
                      value={filters.rating.max}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        rating: { ...prev.rating, max: parseFloat(e.target.value) }
                      }))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Year Filter */}
              <div className="mb-6">
                <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Release Year
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      From: {filters.releaseYear.min}
                    </label>
                    <input
                      type="range"
                      min="1900"
                      max={new Date().getFullYear()}
                      value={filters.releaseYear.min}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        releaseYear: { ...prev.releaseYear, min: parseInt(e.target.value) }
                      }))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      To: {filters.releaseYear.max}
                    </label>
                    <input
                      type="range"
                      min="1900"
                      max={new Date().getFullYear()}
                      value={filters.releaseYear.max}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        releaseYear: { ...prev.releaseYear, max: parseInt(e.target.value) }
                      }))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Search History */}
              {searchHistory.length > 0 && (
                <div className="mb-6">
                  <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Recent Searches
                  </h3>
                  <div className="space-y-1">
                    {recentSearches.slice(0, 5).map((search, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSearchQuery(search);
                          performSearch(search, true);
                        }}
                        className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isDarkMode
                            ? 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                        }`}
                      >
                        <History className="w-3 h-3" />
                        <span className="truncate">{search}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Searches */}
              <div>
                <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Trending
                </h3>
                <div className="space-y-1">
                  {trendingSearches.slice(0, 5).map((search, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchQuery(search);
                        performSearch(search, true);
                      }}
                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isDarkMode
                          ? 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                      }`}
                    >
                      <TrendingUp className="w-3 h-3" />
                      <span className="truncate">{search}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Results */}
            <div 
              ref={resultsRef}
              className="flex-1 p-6 overflow-y-auto"
            >
              {/* Empty State */}
              {!searchQuery && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Search className={`w-16 h-16 mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Search for movies and TV shows
                  </h3>
                  <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Use the search bar above or browse trending searches
                  </p>
                  
                  {/* Trending Chips */}
                  <div className="flex flex-wrap gap-2 justify-center max-w-md">
                    {trendingSearches.slice(0, 8).map((search, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSearchQuery(search);
                          performSearch(search, true);
                        }}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          isDarkMode
                            ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                        }`}
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading State */}
              {isLoading && searchResults.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-netflix-red mb-4"></div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Searching...
                  </p>
                </div>
              )}

              {/* No Results */}
              {searchQuery && !isLoading && searchResults.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Search className={`w-16 h-16 mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    No results found
                  </h3>
                  <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Try adjusting your search or filters
                  </p>
                  
                  {/* Suggestions */}
                  <div className="space-y-2">
                    <p className={`text-xs ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                      Try searching for:
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {['Marvel', 'Action', 'Comedy', 'Drama'].map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSearchQuery(suggestion);
                            performSearch(suggestion, true);
                          }}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            isDarkMode
                              ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Results Grid/List */}
              {filteredAndSortedResults.length > 0 && (
                <>
                  <div className={viewMode === 'grid' 
                    ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'
                    : 'space-y-4'
                  }>
                    {filteredAndSortedResults.map((item) => (
                      <SearchResultCard
                        key={`${item.id}-${item.media_type}`}
                        item={item}
                        viewMode={viewMode}
                        isDarkMode={isDarkMode}
                        onNavigate={(item) => {
                          navigate(`/${item.media_type}/${item.id}`);
                          onClose();
                        }}
                        onAddToList={(item) => {
                          const content = {
                            id: item.id,
                            title: item.title,
                            name: item.name,
                            poster_path: item.poster_path,
                            vote_average: item.vote_average,
                            release_date: item.release_date,
                            first_air_date: item.first_air_date,
                            overview: item.overview,
                            genre_ids: item.genre_ids
                          };
                          
                          if (isInList(item.id, item.media_type)) {
                            // Find the item in the list and remove it
                            const existingItem = myListItems.find(listItem => 
                              listItem.contentId === item.id && listItem.contentType === item.media_type
                            );
                            if (existingItem) {
                              removeFromList(existingItem.id);
                            }
                          } else {
                            addToList(content as any, item.media_type);
                          }
                        }}
                        isInMyList={isInList(item.id, item.media_type)}
                      />
                    ))}
                  </div>
                  
                  {/* Load More */}
                  {hasMore && (
                    <div className="flex justify-center mt-8">
                      <button
                        onClick={handleLoadMore}
                        disabled={isLoading}
                        className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                          isLoading
                            ? isDarkMode
                              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-netflix-red text-white hover:bg-red-700'
                        }`}
                      >
                        {isLoading ? 'Loading...' : 'Load More'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Search Result Card Component
interface SearchResultCardProps {
  item: SearchResult;
  viewMode: 'grid' | 'list';
  isDarkMode: boolean;
  onNavigate: (item: SearchResult) => void;
  onAddToList: (item: SearchResult) => void;
  isInMyList: boolean;
}

const SearchResultCard: React.FC<SearchResultCardProps> = ({ item, viewMode, isDarkMode, onNavigate, onAddToList, isInMyList }) => {
  const title = item.title || item.name || '';
  const releaseDate = item.release_date || item.first_air_date || '';
  const year = releaseDate ? new Date(releaseDate).getFullYear() : '';
  const rating = item.vote_average;

  const handleCardClick = () => {
    onNavigate(item);
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigate(item);
  };

  const handleAddToListClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToList(item);
  };

  if (viewMode === 'list') {
    return (
      <div 
        onClick={handleCardClick}
        className={`flex items-center space-x-4 p-4 rounded-lg transition-colors hover:scale-[1.02] cursor-pointer ${
          isDarkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-100/50'
        }`}
      >
        <img
          src={getPosterUrl(item.poster_path, 'w154')}
          alt={title}
          className="w-16 h-24 object-cover rounded-lg flex-shrink-0"
          loading="lazy"
        />
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold mb-1 truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </h3>
          <p className={`text-sm mb-2 line-clamp-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {item.overview}
          </p>
          <div className="flex items-center space-x-4 text-sm">
            <span className={`${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              {year}
            </span>
            {rating > 0 && (
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {rating.toFixed(1)}
                </span>
              </div>
            )}
            <span className={`px-2 py-1 rounded text-xs ${
              item.media_type === 'movie'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {item.media_type === 'movie' ? 'Movie' : 'TV Show'}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={handlePlayClick}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
                ? 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title="Play"
          >
            <Play className="w-5 h-5" />
          </button>
          <button 
            onClick={handleAddToListClick}
            className={`p-2 rounded-lg transition-colors ${
              isInMyList
                ? 'text-netflix-red hover:text-red-400'
                : isDarkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title={isInMyList ? "Remove from My List" : "Add to My List"}
          >
            {isInMyList ? <Heart className="w-5 h-5 fill-current" /> : <Plus className="w-5 h-5" />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={handleCardClick}
      className={`group cursor-pointer transition-all duration-300 hover:scale-105 ${
        isDarkMode ? 'hover:bg-gray-800/20' : 'hover:bg-gray-100/20'
      } rounded-lg p-2`}
    >
      <div className="relative mb-3">
        <img
          src={getPosterUrl(item.poster_path)}
          alt={title}
          className="w-full aspect-[2/3] object-cover rounded-lg shadow-lg"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors duration-300 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex space-x-2">
            <button 
              onClick={handlePlayClick}
              className="p-3 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors"
              title="Play"
            >
              <Play className="w-5 h-5" />
            </button>
            <button 
              onClick={handleAddToListClick}
              className={`p-3 backdrop-blur-sm rounded-full transition-colors ${
                isInMyList
                  ? 'bg-netflix-red/80 text-white hover:bg-netflix-red'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              title={isInMyList ? "Remove from My List" : "Add to My List"}
            >
              {isInMyList ? <Heart className="w-5 h-5 fill-current" /> : <Plus className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {rating > 0 && (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center space-x-1">
            <Star className="w-3 h-3 text-yellow-500 fill-current" />
            <span className="text-white text-xs font-medium">{rating.toFixed(1)}</span>
          </div>
        )}
        <div className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${
          item.media_type === 'movie'
            ? 'bg-blue-500 text-white'
            : 'bg-green-500 text-white'
        }`}>
          {item.media_type === 'movie' ? 'Movie' : 'TV'}
        </div>
      </div>
      <div>
        <h3 className={`font-semibold text-sm mb-1 line-clamp-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </h3>
        <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          {year}
        </p>
      </div>
    </div>
  );
};

export default SearchModal;