import React, { useRef, useState, useCallback, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { DailyCosmicData } from '../lib/cosmicService';

interface ShareCosmicModalProps {
  cosmic: DailyCosmicData;
  onClose: () => void;
}

// Strip HTML tags to get plain text for the share card
function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

export const ShareCosmicModal: React.FC<ShareCosmicModalProps> = ({ cosmic, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [tooltip, setTooltip] = useState('');
  const [winWidth, setWinWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 480
  );

  useEffect(() => {
    const onResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isMobile = winWidth < 480;

  // Card width: fill available space on mobile, fixed 340 on desktop
  // Modal padding is 16px each side on mobile, 24px on desktop
  const modalPad = isMobile ? 16 : 24;
  const CARD_W = Math.min(winWidth - modalPad * 2 - 16, 340);
  const CARD_H = Math.round(CARD_W * (1500 / 1200));

  // Icon button size
  const iconBtnSize = isMobile ? 32 : 38;
  const iconSize = isMobile ? 13 : 15;

  const plainContent = stripHtml(cosmic.astronomyContent);
  const svgBg = '/assets/icons/Zwosmos_ThisDayInAstronomy_BaseTemplate.svg';

  useEffect(() => {
    // Check if browser supports Web Share API with file sharing
    try {
      const testFile = new File([''], 'test.png', { type: 'image/png' });
      setCanNativeShare(
        'share' in navigator &&
        'canShare' in navigator &&
        !!(navigator as any).canShare({ files: [testFile] })
      );
    } catch {
      setCanNativeShare(false);
    }
  }, []);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Generate PNG from the card element with full SVG template composited
  const generatePng = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    setIsGenerating(true);
    const card = cardRef.current;
    const cardBgImg = card.querySelector('img');

    try {
      // 1. Ensure the background SVG image is loaded and ready to draw
      const svgImg = new Image();
      svgImg.crossOrigin = 'anonymous';
      svgImg.src = svgBg;
      await new Promise<void>((resolve, reject) => {
        if (svgImg.complete && svgImg.naturalWidth > 0) {
          resolve();
        } else {
          svgImg.onload = () => resolve();
          svgImg.onerror = () => reject(new Error('Failed to load background SVG'));
        }
      });

      // 2. Hide the SVG img in the card DOM temporarily so html2canvas renders only the sharp text overlay
      if (cardBgImg) cardBgImg.style.visibility = 'hidden';

      const scale = 1200 / card.offsetWidth;
      const textCanvas = await html2canvas(card, {
        scale: scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('zw-share-card-inner');
          if (el) el.style.transform = 'none';
        }
      });

      // Restore SVG visibility in the live DOM
      if (cardBgImg) cardBgImg.style.visibility = 'visible';

      // 3. Composite onto native high-res 1200×1500 canvas
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = 1200;
      finalCanvas.height = 1500;
      const ctx = finalCanvas.getContext('2d');
      if (!ctx) return null;

      // Rounded clipping path matching card's border radius
      const r = 50;
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(1200 - r, 0);
      ctx.quadraticCurveTo(1200, 0, 1200, r);
      ctx.lineTo(1200, 1500 - r);
      ctx.quadraticCurveTo(1200, 1500, 1200 - r, 1500);
      ctx.lineTo(r, 1500);
      ctx.quadraticCurveTo(0, 1500, 0, 1500 - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();
      ctx.clip();

      // Draw SVG base template (includes "THIS DAY IN ASTRONOMY", glowing planet, stars, sunset, footer)
      ctx.drawImage(svgImg, 0, 0, 1200, 1500);

      // Draw dynamic text overlay (Date, Subtitle, and Content) perfectly positioned on top
      ctx.drawImage(textCanvas, 0, 0, 1200, 1500);

      return await new Promise<Blob | null>((resolve) => {
        finalCanvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
      });
    } catch (err) {
      console.error('generatePng composite error:', err);
      return null;
    } finally {
      if (cardBgImg) cardBgImg.style.visibility = 'visible';
      setIsGenerating(false);
    }
  }, [svgBg]);

  const showToast = (msg: string) => {
    setTooltip(msg);
    setTimeout(() => setTooltip(''), 2200);
  };

  // Download PNG
  const handleDownload = useCallback(async () => {
    const blob = await generatePng();
    if (!blob) { setShareStatus('error'); return; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zwosmos-this-day-in-astronomy-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded!');
    setShareStatus('success');
    setTimeout(() => setShareStatus('idle'), 2500);
  }, [generatePng]);

  // Native share (mobile)
  const handleNativeShare = useCallback(async () => {
    const blob = await generatePng();
    if (!blob) { setShareStatus('error'); return; }
    const file = new File([blob], 'zwosmos-this-day-in-astronomy.png', { type: 'image/png' });
    try {
      await (navigator as any).share({
        title: `This Day in Astronomy — ${cosmic.astronomyDate}`,
        text: `${cosmic.astronomySubtitle || ''}\n\nzwosmos.com`,
        files: [file]
      });
      showToast('Shared!');
    } catch (err: any) {
      if (err?.name !== 'AbortError') handleDownload();
    }
  }, [generatePng, cosmic, handleDownload]);

  // Copy to clipboard
  const handleCopyImage = useCallback(async () => {
    const blob = await generatePng();
    if (!blob) { setShareStatus('error'); return; }
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      showToast('Copied to clipboard!');
    } catch {
      handleDownload();
    }
  }, [generatePng, handleDownload]);

  // WhatsApp
  const handleWhatsApp = useCallback(async () => {
    if (canNativeShare) return handleNativeShare();
    await handleDownload();
    const text = encodeURIComponent(
      `This Day in Astronomy — ${cosmic.astronomyDate}\n${cosmic.astronomySubtitle || ''}\n\nzwosmos.com`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }, [canNativeShare, handleNativeShare, handleDownload, cosmic]);

  // Twitter/X
  const handleTwitter = useCallback(async () => {
    if (canNativeShare) return handleNativeShare();
    await handleDownload();
    const text = encodeURIComponent(
      `This Day in Astronomy — ${cosmic.astronomyDate}${cosmic.astronomySubtitle ? ` | ${cosmic.astronomySubtitle}` : ''} zwosmos.com`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  }, [canNativeShare, handleNativeShare, handleDownload, cosmic]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 20, 0.85)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '0' : '20px',
          overflow: 'hidden'
        }}
      >
        {/* Modal panel */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: 'linear-gradient(160deg, #0e0b2e 0%, #1a0f3e 60%, #0e0b2e 100%)',
            border: '1px solid rgba(147, 51, 234, 0.3)',
            borderRadius: isMobile ? '16px' : '22px',
            padding: `${modalPad}px ${modalPad}px ${isMobile ? 14 : 20}px`,
            width: isMobile ? '100%' : `${CARD_W + 48}px`,
            maxWidth: isMobile ? `calc(100vw - 16px)` : '96vw',
            maxHeight: '94vh',
            overflowY: 'auto',
            overflowX: 'hidden',
            boxShadow: '0 28px 70px rgba(0,0,0,0.85), 0 0 48px rgba(147,51,234,0.18)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: isMobile ? '12px' : '16px',
            position: 'relative',
            boxSizing: 'border-box'
          }}
        >
          {/* ── Header ── */}
          <div style={{ width: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{
                margin: 0,
                fontFamily: "'Playfair Display', serif",
                fontSize: isMobile ? '1rem' : '1.2rem',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '0.01em'
              }}>
                Share This Day in Astronomy
              </h2>
            </div>
            <button
              id="zw-share-modal-close"
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '50%',
                width: isMobile ? '28px' : '34px',
                height: isMobile ? '28px' : '34px',
                color: 'rgba(255,255,255,0.7)',
                fontSize: isMobile ? '0.85rem' : '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.2s',
                marginLeft: '8px'
              }}
              onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
              onMouseOut={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            >
              ✕
            </button>
          </div>

          {/* ── Card Preview (full content, no clipping) ── */}
          <div
            id="zw-share-card-inner"
            ref={cardRef}
            style={{
              width: `${CARD_W}px`,
              height: `${CARD_H}px`,
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '14px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.75)',
              flexShrink: 0
            }}
          >
            {/* SVG Background */}
            <img
              src={svgBg}
              alt=""
              crossOrigin="anonymous"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'top center',
                display: 'block'
              }}
            />

            {/* Dynamic content overlay — positioned proportionally to the 1200×1500 canvas */}
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              // top ~23% = where date area starts in the SVG; bottom 24% = footer/logo area
              paddingTop: `${CARD_H * 0.23}px`,
              paddingBottom: `${CARD_H * 0.24}px`,
              paddingLeft: `${CARD_W * 0.08}px`,
              paddingRight: `${CARD_W * 0.08}px`,
              boxSizing: 'border-box',
              gap: `${CARD_H * 0.018}px`
            }}>
              {/* Date */}
              <p style={{
                margin: 0,
                fontFamily: "'Playfair Display', Georgia, serif",
                fontWeight: 700,
                fontSize: `${CARD_W * 0.044}px`,
                color: '#ffffff',
                textAlign: 'center',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                lineHeight: 1.2,
                textShadow: '0 2px 10px rgba(0,0,0,0.8)',
                flexShrink: 0
              }}>
                {cosmic.astronomyDate}
              </p>

              {/* Subtitle */}
              {cosmic.astronomySubtitle && cosmic.astronomySubtitle.trim() && (
                <p style={{
                  margin: 0,
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontWeight: 600,
                  fontStyle: 'italic',
                  fontSize: `${CARD_W * 0.036}px`,
                  color: 'rgba(255,255,255,0.82)',
                  textAlign: 'center',
                  lineHeight: 1.3,
                  textShadow: '0 2px 8px rgba(0,0,0,0.7)',
                  flexShrink: 0
                }}>
                  {cosmic.astronomySubtitle}
                </p>
              )}

              {/* Body — full content, no ellipsis, auto font-size to fit */}
              <p style={{
                margin: 0,
                fontFamily: "'Lora', Georgia, 'Times New Roman', serif",
                fontSize: `${CARD_W * 0.031}px`,
                color: 'rgba(255,255,255,0.87)',
                textAlign: 'center',
                lineHeight: 1.62,
                textShadow: '0 1px 6px rgba(0,0,0,0.8)',
                // No overflow, no clamp — show everything
                overflow: 'visible',
                flexShrink: 1
              }}>
                {plainContent}
              </p>
            </div>
          </div>

          {/* ── Share icon-only row ── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isMobile ? '7px' : '10px',
            flexWrap: 'wrap',
            width: '100%',
            paddingTop: '2px'
          }}>
            {/* Native share — mobile only */}
            {canNativeShare && (
              <IconBtn
                id="zw-share-native"
                title="Share image"
                color="#7c3aed"
                hoverColor="#6d28d9"
                onClick={handleNativeShare}
                disabled={isGenerating}
                size={iconBtnSize}
                icon={
                  <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                }
              />
            )}

            {/* WhatsApp */}
            <IconBtn
              id="zw-share-whatsapp"
              title="WhatsApp"
              color="#25D366"
              hoverColor="#128C7E"
              onClick={handleWhatsApp}
              disabled={isGenerating}
              size={iconBtnSize}
              icon={
                <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              }
            />

            {/* Twitter/X */}
            <IconBtn
              id="zw-share-twitter"
              title="Twitter / X"
              color="#000000"
              hoverColor="#1a1a1a"
              onClick={handleTwitter}
              disabled={isGenerating}
              size={iconBtnSize}
              icon={
                <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              }
            />

            {/* Instagram */}
            <IconBtn
              id="zw-share-instagram"
              title="Instagram"
              color="#E1306C"
              hoverColor="#c13584"
              onClick={handleNativeShare}
              disabled={isGenerating}
              size={iconBtnSize}
              icon={
                <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                </svg>
              }
            />

            {/* Facebook */}
            <IconBtn
              id="zw-share-facebook"
              title="Facebook"
              color="#1877F2"
              hoverColor="#0f5ecb"
              onClick={async () => {
                if (canNativeShare) return handleNativeShare();
                await handleDownload();
                window.open('https://www.facebook.com/sharer/sharer.php?u=https://zwosmos.com', '_blank');
              }}
              disabled={isGenerating}
              size={iconBtnSize}
              icon={
                <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              }
            />

            {/* Copy image */}
            <IconBtn
              id="zw-share-copy-image"
              title="Copy image"
              color="#6366f1"
              hoverColor="#4f46e5"
              onClick={handleCopyImage}
              disabled={isGenerating}
              size={iconBtnSize}
              icon={
                <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              }
            />

            {/* Download */}
            <IconBtn
              id="zw-share-download"
              title="Download PNG"
              color="#f59e0b"
              hoverColor="#d97706"
              onClick={handleDownload}
              disabled={isGenerating}
              size={iconBtnSize}
              icon={
                <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              }
            />
          </div>

          {/* ── Status toast ── */}
          {(tooltip || shareStatus === 'error') && (
            <div style={{
              fontSize: '0.8rem',
              color: shareStatus === 'error' ? '#f87171' : '#4ade80',
              textAlign: 'center',
              padding: '2px 0 0',
              transition: 'opacity 0.3s'
            }}>
              {shareStatus === 'error' ? '✗ Something went wrong — try Download PNG' : `✓ ${tooltip}`}
            </div>
          )}

          {/* Generating indicator */}
          {isGenerating && (
            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', textAlign: 'center' }}>
              Generating image…
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ── Icon-only circle button ──────────────────────────────────────────────────
interface IconBtnProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  hoverColor: string;
  onClick: () => void;
  disabled?: boolean;
  size?: number;
}

const IconBtn: React.FC<IconBtnProps> = ({ id, title, icon, color, hoverColor, onClick, disabled, size = 38 }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      id={id}
      title={title}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: hovered ? hoverColor : color,
        border: 'none',
        color: '#ffffff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.18s, transform 0.15s, box-shadow 0.18s',
        transform: hovered && !disabled ? 'translateY(-2px) scale(1.08)' : 'scale(1)',
        boxShadow: hovered && !disabled ? `0 6px 18px ${color}80` : `0 2px 6px ${color}44`,
        flexShrink: 0
      }}
    >
      {icon}
    </button>
  );
};

export default ShareCosmicModal;
