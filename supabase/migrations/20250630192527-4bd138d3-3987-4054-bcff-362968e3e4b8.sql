
-- Add vacation_dates column to profiles table if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS vacation_dates jsonb DEFAULT '[]'::jsonb;

-- Add ticket_reference column to projects table if it doesn't exist  
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS ticket_reference text;

-- Update existing profiles to have empty vacation_dates array if null
UPDATE public.profiles 
SET vacation_dates = '[]'::jsonb 
WHERE vacation_dates IS NULL;
