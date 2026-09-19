import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMobile } from '../contexts/MobileContext';
import { useTheme } from '../contexts/ThemeContext';
import { ALL_BLOG_POSTS } from '../data/blogData';
import Header from './Header';
import Footer from './Footer';
import { BlogCard } from './BlogCard';
import { useBlogPost, useBlogPosts, BlogContent, CommentSection } from '@zwantum/blog/react';
import '@zwantum/blog-editor/content.css';
import { useSEO } from '../lib/seoService';

const BlogPostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isMobile } = useMobile();
  const [copied, setCopied] = useState(false);
  const { isLight } = useTheme();

  // Fetch live article and all published posts from Supabase via @zwantum/blog
  const { post } = useBlogPost(id || '');
  const { posts: allLivePosts } = useBlogPosts();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  // Transform live posts to unified interface or fallback to curated mocks
  const dynamicPostList = React.useMemo(() => {
    if (allLivePosts && allLivePosts.length > 0) {
      return allLivePosts.map(p => ({
        id: p.slug || p.id,
        category: p.categories?.[0]?.name || 'Space News',
        categorySlug: p.categories?.[0]?.slug || 'space-news',
        title: p.title,
        desc: p.excerpt || '',
        img: p.featured_image?.url || 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1000&auto=format&fit=crop',
        authorName: p.author?.name || 'Editorial Team',
        authorImg: p.author?.profile_image_url || undefined,
        date: p.published_at
          ? new Date(p.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : 'Recent',
        readTime: `${p.reading_time || 5} min read`
      }));
    }
    return ALL_BLOG_POSTS;
  }, [allLivePosts]);

  const currentId = id ? parseInt(id, 10) : 1;
  const currentIndex = dynamicPostList.findIndex(p => p.id === id || p.id === currentId || p.categorySlug === id);
  const validIndex = currentIndex >= 0 ? currentIndex : 0;
  const currentPost = dynamicPostList[validIndex];

  // Dynamic Open Graph & Article SEO for Facebook, Twitter/X, LinkedIn, Discord
  const articleTitle = post?.title || currentPost?.title;
  const articleDesc = post?.excerpt || currentPost?.desc;
  const articleImage = post?.featured_image?.url || currentPost?.img;
  const articleAuthor = post?.author?.name || currentPost?.authorName;
  const articlePublishedAt = post?.published_at;
  const articleCategory = post?.categories?.[0]?.name || currentPost?.category;
  const articleTags = post?.tags?.map((t: any) => (typeof t === 'string' ? t : t?.name)).filter(Boolean) || [];

  useSEO({
    title: articleTitle,
    description: articleDesc,
    image: articleImage,
    type: 'article',
    author: articleAuthor,
    publishedTime: articlePublishedAt || undefined,
    section: articleCategory,
    tags: articleTags,
    twitterCard: 'summary_large_image'
  });

  // Previous and Next posts navigation
  const prevPost = validIndex > 0 ? dynamicPostList[validIndex - 1] : dynamicPostList[dynamicPostList.length - 1];
  const nextPost = validIndex < dynamicPostList.length - 1 ? dynamicPostList[validIndex + 1] : dynamicPostList[0];

  // Related posts: prioritize same category, exclude current post, limit to 3 posts
  const relatedPosts = React.useMemo(() => {
    if (!currentPost && !post) return dynamicPostList.slice(0, 3);
    const categorySlug = post?.categories?.[0]?.slug || currentPost?.categorySlug;
    const sameCategory = dynamicPostList.filter(
      p => p.id !== (post?.slug || post?.id || currentPost?.id) && (p.categorySlug === categorySlug || p.category === post?.categories?.[0]?.name)
    );
    const results = [...sameCategory];
    if (results.length < 3) {
      const existingIds = new Set([post?.slug, post?.id, currentPost?.id, ...results.map(p => p.id)]);
      const others = dynamicPostList.filter(p => !existingIds.has(p.id));
      results.push(...others);
    }
    return results.slice(0, 3);
  }, [dynamicPostList, currentPost, post]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // Real dynamic count of works published by this author
  const authorArticlesCount = React.useMemo(() => {
    if (!allLivePosts || allLivePosts.length === 0) return 1;
    const authorId = post?.author?.id;
    const authorName = post?.author?.name || currentPost?.authorName;
    if (authorId) {
      const match = allLivePosts.filter(p => p.author?.id === authorId).length;
      if (match > 0) return match;
    }
    if (authorName) {
      const match = allLivePosts.filter(p => p.author?.name?.toLowerCase() === authorName.toLowerCase()).length;
      if (match > 0) return match;
    }
    return allLivePosts.length;
  }, [allLivePosts, post, currentPost]);

  // Real dynamic tags assigned to this blog post (with slug for routing)
  const postTags = React.useMemo(() => {
    if (post?.tags && post.tags.length > 0) {
      return post.tags.map(t => ({
        name: t.name,
        slug: t.slug || t.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      }));
    }
    if (post?.categories && post.categories.length > 0) {
      return post.categories.map(c => ({
        name: c.name,
        slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      }));
    }
    if (currentPost?.category) {
      return [{ name: currentPost.category, slug: currentPost.categorySlug || currentPost.category.toLowerCase().replace(/\s+/g, '-') }];
    }
    return [];
  }, [post, currentPost]);

  // Real dynamic latest posts fetched from Supabase (excluding the current active article)
  const latestSidebarPosts = React.useMemo(() => {
    const currentPostId = post?.slug || post?.id || id;
    const filtered = dynamicPostList.filter(p => p.id !== currentPostId);
    return filtered.slice(0, 3);
  }, [dynamicPostList, post, id]);

  // Dynamic post metadata with live Supabase post or fallback to curated mocks
  const postData = {
    title: post ? post.title : (currentPost ? currentPost.title : 'The Nursery of New Stars: Inside the Pillars of Cosmic Creation'),
    excerpt: post?.excerpt || (currentPost ? currentPost.desc : 'Deep within the eagle-winged clouds of interstellar gas, gravitational whispers give birth to newborn suns.'),
    featuredImage: post?.featured_image?.url || (currentPost ? currentPost.img : 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1600&auto=format&fit=crop'),
    imageCaption: post?.featured_image?.caption || '',
    category: (post?.categories?.[0]?.name || (currentPost ? currentPost.category : 'DEEP SPACE')).toUpperCase(),
    categoryName: post?.categories?.[0]?.name || (currentPost ? currentPost.category : 'Deep Space'),
    publishedDate: post?.published_at
      ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : (currentPost ? currentPost.date : 'September 26, 2026'),
    readTime: post?.reading_time ? `${post.reading_time} min read` : (currentPost?.readTime || '6 min read'),
    author: {
      name: post?.author?.name || (currentPost ? currentPost.authorName : 'Zwosmos'),
      slug: post?.author?.slug || (post?.author?.name || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      role: post?.author?.designation || (currentPost ? 'Editor' : 'Editor'),
      avatar: post?.author?.profile_image_url || null, // ONLY show image if added in dashboard, never show random fallback
      bio: post?.author?.bio || '',
      articlesCount: authorArticlesCount
    },
    tags: postTags
  };

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: isLight
          ? '#ffffff'
          : 'radial-gradient(ellipse at top center, rgba(147, 51, 234, 0.25) 0%, var(--bg-main) 60%)',
        backgroundColor: isLight ? '#ffffff' : 'var(--bg-main)',
        color: isLight ? '#111827' : 'white',
        boxSizing: 'border-box',
        transition: 'background 0.3s ease'
      }}
    >
      {/* Global Shared Header */}
      <Header />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: isMobile ? '20px 14px 20px' : '25px 4% 20px', boxSizing: 'border-box' }}>
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
            marginBottom: isMobile ? '20px' : '30px'
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
              to={`/${currentPost?.categorySlug || 'space-news'}`}
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
            {/* Post Title */}
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: isMobile ? '1.65rem' : '2.65rem',
                lineHeight: isMobile ? 1.25 : 1.2,
                margin: isMobile ? '0 0 14px 0' : '0 0 18px 0',
                fontWeight: 700,
                color: isLight ? '#111827' : 'white',
                letterSpacing: isMobile ? '-0.2px' : '-0.4px'
              }}
            >
              {postData.title}
            </h1>

            {/* Excerpt */}
            <div
              style={{
                fontSize: isMobile ? '1rem' : '1.3rem',
                lineHeight: isMobile ? 1.6 : 1.65,
                color: isLight ? '#2b2d42' : 'rgba(255,255,255,0.9)',
                fontFamily: "'Lora', serif",
                fontStyle: 'italic',
                margin: isMobile ? '0 0 18px 0' : '0 0 24px 0',
                paddingLeft: isMobile ? '12px' : '18px',
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
                gap: isMobile ? '8px 12px' : '18px',
                marginBottom: isMobile ? '24px' : '35px',
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                fontFamily: "'Lora', serif",
                color: isLight ? '#4b5563' : 'rgba(255,255,255,0.72)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'var(--brand-purple)' }}>✦</span>
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
                    color: 'var(--brand-purple)',
                    fontWeight: 700,
                    letterSpacing: '0.5px'
                  }}
                >
                  {postData.category}
                </span>
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
                  aspectRatio: isMobile ? '16/10' : '21/9',
                  maxHeight: isMobile ? '280px' : '540px',
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
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* Image Caption - Only rendered if caption is present */}
              {postData.imageCaption ? (
                <div
                  style={{
                    marginTop: isMobile ? '10px' : '14px',
                    fontSize: isMobile ? '0.78rem' : '0.84rem',
                    color: isLight ? '#6b7280' : 'rgba(255, 255, 255, 0.55)',
                    fontFamily: "'Lora', serif",
                    fontStyle: 'italic',
                    textAlign: 'center',
                    maxWidth: '750px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    lineHeight: 1.5
                  }}
                >
                  {postData.imageCaption}
                </div>
              ) : null}
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
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '35px' : '30px',
              alignItems: 'flex-start',
              justifyContent: 'center',
              marginTop: '10px'
            }}
          >
            {/* --------------------------------------------------------------------- */}
            {/* MIDDLE: Main Reading Article Content                                  */}
            {/* Mobile Order: 1 (Comes immediately after featured image)              */}
            {/* --------------------------------------------------------------------- */}
            <article
              style={{
                order: isMobile ? 1 : 2,
                flex: '1 1 auto',
                minWidth: 0,
                maxWidth: isMobile ? '100%' : '900px',
                fontSize: isMobile ? '1.02rem' : '1.14rem',
                lineHeight: isMobile ? 1.75 : 1.9,
                color: isLight ? '#2b2d42' : 'rgba(255,255,255,0.88)',
                fontFamily: "'Lora', serif",
                padding: isMobile ? '0' : '0 10px',
                width: isMobile ? '100%' : 'auto',
                boxSizing: 'border-box'
              }}
            >
              {post?.content ? (
                <div
                  className={`zw-blog-content zw-blog-content-wrapper ${isLight ? 'light-mode' : 'dark-mode'}`}
                  style={{
                    color: isLight ? '#1e293b' : 'rgba(255,255,255,0.88)',
                    fontSize: isMobile ? '1.05rem' : '1.18rem',
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
                  <BlogContent content={post.content} />
                </div>
              ) : (
                <>
                  <p
                style={{
                  marginBottom: isMobile ? '20px' : '26px',
                  fontSize: isMobile ? '1.05rem' : '1.18rem',
                  color: isLight ? '#2b2d42' : 'rgba(255,255,255,0.88)'
                }}
              >
                <span
                  style={{
                    float: 'left',
                    fontSize: 'clamp(2.2rem, 1.6rem + 2.5vw, 3.8rem)',
                    lineHeight: '0.85',
                    paddingTop: isMobile ? '4px' : '6px',
                    paddingRight: isMobile ? '8px' : '12px',
                    paddingBottom: '2px',
                    color: 'var(--brand-purple)',
                    fontFamily: "'Playfair Display', serif",
                    fontWeight: 700
                  }}
                >
                  F
                </span>
                ar beyond the terrestrial horizons, across vast stellar voids stretching millions of astronomical units, interstellar matter undergoes an extraordinary celestial alchemy. Inside these colossal molecular towers known colloquially as the Pillars of Creation, new protostellar cores condense from cold pockets of molecular hydrogen and microscopic carbon-silicate grains. What appears from afar as an impassive veil of cosmic shadows is in fact one of the most turbulent, fertile furnaces in the known universe.
              </p>

              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 'clamp(1.3rem, 1rem + 1.5vw, 2.3rem)',
                  color: isLight ? '#111827' : 'white',
                  margin: isMobile ? '30px 0 14px 0' : '40px 0 20px 0',
                  position: 'relative',
                  paddingBottom: isMobile ? '8px' : '12px',
                  borderBottom: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)',
                  lineHeight: 1.25
                }}
              >
                The Mechanics of Molecular Collapse
              </h2>

              <p
                style={{
                  marginBottom: isMobile ? '18px' : '24px',
                  color: isLight ? '#2b2d42' : 'rgba(255,255,255,0.88)'
                }}
              >
                Every star begins its journey as a gravitational instability within a giant molecular cloud. These regions are cold, with temperatures hovering merely ten to twenty degrees above absolute zero. At these frigid thresholds, thermal pressure is suppressed, allowing gravity to slowly gain the upper hand over kinetic turbulence.
              </p>

              <p
                style={{
                  marginBottom: isMobile ? '18px' : '24px',
                  color: isLight ? '#2b2d42' : 'rgba(255,255,255,0.88)'
                }}
              >
                When massive neighboring stars detonate as supernovae or radiate piercing ultraviolet winds, shockwaves propagate through the surrounding interstellar medium. These pressure fronts compress quiescent gas pockets, triggering runaway gravitational collapse. As the clump falls inward, potential energy converts into thermal kinetic motion. Within fractions of astronomical epochs, the core densifies and heats up, transitioning from an invisible pocket into an incandescent protostellar envelope.
              </p>

              {/* Styled Cosmic Quote Callout */}
              <blockquote
                style={{
                  margin: isMobile ? '24px 0' : '40px 0',
                  padding: isMobile ? '18px 18px' : '28px 32px',
                  background: isLight ? 'rgba(147, 51, 234, 0.06)' : 'rgba(147, 51, 234, 0.08)',
                  borderLeft: '4px solid var(--brand-purple)',
                  borderRadius: '0 12px 12px 0',
                  fontFamily: "'Playfair Display', serif",
                  fontSize: isMobile ? '1.05rem' : '1.35rem',
                  fontStyle: 'italic',
                  color: isLight ? '#111827' : 'rgba(255,255,255,0.95)',
                  lineHeight: 1.55
                }}
              >
                “The cosmos is within us. We are made of star-stuff. We are a way for the cosmos to know itself.”
                <footer
                  style={{
                    marginTop: '10px',
                    fontSize: isMobile ? '0.78rem' : '0.88rem',
                    fontFamily: "'Lora', serif",
                    fontStyle: 'normal',
                    color: isLight ? '#4b5563' : 'rgba(255,255,255,0.6)'
                  }}
                >
                  — Carl Sagan, Cosmic Reflections
                </footer>
              </blockquote>

              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 'clamp(1.3rem, 1rem + 1.5vw, 2.3rem)',
                  color: isLight ? '#111827' : 'white',
                  margin: isMobile ? '30px 0 14px 0' : '40px 0 20px 0',
                  position: 'relative',
                  lineHeight: 1.25
                }}
              >
                Protoplanetary Disks: The Birthplace of Worlds
              </h2>

              <p
                style={{
                  marginBottom: isMobile ? '18px' : '24px',
                  color: isLight ? '#2b2d42' : 'rgba(255,255,255,0.88)'
                }}
              >
                Conservation of angular momentum dictates that collapsing clouds cannot simply fall straight into a point mass. Instead, the swirling mass spins faster as it contracts, flattening naturally into a thin, circumstellar disk orbiting the newborn star. Within this spinning circumstellar carousel, electrostatic forces cause microscopic dust grains to stick together, snowballing into pebbles, boulders, and eventually kilometer-wide planetesimals.
              </p>

              <p
                style={{
                  marginBottom: isMobile ? '18px' : '24px',
                  color: isLight ? '#2b2d42' : 'rgba(255,255,255,0.88)'
                }}
              >
                Over tens of millions of years, these gravitational attractors clear gaps along their orbital tracks, giving rise to rocky terrestrial spheres near the central star where volatiles evaporate, and massive gas giants in the outer, colder zones beyond the frost line. It is the exact sequence that shaped our own Solar System 4.6 billion years ago.
              </p>

              {/* Highlighted Insight Grid Box */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                  gap: isMobile ? '14px' : '20px',
                  margin: isMobile ? '24px 0' : '35px 0'
                }}
              >
                <div
                  style={{
                    padding: isMobile ? '16px' : '22px',
                    borderRadius: '10px',
                    background: isLight ? '#f8f9fa' : 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(147, 51, 234, 0.3)'
                  }}
                >
                  <div style={{ color: 'var(--brand-purple)', fontSize: isMobile ? '1rem' : '1.15rem', marginBottom: '6px' }}>
                    ✦ Infrared Penetration
                  </div>
                  <div style={{ fontSize: isMobile ? '0.86rem' : '0.94rem', color: isLight ? '#2b2d42' : 'rgba(255,255,255,0.75)', lineHeight: 1.55 }}>
                    Infrared wavelengths slice straight through obscuring dust lanes, unveiling hidden embryonic protostars invisible to optical observatories.
                  </div>
                </div>

                <div
                  style={{
                    padding: isMobile ? '16px' : '22px',
                    borderRadius: '10px',
                    background: isLight ? '#f8f9fa' : 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(147, 51, 234, 0.3)'
                  }}
                >
                  <div style={{ color: 'var(--brand-purple)', fontSize: isMobile ? '1rem' : '1.15rem', marginBottom: '6px' }}>
                    ✦ Bipolar Outflows
                  </div>
                  <div style={{ fontSize: isMobile ? '0.86rem' : '0.94rem', color: isLight ? '#2b2d42' : 'rgba(255,255,255,0.75)', lineHeight: 1.55 }}>
                    Magnetic field lines funnel ionized plasma into relativistic bipolar jets shooting light-years into the surrounding medium.
                  </div>
                </div>
              </div>

              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 'clamp(1.3rem, 1rem + 1.5vw, 2.3rem)',
                  color: isLight ? '#111827' : 'white',
                  margin: isMobile ? '30px 0 14px 0' : '40px 0 20px 0',
                  position: 'relative',
                  lineHeight: 1.25
                }}
              >
                Illuminating the Frontiers of Discovery
              </h2>

              <p
                style={{
                  marginBottom: isMobile ? '18px' : '24px',
                  color: isLight ? '#2b2d42' : 'rgba(255,255,255,0.88)'
                }}
              >
                With modern observatories such as the James Webb Space Telescope and the Atacama Large Millimeter Array (ALMA), humanity is no longer restricted to theoretical models. We can now observe the concentric rings of protoplanetary disks in real-time, measure prebiotic molecular compounds, and trace how our own origins were forged in deep space.
              </p>

              <p
                style={{
                  marginBottom: isMobile ? '24px' : '35px',
                  color: isLight ? '#2b2d42' : 'rgba(255,255,255,0.88)'
                }}
              >
                Every atom of carbon in our cells, every grain of iron in our bloodstream, was once forged in the heart of stars like these. When we look into the deep nebulous clouds of the cosmos, we are gazing directly into our own ancestry.
              </p>
                </>
              )}

              {/* Article Footer Highlight Box */}
              <div
                style={{
                  marginTop: isMobile ? '28px' : '45px',
                  padding: isMobile ? '16px' : '24px 28px',
                  borderRadius: '12px',
                  background: isLight ? '#f8f9fa' : 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(147, 51, 234, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '14px' : '20px'
                }}
              >
                <div
                  style={{
                    width: isMobile ? '38px' : '46px',
                    height: isMobile ? '38px' : '46px',
                    borderRadius: '50%',
                    background: 'rgba(147, 51, 234, 0.2)',
                    border: '1px solid var(--brand-purple)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--brand-purple)',
                    fontSize: isMobile ? '1rem' : '1.2rem',
                    flexShrink: 0
                  }}
                >
                  ✦
                </div>
                <div
                  style={{
                    fontSize: isMobile ? '0.82rem' : '0.92rem',
                    color: isLight ? '#2b2d42' : 'rgba(255,255,255,0.8)',
                    fontFamily: "'Lora', serif"
                  }}
                >
                  You have reached the conclusion of this dispatch. Explore related stellar research in our archives below.
                </div>
              </div>

            </article>

            {/* --------------------------------------------------------------------- */}
            {/* LEFT SIDEBAR: Author & Tags                                           */}
            {/* Mobile Order: 2 (Shows after main content)                           */}
            {/* --------------------------------------------------------------------- */}
            <aside
              style={{
                order: isMobile ? 2 : 1,
                flex: isMobile ? '1 1 100%' : '0 0 190px',
                width: isMobile ? '100%' : '190px',
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? '18px' : '24px',
                position: isMobile ? 'static' : 'sticky',
                top: '100px'
              }}
            >
              {/* Mobile-Only Simple Share Row (Above Author Box, no box layout) */}
              {isMobile && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '4px 2px 10px 2px',
                    width: '100%',
                    boxSizing: 'border-box',
                    borderBottom: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
                    marginBottom: '2px'
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: '0.96rem',
                      fontWeight: 700,
                      color: isLight ? '#111827' : '#ffffff',
                      letterSpacing: '0.5px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <span style={{ color: 'var(--brand-purple)', fontSize: '0.8rem' }}>✦</span> Share:
                  </span>

                  {/* Circular Icon-Only Buttons (Close to text & slightly smaller) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Twitter / X */}
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

                    {/* Facebook */}
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
                        transition: 'transform 0.2s',
                        boxShadow: '0 2px 6px rgba(24, 119, 242, 0.25)'
                      }}
                    >
                      <i className="fa-brands fa-facebook-f"></i>
                    </button>

                    {/* LinkedIn */}
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
                        transition: 'transform 0.2s',
                        boxShadow: '0 2px 6px rgba(10, 102, 194, 0.25)'
                      }}
                    >
                      <i className="fa-brands fa-linkedin-in"></i>
                    </button>

                    {/* Copy Link */}
                    <button
                      onClick={handleCopyLink}
                      title={copied ? 'Copied!' : 'Copy Link'}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: '1px solid var(--brand-purple)',
                        background: copied
                          ? 'var(--brand-purple)'
                          : isLight
                          ? 'rgba(147, 51, 234, 0.1)'
                          : 'rgba(147, 51, 234, 0.22)',
                        color: copied ? '#ffffff' : 'var(--brand-purple)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 6px rgba(147, 51, 234, 0.2)'
                      }}
                    >
                      <i className={copied ? 'fa-solid fa-check' : 'fa-solid fa-link'}></i>
                    </button>
                  </div>
                </div>
              )}

              {/* Author Showcase Widget */}
              <div style={{ display: 'flex', alignItems: 'stretch', position: 'relative', marginLeft: isMobile ? '6px' : '8px' }}>
                {/* Wireframe Border */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: '1px solid var(--brand-purple)',
                    borderRadius: '12px',
                    zIndex: 3,
                    pointerEvents: 'none',
                    transform: isMobile ? 'translate(-6px, 6px)' : 'translate(-8px, 8px)'
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
                      border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
                      borderRight: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)',
                      background: isLight ? '#f3f4f6' : 'var(--bg-main)',
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
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '0.88rem',
                        letterSpacing: '1px',
                        color: isLight ? '#111827' : 'white',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <span style={{ color: 'var(--brand-purple)', marginRight: '5px' }}>✦</span> Author
                    </span>
                  </div>

                  {/* Author Content */}
                  <div
                    style={{
                      flex: 1,
                      background: isLight ? '#fdfdfd' : 'rgba(255,255,255,0.03)',
                      border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
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
                            border: '2px solid var(--brand-purple)',
                            boxShadow: '0 0 12px rgba(147, 51, 234, 0.45)'
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
                          onMouseOver={e => (e.currentTarget.style.color = 'var(--brand-purple)')}
                          onMouseOut={e => (e.currentTarget.style.color = isLight ? '#111827' : 'white')}
                        >
                          {postData.author.name}
                        </Link>
                      </h3>

                      {postData.author.role && (
                        <div
                          style={{
                            color: 'var(--brand-purple)',
                            fontSize: '0.7rem',
                            fontFamily: "'Lora', serif",
                            fontWeight: 600
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
                        borderTop: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
                        paddingTop: '8px',
                        textAlign: 'left',
                        fontSize: '0.7rem',
                        color: isLight ? '#6b7280' : 'rgba(255,255,255,0.5)',
                        fontFamily: "'Lora', serif"
                      }}
                    >
                      {postData.author.articlesCount} {postData.author.articlesCount === 1 ? 'Work Published' : 'Works Published'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags Widget */}
              {postData.tags.length > 0 && (
                isMobile ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px 12px',
                      padding: '10px 2px 14px 2px',
                      width: '100%',
                      boxSizing: 'border-box',
                      borderTop: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
                      borderBottom: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
                      marginTop: '4px'
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '0.96rem',
                        fontWeight: 700,
                        color: isLight ? '#111827' : '#ffffff',
                        letterSpacing: '0.5px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        flexShrink: 0
                      }}
                    >
                      <span style={{ color: 'var(--brand-purple)', fontSize: '0.8rem' }}>✦</span> Tags:
                    </span>

                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                        alignItems: 'center'
                      }}
                    >
                      {postData.tags.map((tag, idx) => (
                        <Link
                          key={idx}
                          to={`/tag/${tag.slug}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            fontSize: '0.78rem',
                            padding: '4px 4px',
                            borderRadius: '16px',
                            
                            color: isLight ? '#1f2937' : 'rgba(255,255,255,0.9)',
                            fontFamily: "'Lora', serif",
                            cursor: 'pointer',
                            textDecoration: 'none',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={e => {
                            e.currentTarget.style.borderColor = 'var(--brand-purple)';
                            e.currentTarget.style.background = 'rgba(147, 51, 234, 0.2)';
                            e.currentTarget.style.color = isLight ? '#9333ea' : '#fff';
                          }}
                          onMouseOut={e => {
                            e.currentTarget.style.borderColor = isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)';
                            e.currentTarget.style.background = isLight ? '#f3f4f6' : 'rgba(255,255,255,0.05)';
                            e.currentTarget.style.color = isLight ? '#1f2937' : 'rgba(255,255,255,0.9)';
                          }}
                        >
                          {tag.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'stretch', position: 'relative', marginLeft: '8px' }}>
                    {/* Wireframe Border */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: '1px solid var(--brand-purple)',
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
                          border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
                          borderRight: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)',
                          background: isLight ? '#f3f4f6' : 'var(--bg-main)',
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
                            fontFamily: "'Playfair Display', serif",
                            fontSize: '0.88rem',
                            letterSpacing: '1px',
                            color: isLight ? '#111827' : 'white',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          <span style={{ color: 'var(--brand-purple)', marginRight: '5px' }}>✦</span> Tags
                        </span>
                      </div>

                      {/* Tags Content */}
                      <div
                        style={{
                          flex: 1,
                          background: isLight ? '#fdfdfd' : 'rgba(255,255,255,0.03)',
                          border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
                          borderLeft: 'none',
                          borderRadius: '0 12px 12px 0',
                          padding: '12px 10px',
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '6px'
                        }}
                      >
                        {postData.tags.map((tag, idx) => (
                          <Link
                            key={idx}
                            to={`/tag/${tag.slug}`}
                            style={{
                              display: 'inline-block',
                              fontSize: '0.7rem',
                              padding: '3px 8px',
                              borderRadius: '14px',
                              background: isLight ? '#f3f4f6' : 'rgba(255,255,255,0.04)',
                              border: isLight ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(255,255,255,0.12)',
                              color: isLight ? '#1f2937' : 'rgba(255,255,255,0.85)',
                              fontFamily: "'Lora', serif",
                              cursor: 'pointer',
                              textDecoration: 'none',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseOver={e => {
                              e.currentTarget.style.borderColor = 'var(--brand-purple)';
                              e.currentTarget.style.background = 'rgba(147, 51, 234, 0.2)';
                              e.currentTarget.style.color = isLight ? '#9333ea' : '#fff';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseOut={e => {
                              e.currentTarget.style.borderColor = isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)';
                              e.currentTarget.style.background = isLight ? '#f3f4f6' : 'rgba(255,255,255,0.04)';
                              e.currentTarget.style.color = isLight ? '#1f2937' : 'rgba(255,255,255,0.85)';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            {tag.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              )}
            </aside>

            {/* --------------------------------------------------------------------- */}
            {/* RIGHT SIDEBAR: Latest Posts, then Share (in Mobile view)              */}
            {/* Mobile Order: 3                                                       */}
            {/* Inside: Latest Post (order 1 on mobile), Share (order 2 on mobile)    */}
            {/* --------------------------------------------------------------------- */}
            <aside
              style={{
                order: isMobile ? 3 : 3,
                flex: isMobile ? '1 1 100%' : '0 0 200px',
                width: isMobile ? '100%' : '200px',
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? '18px' : '24px',
                position: isMobile ? 'static' : 'sticky',
                top: '100px'
              }}
            >
              {/* Latest Posts Widget (order 1 on mobile, 2 on desktop) */}
              <div
                style={{
                  order: isMobile ? 1 : 2,
                  display: 'flex',
                  alignItems: 'stretch',
                  position: 'relative',
                  marginLeft: isMobile ? '6px' : '8px'
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
                    border: '1px solid var(--brand-purple)',
                    borderRadius: '12px',
                    zIndex: 3,
                    pointerEvents: 'none',
                    transform: isMobile ? 'translate(-6px, 6px)' : 'translate(-8px, 8px)'
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
                      border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
                      borderRight: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)',
                      background: isLight ? '#f3f4f6' : 'var(--bg-main)',
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
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '0.88rem',
                        letterSpacing: '1px',
                        color: isLight ? '#111827' : 'white',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <span style={{ color: 'var(--brand-purple)', marginRight: '5px' }}>✦</span> Latest
                    </span>
                  </div>

                  {/* Posts Container */}
                  <div
                    style={{
                      flex: 1,
                      background: isLight ? '#fdfdfd' : 'rgba(255,255,255,0.03)',
                      border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
                      borderLeft: 'none',
                      borderRadius: '0 12px 12px 0',
                      padding: '14px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
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
                            border: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)'
                          }}
                        >
                          <img
                            src={latestItem.img}
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

              {/* Share Option (Desktop / Other screens, hidden on mobile since mobile already has it) */}
              {!isMobile && (
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
                    borderBottom: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
                    marginBottom: '4px'
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: '0.96rem',
                      fontWeight: 700,
                      color: isLight ? '#111827' : '#ffffff',
                      letterSpacing: '0.5px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <span style={{ color: 'var(--brand-purple)', fontSize: '0.8rem' }}>✦</span> Share:
                  </span>

                  {/* Circular Icon-Only Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Twitter / X */}
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

                    {/* Facebook */}
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

                    {/* LinkedIn */}
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

                    {/* Copy Link */}
                    <button
                      onClick={handleCopyLink}
                      title={copied ? 'Copied!' : 'Copy Link'}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: '1px solid var(--brand-purple)',
                        background: copied
                          ? 'var(--brand-purple)'
                          : isLight
                          ? 'rgba(147, 51, 234, 0.1)'
                          : 'rgba(147, 51, 234, 0.22)',
                        color: copied ? '#ffffff' : 'var(--brand-purple)',
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
              )}
            </aside>
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
                borderTop: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'stretch' : 'center',
                gap: isMobile ? '14px' : '32px',
                boxSizing: 'border-box'
              }}
            >
              {/* PREVIOUS POST BUTTON (Anchored Far Left) */}
              {prevPost ? (
                <Link
                  to={`/blog/${prevPost.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? '10px' : '14px',
                    padding: isMobile ? '10px 14px' : '11px 18px',
                    borderRadius: '12px',
                    background: isLight ? '#f9fafb' : 'rgba(255, 255, 255, 0.025)',
                    border: isLight ? '1px solid #e5e7eb' : '1px solid rgba(255, 255, 255, 0.1)',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                    flex: isMobile ? '1 1 100%' : '0 1 360px',
                    maxWidth: isMobile ? '100%' : '360px',
                    width: '100%'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.borderColor = 'var(--brand-purple)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = isLight
                      ? '0 8px 20px rgba(147, 51, 234, 0.1)'
                      : '0 10px 24px rgba(0, 0, 0, 0.4), 0 0 16px rgba(147, 51, 234, 0.2)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.borderColor = isLight ? '#e5e7eb' : 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Direction Arrow */}
                  <div
                    style={{
                      width: isMobile ? '32px' : '36px',
                      height: isMobile ? '32px' : '36px',
                      borderRadius: '50%',
                      background: isLight ? 'rgba(147, 51, 234, 0.08)' : 'rgba(147, 51, 234, 0.2)',
                      border: '1px solid var(--brand-purple)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--brand-purple)',
                      fontSize: isMobile ? '0.95rem' : '1.05rem',
                      fontWeight: 700,
                      flexShrink: 0
                    }}
                  >
                    ←
                  </div>

                  {/* Content */}
                  <div
                    style={{
                      flex: 1,
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
                        fontFamily: "'Orbitron', sans-serif",
                        fontSize: '0.62rem',
                        fontWeight: 600,
                        letterSpacing: '1.2px',
                        color: 'var(--brand-purple)',
                        textTransform: 'uppercase',
                        marginBottom: '3px',
                        textAlign: 'left',
                        width: '100%'
                      }}
                    >
                      PREVIOUS POST
                    </div>
                    <div
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: isMobile ? '0.86rem' : '0.92rem',
                        fontWeight: 600,
                        color: isLight ? '#111827' : '#ffffff',
                        lineHeight: 1.35,
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                        textAlign: 'left',
                        width: '100%'
                      }}
                    >
                      {prevPost.title}
                    </div>
                  </div>
                </Link>
              ) : (
                <div style={{ display: isMobile ? 'none' : 'block' }} />
              )}

              {/* NEXT POST BUTTON (Anchored Far Right) */}
              {nextPost && (
                <Link
                  to={`/blog/${nextPost.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: isMobile ? '10px' : '14px',
                    padding: isMobile ? '10px 14px' : '11px 18px',
                    borderRadius: '12px',
                    background: isLight ? '#f9fafb' : 'rgba(255, 255, 255, 0.025)',
                    border: isLight ? '1px solid #e5e7eb' : '1px solid rgba(255, 255, 255, 0.1)',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                    flex: isMobile ? '1 1 100%' : '0 1 360px',
                    maxWidth: isMobile ? '100%' : '360px',
                    width: '100%',
                    marginLeft: (!prevPost && !isMobile) ? 'auto' : undefined
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.borderColor = 'var(--brand-purple)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = isLight
                      ? '0 8px 20px rgba(147, 51, 234, 0.1)'
                      : '0 10px 24px rgba(0, 0, 0, 0.4), 0 0 16px rgba(147, 51, 234, 0.2)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.borderColor = isLight ? '#e5e7eb' : 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Content (Aligned Right on desktop) */}
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      textAlign: isMobile ? 'left' : 'right',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMobile ? 'flex-start' : 'flex-end',
                      justifyContent: 'center'
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Orbitron', sans-serif",
                        fontSize: '0.62rem',
                        fontWeight: 600,
                        letterSpacing: '1.2px',
                        color: 'var(--brand-purple)',
                        textTransform: 'uppercase',
                        marginBottom: '3px',
                        textAlign: isMobile ? 'left' : 'right',
                        width: '100%'
                      }}
                    >
                      NEXT POST
                    </div>
                    <div
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: isMobile ? '0.86rem' : '0.92rem',
                        fontWeight: 600,
                        color: isLight ? '#111827' : '#ffffff',
                        lineHeight: 1.35,
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                        textAlign: isMobile ? 'left' : 'right',
                        width: '100%'
                      }}
                    >
                      {nextPost.title}
                    </div>
                  </div>

                  {/* Direction Arrow */}
                  <div
                    style={{
                      width: isMobile ? '32px' : '36px',
                      height: isMobile ? '32px' : '36px',
                      borderRadius: '50%',
                      background: isLight ? 'rgba(147, 51, 234, 0.08)' : 'rgba(147, 51, 234, 0.2)',
                      border: '1px solid var(--brand-purple)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--brand-purple)',
                      fontSize: isMobile ? '0.95rem' : '1.05rem',
                      fontWeight: 700,
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
            <CommentSection postId={post?.id || String(currentPost?.id || id || '1')} />
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
                borderTop: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.1)',
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
                      fontFamily: "'Orbitron', sans-serif",
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      letterSpacing: '2px',
                      color: 'var(--brand-purple)',
                      textTransform: 'uppercase',
                      marginBottom: '4px'
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
                      color: isLight ? '#111827' : '#ffffff',
                      lineHeight: 1.25,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    Related Posts
                    <span style={{ fontSize: '0.95rem', color: 'var(--brand-purple)' }}>✦</span>
                  </h3>
                </div>

                <Link
                  to={`/category/${currentPost?.categorySlug || 'space-news'}`}
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    letterSpacing: '1px',
                    color: 'var(--brand-purple)',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'opacity 0.2s',
                    paddingBottom: '2px'
                  }}
                  onMouseOver={e => (e.currentTarget.style.opacity = '0.75')}
                  onMouseOut={e => (e.currentTarget.style.opacity = '1')}
                >
                  <span>More in {currentPost?.category || 'Space'}</span>
                  <span>→</span>
                </Link>
              </div>

              {/* Related Posts Grid using standard BlogCard */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                  gap: isMobile ? '28px 16px' : '36px 24px',
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
                    img={post.img}
                    authorName={post.authorName}
                    authorImg={post.authorImg}
                    date={post.date}
                    variant="standard"
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      <Footer />
    </div>
  );
};

export default BlogPostPage;
