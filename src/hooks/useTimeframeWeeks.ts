
import { useState, useMemo } from 'react';
import { TimeframeOption, GranularityOption } from '../components/TimeframeSelector';
import { generateTimeframeWeeks } from '../utils/timeframeUtils';
import { Week } from '../types';

export const useTimeframeWeeks = () => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('8weeks');
  const [granularity, setGranularity] = useState<GranularityOption>('weekly');
  
  const weeks = useMemo<Week[]>(() => {
    return generateTimeframeWeeks(timeframe, granularity);
  }, [timeframe, granularity]);
  
  return {
    timeframe,
    granularity,
    weeks,
    setTimeframe,
    setGranularity
  };
};
