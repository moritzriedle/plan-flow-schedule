-- Create project_support_requests table to track support needs per project
CREATE TABLE public.project_support_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  support_needed BOOLEAN NOT NULL DEFAULT false,
  needed_roles TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id)
);

-- Enable Row Level Security
ALTER TABLE public.project_support_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for project support requests
CREATE POLICY "Authenticated users can view support requests" 
ON public.project_support_requests 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and authorized roles can manage support requests" 
ON public.project_support_requests 
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.id = auth.uid() 
  AND (p.is_admin = true OR p.role = ANY (ARRAY['Manager'::text, 'Product Manager'::text, 'Product Owner'::text, 'Technical Project Manager'::text]))
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles p
  WHERE p.id = auth.uid() 
  AND (p.is_admin = true OR p.role = ANY (ARRAY['Manager'::text, 'Product Manager'::text, 'Product Owner'::text, 'Technical Project Manager'::text]))
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_project_support_requests_updated_at
BEFORE UPDATE ON public.project_support_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();