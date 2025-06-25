
import { Employee, Project, Allocation, Week, DragItem } from '../types';

// Context type definition
export type PlannerContextType = {
  employees: Employee[];
  projects: Project[];
  allocations: Allocation[];
  weeks: Week[];
  loading: boolean;
  addEmployee: (employee: Omit<Employee, 'id'>) => Promise<Employee | null>;
  updateEmployee: (employee: Employee) => Promise<boolean>;
  addProject: (project: Omit<Project, 'id'>) => Promise<Project | null>;
  updateProject: (project: Project) => Promise<boolean>;
  addAllocation: (allocation: Omit<Allocation, 'id'>) => Promise<Allocation | null>;
  updateAllocation: (allocation: Allocation) => Promise<boolean>;
  moveAllocation: (dragItem: DragItem, weekId: string) => Promise<boolean>;
  deleteAllocation: (id: string) => Promise<boolean>;
  getEmployeeAllocations: (employeeId: string) => Allocation[];
  getProjectById: (id: string) => Project | undefined;
  getEmployeeById: (id: string) => Employee | undefined;
  getTotalAllocationDays: (employeeId: string, weekId: string) => number;
  getProjectAllocations: (projectId: string) => Allocation[];
  allocateToProjectTimeline: (employeeId: string, projectId: string, daysPerWeek: 1 | 3 | 5) => Promise<boolean>;
};
