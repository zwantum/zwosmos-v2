import { useMobile } from '../contexts/MobileContext';
import { BlogCard } from './BlogCard';

const BlogIndexPage = () => {
  const { isMobile } = useMobile();

  const blogPosts = [
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
    },
    {
      id: 4,
      category: 'ASTROPHYSICS',
      title: 'The Symphony of Black Holes',
      desc: 'When two black holes collide, they send ripples through the very fabric of spacetime. Listen to their cosmic symphony.',
      authorName: 'Marie Curie',
      authorImg: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&auto=format&fit=crop',
      img: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1000&auto=format&fit=crop'
    },
    {
      id: 5,
      category: 'EXPLORATION',
      title: 'Mapping the Unknown',
      desc: 'How the next generation of space probes will chart the uncharted territories of our outer solar system and beyond.',
      authorName: 'Carl Sagan',
      authorImg: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100&auto=format&fit=crop',
      img: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=1000&auto=format&fit=crop'
    },
    {
      id: 6,
      category: 'THEORIES',
      title: 'Echoes of the Big Bang',
      desc: 'The cosmic microwave background radiation still holds answers to the earliest moments of our universes expansion.',
      authorName: 'Ada Lovelace',
      authorImg: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100&auto=format&fit=crop',
      img: 'https://images.unsplash.com/photo-1541873676-a18131494184?q=80&w=418&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    }
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
            <BlogCard
              key={post.id}
              id={post.id}
              category={post.category}
              title={post.title}
              desc={post.desc}
              img={post.img}
            />
          ))}
        </div>

      </div>
    </div>
  );
};

export default BlogIndexPage;
