import { useMobile } from '../contexts/MobileContext';
import { Link } from 'react-router-dom';

const BlogIndexPage = () => {
  const { isMobile } = useMobile();

  const blogPosts = [
    { id: 1, category: 'DEEP SPACE', title: 'The Nursery of New Stars', img: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1000&auto=format&fit=crop' },
    { id: 2, category: 'TECHNOLOGY', title: 'Seeing Further Than Ever Before', img: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=1000&auto=format&fit=crop' },
    { id: 3, category: 'SOLAR SYSTEM', title: 'When the Sun Disappears', img: 'https://images.unsplash.com/photo-1541873676-a18131494184?q=80&w=418&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
    { id: 4, category: 'ASTROPHYSICS', title: 'The Symphony of Black Holes', img: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1000&auto=format&fit=crop' },
    { id: 5, category: 'EXPLORATION', title: 'Mapping the Unknown', img: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=1000&auto=format&fit=crop' },
    { id: 6, category: 'THEORIES', title: 'Echoes of the Big Bang', img: 'https://images.unsplash.com/photo-1541873676-a18131494184?q=80&w=418&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' }
  ];

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top center, rgba(147, 51, 234, 0.25) 0%, var(--bg-main) 60%)',
      backgroundColor: 'var(--bg-main)',
      color: 'white',
      padding: isMobile ? '100px 20px 80px' : '120px 5% 100px',
      boxSizing: 'border-box'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: isMobile ? '2.5rem' : '4rem',
            margin: '0 0 15px 0'
          }}>Stories from the Cosmos</h1>
          <p style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '1.1rem',
            fontFamily: "'Lora', serif",
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Dive into the latest discoveries, thoughts, and tales from across the universe.
          </p>
        </div>

        {/* Blog Grid */}
        <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
          {blogPosts.map((post) => (
            <div key={post.id} style={{ position: 'relative', marginLeft: '30px', marginBottom: '35px' }}>
              <Link to={`/blog/${post.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div style={{ position: 'relative', cursor: 'pointer' }}
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
                    transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
                  }}></div>

                  <div className="tabs" style={{
                    position: 'absolute',
                    top: '20px',
                    left: 0,
                    width: '6px',
                    height: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    zIndex: 4,
                    transform: 'translate(calc(-50% - 12px), 12px)',
                    transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
                  }}>
                    <div style={{ width: '100%', height: '40%', background: 'var(--brand-purple)', borderRadius: '3px' }}></div>
                    <div style={{ width: '100%', height: '40%', background: 'var(--brand-purple)', borderRadius: '3px' }}></div>
                  </div>

                  <div style={{
                    background: 'var(--bg-dark-purple)',
                    borderRadius: '10px',
                    padding: '25px',
                    position: 'relative',
                    zIndex: 2,
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--brand-purple)',
                      fontWeight: 'bold',
                      letterSpacing: '1px',
                      marginBottom: '15px'
                    }}>
                      {post.category}
                    </div>

                    <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', zIndex: 2, borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
                      <img src={post.img} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>

                    <h3 style={{ fontSize: '1.6rem', margin: '0', lineHeight: 1.2 }}>{post.title}</h3>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default BlogIndexPage;
