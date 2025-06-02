
import { startOfWeek, addWeeks, addMonths, format, startOfMonth } from 'date-fns';
import { Week } from '../types';
import { TimeframeOption, GranularityOption } from '../components/TimeframeSelector';

export const generateTimeframeWeeks = (
  timeframe: TimeframeOption,
  granularity: GranularityOption,
  startDate?: Date
): Week[] => {
  const baseDate = startDate || startOfWeek(new Date(), { weekStartsOn: 1 });
  const weeks: Week[] = [];
  
  // Calculate number of periods based on timeframe and granularity
  let numPeriods: number;
  let periodLength: number; // in weeks
  
  switch (timeframe) {
    case '4weeks':
      numPeriods = granularity === 'monthly' ? 1 : (granularity === '2weeks' ? 2 : 4);
      break;
    case '8weeks':
      numPeriods = granularity === 'monthly' ? 2 : (granularity === '2weeks' ? 4 : 8);
      break;
    case '12weeks':
      numPeriods = granularity === 'monthly' ? 3 : (granularity === '2weeks' ? 6 : 12);
      break;
    case '6months':
      numPeriods = granularity === 'monthly' ? 6 : (granularity === '2weeks' ? 12 : 24);
      break;
    default:
      numPeriods = 8;
  }
  
  switch (granularity) {
    case 'weekly':
      periodLength = 1;
      break;
    case '2weeks':
      periodLength = 2;
      break;
    case 'monthly':
      periodLength = 4; // approximately 4 weeks per month
      break;
    default:
      periodLength = 1;
  }
  
  for (let i = 0; i < numPeriods; i++) {
    let periodStart: Date;
    let periodEnd: Date;
    let label: string;
    let id: string;
    
    if (granularity === 'monthly') {
      periodStart = startOfMonth(addMonths(baseDate, i));
      periodEnd = addWeeks(periodStart, 4);
      label = format(periodStart, 'MMM yyyy');
      id = `month-${i + 1}`;
    } else {
      periodStart = addWeeks(baseDate, i * periodLength);
      periodEnd = addWeeks(periodStart, periodLength);
      
      if (granularity === '2weeks') {
        const endWeek = addWeeks(periodStart, 1);
        label = `${format(periodStart, 'MMM d')} - ${format(endWeek, 'MMM d')}`;
        id = `biweek-${i + 1}`;
      } else {
        label = `${format(periodStart, 'MMM d')} - ${format(addWeeks(periodStart, 1), 'MMM d')}`;
        id = `week-${i + 1}`;
      }
    }
    
    weeks.push({
      id,
      startDate: periodStart,
      endDate: periodEnd,
      label
    });
  }
  
  return weeks;
};
