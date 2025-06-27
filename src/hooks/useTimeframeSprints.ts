
import { useState, useMemo } from 'react';
import { startOfWeek } from 'date-fns';
import { generateSprints } from '../utils/sprintUtils';
import { Sprint } from '../types';
import { TimeframeOption } from '../components/TimeframeSelector';

export const useTimeframeSprints = () => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('6sprints');

  const sprints = useMemo<Sprint[]>(() => {
    const numSprints = parseInt(timeframe.replace('sprints', ''));
    const startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
    return generateSprints(startDate, numSprints);
  }, [timeframe]);

  return {
    timeframe,
    sprints,
    setTimeframe
  };
};
