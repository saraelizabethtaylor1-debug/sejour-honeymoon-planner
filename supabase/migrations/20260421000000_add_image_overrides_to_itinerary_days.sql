ALTER TABLE public.itinerary_days ADD COLUMN IF NOT EXISTS image_overrides TEXT DEFAULT '{}';
