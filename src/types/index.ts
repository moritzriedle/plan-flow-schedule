export interface Employee {
  id: string;
  name: string;
  role: string;
  imageUrl?: string;
  vacationDates?: string[]; // Array of date strings in YYYY-MM-DD format
}

export interface Project {
  id: string;
  name: string;
  color: 'blue' | 'purple' | 'pink' | 'orange' | 'green';
  startDate?: Date;
  endDate?: Date;
  leadId?: string;
  ticketReference?: string;
  description?: string;
}

export interface Sprint {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  workingDays: Date[];
}

export interface Allocation {
  id: string;
  employeeId: string;
  projectId: string;
  sprintId: string;
  days: number;
}

export interface DragItem {
  type: 'ALLOCATION' | 'PROJECT';
  id: string;
  employeeId: string;
  projectId: string;
  days: number;
  sourceSprintId?: string;
}

export interface Week {
  id: string;
  startDate: Date;
  endDate: Date;
  label: string;
}

// No type definitions for 'professions' or related entities.
// Employee type is used for planner logic.
