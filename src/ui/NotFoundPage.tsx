import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useMobile } from '../contexts/MobileContext';
import Header from './Header';
import Footer from './Footer';
import { Compass, BookOpen, Sparkles, ArrowRight, Radio, Orbit, Telescope, Globe } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const { isLight } = useTheme();
  const { isMobile } = useMobile();

  useEffect(() => {
    document.title = '404 - Cosmic Void | Zwosmos';
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  const categories = [
    {
      title: 'Space News',
      desc: 'Latest missions, rocket launches & astronomy headlines',
      icon: Radio,
      path: '/space-news',
      color: '#38bdf8'
    },
    {
      title: 'Solar System',
      desc: 'Exploring planets, moons, asteroids & planetary science',
      icon: Orbit,
      path: '/solar-system',
      color: '#fbbf24'
    },
    {
      title: 'The Universe',
      desc: 'Deep cosmos, nebulae, black holes & relativistic physics',
      icon: Globe,
      path: '/universe',
      color: '#c084fc'
    },
    {
      title: 'Telescopes & Tech',
      desc: 'JWST breakthroughs, observatories & spaceflight optics',
      icon: Telescope,
      path: '/telescopes-technology',
      color: '#34d399'
    }
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: isLight ? '#f8fafc' : '#080712',
        backgroundImage: isLight
          ? 'radial-gradient(ellipse at 50% 15%, rgba(147, 51, 234, 0.08) 0%, transparent 60%)'
          : `
            radial-gradient(circle at 50% 20%, rgba(147, 51, 234, 0.18) 0%, transparent 55%),
            radial-gradient(circle at 15% 50%, rgba(56, 189, 248, 0.08) 0%, transparent 45%),
            radial-gradient(circle at 85% 60%, rgba(236, 72, 153, 0.08) 0%, transparent 45%)
          `,
        color: isLight ? '#0f172a' : '#ffffff',
        fontFamily: "'Inter', sans-serif",
        transition: 'background-color 0.3s ease, color 0.3s ease'
      }}
    >
      <Header />

      {/* Main 404 Hero Container */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '40px 18px 60px' : '60px 24px 90px',
          maxWidth: '1100px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
          textAlign: 'center'
        }}
      >
        {/* Pulsing Cosmic Anomaly Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '9999px',
            background: isLight ? 'rgba(147, 51, 234, 0.08)' : 'rgba(168, 85, 247, 0.12)',
            border: isLight ? '1px solid rgba(147, 51, 234, 0.25)' : '1px solid rgba(168, 85, 247, 0.35)',
            marginBottom: '20px',
            boxShadow: '0 0 20px rgba(168, 85, 247, 0.15)'
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#a855f7',
              boxShadow: '0 0 10px #a855f7',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}
          />
          <span
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '0.75rem',
              letterSpacing: '2px',
              fontWeight: 600,
              color: isLight ? '#7e22ce' : '#c084fc',
              textTransform: 'uppercase'
            }}
          >
            Cosmic Anomaly Detected
          </span>
        </div>

        {/* Big Cosmic 404 Display */}
        <div
          style={{
            position: 'relative',
            margin: '0 0 10px 0',
            lineHeight: 1
          }}
        >
          <h1
            style={{
              fontSize: isMobile ? '5.5rem' : '9.5rem',
              fontWeight: 900,
              fontFamily: "'Orbitron', sans-serif",
              letterSpacing: isMobile ? '-2px' : '-4px',
              margin: 0,
              background: isLight
                ? 'linear-gradient(135deg, #7e22ce 0%, #a855f7 40%, #0284c7 100%)'
                : 'linear-gradient(135deg, #c084fc 0%, #e879f9 35%, #38bdf8 80%, #ffffff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: isLight
                ? 'drop-shadow(0 4px 12px rgba(126, 34, 206, 0.2))'
                : 'drop-shadow(0 0 35px rgba(168, 85, 247, 0.45))'
            }}
          >
            404
          </h1>
        </div>

        {/* Editorial Headline */}
        <h2
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: isMobile ? '1.75rem' : '2.5rem',
            fontWeight: 700,
            margin: '0 0 16px 0',
            color: isLight ? '#0f172a' : '#ffffff',
            letterSpacing: '-0.01em'
          }}
        >
          Lost in Deep Space
        </h2>

        {/* Poetic Description */}
        <p
          style={{
            maxWidth: '620px',
            fontSize: isMobile ? '0.95rem' : '1.1rem',
            lineHeight: 1.65,
            color: isLight ? '#475569' : 'rgba(255, 255, 255, 0.7)',
            margin: '0 auto 36px',
            fontFamily: "'Lora', Georgia, serif"
          }}
        >
          The celestial coordinates you followed seem to lead into an uncharted cosmic void. The star system,
          article, or page you are searching for might have drifted beyond our observable event horizon.
        </p>

        {/* Primary Action Buttons */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '14px',
            marginBottom: isMobile ? '50px' : '70px'
          }}
        >
          {/* Home Galaxy Button */}
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '9px',
              padding: '13px 28px',
              borderRadius: '30px',
              background: 'linear-gradient(135deg, #9333ea 0%, #7928ca 100%)',
              color: '#ffffff',
              textDecoration: 'none',
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '0.82rem',
              fontWeight: 600,
              letterSpacing: '1px',
              boxShadow: '0 4px 20px rgba(147, 51, 234, 0.4)',
              transition: 'all 0.25s ease'
            }}
            onMouseOver={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 26px rgba(147, 51, 234, 0.6)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(147, 51, 234, 0.4)';
            }}
          >
            <Compass size={17} />
            RETURN TO HOME GALAXY
          </Link>

          {/* Explore Blog Button */}
          <Link
            to="/blog"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '9px',
              padding: '13px 26px',
              borderRadius: '30px',
              background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
              border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
              color: isLight ? '#334155' : '#ffffff',
              textDecoration: 'none',
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '0.82rem',
              fontWeight: 600,
              letterSpacing: '1px',
              transition: 'all 0.25s ease',
              boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.04)' : 'none'
            }}
            onMouseOver={e => {
              e.currentTarget.style.borderColor = 'var(--brand-purple)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.background = isLight ? 'rgba(147, 51, 234, 0.06)' : 'rgba(147, 51, 234, 0.15)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.borderColor = isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.05)';
            }}
          >
            <BookOpen size={17} />
            EXPLORE ARTICLES
          </Link>

          {/* Browse Library Button */}
          <Link
            to="/books"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '9px',
              padding: '13px 26px',
              borderRadius: '30px',
              background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
              border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
              color: isLight ? '#334155' : '#ffffff',
              textDecoration: 'none',
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '0.82rem',
              fontWeight: 600,
              letterSpacing: '1px',
              transition: 'all 0.25s ease',
              boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.04)' : 'none'
            }}
            onMouseOver={e => {
              e.currentTarget.style.borderColor = '#38bdf8';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.background = isLight ? 'rgba(56, 189, 248, 0.08)' : 'rgba(56, 189, 248, 0.15)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.borderColor = isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.05)';
            }}
          >
            <Sparkles size={17} />
            COSMIC BOOKS
          </Link>
        </div>

        {/* Star System Navigation Matrix */}
        <div style={{ width: '100%', maxWidth: '980px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '28px'
            }}
          >
            <div style={{ height: '1px', flex: 1, maxWidth: '100px', background: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.12)' }} />
            <span
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '0.78rem',
                letterSpacing: '2px',
                color: isLight ? '#64748b' : 'rgba(255, 255, 255, 0.5)',
                textTransform: 'uppercase'
              }}
            >
              Chart a New Course
            </span>
            <div style={{ height: '1px', flex: 1, maxWidth: '100px', background: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.12)' }} />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: '16px',
              textAlign: 'left'
            }}
          >
            {categories.map(cat => {
              const IconComp = cat.icon;
              return (
                <Link
                  key={cat.path}
                  to={cat.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '20px 22px',
                    borderRadius: '14px',
                    background: isLight ? '#ffffff' : 'rgba(18, 14, 33, 0.65)',
                    border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.25s ease',
                    boxShadow: isLight ? '0 2px 10px rgba(0, 0, 0, 0.03)' : '0 4px 20px rgba(0, 0, 0, 0.2)'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.borderColor = cat.color;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = isLight
                      ? '0 6px 18px rgba(0, 0, 0, 0.08)'
                      : `0 8px 25px -5px ${cat.color}25`;
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.borderColor = isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = isLight
                      ? '0 2px 10px rgba(0, 0, 0, 0.03)'
                      : '0 4px 20px rgba(0, 0, 0, 0.2)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        background: `${cat.color}15`,
                        border: `1px solid ${cat.color}35`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: cat.color,
                        flexShrink: 0
                      }}
                    >
                      <IconComp size={20} />
                    </div>
                    <div>
                      <h3
                        style={{
                          margin: '0 0 4px 0',
                          fontSize: '1.02rem',
                          fontWeight: 700,
                          fontFamily: "'Inter', sans-serif",
                          color: isLight ? '#0f172a' : '#ffffff'
                        }}
                      >
                        {cat.title}
                      </h3>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.84rem',
                          color: isLight ? '#64748b' : 'rgba(255, 255, 255, 0.55)',
                          lineHeight: 1.4
                        }}
                      >
                        {cat.desc}
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    size={18}
                    color={cat.color}
                    style={{ flexShrink: 0, marginLeft: '12px' }}
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFoundPage;
