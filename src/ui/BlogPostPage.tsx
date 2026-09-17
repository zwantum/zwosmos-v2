import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMobile } from '../contexts/MobileContext';
import { useTheme } from '../contexts/ThemeContext';
import { ALL_BLOG_POSTS } from '../data/blogData';
import Header from './Header';
import Footer from './Footer';
import { BlogCard } from './BlogCard';

const BlogPostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isMobile } = useMobile();
  const [copied, setCopied] = useState(false);
  const { isLight } = useTheme();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const currentId = id ? parseInt(id, 10) : 1;
  const currentIndex = ALL_BLOG_POSTS.findIndex(p => p.id === currentId);
  const validIndex = currentIndex >= 0 ? currentIndex : 0;
  const currentPost = ALL_BLOG_POSTS[validIndex];

  // Previous and Next posts navigation
  const prevPost = validIndex > 0 ? ALL_BLOG_POSTS[validIndex - 1] : ALL_BLOG_POSTS[ALL_BLOG_POSTS.length - 1];
  const nextPost = validIndex < ALL_BLOG_POSTS.length - 1 ? ALL_BLOG_POSTS[validIndex + 1] : ALL_BLOG_POSTS[0];

  // Related posts: prioritize same category, exclude current post, limit to 3 posts
  const relatedPosts = React.useMemo(() => {
    if (!currentPost) return [];
    const sameCategory = ALL_BLOG_POSTS.filter(
      p => p.id !== currentPost.id && (p.categorySlug === currentPost.categorySlug || p.category === currentPost.category)
    );
    const results = [...sameCategory];
    if (results.length < 3) {
      const existingIds = new Set([currentPost.id, ...results.map(p => p.id)]);
      const others = ALL_BLOG_POSTS.filter(p => !existingIds.has(p.id));
      results.push(...others);
    }
    return results.slice(0, 3);
  }, [currentPost]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // Dynamic post metadata with fallbacks
  const postData = {
    title: currentPost ? currentPost.title : 'The Nursery of New Stars: Inside the Pillars of Cosmic Creation',
    excerpt: currentPost ? currentPost.desc : 'Deep within the eagle-winged clouds of interstellar gas, gravitational whispers give birth to newborn suns. A journey into the stellar nurseries illuminating the boundaries of our known universe.',
    featuredImage: currentPost ? currentPost.img : 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1600&auto=format&fit=crop',
    imageCaption: 'High-resolution infrared composite of stellar nurseries inside deep cosmic clouds.',
    category: currentPost ? currentPost.category.toUpperCase() : 'DEEP SPACE',
    publishedDate: currentPost ? currentPost.date : 'September 26, 2026',
    readTime: currentPost?.readTime || '6 min read',
    views: '2,480',
    author: {
      name: currentPost ? currentPost.authorName : 'Dr. Elena Vance',
      role: 'Astrophysicist & Science Writer',
      avatar: currentPost?.authorImg || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=240&auto=format&fit=crop',
      bio: 'Doctorate in Astrophysical Sciences. Dedicated to charting stellar nurseries and unraveling deep interstellar mediums.',
      articlesCount: 24
    },
    tags: [
      'Astrophysics',
      'Deep Space',
      'Nebulae',
      'Stellar Birth',
      'Cosmology',
      'Telescopes',
      'Space Exploration',
      'Dark Matter'
    ]
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
            <span style={{ color: isLight ? '#111827' : 'rgba(255,255,255,0.85)' }}>{postData.category}</span>
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
              <span style={{ color: isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)' }}>•</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: isLight ? '#4b5563' : 'rgba(255,255,255,0.5)' }}>Views:</span>
                <span style={{ color: isLight ? '#111827' : 'white', fontWeight: 600 }}>
                  {postData.views}
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

              {/* Image Caption - Centered in Middle */}
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
                  paddingBottom: isMobile ? '8px' : '12px',
                  borderBottom: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)',
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
                  paddingBottom: isMobile ? '8px' : '12px',
                  borderBottom: isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)',
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
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
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

                      <h3
                        style={{
                          margin: '0 0 2px 0',
                          fontFamily: "'Playfair Display', serif",
                          fontSize: '0.94rem',
                          lineHeight: 1.25,
                          color: isLight ? '#111827' : 'white'
                        }}
                      >
                        {postData.author.name}
                      </h3>

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
                    </div>

                    <p
                      style={{
                        fontSize: '0.74rem',
                        lineHeight: 1.45,
                        color: isLight ? '#4b5563' : 'rgba(255,255,255,0.7)',
                        fontFamily: "'Lora', serif",
                        margin: 0,
                        textAlign: 'center'
                      }}
                    >
                      {postData.author.bio}
                    </p>

                    <div
                      style={{
                        borderTop: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)',
                        paddingTop: '8px',
                        textAlign: 'center',
                        fontSize: '0.7rem',
                        color: isLight ? '#6b7280' : 'rgba(255,255,255,0.5)',
                        fontFamily: "'Lora', serif"
                      }}
                    >
                      {postData.author.articlesCount} Works Published
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags Widget */}
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
                      <span
                        key={idx}
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
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
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
                    {[
                      {
                        id: 2,
                        title: 'The spectacle before us was indeed sublime',
                        date: 'Sep 26, 2026',
                        img: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=200&auto=format&fit=crop'
                      },
                      {
                        id: 3,
                        title: 'The meaning of health has evolved over time',
                        date: 'Jul 26, 2026',
                        img: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=200&auto=format&fit=crop'
                      },
                      {
                        id: 4,
                        title: 'Musical improvisation is spontaneous music',
                        date: 'Jul 25, 2026',
                        img: 'https://images.unsplash.com/photo-1537429149819-74853018251f?q=80&w=200&auto=format&fit=crop'
                      }
                    ].map((post, idx) => (
                      <Link
                        key={idx}
                        to={`/blog/${post.id}`}
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
                            src={post.img}
                            alt={post.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div>
                          <h4
                            style={{
                              margin: '0 0 2px 0',
                              fontFamily: "'Playfair Display', serif",
                              fontSize: '0.78rem',
                              lineHeight: 1.25,
                              color: isLight ? '#111827' : 'white'
                            }}
                          >
                            {post.title}
                          </h4>
                          <div
                            style={{
                              color: isLight ? '#6b7280' : 'rgba(255,255,255,0.5)',
                              fontSize: '0.68rem',
                              fontFamily: "'Lora', serif"
                            }}
                          >
                            {post.date}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Share Widget (Desktop only, hidden on mobile) */}
              <div
                style={{
                  order: isMobile ? 2 : 1,
                  display: isMobile ? 'none' : 'flex',
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
                      <span style={{ color: 'var(--brand-purple)', marginRight: '5px' }}>✦</span> Share
                    </span>
                  </div>

                  {/* Share Buttons Content */}
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
                      gap: '8px'
                    }}
                  >
                    {[
                      {
                        name: 'Twitter / X',
                        icon: 'fa-x-twitter',
                        bg: '#1f2022',
                        color: 'white',
                        onClick: () =>
                          window.open(
                            `https://twitter.com/intent/tweet?text=${encodeURIComponent(postData.title)}&url=${encodeURIComponent(window.location.href)}`,
                            '_blank'
                          )
                      },
                      {
                        name: 'Facebook',
                        icon: 'fa-facebook-f',
                        bg: '#1877F2',
                        color: 'white',
                        onClick: () =>
                          window.open(
                            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
                            '_blank'
                          )
                      },
                      {
                        name: 'LinkedIn',
                        icon: 'fa-linkedin-in',
                        bg: '#0A66C2',
                        color: 'white',
                        onClick: () =>
                          window.open(
                            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
                            '_blank'
                          )
                      }
                    ].map((social, idx) => (
                      <button
                        key={idx}
                        onClick={social.onClick}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          borderRadius: '20px',
                          border: 'none',
                          background: social.bg,
                          color: social.color,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontFamily: "'Lora', serif",
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'transform 0.2s, filter 0.2s',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.25)'
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.filter = 'brightness(1.15)';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.filter = 'brightness(1)';
                        }}
                      >
                        <span>{social.name}</span>
                        <i className={`fa-brands ${social.icon}`}></i>
                      </button>
                    ))}

                    {/* Copy Link Button */}
                    <button
                      onClick={handleCopyLink}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        borderRadius: '20px',
                        border: '1px solid rgba(147, 51, 234, 0.4)',
                        background: copied
                          ? 'rgba(147, 51, 234, 0.35)'
                          : isLight
                          ? '#f3f4f6'
                          : 'rgba(255,255,255,0.06)',
                        color: isLight ? '#111827' : 'white',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontFamily: "'Lora', serif",
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.borderColor = 'var(--brand-purple)';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = 'rgba(147, 51, 234, 0.4)';
                      }}
                    >
                      <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                      <i className={copied ? 'fa-solid fa-check' : 'fa-solid fa-link'}></i>
                    </button>
                  </div>
                </div>
              </div>
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
