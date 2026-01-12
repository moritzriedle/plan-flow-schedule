import React, { useMemo, useState } from 'react';
import { usePlanner } from '@/contexts/PlannerContext';
import { Project } from '@/types';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { format, isWithinInterval } from 'date-fns';

interface ProjectMonthDetailsProps {
  project: Project;
  month: Date; // kept for compatibility; not used
}

type SprintLike = {
  id: string;
  name: string;
  startDate: Date | string;
  endDate: Date | string;
};

const toDate = (d: Date | string) => (d instanceof Date ? d : new Date(d));

const shortSprintLabel = (name: string) => {
  // "Sprint 31" -> "S31", "S-31" -> "S31", fallback to trimmed
  const m = name.match(/(\d+)/);
  return m ? `S${m[1]}` : name.replace(/\s+/g, '').slice(0, 4);
};

const ProjectMonthDetails: React.FC<ProjectMonthDetailsProps> = ({ project }) => {
  const { getProjectAllocations, getEmployeeById, sprints } = usePlanner();

  const [isOpen, setIsOpen] = useState(true);

  const today = new Date();
  const allocations = useMemo(() => getProjectAllocations(project.id) || [], [getProjectAllocations, project.id]);

  const sortedSprints = useMemo(() => {
    return (sprints || [])
      .filter((s: any) => s?.id && s?.startDate && s?.endDate)
      .slice()
      .sort((a: any, b: any) => toDate(a.startDate).getTime() - toDate(b.startDate).getTime());
  }, [sprints]);

  const currentSprintIndex = useMemo(() => {
    if (!sortedSprints.length) return -1;

    const idx = sortedSprints.findIndex((s: SprintLike) =>
      isWithinInterval(today, { start: toDate(s.startDate), end: toDate(s.endDate) })
    );

    if (idx === -1) {
      const upcoming = sortedSprints.findIndex((s: SprintLike) => toDate(s.endDate).getTime() >= today.getTime());
      return upcoming;
    }

    return idx;
  }, [sortedSprints, today]);

  const windowSprints = useMemo(() => {
    if (currentSprintIndex < 0) return [];
    return sortedSprints.slice(currentSprintIndex, currentSprintIndex + 10);
  }, [sortedSprints, currentSprintIndex]);

  const sprintIdSet = useMemo(() => new Set(windowSprints.map((s) => s.id)), [windowSprints]);

  const matrix = useMemo(() => {
    const byEmployee = new Map<string, Map<string, number>>();

    for (const alloc of allocations) {
      const sprintId = alloc?.sprintId;
      const employeeId = alloc?.employeeId;
      const days = Number(alloc?.days) || 0;

      if (!sprintId || !employeeId) continue;
      if (!sprintIdSet.has(sprintId)) continue;

      if (!byEmployee.has(employeeId)) byEmployee.set(employeeId, new Map());
      const row = byEmployee.get(employeeId)!;
      row.set(sprintId, (row.get(sprintId) || 0) + days);
    }

    const rows = Array.from(byEmployee.entries())
      .map(([employeeId, sprintMap]) => {
        const employee = getEmployeeById(employeeId);
        const name = employee?.name || 'Unknown';
        const total = Array.from(sprintMap.values()).reduce((a, b) => a + b, 0);
        return { employeeId, name, total, sprintMap };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    const colTotals = new Map<string, number>();
    for (const s of windowSprints) colTotals.set(s.id, 0);
    for (const r of rows) {
      for (const s of windowSprints) {
        const v = r.sprintMap.get(s.id) || 0;
        colTotals.set(s.id, (colTotals.get(s.id) || 0) + v);
      }
    }
    const grandTotal = Array.from(colTotals.values()).reduce((a, b) => a + b, 0);

    return { rows, colTotals, grandTotal };
  }, [allocations, sprintIdSet, windowSprints, getEmployeeById]);

  if (!isOpen) return null;

  return (
    <div
      className={[
        // Responsive width so 10 columns can actually fit on real screens
        'fixed right-0 top-0 z-50 h-full border-l bg-white shadow-xl',
        'w-[40vw] min-w-[680px] max-w-[980px]',
        'max-[900px]:w-[95vw] max-[900px]:min-w-0',
      ].join(' ')}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b p-4">
        <div className="min-w-0">
          <div className="text-sm text-muted-foreground">Upcoming sprint allocations</div>
          <div className="font-semibold leading-tight truncate">{project.name}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {windowSprints.length === 0 ? (
              'No current/upcoming sprint found'
            ) : (
              <>
                Showing 10 sprints from <span className="font-medium text-foreground">{windowSprints[0].name}</span>
              </>
            )}
          </div>
        </div>

        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsOpen(false)}>
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>

      {/* Body */}
      <div className="h-[calc(100%-64px)] overflow-y-auto p-4">
        {windowSprints.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Couldn&apos;t determine the currently running sprint. Check sprint dates in your data.
          </div>
        ) : matrix.rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">No allocations in the next 10 sprints for this project.</div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            {/* No horizontal scroll: fixed table layout + narrow columns */}
            <table className="w-full text-[12px] table-fixed">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {/* Employee column takes the remaining space */}
                  <th className="text-left px-2 py-2 w-[38%]">
                    Employee
                  </th>

                  {/* Each sprint gets equal share */}
                  {windowSprints.map((s) => {
                    const start = toDate(s.startDate);
                    const end = toDate(s.endDate);
                    const tooltip = `${s.name} (${format(start, 'dd MMM')}–${format(end, 'dd MMM yyyy')})`;

                    return (
                      <th key={s.id} className="text-center px-1 py-2 w-[6%]" title={tooltip}>
                        <div className="font-medium leading-none">{shortSprintLabel(s.name)}</div>
                        <div className="text-[10px] text-muted-foreground leading-none mt-1">
                          {format(start, 'dd')}-{format(end, 'dd')}
                        </div>
                      </th>
                    );
                  })}

                  {/* Total */}
                  <th className="text-right px-2 py-2 w-[10%]">Total</th>
                </tr>
              </thead>

              <tbody>
                {matrix.rows.map((r) => (
                  <tr key={r.employeeId} className="border-b last:border-b-0">
                    <td className="px-2 py-2 truncate" title={r.name}>
                      {r.name}
                    </td>

                    {windowSprints.map((s) => {
                      const v = r.sprintMap.get(s.id) || 0;
                      return (
                        <td key={s.id} className="px-1 py-2 text-center">
                          {v > 0 ? (
                            <span className="font-medium">{v}</span>
                          ) : (
                            <span className="text-muted-foreground">·</span>
                          )}
                        </td>
                      );
                    })}

                    <td className="px-2 py-2 text-right font-medium">{r.total}</td>
                  </tr>
                ))}
              </tbody>

              <tfoot className="bg-gray-50 border-t">
                <tr>
                  <td className="px-2 py-2 font-medium">Total</td>

                  {windowSprints.map((s) => (
                    <td key={s.id} className="px-1 py-2 text-center font-medium">
                      {matrix.colTotals.get(s.id) || 0}
                    </td>
                  ))}

                  <td className="px-2 py-2 text-right font-semibold">{matrix.grandTotal}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectMonthDetails;
