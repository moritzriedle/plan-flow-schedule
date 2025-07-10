
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Project } from '../types';
import { usePlanner } from '../contexts/PlannerContext';
import MultiRoleSelector from './MultiRoleSelector';
import TicketReferenceInput from './TicketReferenceInput';
import { getSprintDateRange } from '../utils/sprintUtils';
import { ROLE_OPTIONS } from '@/constants/roles';

interface ProjectTimelineViewProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  selectedRoles: string[];
  onRoleChange: (roles: string[]) => void;
}

const ProjectTimelineView: React.FC<ProjectTimelineViewProps> = ({
  project,
  isOpen,
  onClose,
  selectedRoles,
  onRoleChange
}) => {
  const { employees = [], allocations = [], sprints = [] } = usePlanner();

  if (!project) return null;

  // Enhanced logging for debugging
  console.log('ProjectTimelineView: Render', { 
    project: project?.name,
    selectedRoles,
    selectedRolesType: typeof selectedRoles,
    selectedRolesIsArray: Array.isArray(selectedRoles),
    ROLE_OPTIONS,
    ROLE_OPTIONS_type: typeof ROLE_OPTIONS,
    ROLE_OPTIONS_isArray: Array.isArray(ROLE_OPTIONS)
  });

  // Ensure ROLE_OPTIONS is always an array with safety check
  const availableRoles = React.useMemo(() => {
    if (!Array.isArray(ROLE_OPTIONS)) {
      console.warn('ProjectTimelineView: ROLE_OPTIONS is not an array', { ROLE_OPTIONS, type: typeof ROLE_OPTIONS });
      return [];
    }
    return [...ROLE_OPTIONS];
  }, []);

  // Ensure selectedRoles is always an array
  const safeSelectedRoles = React.useMemo(() => {
    if (!Array.isArray(selectedRoles)) {
      console.warn('ProjectTimelineView: selectedRoles is not an array', { selectedRoles, type: typeof selectedRoles });
      return [];
    }
    return selectedRoles;
  }, [selectedRoles]);

  // Filter employees by selected roles with comprehensive safety checks
  const safeEmployees = React.useMemo(() => {
    if (!Array.isArray(employees)) {
      console.warn('ProjectTimelineView: employees is not an array', { employees, type: typeof employees });
      return [];
    }
    return employees;
  }, [employees]);

  const filteredEmployees = React.useMemo(() => {
    try {
      if (safeSelectedRoles.length === 0) {
        console.log('ProjectTimelineView: No role filter, returning all employees');
        return safeEmployees;
      }
      
      const filtered = safeEmployees.filter(emp => {
        if (!emp || !emp.role) {
          console.warn('ProjectTimelineView: Employee missing role', { emp });
          return false;
        }
        return safeSelectedRoles.includes(emp.role);
      });
      
      console.log('ProjectTimelineView: Filtered employees', { 
        originalCount: safeEmployees.length, 
        filteredCount: filtered.length 
      });
      
      return filtered;
    } catch (error) {
      console.error('ProjectTimelineView: Error filtering employees', error);
      return safeEmployees;
    }
  }, [safeEmployees, safeSelectedRoles]);

  const handleRoleChange = (roles: string[]) => {
    console.log('ProjectTimelineView: handleRoleChange called', { roles });
    try {
      const safeRoles = Array.isArray(roles) ? roles : [];
      onRoleChange(safeRoles);
    } catch (error) {
      console.error('ProjectTimelineView: Error in handleRoleChange', error);
      onRoleChange([]);
    }
  };

  // Get project allocations with safety checks
  const safeAllocations = Array.isArray(allocations) ? allocations : [];
  const projectAllocations = safeAllocations.filter(alloc => alloc && alloc.projectId === project.id);
  
  // Get unique sprints for this project
  const projectSprintIds = Array.from(new Set(projectAllocations.map(alloc => alloc.sprintId)));
  const safeSprints = Array.isArray(sprints) ? sprints : [];
  const projectSprints = safeSprints.filter(sprint => sprint && projectSprintIds.includes(sprint.id)).sort((a, b) => 
    a.startDate.getTime() - b.startDate.getTime()
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-4">
            <span>{project.name} - Timeline View</span>
            {project.ticketReference && (
              <div className="text-sm">
                <TicketReferenceInput
                  value={project.ticketReference}
                  onChange={() => {}} // Read-only in this view
                />
              </div>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Role Filter */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Filter by Role:</label>
            <MultiRoleSelector
              roles={availableRoles}
              selectedRoles={safeSelectedRoles}
              onRoleChange={handleRoleChange}
              placeholder="All Roles"
            />
          </div>

          <div className="overflow-auto max-h-[70vh]">
            <div className="min-w-max">
              {/* Sprint Headers */}
              <div className="flex border-b-2 border-gray-200 bg-gray-50">
                <div className="w-48 p-3 font-semibold border-r">Team Member</div>
                {projectSprints.map((sprint) => (
                  <div key={sprint.id} className="w-32 p-2 text-center text-sm font-medium border-r">
                    <div className="font-semibold">{sprint.name}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {getSprintDateRange(sprint)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Employee Rows */}
              {filteredEmployees.map((employee) => {
                const employeeAllocations = projectAllocations.filter(alloc => alloc.employeeId === employee.id);
                
                if (employeeAllocations.length === 0) return null;

                return (
                  <div key={employee.id} className="flex border-b hover:bg-gray-50">
                    <div className="w-48 p-3 border-r">
                      <div className="font-medium">{employee.name}</div>
                      <div className="text-sm text-gray-500">{employee.role}</div>
                    </div>
                    {projectSprints.map((sprint) => {
                      const allocation = employeeAllocations.find(alloc => alloc.sprintId === sprint.id);
                      return (
                        <div key={sprint.id} className="w-32 p-2 text-center border-r">
                          {allocation ? (
                            <div className="text-sm font-medium text-blue-600">
                              {allocation.days}d
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400">-</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectTimelineView;
