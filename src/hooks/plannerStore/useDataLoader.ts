import { useState, useEffect } from 'react';
import { Employee, Project, Allocation, Sprint } from '../../types';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { generateSprints, referenceSprintStart, calculateSprintNumber } from '@/utils/sprintUtils';
import {calculateProjectDateRanges } from './utils';

export const useDataLoader = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]); 
  useEffect(() => {
    console.log('useDataLoader: Generating sprints inside useEffect');
    const generated = generateSprints(referenceSprintStart, 100);
    setSprints(generated);

    // Debug: Log generated sprint IDs for comparison
    console.log('Generated Sprint IDs:', generated.map(s => s.id));
  }, []);
  
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
    
    if (sprints.length === 0) {
      console.log('useDataLoader: Waiting for sprints to be generated');
      return; // Don't load data until sprints are ready
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
          .select('id, name, role, image_url, is_admin, vacation_dates')
          .order('role', { ascending: true });  // or false for descending;

        console.log('👥 Loaded profiles:', profilesData, profilesError);
          
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
          employeeId: alloc.employee_id,
          projectId: alloc.project_id,
          sprintId: alloc.sprint_id,
          days: alloc.days
        }));

        // Debug: Log allocation sprint IDs for comparison
        console.log('Allocation Sprint IDs:', mappedAllocations.map(a => a.sprintId));

        let finalProjects = mappedProjects;
        
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
        
        setEmployees([]);
        setProjects([]);
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
    setSprints
  };
};
