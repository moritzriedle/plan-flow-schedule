import React, { useState, useMemo } from 'react';
import { Employee, Project, Sprint, Allocation } from '../../types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, AlertTriangle } from 'lucide-react';

interface AddAllocationPopoverProps {
  project: Project;
  sprint: Sprint;
  employees: Employee[];
  allocations: Allocation[];
  onAdd: (params: { employeeId: string; projectId: string; sprintId: string; days: number }) => Promise<any>;
}

const AddAllocationPopover: React.FC<AddAllocationPopoverProps> = ({
  project,
  sprint,
  employees,
  allocations,
  onAdd,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [days, setDays] = useState('5');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  // Employees not already allocated to this project in this sprint
  const availableEmployees = useMemo(() => {
    const allocatedIds = new Set(
      allocations
        .filter((a) => a.projectId === project.id && a.sprintId === sprint.id)
        .map((a) => a.employeeId)
    );
    return employees
      .filter((e) => !e.archived && !allocatedIds.has(e.id))
      .filter((e) => e.name.toLowerCase().includes(search.toLowerCase().trim()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, allocations, project.id, sprint.id, search]);

  // Check overallocation for selected employee
  const selectedEmployeeTotalDays = useMemo(() => {
    if (!selectedEmployeeId) return 0;
    return allocations
      .filter((a) => a.employeeId === selectedEmployeeId && a.sprintId === sprint.id)
      .reduce((sum, a) => sum + a.days, 0);
  }, [selectedEmployeeId, allocations, sprint.id]);

  const parsedDays = parseInt(days, 10);
  const isValid = !isNaN(parsedDays) && parsedDays >= 1 && parsedDays <= 10 && !!selectedEmployeeId;
  const wouldOverallocate = isValid && selectedEmployeeTotalDays + parsedDays > 10;

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    await onAdd({
      employeeId: selectedEmployeeId,
      projectId: project.id,
      sprintId: sprint.id,
      days: parsedDays,
    });
    setSaving(false);
    setSelectedEmployeeId('');
    setDays('5');
    setSearch('');
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          title="Add allocation"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="start">
        <div className="space-y-3">
          <h4 className="font-medium text-sm">
            Add allocation — {sprint.name}
          </h4>

          <div className="space-y-1.5">
            <Label className="text-xs">Employee</Label>
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select employee..." />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1.5">
                  <Input
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-7 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                {availableEmployees.map((e) => (
                  <SelectItem key={e.id} value={e.id} className="text-sm">
                    {e.name} <span className="text-muted-foreground">({e.role})</span>
                  </SelectItem>
                ))}
                {availableEmployees.length === 0 && (
                  <div className="px-2 py-2 text-sm text-muted-foreground text-center">
                    No available employees
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Days</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          {wouldOverallocate && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded px-2 py-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>
                This will result in {selectedEmployeeTotalDays + parsedDays}d total for this employee (overallocated)
              </span>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!isValid || saving}
            >
              {saving ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AddAllocationPopover;
