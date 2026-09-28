import { SiteSettings, DEFAULT_SITE_SETTINGS } from './settingsService';
import { ALL_CATEGORIES_LIST, ALL_BLOG_POSTS } from '../data/blogData';

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function toW3CDate(dateString?: string): string {
  const date = dateString ? new Date(dateString) : new Date();
  if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
  return date.toISOString().split('T')[0];
}

export interface SitemapEntry {
  loc: string;
  title: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  lastmod?: string;
  category?: string;
  type?: 'page' | 'category' | 'article' | 'tag' | 'feed';
  description?: string;
}

export interface SitemapHierarchy {
  corePages: SitemapEntry[];
  categories: SitemapEntry[];
  articles: SitemapEntry[];
  tags: SitemapEntry[];
  feeds: SitemapEntry[];
}

/**
 * Generates standard W3C XML Sitemap from all site content.
 */
export function generateSitemapXml(
  posts: any[] = [],
  tags: any[] = [],
  settings: SiteSettings = DEFAULT_SITE_SETTINGS
): string {
  const baseUrl = (settings.siteUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://zwosmos.com')).replace(/\/$/, '');
  const today = new Date().toISOString().split('T')[0];

  const urls: string[] = [];

  const addUrl = (path: string, changefreq: string, priority: number, lastmod: string = today) => {
    urls.push(`  <url>
    <loc>${escapeXml(`${baseUrl}${path}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(2)}</priority>
  </url>`);
  };

  // 1. Core Primary Destinations
  addUrl('/', 'daily', 1.0, today);
  addUrl('/blog', 'daily', 0.9, today);
  addUrl('/books', 'weekly', 0.8, today);
  addUrl('/rss', 'weekly', 0.6, today);
  addUrl('/sitemap', 'weekly', 0.7, today);

  // 2. The 9 Astronomical Categories
  ALL_CATEGORIES_LIST.forEach(cat => {
    addUrl(`/${cat.slug}`, 'daily', 0.85, today);
  });

  // 3. Articles / Blog Posts
  const postsToInclude = (posts && posts.length > 0) ? posts : ALL_BLOG_POSTS;
  postsToInclude.forEach(post => {
    const slug = post.slug || post.id;
    const postDate = toW3CDate(post.published_at || post.created_at || post.date);
    addUrl(`/blog/${slug}`, 'weekly', 0.75, postDate);
  });

  // 4. Tags
  if (tags && tags.length > 0) {
    tags.forEach(tag => {
      if (tag.slug) {
        addUrl(`/tag/${tag.slug}`, 'weekly', 0.55, today);
      }
    });
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>`;
}

/**
 * Builds categorized sitemap hierarchy for UI rendering and search filtering.
 */
export function getSitemapHierarchy(posts: any[] = [], tags: any[] = []): SitemapHierarchy {
  const activePosts = (posts && posts.length > 0) ? posts : ALL_BLOG_POSTS;

  const corePages: SitemapEntry[] = [
    {
      loc: '/',
      title: 'Zwosmos Home',
      description: 'The editorial gateway to astrophysics, cosmic exploration, and deep-space revelations.',
      priority: 1.0,
      changefreq: 'daily',
      type: 'page'
    },
    {
      loc: '/blog',
      title: 'Cosmic Feed & All Stories',
      description: 'The complete stream of dispatches, investigative articles, and space phenomena.',
      priority: 0.9,
      changefreq: 'daily',
      type: 'page'
    },
    {
      loc: '/books',
      title: 'Cosmic Library & Literature',
      description: 'Curated collection of seminal astronomy texts, astrophysical treatises, and cosmic books.',
      priority: 0.8,
      changefreq: 'weekly',
      type: 'page'
    },
    {
      loc: '/rss',
      title: 'RSS Feed Reader & Channel',
      description: 'Direct syndicated RSS 2.0 feed and reader channel for cosmic dispatches.',
      priority: 0.6,
      changefreq: 'weekly',
      type: 'page'
    },
    {
      loc: '/sitemap',
      title: 'Cosmic Sitemap & Architecture',
      description: 'Complete index of all astronomical categories, articles, literature, and endpoints.',
      priority: 0.7,
      changefreq: 'weekly',
      type: 'page'
    }
  ];

  const categories: SitemapEntry[] = ALL_CATEGORIES_LIST.map(cat => ({
    loc: `/${cat.slug}`,
    title: cat.name,
    description: cat.desc,
    priority: 0.85,
    changefreq: 'daily',
    type: 'category',
    category: cat.name
  }));

  const articles: SitemapEntry[] = activePosts.map((post: any) => {
    const slug = post.slug || post.id;
    const catName = post.categories?.[0]?.name || post.category || 'Space News';
    return {
      loc: `/blog/${slug}`,
      title: post.title || 'Untitled Cosmic Dispatch',
      description: post.excerpt || post.desc || '',
      lastmod: toW3CDate(post.published_at || post.created_at || post.date),
      priority: 0.75,
      changefreq: 'weekly',
      type: 'article',
      category: catName
    };
  });

  const discoveredTags: SitemapEntry[] = (tags && tags.length > 0)
    ? tags.map((t: any) => ({
        loc: `/tag/${t.slug}`,
        title: `#${t.name || t.slug}`,
        description: t.description || `Articles and dispatches exploring ${t.name || t.slug}`,
        priority: 0.55,
        changefreq: 'weekly',
        type: 'tag'
      }))
    : [];

  const feeds: SitemapEntry[] = [
    {
      loc: '/sitemap.xml',
      title: 'XML Sitemap Protocol (W3C)',
      description: 'Machine-readable XML sitemap index for search engines (Google, Bing, DuckDuckGo).',
      priority: 0.7,
      changefreq: 'daily',
      type: 'feed'
    },
    {
      loc: '/rss.xml',
      title: 'RSS 2.0 Syndication Feed',
      description: 'Standard XML RSS feed for news aggregators and podcasting clients.',
      priority: 0.7,
      changefreq: 'daily',
      type: 'feed'
    }
  ];

  return {
    corePages,
    categories,
    articles,
    tags: discoveredTags,
    feeds
  };
}
