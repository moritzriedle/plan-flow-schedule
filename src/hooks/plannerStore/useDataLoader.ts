import { useState, useEffect } from 'react';
import { Employee, Project, Allocation, Sprint } from '../../types';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { generateSprints, referenceSprintStart } from '@/utils/sprintUtils';
// import { calculateProjectDateRanges } from './utils'; // still optional

export const useDataLoader = () => {
  const { user, profile, loading: authLoading } = useAuth();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate sprints once
  useEffect(() => {
    console.log('useDataLoader: Generating sprints inside useEffect');
    const generated = generateSprints(referenceSprintStart, 100);
    setSprints(generated);
  }, []);

  console.log('useDataLoader: Hook called', {
    user: user?.id,
    authLoading,
    loading,
    profileId: profile?.id,
  });

  useEffect(() => {
    console.log('useDataLoader: useEffect triggered', { authLoading, user: user?.id });

    if (authLoading) {
      console.log('useDataLoader: Waiting for auth to complete');
      return;
    }

    if (!user) {
      console.log('useDataLoader: No user, setting loading to false');
      setLoading(false);
      return;
    }

    if (sprints.length === 0) {
      console.log('useDataLoader: Waiting for sprints to be generated');
      return;
    }

    let isCancelled = false;

    const sprintStartToId = new Map<string, string>(
      sprints.map((s) => [new Date(s.startDate).toISOString().slice(0, 10), s.id])
    );

    async function loadInitialData() {
      console.log('useDataLoader: Starting data load for user:', user.id);
      setLoading(true);

      const timeoutId = setTimeout(() => {
        console.error('useDataLoader: Data loading timeout after 10 seconds');
        if (!isCancelled) {
          setLoading(false);
          toast.error('Loading timeout - please refresh the page');
        }
      }, 10000);

      try {
        // PROFILES
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, role, image_url, is_admin, vacation_dates, archived')
          .order('role', { ascending: true });

        console.log('👥 Loaded profiles:', profilesData, profilesError);

        if (profilesError) throw profilesError;

        const mappedEmployees: Employee[] = (profilesData ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          role: p.role,
          imageUrl: p.image_url || undefined,
          vacationDates: Array.isArray(p.vacation_dates) ? (p.vacation_dates as string[]) : [],
          archived: p.archived || false,
        }));

        // PROJECTS
        const { data: projectsData, error: projectsError } = await supabase.from('projects').select('*');
        if (projectsError) throw projectsError;

        const mappedProjects: Project[] = (projectsData ?? []).map((project: any) => ({
          id: project.id,
          name: project.name,
          color: project.color as 'blue' | 'purple' | 'pink' | 'orange' | 'green',
          startDate: project.start_date ? new Date(project.start_date) : null,
          endDate: project.end_date ? new Date(project.end_date) : null,
          leadId: project.lead_id || undefined,
          ticketReference: project.ticket_reference || undefined,
          archived: project.archived || false,
        }));

        // ALLOCATIONS
        // Select explicit columns so we can safely fallback to week
        const { data: allocationsData, error: allocationsError } = await supabase
          .from('allocations')
          .select('id, user_id, project_id, sprint_id, week, days');

        if (allocationsError) throw allocationsError;

        const mappedAllocations: Allocation[] = (allocationsData ?? []).map((alloc: any) => {
          // Prefer sprint_id, but for older rows derive from week (YYYY-MM-DD)
          let sprintId: string = alloc.sprint_id || '';

          if (!sprintId && alloc.week) {
            const weekStr = String(alloc.week).slice(0, 10); // "YYYY-MM-DD"
            sprintId = sprintStartToId.get(weekStr) || '';
          }

          return {
            id: alloc.id,
            employeeId: alloc.user_id,
            projectId: alloc.project_id,
            sprintId,
            days: alloc.days,
          };
        });

        // Optional: derive project ranges from allocations (kept disabled as in your file)
        let finalProjects = mappedProjects;

        // if (mappedAllocations.length && finalProjects.length) {
        //   finalProjects = calculateProjectDateRanges(finalProjects, mappedAllocations, sprints);
        // }

        finalProjects.sort((a, b) => a.name.localeCompare(b.name));

        if (!isCancelled) {
          setEmployees(mappedEmployees);
          setProjects(finalProjects);
          setAllocations(mappedAllocations);
        }

        console.log('Loaded from Supabase:', {
          employees: mappedEmployees,
          projects: finalProjects,
          allocations: mappedAllocations,
        });
      } catch (error) {
        console.error('Error loading data from Supabase:', error);
        toast.error('Failed to load data');

        if (!isCancelled) {
          setEmployees([]);
          setProjects([]);
          setAllocations([]);
        }
      } finally {
        clearTimeout(timeoutId);
        if (!isCancelled) {
          setLoading(false);
          console.log('useDataLoader: Data loading completed');
        }
      }
    }

    loadInitialData();

    return () => {
      console.log('useDataLoader: Cleanup function called');
      isCancelled = true;
    };
  }, [user?.id, authLoading, sprints]);

  return {
    employees,
    projects,
    allocations,
    sprints,
    loading,
    setEmployees,
    setProjects,
    setAllocations,
    setSprints,
  };
};
