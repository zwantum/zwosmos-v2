import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getCosmicData, DailyCosmicData, DEFAULT_COSMIC_DATA } from '../lib/cosmicService';

export const DailyCosmicSection: React.FC = () => {
  const { isLight, isSepia, isDark } = useTheme();

  const [winWidth, setWinWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1200));
  const [cosmic, setCosmic] = useState<DailyCosmicData>(DEFAULT_COSMIC_DATA);

  useEffect(() => {
    const onResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Only mobile and small tab view (<= 800px) use mobile sizing
  const isMobile = winWidth <= 800;

  useEffect(() => {
    let mounted = true;
    getCosmicData().then((data) => {
      if (mounted && data) {
        setCosmic(data);
      }
    });

    const handleUpdate = (e: any) => {
      if (e?.detail) {
        setCosmic(e.detail);
      } else {
        getCosmicData().then((data) => {
          if (mounted && data) setCosmic(data);
        });
      }
    };

    window.addEventListener('zwosmos_daily_cosmic_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      mounted = false;
      window.removeEventListener('zwosmos_daily_cosmic_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const isSmallPhone = winWidth < 641;
  const isSmallTab   = winWidth >= 641 && winWidth < 800;
  const isLargeView = winWidth >= 800;
  const isDesktop   = winWidth >= 1025;

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

  return (
    <section
      style={{
        position: 'relative',
        width: '100%',
        background: 'transparent',
        backgroundColor: 'transparent',
        padding: isDesktop ? '18px 32px 30px' : isLargeView ? '8px 32px 24px' : isSmallPhone ? '30px 16px' : isSmallTab ? '10px 28px 10px' : '10px 32px 50px',
        boxSizing: 'border-box',
        zIndex: 10
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
          color: ${isLight ? '#111827' : '#ffffff'} !important;
          font-weight: 700 !important;
        }
        .zw-cosmic-rich-content em,
        .zw-cosmic-rich-content i,
        .zw-cosmic-rich-content cite,
        .zw-cosmic-rich-content [style*="font-style: italic"],
        .zw-cosmic-rich-content [style*="font-style:italic"] {
          font-style: italic !important;
          color: ${isLight ? '#111827' : '#ffffff'} !important;
          display: inline !important;
        }
        .zw-cosmic-rich-content strong em,
        .zw-cosmic-rich-content em strong,
        .zw-cosmic-rich-content b i,
        .zw-cosmic-rich-content i b {
          font-weight: 700 !important;
          font-style: italic !important;
          color: ${isLight ? '#111827' : '#ffffff'} !important;
        }
        .zw-cosmic-scrollable {
          scrollbar-width: thin;
          scrollbar-color: ${isLight ? 'rgba(147, 51, 234, 0.45) rgba(0, 0, 0, 0.05)' : 'rgba(168, 85, 247, 0.5) rgba(255, 255, 255, 0.06)'};
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
          maxWidth: '1160px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isSmallPhone ? '1fr' : '1fr auto 1.15fr',
          gap: isSmallPhone ? '24px' : '38px',
          alignItems: 'center'
        }}
      >
        {/* =================================================================== */}
        {/* LEFT MODULE: THIS DAY IN ASTRONOMY (Normal Border with Sidebar Tabs)*/}
        {/* =================================================================== */}
        <div
          style={{
            position: 'relative',
            marginLeft: isSmallPhone ? '18px' : '24px',
            boxSizing: 'border-box'
          }}
        >
          {/* Main Card with Normal Border */}
          <div
            style={{
              position: 'relative',
              border: isSepia ? '1.5px solid rgba(217, 119, 6, 0.4)' : '1.5px solid var(--brand-purple)',
              borderRadius: '16px',
              padding: isMobile ? '26px 20px 24px 28px' : '34px 30px 32px 36px',
              background: isDark ? 'rgba(255, 255, 255, 0.015)' : (isSepia ? '#fef6ea' : '#ffffff'),
              boxShadow: isLight
                ? (isSepia ? '0 4px 20px rgba(217, 119, 6, 0.08)' : '0 4px 20px rgba(0, 0, 0, 0.06)')
                : '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(147, 51, 234, 0.2)',
              boxSizing: 'border-box',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={e => {
              e.currentTarget.style.boxShadow = isLight
                ? (isSepia ? '0 8px 24px rgba(217, 119, 6, 0.16)' : '0 8px 24px rgba(147, 51, 234, 0.15)')
                : '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 28px rgba(147, 51, 234, 0.35)';
            }}
            onMouseOut={e => {
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
                pointerEvents: 'none'
              }}
            >
              {/* Date Pill Tab */}
              <div
                style={{
                  background: isDark ? '#080711' : (isSepia ? '#fde8c8' : '#ffffff'),
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
                  fontWeight: 700,
                  letterSpacing: '1.2px',
                  textTransform: 'uppercase',
                  boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.1)' : '0 4px 12px rgba(0,0,0,0.6)',
                  whiteSpace: 'nowrap'
                }}
              >
                {cosmic.astronomyDate}
              </div>

              {/* Calendar Icon Button */}
              <div
                title={cosmic.astronomyDate}
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
                  boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.1)' : '0 4px 12px rgba(0,0,0,0.6)'
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
            </div>
            {/* Dynamic Title */}
            <h3
              style={{
                margin: '0 0 10px',
                fontFamily: "'Playfair Display', serif",
                fontSize: isMobile ? '1.35rem' : '1.6rem',
                fontWeight: 700,
                color: isLight ? '#111827' : '#ffffff',
                lineHeight: 1.2
              }}
            >
              {renderAstronomyTitle(cosmic.astronomyTitle)}
            </h3>

            {/* Dynamic Rich Text Description (Scrollable) */}
            <div
              className="zw-cosmic-rich-content zw-cosmic-scrollable"
              style={{
                margin: 0,
                fontFamily: "'Lora', Georgia, 'Times New Roman', serif",
                fontSynthesis: 'weight style',
                fontSize: isMobile ? '0.9rem' : '0.98rem',
                lineHeight: 1.68,
                color: isLight ? '#4b5563' : '#cbd5e1',
                maxHeight: isMobile ? '135px' : '145px',
                overflowY: 'auto',
                paddingRight: '8px'
              }}
              dangerouslySetInnerHTML={{ __html: cosmic.astronomyContent }}
            />
          </div>
        </div>

        {/* =================================================================== */}
        {/* CENTER DIVIDER: EQUIDISTANT BETWEEN LEFT CARD AND RIGHT MODULE     */}
        {/* =================================================================== */}
        {!isSmallPhone && (
          <div
            style={{
              width: '3px',
              height: '140px',
              backgroundColor: '#ffba00',
              borderRadius: '2px',
              justifySelf: 'center',
              alignSelf: 'center',
              flexShrink: 0
            }}
          />
        )}

        {/* =================================================================== */}
        {/* RIGHT MODULE: SPACE FACT OF THE DAY (Non-scrollable, full content)  */}
        {/* =================================================================== */}
        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            gap: isMobile ? '18px' : '0px'
          }}
        >
          {/* Vertical Accent Bar on Mobile only */}
          {isSmallPhone && (
            <div
              style={{
                width: '3px',
                backgroundColor: '#ffba00',
                borderRadius: '2px',
                flexShrink: 0
              }}
            />
          )}

          {/* Content */}
          <div>
            <h3
              style={{
                margin: '0 0 14px',
                fontFamily: "'Playfair Display', serif",
                fontSize: isMobile ? '1.2rem' : '1.45rem',
                fontWeight: 700,
                letterSpacing: '1.5px',
                color: isLight ? '#111827' : '#ffffff',
                textTransform: 'uppercase',
                lineHeight: 1.2
              }}
            >
              {cosmic.factTitle}
            </h3>

            <div
              className="zw-cosmic-rich-content"
              style={{
                margin: 0,
                fontFamily: "'Lora', Georgia, 'Times New Roman', serif",
                fontSynthesis: 'weight style',
                fontSize: isMobile ? '0.9rem' : '0.98rem',
                lineHeight: 1.68,
                color: isLight ? '#4b5563' : '#cbd5e1'
              }}
              dangerouslySetInnerHTML={{ __html: cosmic.factContent }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default DailyCosmicSection;
