
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from 'lucide-react';

export type TimeframeOption = '4sprints' | '6sprints' | '8sprints' | '12sprints';

interface TimeframeSelectorProps {
  timeframe: TimeframeOption;
  onTimeframeChange: (timeframe: TimeframeOption) => void;
}

const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({
  timeframe,
  onTimeframeChange
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
            <SelectItem value="4sprints">4 Sprints</SelectItem>
            <SelectItem value="6sprints">6 Sprints</SelectItem>
            <SelectItem value="8sprints">8 Sprints</SelectItem>
            <SelectItem value="12sprints">12 Sprints</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default TimeframeSelector;
