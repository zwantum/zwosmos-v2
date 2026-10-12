import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables from .env
const envPath = path.join(rootDir, '.env');
let supabaseUrl = 'https://quwukfdlvkyerrjsnieb.supabase.co';
let supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1d3VrZmRsdmt5ZXJyanNuaWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NjY4ODAsImV4cCI6MjEwNDM0Mjg4MH0.zYtKa8JfEtVEo0NjbIEpK6xoruKilxAieBps9dt_Tsc';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^\s*(VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY)\s*=\s*["']?([^"'\r\n]+)["']?/);
    if (match) {
      if (match[1] === 'VITE_SUPABASE_URL') supabaseUrl = match[2];
      if (match[1] === 'VITE_SUPABASE_ANON_KEY') supabaseAnonKey = match[2];
    }
  }
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const BASE_URL = 'https://zwosmos.com';

function escapeXml(unsafe) {
  return String(unsafe).replace(/[<>&'"]/g, (c) => {
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

function formatDate(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

async function generate() {
  const today = new Date().toISOString().split('T')[0];

  // 1. Core pages
  const corePages = [
    { loc: `${BASE_URL}/`, priority: '1.00', changefreq: 'daily', lastmod: today },
    { loc: `${BASE_URL}/blog`, priority: '0.90', changefreq: 'daily', lastmod: today },
    { loc: `${BASE_URL}/books`, priority: '0.80', changefreq: 'weekly', lastmod: today },
    { loc: `${BASE_URL}/interactive`, priority: '0.80', changefreq: 'weekly', lastmod: today },
  ];

  // 2. Primary 9 categories
  const categories = [
    'space-news',
    'solar-system',
    'telescopes-technology',
    'universe',
    'space-exploration',
    'skywatching',
    'space-culture',
    'explainers',
    'people-history',
  ].map((slug) => ({
    loc: `${BASE_URL}/${slug}`,
    priority: '0.85',
    changefreq: 'daily',
    lastmod: today,
  }));

  // 3. Fetch real published blog posts from Supabase
  let posts = [];
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, slug, published_at, updated_at, status')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) {
      console.warn('Could not query blog_posts from Supabase:', error.message);
    } else if (data && data.length > 0) {
      posts = data.map((p) => ({
        loc: `${BASE_URL}/blog/${encodeURIComponent(p.slug || p.id)}`,
        priority: '0.75',
        changefreq: 'weekly',
        lastmod: formatDate(p.updated_at || p.published_at),
      }));
    }
  } catch (err) {
    console.warn('Error fetching posts:', err);
  }

  // 4. Fetch tags from Supabase
  let tags = [];
  try {
    const { data, error } = await supabase
      .from('blog_tags')
      .select('slug')
      .order('name', { ascending: true });

    if (!error && data) {
      tags = data.map((t) => ({
        loc: `${BASE_URL}/tag/${encodeURIComponent(t.slug)}`,
        priority: '0.60',
        changefreq: 'weekly',
        lastmod: today,
      }));
    }
  } catch (err) {
    console.warn('Error fetching tags:', err);
  }

  // 5. Feeds
  const feeds = [
    { loc: `${BASE_URL}/rss.xml`, priority: '0.50', changefreq: 'daily', lastmod: today },
  ];

  const allUrls = [
    '  <!-- Core Gateways & Portals -->',
    ...corePages.map((u) => renderUrl(u)),
    '',
    '  <!-- Astronomical Categories -->',
    ...categories.map((u) => renderUrl(u)),
    '',
    '  <!-- Published Dispatches & Articles (Real Slugs) -->',
    ...posts.map((u) => renderUrl(u)),
    '',
    '  <!-- Topic & Discovery Tags -->',
    ...tags.map((u) => renderUrl(u)),
    '',
    '  <!-- Syndication Feeds -->',
    ...feeds.map((u) => renderUrl(u)),
  ];

  function renderUrl(entry) {
    return `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`;
  }

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${allUrls.join('\n')}
</urlset>
`;

  const publicSitemapPath = path.join(rootDir, 'public', 'sitemap.xml');
  fs.writeFileSync(publicSitemapPath, xmlContent, 'utf-8');
  console.log(`Successfully generated public/sitemap.xml with ${corePages.length + categories.length + posts.length + tags.length + feeds.length} URLs (including ${posts.length} real published articles with actual slugs).`);
}

generate();
