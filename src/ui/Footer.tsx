import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import Aurora from './Aurora';

export interface FooterProps {
  isLight?: boolean;
}

const Footer: React.FC<FooterProps> = ({ isLight: propIsLight }) => {
  const { isLight: contextIsLight } = useTheme();
  const isLight = propIsLight ?? contextIsLight;

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
  const isLargeTablet = winWidth > 800 && winWidth <= 1180; // large tab view (810px, 820px, 912px, 1024px, 1180px)

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
        minHeight: isSmallPhone ? '420px' : isSmallTab ? '380px' : '520px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: isSmallPhone ? '40px 20px 70px' : isSmallTab ? '20px 20px 50px' : '60px 20px 90px',
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
          top: isSmallPhone ? 'auto' : 0,
          bottom: 0,
          left: 0,
          width: '100%',
          height: isSmallPhone ? '325px' : '100%',
          zIndex: 1,
          pointerEvents: 'none',
          overflow: 'hidden'
        }}
      >
        <Aurora
          key={isSmallPhone ? 'mobile-aurora' : 'desktop-aurora'}
          colorStops={["#5227FF", "#7cff67", "#5227FF"]}
          amplitude={isSmallPhone ? 1.0 : 1.2}
          blend={isSmallPhone ? 0.5 : 0.6}
          frequency={isSmallPhone ? 0.95 : 2.0}
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

      {/* 3. Foreground Content Layer (Favicon, Tagline, Socials, Copyright) */}
      <div style={{ position: 'relative', zIndex: 3, width: '100%', maxWidth: '650px', margin: '0 auto' }}>
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
              src="/assets/icons/Zwosmos_Favicon.svg"
              alt="Zwosmos Favicon"
              style={{
                width: isSmallPhone ? '40px' : '48px',
                height: isSmallPhone ? '40px' : '48px',
                objectFit: 'contain',
                filter: isLight
                  ? 'drop-shadow(0 0 10px rgba(147, 51, 234, 0.35))'
                  : 'drop-shadow(0 0 16px rgba(168, 85, 247, 0.85)) brightness(1.8)',
                display: 'block'
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

        {/* Social Media Icons */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginBottom: '26px', flexWrap: 'wrap' }}>
          {[
            { icon: 'fa-brands fa-instagram', href: 'https://instagram.com', label: 'Instagram' },
            { icon: 'fa-brands fa-facebook-f', href: 'https://facebook.com', label: 'Facebook' },
            { icon: 'fa-brands fa-youtube', href: 'https://youtube.com', label: 'YouTube' },
            { icon: 'fa-brands fa-x-twitter', href: 'https://twitter.com', label: 'X (Twitter)' }
          ].map((social, idx) => (
            <a
              key={idx}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.08)',
                border: isLight ? '1px solid #d1d5db' : '1px solid rgba(255, 255, 255, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isLight ? '#1f2937' : 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.92rem',
                textDecoration: 'none',
                transition: 'all 0.25s ease',
                cursor: 'pointer',
                boxShadow: isLight ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = 'var(--brand-purple)';
                e.currentTarget.style.borderColor = 'var(--brand-purple)';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 0 14px rgba(147, 51, 234, 0.6)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = isLight ? '#d1d5db' : 'rgba(255, 255, 255, 0.18)';
                e.currentTarget.style.color = isLight ? '#1f2937' : 'rgba(255, 255, 255, 0.9)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = isLight ? '0 2px 6px rgba(0,0,0,0.06)' : 'none';
              }}
            >
              <i className={social.icon}></i>
            </a>
          ))}
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
          © 2026 Zwosmos. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
