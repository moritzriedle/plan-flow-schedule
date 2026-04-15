
-- Create planning_scenarios table
CREATE TABLE public.planning_scenarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'committed')),
  sprint_shift INTEGER NOT NULL DEFAULT 0,
  last_saved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Only one draft scenario per project
CREATE UNIQUE INDEX idx_one_draft_per_project ON public.planning_scenarios (project_id) WHERE status = 'draft';

-- Enable RLS
ALTER TABLE public.planning_scenarios ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view scenarios"
  ON public.planning_scenarios FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized roles can insert scenarios"
  ON public.planning_scenarios FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND (p.is_admin = true OR p.role = ANY(ARRAY['Manager','Product Manager','Product Owner','Technical Project Manager']))
  ));

CREATE POLICY "Authorized roles can update scenarios"
  ON public.planning_scenarios FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND (p.is_admin = true OR p.role = ANY(ARRAY['Manager','Product Manager','Product Owner','Technical Project Manager']))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND (p.is_admin = true OR p.role = ANY(ARRAY['Manager','Product Manager','Product Owner','Technical Project Manager']))
  ));

CREATE POLICY "Authorized roles can delete scenarios"
  ON public.planning_scenarios FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND (p.is_admin = true OR p.role = ANY(ARRAY['Manager','Product Manager','Product Owner','Technical Project Manager']))
  ));

-- Trigger for updated_at
CREATE TRIGGER update_planning_scenarios_updated_at
  BEFORE UPDATE ON public.planning_scenarios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create scenario_allocations table
CREATE TABLE public.scenario_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scenario_id UUID NOT NULL REFERENCES public.planning_scenarios(id) ON DELETE CASCADE,
  employee_id UUID,
  role TEXT,
  sprint_id TEXT NOT NULL,
  days INTEGER NOT NULL DEFAULT 1,
  note TEXT,
  is_placeholder BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scenario_allocations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view scenario allocations"
  ON public.scenario_allocations FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authorized roles can insert scenario allocations"
  ON public.scenario_allocations FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND (p.is_admin = true OR p.role = ANY(ARRAY['Manager','Product Manager','Product Owner','Technical Project Manager']))
  ));

CREATE POLICY "Authorized roles can update scenario allocations"
  ON public.scenario_allocations FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND (p.is_admin = true OR p.role = ANY(ARRAY['Manager','Product Manager','Product Owner','Technical Project Manager']))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND (p.is_admin = true OR p.role = ANY(ARRAY['Manager','Product Manager','Product Owner','Technical Project Manager']))
  ));

CREATE POLICY "Authorized roles can delete scenario allocations"
  ON public.scenario_allocations FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND (p.is_admin = true OR p.role = ANY(ARRAY['Manager','Product Manager','Product Owner','Technical Project Manager']))
  ));

-- Trigger for updated_at
CREATE TRIGGER update_scenario_allocations_updated_at
  BEFORE UPDATE ON public.scenario_allocations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast lookups
CREATE INDEX idx_scenario_allocations_scenario_id ON public.scenario_allocations(scenario_id);
CREATE INDEX idx_scenario_allocations_employee_id ON public.scenario_allocations(employee_id);
CREATE INDEX idx_scenario_allocations_sprint_id ON public.scenario_allocations(sprint_id);
