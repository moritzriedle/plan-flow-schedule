
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
  const { getProjectAllocations, getEmployeeById, sprints } = usePlanner();
  
  // Get all sprints that overlap with the month
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  
  const monthSprints = sprints.filter(sprint => {
    return sprint.startDate <= monthEnd && sprint.endDate >= monthStart;
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
        {monthSprints.map((sprint, index) => {
          const sprintAllocations = allocations.filter(alloc => alloc.sprintId === sprint.id);
          
          return (
            <div key={index} className="border rounded-md p-3">
              <div className="font-medium text-sm mb-2">
                {sprint.name}
              </div>
              
              {sprintAllocations.length > 0 ? (
                <div className="space-y-2">
                  {sprintAllocations.map((alloc, i) => {
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
