import React, { useState, useEffect, useLayoutEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMobile } from '../contexts/MobileContext';
import { useTheme } from '../contexts/ThemeContext';
import Header from './Header';
import Footer from './Footer';
import { BlogCard } from './BlogCard';
import ZwosmosIcon from './ZwosmosIcon';
import { useBlogPost, useBlogPosts, BlogContent, CommentSection } from '@zwantum/blog/react';
import '@zwantum/blog-editor/content.css';
import { useSEO } from '../lib/seoService';
import { settingsService } from '../lib/settingsService';
import { blogClient } from '../lib/blogClient';

const BlogPostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isMobile } = useMobile();
  const [copied, setCopied] = useState(false);
  const { theme, isDark } = useTheme();
  const isLight = !isDark;
  const isSepia = theme === 'sepia';

  // Window width tracking for accurate tablet (both small & large tab) detection
  const [winWidth, setWinWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1200));
  useEffect(() => {
    const onResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isSmallTab = winWidth >= 600 && winWidth <= 800;
  const isLargeTab = winWidth > 800 && winWidth <= 1280;
  const isTablet = isSmallTab || isLargeTab;
  const isPhone = winWidth < 600;
  const isDesktop = winWidth > 1280;
  const isMobileView = isMobile || isTablet;

  // Global Drop Cap Setting from site_settings / blog_settings / localStorage
  const [enableDropCap, setEnableDropCap] = useState<boolean>(() => {
    try {
      const zwSettings = localStorage.getItem('zwosmos_site_settings');
      if (zwSettings) {
        const parsed = JSON.parse(zwSettings);
        if (parsed.enableDropCap !== undefined) return !!parsed.enableDropCap;
      }
      const bDrop = localStorage.getItem('zw_blog_drop_cap');
      if (bDrop !== null) return bDrop === 'true';
    } catch {}
    return true;
  });

  useEffect(() => {
    settingsService.getSettings().then(s => {
      if (s.enableDropCap !== undefined) setEnableDropCap(s.enableDropCap);
    }).catch(() => {});

    blogClient.settings.get().then((bs: any) => {
      if (bs?.enableDropCap !== undefined) setEnableDropCap(bs.enableDropCap);
    }).catch(() => {});

    const handleSettingsUpdated = (e: any) => {
      if (e.detail?.enableDropCap !== undefined) {
        setEnableDropCap(e.detail.enableDropCap);
      }
    };
    window.addEventListener('zwosmos_settings_updated', handleSettingsUpdated);
    return () => window.removeEventListener('zwosmos_settings_updated', handleSettingsUpdated);
  }, []);

  // Fetch live article and all published posts from Supabase via @zwantum/blog
  const { post, loading } = useBlogPost(id || '');
  const { posts: allLivePosts } = useBlogPosts();

  // Synchronously read cached post to avoid any flash of empty or fallback content
  const cachedPost = React.useMemo(() => {
    if (!id) return null;
    try {
      const raw = sessionStorage.getItem(`zw_post_${id}`);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }, [id]);

  useEffect(() => {
    if (post && id) {
      try {
        sessionStorage.setItem(`zw_post_${id}`, JSON.stringify(post));
        if (post.slug && post.slug !== id) {
          sessionStorage.setItem(`zw_post_${post.slug}`, JSON.stringify(post));
        }
        if (post.id && post.id !== id) {
          sessionStorage.setItem(`zw_post_${post.id}`, JSON.stringify(post));
        }
      } catch {}
    }
  }, [post, id]);

  useEffect(() => {
    if (allLivePosts && allLivePosts.length > 0) {
      try {
        sessionStorage.setItem('zw_cached_all_posts', JSON.stringify(allLivePosts));
      } catch {}
    }
  }, [allLivePosts]);

  const activePost = post || cachedPost || (allLivePosts?.find(p => p.slug === id || p.id === id) ?? null);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const rootEl = document.getElementById('root');
    if (rootEl) rootEl.scrollTop = 0;
  }, [id]);

  // Transform live posts to unified interface (no mock fallback posts)
  const dynamicPostList = React.useMemo(() => {
    if (allLivePosts && allLivePosts.length > 0) {
      return allLivePosts.map(p => ({
        id: p.slug || p.id,
        category: p.categories?.[0]?.name || 'Space News',
        categorySlug: p.categories?.[0]?.slug || 'space-news',
        title: p.title,
        desc: p.excerpt || '',
        img: (typeof p.featured_image?.url === 'string' ? p.featured_image.url : '') || (typeof p.custom_fields?.featured_image_url === 'string' ? p.custom_fields.featured_image_url : '') || '',
        authorName: p.author?.name || 'Editorial Team',
        authorImg: p.author?.profile_image_url || undefined,
        date: p.published_at
          ? new Date(p.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : 'Recent',
        readTime: `${p.reading_time || 5} min read`
      }));
    }
    return [];
  }, [allLivePosts]);

  // Previous and Next posts navigation based purely on live dynamic posts
  const currentIndex = dynamicPostList.findIndex(p => p.id === id || p.id === activePost?.slug || p.id === activePost?.id);
  const prevPost = currentIndex > 0 ? dynamicPostList[currentIndex - 1] : null;
  const nextPost = currentIndex >= 0 && currentIndex < dynamicPostList.length - 1 ? dynamicPostList[currentIndex + 1] : null;

  // Dynamic Open Graph & Article SEO for Facebook, Twitter/X, LinkedIn, Discord
  const articleTitle = activePost?.title || '';
  const articleDesc = activePost?.excerpt || '';
  const articleImage = activePost?.featured_image?.url || activePost?.custom_fields?.featured_image_url || '';
  const articleAuthor = activePost?.author?.name || 'Zwosmos';
  const articlePublishedAt = activePost?.published_at;
  const articleCategory = activePost?.categories?.[0]?.name || 'Space News';
  const articleTags = activePost?.tags?.map((t: any) => (typeof t === 'string' ? t : t?.name)).filter(Boolean) || [];

  useSEO({
    title: articleTitle ? (articleTitle.includes('Zwosmos') ? articleTitle : `${articleTitle} | Zwosmos`) : undefined,
    description: articleDesc || undefined,
    image: articleImage || undefined,
    type: 'article',
    author: articleAuthor,
    publishedTime: articlePublishedAt || undefined,
    section: articleCategory,
    tags: articleTags,
    twitterCard: 'summary_large_image'
  });

  // Related posts: prioritize same category, exclude current post, limit to 3 posts
  const relatedPosts = React.useMemo(() => {
    if (!activePost) return [];
    const categorySlug = activePost?.categories?.[0]?.slug;
    const categoryName = activePost?.categories?.[0]?.name;
    const currentPostId = activePost?.slug || activePost?.id;
    const sameCategory = dynamicPostList.filter(
      p => p.id !== currentPostId && (p.categorySlug === categorySlug || p.category === categoryName)
    );
    const results = [...sameCategory];
    if (results.length < 3) {
      const existingIds = new Set([currentPostId, ...results.map(p => p.id)]);
      const others = dynamicPostList.filter(p => !existingIds.has(p.id));
      results.push(...others);
    }
    return results.slice(0, 3);
  }, [dynamicPostList, activePost]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // Real dynamic count of works published by this author
  const authorArticlesCount = React.useMemo(() => {
    if (!allLivePosts || allLivePosts.length === 0) return 1;
    const authorId = activePost?.author?.id;
    const authorName = activePost?.author?.name;
    if (authorId) {
      const match = allLivePosts.filter(p => p.author?.id === authorId).length;
      if (match > 0) return match;
    }
    if (authorName) {
      const match = allLivePosts.filter(p => p.author?.name?.toLowerCase() === authorName.toLowerCase()).length;
      if (match > 0) return match;
    }
    return allLivePosts.length;
  }, [allLivePosts, activePost]);

  // Real dynamic tags assigned to this blog post (with slug for routing)
  const postTags = React.useMemo(() => {
    if (activePost?.tags && activePost.tags.length > 0) {
      return activePost.tags.map((t: any) => ({
        name: t.name,
        slug: t.slug || t.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      }));
    }
    if (activePost?.categories && activePost.categories.length > 0) {
      return activePost.categories.map((c: any) => ({
        name: c.name,
        slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      }));
    }
    return [];
  }, [activePost]);

  // Real dynamic latest posts fetched from Supabase (excluding the current active article)
  const latestSidebarPosts = React.useMemo(() => {
    const currentPostId = activePost?.slug || activePost?.id || id;
    const filtered = dynamicPostList.filter(p => p.id !== currentPostId);
    return filtered.slice(0, 3);
  }, [dynamicPostList, activePost, id]);

  // Dynamic post metadata with live Supabase post (no hardcoded mock fallback values)
  const postData = {
    title: activePost?.title || '',
    excerpt: activePost?.excerpt || '',
    featuredImage: activePost?.featured_image?.url || activePost?.custom_fields?.featured_image_url || '',
    imageCaption: (typeof activePost?.featured_image?.caption === 'string' && activePost.featured_image.caption.trim()) ||
      (typeof activePost?.custom_fields?.featured_image_caption === 'string' && activePost.custom_fields.featured_image_caption.trim()) ||
      (typeof activePost?.custom_fields?.image_caption === 'string' && activePost.custom_fields.image_caption.trim()) ||
      (typeof activePost?.custom_fields?.caption === 'string' && activePost.custom_fields.caption.trim()) || '',
    category: (activePost?.categories?.[0]?.name || 'SPACE NEWS').toUpperCase(),
    categoryName: activePost?.categories?.[0]?.name || 'Space News',
    categorySlug: activePost?.categories?.[0]?.slug || 'space-news',
    publishedDate: activePost?.published_at
      ? new Date(activePost.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : '',
    readTime: activePost?.reading_time ? `${activePost.reading_time} min read` : '5 min read',
    author: {
      name: activePost?.author?.name || 'Zwosmos',
      slug: activePost?.author?.slug || (activePost?.author?.name || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      role: activePost?.author?.designation || 'Editor',
      avatar: activePost?.author?.profile_image_url || null,
      bio: activePost?.author?.bio || '',
      articlesCount: authorArticlesCount
    },
    tags: postTags
  };

  // Font Size Adjustment State: 3 decrease steps (-3, -2, -1), default (0), 3 increase steps (+1, +2, +3)
  const FONT_SCALE_MAP: Record<number, number> = {
    [-3]: 0.85,
    [-2]: 0.90,
    [-1]: 0.95,
    [0]: 1.00,
    [1]: 1.08,
    [2]: 1.18,
    [3]: 1.30
  };

  const [fontLevel, setFontLevel] = React.useState<number>(() => {
    try {
      const saved = localStorage.getItem('zw_blog_font_level');
      if (saved !== null) {
        const num = parseInt(saved, 10);
        if (num >= -3 && num <= 3) return num;
      }
    } catch {}
    return 0;
  });

  const handleSetFontLevel = (level: number) => {
    const clamped = Math.max(-3, Math.min(3, level));
    setFontLevel(clamped);
    try {
      localStorage.setItem('zw_blog_font_level', clamped.toString());
    } catch {}
  };

  const fontScale = FONT_SCALE_MAP[fontLevel] ?? 1.00;

  // Reusable Widgets
  const renderFontSizeControl = () => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: postData.imageCaption ? '0px' : (isMobile ? '16px' : '22px'),
        marginBottom: isMobile ? '8px' : '14px',
        position: 'relative',
        zIndex: 2,
        userSelect: 'none'
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: isMobile ? '10px' : '14px',
          padding: isMobile ? '5px 14px' : '6px 18px',
          borderRadius: '24px',
          background: isDark
            ? 'rgba(255, 255, 255, 0.04)'
            : isSepia
            ? 'rgba(254, 246, 234, 0.94)'
            : 'rgba(255, 255, 255, 0.88)',
          border: isDark
            ? '1px solid rgba(255, 255, 255, 0.12)'
            : isSepia
            ? '1px solid rgba(217, 119, 6, 0.35)'
            : '1px solid rgba(0, 0, 0, 0.1)',
          boxShadow: isSepia
            ? '0 4px 16px rgba(217, 119, 6, 0.1)'
            : isLight
            ? '0 4px 16px rgba(0, 0, 0, 0.06)'
            : '0 8px 32px rgba(0, 0, 0, 0.45), 0 0 20px rgba(147, 51, 234, 0.12)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          transition: 'all 0.25s ease'
        }}
      >
        {/* Editorial Label with Zwosmos ✦ motif */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: '"Noto Sans", sans-serif',
            fontSize: isMobile ? '0.78rem' : '0.84rem',
            fontWeight: 400,
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            color: isLight ? '#111827' : '#ffffff',
            paddingRight: isMobile ? '8px' : '12px',
            borderRight: isDark
              ? '1px solid rgba(255,255,255,0.12)'
              : isSepia
              ? '1px solid rgba(217, 119, 6, 0.25)'
              : '1px solid rgba(0,0,0,0.1)'
          }}
        >
          <ZwosmosIcon size={12} color={isSepia ? '#d97706' : '#bd75ff'} />
          <span>TEXT SIZE</span>
        </div>

        {/* Integrated Stepper Bar: - [Bars / A / Bars] + */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '10px' }}>
          {/* Minus Button */}
          <button
            onClick={() => handleSetFontLevel(fontLevel - 1)}
            disabled={fontLevel === -3}
            title="Decrease font size (-)"
            aria-label="Decrease font size"
            style={{
              width: isMobile ? '26px' : '28px',
              height: isMobile ? '26px' : '28px',
              borderRadius: '50%',
              border: isDark
                ? '1px solid rgba(255,255,255,0.18)'
                : isSepia
                ? '1px solid rgba(217, 119, 6, 0.35)'
                : '1px solid rgba(0,0,0,0.12)',
              background: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : isSepia
                ? '#fde8c8'
                : '#f3f4f6',
              color: fontLevel === -3
                ? (isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.25)')
                : (isSepia ? '#78350f' : isLight ? '#111827' : '#ffffff'),
              fontSize: '1.1rem',
              fontWeight: 700,
              cursor: fontLevel === -3 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              lineHeight: 1,
              padding: 0
            }}
            onMouseOver={e => {
              if (fontLevel !== -3) {
                e.currentTarget.style.background = 'var(--brand-purple)';
                e.currentTarget.style.borderColor = 'var(--brand-purple)';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.transform = 'scale(1.1)';
              }
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : isSepia
                ? '#fde8c8'
                : '#f3f4f6';
              e.currentTarget.style.borderColor = isDark
                ? 'rgba(255,255,255,0.18)'
                : isSepia
                ? 'rgba(217, 119, 6, 0.35)'
                : 'rgba(0,0,0,0.12)';
              e.currentTarget.style.color = fontLevel === -3
                ? (isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.25)')
                : (isSepia ? '#78350f' : isLight ? '#111827' : '#ffffff');
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            −
          </button>

          {/* Left 3 Step Dots: -3, -2, -1 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 2px' }}>
            {[-3, -2, -1].map(step => {
              const isActive = fontLevel <= step;
              const isCurrent = fontLevel === step;
              return (
                <button
                  key={step}
                  onClick={() => handleSetFontLevel(step)}
                  title={`Size level ${step}`}
                  aria-label={`Size level ${step}`}
                  style={{
                    width: isCurrent ? '7px' : (isActive ? '6px' : '5px'),
                    height: isCurrent ? '7px' : (isActive ? '6px' : '5px'),
                    borderRadius: '50%',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    background: isActive
                      ? 'var(--brand-purple)'
                      : (isLight ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.25)'),
                    transition: 'all 0.2s ease',
                    boxShadow: isCurrent ? '0 0 8px var(--brand-purple)' : 'none'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.transform = 'scale(1.3)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                />
              );
            })}
          </div>

          {/* Center A Indicator / Reset Button */}
          <button
            onClick={() => handleSetFontLevel(0)}
            title="Default font size (Click to reset)"
            aria-label="Default font size"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0 6px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
            onMouseOver={e => {
              const letter = e.currentTarget.querySelector('.font-size-letter-a') as HTMLElement;
              if (letter) {
                letter.style.color = isLight ? '#000000' : 'var(--brand-purple)';
                letter.style.transform = 'scale(1.15)';
              }
            }}
            onMouseOut={e => {
              const letter = e.currentTarget.querySelector('.font-size-letter-a') as HTMLElement;
              if (letter) {
                letter.style.color = fontLevel === 0
                  ? (isLight ? '#000000' : '#ffffff')
                  : (isLight ? '#6b7280' : 'rgba(255, 255, 255, 0.6)');
                letter.style.transform = 'scale(1)';
              }
            }}
          >
            <span
              className="font-size-letter-a"
              style={{
                fontFamily: '"Noto Sans", sans-serif',
                fontSize: isMobile ? '1.12rem' : '1.24rem',
                fontWeight: 400,
                color: fontLevel === 0
                  ? (isLight ? '#000000' : '#ffffff')
                  : (isLight ? '#6b7280' : 'rgba(255, 255, 255, 0.6)'),
                textShadow: (fontLevel === 0 && !isLight)
                  ? '0 0 10px rgba(168, 85, 247, 0.75)'
                  : 'none',
                transition: 'all 0.2s ease',
                lineHeight: 1
              }}
            >
              A
            </span>
            {/* Subtle active indicator dot under A */}
            <span
              style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: fontLevel === 0 ? 'var(--brand-purple)' : 'transparent',
                marginTop: '3px',
                boxShadow: fontLevel === 0 ? '0 0 6px var(--brand-purple)' : 'none',
                transition: 'all 0.2s ease'
              }}
            />
          </button>

          {/* Right 3 Step Dots: +1, +2, +3 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 2px' }}>
            {[1, 2, 3].map(step => {
              const isActive = fontLevel >= step;
              const isCurrent = fontLevel === step;
              return (
                <button
                  key={step}
                  onClick={() => handleSetFontLevel(step)}
                  title={`Size level +${step}`}
                  aria-label={`Size level +${step}`}
                  style={{
                    width: isCurrent ? '7px' : (isActive ? '6px' : '5px'),
                    height: isCurrent ? '7px' : (isActive ? '6px' : '5px'),
                    borderRadius: '50%',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    background: isActive
                      ? 'var(--brand-purple)'
                      : (isLight ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.25)'),
                    transition: 'all 0.2s ease',
                    boxShadow: isCurrent ? '0 0 8px var(--brand-purple)' : 'none'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.transform = 'scale(1.3)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                />
              );
            })}
          </div>

          {/* Plus Button */}
          <button
            onClick={() => handleSetFontLevel(fontLevel + 1)}
            disabled={fontLevel === 3}
            title="Increase font size (+)"
            aria-label="Increase font size"
            style={{
              width: isMobile ? '26px' : '28px',
              height: isMobile ? '26px' : '28px',
              borderRadius: '50%',
              border: isDark
                ? '1px solid rgba(255,255,255,0.18)'
                : isSepia
                ? '1px solid rgba(217, 119, 6, 0.35)'
                : '1px solid rgba(0,0,0,0.12)',
              background: isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : isSepia
                ? '#fde8c8'
                : '#f3f4f6',
              color: fontLevel === 3
                ? (isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.25)')
                : (isSepia ? '#78350f' : isLight ? '#111827' : '#ffffff'),
              fontSize: '1.1rem',
              fontWeight: 700,
              cursor: fontLevel === 3 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              lineHeight: 1,
              padding: 0
            }}
            onMouseOver={e => {
              if (fontLevel !== 3) {
                e.currentTarget.style.background = 'var(--brand-purple)';
                e.currentTarget.style.borderColor = 'var(--brand-purple)';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.transform = 'scale(1.1)';
              }
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : isSepia
                ? '#fde8c8'
                : '#f3f4f6';
              e.currentTarget.style.borderColor = isDark
                ? 'rgba(255,255,255,0.18)'
                : isSepia
                ? 'rgba(217, 119, 6, 0.35)'
                : 'rgba(0,0,0,0.12)';
              e.currentTarget.style.color = fontLevel === 3
                ? (isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.25)')
                : (isSepia ? '#78350f' : isLight ? '#111827' : '#ffffff');
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );

  const renderMobileShare = () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '4px 2px 10px 2px',
        width: '100%',
        boxSizing: 'border-box',
        borderBottom: isDark
          ? '1px solid rgba(255,255,255,0.08)'
          : isSepia
          ? '1px solid rgba(217, 119, 6, 0.2)'
          : '1px solid rgba(0,0,0,0.08)',
        marginBottom: '2px'
      }}
    >
      <span
        style={{
          fontFamily: '"Noto Sans", sans-serif',
          fontSize: '0.82rem',
          fontWeight: 400,
          color: isLight ? '#111827' : '#ffffff',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        <ZwosmosIcon size={12} color={isSepia ? '#d97706' : '#bd75ff'} /> Share:
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() =>
            window.open(
              `https://twitter.com/intent/tweet?text=${encodeURIComponent(postData.title)}&url=${encodeURIComponent(window.location.href)}`,
              '_blank'
            )
          }
          title="Share on X"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: isLight ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(255,255,255,0.15)',
            background: '#1f2022',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '0.82rem',
            transition: 'transform 0.2s',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
          }}
        >
          <i className="fa-brands fa-x-twitter"></i>
        </button>

        <button
          onClick={() =>
            window.open(
              `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
              '_blank'
            )
          }
          title="Share on Facebook"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: isLight ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(255,255,255,0.15)',
            background: '#1877f2',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '0.82rem',
            transition: 'transform 0.2s',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
          }}
        >
          <i className="fa-brands fa-facebook-f"></i>
        </button>

        <button
          onClick={() =>
            window.open(
              `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
              '_blank'
            )
          }
          title="Share on LinkedIn"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: isLight ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(255,255,255,0.15)',
            background: '#0a66c2',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '0.82rem',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
          }}
        >
          <i className="fa-brands fa-linkedin-in"></i>
        </button>

        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          title={copied ? 'Link copied!' : 'Copy Link'}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: copied
              ? '1px solid #10b981'
              : (isDark ? '1px solid rgba(255,255,255,0.2)' : (isSepia ? '1px solid rgba(217, 119, 6, 0.4)' : (isLight ? '1px solid var(--brand-purple)' : '1px solid var(--brand-purple)'))),
            background: copied
              ? '#10b981'
              : (isDark ? 'rgba(255, 255, 255, 0.08)' : (isSepia ? '#fde8c8' : 'rgba(147, 51, 234, 0.12)')),
            color: copied ? 'white' : (isSepia ? '#78350f' : (isLight ? 'var(--brand-purple)' : '#c084fc')),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '0.82rem',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
          }}
        >
          <i className={copied ? 'fa-solid fa-check' : 'fa-solid fa-link'}></i>
        </button>
      </div>
    </div>
  );

  const renderMobileTags = () => {
    if (!postData.tags || postData.tags.length === 0) return null;
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px 12px',
          padding: '4px 2px 12px 2px',
          width: '100%',
          boxSizing: 'border-box',
          borderBottom: isDark
            ? '1px solid rgba(255,255,255,0.08)'
            : isSepia
            ? '1px solid rgba(217, 119, 6, 0.2)'
            : '1px solid rgba(0,0,0,0.08)',
          marginBottom: '6px'
        }}
      >
        <span
          style={{
            fontFamily: '"Noto Sans", sans-serif',
            fontSize: '0.82rem',
            fontWeight: 400,
            color: isLight ? '#111827' : '#ffffff',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0
          }}
        >
          <ZwosmosIcon size={12} color={isSepia ? '#d97706' : '#bd75ff'} /> Tags:
        </span>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            alignItems: 'center'
          }}
        >
          {postData.tags.map((tag: any, idx: number) => (
            <Link
              key={idx}
              to={`/tag/${tag.slug}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                fontSize: '0.78rem',
                padding: '4px 6px',
                borderRadius: '16px',
                color: isSepia ? '#78350f' : (isLight ? '#1f2937' : 'rgba(255,255,255,0.9)'),
                fontFamily: "'Lora', serif",
                cursor: 'pointer',
                textDecoration: 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={e => {
                e.currentTarget.style.color = isSepia ? '#d97706' : 'var(--brand-purple)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.color = isSepia ? '#78350f' : (isLight ? '#1f2937' : 'rgba(255,255,255,0.9)');
              }}
            >
              {tag.name}
            </Link>
          ))}
        </div>
      </div>
    );
  };

  const renderAuthorWidget = () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        position: 'relative',
        marginLeft: (isMobile || isTablet) ? '6px' : '8px',
        width: '100%',
        height: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Wireframe Border */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: isSepia ? '1px solid rgba(217, 119, 6, 0.45)' : '1px solid var(--brand-purple)',
          borderRadius: '12px',
          zIndex: 3,
          pointerEvents: 'none',
          transform: (isMobile || isTablet) ? 'translate(-6px, 6px)' : 'translate(-8px, 8px)'
        }}
      ></div>

      <div style={{ display: 'flex', width: '100%', height: '100%', position: 'relative', zIndex: 1 }}>
        {/* Vertical Tab */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 5px',
            border: isDark
              ? '1px solid rgba(255,255,255,0.08)'
              : isSepia
              ? '1px solid rgba(217, 119, 6, 0.28)'
              : '1px solid rgba(0,0,0,0.08)',
            borderRight: isDark
              ? '1px solid rgba(255,255,255,0.1)'
              : isSepia
              ? '1px solid rgba(217, 119, 6, 0.28)'
              : '1px solid rgba(0,0,0,0.1)',
            background: isDark
              ? 'var(--bg-main)'
              : isSepia
              ? '#fde8c8'
              : '#f3f4f6',
            borderRadius: '12px 0 0 12px',
            flexShrink: 0
          }}
        >
          <span
            style={{
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: '"Noto Sans", sans-serif',
              fontSize: '0.78rem',
              fontWeight: 400,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: isLight ? '#111827' : 'white',
              whiteSpace: 'nowrap'
            }}
          >
            <ZwosmosIcon size={12} color={isSepia ? '#d97706' : '#bd75ff'} />
            <span>Author</span>
          </span>
        </div>

        {/* Author Content */}
        <div
          style={{
            flex: 1,
            background: isDark
              ? 'rgba(255,255,255,0.03)'
              : isSepia
              ? '#fef6ea'
              : '#fdfdfd',
            border: isDark
              ? '1px solid rgba(255,255,255,0.08)'
              : isSepia
              ? '1px solid rgba(217, 119, 6, 0.28)'
              : '1px solid rgba(0,0,0,0.08)',
            borderLeft: 'none',
            borderRadius: '0 12px 12px 0',
            padding: '14px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
            {postData.author.avatar ? (
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  marginBottom: '8px',
                  border: isSepia ? '2px solid #d97706' : '2px solid var(--brand-purple)',
                  boxShadow: isSepia ? '0 0 12px rgba(217, 119, 6, 0.35)' : '0 0 12px rgba(147, 51, 234, 0.45)'
                }}
              >
                <img
                  src={postData.author.avatar}
                  alt={postData.author.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ) : null}

            <h3
              style={{
                margin: '0 0 2px 0',
                fontFamily: "'Playfair Display', serif",
                fontSize: '0.94rem',
                lineHeight: 1.25,
                color: isLight ? '#111827' : 'white'
              }}
            >
              <Link
                to={`/author/${postData.author.slug}`}
                style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseOver={e => (e.currentTarget.style.color = isSepia ? '#d97706' : '#bd75ff')}
                onMouseOut={e => (e.currentTarget.style.color = isLight ? '#111827' : 'white')}
              >
                {postData.author.name}
              </Link>
            </h3>

            {postData.author.role && (
              <div
                style={{
                  color: isSepia ? '#b45309' : '#bd75ff',
                  fontSize: '0.74rem',
                  fontFamily: '"Noto Sans", sans-serif',
                  fontWeight: 400,
                  letterSpacing: '0.5px'
                }}
              >
                {postData.author.role}
              </div>
            )}
          </div>

          {postData.author.bio && (
            <p
              style={{
                fontSize: '0.74rem',
                lineHeight: 1.45,
                color: isLight ? '#4b5563' : 'rgba(255,255,255,0.7)',
                fontFamily: "'Lora', serif",
                margin: 0,
                textAlign: 'left'
              }}
            >
              {postData.author.bio}
            </p>
          )}

          <div
            style={{
              borderTop: isDark
                ? '1px solid rgba(255,255,255,0.08)'
                : isSepia
                ? '1px solid rgba(217, 119, 6, 0.18)'
                : '1px solid rgba(0,0,0,0.08)',
              paddingTop: '8px',
              textAlign: 'left',
              fontSize: '0.7rem',
              color: isLight ? '#6b7280' : 'rgba(255,255,255,0.5)',
              fontFamily: "'Lora', serif",
              marginTop: 'auto'
            }}
          >
            {postData.author.articlesCount} {postData.author.articlesCount === 1 ? 'Work Published' : 'Works Published'}
          </div>
        </div>
      </div>
    </div>
  );

  const renderLatestWidget = () => {
    if (latestSidebarPosts.length === 0) return null;
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          position: 'relative',
          marginLeft: (isMobile || isTablet) ? '6px' : '8px',
          width: '100%',
          height: '100%',
          boxSizing: 'border-box'
        }}
      >
      {/* Wireframe Border */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: isSepia ? '1px solid rgba(217, 119, 6, 0.45)' : '1px solid var(--brand-purple)',
          borderRadius: '12px',
          zIndex: 3,
          pointerEvents: 'none',
          transform: (isMobile || isTablet) ? 'translate(-6px, 6px)' : 'translate(-8px, 8px)'
        }}
      ></div>

      <div style={{ display: 'flex', width: '100%', height: '100%', position: 'relative', zIndex: 1 }}>
        {/* Vertical Tab */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 5px',
            border: isDark
              ? '1px solid rgba(255,255,255,0.08)'
              : isSepia
              ? '1px solid rgba(217, 119, 6, 0.28)'
              : '1px solid rgba(0,0,0,0.08)',
            borderRight: isDark
              ? '1px solid rgba(255,255,255,0.1)'
              : isSepia
              ? '1px solid rgba(217, 119, 6, 0.28)'
              : '1px solid rgba(0,0,0,0.1)',
            background: isDark
              ? 'var(--bg-main)'
              : isSepia
              ? '#fde8c8'
              : '#f3f4f6',
            borderRadius: '12px 0 0 12px',
            flexShrink: 0
          }}
        >
          <span
            style={{
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: '"Noto Sans", sans-serif',
              fontSize: '0.78rem',
              fontWeight: 400,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: isLight ? '#111827' : 'white',
              whiteSpace: 'nowrap'
            }}
          >
            <ZwosmosIcon size={12} color={isSepia ? '#d97706' : '#bd75ff'} />
            <span>Latest</span>
          </span>
        </div>

        {/* Posts Container */}
        <div
          style={{
            flex: 1,
            background: isDark
              ? 'rgba(255,255,255,0.03)'
              : isSepia
              ? '#fef6ea'
              : '#fdfdfd',
            border: isDark
              ? '1px solid rgba(255,255,255,0.08)'
              : isSepia
              ? '1px solid rgba(217, 119, 6, 0.28)'
              : '1px solid rgba(0,0,0,0.08)',
            borderLeft: 'none',
            borderRadius: '0 12px 12px 0',
            padding: '14px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            height: '100%',
            boxSizing: 'border-box'
          }}
        >
          {latestSidebarPosts.map((latestItem) => (
            <Link
              key={latestItem.id}
              to={`/blog/${latestItem.id}`}
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'transform 0.2s'
              }}
              onMouseOver={e => (e.currentTarget.style.transform = 'translateX(3px)')}
              onMouseOut={e => (e.currentTarget.style.transform = 'translateX(0)')}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: isDark
                    ? '1px solid rgba(255,255,255,0.1)'
                    : isSepia
                    ? '1px solid rgba(217, 119, 6, 0.2)'
                    : '1px solid rgba(0,0,0,0.1)'
                }}
              >
                <img
                  src={String(latestItem.img || '')}
                  alt={latestItem.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4
                  style={{
                    margin: '0 0 2px 0',
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '0.78rem',
                    lineHeight: 1.25,
                    color: isLight ? '#111827' : 'white',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {latestItem.title}
                </h4>
                <div
                  style={{
                    color: isLight ? '#6b7280' : 'rgba(255,255,255,0.5)',
                    fontSize: '0.68rem',
                    fontFamily: "'Lora', serif"
                  }}
                >
                  {latestItem.date}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
    );
  };

  const renderDesktopTags = () => {
    if (!postData.tags || postData.tags.length === 0) return null;
    return (
      <div style={{ display: 'flex', alignItems: 'stretch', position: 'relative', marginLeft: '8px' }}>
        {/* Wireframe Border */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: isSepia ? '1px solid rgba(217, 119, 6, 0.45)' : '1px solid var(--brand-purple)',
            borderRadius: '12px',
            zIndex: 3,
            pointerEvents: 'none',
            transform: 'translate(-8px, 8px)'
          }}
        ></div>

        <div style={{ display: 'flex', width: '100%', position: 'relative', zIndex: 1 }}>
          {/* Vertical Tab */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 5px',
              border: isDark
                ? '1px solid rgba(255,255,255,0.08)'
                : isSepia
                ? '1px solid rgba(217, 119, 6, 0.28)'
                : '1px solid rgba(0,0,0,0.08)',
              borderRight: isDark
                ? '1px solid rgba(255,255,255,0.1)'
                : isSepia
                ? '1px solid rgba(217, 119, 6, 0.28)'
                : '1px solid rgba(0,0,0,0.1)',
              background: isDark
                ? 'var(--bg-main)'
                : isSepia
                ? '#fde8c8'
                : '#f3f4f6',
              borderRadius: '12px 0 0 12px',
              flexShrink: 0
            }}
          >
            <span
              style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: '"Noto Sans", sans-serif',
                fontSize: '0.78rem',
                fontWeight: 400,
                letterSpacing: '3px',
                textTransform: 'uppercase',
                color: isLight ? '#111827' : 'white',
                whiteSpace: 'nowrap'
              }}
            >
              <ZwosmosIcon size={12} color={isSepia ? '#d97706' : '#bd75ff'} />
              <span>Tags</span>
            </span>
          </div>

          {/* Tags Content */}
          <div
            style={{
              flex: 1,
              background: isDark
                ? 'rgba(255,255,255,0.03)'
                : isSepia
                ? '#fef6ea'
                : '#fdfdfd',
              border: isDark
                ? '1px solid rgba(255,255,255,0.08)'
                : isSepia
                ? '1px solid rgba(217, 119, 6, 0.28)'
                : '1px solid rgba(0,0,0,0.08)',
              borderLeft: 'none',
              borderRadius: '0 12px 12px 0',
              padding: '12px 10px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px'
            }}
          >
            {postData.tags.map((tag: any, idx: number) => (
              <Link
                key={idx}
                to={`/tag/${tag.slug}`}
                style={{
                  display: 'inline-block',
                  fontSize: '0.7rem',
                  padding: '3px 8px',
                  borderRadius: '14px',
                  background: isDark
                    ? 'rgba(255,255,255,0.04)'
                    : isSepia
                    ? '#fde8c8'
                    : '#f3f4f6',
                  border: isDark
                    ? '1px solid rgba(255,255,255,0.12)'
                    : isSepia
                    ? '1px solid rgba(217, 119, 6, 0.3)'
                    : '1px solid rgba(0,0,0,0.12)',
                  color: isSepia ? '#78350f' : (isLight ? '#1f2937' : 'rgba(255,255,255,0.85)'),
                  fontFamily: "'Lora', serif",
                  cursor: 'pointer',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.borderColor = 'var(--brand-purple)';
                  e.currentTarget.style.background = 'rgba(147, 51, 234, 0.15)';
                  e.currentTarget.style.color = isLight ? '#9333ea' : '#fff';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.borderColor = isDark
                    ? 'rgba(255,255,255,0.12)'
                    : isSepia
                    ? 'rgba(217, 119, 6, 0.3)'
                    : 'rgba(0,0,0,0.12)';
                  e.currentTarget.style.background = isDark
                    ? 'rgba(255,255,255,0.04)'
                    : isSepia
                    ? '#fde8c8'
                    : '#f3f4f6';
                  e.currentTarget.style.color = isSepia ? '#78350f' : (isLight ? '#1f2937' : 'rgba(255,255,255,0.85)');
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {tag.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDesktopShare = () => (
    <div
      style={{
        order: 1,
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px 12px',
        padding: '4px 2px 14px 2px',
        width: '100%',
        boxSizing: 'border-box',
        borderBottom: isDark
          ? '1px solid rgba(255,255,255,0.08)'
          : isSepia
          ? '1px solid rgba(217, 119, 6, 0.2)'
          : '1px solid rgba(0,0,0,0.08)',
        marginBottom: '4px'
      }}
    >
      <span
        style={{
          fontFamily: '"Noto Sans", sans-serif',
          fontSize: '0.82rem',
          fontWeight: 400,
          color: isLight ? '#111827' : '#ffffff',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <ZwosmosIcon size={12} color={isSepia ? '#d97706' : '#bd75ff'} />
        <span>Share:</span>
      </span>

      {/* Circular Icon-Only Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() =>
            window.open(
              `https://twitter.com/intent/tweet?text=${encodeURIComponent(postData.title)}&url=${encodeURIComponent(window.location.href)}`,
              '_blank'
            )
          }
          title="Share on X"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: isLight ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(255,255,255,0.15)',
            background: '#1f2022',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '0.82rem',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
          }}
        >
          <i className="fa-brands fa-x-twitter"></i>
        </button>

        <button
          onClick={() =>
            window.open(
              `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
              '_blank'
            )
          }
          title="Share on Facebook"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: isLight ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(255,255,255,0.15)',
            background: '#1877F2',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '0.82rem',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 6px rgba(24, 119, 242, 0.25)'
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
          }}
        >
          <i className="fa-brands fa-facebook-f"></i>
        </button>

        <button
          onClick={() =>
            window.open(
              `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
              '_blank'
            )
          }
          title="Share on LinkedIn"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: isLight ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(255,255,255,0.15)',
            background: '#0A66C2',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '0.82rem',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 6px rgba(10, 102, 194, 0.25)'
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
          }}
        >
          <i className="fa-brands fa-linkedin-in"></i>
        </button>

        <button
          onClick={handleCopyLink}
          title={copied ? 'Copied!' : 'Copy Link'}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: copied
              ? '1px solid #10b981'
              : (isDark ? '1px solid rgba(255,255,255,0.2)' : (isSepia ? '1px solid rgba(217, 119, 6, 0.4)' : '1px solid var(--brand-purple)')),
            background: copied
              ? '#10b981'
              : (isDark ? 'rgba(255, 255, 255, 0.08)' : (isSepia ? '#fde8c8' : (isLight ? 'rgba(147, 51, 234, 0.1)' : 'rgba(147, 51, 234, 0.22)'))),
            color: copied ? '#ffffff' : (isSepia ? '#78350f' : 'var(--brand-purple)'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '0.82rem',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 6px rgba(147, 51, 234, 0.2)'
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
          }}
        >
          <i className={copied ? 'fa-solid fa-check' : 'fa-solid fa-link'}></i>
        </button>
      </div>
    </div>
  );

  return (
    <div
      style={{
        width: '100%',
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

      {/* 1. Loading Skeleton View (Eliminates fallback mock flash) */}
      {loading && !activePost && (
        <div className="blog-post-page-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: isPhone ? '20px 30px 20px' : isTablet ? '24px 50px 24px' : '25px 4% 20px', boxSizing: 'border-box' }}>
          <style>{`
            @keyframes zw-skel-pulse {
              0%, 100% { opacity: 0.35; }
              50% { opacity: 0.8; }
            }
            .zw-skel-pulse {
              animation: zw-skel-pulse 1.6s ease-in-out infinite;
              background: ${isDark ? 'rgba(255, 255, 255, 0.08)' : isSepia ? 'rgba(217, 119, 6, 0.12)' : 'rgba(0, 0, 0, 0.07)'};
              border-radius: 8px;
            }
          `}</style>

          {/* Breadcrumb Skeleton */}
          <div style={{ paddingLeft: isDesktop ? '200px' : !isPhone ? '80px' : undefined, paddingRight: isDesktop ? '200px' : !isPhone ? '80px' : undefined, marginBottom: '28px' }}>
            <div className="zw-skel-pulse" style={{ width: '220px', height: '14px' }} />
          </div>

          {/* Header Skeleton */}
          <div style={{ paddingLeft: isDesktop ? '200px' : !isPhone ? '80px' : undefined, paddingRight: isDesktop ? '200px' : !isPhone ? '80px' : undefined, marginBottom: '40px' }}>
            <div className="zw-skel-pulse" style={{ width: '85%', height: isPhone ? '32px' : '46px', marginBottom: '14px' }} />
            <div className="zw-skel-pulse" style={{ width: '55%', height: isPhone ? '32px' : '46px', marginBottom: '22px' }} />
            <div className="zw-skel-pulse" style={{ width: '92%', height: '18px', marginBottom: '10px' }} />
            <div className="zw-skel-pulse" style={{ width: '70%', height: '18px', marginBottom: '24px' }} />
            <div className="zw-skel-pulse" style={{ width: '280px', height: '16px' }} />
          </div>

          {/* Featured Image Skeleton */}
          <div className="zw-skel-pulse" style={{ width: '100%', height: isPhone ? '240px' : isTablet ? '360px' : '480px', borderRadius: isMobile ? '16px' : '22px', marginBottom: '40px' }} />

          {/* Body Content Skeleton */}
          <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="zw-skel-pulse" style={{ width: '100%', height: '18px' }} />
            <div className="zw-skel-pulse" style={{ width: '96%', height: '18px' }} />
            <div className="zw-skel-pulse" style={{ width: '92%', height: '18px' }} />
            <div className="zw-skel-pulse" style={{ width: '88%', height: '18px' }} />
            <div className="zw-skel-pulse" style={{ width: '60%', height: '18px', marginBottom: '20px' }} />
            <div className="zw-skel-pulse" style={{ width: '45%', height: '32px', marginBottom: '12px' }} />
            <div className="zw-skel-pulse" style={{ width: '100%', height: '18px' }} />
            <div className="zw-skel-pulse" style={{ width: '94%', height: '18px' }} />
          </div>
        </div>
      )}

      {/* 2. Article Not Found (when loading is complete and no post exists) */}
      {!loading && !activePost && (
        <div style={{ maxWidth: '800px', margin: '100px auto', textAlign: 'center', padding: '0 24px' }}>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
            <ZwosmosIcon size={44} color="var(--brand-purple)" />
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', marginBottom: '14px', color: isLight ? '#111827' : '#ffffff' }}>
            Cosmic Article Not Found
          </h1>
          <p style={{ fontFamily: "'Lora', serif", fontSize: '1.05rem', color: isLight ? '#4b5563' : 'rgba(255,255,255,0.7)', marginBottom: '32px' }}>
            The dispatch you are looking for may have drifted into the deep void or does not exist.
          </p>
          <div style={{ display: 'inline-flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link
              to="/blog"
              style={{
                padding: '11px 24px',
                borderRadius: '8px',
                background: 'var(--brand-purple)',
                color: '#fff',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.92rem'
              }}
            >
              ← Back to All Stories
            </Link>
            <Link
              to="/"
              style={{
                padding: '11px 24px',
                borderRadius: '8px',
                border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid #d1d5db',
                color: isLight ? '#111827' : '#fff',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.92rem'
              }}
            >
              Zwosmos Home
            </Link>
          </div>
        </div>
      )}

      {/* 3. Active Post View */}
      {activePost && (
        <div className="blog-post-page-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: isPhone ? '20px 30px 20px' : isTablet ? '24px 50px 24px' : '25px 4% 20px', boxSizing: 'border-box' }}>
        {/* ========================================================================= */}
        {/* 1. TOP BAR: Breadcrumb Navigation                                        */}
        {/* ========================================================================= */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: isMobile ? '20px' : '30px',
            paddingLeft: isDesktop ? '200px' : !isPhone ? (winWidth >= 1000 ? '160px' : '80px') : undefined,
            paddingRight: isDesktop ? '200px' : !isPhone ? (winWidth >= 1000 ? '160px' : '80px') : undefined,
            boxSizing: 'border-box'
          }}
        >
          {/* Breadcrumbs */}
          <div
            style={{
              fontSize: isMobile ? '0.78rem' : '0.85rem',
              color: isLight ? '#6b7280' : 'rgba(255,255,255,0.6)',
              letterSpacing: '0.5px',
              fontWeight: 600,
              fontFamily: "'Lora', serif"
            }}
          >
            <Link
              to="/"
              style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseOver={e => (e.currentTarget.style.color = 'var(--brand-purple)')}
              onMouseOut={e => (e.currentTarget.style.color = isLight ? '#6b7280' : 'rgba(255,255,255,0.6)')}
            >
              Zwosmos
            </Link>
            <span style={{ color: 'var(--brand-purple)', margin: '0 6px' }}>›</span>
            <Link
              to="/blog"
              style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseOver={e => (e.currentTarget.style.color = 'var(--brand-purple)')}
              onMouseOut={e => (e.currentTarget.style.color = isLight ? '#6b7280' : 'rgba(255,255,255,0.6)')}
            >
              Stories
            </Link>
            <span style={{ color: 'var(--brand-purple)', margin: '0 6px' }}>›</span>
            <Link
              to={`/${postData.categorySlug || 'space-news'}`}
              style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseOver={e => (e.currentTarget.style.color = 'var(--brand-purple)')}
              onMouseOut={e => (e.currentTarget.style.color = isLight ? '#6b7280' : 'rgba(255,255,255,0.6)')}
            >
              {postData.categoryName}
            </Link>
            <span style={{ color: 'var(--brand-purple)', margin: '0 6px' }}>›</span>
            <span
              style={{
                color: isLight ? '#111827' : 'rgba(255,255,255,0.92)',
                maxWidth: isMobile ? '160px' : '380px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'inline-block',
                verticalAlign: 'bottom'
              }}
              title={postData.title}
            >
              {postData.title}
            </span>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* FULL WIDTH HEADER: Post Title, Excerpt, Details, and Featured Image     */}
        {/* ----------------------------------------------------------------------- */}
        <header style={{ width: '100%', marginBottom: isMobile ? '30px' : '45px' }}>
          {/* Post Title, Excerpt, and Details Container (compacted on desktop and tablet views) */}
          <div
            style={{
              paddingLeft: isDesktop ? '200px' : !isPhone ? (winWidth >= 1000 ? '160px' : '80px') : undefined,
              paddingRight: isDesktop ? '200px' : !isPhone ? (winWidth >= 1000 ? '160px' : '80px') : undefined,
              boxSizing: 'border-box'
            }}
          >
            {/* Post Title */}
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: isPhone ? '1.65rem' : isSmallTab ? '2.15rem' : '2.65rem',
                lineHeight: isPhone ? 1.25 : 1.2,
                margin: isPhone ? '0 0 14px 0' : '0 0 18px 0',
                fontWeight: 700,
                color: isLight ? '#111827' : 'white',
                letterSpacing: isPhone ? '-0.2px' : '-0.4px'
              }}
            >
              {postData.title}
            </h1>

            {/* Excerpt */}
            <div
              style={{
                fontSize: isPhone ? '1rem' : isSmallTab ? '1.15rem' : '1.3rem',
                lineHeight: isPhone ? 1.6 : 1.65,
                color: isLight ? '#2b2d42' : 'rgba(255,255,255,0.9)',
                fontFamily: "'Lora', serif",
                fontStyle: 'italic',
                margin: isPhone ? '0 0 18px 0' : '0 0 24px 0',
                paddingLeft: isPhone ? '12px' : '18px',
                borderLeft: '3px solid var(--brand-purple)'
              }}
            >
              {postData.excerpt}
            </div>

            {/* Details Bar (Date, Read Time, Category, Views) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: isPhone ? '8px 12px' : '18px',
                marginBottom: isPhone ? '24px' : '35px',
                fontSize: isPhone ? '0.8rem' : '0.9rem',
                fontFamily: "'Lora', serif",
                color: isLight ? '#4b5563' : 'rgba(255,255,255,0.72)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ZwosmosIcon size={12} color="#bd75ff" />
                <span style={{ color: isLight ? '#111827' : 'white', fontWeight: 600 }}>
                  {postData.publishedDate}
                </span>
              </div>
              <span style={{ color: isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)' }}>•</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: isLight ? '#4b5563' : 'rgba(255,255,255,0.5)' }}>Read Time:</span>
                <span style={{ color: isLight ? '#111827' : 'white', fontWeight: 600 }}>
                  {postData.readTime}
                </span>
              </div>
              <span style={{ color: isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)' }}>•</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: isLight ? '#4b5563' : 'rgba(255,255,255,0.5)' }}>Category:</span>
                <span
                  style={{
                    color: '#bd75ff',
                    fontFamily: '"Noto Sans", sans-serif',
                    fontWeight: 400,
                    letterSpacing: '2px',
                    textTransform: 'uppercase'
                  }}
                >
                  {postData.category}
                </span>
              </div>
            </div>
          </div>

          {/* Featured Image Block */}
          <div
            style={{
              position: 'relative',
              width: '100%'
            }}
          >
            <div
              style={{
                width: '100%',
                aspectRatio: 'auto',
                maxHeight: 'none',
                height: 'auto',
                borderRadius: isMobile ? '10px' : '14px',
                overflow: 'hidden',
                border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: isLight ? '0 15px 35px rgba(0,0,0,0.15)' : '0 25px 50px rgba(0,0,0,0.5)',
                position: 'relative',
                zIndex: 1
              }}
            >
              <img
                src={postData.featuredImage}
                alt={postData.title}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  objectFit: 'contain'
                }}
              />
            </div>

            {/* Image Caption - Only rendered if caption is present */}
            {postData.imageCaption ? (
              <div
                style={{
                  marginTop: isMobile ? '12px' : '16px',
                  marginBottom: isMobile ? '30px' : '40px',
                  fontSize: isMobile ? '15px' : '16px',
                  color: isDark ? 'rgba(255, 255, 255, 0.82)' : isSepia ? '#5c3a21' : '#374151',
                  fontFamily: "'Lora', serif",
                  fontStyle: 'italic',
                  fontWeight: 400,
                  textAlign: 'center',
                  maxWidth: '850px',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  lineHeight: 1.6,
                  letterSpacing: '0.2px'
                }}
              >
                {postData.imageCaption}
              </div>
            ) : null}

            {/* Font Size Adjuster (- A +): Placed right after featured image / caption */}
            {renderFontSizeControl()}
          </div>
        </header>

        {/* ----------------------------------------------------------------------- */}
        {/* CONTENT AREA WITH SIDEBARS                                              */}
        {/* Mobile Sequence: Main Content -> Author -> Tags -> Latest Posts -> Share   */}
        {/* Desktop: Left Aside (Author, Tags) | Main Content | Right Aside (Share, Latest) */}
        {/* ----------------------------------------------------------------------- */}
        <div
          style={{
            display: 'flex',
            flexDirection: isMobileView ? 'column' : 'row',
            gap: isMobileView ? '24px' : (winWidth >= 1440 ? '120px' : '60px'),
            alignItems: isMobileView ? 'stretch' : 'flex-start',
            justifyContent: 'center',
            marginTop: '10px'
          }}
        >
          {/* --------------------------------------------------------------------- */}
          {/* MIDDLE: Main Reading Article Content                                  */}
          {/* Mobile Order: 1 (Comes immediately after featured image)              */}
          {/* --------------------------------------------------------------------- */}
          <article
            className={`blog-article-content-area ${enableDropCap ? 'has-dropcap' : ''}`}
            style={{
              order: isMobileView ? 1 : 2,
              flex: isMobileView ? '1 1 auto' : '1 1 auto',
              minWidth: 0,
              maxWidth: isMobileView ? '100%' : (winWidth >= 1440 ? '800px' : '740px'),
              fontSize: `calc(${isMobile ? '1.02rem' : '1.14rem'} * ${fontScale})`,
              lineHeight: isMobile ? 1.75 : 1.9,
              color: isLight ? '#2b2d42' : 'rgba(255,255,255,0.88)',
              fontFamily: "'Lora', serif",
              paddingLeft: isMobileView
                ? (!isPhone ? (winWidth >= 1000 ? '160px' : '80px') : '0')
                : '10px',
              paddingRight: isMobileView
                ? (!isPhone ? (winWidth >= 1000 ? '160px' : '80px') : '0')
                : '10px',
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            <style>{`
              .blog-article-content-area,
              .blog-article-content-area p,
              .blog-article-content-area li,
              .blog-article-content-area td,
              .blog-article-content-area th,
              .blog-article-content-area .zw-blog-content,
              .blog-article-content-area .zw-blog-content *,
              .blog-article-content-area .zw-blog-content p,
              .blog-article-content-area .zw-blog-content li,
              .blog-article-content-area .zw-blog-content span:not([class*="icon"]):not(.fa-solid):not(.fa-regular),
              .blog-article-content-area .zw-blog-content-wrapper,
              .blog-article-content-area .zw-blog-content-wrapper *,
              .blog-article-content-area .zw-blog-content-wrapper p,
              .blog-article-content-area .zw-blog-content-wrapper li,
              .blog-article-content-area .ProseMirror,
              .blog-article-content-area .ProseMirror *,
              .blog-article-content-area .tiptap,
              .blog-article-content-area .tiptap * {
                font-family: 'Lora', Georgia, serif !important;
              }
              .blog-article-content-area,
              .blog-article-content-area p,
              .blog-article-content-area li,
              .blog-article-content-area td,
              .blog-article-content-area th,
              .blog-article-content-area .zw-blog-content,
              .blog-article-content-area .zw-blog-content p,
              .blog-article-content-area .zw-blog-content li,
              .blog-article-content-area .zw-blog-content span:not([class*="icon"]):not(.fa-solid):not(.fa-regular),
              .blog-article-content-area .zw-blog-content-wrapper p,
              .blog-article-content-area .zw-blog-content-wrapper li {
                font-size: calc(${isMobile ? '1.05rem' : '1.18rem'} * ${fontScale}) !important;
              }
              .blog-article-content-area blockquote,
              .blog-article-content-area blockquote p,
              .blog-article-content-area .zw-blog-content blockquote,
              .blog-article-content-area .zw-blog-content blockquote p {
                font-size: calc(${isMobile ? '1.05rem' : '1.35rem'} * ${fontScale}) !important;
                font-family: 'Lora', Georgia, serif !important;
              }
              .blog-article-content-area h2,
              .blog-article-content-area .zw-blog-content h2 {
                font-size: calc(${isMobile ? '1.35rem' : '1.85rem'} * ${1 + (fontScale - 1) * 0.45}) !important;
                font-family: 'Lora', Georgia, serif !important;
              }
              .blog-article-content-area h3,
              .blog-article-content-area .zw-blog-content h3 {
                font-size: calc(${isMobile ? '1.15rem' : '1.45rem'} * ${1 + (fontScale - 1) * 0.45}) !important;
                font-family: 'Lora', Georgia, serif !important;
              }
              .blog-article-content-area pre,
              .blog-article-content-area code,
              .blog-article-content-area kbd,
              .blog-article-content-area .zw-blog-content pre,
              .blog-article-content-area .zw-blog-content code {
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace !important;
              }

              /* Editorial Magazine-Style Drop Cap on first letter of first paragraph */
              .blog-article-content-area.has-dropcap .zw-blog-content-wrapper > .zw-blog-content > p:first-of-type::first-letter,
              .blog-article-content-area.has-dropcap .zw-blog-content-wrapper > .zw-blog-prose > p:first-of-type::first-letter,
              .blog-article-content-area.has-dropcap .zw-blog-content-wrapper > p:first-of-type::first-letter,
              .blog-article-content-area.has-dropcap .zw-blog-content > p:first-of-type::first-letter,
              .blog-article-content-area.has-dropcap .zw-blog-prose > p:first-of-type::first-letter,
              .blog-article-content-area.has-dropcap .ProseMirror > p:first-of-type::first-letter,
              .blog-article-content-area.has-dropcap .tiptap > p:first-of-type::first-letter {
                float: left;
                font-family: 'Playfair Display', Georgia, 'Times New Roman', serif !important;
                font-size: calc(${isMobile ? '3.3rem' : '4.1rem'} * ${fontScale}) !important;
                line-height: 0.8 !important;
                font-weight: 700 !important;
                margin-top: 0.12em !important;
                margin-right: 0.65rem !important;
                margin-bottom: -0.05em !important;
                padding: 0 4px 0 0 !important;
                color: ${isSepia ? '#78350f' : isLight ? '#0f172a' : '#ffffff'} !important;
                text-transform: uppercase !important;
              }
            `}</style>
            {post?.content ? (
              <div
                className={`zw-blog-content zw-blog-content-wrapper ${isLight ? 'light-mode' : 'dark-mode'}`}
                style={{
                  color: isLight ? '#1e293b' : 'rgba(255,255,255,0.88)',
                  fontSize: `calc(${isMobile ? '1.05rem' : '1.18rem'} * ${fontScale})`,
                  lineHeight: isMobile ? 1.75 : 1.9,
                  marginBottom: '30px'
                }}
              >
                <style>{`
                    .zw-blog-content-wrapper.light-mode,
                    .zw-blog-content-wrapper.light-mode *,
                    .zw-blog-content-wrapper.light-mode p,
                    .zw-blog-content-wrapper.light-mode span,
                    .zw-blog-content-wrapper.light-mode li,
                    .zw-blog-content-wrapper.light-mode strong,
                    .zw-blog-content-wrapper.light-mode em {
                      color: #1e293b !important;
                    }
                    .zw-blog-content-wrapper.light-mode h1,
                    .zw-blog-content-wrapper.light-mode h2,
                    .zw-blog-content-wrapper.light-mode h3,
                    .zw-blog-content-wrapper.light-mode h4,
                    .zw-blog-content-wrapper.light-mode h5,
                    .zw-blog-content-wrapper.light-mode h6 {
                      color: #0f172a !important;
                    }

                    /* Remove divider lines after headings */
                    .zw-blog-content h1,
                    .zw-blog-content h2,
                    .zw-blog-content h3,
                    .zw-blog-content h4,
                    .zw-blog-content h5,
                    .zw-blog-content h6,
                    .zw-blog-content-wrapper h1,
                    .zw-blog-content-wrapper h2,
                    .zw-blog-content-wrapper h3,
                    .zw-blog-content-wrapper h4,
                    .zw-blog-content-wrapper h5,
                    .zw-blog-content-wrapper h6 {
                      border: none !important;
                      border-bottom: none !important;
                      padding-bottom: 0 !important;
                    }
                    .zw-blog-content-wrapper.light-mode .zw-blog-faq {
                      background: #f8fafc !important;
                      border: 1px solid #e2e8f0 !important;
                      border-radius: 12px !important;
                      margin: 1.2rem 0 !important;
                      padding: 16px 20px !important;
                    }
                    .zw-blog-content-wrapper.light-mode .zw-blog-faq-question {
                      color: #0f172a !important;
                      font-weight: 700 !important;
                      cursor: pointer !important;
                      font-size: 1.05rem !important;
                    }
                    .zw-blog-content-wrapper.light-mode .zw-blog-faq-answer {
                      color: #334155 !important;
                      margin-top: 10px !important;
                      line-height: 1.7 !important;
                      font-size: 0.98rem !important;
                    }

                    .zw-blog-content-wrapper.dark-mode,
                    .zw-blog-content-wrapper.dark-mode *,
                    .zw-blog-content-wrapper.dark-mode p,
                    .zw-blog-content-wrapper.dark-mode span,
                    .zw-blog-content-wrapper.dark-mode li {
                      color: rgba(255, 255, 255, 0.88) !important;
                    }
                    .zw-blog-content-wrapper.dark-mode h1,
                    .zw-blog-content-wrapper.dark-mode h2,
                    .zw-blog-content-wrapper.dark-mode h3,
                    .zw-blog-content-wrapper.dark-mode h4 {
                      color: #ffffff !important;
                    }

                    /* Dark Mode FAQs: Cosmic Dark Theme */
                    .zw-blog-content-wrapper.dark-mode .zw-blog-faq {
                      background: rgba(255, 255, 255, 0.04) !important;
                      border: 1px solid rgba(255, 255, 255, 0.12) !important;
                      border-radius: 12px !important;
                      margin: 1.2rem 0 !important;
                      padding: 16px 20px !important;
                      transition: all 0.2s ease !important;
                    }
                    .zw-blog-content-wrapper.dark-mode .zw-blog-faq:hover {
                      background: rgba(255, 255, 255, 0.07) !important;
                      border-color: rgba(168, 85, 247, 0.45) !important;
                    }
                    .zw-blog-content-wrapper.dark-mode .zw-blog-faq[open] {
                      background: rgba(255, 255, 255, 0.06) !important;
                      border-color: rgba(168, 85, 247, 0.55) !important;
                      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
                    }
                    .zw-blog-content-wrapper.dark-mode .zw-blog-faq-question {
                      color: #ffffff !important;
                      font-weight: 700 !important;
                      cursor: pointer !important;
                      font-size: 1.05rem !important;
                      outline: none !important;
                    }
                    .zw-blog-content-wrapper.dark-mode .zw-blog-faq[open] .zw-blog-faq-question {
                      color: #c084fc !important;
                    }
                    .zw-blog-content-wrapper.dark-mode .zw-blog-faq-answer {
                      color: rgba(255, 255, 255, 0.82) !important;
                      margin-top: 12px !important;
                      line-height: 1.7 !important;
                      font-size: 0.98rem !important;
                      padding-top: 8px !important;
                      border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
                    }

                    /* Dark Mode Callouts, CTAs & Tables */
                    .zw-blog-content-wrapper.dark-mode .zw-blog-callout--info {
                      background: rgba(59, 130, 246, 0.12) !important;
                      border-color: #3b82f6 !important;
                      color: #bfdbfe !important;
                    }
                    .zw-blog-content-wrapper.dark-mode .zw-blog-callout--warning {
                      background: rgba(245, 158, 11, 0.12) !important;
                      border-color: #f59e0b !important;
                      color: #fde68a !important;
                    }
                    .zw-blog-content-wrapper.dark-mode .zw-blog-callout--tip {
                      background: rgba(16, 185, 129, 0.12) !important;
                      border-color: #10b981 !important;
                      color: #a7f3d0 !important;
                    }
                    .zw-blog-content-wrapper.dark-mode .zw-blog-callout--success {
                      background: rgba(34, 197, 94, 0.12) !important;
                      border-color: #22c55e !important;
                      color: #bbf7d0 !important;
                    }
                    .zw-blog-content-wrapper.dark-mode .zw-blog-cta {
                      background: rgba(255, 255, 255, 0.05) !important;
                      border: 1px solid rgba(255, 255, 255, 0.15) !important;
                    }
                    .zw-blog-content-wrapper.dark-mode .zw-blog-cta-title {
                      color: #ffffff !important;
                    }
                    .zw-blog-content-wrapper.dark-mode .zw-blog-cta-desc {
                      color: rgba(255, 255, 255, 0.75) !important;
                    }
                  `}</style>
                <BlogContent content={activePost.content} />
              </div>
            ) : activePost?.content_html ? (
              <div
                className={`zw-blog-content zw-blog-content-wrapper ${isLight ? 'light-mode' : 'dark-mode'}`}
                dangerouslySetInnerHTML={{ __html: activePost.content_html }}
                style={{
                  color: isLight ? '#1e293b' : 'rgba(255,255,255,0.88)',
                  fontSize: `calc(${isMobile ? '1.05rem' : '1.18rem'} * ${fontScale})`,
                  lineHeight: isMobile ? 1.75 : 1.9,
                  marginBottom: '30px'
                }}
              />
            ) : null}



          </article>

          {/* Desktop Left Sidebar: Author & Tags */}
          {!isMobileView && (
            <aside
              style={{
                order: 1,
                flex: '0 0 190px',
                width: '190px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                position: 'sticky',
                top: '100px'
              }}
            >
              {renderAuthorWidget()}
              {renderDesktopTags()}
            </aside>
          )}

          {/* Desktop Right Sidebar: Share & Latest */}
          {!isMobileView && (
            <aside
              style={{
                order: 3,
                flex: '0 0 200px',
                width: '200px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                position: 'sticky',
                top: '100px'
              }}
            >
              {renderDesktopShare()}
              {renderLatestWidget()}
            </aside>
          )}

          {/* Mobile & Tablet Post-Content Section: Share -> Tags -> Author & Latest (Full width) */}
          {isMobileView && (
            <div
              style={{
                order: 2,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                marginTop: '10px',
                boxSizing: 'border-box'
              }}
            >
              {/* 1. Share Row */}
              {renderMobileShare()}

              {/* 2. Tags Row (JUST AFTER SHARE) */}
              {renderMobileTags()}

              {/* 3. Author and Latest: side by side in tablet / small tab views, stacked on phone */}
              {!isPhone ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '20px',
                    width: '100%',
                    alignItems: 'stretch',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ flex: '0 0 37%', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    {renderAuthorWidget()}
                  </div>
                  <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    {renderLatestWidget()}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '18px',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  {renderAuthorWidget()}
                  {renderLatestWidget()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* PREVIOUS / NEXT POST NAVIGATION (FULL WIDTH OF CONTENT SECTION)           */}
        {/* ========================================================================= */}
        {(prevPost || nextPost) && (
          <div
            style={{
              width: '100%',
              marginTop: isMobile ? '28px' : '40px',
              paddingTop: isMobile ? '20px' : '28px',
              borderTop: isDark ? '1px solid rgba(255,255,255,0.1)' : (isSepia ? '1px solid rgba(217, 119, 6, 0.2)' : '1px solid rgba(0,0,0,0.08)'),
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
              boxSizing: 'border-box'
            }}
          >
            {/* PREVIOUS POST BUTTON (Anchored Far Left, Box Hugs Text Only) */}
            {prevPost ? (
              <Link
                to={`/blog/${prevPost.id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: (isMobile || isTablet) ? '8px' : '14px',
                  padding: (isMobile || isTablet) ? '10px 16px' : '11px 18px',
                  borderRadius: '12px',
                  background: isDark ? 'rgba(255, 255, 255, 0.025)' : (isSepia ? '#fef6ea' : '#f9fafb'),
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : (isSepia ? '1px solid rgba(217, 119, 6, 0.28)' : '1px solid #e5e7eb'),
                  boxShadow: isSepia ? '0 4px 14px rgba(217, 119, 6, 0.06)' : 'none',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  boxSizing: 'border-box',
                  flex: (isMobile || isTablet) ? '0 0 auto' : '0 1 360px',
                  width: (isMobile || isTablet) ? 'auto' : '100%',
                  maxWidth: (isMobile || isTablet) ? 'none' : '360px'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.borderColor = 'var(--brand-purple)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = isSepia
                    ? '0 8px 20px rgba(217, 119, 6, 0.15)'
                    : isLight
                    ? '0 8px 20px rgba(147, 51, 234, 0.1)'
                    : '0 10px 24px rgba(0, 0, 0, 0.4), 0 0 16px rgba(147, 51, 234, 0.2)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : (isSepia ? 'rgba(217, 119, 6, 0.28)' : '#e5e7eb');
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = isSepia ? '0 4px 14px rgba(217, 119, 6, 0.06)' : 'none';
                }}
              >
                {/* Direction Arrow */}
                <div
                  style={{
                    width: (isMobile || isTablet) ? '28px' : '36px',
                    height: (isMobile || isTablet) ? '28px' : '36px',
                    borderRadius: '50%',
                    background: isDark ? 'rgba(147, 51, 234, 0.2)' : (isSepia ? '#fde8c8' : 'rgba(147, 51, 234, 0.08)'),
                    border: isSepia ? '1px solid #d97706' : '1px solid var(--brand-purple)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isSepia ? '#b45309' : 'var(--brand-purple)',
                    fontSize: (isMobile || isTablet) ? '0.85rem' : '1.05rem',
                    fontWeight: 700,
                    flexShrink: 0
                  }}
                >
                  ←
                </div>

                {/* Content (No extra empty space after text) */}
                <div
                  style={{
                    flex: (isMobile || isTablet) ? '0 0 auto' : 1,
                    minWidth: 0,
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'center'
                  }}
                >
                  <div
                    style={{
                      fontFamily: '"Noto Sans", sans-serif',
                      fontSize: (isMobile || isTablet) ? '0.68rem' : '0.72rem',
                      fontWeight: 400,
                      letterSpacing: '3px',
                      color: isSepia ? '#b45309' : '#bd75ff',
                      textTransform: 'uppercase',
                      marginBottom: (isMobile || isTablet) ? '0px' : '4px',
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      width: 'auto'
                    }}
                  >
                    PREVIOUS POST
                  </div>
                  {(!isMobile && !isTablet) && (
                    <div
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '0.92rem',
                        fontWeight: 600,
                        color: isDark ? '#ffffff' : (isSepia ? '#2a1a08' : '#111827'),
                        lineHeight: 1.35,
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                        textAlign: 'left',
                        width: '100%'
                      }}
                    >
                      {prevPost.title}
                    </div>
                  )}
                </div>
              </Link>
            ) : (
              <div style={{ display: (isMobile || isTablet) ? 'none' : 'block' }} />
            )}

            {/* NEXT POST BUTTON (Anchored Far Right, Box Hugs Text Only) */}
            {nextPost && (
              <Link
                to={`/blog/${nextPost.id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: (isMobile || isTablet) ? '8px' : '14px',
                  padding: (isMobile || isTablet) ? '10px 16px' : '11px 18px',
                  borderRadius: '12px',
                  background: isDark ? 'rgba(255, 255, 255, 0.025)' : (isSepia ? '#fef6ea' : '#f9fafb'),
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : (isSepia ? '1px solid rgba(217, 119, 6, 0.28)' : '1px solid #e5e7eb'),
                  boxShadow: isSepia ? '0 4px 14px rgba(217, 119, 6, 0.06)' : 'none',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  boxSizing: 'border-box',
                  flex: (isMobile || isTablet) ? '0 0 auto' : '0 1 360px',
                  width: (isMobile || isTablet) ? 'auto' : '100%',
                  maxWidth: (isMobile || isTablet) ? 'none' : '360px',
                  marginLeft: 'auto'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.borderColor = 'var(--brand-purple)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = isSepia
                    ? '0 8px 20px rgba(217, 119, 6, 0.15)'
                    : isLight
                    ? '0 8px 20px rgba(147, 51, 234, 0.1)'
                    : '0 10px 24px rgba(0, 0, 0, 0.4), 0 0 16px rgba(147, 51, 234, 0.2)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : (isSepia ? 'rgba(217, 119, 6, 0.28)' : '#e5e7eb');
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = isSepia ? '0 4px 14px rgba(217, 119, 6, 0.06)' : 'none';
                }}
              >
                {/* Content (Aligned Right, No extra empty space before text) */}
                <div
                  style={{
                    flex: (isMobile || isTablet) ? '0 0 auto' : 1,
                    minWidth: 0,
                    textAlign: 'right',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    justifyContent: 'center'
                  }}
                >
                  <div
                    style={{
                      fontFamily: '"Noto Sans", sans-serif',
                      fontSize: (isMobile || isTablet) ? '0.68rem' : '0.72rem',
                      fontWeight: 400,
                      letterSpacing: '3px',
                      color: isSepia ? '#b45309' : '#bd75ff',
                      textTransform: 'uppercase',
                      marginBottom: (isMobile || isTablet) ? '0px' : '4px',
                      textAlign: 'right',
                      whiteSpace: 'nowrap',
                      width: 'auto'
                    }}
                  >
                    NEXT POST
                  </div>
                  {(!isMobile && !isTablet) && (
                    <div
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '0.92rem',
                        fontWeight: 600,
                        color: isDark ? '#ffffff' : (isSepia ? '#2a1a08' : '#111827'),
                        lineHeight: 1.35,
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                        textAlign: 'right',
                        width: '100%'
                      }}
                    >
                      {nextPost.title}
                    </div>
                  )}
                </div>

                {/* Direction Arrow */}
                <div
                  style={{
                    width: (isMobile || isTablet) ? '28px' : '36px',
                    height: (isMobile || isTablet) ? '28px' : '36px',
                    borderRadius: '50%',
                    background: isDark ? 'rgba(189, 117, 255, 0.15)' : (isSepia ? '#fde8c8' : 'rgba(189, 117, 255, 0.08)'),
                    border: isSepia ? '1px solid #d97706' : '1px solid #bd75ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isSepia ? '#b45309' : '#bd75ff',
                    fontSize: (isMobile || isTablet) ? '0.85rem' : '1.05rem',
                    fontWeight: 400,
                    flexShrink: 0
                  }}
                >
                  →
                </div>
              </Link>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* COMMENTS SECTION (Powered by @zwantum/blog)                               */}
        {/* ========================================================================= */}
        <section
          style={{
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          <CommentSection postId={activePost?.id || String(id || '1')} />
        </section>

        {/* ========================================================================= */}
        {/* RELATED POSTS SECTION                                                     */}
        {/* ========================================================================= */}
        {relatedPosts.length > 0 && (
          <section
            style={{
              width: '100%',
              marginTop: isMobile ? '36px' : '55px',
              paddingTop: isMobile ? '24px' : '36px',
              borderTop: isDark ? '1px solid rgba(255,255,255,0.1)' : (isSepia ? '1px solid rgba(217, 119, 6, 0.2)' : '1px solid rgba(0,0,0,0.08)'),
              boxSizing: 'border-box'
            }}
          >
            {/* Section Header */}
            <div
              style={{
                display: 'flex',
                alignItems: isMobile ? 'flex-start' : 'flex-end',
                justifyContent: 'space-between',
                flexDirection: isMobile ? 'column' : 'row',
                gap: '12px',
                marginBottom: isMobile ? '20px' : '28px'
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: '"Noto Sans", sans-serif',
                    fontSize: '0.78rem',
                    fontWeight: 400,
                    letterSpacing: '3px',
                    color: isSepia ? '#b45309' : '#bd75ff',
                    textTransform: 'uppercase',
                    marginBottom: '6px'
                  }}
                >
                  EXPLORE FURTHER
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: "'Playfair Display', serif",
                    fontSize: isMobile ? '1.45rem' : '1.85rem',
                    fontWeight: 700,
                    color: isDark ? '#ffffff' : (isSepia ? '#2a1a08' : '#111827'),
                    lineHeight: 1.25,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  Related Posts
                  <ZwosmosIcon size={14} color={isSepia ? '#d97706' : '#bd75ff'} />
                </h3>
              </div>

              <Link
                to={`/${postData.categorySlug || 'space-news'}`}
                style={{
                  fontFamily: '"Noto Sans", sans-serif',
                  fontSize: '0.84rem',
                  fontWeight: 400,
                  letterSpacing: '3px',
                  color: isSepia ? '#b45309' : '#bd75ff',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'opacity 0.2s',
                  paddingBottom: '2px',
                  textTransform: 'uppercase'
                }}
                onMouseOver={e => (e.currentTarget.style.opacity = '0.75')}
                onMouseOut={e => (e.currentTarget.style.opacity = '1')}
              >
                <span>More in {postData.categoryName || 'Space'}</span>
                <span>→</span>
              </Link>
            </div>

            {/* Related Posts Grid using standard BlogCard */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isPhone ? '1fr' : 'repeat(3, 1fr)',
                gap: isPhone ? '28px 16px' : (isSmallTab ? '24px 14px' : '36px 24px'),
                boxSizing: 'border-box'
              }}
            >
              {relatedPosts.map(post => (
                <BlogCard
                  key={post.id}
                  id={post.id}
                  category={post.category}
                  title={post.title}
                  desc={post.desc}
                  img={String(post.img || '')}
                  authorName={post.authorName}
                  authorImg={post.authorImg}
                  date={post.date}
                  variant="standard"
                  showExcerpt={false}
                />
              ))}
            </div>
          </section>
        )}
      </div>
      )}
      <Footer isLight={isLight} />
    </div>
  );
};

export default BlogPostPage;
