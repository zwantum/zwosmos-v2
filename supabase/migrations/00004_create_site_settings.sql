-- Migration: 00004_create_site_settings.sql
-- Description: Create site_settings table for website Open Graph, SEO, RSS and general site configuration.

CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  site_title TEXT NOT NULL DEFAULT 'Zwosmos - Exploring the Cosmos & Deep Space',
  site_description TEXT NOT NULL DEFAULT 'Deep space explorations, astrophysical discoveries, cosmic mechanics, and astronomical wonders from across the universe.',
  site_url TEXT NOT NULL DEFAULT 'https://zwosmos.com',
  og_image TEXT DEFAULT 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
  twitter_handle TEXT DEFAULT '@zwosmos',
  twitter_card TEXT DEFAULT 'summary_large_image',
  keywords TEXT DEFAULT 'astronomy, astrophysics, cosmology, space exploration, stargazing, universe, black holes',
  author_name TEXT DEFAULT 'Zwosmos Editorial',
  contact_email TEXT DEFAULT 'contact@zwosmos.com',
  rss_title TEXT DEFAULT 'Zwosmos - Cosmic Dispatch Feed',
  rss_description TEXT DEFAULT 'Latest cosmology, space discoveries, and astronomical observations from Zwosmos.',
  rss_language TEXT DEFAULT 'en-US',
  social_instagram TEXT DEFAULT 'https://instagram.com/zwosmos',
  social_facebook TEXT DEFAULT 'https://facebook.com/zwosmos',
  social_twitter TEXT DEFAULT 'https://twitter.com/zwosmos',
  social_linkedin TEXT DEFAULT 'https://linkedin.com/company/zwosmos',
  social_youtube TEXT DEFAULT 'https://youtube.com/@zwosmos',
  copyright_text TEXT DEFAULT '© 2026 Zwosmos. All rights reserved.',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to site settings (for SEO, metadata and header/footer)
CREATE POLICY "Allow public read access to site_settings"
  ON public.site_settings
  FOR SELECT
  USING (true);

-- Allow authenticated users or service role to update/insert settings
CREATE POLICY "Allow authenticated users to manage site_settings"
  ON public.site_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert initial default record if not exists
INSERT INTO public.site_settings (id)
VALUES ('global')
ON CONFLICT (id) DO NOTHING;
