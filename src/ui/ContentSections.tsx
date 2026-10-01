import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';
import { BlogCard } from './BlogCard';
import Footer from './Footer';
import ZwosmosIcon from './ZwosmosIcon';
import { useBlogPosts } from '@zwantum/blog/react';
import { BookItem, booksService, INITIAL_BOOKS, getDailyOrbitBooks } from '../lib/booksService';

export interface ContentSectionsProps {
  hasHero?: boolean;
}

const ContentSections: React.FC<ContentSectionsProps> = () => {
  const { isLight, isSepia } = useTheme();
  const { posts: livePosts } = useBlogPosts();
  const [orbitBooks, setOrbitBooks] = useState<BookItem[]>(() => getDailyOrbitBooks(INITIAL_BOOKS, 3));

  useEffect(() => {
    let isMounted = true;
    const fetchOrbitBooks = async () => {
      try {
        const all = await booksService.getBooks();
        if (!isMounted || !all || all.length === 0) return;
        setOrbitBooks(getDailyOrbitBooks(all, 3));
      } catch (err) {
        console.warn('Failed to load books for Reading Orbit section:', err);
      }
    };

    fetchOrbitBooks();

    const handleUpdate = (e: any) => {
      if (e?.detail && Array.isArray(e.detail) && e.detail.length > 0) {
        setOrbitBooks(getDailyOrbitBooks(e.detail, 3));
      } else {
        fetchOrbitBooks();
      }
    };

    window.addEventListener('zwosmos_books_updated', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('zwosmos_books_updated', handleUpdate);
    };
  }, []);

  // Pure width-based breakpoint logic (ignores isMobile touch emulation)
  const [winWidth, setWinWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const onResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isSmallPhone = winWidth < 641;
  const isSmallTab   = winWidth >= 641 && winWidth < 800;
  const isTablet = winWidth >= 641 && winWidth < 1024;
  const isLargeView = winWidth >= 800;
  const isDesktop = winWidth >= 1025;

  // Synchronously load cached live posts to prevent any reload flash of empty content
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

  const activeLivePosts: any[] = useMemo(() => {
    if (livePosts && livePosts.length > 0) return livePosts;
    if (cachedPosts && cachedPosts.length > 0) return cachedPosts;
    return [];
  }, [livePosts, cachedPosts]);

  // Helper to map a post to BlogCard data structure
  const mapPostToCard = (post: any) => {
    if (!post) return null;
    const primaryCat = post.categories?.[0]?.name || 'COSMOS';
    const rawExcerpt = post.excerpt || post.description || '';
    const cleanExcerpt = rawExcerpt.replace(/<[^>]*>?/gm, '').trim();
    const authorName = post.author?.name || 'Zwosmos Editorial';
    const dateStr = post.published_at
      ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '';

    return {
      id: post.slug || post.id,
      category: primaryCat.toUpperCase(),
      title: post.title || 'Untitled Article',
      desc: cleanExcerpt,
      authorName,
      date: dateStr,
      img: post.featured_image?.url || post.cover_image || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop'
    };
  };

  // Dynamically assign real published posts to each homepage category section
  const { deepSpacePosts, techPosts, solarPosts } = useMemo(() => {
    const usedSlugs = new Set<string>();

    const findAndClaim = (predicate: (p: any) => boolean) => {
      const found = activeLivePosts.find(p => !usedSlugs.has(p.slug || p.id) && predicate(p));
      if (found) {
        usedSlugs.add(found.slug || found.id);
        return found;
      }
      return null;
    };

    const claimAnyRemaining = () => {
      const found = activeLivePosts.find(p => !usedSlugs.has(p.slug || p.id));
      if (found) {
        usedSlugs.add(found.slug || found.id);
        return found;
      }
      return null;
    };

    const hasCat = (post: any, slugs: string[]) => {
      const pSlugs = (post.categories || []).map((c: any) => c.slug?.toLowerCase());
      return slugs.some(s => pSlugs.includes(s.toLowerCase()));
    };

    // Section 1: Deep Space Chronicles (Universe, Space News, Space Exploration)
    const ds1 = findAndClaim(p => hasCat(p, ['universe']));
    const ds2 = findAndClaim(p => hasCat(p, ['space-news']));
    const ds3 = findAndClaim(p => hasCat(p, ['space-exploration']));
    const dsList = [ds1, ds2, ds3].map(p => p || claimAnyRemaining()).filter(Boolean);

    // Section 2: Technology & Observatories (Telescopes & Tech, Explainers/Learn, People & History)
    const tech1 = findAndClaim(p => hasCat(p, ['telescopes-technology']));
    const tech2 = findAndClaim(p => hasCat(p, ['explainers', 'learn']));
    const tech3 = findAndClaim(p => hasCat(p, ['people-history']));
    const tList = [tech1, tech2, tech3].map(p => p || claimAnyRemaining()).filter(Boolean);

    // Section 3: Solar System & Planetary Frontiers (Solar System, Skywatching, Space Culture, General)
    const sol1 = findAndClaim(p => hasCat(p, ['solar-system']));
    const sol2 = findAndClaim(p => hasCat(p, ['skywatching']));
    const sol3 = findAndClaim(p => hasCat(p, ['space-culture']));
    const sList = [sol1, sol2, sol3].map(p => p || claimAnyRemaining()).filter(Boolean);

    return {
      deepSpacePosts: dsList.map(mapPostToCard).filter(Boolean) as NonNullable<ReturnType<typeof mapPostToCard>>[],
      techPosts: tList.map(mapPostToCard).filter(Boolean) as NonNullable<ReturnType<typeof mapPostToCard>>[],
      solarPosts: sList.map(mapPostToCard).filter(Boolean) as NonNullable<ReturnType<typeof mapPostToCard>>[]
    };
  }, [activeLivePosts]);

  const deepSpace1 = deepSpacePosts[0];
  const deepSpace2 = deepSpacePosts[1];
  const deepSpace3 = deepSpacePosts[2];

  const techFeatured = techPosts[0];
  const techStacked1 = techPosts[1];
  const techStacked2 = techPosts[2];

  const solarCard1 = solarPosts[0];
  const solarCard2 = solarPosts[1];
  const solarCard3 = solarPosts[2];

  return (
    <div
      style={{
        width: '100%',
        backgroundColor: 'transparent',
        background: 'transparent',
        marginTop: '0',
        paddingTop: isDesktop ? '16px' : isLargeView ? '10px' : isSmallPhone ? '0px' : isSmallTab ? '4px' : '35px',
        position: 'relative',
        zIndex: 10
      }}
    >
      {/* ========================================================================= */}
      {/* 1. CATEGORY SECTION: DEEP SPACE (3-Card Grid Layout)                      */}
      {/* ========================================================================= */}
      <section className="content-section">
        <div className="section-container">
          {/* Section Yellow Accent Divider */}
          <div className="section-divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: isSmallTab ? '20px' : '35px', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <div style={{ color: '#bd75ff', fontFamily: '"Noto Sans", sans-serif', fontSize: '0.78rem', fontWeight: 400, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ZwosmosIcon size={12} color="#bd75ff" />
                <span>Stellar Expeditions</span>
              </div>
              <h2 className="section-title" style={{ margin: 0, color: isLight ? '#111827' : '#ffffff' }}>Deep Space Chronicles</h2>
            </div>
            <Link to="/universe" style={{ color: '#bd75ff', fontFamily: '"Noto Sans", sans-serif', textDecoration: 'none', fontWeight: 400, letterSpacing: '3px', fontSize: '0.84rem' }}>
              VIEW ALL IN DEEP SPACE &rarr;
            </Link>
          </div>

          <div className="grid-3">
            {[deepSpace1, deepSpace2, deepSpace3].map((story, idx) => (
              story ? (
                <BlogCard
                  key={story.id}
                  id={story.id}
                  category={story.category}
                  title={story.title}
                  desc={story.desc}
                  img={story.img}
                  authorName={story.authorName}
                  date={story.date}
                  variant="standard"
                />
              ) : (
                <div
                  key={idx}
                  style={{
                    height: '380px',
                    borderRadius: '8px',
                    background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.02)',
                    border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.05)'
                  }}
                />
              )
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. CATEGORY SECTION: TECHNOLOGY (Split Editorial Hero + Stacked Cards)     */}
      {/* ========================================================================= */}
      <section className="content-section">
        <div className="section-container">
          {/* Section Yellow Accent Divider */}
          <div className="section-divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: isSmallTab ? '20px' : '35px', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <div style={{ color: '#bd75ff', fontFamily: '"Noto Sans", sans-serif', fontSize: '0.78rem', fontWeight: 400, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ZwosmosIcon size={12} color="#bd75ff" />
                <span>Astrophysical Instrumentation</span>
              </div>
              <h2 className="section-title" style={{ margin: 0, color: isLight ? '#111827' : '#ffffff' }}>Technology & Observatories</h2>
            </div>
            <Link to="/telescopes-technology" style={{ color: '#bd75ff', fontFamily: '"Noto Sans", sans-serif', textDecoration: 'none', fontWeight: 400, letterSpacing: '3px', fontSize: '0.84rem' }}>
              VIEW ALL IN TECHNOLOGY &rarr;
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isSmallPhone ? '1fr' : '1.12fr 1fr',
              gap: isSmallPhone ? '30px' : (isTablet ? '24px' : '30px'),
              alignItems: isSmallPhone ? 'start' : 'stretch'
            }}
          >
            {/* Left Column: Large Featured Hero Card */}
            <div style={{ display: 'flex', flexDirection: 'column', height: isSmallPhone ? 'auto' : '100%' }}>
              {techFeatured ? (
                <BlogCard
                  id={techFeatured.id}
                  category={techFeatured.category}
                  title={techFeatured.title}
                  desc=""
                  showExcerpt={false}
                  authorName={techFeatured.authorName}
                  date={techFeatured.date}
                  img={techFeatured.img}
                  variant="featured"
                />
              ) : (
                <div
                  style={{
                    height: '380px',
                    borderRadius: '8px',
                    background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.02)',
                    border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.05)'
                  }}
                />
              )}
            </div>

            {/* Right Column: Stacked Horizontal Cards (2 Cards) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: isSmallPhone ? '30px' : '16px', height: isSmallPhone ? 'auto' : '100%' }}>
              {techStacked1 ? (
                <BlogCard
                  id={techStacked1.id}
                  category={techStacked1.category}
                  title={techStacked1.title}
                  desc={techStacked1.desc}
                  authorName={techStacked1.authorName}
                  date={techStacked1.date}
                  img={techStacked1.img}
                  variant="horizontal"
                />
              ) : (
                <div
                  style={{
                    height: '170px',
                    borderRadius: '8px',
                    background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.02)',
                    border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.05)'
                  }}
                />
              )}

              {techStacked2 ? (
                <BlogCard
                  id={techStacked2.id}
                  category={techStacked2.category}
                  title={techStacked2.title}
                  desc={techStacked2.desc}
                  authorName={techStacked2.authorName}
                  date={techStacked2.date}
                  img={techStacked2.img}
                  variant="horizontal"
                />
              ) : (
                <div
                  style={{
                    height: '170px',
                    borderRadius: '8px',
                    background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.02)',
                    border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.05)'
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. CATEGORY SECTION: SOLAR SYSTEM (3 Horizontal Rows: Image Left, Content Right) */}
      {/* ========================================================================= */}
      <section className="content-section">
        <div className="section-container">
          {/* Section Yellow Accent Divider */}
          <div className="section-divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: isSmallTab ? '20px' : '35px', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <div style={{ color: '#bd75ff', fontFamily: '"Noto Sans", sans-serif', fontSize: '0.78rem', fontWeight: 400, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ZwosmosIcon size={12} color="#bd75ff" />
                <span>Planetary Explorations</span>
              </div>
              <h2 className="section-title" style={{ margin: 0, color: isLight ? '#111827' : '#ffffff' }}>Solar System & Planetary Frontiers</h2>
            </div>
            <Link to="/solar-system" style={{ color: '#bd75ff', fontFamily: '"Noto Sans", sans-serif', textDecoration: 'none', fontWeight: 400, letterSpacing: '3px', fontSize: '0.84rem' }}>
              VIEW ALL IN SOLAR SYSTEM &rarr;
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: (isSmallPhone || isSmallTab) ? '1fr' : (winWidth < 860 ? 'repeat(auto-fit, minmax(280px, 1fr))' : 'repeat(3, 1fr)'),
              gap: isSmallPhone ? '30px' : isSmallTab ? '20px' : '18px',
              alignItems: isSmallPhone ? 'start' : 'stretch'
            }}
          >
            {[solarCard1, solarCard2, solarCard3].map((card, idx) => (
              card ? (
                <BlogCard
                  key={card.id}
                  id={card.id}
                  category={card.category}
                  title={card.title}
                  desc={card.desc}
                  authorName={card.authorName}
                  date={card.date}
                  img={card.img}
                  variant="horizontal"
                />
              ) : (
                <div
                  key={idx}
                  style={{
                    height: '170px',
                    borderRadius: '8px',
                    background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.02)',
                    border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.05)'
                  }}
                />
              )
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. EXPLORE BY TOPIC SECTION (Minimal Airy Layout Matching 7WOSMOS Theme)   */}
      {/* ========================================================================= */}
      {/* 4. EXPLORE BY TOPIC - Cosmic Compendium (Spacious, borderless with hover separator) */}
      {/* ========================================================================= */}
      <section className="content-section" style={{ padding: isLargeView ? '32px 20px 36px 20px' : isSmallPhone ? '50px 20px' : isSmallTab ? '64px 20px 70px 20px' : '80px 20px 90px 20px' }}>
        <div className="section-container">
          {/* Section Yellow Accent Divider */}
          <div className="section-divider" />
          <div style={{ marginBottom: isLargeView ? '26px' : isSmallPhone ? '32px' : isSmallTab ? '38px' : '48px' }}>
            <div style={{ color: '#bd75ff', fontFamily: '"Noto Sans", sans-serif', fontSize: '0.8rem', fontWeight: 400, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ZwosmosIcon size={12} color="#bd75ff" />
              <span>Cosmic Compendium</span>
            </div>
            <h2 className="section-title" style={{ margin: 0, color: isLight ? '#111827' : '#ffffff' }}>
              Explore by Topic
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isSmallPhone ? '1fr' : 'repeat(3, 1fr)',
              gap: isSmallPhone ? '32px' : (isTablet ? '36px' : '60px')
            }}
          >
            {[
              // Column 1
              [
                { title: 'Space News', desc: 'Latest space news and discoveries', href: '/space-news' },
                { title: 'Space Exploration', desc: 'Missions, astronauts and spacecraft', href: '/space-exploration' },
                { title: 'Explainers', desc: 'Astronomy guides & science primers', href: '/explainers' }
              ],
              // Column 2
              [
                { title: 'Universe', desc: 'Stars, galaxies and cosmic mysteries', href: '/universe' },
                { title: 'Telescopes & Technology', desc: 'Telescopes, observatories and space tech', href: '/telescopes-technology' },
                { title: 'People & History', desc: 'Space pioneers and astronomy history', href: '/people-history' }
              ],
              // Column 3
              [
                { title: 'Solar System', desc: 'Planets, moons, comets and asteroids', href: '/solar-system' },
                { title: 'Skywatching', desc: 'Eclipses, meteor showers and night sky', href: '/skywatching' },
                { title: 'Space Culture', desc: 'Space books, films and art', href: '/space-culture' }
              ]
            ].map((col, colIdx) => (
              <div
                key={colIdx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px'
                }}
              >
                {col.map((item, itemIdx) => (
                  <Link
                    key={itemIdx}
                    to={item.href}
                    style={{
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: isSmallPhone ? '18px 12px' : '22px 16px',
                      position: 'relative',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'transparent',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      gap: '16px'
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.background = isLight ? 'rgba(147, 51, 234, 0.08)' : 'rgba(147, 51, 234, 0.05)';
                      const titleEl = e.currentTarget.querySelector('.topic-title') as HTMLElement;
                      const arrowEl = e.currentTarget.querySelector('.topic-arrow') as HTMLElement;
                      if (titleEl) {
                        titleEl.style.color = 'var(--brand-purple)';
                        titleEl.style.textShadow = isLight ? 'none' : '0 0 16px rgba(168, 85, 247, 0.6)';
                      }
                      if (arrowEl) {
                        arrowEl.style.color = 'var(--brand-purple)';
                        arrowEl.style.transform = 'translateX(6px)';
                      }
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.background = 'transparent';
                      const titleEl = e.currentTarget.querySelector('.topic-title') as HTMLElement;
                      const arrowEl = e.currentTarget.querySelector('.topic-arrow') as HTMLElement;
                      if (titleEl) {
                        titleEl.style.color = isLight ? '#111827' : '#ffffff';
                        titleEl.style.textShadow = 'none';
                      }
                      if (arrowEl) {
                        arrowEl.style.color = isLight ? 'var(--brand-purple)' : 'rgba(216, 180, 254, 0.4)';
                        arrowEl.style.transform = 'translateX(0)';
                      }
                    }}
                  >
                    <div>
                      <div
                        className="topic-title"
                        style={{
                          fontFamily: "'Playfair Display', serif",
                          fontSize: isSmallPhone ? '1.08rem' : '1.2rem',
                          fontWeight: 600,
                          color: isLight ? '#111827' : '#ffffff',
                          lineHeight: 1.3,
                          transition: 'color 0.25s ease'
                        }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontFamily: "'Lora', serif",
                          fontSize: isSmallPhone ? '0.84rem' : '0.9rem',
                          color: isLight ? '#64748b' : '#94a3b8',
                          lineHeight: 1.5,
                          marginTop: '6px'
                        }}
                      >
                        {item.desc}
                      </div>
                    </div>

                    <span
                      className="topic-arrow"
                      style={{
                        color: isLight ? 'var(--brand-purple)' : 'rgba(216, 180, 254, 0.4)',
                        fontSize: '1.25rem',
                        fontWeight: 500,
                        transition: 'all 0.3s ease',
                        flexShrink: 0,
                        marginLeft: '8px'
                      }}
                    >
                      &rarr;
                    </span>

                    {/* Default separator line */}
                    <div
                      className="topic-separator"
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: '8px',
                        right: '8px',
                        height: '1px',
                        background: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
                        pointerEvents: 'none'
                      }}
                    />
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reading Orbit Section */}
      <section className="content-section">
        <div className="section-container">
          {/* Section Yellow Accent Divider */}
          <div className="section-divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <div style={{ color: '#bd75ff', fontFamily: '"Noto Sans", sans-serif', fontSize: '0.78rem', fontWeight: 400, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ZwosmosIcon size={12} color="#bd75ff" />
                <span>Reading Orbit</span>
              </div>
              <h2 className="section-title" style={{ margin: 0, color: isLight ? '#111827' : '#ffffff' }}>The Reading Orbit</h2>
            </div>
            <Link
              to="/books"
              style={{
                color: '#bd75ff',
                fontFamily: '"Noto Sans", sans-serif',
                textDecoration: 'none',
                fontWeight: 400,
                letterSpacing: '3px',
                fontSize: '0.84rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'transform 0.2s ease, opacity 0.2s ease'
              }}
              onMouseOver={e => (e.currentTarget.style.transform = 'translateX(4px)')}
              onMouseOut={e => (e.currentTarget.style.transform = 'translateX(0)')}
            >
              EXPLORE ALL BOOKS &rarr;
            </Link>
          </div>

          <div className="grid-3" style={{ gap: '40px' }}>
            {orbitBooks.map((book, i) => (
              <div
                key={book.id || i}
                style={{
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'flex-start',
                  perspective: '900px',
                  cursor: 'pointer'
                }}
                onMouseOver={e => {
                  const bookEl = e.currentTarget.querySelector('.book-3d') as HTMLElement;
                  if (bookEl) {
                    bookEl.style.transform = 'rotateY(-10deg)';
                    bookEl.style.boxShadow = '18px 12px 26px rgba(0,0,0,0.6), 0 0 16px rgba(147, 51, 234, 0.3), inset -2px 0 6px rgba(255,255,255,0.2)';
                  }
                }}
                onMouseOut={e => {
                  const bookEl = e.currentTarget.querySelector('.book-3d') as HTMLElement;
                  if (bookEl) {
                    bookEl.style.transform = 'rotateY(0deg)';
                    bookEl.style.boxShadow = '10px 10px 20px rgba(0,0,0,0.5), inset -2px 0 5px rgba(255,255,255,0.1), inset 5px 0 10px rgba(0,0,0,0.5)';
                  }
                }}
              >
                {/* Book Cover */}
                {book.coverImage ? (
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="book-3d"
                    style={{
                      width: '140px',
                      flexShrink: 0,
                      height: '210px',
                      objectFit: 'cover',
                      borderRadius: '4px 8px 8px 4px',
                      boxShadow: isLight
                        ? '8px 8px 18px rgba(0,0,0,0.15)'
                        : '10px 10px 20px rgba(0,0,0,0.5)',
                      borderLeft: '4px solid rgba(255,255,255,0.2)',
                      position: 'relative',
                      transformOrigin: 'left center',
                      transition: 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.45s ease'
                    }}
                  />
                ) : (
                  <div
                    className="book-3d"
                    style={{
                      width: '140px',
                      flexShrink: 0,
                      height: '210px',
                      background: isSepia
                        ? 'linear-gradient(145deg, #78350f 0%, #451a03 100%)'
                        : (book.gradient || 'linear-gradient(to bottom, #111, #1a1a1a)'),
                      borderRadius: '2px 6px 6px 2px',
                      boxShadow: isLight
                        ? '8px 8px 18px rgba(0,0,0,0.15), inset -2px 0 5px rgba(255,255,255,0.2)'
                        : '10px 10px 20px rgba(0,0,0,0.5), inset -2px 0 5px rgba(255,255,255,0.1), inset 5px 0 10px rgba(0,0,0,0.5)',
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '20px 10px',
                      boxSizing: 'border-box',
                      borderLeft: `4px solid ${isSepia ? '#b45309' : (book.spineColor || 'rgba(255,255,255,0.15)')}`,
                      position: 'relative',
                      transformOrigin: 'left center',
                      transition: 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.45s ease'
                    }}
                  >
                    <div style={{ fontSize: '0.95rem', textAlign: 'center', fontFamily: '"Noto Sans", sans-serif', fontWeight: 700, color: 'rgba(255,255,255,0.9)', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                      {book.title.toUpperCase()}
                    </div>
                    <div style={{ marginTop: 'auto', fontSize: '0.7rem', textAlign: 'center', fontFamily: '"Noto Sans", sans-serif', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)' }}>
                      {book.author.toUpperCase()}
                    </div>
                  </div>
                )}

                {/* Book Details & Buy Now */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', flex: 1, minWidth: 0 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span style={{ color: book.accentColor || 'var(--brand-purple)', fontFamily: '"Noto Sans", sans-serif', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1px' }}>
                        {book.category}
                      </span>
                      {book.featured && (
                        <span style={{
                          fontSize: '0.65rem',
                          fontFamily: '"Noto Sans", sans-serif',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          letterSpacing: '0.5px',
                          color: '#f59e0b',
                          background: isLight ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.18)',
                          border: '1px solid rgba(245, 158, 11, 0.35)',
                          padding: '2px 7px',
                          borderRadius: '10px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          ★ Featured
                        </span>
                      )}
                    </div>
                    <h4 style={{ fontSize: '1.35rem', margin: '0 0 5px 0', lineHeight: 1.15, fontFamily: "'Playfair Display', serif", color: isLight ? '#111827' : '#ffffff' }}>
                      {book.title}
                    </h4>
                    <div style={{ color: isLight ? '#64748b' : 'rgba(255,255,255,0.6)', fontSize: '0.88rem', marginBottom: '12px', fontFamily: '"Noto Sans", sans-serif' }}>
                      {book.author} {book.year ? `• ${book.year}` : ''}
                    </div>
                    <p style={{ color: isLight ? '#4b5563' : 'rgba(255,255,255,0.75)', fontSize: '0.92rem', lineHeight: 1.5, margin: 0, fontFamily: "'Lora', serif" }}>
                      {book.desc}
                    </p>
                  </div>

                  {/* Buy Now Button */}
                  <div style={{ marginTop: '16px' }}>
                    {book.buyUrl ? (
                      <a
                        href={book.buyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: 'transparent',
                          border: isSepia ? '1px solid #d97706' : '1px solid var(--brand-purple)',
                          color: isSepia ? '#92400e' : (isLight ? '#111827' : 'white'),
                          padding: '8px 18px',
                          borderRadius: '22px',
                          fontFamily: '"Noto Sans", sans-serif',
                          fontSize: '0.86rem',
                          fontWeight: 400,
                          textDecoration: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.25s ease',
                          boxShadow: isSepia
                            ? '0 2px 8px rgba(217, 119, 6, 0.15)'
                            : (isLight ? '0 2px 8px rgba(147, 51, 234, 0.15)' : '0 4px 12px rgba(147, 51, 234, 0.2)')
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.background = 'var(--brand-purple)';
                          e.currentTarget.style.borderColor = 'var(--brand-purple)';
                          e.currentTarget.style.color = '#ffffff';
                          e.currentTarget.style.boxShadow = '0 0 16px rgba(147, 51, 234, 0.6)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.borderColor = isSepia ? '#d97706' : 'var(--brand-purple)';
                          e.currentTarget.style.color = isSepia ? '#92400e' : (isLight ? '#111827' : 'white');
                          e.currentTarget.style.boxShadow = isSepia
                            ? '0 2px 8px rgba(217, 119, 6, 0.15)'
                            : (isLight ? '0 2px 8px rgba(147, 51, 234, 0.15)' : '0 4px 12px rgba(147, 51, 234, 0.2)');
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <span>Buy Now</span>
                        <span style={{ fontSize: '0.88rem' }}>↗</span>
                      </a>
                    ) : (
                      <Link
                        to="/books"
                        style={{
                          background: 'transparent',
                          border: isSepia ? '1px solid #d97706' : '1px solid var(--brand-purple)',
                          color: isSepia ? '#92400e' : (isLight ? '#111827' : 'white'),
                          padding: '8px 18px',
                          borderRadius: '22px',
                          fontFamily: '"Noto Sans", sans-serif',
                          fontSize: '0.86rem',
                          fontWeight: 400,
                          textDecoration: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.25s ease',
                          boxShadow: isSepia
                            ? '0 2px 8px rgba(217, 119, 6, 0.15)'
                            : (isLight ? '0 2px 8px rgba(147, 51, 234, 0.15)' : '0 4px 12px rgba(147, 51, 234, 0.2)')
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.background = 'var(--brand-purple)';
                          e.currentTarget.style.borderColor = 'var(--brand-purple)';
                          e.currentTarget.style.color = '#ffffff';
                          e.currentTarget.style.boxShadow = '0 0 16px rgba(147, 51, 234, 0.6)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.borderColor = isSepia ? '#d97706' : 'var(--brand-purple)';
                          e.currentTarget.style.color = isSepia ? '#92400e' : (isLight ? '#111827' : 'white');
                          e.currentTarget.style.boxShadow = isSepia
                            ? '0 2px 8px rgba(217, 119, 6, 0.15)'
                            : (isLight ? '0 2px 8px rgba(147, 51, 234, 0.15)' : '0 4px 12px rgba(147, 51, 234, 0.2)');
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <span>Buy Now</span>
                        <span style={{ fontSize: '0.88rem' }}>↗</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Website Footer */}
      <Footer isLight={isLight} />
    </div>
  );
};

export default ContentSections;
