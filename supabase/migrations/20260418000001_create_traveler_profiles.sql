CREATE TABLE IF NOT EXISTS public.traveler_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  passport_number TEXT DEFAULT '',
  passport_expiry TEXT DEFAULT '',
  date_of_birth TEXT DEFAULT '',
  nationality TEXT DEFAULT '',
  dietary_restrictions TEXT DEFAULT '',
  emergency_contact_name TEXT DEFAULT '',
  emergency_contact_phone TEXT DEFAULT '',
  preferred_airline TEXT DEFAULT '',
  seat_preference TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.traveler_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own traveler profiles" ON public.traveler_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own traveler profiles" ON public.traveler_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own traveler profiles" ON public.traveler_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own traveler profiles" ON public.traveler_profiles FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_traveler_profiles_updated_at BEFORE UPDATE ON public.traveler_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
