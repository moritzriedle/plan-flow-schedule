import { useCallback } from 'react';
import { Allocation, DragItem, Project, Sprint, Employee } from '../../types';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';
import { isValidUUID, sprintIdToDate, calculateProjectDateRanges } from './utils';

export const useAllocationOperations = (
  allocations: Allocation[],
  setAllocations: React.Dispatch<React.SetStateAction<Allocation[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>,
  sprints: Sprint[],
  employees: Employee[]
) => {
  const { user, profile } = useAuth();

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

  // Helper function to update project date ranges
  const updateProjectDateRanges = (projects: Project[], allocations: Allocation[]) => {
    const updatedProjects = calculateProjectDateRanges(projects, allocations, sprints);
    setProjects(updatedProjects);
  };

  const addAllocation = useCallback(async (allocation: Omit<Allocation, 'id'>) => {
    if (!user || !profile?.is_admin) {
      toast.error('Only administrators can manage allocations');
      return null;
    }

    try {
      const isValidUser = await validateUserId(allocation.employeeId);
      if (!isValidUser) {
        throw new Error(`Invalid employee ID: ${allocation.employeeId}. Employee not found in profiles.`);
      }

      const sprintDate = sprintIdToDate(allocation.sprintId, sprints);
      
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
  }, [sprints, projects, allocations, user, profile, validateUserId, setAllocations, setProjects]);

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
  }, [projects, allocations, user, profile, setAllocations, setProjects]);

  const moveAllocation = useCallback(async (dragItem: DragItem, sprintId: string) => {
    if (!user || !profile?.is_admin) {
      toast.error('Only administrators can move allocations');
      return false;
    }

    try {
      console.log('moveAllocation called with:', { dragItem, sprintId });
      
      if (!isValidUUID(dragItem.employeeId)) {
        throw new Error(`Invalid employee ID: ${dragItem.employeeId}. Cannot create allocation.`);
      }
      
      if (!isValidUUID(dragItem.projectId)) {
        throw new Error(`Invalid project ID: ${dragItem.projectId}. Cannot create allocation.`);
      }
      
      const isValidUser = await validateUserId(dragItem.employeeId);
      if (!isValidUser) {
        throw new Error(`Employee ID ${dragItem.employeeId} not found in profiles. Please ensure the employee is registered.`);
      }
      
      if (dragItem.sourceSprintId) {
        const existingAllocation = allocations.find(a => a.id === dragItem.id);
        
        if (!existingAllocation) {
          throw new Error('Allocation not found');
        }
        
        if (!isValidUUID(dragItem.id)) {
          throw new Error(`Cannot move allocation with ID: ${dragItem.id}`);
        }
        
        const sprintDate = sprintIdToDate(sprintId, sprints);
        
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
        const sprintDate = sprintIdToDate(sprintId, sprints);
        
        if (!dragItem.employeeId || !dragItem.projectId) {
          throw new Error('Missing required fields for new allocation');
        }
        
        const tempId = uuidv4();
        const newAllocation: Allocation = {
          id: tempId,
          employeeId: dragItem.employeeId,
          projectId: dragItem.projectId,
          sprintId,
          days: dragItem.days || 10,
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
  }, [allocations, projects, sprints, user, profile, validateUserId, setAllocations, setProjects]);

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
  }, [allocations, projects, user, profile, setAllocations, setProjects]);

  // Helper functions for allocations
  const getEmployeeAllocations = useCallback((employeeId: string) => {
    return allocations.filter(alloc => alloc.employeeId === employeeId);
  }, [allocations]);

  const getTotalAllocationDays = useCallback((employeeId: string, sprintId: string) => {
    return allocations
      .filter(alloc => alloc.employeeId === employeeId && alloc.sprintId === sprintId)
      .reduce((total, alloc) => total + alloc.days, 0);
  }, [allocations]);

  const getProjectAllocations = useCallback((projectId: string) => {
    return allocations.filter(alloc => alloc.projectId === projectId);
  }, [allocations]);

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
      const project = projects.find(p => p.id === projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const projectSprints = sprints.filter(sprint => {
        return sprint.startDate <= project.endDate && sprint.endDate >= project.startDate;
      });

      if (projectSprints.length === 0) {
        throw new Error('No sprints found for project timeline');
      }

      const daysPerSprint = Math.min(daysPerWeek * 2, 10);

      const allocationsToCreate = projectSprints.map(sprint => ({
        employeeId,
        projectId,
        sprintId: sprint.id,
        days: daysPerSprint
      }));

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
  }, [sprints, projects, addAllocation, user, profile]);

  const getAvailableDays = useCallback((employeeId: string, sprintId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee || !employee.vacationDates) return 10;
    
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint) return 10;
    
   const getAvailableDays = useCallback((employeeId: string, sprintId: string) => {
  const employee = employees.find(emp => emp.id === employeeId);
  const sprint = sprints.find(s => s.id === sprintId);
  if (!employee || !sprint || !sprint.workingDays) return 0;

  const workingDaysInSprint = sprint.workingDays.map(date => new Date(date).toDateString());

  const vacationDaysInSprint = (employee.vacationDates || []).filter(vac => {
    const vacationDate = new Date(vac).toDateString();
    return workingDaysInSprint.includes(vacationDate);
  }).length;

  return sprint.workingDays.length - vacationDaysInSprint;
}, [employees, sprints]);

  return {
    addAllocation,
    updateAllocation,
    moveAllocation,
    deleteAllocation,
    getEmployeeAllocations,
    getTotalAllocationDays,
    getProjectAllocations,
    allocateToProjectTimeline,
    getAvailableDays
  };
};
