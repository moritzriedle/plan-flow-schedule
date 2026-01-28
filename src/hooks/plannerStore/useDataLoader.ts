import { useState, useEffect } from 'react';
import { Employee, Project, Allocation, Sprint } from '../../types';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { generateSprints, referenceSprintStart } from '@/utils/sprintUtils';

const PAGE_SIZE = 1000;

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Fetch all rows for a query using PostgREST range pagination (avoids the ~1000 row limit).
 * You must provide a stable order column that exists in the selected columns.
 */
async function fetchAllPaged<T>(
  fetchPage: (from: number, to: number) => Promise<{ data: T[] | null; error: any }>
): Promise<T[]> {
  let from = 0;
  const all: T[] = [];

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await fetchPage(from, to);
    if (error) throw error;

    const rows = data ?? [];
    all.push(...rows);

    if (rows.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return all;
}

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
        // --- Determine window: current sprint + next 30 ---
        const today = new Date();

        const activeIdx = sprints.findIndex((s) => {
          const start = new Date(s.startDate);
          const end = new Date(s.endDate);
          return start <= today && today <= end;
        });

        const nextFutureIdx =
          activeIdx >= 0
            ? activeIdx
            : Math.max(
                0,
                sprints.findIndex((s) => new Date(s.startDate) >= today)
              );

        const windowSprints = sprints.slice(nextFutureIdx, nextFutureIdx + 31);

        const windowStart = windowSprints[0];
        const windowEnd = windowSprints[windowSprints.length - 1];

        const windowStartStr = windowStart ? isoDate(new Date(windowStart.startDate)) : null;
        const windowEndStr = windowEnd ? isoDate(new Date(windowEnd.endDate)) : null;

        const sprintIdsInWindow = windowSprints.map((s) => s.id);

        // Lookup: sprint start date -> sprint id (used for week fallback mapping)
        const sprintStartToId = new Map<string, string>(
          windowSprints.map((s) => [isoDate(new Date(s.startDate)), s.id])
        );

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
        // We fetch by week-range (captures older rows without sprint_id),
        // AND by sprint_id IN (...) (captures rows where week might be null).
        // Both are paginated to avoid the 1000 cap.

        const byWeek: any[] =
          windowStartStr && windowEndStr
            ? await fetchAllPaged<any>(async (from, to) => {
                return await supabase
                  .from('allocations')
                  .select('id, user_id, project_id, sprint_id, week, days')
                  .gte('week', windowStartStr)
                  .lte('week', windowEndStr)
                  .order('id', { ascending: true })
                  .range(from, to);
              })
            : [];

        const bySprintId: any[] =
          sprintIdsInWindow.length > 0
            ? await fetchAllPaged<any>(async (from, to) => {
                return await supabase
                  .from('allocations')
                  .select('id, user_id, project_id, sprint_id, week, days')
                  .in('sprint_id', sprintIdsInWindow)
                  .order('id', { ascending: true })
                  .range(from, to);
              })
            : [];

        // De-dupe (same row can appear in both queries)
        const mergedMap = new Map<string, any>();
        for (const row of byWeek) mergedMap.set(row.id, row);
        for (const row of bySprintId) mergedMap.set(row.id, row);

        const mergedAllocationsRaw = Array.from(mergedMap.values());

        const mappedAllocations: Allocation[] = mergedAllocationsRaw.map((alloc: any) => {
          // Prefer sprint_id; if missing, derive from week (YYYY-MM-DD)
          let sprintId: string = alloc.sprint_id || '';

          if (!sprintId && alloc.week) {
            const weekStr = String(alloc.week).slice(0, 10);
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

        // Sort projects alphabetically
        mappedProjects.sort((a, b) => a.name.localeCompare(b.name));

        if (!isCancelled) {
          setEmployees(mappedEmployees);
          setProjects(mappedProjects);
          setAllocations(mappedAllocations);
        }

        console.log('Loaded from Supabase:', {
          employees: mappedEmployees,
          projects: mappedProjects,
          allocationsCount: mappedAllocations.length,
          window: {
            start: windowStartStr,
            end: windowEndStr,
            sprintCount: windowSprints.length,
          },
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
