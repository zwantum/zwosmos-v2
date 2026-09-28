import { useEffect, useLayoutEffect } from 'react';
import { MobileProvider } from './contexts/MobileContext';
import HeroSection from './ui/HeroSection';
import DailyCosmicSection from './ui/DailyCosmicSection';
import ContentSections from './ui/ContentSections';
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
  const { isLight, isSepia, isDark } = useTheme();

  // Initialize Global Open Graph and Site SEO
  useSEO();

  const isLightOrSepia = !isDark;
  const bgColor = isSepia ? '#fff3e0' : (isLight ? '#ffffff' : '#161616');

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: bgColor,
        backgroundImage: isDark
          ? `
            radial-gradient(ellipse 75% 45% at 50% 15%, rgba(219, 39, 119, 0.09) 0%, rgba(147, 51, 234, 0.08) 38%, transparent 75%),
            radial-gradient(ellipse 80% 45% at 50% 45%, rgba(147, 51, 234, 0.08) 0%, rgba(219, 39, 119, 0.05) 38%, transparent 75%),
            radial-gradient(ellipse 80% 45% at 50% 75%, rgba(147, 51, 234, 0.08) 0%, rgba(219, 39, 119, 0.05) 38%, transparent 75%),
            radial-gradient(circle at 50% 50%, rgba(88, 28, 135, 0.06) 0%, transparent 80%)
          `
          : 'none',
        backgroundAttachment: isDark ? 'fixed' : 'initial',
        backgroundSize: isDark ? 'cover' : 'auto',
        backgroundPosition: isDark ? 'center center' : 'initial',
        color: isLightOrSepia ? '#111827' : '#ffffff',
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

      {/* Editorial Hero Section (Header + Featured Blog Showcase) */}
      <HeroSection />

      {/* Daily Cosmic Modules: This Day in Astronomy & Space Fact */}
      <DailyCosmicSection />

      {/* Content Sections seamlessly merged under the same background */}
      <ContentSections />
    </div>
  );
}

import BlogIndexPage from './ui/BlogIndexPage';
import BlogPostPage from './ui/BlogPostPage';
import BooksPage from './ui/BooksPage';
import CategoryPage from './ui/CategoryPage';
import AuthorPage from './ui/AuthorPage';
import TagPage from './ui/TagPage';
import RssPage from './ui/RssPage';
import SitemapPage from './ui/SitemapPage';
import NotFoundPage from './ui/NotFoundPage';
import ScrollToTopButton from './ui/ScrollToTopButton';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { BlogProvider } from '@zwantum/blog/react';
import { blogClient } from './lib/blogClient';
import { useSEO } from './lib/seoService';

// Scrolls to the top of the page on every route change
function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useLayoutEffect(() => {
    if (!hash) {
      const resetScroll = () => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        const rootEl = document.getElementById('root');
        if (rootEl) rootEl.scrollTop = 0;
      };

      resetScroll();
      const rId = requestAnimationFrame(resetScroll);
      const timer = setTimeout(resetScroll, 50);

      return () => {
        cancelAnimationFrame(rId);
        clearTimeout(timer);
      };
    }
  }, [pathname, search, hash]);

  return null;
}

// Hard-navigates to /admin to ensure AdminApp is mounted via index.tsx
function AdminRedirect() {
  useEffect(() => {
    window.location.href = '/admin';
  }, []);
  return null;
}

function App() {
  return (
    <>
      <ErrorBoundary>
        <ThemeProvider>
          <MobileProvider>
            <BlogProvider client={blogClient}>
                <ScrollToTop />
              <Routes>
                <Route path="/" element={<AppContent />} />
                <Route path="/blog" element={<BlogIndexPage />} />
                <Route path="/blog/:id" element={<BlogPostPage />} />
                <Route path="/books" element={<BooksPage />} />

                {/* RSS 2.0 Feed Routes */}
                <Route path="/rss.xml" element={<RssPage />} />
                <Route path="/rss" element={<RssPage />} />

                {/* Sitemap Routes */}
                <Route path="/sitemap" element={<SitemapPage />} />
                <Route path="/sitemap.xml" element={<SitemapPage />} />
                <Route path="/sitemap.html" element={<SitemapPage />} />

                {/* Direct Top-Level Category Routes: domain/{category-name} */}
                <Route path="/space-news" element={<CategoryPage slug="space-news" />} />
                <Route path="/solar-system" element={<CategoryPage slug="solar-system" />} />
                <Route path="/telescopes-technology" element={<CategoryPage slug="telescopes-technology" />} />
                <Route path="/universe" element={<CategoryPage slug="universe" />} />
                <Route path="/space-exploration" element={<CategoryPage slug="space-exploration" />} />
                <Route path="/skywatching" element={<CategoryPage slug="skywatching" />} />
                <Route path="/space-culture" element={<CategoryPage slug="space-culture" />} />
                <Route path="/explainers" element={<CategoryPage slug="explainers" />} />
                <Route path="/learn" element={<Navigate to="/explainers" replace />} />
                <Route path="/people-history" element={<CategoryPage slug="people-history" />} />

                {/* Fallback category routes */}
                <Route path="/category" element={<CategoryPage slug="space-news" />} />
                <Route path="/category/:categorySlug" element={<CategoryPage />} />
                <Route path="/blog/category/:categorySlug" element={<CategoryPage />} />

                {/* Author routes */}
                <Route path="/author/:authorSlug" element={<AuthorPage />} />

                {/* Tag routes */}
                <Route path="/tag/:tagSlug" element={<TagPage />} />
                <Route path="/tags" element={<TagPage />} />

                {/* Admin direct routing fallback if navigated inside SPA */}
                <Route path="/admin" element={<AdminRedirect />} />
                <Route path="/admin/*" element={<AdminRedirect />} />

                {/* 404 Catch-all route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
              <ScrollToTopButton />
            </BlogProvider>
          </MobileProvider>
        </ThemeProvider>
      </ErrorBoundary>
      <Analytics />
    </>
  );
}

export default App;