import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Globe, 
  Home,
  Film,
  Tv,
  FileText,
  Crown,
  TrendingUp,
  Star,
  Calendar,
  Bookmark,
  Clock,
  Download,
  Users,
  Settings,
  Shield,
  HelpCircle,
  MessageCircle,
  Share2,
  Heart,
  User,
  Play,
  ChevronDown,
  ChevronUp,
  Search,
  Bell,
  Award,
  Sparkles,
  BarChart3,
  Accessibility,
  Lock,
  Code,
  Lightbulb,
  Plus,
  Linkedin,
  Github,
  MessageSquare
} from 'lucide-react';

/**
 * Pure helper exported for unit tests to get the current year.
 * Keeps year derivation deterministic and easily mockable in tests.
 */
export const getCurrentYear = (): number => {
  return new Date().getFullYear();
};

/**
 * LinkItem describes a single link or action shown in footer sections.
 * - name: Display label
 * - href: Optional URL; if absent, action should be provided
 * - icon: Optional icon component to render (fallbacks are provided where used)
 * - badge/count/color: Optional UI adornments
 * - action: Optional callback for button actions
 */
interface LinkItem {
  name: string;
  href?: string;
  icon?: React.ComponentType<any>;
  badge?: string;
  count?: string;
  color?: string;
  action?: () => void;
}

/**
 * Props for each grouped footer section.
 */
interface FooterSectionProps {
  title: string;
  links: LinkItem[];
  sectionKey: string;
  showCounts?: boolean;
  showBadges?: boolean;
}

interface FooterProps {}

/**
 * Render a quick action button used in the top-right area of the footer.
 * Exported as a pure function to enable easy unit testing.
 */
export const renderQuickAction = (actionItem: LinkItem): JSX.Element => {
  const handleClick = actionItem.action ?? (() => {});
  const Icon = actionItem.icon ?? Search;

  return (
    <motion.button
      key={actionItem.name}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="relative p-3 bg-gray-800/50 hover:bg-netflix-red/20 rounded-full transition-colors duration-300 group"
      onClick={() => {
        try {
          handleClick();
        } catch {
          /* swallow action errors to avoid breaking footer UI */
        }
      }}
    >
      <Icon className="w-5 h-5 text-gray-400 group-hover:text-netflix-red transition-colors duration-300" />
      {actionItem.badge && (
        <span className="absolute -top-1 -right-1 bg-netflix-red text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
          {actionItem.badge}
        </span>
      )}
    </motion.button>
  );
};

/**
 * Render a social item tile. Exported so it can be unit tested separately.
 */
export const renderSocialItem = (socialLink: LinkItem): JSX.Element => {
  const Icon = socialLink.icon ?? Globe;
  const href = socialLink.href ?? '#';
  const colorStyle = socialLink.color ? { '--social-color': socialLink.color } as any : undefined;

  return (
    <motion.a
      key={socialLink.name}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.95 }}
      className="group p-4 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl transition-all duration-300 flex flex-col items-center gap-2"
      style={colorStyle}
    >
      <Icon className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors duration-300" />
      <span className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors duration-300">
        {socialLink.name}
      </span>
    </motion.a>
  );
};

/**
 * FooterSection - internal helper component to render grouped footer links.
 * Separated as a typed sub-component for clarity and testability.
 */
const FooterSection: React.FC<FooterSectionProps & {
  expandedSection: string | null;
  toggleSection: (section: string) => void;
}> = ({ 
  title, 
  links, 
  sectionKey, 
  showCounts = false, 
  showBadges = false,
  expandedSection,
  toggleSection
}) => {
  const isExpanded = expandedSection === sectionKey;

  const renderLinkItem = (link: LinkItem, index: number) => {
    const Icon = link.icon ?? Globe;
    return (
      <motion.li
        key={link.name}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        {link.href ? (
          <a
            href={link.href}
            className="group flex items-center gap-3 text-gray-400 hover:text-white transition-all duration-300 hover:translate-x-2"
          >
            <Icon className="w-4 h-4 text-netflix-red group-hover:scale-110 transition-transform duration-300" />
            <span className="flex-1">{link.name}</span>
            {showCounts && link.count && (
              <span className="bg-netflix-red text-white text-xs px-2 py-1 rounded-full font-medium">
                {link.count}
              </span>
            )}
            {showBadges && link.badge && (
              <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                {link.badge}
              </span>
            )}
          </a>
        ) : (
          <button
            onClick={() => {
              try {
                link.action && link.action();
              } catch {
                /* swallow action errors to avoid breaking footer UI */
              }
            }}
            className="group flex items-center gap-3 text-gray-400 hover:text-white transition-all duration-300 hover:translate-x-2"
          >
            <Icon className="w-4 h-4 text-netflix-red group-hover:scale-110 transition-transform duration-300" />
            <span className="flex-1 text-left">{link.name}</span>
            {showCounts && link.count && (
              <span className="bg-netflix-red text-white text-xs px-2 py-1 rounded-full font-medium">
                {link.count}
              </span>
            )}
            {showBadges && link.badge && (
              <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                {link.badge}
              </span>
            )}
          </button>
        )}
      </motion.li>
    );
  };

  return (
    <div className="footer-section">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="flex items-center justify-between w-full text-left group md:pointer-events-none"
      >
        <h3 className="text-lg font-semibold text-white mb-6 group-hover:text-netflix-red transition-colors duration-300 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-netflix-red" />
          {title}
        </h3>
        <ChevronDown 
          className={`w-5 h-5 text-gray-400 transition-transform duration-300 md:hidden ${
            isExpanded ? 'rotate-180' : ''
          }`} 
        />
      </button>
      
      <AnimatePresence>
        {(isExpanded || typeof window !== 'undefined' && window.innerWidth >= 768) && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="space-y-4"
          >
            {links.map((link, index) => renderLinkItem(link, index))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Footer component - primary export. Renders the site footer with multiple sections.
 */
const Footer: React.FC<FooterProps> = () => {
  const currentYear = getCurrentYear();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    try {
      observer = new IntersectionObserver(
        ([entry]) => setIsVisible(entry.isIntersecting),
        { threshold: 0.1 }
      );
      
      const footerElement = document.querySelector('#cineflix-footer');
      if (footerElement && observer) observer.observe(footerElement);
    } catch (error) {
      // Graceful fallback: if IntersectionObserver is not available or errors, just show footer animations
      setIsVisible(true);
    }

    return () => {
      try {
        if (observer) observer.disconnect();
      } catch {
        /* ignore disconnect errors */
      }
    };
  }, []);

  const smartBrowseLinks: LinkItem[] = [
    { name: 'Home', href: '/', icon: Home, badge: '12 New' },
    { name: 'Movies', href: '/movies', icon: Film, badge: 'Latest' },
    { name: 'TV Shows', href: '/tv-shows', icon: Tv, badge: '5 Episodes' },
    { name: 'Documentaries', href: '/documentaries', icon: FileText },
    { name: 'Originals', href: '/originals', icon: Crown, badge: 'Exclusive' },
    { name: 'Collections', href: '/collections', icon: Star },
    { name: 'New & Popular', href: '/new-popular', icon: TrendingUp },
    { name: 'Coming Soon', href: '/coming-soon', icon: Calendar, badge: 'Preview' },
  ];

  const myCineFlixLinks: LinkItem[] = [
    { name: 'My List', href: '/my-list', icon: Bookmark, count: '24' },
    { name: 'Watch History', href: '/history', icon: Clock, count: '156' },
    { name: 'Continue Watching', href: '/continue', icon: Play, count: '8' },
    { name: 'Downloaded', href: '/downloads', icon: Download, count: '12' },
    { name: 'Favorites', href: '/favorites', icon: Heart, count: '43' },
    { name: 'Watch Later', href: '/watch-later', icon: Plus, count: '31' },
    { name: 'Family Profiles', href: '/profiles', icon: Users },
    { name: 'Viewing Stats', href: '/stats', icon: BarChart3 },
  ];

  const communityLinks: LinkItem[] = [
    { name: 'Reviews & Ratings', href: '/reviews', icon: Star },
    { name: 'Discussion Forums', href: '/forums', icon: MessageCircle },
    { name: 'Watch Parties', href: '/watch-parties', icon: Users },
    { name: 'Friend Activity', href: '/friends', icon: Share2 },
    { name: 'Share & Recommend', href: '/share', icon: Share2 },
    { name: 'CineFlix Blog', href: '/blog', icon: FileText },
    { name: 'Creator Spotlights', href: '/creators', icon: Award },
    { name: 'Fan Communities', href: '/communities', icon: Users },
  ];

  const premiumFeatureLinks: LinkItem[] = [
    { name: 'Quality Settings', href: '/settings/quality', icon: Settings },
    { name: 'Download Management', href: '/settings/downloads', icon: Download },
    { name: 'Accessibility Options', href: '/settings/accessibility', icon: Accessibility },
    { name: 'Data & Privacy', href: '/settings/privacy', icon: Shield },
    { name: 'Account Security', href: '/settings/security', icon: Lock },
  ];

  const supportLinks: LinkItem[] = [
    { name: 'Help Center', href: '/help', icon: HelpCircle },
    { name: 'Community Support', href: '/community-help', icon: Users },
    { name: 'Feature Requests', href: '/feature-requests', icon: Lightbulb },
    { name: 'Developer API', href: '/api', icon: Code },
    { name: 'Contact Us', href: '/contact', icon: MessageCircle },
  ];

  const socialLinks: LinkItem[] = [
    { name: 'Facebook', icon: Facebook, href: 'https://facebook.com/simoabidx', color: '#1877F2' },
    { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/SeeMooAbid', color: '#1DA1F2' },
    { name: 'Instagram', icon: Instagram, href: 'https://instagram.com/simoabiid', color: '#E4405F' },
    { name: 'Discord', icon: MessageSquare, href: 'https://discord.gg/seemoo.a', color: '#5865F2' },
    { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com/company/mohamed-amine-abidd', color: '#0A66C2' },
    { name: 'GitHub', icon: Github, href: 'https://github.com/simoabid', color: '#333' },
  ];

  const quickActions: LinkItem[] = [
    { name: 'Search', icon: Search, action: () => {} },
    { name: 'Notifications', icon: Bell, action: () => {}, badge: '3' },
    { name: 'Profile', icon: User, action: () => {} },
  ];

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <footer 
      id="cineflix-footer"
      className="relative bg-gradient-to-b from-[#0a0a0a] via-[#0d0d0d] to-[#111111] border-t border-gray-800/50 overflow-hidden"
    >
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-netflix-red/10 via-transparent to-netflix-red/5"></div>
        <motion.div
          className="absolute inset-0"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(229, 9, 20, 0.15) 1px, transparent 0)',
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
          transition={{ duration: 0.6 }}
          className="py-12 border-b border-gray-800/50"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="flex items-center gap-4">
              <div className="relative">
                <motion.div
                  className="text-4xl font-black bg-gradient-to-r from-netflix-red via-red-500 to-netflix-red bg-clip-text text-transparent"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  CINEFLIX
                </motion.div>
                <motion.div
                  className="absolute -bottom-1 left-0 h-1 bg-gradient-to-r from-netflix-red to-transparent"
                  initial={{ width: 0 }}
                  animate={{ width: isVisible ? '100%' : 0 }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </div>
              <div className="hidden lg:block text-sm text-gray-400">
                <p className="font-medium">Premium Streaming Experience</p>
                <p className="text-xs">Unlimited Entertainment</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {quickActions.map((action) => renderQuickAction(action))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="py-16"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
            <FooterSection
              title="Smart Browse"
              links={smartBrowseLinks}
              sectionKey="browse"
              showBadges={true}
              expandedSection={expandedSection}
              toggleSection={toggleSection}
            />
            <FooterSection
              title="My CineFlix"
              links={myCineFlixLinks}
              sectionKey="mycineflix"
              showCounts={true}
              expandedSection={expandedSection}
              toggleSection={toggleSection}
            />
            <FooterSection
              title="Community & Social"
              links={communityLinks}
              sectionKey="community"
              expandedSection={expandedSection}
              toggleSection={toggleSection}
            />
            <FooterSection
              title="Premium Features"
              links={premiumFeatureLinks}
              sectionKey="premium"
              expandedSection={expandedSection}
              toggleSection={toggleSection}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="py-12 border-t border-gray-800/50"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-netflix-red" />
                Support & Resources
              </h3>
              <ul className="space-y-4">
                {supportLinks.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="group flex items-center gap-3 text-gray-400 hover:text-white transition-all duration-300"
                    >
                      {link.icon ? (
                        <link.icon className="w-4 h-4 text-netflix-red group-hover:scale-110 transition-transform duration-300" />
                      ) : (
                        <HelpCircle className="w-4 h-4 text-netflix-red group-hover:scale-110 transition-transform duration-300" />
                      )}
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Globe className="w-5 h-5 text-netflix-red" />
                Language & Accessibility
              </h3>
              <div className="space-y-4">
                <div className="relative">
                  <select
                    className="w-full bg-gray-800/50 text-gray-300 px-4 py-3 pr-10 rounded-lg border border-gray-700 hover:border-netflix-red focus:outline-none focus:ring-2 focus:ring-netflix-red focus:border-netflix-red appearance-none cursor-pointer transition-colors duration-300"
                    defaultValue="en"
                  >
                    <option value="en">🇺🇸 English</option>
                    <option value="es">🇪🇸 Español</option>
                    <option value="fr">🇫🇷 Français</option>
                    <option value="de">🇩🇪 Deutsch</option>
                    <option value="ja">🇯🇵 日本語</option>
                    <option value="ko">🇰🇷 한국어</option>
                    <option value="zh">🇨🇳 中文</option>
                  </select>
                  <Globe className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-gray-800/50 text-xs rounded-full text-gray-400">Subtitles</span>
                  <span className="px-3 py-1 bg-gray-800/50 text-xs rounded-full text-gray-400">Audio Description</span>
                  <span className="px-3 py-1 bg-gray-800/50 text-xs rounded-full text-gray-400">High Contrast</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-netflix-red" />
                Connect With Us
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {socialLinks.map((socialLink) => renderSocialItem(socialLink))}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="py-8 border-t border-gray-800/50"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex flex-wrap gap-6 text-sm text-gray-400">
              <a href="/terms" className="hover:text-white transition-colors duration-300">Terms of Service</a>
              <a href="/privacy" className="hover:text-white transition-colors duration-300">Privacy Policy</a>
              <a href="/cookies" className="hover:text-white transition-colors duration-300">Cookie Settings</a>
              <a href="/legal" className="hover:text-white transition-colors duration-300">Legal Notices</a>
            </div>
            <div className="text-sm text-gray-500">
              <p>© {currentYear} CINEFLIX, Inc. All rights reserved.</p>
              <p className="text-xs mt-1">Built with ❤️ by ABID.Dev for movie lovers worldwide 🎥</p>
            </div>
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="absolute bottom-8 right-8 p-4 bg-netflix-red hover:bg-red-600 rounded-full shadow-lg transition-colors duration-300 group"
        >
          <ChevronUp className="w-5 h-5 text-white group-hover:animate-bounce" />
        </motion.button>
      </div>
    </footer>
  );
};

export default Footer;