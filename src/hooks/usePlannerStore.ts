
import { useState, useCallback, useEffect } from 'react';
import { Employee, Project, Allocation, Week, DragItem } from '../types';
import { sampleProjects, sampleAllocations } from '../data/sampleData';
import { toast } from '@/components/ui/sonner';
import { startOfWeek, format } from 'date-fns';
import { generateWeeks } from '../utils/dateUtils';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/hooks/useAuth';

// Helper function to validate UUID
const isValidUUID = (str: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export const usePlannerStore = () => {
  console.log('usePlannerStore initializing');
  const { user, profile } = useAuth();

  // Weeks don't change, so we can just generate them once
  const [weeks] = useState<Week[]>(() => {
    console.log('Generating weeks');
    return generateWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 8);
  });
  
  // State for data from Supabase
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Helper function to convert weekId to database date format
  const weekIdToDate = (weekId: string): string => {
    // Find the week object by weekId
    const week = weeks.find(w => w.id === weekId);
    if (week) {
      // Format the start date as YYYY-MM-DD for the database
      return format(week.startDate, 'yyyy-MM-dd');
    }
    
    // Fallback: if weekId is in format "week-1", extract the number and calculate
    const weekNumber = parseInt(weekId.replace('week-', ''));
    if (!isNaN(weekNumber)) {
      const baseDate = startOfWeek(new Date(), { weekStartsOn: 1 });
      const targetWeek = weeks[weekNumber - 1];
      if (targetWeek) {
        return format(targetWeek.startDate, 'yyyy-MM-dd');
      }
    }
    
    throw new Error(`Invalid weekId format: ${weekId}`);
  };
  
  // Load data from Supabase on mount
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function loadInitialData() {
      setLoading(true);
      
      try {
        // Fetch employees (profiles)
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*');
          
        if (profilesError) {
          throw profilesError;
        }
        
        const mappedEmployees: Employee[] = profilesData.map(profile => ({
          id: profile.id,
          name: profile.name,
          role: profile.role,
          imageUrl: profile.image_url
        }));
        
        // Fetch projects
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
          leadId: project.lead_id
        }));
        
        // Fetch allocations
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
          weekId: `week-${format(new Date(alloc.week), 'w')}`,
          days: alloc.days
        }));
        
        // Use real data or fall back to sample data only if no real data exists
        setEmployees(mappedEmployees.length ? mappedEmployees : []);
        setProjects(mappedProjects.length ? mappedProjects : sampleProjects);
        setAllocations(mappedAllocations.length ? mappedAllocations : sampleAllocations);
        
        // Calculate project date ranges from allocations
        if (mappedAllocations.length && mappedProjects.length) {
          updateProjectDateRanges(mappedProjects, mappedAllocations);
        }
        
        console.log('Loaded from Supabase:', { 
          employees: mappedEmployees, 
          projects: mappedProjects, 
          allocations: mappedAllocations 
        });
      } catch (error) {
        console.error('Error loading data from Supabase:', error);
        toast.error('Failed to load data');
        
        // Fall back to empty data if Supabase fails
        setEmployees([]);
        setProjects(sampleProjects);
        setAllocations(sampleAllocations);
      } finally {
        setLoading(false);
      }
    }
    
    loadInitialData();
  }, [user]);
  
  // Helper function to update project date ranges based on allocations
  const updateProjectDateRanges = (projects: Project[], allocations: Allocation[]) => {
    // Group allocations by project
    const allocationsByProject = allocations.reduce((acc, alloc) => {
      if (!acc[alloc.projectId]) {
        acc[alloc.projectId] = [];
      }
      acc[alloc.projectId].push(alloc);
      return acc;
    }, {} as Record<string, Allocation[]>);
    
    // Update projects with calculated date ranges
    setProjects(projects.map(project => {
      const projectAllocations = allocationsByProject[project.id] || [];
      if (projectAllocations.length === 0) return project;
      
      // Find min and max week IDs
      // This is simplified and would need to be adjusted if using actual dates
      const weekIds = projectAllocations.map(a => a.weekId);
      const minWeekId = weekIds.sort()[0];
      const maxWeekId = weekIds.sort().reverse()[0];
      
      // Find the corresponding week objects
      const startWeek = weeks.find(w => w.id === minWeekId);
      const endWeek = weeks.find(w => w.id === maxWeekId);
      
      return {
        ...project,
        startDate: startWeek?.startDate || project.startDate,
        endDate: endWeek?.endDate || project.endDate
      };
    }));
  };

  // Add a new employee - Note: This now requires user registration first
  const addEmployee = useCallback(async (employee: Omit<Employee, 'id'>) => {
    if (!user || !profile?.is_admin) {
      toast.error('Only administrators can add team members. Team members must register with their @proglove.de or @proglove.com email address.');
      return null;
    }

    // Since we're using the profiles table which is tied to auth.users,
    // we can't directly create employees anymore. They need to register first.
    toast.error('Team members must register with their @proglove.de or @proglove.com email address. You cannot directly add team members.');
    return null;
  }, [user, profile]);

  // Update an existing employee (now updates profile)
  const updateEmployee = useCallback(async (updatedEmployee: Employee) => {
    if (!user || (!profile?.is_admin && updatedEmployee.id !== user.id)) {
      toast.error('You can only update your own profile');
      return false;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: updatedEmployee.name,
          role: updatedEmployee.role,
          image_url: updatedEmployee.imageUrl
        })
        .eq('id', updatedEmployee.id);
        
      if (error) throw error;
      
      setEmployees(prev => 
        prev.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp)
      );
      toast.success(`Updated profile: ${updatedEmployee.name}`);
      return true;
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Failed to update profile');
      return false;
    }
  }, [user, profile]);

  // Get an employee by ID
  const getEmployeeById = useCallback((id: string) => {
    return employees.find(employee => employee.id === id);
  }, [employees]);

  // Add a new project
  const addProject = useCallback(async (project: Omit<Project, 'id'>) => {
    if (!user || !profile?.is_admin) {
      toast.error('Only administrators can add projects');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: project.name,
          color: project.color,
          lead_id: project.leadId
        })
        .select()
        .single();
        
      if (error) throw error;
      
      const newProject: Project = {
        id: data.id,
        name: data.name,
        color: data.color as 'blue' | 'purple' | 'pink' | 'orange' | 'green',
        startDate: project.startDate,
        endDate: project.endDate,
        leadId: data.lead_id
      };
      
      setProjects(prev => [...prev, newProject]);
      toast.success(`Added project: ${newProject.name}`);
      return newProject;
    } catch (error) {
      console.error('Error adding project:', error);
      toast.error('Failed to add project');
      return null;
    }
  }, [user, profile]);

  // Update an existing project
  const updateProject = useCallback(async (updatedProject: Project) => {
    if (!user || !profile?.is_admin) {
      toast.error('Only administrators can update projects');
      return false;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: updatedProject.name,
          color: updatedProject.color,
          lead_id: updatedProject.leadId
        })
        .eq('id', updatedProject.id);
        
      if (error) throw error;
      
      setProjects(prev => 
        prev.map(proj => proj.id === updatedProject.id ? updatedProject : proj)
      );
      toast.success(`Updated project: ${updatedProject.name}`);
      return true;
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
      return false;
    }
  }, [user, profile]);

  // Add a new allocation
  const addAllocation = useCallback(async (allocation: Omit<Allocation, 'id'>) => {
    if (!user || !profile?.is_admin) {
      toast.error('Only administrators can manage allocations');
      return null;
    }

    try {
      const weekDate = weekIdToDate(allocation.weekId);
      
      const tempId = uuidv4();
      const newAllocation: Allocation = {
        ...allocation,
        id: tempId
      };
      
      setAllocations(prev => [...prev, newAllocation]);
      
      const { data, error } = await supabase
        .from('allocations')
        .insert({
          user_id: allocation.employeeId,
          project_id: allocation.projectId,
          week: weekDate,
          days: allocation.days
        })
        .select()
        .single();
        
      if (error) {
        setAllocations(prev => prev.filter(a => a.id !== tempId));
        throw error;
      }
      
      setAllocations(prev => prev.map(a => 
        a.id === tempId ? { ...a, id: data.id } : a
      ));
      
      toast.success('Resource allocated successfully');
      console.log('Allocation added to Supabase:', data);
      
      updateProjectDateRanges(projects, [...allocations, { ...allocation, id: data.id }]);
      
      return { ...allocation, id: data.id };
    } catch (error) {
      console.error('Error adding allocation:', error);
      toast.error('Failed to add allocation');
      return null;
    }
  }, [weeks, projects, allocations, user, profile]);

  // Update an existing allocation
  const updateAllocation = useCallback(async (updatedAllocation: Allocation) => {
    if (!user || !profile?.is_admin) {
      toast.error('Only administrators can update allocations');
      return false;
    }

    try {
      setAllocations(prev => 
        prev.map(alloc => alloc.id === updatedAllocation.id ? updatedAllocation : alloc)
      );
      
      const { error } = await supabase
        .from('allocations')
        .update({
          days: updatedAllocation.days
        })
        .eq('id', updatedAllocation.id);
        
      if (error) {
        setAllocations(prev => {
          const original = prev.find(a => a.id === updatedAllocation.id);
          return prev.map(a => a.id === updatedAllocation.id && original ? original : a);
        });
        throw error;
      }
      
      toast.success('Allocation updated');
      console.log('Allocation updated in Supabase:', updatedAllocation);
      
      updateProjectDateRanges(projects, allocations.map(a => 
        a.id === updatedAllocation.id ? updatedAllocation : a
      ));
      
      return true;
    } catch (error) {
      console.error('Error updating allocation:', error);
      toast.error('Failed to update allocation');
      return false;
    }
  }, [projects, allocations, user, profile]);

  // Move an allocation to a different week
  const moveAllocation = useCallback(async (dragItem: DragItem, weekId: string) => {
    if (!user || !profile?.is_admin) {
      toast.error('Only administrators can move allocations');
      return false;
    }

    try {
      console.log('moveAllocation called with:', { dragItem, weekId });
      
      // Validate that we have valid UUIDs before proceeding
      if (!isValidUUID(dragItem.employeeId)) {
        throw new Error(`Invalid employee ID: ${dragItem.employeeId}. Cannot create allocation.`);
      }
      
      if (!isValidUUID(dragItem.projectId)) {
        throw new Error(`Invalid project ID: ${dragItem.projectId}. Cannot create allocation.`);
      }
      
      if (dragItem.sourceWeekId) {
        // This is an existing allocation being moved
        const existingAllocation = allocations.find(a => a.id === dragItem.id);
        
        if (!existingAllocation) {
          throw new Error('Allocation not found');
        }
        
        // Validate existing allocation ID
        if (!isValidUUID(dragItem.id)) {
          throw new Error(`Cannot move allocation with ID: ${dragItem.id}`);
        }
        
        const weekDate = weekIdToDate(weekId);
        
        const updatedAllocation: Allocation = {
          ...existingAllocation,
          weekId
        };
        
        setAllocations(prev => 
          prev.map(alloc => alloc.id === dragItem.id ? updatedAllocation : alloc)
        );
        
        const { error } = await supabase
          .from('allocations')
          .update({
            week: weekDate
          })
          .eq('id', dragItem.id);
          
        if (error) {
          setAllocations(prev => 
            prev.map(alloc => alloc.id === dragItem.id ? existingAllocation : alloc)
          );
          throw error;
        }
        
        toast.success('Resource moved successfully');
        console.log('Allocation moved in Supabase:', updatedAllocation, 'to week:', weekId);
        
        updateProjectDateRanges(projects, allocations.map(a => 
          a.id === dragItem.id ? updatedAllocation : a
        ));
      } else {
        // This is a new allocation being created from a project drag
        const weekDate = weekIdToDate(weekId);
        
        if (!dragItem.employeeId || !dragItem.projectId) {
          throw new Error('Missing required fields for new allocation');
        }
        
        const tempId = uuidv4();
        const newAllocation: Allocation = {
          id: tempId,
          employeeId: dragItem.employeeId,
          projectId: dragItem.projectId,
          weekId,
          days: dragItem.days || 3,
        };
        
        setAllocations(prev => [...prev, newAllocation]);
        
        const { data, error } = await supabase
          .from('allocations')
          .insert({
            user_id: dragItem.employeeId,
            project_id: dragItem.projectId,
            week: weekDate,
            days: dragItem.days || 3
          })
          .select()
          .single();
          
        if (error) {
          console.error('Supabase insert error:', error);
          setAllocations(prev => prev.filter(a => a.id !== tempId));
          throw error;
        }
        
        setAllocations(prev => prev.map(a => 
          a.id === tempId ? { ...a, id: data.id } : a
        ));
        
        toast.success('Resource allocated successfully');
        console.log('New allocation added to Supabase:', data);
        
        updateProjectDateRanges(projects, [...allocations, { ...newAllocation, id: data.id }]);
      }
      
      return true;
    } catch (error) {
      console.error('Error moving/creating allocation:', error);
      toast.error('Failed to update allocation: ' + (error as Error).message);
      return false;
    }
  }, [allocations, projects, weeks, user, profile]);

  // Delete an allocation
  const deleteAllocation = useCallback(async (id: string) => {
    if (!user || !profile?.is_admin) {
      toast.error('Only administrators can delete allocations');
      return false;
    }

    try {
      const allocationToDelete = allocations.find(a => a.id === id);
      if (!allocationToDelete) throw new Error('Allocation not found');
      
      setAllocations(prev => prev.filter(alloc => alloc.id !== id));
      
      const { error } = await supabase
        .from('allocations')
        .delete()
        .eq('id', id);
        
      if (error) {
        setAllocations(prev => [...prev, allocationToDelete]);
        throw error;
      }
      
      toast.success('Allocation removed');
      console.log('Allocation deleted from Supabase:', id);
      
      updateProjectDateRanges(projects, allocations.filter(a => a.id !== id));
      
      return true;
    } catch (error) {
      console.error('Error deleting allocation:', error);
      toast.error('Failed to delete allocation');
      return false;
    }
  }, [allocations, projects, user, profile]);

  // Get all allocations for an employee
  const getEmployeeAllocations = useCallback((employeeId: string) => {
    return allocations.filter(alloc => alloc.employeeId === employeeId);
  }, [allocations]);

  // Get a project by ID
  const getProjectById = useCallback((id: string) => {
    return projects.find(project => project.id === id);
  }, [projects]);

  // Get total days allocated for an employee in a specific week
  const getTotalAllocationDays = useCallback((employeeId: string, weekId: string) => {
    return allocations
      .filter(alloc => alloc.employeeId === employeeId && alloc.weekId === weekId)
      .reduce((total, alloc) => total + alloc.days, 0);
  }, [allocations]);

  // Get all allocations for a project
  const getProjectAllocations = useCallback((projectId: string) => {
    return allocations.filter(alloc => alloc.projectId === projectId);
  }, [allocations]);

  return {
    employees,
    projects,
    allocations,
    weeks,
    loading,
    addEmployee,
    updateEmployee,
    addProject,
    updateProject,
    addAllocation,
    updateAllocation,
    moveAllocation,
    deleteAllocation,
    getEmployeeAllocations,
    getProjectById,
    getEmployeeById,
    getTotalAllocationDays,
    getProjectAllocations
  };
};
