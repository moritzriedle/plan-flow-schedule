
import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format, addDays, eachDayOfInterval } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface VacationDateRangeSelectorProps {
  selectedDates: string[];
  onDatesChange: (dates: string[]) => void;
}

const VacationDateRangeSelector: React.FC<VacationDateRangeSelectorProps> = ({
  selectedDates,
  onDatesChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const handleAddRange = () => {
    if (dateRange?.from && dateRange?.to) {
      const newDates = eachDayOfInterval({
        start: dateRange.from,
        end: dateRange.to
      }).map(date => format(date, 'yyyy-MM-dd'));
      
      const updatedDates = [...new Set([...selectedDates, ...newDates])];
      onDatesChange(updatedDates);
      setDateRange(undefined);
      setIsOpen(false);
    } else if (dateRange?.from) {
      // Single date selection
      const newDate = format(dateRange.from, 'yyyy-MM-dd');
      if (!selectedDates.includes(newDate)) {
        onDatesChange([...selectedDates, newDate]);
      }
      setDateRange(undefined);
      setIsOpen(false);
    }
  };

  const handleRemoveDate = (dateToRemove: string) => {
    onDatesChange(selectedDates.filter(date => date !== dateToRemove));
  };

  const handleClearAll = () => {
    onDatesChange([]);
  };

  // Group consecutive dates into ranges for display
  const formatDateRanges = (dates: string[]) => {
    if (dates.length === 0) return 'No vacation dates selected';
    
    const sortedDates = [...dates].sort();
    const ranges: string[] = [];
    let rangeStart = sortedDates[0];
    let rangeEnd = sortedDates[0];
    
    for (let i = 1; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i]);
      const prevDate = new Date(sortedDates[i - 1]);
      
      if (currentDate.getTime() - prevDate.getTime() === 24 * 60 * 60 * 1000) {
        // Consecutive day
        rangeEnd = sortedDates[i];
      } else {
        // Gap found, close current range
        if (rangeStart === rangeEnd) {
          ranges.push(format(new Date(rangeStart), 'MMM dd, yyyy'));
        } else {
          ranges.push(`${format(new Date(rangeStart), 'MMM dd')} - ${format(new Date(rangeEnd), 'MMM dd, yyyy')}`);
        }
        rangeStart = sortedDates[i];
        rangeEnd = sortedDates[i];
      }
    }
    
    // Add the last range
    if (rangeStart === rangeEnd) {
      ranges.push(format(new Date(rangeStart), 'MMM dd, yyyy'));
    } else {
      ranges.push(`${format(new Date(rangeStart), 'MMM dd')} - ${format(new Date(rangeEnd), 'MMM dd, yyyy')}`);
    }
    
    return ranges.join(', ');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Add Vacation Dates
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3">
              <div className="mb-3">
                <p className="text-sm font-medium mb-2">Select vacation date range:</p>
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  className="rounded-md border"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleAddRange}
                  disabled={!dateRange?.from}
                >
                  Add Range
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        {selectedDates.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClearAll}
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>
      
      <div className="text-sm text-gray-600">
        {formatDateRanges(selectedDates)}
      </div>
      
      {selectedDates.length > 0 && (
        <div className="text-xs text-gray-500">
          Total vacation days: {selectedDates.length}
        </div>
      )}
    </div>
  );
};

export default VacationDateRangeSelector;
