import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useDrop } from 'react-dnd';
import { DragItem, Sprint } from '../types';
import { usePlanner } from '../contexts/PlannerContext';
import AllocationItem from './AllocationItem';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DroppableCellProps {
  employeeId: string;
  sprintId: string;
  sprint: Sprint;
}

type QuickProject = {
  id: string;
  name: string;
  color?: string;
  archived?: boolean;
  endDate?: Date | string | null;
};

type RepeatMode = 'single' | 'next-n' | 'until-project-end';

const QuickAllocateDialog: React.FC<{
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employeeId: string;
  sprintId: string;
  sprint: Sprint;
  disabled?: boolean;
  defaultDays: number;
}> = ({ open, onOpenChange, employeeId, sprintId, sprint, disabled, defaultDays }) => {
  const {
    projects = [],
    getTotalAllocationDays,
    getAvailableDays,
    // ✅ new API from useAllocationOperations drop-in
    quickAllocateToProject,
  } = usePlanner() as any;

  const [projectSearch, setProjectSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState<QuickProject | null>(null);
  const [days, setDays] = useState<number>(defaultDays);
  const [saving, setSaving] = useState(false);

  // Optional apply mode
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('single');
  const [repeatCount, setRepeatCount] = useState<number>(2);

  useEffect(() => {
    if (!open) return;
    setProjectSearch('');
    setSelectedProject(null);
    setDays(defaultDays);
    setSaving(false);
    setRepeatMode('single');
    setRepeatCount(2);
  }, [open, defaultDays]);

  const safeProjects: QuickProject[] = useMemo(() => {
    const list = Array.isArray(projects) ? projects : [];
    return list
      .filter((p) => p && (p as any).id && (p as any).name && !(p as any).archived)
      .map((p) => ({
        id: (p as any).id,
        name: (p as any).name,
        color: (p as any).color,
        archived: (p as any).archived,
        endDate: (p as any).endDate ?? (p as any).end_date ?? null,
      }));
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const q = projectSearch.trim().toLowerCase();
    if (!q) return safeProjects.slice(0, 50);
    return safeProjects.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 50);
  }, [safeProjects, projectSearch]);

  const totalDaysThisSprint = useMemo(() => {
    try {
      return typeof getTotalAllocationDays === 'function'
        ? getTotalAllocationDays(employeeId, sprint)
        : 0;
    } catch {
      return 0;
    }
  }, [getTotalAllocationDays, employeeId, sprint]);

  const availableDaysThisSprint = useMemo(() => {
    try {
      return typeof getAvailableDays === 'function' ? getAvailableDays(employeeId, sprint) : 10;
    } catch {
      return 10;
    }
  }, [getAvailableDays, employeeId, sprint]);

  const wouldOverallocateThisSprint = useMemo(() => {
    return totalDaysThisSprint + days > availableDaysThisSprint;
  }, [totalDaysThisSprint, availableDaysThisSprint, days]);

  const canSave =
    !disabled &&
    !!selectedProject &&
    days > 0 &&
    Number.isFinite(days) &&
    typeof quickAllocateToProject === 'function';

  const onSave = async () => {
    if (!selectedProject || !canSave) return;

    setSaving(true);
    try {
      const mode =
        repeatMode === 'single'
          ? ({ kind: 'single' } as const)
          : repeatMode === 'next-n'
          ? ({ kind: 'next-n', count: repeatCount } as const)
          : ({ kind: 'until-project-end' } as const);

      await quickAllocateToProject({
        employeeId,
        projectId: selectedProject.id,
        startSprintId: sprintId,
        days,
        mode,
      });

      onOpenChange(false);
    } catch (e) {
      console.error('Quick allocate failed:', e);
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !saving && onOpenChange(v)}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Allocate to project</DialogTitle>
          <DialogDescription>
            Choose a project and the number of days for{' '}
            <span className="font-medium">{(sprint as any).name ?? 'this sprint'}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Project picker */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Project</div>
            <Command className="border rounded-md">
              <CommandInput
                placeholder="Search project..."
                value={projectSearch}
                onValueChange={setProjectSearch}
              />
              <CommandList>
                <CommandEmpty>No project found.</CommandEmpty>
                <CommandGroup>
                  {filteredProjects.map((p) => (
                    <CommandItem
                      key={p.id}
                      value={p.name}
                      onSelect={() => {
                        setSelectedProject(p);
                        setProjectSearch(p.name);
                      }}
                    >
                      <span className="truncate">{p.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>

            {selectedProject && (
              <div className="text-xs text-muted-foreground">
                Selected:{' '}
                <span className="font-medium text-foreground">{selectedProject.name}</span>
              </div>
            )}
          </div>

          {/* Days */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Days</div>
            <Input
              type="number"
              min={1}
              step={1}
              value={Number.isFinite(days) ? days : 1}
              on taxChange={(e) => setDays(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
            />
            <div className="text-xs text-muted-foreground">
              Whole days only. Fractional reality is not supported by this timeline.
            </div>

            <div className="text-xs text-muted-foreground">
              This sprint capacity: {totalDaysThisSprint}/{availableDaysThisSprint} days
              {wouldOverallocateThisSprint ? (
                <span className="text-red-600"> (this will overallocate)</span>
              ) : null}
            </div>
          </div>

          {/* Optional: Apply */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Apply</div>
            <Select value={repeatMode} onValueChange={(v: RepeatMode) => setRepeatMode(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Only this sprint</SelectItem>
                <SelectItem value="next-n">Next N sprints</SelectItem>
                <SelectItem value="until-project-end">Until project end</SelectItem>
              </SelectContent>
            </Select>

            {repeatMode === 'next-n' && (
              <div className="flex items-center gap-2">
                <div className="text-xs text-muted-foreground whitespace-nowrap">N</div>
                <Input
                  type="number"
                  min={1}
                  max={26}
                  value={repeatCount}
                  onChange={(e) =>
                    setRepeatCount(Math.max(1, Math.min(26, Number(e.target.value || 1))))
                  }
                  className="h-8"
                />
                <div className="text-xs text-muted-foreground">sprints</div>
              </div>
            )}

            {repeatMode === 'until-project-end' && (
              <div className="text-xs text-muted-foreground">
                Uses the project end date. If it’s missing, we fall back to only this sprint.
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={!canSave || saving}>
            {saving ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </span>
            ) : (
              'Allocate'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const DroppableCell: React.FC<DroppableCellProps> = ({ employeeId, sprintId, sprint }) => {
  const { allocations, moveAllocation, getTotalAllocationDays, getAvailableDays, getEmployeeById } =
    usePlanner();

  const [isProcessing, setIsProcessing] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);

  const employee = getEmployeeById(employeeId);
  const isEmployeeArchived = employee?.archived || false;

  const cellAllocations = useMemo(() => {
    const list = Array.isArray(allocations) ? allocations : [];
    return list.filter((alloc) => alloc.employeeId === employeeId && alloc.sprintId === sprintId);
  }, [allocations, employeeId, sprintId]);

  const totalDays = getTotalAllocationDays(employeeId, sprint);
  const availableDays = getAvailableDays(employeeId, sprint);
  const isOverallocated = totalDays > availableDays;

  const percent = useMemo(() => {
    if (!availableDays || availableDays <= 0) return 0;
    return Math.round((totalDays / availableDays) * 100);
  }, [totalDays, availableDays]);

  const fillPct = Math.min(100, Math.max(0, availableDays > 0 ? (totalDays / availableDays) * 100 : 0));

  const barClass = isOverallocated
    ? 'bg-red-500'
    : totalDays === 0
    ? 'bg-gray-300'
    : 'bg-green-600';

  const suggestedDays = useMemo(() => {
    const remaining = Math.max(availableDays - totalDays, 0);
    return Math.max(1, remaining || 1);
  }, [availableDays, totalDays]);

  const countVacationDaysInSprint = useCallback((vacationDates: string[], sprintArg: Sprint): number => {
    if (!Array.isArray(vacationDates) || !(sprintArg as any).workingDays) return 0;
    const workingDays = (sprintArg as any).workingDays as string[];
    const sprintDays = new Set(workingDays.map((d) => new Date(d).toDateString()));
    return vacationDates.filter((dateStr) => sprintDays.has(new Date(dateStr).toDateString())).length;
  }, []);

  const handleDrop = useCallback(
    async (item: DragItem) => {
      if (isEmployeeArchived) return;

      setIsProcessing(true);
      try {
        const allocationDays = item.days ?? 10;
        const dragItemWithEmployee: DragItem = {
          ...item,
          employeeId,
          days: allocationDays,
        };
        await moveAllocation(dragItemWithEmployee, sprintId);
      } catch (error) {
        console.error('Drop failed:', error);
      } finally {
        setIsProcessing(false);
      }
    },
    [employeeId, sprintId, moveAllocation, isEmployeeArchived]
  );

  const [{ isOverCurrent }, drop] = useDrop({
    accept: 'ALLOCATION',
    canDrop: () => !isEmployeeArchived,
    drop: (item: DragItem) => {
      handleDrop(item);
      return { sprintId };
    },
    collect: (monitor) => ({
      isOverCurrent: monitor.isOver({ shallow: true }),
    }),
  });

  const vacationCount =
    employee?.vacationDates && sprint ? countVacationDaysInSprint(employee.vacationDates, sprint) : 0;

  return (
    <>
      <div
        ref={drop}
        className={[
          'droppable-cell p-2 h-full min-h-[120px] border-r border-b',
          isOverCurrent ? 'active bg-primary/10' : '',
          isOverallocated ? 'bg-red-50' : '',
          isProcessing ? 'bg-gray-50' : '',
          isEmployeeArchived ? 'cursor-not-allowed opacity-50' : '',
        ].join(' ')}
      >
        {/* Header: slim progress bar + % */}
<div className="mb-1 flex justify-between items-center gap-2">
  <div className="flex-1 min-w-0">
    {(() => {
      const cap = Math.max(availableDays || 0, 0);
      const used = Math.max(totalDays || 0, 0);

      const ratio = cap > 0 ? used / cap : 0;
      const pct = cap > 0 ? Math.round(ratio * 100) : 0;
      const fillPct = Math.min(100, Math.max(0, cap > 0 ? ratio * 100 : 0));

      // color logic
      const isLow = cap > 0 ? ratio < 0.3 : used === 0; // <30% = low allocation
      const isNearFull = cap > 0 ? ratio >= 0.9 && ratio <= 1 : false;

      const barClass = isOverallocated
        ? 'bg-red-500'
        : isLow
        ? 'bg-gray-400'
        : isNearFull
        ? 'bg-amber-500'
        : 'bg-blue-600';

      const trackClass = isOverallocated ? 'bg-red-100' : 'bg-gray-200';

      return (
        <div className="flex items-center gap-2">
          <div className="relative h-1.5 flex-1 rounded-full overflow-hidden">
            <div className={`absolute inset-0 ${trackClass}`} />
            <div
              className={`absolute inset-y-0 left-0 ${barClass}`}
              style={{ width: `${fillPct}%` }}
            />
          </div>

          <span className={`text-[11px] font-medium tabular-nums ${isOverallocated ? 'text-red-600' : 'text-gray-600'}`}>
            {pct}%
          </span>
        </div>
      );
    })()}
  </div>

  <div className="flex items-center gap-1">
    <Button
      variant="ghost"
      size="sm"
      className="h-6 w-6 p-0"
      disabled={isEmployeeArchived}
      title={isEmployeeArchived ? 'Archived employee' : 'Allocate to a project'}
      onClick={(e) => {
        e.stopPropagation();
        setQuickOpen(true);
      }}
    >
      <Plus className="h-4 w-4" />
    </Button>

    {isOverallocated && <span className="text-xs text-red-500 font-bold">!</span>}
    {isProcessing && <Loader2 className="h-3 w-3 animate-spin text-gray-400" />}
  </div>
</div>



        {vacationCount > 0 ? (
          <div className="text-[11px] text-amber-700 mb-1">
            {vacationCount} vacation day{vacationCount > 1 ? 's' : ''}
          </div>
        ) : null}

        {cellAllocations.map((allocation) => (
          <AllocationItem
            key={allocation.id}
            id={allocation.id}
            employeeId={allocation.employeeId}
            projectId={allocation.projectId}
            days={allocation.days}
            sprintId={allocation.sprintId}
          />
        ))}
      </div>

      <QuickAllocateDialog
        open={quickOpen}
        onOpenChange={setQuickOpen}
        employeeId={employeeId}
        sprintId={sprintId}
        sprint={sprint}
        disabled={isEmployeeArchived}
        defaultDays={suggestedDays}
      />
    </>
  );
};

export default DroppableCell;
