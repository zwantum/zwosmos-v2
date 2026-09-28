-- Migration: 00008_add_subtitle_to_cosmic.sql
-- Description: Add subtitle/heading column to daily_cosmic and cosmic_entries for "This Day in Astronomy"

ALTER TABLE public.daily_cosmic 
  ADD COLUMN IF NOT EXISTS astronomy_subtitle TEXT DEFAULT '';

ALTER TABLE public.cosmic_entries 
  ADD COLUMN IF NOT EXISTS subtitle TEXT DEFAULT '';