import { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/hooks/useAuth';
import { Sprint, Employee, Allocation, Project } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export interface ScenarioAllocation {
  id: string;
  scenarioId: string;
  employeeId: string | null;
  role: string | null;
  sprintId: string;
  days: number;
  note: string | null;
  isPlaceholder: boolean;
}

export interface Scenario {
  id: string;
  projectId: string;
  createdBy: string;
  status: 'draft' | 'committed';
  sprintShift: number;
  lastSavedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScenarioConflict {
  type: 'hard' | 'warning';
  employeeId?: string;
  role?: string;
  sprintId: string;
  message: string;
  totalDays: number;
  availableDays: number;
}

export const useScenarioStore = (
  employees: Employee[],
  allocations: Allocation[],
  projects: Project[],
  sprints: Sprint[],
  getAvailableDays: (employeeId: string, sprint: Sprint) => number,
) => {
  const { user } = useAuth();
  const [scenarioMode, setScenarioMode] = useState(false);
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [scenarioAllocations, setScenarioAllocations] = useState<ScenarioAllocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSavedScenarios, setShowSavedScenarios] = useState(false);
  const [savedScenarios, setSavedScenarios] = useState<Scenario[]>([]);
  const [isOutdated, setIsOutdated] = useState(false);

  // Load saved scenarios list
  const loadSavedScenarios = useCallback(async () => {
    const { data, error } = await supabase
      .from('planning_scenarios')
      .select('*')
      .eq('status', 'draft')
      .order('updated_at', { ascending: false });
    if (!error && data) {
      setSavedScenarios(data.map((s: any) => ({
        id: s.id,
        projectId: s.project_id,
        createdBy: s.created_by,
        status: s.status,
        sprintShift: s.sprint_shift,
        lastSavedAt: s.last_saved_at,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      })));
    }
  }, []);

  useEffect(() => {
    if (showSavedScenarios) loadSavedScenarios();
  }, [showSavedScenarios, loadSavedScenarios]);

  // Start scenario for a project
  const startScenario = useCallback(async (projectId: string) => {
    if (!user) return;
    setLoading(true);
    try {
      // Check for existing draft
      const { data: existing } = await supabase
        .from('planning_scenarios')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'draft')
        .maybeSingle();

      if (existing) {
        // Load existing scenario
        const scenario: Scenario = {
          id: existing.id,
          projectId: existing.project_id,
          createdBy: existing.created_by,
          status: existing.status,
          sprintShift: existing.sprint_shift,
          lastSavedAt: existing.last_saved_at,
          createdAt: existing.created_at,
          updatedAt: existing.updated_at,
        };
        setActiveScenario(scenario);

        // Load allocations
        const { data: allocs } = await supabase
          .from('scenario_allocations')
          .select('*')
          .eq('scenario_id', existing.id);

        setScenarioAllocations((allocs || []).map((a: any) => ({
          id: a.id,
          scenarioId: a.scenario_id,
          employeeId: a.employee_id,
          role: a.role,
          sprintId: a.sprint_id,
          days: a.days,
          note: a.note,
          isPlaceholder: a.is_placeholder,
        })));

        // Check if outdated
        if (existing.last_saved_at) {
          const { count } = await supabase
            .from('allocations')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', projectId)
            .gt('updated_at', existing.last_saved_at);
          setIsOutdated((count || 0) > 0);
        }

        setScenarioMode(true);
        toast.info('Loaded existing scenario');
      } else {
        // Create new
        const { data: created, error } = await supabase
          .from('planning_scenarios')
          .insert({
            project_id: projectId,
            created_by: user.id,
            status: 'draft',
            sprint_shift: 0,
          })
          .select()
          .single();

        if (error) throw error;

        setActiveScenario({
          id: created.id,
          projectId: created.project_id,
          createdBy: created.created_by,
          status: created.status,
          sprintShift: created.sprint_shift,
          lastSavedAt: created.last_saved_at,
          createdAt: created.created_at,
          updatedAt: created.updated_at,
        });
        setScenarioAllocations([]);
        setIsOutdated(false);
        setScenarioMode(true);
        toast.success('Scenario created');
      }
    } catch (e) {
      console.error('Failed to start scenario', e);
      toast.error('Failed to start scenario');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const exitScenario = useCallback(() => {
    setScenarioMode(false);
    setActiveScenario(null);
    setScenarioAllocations([]);
    setIsOutdated(false);
  }, []);

  // Add named allocation
  const addScenarioAllocation = useCallback(async (params: {
    employeeId: string;
    sprintId: string;
    days: number;
  }) => {
    if (!activeScenario) return null;
    const tempId = uuidv4();
    const newAlloc: ScenarioAllocation = {
      id: tempId,
      scenarioId: activeScenario.id,
      employeeId: params.employeeId,
      role: null,
      sprintId: params.sprintId,
      days: params.days,
      note: null,
      isPlaceholder: false,
    };
    setScenarioAllocations(prev => [...prev, newAlloc]);

    try {
      const { data, error } = await supabase
        .from('scenario_allocations')
        .insert({
          scenario_id: activeScenario.id,
          employee_id: params.employeeId,
          sprint_id: params.sprintId,
          days: params.days,
          is_placeholder: false,
        })
        .select()
        .single();
      if (error) throw error;
      setScenarioAllocations(prev => prev.map(a => a.id === tempId ? { ...a, id: data.id } : a));
      return data.id;
    } catch (e) {
      setScenarioAllocations(prev => prev.filter(a => a.id !== tempId));
      toast.error('Failed to add scenario allocation');
      return null;
    }
  }, [activeScenario]);

  // Add placeholder allocation
  const addPlaceholderAllocation = useCallback(async (params: {
    role: string;
    sprintId: string;
    days: number;
    note?: string;
  }) => {
    if (!activeScenario) return null;
    const tempId = uuidv4();
    const newAlloc: ScenarioAllocation = {
      id: tempId,
      scenarioId: activeScenario.id,
      employeeId: null,
      role: params.role,
      sprintId: params.sprintId,
      days: params.days,
      note: params.note || null,
      isPlaceholder: true,
    };
    setScenarioAllocations(prev => [...prev, newAlloc]);

    try {
      const { data, error } = await supabase
        .from('scenario_allocations')
        .insert({
          scenario_id: activeScenario.id,
          role: params.role,
          sprint_id: params.sprintId,
          days: params.days,
          note: params.note || null,
          is_placeholder: true,
        })
        .select()
        .single();
      if (error) throw error;
      setScenarioAllocations(prev => prev.map(a => a.id === tempId ? { ...a, id: data.id } : a));
      return data.id;
    } catch (e) {
      setScenarioAllocations(prev => prev.filter(a => a.id !== tempId));
      toast.error('Failed to add placeholder allocation');
      return null;
    }
  }, [activeScenario]);

  // Update scenario allocation
  const updateScenarioAllocation = useCallback(async (id: string, days: number) => {
    setScenarioAllocations(prev => prev.map(a => a.id === id ? { ...a, days } : a));
    try {
      const { error } = await supabase
        .from('scenario_allocations')
        .update({ days })
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch {
      toast.error('Failed to update');
      return false;
    }
  }, []);

  // Delete scenario allocation
  const deleteScenarioAllocation = useCallback(async (id: string) => {
    const removed = scenarioAllocations.find(a => a.id === id);
    setScenarioAllocations(prev => prev.filter(a => a.id !== id));
    try {
      const { error } = await supabase
        .from('scenario_allocations')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch {
      if (removed) setScenarioAllocations(prev => [...prev, removed]);
      toast.error('Failed to delete');
      return false;
    }
  }, [scenarioAllocations]);

  // Save scenario
  const saveScenario = useCallback(async () => {
    if (!activeScenario) return false;
    try {
      const { error } = await supabase
        .from('planning_scenarios')
        .update({ last_saved_at: new Date().toISOString() })
        .eq('id', activeScenario.id);
      if (error) throw error;
      setActiveScenario(prev => prev ? { ...prev, lastSavedAt: new Date().toISOString() } : null);
      setIsOutdated(false);
      toast.success('Scenario saved');
      return true;
    } catch {
      toast.error('Failed to save scenario');
      return false;
    }
  }, [activeScenario]);

  // Shift scenario
  const shiftScenario = useCallback(async (shiftBy: number) => {
    if (!activeScenario) return false;

    // For each allocation, shift its sprintId forward by shiftBy sprints
    const sprintIds = sprints.map(s => s.id);
    const updated: ScenarioAllocation[] = [];
    const toDelete: string[] = [];

    for (const alloc of scenarioAllocations) {
      const idx = sprintIds.indexOf(alloc.sprintId);
      const newIdx = idx + shiftBy;
      if (newIdx >= 0 && newIdx < sprintIds.length) {
        updated.push({ ...alloc, sprintId: sprintIds[newIdx] });
      } else {
        toDelete.push(alloc.id);
      }
    }

    setScenarioAllocations(updated);

    try {
      // Update each allocation's sprint_id in DB
      for (const alloc of updated) {
        await supabase
          .from('scenario_allocations')
          .update({ sprint_id: alloc.sprintId })
          .eq('id', alloc.id);
      }
      // Delete out-of-range ones
      if (toDelete.length > 0) {
        await supabase
          .from('scenario_allocations')
          .delete()
          .in('id', toDelete);
      }
      // Update sprint_shift on scenario
      const newShift = (activeScenario.sprintShift || 0) + shiftBy;
      await supabase
        .from('planning_scenarios')
        .update({ sprint_shift: newShift })
        .eq('id', activeScenario.id);
      setActiveScenario(prev => prev ? { ...prev, sprintShift: newShift } : null);

      toast.success(`Scenario shifted by ${shiftBy > 0 ? '+' : ''}${shiftBy} sprint(s)`);
      return true;
    } catch {
      toast.error('Failed to shift scenario');
      return false;
    }
  }, [activeScenario, scenarioAllocations, sprints]);

  // Commit scenario - create real allocations
  const commitScenario = useCallback(async (
    createSprintAllocation: (params: { employeeId: string; projectId: string; sprintId: string; days: number }) => Promise<any>
  ) => {
    if (!activeScenario) return false;

    const namedAllocations = scenarioAllocations.filter(a => !a.isPlaceholder && a.employeeId);
    const placeholders = scenarioAllocations.filter(a => a.isPlaceholder);

    if (placeholders.length > 0) {
      toast.warning(`${placeholders.length} placeholder allocation(s) will be skipped (not assigned to employees)`);
    }

    try {
      let created = 0;
      for (const alloc of namedAllocations) {
        const result = await createSprintAllocation({
          employeeId: alloc.employeeId!,
          projectId: activeScenario.projectId,
          sprintId: alloc.sprintId,
          days: alloc.days,
        });
        if (result) created++;
      }

      // Mark scenario as committed
      await supabase
        .from('planning_scenarios')
        .update({ status: 'committed' })
        .eq('id', activeScenario.id);

      toast.success(`Committed ${created} allocation(s) to real plan`);
      exitScenario();
      return true;
    } catch {
      toast.error('Failed to commit scenario');
      return false;
    }
  }, [activeScenario, scenarioAllocations, exitScenario]);

  // Conflict detection
  const conflicts = useMemo((): ScenarioConflict[] => {
    if (!activeScenario || !scenarioMode) return [];
    const result: ScenarioConflict[] = [];

    // Get unique sprints from scenario allocations
    const scenarioSprintIds = [...new Set(scenarioAllocations.map(a => a.sprintId))];

    for (const sprintId of scenarioSprintIds) {
      const sprint = sprints.find(s => s.id === sprintId);
      if (!sprint) continue;

      // Named allocations - employee level conflicts
      const namedInSprint = scenarioAllocations.filter(a => !a.isPlaceholder && a.employeeId && a.sprintId === sprintId);
      const employeeIds = [...new Set(namedInSprint.map(a => a.employeeId!))];

      for (const empId of employeeIds) {
        const available = getAvailableDays(empId, sprint);

        // Real allocations for this employee in this sprint
        const realDays = allocations
          .filter(a => a.employeeId === empId && a.sprintId === sprintId)
          .reduce((sum, a) => sum + a.days, 0);

        // Scenario allocations for this employee in this sprint
        const scenarioDays = namedInSprint
          .filter(a => a.employeeId === empId)
          .reduce((sum, a) => sum + a.days, 0);

        const totalDays = realDays + scenarioDays;

        // Hard conflict: overallocation
        if (totalDays > available) {
          const emp = employees.find(e => e.id === empId);
          result.push({
            type: 'hard',
            employeeId: empId,
            sprintId,
            message: `${emp?.name || 'Unknown'}: ${totalDays}/${available} days (overallocated)`,
            totalDays,
            availableDays: available,
          });
        }

        // Warning: 3+ projects in same sprint
        const realProjectIds = allocations
          .filter(a => a.employeeId === empId && a.sprintId === sprintId)
          .map(a => a.projectId);
        const scenarioProjectIds = [activeScenario.projectId];
        const allProjectIds = [...new Set([...realProjectIds, ...scenarioProjectIds])];
        if (allProjectIds.length >= 3) {
          const emp = employees.find(e => e.id === empId);
          result.push({
            type: 'warning',
            employeeId: empId,
            sprintId,
            message: `${emp?.name || 'Unknown'}: ${allProjectIds.length} projects in sprint`,
            totalDays: totalDays,
            availableDays: available,
          });
        }
      }

      // Placeholder allocations - role level
      const placeholdersInSprint = scenarioAllocations.filter(a => a.isPlaceholder && a.sprintId === sprintId);
      const roles = [...new Set(placeholdersInSprint.map(a => a.role!).filter(Boolean))];

      for (const role of roles) {
        // Calculate role capacity = sum of available days for all employees with this role
        const roleEmployees = employees.filter(e => e.role === role && !e.archived);
        const roleCapacity = roleEmployees.reduce((sum, emp) => sum + getAvailableDays(emp.id, sprint), 0);

        // Real allocations for employees in this role
        const realRoleDays = roleEmployees.reduce((sum, emp) => {
          return sum + allocations
            .filter(a => a.employeeId === emp.id && a.sprintId === sprintId)
            .reduce((s, a) => s + a.days, 0);
        }, 0);

        // Named scenario allocations for employees in this role
        const namedRoleDays = namedInSprint
          .filter(a => roleEmployees.some(e => e.id === a.employeeId))
          .reduce((sum, a) => sum + a.days, 0);

        // Placeholder demand for this role
        const placeholderDays = placeholdersInSprint
          .filter(a => a.role === role)
          .reduce((sum, a) => sum + a.days, 0);

        const totalRoleDays = realRoleDays + namedRoleDays + placeholderDays;

        if (totalRoleDays > roleCapacity) {
          result.push({
            type: 'hard',
            role,
            sprintId,
            message: `${role}: ${totalRoleDays}/${roleCapacity} days (role overcapacity)`,
            totalDays: totalRoleDays,
            availableDays: roleCapacity,
          });
        }

        // Unassigned demand warning
        if (placeholderDays > 0) {
          result.push({
            type: 'warning',
            role,
            sprintId,
            message: `${role}: ${placeholderDays} days unassigned`,
            totalDays: placeholderDays,
            availableDays: roleCapacity,
          });
        }
      }
    }

    return result;
  }, [activeScenario, scenarioMode, scenarioAllocations, allocations, employees, sprints, getAvailableDays]);

  // Get scenario allocations for an employee in a sprint
  const getScenarioAllocationsForCell = useCallback((employeeId: string, sprintId: string) => {
    return scenarioAllocations.filter(a => !a.isPlaceholder && a.employeeId === employeeId && a.sprintId === sprintId);
  }, [scenarioAllocations]);

  // Get conflict for a specific employee + sprint
  const getConflictsForCell = useCallback((employeeId: string, sprintId: string) => {
    return conflicts.filter(c => c.employeeId === employeeId && c.sprintId === sprintId);
  }, [conflicts]);

  return {
    scenarioMode,
    activeScenario,
    scenarioAllocations,
    loading,
    showSavedScenarios,
    savedScenarios,
    isOutdated,
    conflicts,

    setShowSavedScenarios,
    startScenario,
    exitScenario,
    addScenarioAllocation,
    addPlaceholderAllocation,
    updateScenarioAllocation,
    deleteScenarioAllocation,
    saveScenario,
    shiftScenario,
    commitScenario,
    loadSavedScenarios,
    getScenarioAllocationsForCell,
    getConflictsForCell,
  };
};
