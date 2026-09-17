import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMobile } from '../contexts/MobileContext';
import { useTheme } from '../contexts/ThemeContext';
import { BlogCard } from './BlogCard';
import Header from './Header';
import Footer from './Footer';
import {
  getCategoryBySlug,
  getPostsByCategorySlug
} from '../data/blogData';

interface CategoryPageProps {
  slug?: string;
}

const POSTS_PER_PAGE = 12;

export const CategoryPage: React.FC<CategoryPageProps> = ({ slug: propSlug }) => {
  const { isMobile } = useMobile();
  const { isLight } = useTheme();
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const activeSlug = propSlug || categorySlug || 'space-news';

  const [currentPage, setCurrentPage] = useState<number>(1);

  // Current category info
  const currentCategory = useMemo(() => {
    return getCategoryBySlug(activeSlug);
  }, [activeSlug]);

  // Posts belonging to this category
  const categoryPosts = useMemo(() => {
    return getPostsByCategorySlug(currentCategory.slug);
  }, [currentCategory.slug]);

  // Reset pagination when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeSlug]);

  // Pagination calculation
  const totalPages = Math.ceil(categoryPosts.length / POSTS_PER_PAGE);

  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
    return categoryPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);
  }, [categoryPosts, currentPage]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: isLight
          ? '#ffffff'
          : 'radial-gradient(ellipse at top center, rgba(147, 51, 234, 0.25) 0%, var(--bg-main) 60%)',
        backgroundColor: isLight ? '#ffffff' : 'var(--bg-main)',
        color: isLight ? '#111827' : 'white',
        boxSizing: 'border-box'
      }}
    >
      {/* Global Shared Header */}
      <Header />

      <div
        style={{
          maxWidth: '1260px',
          margin: '0 auto',
          padding: isMobile ? '20px 16px 60px' : '35px 24px 80px',
          boxSizing: 'border-box'
        }}
      >
        {/* ========================================================================= */}
        {/* 1. BREADCRUMBS (Left Aligned)                                             */}
        {/* ========================================================================= */}
        <div
          style={{
            fontSize: isMobile ? '0.78rem' : '0.85rem',
            color: isLight ? '#6b7280' : 'rgba(255,255,255,0.6)',
            letterSpacing: '0.5px',
            fontWeight: 600,
            fontFamily: "'Lora', serif",
            marginBottom: isMobile ? '18px' : '26px'
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
          <span style={{ color: 'var(--brand-purple)', margin: '0 8px' }}>›</span>
          <Link
            to="/blog"
            style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseOver={e => (e.currentTarget.style.color = 'var(--brand-purple)')}
            onMouseOut={e => (e.currentTarget.style.color = isLight ? '#6b7280' : 'rgba(255,255,255,0.6)')}
          >
            Stories
          </Link>
          <span style={{ color: 'var(--brand-purple)', margin: '0 8px' }}>›</span>
          <span style={{ color: isLight ? '#111827' : 'rgba(255,255,255,0.92)' }}>{currentCategory.name}</span>
        </div>

        {/* ========================================================================= */}
        {/* 2. CATEGORY HERO HEADER (Left Aligned, Refined Typography)                */}
        {/* ========================================================================= */}
        <div
          style={{
            textAlign: 'left',
            marginBottom: isMobile ? '35px' : '48px',
            borderBottom: isLight ? '1px solid #e5e7eb' : '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: isMobile ? '24px' : '32px'
          }}
        >
          <div
            style={{
              color: 'var(--brand-purple)',
              fontSize: '0.82rem',
              fontWeight: 700,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              marginBottom: '8px'
            }}
          >
            ✦ Cosmic Compendium ✦
          </div>

          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(1.55rem, 1rem + 3vw, 3.4rem)',
              lineHeight: 1.15,
              margin: '0 0 14px 0',
              color: isLight ? '#111827' : '#ffffff'
            }}
          >
            {currentCategory.name}
          </h1>

          <p
            style={{
              fontFamily: "'Lora', serif",
              fontSize: isMobile ? '1.02rem' : '1.15rem',
              color: isLight ? '#4b5563' : 'rgba(255, 255, 255, 0.75)',
              maxWidth: '740px',
              margin: 0,
              lineHeight: 1.65
            }}
          >
            {currentCategory.desc}
          </p>
        </div>

        {/* ========================================================================= */}
        {/* 3. STORIES COUNTER                                                        */}
        {/* ========================================================================= */}
        <div style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '0.82rem',
              color: isLight ? '#6b7280' : 'rgba(255, 255, 255, 0.55)',
              letterSpacing: '1.5px'
            }}
          >
            SHOWING {categoryPosts.length === 0 ? 0 : `${(currentPage - 1) * POSTS_PER_PAGE + 1}–${Math.min(categoryPosts.length, currentPage * POSTS_PER_PAGE)}`} OF {categoryPosts.length} STORIES
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. ALL POSTS IN GRID VIEW (No single top story)                           */}
        {/* ========================================================================= */}
        {categoryPosts.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.02)',
              borderRadius: '16px',
              border: isLight ? '1px solid #e5e7eb' : '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: isLight ? '0 4px 20px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '12px', color: 'var(--brand-purple)' }}>✦</div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: isLight ? '#111827' : '#ffffff', marginBottom: '8px' }}>
              No Dispatches in this Category Yet
            </h3>
            <p style={{ fontFamily: "'Lora', serif", color: isLight ? '#4b5563' : 'rgba(255, 255, 255, 0.6)', fontSize: '0.92rem', margin: '0 auto 18px auto', maxWidth: '420px' }}>
              Observations and research papers for {currentCategory.name} are being charted.
            </p>
            <Link
              to="/blog"
              style={{
                display: 'inline-block',
                background: 'var(--brand-purple)',
                color: '#ffffff',
                textDecoration: 'none',
                borderRadius: '20px',
                padding: '8px 20px',
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '0.78rem',
                letterSpacing: '1px'
              }}
            >
              EXPLORE ALL STORIES
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile
                ? '1fr'
                : 'repeat(3, 1fr)',
              gap: isMobile ? '24px 14px' : '32px 20px'
            }}
          >
            {paginatedPosts.map(post => (
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

        {/* ========================================================================= */}
        {/* 5. PAGINATION CONTROLS (Appears after 12 posts)                            */}
        {/* ========================================================================= */}
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
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }
              }}
              disabled={currentPage === 1}
              style={{
                background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
                border: isLight ? '1px solid #d1d5db' : '1px solid rgba(255, 255, 255, 0.12)',
                color: currentPage === 1
                  ? (isLight ? '#9ca3af' : 'rgba(255, 255, 255, 0.25)')
                  : (isLight ? '#374151' : '#ffffff'),
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
                boxShadow: isLight && currentPage !== 1 ? '0 2px 6px rgba(0,0,0,0.05)' : 'none'
              }}
              onMouseOver={e => {
                if (currentPage > 1) {
                  e.currentTarget.style.borderColor = 'var(--brand-purple)';
                  e.currentTarget.style.background = isLight ? 'rgba(147, 51, 234, 0.08)' : 'rgba(147, 51, 234, 0.15)';
                }
              }}
              onMouseOut={e => {
                if (currentPage > 1) {
                  e.currentTarget.style.borderColor = isLight ? '#d1d5db' : 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.background = isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)';
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
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                  }}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: isActive
                      ? 'var(--brand-purple)'
                      : (isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)'),
                    border: isActive
                      ? '1px solid var(--brand-purple)'
                      : (isLight ? '1px solid #d1d5db' : '1px solid rgba(255, 255, 255, 0.12)'),
                    color: isActive
                      ? '#ffffff'
                      : (isLight ? '#374151' : 'rgba(255, 255, 255, 0.75)'),
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isActive ? '0 0 16px rgba(147, 51, 234, 0.6)' : (isLight ? '0 2px 6px rgba(0,0,0,0.05)' : 'none'),
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={e => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = 'var(--brand-purple)';
                      e.currentTarget.style.color = 'var(--brand-purple)';
                      e.currentTarget.style.background = isLight ? 'rgba(147, 51, 234, 0.08)' : 'rgba(147, 51, 234, 0.15)';
                    }
                  }}
                  onMouseOut={e => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = isLight ? '#d1d5db' : 'rgba(255, 255, 255, 0.12)';
                      e.currentTarget.style.color = isLight ? '#374151' : 'rgba(255, 255, 255, 0.75)';
                      e.currentTarget.style.background = isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)';
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
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }
              }}
              disabled={currentPage === totalPages}
              style={{
                background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
                border: isLight ? '1px solid #d1d5db' : '1px solid rgba(255, 255, 255, 0.12)',
                color: currentPage === totalPages
                  ? (isLight ? '#9ca3af' : 'rgba(255, 255, 255, 0.25)')
                  : (isLight ? '#374151' : '#ffffff'),
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
                boxShadow: isLight && currentPage !== totalPages ? '0 2px 6px rgba(0,0,0,0.05)' : 'none'
              }}
              onMouseOver={e => {
                if (currentPage < totalPages) {
                  e.currentTarget.style.borderColor = 'var(--brand-purple)';
                  e.currentTarget.style.background = isLight ? 'rgba(147, 51, 234, 0.08)' : 'rgba(147, 51, 234, 0.15)';
                }
              }}
              onMouseOut={e => {
                if (currentPage < totalPages) {
                  e.currentTarget.style.borderColor = isLight ? '#d1d5db' : 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.background = isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)';
                }
              }}
            >
              NEXT →
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default CategoryPage;
