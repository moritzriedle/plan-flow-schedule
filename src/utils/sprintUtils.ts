
import { format, startOfWeek, addWeeks, addDays, isWeekend } from 'date-fns';
import { Sprint } from '../types';

export const getSprintLabel = (sprintNumber: number, startDate: Date): string => {
  const endDate = addDays(addWeeks(startDate, 2), -3); // Two weeks minus weekend days
  return `Sprint ${sprintNumber} - ${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`;
};

export const generateSprints = (startDate: Date, numSprints: number): Sprint[] => {
  const sprints: Sprint[] = [];
  
  for (let i = 0; i < numSprints; i++) {
    const sprintStartDate = addWeeks(startOfWeek(startDate, { weekStartsOn: 1 }), i * 2);
    const sprintEndDate = addDays(addWeeks(sprintStartDate, 2), -3); // End on Friday of second week
    
    // Generate working days (Monday to Friday only)
    const workingDays: Date[] = [];
    let currentDate = sprintStartDate;
    
    while (currentDate <= sprintEndDate) {
      if (!isWeekend(currentDate)) {
        workingDays.push(new Date(currentDate));
      }
      currentDate = addDays(currentDate, 1);
    }
    
    sprints.push({
      id: `sprint-${i + 1}`,
      name: `Sprint ${i + 1}`,
      startDate: sprintStartDate,
      endDate: sprintEndDate,
      workingDays
    });
  }
  
  return sprints;
};
