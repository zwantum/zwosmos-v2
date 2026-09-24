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
  const { isLight, isSepia, isDark } = useTheme();

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
    if (isSmallPhone) return '230px';
    if (isHorizontal) return horizontalIsRow ? '140px' : '160px';
    if (isFeatured) return '270px';
    if (isWide) return '280px';
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
        marginLeft: (isHorizontal && !isSmallPhone) ? (isMobile ? '10px' : '14px') : (isMobile ? '18px' : '22px'),
        marginBottom: (isHorizontal && !isSmallPhone) ? '0' : '8px',
        height: isSmallPhone ? 'auto' : '100%',
        flex: (isHorizontal && !isSmallPhone) ? '1 1 0px' : (isFeatured && !isSmallPhone) ? '1 1 auto' : 'none',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Link
        to={`/blog/${id}`}
        style={{
          textDecoration: 'none',
          color: 'inherit',
          display: 'flex',
          flexDirection: 'column',
          height: isSmallPhone ? 'auto' : '100%',
          flex: isSmallPhone ? 'none' : 1
        }}
      >
        <div
          style={{
            cursor: 'pointer',
            height: isSmallPhone ? 'auto' : '100%',
            flex: isSmallPhone ? 'none' : 1,
            background: (isHorizontal && !isSmallPhone)
              ? (isDark ? 'rgba(255, 255, 255, 0.02)' : (isSepia ? '#fef6ea' : '#ffffff'))
              : 'transparent',
            borderRadius: (isHorizontal && !isSmallPhone) ? '12px' : '0px',
            border: (isHorizontal && !isSmallPhone)
              ? (isDark ? '1px solid rgba(147, 51, 234, 0.22)' : (isSepia ? '1px solid rgba(217, 119, 6, 0.28)' : '1px solid #e5e7eb'))
              : 'none',
            padding: (isHorizontal && !isSmallPhone)
              ? '12px 14px'
              : isFeatured
              ? '0'
              : (isSmallPhone ? '8px 2px' : '10px 4px 12px 4px'),
            display: 'flex',
            flexDirection: horizontalIsRow ? 'row' : 'column',
            gap: (isHorizontal && !isSmallPhone) ? '14px' : '0',
            alignItems: (isHorizontal && !isSmallPhone && horizontalIsRow) ? 'center' : 'stretch',
            boxSizing: 'border-box',
            transition: 'background 0.3s ease, border-color 0.3s ease, transform 0.3s ease'
          }}
          onMouseOver={e => {
            const w = e.currentTarget.querySelector('.wireframe') as HTMLElement;
            const t = e.currentTarget.querySelector('.tabs') as HTMLElement;
            if (w) w.style.transform = 'translate(0, 0)';
            if (t) t.style.transform = 'translate(-50%, 0)';
            if (isHorizontal && !isSmallPhone) {
              e.currentTarget.style.borderColor = 'var(--brand-purple)';
              e.currentTarget.style.background = isDark
                ? 'rgba(147, 51, 234, 0.08)'
                : (isSepia ? 'rgba(253, 232, 200, 0.85)' : 'rgba(147, 51, 234, 0.06)');
            }
          }}
          onMouseOut={e => {
            const w = e.currentTarget.querySelector('.wireframe') as HTMLElement;
            const t = e.currentTarget.querySelector('.tabs') as HTMLElement;
            if (w) w.style.transform = 'translate(-12px, 12px)';
            if (t) t.style.transform = 'translate(calc(-50% - 12px), 12px)';
            if (isHorizontal && !isSmallPhone) {
              e.currentTarget.style.borderColor = isDark ? 'rgba(147, 51, 234, 0.2)' : (isSepia ? 'rgba(217, 119, 6, 0.28)' : '#e5e7eb');
              e.currentTarget.style.background = isDark ? 'rgba(255, 255, 255, 0.02)' : (isSepia ? '#fef6ea' : '#ffffff');
            }
          }}
        >
          {/* Image & Signature Wireframe Block */}
          <div
            style={{
              position: 'relative',
              width: (isHorizontal && !isSmallPhone && horizontalIsRow) ? '140px' : '100%',
              height: getImageHeight(),
              marginBottom: (isHorizontal && !isSmallPhone) ? (horizontalIsRow ? '0' : '14px') : '22px',
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
                border: isSepia ? '1px solid rgba(217, 119, 6, 0.45)' : '1px solid var(--brand-purple)',
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
                top: (isHorizontal && !isSmallPhone) ? '14px' : '20px',
                left: 0,
                transform: 'translate(calc(-50% - 12px), 12px)',
                zIndex: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: (isHorizontal && !isSmallPhone) ? '8px' : '12px',
                transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}
            >
              <div
                style={{
                  background: isDark ? '#4C0086' : (isSepia ? '#fde8c8' : '#ffffff'),
                  border: isSepia ? '1px solid rgba(217, 119, 6, 0.45)' : '1px solid var(--brand-purple)',
                  borderRadius: '20px',
                  padding: (isHorizontal && !isSmallPhone) ? '10px 4px' : '15px 5px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  color: isSepia ? '#78350f' : (isLight ? '#111827' : 'white'),
                  fontFamily: '"Noto Sans", sans-serif',
                  fontSize: (isHorizontal && !isSmallPhone) ? '0.72rem' : '0.8rem',
                  fontWeight: 400,
                  letterSpacing: '1px',
                  boxShadow: isSepia ? '0 2px 8px rgba(217, 119, 6, 0.15)' : (isLight ? '0 2px 8px rgba(0,0,0,0.1)' : '0 4px 10px rgba(0,0,0,0.5)')
                }}
              >
                {category}
              </div>

              {(!isHorizontal || isSmallPhone) && (
                <div
                  title="Share"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isDark ? 'var(--bg-main)' : (isSepia ? '#fde8c8' : '#ffffff'),
                    border: isSepia ? '1px solid rgba(217, 119, 6, 0.45)' : '1px solid var(--brand-purple)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: isSepia ? '#78350f' : (isLight ? '#374151' : 'white'),
                    boxShadow: isSepia ? '0 2px 8px rgba(217, 119, 6, 0.15)' : (isLight ? '0 2px 8px rgba(0,0,0,0.1)' : '0 4px 10px rgba(0,0,0,0.5)'),
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
              flex: isSmallPhone ? 'none' : 1,
              justifyContent: (isHorizontal && !isSmallPhone) ? 'space-between' : 'flex-start',
              width: '100%'
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: getTitleSize(),
                  margin: (isHorizontal && !isSmallPhone) ? '0 0 6px 0' : '0 0 10px 0',
                  lineHeight: 1.25,
                  fontFamily: "'Playfair Display', serif",
                  color: isLight ? '#111827' : '#ffffff',
                  minHeight: (isHorizontal || isMobile || isFeatured || isSmallPhone) ? 'auto' : '62px'
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
                    fontSize: (isHorizontal && !isSmallPhone) ? '0.74rem' : '0.78rem',
                    color: isLight ? '#6b7280' : 'rgba(255, 255, 255, 0.55)',
                    fontFamily: '"Noto Sans", sans-serif',
                    margin: (isHorizontal && !isSmallPhone) ? '0 0 8px 0' : '0 0 14px 0',
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
                    fontSize: (isHorizontal && !isSmallPhone) ? '0.84rem' : isFeatured ? '1.02rem' : '0.95rem',
                    lineHeight: (isHorizontal && !isSmallPhone) ? 1.45 : 1.6,
                    margin: (isHorizontal && !isSmallPhone) ? '0 0 10px 0' : isFeatured ? '0 0 16px 0' : '0 0 16px 0',
                    fontFamily: "'Lora', serif",
                    display: '-webkit-box',
                    WebkitLineClamp: (isHorizontal && !isSmallPhone) ? 2 : 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    wordBreak: 'break-word'
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
                marginTop: isSmallPhone ? '12px' : 'auto'
              }}
            >
              <span
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  color: '#bd75ff',
                  fontFamily: '"Noto Sans", sans-serif',
                  fontSize: (isHorizontal && !isSmallPhone) ? '0.78rem' : '0.86rem',
                  fontWeight: 400,
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                Read More ↗
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};
