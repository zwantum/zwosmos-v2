import React from 'react';
import { useMobile } from '../contexts/MobileContext';
import { Link } from 'react-router-dom';

const ContentSections: React.FC = () => {
  const { isMobile } = useMobile();

  return (
    <div style={{ background: 'linear-gradient(to bottom, transparent, var(--bg-dark-purple) 200px, var(--bg-dark-purple) 100%)', marginTop: '-100px', paddingTop: '100px' }}>
      {/* Stories Section */}
      <section className="content-section">
        <div className="section-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>Stories from the Cosmos</h2>
            <Link to="/blog" style={{ color: 'var(--brand-purple)', textDecoration: 'none', fontWeight: 600, letterSpacing: '2px', fontSize: '0.9rem' }}>
              VIEW ALL STORIES &rarr;
            </Link>
          </div>

          <div className="grid-3">
            {[
              { 
                id: 1, 
                category: 'DEEP SPACE', 
                title: 'The Nursery of New Stars', 
                desc: 'Far far away, behind the word mountains, far from the countries Vokalia and Consonantia, there live the blind texts...',
                authorName: 'John Doe',
                authorImg: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop',
                img: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1000&auto=format&fit=crop' 
              },
              { 
                id: 2, 
                category: 'TECHNOLOGY', 
                title: 'Seeing Further Than Ever Before', 
                desc: 'The latest telescopes are capturing light from the very dawn of the universe, revealing secrets long hidden in the dark.',
                authorName: 'Jane Smith',
                authorImg: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop',
                img: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=1000&auto=format&fit=crop' 
              },
              { 
                id: 3, 
                category: 'SOLAR SYSTEM', 
                title: 'When the Sun Disappears', 
                desc: 'A look into the mechanics of solar eclipses and how they have shaped human culture and scientific understanding.',
                authorName: 'Alan Turing',
                authorImg: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100&auto=format&fit=crop',
                img: 'https://images.unsplash.com/photo-1541873676-a18131494184?q=80&w=418&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' 
              }
            ].map((story, i) => (
              <div key={i} style={{ position: 'relative', marginLeft: '30px', marginBottom: '35px' }}>
                <Link to={`/blog/${story.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
                  <div style={{ 
                    cursor: 'pointer', 
                    height: '100%',
                    background: 'var(--bg-dark-purple)',
                    borderRadius: '10px',
                    padding: '25px',
                    display: 'flex',
                    flexDirection: 'column',
                    boxSizing: 'border-box'
                  }}
                    onMouseOver={e => {
                      const w = e.currentTarget.querySelector('.wireframe') as HTMLElement;
                      const t = e.currentTarget.querySelector('.tabs') as HTMLElement;
                      if (w) w.style.transform = 'translate(0, 0)';
                      if (t) t.style.transform = 'translate(-50%, 0)';
                    }}
                    onMouseOut={e => {
                      const w = e.currentTarget.querySelector('.wireframe') as HTMLElement;
                      const t = e.currentTarget.querySelector('.tabs') as HTMLElement;
                      if (w) w.style.transform = 'translate(-12px, 12px)';
                      if (t) t.style.transform = 'translate(calc(-50% - 12px), 12px)';
                    }}
                  >
                    <div style={{ position: 'relative', width: '100%', height: '240px', marginBottom: '25px', zIndex: 1 }}>
                      <div className="wireframe" style={{
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
                      }}></div>

                      <div className="tabs" style={{
                        position: 'absolute',
                        top: '20px',
                        left: 0,
                        transform: 'translate(calc(-50% - 12px), 12px)',
                        zIndex: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                      }}>
                        <div style={{
                          background: 'var(--bg-main)',
                          border: '1px solid var(--brand-purple)',
                          borderRadius: '20px',
                          padding: '15px 5px',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          writingMode: 'vertical-rl',
                          transform: 'rotate(180deg)',
                          color: 'white',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          letterSpacing: '1px',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
                        }}>
                          {story.category}
                        </div>

                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'var(--bg-main)',
                          border: '1px solid var(--brand-purple)',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          color: 'white',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
                        }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        </div>

                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'var(--bg-main)',
                          border: '1px solid var(--brand-purple)',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          color: 'white',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
                        }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>
                        </div>
                      </div>

                      <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 2, borderRadius: '10px', overflow: 'hidden' }}>
                        <img src={story.img} alt={story.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                      <div>
                        <h3 style={{ fontSize: '1.6rem', margin: '0 0 15px 0', lineHeight: 1.2 }}>{story.title}</h3>
                        
                        <p style={{ 
                          color: 'rgba(255,255,255,0.6)', 
                          fontSize: '0.95rem', 
                          lineHeight: 1.6, 
                          margin: '0 0 30px 0',
                          fontFamily: "'Lora', serif" 
                        }}>
                          {story.desc}
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                        <button style={{
                          background: 'transparent',
                          border: '1px solid rgba(255,255,255,0.2)',
                          color: 'white',
                          padding: '10px 20px',
                          borderRadius: '30px',
                          fontFamily: "'Playfair Display', serif",
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'background 0.2s, border-color 0.2s'
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.background = 'var(--brand-purple)';
                          e.currentTarget.style.borderColor = 'var(--brand-purple)';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                        }}
                        >
                          Read More
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img src={story.authorImg} alt={story.authorName} style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }} />
                          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.95rem', fontWeight: 600 }}>{story.authorName}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
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
          zIndex: 1
        }}>
          {/* 
          <PointerProvider>
            <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 5], fov: 45 }} gl={{ antialias: true, alpha: true }} style={{ position: 'relative', zIndex: 1 }}>
              <ambientLight intensity={0.2} color="#ffffff" />
              <hemisphereLight color="#818cf8" groundColor="#000000" intensity={0.3} />
              <directionalLight position={[0, 10, -10]} intensity={6} color="#ffeedd" />
              <directionalLight position={[0, 2, 5]} intensity={0.4} color="#ffffff" />
              <pointLight position={[0, -2, -15]} intensity={500} color="#ffeedd" distance={50} decay={2} />
              <Stars radius={50} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
              <Suspense fallback={null}>
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
          */}

          <img
            src="/assets/img/static_earth-1.png"
            alt="Earth"
            style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              top: '-5%',
              transform: 'translateX(-50%)',
              width: '100%',
              objectFit: 'contain',
              objectPosition: 'bottom',
              zIndex: 1,
              pointerEvents: 'none'
            }}
          />
        </div>

        <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: '600px' }}>
          <h2 style={{ fontSize: isMobile ? '3rem' : '4rem', margin: '0 0 20px 0' }}>Stay in the signal.</h2>
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
                outline: 'none'
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
