import React, { useEffect, useMemo, useState } from 'react';
import { format, isAfter, isBefore, isEqual } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Employee, Project, Sprint } from '@/types';

type RepeatMode = 'single' | 'next-n' | 'until-project-end';

interface SprintAllocationDialogProps {
  isOpen: boolean;
  onClose: () => void;

  employee: Employee;
  project: Project;
  sprints: Sprint[];

  /**
   * Called once per sprint allocation created.
   * Implementer can store by sprintId or translate sprint->date range internally.
   */
  onAllocate: (params: {
    employeeId: string;
    projectId: string;
    sprintId: string;
    days: number;
  }) => Promise<void>;

  /**
   * Optional: provide remaining/available days for warnings.
   * Return e.g. 0..10 based on employee vacation + existing allocations.
   */
  getAvailableDaysForSprint?: (employeeId: string, sprintId: string) => number;

  /**
   * Optional: cap allowed days input (defaults to 10).
   * If you use a different working-days-per-sprint number, change it here.
   */
  maxDaysPerSprint?: number;
}

function sprintLabel(s: Sprint) {
  const start = format(s.startDate, 'MMM d');
  const end = format(s.endDate, 'MMM d');
  // If you have a name/number, use it. Otherwise date range is fine.
  const name = (s as any).name || (s as any).label || null;
  return name ? `${name} (${start} – ${end})` : `${start} – ${end}`;
}

// Pick a reasonable default: first sprint whose endDate is in the future, else first sprint.
function getDefaultSprintId(sprints: Sprint[]) {
  const now = new Date();
  const upcoming = sprints
    .slice()
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    .find((s) => isAfter(s.endDate, now) || isEqual(s.endDate, now));
  return (upcoming || sprints[0])?.id ?? '';
}

function isSprintOverlappingProjectEnd(s: Sprint, projectEnd: Date) {
  // Include sprints that start on/before project end
  return isBefore(s.startDate, projectEnd) || isEqual(s.startDate, projectEnd);
}

export const DetailedAllocationDialog: React.FC<SprintAllocationDialogProps> = ({
  isOpen,
  onClose,
  employee,
  project,
  sprints,
  onAllocate,
  getAvailableDaysForSprint,
  maxDaysPerSprint = 10,
}) => {
  const sortedSprints = useMemo(
    () => (sprints || []).slice().sort((a, b) => a.startDate.getTime() - b.startDate.getTime()),
    [sprints]
  );

  const [selectedSprintId, setSelectedSprintId] = useState<string>('');
  const [days, setDays] = useState<number>(5);

  const [repeatMode, setRepeatMode] = useState<RepeatMode>('single');
  const [repeatCount, setRepeatCount] = useState<number>(2);

  const [isAllocating, setIsAllocating] = useState(false);
  const [confirmOverallocate, setConfirmOverallocate] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const defaultId = selectedSprintId || getDefaultSprintId(sortedSprints);
    setSelectedSprintId(defaultId);
    setConfirmOverallocate(false);
    // keep days as-is; humans often repeat same value
  }, [isOpen, sortedSprints]); // intentionally not including selectedSprintId

  const selectedSprint = useMemo(
    () => sortedSprints.find((s) => s.id === selectedSprintId),
    [sortedSprints, selectedSprintId]
  );

  const targetSprints: Sprint[] = useMemo(() => {
    if (!selectedSprint) return [];

    const startIndex = sortedSprints.findIndex((s) => s.id === selectedSprint.id);
    if (startIndex < 0) return [];

    if (repeatMode === 'single') {
      return [selectedSprint];
    }

    if (repeatMode === 'next-n') {
      const count = Math.max(1, Math.min(26, repeatCount || 1)); // cap to prevent accidental year-long spam
      return sortedSprints.slice(startIndex, startIndex + count);
    }

    // until project end
    return sortedSprints
      .slice(startIndex)
      .filter((s) => isSprintOverlappingProjectEnd(s, project.endDate));
  }, [repeatMode, repeatCount, selectedSprint, sortedSprints, project.endDate]);

  const availableDays = useMemo(() => {
    if (!getAvailableDaysForSprint || !selectedSprintId) return null;
    try {
      return getAvailableDaysForSprint(employee.id, selectedSprintId);
    } catch {
      return null;
    }
  }, [getAvailableDaysForSprint, employee.id, selectedSprintId]);

  const isOverAllocating = useMemo(() => {
    if (availableDays == null) return false;
    return days > availableDays;
  }, [days, availableDays]);

  const isValid = Boolean(selectedSprintId) && days > 0 && days <= maxDaysPerSprint && targetSprints.length > 0;

  const handleAllocate = async () => {
    if (!isValid) return;

    // If we have availability info, require explicit confirmation when exceeding it.
    if (isOverAllocating && !confirmOverallocate) {
      setConfirmOverallocate(true);
      return;
    }

    setIsAllocating(true);
    try {
      // Create one allocation per sprint
      for (const s of targetSprints) {
        await onAllocate({
          employeeId: employee.id,
          projectId: project.id,
          sprintId: s.id,
          days,
        });
      }
      onClose();
    } catch (e) {
      console.error('Error allocating:', e);
    } finally {
      setIsAllocating(false);
      setConfirmOverallocate(false);
    }
  };

  const allocateButtonText = useMemo(() => {
    if (isAllocating) return 'Allocating...';
    if (confirmOverallocate) return 'Confirm overallocation';
    if (targetSprints.length > 1) return `Allocate across ${targetSprints.length} sprints`;
    return 'Allocate';
  }, [isAllocating, confirmOverallocate, targetSprints.length]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="pr-6">
            Allocate {employee.name} to {project.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sprint Selection */}
          <div className="space-y-2">
            <Label>Sprint</Label>
            <Select value={selectedSprintId} onValueChange={setSelectedSprintId}>
              <SelectTrigger>
                <SelectValue placeholder="Select sprint" />
              </SelectTrigger>
              <SelectContent>
                {sortedSprints.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {sprintLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSprint && (
              <div className="text-xs text-muted-foreground">
                Selected: {format(selectedSprint.startDate, 'PPP')} – {format(selectedSprint.endDate, 'PPP')}
              </div>
            )}
          </div>

          {/* Days per Sprint */}
          <div className="space-y-2">
            <Label>Days in Sprint</Label>
            <Select value={String(days)} onValueChange={(v) => setDays(parseInt(v, 10))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: maxDaysPerSprint }, (_, i) => i + 1).map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {d} {d === 1 ? 'day' : 'days'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {availableDays != null && (
              <div className={cn('text-xs', isOverAllocating ? 'text-destructive' : 'text-muted-foreground')}>
                Available this sprint: {availableDays} days
                {isOverAllocating ? ' (this will overallocate)' : ''}
              </div>
            )}
          </div>

          {/* Optional: Repeat */}
          <div className="space-y-2">
            <Label>Apply</Label>
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
                <Label className="text-xs text-muted-foreground whitespace-nowrap">N</Label>
                <Input
                  type="number"
                  min={1}
                  max={26}
                  value={repeatCount}
                  onChange={(e) => setRepeatCount(Math.max(1, Math.min(26, Number(e.target.value || 1))))}
                  className="h-8"
                />
                <div className="text-xs text-muted-foreground">sprints</div>
              </div>
            )}

            {repeatMode === 'until-project-end' && (
              <div className="text-xs text-muted-foreground">
                Project ends on {format(project.endDate, 'PPP')}. This will create allocations for all sprints up to that point.
              </div>
            )}

            {targetSprints.length > 1 && (
              <div className="text-xs text-muted-foreground">
                Target sprints: {targetSprints.length}
              </div>
            )}
          </div>

          {/* Confirmation hint */}
          {confirmOverallocate && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">
              This allocation exceeds available capacity for the selected sprint. Click “Confirm overallocation” to proceed anyway.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isAllocating}>
            Cancel
          </Button>
          <Button onClick={handleAllocate} disabled={!isValid || isAllocating}>
            {allocateButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
export default DetailedAllocationDialog;
