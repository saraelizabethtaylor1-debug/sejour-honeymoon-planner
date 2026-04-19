-- Ensure all transport_items columns exist, regardless of which prior migrations
-- were tracked in this Supabase project's migration history.
ALTER TABLE public.transport_items ADD COLUMN IF NOT EXISTS date TEXT DEFAULT '';
ALTER TABLE public.transport_items ADD COLUMN IF NOT EXISTS takeoff_date TEXT DEFAULT '';
ALTER TABLE public.transport_items ADD COLUMN IF NOT EXISTS takeoff_time TEXT DEFAULT '';
ALTER TABLE public.transport_items ADD COLUMN IF NOT EXISTS landing_date TEXT DEFAULT '';
ALTER TABLE public.transport_items ADD COLUMN IF NOT EXISTS landing_time TEXT DEFAULT '';
