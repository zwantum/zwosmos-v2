-- Migration: 00009_add_og_columns_to_site_settings.sql
-- Description: Add dedicated og_title and og_description columns to site_settings table.

ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS og_title TEXT,
ADD COLUMN IF NOT EXISTS og_description TEXT;
