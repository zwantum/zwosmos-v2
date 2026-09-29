// Vercel Serverless Function to serve dynamic Open Graph & Twitter Cards for social media crawlers
// (WhatsApp, Facebook, Twitter/X, LinkedIn, Discord, Telegram, Slack, etc.)

function cleanText(str: string): string {
  if (!str) return '';
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const DEFAULT_TITLE = 'Zwosmos | Astronomy, Space News & Skywatching';
const DEFAULT_DESC = 'Explore astronomy, space news, skywatching guides, cosmic discoveries, missions, telescopes and stories from across the universe with Zwosmos.';
const DEFAULT_IMAGE = 'https://quwukfdlvkyerrjsnieb.supabase.co/storage/v1/object/public/media/1790570690988_zwosmosastronomywebsite_homepage.png';
const SITE_URL = 'https://zwosmos.com';

export default async function handler(req: any, res: any) {
  // Extract slug from query parameters or URL path
  let rawSlug = '';
  if (req.query?.slug) {
    rawSlug = Array.isArray(req.query.slug) ? req.query.slug.join('/') : String(req.query.slug);
  } else if (req.url) {
    try {
      const parsedUrl = new URL(req.url, SITE_URL);
      rawSlug = parsedUrl.searchParams.get('slug') || '';
      if (!rawSlug) {
        const parts = parsedUrl.pathname.split('/').filter(Boolean);
        const bIndex = parts.indexOf('blog');
        if (bIndex !== -1 && parts[bIndex + 1]) {
          rawSlug = parts.slice(bIndex + 1).join('/');
        }
      }
    } catch {}
  }

  const cleanSlug = rawSlug.trim().replace(/^\/+|\/+$/g, '');

  let title = DEFAULT_TITLE;
  let description = DEFAULT_DESC;
  let imageUrl = DEFAULT_IMAGE;
  let canonicalUrl = `${SITE_URL}/blog`;
  let publishedAt = '';

  if (cleanSlug) {
    canonicalUrl = `${SITE_URL}/blog/${encodeURIComponent(cleanSlug)}`;

    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://quwukfdlvkyerrjsnieb.supabase.co';
      const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1d3VrZmRsdmt5ZXJyanNuaWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NjY4ODAsImV4cCI6MjEwNDM0Mjg4MH0.zYtKa8JfEtVEo0NjbIEpK6xoruKilxAieBps9dt_Tsc';

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanSlug);
      const filter = isUuid
        ? `id=eq.${encodeURIComponent(cleanSlug)}`
        : `slug=eq.${encodeURIComponent(cleanSlug)}`;

      const postRes = await fetch(
        `${supabaseUrl}/rest/v1/blog_posts?select=id,title,slug,excerpt,custom_fields,featured_image_id,published_at,created_at&${filter}&limit=1`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`
          }
        }
      );

      const posts = await postRes.json();
      const post = posts?.[0];

      if (post) {
        if (post.title) {
          const cleanedTitle = cleanText(post.title);
          title = cleanedTitle.includes('Zwosmos') ? cleanedTitle : `${cleanedTitle} | Zwosmos`;
        }

        if (post.excerpt) {
          description = cleanText(post.excerpt);
        }

        if (post.published_at || post.created_at) {
          publishedAt = post.published_at || post.created_at;
        }

        if (post.slug) {
          canonicalUrl = `${SITE_URL}/blog/${encodeURIComponent(post.slug)}`;
        }

        // Resolve featured image
        if (post.custom_fields?.featured_image_url) {
          imageUrl = post.custom_fields.featured_image_url;
        } else if (post.featured_image_id) {
          try {
            const mediaRes = await fetch(
              `${supabaseUrl}/rest/v1/blog_media?select=url&id=eq.${encodeURIComponent(post.featured_image_id)}&limit=1`,
              {
                headers: {
                  apikey: supabaseKey,
                  Authorization: `Bearer ${supabaseKey}`
                }
              }
            );
            const mediaList = await mediaRes.json();
            if (mediaList?.[0]?.url) {
              imageUrl = mediaList[0].url;
            }
          } catch (mediaErr) {
            console.warn('Error fetching media url for blog post:', mediaErr);
          }
        }
      }
    } catch (err) {
      console.warn('Error fetching blog post Open Graph data:', err);
    }
  }

  // Render complete, crawler-friendly HTML with Open Graph & Twitter Card tags
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />

  <!-- Open Graph / Facebook / LinkedIn / WhatsApp / Discord / Telegram -->
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Zwosmos" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  <meta property="og:image" content="${escapeHtml(imageUrl)}" />
  <meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}" />
  <meta property="og:image:alt" content="${escapeHtml(title)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="en_US" />
  ${publishedAt ? `<meta property="article:published_time" content="${escapeHtml(publishedAt)}" />` : ''}

  <!-- Twitter / X Cards -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@zwosmos" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
  <meta name="twitter:image:alt" content="${escapeHtml(title)}" />

  <!-- Automatic redirect to interactive React SPA if opened by a human browser -->
  <script>
    window.location.replace("${escapeHtml(canonicalUrl)}");
  </script>
  <meta http-equiv="refresh" content="0;url=${escapeHtml(canonicalUrl)}" />
</head>
<body style="background:#0a0c10;color:#cbd5e1;font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px;text-align:center;">
  <div style="max-width:540px;">
    <h1 style="color:#ffffff;font-size:1.35rem;margin:0 0 10px;line-height:1.4;">${escapeHtml(title)}</h1>
    <p style="color:#94a3b8;font-size:0.92rem;line-height:1.6;margin:0 0 20px;">${escapeHtml(description)}</p>
    <a href="${escapeHtml(canonicalUrl)}" style="display:inline-block;padding:10px 22px;background:#ffcc00;color:#0f172a;font-weight:700;font-size:13px;text-decoration:none;border-radius:8px;">
      Read Article on Zwosmos &rarr;
    </a>
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(html);
}
