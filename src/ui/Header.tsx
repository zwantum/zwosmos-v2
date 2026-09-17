import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import MegaMenu, { MEGA_MENU_ITEMS, ALL_MEGA_MENU_ITEMS, MenuItem } from './MegaMenu';

export interface HeaderProps {
  isLight?: boolean;
  onThemeToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isLight: propIsLight, onThemeToggle }) => {
  const navigate = useNavigate();
  const { isLight: contextIsLight, toggleTheme: contextToggleTheme } = useTheme();

  // Width tracking for pure responsive layout independent of DevTools touch emulation
  const [winWidth, setWinWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const onResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Large tab (>= 800px) and desktop use desktop header
  const isMobileHeader = winWidth < 800;
  const isLargeView = winWidth >= 800;
  const isLargeTab = winWidth >= 800 && winWidth <= 1024;

  const effectiveIsLight = propIsLight !== undefined ? propIsLight : contextIsLight;

  // Search state
  const [searchVal, setSearchVal] = useState('');
  // Mega menu toggle
  const [menuOpen, setMenuOpen] = useState(false);
  // Explore hover mega menu
  const [exploreHovered, setExploreHovered] = useState(false);
  const exploreTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleExploreEnter = () => {
    if (exploreTimeoutRef.current) {
      clearTimeout(exploreTimeoutRef.current);
      exploreTimeoutRef.current = null;
    }
    setExploreHovered(true);
  };

  const handleExploreLeave = () => {
    if (exploreTimeoutRef.current) {
      clearTimeout(exploreTimeoutRef.current);
    }
    exploreTimeoutRef.current = setTimeout(() => {
      setExploreHovered(false);
    }, 220);
  };

  useEffect(() => {
    return () => {
      if (exploreTimeoutRef.current) {
        clearTimeout(exploreTimeoutRef.current);
      }
    };
  }, []);
  // Search input focus state
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  // Mobile search overlay
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const mobileHeaderRef = useRef<HTMLElement>(null);
  const [mobileHeaderHeight, setMobileHeaderHeight] = useState(60);

  useEffect(() => {
    if (mobileHeaderRef.current) {
      setMobileHeaderHeight(mobileHeaderRef.current.offsetHeight);
    }
  }, [winWidth, menuOpen]);

  useEffect(() => {
    if (searchOverlayOpen && mobileSearchRef.current) {
      setTimeout(() => mobileSearchRef.current?.focus(), 80);
    }
  }, [searchOverlayOpen]);

  useEffect(() => {
    if (isMobileHeader && menuOpen) {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = origOverflow;
      };
    }
  }, [isMobileHeader, menuOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/blog?search=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  const handleToggle = () => {
    if (onThemeToggle) {
      onThemeToggle();
    } else {
      contextToggleTheme();
    }
  };

  const currentIsDark = !effectiveIsLight;

  // ─── Mobile Header (< 800px) ─────────────────────────────────────────────
  if (isMobileHeader) {
    return (
      <div style={{ position: 'relative', width: '100%' }}>
        <header
          ref={mobileHeaderRef}
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            width: '100%',
            boxSizing: 'border-box',
            background: menuOpen
              ? (currentIsDark ? 'rgba(32, 16, 54, 0.75)' : 'rgba(255, 255, 255, 0.85)')
              : 'transparent',
            backdropFilter: menuOpen ? 'blur(16px)' : 'none',
            WebkitBackdropFilter: menuOpen ? 'blur(16px)' : 'none',
            borderBottom: menuOpen
              ? (currentIsDark ? '1px solid rgba(168, 85, 247, 0.25)' : '1px solid rgba(147, 51, 234, 0.12)')
              : 'none',
            transition: 'background 0.2s ease, border-bottom 0.2s ease'
          }}
        >
          {/* Left: Logo */}
          <Link
            to="/"
            style={{ display: 'inline-block', textDecoration: 'none', flexShrink: 0 }}
          >
            <img
              src={currentIsDark ? '/assets/icons/Zwosmos_Logo_Light.svg' : '/assets/icons/Zwosmos_Logo_Dark.svg'}
              alt="7WOSMOS"
              style={{
                width: '170px',
                height: 'auto',
                display: 'block',
                filter: currentIsDark ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.6))' : 'none',
                imageRendering: 'crisp-edges',
                transform: 'translateZ(0)',
                WebkitFontSmoothing: 'antialiased'
              }}
            />
          </Link>

          {/* Right: Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={handleToggle}
              title={`Switch to ${currentIsDark ? 'Light' : 'Dark'} Tone`}
              style={{
                width: '38px',
                height: '22px',
                borderRadius: '9999px',
                border: currentIsDark ? '1px solid rgba(255,255,255,0.3)' : '1px solid #d1d5db',
                background: currentIsDark ? 'rgba(255,255,255,0.15)' : '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                flexShrink: 0
              }}
            >
              <span
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: currentIsDark ? 'var(--brand-purple)' : '#111827',
                  transform: currentIsDark ? 'translateX(0px)' : 'translateX(16px)',
                  transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.58rem',
                  color: '#ffffff'
                }}
              >
                {currentIsDark ? '☾' : '☼'}
              </span>
            </button>

            {/* Search Icon */}
            <button
              type="button"
              onClick={() => setSearchOverlayOpen(true)}
              title="Search"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: currentIsDark ? '#ffffff' : '#111827',
                flexShrink: 0
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {/* Hamburger */}
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              title="Menu"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 4px',
                flexShrink: 0
              }}
            >
              <span style={{
                display: 'block', width: '20px', height: '2px',
                backgroundColor: currentIsDark ? '#ffffff' : '#111827',
                borderRadius: '2px', transition: 'transform 0.2s ease',
                transform: menuOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none'
              }} />
              <span style={{
                display: 'block', width: '20px', height: '2px',
                backgroundColor: currentIsDark ? '#ffffff' : '#111827',
                borderRadius: '2px', opacity: menuOpen ? 0 : 1,
                transition: 'opacity 0.2s ease'
              }} />
              <span style={{
                display: 'block', width: '20px', height: '2px',
                backgroundColor: currentIsDark ? '#ffffff' : '#111827',
                borderRadius: '2px', transition: 'transform 0.2s ease',
                transform: menuOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none'
              }} />
            </button>
          </div>
        </header>

        {/* Mobile Search Overlay */}
        {searchOverlayOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              animation: 'megaMenuFade 0.2s ease-out'
            }}
            onClick={() => setSearchOverlayOpen(false)}
          >
            {/* Search Bar Panel */}
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: currentIsDark
                  ? 'linear-gradient(135deg, rgba(18,10,35,0.98) 0%, rgba(30,15,55,0.98) 100%)'
                  : 'rgba(255,255,255,0.98)',
                backdropFilter: 'blur(20px)',
                borderBottom: currentIsDark
                  ? '1px solid rgba(147,51,234,0.3)'
                  : '1px solid rgba(147,51,234,0.2)',
                padding: '18px 18px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.35)'
              }}
            >
              {/* Search icon inside bar */}
              <svg
                width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke={currentIsDark ? 'rgba(255,255,255,0.5)' : '#9333ea'}
                strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>

              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (searchVal.trim()) {
                    navigate(`/blog?search=${encodeURIComponent(searchVal.trim())}`);
                    setSearchOverlayOpen(false);
                    setSearchVal('');
                  }
                }}
                style={{ flex: 1, display: 'flex', alignItems: 'center' }}
              >
                <input
                  ref={mobileSearchRef}
                  type="text"
                  value={searchVal}
                  onChange={e => setSearchVal(e.target.value)}
                  placeholder="Search articles, topics..."
                  style={{
                    flex: 1,
                    height: '44px',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '1.05rem',
                    fontWeight: 500,
                    color: currentIsDark ? '#ffffff' : '#111827',
                    fontFamily: "'Lora', serif",
                    caretColor: 'var(--brand-purple)'
                  }}
                />
              </form>

              {/* Clear / Close */}
              <button
                type="button"
                onClick={() => {
                  if (searchVal) {
                    setSearchVal('');
                    mobileSearchRef.current?.focus();
                  } else {
                    setSearchOverlayOpen(false);
                  }
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: currentIsDark ? 'rgba(255,255,255,0.6)' : '#6b7280',
                  flexShrink: 0,
                  fontSize: '1.2rem',
                  lineHeight: 1
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Mobile Blurry & Glossy Dropdown Overlay (Fixed in place) */}
        {menuOpen && (
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: 'fixed',
              top: `${mobileHeaderHeight}px`,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99,
              background: currentIsDark
                ? 'rgba(24, 12, 42, 0.40)'
                : 'rgba(255, 255, 255, 0.55)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '14px 14px 28px',
              boxSizing: 'border-box',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              animation: 'megaOverlayFade 0.22s ease-out'
            }}
          >
            {/* Glossy Card Container */}
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '520px',
                borderRadius: '24px',
                padding: '14px 14px 18px',
                boxSizing: 'border-box',
                background: currentIsDark
                  ? 'linear-gradient(145deg, rgba(52, 28, 82, 0.58) 0%, rgba(28, 14, 48, 0.64) 100%)'
                  : 'linear-gradient(145deg, rgba(255, 255, 255, 0.82) 0%, rgba(248, 242, 255, 0.86) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: currentIsDark
                  ? '1px solid rgba(168, 85, 247, 0.35)'
                  : '1px solid rgba(147, 51, 234, 0.20)',
                boxShadow: currentIsDark
                  ? '0 8px 28px rgba(0, 0, 0, 0.35), 0 0 20px rgba(147, 51, 234, 0.15)'
                  : '0 6px 20px rgba(147, 51, 234, 0.07), 0 2px 6px rgba(0, 0, 0, 0.03)'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {ALL_MEGA_MENU_ITEMS.map((item) => (
                  <Link
                    key={item.id}
                    to={item.href}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '10px 12px',
                      borderRadius: '14px',
                      textDecoration: 'none',
                      background: currentIsDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.82)',
                      border: currentIsDark ? '1px solid rgba(255, 255, 255, 0.09)' : '1px solid rgba(147, 51, 234, 0.12)',
                      boxShadow: currentIsDark ? 'none' : '0 2px 6px rgba(147, 51, 234, 0.04)',
                      transition: 'all 0.2s ease',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    onTouchStart={(e) => {
                      e.currentTarget.style.background = currentIsDark ? 'rgba(168, 85, 247, 0.25)' : 'rgba(243, 232, 255, 0.95)';
                    }}
                    onTouchEnd={(e) => {
                      e.currentTarget.style.background = currentIsDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.82)';
                    }}
                  >
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        minWidth: '46px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: currentIsDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(147, 51, 234, 0.18)',
                        boxShadow: currentIsDark ? '0 2px 8px rgba(0, 0, 0, 0.4)' : '0 2px 8px rgba(147, 51, 234, 0.1)',
                        flexShrink: 0
                      }}
                    >
                      <img
                        src={item.img}
                        alt={item.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <span
                        style={{
                          fontFamily: "'Orbitron', sans-serif",
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          color: currentIsDark ? '#ffffff' : '#111827',
                          letterSpacing: '0.3px',
                          lineHeight: 1.25
                        }}
                      >
                        {item.title}
                      </span>
                      <span
                        style={{
                          fontFamily: "'Lora', serif",
                          fontSize: '0.74rem',
                          color: currentIsDark ? 'rgba(203, 213, 225, 0.72)' : '#64748b',
                          lineHeight: 1.35,
                          marginTop: '2px'
                        }}
                      >
                        {item.desc}
                      </span>
                    </div>
                    <span
                      style={{
                        color: currentIsDark ? 'rgba(216, 180, 254, 0.75)' : '#9333ea',
                        fontSize: '1rem',
                        fontWeight: 500,
                        flexShrink: 0,
                        paddingLeft: '4px'
                      }}
                    >
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Desktop & Large Tab Header (>= 800px) ───────────────────────────────
  const renderMegaMenuItem = (item: MenuItem) => (
    <Link
      key={item.id}
      to={item.href}
      onClick={() => setExploreHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '12px 14px',
        borderRadius: '14px',
        textDecoration: 'none',
        background: 'transparent',
        border: '1px solid transparent',
        transition: 'all 0.2s ease',
        cursor: 'pointer'
      }}
      onMouseOver={e => {
        e.currentTarget.style.background = currentIsDark
          ? 'rgba(168, 85, 247, 0.16)'
          : 'rgba(243, 232, 255, 0.85)';
        e.currentTarget.style.borderColor = currentIsDark
          ? 'rgba(168, 85, 247, 0.35)'
          : 'rgba(147, 51, 234, 0.28)';
        e.currentTarget.style.transform = 'translateX(3px)';
        const titleEl = e.currentTarget.querySelector('.mega-drop-title') as HTMLElement;
        if (titleEl) {
          titleEl.style.color = currentIsDark ? '#c084fc' : '#7c3aed';
        }
        const imgEl = e.currentTarget.querySelector('.mega-drop-img') as HTMLElement;
        if (imgEl) {
          imgEl.style.transform = 'scale(1.08)';
        }
      }}
      onMouseOut={e => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.borderColor = 'transparent';
        e.currentTarget.style.transform = 'translateX(0px)';
        const titleEl = e.currentTarget.querySelector('.mega-drop-title') as HTMLElement;
        if (titleEl) {
          titleEl.style.color = currentIsDark ? '#ffffff' : '#111827';
        }
        const imgEl = e.currentTarget.querySelector('.mega-drop-img') as HTMLElement;
        if (imgEl) {
          imgEl.style.transform = 'scale(1)';
        }
      }}
    >
      <div
        style={{
          width: '52px',
          height: '52px',
          minWidth: '52px',
          borderRadius: '12px',
          overflow: 'hidden',
          border: currentIsDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(147, 51, 234, 0.2)',
          boxShadow: currentIsDark ? '0 2px 8px rgba(0, 0, 0, 0.4)' : '0 2px 8px rgba(147, 51, 234, 0.12)'
        }}
      >
        <img
          className="mega-drop-img"
          src={item.img}
          alt={item.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform 0.3s ease'
          }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', minWidth: 0 }}>
        <span
          className="mega-drop-title"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '0.84rem',
            fontWeight: 700,
            letterSpacing: '0.4px',
            color: currentIsDark ? '#ffffff' : '#111827',
            transition: 'color 0.2s ease',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {item.title}
        </span>
        <span
          style={{
            fontFamily: "'Lora', serif",
            fontSize: '0.73rem',
            color: currentIsDark ? 'rgba(235, 225, 255, 0.85)' : '#64748b',
            lineHeight: 1.4,
            marginTop: '3px',
            display: 'block',
            whiteSpace: 'normal',
            wordBreak: 'normal'
          }}
        >
          {item.desc}
        </span>
      </div>
    </Link>
  );

  return (
    <header
      style={{
        position: 'relative',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: isLargeView ? '32px 20px 20px' : '55px 24px 35px',
        textAlign: 'center',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Brand Logo with Tagline */}
      <Link
        to="/"
        style={{
          display: 'inline-block',
          textDecoration: 'none',
          transition: 'transform 0.25s ease'
        }}
        onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.02)')}
        onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        <img
          src={currentIsDark ? '/assets/icons/Zwosmos_Logo_Light.svg' : '/assets/icons/Zwosmos_Logo_Dark.svg'}
          alt="7WOSMOS - LOOK UP. THINK BEYOND."
          style={{
            width: isLargeTab ? '330px' : '380px',
            maxWidth: '90vw',
            height: 'auto',
            display: 'block',
            margin: '0 auto',
            filter: currentIsDark ? 'drop-shadow(0 6px 24px rgba(0, 0, 0, 0.75))' : 'none'
          }}
        />
      </Link>

      {/* Navigation Pill Bar & Floating Mega Menu Container */}
      <div
        style={{
          marginTop: isLargeView ? '18px' : '28px',
          position: 'relative',
          display: 'inline-flex',
          justifyContent: 'center',
          zIndex: 1000
        }}
      >
        <nav
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '22px',
          background: currentIsDark
            ? 'linear-gradient(135deg, rgba(68, 42, 96, 0.42) 0%, rgba(38, 22, 58, 0.35) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(243, 232, 255, 0.75) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: currentIsDark ? '1px solid rgba(255, 255, 255, 0.22)' : '1px solid rgba(147, 51, 234, 0.25)',
          borderRadius: '9999px',
          padding: '9px 24px',
          boxShadow: currentIsDark
            ? '0 8px 32px rgba(0, 0, 0, 0.25), 0 0 24px rgba(168, 85, 247, 0.16), inset 0 1px 1px rgba(255, 255, 255, 0.25)'
            : '0 8px 24px rgba(147, 51, 234, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.8)'
        }}
      >
        {/* Menu Items */}
        {!menuOpen && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              animation: 'megaOverlayFade 0.2s ease-out'
            }}
          >
            {[
              { label: 'SPACE NEWS', href: '/space-news' },
              { label: 'EXPLORE', href: '/blog' },
              { label: 'SKYWATCHING', href: '/skywatching' },
              { label: 'LEARN', href: '/learn' }
            ].map(item => {
              const isExplore = item.label === 'EXPLORE';
              return (
                <div
                  key={item.label}
                  onMouseEnter={isExplore ? handleExploreEnter : undefined}
                  onMouseLeave={isExplore ? handleExploreLeave : undefined}
                  style={{
                    position: 'relative',
                    display: 'inline-flex',
                    alignItems: 'center'
                  }}
                >
                  <Link
                    to={item.href}
                    onClick={() => {
                      if (isExplore) setExploreHovered(false);
                    }}
                    style={{
                      color: (isExplore && exploreHovered)
                        ? (currentIsDark ? '#ffffff' : 'var(--brand-purple)')
                        : (currentIsDark ? 'rgba(255, 255, 255, 0.85)' : '#374151'),
                      textDecoration: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      letterSpacing: '1.5px',
                      fontFamily: "'Orbitron', sans-serif",
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'color 0.2s ease, text-shadow 0.2s ease',
                      textShadow: (isExplore && exploreHovered && currentIsDark)
                        ? '0 0 12px rgba(255, 255, 255, 0.8)'
                        : 'none'
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.color = currentIsDark ? '#ffffff' : 'var(--brand-purple)';
                      e.currentTarget.style.textShadow = currentIsDark ? '0 0 12px rgba(255, 255, 255, 0.8)' : 'none';
                    }}
                    onMouseOut={e => {
                      if (!isExplore || !exploreHovered) {
                        e.currentTarget.style.color = currentIsDark ? 'rgba(255, 255, 255, 0.85)' : '#374151';
                        e.currentTarget.style.textShadow = 'none';
                      }
                    }}
                  >
                    {item.label}
                    {isExplore && (
                      <span
                        style={{
                          fontSize: '0.62rem',
                          display: 'inline-block',
                          transition: 'transform 0.25s ease',
                          transform: exploreHovered ? 'rotate(180deg)' : 'rotate(0deg)',
                          opacity: 0.8
                        }}
                      >
                        ▾
                      </span>
                    )}
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* Dark & Light Tone Toggle Pill */}
        <button
          type="button"
          onClick={handleToggle}
          title={`Switch to ${currentIsDark ? 'Light' : 'Dark'} Tone`}
          style={{
            width: '42px',
            height: '24px',
            borderRadius: '9999px',
            border: currentIsDark ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid #d1d5db',
            background: currentIsDark ? 'rgba(255, 255, 255, 0.15)' : '#ffffff',
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            position: 'relative'
          }}
        >
          <span
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: currentIsDark ? 'var(--brand-purple)' : '#111827',
              transform: currentIsDark ? 'translateX(0px)' : 'translateX(18px)',
              transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.62rem',
              color: '#ffffff'
            }}
          >
            {currentIsDark ? '☾' : '☼'}
          </span>
        </button>

        {/* Enhanced Modern Search Bar Pill */}
        <form
          onSubmit={handleSearchSubmit}
          style={{ display: 'inline-flex', alignItems: 'center', position: 'relative' }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            {/* Search Glass Icon */}
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke={isSearchFocused ? '#9333ea' : '#64748b'}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                position: 'absolute',
                left: '11px',
                pointerEvents: 'none',
                transition: 'stroke 0.2s ease',
                zIndex: 2
              }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>

            <input
              type="text"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder="Search..."
              style={{
                width: isSearchFocused ? '175px' : '135px',
                height: '30px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(246,243,255,0.92) 100%)',
                border: isSearchFocused ? '1px solid #9333ea' : '1px solid rgba(255,255,255,0.6)',
                borderRadius: '9999px',
                padding: '0 18px 0 32px',
                fontSize: '0.78rem',
                fontWeight: 500,
                color: '#0f172a',
                fontFamily: "'Orbitron', sans-serif",
                letterSpacing: '0.5px',
                outline: 'none',
                boxShadow: isSearchFocused
                  ? '0 0 0 3px rgba(147,51,234,0.28), 0 4px 16px rgba(147,51,234,0.2)'
                  : '0 2px 8px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.8)',
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)'
              }}
            />

            {searchVal && (
              <button
                type="button"
                onClick={() => setSearchVal('')}
                title="Clear search"
                style={{
                  position: 'absolute',
                  right: '8px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#cbd5e1',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '10px',
                  lineHeight: 1,
                  color: '#475569',
                  padding: 0
                }}
              >
                ✕
              </button>
            )}
          </div>
        </form>

        {/* Hamburger Menu Icon */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          title="Menu"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 4px',
            color: currentIsDark ? '#ffffff' : '#111827'
          }}
        >
          <span style={{
            display: 'block', width: '18px', height: '2px',
            backgroundColor: currentIsDark ? '#ffffff' : '#111827',
            borderRadius: '2px', transition: 'transform 0.2s ease',
            transform: menuOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none'
          }} />
          <span style={{
            display: 'block', width: '18px', height: '2px',
            backgroundColor: currentIsDark ? '#ffffff' : '#111827',
            borderRadius: '2px', opacity: menuOpen ? 0 : 1,
            transition: 'opacity 0.2s ease'
          }} />
          <span style={{
            display: 'block', width: '18px', height: '2px',
            backgroundColor: currentIsDark ? '#ffffff' : '#111827',
            borderRadius: '2px', transition: 'transform 0.2s ease',
            transform: menuOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none'
          }} />
        </button>
      </nav>

      {/* Floating Mega Menu Dropdown on EXPLORE hover */}
      <div
        onMouseEnter={handleExploreEnter}
        onMouseLeave={handleExploreLeave}
        style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: exploreHovered ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-6px)',
          opacity: exploreHovered ? 1 : 0,
          visibility: exploreHovered ? 'visible' : 'hidden',
          pointerEvents: exploreHovered ? 'auto' : 'none',
          paddingTop: '12px',
          zIndex: 1001,
          transition: 'opacity 0.22s ease, transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.22s'
        }}
      >
        <div
          style={{
            width: 'min(980px, 94vw)',
            borderRadius: '26px',
            padding: '24px 28px',
            background: currentIsDark
              ? 'linear-gradient(135deg, rgba(78, 48, 112, 0.55) 0%, rgba(46, 26, 75, 0.50) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(248, 242, 255, 0.92) 100%)',
            backdropFilter: 'blur(28px) saturate(190%)',
            WebkitBackdropFilter: 'blur(28px) saturate(190%)',
            border: currentIsDark
              ? '1px solid rgba(216, 180, 254, 0.35)'
              : '1px solid rgba(147, 51, 234, 0.22)',
            boxShadow: currentIsDark
              ? '0 16px 48px rgba(0, 0, 0, 0.32), 0 0 32px rgba(168, 85, 247, 0.18), inset 0 1px 1px rgba(255, 255, 255, 0.25)'
              : '0 20px 50px rgba(109, 40, 217, 0.12), 0 4px 16px rgba(0, 0, 0, 0.04), inset 0 1px 1px rgba(255, 255, 255, 0.95)',
            boxSizing: 'border-box'
          }}
        >
            {/* Top header row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '16px',
                marginBottom: '18px',
                borderBottom: currentIsDark
                  ? '1px solid rgba(255, 255, 255, 0.12)'
                  : '1px solid rgba(147, 51, 234, 0.12)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: currentIsDark ? '#c084fc' : '#9333ea', fontSize: '0.85rem' }}>✦</span>
                <span
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '2px',
                    color: currentIsDark ? '#e9d5ff' : '#6b21a8',
                    textTransform: 'uppercase'
                  }}
                >
                  Explore All Topics
                </span>
              </div>
              <Link
                to="/blog"
                onClick={() => setExploreHovered(false)}
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  letterSpacing: '1px',
                  color: currentIsDark ? 'rgba(216, 180, 254, 0.85)' : '#9333ea',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'color 0.2s ease, transform 0.2s ease'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.color = currentIsDark ? '#ffffff' : '#7c3aed';
                  e.currentTarget.style.transform = 'translateX(2px)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.color = currentIsDark ? 'rgba(216, 180, 254, 0.85)' : '#9333ea';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                View Blog Feed →
              </Link>
            </div>

            {/* 3 Columns Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '18px'
              }}
            >
              {/* Column 1 */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  borderRight: currentIsDark
                    ? '1px solid rgba(255, 255, 255, 0.10)'
                    : '1px solid rgba(147, 51, 234, 0.1)',
                  paddingRight: '16px'
                }}
              >
                {MEGA_MENU_ITEMS.column1.map(item => renderMegaMenuItem(item))}
              </div>

              {/* Column 2 */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  borderRight: currentIsDark
                    ? '1px solid rgba(255, 255, 255, 0.10)'
                    : '1px solid rgba(147, 51, 234, 0.1)',
                  paddingRight: '16px'
                }}
              >
                {MEGA_MENU_ITEMS.column2.map(item => renderMegaMenuItem(item))}
              </div>

              {/* Column 3 */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                {MEGA_MENU_ITEMS.column3.map(item => renderMegaMenuItem(item))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Mega Menu */}
      <MegaMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );

};

export default Header;
