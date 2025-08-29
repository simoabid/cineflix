import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  User, 
  ChevronDown, 
  Home,
  Film,
  Tv,
  Star,
  TrendingUp,
  Bookmark,
  Settings,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  Download,
  Heart,
  Clock,
  Crown,
  Maximize,
  Minimize
} from 'lucide-react';
import SearchModal from './SearchModal';

/**
 * Type for a navigation item used in the navbar.
 */
export interface NavigationItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
}

/**
 * Type for a notification item used in the navbar.
 */
export interface NotificationItem {
  id: number | string;
  title: string;
  time: string;
  type?: 'new' | 'update' | string;
}

/**
 * Props for the Navbar component.
 * Currently empty but documented for future extension.
 */
export interface NavbarProps {}

/**
 * Simple validator to ensure a value is a non-empty string.
 * @param value - value to validate
 */
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

/**
 * Sanitize and clamp a search query provided by the user.
 * - trims whitespace
 * - limits length to 200 characters
 * - returns empty string if invalid
 *
 * This is a pure helper extracted for testability and reuse.
 * @param query - raw query string
 */
export const sanitizeSearchQuery = (query: unknown): string => {
  if (!isNonEmptyString(query)) return '';
  const trimmed = query.trim();
  return trimmed.length > 200 ? trimmed.slice(0, 200) : trimmed;
};

/**
 * Validate navigation items ensuring each has a safe path and required fields.
 * Returns a new array with sanitized paths (fallbacks to '/') and logs warnings for invalid entries.
 * This is pure and side-effect free except for console warnings for visibility.
 * @param items - raw navigation items
 */
export const validateNavigationItems = (items: unknown): NavigationItem[] => {
  if (!Array.isArray(items)) {
    console.warn('validateNavigationItems expected an array, falling back to default navigation.');
    return [{ name: 'Home', path: '/', icon: Home }];
  }

  return items
    .map((it) => {
      if (typeof it !== 'object' || it === null) return null;
      const candidate = it as Partial<NavigationItem>;
      const name = isNonEmptyString(candidate.name) ? candidate.name : 'Untitled';
      const icon = (candidate.icon as React.ComponentType<any>) || Home;
      let path = isNonEmptyString(candidate.path) ? candidate.path.trim() : '/';
      if (!path.startsWith('/')) {
        // ensure path is route-safe
        path = `/${path}`;
      }
      return { name, path, icon } as NavigationItem;
    })
    .filter(Boolean) as NavigationItem[];
};

/**
 * Validate notification items to ensure shape correctness.
 * Returns a sanitized list with safe defaults where necessary.
 * @param items - raw notification items
 */
export const validateNotificationItems = (items: unknown): NotificationItem[] => {
  if (!Array.isArray(items)) {
    return [];
  }
  return items
    .map((n) => {
      if (typeof n !== 'object' || n === null) return null;
      const candidate = n as Partial<NotificationItem>;
      const id = candidate.id ?? Math.random().toString(36).slice(2, 9);
      const title = isNonEmptyString(candidate.title) ? candidate.title : 'No title';
      const time = isNonEmptyString(candidate.time) ? candidate.time : 'Unknown';
      const type = candidate.type ?? 'update';
      return { id, title, time, type } as NotificationItem;
    })
    .filter(Boolean) as NotificationItem[];
};

/**
 * Determine whether a given route path is active for the current location.
 * Guards against non-string inputs and normalizes trailing slashes so '/path' and '/path/' are considered equal.
 * This is exported as a pure helper for reuse and testing.
 * @param currentPath - current location pathname
 * @param routePath - route path to compare against
 */
export const isActiveRoute = (currentPath: unknown, routePath: unknown): boolean => {
  if (!isNonEmptyString(currentPath) || !isNonEmptyString(routePath)) return false;
  const normalize = (p: string) => (p !== '/' && p.endsWith('/') ? p.slice(0, -1) : p);
  return normalize(currentPath) === normalize(routePath);
};

/**
 * Navbar component - top site navigation including search, theme, and user menu controls.
 *
 * Behavior remains unchanged from previous implementation. State and event handlers are
 * isolated into smaller internal functions to reduce cognitive complexity and improve testability.
 *
 * No props are expected for this component; it's a top-level UI piece connected to router via useLocation.
 */
const Navbar: React.FC<NavbarProps> = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const location = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Raw data definitions (kept minimal and validated)
  const rawNotifications = [
    { id: 1, title: 'New Marvel movie added', time: '2 min ago', type: 'new' },
    { id: 2, title: 'Your watchlist updated', time: '1 hour ago', type: 'update' },
    { id: 3, title: 'New season available', time: '3 hours ago', type: 'new' },
  ];

  const rawNavigationItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Movies', path: '/movies', icon: Film },
    { name: 'TV Shows', path: '/tv-shows', icon: Tv },
    { name: 'Collections', path: '/collections', icon: Star },
    { name: 'New & Popular', path: '/new-popular', icon: TrendingUp },
    { name: 'My List', path: '/my-list', icon: Bookmark },
  ];

  // Validated data used in rendering
  const notifications = validateNotificationItems(rawNotifications);
  const navigationItems = validateNavigationItems(rawNavigationItems);

  /**
   * Toggle fullscreen mode using the Fullscreen API.
   * Kept as an internal function for isolation and easy testing.
   */
  const toggleFullscreen = async (): Promise<void> => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  // Small helper actions to centralize state mutations
  const openSearchModal = () => setIsSearchModalOpen(true);
  const closeSearchModal = () => setIsSearchModalOpen(false);
  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const toggleTheme = () => setIsDarkMode((prev) => !prev);
  const toggleUserMenu = () => setUserMenuOpen((prev) => !prev);
  const toggleNotifications = () => setNotificationsOpen((prev) => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Event handlers isolated for readability and testability
  const handleScroll = () => {
    setIsScrolled(window.scrollY > 10);
  };

  const handleClickOutside = (event: MouseEvent) => {
    try {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    } catch (e) {
      // Defensive: ignore exceptions from unexpected event targets
      console.warn('Error in handleClickOutside:', e);
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    // Open search modal with Cmd+K or Ctrl+K
    const key = event && (event as KeyboardEvent).key;
    if ((event.metaKey || event.ctrlKey) && typeof key === 'string' && key.toLowerCase() === 'k') {
      event.preventDefault();
      openSearchModal();
    }
    // Toggle fullscreen with F11
    if (key === 'F11') {
      event.preventDefault();
      toggleFullscreen();
    }
    // Close mobile menu with Escape
    if (key === 'Escape' && mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };

  useEffect(() => {
    // Prevent body scroll when mobile menu is open
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'bg-black/20 backdrop-blur-xl border-b border-white/10 shadow-2xl'
            : 'bg-black/10 backdrop-blur-md'
        }`}
      >
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4 sm:space-x-8">
              <Link 
                to="/" 
                className="flex-shrink-0 transition-all duration-300 hover:scale-105 group"
              >
                <img 
                  src="/cineflix-logo.png" 
                  alt="CineFlix" 
                  className="h-32 sm:h-36 lg:h-40 w-auto"
                />
              </Link>
              
              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center space-x-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 relative group ${
                        isActiveRoute(location.pathname, item.path)
                          ? 'text-white bg-netflix-red shadow-lg'
                          : 'text-gray-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Mobile Menu Button */}
              <button 
                onClick={toggleMobileMenu}
                className="lg:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors backdrop-blur-sm"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Enhanced Search - Responsive */}
              <div ref={searchRef} className="relative">
                <button
                  onClick={openSearchModal}
                  className="flex items-center bg-black/20 backdrop-blur-md rounded-xl transition-all duration-300 border border-white/20 hover:border-netflix-red/50 hover:bg-black/30 group"
                >
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 ml-2 sm:ml-3 group-hover:text-white transition-colors" />
                  <span className="hidden sm:block text-gray-400 px-2 sm:px-3 py-2 sm:py-3 group-hover:text-white transition-colors text-sm">
                    Search movies, TV shows...
                  </span>
                  <kbd className="hidden lg:flex items-center space-x-1 bg-gray-700/50 text-gray-400 text-xs px-2 py-1 rounded mr-2 sm:mr-3 group-hover:bg-gray-600/50 group-hover:text-gray-300 transition-colors">
                    <span>⌘</span>
                    <span>K</span>
                  </kbd>
                </button>
              </div>
              
              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors backdrop-blur-sm"
                title="Toggle theme"
              >
                {isDarkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
              
              {/* Fullscreen Toggle - Hidden on mobile */}
              <button 
                onClick={toggleFullscreen}
                className="hidden sm:block p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors backdrop-blur-sm"
                title={isFullscreen ? "Exit fullscreen (F11)" : "Enter fullscreen (F11)"}
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
              
              {/* Notifications - Responsive */}
              <div ref={notificationsRef} className="relative">
                <button 
                  onClick={toggleNotifications}
                  className="relative p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors backdrop-blur-sm"
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-netflix-red rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">{notifications.length}</span>
                  </span>
                </button>
                
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-black/40 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-700/50">
                      <h3 className="text-white font-semibold">Notifications</h3>
                    </div>
                    {notifications.map((notification) => (
                      <div key={notification.id} className="px-4 py-3 hover:bg-gray-700/50 transition-colors">
                        <div className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            notification.type === 'new' ? 'bg-green-500' : 'bg-blue-500'
                          }`}></div>
                          <div className="flex-1">
                            <p className="text-sm text-white">{notification.title}</p>
                            <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="px-4 py-3 border-t border-gray-700/50">
                      <button className="text-sm text-netflix-red hover:text-red-400 transition-colors">
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* User Profile Dropdown - Responsive */}
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-2 p-2 hover:bg-white/10 rounded-lg transition-colors backdrop-blur-sm"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-netflix-red via-red-600 to-red-700 rounded-full flex items-center justify-center ring-2 ring-gray-700/50">
                    <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <ChevronDown className={`hidden sm:block w-4 h-4 text-gray-300 transition-transform duration-300 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-black/40 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 py-2 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-700/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-netflix-red via-red-600 to-red-700 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm sm:text-base">John Doe</p>
                          <p className="text-gray-400 text-xs sm:text-sm">Premium Member</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Menu Items */}
                    <div className="py-2">
                      <Link to="/profile" className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors">
                        <User className="w-4 h-4" />
                        <span>My Profile</span>
                      </Link>
                      <Link to="/my-list" className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors">
                        <Heart className="w-4 h-4" />
                        <span>My List</span>
                      </Link>
                      <Link to="/watchlist" className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors">
                        <Clock className="w-4 h-4" />
                        <span>Continue Watching</span>
                      </Link>
                      <Link to="/downloads" className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors">
                        <Download className="w-4 h-4" />
                        <span>Downloads</span>
                      </Link>
                      <Link to="/account" className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors">
                        <Settings className="w-4 h-4" />
                        <span>Account Settings</span>
                      </Link>
                    </div>
                    
                    <div className="border-t border-gray-700/50 py-2">
                      <button className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors">
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sign In Button - Hidden on mobile */}
              <button className="hidden sm:flex items-center space-x-2 bg-netflix-red hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 text-sm">
                <Crown className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu - Enhanced */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" ref={mobileMenuRef}>
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={closeMobileMenu}></div>
          <div className="fixed top-14 sm:top-16 left-0 right-0 bg-black/20 backdrop-blur-xl border-b border-white/10 shadow-2xl">
            <div className="p-4 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMobileMenu}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                      isActiveRoute(location.pathname, item.path)
                        ? 'text-white bg-netflix-red shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              
              {/* Mobile-specific actions */}
              <div className="pt-4 border-t border-gray-700/50 mt-4">
                <button
                  onClick={() => {
                    openSearchModal();
                    closeMobileMenu();
                  }}
                  className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Search className="w-5 h-5" />
                  <span>Search</span>
                </button>
                
                <button
                  onClick={() => {
                    toggleTheme();
                    closeMobileMenu();
                  }}
                  className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  <span>Toggle Theme</span>
                </button>
                
                <button className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                  <Crown className="w-5 h-5" />
                  <span>Sign In</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={closeSearchModal}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />
    </>
  );
};

export default Navbar;