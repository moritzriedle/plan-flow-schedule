import React, { useMemo, useState } from 'react';
import { usePlanner } from '@/contexts/PlannerContext';
import { Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

// ✅ Helper to generate Jira ticket URL (same as Gantt)
const generateLink = (ticketRef: string) => {
  if (!ticketRef?.trim()) return null;
  const projectKey = ticketRef.split('-')[0];
  return `https://proglove.atlassian.net/jira/polaris/projects/${projectKey}/ideas/view/3252935?selectedIssue=${ticketRef.trim()}`;
};

const toDate = (d: Date | string) => (d instanceof Date ? d : new Date(d));

const shortSprintLabel = (name: string) => {
  const m = name.match(/(\d+)/);
  return m ? `S${m[1]}` : name.replace(/\s+/g, '').slice(0, 4);
};

const ProjectMonthDetails: React.FC<ProjectMonthDetailsProps> = ({ project }) => {
  const { getProjectAllocations, getEmployeeById, sprints } = usePlanner();
  const [isOpen, setIsOpen] = useState(true);

  const today = new Date();
  const allocations = useMemo(
    () => getProjectAllocations(project.id) || [],
    [getProjectAllocations, project.id]
  );

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
      const upcoming = sortedSprints.findIndex(
        (s: SprintLike) => toDate(s.endDate).getTime() >= today.getTime()
      );
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

  // ✅ Header meta (move hover tooltip info up here)
  const headerMeta = useMemo(() => {
    if (!windowSprints.length) return null;

    const first = windowSprints[0];
    const last = windowSprints[windowSprints.length - 1];

    const firstStart = toDate(first.startDate);
    const lastEnd = toDate(last.endDate);

    const leadId = (project as any)?.leadId ?? (project as any)?.lead_id ?? null;
    const lead = leadId ? getEmployeeById(leadId) : null;

    const jiraUrl = project.ticketReference ? generateLink(project.ticketReference) : null;

    // total days in the window (same as table grand total)
    const totalInWindow = matrix.grandTotal;

    return {
      leadName: lead?.name ?? null,
      jiraUrl,
      windowLabel: `${format(firstStart, 'dd MMM')} – ${format(lastEnd, 'dd MMM yyyy')}`,
      totalInWindow,
      firstSprintName: first.name,
    };
  }, [windowSprints, project, getEmployeeById, matrix.grandTotal]);

  if (!isOpen) return null;

  return (
    <div
      className={[
        'fixed right-0 top-0 z-50 h-full border-l bg-white shadow-xl',
        'w-[40vw] min-w-[680px] max-w-[980px]',
        'max-[900px]:w-[95vw] max-[900px]:min-w-0',
      ].join(' ')}
    >
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm text-muted-foreground">Upcoming sprint allocations</div>
            <div className="font-semibold leading-tight truncate">{project.name}</div>

            {windowSprints.length === 0 || !headerMeta ? (
              <div className="text-xs text-muted-foreground mt-1">No current/upcoming sprint found</div>
            ) : (
              <>
                {/* Line 1: window + total */}
                <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span>
                    Showing {windowSprints.length} sprints from{' '}
                    <span className="font-medium text-foreground">{headerMeta.firstSprintName}</span>
                  </span>
                  <span>•</span>
                  <span className="text-foreground">{headerMeta.windowLabel}</span>
                  <span>•</span>
                  <span>
                    <span className="font-medium text-foreground">{headerMeta.totalInWindow}d</span> total
                  </span>

                  {project.archived && (
                    <>
                      <span>•</span>
                      <Badge variant="secondary" className="text-[10px] px-1 py-0">
                        Archived
                      </Badge>
                    </>
                  )}
                </div>

                {/* Line 2: lead + ticket */}
                <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  {headerMeta.leadName && (
                    <span>
                      Lead: <span className="text-foreground">{headerMeta.leadName}</span>
                    </span>
                  )}

                  {project.ticketReference && headerMeta.jiraUrl && (
                    <>
                      {headerMeta.leadName && <span>•</span>}
                      <a
                        href={headerMeta.jiraUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {project.ticketReference}
                      </a>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="h-[calc(100%-92px)] overflow-y-auto p-4">
        {windowSprints.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Couldn&apos;t determine the currently running sprint. Check sprint dates in your data.
          </div>
        ) : matrix.rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No allocations in the next {windowSprints.length} sprints for this project.
          </div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-[12px] table-fixed">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-2 py-2 w-[38%]">Employee</th>

                  {/* ✅ NO MORE title tooltips */}
                  {windowSprints.map((s) => {
                    const start = toDate(s.startDate);
                    const end = toDate(s.endDate);

                    return (
                      <th key={s.id} className="text-center px-1 py-2 w-[6%]">
                        <div className="font-medium leading-none">{shortSprintLabel(s.name)}</div>
                        <div className="text-[10px] text-muted-foreground leading-none mt-1">
                          {format(start, 'dd')}-{format(end, 'dd')}
                        </div>
                      </th>
                    );
                  })}

                  <th className="text-right px-2 py-2 w-[10%]">Total</th>
                </tr>
              </thead>

              <tbody>
                {matrix.rows.map((r) => (
                  <tr key={r.employeeId} className="border-b last:border-b-0">
                    <td className="px-2 py-2 truncate">
                      {r.name}
                    </td>

                    {windowSprints.map((s) => {
                      const v = r.sprintMap.get(s.id) || 0;
                      return (
                        <td key={s.id} className="px-1 py-2 text-center">
                          {v > 0 ? <span className="font-medium">{v}</span> : <span className="text-muted-foreground">·</span>}
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
