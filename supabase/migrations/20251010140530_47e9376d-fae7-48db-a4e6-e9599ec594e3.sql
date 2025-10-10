-- Add archived column to projects table
ALTER TABLE public.projects 
ADD COLUMN archived boolean NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.projects.archived IS 'Whether the project is archived/locked. Archived projects cannot receive new allocations or modifications.';