import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import MegaMenu, { ALL_MEGA_MENU_ITEMS, MenuItem } from './MegaMenu';
import { ALL_BLOG_POSTS } from '../data/blogData';
import { useBlogPosts } from '@zwantum/blog/react';
import ZwosmosIcon from './ZwosmosIcon';

export interface HeaderProps {
  isLight?: boolean;
  theme?: 'dark' | 'sepia' | 'light';
  onThemeToggle?: () => void;
}

const MEGA_MENU_ITEMS_LIST: MenuItem[] = [
  ...ALL_MEGA_MENU_ITEMS,
  {
    id: 'books-archive',
    title: 'Books Archive',
    desc: 'Cosmic library & reading orbit',
    href: '/books',
    img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=300&auto=format&fit=crop'
  }
];

const MEGA_MENU_TWO_COLUMNS = {
  column1: MEGA_MENU_ITEMS_LIST.slice(0, 5),
  column2: MEGA_MENU_ITEMS_LIST.slice(5, 10)
};

export const Header: React.FC<HeaderProps> = ({ isLight: propIsLight, theme: propTheme, onThemeToggle }) => {
  const navigate = useNavigate();
  const { theme: contextTheme, toggleTheme: contextToggleTheme } = useTheme();

  // Width tracking for pure responsive layout independent of DevTools touch emulation
  const [winWidth, setWinWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const onResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Large tab (>= 800px) and desktop use desktop header
  const isMobileHeader = winWidth < 800;
  const isLargeView = winWidth >= 800;
  const isLargeTab = winWidth >= 800 && winWidth <= 1024;

  const activeTheme: 'dark' | 'sepia' | 'light' = propTheme || contextTheme || (propIsLight !== undefined ? (propIsLight ? 'light' : 'dark') : 'dark');

  // Search state
  const [searchVal, setSearchVal] = useState('');
  // Mega menu toggle
  const [menuOpen, setMenuOpen] = useState(false);
  // Explore hover mega menu
  const [exploreHovered, setExploreHovered] = useState(false);
  const exploreTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleExploreEnter = () => {
    if (exploreTimeoutRef.current) {
      clearTimeout(exploreTimeoutRef.current);
      exploreTimeoutRef.current = null;
    }
    setExploreHovered(true);
  };

  const handleExploreLeave = () => {
    if (exploreTimeoutRef.current) {
      clearTimeout(exploreTimeoutRef.current);
    }
    exploreTimeoutRef.current = setTimeout(() => {
      setExploreHovered(false);
    }, 220);
  };

  const exploreRef = useRef<HTMLDivElement>(null);
  const megaMenuCardRef = useRef<HTMLDivElement>(null);
  const [arrowLeft, setArrowLeft] = useState<number | null>(null);

  const updateArrowPosition = () => {
    if (exploreRef.current && megaMenuCardRef.current) {
      const exploreRect = exploreRef.current.getBoundingClientRect();
      const cardRect = megaMenuCardRef.current.getBoundingClientRect();
      const exploreCenter = exploreRect.left + exploreRect.width / 2;
      const calculatedLeft = exploreCenter - cardRect.left;
      if (calculatedLeft > 0 && calculatedLeft < cardRect.width) {
        setArrowLeft(calculatedLeft);
      }
    }
  };

  useEffect(() => {
    if (exploreHovered) {
      requestAnimationFrame(updateArrowPosition);
    }
  }, [exploreHovered, winWidth]);

  useEffect(() => {
    window.addEventListener('resize', updateArrowPosition);
    return () => window.removeEventListener('resize', updateArrowPosition);
  }, []);

  useEffect(() => {
    return () => {
      if (exploreTimeoutRef.current) {
        clearTimeout(exploreTimeoutRef.current);
      }
    };
  }, []);

  // Live blog posts for instant search suggestions
  const { posts: livePosts } = useBlogPosts();
  const allPosts = useMemo(() => {
    if (livePosts && livePosts.length > 0) {
      return livePosts.map(post => ({
        id: post.slug || post.id,
        category: post.categories?.[0]?.name || 'Space News',
        categorySlug: post.categories?.[0]?.slug || 'space-news',
        title: post.title,
        desc: post.excerpt || '',
        img: post.featured_image?.url || 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1600&auto=format&fit=crop',
        authorName: post.author?.name || 'Editorial Team',
        authorImg: post.author?.profile_image_url || undefined,
        date: post.published_at
          ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : 'Recent',
        readTime: `${post.reading_time || 5} min read`
      }));
    }
    return ALL_BLOG_POSTS;
  }, [livePosts]);

  // Search input focus state & live dropdown state
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showLiveResults, setShowLiveResults] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Filter matching posts & categories when user types 2+ characters
  const searchResults = useMemo(() => {
    const q = searchVal.trim().toLowerCase();
    if (q.length < 2) return { posts: [], categories: [] };

    const matchingPosts = allPosts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.desc && p.desc.toLowerCase().includes(q)) ||
      (p.authorName && p.authorName.toLowerCase().includes(q))
    ).slice(0, 3);

    const matchingCategories = ALL_MEGA_MENU_ITEMS.filter(c =>
      c.title.toLowerCase().includes(q) ||
      (c.desc && c.desc.toLowerCase().includes(q))
    ).slice(0, 3);

    return { posts: matchingPosts, categories: matchingCategories };
  }, [searchVal, allPosts]);

  // Close live results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowLiveResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPost = (postId: string | number) => {
    setShowLiveResults(false);
    setSearchOverlayOpen(false);
    navigate(`/blog/${postId}`);
  };

  const handleSelectCategory = (href: string) => {
    setShowLiveResults(false);
    setSearchOverlayOpen(false);
    navigate(href);
  };

  // Mobile search overlay
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const mobileHeaderRef = useRef<HTMLElement>(null);
  const [mobileHeaderHeight, setMobileHeaderHeight] = useState(60);

  useEffect(() => {
    if (mobileHeaderRef.current) {
      setMobileHeaderHeight(mobileHeaderRef.current.offsetHeight);
    }
  }, [winWidth, menuOpen]);

  useEffect(() => {
    if (searchOverlayOpen && mobileSearchRef.current) {
      setTimeout(() => mobileSearchRef.current?.focus(), 80);
    }
  }, [searchOverlayOpen]);

  useEffect(() => {
    if (isMobileHeader && menuOpen) {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = origOverflow;
      };
    }
  }, [isMobileHeader, menuOpen]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchVal.trim()) {
      setShowLiveResults(false);
      setSearchOverlayOpen(false);
      navigate(`/blog?search=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  const handleToggle = () => {
    if (onThemeToggle) {
      onThemeToggle();
    } else {
      contextToggleTheme();
    }
  };

  const currentIsDark = activeTheme === 'dark';
  const currentIsSepia = activeTheme === 'sepia';

  // ─── Mobile Header (< 800px) ─────────────────────────────────────────────
  if (isMobileHeader) {
    return (
      <div style={{ position: 'relative', width: '100%' }}>
        <header
          ref={mobileHeaderRef}
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            width: '100%',
            boxSizing: 'border-box',
            background: menuOpen
              ? (currentIsDark ? 'rgba(15, 8, 25, 0.35)' : 'rgba(255, 255, 255, 0.45)')
              : 'transparent',
            backdropFilter: menuOpen ? 'blur(20px) saturate(180%)' : 'none',
            WebkitBackdropFilter: menuOpen ? 'blur(20px) saturate(180%)' : 'none',
            borderBottom: menuOpen
              ? (currentIsDark ? '1px solid rgba(168, 85, 247, 0.20)' : '1px solid rgba(147, 51, 234, 0.12)')
              : 'none',
            transition: 'background 0.2s ease, border-bottom 0.2s ease'
          }}
        >
          {/* Left: Logo */}
          <Link
            to="/"
            style={{ display: 'inline-block', textDecoration: 'none', flexShrink: 0 }}
          >
            <img
              src={currentIsDark ? '/assets/icons/Zwosmos_Logo_Light.svg' : '/assets/icons/Zwosmos_Logo_Dark.svg'}
              alt="7WOSMOS"
              style={{
                width: '170px',
                height: 'auto',
                display: 'block',
                filter: currentIsDark ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.6))' : 'none',
                imageRendering: 'crisp-edges',
                transform: 'translateZ(0)',
                WebkitFontSmoothing: 'antialiased'
              }}
            />
          </Link>

          {/* Right: Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>

            {/* Theme Toggle: 3-position pill (Dark -> Sepia -> Light -> Sepia -> Dark) */}
            <button
              type="button"
              onClick={handleToggle}
              title={`Theme: ${activeTheme.charAt(0).toUpperCase() + activeTheme.slice(1)} (Click to switch)`}
              aria-label="Toggle theme (Dark, Sepia, Light)"
              style={{
                width: '54px',
                height: '22px',
                borderRadius: '9999px',
                border: currentIsDark ? '1px solid rgba(255,255,255,0.3)' : (currentIsSepia ? '1px solid rgba(217, 119, 6, 0.4)' : '1px solid #d1d5db'),
                background: currentIsDark ? 'rgba(255,255,255,0.15)' : (currentIsSepia ? '#fde8c8' : '#ffffff'),
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                flexShrink: 0,
                position: 'relative'
              }}
            >
              <span
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: currentIsDark
                    ? 'var(--brand-purple)'
                    : (currentIsSepia ? '#d97706' : '#111827'),
                  transform: currentIsDark
                    ? 'translateX(0px)'
                    : (currentIsSepia ? 'translateX(17px)' : 'translateX(34px)'),
                  transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1), background 0.25s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.58rem',
                  color: '#ffffff'
                }}
              >
                {currentIsDark ? (
                  '☾'
                ) : currentIsSepia ? (
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ display: 'block' }}
                  >
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 1 3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                ) : (
                  '☼'
                )}
              </span>
            </button>

            {/* Search Icon */}
            <button
              type="button"
              onClick={() => setSearchOverlayOpen(true)}
              title="Search"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: currentIsDark ? '#ffffff' : '#111827',
                flexShrink: 0
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {/* Hamburger */}
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              title="Menu"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 4px',
                flexShrink: 0
              }}
            >
              <span style={{
                display: 'block', width: '20px', height: '2px',
                backgroundColor: currentIsDark ? '#ffffff' : '#111827',
                borderRadius: '2px', transition: 'transform 0.2s ease',
                transform: menuOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none'
              }} />
              <span style={{
                display: 'block', width: '20px', height: '2px',
                backgroundColor: currentIsDark ? '#ffffff' : '#111827',
                borderRadius: '2px', opacity: menuOpen ? 0 : 1,
                transition: 'opacity 0.2s ease'
              }} />
              <span style={{
                display: 'block', width: '20px', height: '2px',
                backgroundColor: currentIsDark ? '#ffffff' : '#111827',
                borderRadius: '2px', transition: 'transform 0.2s ease',
                transform: menuOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none'
              }} />
            </button>
          </div>
        </header>

        {/* Mobile Search Overlay */}
        {searchOverlayOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              animation: 'megaMenuFade 0.2s ease-out'
            }}
            onClick={() => setSearchOverlayOpen(false)}
          >
            {/* Search Bar Panel */}
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: currentIsDark
                  ? 'linear-gradient(135deg, rgba(18,10,35,0.98) 0%, rgba(30,15,55,0.98) 100%)'
                  : (currentIsSepia ? 'rgba(255, 248, 238, 0.98)' : 'rgba(255,255,255,0.98)'),
                backdropFilter: 'blur(20px)',
                borderBottom: currentIsDark
                  ? '1px solid rgba(147,51,234,0.3)'
                  : '1px solid rgba(147,51,234,0.2)',
                padding: '18px 18px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.35)'
              }}
            >
              {/* Search icon inside bar */}
              <svg
                width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke={currentIsDark ? 'rgba(255,255,255,0.5)' : '#9333ea'}
                strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>

              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (searchVal.trim()) {
                    navigate(`/blog?search=${encodeURIComponent(searchVal.trim())}`);
                    setSearchOverlayOpen(false);
                    setSearchVal('');
                  }
                }}
                style={{ flex: 1, display: 'flex', alignItems: 'center' }}
              >
                <input
                  ref={mobileSearchRef}
                  type="text"
                  value={searchVal}
                  onChange={e => setSearchVal(e.target.value)}
                  placeholder="Search articles, topics..."
                  style={{
                    flex: 1,
                    height: '44px',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '1.05rem',
                    fontWeight: 500,
                    color: currentIsDark ? '#ffffff' : '#111827',
                    fontFamily: "'Lora', serif",
                    caretColor: 'var(--brand-purple)'
                  }}
                />
              </form>

              {/* Clear / Close */}
              <button
                type="button"
                onClick={() => {
                  if (searchVal) {
                    setSearchVal('');
                    mobileSearchRef.current?.focus();
                  } else {
                    setSearchOverlayOpen(false);
                  }
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: currentIsDark ? 'rgba(255,255,255,0.6)' : '#6b7280',
                  flexShrink: 0,
                  fontSize: '1.2rem',
                  lineHeight: 1
                }}
              >
                ✕
              </button>
            </div>

            {/* Mobile Live Search Results Container */}
            {searchVal.trim().length >= 2 && (
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  flex: 1,
                  maxHeight: 'calc(100vh - 120px)',
                  overflowY: 'auto',
                  WebkitOverflowScrolling: 'touch',
                  background: currentIsDark
                    ? 'linear-gradient(180deg, rgba(20, 10, 36, 0.98) 0%, rgba(10, 5, 20, 0.99) 100%)'
                    : 'rgba(255, 255, 255, 0.98)',
                  padding: '16px 18px 32px',
                  boxSizing: 'border-box'
                }}
              >
                {/* Categories */}
                {searchResults.categories.length > 0 && (
                  <div style={{ marginBottom: '14px', paddingBottom: '10px', borderBottom: currentIsDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
                    <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.64rem', color: 'var(--brand-purple)', letterSpacing: '1px', marginBottom: '8px', fontWeight: 600 }}>
                      TOPIC CATEGORIES
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {searchResults.categories.map((cat, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectCategory(cat.href)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.74rem',
                            padding: '6px 12px',
                            borderRadius: '16px',
                            background: currentIsDark ? 'rgba(147, 51, 234, 0.18)' : 'rgba(147, 51, 234, 0.1)',
                            border: '1px solid rgba(147, 51, 234, 0.3)',
                            color: currentIsDark ? '#e9d5ff' : '#7e22ce',
                            fontFamily: "'Orbitron', sans-serif",
                            cursor: 'pointer'
                          }}
                        >
                          <ZwosmosIcon size={10} color="var(--brand-purple)" /> <span>{cat.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.66rem', color: 'var(--brand-purple)', letterSpacing: '1.2px', fontWeight: 600 }}>
                    STORIES ({searchResults.posts.length})
                  </span>
                </div>

                {/* Posts List */}
                {searchResults.posts.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {searchResults.posts.map(post => (
                      <div
                        key={post.id}
                        onClick={() => handleSelectPost(post.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          background: currentIsDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                          border: currentIsDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            flexShrink: 0,
                            border: currentIsDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)'
                          }}
                        >
                          <img
                            src={post.img}
                            alt={post.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontFamily: "'Playfair Display', serif",
                              fontSize: '0.86rem',
                              fontWeight: 600,
                              lineHeight: 1.3,
                              color: currentIsDark ? '#ffffff' : '#111827',
                              overflow: 'hidden',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              textOverflow: 'ellipsis',
                              marginBottom: '3px'
                            }}
                          >
                            {post.title}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', fontFamily: "'Lora', serif" }}>
                            <span style={{ color: 'var(--brand-purple)', fontWeight: 600 }}>{post.category}</span>
                            <span style={{ color: currentIsDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>•</span>
                            <span style={{ color: currentIsDark ? 'rgba(255,255,255,0.55)' : '#6b7280' }}>{post.date}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '30px 12px', textAlign: 'center', color: currentIsDark ? 'rgba(255,255,255,0.6)' : '#6b7280', fontFamily: "'Lora', serif", fontSize: '0.88rem' }}>
                    <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'center' }}><ZwosmosIcon size={24} color="var(--brand-purple)" /></div>
                    No stories found matching "{searchVal.trim()}"
                  </div>
                )}

                {/* View All Button */}
                <div
                  onClick={() => handleSearchSubmit()}
                  style={{
                    marginTop: '14px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: 'var(--brand-purple)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: '0.76rem',
                    letterSpacing: '1px',
                    fontWeight: 600,
                    boxShadow: '0 4px 14px rgba(147, 51, 234, 0.4)'
                  }}
                >
                  <span>VIEW ALL RESULTS FOR "{searchVal.trim().toUpperCase()}"</span>
                  <span>→</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mobile Blurry & Glossy Dropdown Overlay (Fixed in place) */}
        {menuOpen && (
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: 'fixed',
              top: `${mobileHeaderHeight}px`,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99,
              background: currentIsDark
                ? 'rgba(10, 5, 20, 0.20)'
                : 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '14px 14px 28px',
              boxSizing: 'border-box',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              animation: 'megaOverlayFade 0.22s ease-out'
            }}
          >
            {/* Frosted Glass Card Container */}
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '520px',
                borderRadius: '24px',
                padding: '14px 14px 18px',
                boxSizing: 'border-box',
                background: currentIsDark
                  ? 'linear-gradient(135deg, rgba(42, 18, 68, 0.35) 0%, rgba(20, 10, 36, 0.28) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.55) 0%, rgba(246, 238, 255, 0.40) 100%)',
                backdropFilter: 'blur(28px) saturate(190%)',
                WebkitBackdropFilter: 'blur(28px) saturate(190%)',
                border: currentIsDark
                  ? '1px solid rgba(216, 180, 254, 0.24)'
                  : '1px solid rgba(147, 51, 234, 0.18)',
                boxShadow: currentIsDark
                  ? '0 16px 40px rgba(0, 0, 0, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 0 20px rgba(147, 51, 234, 0.12)'
                  : '0 12px 32px rgba(147, 51, 234, 0.10), inset 0 1px 1px rgba(255, 255, 255, 0.7)'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {MEGA_MENU_ITEMS_LIST.map((item) => (
                  <Link
                    key={item.id}
                    to={item.href}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 10px',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      background: 'transparent',
                      border: '1px solid transparent',
                      boxShadow: 'none',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    onTouchStart={(e) => {
                      e.currentTarget.style.background = currentIsDark ? 'rgba(168, 85, 247, 0.14)' : 'rgba(147, 51, 234, 0.08)';
                    }}
                    onTouchEnd={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = currentIsDark ? 'rgba(168, 85, 247, 0.12)' : 'rgba(147, 51, 234, 0.06)';
                      e.currentTarget.style.transform = 'translateX(3px)';
                      const titleEl = e.currentTarget.querySelector('.mobile-menu-title') as HTMLElement;
                      if (titleEl) titleEl.style.color = currentIsDark ? '#d8b4fe' : '#7c3aed';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.transform = 'translateX(0)';
                      const titleEl = e.currentTarget.querySelector('.mobile-menu-title') as HTMLElement;
                      if (titleEl) titleEl.style.color = currentIsDark ? '#ffffff' : '#111827';
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        minWidth: '40px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        border: currentIsDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(147, 51, 234, 0.18)',
                        boxShadow: currentIsDark ? '0 2px 6px rgba(0, 0, 0, 0.35)' : '0 2px 6px rgba(147, 51, 234, 0.08)',
                        flexShrink: 0
                      }}
                    >
                      <img
                        src={item.img}
                        alt={item.title}
                        onError={e => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=300&auto=format&fit=crop';
                        }}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <span
                        className="mobile-menu-title"
                        style={{
                          fontFamily: "'Orbitron', sans-serif",
                          fontSize: '0.80rem',
                          fontWeight: 700,
                          letterSpacing: '0.3px',
                          color: currentIsDark ? '#ffffff' : '#111827',
                          lineHeight: 1.25,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          transition: 'color 0.2s ease'
                        }}
                      >
                        {item.title}
                      </span>
                      <span
                        style={{
                          fontFamily: "'Lora', serif",
                          fontSize: '0.69rem',
                          color: currentIsDark ? 'rgba(235, 225, 255, 0.75)' : '#64748b',
                          lineHeight: 1.3,
                          marginTop: '2px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {item.desc}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const megaMenuTwoColumns = MEGA_MENU_TWO_COLUMNS;
  const spotlightPost = allPosts[0];

  // ─── Desktop & Large Tab Header (>= 800px) ───────────────────────────────
  const renderMegaMenuItem = (item: MenuItem) => (
    <Link
      key={item.id}
      to={item.href}
      onClick={() => setExploreHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 10px',
        borderRadius: '12px',
        textDecoration: 'none',
        background: 'transparent',
        border: '1px solid transparent',
        boxShadow: 'none',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: 'pointer',
        boxSizing: 'border-box'
      }}
      onMouseOver={e => {
        e.currentTarget.style.background = currentIsDark
          ? 'rgba(168, 85, 247, 0.12)'
          : 'rgba(243, 232, 255, 0.65)';
        e.currentTarget.style.borderColor = currentIsDark
          ? 'rgba(168, 85, 247, 0.25)'
          : 'rgba(147, 51, 234, 0.2)';
        e.currentTarget.style.transform = 'translateX(3px)';
        const titleEl = e.currentTarget.querySelector('.mega-drop-title') as HTMLElement;
        if (titleEl) {
          titleEl.style.color = currentIsDark ? '#d8b4fe' : '#7c3aed';
        }
        const imgEl = e.currentTarget.querySelector('.mega-drop-img') as HTMLElement;
        if (imgEl) {
          imgEl.style.transform = 'scale(1.08)';
        }
      }}
      onMouseOut={e => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.borderColor = 'transparent';
        e.currentTarget.style.transform = 'translateX(0px)';
        const titleEl = e.currentTarget.querySelector('.mega-drop-title') as HTMLElement;
        if (titleEl) {
          titleEl.style.color = currentIsDark ? '#ffffff' : '#111827';
        }
        const imgEl = e.currentTarget.querySelector('.mega-drop-img') as HTMLElement;
        if (imgEl) {
          imgEl.style.transform = 'scale(1)';
        }
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          minWidth: '40px',
          borderRadius: '10px',
          overflow: 'hidden',
          border: currentIsDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(147, 51, 234, 0.18)',
          boxShadow: currentIsDark ? '0 2px 6px rgba(0, 0, 0, 0.35)' : '0 2px 6px rgba(147, 51, 234, 0.1)'
        }}
      >
        <img
          className="mega-drop-img"
          src={item.img}
          alt={item.title}
          onError={e => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=300&auto=format&fit=crop';
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform 0.3s ease'
          }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', minWidth: 0, flex: 1 }}>
        <span
          className="mega-drop-title"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.3px',
            color: currentIsDark ? '#ffffff' : '#111827',
            transition: 'color 0.2s ease',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {item.title}
        </span>
        <span
          style={{
            fontFamily: "'Lora', serif",
            fontSize: '0.69rem',
            color: currentIsDark ? 'rgba(235, 225, 255, 0.80)' : '#64748b',
            lineHeight: 1.3,
            marginTop: '2px',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {item.desc}
        </span>
      </div>
    </Link>
  );

  return (
    <header
      style={{
        position: 'relative',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: isLargeView ? '32px 20px 20px' : '55px 24px 35px',
        textAlign: 'center',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Brand Logo with Tagline */}
      <Link
        to="/"
        style={{
          display: 'inline-block',
          textDecoration: 'none',
          transition: 'transform 0.25s ease'
        }}
        onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.02)')}
        onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        <img
          src={currentIsDark ? '/assets/icons/Zwosmos_Logo_Light.svg' : '/assets/icons/Zwosmos_Logo_Dark.svg'}
          alt="7WOSMOS - LOOK UP. THINK BEYOND."
          style={{
            width: isLargeTab ? '330px' : '380px',
            maxWidth: '90vw',
            height: 'auto',
            display: 'block',
            margin: '0 auto',
            filter: currentIsDark ? 'drop-shadow(0 6px 24px rgba(0, 0, 0, 0.75))' : 'none'
          }}
        />
      </Link>

      {/* Navigation Pill Bar & Floating Mega Menu Container */}
      <div
        style={{
          marginTop: isLargeView ? '18px' : '28px',
          position: 'relative',
          display: 'inline-flex',
          justifyContent: 'center',
          zIndex: 1000
        }}
      >
        <nav
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '22px',
          background: currentIsDark
            ? 'linear-gradient(135deg, rgba(68, 42, 96, 0.42) 0%, rgba(38, 22, 58, 0.35) 100%)'
            : (currentIsSepia
              ? 'linear-gradient(135deg, rgba(255, 248, 238, 0.94) 0%, rgba(254, 237, 213, 0.90) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(243, 232, 255, 0.75) 100%)'),
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: currentIsDark
            ? '1px solid rgba(255, 255, 255, 0.22)'
            : (currentIsSepia ? '1px solid rgba(217, 119, 6, 0.3)' : '1px solid rgba(147, 51, 234, 0.25)'),
          borderRadius: '9999px',
          padding: '9px 24px',
          boxShadow: currentIsDark
            ? '0 8px 32px rgba(0, 0, 0, 0.25), 0 0 24px rgba(168, 85, 247, 0.16), inset 0 1px 1px rgba(255, 255, 255, 0.25)'
            : (currentIsSepia
              ? '0 8px 24px rgba(217, 119, 6, 0.10), inset 0 1px 1px rgba(255, 255, 255, 0.9)'
              : '0 8px 24px rgba(147, 51, 234, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.8)')
        }}
      >
        {/* Menu Items */}
        {!menuOpen && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              animation: 'megaOverlayFade 0.2s ease-out'
            }}
          >
            {[
              { label: 'SPACE NEWS', href: '/space-news' },
              { label: 'EXPLORE', href: '/blog' },
              { label: 'SKYWATCHING', href: '/skywatching' },
              { label: 'LEARN', href: '/learn' }
            ].map(item => {
              const isExplore = item.label === 'EXPLORE';
              return (
                <div
                  key={item.label}
                  ref={isExplore ? exploreRef : undefined}
                  onMouseEnter={isExplore ? handleExploreEnter : undefined}
                  onMouseLeave={isExplore ? handleExploreLeave : undefined}
                  style={{
                    position: 'relative',
                    display: 'inline-flex',
                    alignItems: 'center'
                  }}
                >
                  <Link
                    to={item.href}
                    onClick={() => {
                      if (isExplore) setExploreHovered(false);
                    }}
                    style={{
                      color: (isExplore && exploreHovered)
                        ? (currentIsDark ? '#ffffff' : 'var(--brand-purple)')
                        : (currentIsDark ? 'rgba(255, 255, 255, 0.85)' : '#374151'),
                      textDecoration: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      letterSpacing: '1.5px',
                      fontFamily: "'Orbitron', sans-serif",
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'color 0.2s ease, text-shadow 0.2s ease',
                      textShadow: (isExplore && exploreHovered && currentIsDark)
                        ? '0 0 12px rgba(255, 255, 255, 0.8)'
                        : 'none'
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.color = currentIsDark ? '#ffffff' : 'var(--brand-purple)';
                      e.currentTarget.style.textShadow = currentIsDark ? '0 0 12px rgba(255, 255, 255, 0.8)' : 'none';
                    }}
                    onMouseOut={e => {
                      if (!isExplore || !exploreHovered) {
                        e.currentTarget.style.color = currentIsDark ? 'rgba(255, 255, 255, 0.85)' : '#374151';
                        e.currentTarget.style.textShadow = 'none';
                      }
                    }}
                  >
                    {item.label}
                    {isExplore && (
                      <span
                        style={{
                          fontSize: '0.62rem',
                          display: 'inline-block',
                          transition: 'transform 0.25s ease',
                          transform: exploreHovered ? 'rotate(180deg)' : 'rotate(0deg)',
                          opacity: 0.8
                        }}
                      >
                        ▾
                      </span>
                    )}
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* Dark, Sepia & Light Tone Toggle Pill */}
        <button
          type="button"
          onClick={handleToggle}
          title={`Theme: ${activeTheme.charAt(0).toUpperCase() + activeTheme.slice(1)} (Click to switch)`}
          aria-label="Toggle theme (Dark, Sepia, Light)"
          style={{
            width: '64px',
            height: '26px',
            borderRadius: '9999px',
            border: currentIsDark ? '1px solid rgba(255, 255, 255, 0.3)' : (currentIsSepia ? '1px solid rgba(217, 119, 6, 0.4)' : '1px solid #d1d5db'),
            background: currentIsDark ? 'rgba(255, 255, 255, 0.15)' : (currentIsSepia ? '#fde8c8' : '#ffffff'),
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            position: 'relative'
          }}
        >
          <span
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: currentIsDark
                ? 'var(--brand-purple)'
                : (currentIsSepia ? '#d97706' : '#111827'),
              transform: currentIsDark
                ? 'translateX(0px)'
                : (currentIsSepia ? 'translateX(20px)' : 'translateX(40px)'),
              transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), background 0.25s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.68rem',
              color: '#ffffff',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
            }}
          >
            {currentIsDark ? (
              '☾'
            ) : currentIsSepia ? (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ display: 'block' }}
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 1 3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            ) : (
              '☼'
            )}
          </span>
        </button>

        {/* Enhanced Modern Search Bar Pill with Live Results */}
        <div
          ref={searchContainerRef}
          style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
        >
          <form
            onSubmit={handleSearchSubmit}
            style={{ display: 'inline-flex', alignItems: 'center', position: 'relative' }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              {/* Search Glass Icon */}
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke={isSearchFocused ? '#9333ea' : '#64748b'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  position: 'absolute',
                  left: '11px',
                  pointerEvents: 'none',
                  transition: 'stroke 0.2s ease',
                  zIndex: 2
                }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>

              <input
                type="text"
                value={searchVal}
                onChange={e => {
                  setSearchVal(e.target.value);
                  setShowLiveResults(true);
                }}
                onFocus={() => {
                  setIsSearchFocused(true);
                  if (searchVal.trim().length >= 2) setShowLiveResults(true);
                }}
                onBlur={() => setIsSearchFocused(false)}
                onKeyDown={e => {
                  if (e.key === 'Escape') setShowLiveResults(false);
                }}
                placeholder="Search..."
                style={{
                  width: (isSearchFocused || (showLiveResults && searchVal.trim().length >= 2)) ? '190px' : '135px',
                  height: '30px',
                  background: currentIsSepia
                    ? 'linear-gradient(135deg, rgba(255, 248, 238, 0.96) 0%, rgba(254, 239, 215, 0.92) 100%)'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(246,243,255,0.92) 100%)',
                  border: (isSearchFocused || (showLiveResults && searchVal.trim().length >= 2))
                    ? (currentIsSepia ? '1px solid #d97706' : '1px solid #9333ea')
                    : (currentIsSepia ? '1px solid rgba(217, 119, 6, 0.35)' : '1px solid rgba(255,255,255,0.6)'),
                  borderRadius: '9999px',
                  padding: searchVal ? '0 28px 0 32px' : '0 18px 0 32px',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  color: '#0f172a',
                  fontFamily: "'Orbitron', sans-serif",
                  letterSpacing: '0.5px',
                  outline: 'none',
                  boxShadow: (isSearchFocused || (showLiveResults && searchVal.trim().length >= 2))
                    ? '0 0 0 3px rgba(147,51,234,0.28), 0 4px 16px rgba(147,51,234,0.2)'
                    : '0 2px 8px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.8)',
                  transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)'
                }}
              />

              {searchVal && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchVal('');
                    setShowLiveResults(false);
                  }}
                  title="Clear search"
                  style={{
                    position: 'absolute',
                    right: '8px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#cbd5e1',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '10px',
                    lineHeight: 1,
                    color: '#475569',
                    padding: 0
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </form>

          {/* Desktop Live Search Autocomplete Dropdown */}
          {showLiveResults && searchVal.trim().length >= 2 && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 14px)',
                right: 0,
                width: '390px',
                maxWidth: 'calc(100vw - 32px)',
                background: currentIsDark
                  ? 'linear-gradient(145deg, rgba(22, 11, 38, 0.98) 0%, rgba(13, 6, 24, 0.99) 100%)'
                  : (currentIsSepia
                    ? 'linear-gradient(145deg, rgba(255, 248, 238, 0.99) 0%, rgba(254, 239, 215, 0.99) 100%)'
                    : 'linear-gradient(145deg, rgba(255, 255, 255, 0.99) 0%, rgba(249, 246, 255, 0.99) 100%)'),
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: currentIsDark
                  ? '1px solid rgba(168, 85, 247, 0.35)'
                  : (currentIsSepia ? '1px solid rgba(217, 119, 6, 0.35)' : '1px solid rgba(147, 51, 234, 0.25)'),
                borderRadius: '16px',
                boxShadow: currentIsDark
                  ? '0 20px 50px rgba(0,0,0,0.75), 0 0 24px rgba(168,85,247,0.2)'
                  : '0 20px 45px rgba(147,51,234,0.18), 0 4px 16px rgba(0,0,0,0.06)',
                padding: '12px',
                boxSizing: 'border-box',
                zIndex: 1000,
                animation: 'megaOverlayFade 0.2s ease-out',
                textAlign: 'left'
              }}
            >
              {/* Matching Categories Chips (if any) */}
              {searchResults.categories.length > 0 && (
                <div style={{ marginBottom: '10px', paddingBottom: '8px', borderBottom: currentIsDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.62rem', color: 'var(--brand-purple)', letterSpacing: '1px', marginBottom: '6px', fontWeight: 600 }}>
                    CATEGORIES
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {searchResults.categories.map((cat, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectCategory(cat.href)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '0.72rem',
                          padding: '4px 10px',
                          borderRadius: '14px',
                          background: currentIsDark ? 'rgba(147, 51, 234, 0.18)' : 'rgba(147, 51, 234, 0.1)',
                          border: '1px solid rgba(147, 51, 234, 0.3)',
                          color: currentIsDark ? '#e9d5ff' : '#7e22ce',
                          fontFamily: "'Orbitron', sans-serif",
                          cursor: 'pointer',
                          transition: 'all 0.18s ease'
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.background = 'var(--brand-purple)';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.background = currentIsDark ? 'rgba(147, 51, 234, 0.18)' : 'rgba(147, 51, 234, 0.1)';
                          e.currentTarget.style.color = currentIsDark ? '#e9d5ff' : '#7e22ce';
                        }}
                      >
                        <ZwosmosIcon size={10} color="currentColor" /> <span>{cat.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px 8px 6px' }}>
                <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.64rem', color: 'var(--brand-purple)', letterSpacing: '1px', fontWeight: 600 }}>
                  STORIES ({searchResults.posts.length})
                </span>
                <span style={{ fontSize: '0.68rem', color: currentIsDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)', fontFamily: "'Lora', serif" }}>
                  Press Enter to search
                </span>
              </div>

              {/* Post Items */}
              {searchResults.posts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
                  {searchResults.posts.map(post => (
                    <div
                      key={post.id}
                      onClick={() => handleSelectPost(post.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        transition: 'all 0.18s ease'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.background = currentIsDark ? 'rgba(147, 51, 234, 0.2)' : 'rgba(147, 51, 234, 0.08)';
                        e.currentTarget.style.transform = 'translateX(3px)';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      {/* Thumbnail */}
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          flexShrink: 0,
                          border: currentIsDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)'
                        }}
                      >
                        <img
                          src={post.img}
                          alt={post.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            lineHeight: 1.25,
                            color: currentIsDark ? '#ffffff' : '#111827',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            textOverflow: 'ellipsis',
                            marginBottom: '1px'
                          }}
                        >
                          {post.title}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', fontFamily: "'Lora', serif" }}>
                          <span style={{ color: 'var(--brand-purple)', fontWeight: 600 }}>{post.category}</span>
                          <span style={{ color: currentIsDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>•</span>
                          <span style={{ color: currentIsDark ? 'rgba(255,255,255,0.55)' : '#6b7280' }}>{post.date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '24px 12px', textAlign: 'center', color: currentIsDark ? 'rgba(255,255,255,0.6)' : '#6b7280', fontFamily: "'Lora', serif", fontSize: '0.82rem' }}>
                  <div style={{ marginBottom: '4px', display: 'flex', justifyContent: 'center' }}><ZwosmosIcon size={20} color="var(--brand-purple)" /></div>
                  No stories found matching "{searchVal.trim()}"
                </div>
              )}

              {/* Footer: View all results */}
              <div
                onClick={() => handleSearchSubmit()}
                style={{
                  marginTop: '8px',
                  paddingTop: '8px',
                  borderTop: currentIsDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  color: 'var(--brand-purple)',
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '0.72rem',
                  letterSpacing: '1px',
                  fontWeight: 600,
                  padding: '8px 4px',
                  borderRadius: '8px',
                  transition: 'all 0.18s ease'
                }}
                onMouseOver={e => (e.currentTarget.style.background = currentIsDark ? 'rgba(147, 51, 234, 0.15)' : 'rgba(147, 51, 234, 0.08)')}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span>VIEW ALL RESULTS FOR "{searchVal.trim().toUpperCase()}"</span>
                <span>→</span>
              </div>
            </div>
          )}
        </div>

        {/* Hamburger Menu Icon */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          title="Menu"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 4px',
            color: currentIsDark ? '#ffffff' : '#111827'
          }}
        >
          <span style={{
            display: 'block', width: '18px', height: '2px',
            backgroundColor: currentIsDark ? '#ffffff' : '#111827',
            borderRadius: '2px', transition: 'transform 0.2s ease',
            transform: menuOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none'
          }} />
          <span style={{
            display: 'block', width: '18px', height: '2px',
            backgroundColor: currentIsDark ? '#ffffff' : '#111827',
            borderRadius: '2px', opacity: menuOpen ? 0 : 1,
            transition: 'opacity 0.2s ease'
          }} />
          <span style={{
            display: 'block', width: '18px', height: '2px',
            backgroundColor: currentIsDark ? '#ffffff' : '#111827',
            borderRadius: '2px', transition: 'transform 0.2s ease',
            transform: menuOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none'
          }} />
        </button>
      </nav>

      {/* Floating Mega Menu Dropdown on EXPLORE hover */}
      <div
        onMouseEnter={handleExploreEnter}
        onMouseLeave={handleExploreLeave}
        style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: exploreHovered ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-6px)',
          opacity: exploreHovered ? 1 : 0,
          visibility: exploreHovered ? 'visible' : 'hidden',
          pointerEvents: exploreHovered ? 'auto' : 'none',
          paddingTop: '12px',
          zIndex: 1001,
          transition: 'opacity 0.22s ease, transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.22s'
        }}
      >
        <div
          ref={megaMenuCardRef}
          style={{
            position: 'relative',
            width: 'min(980px, 94vw)',
            borderRadius: '24px',
            padding: '22px 26px 28px',
            background: currentIsDark
              ? 'linear-gradient(135deg, rgba(78, 48, 112, 0.55) 0%, rgba(46, 26, 75, 0.50) 100%)'
              : (currentIsSepia
                ? 'linear-gradient(135deg, rgba(255, 248, 238, 0.94) 0%, rgba(254, 237, 213, 0.90) 100%)'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(248, 242, 255, 0.92) 100%)'),
            backdropFilter: 'blur(28px) saturate(190%)',
            WebkitBackdropFilter: 'blur(28px) saturate(190%)',
            border: currentIsDark
              ? '1px solid rgba(216, 180, 254, 0.35)'
              : (currentIsSepia ? '1px solid rgba(217, 119, 6, 0.3)' : '1px solid rgba(147, 51, 234, 0.22)'),
            boxShadow: currentIsDark
              ? '0 16px 48px rgba(0, 0, 0, 0.32), 0 0 32px rgba(168, 85, 247, 0.18), inset 0 1px 1px rgba(255, 255, 255, 0.25)'
              : '0 20px 50px rgba(109, 40, 217, 0.12), 0 4px 16px rgba(0, 0, 0, 0.04), inset 0 1px 1px rgba(255, 255, 255, 0.95)',
            boxSizing: 'border-box'
          }}
        >
            {/* Top Pointer / Arrow pointing directly to EXPLORE button */}
            <div
              style={{
                position: 'absolute',
                top: '-8px',
                left: arrowLeft !== null ? `${arrowLeft}px` : '31%',
                transform: 'translateX(-50%) rotate(45deg)',
                width: '14px',
                height: '14px',
                background: currentIsDark
                  ? 'rgba(72, 44, 105, 0.96)'
                  : '#ffffff',
                borderTop: currentIsDark
                  ? '1px solid rgba(216, 180, 254, 0.5)'
                  : '1px solid rgba(147, 51, 234, 0.35)',
                borderLeft: currentIsDark
                  ? '1px solid rgba(216, 180, 254, 0.5)'
                  : '1px solid rgba(147, 51, 234, 0.35)',
                borderRight: 'none',
                borderBottom: 'none',
                boxShadow: currentIsDark
                  ? '-3px -3px 8px rgba(168, 85, 247, 0.2)'
                  : '-3px -3px 6px rgba(109, 40, 217, 0.1)',
                zIndex: 10,
                pointerEvents: 'none'
              }}
            />
            {/* Top header row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '14px',
                marginBottom: '16px',
                borderBottom: currentIsDark
                  ? '1px solid rgba(255, 255, 255, 0.12)'
                  : '1px solid rgba(147, 51, 234, 0.12)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ZwosmosIcon size={12} color={currentIsDark ? '#c084fc' : '#9333ea'} />
                <span
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '2px',
                    color: currentIsDark ? '#e9d5ff' : '#6b21a8',
                    textTransform: 'uppercase'
                  }}
                >
                  Explore All Topics
                </span>
              </div>
              <Link
                to="/blog"
                onClick={() => setExploreHovered(false)}
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  letterSpacing: '1px',
                  color: currentIsDark ? 'rgba(216, 180, 254, 0.85)' : '#9333ea',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'color 0.2s ease, transform 0.2s ease'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.color = currentIsDark ? '#ffffff' : '#7c3aed';
                  e.currentTarget.style.transform = 'translateX(2px)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.color = currentIsDark ? 'rgba(216, 180, 254, 0.85)' : '#9333ea';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                View Blog Feed →
              </Link>
            </div>

            {/* Split Layout: Spotlight on Left + 2-Column Box Menu on Right */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '280px minmax(0, 1fr)',
                gap: '20px',
                alignItems: 'stretch'
              }}
            >
              {/* Left Side: Spotlight / Featured Post (Full Height) */}
              <div
                style={{
                  borderRight: currentIsDark
                    ? '1px solid rgba(255, 255, 255, 0.10)'
                    : '1px solid rgba(147, 51, 234, 0.12)',
                  paddingRight: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                {/* Related Section Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      letterSpacing: '1.5px',
                      color: currentIsDark ? '#c084fc' : '#9333ea',
                      textTransform: 'uppercase',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <ZwosmosIcon size={11} color="currentColor" /> Spotlight Story
                  </span>
                  <span
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                      fontSize: '0.62rem',
                      letterSpacing: '0.5px',
                      color: currentIsDark ? 'rgba(216, 180, 254, 0.7)' : '#7c3aed',
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: currentIsDark ? 'rgba(168, 85, 247, 0.12)' : 'rgba(147, 51, 234, 0.08)'
                    }}
                  >
                    Featured
                  </span>
                </div>

                {/* Single Featured Story - Normal layout: image on top, content below */}
                {spotlightPost && (
                  <Link
                    to={`/blog/${spotlightPost.id}`}
                    onClick={() => setExploreHovered(false)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      textDecoration: 'none',
                      padding: '6px',
                      borderRadius: '12px',
                      background: 'transparent',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.background = currentIsDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(147, 51, 234, 0.04)';
                      const img = e.currentTarget.querySelector('.spotlight-img') as HTMLElement;
                      if (img) img.style.transform = 'scale(1.03)';
                      const title = e.currentTarget.querySelector('.spotlight-title') as HTMLElement;
                      if (title) title.style.color = currentIsDark ? '#c084fc' : '#7c3aed';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.background = 'transparent';
                      const img = e.currentTarget.querySelector('.spotlight-img') as HTMLElement;
                      if (img) img.style.transform = 'scale(1)';
                      const title = e.currentTarget.querySelector('.spotlight-title') as HTMLElement;
                      if (title) title.style.color = currentIsDark ? '#ffffff' : '#111827';
                    }}
                  >
                    {/* Thumbnail Image at Top */}
                    <div
                      style={{
                        width: '100%',
                        height: '135px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        position: 'relative',
                        marginBottom: '10px',
                        flexShrink: 0,
                        border: currentIsDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(147, 51, 234, 0.15)'
                      }}
                    >
                      <img
                        className="spotlight-img"
                        src={spotlightPost.img}
                        alt={spotlightPost.title}
                        onError={e => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=600&auto=format&fit=crop';
                        }}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                          transition: 'transform 0.35s ease'
                        }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          background: 'rgba(15, 10, 25, 0.8)',
                          backdropFilter: 'blur(6px)',
                          WebkitBackdropFilter: 'blur(6px)',
                          border: '1px solid rgba(216, 180, 254, 0.35)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          fontFamily: "'Orbitron', sans-serif",
                          color: '#e9d5ff',
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase'
                        }}
                      >
                        {spotlightPost.category}
                      </span>
                    </div>

                    {/* Content below image: Title, Excerpt, and CTA */}
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <h4
                        className="spotlight-title"
                        style={{
                          margin: '0 0 6px 0',
                          fontFamily: "'Orbitron', sans-serif",
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          lineHeight: 1.35,
                          color: currentIsDark ? '#ffffff' : '#111827',
                          transition: 'color 0.2s ease',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {spotlightPost.title}
                      </h4>

                      {spotlightPost.desc && (
                        <p
                          style={{
                            margin: '0 0 10px 0',
                            fontFamily: "'Lora', serif",
                            fontSize: '0.72rem',
                            lineHeight: 1.45,
                            color: currentIsDark ? 'rgba(255, 255, 255, 0.65)' : '#4b5563',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {spotlightPost.desc}
                        </p>
                      )}

                      <div
                        style={{
                          marginTop: 'auto',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: '6px',
                          borderTop: currentIsDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
                          fontSize: '0.68rem',
                          color: currentIsDark ? 'rgba(216, 180, 254, 0.7)' : '#6b7280',
                          fontFamily: "'Lora', serif"
                        }}
                      >
                        <span>{spotlightPost.readTime}</span>
                        <span
                          style={{
                            fontFamily: "'Orbitron', sans-serif",
                            fontSize: '0.66rem',
                            fontWeight: 700,
                            color: currentIsDark ? '#c084fc' : '#9333ea',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          Read Story →
                        </span>
                      </div>
                    </div>
                  </Link>
                )}
              </div>

              {/* Right Side: 2 Columns of Box Topics */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {megaMenuTwoColumns.column1.map(item => renderMegaMenuItem(item))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {megaMenuTwoColumns.column2.map(item => renderMegaMenuItem(item))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Mega Menu */}
      <MegaMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );

};

export default Header;
