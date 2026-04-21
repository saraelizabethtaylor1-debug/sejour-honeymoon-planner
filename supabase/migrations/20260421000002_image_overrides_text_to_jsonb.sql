ALTER TABLE public.itinerary_days
  ALTER COLUMN image_overrides TYPE jsonb
  USING COALESCE(NULLIF(image_overrides, '')::jsonb, '{}'::jsonb);

ALTER TABLE public.itinerary_days
  ALTER COLUMN image_overrides SET DEFAULT '{}'::jsonb;
