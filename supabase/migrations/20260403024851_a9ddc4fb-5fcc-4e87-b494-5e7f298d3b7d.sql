ALTER TABLE public.profiles 
ALTER COLUMN quote SET DEFAULT '"you are my greatest adventure yet"';

-- Update existing records that have the default capitalized quote
UPDATE public.profiles 
SET quote = '"you are my greatest adventure yet"' 
WHERE quote = '"You are my greatest adventure yet"';