import React, { useState, useMemo, useLayoutEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMobile } from '../contexts/MobileContext';
import { useTheme } from '../contexts/ThemeContext';
import { BlogCard } from './BlogCard';
import Header from './Header';
import Footer from './Footer';
import ZwosmosIcon from './ZwosmosIcon';
import { useBlogPosts, useTags } from '@zwantum/blog/react';

const POSTS_PER_PAGE = 12;

const TagPage: React.FC = () => {
  const { tagSlug } = useParams<{ tagSlug: string }>();
  const { isMobile } = useMobile();
  const { theme, isDark } = useTheme();
  const isLight = !isDark;
  const isSepia = theme === 'sepia';
  const [currentPage, setCurrentPage] = useState(1);

  // Use built-in tagSlug filter from useBlogPosts
  const { posts: livePosts, loading } = useBlogPosts(
    tagSlug ? { tagSlug } : undefined
  );

  // Also fetch all tags to get description/metadata for this tag
  const { tags: allTags } = useTags();
  const tagMeta = useMemo(() => {
    if (!allTags || !tagSlug) return null;
    return allTags.find(t => t.slug === tagSlug) || null;
  }, [allTags, tagSlug]);

  const tagName = tagMeta?.name || (tagSlug ? tagSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '');

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const rootEl = document.getElementById('root');
    if (rootEl) rootEl.scrollTop = 0;
    setCurrentPage(1);
  }, [tagSlug]);

  // Map posts to display format
  const tagPosts = useMemo(() => {
    if (!livePosts) return [];
    return livePosts.map(p => ({
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
  }, [livePosts]);

  const totalPages = Math.ceil(tagPosts.length / POSTS_PER_PAGE);
  const paginatedPosts = useMemo(() => {
    const s = (currentPage - 1) * POSTS_PER_PAGE;
    return tagPosts.slice(s, s + POSTS_PER_PAGE);
  }, [tagPosts, currentPage]);

  const divider = isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)';

  return (
    <div style={{ minHeight: '100vh', background: isLight ? (isSepia ? '#fff3e0' : '#ffffff') : 'radial-gradient(ellipse at top center, rgba(147, 51, 234, 0.25) 0%, var(--bg-main) 60%)', backgroundColor: isSepia ? '#fff3e0' : (isLight ? '#ffffff' : 'var(--bg-main)'), color: isLight ? '#111827' : 'white', boxSizing: 'border-box' }}>
      <Header />
      <div style={{ maxWidth: '1260px', margin: '0 auto', padding: isMobile ? '20px 16px 60px' : '35px 24px 80px', boxSizing: 'border-box' }}>

        {/* Breadcrumbs */}
        <div style={{ fontSize: isMobile ? '0.78rem' : '0.85rem', color: isLight ? '#6b7280' : 'rgba(255,255,255,0.6)', letterSpacing: '0.5px', fontWeight: 600, fontFamily: "'Lora', serif", marginBottom: isMobile ? '18px' : '26px' }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }} onMouseOver={e => (e.currentTarget.style.color = 'var(--brand-purple)')} onMouseOut={e => (e.currentTarget.style.color = isLight ? '#6b7280' : 'rgba(255,255,255,0.6)')}>Zwosmos</Link>
          <span style={{ color: 'var(--brand-purple)', margin: '0 8px' }}>›</span>
          <Link to="/blog" style={{ color: 'inherit', textDecoration: 'none' }} onMouseOver={e => (e.currentTarget.style.color = 'var(--brand-purple)')} onMouseOut={e => (e.currentTarget.style.color = isLight ? '#6b7280' : 'rgba(255,255,255,0.6)')}>Stories</Link>
          <span style={{ color: 'var(--brand-purple)', margin: '0 8px' }}>›</span>
          <span style={{ color: isLight ? '#111827' : 'rgba(255,255,255,0.92)' }}>#{tagName}</span>
        </div>

        {/* Tag Hero Header */}
        <div style={{ textAlign: 'left', marginBottom: isMobile ? '35px' : '48px', borderBottom: divider, paddingBottom: isMobile ? '24px' : '32px' }}>
          <div style={{ color: '#bd75ff', fontSize: '0.78rem', fontWeight: 400, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '8px', fontFamily: '"Noto Sans", sans-serif', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ZwosmosIcon size={12} color="#bd75ff" />
            <span>Topic Tag</span>
            <ZwosmosIcon size={12} color="#bd75ff" />
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? '1.7rem' : '3rem', lineHeight: 1.15, margin: '0 0 14px 0', color: isLight ? '#111827' : '#ffffff', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-block', padding: '4px 18px', borderRadius: '999px', background: 'rgba(147,51,234,0.12)', border: '1px solid rgba(147,51,234,0.4)', fontSize: isMobile ? '1rem' : '1.3rem', letterSpacing: '0.5px', color: '#bd75ff', fontFamily: "'Lora', serif", fontWeight: 600, fontStyle: 'italic' }}>#{tagName}</span>
            <span>Stories</span>
          </h1>
          <p style={{ fontFamily: "'Lora', serif", fontSize: isMobile ? '1rem' : '1.1rem', color: isLight ? '#4b5563' : 'rgba(255,255,255,0.72)', margin: 0, lineHeight: 1.65, maxWidth: '640px' }}>
            {tagMeta?.description
              ? tagMeta.description
              : <>Explore all articles tagged with <strong style={{ color: isLight ? '#111827' : '#fff' }}>{tagName}</strong> — curated dispatches from across the cosmos.</>
            }
          </p>
        </div>

        {/* Count */}
        {!loading && tagPosts.length > 0 && (
          <div style={{ marginBottom: '25px' }}>
            <div style={{ fontFamily: '"Noto Sans", sans-serif', fontSize: '0.82rem', fontWeight: 400, color: isLight ? '#6b7280' : 'rgba(255,255,255,0.55)', letterSpacing: '2px', textTransform: 'uppercase' }}>
              SHOWING {(currentPage - 1) * POSTS_PER_PAGE + 1}–{Math.min(tagPosts.length, currentPage * POSTS_PER_PAGE)} OF {tagPosts.length} STORIES
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="blog-cards-grid">
            {[1,2,3].map(n => (
              <div key={n} style={{ borderRadius: '12px', background: isLight ? '#f3f4f6' : 'rgba(255,255,255,0.04)', border: isLight ? '1px solid #e5e7eb' : '1px solid rgba(255,255,255,0.06)', height: '320px' }} />
            ))}
          </div>
        )}

        {/* Grid or Empty */}
        {!loading && tagPosts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '70px 20px', background: isLight ? '#ffffff' : 'rgba(255,255,255,0.02)', borderRadius: '16px', border: isLight ? '1px solid #e5e7eb' : '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'center' }}><ZwosmosIcon size={40} color="#bd75ff" /></div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: isLight ? '#111827' : '#ffffff', marginBottom: '10px' }}>No stories tagged "{tagName}"</h3>
            <p style={{ fontFamily: "'Lora', serif", color: isLight ? '#4b5563' : 'rgba(255,255,255,0.6)', fontSize: '0.92rem', margin: '0 auto 20px auto', maxWidth: '380px' }}>No articles with this tag have been published yet.</p>
            <Link to="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#bd75ff', textDecoration: 'none', fontFamily: '"Noto Sans", sans-serif', fontSize: '0.84rem', fontWeight: 400, letterSpacing: '3px', textTransform: 'uppercase' }}>EXPLORE ALL STORIES ↗</Link>
          </div>
        )}

        {!loading && tagPosts.length > 0 && (
          <div className="blog-cards-grid">
            {paginatedPosts.map(post => (
              <BlogCard key={post.id} id={post.id} category={post.category} title={post.title} desc={post.desc} img={post.img} authorName={post.authorName} authorImg={post.authorImg} date={post.date} variant="standard" />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? '8px' : '12px', marginTop: isMobile ? '45px' : '65px', flexWrap: 'wrap' }}>
            <button onClick={() => { if (currentPage > 1) { setCurrentPage(p => p - 1); window.scrollTo({ top: 300, behavior: 'smooth' }); } }} disabled={currentPage === 1} style={{ background: isLight ? '#ffffff' : 'rgba(255,255,255,0.04)', border: isLight ? '1px solid #d1d5db' : '1px solid rgba(255,255,255,0.12)', color: currentPage === 1 ? (isLight ? '#9ca3af' : 'rgba(255,255,255,0.25)') : (isLight ? '#374151' : '#ffffff'), borderRadius: '24px', padding: '8px 18px', fontFamily: "'Orbitron', sans-serif", fontSize: '0.78rem', letterSpacing: '1px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>← PREV</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => { setCurrentPage(n); window.scrollTo({ top: 300, behavior: 'smooth' }); }} style={{ width: '38px', height: '38px', borderRadius: '50%', background: n === currentPage ? 'var(--brand-purple)' : (isLight ? '#ffffff' : 'rgba(255,255,255,0.04)'), border: n === currentPage ? '1px solid var(--brand-purple)' : (isLight ? '1px solid #d1d5db' : '1px solid rgba(255,255,255,0.12)'), color: n === currentPage ? '#ffffff' : (isLight ? '#374151' : 'rgba(255,255,255,0.75)'), fontFamily: "'Orbitron', sans-serif", fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: n === currentPage ? '0 0 16px rgba(147,51,234,0.6)' : 'none' }}>{n}</button>
            ))}
            <button onClick={() => { if (currentPage < totalPages) { setCurrentPage(p => p + 1); window.scrollTo({ top: 300, behavior: 'smooth' }); } }} disabled={currentPage === totalPages} style={{ background: isLight ? '#ffffff' : 'rgba(255,255,255,0.04)', border: isLight ? '1px solid #d1d5db' : '1px solid rgba(255,255,255,0.12)', color: currentPage === totalPages ? (isLight ? '#9ca3af' : 'rgba(255,255,255,0.25)') : (isLight ? '#374151' : '#ffffff'), borderRadius: '24px', padding: '8px 18px', fontFamily: "'Orbitron', sans-serif", fontSize: '0.78rem', letterSpacing: '1px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>NEXT →</button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default TagPage;
