import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMobile } from '../contexts/MobileContext';
import { useTheme } from '../contexts/ThemeContext';
import { BlogCard } from '../components/common/BlogCard';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import ZwosmosIcon from '../components/common/ZwosmosIcon';
import { useBlogPosts } from '@zwantum/blog/react';
import { useSEO } from '../lib/seoService';
import { getPostDisplayDate } from '../lib/dateUtils';

// The exact 9 categories from MegaMenu + All Stories
const BLOG_CATEGORIES = [
  { label: 'All Stories', value: 'ALL' },
  { label: 'Space News', value: 'Space News' },
  { label: 'Solar System', value: 'Solar System' },
  { label: 'Telescopes & Technology', value: 'Telescopes & Technology' },
  { label: 'Universe', value: 'Universe' },
  { label: 'Space Exploration', value: 'Space Exploration' },
  { label: 'Skywatching', value: 'Skywatching' },
  { label: 'Space Culture', value: 'Space Culture' },
  { label: 'Explainers', value: 'Explainers' },
  { label: 'People & History', value: 'People & History' }
];

const POSTS_PER_PAGE = 12;

const BlogIndexPage: React.FC = () => {
  const { isMobile } = useMobile();
  const { theme, isDark } = useTheme();
  const isLight = !isDark;
  const isSepia = theme === 'sepia';
  const { posts: livePosts, loading } = useBlogPosts();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>(urlSearch);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useSEO({
    title: selectedCategory !== 'ALL' ? `${selectedCategory} - Cosmic Dispatches` : 'Cosmic Feed - All Stories & Astrophysical Dispatches',
    description: 'Explore the full spectrum of astrophysics, planetary sciences, cosmic explorations, and deep-space revelations.',
    type: 'website'
  });

  // Read cached live posts synchronously to prevent any reload flash of empty or fallback content
  const cachedPosts = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('zw_cached_all_posts');
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }, []);

  useEffect(() => {
    if (livePosts && livePosts.length > 0) {
      try {
        sessionStorage.setItem('zw_cached_all_posts', JSON.stringify(livePosts));
      } catch {}
    }
  }, [livePosts]);

  const activeLivePosts = (livePosts && livePosts.length > 0) ? livePosts : (cachedPosts || []);

  // Synchronize when URL search param changes
  useEffect(() => {
    setSearchQuery(urlSearch);
    if (urlSearch) {
      setCurrentPage(1);
    }
  }, [urlSearch]);

  // Combine live database posts (strictly from DB / cache, no mock fallback)
  const allPosts = useMemo(() => {
    if (activeLivePosts && activeLivePosts.length > 0) {
      return activeLivePosts.map((post: any) => ({
        id: post.slug || post.id,
        category: post.categories?.[0]?.name || 'Space News',
        categorySlug: post.categories?.[0]?.slug || 'space-news',
        title: post.title,
        desc: post.excerpt || '',
        img: (typeof post.featured_image?.url === 'string' ? post.featured_image.url : '') || (typeof post.custom_fields?.featured_image_url === 'string' ? post.custom_fields.featured_image_url : '') || 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1600&auto=format&fit=crop',
        authorName: post.author?.name || 'Editorial Team',
        authorImg: post.author?.profile_image_url || undefined,
        date: getPostDisplayDate(post.published_at, post.updated_at, { format: 'short', prefix: 'Updated ' }).displayDate || 'Recent',
        readTime: `${post.reading_time || 5} min read`
      }));
    }
    return [];
  }, [activeLivePosts]);

  // Reset page when category changes
  const handleCategorySelect = (catVal: string) => {
    setSelectedCategory(catVal);
    setCurrentPage(1);
  };

  // Reset page and sync URL when search changes
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    if (query.trim()) {
      setSearchParams({ search: query.trim() }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchParams({}, { replace: true });
    setCurrentPage(1);
  };

  // Filtered posts based on category and search query
  const filteredPosts = useMemo(() => {
    return allPosts.filter((post: any) => {
      const postCat = (post.category || '').toLowerCase();
      const selCat = selectedCategory.toLowerCase();
      const isExplainersMatch =
        (selCat === 'explainers' || selCat === 'learn') &&
        (postCat === 'explainers' || postCat === 'learn');
      const matchesCat = selectedCategory === 'ALL' || postCat === selCat || isExplainersMatch;
      const query = searchQuery.trim().toLowerCase();
      if (!query) return matchesCat;
      const matchesSearch =
        post.title.toLowerCase().includes(query) ||
        post.desc.toLowerCase().includes(query) ||
        post.authorName.toLowerCase().includes(query) ||
        post.category.toLowerCase().includes(query);
      return matchesCat && matchesSearch;
    });
  }, [allPosts, selectedCategory, searchQuery]);

  // Total pages
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);

  // Paginated subset of posts
  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
    return filteredPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);
  }, [filteredPosts, currentPage]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: isDark
          ? 'radial-gradient(ellipse at top center, rgba(147, 51, 234, 0.25) 0%, var(--bg-main) 60%)'
          : (isSepia ? '#fff3e0' : '#ffffff'),
        backgroundColor: isDark ? 'var(--bg-main)' : (isSepia ? '#fff3e0' : '#ffffff'),
        color: isDark ? 'white' : '#111827',
        boxSizing: 'border-box',
        transition: 'background 0.3s ease, background-color 0.3s ease, color 0.3s ease'
      }}
    >
      {/* Global Shared Header */}
      <Header />

      <div
        style={{
          maxWidth: '1260px',
          margin: '0 auto',
          padding: isMobile ? '20px 14px 50px' : '35px 24px 70px',
          boxSizing: 'border-box'
        }}
      >
        {/* ========================================================================= */}
        {/* PAGE HERO HEADER                                                          */}
        {/* ========================================================================= */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '35px' : '45px' }}>
          <div
            style={{
              color: '#bd75ff',
              fontFamily: '"Noto Sans", sans-serif',
              fontSize: '0.84rem',
              fontWeight: 400,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <ZwosmosIcon size={12} color="#bd75ff" />
            <span>Cosmic Chronicles</span>
            <ZwosmosIcon size={12} color="#bd75ff" />
          </div>

          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(1.55rem, 1rem + 3vw, 3.6rem)',
              lineHeight: 1.15,
              margin: '0 0 16px 0',
              color: isLight ? '#111827' : '#ffffff'
            }}
          >
            Stories from the Cosmos
          </h1>

          <p
            style={{
              fontFamily: "'Lora', serif",
              fontSize: isMobile ? '1.02rem' : '1.16rem',
              color: isLight ? '#4b5563' : 'rgba(255, 255, 255, 0.72)',
              maxWidth: '680px',
              margin: '0 auto 28px auto',
              lineHeight: 1.6
            }}
          >
            Dive into the latest discoveries, observational dispatches, and cosmological treatises from across the universe.
          </p>

          {/* Search Bar */}
          <div
            style={{
              maxWidth: '560px',
              margin: '0 auto',
              position: 'relative'
            }}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search stories by topic, title, or author..."
              style={{
                width: '100%',
                padding: '14px 20px 14px 44px',
                borderRadius: '30px',
                border: isDark
                  ? '1px solid rgba(147, 51, 234, 0.45)'
                  : isSepia
                  ? '1px solid rgba(217, 119, 6, 0.35)'
                  : '1px solid #d1d5db',
                background: isDark
                  ? 'rgba(20, 15, 35, 0.7)'
                  : isSepia
                  ? '#fef6ea'
                  : '#ffffff',
                color: isLight ? '#111827' : '#ffffff',
                fontSize: '0.94rem',
                fontFamily: "'Lora', serif",
                outline: 'none',
                boxSizing: 'border-box',
                boxShadow: isSepia
                  ? '0 4px 14px rgba(217, 119, 6, 0.08)'
                  : isLight
                  ? '0 4px 14px rgba(0,0,0,0.06)'
                  : '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 15px rgba(147, 51, 234, 0.15)'
              }}
            />
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={isSepia ? '#b45309' : (isLight ? '#6b7280' : 'rgba(216, 180, 254, 0.75)')}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                position: 'absolute',
                left: '18px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>

            {searchQuery && (
              <button
                onClick={handleClearSearch}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: isSepia ? '#78350f' : (isLight ? '#9ca3af' : 'rgba(255,255,255,0.5)'),
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ALL 9 MEGA MENU CATEGORIES (Fluid Inline Typography, No Capsules)          */}
        {/* ========================================================================= */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: isMobile ? '12px 18px' : '16px 28px',
            maxWidth: '1000px',
            margin: '0 auto',
            marginBottom: isMobile ? '40px' : '60px'
          }}
        >
          {BLOG_CATEGORIES.map(cat => {
            const isActive = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => handleCategorySelect(cat.value)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px 6px',
                  cursor: 'pointer',
                  fontFamily: "'Playfair Display', serif",
                  fontSize: isMobile ? '1.02rem' : '1.18rem',
                  fontWeight: isActive ? 700 : 400,
                  color: isActive
                    ? 'var(--brand-purple)'
                    : isLight
                    ? '#4b5563'
                    : 'rgba(255, 255, 255, 0.65)',
                  position: 'relative',
                  transition: 'color 0.2s ease, text-shadow 0.2s ease',
                  textShadow: isActive && !isLight ? '0 0 14px rgba(168, 85, 247, 0.6)' : 'none',
                  outline: 'none',
                  letterSpacing: '0.2px'
                }}
                onMouseOver={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--brand-purple)';
                    if (!isLight) e.currentTarget.style.textShadow = '0 0 12px rgba(168, 85, 247, 0.4)';
                  }
                }}
                onMouseOut={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = isLight ? '#4b5563' : 'rgba(255, 255, 255, 0.65)';
                    e.currentTarget.style.textShadow = 'none';
                  }
                }}
              >
                {cat.label}
                {isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '-2px',
                      left: '6px',
                      right: '6px',
                      height: '2px',
                      borderRadius: '2px',
                      background: 'var(--brand-purple)',
                      boxShadow: '0 0 8px var(--brand-purple)'
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* STORIES CATALOG & COUNTER                                                 */}
        {/* ========================================================================= */}
        <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div
            style={{
              fontFamily: '"Noto Sans", sans-serif',
              fontSize: '0.82rem',
              fontWeight: 400,
              color: isLight ? '#6b7280' : 'rgba(255, 255, 255, 0.55)',
              letterSpacing: '2px',
              textTransform: 'uppercase'
            }}
          >
            SHOWING {filteredPosts.length === 0 ? 0 : `${(currentPage - 1) * POSTS_PER_PAGE + 1}–${Math.min(filteredPosts.length, currentPage * POSTS_PER_PAGE)}`} OF {filteredPosts.length} STORIES
          </div>
        </div>

        {loading && allPosts.length === 0 ? (
          <div className="blog-cards-grid">
            <style>{`
              @keyframes zw-idx-skel {
                0%, 100% { opacity: 0.35; }
                50% { opacity: 0.8; }
              }
              .zw-idx-skel {
                animation: zw-idx-skel 1.5s ease-in-out infinite;
                background: ${isDark ? 'rgba(255, 255, 255, 0.08)' : isSepia ? 'rgba(217, 119, 6, 0.12)' : 'rgba(0, 0, 0, 0.07)'};
                border-radius: 8px;
              }
            `}</style>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div
                key={i}
                style={{
                  borderRadius: '16px',
                  border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div className="zw-idx-skel" style={{ width: '100%', height: '180px', borderRadius: '12px' }} />
                <div className="zw-idx-skel" style={{ width: '35%', height: '12px' }} />
                <div className="zw-idx-skel" style={{ width: '85%', height: '18px' }} />
                <div className="zw-idx-skel" style={{ width: '70%', height: '14px' }} />
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '70px 20px',
              background: isDark
                ? 'rgba(255, 255, 255, 0.02)'
                : isSepia
                ? '#fef6ea'
                : '#ffffff',
              borderRadius: '16px',
              border: isDark
                ? '1px solid rgba(255, 255, 255, 0.08)'
                : isSepia
                ? '1px solid rgba(217, 119, 6, 0.28)'
                : '1px solid #e5e7eb',
              boxShadow: isSepia
                ? '0 4px 20px rgba(217, 119, 6, 0.08)'
                : isLight
                ? '0 4px 20px rgba(0,0,0,0.05)'
                : 'none'
            }}
          >
            <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'center' }}>
              <ZwosmosIcon size={36} color={isSepia ? '#d97706' : 'var(--brand-purple)'} />
            </div>
            <h3
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '1.6rem',
                color: isLight ? '#111827' : '#ffffff',
                marginBottom: '10px'
              }}
            >
              No Stories Found
            </h3>
            <p
              style={{
                fontFamily: "'Lora', serif",
                color: isLight ? '#4b5563' : 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.95rem',
                maxWidth: '460px',
                margin: '0 auto 20px auto'
              }}
            >
              No cosmic articles matched your current query or category filter.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                handleClearSearch();
              }}
              style={{
                background: isSepia ? '#d97706' : 'var(--brand-purple)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '20px',
                padding: '8px 22px',
                cursor: 'pointer',
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '0.8rem',
                letterSpacing: '1px',
                boxShadow: isSepia ? '0 0 14px rgba(217, 119, 6, 0.4)' : '0 0 14px rgba(147, 51, 234, 0.4)'
              }}
            >
              RESET FILTERS
            </button>
          </div>
        ) : (
          <div className="blog-cards-grid">
            {paginatedPosts.map((post: any) => (
              <BlogCard
                key={post.id}
                id={post.id}
                category={post.category}
                title={post.title}
                desc={post.desc}
                img={post.img}
                authorName={post.authorName}
                authorImg={post.authorImg}
                date={post.date}
                variant="standard"
              />
            ))}
          </div>
        )}

        {/* Pagination Controls (shown when more than 12 posts) */}
        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isMobile ? '8px' : '12px',
              marginTop: isMobile ? '45px' : '65px',
              flexWrap: 'wrap'
            }}
          >
            {/* Prev Button */}
            <button
              onClick={() => {
                if (currentPage > 1) {
                  setCurrentPage(prev => prev - 1);
                  window.scrollTo({ top: 340, behavior: 'smooth' });
                }
              }}
              disabled={currentPage === 1}
              style={{
                background: isDark ? 'rgba(255, 255, 255, 0.04)' : (isSepia ? '#fef6ea' : '#ffffff'),
                border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : (isSepia ? '1px solid rgba(217, 119, 6, 0.3)' : '1px solid #d1d5db'),
                color: currentPage === 1
                  ? (isLight ? '#9ca3af' : 'rgba(255, 255, 255, 0.25)')
                  : (isSepia ? '#78350f' : isLight ? '#374151' : '#ffffff'),
                borderRadius: '24px',
                padding: '8px 18px',
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '0.78rem',
                letterSpacing: '1px',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: isSepia && currentPage !== 1
                  ? '0 2px 6px rgba(217, 119, 6, 0.08)'
                  : (isLight && currentPage !== 1 ? '0 2px 6px rgba(0,0,0,0.05)' : 'none')
              }}
              onMouseOver={e => {
                if (currentPage > 1) {
                  e.currentTarget.style.borderColor = isSepia ? '#d97706' : 'var(--brand-purple)';
                  e.currentTarget.style.background = isSepia ? '#fde8c8' : (isLight ? 'rgba(147, 51, 234, 0.08)' : 'rgba(147, 51, 234, 0.15)');
                }
              }}
              onMouseOut={e => {
                if (currentPage > 1) {
                  e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : (isSepia ? 'rgba(217, 119, 6, 0.3)' : '#d1d5db');
                  e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.04)' : (isSepia ? '#fef6ea' : '#ffffff');
                }
              }}
            >
              ← PREV
            </button>

            {/* Page Number Buttons */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
              const isActive = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  onClick={() => {
                    setCurrentPage(pageNum);
                    window.scrollTo({ top: 340, behavior: 'smooth' });
                  }}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: isActive
                      ? (isSepia ? '#d97706' : 'var(--brand-purple)')
                      : (isDark ? 'rgba(255, 255, 255, 0.04)' : (isSepia ? '#fef6ea' : '#ffffff')),
                    border: isActive
                      ? (isSepia ? '1px solid #d97706' : '1px solid var(--brand-purple)')
                      : (isDark ? '1px solid rgba(255, 255, 255, 0.12)' : (isSepia ? '1px solid rgba(217, 119, 6, 0.3)' : '1px solid #d1d5db')),
                    color: isActive
                      ? '#ffffff'
                      : (isSepia ? '#78350f' : isLight ? '#374151' : 'rgba(255, 255, 255, 0.75)'),
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isActive
                      ? (isSepia ? '0 0 16px rgba(217, 119, 6, 0.6)' : '0 0 16px rgba(147, 51, 234, 0.6)')
                      : (isSepia ? '0 2px 6px rgba(217, 119, 6, 0.08)' : (isLight ? '0 2px 6px rgba(0,0,0,0.05)' : 'none')),
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={e => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = isSepia ? '#d97706' : 'var(--brand-purple)';
                      e.currentTarget.style.color = isSepia ? '#d97706' : 'var(--brand-purple)';
                      e.currentTarget.style.background = isSepia ? '#fde8c8' : (isLight ? 'rgba(147, 51, 234, 0.08)' : 'rgba(147, 51, 234, 0.15)');
                    }
                  }}
                  onMouseOut={e => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : (isSepia ? 'rgba(217, 119, 6, 0.3)' : '#d1d5db');
                      e.currentTarget.style.color = isSepia ? '#78350f' : isLight ? '#374151' : 'rgba(255, 255, 255, 0.75)';
                      e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.04)' : (isSepia ? '#fef6ea' : '#ffffff');
                    }
                  }}
                >
                  {pageNum}
                </button>
              );
            })}

            {/* Next Button */}
            <button
              onClick={() => {
                if (currentPage < totalPages) {
                  setCurrentPage(prev => prev + 1);
                  window.scrollTo({ top: 340, behavior: 'smooth' });
                }
              }}
              disabled={currentPage === totalPages}
              style={{
                background: isDark ? 'rgba(255, 255, 255, 0.04)' : (isSepia ? '#fef6ea' : '#ffffff'),
                border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : (isSepia ? '1px solid rgba(217, 119, 6, 0.3)' : '1px solid #d1d5db'),
                color: currentPage === totalPages
                  ? (isLight ? '#9ca3af' : 'rgba(255, 255, 255, 0.25)')
                  : (isSepia ? '#78350f' : isLight ? '#374151' : '#ffffff'),
                borderRadius: '24px',
                padding: '8px 18px',
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '0.78rem',
                letterSpacing: '1px',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: isSepia && currentPage !== totalPages
                  ? '0 2px 6px rgba(217, 119, 6, 0.08)'
                  : (isLight && currentPage !== totalPages ? '0 2px 6px rgba(0,0,0,0.05)' : 'none')
              }}
              onMouseOver={e => {
                if (currentPage < totalPages) {
                  e.currentTarget.style.borderColor = isSepia ? '#d97706' : 'var(--brand-purple)';
                  e.currentTarget.style.background = isSepia ? '#fde8c8' : (isLight ? 'rgba(147, 51, 234, 0.08)' : 'rgba(147, 51, 234, 0.15)');
                }
              }}
              onMouseOut={e => {
                if (currentPage < totalPages) {
                  e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : (isSepia ? 'rgba(217, 119, 6, 0.3)' : '#d1d5db');
                  e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.04)' : (isSepia ? '#fef6ea' : '#ffffff');
                }
              }}
            >
              NEXT →
            </button>
          </div>
        )}
      </div>

      <Footer isLight={isLight} />
    </div>
  );
};

export default BlogIndexPage;
