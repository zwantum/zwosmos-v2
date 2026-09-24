-- Migration: 00007_remove_scheduled_status.sql
-- Description: Remove date/time scheduling from cosmic_entries.
--   - Migrate any existing 'scheduled' entries to 'draft'
--   - Drop the scheduled_at column (no longer needed)
--   - Update the status CHECK constraint: remove 'scheduled', keep live/draft/archived
--   - Fact entries now use astronomy_date (month+day) for midnight IST auto-rollover only

-- Step 1: Demote any 'scheduled' entries to 'draft' so they are safely preserved
UPDATE public.cosmic_entries
SET
  status = 'draft',
  updated_at = timezone('utc'::text, now())
WHERE status = 'scheduled';

-- Step 2: Drop the old status CHECK constraint (PostgreSQL requires dropping by name)
--   The constraint was created inline in the CREATE TABLE so its auto-name is
--   cosmic_entries_status_check — drop it if it exists.
ALTER TABLE public.cosmic_entries
  DROP CONSTRAINT IF EXISTS cosmic_entries_status_check;

-- Step 3: Add the updated CHECK constraint without 'scheduled'
ALTER TABLE public.cosmic_entries
  ADD CONSTRAINT cosmic_entries_status_check
  CHECK (status IN ('live', 'draft', 'archived'));

-- Step 4: Drop the scheduled_at column entirely
ALTER TABLE public.cosmic_entries
  DROP COLUMN IF EXISTS scheduled_at;

-- Step 5: Ensure the seed fact entry has astronomy_date = '' (not NULL) for fact rows
--   so the rollover logic can safely read it
UPDATE public.cosmic_entries
SET astronomy_date = ''
WHERE type = 'fact' AND astronomy_date IS NULL;
