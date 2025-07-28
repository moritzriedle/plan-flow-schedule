import { format, addWeeks, addDays, differenceInCalendarDays } from 'date-fns';
import { Sprint } from '../types';

// ✅ Global Reference: Sprint 0 starts on Jan 6, 2025 (Monday)
export const referenceSprintStart = new Date(2025, 0, 6); // December is month 11

// 🧠 Sprint 13 starts on June 23, 2025, which is 13 * 2 weeks after reference
const SPRINT_LENGTH_DAYS = 14;
const WORK_DAYS_PER_WEEK = 5;

export const getSprintLabel = (sprintNumber: number, startDate: Date): string => {
  const endDate = addDays(startDate, 11); // Sprint ends Friday of 2nd week (Mon + 11 days)
  return `Sprint ${sprintNumber} - ${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`;
};

export const calculateSprintNumber = (date: Date): number => {
  const daysDiff = differenceInCalendarDays(date, referenceSprintStart);
  return Math.floor((daysDiff + 1) / SPRINT_LENGTH_DAYS);
};

export const generateSprints = (startDate: Date, numSprints: number): Sprint[] => {
  const sprints: Sprint[] = [];

  for (let i = 0; i < numSprints; i++) {
    const sprintStartDate = addWeeks(startDate, i * 2); // 2 weeks per sprint
    const sprintEndDate = addDays(sprintStartDate, 11); // Ends Friday of 2nd week

    const workingDays: Date[] = [];

    // Week 1 (Mon–Fri)
    for (let d = 0; d < WORK_DAYS_PER_WEEK; d++) {
      workingDays.push(addDays(sprintStartDate, d));
    }

    // Week 2 (Mon–Fri)
    const secondWeekStart = addDays(sprintStartDate, 7);
    for (let d = 0; d < WORK_DAYS_PER_WEEK; d++) {
      workingDays.push(addDays(secondWeekStart, d));
    }

    const sprintNumber = calculateSprintNumber(sprintStartDate);

    sprints.push({
      id: `sprint-${sprintNumber + 1}`,
      name: `Sprint ${sprintNumber +1}`,
      startDate: sprintStartDate,
      endDate: sprintEndDate,
      workingDays
    });
  }

  return sprints;
};

export const findActiveSprint = (sprints: Sprint[]): Sprint | undefined => {
  const today = new Date();

  return sprints.find((sprint) => {
    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);

    // Optional: zero out time for accuracy
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return today >= start && today <= end;
  });
};


export const getSprintDateRange = (sprint: Sprint): string => {
  return `${format(sprint.startDate, 'MMM d')} - ${format(sprint.endDate, 'MMM d')}`;
};

export const isSprintActive = (sprint: Sprint): boolean => {
  const today = new Date();
  return today >= sprint.startDate && today <= sprint.endDate;
};
