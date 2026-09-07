import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import { Suspense } from 'react';
import { MobileProvider, useMobile } from './contexts/MobileContext';

import { AssetManager } from './core/AssetManager';
import { GLOBAL } from './config/config';

import WebGLWarning from './ui/WebGLWarning';
import HeroContent from './ui/HeroContent';
import CountdownTimer from './ui/CountdownTimer';
import ContentSections from './ui/ContentSections';
import { useWebGL2Enabled } from './hooks/useWebGL2Support';
import { NoToneMapping } from 'three';
import { Analytics } from "@vercel/analytics/react";
import GalaxyScene from './scenes/Galaxy/GalaxyScene';
import ErrorBoundary from './ui/ErrorBoundary';

function AppContent() {

  const { isMobile } = useMobile();
  const isWebGL2Enabled = useWebGL2Enabled();

  // show nothing while checking WebGL enabled
  if (isWebGL2Enabled === null) {
    return null;
  }

  // if WebGL is not enabled, show the warning
  if (isWebGL2Enabled === false) {
    return <WebGLWarning />;
  }

  return (
    <>
      <div className="hero-section">
      <Canvas dpr={window.devicePixelRatio} camera={{ position: isMobile ? GLOBAL.INITIAL_CAMERA_MOBILE_POS : GLOBAL.INITIAL_CAMERA_DESKTOP_POS, fov: isMobile ? GLOBAL.INITIAL_CAMERA_MOBILE_FOV : GLOBAL.INITIAL_CAMERA_DESKTOP_FOV }} style={{ background: 'black' }} gl={{
        antialias: true,
        toneMapping: NoToneMapping,
        toneMappingExposure: GLOBAL.TONE_MAPPING_EXPOSURE,
        powerPreference: 'high-performance'
      }}
      >
        {/* assets preloader & scene precompiler */}
        <AssetManager />

        {/* scenes */}
        <Suspense fallback={null}>
          <GalaxyScene />
        </Suspense>

        <Preload all />
      </Canvas>

          <HeroContent />
          <CountdownTimer />
      </div>

      <ContentSections />
    </>
  );
}

import BlogIndexPage from './ui/BlogIndexPage';
import BlogPostPage from './ui/BlogPostPage';
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <>
      <ErrorBoundary>
        <MobileProvider>
          <Routes>
            <Route path="/" element={<AppContent />} />
            <Route path="/blog" element={<BlogIndexPage />} />
            <Route path="/blog/:id" element={<BlogPostPage />} />
          </Routes>
        </MobileProvider>
      </ErrorBoundary>
      <Analytics />
    </>
  );
}

export default App;