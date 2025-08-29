import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { generateSprints, referenceSprintStart } from '@/utils/sprintUtils';
import { calculateProjectDateRanges } from '@/hooks/plannerStore/utils';
import { Employee, Project, Allocation, Sprint } from '@/types';

type AuthUser = { id: string } | null;
type AuthProfile = {
  id: string;
  name: string;
  role: string;
  image_url?: string;
  is_admin?: boolean;
  vacation_dates?: string[];
} | null;

const AuthContext = createContext<{
  user: AuthUser;
  profile: AuthProfile;
  loading: boolean;
}>({
  user: null,
  profile: null,
  loading: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser>(null);
  const [profile, setProfile] = useState<AuthProfile>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id });
        // Optionally fetch profile here
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id });
        // Optionally fetch profile here
      }
      setLoading(false);
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  return useContext(AuthContext);
}

export const useDataLoader = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSprints(generateSprints(referenceSprintStart, 100));
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    if (sprints.length === 0) return;

    let isCancelled = false;
    setLoading(true);

    const timeoutId = setTimeout(() => {
      if (!isCancelled) {
        setLoading(false);
        toast.error('Loading timeout - please refresh the page');
      }
    }, 10000);

    async function loadInitialData() {
      try {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, role, image_url, is_admin, vacation_dates')
          .order('role', { ascending: true });

        if (profilesError || !profilesData) throw profilesError || new Error('No profiles data');

        const mappedEmployees: Employee[] = profilesData.map((profile: any) => ({
          id: profile.id,
          name: profile.name,
          role: profile.role,
          imageUrl: profile.image_url ?? undefined,
          vacationDates: Array.isArray(profile.vacation_dates) ? profile.vacation_dates : []
        }));

        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*');

        if (projectsError || !projectsData) throw projectsError || new Error('No projects data');

        const mappedProjects: Project[] = projectsData.map(project => ({
          id: project.id,
          name: project.name,
          color: project.color as 'blue' | 'purple' | 'pink' | 'orange' | 'green',
          startDate: project.start_date ? new Date(project.start_date) : undefined,
          endDate: project.end_date ? new Date(project.end_date) : undefined,
          leadId: project.lead_id || undefined,
          ticketReference: project.ticket_reference || undefined
        }));

        const { data: allocationsData, error: allocationsError } = await supabase
          .from('allocations')
          .select('*');

        if (allocationsError || !allocationsData) throw allocationsError || new Error('No allocations data');

        const mappedAllocations: Allocation[] = allocationsData.map(alloc => ({
          id: alloc.id,
          employeeId: alloc.user_id,
          projectId: alloc.project_id,
          sprintId: alloc.sprint_id,
          days: alloc.days
        }));

        let finalProjects = mappedProjects;
        if (mappedAllocations.length && finalProjects.length) {
          finalProjects = calculateProjectDateRanges(finalProjects, mappedAllocations, sprints);
        }
        finalProjects.sort((a, b) => a.name.localeCompare(b.name));

        setEmployees(mappedEmployees);
        setProjects(finalProjects);
        setAllocations(mappedAllocations);
      } catch (error) {
        toast.error('Failed to load data');
        setEmployees([]);
        setProjects([]);
        setAllocations([]);
      } finally {
        clearTimeout(timeoutId);
        if (!isCancelled) setLoading(false);
      }
    }

    loadInitialData();

    return () => {
      isCancelled = true;
    };
  }, [user?.id, authLoading, sprints.length]);

  return {
    employees,
    projects,
    allocations,
    sprints,
    loading,
    setEmployees,
    setProjects,
    setAllocations,
    setSprints
  };
};

// Supabase queries use only 'profiles', 'projects', and 'allocations' tables.
// No usage of 'public.users' table.
// Auth logic uses Supabase Auth API, which does not require direct queries to 'public.users'.
// No queries to 'users' or 'public.users' table.