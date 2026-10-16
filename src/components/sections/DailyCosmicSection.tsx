import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { getActiveCosmicData, DailyCosmicData, getCachedCosmicData, getFormattedTodayIST } from '../../lib/cosmicService';
import { ShareCosmicModal } from '../common/ShareCosmicModal';

export const DailyCosmicSection: React.FC = () => {
  const { isLight, isSepia, isDark } = useTheme();

  const [winWidth, setWinWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1200));
  const [cosmic, setCosmic] = useState<DailyCosmicData>(() => getCachedCosmicData());
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareMode, setShareMode] = useState<'astronomy' | 'fact' | 'terminology'>('astronomy');

  useEffect(() => {
    const onResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Mobile and small tab view (<= 800px) use mobile sizing
  const isMobile = winWidth <= 800;

  useEffect(() => {
    let mounted = true;
    const fetchLatest = () => {
      getActiveCosmicData().then((data) => {
        if (mounted && data) {
          setCosmic(data);
        }
      });
    };

    fetchLatest();

    const handleUpdate = (e: any) => {
      if (e?.detail) {
        setCosmic(e.detail);
      } else {
        fetchLatest();
      }
    };

    window.addEventListener('zwosmos_daily_cosmic_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') fetchLatest();
    });

    // Check for scheduled rollover every 60 seconds
    const interval = setInterval(fetchLatest, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
      window.removeEventListener('zwosmos_daily_cosmic_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const isSmallPhone = winWidth < 641;
  const isSmallTab = winWidth >= 641 && winWidth < 800;
  const isLargeView = winWidth >= 800;
  const isDesktop = winWidth >= 1025;

  const renderAstronomyTitle = (title: string) => {
    if (!title) return 'This Day in Astronomy';
    if (title === 'This Day in Astronomy') {
      return (
        <>
          This Day in{' '}
          <em style={{ fontStyle: 'italic', color: isLight ? 'var(--brand-purple)' : '#ffffff' }}>
            Astronomy
          </em>
        </>
      );
    }
    if (title.endsWith(' Astronomy')) {
      const base = title.slice(0, -9);
      return (
        <>
          {base}{' '}
          <em style={{ fontStyle: 'italic', color: isLight ? 'var(--brand-purple)' : '#ffffff' }}>
            Astronomy
          </em>
        </>
      );
    }
    return title;
  };

  const factTopic =
    (cosmic.factSubtitle && cosmic.factSubtitle.trim()) ||
    (cosmic.factTitle && !/^space\s*fact(\s*of\s*the\s*day)?$/i.test(cosmic.factTitle.trim())
      ? cosmic.factTitle.trim()
      : '');

  const terminologyTopic =
    (cosmic.terminologySubtitle &&
      cosmic.terminologySubtitle.trim() &&
      !/^space\s*terminolog(y|ies)$/i.test(cosmic.terminologySubtitle.trim()))
      ? cosmic.terminologySubtitle.trim()
      : (cosmic.terminologyTitle && !/^space\s*terminolog(y|ies)$/i.test(cosmic.terminologyTitle.trim())
          ? cosmic.terminologyTitle.trim()
          : '');

  const terminologyContent =
    cosmic.terminologyContent?.trim() ||
    `<p>Gravitational lensing occurs when a massive celestial object — such as a galaxy cluster or supermassive black hole — warps the fabric of spacetime, bending and magnifying the light of distant background galaxies like a cosmic telescope.</p>`;

  // Grid columns: 3 columns on desktop (>= 1024px), 2 on tablet, 1 on mobile
  const gridTemplateCols =
    winWidth >= 1024
      ? 'repeat(3, minmax(0, 1fr))'
      : winWidth >= 720
        ? 'repeat(2, minmax(0, 1fr))'
        : '1fr';

  return (
    <>
      <section
        style={{
          position: 'relative',
          width: '100%',
          background: 'transparent',
          backgroundColor: 'transparent',
          padding: isDesktop
            ? '18px 32px 30px'
            : isLargeView
              ? '8px 32px 24px'
              : isSmallPhone
                ? '20px 16px 10px'
                : isSmallTab
                  ? '10px 28px 20px'
                  : '10px 32px 30px',
          boxSizing: 'border-box',
          zIndex: 10,
        }}
      >
        <style>{`
        .zw-cosmic-rich-content {
          font-synthesis: weight style !important;
        }
        .zw-cosmic-rich-content p {
          margin: 0 0 0.85em 0;
        }
        .zw-cosmic-rich-content p:last-child {
          margin-bottom: 0;
        }
        .zw-cosmic-rich-content a {
          color: ${isLight ? 'var(--brand-purple)' : '#d8b4fe'};
          text-decoration: underline;
        }
        .zw-cosmic-rich-content strong,
        .zw-cosmic-rich-content b {
          font-weight: 700 !important;
        }
        .zw-cosmic-rich-content u {
          text-decoration: underline !important;
          text-decoration-color: ${isLight ? 'var(--brand-purple)' : '#c084fc'} !important;
          text-underline-offset: 4px;
        }
        .zw-cosmic-rich-content em,
        .zw-cosmic-rich-content i,
        .zw-cosmic-rich-content cite,
        .zw-cosmic-rich-content [style*="font-style: italic"],
        .zw-cosmic-rich-content [style*="font-style:italic"] {
          font-style: italic !important;
          display: inline !important;
        }
        .zw-cosmic-rich-content strong em,
        .zw-cosmic-rich-content em strong,
        .zw-cosmic-rich-content b i,
        .zw-cosmic-rich-content i b {
          font-weight: 700 !important;
          font-style: italic !important;
        }
        .zw-cosmic-scrollable {
          scrollbar-width: thin;
          scrollbar-color: ${isLight
            ? 'rgba(147, 51, 234, 0.45) rgba(0, 0, 0, 0.05)'
            : 'rgba(168, 85, 247, 0.5) rgba(255, 255, 255, 0.06)'
          };
        }
        .zw-cosmic-scrollable::-webkit-scrollbar {
          width: 5px;
        }
        .zw-cosmic-scrollable::-webkit-scrollbar-track {
          background: ${isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.06)'};
          border-radius: 4px;
        }
        .zw-cosmic-scrollable::-webkit-scrollbar-thumb {
          background: ${isLight ? 'rgba(147, 51, 234, 0.45)' : 'rgba(168, 85, 247, 0.5)'};
          border-radius: 4px;
        }
        .zw-cosmic-scrollable::-webkit-scrollbar-thumb:hover {
          background: ${isLight ? 'var(--brand-purple)' : '#c084fc'};
        }
      `}</style>

        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: isSmallPhone ? '28px' : '40px',
          }}
        >
          {/* ========================================================================================= */}
          {/* 3-COLUMN ROW: THIS DAY IN ASTRONOMY | ONE FACT, EVERYDAY | NEW TERMINOLOGY, EVERYDAY     */}
          {/* ========================================================================================= */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: gridTemplateCols,
              gap: isSmallPhone ? '28px' : '22px',
              alignItems: 'stretch',
            }}
          >
            {/* ------------------------------------------------------------- */}
            {/* 1. THIS DAY IN ASTRONOMY (With Date Pill & Share Button)      */}
            {/* ------------------------------------------------------------- */}
            <div
              style={{
                position: 'relative',
                marginLeft: isSmallPhone ? '18px' : '22px',
                boxSizing: 'border-box',
                display: 'flex',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  border: isSepia ? '1.5px solid rgba(217, 119, 6, 0.4)' : '1.5px solid var(--brand-purple)',
                  borderRadius: '16px',
                  padding: isMobile ? '26px 18px 24px 26px' : '30px 22px 28px 28px',
                  background: isDark ? 'rgba(255, 255, 255, 0.015)' : (isSepia ? '#fef6ea' : '#ffffff'),
                  boxShadow: isLight
                    ? (isSepia ? '0 4px 20px rgba(217, 119, 6, 0.08)' : '0 4px 20px rgba(0, 0, 0, 0.06)')
                    : '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(147, 51, 234, 0.2)',
                  boxSizing: 'border-box',
                  transition: 'all 0.3s ease',
                  width: '100%',
                  aspectRatio: '4 / 5',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = isLight
                    ? (isSepia ? '0 8px 24px rgba(217, 119, 6, 0.16)' : '0 8px 24px rgba(147, 51, 234, 0.15)')
                    : '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 28px rgba(147, 51, 234, 0.35)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = isLight
                    ? (isSepia ? '0 4px 20px rgba(217, 119, 6, 0.08)' : '0 4px 20px rgba(0, 0, 0, 0.06)')
                    : '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(147, 51, 234, 0.2)';
                }}
              >
                {/* Signature Floating Sidebar Tabs on the Left Border */}
                <div
                  style={{
                    position: 'absolute',
                    top: isMobile ? '16px' : '22px',
                    left: 0,
                    transform: 'translateX(-50%)',
                    zIndex: 5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                    pointerEvents: 'none',
                  }}
                >
                  {/* Date Pill Tab */}
                  <div
                    style={{
                      background: isDark ? '#4C0086' : (isSepia ? '#fde8c8' : '#ffffff'),
                      border: isSepia ? '1.5px solid rgba(217, 119, 6, 0.45)' : '1.5px solid var(--brand-purple)',
                      borderRadius: '20px',
                      padding: '14px 6px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      writingMode: 'vertical-rl',
                      transform: 'rotate(180deg)',
                      color: isSepia ? '#78350f' : (isLight ? '#111827' : '#ffffff'),
                      fontSize: '0.72rem',
                      fontWeight: 400,
                      letterSpacing: '1.2px',
                      textTransform: 'uppercase',
                      boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.1)' : '0 4px 12px rgba(0,0,0,0.6)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cosmic.astronomyDate}
                  </div>

                  {/* Share Icon Button */}
                  <button
                    id="zw-this-day-share-btn"
                    title="Share This Day in Astronomy as image"
                    onClick={() => {
                      setShareMode('astronomy');
                      setShowShareModal(true);
                    }}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isDark ? '#080711' : (isSepia ? '#fde8c8' : '#ffffff'),
                      border: isSepia ? '1.5px solid rgba(217, 119, 6, 0.45)' : '1.5px solid var(--brand-purple)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      color: isSepia ? '#b45309' : (isLight ? 'var(--brand-purple)' : '#ffffff'),
                      boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.1)' : '0 4px 12px rgba(0,0,0,0.6)',
                      cursor: 'pointer',
                      pointerEvents: 'all',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      padding: 0,
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'scale(1.15)';
                      e.currentTarget.style.boxShadow = isLight
                        ? '0 4px 14px rgba(147,51,234,0.35)'
                        : '0 4px 14px rgba(147,51,234,0.55)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = isLight
                        ? '0 2px 8px rgba(0,0,0,0.1)'
                        : '0 4px 12px rgba(0,0,0,0.6)';
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                  </button>
                </div>

                {/* Dynamic Title */}
                <h3
                  style={{
                    margin: '0 0 8px',
                    fontFamily: "'Playfair Display', serif",
                    fontSize: isMobile ? '1.25rem' : '1.38rem',
                    fontWeight: 700,
                    color: isLight ? '#111827' : '#ffffff',
                    lineHeight: 1.22,
                  }}
                >
                  {renderAstronomyTitle(cosmic.astronomyTitle)}
                </h3>

                {/* Dynamic Event Subtitle */}
                {cosmic.astronomySubtitle && cosmic.astronomySubtitle.trim() && (
                  <h4
                    style={{
                      margin: '0 0 10px',
                      fontFamily: "'Playfair Display', serif",
                      fontSize: isMobile ? '0.98rem' : '1.05rem',
                      fontWeight: 600,
                      fontStyle: 'italic',
                      color: isSepia ? '#92400e' : (isLight ? 'var(--brand-purple)' : '#bd75ff'),
                      lineHeight: 1.3,
                    }}
                  >
                    {cosmic.astronomySubtitle}
                  </h4>
                )}

                {/* Dynamic Rich Text Description (Scrollable) */}
                <div
                  className="zw-cosmic-rich-content zw-cosmic-scrollable"
                  style={{
                    margin: 0,
                    fontFamily: "'Lora', Georgia, 'Times New Roman', serif",
                    fontSynthesis: 'weight style',
                    fontSize: isMobile ? '0.88rem' : '0.93rem',
                    lineHeight: 1.64,
                    color: isLight ? '#4b5563' : '#cbd5e1',
                    overflowY: 'auto',
                    paddingRight: '6px',
                    flex: 1,
                    minHeight: 0,
                  }}
                  dangerouslySetInnerHTML={{ __html: cosmic.astronomyContent }}
                />
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* 2. SPACE FACT OF THE DAY (With "One Fact, Everyday" Pill)    */}
            {/* ------------------------------------------------------------- */}
            <div
              style={{
                position: 'relative',
                marginLeft: isSmallPhone ? '18px' : '22px',
                boxSizing: 'border-box',
                display: 'flex',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  border: isSepia ? '1.5px solid rgba(217, 119, 6, 0.4)' : '1.5px solid var(--brand-purple)',
                  borderRadius: '16px',
                  padding: isMobile ? '26px 18px 24px 26px' : '30px 22px 28px 28px',
                  background: isDark ? 'rgba(255, 255, 255, 0.015)' : (isSepia ? '#fef6ea' : '#ffffff'),
                  boxShadow: isLight
                    ? (isSepia ? '0 4px 20px rgba(217, 119, 6, 0.08)' : '0 4px 20px rgba(0, 0, 0, 0.06)')
                    : '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(147, 51, 234, 0.2)',
                  boxSizing: 'border-box',
                  transition: 'all 0.3s ease',
                  width: '100%',
                  aspectRatio: '4 / 5',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = isLight
                    ? (isSepia ? '0 8px 24px rgba(217, 119, 6, 0.16)' : '0 8px 24px rgba(147, 51, 234, 0.15)')
                    : '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 28px rgba(147, 51, 234, 0.35)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = isLight
                    ? (isSepia ? '0 4px 20px rgba(217, 119, 6, 0.08)' : '0 4px 20px rgba(0, 0, 0, 0.06)')
                    : '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(147, 51, 234, 0.2)';
                }}
              >
                {/* Signature Floating Sidebar Tabs on the Left Border */}
                <div
                  style={{
                    position: 'absolute',
                    top: isMobile ? '16px' : '22px',
                    left: 0,
                    transform: 'translateX(-50%)',
                    zIndex: 5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                    pointerEvents: 'none',
                  }}
                >
                  {/* One Fact, Everyday Pill Tab */}
                  <div
                    style={{
                      background: isDark ? '#4C0086' : (isSepia ? '#fde8c8' : '#ffffff'),
                      border: isSepia ? '1.5px solid rgba(217, 119, 6, 0.45)' : '1.5px solid var(--brand-purple)',
                      borderRadius: '20px',
                      padding: '14px 6px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      writingMode: 'vertical-rl',
                      transform: 'rotate(180deg)',
                      color: isSepia ? '#78350f' : (isLight ? '#111827' : '#ffffff'),
                      fontSize: '0.72rem',
                      fontWeight: 400,
                      letterSpacing: '1.2px',
                      textTransform: 'uppercase',
                      boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.1)' : '0 4px 12px rgba(0,0,0,0.6)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cosmic.factDate || cosmic.astronomyDate || getFormattedTodayIST()}
                  </div>

                  {/* Share Icon Button */}
                  <button
                    id="zw-space-fact-share-btn"
                    title="Share Space Fact of the Day as image"
                    onClick={() => {
                      setShareMode('fact');
                      setShowShareModal(true);
                    }}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isDark ? '#080711' : (isSepia ? '#fde8c8' : '#ffffff'),
                      border: isSepia ? '1.5px solid rgba(217, 119, 6, 0.45)' : '1.5px solid var(--brand-purple)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      color: isSepia ? '#b45309' : (isLight ? 'var(--brand-purple)' : '#ffffff'),
                      boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.1)' : '0 4px 12px rgba(0,0,0,0.6)',
                      cursor: 'pointer',
                      pointerEvents: 'all',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      padding: 0,
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'scale(1.15)';
                      e.currentTarget.style.boxShadow = isLight
                        ? '0 4px 14px rgba(147,51,234,0.35)'
                        : '0 4px 14px rgba(147,51,234,0.55)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = isLight
                        ? '0 2px 8px rgba(0,0,0,0.1)'
                        : '0 4px 12px rgba(0,0,0,0.6)';
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                  </button>
                </div>

                {/* Title: Space Fact of the Day */}
                <h3
                  style={{
                    margin: '0 0 8px',
                    fontFamily: "'Playfair Display', serif",
                    fontSize: isMobile ? '1.25rem' : '1.38rem',
                    fontWeight: 700,
                    color: isLight ? '#111827' : '#ffffff',
                    lineHeight: 1.22,
                  }}
                >
                  Space Fact of the{' '}
                  <em style={{ fontStyle: 'italic', color: isLight ? 'var(--brand-purple)' : '#ffffff' }}>
                    Day
                  </em>
                </h3>

                {/* Dynamic Topic Subtitle */}
                {factTopic && (
                  <h4
                    style={{
                      margin: '0 0 10px',
                      fontFamily: "'Playfair Display', serif",
                      fontSize: isMobile ? '0.98rem' : '1.05rem',
                      fontWeight: 600,
                      fontStyle: 'italic',
                      color: isSepia ? '#92400e' : (isLight ? 'var(--brand-purple)' : '#bd75ff'),
                      lineHeight: 1.3,
                    }}
                  >
                    {factTopic}
                  </h4>
                )}

                {/* Dynamic Rich Text Description (Scrollable) */}
                <div
                  className="zw-cosmic-rich-content zw-cosmic-scrollable"
                  style={{
                    margin: 0,
                    fontFamily: "'Lora', Georgia, 'Times New Roman', serif",
                    fontSynthesis: 'weight style',
                    fontSize: isMobile ? '0.88rem' : '0.93rem',
                    lineHeight: 1.64,
                    color: isLight ? '#4b5563' : '#cbd5e1',
                    overflowY: 'auto',
                    paddingRight: '6px',
                    flex: 1,
                    minHeight: 0,
                  }}
                  dangerouslySetInnerHTML={{ __html: cosmic.factContent || '' }}
                />
              </div>
            </div>

            {/* ------------------------------------------------------------------------- */}
            {/* 3. NEW TERMINOLOGY, EVERYDAY (With "One Term, Everyday" Pill)             */}
            {/* ------------------------------------------------------------------------- */}
            <div
              style={{
                position: 'relative',
                marginLeft: isSmallPhone ? '18px' : '22px',
                boxSizing: 'border-box',
                display: 'flex',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  border: isSepia ? '1.5px solid rgba(217, 119, 6, 0.4)' : '1.5px solid var(--brand-purple)',
                  borderRadius: '16px',
                  padding: isMobile ? '26px 18px 24px 26px' : '30px 22px 28px 28px',
                  background: isDark ? 'rgba(255, 255, 255, 0.015)' : (isSepia ? '#fef6ea' : '#ffffff'),
                  boxShadow: isLight
                    ? (isSepia ? '0 4px 20px rgba(217, 119, 6, 0.08)' : '0 4px 20px rgba(0, 0, 0, 0.06)')
                    : '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(147, 51, 234, 0.2)',
                  boxSizing: 'border-box',
                  transition: 'all 0.3s ease',
                  width: '100%',
                  aspectRatio: '4 / 5',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = isLight
                    ? (isSepia ? '0 8px 24px rgba(217, 119, 6, 0.16)' : '0 8px 24px rgba(147, 51, 234, 0.15)')
                    : '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 28px rgba(147, 51, 234, 0.35)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = isLight
                    ? (isSepia ? '0 4px 20px rgba(217, 119, 6, 0.08)' : '0 4px 20px rgba(0, 0, 0, 0.06)')
                    : '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(147, 51, 234, 0.2)';
                }}
              >
                {/* Signature Floating Sidebar Tabs on the Left Border */}
                <div
                  style={{
                    position: 'absolute',
                    top: isMobile ? '16px' : '22px',
                    left: 0,
                    transform: 'translateX(-50%)',
                    zIndex: 5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                    pointerEvents: 'none',
                  }}
                >
                  {/* One Term, Everyday Pill Tab */}
                  <div
                    style={{
                      background: isDark ? '#4C0086' : (isSepia ? '#fde8c8' : '#ffffff'),
                      border: isSepia ? '1.5px solid rgba(217, 119, 6, 0.45)' : '1.5px solid var(--brand-purple)',
                      borderRadius: '20px',
                      padding: '14px 6px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      writingMode: 'vertical-rl',
                      transform: 'rotate(180deg)',
                      color: isSepia ? '#78350f' : (isLight ? '#111827' : '#ffffff'),
                      fontSize: '0.72rem',
                      fontWeight: 400,
                      letterSpacing: '1.2px',
                      textTransform: 'uppercase',
                      boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.1)' : '0 4px 12px rgba(0,0,0,0.6)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    New Terminology, Everyday
                  </div>
                  <button
                    id="zw-terminology-share-btn"
                    title="Share Space Terminologies as image"
                    onClick={() => {
                      setShareMode('terminology');
                      setShowShareModal(true);
                    }}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isDark ? '#080711' : (isSepia ? '#fde8c8' : '#ffffff'),
                      border: isSepia ? '1.5px solid rgba(217, 119, 6, 0.45)' : '1.5px solid var(--brand-purple)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      color: isSepia ? '#b45309' : (isLight ? 'var(--brand-purple)' : '#ffffff'),
                      boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.1)' : '0 4px 12px rgba(0,0,0,0.6)',
                      cursor: 'pointer',
                      pointerEvents: 'all',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      padding: 0,
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'scale(1.15)';
                      e.currentTarget.style.boxShadow = isLight
                        ? '0 4px 14px rgba(147,51,234,0.35)'
                        : '0 4px 14px rgba(147,51,234,0.55)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = isLight
                        ? '0 2px 8px rgba(0,0,0,0.1)'
                        : '0 4px 12px rgba(0,0,0,0.6)';
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                  </button>
                </div>

                {/* Title: Space Terminologies */}
                <h3
                  style={{
                    margin: '0 0 8px',
                    fontFamily: "'Playfair Display', serif",
                    fontSize: isMobile ? '1.25rem' : '1.38rem',
                    fontWeight: 700,
                    color: isLight ? '#111827' : '#ffffff',
                    lineHeight: 1.22,
                  }}
                >
                  Space{' '}
                  <em style={{ fontStyle: 'italic', color: isLight ? 'var(--brand-purple)' : '#ffffff' }}>
                    Terminologies
                  </em>
                </h3>

                {/* Dynamic Topic Subtitle */}
                {terminologyTopic && (
                  <h4
                    style={{
                      margin: '0 0 10px',
                      fontFamily: "'Playfair Display', serif",
                      fontSize: isMobile ? '0.98rem' : '1.05rem',
                      fontWeight: 600,
                      fontStyle: 'italic',
                      color: isSepia ? '#92400e' : (isLight ? 'var(--brand-purple)' : '#bd75ff'),
                      lineHeight: 1.3,
                    }}
                  >
                    {terminologyTopic}
                  </h4>
                )}

                {/* Dynamic Rich Text Description (Scrollable) */}
                <div
                  className="zw-cosmic-rich-content zw-cosmic-scrollable"
                  style={{
                    margin: 0,
                    fontFamily: "'Lora', Georgia, 'Times New Roman', serif",
                    fontSynthesis: 'weight style',
                    fontSize: isMobile ? '0.88rem' : '0.93rem',
                    lineHeight: 1.64,
                    color: isLight ? '#4b5563' : '#cbd5e1',
                    overflowY: 'auto',
                    paddingRight: '6px',
                    flex: 1,
                    minHeight: 0,
                  }}
                  dangerouslySetInnerHTML={{ __html: terminologyContent }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Share Modal */}
      {showShareModal && (
        <ShareCosmicModal
          cosmic={cosmic}
          mode={shareMode}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  );
};

export default DailyCosmicSection;
