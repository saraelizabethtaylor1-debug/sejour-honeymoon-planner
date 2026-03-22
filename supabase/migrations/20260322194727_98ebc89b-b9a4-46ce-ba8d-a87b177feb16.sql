
-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  destination TEXT DEFAULT '',
  days INTEGER DEFAULT 7,
  trip_date TEXT DEFAULT '',
  names TEXT DEFAULT '',
  quote TEXT DEFAULT '"You are my greatest adventure yet"',
  cover_image TEXT,
  clock_format TEXT DEFAULT '12h' CHECK (clock_format IN ('12h', '24h')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Transport items
CREATE TABLE public.transport_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT '',
  details TEXT DEFAULT '',
  confirmation TEXT DEFAULT '',
  time TEXT DEFAULT '',
  cost NUMERIC DEFAULT 0,
  departure_location TEXT,
  departure_lat DOUBLE PRECISION,
  departure_lng DOUBLE PRECISION,
  arrival_location TEXT,
  arrival_lat DOUBLE PRECISION,
  arrival_lng DOUBLE PRECISION,
  location TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.transport_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transport" ON public.transport_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transport" ON public.transport_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transport" ON public.transport_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transport" ON public.transport_items FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_transport_items_updated_at BEFORE UPDATE ON public.transport_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Accommodation items
CREATE TABLE public.accommodation_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  address TEXT DEFAULT '',
  check_in TEXT DEFAULT '',
  check_in_time TEXT DEFAULT '',
  check_out TEXT DEFAULT '',
  check_out_time TEXT DEFAULT '',
  confirmation TEXT DEFAULT '',
  cost NUMERIC DEFAULT 0,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.accommodation_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own accommodations" ON public.accommodation_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own accommodations" ON public.accommodation_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accommodations" ON public.accommodation_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own accommodations" ON public.accommodation_items FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_accommodation_items_updated_at BEFORE UPDATE ON public.accommodation_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Activity items
CREATE TABLE public.activity_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  notes TEXT DEFAULT '',
  time TEXT DEFAULT '',
  confirmation TEXT DEFAULT '',
  cost NUMERIC DEFAULT 0,
  location TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own activities" ON public.activity_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities" ON public.activity_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own activities" ON public.activity_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own activities" ON public.activity_items FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_activity_items_updated_at BEFORE UPDATE ON public.activity_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Reservation items
CREATE TABLE public.reservation_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  date TEXT DEFAULT '',
  time TEXT DEFAULT '',
  confirmation TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  cost NUMERIC DEFAULT 0,
  location TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reservation_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reservations" ON public.reservation_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reservations" ON public.reservation_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reservations" ON public.reservation_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reservations" ON public.reservation_items FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_reservation_items_updated_at BEFORE UPDATE ON public.reservation_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
