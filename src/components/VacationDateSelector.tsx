
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, X } from 'lucide-react';
import { format } from 'date-fns';

interface VacationDateSelectorProps {
  selectedDates: string[];
  onDatesChange: (dates: string[]) => void;
}

const VacationDateSelector: React.FC<VacationDateSelectorProps> = ({
  selectedDates,
  onDatesChange
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const dateString = format(date, 'yyyy-MM-dd');
      if (!selectedDates.includes(dateString)) {
        onDatesChange([...selectedDates, dateString]);
      }
      setSelectedDate(undefined);
    }
  };

  const handleRemoveDate = (dateToRemove: string) => {
    onDatesChange(selectedDates.filter(date => date !== dateToRemove));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <CalendarDays className="h-4 w-4 mr-2" />
              Add Vacation Date
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      
      {selectedDates.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Selected Vacation Dates:</label>
          <div className="flex flex-wrap gap-2">
            {selectedDates.map((date) => (
              <Badge key={date} variant="secondary" className="flex items-center gap-1">
                {format(new Date(date), 'MMM dd, yyyy')}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => handleRemoveDate(date)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VacationDateSelector;
