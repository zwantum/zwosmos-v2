import { useMobile } from '../contexts/MobileContext';

const BlogPage = () => {
  const { isMobile } = useMobile();

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: 'var(--bg-main)',
      color: 'white',
      padding: isMobile ? '100px 20px 40px' : '120px 5% 60px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: '40px',
      justifyContent: 'center',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>

      {/* LEFT COLUMN: Main Content */}
      <div style={{ flex: '1 1 65%', maxWidth: '900px' }}>

        {/* Breadcrumb */}
        <div style={{
          fontSize: '0.85rem',
          color: 'rgba(255,255,255,0.6)',
          letterSpacing: '1px',
          marginBottom: '25px',
          fontWeight: 600,
          fontFamily: "'Lora', serif"
        }}>
          Edger <span style={{ color: 'var(--brand-purple)', margin: '0 5px' }}>›</span>
          Inspiration <span style={{ color: 'var(--brand-purple)', margin: '0 5px' }}>›</span>
          Far far away, behind the word mountains
        </div>

        {/* Featured Image Block */}
        <div style={{ position: 'relative', width: '100%', marginBottom: '50px', marginLeft: '12px' }}>

          {/* Wireframe Border */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: '1px solid var(--brand-purple)',
            borderRadius: '12px',
            zIndex: 3,
            pointerEvents: 'none',
            transform: 'translate(-12px, 12px)'
          }}></div>

          <div style={{
            width: '100%',
            aspectRatio: '16/10',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            position: 'relative',
            zIndex: 1
          }}>
            <img
              src="https://images.unsplash.com/photo-1541443131876-44b03de101c5?q=80&w=1400&auto=format&fit=crop"
              alt="Featured Retro Space Vehicle"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: isMobile ? '2.5rem' : '3.8rem',
          lineHeight: 1.1,
          margin: '0 0 30px 0',
          textAlign: 'center'
        }}>
          Far far away, behind the word mountains
        </h1>

        {/* Placeholder Content Area */}
        <div style={{
          fontSize: '1.1rem',
          lineHeight: 1.8,
          color: 'rgba(255,255,255,0.85)',
          fontFamily: "'Lora', serif",
          padding: isMobile ? '0' : '0 40px'
        }}>
          <p style={{ marginBottom: '20px' }}>
            [Tiptap Editor Content will be injected here. For now, this is a placeholder paragraph demonstrating the layout.]
          </p>
          <p>
            The quick brown fox jumps over the lazy dog. A journey of a thousand miles begins with a single step. Space is big. You just won't believe how vastly, hugely, mind-bogglingly big it is.
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: Sidebar */}
      <div style={{ flex: '0 0 350px', display: 'flex', flexDirection: 'column', gap: '30px' }}>

        {/* Latest Posts Widget */}
        <div style={{ display: 'flex', alignItems: 'stretch', position: 'relative', marginLeft: '12px' }}>

          {/* Wireframe Border */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: '1px solid var(--brand-purple)',
            borderRadius: '12px',
            zIndex: 3,
            pointerEvents: 'none',
            transform: 'translate(-12px, 12px)'
          }}></div>

          <div style={{ display: 'flex', width: '100%', position: 'relative', zIndex: 1 }}>
            {/* Vertical Text */}
            <div style={{
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px 10px',
              fontFamily: "'Playfair Display', serif",
              fontSize: '1.2rem',
              letterSpacing: '1px',
              color: 'white',
              borderRight: '1px solid rgba(255,255,255,0.1)',
              background: 'var(--bg-main)',
              borderRadius: '12px 0 0 12px'
            }}>
              <span style={{ color: 'var(--brand-purple)', marginRight: '10px' }}>✦</span> Latest Posts
            </div>

            {/* Posts Container */}
            <div style={{
              flex: 1,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderLeft: 'none',
              borderRadius: '0 12px 12px 0',
              padding: '25px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              {[
                { title: 'The spectacle before us was indeed sublime', date: 'September 26, 2026', img: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=200&auto=format&fit=crop' },
                { title: 'The meaning of health has evolved over time', date: 'July 26, 2026', img: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=200&auto=format&fit=crop' },
                { title: 'Musical improvisation is the spontaneous music', date: 'July 25, 2026', img: 'https://images.unsplash.com/photo-1537429149819-74853018251f?q=80&w=200&auto=format&fit=crop' }
              ].map((post, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '15px', alignItems: 'center', cursor: 'pointer' }} className="sidebar-post">
                  <div style={{ width: '70px', height: '70px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                    <img src={post.img} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <h4 style={{
                      margin: '0 0 5px 0',
                      fontFamily: "'Playfair Display', serif",
                      fontSize: '1rem',
                      lineHeight: 1.3
                    }}>{post.title}</h4>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontFamily: "'Lora', serif" }}>
                      {post.date}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Social Links Widget */}
        <div style={{ display: 'flex', alignItems: 'stretch', position: 'relative', marginLeft: '12px' }}>

          {/* Wireframe Border */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: '1px solid var(--brand-purple)',
            borderRadius: '12px',
            zIndex: 3,
            pointerEvents: 'none',
            transform: 'translate(-12px, 12px)'
          }}></div>

          <div style={{ display: 'flex', width: '100%', position: 'relative', zIndex: 1 }}>
            <div style={{ width: '40px', borderRight: '1px solid rgba(255,255,255,0.1)', background: 'var(--bg-main)', borderRadius: '12px 0 0 12px' }}></div>

            <div style={{
              flex: 1,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderLeft: 'none',
              borderRadius: '0 12px 12px 0',
              padding: '25px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {[
                { name: 'Twitter', icon: 'fa-x-twitter', bg: '#1f2022', color: 'white' },
                { name: 'Facebook', icon: 'fa-facebook-f', bg: '#1877F2', color: 'white' },
                { name: 'Instagram', icon: 'fa-instagram', bg: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', color: 'white' },
              ].map((social: { name: string; icon: string; bg: string; color: string; customStyle?: React.CSSProperties }, idx) => (
                <button key={idx} style={{
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: '30px',
                  border: 'none',
                  background: social.customStyle?.backgroundImage || social.bg,
                  color: social.color,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontFamily: "'Lora', serif",
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'transform 0.2s, filter 0.2s',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                }}
                  onMouseOver={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.filter = 'brightness(1.1)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.filter = 'brightness(1)';
                  }}
                >
                  <span>{social.name}</span>
                  <i className={`fa-brands ${social.icon}`}></i>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BlogPage;
