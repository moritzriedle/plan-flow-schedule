import { format, parseISO, startOfWeek } from 'date-fns';
import { Sprint, Project, Allocation } from '../../types';

// Helper function to validate UUID
export const isValidUUID = (str: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Helper function to convert sprintId to database date format
export const sprintIdToDate = (sprintId: string, sprints: Sprint[]): string => {
  // Find the sprint object by sprintId
  const sprint = sprints.find(s => s.id === sprintId);
  if (sprint) {
    // Format the start date as YYYY-MM-DD for the database
    return format(sprint.startDate, 'yyyy-MM-dd');
  }
  
  // Fallback: if sprintId is in format "sprint-1", extract the number and calculate
  const sprintNumber = parseInt(sprintId.replace('sprint-', ''));
  if (!isNaN(sprintNumber)) {
    const baseDate = startOfWeek(new Date(), { weekStartsOn: 1 });
    // Each sprint is 2 weeks apart
    const sprintStartDate = new Date(baseDate);
    sprintStartDate.setDate(baseDate.getDate() + (sprintNumber - 1) * 14);
    return format(sprintStartDate, 'yyyy-MM-dd');
  }
  
  throw new Error(`Invalid sprintId format: ${sprintId}`);
};

// Helper function to convert database date to sprintId
export const dateToSprintId = (dateString: string, sprints: Sprint[]): string => {
  const date = parseISO(dateString);
  // Find the sprint that contains this date
  const matchingSprint = sprints.find(sprint => {
    const sprintStart = sprint.startDate;
    const sprintEnd = sprint.endDate;
    return date >= sprintStart && date <= sprintEnd;
  });
  
  if (matchingSprint) {
    return matchingSprint.id;
  }
  
  // Fallback: generate a sprint ID based on the date
  console.warn(`No matching sprint found for date: ${dateString}`);
  return `sprint-1`;
};

// Helper function to calculate project date ranges based on allocations (pure function)
export const calculateProjectDateRanges = (projects: Project[], allocations: Allocation[], sprints: Sprint[]): Project[] => {
  // Group allocations by project
  const allocationsByProject = allocations.reduce((acc, alloc) => {
    if (!acc[alloc.projectId]) {
      acc[alloc.projectId] = [];
    }
    acc[alloc.projectId].push(alloc);
    return acc;
  }, {} as Record<string, Allocation[]>);
  
  // Return updated projects with calculated date ranges
  return projects.map(project => {
    const projectAllocations = allocationsByProject[project.id] || [];
    if (projectAllocations.length === 0) return project;
    
    // Find min and max sprint IDs
    const sprintIds = projectAllocations.map(a => a.sprintId);
    const minSprintId = sprintIds.sort()[0];
    const maxSprintId = sprintIds.sort().reverse()[0];
    
    // Find the corresponding sprint objects
    const startSprint = sprints.find(s => s.id === minSprintId);
    const endSprint = sprints.find(s => s.id === maxSprintId);
    
    return {
      ...project,
      startDate: startSprint?.startDate || project.startDate,
      endDate: endSprint?.endDate || project.endDate
    };
  });
};