import React, { useState, useMemo, useEffect } from 'react';
import { useMobile } from '../contexts/MobileContext';
import { useTheme } from '../contexts/ThemeContext';
import Header from './Header';
import Footer from './Footer';
import { BookItem, booksService, INITIAL_BOOKS } from '../lib/booksService';

const CATEGORIES: { label: string; value: string }[] = [
  { label: 'All Publications', value: 'ALL' },
  { label: 'Astrophysics', value: 'ASTROPHYSICS' },
  { label: 'Cosmology', value: 'COSMOLOGY' },
  { label: 'Cosmic Exploration', value: 'COSMIC EXPLORATION' },
  { label: 'Quantum & Spacetime', value: 'QUANTUM & SPACETIME' },
  { label: 'Planetary Science', value: 'PLANETARY SCIENCE' }
];

export const BooksPage: React.FC = () => {
  const { isMobile } = useMobile();
  const { isLight, toggleTheme } = useTheme();
  const [books, setBooks] = useState<BookItem[]>(INITIAL_BOOKS);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalBook, setActiveModalBook] = useState<BookItem | null>(null);

  useEffect(() => {
    let isMounted = true;
    booksService.getBooks().then(data => {
      if (isMounted && data && data.length > 0) {
        setBooks(data);
      }
    }).catch(err => {
      console.warn('Could not load books from service:', err);
    });

    const handleUpdate = () => {
      booksService.getBooks().then(data => {
        if (isMounted && data) setBooks(data);
      });
    };

    window.addEventListener('zwosmos_books_updated', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('zwosmos_books_updated', handleUpdate);
    };
  }, []);

  // Filtered books based on category and search query
  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      const matchesCat = selectedCategory === 'ALL' || book.category.toUpperCase() === selectedCategory.toUpperCase();
      const query = searchQuery.trim().toLowerCase();
      if (!query) return matchesCat;
      return (
        matchesCat &&
        (book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query) ||
          book.desc.toLowerCase().includes(query) ||
          (book.tags && book.tags.some(tag => tag.toLowerCase().includes(query))))
      );
    });
  }, [books, selectedCategory, searchQuery]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: isLight
          ? '#ffffff'
          : 'radial-gradient(ellipse at top center, rgba(147, 51, 234, 0.25) 0%, var(--bg-main) 60%)',
        backgroundColor: isLight ? '#ffffff' : 'var(--bg-main)',
        color: isLight ? '#1f2937' : 'white',
        boxSizing: 'border-box',
        transition: 'background 0.3s ease, color 0.3s ease'
      }}
    >
      {/* Global Shared Header */}
      <Header isLight={isLight} onThemeToggle={toggleTheme} />

      {/* Container */}
      <div
        style={{
          maxWidth: '1360px',
          margin: '0 auto',
          padding: isMobile ? '35px 16px 50px' : '55px 40px 70px',
          boxSizing: 'border-box'
        }}
      >
        {/* ========================================================================= */}
        {/* 2. PAGE HERO HEADER                                                       */}
        {/* ========================================================================= */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '35px' : '50px' }}>
          <div
            style={{
              color: 'var(--brand-purple)',
              fontSize: '0.84rem',
              fontWeight: 700,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              marginBottom: '10px'
            }}
          >
            ✦ The Reading Orbit Archive ✦
          </div>

          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(1.55rem, 1rem + 3vw, 3.8rem)',
              lineHeight: 1.15,
              margin: '0 0 16px 0',
              color: isLight ? '#111827' : '#ffffff'
            }}
          >
            Cosmic Literature & Observations
          </h1>

          <p
            style={{
              fontFamily: "'Lora', serif",
              fontSize: isMobile ? '1.02rem' : '1.18rem',
              color: isLight ? '#4b5563' : 'rgba(255, 255, 255, 0.72)',
              maxWidth: '720px',
              margin: '0 auto 30px auto',
              lineHeight: 1.6
            }}
          >
            A curated planetary archive of foundational scientific papers, evocative space memoirs, and cosmological treatises illuminating humankind’s voyage through spacetime.
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
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search books by title, author, or cosmic topic..."
              style={{
                width: '100%',
                padding: '14px 20px 14px 44px',
                borderRadius: '30px',
                border: isLight ? '1px solid #d1d5db' : '1px solid rgba(147, 51, 234, 0.45)',
                background: isLight ? '#ffffff' : 'rgba(20, 15, 35, 0.7)',
                color: isLight ? '#111827' : '#ffffff',
                fontSize: '0.94rem',
                fontFamily: "'Lora', serif",
                outline: 'none',
                boxSizing: 'border-box',
                boxShadow: isLight
                  ? '0 4px 14px rgba(0,0,0,0.06)'
                  : '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 15px rgba(147, 51, 234, 0.15)'
              }}
            />
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={isLight ? '#6b7280' : 'rgba(216, 180, 254, 0.75)'}
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
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: isLight ? '#9ca3af' : 'rgba(255,255,255,0.5)',
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
        {/* 3. CATEGORY TEXT FLOW NAVIGATION (Fluid inline text, no capsules)         */}
        {/* ========================================================================= */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: isMobile ? '12px 18px' : '16px 32px',
            maxWidth: '920px',
            margin: '0 auto',
            marginBottom: isMobile ? '45px' : '75px'
          }}
        >
          {CATEGORIES.map(cat => {
            const isActive = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px 6px',
                  cursor: 'pointer',
                  fontFamily: "'Playfair Display', serif",
                  fontSize: isMobile ? '1.05rem' : '1.2rem',
                  fontWeight: isActive ? 700 : 400,
                  color: isActive
                    ? 'var(--brand-purple)'
                    : isLight
                    ? '#64748b'
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
                    e.currentTarget.style.color = isLight ? '#64748b' : 'rgba(255, 255, 255, 0.65)';
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
        {/* BOOKS GRID CATALOG                                                        */}
        {/* ========================================================================= */}
        <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '0.88rem',
              color: isLight ? '#6b7280' : 'rgba(255,255,255,0.6)',
              letterSpacing: '1px'
            }}
          >
            SHOWING {filteredBooks.length} {filteredBooks.length === 1 ? 'PUBLICATION' : 'PUBLICATIONS'}
          </div>
        </div>

        {filteredBooks.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '70px 20px',
              background: isLight ? '#ffffff' : 'rgba(255,255,255,0.02)',
              borderRadius: '16px',
              border: isLight ? '1px solid #e5e7eb' : '1px solid rgba(255,255,255,0.08)'
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '14px' }}>🌌</div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', marginBottom: '8px' }}>
              No Cosmic Books Found
            </h3>
            <p style={{ color: isLight ? '#6b7280' : 'rgba(255,255,255,0.6)', maxWidth: '420px', margin: '0 auto 20px auto', fontFamily: "'Lora', serif" }}>
              We couldn’t find any publications matching "{searchQuery}". Try selecting another category or searching for keywords like "singularity", "planets", or "Hawking".
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
              style={{
                background: 'var(--brand-purple)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '20px',
                padding: '8px 20px',
                cursor: 'pointer',
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '0.8rem',
                letterSpacing: '1px'
              }}
            >
              RESET FILTERS
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile
                ? '1fr'
                : 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: isMobile ? '24px' : '32px'
            }}
          >
            {filteredBooks.map(book => (
              <div
                key={book.id}
                style={{
                  background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.02)',
                  border: isLight ? '1px solid #e5e7eb' : '1px solid rgba(147, 51, 234, 0.22)',
                  borderRadius: '14px',
                  padding: isMobile ? '20px 16px' : '24px 22px',
                  boxSizing: 'border-box',
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'stretch',
                  transition: 'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'var(--brand-purple)';
                  e.currentTarget.style.boxShadow = isLight
                    ? '0 12px 28px rgba(147, 51, 234, 0.12)'
                    : '0 12px 30px rgba(0,0,0,0.6), 0 0 20px rgba(147, 51, 234, 0.2)';
                  const bookCover = e.currentTarget.querySelector('.book-spine-cover') as HTMLElement;
                  if (bookCover) {
                    bookCover.style.transform = 'rotateY(-14deg)';
                    bookCover.style.boxShadow = '16px 14px 24px rgba(0,0,0,0.6), inset -2px 0 6px rgba(255,255,255,0.2)';
                  }
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = isLight ? '#e5e7eb' : 'rgba(147, 51, 234, 0.22)';
                  e.currentTarget.style.boxShadow = 'none';
                  const bookCover = e.currentTarget.querySelector('.book-spine-cover') as HTMLElement;
                  if (bookCover) {
                    bookCover.style.transform = 'rotateY(0deg)';
                    bookCover.style.boxShadow = '8px 8px 18px rgba(0,0,0,0.4), inset -2px 0 4px rgba(255,255,255,0.1)';
                  }
                }}
                onClick={() => setActiveModalBook(book)}
              >
                {/* Book Cover */}
                <div
                  style={{
                    perspective: '700px',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {book.coverImage ? (
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="book-spine-cover"
                      style={{
                        width: isMobile ? '105px' : '115px',
                        height: isMobile ? '160px' : '175px',
                        objectFit: 'cover',
                        borderRadius: '4px 8px 8px 4px',
                        boxShadow: '8px 8px 20px rgba(0,0,0,0.4)',
                        borderLeft: '4px solid rgba(255,255,255,0.2)',
                        transformOrigin: 'left center',
                        transition: 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.45s ease'
                      }}
                    />
                  ) : (
                    <div
                      className="book-spine-cover"
                      style={{
                        width: isMobile ? '105px' : '115px',
                        height: isMobile ? '160px' : '175px',
                        background: book.gradient,
                        borderRadius: '2px 6px 6px 2px',
                        boxShadow: '8px 8px 18px rgba(0,0,0,0.4), inset -2px 0 4px rgba(255,255,255,0.1)',
                        borderLeft: `4px solid ${book.spineColor}`,
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '16px 10px',
                        boxSizing: 'border-box',
                        transformOrigin: 'left center',
                        transition: 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.45s ease'
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'Orbitron', sans-serif",
                          fontSize: '0.78rem',
                          textAlign: 'center',
                          color: 'rgba(255,255,255,0.92)',
                          textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                        }}
                      >
                        {book.title.toUpperCase()}
                      </div>
                      <div
                        style={{
                          marginTop: 'auto',
                          fontSize: '0.62rem',
                          textAlign: 'center',
                          letterSpacing: '1px',
                          color: 'rgba(255,255,255,0.5)',
                          fontFamily: "'Orbitron', sans-serif"
                        }}
                      >
                        {book.author.toUpperCase()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    flex: 1,
                    minWidth: 0
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: book.accentColor,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        marginBottom: '4px'
                      }}
                    >
                      {book.category}
                    </div>

                    <h3
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '1.25rem',
                        lineHeight: 1.25,
                        margin: '0 0 4px 0',
                        color: isLight ? '#111827' : '#ffffff',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {book.title}
                    </h3>

                    <div
                      style={{
                        color: isLight ? '#6b7280' : 'rgba(255, 255, 255, 0.55)',
                        fontSize: '0.82rem',
                        fontFamily: "'Lora', serif",
                        marginBottom: '8px'
                      }}
                    >
                      {book.author} • {book.year}
                    </div>

                    <p
                      style={{
                        color: isLight ? '#4b5563' : 'rgba(255, 255, 255, 0.72)',
                        fontSize: '0.86rem',
                        lineHeight: 1.45,
                        fontFamily: "'Lora', serif",
                        margin: '0 0 12px 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {book.desc}
                    </p>
                  </div>

                  {/* Action Button (Price & Rating removed) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      marginTop: 'auto',
                      paddingTop: '10px',
                      borderTop: isLight ? '1px solid #f3f4f6' : '1px solid rgba(255,255,255,0.06)'
                    }}
                  >

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        if (book.buyUrl) {
                          window.open(book.buyUrl, '_blank', 'noopener,noreferrer');
                        } else {
                          setActiveModalBook(book);
                        }
                      }}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--brand-purple)',
                        color: isLight ? 'var(--brand-purple)' : '#ffffff',
                        padding: '7px 18px',
                        borderRadius: '22px',
                        fontSize: '0.84rem',
                        fontFamily: "'Playfair Display', serif",
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'background 0.2s ease, color 0.2s ease'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.background = 'var(--brand-purple)';
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = isLight ? 'var(--brand-purple)' : '#ffffff';
                      }}
                    >
                      <span>Buy Now</span>
                      <span style={{ fontSize: '0.86rem' }}>↗</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 6. BOOK DETAILS MODAL                                                     */}
      {/* ========================================================================= */}
      {activeModalBook && (
        <div
          onClick={() => setActiveModalBook(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            boxSizing: 'border-box'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: isLight ? '#ffffff' : '#0e0e18',
              border: '1px solid var(--brand-purple)',
              borderRadius: '16px',
              maxWidth: '650px',
              width: '100%',
              padding: isMobile ? '24px 20px' : '36px 36px',
              boxSizing: 'border-box',
              position: 'relative',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(147, 51, 234, 0.35)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setActiveModalBook(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '18px',
                background: 'none',
                border: 'none',
                color: isLight ? '#6b7280' : 'rgba(255,255,255,0.7)',
                fontSize: '1.2rem',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>

            <div style={{ display: 'flex', gap: isMobile ? '16px' : '26px', alignItems: 'flex-start', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
              {/* Cover in Modal */}
              {activeModalBook.coverImage ? (
                <img
                  src={activeModalBook.coverImage}
                  alt={activeModalBook.title}
                  style={{
                    width: '130px',
                    height: '195px',
                    objectFit: 'cover',
                    borderRadius: '4px 8px 8px 4px',
                    boxShadow: '10px 10px 24px rgba(0,0,0,0.6)',
                    borderLeft: '4px solid rgba(255,255,255,0.2)',
                    flexShrink: 0
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '130px',
                    height: '195px',
                    background: activeModalBook.gradient,
                    borderRadius: '2px 6px 6px 2px',
                    borderLeft: `4px solid ${activeModalBook.spineColor}`,
                    boxShadow: '10px 10px 22px rgba(0,0,0,0.5)',
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '18px 10px',
                    boxSizing: 'border-box'
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                      fontSize: '0.86rem',
                      textAlign: 'center',
                      color: 'rgba(255,255,255,0.92)'
                    }}
                  >
                    {activeModalBook.title.toUpperCase()}
                  </div>
                  <div
                    style={{
                      marginTop: 'auto',
                      fontSize: '0.66rem',
                      textAlign: 'center',
                      color: 'rgba(255,255,255,0.55)',
                      fontFamily: "'Orbitron', sans-serif"
                    }}
                  >
                    {activeModalBook.author.toUpperCase()}
                  </div>
                </div>
              )}

              {/* Info in Modal */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    color: activeModalBook.accentColor,
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    marginBottom: '6px'
                  }}
                >
                  {activeModalBook.category}
                </div>

                <h2
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: isMobile ? '1.5rem' : '1.9rem',
                    lineHeight: 1.2,
                    margin: '0 0 6px 0',
                    color: isLight ? '#111827' : '#ffffff'
                  }}
                >
                  {activeModalBook.title}
                </h2>

                <div
                  style={{
                    color: isLight ? '#6b7280' : 'rgba(255,255,255,0.6)',
                    fontSize: '0.88rem',
                    fontFamily: "'Lora', serif",
                    marginBottom: '14px'
                  }}
                >
                  By <strong style={{ color: isLight ? '#111827' : '#ffffff' }}>{activeModalBook.author}</strong>
                  {activeModalBook.year ? ` • ${activeModalBook.year}` : ''}
                  {activeModalBook.pages && Number(activeModalBook.pages) > 0 ? ` • ${activeModalBook.pages} pages` : ''}
                </div>

                {activeModalBook.rating && Number(activeModalBook.rating) > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <span style={{ color: '#fbbf24', fontSize: '1rem' }}>★★★★★</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{activeModalBook.rating} / 5.0</span>
                    {activeModalBook.reviewsCount && Number(activeModalBook.reviewsCount) > 0 ? (
                      <span style={{ color: isLight ? '#9ca3af' : 'rgba(255,255,255,0.4)', fontSize: '0.82rem' }}>
                        ({activeModalBook.reviewsCount} reviews)
                      </span>
                    ) : null}
                  </div>
                ) : null}

                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--brand-purple)', marginBottom: '14px', fontFamily: "'Orbitron', sans-serif", letterSpacing: '1px' }}>
                  HARDCOVER EDITION
                </div>

                <p
                  style={{
                    fontFamily: "'Lora', serif",
                    fontSize: '0.94rem',
                    lineHeight: 1.6,
                    color: isLight ? '#374151' : 'rgba(255,255,255,0.85)',
                    margin: '0 0 16px 0'
                  }}
                >
                  {activeModalBook.longDesc}
                </p>

                {/* Tags */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '22px' }}>
                  {activeModalBook.tags.map(t => (
                    <span
                      key={t}
                      style={{
                        background: isLight ? '#f3f4f6' : 'rgba(255,255,255,0.06)',
                        color: isLight ? '#4b5563' : 'rgba(255,255,255,0.7)',
                        borderRadius: '12px',
                        padding: '3px 10px',
                        fontSize: '0.74rem'
                      }}
                    >
                      #{t}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {activeModalBook.buyUrl ? (
                    <a
                      href={activeModalBook.buyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: 'var(--brand-purple)',
                        color: '#ffffff',
                        textDecoration: 'none',
                        borderRadius: '25px',
                        padding: '10px 22px',
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 14px rgba(147, 51, 234, 0.4)'
                      }}
                    >
                      Buy Now
                    </a>
                  ) : (
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(activeModalBook.title + ' ' + activeModalBook.author + ' book buy')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: 'var(--brand-purple)',
                        color: '#ffffff',
                        textDecoration: 'none',
                        borderRadius: '25px',
                        padding: '10px 22px',
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 14px rgba(147, 51, 234, 0.4)'
                      }}
                    >
                      Find & Buy Online &nearr;
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Shared Footer */}
      <Footer isLight={isLight} />
    </div>
  );
};

export default BooksPage;
