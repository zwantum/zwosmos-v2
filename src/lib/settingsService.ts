import { supabase } from './supabase';

export interface SiteSettings {
  id?: string;
  // Website SEO Meta (Browser Title & Google Search SERP)
  siteTitle: string;
  siteDescription: string;
  siteUrl: string;
  keywords: string;
  authorName: string;

  // Open Graph & Social Cards (og:title, og:description, twitter:card, social banners)
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterHandle: string;
  twitterCard: 'summary_large_image' | 'summary';

  // RSS Feed
  rssTitle: string;
  rssDescription: string;
  rssLanguage: string;
  // Contact & Social (Only Instagram, Facebook, X, LinkedIn, YouTube)
  contactEmail: string;
  socialInstagram: string;
  socialFacebook: string;
  socialTwitter: string;
  socialLinkedin: string;
  socialYoutube: string;
  copyrightText: string;
  enableDropCap?: boolean;
  updatedAt?: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: 'global',
  // Website SEO
  siteTitle: 'Zwosmos | Astronomy, Space News & Skywatching',
  siteDescription: 'Explore astronomy, space news, skywatching guides, cosmic discoveries, missions, telescopes and stories from across the universe with Zwosmos.',
  siteUrl: 'https://zwosmos.com',
  keywords: 'astronomy, astrophysics, cosmology, space exploration, stargazing, universe, black holes, james webb',
  authorName: 'Zwosmos Editorial',

  // Open Graph & Social
  ogTitle: 'Zwosmos - Exploring the Cosmos & Deep Space',
  ogDescription: 'Deep space explorations, astrophysical discoveries, cosmic mechanics, and astronomical wonders from across the universe.',
  ogImage: 'https://quwukfdlvkyerrjsnieb.supabase.co/storage/v1/object/public/media/1790570690988_zwosmosastronomywebsite_homepage.png',
  twitterHandle: '@zwosmos',
  twitterCard: 'summary_large_image',

  // RSS Feed
  rssTitle: 'Zwosmos - Cosmic Dispatch Feed',
  rssDescription: 'Latest cosmology, space discoveries, and astronomical observations from Zwosmos.',
  rssLanguage: 'en-US',
  contactEmail: 'contact@zwosmos.com',
  socialInstagram: 'https://instagram.com/zwosmos',
  socialFacebook: 'https://facebook.com/zwosmos',
  socialTwitter: 'https://twitter.com/zwosmos',
  socialLinkedin: 'https://linkedin.com/company/zwosmos',
  socialYoutube: 'https://youtube.com/@zwosmos',
  copyrightText: '© 2025 - 2026 Zwosmos. All rights reserved.',
  enableDropCap: true
};

const LOCAL_STORAGE_KEY = 'zwosmos_site_settings';

function normalizeTitle(title: any): string {
  if (typeof title !== 'string') return '';
  return title.replace(/\s*[—–]\s*/g, ' - ');
}

function mapRowToSettings(row: any): SiteSettings {
  const rawTitle = row.site_title ?? row.siteTitle ?? DEFAULT_SITE_SETTINGS.siteTitle;
  const rawOgTitle = row.og_title ?? row.ogTitle ?? DEFAULT_SITE_SETTINGS.ogTitle;
  const rawRssTitle = row.rss_title ?? row.rssTitle ?? DEFAULT_SITE_SETTINGS.rssTitle;
  return {
    id: row.id || 'global',
    siteTitle: normalizeTitle(rawTitle),
    siteDescription: row.site_description ?? row.siteDescription ?? DEFAULT_SITE_SETTINGS.siteDescription,
    ogTitle: normalizeTitle(rawOgTitle),
    ogDescription: row.og_description ?? row.ogDescription ?? DEFAULT_SITE_SETTINGS.ogDescription,
    siteUrl: row.site_url ?? row.siteUrl ?? DEFAULT_SITE_SETTINGS.siteUrl,
    ogImage: row.og_image ?? row.ogImage ?? DEFAULT_SITE_SETTINGS.ogImage,
    twitterHandle: row.twitter_handle ?? row.twitterHandle ?? DEFAULT_SITE_SETTINGS.twitterHandle,
    twitterCard: (row.twitter_card ?? row.twitterCard) === 'summary' ? 'summary' : 'summary_large_image',
    keywords: row.keywords ?? DEFAULT_SITE_SETTINGS.keywords,
    authorName: row.author_name ?? row.authorName ?? DEFAULT_SITE_SETTINGS.authorName,
    rssTitle: normalizeTitle(rawRssTitle),
    rssDescription: row.rss_description ?? row.rssDescription ?? DEFAULT_SITE_SETTINGS.rssDescription,
    rssLanguage: row.rss_language ?? row.rssLanguage ?? DEFAULT_SITE_SETTINGS.rssLanguage,
    contactEmail: row.contact_email ?? row.contactEmail ?? DEFAULT_SITE_SETTINGS.contactEmail,
    socialInstagram: row.social_instagram ?? row.socialInstagram ?? DEFAULT_SITE_SETTINGS.socialInstagram,
    socialFacebook: row.social_facebook ?? row.socialFacebook ?? DEFAULT_SITE_SETTINGS.socialFacebook,
    socialTwitter: row.social_twitter ?? row.socialTwitter ?? DEFAULT_SITE_SETTINGS.socialTwitter,
    socialLinkedin: row.social_linkedin ?? row.socialLinkedin ?? DEFAULT_SITE_SETTINGS.socialLinkedin,
    socialYoutube: row.social_youtube ?? row.socialYoutube ?? DEFAULT_SITE_SETTINGS.socialYoutube,
    copyrightText: row.copyright_text ?? row.copyrightText ?? DEFAULT_SITE_SETTINGS.copyrightText,
    enableDropCap: row.enable_drop_cap !== undefined ? !!row.enable_drop_cap : (row.enableDropCap !== undefined ? !!row.enableDropCap : true),
    updatedAt: row.updated_at ?? row.updatedAt
  };
}

function mapSettingsToRow(settings: Partial<SiteSettings>, includeOgCols = true): any {
  const row: any = {
    id: 'global',
    site_title: settings.siteTitle,
    site_description: settings.siteDescription,
    site_url: settings.siteUrl,
    og_image: settings.ogImage,
    twitter_handle: settings.twitterHandle,
    twitter_card: settings.twitterCard,
    keywords: settings.keywords,
    author_name: settings.authorName,
    rss_title: settings.rssTitle,
    rss_description: settings.rssDescription,
    rss_language: settings.rssLanguage,
    contact_email: settings.contactEmail,
    social_instagram: settings.socialInstagram,
    social_facebook: settings.socialFacebook,
    social_twitter: settings.socialTwitter,
    social_linkedin: settings.socialLinkedin,
    social_youtube: settings.socialYoutube,
    copyright_text: settings.copyrightText,
    updated_at: new Date().toISOString()
  };

  if (includeOgCols) {
    if (settings.ogTitle !== undefined) row.og_title = settings.ogTitle;
    if (settings.ogDescription !== undefined) row.og_description = settings.ogDescription;
  }

  return row;
}

function getLocalSettings(): SiteSettings {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const ogImage = (!parsed.ogImage || parsed.ogImage.includes('photo-1451187580459-43490279c0fa'))
        ? DEFAULT_SITE_SETTINGS.ogImage
        : parsed.ogImage;
      return {
        ...DEFAULT_SITE_SETTINGS,
        ...parsed,
        ogImage,
        siteTitle: normalizeTitle(parsed.siteTitle ?? DEFAULT_SITE_SETTINGS.siteTitle),
        ogTitle: normalizeTitle(parsed.ogTitle ?? parsed.siteTitle ?? DEFAULT_SITE_SETTINGS.ogTitle),
        ogDescription: parsed.ogDescription ?? parsed.siteDescription ?? DEFAULT_SITE_SETTINGS.ogDescription,
        rssTitle: normalizeTitle(parsed.rssTitle ?? DEFAULT_SITE_SETTINGS.rssTitle),
        enableDropCap: parsed.enableDropCap !== undefined ? !!parsed.enableDropCap : true
      };
    }
  } catch (e) {
    console.error('Error reading settings from localStorage:', e);
  }
  return DEFAULT_SITE_SETTINGS;
}

function saveLocalSettings(settings: SiteSettings) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('zwosmos_settings_updated', { detail: settings }));
  } catch (e) {
    console.error('Error saving settings to localStorage:', e);
  }
}

export const settingsService = {
  async getSettings(): Promise<SiteSettings> {
    const local = getLocalSettings();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('*')
          .eq('id', 'global')
          .maybeSingle();

        if (!error && data) {
          const mapped = mapRowToSettings(data);
          // Preserve local ogTitle/ogDescription if DB didn't have them populated yet
          if ((!mapped.ogTitle || mapped.ogTitle === DEFAULT_SITE_SETTINGS.ogTitle) && local.ogTitle) {
            mapped.ogTitle = local.ogTitle;
          }
          if ((!mapped.ogDescription || mapped.ogDescription === DEFAULT_SITE_SETTINGS.ogDescription) && local.ogDescription) {
            mapped.ogDescription = local.ogDescription;
          }
          saveLocalSettings(mapped);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase site_settings query failed, using local/default:', err);
      }
    }
    return local;
  },

  async updateSettings(updates: Partial<SiteSettings>): Promise<SiteSettings> {
    const current = await this.getSettings();
    const merged: SiteSettings = { ...current, ...updates, updatedAt: new Date().toISOString() };

    // Always immediately save to local cache
    saveLocalSettings(merged);

    if (supabase) {
      try {
        let row = mapSettingsToRow(merged, true);
        let { data, error } = await supabase
          .from('site_settings')
          .upsert([row], { onConflict: 'id' })
          .select()
          .maybeSingle();

        // If schema cache does not have og_title / og_description yet, retry without them
        if (error && (error.message.includes('og_title') || error.message.includes('schema cache'))) {
          console.warn('og_title/og_description columns not present in Supabase table yet; saving core settings.');
          row = mapSettingsToRow(merged, false);
          const retry = await supabase
            .from('site_settings')
            .upsert([row], { onConflict: 'id' })
            .select()
            .maybeSingle();

          if (!retry.error && retry.data) {
            data = retry.data;
            error = null;
          }
        }

        if (!error && data) {
          const saved: SiteSettings = {
            ...mapRowToSettings(data),
            ogTitle: merged.ogTitle,
            ogDescription: merged.ogDescription,
            enableDropCap: merged.enableDropCap
          };
          saveLocalSettings(saved);
          return saved;
        } else if (error) {
          console.error('Supabase update site_settings error:', error);
          throw new Error(error.message);
        }
      } catch (err: any) {
        console.error('Supabase update site_settings exception:', err);
        // Fall back to saved local settings
      }
    }

    return merged;
  }
};
