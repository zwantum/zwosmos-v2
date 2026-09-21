import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBlogPosts } from '@zwantum/blog/react';
import { settingsService, DEFAULT_SITE_SETTINGS, SiteSettings } from '../lib/settingsService';
import { generateRssXml } from '../lib/rssService';
import { useTheme } from '../contexts/ThemeContext';
import { ALL_BLOG_POSTS } from '../data/blogData';
import { Rss, Copy, Check, Download, ExternalLink, ArrowLeft, Globe } from 'lucide-react';

export default function RssPage() {
  const { isLight } = useTheme();
  const { posts: livePosts } = useBlogPosts();
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [copied, setCopied] = useState(false);
  const [showRawXml, setShowRawXml] = useState(false);

  useEffect(() => {
    settingsService.getSettings().then(setSettings);
  }, []);

  const postsToFeed = (livePosts && livePosts.length > 0)
    ? livePosts
    : ALL_BLOG_POSTS.map(p => ({
        id: p.id,
        slug: p.id,
        title: p.title,
        excerpt: p.desc,
        published_at: new Date().toISOString(),
        author: { name: p.authorName },
        categories: [{ name: p.category }],
        featured_image: { url: p.img }
      }));

  const xmlContent = generateRssXml(postsToFeed, settings);
  const feedUrl = typeof window !== 'undefined' ? `${window.location.origin}/rss.xml` : 'https://zwosmos.com/rss.xml';

  const handleCopy = () => {
    navigator.clipboard.writeText(feedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([xmlContent], { type: 'application/rss+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rss.xml';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: isLight ? '#f8fafc' : '#161616',
        color: isLight ? '#0f172a' : '#ffffff',
        padding: '60px 20px 100px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
      }}
    >
      <div style={{ maxWidth: '840px', margin: '0 auto' }}>
        {/* Back Link */}
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#a855f7',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '32px',
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'translateX(-4px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'translateX(0)')}
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* Header Hero */}
        <div
          style={{
            background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
            border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '18px',
            padding: '36px',
            boxShadow: isLight ? '0 10px 30px rgba(0,0,0,0.05)' : '0 20px 40px rgba(0,0,0,0.4)',
            marginBottom: '30px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: '#ffcc00',
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(255, 204, 0, 0.35)'
              }}
            >
              <Rss size={24} />
            </div>
            <div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: '#ffcc00'
                }}
              >
                Official RSS 2.0 Feed
              </span>
              <h1
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  margin: '4px 0 0 0',
                  lineHeight: 1.2
                }}
              >
                {settings.rssTitle || 'Zwosmos RSS Feed'}
              </h1>
            </div>
          </div>

          <p
            style={{
              fontSize: '15px',
              color: isLight ? '#475569' : '#94a3b8',
              lineHeight: 1.6,
              marginBottom: '24px'
            }}
          >
            {settings.rssDescription || 'Subscribe to receive the latest astronomical discoveries, space telescope dispatches, and cosmology articles directly in your favorite RSS reader (Feedly, Inoreader, Apple News, etc.).'}
          </p>

          {/* Feed URL Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: isLight ? '#f1f5f9' : 'rgba(0,0,0,0.4)',
              border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '8px 12px 8px 16px',
              marginBottom: '20px',
              flexWrap: 'wrap'
            }}
          >
            <Globe size={16} color="#94a3b8" />
            <span
              style={{
                fontSize: '13.5px',
                fontFamily: 'monospace',
                flex: 1,
                minWidth: '200px',
                wordBreak: 'break-all',
                color: isLight ? '#0f172a' : '#e2e8f0'
              }}
            >
              {feedUrl}
            </span>
            <button
              onClick={handleCopy}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: copied ? '#10b981' : '#ffcc00',
                color: '#0f172a',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Feed URL'}
            </button>
            <button
              onClick={handleDownload}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: isLight ? '#ffffff' : 'rgba(255,255,255,0.08)',
                color: isLight ? '#0f172a' : '#ffffff',
                border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Download size={14} />
              Download XML
            </button>
          </div>

          <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#64748b' }}>
            <span>Language: <strong>{settings.rssLanguage || 'en-US'}</strong></span>
            <span>•</span>
            <span>Articles in Feed: <strong>{postsToFeed.length}</strong></span>
            <span>•</span>
            <button
              onClick={() => setShowRawXml(!showRawXml)}
              style={{
                background: 'none',
                border: 'none',
                color: '#a855f7',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                padding: 0
              }}
            >
              {showRawXml ? 'Hide Raw XML' : 'Inspect Raw XML'}
            </button>
          </div>
        </div>

        {/* Collapsible Raw XML Box */}
        {showRawXml && (
          <div
            style={{
              background: '#090d16',
              border: '1px solid #1e293b',
              borderRadius: '14px',
              padding: '20px',
              marginBottom: '30px',
              overflow: 'auto',
              maxHeight: '400px'
            }}
          >
            <pre
              style={{
                margin: 0,
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#38bdf8',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap'
              }}
            >
              {xmlContent}
            </pre>
          </div>
        )}

        {/* Feed Items Preview List */}
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 16px 0' }}>
          Latest Articles in Feed ({postsToFeed.length})
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {postsToFeed.map((post: any, idx) => (
            <div
              key={post.id || idx}
              style={{
                background: isLight ? '#ffffff' : 'rgba(255,255,255,0.02)',
                border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px'
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#a855f7',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  {post.categories?.[0]?.name || post.category || 'Article'}
                </span>
                <h4 style={{ margin: '4px 0', fontSize: '1rem', fontWeight: 600 }}>
                  {post.title}
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: isLight ? '#64748b' : '#94a3b8' }}>
                  {post.excerpt || post.desc || ''}
                </p>
              </div>
              <Link
                to={`/blog/${post.slug || post.id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: '#ffcc00',
                  textDecoration: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}
              >
                Read Article <ExternalLink size={12} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
