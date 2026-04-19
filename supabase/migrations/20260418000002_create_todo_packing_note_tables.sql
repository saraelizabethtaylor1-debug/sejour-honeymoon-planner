-- Todo items
CREATE TABLE IF NOT EXISTS public.todo_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL DEFAULT '',
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.todo_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own todos" ON public.todo_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own todos" ON public.todo_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own todos" ON public.todo_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own todos" ON public.todo_items FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_todo_items_updated_at BEFORE UPDATE ON public.todo_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Packing items
CREATE TABLE IF NOT EXISTS public.packing_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL DEFAULT '',
  packed BOOLEAN NOT NULL DEFAULT false,
  traveler TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.packing_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own packing items" ON public.packing_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own packing items" ON public.packing_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own packing items" ON public.packing_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own packing items" ON public.packing_items FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_packing_items_updated_at BEFORE UPDATE ON public.packing_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Note items
CREATE TABLE IF NOT EXISTS public.note_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.note_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notes" ON public.note_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes" ON public.note_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON public.note_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON public.note_items FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_note_items_updated_at BEFORE UPDATE ON public.note_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
