import { useCallback } from 'react';
import { Allocation, DragItem, Project, Sprint, Employee } from '../../types';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';
import { isValidUUID, sprintIdToDate, calculateProjectDateRanges } from './utils';
import { format } from 'date-fns';

export const useAllocationOperations = (
  allocations: Allocation[],
  setAllocations: React.Dispatch<React.SetStateAction<Allocation[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>,
  sprints: Sprint[],
  employees: Employee[]
) => {
  const { user, profile } = useAuth();

  const hasAllocationPermission = !!profile && (
  profile.is_admin ||
  ['Manager', 'Product Manager', 'Product Owner', 'Technical Project Manager'].includes(profile.role)
);

  const validateUserId = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();
      return !!data && !error;
    } catch {
      return false;
    }
  }, []);

  const updateProjectDateRanges = (projects: Project[], allocations: Allocation[]) => {
    const updatedProjects = calculateProjectDateRanges(projects, allocations, sprints);
    setProjects(updatedProjects);
  };

  const addAllocation = useCallback(async (allocation: Omit<Allocation, 'id'>) => {
   if (!user || !hasAllocationPermission) {
      toast.error('Only authorized users can manage allocations');
      return null;
    }

    try {
      const isValidUser = await validateUserId(allocation.employeeId);
      if (!isValidUser) throw new Error('Invalid employee ID');

      const sprintDate = sprintIdToDate(allocation.sprintId, sprints);
      const tempId = uuidv4();

      const newAllocation: Allocation = { ...allocation, id: tempId };
      setAllocations(prev => [...prev, newAllocation]);

      const { data, error } = await supabase
        .from('allocations')
        .insert({
          user_id: allocation.employeeId,
          project_id: allocation.projectId,
          sprint_id: allocation.sprintId, 
          week: sprintDate,
          days: allocation.days
        })
        .select()
        .single();

      if (error) {
        setAllocations(prev => prev.filter(a => a.id !== tempId));
        throw error;
      }

      setAllocations(prev => prev.map(a => a.id === tempId ? { ...a, id: data.id } : a));
      updateProjectDateRanges(projects, [...allocations, { ...allocation, id: data.id }]);

      return { ...allocation, id: data.id };
    } catch (error) {
      toast.error('Failed to add allocation');
      return null;
    }
  }, [user, profile, validateUserId, sprints, projects, allocations]);

  const updateAllocation = useCallback(async (updatedAllocation: Allocation) => {
    if (!user || !hasAllocationPermission) {
      toast.error('Only authorized users can update allocations');
      return false;
    }

    try {
      setAllocations(prev =>
        prev.map(a => a.id === updatedAllocation.id ? updatedAllocation : a)
      );

      const { error } = await supabase
        .from('allocations')
        .update({ days: updatedAllocation.days })
        .eq('id', updatedAllocation.id);

      if (error) throw error;

      updateProjectDateRanges(projects, allocations.map(a =>
        a.id === updatedAllocation.id ? updatedAllocation : a
      ));

      return true;
    } catch (error) {
      toast.error('Failed to update allocation');
      return false;
    }
  }, [user, profile, setAllocations, projects, allocations]);

  const deleteAllocation = useCallback(async (id: string) => {
    if (!user || !hasAllocationPermission) {
      toast.error('Only authorized users can delete allocations');
      return false;
    }

    try {
      const toDelete = allocations.find(a => a.id === id);
      if (!toDelete) throw new Error('Allocation not found');

      setAllocations(prev => prev.filter(a => a.id !== id));

      const { error } = await supabase
        .from('allocations')
        .delete()
        .eq('id', id);

      if (error) {
        setAllocations(prev => [...prev, toDelete]);
        throw error;
      }

      updateProjectDateRanges(projects, allocations.filter(a => a.id !== id));
      return true;
    } catch (error) {
      toast.error('Failed to delete allocation');
      return false;
    }
  }, [user, profile, allocations, projects]);

  const moveAllocation = useCallback(async (dragItem: DragItem, targetSprintId: string) => {
    if (!user || !hasAllocationPermission) {
      toast.error('Only authorized users can move allocations');
      return false;
    }

    try {
      if (!isValidUUID(dragItem.employeeId) || !isValidUUID(dragItem.projectId)) {
        throw new Error('Invalid employee or project ID');
      }

      const isValidUser = await validateUserId(dragItem.employeeId);
      if (!isValidUser) throw new Error('Employee not found');

      // Remove old allocation if needed
      if (dragItem.sourceSprintId && dragItem.id) {
        await deleteAllocation(dragItem.id);
      }

      let daysRemaining = dragItem.days || 10;
      const employee = employees.find(e => e.id === dragItem.employeeId);
      if (!employee) throw new Error('Employee not found');

      const startingIndex = sprints.findIndex(s => s.id === targetSprintId);
      if (startingIndex === -1) throw new Error('Target sprint not found');

      const futureSprints = sprints.slice(startingIndex);
      const createdAllocations: Allocation[] = [];

      for (const sprint of futureSprints) {
        if (daysRemaining <= 0) break;

        const workingDays = sprint.workingDays || [];
        const vacationDates = (employee.vacationDates || []).map(d => new Date(d).toDateString());
        const availableDays = workingDays.filter(
          date => !vacationDates.includes(new Date(date).toDateString())
        );

        const maxAvailable = availableDays.length;
        if (maxAvailable <= 0) continue;

        const toAllocate = Math.min(daysRemaining, maxAvailable);
        const result = await addAllocation({
          employeeId: dragItem.employeeId,
          projectId: dragItem.projectId,
          sprintId: sprint.id,
          days: toAllocate,
        });

        if (result) {
          createdAllocations.push(result);
          daysRemaining -= toAllocate;
        }
      }

      if (createdAllocations.length > 0) {
        toast.success(`Allocation split across ${createdAllocations.length} sprint(s)`);
        return true;
      } else {
        toast.warning('No working days available');
        return false;
      }
    } catch (error) {
      toast.error('Failed to move allocation');
      return false;
    }
  }, [user, profile, validateUserId, sprints, employees, deleteAllocation, addAllocation]);

  const getEmployeeAllocations = useCallback((employeeId: string) => {
    return allocations.filter(alloc => alloc.employeeId === employeeId);
  }, [allocations]);

 const getTotalAllocationDays = useCallback((employeeId: string, sprint: Sprint) => {
  return allocations
    .filter(alloc => alloc.employeeId === employeeId && alloc.sprintId === sprint.id)
    .reduce((sum, a) => sum + a.days, 0);
}, [allocations]);

  const getProjectAllocations = useCallback((projectId: string) => {
    return allocations.filter(alloc => alloc.projectId === projectId);
  }, [allocations]);

  const allocateToProjectTimeline = useCallback(async (
    employeeId: string,
    projectId: string,
    daysPerWeek: 1 | 3 | 5
  ) => {
   if (!user || !hasAllocationPermission) {
      toast.error('Only authorized users can allocate resources');
      return false;
  }

    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) throw new Error('Project not found');

      const projectSprints = sprints.filter(s =>
        s.startDate <= project.endDate && s.endDate >= project.startDate
      );

      const daysPerSprint = Math.min(daysPerWeek * 2, 10);

      for (const sprint of projectSprints) {
        await addAllocation({
          employeeId,
          projectId,
          sprintId: sprint.id,
          days: daysPerSprint,
        });
      }

      toast.success('Allocations added for project timeline');
      return true;
    } catch (error) {
      toast.error('Failed to allocate to project');
      return false;
    }
  }, [user, profile, sprints, projects, addAllocation]);

const getAvailableDays = useCallback((employeeId: string, sprint: Sprint) => {
  const employee = employees.find(e => e.id === employeeId);
  if (!employee || !sprint?.workingDays) return 0;

  const workingDays = sprint.workingDays.map(d => format(new Date(d), 'yyyy-MM-dd'));
  const vacationDays = (employee.vacationDates || []).map(d => format(new Date(d), 'yyyy-MM-dd'));

  const available = workingDays.filter(date => !vacationDays.includes(date));
  return available.length;
}, [employees]);



  return {
    addAllocation,
    updateAllocation,
    deleteAllocation,
    moveAllocation,
    getEmployeeAllocations,
    getTotalAllocationDays,
    getProjectAllocations,
    allocateToProjectTimeline,
    getAvailableDays,
  };
};
