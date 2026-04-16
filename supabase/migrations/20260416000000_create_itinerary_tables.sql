
-- itinerary_days table
-- Note: id is TEXT (not UUID) to match the string-based IDs used in ItineraryDay
CREATE TABLE public.itinerary_days (
  id TEXT NOT NULL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  title TEXT DEFAULT '',
  date TEXT DEFAULT '',
  destination TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.itinerary_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own itinerary days" ON public.itinerary_days FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own itinerary days" ON public.itinerary_days FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own itinerary days" ON public.itinerary_days FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own itinerary days" ON public.itinerary_days FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_itinerary_days_updated_at BEFORE UPDATE ON public.itinerary_days
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- itinerary_activities table
CREATE TABLE public.itinerary_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_id TEXT NOT NULL REFERENCES public.itinerary_days(id) ON DELETE CASCADE,
  title TEXT DEFAULT '',
  location TEXT DEFAULT '',
  time TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.itinerary_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own itinerary activities" ON public.itinerary_activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own itinerary activities" ON public.itinerary_activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own itinerary activities" ON public.itinerary_activities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own itinerary activities" ON public.itinerary_activities FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_itinerary_activities_updated_at BEFORE UPDATE ON public.itinerary_activities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
