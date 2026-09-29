-- Migration: 00006_create_cosmic_entries.sql
-- Description: Create cosmic_entries table to store library of astronomy milestones and space facts.
--   Facts auto-rollover at midnight IST based on astronomy_date (month+day match).
--   No manual scheduling — status is one of: live, draft, archived.

CREATE TABLE IF NOT EXISTS public.cosmic_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('astronomy', 'fact')),
  title TEXT NOT NULL,
  astronomy_date TEXT,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'live' CHECK (status IN ('live', 'draft', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security
ALTER TABLE public.cosmic_entries ENABLE ROW LEVEL SECURITY;

-- Allow public read access to cosmic_entries
DROP POLICY IF EXISTS "Allow public read access to cosmic_entries" ON public.cosmic_entries;
CREATE POLICY "Allow public read access to cosmic_entries"
  ON public.cosmic_entries
  FOR SELECT
  USING (true);

-- Allow authenticated users to manage cosmic_entries
DROP POLICY IF EXISTS "Allow authenticated users to manage cosmic_entries" ON public.cosmic_entries;
CREATE POLICY "Allow authenticated users to manage cosmic_entries"
  ON public.cosmic_entries
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Seed initial records from current defaults (only if not already present)
INSERT INTO public.cosmic_entries (type, title, astronomy_date, content, status)
SELECT 
  'astronomy',
  'This Day in Astronomy',
  'September 18, 1977',
  '<p>On this day in 1977, Voyager 1 looked back across millions of miles of deep space to capture the first-ever image of the Earth and Moon together in a single frame—a luminous blue jewel paired with its companion, poised against the silent cosmic abyss.</p>',
  'live'
WHERE NOT EXISTS (
  SELECT 1 FROM public.cosmic_entries WHERE type = 'astronomy' AND astronomy_date = 'September 18, 1977'
);

