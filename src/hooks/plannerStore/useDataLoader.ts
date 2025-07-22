import { useState, useEffect } from 'react';
import { Employee, Project, Allocation, Sprint } from '../../types';
import { sampleProjects, sampleAllocations } from '../../data/sampleData';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { generateSprints } from '@/utils/sprintUtils';
import { dateToSprintId, calculateProjectDateRanges } from './utils';

export const useDataLoader = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const referenceSprintStart = new Date(2024, 5, 24); // June 24, 2024

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>(() => {
    console.log('useDataLoader: Generating initial sprints');
    return generateSprints(referenceSprintStart, 100);
  });
  const [loading, setLoading] = useState(true);
  
  console.log('useDataLoader: Hook called', { 
    user: user?.id, 
    authLoading, 
    loading,
    profileId: profile?.id
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
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*');
          
        if (profilesError) {
          throw profilesError;
        }
        
        console.log('Loaded profiles data:', profilesData);
        
        const mappedEmployees: Employee[] = profilesData.map(profile => ({
          id: profile.id,
          name: profile.name,
          role: profile.role,
          imageUrl: profile.image_url || undefined,
          vacationDates: Array.isArray(profile.vacation_dates) ? profile.vacation_dates as string[] : []
        }));
        
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*');
          
        if (projectsError) {
          throw projectsError;
        }
        
        const mappedProjects: Project[] = projectsData.map(project => ({
          id: project.id,
          name: project.name,
          color: project.color as 'blue' | 'purple' | 'pink' | 'orange' | 'green',
          startDate: new Date(),  
          endDate: new Date(),    
          leadId: project.lead_id || undefined,
          ticketReference: project.ticket_reference || undefined
        }));
        
        const { data: allocationsData, error: allocationsError } = await supabase
          .from('allocations')
          .select('*');
          
        if (allocationsError) {
          throw allocationsError;
        }
        
        const mappedAllocations: Allocation[] = allocationsData.map(alloc => ({
          id: alloc.id,
          employeeId: alloc.user_id,
          projectId: alloc.project_id,
          sprintId: dateToSprintId(alloc.week, sprints),
          days: alloc.days
        }));
        
        let finalProjects = mappedProjects.length ? mappedProjects : sampleProjects;
        if (mappedAllocations.length && finalProjects.length) {
          finalProjects = calculateProjectDateRanges(finalProjects, mappedAllocations, sprints);
        }
        
        // Sort projects alphabetically by name
        finalProjects.sort((a, b) => a.name.localeCompare(b.name));
        
        setEmployees(mappedEmployees);
        setProjects(finalProjects);
        setAllocations(mappedAllocations);
        
        console.log('Loaded from Supabase:', { 
          employees: mappedEmployees, 
          projects: finalProjects, 
          allocations: mappedAllocations 
        });
      } catch (error) {
        console.error('Error loading data from Supabase:', error);
        toast.error('Failed to load data');
        
        // Sort sample projects alphabetically as well
        const sortedSampleProjects = [...sampleProjects].sort((a, b) => a.name.localeCompare(b.name));
        
        setEmployees([]);
        setProjects(sortedSampleProjects);
        setAllocations([]);
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
  }, [user?.id, authLoading]);

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
