
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
  selectedRoles?: string[];
  onRoleChange: (roles: string[]) => void;
}

const ProjectTimelineView: React.FC<ProjectTimelineViewProps> = ({
  project,
  isOpen,
  onClose,
  selectedRoles = [],
  onRoleChange
}) => {
  const { employees = [], allocations = [], sprints = [] } = usePlanner();

  if (!project) return null;

  // Ensure ROLE_OPTIONS is always a valid array
  const availableRoles = React.useMemo(() => {
    if (!ROLE_OPTIONS || !Array.isArray(ROLE_OPTIONS)) {
      console.warn('ProjectTimelineView: ROLE_OPTIONS is not a valid array', { ROLE_OPTIONS });
      return [];
    }
    return [...ROLE_OPTIONS].filter(role => role && typeof role === 'string');
  }, []);

  // Ensure selectedRoles is always a valid array
  const safeSelectedRoles = React.useMemo(() => {
    if (!selectedRoles || !Array.isArray(selectedRoles)) {
      console.warn('ProjectTimelineView: selectedRoles is not a valid array', { selectedRoles });
      return [];
    }
    return selectedRoles.filter(role => role && typeof role === 'string');
  }, [selectedRoles]);

  // Ensure employees is always a valid array
  const safeEmployees = React.useMemo(() => {
    if (!employees || !Array.isArray(employees)) {
      console.warn('ProjectTimelineView: employees is not a valid array', { employees });
      return [];
    }
    return employees.filter(emp => emp && emp.id);
  }, [employees]);

  const filteredEmployees = React.useMemo(() => {
    try {
      if (safeSelectedRoles.length === 0) {
        return safeEmployees;
      }
      
      const filtered = safeEmployees.filter(emp => {
        if (!emp || !emp.role) {
          console.warn('ProjectTimelineView: Employee missing role', { emp });
          return false;
        }
        return safeSelectedRoles.includes(emp.role);
      });
      
      return filtered;
    } catch (error) {
      console.error('ProjectTimelineView: Error filtering employees', error);
      return safeEmployees;
    }
  }, [safeEmployees, safeSelectedRoles]);

  const handleRoleChange = (roles: string[]) => {
    try {
      const safeRoles = Array.isArray(roles) ? roles.filter(role => role && typeof role === 'string') : [];
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
  const sprintIdSet = new Set((projectAllocations || []).map(alloc => alloc?.sprintId).filter(id => id));
  console.log('ProjectTimelineView: About to call Array.from with sprintIdSet:', sprintIdSet);
  const projectSprintIds = Array.isArray(sprintIdSet) ? Array.from(sprintIdSet) : (sprintIdSet ? Array.from(sprintIdSet) : []);
  const safeSprints = Array.isArray(sprints) ? sprints : [];
  
  if (!Array.isArray(safeSprints)) {
    console.warn('ProjectTimelineView: safeSprints is not an array', safeSprints);
  }
  
  const projectSprints = (safeSprints || []).filter(sprint => sprint && projectSprintIds.includes(sprint.id)).sort((a, b) => 
    a?.startDate?.getTime() - b?.startDate?.getTime()
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
              {!Array.isArray(filteredEmployees) ? (
                console.warn('ProjectTimelineView: filteredEmployees is not an array', filteredEmployees),
                <div>No employees data available</div>
              ) : (filteredEmployees || []).map((employee) => {
                const employeeAllocations = (projectAllocations || []).filter(alloc => alloc?.employeeId === employee?.id);
                
                if (employeeAllocations.length === 0) return null;

                return (
                  <div key={employee.id} className="flex border-b hover:bg-gray-50">
                    <div className="w-48 p-3 border-r">
                      <div className="font-medium">{employee.name}</div>
                      <div className="text-sm text-gray-500">{employee.role}</div>
                    </div>
                    {(projectSprints || []).map((sprint) => {
                      const allocation = (employeeAllocations || []).find(alloc => alloc?.sprintId === sprint?.id);
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
