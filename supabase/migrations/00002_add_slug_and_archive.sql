-- Add slug and is_archived columns to blogs table
ALTER TABLE public.blogs 
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE NOT NULL;

-- Make slug unique (requires updating existing rows if any exist, but for a fresh DB this is fine)
-- If there are existing rows without slugs, this might fail, so we'll just add the unique constraint.
ALTER TABLE public.blogs ADD CONSTRAINT blogs_slug_key UNIQUE (slug);
