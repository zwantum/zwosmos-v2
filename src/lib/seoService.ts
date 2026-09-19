import { useEffect } from 'react';
import { DEFAULT_SITE_SETTINGS, SiteSettings, settingsService } from './settingsService';

export interface SEOMetaOptions {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'book';
  keywords?: string;
  author?: string;
  publishedTime?: string;
  section?: string;
  tags?: string[];
  twitterCard?: 'summary_large_image' | 'summary';
}

function setMetaTag(attributeName: 'name' | 'property', attributeValue: string, content: string | undefined) {
  if (typeof document === 'undefined') return;
  if (!content) return;

  let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setLinkTag(rel: string, href: string, extraAttributes: Record<string, string> = {}) {
  if (typeof document === 'undefined') return;
  if (!href) return;

  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
  Object.entries(extraAttributes).forEach(([key, val]) => {
    element!.setAttribute(key, val);
  });
}

/**
 * Update document head with dynamic Open Graph, Twitter Cards, and SEO meta tags.
 */
export function applySEOMeta(options: SEOMetaOptions = {}, siteSettings: SiteSettings = DEFAULT_SITE_SETTINGS) {
  if (typeof document === 'undefined') return;

  const title = options.title
    ? (options.title.includes('Zwosmos') ? options.title : `${options.title} | Zwosmos`)
    : siteSettings.siteTitle;

  const description = options.description || siteSettings.siteDescription;
  const image = options.image || siteSettings.ogImage;
  const url = options.url || (typeof window !== 'undefined' ? window.location.href : siteSettings.siteUrl);
  const type = options.type || 'website';
  const twitterCard = options.twitterCard || siteSettings.twitterCard || 'summary_large_image';
  const twitterHandle = siteSettings.twitterHandle || '@zwosmos';

  // Basic HTML Title & Description
  document.title = title;
  setMetaTag('name', 'description', description);
  if (options.keywords || siteSettings.keywords) {
    setMetaTag('name', 'keywords', options.keywords || siteSettings.keywords);
  }
  if (options.author || siteSettings.authorName) {
    setMetaTag('name', 'author', options.author || siteSettings.authorName);
  }

  // Open Graph (Facebook, LinkedIn, Discord, WhatsApp)
  setMetaTag('property', 'og:site_name', 'Zwosmos');
  setMetaTag('property', 'og:title', title);
  setMetaTag('property', 'og:description', description);
  setMetaTag('property', 'og:url', url);
  setMetaTag('property', 'og:type', type);
  setMetaTag('property', 'og:image', image);
  setMetaTag('property', 'og:image:alt', title);
  setMetaTag('property', 'og:locale', 'en_US');

  // Twitter Cards (X)
  setMetaTag('name', 'twitter:card', twitterCard);
  setMetaTag('name', 'twitter:title', title);
  setMetaTag('name', 'twitter:description', description);
  setMetaTag('name', 'twitter:image', image);
  setMetaTag('name', 'twitter:site', twitterHandle);
  setMetaTag('name', 'twitter:creator', twitterHandle);

  // Article Specifics (for Blog Posts)
  if (type === 'article') {
    if (options.publishedTime) {
      setMetaTag('property', 'article:published_time', options.publishedTime);
    }
    if (options.author) {
      setMetaTag('property', 'article:author', options.author);
    }
    if (options.section) {
      setMetaTag('property', 'article:section', options.section);
    }
    if (options.tags && options.tags.length > 0) {
      options.tags.forEach(tag => {
        setMetaTag('property', 'article:tag', tag);
      });
    }
  }

  // Canonical link
  setLinkTag('canonical', url);

  // RSS Feed link for autodiscovery by feed readers
  setLinkTag('alternate', '/rss.xml', {
    type: 'application/rss+xml',
    title: siteSettings.rssTitle || 'Zwosmos RSS Feed'
  });
}

/**
 * React hook to effortlessly set page-level SEO & Open Graph meta tags.
 */
export function useSEO(options: SEOMetaOptions = {}) {
  useEffect(() => {
    let active = true;

    // Load current site settings and apply
    settingsService.getSettings().then(settings => {
      if (active) {
        applySEOMeta(options, settings);
      }
    });

    const handleSettingsUpdated = (e: any) => {
      const updatedSettings = e?.detail || DEFAULT_SITE_SETTINGS;
      applySEOMeta(options, updatedSettings);
    };

    window.addEventListener('zwosmos_settings_updated', handleSettingsUpdated);

    return () => {
      active = false;
      window.removeEventListener('zwosmos_settings_updated', handleSettingsUpdated);
    };
  }, [
    options.title,
    options.description,
    options.image,
    options.url,
    options.type,
    options.keywords,
    options.author,
    options.publishedTime,
    options.section
  ]);
}
