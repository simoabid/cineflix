import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, Clock, Star, TrendingUp, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchSuggestion {
  id: string;
  title: string;
  type: 'movie' | 'tv' | 'collection' | 'person';
  year?: string;
  rating?: number;
  poster?: string;
}

interface EnhancedSearchProps {
  onClose?: () => void;
  isExpanded?: boolean;
}

const EnhancedSearch: React.FC<EnhancedSearchProps> = ({ onClose, isExpanded = false }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Marvel Cinematic Universe',
    'Christopher Nolan',
    'Horror Movies 2024',
    'Top Rated TV Shows'
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const searchFilters = [
    { id: 'all', label: 'All', icon: Search },
    { id: 'movie', label: 'Movies', icon: Star },
    { id: 'tv', label: 'TV Shows', icon: TrendingUp },
    { id: 'collection', label: 'Collections', icon: Filter },
  ];

  const mockSuggestions: SearchSuggestion[] = [
    {
      id: '1',
      title: 'Marvel Cinematic Universe',
      type: 'collection',
      year: '2008-2024',
      rating: 8.2,
      poster: '/api/placeholder/40/60'
    },
    {
      id: '2',
      title: 'The Dark Knight',
      type: 'movie',
      year: '2008',
      rating: 9.0,
      poster: '/api/placeholder/40/60'
    },
    {
      id: '3',
      title: 'Breaking Bad',
      type: 'tv',
      year: '2008-2013',
      rating: 9.5,
      poster: '/api/placeholder/40/60'
    },
    {
      id: '4',
      title: 'Star Wars Saga',
      type: 'collection',
      year: '1977-2019',
      rating: 8.5,
      poster: '/api/placeholder/40/60'
    }
  ];

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      // Add to recent searches
      setRecentSearches(prev => {
        const updated = [searchQuery, ...prev.filter(item => item !== searchQuery)].slice(0, 5);
        return updated;
      });
      
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}&filter=${selectedFilter}`);
      setQuery('');
      setSuggestions([]);
      onClose?.();
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    
    if (value.length > 0) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        const filtered = mockSuggestions.filter(item => 
          item.title.toLowerCase().includes(value.toLowerCase()) &&
          (selectedFilter === 'all' || item.type === selectedFilter)
        );
        setSuggestions(filtered);
        setIsLoading(false);
      }, 300);
    } else {
      setSuggestions([]);
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'movie': return '🎬';
      case 'tv': return '📺';
      case 'collection': return '🎭';
      case 'person': return '👤';
      default: return '🔍';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'movie': return 'text-blue-400';
      case 'tv': return 'text-green-400';
      case 'collection': return 'text-purple-400';
      case 'person': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  if (!isExpanded) {
    return (
      <div className="relative">
        <div className="flex items-center bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700/50 hover:border-netflix-red/50 transition-all duration-300">
          <Search className="w-5 h-5 text-gray-400 ml-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch(query)}
            placeholder="Search..."
            className="bg-transparent text-white placeholder-gray-400 px-3 py-3 outline-none w-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20">
      <div className="w-full max-w-4xl mx-4">
        <div className="bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
            <h2 className="text-xl font-bold text-white">Search CineFlix</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Input */}
          <div className="p-6 border-b border-gray-700/50">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(query)}
                placeholder="Search for movies, TV shows, collections, or people..."
                className="w-full bg-gray-800/50 border border-gray-600/50 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-400 focus:border-netflix-red/50 focus:outline-none focus:ring-2 focus:ring-netflix-red/20 transition-all"
              />
              {isLoading && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-netflix-red border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Search Filters */}
            <div className="flex items-center space-x-2 mt-4">
              {searchFilters.map((filter) => {
                const Icon = filter.icon;
                return (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedFilter(filter.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedFilter === filter.id
                        ? 'bg-netflix-red text-white'
                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{filter.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Results */}
          <div className="max-h-96 overflow-y-auto">
            {query && suggestions.length > 0 && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Search Results</h3>
                <div className="space-y-3">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSearch(suggestion.title)}
                      className="w-full flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-800/50 transition-colors group"
                    >
                      <div className="w-12 h-16 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                        <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                          <span className="text-2xl">{getTypeIcon(suggestion.type)}</span>
                        </div>
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="text-white font-medium group-hover:text-netflix-red transition-colors">
                          {suggestion.title}
                        </h4>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className={`text-sm font-medium ${getTypeColor(suggestion.type)}`}>
                            {suggestion.type.toUpperCase()}
                          </span>
                          {suggestion.year && (
                            <span className="text-gray-400 text-sm">{suggestion.year}</span>
                          )}
                          {suggestion.rating && (
                            <div className="flex items-center space-x-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span className="text-gray-300 text-sm">{suggestion.rating}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Searches */}
            {!query && recentSearches.length > 0 && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Recent Searches</span>
                </h3>
                <div className="space-y-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(search)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-800/50 transition-colors group"
                    >
                      <div className="flex items-center space-x-3">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300 group-hover:text-white transition-colors">
                          {search}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRecentSearches(prev => prev.filter(item => item !== search));
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {query && suggestions.length === 0 && !isLoading && (
              <div className="p-6 text-center">
                <div className="text-gray-400 mb-2">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg">No results found for "{query}"</p>
                  <p className="text-sm mt-1">Try searching for something else or check your spelling</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSearch;