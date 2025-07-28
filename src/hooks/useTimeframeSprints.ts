import { useState, useMemo } from 'react';
import { generateSprints, referenceSprintStart, findActiveSprint } from '../utils/sprintUtils';
import { Sprint } from '../types';
import { TimeframeOption } from '../components/TimeframeSelector';

export const useTimeframeSprints = () => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('6sprints');

  const sprints = useMemo<Sprint[]>(() => {
    const totalSprintsToGenerate = 100; // Ensure we cover a wide range
    const allSprints = generateSprints(referenceSprintStart, totalSprintsToGenerate);

    const activeSprint = findActiveSprint(allSprints);
    if (!activeSprint) return []; // No active sprint found

    const activeIndex = allSprints.findIndex(s => s.id === activeSprint.id);
    const visibleCount = parseInt(timeframe.replace('sprints', ''));

    return allSprints.slice(activeIndex, activeIndex + visibleCount);
  }, [timeframe]);

  return {
    timeframe,
    sprints,
    setTimeframe
  };
};
