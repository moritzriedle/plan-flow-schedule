
import React from 'react';
import { usePlanner } from '@/contexts/PlannerContext';
import { Project } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { format, startOfMonth, endOfMonth, eachWeekOfInterval, startOfWeek, endOfWeek } from 'date-fns';

interface ProjectMonthDetailsProps {
  project: Project;
  month: Date;
}

const ProjectMonthDetails: React.FC<ProjectMonthDetailsProps> = ({ project, month }) => {
  const { getProjectAllocations, getEmployeeById, weeks } = usePlanner();
  
  // Get all weeks in the month
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  
  const monthWeeks = eachWeekOfInterval(
    { start: monthStart, end: monthEnd },
    { weekStartsOn: 1 }
  ).map(weekStart => {
    // Find matching week from our weeks array
    const matchingWeek = weeks.find(week => {
      const weekStartFormatted = startOfWeek(weekStart, { weekStartsOn: 1 });
      return weekStartFormatted.getTime() === week.startDate.getTime();
    });
    
    return {
      weekStart,
      weekEnd: endOfWeek(weekStart, { weekStartsOn: 1 }),
      weekData: matchingWeek
    };
  });
  
  const allocations = getProjectAllocations(project.id);
  
  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-lg">
        {format(month, 'MMMM yyyy')} - {project.name} Allocations
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {monthWeeks.map((week, index) => {
          if (!week.weekData) return null;
          
          const weekAllocations = allocations.filter(alloc => alloc.weekId === week.weekData!.id);
          
          return (
            <div key={index} className="border rounded-md p-3">
              <div className="font-medium text-sm mb-2">
                {format(week.weekStart, 'MMM d')} - {format(week.weekEnd, 'd')}
              </div>
              
              {weekAllocations.length > 0 ? (
                <div className="space-y-2">
                  {weekAllocations.map((alloc, i) => {
                    const employee = getEmployeeById(alloc.employeeId);
                    if (!employee) return null;
                    
                    return (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <Avatar className="h-5 w-5 mr-2">
                            {employee.imageUrl ? (
                              <AvatarImage src={employee.imageUrl} alt={employee.name} />
                            ) : (
                              <AvatarFallback className="text-xs">{getInitials(employee.name)}</AvatarFallback>
                            )}
                          </Avatar>
                          <span className="truncate">{employee.name}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {alloc.days}d
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-500">No allocations</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectMonthDetails;
