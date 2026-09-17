import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMobile } from '../contexts/MobileContext';
import { useTheme } from '../contexts/ThemeContext';
import Header from './Header';
import DailyCosmicSection from './DailyCosmicSection';

export const HeroSection: React.FC = () => {
  const { isMobile } = useMobile();
  const { isLight } = useTheme();

  // Detect tablet (641–900px) — iPad Mini is 768px but flagged as isMobile=true
  const [winWidth, setWinWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const onResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  // Layout purely based on width — ignores isMobile (touch detection can be wrong in DevTools)
  const isSmallPhone = winWidth < 641;   // < 641px → phone
  const isSmallTab   = winWidth >= 641 && winWidth < 800; // 641–799px → small tab
  const isTablet    = winWidth >= 641 && winWidth < 1024; // 641–1023px → tablet
  const isLargeView = winWidth >= 800;
  const isDesktop   = winWidth >= 1025; // desktop view only

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
      {/* 1. TOP HEADER (LOGO + FLOATING NAVIGATION PILL) */}
      <Header />

      {/* Mobile view only: This Day in Astronomy & Space Fact of the day at first */}
      {isSmallPhone && <DailyCosmicSection />}

      {/* ========================================================================= */}
      {/* 2. FEATURED HERO BLOG SHOWCASE                                            */}
      {/* ========================================================================= */}
      <div
        style={{
          position: 'relative',
          zIndex: 5,
          maxWidth: '1200px',
          margin: isSmallPhone ? '10px auto 0' : isDesktop ? '28px auto 0' : isLargeView ? '24px auto 0' : isSmallTab ? '30px auto 0' : '40px auto 0',
          padding: isSmallPhone ? '0 16px' : '0 28px',
          boxSizing: 'border-box'
        }}
      >
        <Link
          to="/blog/2"
          style={{
            display: 'grid',
            gridTemplateColumns: isSmallPhone ? '1fr' : '1.15fr 1fr',
            gap: isSmallPhone ? '24px' : '24px',
            alignItems: 'center',
            textDecoration: 'none',
            color: 'inherit'
          }}
        >
          {/* Left Column: Rounded Historic Photo (Exact photo from reference Image 2) */}
          <div
            style={{
              position: 'relative',
              borderRadius: isMobile ? '18px' : '26px',
              overflow: 'hidden',
              boxShadow: isLight
                ? '0 10px 30px rgba(0, 0, 0, 0.08)'
                : '0 20px 48px rgba(0, 0, 0, 0.75), 0 0 20px rgba(147, 51, 234, 0.15)',
              border: isLight ? '1px solid #e5e7eb' : '1px solid rgba(255, 255, 255, 0.14)',
              transition: 'transform 0.35s ease, box-shadow 0.35s ease'
            }}
            onMouseOver={e => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = isLight
                ? '0 16px 36px rgba(0, 0, 0, 0.12)'
                : '0 24px 56px rgba(0, 0, 0, 0.85), 0 0 30px rgba(147, 51, 234, 0.3)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = isLight
                ? '0 10px 30px rgba(0, 0, 0, 0.08)'
                : '0 20px 48px rgba(0, 0, 0, 0.75), 0 0 20px rgba(147, 51, 234, 0.15)';
            }}
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Nancy_Grace_Roman_at_Console_%2841304996424%29.jpg/1280px-Nancy_Grace_Roman_at_Console_%2841304996424%29.jpg"
              alt="Dr. Nancy Grace Roman in front of NASA observatory telemetry controls"
              style={{
                width: '100%',
                height: isSmallPhone ? '260px' : isTablet ? '320px' : '380px',
                objectFit: 'cover',
                display: 'block'
              }}
            />
          </div>

          {/* Right Column: Editorial Title & Description */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: isSmallPhone ? '2.1rem' : isSmallTab ? '1.75rem' : '45px',
                lineHeight: 1.22,
                color: isLight ? '#111827' : '#ffffff',
                margin: '0 0 16px 0',
                fontWeight: 600,
                letterSpacing: '-0.5px'
              }}
            >
              Nancy Grace Roman<br />
              Telescope <span style={{ fontStyle: 'italic', fontWeight: 400, color: isLight ? 'var(--brand-purple)' : '#f3e8ff' }}>Unfolds</span> Mystery
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
              Nancy Grace Roman Telescope Unfolds Mystery: Delving into NASA's revolutionary wide-field infrared observatory, engineered to unlock the subtle gravitational physics of dark energy and map billions of galaxies across the cosmic dawn.
            </p>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  letterSpacing: '1.5px',
                  color: 'var(--brand-purple)',
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
      </div>
    </section>
  );
};

export default HeroSection;
