
import React from 'react';
import { usePlanner } from '@/contexts/PlannerContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, addMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Project } from '@/types';

const ProjectGanttView = () => {
  const { projects } = usePlanner();
  
  // Find overall min and max dates for all projects
  const minDate = new Date(Math.min(...projects.map(p => p.startDate.getTime())));
  const maxDate = new Date(Math.max(...projects.map(p => p.endDate.getTime())));
  
  // Add a buffer month on both ends
  const startDate = startOfMonth(addMonths(minDate, -1));
  const endDate = endOfMonth(addMonths(maxDate, 1));
  
  // Generate an array of months for the header
  const months = eachMonthOfInterval({
    start: startDate,
    end: endDate
  });

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">Project Timeline (Gantt View)</h2>
        <p className="text-sm text-muted-foreground">Monthly timeline of all projects</p>
      </div>
      
      <div className="p-4 overflow-x-auto">
        <div className="min-w-max">
          {/* Month Headers */}
          <div className="flex border-b">
            <div className="w-64 flex-shrink-0"></div>
            <div className="flex flex-1">
              {months.map((month, index) => (
                <div 
                  key={index} 
                  className="flex-1 min-w-[100px] p-2 text-center font-medium border-r"
                >
                  {format(month, 'MMM yyyy')}
                </div>
              ))}
            </div>
          </div>
          
          {/* Project Rows */}
          {projects.map(project => (
            <ProjectGanttRow 
              key={project.id} 
              project={project} 
              months={months} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface ProjectGanttRowProps {
  project: Project;
  months: Date[];
}

const ProjectGanttRow: React.FC<ProjectGanttRowProps> = ({ project, months }) => {
  const { getProjectAllocations, getTotalAllocationDays } = usePlanner();
  const allocations = getProjectAllocations(project.id);
  const totalAllocation = allocations.reduce((sum, alloc) => sum + alloc.days, 0);
  
  // Check if project is active in a given month
  const isActiveInMonth = (month: Date) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    
    return (
      (project.startDate <= monthEnd && project.endDate >= monthStart) 
    );
  };

  return (
    <div className="flex border-b hover:bg-gray-50">
      <div 
        className="w-64 flex-shrink-0 p-3 border-r"
        style={{ borderLeftColor: `var(--project-${project.color})`, borderLeftWidth: '4px' }}
      >
        <div className="font-medium">{project.name}</div>
        <div className="text-xs text-gray-500 mt-1">
          <span className="font-medium">{totalAllocation} days</span> allocated
        </div>
      </div>
      
      <div className="flex flex-1">
        {months.map((month, index) => (
          <div 
            key={index} 
            className={`flex-1 min-w-[100px] border-r ${isActiveInMonth(month) ? '' : ''}`}
          >
            {isActiveInMonth(month) && (
              <div
                className="h-full w-full p-2 flex items-center justify-center"
                style={{ backgroundColor: `rgba(var(--project-${project.color}-rgb), 0.2)` }}
              >
                <Badge 
                  variant="outline"
                  style={{ 
                    borderColor: `var(--project-${project.color})`,
                    color: `var(--project-${project.color})`
                  }}
                >
                  active
                </Badge>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectGanttView;
