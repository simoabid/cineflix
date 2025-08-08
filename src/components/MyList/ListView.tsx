import React, { useState } from 'react';
import { 
  Play, 
  MoreVertical, 
  Star, 
  Clock, 
  Calendar, 
  Trash2, 
  CheckSquare, 
  Square,
  Flag,
  Tag,
  Eye,
  EyeOff,
  Heart
} from 'lucide-react';
import { MyListItem, ContentStatus, PriorityLevel } from '../../types/myList';
import { Link } from 'react-router-dom';

interface ListViewProps {
  items: MyListItem[];
  selectedItems: string[];
  onItemSelect: (itemId: string, selected: boolean) => void;
  onItemUpdate: (itemId: string, updates: Partial<MyListItem>) => void;
  onItemRemove: (itemId: string) => void;
}

const ListView: React.FC<ListViewProps> = ({
  items,
  selectedItems,
  onItemSelect,
  onItemUpdate,
  onItemRemove
}) => {
  const [showingMenu, setShowingMenu] = useState<string | null>(null);

  const getImageUrl = (path: string | null, size: string = 'w154') => {
    if (!path) return '/api/placeholder/154/231';
    return `https://image.tmdb.org/t/p/${size}${path}`;
  };

  const getTitle = (item: MyListItem) => {
    return (item.content as any).title || (item.content as any).name || 'Unknown Title';
  };

  const getYear = (item: MyListItem) => {
    const date = (item.content as any).release_date || (item.content as any).first_air_date;
    return date ? new Date(date).getFullYear() : '';
  };

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatProgress = (progress: number) => {
    return `${Math.round(progress)}%`;
  };

  const getPriorityColor = (priority: PriorityLevel) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: ContentStatus) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'inProgress': return 'text-yellow-400';
      case 'dropped': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const handleStatusChange = (itemId: string, status: ContentStatus) => {
    const progress = status === 'completed' ? 100 : status === 'notStarted' ? 0 : undefined;
    onItemUpdate(itemId, { status, ...(progress !== undefined && { progress }) });
    setShowingMenu(null);
  };

  const handlePriorityChange = (itemId: string, priority: PriorityLevel) => {
    onItemUpdate(itemId, { priority });
    setShowingMenu(null);
  };

  const ItemRow: React.FC<{ item: MyListItem }> = ({ item }) => {
    const isSelected = selectedItems.includes(item.id);

    return (
      <div className="group bg-gray-900/50 hover:bg-gray-800/50 rounded-lg p-4 transition-colors">
        <div className="flex items-center gap-4">
          {/* Selection Checkbox */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onItemSelect(item.id, !isSelected);
            }}
            className={`p-1 rounded transition-colors ${
              isSelected 
                ? 'bg-netflix-red text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
          </button>

          {/* Thumbnail */}
          <Link to={`/${item.contentType}/${item.contentId}`} className="flex-shrink-0">
            <div className="w-16 h-24 relative rounded overflow-hidden group-hover:scale-105 transition-transform">
              <img
                src={getImageUrl(item.content.poster_path)}
                alt={getTitle(item)}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <Play className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </Link>

          {/* Content Info */}
          <div className="flex-1 min-w-0">
            <Link to={`/${item.contentType}/${item.contentId}`}>
              <h3 className="text-white font-medium text-lg mb-1 hover:text-netflix-red transition-colors">
                {getTitle(item)}
              </h3>
            </Link>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-2">
              <span>{getYear(item)}</span>
              <span>•</span>
              <span className="capitalize">{item.contentType}</span>
              <span>•</span>
              <span>{formatRuntime(item.estimatedRuntime)}</span>
              {item.content.vote_average > 0 && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span>{item.content.vote_average.toFixed(1)}</span>
                  </div>
                </>
              )}
            </div>

            <p className="text-gray-400 text-sm line-clamp-2 mb-2">
              {item.content.overview}
            </p>

            {/* Tags and Notes */}
            <div className="flex flex-wrap gap-2 mb-2">
              {item.customTags.map(tag => (
                <span key={tag} className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
                  {tag}
                </span>
              ))}
            </div>

            {item.personalNotes && (
              <p className="text-gray-400 text-sm italic">
                "{item.personalNotes}"
              </p>
            )}
          </div>

          {/* Status and Progress */}
          <div className="flex-shrink-0 text-right">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${getPriorityColor(item.priority)}`}></div>
              {item.isLiked && (
                <div className="bg-red-600/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                  <Heart className="w-3 h-3 text-white fill-current" />
                  <span className="text-white text-xs font-medium">Liked</span>
                </div>
              )}
              <span className={`text-sm ${getStatusColor(item.status)}`}>
                {item.status.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </div>

            {item.progress > 0 && (
              <div className="w-24 mb-2">
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-netflix-red h-2 rounded-full transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{formatProgress(item.progress)}</p>
              </div>
            )}

            {item.personalRating && (
              <div className="flex items-center gap-1 justify-end mb-2">
                <span className="text-yellow-400">★</span>
                <span className="text-sm text-gray-400">{item.personalRating}/5</span>
              </div>
            )}

            <div className="text-xs text-gray-500">
              Added {new Date(item.dateAdded).toLocaleDateString()}
            </div>
          </div>

          {/* Menu Button */}
          <div className="flex-shrink-0 relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowingMenu(showingMenu === item.id ? null : item.id);
              }}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Dropdown Menu */}
            {showingMenu === item.id && (
              <div className="absolute right-0 top-10 bg-gray-800 rounded-lg shadow-lg py-2 min-w-48 z-20">
                {/* Status Options */}
                <div className="px-3 py-1 text-xs text-gray-400 border-b border-gray-700">Status</div>
                <button
                  onClick={() => handleStatusChange(item.id, 'notStarted')}
                  className="w-full text-left px-3 py-2 hover:bg-gray-700 text-white text-sm flex items-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  Not Started
                </button>
                <button
                  onClick={() => handleStatusChange(item.id, 'inProgress')}
                  className="w-full text-left px-3 py-2 hover:bg-gray-700 text-white text-sm flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  In Progress
                </button>
                <button
                  onClick={() => handleStatusChange(item.id, 'completed')}
                  className="w-full text-left px-3 py-2 hover:bg-gray-700 text-white text-sm flex items-center gap-2"
                >
                  <CheckSquare className="w-4 h-4" />
                  Completed
                </button>
                <button
                  onClick={() => handleStatusChange(item.id, 'dropped')}
                  className="w-full text-left px-3 py-2 hover:bg-gray-700 text-white text-sm flex items-center gap-2"
                >
                  <EyeOff className="w-4 h-4" />
                  Dropped
                </button>

                {/* Priority Options */}
                <div className="px-3 py-1 text-xs text-gray-400 border-b border-gray-700 mt-2">Priority</div>
                <button
                  onClick={() => handlePriorityChange(item.id, 'high')}
                  className="w-full text-left px-3 py-2 hover:bg-gray-700 text-white text-sm flex items-center gap-2"
                >
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  High Priority
                </button>
                <button
                  onClick={() => handlePriorityChange(item.id, 'medium')}
                  className="w-full text-left px-3 py-2 hover:bg-gray-700 text-white text-sm flex items-center gap-2"
                >
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  Medium Priority
                </button>
                <button
                  onClick={() => handlePriorityChange(item.id, 'low')}
                  className="w-full text-left px-3 py-2 hover:bg-gray-700 text-white text-sm flex items-center gap-2"
                >
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  Low Priority
                </button>

                {/* Actions */}
                <div className="px-3 py-1 text-xs text-gray-400 border-b border-gray-700 mt-2">Actions</div>
                <button
                  onClick={() => {
                    onItemRemove(item.id);
                    setShowingMenu(null);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-700 text-red-400 text-sm flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove from List
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setShowingMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="space-y-2">
      {items.map(item => (
        <ItemRow key={item.id} item={item} />
      ))}
    </div>
  );
};

export default ListView;
