import React, { useState, useEffect } from 'react';
import { useMobile } from '../contexts/MobileContext';
import { useTheme } from '../contexts/ThemeContext';

export const DailyCosmicSection: React.FC = () => {
  const { isMobile } = useMobile();
  const { isLight } = useTheme();

  const [winWidth, setWinWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const onResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const isSmallPhone = winWidth < 641;
  const isSmallTab   = winWidth >= 641 && winWidth < 800;
  const isLargeView = winWidth >= 800;
  const isDesktop   = winWidth >= 1025;

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
        {/* LEFT MODULE: THIS DAY IN ASTRONOMY (Border Card with 2 Outer Dots)  */}
        {/* =================================================================== */}
        <div
          style={{
            position: 'relative',
            border: isLight ? '1.5px solid #d1d5db' : '1.5px solid rgba(255, 255, 255, 0.75)',
            borderRadius: '22px',
            padding: isMobile ? '28px 24px' : '36px 34px',
            background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.015)',
            boxShadow: isLight ? '0 4px 20px rgba(0, 0, 0, 0.06)' : 'none',
            boxSizing: 'border-box',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={e => {
            e.currentTarget.style.borderColor = isLight ? 'var(--brand-purple)' : 'rgba(216, 180, 254, 0.9)';
            e.currentTarget.style.boxShadow = isLight
              ? '0 8px 24px rgba(0, 0, 0, 0.10)'
              : '0 12px 36px rgba(0, 0, 0, 0.4), 0 0 24px rgba(147, 51, 234, 0.2)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.borderColor = isLight ? '#d1d5db' : 'rgba(255, 255, 255, 0.75)';
            e.currentTarget.style.boxShadow = isLight ? '0 4px 20px rgba(0, 0, 0, 0.06)' : 'none';
          }}
        >
          {/* Top Circular White Pin overlapping left border */}
          <div
            style={{
              position: 'absolute',
              left: '-9px',
              top: '46px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: isLight ? 'var(--brand-purple)' : '#ffffff',
              boxShadow: isLight
                ? '0 0 10px rgba(147, 51, 234, 0.6)'
                : '0 0 10px rgba(255, 255, 255, 0.9), 0 0 16px rgba(168, 85, 247, 0.6)'
            }}
          />

          {/* Bottom Circular White Pin overlapping left border */}
          <div
            style={{
              position: 'absolute',
              left: '-9px',
              top: '92px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: isLight ? 'var(--brand-purple)' : '#ffffff',
              boxShadow: isLight
                ? '0 0 10px rgba(147, 51, 234, 0.6)'
                : '0 0 10px rgba(255, 255, 255, 0.9), 0 0 16px rgba(168, 85, 247, 0.6)'
            }}
          />

          {/* Title */}
          <h3
            style={{
              margin: '0 0 6px',
              fontFamily: "'Playfair Display', serif",
              fontSize: isMobile ? '1.35rem' : '1.6rem',
              fontWeight: 700,
              color: isLight ? '#111827' : '#ffffff',
              lineHeight: 1.2
            }}
          >
            This Day in <em style={{ fontStyle: 'italic', color: isLight ? 'var(--brand-purple)' : '#ffffff' }}>Astronomy</em>
          </h3>

          {/* Complete Date Below Title (Small Text) */}
          <div
            style={{
              margin: '0 0 14px',
              fontFamily: "'Lora', serif",
              fontSize: '0.82rem',
              fontWeight: 500,
              color: isLight ? 'var(--brand-purple)' : '#d8b4fe',
              letterSpacing: '0.5px'
            }}
          >
            September 18, 1977
          </div>

          {/* Description */}
          <p
            style={{
              margin: 0,
              fontFamily: "'Lora', serif",
              fontSize: isMobile ? '0.9rem' : '0.98rem',
              lineHeight: 1.68,
              color: isLight ? '#4b5563' : '#cbd5e1'
            }}
          >
            On this day in 1977, Voyager 1 looked back across millions of miles of deep space to capture the first-ever image of the Earth and Moon together in a single frame—a luminous blue jewel paired with its companion, poised against the silent cosmic abyss.
          </p>
        </div>

        {/* =================================================================== */}
        {/* CENTER DIVIDER: EQUIDISTANT BETWEEN LEFT CARD AND RIGHT MODULE     */}
        {/* =================================================================== */}
        {!isSmallPhone && (
          <div
            style={{
              width: '3px',
              height: '140px',
              background: isLight
                ? 'linear-gradient(to bottom, var(--brand-purple) 0%, rgba(219, 39, 119, 0.9) 100%)'
                : 'linear-gradient(to bottom, #ffffff 0%, var(--brand-purple) 50%, rgba(219, 39, 119, 0.9) 100%)',
              borderRadius: '3px',
              boxShadow: '0 0 12px rgba(168, 85, 247, 0.5)',
              justifySelf: 'center',
              alignSelf: 'center',
              flexShrink: 0
            }}
          />
        )}

        {/* =================================================================== */}
        {/* RIGHT MODULE: SPACE FACT OF THE DAY                                */}
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
                background: isLight
                  ? 'linear-gradient(to bottom, var(--brand-purple) 0%, rgba(219, 39, 119, 0.8) 100%)'
                  : 'linear-gradient(to bottom, #ffffff 0%, var(--brand-purple) 60%, rgba(219, 39, 119, 0.8) 100%)',
                borderRadius: '3px',
                boxShadow: '0 0 12px rgba(168, 85, 247, 0.5)',
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
              SPACE FACT OF THE DAY
            </h3>

            <p
              style={{
                margin: 0,
                fontFamily: "'Lora', serif",
                fontSize: isMobile ? '0.9rem' : '0.98rem',
                lineHeight: 1.68,
                color: isLight ? '#4b5563' : '#cbd5e1'
              }}
            >
              If two pieces of the same type of metal touch in the vacuum of space, they will bond permanently into a single solid piece through cold welding. On Earth, a thin oxide film keeps metal atoms apart, but in the pure void, the atoms have no idea they belong to different pieces.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DailyCosmicSection;
