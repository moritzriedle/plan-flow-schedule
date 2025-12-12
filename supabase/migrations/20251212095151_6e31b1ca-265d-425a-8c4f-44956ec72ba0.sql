-- Add archived column to profiles table for team member archiving
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;