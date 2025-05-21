
export interface Employee {
  id: string;
  name: string;
  role: string;
  imageUrl?: string;
}

export interface Project {
  id: string;
  name: string;
  color: 'blue' | 'purple' | 'pink' | 'orange' | 'green';
  startDate: Date;
  endDate: Date;
}

export interface Allocation {
  id: string;
  employeeId: string;
  projectId: string;
  weekId: string;
  days: number;
}

export interface Week {
  id: string;
  startDate: Date;
  endDate: Date;
  label: string;
}

export type DragItem = {
  type: 'ALLOCATION';
  id: string;
  employeeId: string;
  projectId: string;
  days: number;
  sourceWeekId?: string;
};
