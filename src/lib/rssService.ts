import { SiteSettings, DEFAULT_SITE_SETTINGS } from './settingsService';

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

function toRFC822Date(dateString?: string): string {
  const date = dateString ? new Date(dateString) : new Date();
  return isNaN(date.getTime()) ? new Date().toUTCString() : date.toUTCString();
}

/**
 * Generates standard RSS 2.0 XML feed from blog posts and site settings.
 */
export function generateRssXml(posts: any[], settings: SiteSettings = DEFAULT_SITE_SETTINGS): string {
  const baseUrl = (settings.siteUrl || 'https://zwosmos.com').replace(/\/$/, '');
  const feedUrl = `${baseUrl}/rss.xml`;
  const buildDate = new Date().toUTCString();

  const itemsXml = posts
    .slice(0, 50) // Latest 50 posts
    .map(post => {
      const postSlug = post.slug || post.id;
      const postUrl = `${baseUrl}/blog/${postSlug}`;
      const title = escapeXml(post.title || 'Untitled Post');
      const excerpt = post.excerpt ? `<![CDATA[${post.excerpt}]]>` : `<![CDATA[${post.title || ''}]]>`;
      const pubDate = toRFC822Date(post.published_at || post.created_at);
      const author = escapeXml(post.author?.name || settings.authorName || 'Zwosmos Editorial');
      const category = post.categories?.[0]?.name ? `<category>${escapeXml(post.categories[0].name)}</category>` : '';
      const imageUrl = post.featured_image?.url;
      const enclosure = imageUrl ? `<enclosure url="${escapeXml(imageUrl)}" length="0" type="image/jpeg" />` : '';

      return `    <item>
      <title>${title}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <dc:creator xmlns:dc="http://purl.org/dc/elements/1.1/">${author}</dc:creator>
      ${category}
      <description>${excerpt}</description>
      ${enclosure}
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(settings.rssTitle || settings.siteTitle || 'Zwosmos')}</title>
    <link>${baseUrl}</link>
    <description>${escapeXml(settings.rssDescription || settings.siteDescription || 'Cosmic exploration and deep space insights')}</description>
    <language>${escapeXml(settings.rssLanguage || 'en-US')}</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    <image>
      <url>${escapeXml(settings.ogImage || 'https://zwosmos.com/assets/icons/Zwosmos_Favicon.svg')}</url>
      <title>${escapeXml(settings.siteTitle || 'Zwosmos')}</title>
      <link>${baseUrl}</link>
    </image>
${itemsXml}
  </channel>
</rss>`;
}
