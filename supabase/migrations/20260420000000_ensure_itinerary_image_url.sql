-- Ensure image_url column exists on itinerary_activities.
-- The CREATE TABLE in 20260416000000 may have run before this column was added,
-- or the table may have been created via the Dashboard without it.
ALTER TABLE public.itinerary_activities ADD COLUMN IF NOT EXISTS image_url TEXT;
