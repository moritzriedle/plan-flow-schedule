
import React from 'react';
import { usePlanner } from '@/contexts/PlannerContext';
import { Project, Employee } from '@/types';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface ProjectMonthDetailsProps {
  project: Project;
  month: Date;
}

const ProjectMonthDetails: React.FC<ProjectMonthDetailsProps> = ({ project, month }) => {
  const { getProjectAllocations, getEmployeeById } = usePlanner();
  
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  
  const allocations = getProjectAllocations(project.id);
  
  // Find employees working on this project in this month
  const employeeIds = new Set<string>();
  allocations.forEach(alloc => {
    employeeIds.add(alloc.employeeId);
  });
  
  const teamMembers = Array.from(employeeIds)
    .map(id => getEmployeeById(id))
    .filter(Boolean) as Employee[];
  
  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  return (
    <Card className="mb-4 overflow-hidden">
      <CardHeader className="bg-gray-50 py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: `var(--project-${project.color})` }}
          ></div>
          Team Members for {project.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-3">
        {teamMembers.length > 0 ? (
          <div className="space-y-2">
            {teamMembers.map(employee => (
              <div key={employee.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-2">
                    {employee.imageUrl ? (
                      <AvatarImage src={employee.imageUrl} alt={employee.name} />
                    ) : (
                      <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium">{employee.name}</div>
                    <div className="text-xs text-gray-500">{employee.role}</div>
                  </div>
                </div>
                
                {project.leadId === employee.id && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    Lead
                  </Badge>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No team members assigned for this month</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectMonthDetails;
