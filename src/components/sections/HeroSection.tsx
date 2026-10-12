import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMobile } from '../../contexts/MobileContext';
import { useTheme } from '../../contexts/ThemeContext';
import Header from '../layout/Header';
import SoftAurora from '../common/SoftAurora';
import Aurora from '../common/Aurora';
import { useBlogPosts } from '@zwantum/blog/react';
import ZwosmosIcon from '../common/ZwosmosIcon';

class SafeAuroraBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: any) {
    console.warn('Aurora WebGL safely bypassed:', err);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export const HeroSection: React.FC = () => {
  const { isMobile } = useMobile();
  const { isDark, isSepia } = useTheme();
  const isLight = !isDark;

  // Fetch live blog posts from Supabase database
  const { posts: livePosts } = useBlogPosts();

  // Synchronously load cached featured post from localStorage to eliminate any flash on refresh
  const [cachedFeatured, setCachedFeatured] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('zwosmos_featured_post');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const featuredCandidates = livePosts?.filter(p => p.is_featured) || [];
  const liveFeatured = featuredCandidates.length > 0
    ? [...featuredCandidates].sort((a, b) => {
        const timeA = new Date(a.updated_at || a.published_at || 0).getTime();
        const timeB = new Date(b.updated_at || b.published_at || 0).getTime();
        return timeB - timeA;
      })[0]
    : livePosts?.[0];

  useEffect(() => {
    if (liveFeatured) {
      setCachedFeatured(liveFeatured);
      try {
        localStorage.setItem('zwosmos_featured_post', JSON.stringify(liveFeatured));
      } catch (e) {
        console.warn('Could not cache featured post:', e);
      }
    }
  }, [liveFeatured]);

  const featuredPost = liveFeatured || cachedFeatured;

  const featuredImg = featuredPost?.featured_image?.url || '';
  const featuredLink = featuredPost ? `/blog/${featuredPost.slug || featuredPost.id}` : '#';
  const featuredTitle = featuredPost?.title || '';
  const featuredExcerpt = featuredPost?.excerpt || '';
  const featuredCategory = featuredPost?.categories?.[0]?.name || '';

  // Detect tablet (641–900px) — iPad Mini is 768px but flagged as isMobile=true
  const [winWidth, setWinWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const onResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  // Layout purely based on width — ignores isMobile (touch detection can be wrong in DevTools)
  const isSmallPhone = winWidth < 641;   // < 641px → phone
  const isSmallTab = winWidth >= 641 && winWidth < 800; // 641–799px → small tab
  const isLargeTablet = winWidth >= 800 && winWidth <= 1280; // 800–1280px → large tab
  const isTablet = isSmallTab || isLargeTablet;
  const isLargeView = winWidth >= 800;
  const isDesktop = winWidth > 1280; // desktop view only

  return (
    <section
      style={{
        position: 'relative',
        width: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
        background: 'transparent',
        paddingBottom: isDesktop ? '38px' : isLargeView ? '32px' : isSmallPhone ? '40px' : isSmallTab ? '48px' : '65px'
      }}
    >
      {/* Background Soft Aurora React Bits WebGL Component */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: (isLight && !isDesktop) ? 'auto' : 0,
          width: '100%',
          height: (isLight && !isDesktop)
            ? (isSmallPhone ? '240px' : isSmallTab ? '310px' : '410px')
            : '100%',
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          maskImage: isSmallPhone
            ? 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)'
            : (isLight && !isDesktop)
              ? 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 65%, rgba(0,0,0,0) 100%)'
              : 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 75%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: isSmallPhone
            ? 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)'
            : (isLight && !isDesktop)
              ? 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 65%, rgba(0,0,0,0) 100%)'
              : 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 75%, rgba(0,0,0,0) 100%)',
          opacity: 1
        }}
      >
        <SafeAuroraBoundary>
          {isLight ? (
            <Aurora
              key={isSmallPhone ? 'hero-mobile-aurora' : isTablet ? 'hero-tablet-aurora' : 'hero-desktop-aurora'}
              colorStops={["#5227FF", "#7cff67", "#5227FF"]}
              amplitude={isSmallPhone ? 1.0 : isTablet ? 1.1 : 1.2}
              blend={isSmallPhone ? 0.5 : isTablet ? 0.55 : 0.6}
              frequency={isSmallPhone ? 0.95 : isTablet ? 1.7 : 2.0}
              inverted={false}
              lightMode={true}
            />
          ) : (
            <SoftAurora
              speed={0.6}
              scale={1.5}
              brightness={1}
              color1="#f7f7f7"
              color2="#e100ff"
              noiseFrequency={2.5}
              noiseAmplitude={1}
              bandHeight={isSmallPhone ? 0.63 : isSmallTab ? 0.56 : 0.5}
              bandSpread={1}
              octaveDecay={0.1}
              layerOffset={0}
              colorSpeed={1}
              enableMouseInteraction
              mouseInfluence={0.25}
            />
          )}
        </SafeAuroraBoundary>
      </div>

      {/* 1. TOP HEADER (LOGO + FLOATING NAVIGATION PILL) */}
      <Header />

      {/* ========================================================================= */}
      {/* 2. FEATURED HERO BLOG SHOWCASE                                            */}
      {/* ========================================================================= */}
      <div
        style={{
          position: 'relative',
          zIndex: 5,
          maxWidth: '1200px',
          margin: isSmallPhone ? '10px auto 0' : isDesktop ? '28px auto 0' : isLargeView ? '24px auto 0' : isSmallTab ? '30px auto 0' : '40px auto 0',
          padding: isSmallPhone ? '0 16px' : '0px',
          boxSizing: 'border-box'
        }}
      >
        {featuredPost ? (
          <Link
            to={featuredLink}
            style={{
              display: 'grid',
              gridTemplateColumns: isSmallPhone ? '1fr' : '1.15fr 1fr',
              gap: isSmallPhone ? '24px' : '28px',
              alignItems: isSmallPhone ? 'center' : 'stretch',
              textDecoration: 'none',
              color: 'inherit'
            }}
          >
            {/* Left Column: Photo Card with Signature Border & Floating Sidebar Tabs */}
            <div
              style={{
                position: 'relative',
                marginLeft: isSmallPhone ? '22px' : '30px',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Signature Floating Sidebar Tabs Centered on the Left Border */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  transform: 'translate(-50%, -50%)',
                  zIndex: 5,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                {/* Featured Pill Tab */}
                <div
                  style={{
                    background: '#4C0086',
                    borderRadius: '999px',
                    padding: isSmallPhone ? '20px 8px' : '30px 8px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    writingMode: 'vertical-rl',
                    transform: 'rotate(180deg)',
                    color: '#FFBA00',
                    fontFamily: '"Noto Sans", sans-serif',
                    fontSize: isSmallPhone ? '1.24rem' : '1.55rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap'
                  }}
                >
                  FEATURED
                </div>

                {/* Share Icon Button */}
                <div
                  title="Share"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: isDark ? 'var(--bg-main)' : (isSepia ? '#fde8c8' : '#ffffff'),
                    border: isSepia ? '2.5px solid rgba(217, 119, 6, 0.45)' : '1px solid var(--brand-purple)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: isSepia ? '#78350f' : (isLight ? '#374151' : 'white'),
                    boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.1)' : '0 4px 12px rgba(0,0,0,0.6)',
                    cursor: 'pointer',
                    transition: 'background 0.2s, color 0.2s, transform 0.2s'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = 'var(--brand-purple)';
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = isDark ? 'var(--bg-main)' : (isSepia ? '#fde8c8' : '#ffffff');
                    e.currentTarget.style.color = isSepia ? '#78350f' : (isLight ? '#374151' : 'white');
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (navigator.share) {
                      navigator.share({
                        title: featuredTitle,
                        url: `${window.location.origin}${featuredLink}`
                      }).catch(() => { });
                    } else {
                      navigator.clipboard.writeText(`${window.location.origin}${featuredLink}`);
                    }
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                  </svg>
                </div>
              </div>

              {/* Photo Box with Signature Card Border */}
              <div
                style={{
                  position: 'relative',
                  flex: 1,
                  borderRadius: isMobile ? '18px' : '26px',
                  overflow: 'hidden',
                  boxShadow: isLight
                    ? (isSepia ? '0 4px 20px rgba(217, 119, 6, 0.08)' : '0 4px 20px rgba(0, 0, 0, 0.06)')
                    : '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(147, 51, 234, 0.2)',
                  transition: 'transform 0.35s ease, box-shadow 0.35s ease',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = isLight
                    ? (isSepia ? '0 8px 24px rgba(217, 119, 6, 0.16)' : '0 8px 24px rgba(147, 51, 234, 0.15)')
                    : '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 28px rgba(147, 51, 234, 0.35)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = isLight
                    ? (isSepia ? '0 4px 20px rgba(217, 119, 6, 0.08)' : '0 4px 20px rgba(0, 0, 0, 0.06)')
                    : '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(147, 51, 234, 0.2)';
                }}
              >
                {featuredImg && (
                  <img
                    src={featuredImg}
                    alt={featuredTitle}
                    style={{
                      width: '100%',
                      height: '100%',
                      minHeight: isSmallPhone ? '260px' : isTablet ? '320px' : '380px',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                )}
              </div>
            </div>

            {/* Right Column: Editorial Title & Description */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                height: '100%',
                padding: isSmallPhone ? '0' : '8px 0'
              }}
            >
              {featuredCategory && (
                <div
                  style={{
                    color: '#bd75ff',
                    fontFamily: '"Noto Sans", sans-serif',
                    fontSize: '0.78rem',
                    fontWeight: 400,
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <ZwosmosIcon size={12} color="#bd75ff" />
                  <span>{featuredCategory}</span>
                </div>
              )}

              <h1
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: isSmallPhone ? '1.6rem' : isSmallTab ? '1.75rem' : '44px',
                  lineHeight: 1.22,
                  color: isLight ? '#111827' : '#ffffff',
                  textShadow: isLight ? 'none' : '0 2px 14px rgba(0, 0, 0, 0.75)',
                  margin: '0 0 16px 0',
                  fontWeight: 600,
                  letterSpacing: '-0.5px'
                }}
              >
                {featuredTitle}
              </h1>

              <p
                style={{
                  fontFamily: "'Lora', serif",
                  color: isLight ? '#4b5563' : 'rgba(255, 255, 255, 0.78)',
                  fontSize: isSmallPhone ? '0.96rem' : isTablet ? '0.88rem' : '1.08rem',
                  lineHeight: 1.65,
                  margin: '0 0 24px 0',
                  maxWidth: '520px',
                  ...(isTablet ? {
                    display: '-webkit-box',
                    WebkitLineClamp: 6,
                    WebkitBoxOrient: 'vertical' as const,
                    overflow: 'hidden'
                  } : {})
                }}
              >
                {featuredExcerpt}
              </p>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontFamily: '"Noto Sans", sans-serif',
                    fontSize: '0.84rem',
                    fontWeight: 400,
                    letterSpacing: '3px',
                    color: '#bd75ff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  READ STORY ↗
                </span>
              </div>
            </div>
          </Link>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isSmallPhone ? '1fr' : '1.15fr 1fr',
              gap: isSmallPhone ? '24px' : '28px',
              alignItems: isSmallPhone ? 'center' : 'stretch',
              minHeight: isSmallPhone ? '260px' : isTablet ? '320px' : '380px'
            }}
          >
            <div
              style={{
                width: '100%',
                height: isSmallPhone ? '260px' : isTablet ? '320px' : '380px',
                borderRadius: isMobile ? '18px' : '26px',
                background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
                border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)'
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  width: '120px',
                  height: '14px',
                  borderRadius: '4px',
                  background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'
                }}
              />
              <div
                style={{
                  width: '90%',
                  height: '36px',
                  borderRadius: '6px',
                  background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'
                }}
              />
              <div
                style={{
                  width: '75%',
                  height: '36px',
                  borderRadius: '6px',
                  background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'
                }}
              />
              <div
                style={{
                  width: '85%',
                  height: '16px',
                  borderRadius: '4px',
                  background: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
                  marginTop: '10px'
                }}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroSection;
