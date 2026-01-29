import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Allocation, DragItem, Project, Sprint, Employee } from '../../types';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';
import { isValidUUID, sprintIdToDate, calculateProjectDateRanges } from './utils';
import { format } from 'date-fns';

type QuickAllocateMode =
  | { kind: 'single' }
  | { kind: 'next-n'; count: number }
  | { kind: 'until-project-end' };

const toDateMaybe = (d: any): Date | null => {
  if (!d) return null;
  if (d instanceof Date) return d;
  const parsed = new Date(d);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const useAllocationOperations = (
  allocations: Allocation[],
  setAllocations: Dispatch<SetStateAction<Allocation[]>>,
  projects: Project[],
  setProjects: Dispatch<SetStateAction<Project[]>>,
  sprints: Sprint[],
  employees: Employee[]
) => {
  const { user, profile } = useAuth();

  const hasAllocationPermission =
    !!profile &&
    (profile.is_admin ||
      ['Manager', 'Product Manager', 'Product Owner', 'Technical Project Manager'].includes(
        profile.role
      ));

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

  const updateProjectDateRanges = useCallback(
    (projectsArg: Project[], allocationsArg: Allocation[]) => {
      const updatedProjects = calculateProjectDateRanges(projectsArg, allocationsArg, sprints);
      setProjects(updatedProjects);
    },
    [setProjects, sprints]
  );

  const addAllocation = useCallback(
    async (allocation: Omit<Allocation, 'id'>) => {
      if (!user || !hasAllocationPermission) {
        toast.error('Only authorized users can manage allocations');
        return null;
      }

      // Check if project is archived
      const project = projects.find((p) => p.id === allocation.projectId);
      if (project?.archived) {
        toast.error('Cannot allocate to an archived project');
        return null;
      }

      // Check if employee is archived
      const employee = employees.find((e) => e.id === allocation.employeeId);
      if (employee?.archived) {
        toast.error('Cannot allocate to an archived team member');
        return null;
      }

      try {
        const isValidUser = await validateUserId(allocation.employeeId);
        if (!isValidUser) throw new Error('Invalid employee ID');

        const sprintDate = sprintIdToDate(allocation.sprintId, sprints);
        const tempId = uuidv4();

        const newAllocation: Allocation = { ...allocation, id: tempId };
        setAllocations((prev) => [...prev, newAllocation]);

        const { data, error } = await supabase
          .from('allocations')
          .insert({
            user_id: allocation.employeeId,
            project_id: allocation.projectId,
            sprint_id: allocation.sprintId,
            week: sprintDate,
            days: allocation.days,
          })
          .select()
          .single();

        if (error) {
          setAllocations((prev) => prev.filter((a) => a.id !== tempId));
          throw error;
        }

        setAllocations((prev) => prev.map((a) => (a.id === tempId ? { ...a, id: data.id } : a)));

        updateProjectDateRanges(projects, [...allocations, { ...allocation, id: data.id }]);
        return { ...allocation, id: data.id };
      } catch (error) {
        toast.error('Failed to add allocation');
        return null;
      }
    },
    [
      user,
      hasAllocationPermission,
      projects,
      employees,
      validateUserId,
      sprints,
      allocations,
      setAllocations,
      updateProjectDateRanges,
    ]
  );

  const updateAllocation = useCallback(
    async (updatedAllocation: Allocation) => {
      if (!user || !hasAllocationPermission) {
        toast.error('Only authorized users can update allocations');
        return false;
      }

      const project = projects.find((p) => p.id === updatedAllocation.projectId);
      if (project?.archived) {
        toast.error('Cannot modify allocations for an archived project');
        return false;
      }

      try {
        setAllocations((prev) => prev.map((a) => (a.id === updatedAllocation.id ? updatedAllocation : a)));

        const { error } = await supabase
          .from('allocations')
          .update({ days: updatedAllocation.days })
          .eq('id', updatedAllocation.id);

        if (error) throw error;

        updateProjectDateRanges(
          projects,
          allocations.map((a) => (a.id === updatedAllocation.id ? updatedAllocation : a))
        );

        return true;
      } catch (error) {
        toast.error('Failed to update allocation');
        return false;
      }
    },
    [
      user,
      hasAllocationPermission,
      projects,
      allocations,
      setAllocations,
      updateProjectDateRanges,
    ]
  );

  const deleteAllocation = useCallback(
    async (id: string) => {
      if (!user || !hasAllocationPermission) {
        toast.error('Only authorized users can delete allocations');
        return false;
      }

      try {
        const toDelete = allocations.find((a) => a.id === id);
        if (!toDelete) throw new Error('Allocation not found');

        setAllocations((prev) => prev.filter((a) => a.id !== id));

        const { error } = await supabase.from('allocations').delete().eq('id', id);

        if (error) {
          setAllocations((prev) => [...prev, toDelete]);
          throw error;
        }

        updateProjectDateRanges(projects, allocations.filter((a) => a.id !== id));
        return true;
      } catch (error) {
        toast.error('Failed to delete allocation');
        return false;
      }
    },
    [user, hasAllocationPermission, allocations, projects, setAllocations, updateProjectDateRanges]
  );

  /**
   * New: a clean "create allocation for a single sprint" helper.
   * UI should call this (or quickAllocateToProject) instead of faking DragItem objects.
   */
  const createSprintAllocation = useCallback(
    async (params: { employeeId: string; projectId: string; sprintId: string; days: number }) => {
      const { employeeId, projectId, sprintId, days } = params;

      const project = projects.find((p) => p.id === projectId);
      if (project?.archived) {
        toast.error('Cannot allocate to an archived project');
        return null;
      }

      const employee = employees.find((e) => e.id === employeeId);
      if (employee?.archived) {
        toast.error('Cannot allocate to an archived team member');
        return null;
      }

      const safeDays = Math.max(1, Math.min(10, Math.floor(days || 1)));

      return await addAllocation({
        employeeId,
        projectId,
        sprintId,
        days: safeDays,
      });
    },
    [projects, employees, addAllocation]
  );

  /**
   * New: proper quick allocate API with the optional "apply" logic.
   * - single sprint
   * - next N sprints
   * - until project end (safe fallback to single if end date missing)
   */
  const quickAllocateToProject = useCallback(
    async (params: {
      employeeId: string;
      projectId: string;
      startSprintId: string;
      days: number;
      mode: QuickAllocateMode;
    }) => {
      if (!user || !hasAllocationPermission) {
        toast.error('Only authorized users can manage allocations');
        return false;
      }

      const { employeeId, projectId, startSprintId, days, mode } = params;

      if (!isValidUUID(employeeId) || !isValidUUID(projectId)) {
        toast.error('Invalid employee or project ID');
        return false;
      }

      const isValidUser = await validateUserId(employeeId);
      if (!isValidUser) {
        toast.error('Employee not found');
        return false;
      }

      const project = projects.find((p) => p.id === projectId);
      if (!project) {
        toast.error('Project not found');
        return false;
      }
      if (project.archived) {
        toast.error('Cannot allocate to an archived project');
        return false;
      }

      const startIndex = sprints.findIndex((s) => s.id === startSprintId);
      if (startIndex === -1) {
        toast.error('Sprint not found');
        return false;
      }

      const safeDays = Math.max(1, Math.min(10, Math.floor(days || 1)));
      const tail = sprints.slice(startIndex);

      let targetSprints: Sprint[] = [];

      if (mode.kind === 'single') {
        targetSprints = tail.slice(0, 1);
      } else if (mode.kind === 'next-n') {
        const n = Math.max(1, Math.min(26, Math.floor(mode.count || 1)));
        targetSprints = tail.slice(0, n);
      } else {
        const projectEnd = toDateMaybe((project as any).endDate ?? (project as any).end_date);
        if (!projectEnd) {
          // No end date: safest behavior is single sprint to avoid accidental infinite allocations.
          targetSprints = tail.slice(0, 1);
        } else {
          targetSprints = tail.filter((s) => {
            const sprintStart = toDateMaybe((s as any).startDate ?? (s as any).start);
            // If we can't parse, don't block it.
            return !sprintStart ? true : sprintStart.getTime() <= projectEnd.getTime();
          });
          if (targetSprints.length === 0) targetSprints = tail.slice(0, 1);
        }
      }

      try {
        let created = 0;
        for (const spr of targetSprints) {
          // eslint-disable-next-line no-await-in-loop
          const res = await createSprintAllocation({
            employeeId,
            projectId,
            sprintId: spr.id,
            days: safeDays,
          });
          if (res) created += 1;
        }

        if (created > 0) {
          toast.success(created === 1 ? 'Allocation created' : `Allocations created for ${created} sprint(s)`);
          return true;
        }

        toast.warning('No allocations created');
        return false;
      } catch (error) {
        toast.error('Failed to allocate');
        return false;
      }
    },
    [
      user,
      hasAllocationPermission,
      validateUserId,
      projects,
      sprints,
      createSprintAllocation,
    ]
  );

  /**
   * Existing: moveAllocation for drag & drop.
   * Kept intact for compatibility (including "split across future sprints" logic).
   */
  const moveAllocation = useCallback(
    async (dragItem: DragItem, targetSprintId: string) => {
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
        const employee = employees.find((e) => e.id === dragItem.employeeId);
        if (!employee) throw new Error('Employee not found');

        const startingIndex = sprints.findIndex((s) => s.id === targetSprintId);
        if (startingIndex === -1) throw new Error('Target sprint not found');

        const futureSprints = sprints.slice(startingIndex);
        const createdAllocations: Allocation[] = [];

        for (const sprint of futureSprints) {
          if (daysRemaining <= 0) break;

          const workingDays = sprint.workingDays || [];
          const vacationDates = (employee.vacationDates || []).map((d) => new Date(d).toDateString());
          const availableDays = workingDays.filter(
            (date) => !vacationDates.includes(new Date(date).toDateString())
          );

          const maxAvailable = availableDays.length;
          if (maxAvailable <= 0) continue;

          const toAllocate = Math.min(daysRemaining, maxAvailable);

          // eslint-disable-next-line no-await-in-loop
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
    },
    [
      user,
      hasAllocationPermission,
      validateUserId,
      sprints,
      employees,
      deleteAllocation,
      addAllocation,
    ]
  );

  const getEmployeeAllocations = useCallback(
    (employeeId: string) => allocations.filter((alloc) => alloc.employeeId === employeeId),
    [allocations]
  );

  const getTotalAllocationDays = useCallback(
    (employeeId: string, sprint: Sprint) =>
      allocations
        .filter((alloc) => alloc.employeeId === employeeId && alloc.sprintId === sprint.id)
        .reduce((sum, a) => sum + a.days, 0),
    [allocations]
  );

  const getProjectAllocations = useCallback(
    (projectId: string) => allocations.filter((alloc) => alloc.projectId === projectId),
    [allocations]
  );

  const allocateToProjectTimeline = useCallback(
    async (employeeId: string, projectId: string, daysPerWeek: 1 | 3 | 5) => {
      if (!user || !hasAllocationPermission) {
        toast.error('Only authorized users can allocate resources');
        return false;
      }

      try {
        const project = projects.find((p) => p.id === projectId);
        if (!project) throw new Error('Project not found');

        const projectSprints = sprints.filter((s) => {
          const { start: sStart, end: sEnd } = {
            start: toDateMaybe((s as any).startDate) ?? new Date((s as any).startDate),
            end: toDateMaybe((s as any).endDate) ?? new Date((s as any).endDate),
          };
          const pStart = toDateMaybe((project as any).startDate) ?? new Date((project as any).startDate);
          const pEnd = toDateMaybe((project as any).endDate) ?? new Date((project as any).endDate);
          return sStart <= pEnd && sEnd >= pStart;
        });

        const daysPerSprint = Math.min(daysPerWeek * 2, 10);

        for (const sprint of projectSprints) {
          // eslint-disable-next-line no-await-in-loop
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
    },
    [user, hasAllocationPermission, sprints, projects, addAllocation]
  );

  const getAvailableDays = useCallback(
    (employeeId: string, sprint: Sprint) => {
      const employee = employees.find((e) => e.id === employeeId);
      if (!employee || !sprint?.workingDays) return 0;

      const workingDays = sprint.workingDays.map((d) => format(new Date(d), 'yyyy-MM-dd'));
      const vacationDays = (employee.vacationDates || []).map((d) => format(new Date(d), 'yyyy-MM-dd'));

      const available = workingDays.filter((date) => !vacationDays.includes(date));
      return available.length;
    },
    [employees]
  );

  return {
    addAllocation,
    updateAllocation,
    deleteAllocation,
    moveAllocation,

    // ✅ New, proper APIs for sprint-based quick allocation
    createSprintAllocation,
    quickAllocateToProject,

    getEmployeeAllocations,
    getTotalAllocationDays,
    getProjectAllocations,
    allocateToProjectTimeline,
    getAvailableDays,
  };
};
