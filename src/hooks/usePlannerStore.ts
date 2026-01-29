import { useDataLoader } from './plannerStore/useDataLoader';
import { useEmployeeOperations } from './plannerStore/useEmployeeOperations';
import { useProjectOperations } from './plannerStore/useProjectOperations';
import { useAllocationOperations } from './plannerStore/useAllocationOperations';
import { PlannerStoreReturn } from './plannerStore/types';

export const usePlannerStore = (): PlannerStoreReturn => {
  console.log('usePlannerStore initializing');

  const {
    employees,
    projects,
    allocations,
    sprints,
    loading,
    setEmployees,
    setProjects,
    setAllocations,
    setSprints,
  } = useDataLoader();

  const { addEmployee, updateEmployee, getEmployeeById } = useEmployeeOperations(employees, setEmployees);

  const { addProject, updateProject, getProjectById } = useProjectOperations(projects, setProjects);

  const {
    addAllocation,
    updateAllocation,
    moveAllocation,
    deleteAllocation,
    getEmployeeAllocations,
    getTotalAllocationDays,
    getProjectAllocations,
    allocateToProjectTimeline,
    getAvailableDays,

    // ✅ NEW: expose these for quick allocate UX
    createSprintAllocation,
    quickAllocateToProject,
  } = useAllocationOperations(allocations, setAllocations, projects, setProjects, sprints, employees);

  const getSprintById = (id: string) => sprints.find((s) => s.id === id);

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

    // ✅ NEW: returned to the store so usePlanner() can access it
    createSprintAllocation,
    quickAllocateToProject,

    getEmployeeAllocations,
    getProjectById,
    getEmployeeById,
    getTotalAllocationDays,
    getProjectAllocations,
    allocateToProjectTimeline,
    getAvailableDays,
    getSprintById,
  };
};
