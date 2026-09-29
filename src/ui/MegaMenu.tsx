import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { settingsService, DEFAULT_SITE_SETTINGS, SiteSettings } from '../lib/settingsService';

export interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface MenuItem {
  id: string;
  title: string;
  desc: string;
  href: string;
  img: string;
}

export const MEGA_MENU_ITEMS = {
  column1: [
    {
      id: 'space-news',
      title: 'Space News',
      desc: 'Latest space news and discoveries',
      href: '/space-news',
      img: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=300&auto=format&fit=crop'
    },
    {
      id: 'solar-system',
      title: 'Solar System',
      desc: 'Planets, moons, comets and asteroids',
      href: '/solar-system',
      img: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?q=80&w=300&auto=format&fit=crop'
    },
    {
      id: 'telescopes-technology',
      title: 'Telescopes & Technology',
      desc: 'Telescopes, observatories and space tech',
      href: '/telescopes-technology',
      img: 'https://images.unsplash.com/photo-1541873676-a18131494184?q=80&w=300&auto=format&fit=crop'
    }
  ] as MenuItem[],
  column2: [
    {
      id: 'universe',
      title: 'Universe',
      desc: 'Stars, galaxies and cosmic mysteries',
      href: '/universe',
      img: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=300&auto=format&fit=crop'
    },
    {
      id: 'space-exploration',
      title: 'Space Exploration',
      desc: 'Missions, astronauts and spacecraft',
      href: '/space-exploration',
      img: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=300&auto=format&fit=crop'
    },
    {
      id: 'skywatching',
      title: 'Skywatching',
      desc: 'Eclipses, meteor showers and night sky',
      href: '/skywatching',
      img: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=300&auto=format&fit=crop'
    }
  ] as MenuItem[],
  column3: [
    {
      id: 'space-culture',
      title: 'Space Culture',
      desc: 'Space books, films and art',
      href: '/space-culture',
      img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=300&auto=format&fit=crop'
    },
    {
      id: 'explainers',
      title: 'Explainers',
      desc: 'Astronomy guides & science primers',
      href: '/explainers',
      img: 'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?q=80&w=300&auto=format&fit=crop'
    },
    {
      id: 'people-history',
      title: 'People & History',
      desc: 'Space pioneers and astronomy history',
      href: '/people-history',
      img: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=300&q=80'
    }
  ] as MenuItem[]
};

export const ALL_MEGA_MENU_ITEMS: MenuItem[] = [
  ...MEGA_MENU_ITEMS.column1,
  ...MEGA_MENU_ITEMS.column2,
  ...MEGA_MENU_ITEMS.column3
];

export const MegaMenu: React.FC<MegaMenuProps> = ({ isOpen, onClose }) => {
  // Pure screen width tracking independent of DevTools touch emulation
  const [winWidth, setWinWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1200));

  useEffect(() => {
    const handleResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Only mobile and small tab view (<= 800px) use mobile single-column drawer; rest every other screen uses desktop 3-column menu
  const isMobile = winWidth <= 800;
  const isCompact = winWidth > 800 && winWidth < 1180;
  const { isSepia, isDark } = useTheme();
  const currentIsDark = isDark;
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    let active = true;
    settingsService.getSettings().then(s => {
      if (active && s) setSettings(s);
    });

    const handleUpdate = (e: any) => {
      if (e?.detail) setSettings(e.detail);
    };

    window.addEventListener('zwosmos_settings_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      active = false;
      window.removeEventListener('zwosmos_settings_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Prevent background scroll when overlay is open & support Escape key
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const { column1, column2, column3 } = MEGA_MENU_ITEMS;

  const renderColumn = (items: MenuItem[], hasRightBorder = false, hasLeftPadding = false) => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '14px' : (isCompact ? '32px' : '52px'),
        borderRight: (!isMobile && hasRightBorder)
          ? (currentIsDark ? '1px solid rgba(255, 255, 255, 0.08)' : (isSepia ? '1px solid rgba(217, 119, 6, 0.18)' : '1px solid rgba(0, 0, 0, 0.08)'))
          : 'none',
        paddingRight: (!isMobile && hasRightBorder) ? (isCompact ? '24px' : '48px') : '0px',
        paddingLeft: (!isMobile && hasLeftPadding) ? (isCompact ? '24px' : '48px') : '0px',
        boxSizing: 'border-box'
      }}
    >
      {items.map(item => (
        <Link
          key={item.id}
          to={item.href}
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '18px' : (isCompact ? '14px' : '18px'),
            textDecoration: 'none',
            background: 'transparent',
            border: 'none',
            padding: '4px 0',
            transition: 'all 0.22s ease',
            boxSizing: 'border-box'
          }}
          onMouseOver={e => {
            const title = e.currentTarget.querySelector('.item-title') as HTMLElement;
            const desc = e.currentTarget.querySelector('.item-desc') as HTMLElement;
            const arrow = e.currentTarget.querySelector('.item-arrow') as HTMLElement;
            if (title) title.style.color = currentIsDark ? '#c084fc' : (isSepia ? '#d97706' : '#9333ea');
            if (desc) desc.style.color = currentIsDark ? '#e2e8f0' : (isSepia ? '#78350f' : '#334155');
            if (arrow) {
              arrow.style.color = currentIsDark ? '#ffffff' : (isSepia ? '#d97706' : '#9333ea');
              arrow.style.transform = 'translateX(5px)';
            }
          }}
          onMouseOut={e => {
            const title = e.currentTarget.querySelector('.item-title') as HTMLElement;
            const desc = e.currentTarget.querySelector('.item-desc') as HTMLElement;
            const arrow = e.currentTarget.querySelector('.item-arrow') as HTMLElement;
            if (title) title.style.color = currentIsDark ? '#ffffff' : '#111827';
            if (desc) desc.style.color = currentIsDark ? '#94a3b8' : (isSepia ? '#57534e' : '#64748b');
            if (arrow) {
              arrow.style.color = currentIsDark ? 'rgba(255, 255, 255, 0.4)' : (isSepia ? 'rgba(217, 119, 6, 0.45)' : 'rgba(0, 0, 0, 0.35)');
              arrow.style.transform = 'translateX(0)';
            }
          }}
        >
          {/* Free-floating Graphic/Image Thumbnail (Unboxed, No Card Frame) */}
          <div
            style={{
              width: isMobile ? '48px' : (isCompact ? '60px' : '76px'),
              height: isMobile ? '48px' : (isCompact ? '60px' : '76px'),
              minWidth: isMobile ? '48px' : (isCompact ? '60px' : '76px'),
              borderRadius: '16px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: 'transparent',
              boxShadow: 'none',
              border: 'none'
            }}
          >
            <img
              src={item.img}
              alt={item.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                borderRadius: '16px',
                filter: currentIsDark
                  ? 'drop-shadow(0 4px 14px rgba(0, 0, 0, 0.6))'
                  : 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.12))'
              }}
            />
          </div>

          {/* Title and Description */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              className="item-title"
              style={{
                margin: '0 0 6px',
                fontFamily: "'Playfair Display', serif",
                fontSize: isMobile ? '0.95rem' : (isCompact ? '1.15rem' : '1.34rem'),
                fontWeight: 700,
                color: currentIsDark ? '#ffffff' : '#111827',
                lineHeight: 1.2,
                transition: 'color 0.2s ease'
              }}
            >
              {item.title}
            </h3>
            <p
              className="item-desc"
              style={{
                margin: 0,
                fontFamily: "'Lora', serif",
                fontSize: isMobile ? '0.72rem' : (isCompact ? '0.8rem' : '0.86rem'),
                color: currentIsDark ? '#94a3b8' : (isSepia ? '#57534e' : '#64748b'),
                lineHeight: 1.42,
                transition: 'color 0.2s ease'
              }}
            >
              {item.desc}
            </p>
          </div>

          {/* Clean Right Arrow Indicator */}
          <span
            className="item-arrow"
            style={{
              color: currentIsDark ? 'rgba(255, 255, 255, 0.4)' : (isSepia ? 'rgba(217, 119, 6, 0.45)' : 'rgba(0, 0, 0, 0.35)'),
              fontSize: '1.25rem',
              transition: 'all 0.2s ease',
              display: 'inline-block',
              flexShrink: 0,
              paddingRight: '6px'
            }}
          >
            &rarr;
          </span>
        </Link>
      ))}
    </div>
  );

  const menuOverlay = (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        minHeight: '100vh',
        zIndex: 9999999,
        backgroundColor: currentIsDark
          ? '#161616'
          : (isSepia ? '#fff3e0' : '#faf8ff'),
        backgroundImage: currentIsDark
          ? `
            radial-gradient(ellipse 75% 55% at 85% 25%, rgba(219, 39, 119, 0.20) 0%, transparent 60%),
            radial-gradient(ellipse 70% 50% at 15% 15%, rgba(147, 51, 234, 0.16) 0%, transparent 60%)
          `
          : (isSepia
            ? `
              radial-gradient(ellipse 75% 55% at 85% 25%, rgba(217, 119, 6, 0.08) 0%, transparent 60%),
              radial-gradient(ellipse 70% 50% at 15% 15%, rgba(180, 83, 9, 0.06) 0%, transparent 60%)
            `
            : `
              radial-gradient(ellipse 75% 55% at 85% 25%, rgba(219, 39, 119, 0.10) 0%, transparent 60%),
              radial-gradient(ellipse 70% 50% at 15% 15%, rgba(147, 51, 234, 0.10) 0%, transparent 60%)
            `),
        backgroundAttachment: 'fixed',
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        overflowX: 'hidden',
        overflowY: 'auto',
        boxSizing: 'border-box',
        color: currentIsDark ? '#ffffff' : '#111827',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: isMobile ? '24px 18px 24px' : (isCompact ? '28px 32px 24px' : '36px 48px 32px'),
        animation: 'megaOverlayFade 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* ===================================================================== */}
      {/* 1. TOP HEADER: CENTERED LOGO + SIDE CROSS BUTTON (NAV BAR REMOVED)    */}
      {/* ===================================================================== */}
      <header
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '1360px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isMobile ? 'space-between' : 'center',
          padding: isMobile ? '4px 0 10px' : '12px 0 24px',
          boxSizing: 'border-box'
        }}
      >
        {/* Centered Brand Logo */}
        <Link
          to="/"
          onClick={onClose}
          style={{
            display: 'inline-block',
            textDecoration: 'none',
            transition: 'transform 0.2s ease'
          }}
          onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <img
            src={currentIsDark ? '/assets/icons/Zwosmos_Logo_Light.svg' : '/assets/icons/Zwosmos_Logo_Dark.svg'}
            alt="7WOSMOS - LOOK UP. THINK BEYOND."
            style={{
              width: isMobile ? '140px' : (isCompact ? '260px' : '340px'),
              maxWidth: '75vw',
              height: 'auto',
              display: 'block',
              margin: isMobile ? '0' : '0 auto',
              filter: currentIsDark ? 'drop-shadow(0 6px 24px rgba(0, 0, 0, 0.75))' : 'none'
            }}
          />
        </Link>

        {/* Side Cross (✕) Close Button */}
        <button
          type="button"
          onClick={onClose}
          title="Close Mega Menu (Esc)"
          style={{
            position: isMobile ? 'relative' : 'absolute',
            right: '0px',
            top: isMobile ? 'auto' : '50%',
            transform: isMobile ? 'none' : 'translateY(-50%)',
            background: currentIsDark
              ? 'rgba(255, 255, 255, 0.08)'
              : (isSepia ? '#fde8c8' : 'rgba(0, 0, 0, 0.05)'),
            border: currentIsDark
              ? '1px solid rgba(255, 255, 255, 0.2)'
              : (isSepia ? '1px solid rgba(217, 119, 6, 0.4)' : '1px solid rgba(0, 0, 0, 0.12)'),
            borderRadius: '50%',
            width: isMobile ? '38px' : '44px',
            height: isMobile ? '38px' : '44px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isSepia ? '#78350f' : (currentIsDark ? '#ffffff' : '#111827'),
            transition: 'all 0.2s ease',
            boxShadow: isSepia
              ? '0 2px 8px rgba(217, 119, 6, 0.15)'
              : (currentIsDark ? '0 4px 16px rgba(0, 0, 0, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.1)')
          }}
          onMouseOver={e => {
            e.currentTarget.style.background = isSepia ? '#d97706' : 'rgba(219, 39, 119, 0.25)';
            e.currentTarget.style.borderColor = isSepia ? '#b45309' : 'rgba(219, 39, 119, 0.6)';
            e.currentTarget.style.transform = isMobile ? 'scale(1.1)' : 'translateY(-50%) scale(1.1)';
            const svg = e.currentTarget.querySelector('svg');
            if (svg && isSepia) svg.setAttribute('stroke', '#ffffff');
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = currentIsDark ? 'rgba(255, 255, 255, 0.08)' : (isSepia ? '#fde8c8' : 'rgba(0, 0, 0, 0.05)');
            e.currentTarget.style.borderColor = currentIsDark ? 'rgba(255, 255, 255, 0.2)' : (isSepia ? 'rgba(217, 119, 6, 0.4)' : 'rgba(0, 0, 0, 0.12)');
            e.currentTarget.style.transform = isMobile ? 'scale(1)' : 'translateY(-50%) scale(1)';
            const svg = e.currentTarget.querySelector('svg');
            if (svg) svg.setAttribute('stroke', isSepia ? '#78350f' : (currentIsDark ? '#ffffff' : '#111827'));
          }}
        >
          <svg
            width={isMobile ? "18" : "22"}
            height={isMobile ? "18" : "22"}
            viewBox="0 0 24 24"
            fill="none"
            stroke={isSepia ? "#78350f" : (currentIsDark ? "#ffffff" : "#111827")}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </header>

      {/* ===================================================================== */}
      {/* 2. THE 9 MENU ITEMS IN 3 SPACIOUS COLUMNS (NO BOXES, SPACED OUT)       */}
      {/* ===================================================================== */}
      <main
        style={{
          position: 'relative',
          zIndex: 5,
          width: '100%',
          maxWidth: '1360px',
          margin: '0 auto',
          padding: isMobile ? '8px 0 16px' : (isCompact ? '24px 0 36px' : '40px 0 60px'),
          boxSizing: 'border-box',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
            gap: isMobile ? '16px' : '0px'
          }}
        >
          {renderColumn(column1, true, false)}
          {renderColumn(column2, true, true)}
          {renderColumn(column3, false, true)}
        </div>
      </main>

      {/* ===================================================================== */}
      {/* 3. FOOTER ROW (A UNIVERSE OF KNOWLEDGE + SOCIAL MEDIA ICONS)         */}
      {/* ===================================================================== */}
      <footer
        style={{
          position: 'relative',
          zIndex: 5,
          width: '100%',
          maxWidth: '1360px',
          margin: '0 auto',
          paddingTop: '20px',
          boxSizing: 'border-box',
          borderTop: currentIsDark ? '1px solid rgba(255, 255, 255, 0.08)' : (isSepia ? '1px solid rgba(217, 119, 6, 0.18)' : '1px solid rgba(0, 0, 0, 0.08)'),
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: '14px'
        }}
      >
        {/* Left: Tagline */}
        <div>
          <div
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '2.5px',
              color: currentIsDark ? '#64748b' : (isSepia ? '#b45309' : '#94a3b8'),
              textTransform: 'uppercase',
              marginBottom: '4px'
            }}
          >
            A Universe of Knowledge
          </div>
          <div
            style={{
              fontFamily: "'Lora', serif",
              fontSize: '0.82rem',
              color: currentIsDark ? '#94a3b8' : (isSepia ? '#78350f' : '#475569')
            }}
          >
            Explore. Learn. Be Inspired.
          </div>
        </div>

        {/* Right: Dynamic Social Media Icons (Configured via Dashboard Settings) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
          {[
            {
              id: 'instagram',
              name: 'Instagram',
              href: settings.socialInstagram || 'https://instagram.com/zwosmos',
              svg: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              )
            },
            {
              id: 'facebook',
              name: 'Facebook',
              href: settings.socialFacebook || 'https://facebook.com/zwosmos',
              svg: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              )
            },
            {
              id: 'twitter',
              name: 'X (Twitter)',
              href: settings.socialTwitter || 'https://x.com/zwosmos',
              svg: (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              )
            },
            {
              id: 'linkedin',
              name: 'LinkedIn',
              href: settings.socialLinkedin || 'https://linkedin.com/company/zwosmos',
              svg: (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64c-.87 0-1.58.7-1.58 1.58a1.58 1.58 0 0 0 1.58 1.58c.87 0 1.57-.7 1.57-1.58a1.57 1.57 0 0 0-1.57-1.58z" />
                </svg>
              )
            },
            {
              id: 'youtube',
              name: 'YouTube',
              href: settings.socialYoutube || 'https://youtube.com/@zwosmos',
              svg: (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              )
            }
          ]
            .filter(item => Boolean(item.href?.trim()))
            .map(social => (
              <a
                key={social.id}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                title={social.name}
                aria-label={social.name}
                style={{
                  color: currentIsDark ? '#ffffff' : (isSepia ? '#78350f' : '#374151'),
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.color = isSepia ? '#d97706' : '#c084fc';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.color = currentIsDark ? '#ffffff' : (isSepia ? '#78350f' : '#374151');
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {social.svg}
              </a>
            ))}
        </div>
      </footer>
    </div>
  );

  return createPortal(menuOverlay, document.body);
};

export default MegaMenu;
