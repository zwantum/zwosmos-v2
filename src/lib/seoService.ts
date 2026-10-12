import { useEffect } from 'react';
import { DEFAULT_SITE_SETTINGS, SiteSettings, settingsService } from './settingsService';

export interface SEOMetaOptions {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'book';
  keywords?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
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
 * Update document head with separate Website SEO meta and Open Graph / Social tags.
 */
export function applySEOMeta(options: SEOMetaOptions = {}, siteSettings: SiteSettings = DEFAULT_SITE_SETTINGS) {
  if (typeof document === 'undefined') return;

  // 1. Website SEO (Search Engine & Browser Tab)
  const seoTitle = options.title
    ? (options.title.includes('Zwosmos') ? options.title : `${options.title} | Zwosmos`)
    : siteSettings.siteTitle;

  const seoDescription = options.description || siteSettings.siteDescription;

  // 2. Open Graph & Social Cards (WhatsApp, Twitter/X, LinkedIn, Facebook, Discord)
  const ogTitle = options.ogTitle
    ? (options.ogTitle.includes('Zwosmos') ? options.ogTitle : `${options.ogTitle} | Zwosmos`)
    : (options.title
        ? (options.title.includes('Zwosmos') ? options.title : `${options.title} | Zwosmos`)
        : (siteSettings.ogTitle || siteSettings.siteTitle));

  const ogDescription = options.ogDescription || options.description || siteSettings.ogDescription || siteSettings.siteDescription;

  const image = options.image || siteSettings.ogImage;
  const url = options.url || (typeof window !== 'undefined' ? window.location.href : siteSettings.siteUrl);
  const type = options.type || 'website';
  const twitterCard = options.twitterCard || siteSettings.twitterCard || 'summary_large_image';
  const twitterHandle = siteSettings.twitterHandle || '@zwosmos';

  // Basic HTML Title & Description (SEO)
  document.title = seoTitle;
  setMetaTag('name', 'description', seoDescription);
  if (options.keywords || siteSettings.keywords) {
    setMetaTag('name', 'keywords', options.keywords || siteSettings.keywords);
  }
  if (options.author || siteSettings.authorName) {
    setMetaTag('name', 'author', options.author || siteSettings.authorName);
  }

  // Open Graph (Facebook, LinkedIn, Discord, WhatsApp)
  setMetaTag('property', 'og:site_name', 'Zwosmos');
  setMetaTag('property', 'og:title', ogTitle);
  setMetaTag('property', 'og:description', ogDescription);
  setMetaTag('property', 'og:url', url);
  setMetaTag('property', 'og:type', type);
  setMetaTag('property', 'og:image', image);
  if (image && image.startsWith('https://')) {
    setMetaTag('property', 'og:image:secure_url', image);
  }
  setMetaTag('property', 'og:image:alt', ogTitle);
  setMetaTag('property', 'og:locale', 'en_US');
  if (image) {
    if (image.includes('.png')) {
      setMetaTag('property', 'og:image:type', 'image/png');
    } else if (image.includes('.webp')) {
      setMetaTag('property', 'og:image:type', 'image/webp');
    } else {
      setMetaTag('property', 'og:image:type', 'image/jpeg');
    }
  }

  // Twitter Cards (X)
  setMetaTag('name', 'twitter:card', twitterCard);
  setMetaTag('name', 'twitter:title', ogTitle);
  setMetaTag('name', 'twitter:description', ogDescription);
  setMetaTag('name', 'twitter:image', image);
  setMetaTag('name', 'twitter:site', twitterHandle);
  setMetaTag('name', 'twitter:creator', twitterHandle);

  // Article Specifics (for Blog Posts)
  if (type === 'article') {
    if (options.publishedTime) {
      setMetaTag('property', 'article:published_time', options.publishedTime);
    }
    if (options.modifiedTime) {
      setMetaTag('property', 'article:modified_time', options.modifiedTime);
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
