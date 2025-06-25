
import React, { useState } from 'react';
import { usePlanner } from '@/contexts/PlannerContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, addMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Project } from '@/types';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Edit } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProjectEditDialog from './ProjectEditDialog';
import ProjectMonthDetails from './ProjectMonthDetails';

const ProjectGanttView = () => {
  const { projects, employees, getProjectAllocations } = usePlanner();
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [expandedMonth, setExpandedMonth] = useState<Date | null>(startOfMonth(new Date())); // Default to current month
  
  // Handle case where projects array is empty
  if (!projects.length) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Project Timeline (Gantt View)</h2>
          <p className="text-sm text-muted-foreground">Monthly timeline of all projects</p>
        </div>
        <div className="p-8 text-center text-gray-500">
          <p>No projects available</p>
        </div>
      </div>
    );
  }
  
  // Get unique roles from employees
  const uniqueRoles = Array.from(new Set(employees.map(emp => emp.role)));
  
  // Filter projects based on selected role
  const filteredProjects = selectedRole === 'all' 
    ? projects 
    : projects.filter(project => {
        const allocations = getProjectAllocations(project.id);
        return allocations.some(alloc => {
          const employee = employees.find(emp => emp.id === alloc.employeeId);
          return employee && employee.role === selectedRole;
        });
      });
  
  // Find overall min and max dates for filtered projects
  const minDate = filteredProjects.length > 0 
    ? new Date(Math.min(...filteredProjects.map(p => p.startDate.getTime())))
    : new Date();
  const maxDate = filteredProjects.length > 0
    ? new Date(Math.max(...filteredProjects.map(p => p.endDate.getTime())))
    : new Date();
  
  // Add a buffer month on both ends
  const startDate = startOfMonth(addMonths(minDate, -1));
  const endDate = endOfMonth(addMonths(maxDate, 1));
  
  // Generate an array of months for the header
  const months = eachMonthOfInterval({
    start: startDate,
    end: endDate
  });

  const toggleExpandMonth = (month: Date) => {
    if (expandedMonth && expandedMonth.getTime() === month.getTime()) {
      setExpandedMonth(null);
    } else {
      setExpandedMonth(month);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">Project Timeline (Gantt View)</h2>
            <p className="text-sm text-muted-foreground">Monthly timeline of all projects</p>
          </div>
          
          {/* Role Filter */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Filter by Role:</label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {uniqueRoles.map(role => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
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
          {filteredProjects.map(project => (
            <ProjectGanttRow 
              key={project.id} 
              project={project} 
              months={months}
              expandedMonth={expandedMonth}
              onToggleExpand={toggleExpandMonth}
            />
          ))}
          
          {/* Expanded month details - show for all projects */}
          {expandedMonth && (
            <div className="bg-gray-50 p-4 border-b">
              {filteredProjects.map(project => {
                const allocations = getProjectAllocations(project.id);
                const monthAllocations = allocations.filter(alloc => {
                  // Check if allocation falls within the expanded month
                  const monthStart = startOfMonth(expandedMonth);
                  const monthEnd = endOfMonth(expandedMonth);
                  // This is a simplified check - in reality you'd need to map weekId to actual dates
                  return true; // For now, show all allocations
                });
                
                if (monthAllocations.length === 0) return null;
                
                return (
                  <div key={project.id} className="mb-6">
                    <ProjectMonthDetails project={project} month={expandedMonth} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ProjectGanttRowProps {
  project: Project;
  months: Date[];
  expandedMonth: Date | null;
  onToggleExpand: (month: Date) => void;
}

const ProjectGanttRow: React.FC<ProjectGanttRowProps> = ({ 
  project, 
  months, 
  expandedMonth, 
  onToggleExpand 
}) => {
  const { getProjectAllocations, getEmployeeById } = usePlanner();
  const allocations = getProjectAllocations(project.id);
  const totalAllocation = allocations.reduce((sum, alloc) => sum + alloc.days, 0);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Check if project is active in a given month
  const isActiveInMonth = (month: Date) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    
    return (
      (project.startDate <= monthEnd && project.endDate >= monthStart) 
    );
  };

  // Get project lead name
  const projectLead = project.leadId ? getEmployeeById(project.leadId) : null;

  return (
    <>
      <div className="flex border-b hover:bg-gray-50">
        <div 
          className="w-64 flex-shrink-0 p-3 border-r"
          style={{ borderLeftColor: `var(--project-${project.color})`, borderLeftWidth: '4px' }}
        >
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium">{project.name}</div>
              <div className="text-xs text-gray-500 mt-1">
                <span className="font-medium">{totalAllocation} days</span> allocated
                {projectLead && (
                  <div className="mt-1">Lead: {projectLead.name}</div>
                )}
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit project</span>
            </Button>
          </div>
        </div>
        
        <div className="flex flex-1">
          {months.map((month, index) => {
            const isActive = isActiveInMonth(month);
            const isExpanded = expandedMonth && expandedMonth.getTime() === month.getTime();
            
            return (
              <div 
                key={index} 
                className={`flex-1 min-w-[100px] border-r relative ${isActive ? 'cursor-pointer' : ''}`}
              >
                {isActive && (
                  <div
                    className="h-full w-full p-2 flex items-center justify-center"
                    style={{ backgroundColor: `rgba(var(--project-${project.color}-rgb), 0.2)` }}
                    onClick={() => isActive && onToggleExpand(month)}
                  >
                    <div className="flex flex-col items-center">
                      <Badge 
                        variant="outline"
                        style={{ 
                          borderColor: `var(--project-${project.color})`,
                          color: `var(--project-${project.color})`
                        }}
                      >
                        active
                      </Badge>
                      
                      {isActive && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0 mt-1"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Project edit dialog */}
      <ProjectEditDialog 
        project={project} 
        isOpen={isEditDialogOpen} 
        onClose={() => setIsEditDialogOpen(false)} 
      />
    </>
  );
};

export default ProjectGanttView;
