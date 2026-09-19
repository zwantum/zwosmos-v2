-- Migration: 00005_create_daily_cosmic.sql
-- Description: Create daily_cosmic table to store dynamic "This Day in Astronomy" and "Space Fact of the Day" content

CREATE TABLE IF NOT EXISTS public.daily_cosmic (
  id TEXT PRIMARY KEY DEFAULT 'current',
  astronomy_title TEXT NOT NULL DEFAULT 'This Day in Astronomy',
  astronomy_date TEXT NOT NULL DEFAULT 'September 18, 1977',
  astronomy_content TEXT NOT NULL DEFAULT '<p>On this day in 1977, Voyager 1 looked back across millions of miles of deep space to capture the first-ever image of the Earth and Moon together in a single frame—a luminous blue jewel paired with its companion, poised against the silent cosmic abyss.</p>',
  fact_title TEXT NOT NULL DEFAULT 'SPACE FACT OF THE DAY',
  fact_content TEXT NOT NULL DEFAULT '<p>If two pieces of the same type of metal touch in the vacuum of space, they will bond permanently into a single solid piece through cold welding. On Earth, a thin oxide film keeps metal atoms apart, but in the pure void, the atoms have no idea they belong to different pieces.</p>',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security
ALTER TABLE public.daily_cosmic ENABLE ROW LEVEL SECURITY;

-- Allow public read access to daily_cosmic for homepage readers
CREATE POLICY "Allow public read access to daily_cosmic"
  ON public.daily_cosmic
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert/update daily_cosmic
CREATE POLICY "Allow authenticated users to manage daily_cosmic"
  ON public.daily_cosmic
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Seed initial row
INSERT INTO public.daily_cosmic (id)
VALUES ('current')
ON CONFLICT (id) DO NOTHING;
