
import { format, startOfWeek, endOfWeek, addWeeks, getWeek } from 'date-fns';
import { Week } from '../types';

export const getWeekLabel = (date: Date): string => {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  const weekNumber = getWeek(start, { weekStartsOn: 1 });
  
  return `WW${weekNumber} ${format(start, 'MMM d')}-${format(end, 'd')}`;
};

export const generateWeeks = (startDate: Date, numWeeks: number): Week[] => {
  const weeks: Week[] = [];
  
  for (let i = 0; i < numWeeks; i++) {
    const weekStartDate = addWeeks(startDate, i);
    const weekStart = startOfWeek(weekStartDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekStartDate, { weekStartsOn: 1 });
    const label = getWeekLabel(weekStartDate);
    
    weeks.push({
      id: `week-${i + 1}`,
      startDate: weekStart,
      endDate: weekEnd,
      label
    });
  }
  
  return weeks;
};
