import { Link } from 'react-router-dom';

export interface BlogCardProps {
  id: string | number;
  category: string;
  title: string;
  desc: string;
  img: string;
}

export const BlogCard = ({ id, category, title, desc, img }: BlogCardProps) => {
  return (
    <div style={{ position: 'relative', marginLeft: '30px', marginBottom: '35px' }}>
      <Link to={`/blog/${id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
        <div style={{
          cursor: 'pointer',
          height: '100%',
          background: 'transparent',
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
                {category}
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
              <img src={img} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.6rem', margin: '0 0 15px 0', lineHeight: 1.2 }}>{title}</h3>
              
              <div 
                style={{ 
                  color: 'rgba(255,255,255,0.6)', 
                  fontSize: '0.95rem', 
                  lineHeight: 1.6, 
                  margin: '0 0 30px 0',
                  fontFamily: "'Lora', serif" 
                }}
                dangerouslySetInnerHTML={{ __html: desc }}
              />
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
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};
