import React from 'react';
import { useMobile } from '../contexts/MobileContext';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { Stars } from '@react-three/drei';
import Earth from '../components/space/Earth';
import { PointerProvider } from '../components/space/PointerContext';

const ContentSections: React.FC = () => {
  const { isMobile } = useMobile();

  return (
    <div style={{ background: 'linear-gradient(to bottom, transparent, var(--bg-dark-purple) 200px, var(--bg-dark-purple) 100%)', marginTop: '-100px', paddingTop: '100px' }}>
      {/* Stories Section */}
      <section className="content-section">
        <div className="section-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>Stories from the Cosmos</h2>
            <a href="#" style={{ color: 'var(--brand-purple)', textDecoration: 'none', fontWeight: 600, letterSpacing: '2px', fontSize: '0.9rem' }}>
              VIEW ALL STORIES &rarr;
            </a>
          </div>

          <div className="grid-3">
            {[
              { category: 'DEEP SPACE', title: 'The Nursery of New Stars', img: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1000&auto=format&fit=crop' },
              { category: 'TECHNOLOGY', title: 'Seeing Further Than Ever Before', img: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=1000&auto=format&fit=crop' },
              { category: 'SOLAR SYSTEM', title: 'When the Sun Disappears', img: 'https://images.unsplash.com/photo-1537429149819-74853018251f?q=80&w=1000&auto=format&fit=crop' }
            ].map((story, i) => (
              <div key={i} style={{ cursor: 'pointer', transition: 'transform 0.3s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ width: '100%', aspectRatio: '4/3', overflow: 'hidden', borderRadius: '4px', marginBottom: '15px' }}>
                  <img src={story.img} alt={story.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ color: 'var(--brand-purple)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '1px', marginBottom: '10px' }}>{story.category}</div>
                <h3 style={{ fontSize: '1.8rem', margin: '0 0 15px 0', lineHeight: 1.2 }}>{story.title}</h3>
                <div style={{ color: 'var(--brand-purple)', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '2px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  &rarr; READ STORY
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Divider */}
      <div style={{ width: '100%', height: '120px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(147, 51, 234, 0.5), transparent)' }}></div>
        <div style={{ position: 'absolute', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#fbbf24', boxShadow: '0 0 20px #fbbf24' }}></div>
      </div>

      {/* Reading Orbit Section */}
      <section className="content-section">
        <div className="section-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '15px' }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>The Reading Orbit</h2>
            <a href="#" style={{ color: 'var(--brand-purple)', textDecoration: 'none', fontWeight: 600, letterSpacing: '2px', fontSize: '0.9rem' }}>
              EXPLORE ALL BOOKS &rarr;
            </a>
          </div>

          <div className="grid-3" style={{ gap: '40px' }}>
            {[
              { category: 'ASTROPHYSICS', title: 'Beyond the Horizon', author: 'J. A. Kerr', desc: 'On black holes, cosmic boundaries, and the limits of our knowledge.', img: 'linear-gradient(to bottom, #111, #1a1a1a)' },
              { category: 'COSMIC EXPLORATION', title: 'Orbital Paths', author: 'L. Morgan', desc: 'Journeys through space, risk, and the human drive to explore.', img: 'linear-gradient(to bottom, #1e1b4b, #000)' },
              { category: 'COSMOLOGY', title: 'Silent Stars', author: 'M. Ilya', desc: 'A meditation on time, light, and the vast quiet between.', img: 'linear-gradient(to bottom, #3b0764, #1a0b2e)' }
            ].map((book, i) => (
              <div key={i} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                <div style={{ 
                  width: '140px', 
                  flexShrink: 0,
                  height: '210px', 
                  background: book.img, 
                  borderRadius: '2px 6px 6px 2px', 
                  boxShadow: '10px 10px 20px rgba(0,0,0,0.5), inset -2px 0 5px rgba(255,255,255,0.1), inset 5px 0 10px rgba(0,0,0,0.5)',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '20px 10px',
                  boxSizing: 'border-box',
                  borderLeft: '4px solid rgba(255,255,255,0.1)',
                  position: 'relative'
                }}>
                  <div style={{ fontSize: '1rem', textAlign: 'center', fontFamily: "'Orbitron', sans-serif", color: 'rgba(255,255,255,0.9)', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                    {book.title.toUpperCase()}
                  </div>
                  <div style={{ marginTop: 'auto', fontSize: '0.7rem', textAlign: 'center', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)' }}>
                    {book.author.toUpperCase()}
                  </div>
                </div>
                
                <div>
                  <div style={{ color: 'var(--brand-purple)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1px', marginBottom: '8px' }}>{book.category}</div>
                  <h4 style={{ fontSize: '1.5rem', margin: '0 0 5px 0', lineHeight: 1.1 }}>{book.title}</h4>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '15px' }}>{book.author}</div>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', lineHeight: 1.5, margin: 0 }}>
                    {book.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="content-section" style={{ textAlign: 'center', padding: '100px 20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ width: '40px', height: '2px', backgroundColor: 'var(--brand-purple)', margin: '0 auto 30px' }}></div>
          <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: isMobile ? '2.5rem' : '3.5rem', margin: '0 0 20px 0', fontWeight: 500 }}>
            Zwosmos is a home for curious minds.
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', letterSpacing: '2px', textTransform: 'uppercase', lineHeight: 1.6 }}>
            We explore the universe through stories,<br />tools, and ideas that inspire wonder.
          </p>
        </div>
      </section>

      {/* Newsletter Footer */}
      <footer style={{ 
        position: 'relative',
        width: '100%',
        minHeight: '600px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '100px 20px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        textAlign: 'center'
      }}>
        {/* 3D Earth Background */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.8,
          zIndex: 1,
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 50%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 50%)'
        }}>
          <PointerProvider>
            <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 5], fov: 45 }} gl={{ antialias: true, alpha: true }} style={{ position: 'relative', zIndex: 1 }}>
              <ambientLight intensity={0.2} color="#ffffff" />
              <hemisphereLight color="#818cf8" groundColor="#000000" intensity={0.3} />
              <directionalLight position={[0, 10, -10]} intensity={6} color="#ffeedd" />
              <directionalLight position={[0, 2, 5]} intensity={0.4} color="#ffffff" />
              <pointLight position={[0, -2, -15]} intensity={500} color="#ffeedd" distance={50} decay={2} />
              <Stars radius={50} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
              <Suspense fallback={null}>
                {/* 
                  1. Shift Z by +2.5 to cancel Earth's local -2.5 offset so it centers at 0,0,0.
                  2. Rotate -1.2 rad on X to bring India (equator) up to the visible horizon.
                  3. Scale by 12 (radius = 26.4).
                  4. Position at Y=-27, Z=-26 so the camera (Z=5) stays safely outside, and the top peeks at Y=-0.6.
                */}
                <group position={[0, -27.0, -26]} scale={12}>
                  <group rotation={[-1.2, 0, 0]}>
                    <group position={[0, 0, 2.5]}>
                      <Earth />
                    </group>
                  </group>
                </group>
              </Suspense>
            </Canvas>
          </PointerProvider>
        </div>
        
        <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: '600px' }}>
          <h2 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: isMobile ? '3rem' : '4rem', margin: '0 0 20px 0' }}>Stay in the signal.</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '10px' }}>
            STORIES, DISCOVERIES, WONDER.
          </p>
          <p style={{ color: 'var(--brand-purple)', fontSize: '1rem', letterSpacing: '2px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '40px' }}>
            DELIVERED TO YOUR INBOX.
          </p>
          
          <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '10px' }}>
            <input 
              type="email" 
              placeholder="YOUR EMAIL ADDRESS" 
              style={{ 
                flex: 1, 
                background: 'transparent', 
                border: 'none', 
                color: 'white', 
                fontSize: '1rem', 
                letterSpacing: '2px',
                outline: 'none',
                fontFamily: "'Rajdhani', sans-serif"
              }} 
            />
            <button style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--brand-purple)', 
              fontSize: '1.5rem',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateX(5px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateX(0)'}
            >
              &rarr;
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ContentSections;
