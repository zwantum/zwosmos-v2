import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import './ScrollToTopButton.css';

export default function ScrollToTopButton() {
  const { isLight } = useTheme();
  const [isLaunching, setIsLaunching] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      const rootEl = document.getElementById('root');
      const currentScroll = Math.max(
        window.scrollY || 0,
        window.pageYOffset || 0,
        document.documentElement.scrollTop || 0,
        document.body.scrollTop || 0,
        rootEl?.scrollTop || 0
      );

      // Show after a few scrolls / small height (120px)
      if (currentScroll > 120) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Initial check on mount
    checkScroll();

    // Use capture phase so scrolls inside any nested containers (like #root) are caught
    window.addEventListener('scroll', checkScroll, true);
    document.addEventListener('scroll', checkScroll, true);
    window.addEventListener('wheel', checkScroll, { passive: true });
    window.addEventListener('touchmove', checkScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', checkScroll, true);
      document.removeEventListener('scroll', checkScroll, true);
      window.removeEventListener('wheel', checkScroll);
      window.removeEventListener('touchmove', checkScroll);
    };
  }, []);

  const scrollToTop = () => {
    if (isLaunching) return;
    setIsLaunching(true);

    try {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } catch {
      window.scrollTo(0, 0);
    }

    try {
      document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      document.documentElement.scrollTop = 0;
    }

    try {
      document.body.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      document.body.scrollTop = 0;
    }

    const rootEl = document.getElementById('root');
    if (rootEl) {
      try {
        rootEl.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        rootEl.scrollTop = 0;
      }
    }

    // Reset rocket launch state after animation finishes
    setTimeout(() => {
      setIsLaunching(false);
    }, 850);
  };

  return (
    <button
      type="button"
      id="zwosmos-scroll-to-top"
      className={`scroll-to-top-btn ${isLight ? 'light-mode' : ''} ${isVisible ? 'is-visible' : ''} ${isLaunching ? 'is-launching' : ''}`}
      style={
        isVisible
          ? { opacity: 1, visibility: 'visible', pointerEvents: 'auto', transform: 'translateY(0) scale(1)' }
          : { opacity: 0, visibility: 'hidden', pointerEvents: 'none', transform: 'translateY(20px) scale(0.85)' }
      }
      onClick={scrollToTop}
      title="Scroll to top"
      aria-label="Scroll to top"
    >
      {/* Sleek inline SVG rocket - crisp on all screens, zero font dependencies */}
      <svg
        className={`scroll-to-top-rocket ${isLaunching ? 'launching' : ''}`}
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 2.5C12 2.5 15.5 5 15.5 10C15.5 12.8 14.5 15.2 13.7 16.5L13.7 18.5C13.7 18.8 13.5 19 13.2 19L10.8 19C10.5 19 10.3 18.8 10.3 18.5L10.3 16.5C9.5 15.2 8.5 12.8 8.5 10C8.5 5 12 2.5 12 2.5ZM12 7C11.2 7 10.5 7.7 10.5 8.5C10.5 9.3 11.2 10 12 10C12.8 10 13.5 9.3 13.5 8.5C13.5 7.7 12.8 7 12 7ZM7.5 12C6.5 13 5 15 5 17C5 17.5 5.2 18 5.7 18C6.3 18 7.5 17.2 8.2 15.8C7.8 14.6 7.6 13.3 7.5 12ZM16.5 12C16.4 13.3 16.2 14.6 15.8 15.8C16.5 17.2 17.7 18 18.3 18C18.8 18 19 17.5 19 17C19 15 17.5 13 16.5 12Z" />
        <path d="M10.8 19.5H13.2C13.2 21 12.6 22 12 22C11.4 22 10.8 21 10.8 19.5Z" fill="#fbbf24" />
      </svg>
      <span className="scroll-to-top-plume" />
    </button>
  );
}
