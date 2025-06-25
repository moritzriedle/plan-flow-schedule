
import React, { useState } from 'react';
import { format, addDays, startOfWeek, endOfWeek, isFriday, isMonday } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Employee, Project } from '@/types';

interface DetailedAllocationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  project: Project;
  onAllocate: (params: {
    employeeId: string;
    projectId: string;
    startDate: Date;
    endDate: Date;
    daysPerWeek: number;
  }) => Promise<void>;
}

export const DetailedAllocationDialog: React.FC<DetailedAllocationDialogProps> = ({
  isOpen,
  onClose,
  employee,
  project,
  onAllocate,
}) => {
  const [timeframeType, setTimeframeType] = useState<'project-end' | 'custom-date'>('project-end');
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [startDate, setStartDate] = useState<Date>();
  const [daysPerWeek, setDaysPerWeek] = useState<number>(5);
  const [isAllocating, setIsAllocating] = useState(false);

  // Filter dates to only allow Mondays for start date
  const isMondayDisabled = (date: Date) => {
    return !isMonday(date) || date < new Date();
  };

  // Filter dates to only allow Fridays for end date
  const isFridayDisabled = (date: Date) => {
    return !isFriday(date) || date < new Date();
  };

  const handleAllocate = async () => {
    if (!startDate) return;

    setIsAllocating(true);
    try {
      const endDate = timeframeType === 'project-end' 
        ? project.endDate 
        : customEndDate || project.endDate;

      await onAllocate({
        employeeId: employee.id,
        projectId: project.id,
        startDate,
        endDate,
        daysPerWeek,
      });

      onClose();
    } catch (error) {
      console.error('Error allocating:', error);
    } finally {
      setIsAllocating(false);
    }
  };

  const isValidAllocation = startDate && (timeframeType === 'project-end' || customEndDate);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Allocate {employee.name} to {project.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Start Date Selection */}
          <div className="space-y-2">
            <Label>Start Date (must be a Monday)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Select start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={isMondayDisabled}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Timeframe Selection */}
          <div className="space-y-2">
            <Label>Allocate Until</Label>
            <Select value={timeframeType} onValueChange={(value: 'project-end' | 'custom-date') => setTimeframeType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project-end">
                  End of Project ({format(project.endDate, "PPP")})
                </SelectItem>
                <SelectItem value="custom-date">Custom Date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom End Date (only if custom-date is selected) */}
          {timeframeType === 'custom-date' && (
            <div className="space-y-2">
              <Label>End Date (must be a Friday)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !customEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customEndDate ? format(customEndDate, "PPP") : "Select end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customEndDate}
                    onSelect={setCustomEndDate}
                    disabled={isFridayDisabled}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Days Per Week Selection */}
          <div className="space-y-2">
            <Label>Days Per Week</Label>
            <Select value={daysPerWeek.toString()} onValueChange={(value) => setDaysPerWeek(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 day/week</SelectItem>
                <SelectItem value="2">2 days/week</SelectItem>
                <SelectItem value="3">3 days/week</SelectItem>
                <SelectItem value="4">4 days/week</SelectItem>
                <SelectItem value="5">5 days/week</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleAllocate} 
            disabled={!isValidAllocation || isAllocating}
          >
            {isAllocating ? 'Allocating...' : 'Allocate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
