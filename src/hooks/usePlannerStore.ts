import { useState, useCallback, useEffect } from 'react';
import { Employee, Project, Allocation, Sprint, DragItem } from '../types';
import { sampleProjects, sampleAllocations } from '../data/sampleData';
import { toast } from '@/components/ui/sonner';
import { startOfWeek, format, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/hooks/useAuth';
import { generateSprints } from '@/utils/sprintUtils';

// Helper function to validate UUID
const isValidUUID = (str: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export const usePlannerStore = () => {
  console.log('usePlannerStore initializing');
  const { user, profile } = useAuth();

  // State for data from Supabase
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>(() => {
    // Initialize with default sprints
    return generateSprints(new Date(), 12);
  });
  const [loading, setLoading] = useState(true);
  
  // Helper function to convert sprintId to database date format
  const sprintIdToDate = (sprintId: string): string => {
    // Find the sprint object by sprintId
    const sprint = sprints.find(s => s.id === sprintId);
    if (sprint) {
      // Format the start date as YYYY-MM-DD for the database
      return format(sprint.startDate, 'yyyy-MM-dd');
    }
    
    // Fallback: if sprintId is in format "sprint-1", extract the number and calculate
    const sprintNumber = parseInt(sprintId.replace('sprint-', ''));
    if (!isNaN(sprintNumber)) {
      const baseDate = startOfWeek(new Date(), { weekStartsOn: 1 });
      // Each sprint is 2 weeks apart
      const sprintStartDate = new Date(baseDate);
      sprintStartDate.setDate(baseDate.getDate() + (sprintNumber - 1) * 14);
      return format(sprintStartDate, 'yyyy-MM-dd');
    }
    
    throw new Error(`Invalid sprintId format: ${sprintId}`);
  };

  // Helper function to convert database date to sprintId
  const dateToSprintId = (dateString: string): string => {
    const date = parseISO(dateString);
    // Find the sprint that contains this date
    const matchingSprint = sprints.find(sprint => {
      const sprintStart = sprint.startDate;
      const sprintEnd = sprint.endDate;
      return date >= sprintStart && date <= sprintEnd;
    });
    
    if (matchingSprint) {
      return matchingSprint.id;
    }
    
    // Fallback: generate a sprint ID based on the date
    console.warn(`No matching sprint found for date: ${dateString}`);
    return `sprint-1`;
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
        // Fetch employees from profiles table (this is the correct table to use)
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
          imageUrl: profile.image_url || undefined,
          vacationDates: Array.isArray((profile as any).vacation_dates) ? (profile as any).vacation_dates as string[] : []
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
          leadId: project.lead_id || undefined,
          ticketReference: (project as any).ticket_reference || undefined
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
          sprintId: dateToSprintId(alloc.week),
          days: alloc.days
        }));
        
        // Use real data from the database
        setEmployees(mappedEmployees);
        setProjects(mappedProjects.length ? mappedProjects : sampleProjects);
        setAllocations(mappedAllocations);
        
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
        setAllocations([]);
      } finally {
        setLoading(false);
      }
    }
    
    loadInitialData();
  }, [user, sprints]);
  
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
      
      // Find min and max sprint IDs
      const sprintIds = projectAllocations.map(a => a.sprintId);
      const minSprintId = sprintIds.sort()[0];
      const maxSprintId = sprintIds.sort().reverse()[0];
      
      // Find the corresponding sprint objects
      const startSprint = sprints.find(s => s.id === minSprintId);
      const endSprint = sprints.find(s => s.id === maxSprintId);
      
      return {
        ...project,
        startDate: startSprint?.startDate || project.startDate,
        endDate: endSprint?.endDate || project.endDate
      };
    }));
  };

  // Validate that user ID exists in profiles table
  const validateUserId = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();
      
      if (error || !data) {
        console.error('User ID validation failed:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error validating user ID:', error);
      return false;
    }
  }, []);

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
          image_url: updatedEmployee.imageUrl,
          vacation_dates: updatedEmployee.vacationDates || []
        } as any)
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
          lead_id: project.leadId,
          ticket_reference: project.ticketReference
        } as any)
        .select()
        .single();
        
      if (error) throw error;
      
      const newProject: Project = {
        id: data.id,
        name: data.name,
        color: data.color as 'blue' | 'purple' | 'pink' | 'orange' | 'green',
        startDate: project.startDate,
        endDate: project.endDate,
        leadId: data.lead_id,
        ticketReference: (data as any).ticket_reference
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
          lead_id: updatedProject.leadId,
          ticket_reference: updatedProject.ticketReference
        } as any)
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
      // Validate that the user ID exists in profiles table
      const isValidUser = await validateUserId(allocation.employeeId);
      if (!isValidUser) {
        throw new Error(`Invalid employee ID: ${allocation.employeeId}. Employee not found in profiles.`);
      }

      const sprintDate = sprintIdToDate(allocation.sprintId);
      
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
          week: sprintDate,
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
      toast.error('Failed to add allocation: ' + (error as Error).message);
      return null;
    }
  }, [sprints, projects, allocations, user, profile, validateUserId]);

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

  // Move an allocation to a different sprint or create new allocation
  const moveAllocation = useCallback(async (dragItem: DragItem, sprintId: string) => {
    if (!user || !profile?.is_admin) {
      toast.error('Only administrators can move allocations');
      return false;
    }

    try {
      console.log('moveAllocation called with:', { dragItem, sprintId });
      
      // Validate that we have valid UUIDs before proceeding
      if (!isValidUUID(dragItem.employeeId)) {
        throw new Error(`Invalid employee ID: ${dragItem.employeeId}. Cannot create allocation.`);
      }
      
      if (!isValidUUID(dragItem.projectId)) {
        throw new Error(`Invalid project ID: ${dragItem.projectId}. Cannot create allocation.`);
      }
      
      // Validate that the user ID exists in profiles table
      const isValidUser = await validateUserId(dragItem.employeeId);
      if (!isValidUser) {
        throw new Error(`Employee ID ${dragItem.employeeId} not found in profiles. Please ensure the employee is registered.`);
      }
      
      if (dragItem.sourceSprintId) {
        // This is an existing allocation being moved
        const existingAllocation = allocations.find(a => a.id === dragItem.id);
        
        if (!existingAllocation) {
          throw new Error('Allocation not found');
        }
        
        // Validate existing allocation ID
        if (!isValidUUID(dragItem.id)) {
          throw new Error(`Cannot move allocation with ID: ${dragItem.id}`);
        }
        
        const sprintDate = sprintIdToDate(sprintId);
        
        const updatedAllocation: Allocation = {
          ...existingAllocation,
          sprintId
        };
        
        setAllocations(prev => 
          prev.map(alloc => alloc.id === dragItem.id ? updatedAllocation : alloc)
        );
        
        const { error } = await supabase
          .from('allocations')
          .update({
            week: sprintDate
          })
          .eq('id', dragItem.id);
          
        if (error) {
          setAllocations(prev => 
            prev.map(alloc => alloc.id === dragItem.id ? existingAllocation : alloc)
          );
          throw error;
        }
        
        toast.success('Resource moved successfully');
        console.log('Allocation moved in Supabase:', updatedAllocation, 'to sprint:', sprintId);
        
        updateProjectDateRanges(projects, allocations.map(a => 
          a.id === dragItem.id ? updatedAllocation : a
        ));
      } else {
        // This is a new allocation being created from a project drag
        const sprintDate = sprintIdToDate(sprintId);
        
        if (!dragItem.employeeId || !dragItem.projectId) {
          throw new Error('Missing required fields for new allocation');
        }
        
        const tempId = uuidv4();
        const newAllocation: Allocation = {
          id: tempId,
          employeeId: dragItem.employeeId,
          projectId: dragItem.projectId,
          sprintId,
          days: dragItem.days || 10, // Default to 10 days for sprint
        };
        
        setAllocations(prev => [...prev, newAllocation]);
        
        const { data, error } = await supabase
          .from('allocations')
          .insert({
            user_id: dragItem.employeeId,
            project_id: dragItem.projectId,
            week: sprintDate,
            days: dragItem.days || 10
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
  }, [allocations, projects, sprints, user, profile, validateUserId]);

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

  // Get total days allocated for an employee in a specific sprint
  const getTotalAllocationDays = useCallback((employeeId: string, sprintId: string) => {
    return allocations
      .filter(alloc => alloc.employeeId === employeeId && alloc.sprintId === sprintId)
      .reduce((total, alloc) => total + alloc.days, 0);
  }, [allocations]);

  // Get all allocations for a project
  const getProjectAllocations = useCallback((projectId: string) => {
    return allocations.filter(alloc => alloc.projectId === projectId);
  }, [allocations]);

  // New function to allocate team member to entire project timeline
  const allocateToProjectTimeline = useCallback(async (
    employeeId: string, 
    projectId: string, 
    daysPerWeek: 1 | 3 | 5
  ) => {
    if (!user || !profile?.is_admin) {
      toast.error('Only administrators can allocate resources');
      return false;
    }

    try {
      const project = getProjectById(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Find all sprints that overlap with the project timeline
      const projectSprints = sprints.filter(sprint => {
        return sprint.startDate <= project.endDate && sprint.endDate >= project.startDate;
      });

      if (projectSprints.length === 0) {
        throw new Error('No sprints found for project timeline');
      }

      // Convert weekly days to sprint days (multiply by 2 since sprint is 2 weeks)
      const daysPerSprint = Math.min(daysPerWeek * 2, 10);

      // Create allocations for each sprint in the project timeline
      const allocationsToCreate = projectSprints.map(sprint => ({
        employeeId,
        projectId,
        sprintId: sprint.id,
        days: daysPerSprint
      }));

      // Create all allocations
      const createdAllocations = [];
      for (const allocation of allocationsToCreate) {
        const result = await addAllocation(allocation);
        if (result) {
          createdAllocations.push(result);
        }
      }

      toast.success(`Allocated ${createdAllocations.length} sprints to project timeline`);
      return true;
    } catch (error) {
      console.error('Error allocating to project timeline:', error);
      toast.error('Failed to allocate to project timeline');
      return false;
    }
  }, [sprints, getProjectById, addAllocation, user, profile]);

  // Helper function to calculate available days for an employee in a sprint (accounting for vacation)
  const getAvailableDays = useCallback((employeeId: string, sprintId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee || !employee.vacationDates) return 10; // Default sprint days
    
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint) return 10;
    
    // Count vacation days that fall within the sprint
    const vacationDaysInSprint = employee.vacationDates.filter(vacationDate => {
      const date = new Date(vacationDate);
      return date >= sprint.startDate && date <= sprint.endDate;
    }).length;
    
    return Math.max(0, 10 - vacationDaysInSprint);
  }, [employees, sprints]);

  return {
    employees,
    projects,
    allocations,
    sprints,
    setSprints,
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
    getProjectAllocations,
    allocateToProjectTimeline,
    getAvailableDays
  };
};
