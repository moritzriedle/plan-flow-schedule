
import { format, startOfWeek, addWeeks, addDays, isWeekend, getWeek, getYear } from 'date-fns';
import { Sprint } from '../types';

export const getSprintLabel = (sprintNumber: number, startDate: Date): string => {
  const endDate = addDays(addWeeks(startDate, 2), -3); // Two weeks minus weekend days
  return `Sprint ${sprintNumber} - ${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`;
};

// Calculate sprint number based on the year and the specific sprint cycle
const calculateSprintNumber = (startDate: Date): number => {
  const year = getYear(startDate);
  
  // Reference: Sprint 13 starts on June 24th, 2024 (Monday)
  const referenceDate = new Date(2024, 5, 24); // June 24 (Monday)
  const referenceSprintNumber = 13;
  
  if (year === 2024) {
    // Calculate weeks difference from reference date
    const weeksDiff = Math.floor((startDate.getTime() - referenceDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    // Each sprint is 2 weeks, so divide by 2
    const sprintsDiff = Math.floor(weeksDiff / 2);
    return referenceSprintNumber + sprintsDiff;
  } else if (year > 2024) {
    // For years after 2024, start from Sprint 1 in January
    const yearStart = new Date(year, 0, 1);
    const firstMondayOfYear = startOfWeek(yearStart, { weekStartsOn: 1 });
    if (firstMondayOfYear.getFullYear() < year) {
      // If first Monday is in previous year, move to next Monday
      const actualStart = addWeeks(firstMondayOfYear, 1);
      const weeksDiff = Math.floor((startDate.getTime() - actualStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
      return Math.floor(weeksDiff / 2) + 1;
    } else {
      const weeksDiff = Math.floor((startDate.getTime() - firstMondayOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000));
      return Math.floor(weeksDiff / 2) + 1;
    }
  } else {
    // For years before 2024, calculate backwards
    const weeksDiff = Math.floor((referenceDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const sprintsDiff = Math.floor(weeksDiff / 2);
    return referenceSprintNumber - sprintsDiff;
  }
};

export const generateSprints = (startDate: Date, numSprints: number): Sprint[] => {
  const sprints: Sprint[] = [];
  
  // Start with Sprint 13 on June 24th, 2024 as reference
  const referenceDate = new Date(2024, 5, 24); // June 24th, 2024 (Monday)
  
  // Find the current sprint based on today's date
  const today = new Date();
  let currentSprintStart = referenceDate;
  
  // Calculate how many sprints have passed since reference date
  const weeksSinceReference = Math.floor((today.getTime() - referenceDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const sprintsSinceReference = Math.floor(weeksSinceReference / 2);
  
  // Start from current sprint (no past sprints)
  currentSprintStart = addWeeks(referenceDate, sprintsSinceReference * 2);
  
  for (let i = 0; i < numSprints; i++) {
    const sprintStartDate = addWeeks(currentSprintStart, i * 2);
    const sprintEndDate = addDays(addWeeks(sprintStartDate, 2), -3); // End on Friday of second week
    
    const sprintNumber = calculateSprintNumber(sprintStartDate);
    
    // Generate working days (Monday to Friday only) for both weeks
    const workingDays: Date[] = [];
    
    // First week (Monday to Friday)
    for (let day = 0; day < 5; day++) {
      workingDays.push(addDays(sprintStartDate, day));
    }
    
    // Second week (Monday to Friday)
    const secondWeekStart = addWeeks(sprintStartDate, 1);
    for (let day = 0; day < 5; day++) {
      workingDays.push(addDays(secondWeekStart, day));
    }
    
    sprints.push({
      id: `sprint-${sprintNumber}`,
      name: `Sprint ${sprintNumber}`,
      startDate: sprintStartDate,
      endDate: sprintEndDate,
      workingDays
    });
  }
  
  return sprints;
};

// Helper function to get sprint date range display
export const getSprintDateRange = (sprint: Sprint): string => {
  return `${format(sprint.startDate, 'MMM d')} - ${format(sprint.endDate, 'MMM d')}`;
};

// Helper function to check if a sprint is currently active
export const isSprintActive = (sprint: Sprint): boolean => {
  const today = new Date();
  return today >= sprint.startDate && today <= sprint.endDate;
};
