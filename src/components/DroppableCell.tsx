import React, { useMemo, useState, useEffect } from 'react';
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
};

const QuickAllocateDialog: React.FC<{
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employeeId: string;
  sprintId: string;
  sprint: Sprint;
  disabled?: boolean;
  defaultDays: number;
}> = ({ open, onOpenChange, employeeId, sprintId, sprint, disabled, defaultDays }) => {
  const { projects = [], moveAllocation } = usePlanner();

  const [projectSearch, setProjectSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState<QuickProject | null>(null);
  const [days, setDays] = useState<number>(defaultDays);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setProjectSearch('');
      setSelectedProject(null);
      setDays(defaultDays);
      setSaving(false);
    }
  }, [open, defaultDays]);

  const safeProjects: QuickProject[] = useMemo(() => {
    const list = Array.isArray(projects) ? projects : [];
    return list
      .filter((p) => p && p.id && p.name && !p.archived) // ignore archived projects here
      .map((p) => ({ id: p.id, name: p.name, color: (p as any).color, archived: (p as any).archived }));
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const q = projectSearch.trim().toLowerCase();
    if (!q) return safeProjects.slice(0, 50);
    return safeProjects
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 50);
  }, [safeProjects, projectSearch]);

  const canSave = !disabled && !!selectedProject && days > 0 && Number.isFinite(days);

  const onSave = async () => {
    if (!selectedProject) return;
    if (!canSave) return;

    setSaving(true);
    try {
      const dragItem: DragItem = {
        type: 'PROJECT',
        projectId: selectedProject.id,
        name: selectedProject.name,
        color: selectedProject.color,
        employeeId,
        days,
      };

      await moveAllocation(dragItem, sprintId);
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
            Choose a project and the number of days for <span className="font-medium">{sprint.name}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
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
                Selected: <span className="font-medium text-foreground">{selectedProject.name}</span>
              </div>
            )}
          </div>

          {/* Days input */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Days</div>
            <Input
              type="number"
              min={1}
              step={1}
              value={Number.isFinite(days) ? days : 1}
              onChange={(e) => setDays(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
            />
            <div className="text-xs text-muted-foreground">
              Whole days only. (Yes, reality is discrete here.)
            </div>
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
  const {
    allocations,
    moveAllocation,
    getTotalAllocationDays,
    getAvailableDays,
    getEmployeeById,
  } = usePlanner();

  const [isOver, setIsOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [quickOpen, setQuickOpen] = useState(false);

  const employee = getEmployeeById(employeeId);

  const cellAllocations = allocations.filter(
    (alloc) => alloc.employeeId === employeeId && alloc.sprintId === sprintId
  );

  const totalDays = getTotalAllocationDays(employeeId, sprint);
  const availableDays = getAvailableDays(employeeId, sprint);
  const isOverallocated = totalDays > availableDays;
  const isEmployeeArchived = employee?.archived || false;

  // Suggest a default: remaining capacity (at least 1)
  const suggestedDays = useMemo(() => {
    const remaining = Math.max(availableDays - totalDays, 0);
    return Math.max(1, remaining || 1);
  }, [availableDays, totalDays]);

  const [{ isOverCurrent }, drop] = useDrop({
    accept: 'ALLOCATION',
    canDrop: () => !isEmployeeArchived, // Prevent drops on archived employees
    drop: (item: DragItem) => {
      if (isEmployeeArchived) return;
      handleDrop(item);
      return { sprintId };
    },
    hover: () => {
      if (!isEmployeeArchived) setIsOver(true);
    },
    collect: (monitor) => ({
      isOverCurrent: monitor.isOver({ shallow: true }),
    }),
  });

  const handleDrop = async (item: DragItem) => {
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
  };

  useEffect(() => {
    if (!isOverCurrent) setIsOver(false);
  }, [isOverCurrent]);

  // Utility to count how many vacation dates fall within this sprint
  function countVacationDaysInSprint(vacationDates: string[], sprint: Sprint): number {
    if (!Array.isArray(vacationDates) || !sprint.workingDays) return 0;

    const sprintDays = new Set(sprint.workingDays.map((d) => new Date(d).toDateString()));
    return vacationDates.filter((dateStr) => sprintDays.has(new Date(dateStr).toDateString())).length;
  }

  return (
    <>
      <div
        ref={drop}
        className={[
          'droppable-cell p-2 h-full min-h-[120px] border-r border-b',
          isOver ? 'active bg-primary/10' : '',
          isOverallocated ? 'bg-red-50' : '',
          isProcessing ? 'bg-gray-50' : '',
          isEmployeeArchived ? 'cursor-not-allowed opacity-50' : '',
        ].join(' ')}
      >
        {/* Header row: allocation summary + quick add */}
        <div className="mb-1 flex justify-between items-center gap-2">
          <span className={`text-xs font-medium ${isOverallocated ? 'text-red-500' : 'text-gray-500'}`}>
            {totalDays}/{availableDays} days
          </span>

          <div className="flex items-center gap-1">
            {/* Quick add button */}
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

        {/* Vacation display just for this sprint */}
        {employee && sprint && employee.vacationDates && (() => {
          const vacationCount = countVacationDaysInSprint(employee.vacationDates, sprint);
          return vacationCount > 0 ? (
            <div className="text-[11px] text-amber-700 mb-1">
              {vacationCount} vacation day{vacationCount > 1 ? 's' : ''}
            </div>
          ) : null;
        })()}

        {/* Existing allocations */}
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

      {/* Quick allocate dialog */}
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
