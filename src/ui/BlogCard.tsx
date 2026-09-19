import { Link } from 'react-router-dom';
import { useMobile } from '../contexts/MobileContext';
import { useTheme } from '../contexts/ThemeContext';
import { useState, useEffect } from 'react';

export interface BlogCardProps {
  id: string | number;
  category: string;
  title: string;
  desc?: string;
  img: string;
  authorName?: string;
  authorImg?: string;
  date?: string;
  variant?: 'standard' | 'featured' | 'horizontal' | 'wide';
  showExcerpt?: boolean;
}

export const BlogCard = ({
  id,
  category,
  title,
  desc = '',
  img,
  authorName,
  date,
  variant = 'standard',
  showExcerpt = true
}: BlogCardProps) => {
  const { isMobile } = useMobile();
  const { isLight } = useTheme();

  // Detect tablet width (641–900px) — iPad Mini sits here but is flagged isMobile=true
  const [winWidth, setWinWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const onResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const isSmallPhone = winWidth < 641;
  const isTablet = winWidth >= 641 && winWidth < 1024;
  const isHorizontal = variant === 'horizontal';
  const isFeatured = variant === 'featured';
  const isWide = variant === 'wide';

  // On tablet/desktop, horizontal cards use row layout (image left, text right)
  const horizontalIsRow = isHorizontal && (isTablet || winWidth >= 1024);

  // Image heights based on variant
  const getImageHeight = () => {
    if (isHorizontal) return horizontalIsRow ? '140px' : '160px';
    if (isFeatured) return isSmallPhone ? '230px' : '270px';
    if (isWide) return isSmallPhone ? '220px' : '280px';
    return '240px';
  };

  // Title font size based on variant
  const getTitleSize = () => {
    // On small phones: all variants share the same size
    if (isSmallPhone) return '1.25rem';
    // On tablet: unified size slightly bigger
    if (isTablet) return isHorizontal ? '1.05rem' : '1.25rem';
    // On desktop: each variant has its own distinct size
    if (isHorizontal) return '1.02rem';
    if (isFeatured) return '1.85rem';
    if (isWide) return '1.75rem';
    return '1.55rem';
  };

  return (
    <div
      style={{
        position: 'relative',
        marginLeft: isHorizontal ? (isMobile ? '10px' : '14px') : (isMobile ? '18px' : '22px'),
        marginBottom: (isHorizontal || isFeatured) ? '0' : '8px',
        height: '100%',
        flex: isHorizontal ? '1 1 0px' : isFeatured ? '1 1 auto' : 'none',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Link
        to={`/blog/${id}`}
        style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}
      >
        <div
          style={{
            cursor: 'pointer',
            height: '100%',
            flex: 1,
            background: isHorizontal ? (isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.02)') : 'transparent',
            borderRadius: '12px',
            border: isHorizontal ? (isLight ? '1px solid #e5e7eb' : '1px solid rgba(147, 51, 234, 0.22)') : 'none',
            padding: isHorizontal
              ? '12px 14px'
              : isFeatured
              ? '0'
              : (isSmallPhone ? '8px 2px' : '10px 4px 12px 4px'),
            display: 'flex',
            flexDirection: horizontalIsRow ? 'row' : 'column',
            gap: isHorizontal ? '14px' : '0',
            alignItems: isHorizontal ? 'center' : 'stretch',
            boxSizing: 'border-box',
            transition: 'background 0.3s ease, border-color 0.3s ease, transform 0.3s ease'
          }}
          onMouseOver={e => {
            const w = e.currentTarget.querySelector('.wireframe') as HTMLElement;
            const t = e.currentTarget.querySelector('.tabs') as HTMLElement;
            if (w) w.style.transform = 'translate(0, 0)';
            if (t) t.style.transform = 'translate(-50%, 0)';
            if (isHorizontal) {
              e.currentTarget.style.borderColor = 'var(--brand-purple)';
              e.currentTarget.style.background = isLight ? 'rgba(147, 51, 234, 0.06)' : 'rgba(147, 51, 234, 0.08)';
            }
          }}
          onMouseOut={e => {
            const w = e.currentTarget.querySelector('.wireframe') as HTMLElement;
            const t = e.currentTarget.querySelector('.tabs') as HTMLElement;
            if (w) w.style.transform = 'translate(-12px, 12px)';
            if (t) t.style.transform = 'translate(calc(-50% - 12px), 12px)';
            if (isHorizontal) {
              e.currentTarget.style.borderColor = isLight ? '#e5e7eb' : 'rgba(147, 51, 234, 0.2)';
              e.currentTarget.style.background = isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.015)';
            }
          }}
        >
          {/* Image & Signature Wireframe Block */}
          <div
            style={{
              position: 'relative',
              width: horizontalIsRow ? '140px' : '100%',
              height: getImageHeight(),
              marginBottom: isHorizontal ? (horizontalIsRow ? '0' : '14px') : '22px',
              flexShrink: 0,
              zIndex: 1
            }}
          >
            {/* Signature Purple Wireframe Border */}
            <div
              className="wireframe"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: '1px solid var(--brand-purple)',
                borderRadius: '10px',
                zIndex: 3,
                pointerEvents: 'none',
                transform: 'translate(-12px, 12px)',
                transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}
            ></div>

            {/* Signature Floating Tabs on the Left */}
            <div
              className="tabs"
              style={{
                position: 'absolute',
                top: isHorizontal ? '14px' : '20px',
                left: 0,
                transform: 'translate(calc(-50% - 12px), 12px)',
                zIndex: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: isHorizontal ? '8px' : '12px',
                transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}
            >
              <div
                style={{
                  background: isLight ? '#ffffff' : 'var(--bg-main)',
                  border: '1px solid var(--brand-purple)',
                  borderRadius: '20px',
                  padding: isHorizontal ? '10px 4px' : '15px 5px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  color: isLight ? '#111827' : 'white',
                  fontSize: isHorizontal ? '0.72rem' : '0.8rem',
                  fontWeight: 'bold',
                  letterSpacing: '1px',
                  boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.1)' : '0 4px 10px rgba(0,0,0,0.5)'
                }}
              >
                {category}
              </div>

              {!isHorizontal && (
                <div
                  title="Share"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isLight ? '#ffffff' : 'var(--bg-main)',
                    border: '1px solid var(--brand-purple)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: isLight ? '#374151' : 'white',
                    boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.1)' : '0 4px 10px rgba(0,0,0,0.5)',
                    transition: 'background 0.2s, color 0.2s, transform 0.2s'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = 'var(--brand-purple)';
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = isLight ? '#ffffff' : 'var(--bg-main)';
                    e.currentTarget.style.color = isLight ? '#374151' : 'white';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (navigator.share) {
                      navigator.share({
                        title,
                        url: `${window.location.origin}/blog/${id}`
                      }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(`${window.location.origin}/blog/${id}`);
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
              )}
            </div>

            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                zIndex: 2,
                borderRadius: '10px',
                overflow: 'hidden'
              }}
            >
              <img
                src={img}
                alt={title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>

          {/* Text Content Block */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              justifyContent: isHorizontal ? 'space-between' : 'flex-start',
              width: '100%'
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: getTitleSize(),
                  margin: isHorizontal ? '0 0 6px 0' : '0 0 10px 0',
                  lineHeight: isHorizontal ? 1.25 : 1.25,
                  fontFamily: "'Playfair Display', serif",
                  color: isLight ? '#111827' : '#ffffff',
                  minHeight: (isHorizontal || isMobile || isFeatured) ? 'auto' : '62px'
                }}
              >
                {title}
              </h3>

              {(authorName || date) && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '6px',
                    fontSize: isHorizontal ? '0.74rem' : '0.78rem',
                    color: isLight ? '#6b7280' : 'rgba(255, 255, 255, 0.55)',
                    fontFamily: "'Lora', serif",
                    margin: isHorizontal ? '0 0 8px 0' : '0 0 14px 0',
                    lineHeight: 1.3
                  }}
                >
                  {authorName && (
                    <span>
                      By{' '}
                      <span style={{ color: isLight ? '#1f2937' : 'rgba(255, 255, 255, 0.92)', fontWeight: 600 }}>
                        {authorName}
                      </span>
                    </span>
                  )}
                  {authorName && date && (
                    <span style={{ color: isLight ? '#d1d5db' : 'rgba(255, 255, 255, 0.25)', margin: '0 2px' }}>|</span>
                  )}
                  {date && <span>{date}</span>}
                </div>
              )}

              {showExcerpt && desc && (
                <p
                  style={{
                    color: isLight ? '#4b5563' : 'rgba(255,255,255,0.6)',
                    fontSize: isHorizontal ? '0.84rem' : isFeatured ? '1.02rem' : '0.95rem',
                    lineHeight: isHorizontal ? 1.45 : 1.6,
                    margin: isHorizontal ? '0 0 10px 0' : isFeatured ? '0 0 16px 0' : '0 0 16px 0',
                    fontFamily: "'Lora', serif",
                    minHeight: (isHorizontal || isMobile || isFeatured) ? 'auto' : '96px',
                    ...(isHorizontal
                      ? {
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical' as const,
                          overflow: 'hidden'
                        }
                      : {})
                  }}
                >
                  {desc}
                </p>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: isHorizontal ? 'auto' : (!showExcerpt || !desc) ? '12px' : '14px'
              }}
            >
              <button
                style={{
                  background: 'transparent',
                  border: isLight ? '1px solid #d1d5db' : '1px solid rgba(255,255,255,0.2)',
                  color: isLight ? '#374151' : 'white',
                  padding: isHorizontal ? '5px 14px' : '9px 18px',
                  borderRadius: isHorizontal ? '20px' : '30px',
                  fontFamily: "'Playfair Display', serif",
                  fontSize: isHorizontal ? '0.78rem' : '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s, border-color 0.2s, transform 0.2s, color 0.2s'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = 'var(--brand-purple)';
                  e.currentTarget.style.borderColor = 'var(--brand-purple)';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = isLight ? '#d1d5db' : 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.color = isLight ? '#374151' : 'white';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Read More
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};
