import React, { useState, useEffect, useMemo } from 'react';
import { Project, Sprint, Allocation, Employee } from '../../types';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { HandHelping } from 'lucide-react';
import SupportRoleSelector from './SupportRoleSelector';
import EditableAllocationBadge from './EditableAllocationBadge';
import AddAllocationPopover from './AddAllocationPopover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProjectAlignmentCardProps {
  project: Project;
  sprints: Sprint[];
  allocations: Allocation[];
  employees: Employee[];
  overallocatedEmployees: Map<string, { employee: Employee; sprintId: string; totalDays: number }[]>;
  highlightSprintId?: string | null;
  canEdit: boolean;
  onUpdateAllocation: (allocation: Allocation) => Promise<boolean>;
  onDeleteAllocation: (id: string) => Promise<boolean>;
  onCreateAllocation: (params: { employeeId: string; projectId: string; sprintId: string; days: number }) => Promise<any>;
  filteredEmployeeIds?: string[];
}

interface SprintAllocation {
  employee: Employee;
  days: number;
  allocationId: string;
  isOverallocated: boolean;
  changeType?: 'new' | 'leaving' | 'increased' | 'decreased';
}

const ProjectAlignmentCard: React.FC<ProjectAlignmentCardProps> = ({
  project,
  sprints,
  allocations,
  employees,
  overallocatedEmployees,
  highlightSprintId,
  canEdit,
  onUpdateAllocation,
  onDeleteAllocation,
  onCreateAllocation,
  filteredEmployeeIds,
}) => {
  const [supportNeeded, setSupportNeeded] = useState(false);
  const [neededRoles, setNeededRoles] = useState<string[]>([]);
  const [isLoadingSupport, setIsLoadingSupport] = useState(true);

  useEffect(() => {
    const loadSupportRequest = async () => {
      const { data, error } = await supabase
        .from('project_support_requests')
        .select('*')
        .eq('project_id', project.id)
        .maybeSingle();

      if (!error && data) {
        setSupportNeeded(data.support_needed);
        setNeededRoles(data.needed_roles || []);
      }
      setIsLoadingSupport(false);
    };

    loadSupportRequest();
  }, [project.id]);

  const handleSupportChange = async (enabled: boolean) => {
    setSupportNeeded(enabled);
    await supabase
      .from('project_support_requests')
      .upsert(
        { project_id: project.id, support_needed: enabled, needed_roles: neededRoles },
        { onConflict: 'project_id' }
      );
  };

  const handleRolesChange = async (roles: string[]) => {
    setNeededRoles(roles);
    await supabase
      .from('project_support_requests')
      .upsert(
        { project_id: project.id, support_needed: supportNeeded, needed_roles: roles },
        { onConflict: 'project_id' }
      );
  };

  const sprintAllocations = useMemo(() => {
    const result: Map<string, SprintAllocation[]> = new Map();

    sprints.forEach((sprint, sprintIndex) => {
      const projectAllocations = allocations.filter(
        (a) => a.projectId === project.id && a.sprintId === sprint.id
      );

      const previousSprint = sprintIndex > 0 ? sprints[sprintIndex - 1] : null;
      const previousAllocations = previousSprint
        ? allocations.filter((a) => a.projectId === project.id && a.sprintId === previousSprint.id)
        : [];

      const sprintData: SprintAllocation[] = projectAllocations
        .map((allocation) => {
          const employee = employees.find((e) => e.id === allocation.employeeId);
          if (!employee) return null;

          // Apply employee filter
          if (filteredEmployeeIds && filteredEmployeeIds.length > 0 && !filteredEmployeeIds.includes(employee.id)) {
            return null;
          }

          const isOverallocated =
            overallocatedEmployees.get(employee.id)?.some((o) => o.sprintId === sprint.id) || false;

          let changeType: SprintAllocation['changeType'];
          const previousAllocation = previousAllocations.find(
            (a) => a.employeeId === allocation.employeeId
          );

          if (!previousAllocation) {
            changeType = 'new';
          } else if (allocation.days > previousAllocation.days) {
            changeType = 'increased';
          } else if (allocation.days < previousAllocation.days) {
            changeType = 'decreased';
          }

          return {
            employee,
            days: allocation.days,
            allocationId: allocation.id,
            isOverallocated,
            changeType,
          } as SprintAllocation;
        })
        .filter((a): a is SprintAllocation => a !== null);

      // Check for employees leaving
      if (previousSprint) {
        const currentEmployeeIds = new Set(projectAllocations.map((a) => a.employeeId));
        previousAllocations.forEach((prevAlloc) => {
          if (!currentEmployeeIds.has(prevAlloc.employeeId)) {
            const employee = employees.find((e) => e.id === prevAlloc.employeeId);
            if (employee) {
              if (filteredEmployeeIds && filteredEmployeeIds.length > 0 && !filteredEmployeeIds.includes(employee.id)) {
                return;
              }
              sprintData.push({
                employee,
                days: 0,
                allocationId: '',
                isOverallocated: false,
                changeType: 'leaving',
              });
            }
          }
        });
      }

      result.set(sprint.id, sprintData);
    });

    return result;
  }, [sprints, allocations, project.id, employees, overallocatedEmployees, filteredEmployeeIds]);

  // Helper to get total days for an employee in a sprint (across all projects)
  const getEmployeeTotalDaysInSprint = (employeeId: string, sprintId: string) => {
    return allocations
      .filter((a) => a.employeeId === employeeId && a.sprintId === sprintId)
      .reduce((sum, a) => sum + a.days, 0);
  };

  const handleSaveAllocation = async (allocationId: string, newDays: number) => {
    const existing = allocations.find((a) => a.id === allocationId);
    if (!existing) return false;
    const ok = await onUpdateAllocation({ ...existing, days: newDays });
    if (ok) toast.success('Allocation updated');
    return ok;
  };

  const handleDeleteAllocation = async (allocationId: string) => {
    const ok = await onDeleteAllocation(allocationId);
    if (ok) toast.success('Allocation removed');
    return ok;
  };

  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-500',
      purple: 'bg-purple-500',
      pink: 'bg-pink-500',
      orange: 'bg-orange-500',
      green: 'bg-green-500',
    };
    return colorMap[color] || 'bg-gray-500';
  };

  return (
    <Card className={`overflow-hidden ${supportNeeded ? 'ring-2 ring-amber-400' : ''}`}>
      <div className="grid grid-cols-[300px_1fr] gap-4">
        {/* Project Info */}
        <div className="p-4 border-r bg-muted/20">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-3 h-3 rounded-full ${getColorClass(project.color)}`} />
            <h3 className="font-semibold truncate">{project.name}</h3>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Switch
                id={`support-${project.id}`}
                checked={supportNeeded}
                onCheckedChange={handleSupportChange}
                disabled={isLoadingSupport}
              />
              <Label htmlFor={`support-${project.id}`} className="text-sm flex items-center gap-1">
                <HandHelping className="w-4 h-4" />
                Support needed
              </Label>
            </div>

            {supportNeeded && (
              <SupportRoleSelector selectedRoles={neededRoles} onRolesChange={handleRolesChange} />
            )}
          </div>
        </div>

        {/* Sprint Allocations */}
        <CardContent className="p-4">
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${sprints.length}, 1fr)` }}
          >
            {sprints.map((sprint) => {
              const sprintData = sprintAllocations.get(sprint.id) || [];
              const totalDays = sprintData.reduce((sum, a) => sum + a.days, 0);
              const isHighlighted = highlightSprintId && sprint.id === highlightSprintId;

              return (
                <div
                  key={sprint.id}
                  className={[
                    'space-y-2 rounded-md p-2 -m-2',
                    isHighlighted ? 'bg-primary/5 ring-2 ring-primary/30' : '',
                  ].join(' ')}
                >
                  <div className="text-sm text-muted-foreground mb-2">{totalDays} days total</div>

                  <div className="flex flex-wrap gap-1.5">
                    {sprintData.length === 0 ? (
                      <span className="text-sm text-muted-foreground italic">No allocations</span>
                    ) : (
                      sprintData.map(({ employee, days, allocationId, isOverallocated, changeType }) => (
                        <EditableAllocationBadge
                          key={`${employee.id}-${allocationId}`}
                          employee={employee}
                          days={days}
                          allocationId={allocationId}
                          isOverallocated={isOverallocated}
                          changeType={changeType}
                          totalEmployeeDaysInSprint={getEmployeeTotalDaysInSprint(employee.id, sprint.id)}
                          onSave={handleSaveAllocation}
                          onDelete={handleDeleteAllocation}
                          canEdit={canEdit && changeType !== 'leaving'}
                        />
                      ))
                    )}
                    {canEdit && (
                      <AddAllocationPopover
                        project={project}
                        sprint={sprint}
                        employees={employees}
                        allocations={allocations}
                        onAdd={onCreateAllocation}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default ProjectAlignmentCard;
