import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import Aurora from './Aurora';
import { settingsService, DEFAULT_SITE_SETTINGS, SiteSettings } from '../lib/settingsService';

export interface FooterProps {
  isLight?: boolean;
}

const Footer: React.FC<FooterProps> = ({ isLight: propIsLight }) => {
  const { isLight: contextIsLight, isSepia, isDark } = useTheme();
  const isLight = propIsLight ?? contextIsLight;
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    let active = true;
    settingsService.getSettings().then(s => {
      if (active) setSettings(s);
    });
    const handleUpdate = (e: any) => {
      if (e?.detail) setSettings(e.detail);
    };
    window.addEventListener('zwosmos_settings_updated', handleUpdate);
    return () => {
      active = false;
      window.removeEventListener('zwosmos_settings_updated', handleUpdate);
    };
  }, []);

  // Detect viewport width for tablet-specific adjustments
  const [winWidth, setWinWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const onResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Layout purely based on width (ignores isMobile touch emulation)
  const isSmallPhone = winWidth < 641;
  const isSmallTab = winWidth >= 641 && winWidth <= 800; // small tab view (641px–800px, e.g. iPad Mini 768px)
  const isLargeTablet = winWidth > 800 && winWidth <= 1280; // large tab view (810px, 820px, 912px, 1024px, 1180px, 1280px)
  const isTablet = isSmallTab || isLargeTablet;

  // Earth bottom offset per breakpoint
  const earthBottom = isSmallTab
    ? '-140px'
    : isLargeTablet
    ? '-220px'
    : isSmallPhone
    ? '-150px'
    : winWidth > 1600
    ? '-520px'
    : winWidth > 1366
    ? '-400px'
    : '-320px';
  // Earth width per breakpoint
  const earthWidth = isSmallTab ? '130%' : isLargeTablet ? '115%' : isSmallPhone ? '180%' : '100%';
  const earthMinWidth = isSmallTab ? '760px' : isLargeTablet ? '840px' : isSmallPhone ? '640px' : 'auto';

  return (
    <footer
      style={{
        position: 'relative',
        width: '100%',
        minHeight: isSmallPhone ? '520px' : isSmallTab ? '480px' : '620px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: isSmallPhone ? '45px 20px 75px' : isSmallTab ? '40px 20px 65px' : '60px 20px 95px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        textAlign: 'center',
        background: 'transparent',
        borderTop: 'none'
      }}
    >
      {/* 1. Full-Width Aurora Animation Layer (Underneath/Below Globe Layer) */}
      <div
        style={{
          position: 'absolute',
          top: (isSmallPhone || isTablet) ? 'auto' : 0,
          bottom: 0,
          left: 0,
          width: '100%',
          height: isSmallPhone ? '225px' : isSmallTab ? '310px' : isLargeTablet ? '410px' : '100%',
          zIndex: 1,
          pointerEvents: 'none',
          overflow: 'hidden'
        }}
      >
        <Aurora
          key={isSmallPhone ? 'mobile-aurora' : isTablet ? 'tablet-aurora' : 'desktop-aurora'}
          colorStops={["#5227FF", "#7cff67", "#5227FF"]}
          amplitude={isSmallPhone ? 1.0 : isTablet ? 1.1 : 1.2}
          blend={isSmallPhone ? 0.5 : isTablet ? 0.55 : 0.6}
          frequency={isSmallPhone ? 0.95 : isTablet ? 1.7 : 2.0}
          inverted={true}
          lightMode={isLight}
        />
      </div>

      {/* 2. 3D Earth Globe Background (Rests above Aurora) */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.85,
          zIndex: 2,
          pointerEvents: 'none',
          overflow: 'hidden'
        }}
      >
        <img
          src="/assets/img/static_earth-1.png"
          alt="Earth"
          className="footer-globe-img"
          style={{
            position: 'absolute',
            bottom: earthBottom,
            left: '50%',
            transform: 'translateX(-50%)',
            width: earthWidth,
            minWidth: earthMinWidth,
            maxWidth: 'none',
            height: 'auto',
            objectFit: 'contain',
            objectPosition: 'bottom center',
            zIndex: 2,
            pointerEvents: 'none'
          }}
        />
      </div>

      {/* 3. Foreground Content Layer (Mission Quote, Favicon, Tagline, Socials, Copyright) */}
      <div style={{ position: 'relative', zIndex: 3, width: '100%', maxWidth: '820px', margin: '0 auto' }}>
        {/* Quote / Mission Section */}
        <div style={{ textAlign: 'center', marginBottom: isSmallPhone ? '46px' : isSmallTab ? '56px' : '90px' }}>
          <div className="footer-divider" />
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(1.5rem, 1.1rem + 2vw, 2.35rem)',
              margin: '0 0 12px 0',
              fontWeight: 600,
              letterSpacing: '-0.5px',
              color: isDark ? '#ffffff' : (isSepia ? '#2a1a08' : '#111827')
            }}
          >
            Zwosmos is a home for curious minds.
          </h2>
          <p
            style={{
              fontFamily: "'Playfair Display', serif",
              color: isDark ? 'rgba(255, 255, 255, 0.75)' : (isSepia ? '#5c3d18' : '#4b5563'),
              fontSize: isSmallPhone ? '0.86rem' : '1.02rem',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              lineHeight: 1.6,
              margin: 0
            }}
          >
            We explore the universe through stories,<br />tools, and ideas that inspire wonder.
          </p>
        </div>

        {/* Centered Zwosmos Favicon */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '18px' }}>
          <Link
            to="/"
            title="Zwosmos Home"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              transition: 'transform 0.25s ease'
            }}
            onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.08)')}
            onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <img
              src={isLight ? '/assets/icons/Zwosmos_Icon_Light.svg' : '/assets/icons/Zwosmos_Icon_Dark.svg'}
              alt="Zwosmos Logo"
              style={{
                width: isSmallPhone ? '40px' : '48px',
                height: isSmallPhone ? '40px' : '48px',
                objectFit: 'contain',
                display: 'block',
                transition: 'filter 0.3s ease'
              }}
            />
          </Link>
        </div>

        {/* Tagline */}
        <p
          style={{
            color: isLight ? '#374151' : 'rgba(255, 255, 255, 0.82)',
            fontSize: isSmallPhone ? '0.9rem' : '1.02rem',
            lineHeight: 1.6,
            fontFamily: "'Lora', serif",
            maxWidth: '500px',
            margin: '0 auto 24px auto',
            fontWeight: isLight ? 500 : 400
          }}
        >
          Exploring the universe through stories, tools, and ideas that inspire wonder.
        </p>

        {/* Social Media Icons (Only Instagram, Facebook, X, LinkedIn, YouTube) */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginBottom: '26px', flexWrap: 'wrap' }}>
          {[
            {
              id: 'instagram',
              label: 'Instagram',
              href: settings.socialInstagram || 'https://instagram.com/zwosmos',
              svg: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              )
            },
            {
              id: 'facebook',
              label: 'Facebook',
              href: settings.socialFacebook || 'https://facebook.com/zwosmos',
              svg: (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              )
            },
            {
              id: 'x',
              label: 'X (Twitter)',
              href: settings.socialTwitter || 'https://x.com/zwosmos',
              svg: (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              )
            },
            {
              id: 'linkedin',
              label: 'LinkedIn',
              href: settings.socialLinkedin || 'https://linkedin.com/company/zwosmos',
              svg: (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64c-.87 0-1.58.7-1.58 1.58a1.58 1.58 0 0 0 1.58 1.58c.87 0 1.57-.7 1.57-1.58a1.57 1.57 0 0 0-1.57-1.58z" />
                </svg>
              )
            },
            {
              id: 'youtube',
              label: 'YouTube',
              href: settings.socialYoutube || 'https://youtube.com/@zwosmos',
              svg: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              )
            }
          ].map((social) => {
            const buttonStyle = {
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: isDark ? 'rgba(255, 255, 255, 0.08)' : (isSepia ? '#fde8c8' : '#ffffff'),
              border: isDark ? '1px solid rgba(255, 255, 255, 0.18)' : (isSepia ? '1px solid rgba(217, 119, 6, 0.35)' : '1px solid #d1d5db'),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isSepia ? '#78350f' : (isLight ? '#1f2937' : 'rgba(255, 255, 255, 0.9)'),
              textDecoration: 'none',
              transition: 'all 0.25s ease',
              cursor: 'pointer',
              boxShadow: isLight ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
            };

            const handleOver = (e: React.MouseEvent<HTMLElement>) => {
              e.currentTarget.style.background = 'var(--brand-purple)';
              e.currentTarget.style.borderColor = 'var(--brand-purple)';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 0 14px rgba(147, 51, 234, 0.6)';
            };

            const handleOut = (e: React.MouseEvent<HTMLElement>) => {
              e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.08)' : (isSepia ? '#fde8c8' : '#ffffff');
              e.currentTarget.style.borderColor = isDark ? '1px solid rgba(255, 255, 255, 0.18)' : (isSepia ? '1px solid rgba(217, 119, 6, 0.35)' : '#d1d5db');
              e.currentTarget.style.color = isSepia ? '#78350f' : (isLight ? '#1f2937' : 'rgba(255, 255, 255, 0.9)');
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = isLight ? '0 2px 6px rgba(0,0,0,0.06)' : 'none';
            };

            return (
              <a
                key={social.id}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                style={buttonStyle}
                onMouseOver={handleOver}
                onMouseOut={handleOut}
              >
                {social.svg}
              </a>
            );
          })}
        </div>

        {/* Copyright */}
        <div
          style={{
            color: isLight ? '#6b7280' : 'rgba(255, 255, 255, 0.55)',
            fontSize: '0.85rem',
            letterSpacing: '1px',
            fontFamily: "'Lora', serif"
          }}
        >
          {settings.copyrightText || '© 2026 Zwosmos. All rights reserved.'}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
