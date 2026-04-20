-- Ensure all itinerary columns exist regardless of which prior migrations were applied.
-- The CREATE TABLE in 20260416000000 may have run before these columns were added,
-- or the tables may have been created via the Dashboard in an earlier schema version.

-- itinerary_days columns
ALTER TABLE public.itinerary_days ADD COLUMN IF NOT EXISTS destination TEXT DEFAULT '';
ALTER TABLE public.itinerary_days ADD COLUMN IF NOT EXISTS date TEXT DEFAULT '';
ALTER TABLE public.itinerary_days ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '';

-- itinerary_activities columns
ALTER TABLE public.itinerary_activities ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.itinerary_activities ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';
ALTER TABLE public.itinerary_activities ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
ALTER TABLE public.itinerary_activities ADD COLUMN IF NOT EXISTS time TEXT DEFAULT '';
