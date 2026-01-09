import React, { useMemo, useState } from 'react';
import { usePlanner } from '@/contexts/PlannerContext';
import { Project } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { format } from 'date-fns';

interface ProjectMonthDetailsProps {
  project: Project;
  month: Date; // kept for drop-in compatibility (unused)
}

const ProjectMonthDetails: React.FC<ProjectMonthDetailsProps> = ({ project }) => {
  const { getProjectAllocations, getEmployeeById, sprints } = usePlanner();

  const [isOpen, setIsOpen] = useState(true);
  const [showEmpty, setShowEmpty] = useState(false);

  const allocations = useMemo(() => getProjectAllocations(project.id) || [], [getProjectAllocations, project.id]);

  // Get initials from name
  const getInitials = (name: string) =>
    name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase();

  // Only show sprints that have allocations for this project (unless showEmpty is true)
  const sprintRows = useMemo(() => {
    // Map sprintId -> allocations[]
    const bySprint = new Map<string, typeof allocations>();

    for (const alloc of allocations) {
      if (!alloc?.sprintId) continue;
      const existing = bySprint.get(alloc.sprintId) || [];
      existing.push(alloc);
      bySprint.set(alloc.sprintId, existing);
    }

    // Collect relevant sprints
    const relevantSprints = sprints
      .filter((sprint: any) => sprint && sprint.id)
      .filter((sprint: any) => showEmpty || bySprint.has(sprint.id))
      // chronological
      .sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .map((sprint: any) => ({
        sprint,
        allocations: (bySprint.get(sprint.id) || []).slice().sort((a: any, b: any) => {
          // keep stable-ish order (employee name) without "grouping"
          const ea = getEmployeeById(a.employeeId)?.name || '';
          const eb = getEmployeeById(b.employeeId)?.name || '';
          return ea.localeCompare(eb);
        }),
      }));

    return relevantSprints;
  }, [allocations, sprints, showEmpty, getEmployeeById]);

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 z-50 h-full w-[420px] max-w-[92vw] border-l bg-white shadow-xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b p-4">
        <div className="min-w-0">
          <div className="text-sm text-muted-foreground">Project allocations</div>
          <div className="font-semibold leading-tight truncate">{project.name}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {sprintRows.length} sprint{sprinRowsPlural(sprintRows.length)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-muted-foreground select-none">
            <input
              type="checkbox"
              checked={showEmpty}
              onChange={(e) => setShowEmpty(e.target.checked)}
              className="h-4 w-4"
            />
            Show empty
          </label>

          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="h-[calc(100%-64px)] overflow-y-auto p-4 space-y-4">
        {sprintRows.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No sprint allocations for this project.
          </div>
        ) : (
          sprintRows.map(({ sprint, allocations: sprintAllocations }) => (
            <div key={sprint.id} className="border rounded-md">
              {/* Sprint header */}
              <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{sprint.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(sprint.startDate), 'dd MMM')} – {format(new Date(sprint.endDate), 'dd MMM yyyy')}
                  </div>
                </div>

                <Badge variant="secondary" className="text-xs">
                  {sumDays(sprintAllocations)}d
                </Badge>
              </div>

              {/* Table */}
              {sprintAllocations.length > 0 ? (
                <div className="px-3 py-2">
                  <div className="grid grid-cols-[1fr_auto] gap-x-3 text-xs text-muted-foreground pb-2">
                    <div>Person</div>
                    <div className="text-right">Days</div>
                  </div>

                  <div className="space-y-2">
                    {sprintAllocations.map((alloc: any, i: number) => {
                      const employee = getEmployeeById(alloc.employeeId);
                      if (!employee) return null;

                      return (
                        <div key={`${alloc.employeeId}-${i}`} className="grid grid-cols-[1fr_auto] gap-x-3 items-center">
                          <div className="flex items-center min-w-0">
                            <Avatar className="h-6 w-6 mr-2">
                              {employee.imageUrl ? (
                                <AvatarImage src={employee.imageUrl} alt={employee.name} />
                              ) : (
                                <AvatarFallback className="text-[10px]">{getInitials(employee.name)}</AvatarFallback>
                              )}
                            </Avatar>
                            <div className="truncate text-sm">{employee.name}</div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-xs">
                              {alloc.days}d
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="px-3 py-3 text-xs text-muted-foreground">No allocations</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// helpers
function sumDays(allocs: any[]): number {
  return (allocs || []).reduce((sum, a) => sum + (Number(a?.days) || 0), 0);
}
function sprinRowsPlural(n: number) {
  return n === 1 ? '' : 's';
}

export default ProjectMonthDetails;
