
import { Employee, Project, Allocation } from '../types';

// Sample employee data
export const sampleEmployees: Employee[] = [
  { id: 'emp1', name: 'Alex Johnson', role: 'Frontend Developer', imageUrl: 'https://i.pravatar.cc/150?u=emp1' },
  { id: 'emp2', name: 'Casey Smith', role: 'Backend Developer', imageUrl: 'https://i.pravatar.cc/150?u=emp2' },
  { id: 'emp3', name: 'Jordan Lee', role: 'UI/UX Designer', imageUrl: 'https://i.pravatar.cc/150?u=emp3' },
  { id: 'emp4', name: 'Taylor Brown', role: 'Project Manager', imageUrl: 'https://i.pravatar.cc/150?u=emp4' },
  { id: 'emp5', name: 'Morgan Wilson', role: 'QA Engineer', imageUrl: 'https://i.pravatar.cc/150?u=emp5' },
];

// Sample project data
export const sampleProjects: Project[] = [
  { 
    id: 'proj1', 
    name: 'Website Redesign', 
    color: 'blue', 
    startDate: new Date(), 
    endDate: new Date(new Date().setDate(new Date().getDate() + 60)) 
  },
  { 
    id: 'proj2', 
    name: 'Mobile App', 
    color: 'purple', 
    startDate: new Date(), 
    endDate: new Date(new Date().setDate(new Date().getDate() + 90)) 
  },
  { 
    id: 'proj3', 
    name: 'Dashboard', 
    color: 'pink', 
    startDate: new Date(), 
    endDate: new Date(new Date().setDate(new Date().getDate() + 45)) 
  },
  { 
    id: 'proj4', 
    name: 'API Integration', 
    color: 'orange', 
    startDate: new Date(), 
    endDate: new Date(new Date().setDate(new Date().getDate() + 30)) 
  },
  { 
    id: 'proj5', 
    name: 'Documentation', 
    color: 'green', 
    startDate: new Date(), 
    endDate: new Date(new Date().setDate(new Date().getDate() + 15)) 
  },
];

// Sample allocation data
export const sampleAllocations: Allocation[] = [
  { id: 'alloc1', employeeId: 'emp1', projectId: 'proj1', weekId: 'week-1', days: 3 },
  { id: 'alloc2', employeeId: 'emp1', projectId: 'proj2', weekId: 'week-2', days: 2 },
  { id: 'alloc3', employeeId: 'emp2', projectId: 'proj2', weekId: 'week-1', days: 5 },
  { id: 'alloc4', employeeId: 'emp3', projectId: 'proj3', weekId: 'week-1', days: 4 },
  { id: 'alloc5', employeeId: 'emp4', projectId: 'proj4', weekId: 'week-1', days: 5 },
  { id: 'alloc6', employeeId: 'emp5', projectId: 'proj5', weekId: 'week-2', days: 3 },
];
