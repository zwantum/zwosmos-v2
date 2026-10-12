-- Migration: 00009_allow_terminology_type.sql
-- Description: Allow 'terminology' type in cosmic_entries and add terminology columns to daily_cosmic

-- 1. Update cosmic_entries type constraint to include 'terminology'
ALTER TABLE public.cosmic_entries
  DROP CONSTRAINT IF EXISTS cosmic_entries_type_check;

ALTER TABLE public.cosmic_entries
  ADD CONSTRAINT cosmic_entries_type_check
  CHECK (type IN ('astronomy', 'fact', 'terminology'));

-- 2. Add terminology fields to daily_cosmic table if not exists
ALTER TABLE public.daily_cosmic 
  ADD COLUMN IF NOT EXISTS terminology_title TEXT DEFAULT 'Space Terminologies',
  ADD COLUMN IF NOT EXISTS terminology_subtitle TEXT DEFAULT 'Gravitational Lensing',
  ADD COLUMN IF NOT EXISTS terminology_content TEXT DEFAULT '<p>Gravitational lensing occurs when a massive celestial object — such as a galaxy cluster or supermassive black hole — warps the fabric of spacetime, bending and magnifying the light of distant background galaxies like a cosmic telescope.</p>';
