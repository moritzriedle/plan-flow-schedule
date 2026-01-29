import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Project } from '../types';
import MultiRoleSelector from './MultiRoleSelector';
import { usePlanner } from '../contexts/PlannerContext';
import TicketReferenceInput from './TicketReferenceInput';
import { getSprintDateRange } from '../utils/sprintUtils';
import { ROLE_OPTIONS } from '@/constants/roles';
import { Badge } from '@/components/ui/badge';

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
  onRoleChange,
}) => {
  const { employees = [], allocations = [], sprints = [] } = usePlanner();

  if (!project) return null;

  const availableRoles = React.useMemo(() => {
    return Array.isArray(ROLE_OPTIONS)
      ? ROLE_OPTIONS.filter((r) => r && typeof r === 'string')
      : [];
  }, []);

  const safeSelectedRoles = React.useMemo(() => {
    return Array.isArray(selectedRoles)
      ? selectedRoles.filter((r) => r && typeof r === 'string')
      : [];
  }, [selectedRoles]);

  const safeEmployees = React.useMemo(() => {
    return Array.isArray(employees) ? employees.filter((e) => e && e.id) : [];
  }, [employees]);

  const filteredEmployees = React.useMemo(() => {
    if (safeSelectedRoles.length === 0) return safeEmployees;
    return safeEmployees.filter((emp) => emp?.role && safeSelectedRoles.includes(emp.role));
  }, [safeEmployees, safeSelectedRoles]);

  const handleRoleChange = (roles: string[]) => {
    const safeRoles = Array.isArray(roles) ? roles.filter((r) => r && typeof r === 'string') : [];
    onRoleChange(safeRoles);
  };

  // Allocations for this project
  const safeAllocations = Array.isArray(allocations) ? allocations : [];
  const projectAllocations = safeAllocations.filter((a) => a && a.projectId === project.id);

  // Project sprints (unique, sorted)
  const safeSprints = Array.isArray(sprints) ? sprints : [];
  const sprintIdSet = new Set(projectAllocations.map((a) => a?.sprintId).filter(Boolean) as string[]);
  const projectSprintIds = Array.from(sprintIdSet);

  const projectSprints = safeSprints
    .filter((s) => s && projectSprintIds.includes(s.id))
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  // Header metadata
  const leadName = React.useMemo(() => {
    const leadId = (project as any)?.leadId; // depends on your Project type
    if (!leadId) return null;
    const lead = safeEmployees.find((e) => e.id === leadId);
    return lead?.name ?? null;
  }, [project, safeEmployees]);

  const formatDate = (d?: Date | null) => {
    if (!d || !(d instanceof Date) || Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const startDateText = formatDate((project as any)?.startDate ?? null);
  const endDateText = formatDate((project as any)?.endDate ?? null);

  const sprintCount = projectSprints.length;
  const fromSprintName = projectSprints[0]?.name;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="space-y-2">
            {/* Title row */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-semibold truncate">{project.name}</div>

                {/* Subtitle / meta line */}
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  {leadName && (
                    <span>
                      Lead: <span className="text-foreground">{leadName}</span>
                    </span>
                  )}

                  {(startDateText || endDateText) && (
                    <span>
                      • {startDateText ?? 'No start'} → {endDateText ?? 'No end'}
                    </span>
                  )}

                  {sprintCount > 0 && fromSprintName && (
                    <span>
                      • Showing {sprintCount} sprints from{' '}
                      <span className="text-foreground">{fromSprintName}</span>
                    </span>
                  )}
                </div>

                {/* Optional: show active role filter state as badges */}
                {safeSelectedRoles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {safeSelectedRoles.map((r) => (
                      <Badge key={r} variant="secondary" className="text-xs">
                        {r}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Ticket ref on the right (read-only) */}
              {project.ticketReference && (
                <div className="shrink-0">
                  <TicketReferenceInput value={project.ticketReference} onChange={() => {}} />
                </div>
              )}
            </div>
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
                    <div className="text-xs text-gray-600 mt-1">{getSprintDateRange(sprint)}</div>
                  </div>
                ))}
              </div>

              {/* Employee Rows */}
              {filteredEmployees.map((employee) => {
                const employeeAllocations = projectAllocations.filter(
                  (a) => a?.employeeId === employee?.id
                );

                if (employeeAllocations.length === 0) return null;

                return (
                  <div key={employee.id} className="flex border-b hover:bg-gray-50">
                    <div className="w-48 p-3 border-r">
                      <div className="font-medium">{employee.name}</div>
                      <div className="text-sm text-gray-500">{employee.role}</div>
                    </div>

                    {projectSprints.map((sprint) => {
                      const allocation = employeeAllocations.find((a) => a?.sprintId === sprint?.id);
                      return (
                        <div key={sprint.id} className="w-32 p-2 text-center border-r">
                          {allocation ? (
                            <div className="text-sm font-medium text-blue-600">{allocation.days}d</div>
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
