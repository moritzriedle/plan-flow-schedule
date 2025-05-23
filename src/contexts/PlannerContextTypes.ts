
import { Employee, Project, Allocation, Week, DragItem } from '../types';

// Context type definition
export type PlannerContextType = {
  employees: Employee[];
  projects: Project[];
  allocations: Allocation[];
  weeks: Week[];
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (employee: Employee) => void;
  addProject: (project: Omit<Project, 'id'>) => void;
  updateProject: (project: Project) => void; // Added updateProject function
  addAllocation: (allocation: Omit<Allocation, 'id'>) => void;
  updateAllocation: (allocation: Allocation) => void;
  moveAllocation: (dragItem: DragItem, weekId: string) => void;
  deleteAllocation: (id: string) => void;
  getEmployeeAllocations: (employeeId: string) => Allocation[];
  getProjectById: (id: string) => Project | undefined;
  getEmployeeById: (id: string) => Employee | undefined;
  getTotalAllocationDays: (employeeId: string, weekId: string) => number;
  getProjectAllocations: (projectId: string) => Allocation[];
};
