import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Project } from '../types';
import { usePlanner } from '../contexts/PlannerContext';
import MultiRoleSelector from './MultiRoleSelector';
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
  const { employees = [], allocations, sprints } = usePlanner();

  if (!project) return null;

  // Convert ROLE_OPTIONS from readonly to mutable array
  const availableRoles = [...ROLE_OPTIONS];

  // Filter employees by selected roles
  const filteredEmployees = Array.isArray(employees) && employees.length > 0
    ? (selectedRoles.length === 0 
        ? employees 
        : employees.filter(emp => emp && emp.role && selectedRoles.includes(emp.role)))
    : [];

  // Get project allocations
  const projectAllocations = allocations.filter(alloc => alloc.projectId === project.id);
  
  // Get unique sprints for this project
  const projectSprintIds = Array.from(new Set(projectAllocations.map(alloc => alloc.sprintId)));
  const projectSprints = sprints.filter(sprint => projectSprintIds.includes(sprint.id)).sort((a, b) => 
    a.startDate.getTime() - b.startDate.getTime()
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{project.name} - Timeline View</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Role Filter */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Filter by Role:</label>
            <MultiRoleSelector
              roles={availableRoles}
              selectedRoles={selectedRoles}
              onRoleChange={onRoleChange}
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
