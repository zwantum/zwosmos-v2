import { useState, useEffect } from 'react';
import { MobileProvider } from './contexts/MobileContext';
import WebGLWarning from './ui/WebGLWarning';
import HeroSection from './ui/HeroSection';
import DailyCosmicSection from './ui/DailyCosmicSection';
import ContentSections from './ui/ContentSections';
import { useWebGL2Enabled } from './hooks/useWebGL2Support';
import { Analytics } from "@vercel/analytics/react";
import ErrorBoundary from './ui/ErrorBoundary';

// Preserved imports for original 3D canvas hero (currently commented out below):
// import { Canvas } from '@react-three/fiber';
// import { Preload } from '@react-three/drei';
// import { Suspense } from 'react';
// import { AssetManager } from './core/AssetManager';
// import { GLOBAL } from './config/config';
// import HeroContent from './ui/HeroContent';
// import { NoToneMapping } from 'three';
// import GalaxyScene from './scenes/Galaxy/GalaxyScene';

function AppContent() {
  const isWebGL2Enabled = useWebGL2Enabled();
  const { isLight } = useTheme();

  const [winWidth, setWinWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1200));
  useEffect(() => {
    const onResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const isSmallPhone = winWidth < 641;

  // show nothing while checking WebGL enabled
  if (isWebGL2Enabled === null) {
    return null;
  }

  // if WebGL is not enabled, show the warning
  if (isWebGL2Enabled === false) {
    return <WebGLWarning />;
  }

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: isLight ? '#ffffff' : '#080712',
        backgroundImage: isLight
          ? 'none'
          : `
            radial-gradient(ellipse 75% 45% at 50% 15%, rgba(219, 39, 119, 0.09) 0%, rgba(147, 51, 234, 0.08) 38%, transparent 75%),
            radial-gradient(ellipse 80% 45% at 50% 45%, rgba(147, 51, 234, 0.08) 0%, rgba(219, 39, 119, 0.05) 38%, transparent 75%),
            radial-gradient(ellipse 80% 45% at 50% 75%, rgba(147, 51, 234, 0.08) 0%, rgba(219, 39, 119, 0.05) 38%, transparent 75%),
            radial-gradient(circle at 50% 50%, rgba(88, 28, 135, 0.06) 0%, transparent 80%),
            linear-gradient(rgba(8, 7, 18, 0.92), rgba(8, 7, 18, 0.92)),
            url('https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=2400&auto=format&fit=crop')
          `,
        backgroundAttachment: isLight ? 'initial' : 'fixed',
        backgroundSize: isLight ? 'auto' : 'cover',
        backgroundPosition: isLight ? 'initial' : 'center center',
        color: isLight ? '#111827' : '#ffffff',
        transition: 'background-color 0.3s ease, color 0.3s ease'
      }}
    >
      {/* ========================================================================= */}
      {/* HERO SECTION (Hidden / Commented out for new layout/UI)                  */}
      {/* ========================================================================= */}
      {/*
      <div
        className="hero-section"
        style={{
          background: 'radial-gradient(ellipse at top center, rgba(147, 51, 234, 0.22) 0%, var(--bg-main) 60%)',
          backgroundColor: 'var(--bg-main)'
        }}
      >
        <Canvas
          dpr={window.devicePixelRatio}
          camera={{ position: isMobile ? GLOBAL.INITIAL_CAMERA_MOBILE_POS : GLOBAL.INITIAL_CAMERA_DESKTOP_POS, fov: isMobile ? GLOBAL.INITIAL_CAMERA_MOBILE_FOV : GLOBAL.INITIAL_CAMERA_DESKTOP_FOV }}
          style={{
            background: 'radial-gradient(ellipse at top center, rgba(147, 51, 234, 0.22) 0%, var(--bg-main) 60%)',
            backgroundColor: 'var(--bg-main)'
          }}
          gl={{
            antialias: true,
            alpha: true,
            toneMapping: NoToneMapping,
            toneMappingExposure: GLOBAL.TONE_MAPPING_EXPOSURE,
            powerPreference: 'high-performance'
          }}
        >
          <AssetManager />

          <Suspense fallback={null}>
            <GalaxyScene />
          </Suspense>

          <Preload all />
        </Canvas>

        <HeroContent />

        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: isMobile ? '160px' : '240px',
            background: 'linear-gradient(to bottom, transparent 0%, rgba(30, 30, 30, 0.3) 50%, var(--bg-main) 100%)',
            pointerEvents: 'none'
          }}
        />
      </div>
      */}

      {/* New Editorial Hero Section (On mobile, DailyCosmicSection is rendered inside HeroSection before Featured Blog Post) */}
      <HeroSection />

      {/* Daily Cosmic Modules: This Day in Astronomy & Space Fact (Tablet and Desktop only) */}
      {!isSmallPhone && <DailyCosmicSection />}

      {/* Content Sections seamlessly merged under the same background */}
      <ContentSections />
    </div>
  );
}

import BlogIndexPage from './ui/BlogIndexPage';
import BlogPostPage from './ui/BlogPostPage';
import BooksPage from './ui/BooksPage';
import CategoryPage from './ui/CategoryPage';
import ScrollToTopButton from './ui/ScrollToTopButton';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

function App() {
  return (
    <>
      <ErrorBoundary>
        <ThemeProvider>
          <MobileProvider>
            <Routes>
              <Route path="/" element={<AppContent />} />
              <Route path="/blog" element={<BlogIndexPage />} />
              <Route path="/blog/:id" element={<BlogPostPage />} />
              <Route path="/books" element={<BooksPage />} />

              {/* Direct Top-Level Category Routes: domain/{category-name} */}
              <Route path="/space-news" element={<CategoryPage slug="space-news" />} />
              <Route path="/solar-system" element={<CategoryPage slug="solar-system" />} />
              <Route path="/telescopes-technology" element={<CategoryPage slug="telescopes-technology" />} />
              <Route path="/universe" element={<CategoryPage slug="universe" />} />
              <Route path="/space-exploration" element={<CategoryPage slug="space-exploration" />} />
              <Route path="/skywatching" element={<CategoryPage slug="skywatching" />} />
              <Route path="/space-culture" element={<CategoryPage slug="space-culture" />} />
              <Route path="/learn" element={<CategoryPage slug="learn" />} />
              <Route path="/people-history" element={<CategoryPage slug="people-history" />} />

              {/* Fallback category routes */}
              <Route path="/category" element={<CategoryPage slug="space-news" />} />
              <Route path="/category/:categorySlug" element={<CategoryPage />} />
              <Route path="/blog/category/:categorySlug" element={<CategoryPage />} />
            </Routes>
            <ScrollToTopButton />
          </MobileProvider>
        </ThemeProvider>
      </ErrorBoundary>
      <Analytics />
    </>
  );
}

export default App;