import { useState, useCallback, useEffect } from 'react';
import { Employee, Project, Allocation, Week, DragItem } from '../types';
import { sampleEmployees, sampleProjects, sampleAllocations } from '../data/sampleData';
import { toast } from '@/components/ui/sonner';
import { startOfWeek } from 'date-fns';
import { generateWeeks } from '../utils/dateUtils';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export const usePlannerStore = () => {
  console.log('usePlannerStore initializing');

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
  
  // Load data from Supabase on mount
  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      
      try {
        // Fetch employees (users)
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*');
          
        if (usersError) {
          throw usersError;
        }
        
        const mappedEmployees: Employee[] = usersData.map(user => ({
          id: user.id,
          name: user.name,
          role: user.role,
          imageUrl: user.image_url
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
          startDate: new Date(),  // We'll calculate these from allocations later
          endDate: new Date(),    // We'll calculate these from allocations later
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
          weekId: `week-${alloc.week}`, // Generate weekId from week date
          days: alloc.days
        }));
        
        // Set state with data from Supabase
        setEmployees(mappedEmployees.length ? mappedEmployees : sampleEmployees);
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
        
        // Fall back to sample data if Supabase fails
        setEmployees(sampleEmployees);
        setProjects(sampleProjects);
        setAllocations(sampleAllocations);
      } finally {
        setLoading(false);
      }
    }
    
    loadInitialData();
  }, []);
  
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

  // Add a new employee
  const addEmployee = useCallback(async (employee: Omit<Employee, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          name: employee.name,
          role: employee.role,
          email: `${employee.name.toLowerCase().replace(/\s+/g, '.')}@example.com`, // Placeholder email
          image_url: employee.imageUrl
        })
        .select()
        .single();
        
      if (error) throw error;
      
      const newEmployee: Employee = {
        id: data.id,
        name: data.name,
        role: data.role,
        imageUrl: data.image_url
      };
      
      setEmployees(prev => [...prev, newEmployee]);
      toast.success(`Added employee: ${newEmployee.name}`);
      return newEmployee;
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error('Failed to add employee');
      return null;
    }
  }, []);

  // Update an existing employee
  const updateEmployee = useCallback(async (updatedEmployee: Employee) => {
    try {
      const { error } = await supabase
        .from('users')
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
      toast.success(`Updated employee: ${updatedEmployee.name}`);
      return true;
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Failed to update employee');
      return false;
    }
  }, []);

  // Get an employee by ID
  const getEmployeeById = useCallback((id: string) => {
    return employees.find(employee => employee.id === id);
  }, [employees]);

  // Add a new project
  const addProject = useCallback(async (project: Omit<Project, 'id'>) => {
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
  }, []);

  // Update an existing project
  const updateProject = useCallback(async (updatedProject: Project) => {
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
  }, []);

  // Add a new allocation
  const addAllocation = useCallback(async (allocation: Omit<Allocation, 'id'>) => {
    try {
      // Extract week date from weekId (format: "week-YYYY-MM-DD")
      const weekDate = allocation.weekId.replace('week-', '');
      
      // Optimistic update
      const tempId = uuidv4();
      const newAllocation: Allocation = {
        ...allocation,
        id: tempId
      };
      
      setAllocations(prev => [...prev, newAllocation]);
      
      // Insert into Supabase
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
        // Rollback optimistic update
        setAllocations(prev => prev.filter(a => a.id !== tempId));
        throw error;
      }
      
      // Update with actual ID from database
      setAllocations(prev => prev.map(a => 
        a.id === tempId ? { ...a, id: data.id } : a
      ));
      
      toast.success('Resource allocated successfully');
      console.log('Allocation added to Supabase:', data);
      
      // Update project date ranges
      updateProjectDateRanges(projects, [...allocations, { ...allocation, id: data.id }]);
      
      return { ...allocation, id: data.id };
    } catch (error) {
      console.error('Error adding allocation:', error);
      toast.error('Failed to add allocation');
      return null;
    }
  }, [weeks, projects, allocations]);

  // Update an existing allocation
  const updateAllocation = useCallback(async (updatedAllocation: Allocation) => {
    try {
      // Optimistic update
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
        // Rollback on error
        setAllocations(prev => {
          const original = prev.find(a => a.id === updatedAllocation.id);
          return prev.map(a => a.id === updatedAllocation.id && original ? original : a);
        });
        throw error;
      }
      
      toast.success('Allocation updated');
      console.log('Allocation updated in Supabase:', updatedAllocation);
      
      // Update project date ranges
      updateProjectDateRanges(projects, allocations.map(a => 
        a.id === updatedAllocation.id ? updatedAllocation : a
      ));
      
      return true;
    } catch (error) {
      console.error('Error updating allocation:', error);
      toast.error('Failed to update allocation');
      return false;
    }
  }, [projects, allocations]);

  // Move an allocation to a different week
  const moveAllocation = useCallback(async (dragItem: DragItem, weekId: string) => {
    try {
      console.log('moveAllocation called with:', { dragItem, weekId });
      
      if (dragItem.sourceWeekId) {
        // This is an existing allocation being moved
        const existingAllocation = allocations.find(a => a.id === dragItem.id);
        
        if (!existingAllocation) {
          throw new Error('Allocation not found');
        }
        
        // Extract week date from weekId (format: "week-YYYY-MM-DD")
        const weekDate = weekId.replace('week-', '');
        
        // Create updated allocation
        const updatedAllocation: Allocation = {
          ...existingAllocation,
          weekId
        };
        
        // Optimistic update
        setAllocations(prev => 
          prev.map(alloc => alloc.id === dragItem.id ? updatedAllocation : alloc)
        );
        
        // Update in Supabase
        const { error } = await supabase
          .from('allocations')
          .update({
            week: weekDate
          })
          .eq('id', dragItem.id);
          
        if (error) {
          // Rollback optimistic update
          setAllocations(prev => 
            prev.map(alloc => alloc.id === dragItem.id ? existingAllocation : alloc)
          );
          throw error;
        }
        
        toast.success('Resource moved successfully');
        console.log('Allocation moved in Supabase:', updatedAllocation, 'to week:', weekId);
        
        // Update project date ranges
        updateProjectDateRanges(projects, allocations.map(a => 
          a.id === dragItem.id ? updatedAllocation : a
        ));
      } else {
        // This is a new allocation being created from a project drag
        const weekDate = weekId.replace('week-', '');
        
        // Ensure we have all required fields
        if (!dragItem.employeeId || !dragItem.projectId) {
          throw new Error('Missing required fields for new allocation');
        }
        
        // Optimistic update with temporary ID
        const tempId = uuidv4();
        const newAllocation: Allocation = {
          id: tempId,
          employeeId: dragItem.employeeId,
          projectId: dragItem.projectId,
          weekId,
          days: dragItem.days || 3, // Default to 3 days if not specified
        };
        
        setAllocations(prev => [...prev, newAllocation]);
        
        // Insert into Supabase
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
          // Rollback optimistic update
          setAllocations(prev => prev.filter(a => a.id !== tempId));
          throw error;
        }
        
        // Update with actual ID from database
        setAllocations(prev => prev.map(a => 
          a.id === tempId ? { ...a, id: data.id } : a
        ));
        
        toast.success('Resource allocated successfully');
        console.log('New allocation added to Supabase:', data);
        
        // Update project date ranges
        updateProjectDateRanges(projects, [...allocations, { ...newAllocation, id: data.id }]);
      }
      
      return true;
    } catch (error) {
      console.error('Error moving/creating allocation:', error);
      toast.error('Failed to update allocation: ' + (error as Error).message);
      return false;
    }
  }, [allocations, projects]);

  // Delete an allocation
  const deleteAllocation = useCallback(async (id: string) => {
    try {
      // Find the allocation before deleting it
      const allocationToDelete = allocations.find(a => a.id === id);
      if (!allocationToDelete) throw new Error('Allocation not found');
      
      // Optimistic delete
      setAllocations(prev => prev.filter(alloc => alloc.id !== id));
      
      const { error } = await supabase
        .from('allocations')
        .delete()
        .eq('id', id);
        
      if (error) {
        // Rollback optimistic delete
        setAllocations(prev => [...prev, allocationToDelete]);
        throw error;
      }
      
      toast.success('Allocation removed');
      console.log('Allocation deleted from Supabase:', id);
      
      // Update project date ranges
      updateProjectDateRanges(projects, allocations.filter(a => a.id !== id));
      
      return true;
    } catch (error) {
      console.error('Error deleting allocation:', error);
      toast.error('Failed to delete allocation');
      return false;
    }
  }, [allocations, projects]);

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
