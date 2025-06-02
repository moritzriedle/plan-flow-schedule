
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar, Clock } from 'lucide-react';

export type TimeframeOption = '4weeks' | '8weeks' | '12weeks' | '6months';
export type GranularityOption = 'weekly' | '2weeks' | 'monthly';

interface TimeframeSelectorProps {
  timeframe: TimeframeOption;
  granularity: GranularityOption;
  onTimeframeChange: (timeframe: TimeframeOption) => void;
  onGranularityChange: (granularity: GranularityOption) => void;
}

const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({
  timeframe,
  granularity,
  onTimeframeChange,
  onGranularityChange
}) => {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gray-500" />
        <span className="font-medium text-sm">Timeframe:</span>
        <Select value={timeframe} onValueChange={onTimeframeChange}>
          <SelectTrigger className="w-[140px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="4weeks">4 Weeks</SelectItem>
            <SelectItem value="8weeks">8 Weeks</SelectItem>
            <SelectItem value="12weeks">12 Weeks</SelectItem>
            <SelectItem value="6months">6 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-gray-500" />
        <span className="font-medium text-sm">View:</span>
        <Select value={granularity} onValueChange={onGranularityChange}>
          <SelectTrigger className="w-[120px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="2weeks">Bi-weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default TimeframeSelector;
