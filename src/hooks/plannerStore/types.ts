import { Employee, Project, Allocation, Sprint, DragItem } from '../../types';

export type QuickAllocateMode =
  | { kind: 'single' }
  | { kind: 'next-n'; count: number }
  | { kind: 'until-project-end' };

export interface PlannerStoreReturn {
  employees: Employee[];
  projects: Project[];
  allocations: Allocation[];
  sprints: Sprint[];
  setSprints: React.Dispatch<React.SetStateAction<Sprint[]>>;
  loading: boolean;

  addEmployee: (employee: Omit<Employee, 'id'>) => Promise<Employee | null>;
  updateEmployee: (employee: Employee) => Promise<boolean>;

  addProject: (project: Omit<Project, 'id'>) => Promise<Project | null>;
  updateProject: (project: Project) => Promise<boolean>;

  addAllocation: (allocation: Omit<Allocation, 'id'>) => Promise<Allocation | null>;
  updateAllocation: (allocation: Allocation) => Promise<boolean>;

  moveAllocation: (dragItem: DragItem, sprintId: string) => Promise<boolean>;
  deleteAllocation: (id: string) => Promise<boolean>;

  // ✅ NEW: clean API for creating allocation in a single sprint
  createSprintAllocation: (params: {
    employeeId: string;
    projectId: string;
    sprintId: string;
    days: number;
  }) => Promise<Allocation | null>;

  // ✅ NEW: quick allocate API with optional "apply" behavior
  quickAllocateToProject: (params: {
    employeeId: string;
    projectId: string;
    startSprintId: string;
    days: number;
    mode: QuickAllocateMode;
  }) => Promise<boolean>;

  getEmployeeAllocations: (employeeId: string) => Allocation[];
  getProjectById: (id: string) => Project | undefined;
  getEmployeeById: (id: string) => Employee | undefined;
  getTotalAllocationDays: (employeeId: string, sprint: Sprint) => number;
  getProjectAllocations: (projectId: string) => Allocation[];
  allocateToProjectTimeline: (
    employeeId: string,
    projectId: string,
    daysPerWeek: 1 | 3 | 5
  ) => Promise<boolean>;
  getAvailableDays: (employeeId: string, sprint: Sprint) => number;
  getSprintById: (id: string) => Sprint | undefined;
}
