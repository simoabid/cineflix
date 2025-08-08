import React, { useState } from 'react';
import { 
  Play, 
  MoreVertical, 
  Star, 
  Clock, 
  Calendar, 
  Trash2, 
  Edit3, 
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

interface GridViewProps {
  items: MyListItem[];
  selectedItems: string[];
  onItemSelect: (itemId: string, selected: boolean) => void;
  onItemUpdate: (itemId: string, updates: Partial<MyListItem>) => void;
  onItemRemove: (itemId: string) => void;
}

const GridView: React.FC<GridViewProps> = ({
  items,
  selectedItems,
  onItemSelect,
  onItemUpdate,
  onItemRemove
}) => {
  const [showingMenu, setShowingMenu] = useState<string | null>(null);

  const getImageUrl = (path: string | null, size: string = 'w300') => {
    if (!path) return '/api/placeholder/300/450';
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

  const ItemCard: React.FC<{ item: MyListItem }> = ({ item }) => {
    const isSelected = selectedItems.includes(item.id);

    return (
      <div className="group relative bg-gray-900 rounded-lg overflow-hidden hover:scale-105 transition-all duration-200">
        {/* Selection Checkbox */}
        <div className="absolute top-2 left-2 z-10">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onItemSelect(item.id, !isSelected);
            }}
            className={`p-1 rounded transition-colors ${
              isSelected 
                ? 'bg-netflix-red text-white' 
                : 'bg-black/60 text-white hover:bg-black/80'
            }`}
          >
            {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
          </button>
        </div>

        {/* Priority Indicator */}
        <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${getPriorityColor(item.priority)}`}></div>

        {/* Liked Indicator */}
        {item.isLiked && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
            <div className="bg-red-600/80 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg flex items-center gap-1">
              <Heart className="w-3 h-3 text-white fill-current" />
              <span className="text-white text-xs font-medium">Liked</span>
            </div>
          </div>
        )}

        {/* Menu Button */}
        <div className="absolute top-2 right-8 z-10">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowingMenu(showingMenu === item.id ? null : item.id);
            }}
            className="p-1 bg-black/60 text-white rounded hover:bg-black/80 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Dropdown Menu */}
          {showingMenu === item.id && (
            <div className="absolute right-0 top-8 bg-gray-800 rounded-lg shadow-lg py-2 min-w-48 z-20">
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

        <Link to={`/${item.contentType}/${item.contentId}`} className="block">
          <div className="aspect-[2/3] relative">
            <img
              src={getImageUrl(item.content.poster_path)}
              alt={getTitle(item)}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            
            {/* Progress Bar */}
            {item.progress > 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2">
                <div className="w-full bg-gray-600 rounded-full h-1 mb-1">
                  <div 
                    className="bg-netflix-red h-1 rounded-full transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <p className="text-xs text-white">{formatProgress(item.progress)} watched</p>
              </div>
            )}

            {/* Play Button Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center">
              <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
          </div>
        </Link>

        {/* Card Info */}
        <div className="p-3">
          <h3 className="text-white font-medium text-sm mb-2 line-clamp-2">{getTitle(item)}</h3>
          
          <div className="space-y-1 text-xs text-gray-400">
            <div className="flex items-center justify-between">
              <span>{getYear(item)}</span>
              <span className="capitalize">{item.contentType}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span>{formatRuntime(item.estimatedRuntime)}</span>
              <span className={getStatusColor(item.status)}>
                {item.status.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </div>

            {item.content.vote_average > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-400" />
                <span>{item.content.vote_average.toFixed(1)}</span>
              </div>
            )}

            {item.personalRating && (
              <div className="flex items-center gap-1">
                <span className="text-yellow-400">★</span>
                <span>Your rating: {item.personalRating}/5</span>
              </div>
            )}

            {item.customTags.length > 0 && (
              <div className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                <span className="truncate">{item.customTags.join(', ')}</span>
              </div>
            )}

            <div className="flex items-center gap-1 text-xs">
              <Calendar className="w-3 h-3" />
              <span>Added {new Date(item.dateAdded).toLocaleDateString()}</span>
            </div>
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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {items.map(item => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
};

export default GridView;
