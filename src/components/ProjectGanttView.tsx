
import React, { useState } from 'react';
import { usePlanner } from '@/contexts/PlannerContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, addMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Project } from '@/types';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Edit } from 'lucide-react';
import ProjectEditDialog from './ProjectEditDialog';
import ProjectMonthDetails from './ProjectMonthDetails';
import MultiRoleSelector from './MultiRoleSelector';

// ✅ Helper to generate Jira ticket URL
const generateLink = (ticketRef: string) => {
  if (!ticketRef.trim()) return null;
  const projectKey = ticketRef.split('-')[0];
  return `https://proglove.atlassian.net/jira/polaris/projects/${projectKey}/ideas/view/3252935?selectedIssue=${ticketRef.trim()}`;
};

const ProjectGanttView = () => {
  const { projects, employees, getProjectAllocations } = usePlanner();
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  
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
  
  // Ensure arrays are safe with comprehensive checks
  const safeEmployees = React.useMemo(() => {
    if (!employees || !Array.isArray(employees)) {
      console.warn('ProjectGanttView: employees is not a valid array', { employees });
      return [];
    }
    return employees.filter(emp => emp && emp.role && typeof emp.role === 'string');
  }, [employees]);

  const safeSelectedRoles = React.useMemo(() => {
    if (!selectedRoles || !Array.isArray(selectedRoles)) {
      console.warn('ProjectGanttView: selectedRoles is not a valid array', { selectedRoles });
      return [];
    }
    return selectedRoles.filter(role => role && typeof role === 'string');
  }, [selectedRoles]);

  // Get unique roles from employees
  const uniqueRoles = React.useMemo(() => {
  try {
    const validRoles = Array.isArray(safeEmployees)
      ? safeEmployees.map(emp => emp?.role).filter(role => typeof role === 'string')
      : [];

    const roleSet = new Set(validRoles);

    // Final check to ensure Set is iterable (paranoia)
    if (roleSet && typeof roleSet[Symbol.iterator] === 'function') {
      return Array.from(roleSet).sort();
    } else {
      console.warn('ProjectGanttView: roleSet is not iterable', roleSet);
      return [];
    }
  } catch (error) {
    console.error('ProjectGanttView: Error computing uniqueRoles', error);
    return [];
  }
}, [safeEmployees]);

  
  // Filter projects based on selected roles
  const filteredProjects = React.useMemo(() => {
    if (!Array.isArray(projects)) {
      console.warn('ProjectGanttView: projects is not an array', projects);
      return [];
    }
    
    console.log('ProjectGanttView: About to filter projects with safeSelectedRoles:', safeSelectedRoles);
    if (!Array.isArray(safeSelectedRoles) || safeSelectedRoles.length === 0) {
      return Array.isArray(projects) ? projects : []; // Show all projects when no roles selected
    }
    
    return (Array.isArray(projects) ? projects : []).filter(project => {
      const allocations = getProjectAllocations(project?.id) || [];
      return (Array.isArray(allocations) ? allocations : []).some(alloc => {
        const employee = (Array.isArray(safeEmployees) ? safeEmployees : []).find(emp => emp?.id === alloc?.employeeId);
        return employee && Array.isArray(safeSelectedRoles) && safeSelectedRoles.includes(employee.role);
      });
    });
  }, [projects, safeSelectedRoles, getProjectAllocations, safeEmployees]);
  
  // Rolling 12-month view: current month to 11 months forward
  const currentDate = new Date();
  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(addMonths(currentDate, 11));
  
  // Generate an array of months for the header
  const months = eachMonthOfInterval({
    start: startDate,
    end: endDate
  });

  const toggleExpandProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
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
            <MultiRoleSelector
              roles={uniqueRoles}
              selectedRoles={safeSelectedRoles}
              onRoleChange={setSelectedRoles}
              placeholder="All Roles"
            />
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
          {!Array.isArray(filteredProjects) ? (
            console.warn('ProjectGanttView: filteredProjects is not an array', filteredProjects),
            <div>No projects data available</div>
          ) : (filteredProjects || []).map(project => (
       <div key={project.id}>
              <ProjectGanttRow 
                project={project} 
                months={months}
                isExpanded={expandedProjects.has(project.id)}
                onToggleExpand={() => toggleExpandProject(project.id)}
              />
              
              {/* Expanded project details */}
              {expandedProjects.has(project.id) && (
                <div className="bg-gray-50 border-b">
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {months.map(month => {
                        const allocations = getProjectAllocations(project.id);
                        // Check if project has allocations in this month
                        const hasAllocationsInMonth = allocations.some(alloc => {
                          // This is a simplified check - ideally you'd map weekId to actual dates
                          return true; // For now, show all months where project is active
                        });
                        
                        if (!hasAllocationsInMonth) return null;
                        
                        return (
                          <div key={month.getTime()}>
                            <ProjectMonthDetails project={project} month={month} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface ProjectGanttRowProps {
  project: Project;
  months: Date[];
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const ProjectGanttRow: React.FC<ProjectGanttRowProps> = ({ 
  project, 
  months, 
  isExpanded,
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
                {project.ticketReference && (
                  <div className="mt-1">
                    <a
                      href={generateLink(project.ticketReference)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {project.ticketReference}
                    </a>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0" 
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit project</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={onToggleExpand}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle details</span>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex flex-1">
          {months.map((month, index) => {
            const isActive = isActiveInMonth(month);
            
            return (
              <div 
                key={index} 
                className="flex-1 min-w-[100px] border-r relative"
              >
                {isActive && (
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
