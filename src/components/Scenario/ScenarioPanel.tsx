import React, { useState } from 'react';
import { ScenarioAllocation, ScenarioConflict } from '@/hooks/useScenarioStore';
import { Sprint, Employee } from '@/types';
import { ROLE_OPTIONS } from '@/constants/roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  AlertTriangle,
  AlertCircle,
  UserPlus,
  Users,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { getSprintDateRange } from '@/utils/sprintUtils';

interface ScenarioPanelProps {
  scenarioAllocations: ScenarioAllocation[];
  conflicts: ScenarioConflict[];
  sprints: Sprint[];
  employees: Employee[];
  projectId: string;
  onAddPlaceholder: (params: { role: string; sprintId: string; days: number; note?: string }) => void;
  onAddNamed: (params: { employeeId: string; sprintId: string; days: number }) => void;
  onUpdateAllocation: (id: string, days: number) => void;
  onDeleteAllocation: (id: string) => void;
}

const ScenarioPanel: React.FC<ScenarioPanelProps> = ({
  scenarioAllocations,
  conflicts,
  sprints,
  employees,
  projectId: _projectId,
  onAddPlaceholder,
  onAddNamed,
  onUpdateAllocation,
  onDeleteAllocation,
}) => {
  const [addMode, setAddMode] = useState<'none' | 'named' | 'placeholder'>('none');
  const [newRole, setNewRole] = useState('');
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [newSprintId, setNewSprintId] = useState('');
  const [newDays, setNewDays] = useState(5);
  const [newNote, setNewNote] = useState('');
  const [isExpanded, setIsExpanded] = useState(conflicts.length > 0 || scenarioAllocations.length > 0);
  const [healthExpanded, setHealthExpanded] = useState(true);
  const [placeholderExpanded, setPlaceholderExpanded] = useState(true);

  const placeholders = scenarioAllocations.filter((a) => a.isPlaceholder);
  const hardConflicts = conflicts.filter((c) => c.type === 'hard');
  const warnings = conflicts.filter((c) => c.type === 'warning');
  const healthWarnings = warnings.filter((c) => !(c.role && c.employeeId === undefined));
  const placeholderWarnings = warnings.filter((c) => c.role && c.employeeId === undefined);

  // Only show visible sprints (next 12 or so)
  const visibleSprints = sprints.slice(0, 24);

  const getSprintLabel = (sprintId: string) => sprints.find((s) => s.id === sprintId)?.name || 'Sprint';

  const getEmployeeName = (employeeId?: string) =>
    employees.find((e) => e.id === employeeId)?.name || 'Unknown team member';

  const uniquePlaceholderWarningSummary = Array.from(
    new Map(
      placeholderWarnings.map((conflict) => [
        `${conflict.role}-${conflict.sprintId}`,
        {
          role: conflict.role || 'Unknown role',
          sprintId: conflict.sprintId,
          days: conflict.totalDays,
        },
      ])
    ).values()
  );

  const collapsedSummaryParts = [
    hardConflicts.length > 0 ? `${hardConflicts.length} conflict${hardConflicts.length !== 1 ? 's' : ''}` : null,
    healthWarnings.length > 0 ? `${healthWarnings.length} warning${healthWarnings.length !== 1 ? 's' : ''}` : null,
    placeholders.length > 0 ? `${placeholders.length} placeholder${placeholders.length !== 1 ? 's' : ''}` : null,
  ].filter(Boolean) as string[];

  const collapsedSummary =
    collapsedSummaryParts.length > 0
      ? collapsedSummaryParts.join(' • ')
      : 'No active issues or placeholder demand';

  const formatConflictText = (conflict: ScenarioConflict) => {
    const overBy = Math.max(conflict.totalDays - conflict.availableDays, 0);

    if (conflict.type === 'hard' && conflict.employeeId) {
      return `${getEmployeeName(conflict.employeeId)} is overallocated by ${overBy}d`;
    }

    if (conflict.type === 'hard' && conflict.role) {
      return `${conflict.role} exceeds role capacity by ${overBy}d`;
    }

    if (conflict.type === 'warning' && conflict.employeeId) {
      const projectCountMatch = conflict.message.match(/:\s*(\d+)\s+projects?/i);
      const projectCount = projectCountMatch ? Number(projectCountMatch[1]) : null;
      return projectCount
        ? `${getEmployeeName(conflict.employeeId)} is spread across ${projectCount} projects`
        : conflict.message;
    }

    if (conflict.type === 'warning' && conflict.role) {
      return `${conflict.role} has ${conflict.totalDays}d of unassigned demand`;
    }

    return conflict.message;
  };

  const handleAdd = () => {
    if (addMode === 'placeholder' && newRole && newSprintId && newDays > 0) {
      onAddPlaceholder({
        role: newRole,
        sprintId: newSprintId,
        days: newDays,
        note: newNote || undefined,
      });
      resetForm();
    } else if (addMode === 'named' && newEmployeeId && newSprintId && newDays > 0) {
      onAddNamed({ employeeId: newEmployeeId, sprintId: newSprintId, days: newDays });
      resetForm();
    }
  };

  const resetForm = () => {
    setAddMode('none');
    setNewRole('');
    setNewEmployeeId('');
    setNewSprintId('');
    setNewDays(5);
    setNewNote('');
  };

  return (
    <div className="border-t bg-muted/20">
      <div className="flex flex-col gap-2 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-start gap-2 text-left"
          onClick={() => setIsExpanded((current) => !current)}
        >
          {isExpanded ? (
            <ChevronDown className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Users className="h-4 w-4 text-muted-foreground" />
              Scenario Allocations & Warnings
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isExpanded
                ? 'Review issues and placeholder demand, then collapse to focus on the grid.'
                : collapsedSummary}
            </p>
          </div>
        </button>

        <div className="flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs"
            disabled={!isExpanded}
            onClick={() => setAddMode(addMode === 'named' ? 'none' : 'named')}
          >
            <UserPlus className="h-3.5 w-3.5" /> Assign Team Member
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs"
            disabled={!isExpanded}
            onClick={() => setAddMode(addMode === 'placeholder' ? 'none' : 'placeholder')}
          >
            <Plus className="h-3.5 w-3.5" /> Add Placeholder
          </Button>
        </div>
      </div>

      {isExpanded && addMode !== 'none' && (
        <div className="mx-4 mb-3 flex flex-wrap items-end gap-2 rounded-lg border bg-background p-3">
          {addMode === 'placeholder' ? (
            <div className="min-w-[150px] space-y-1">
              <label className="text-xs font-medium">Role</label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="min-w-[180px] space-y-1">
              <label className="text-xs font-medium">Team Member</label>
              <Select value={newEmployeeId} onValueChange={setNewEmployeeId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {employees
                    .filter((e) => !e.archived)
                    .map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name} ({e.role})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="min-w-[160px] space-y-1">
            <label className="text-xs font-medium">Sprint</label>
            <Select value={newSprintId} onValueChange={setNewSprintId}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select sprint" />
              </SelectTrigger>
              <SelectContent>
                {visibleSprints.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({getSprintDateRange(s)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-20 space-y-1">
            <label className="text-xs font-medium">Days</label>
            <Input
              type="number"
              min={1}
              max={10}
              value={newDays}
              onChange={(e) => setNewDays(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
              className="h-8 text-xs"
            />
          </div>

          {addMode === 'placeholder' && (
            <div className="min-w-[140px] space-y-1">
              <label className="text-xs font-medium">Note</label>
              <Input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="e.g. Senior preferred"
                className="h-8 text-xs"
              />
            </div>
          )}

          <Button size="sm" className="h-8" onClick={handleAdd}>
            Add
          </Button>
          <Button size="sm" variant="ghost" className="h-8" onClick={resetForm}>
            Cancel
          </Button>
        </div>
      )}

      {isExpanded ? (
        <div className="grid max-h-[260px] gap-3 overflow-y-auto px-4 pb-3 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-lg border bg-background/90 p-3">
            <button
              type="button"
              className="mb-2 flex w-full items-center justify-between text-left"
              onClick={() => setHealthExpanded((current) => !current)}
            >
              <div>
                <div className="text-sm font-medium text-foreground">Scenario Health</div>
                <p className="text-[11px] text-muted-foreground">
                  Conflicts and warnings that need attention
                </p>
              </div>
              {healthExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {healthExpanded ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Conflicts
                  </div>
                  {hardConflicts.length > 0 ? (
                    <div className="space-y-1.5">
                      {hardConflicts.map((conflict, index) => (
                        <div
                          key={`hard-${index}`}
                          className="flex items-start gap-2 rounded-md border border-border bg-white px-2.5 py-2 shadow-sm"
                        >
                          <div className="w-1 self-stretch rounded-full bg-red-500" />
                          <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-600" />
                          <span className="min-w-0 flex-1 text-xs text-foreground">
                            {formatConflictText(conflict)}
                          </span>
                          <Badge
                            variant="outline"
                            className="ml-auto h-5 border-red-200 bg-red-50 px-1.5 text-[10px] text-red-700"
                          >
                            {getSprintLabel(conflict.sprintId)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No hard conflicts in this scenario.</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Warnings
                  </div>
                  {healthWarnings.length > 0 ? (
                    <div className="space-y-1.5">
                      {healthWarnings.map((conflict, index) => (
                        <div
                          key={`warn-${index}`}
                          className="flex items-start gap-2 rounded-md border border-border bg-white px-2.5 py-2 shadow-sm"
                        >
                          <div className="w-1 self-stretch rounded-full bg-amber-500" />
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-600" />
                          <span className="min-w-0 flex-1 text-xs text-foreground">
                            {formatConflictText(conflict)}
                          </span>
                          <Badge className="ml-auto h-5 bg-amber-100 px-1.5 text-[10px] text-amber-800">
                            {getSprintLabel(conflict.sprintId)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No scenario warnings right now.</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {hardConflicts.length + healthWarnings.length > 0
                  ? `${hardConflicts.length + healthWarnings.length} health item${hardConflicts.length + healthWarnings.length !== 1 ? 's' : ''} hidden`
                  : 'No health issues'}
              </p>
            )}
          </section>

          <section className="rounded-lg border bg-background/90 p-3">
            <button
              type="button"
              className="mb-2 flex w-full items-center justify-between text-left"
              onClick={() => setPlaceholderExpanded((current) => !current)}
            >
              <div>
                <div className="text-sm font-medium text-foreground">Placeholder Demand</div>
                <p className="text-[11px] text-muted-foreground">
                  Editable placeholder allocations and unassigned demand
                </p>
              </div>
              {placeholderExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {placeholderExpanded ? (
              <div className="space-y-3">
                {uniquePlaceholderWarningSummary.length > 0 ? (
                  <div className="rounded-md border border-violet-100 bg-violet-50/50 px-2.5 py-2 text-xs text-violet-800">
                    <div className="font-medium">Unassigned demand summary</div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {uniquePlaceholderWarningSummary.map((item) => (
                        <Badge
                          key={`${item.role}-${item.sprintId}`}
                          variant="outline"
                          className="h-5 border-violet-200 bg-white px-1.5 text-[10px] text-violet-700"
                        >
                          {item.role}: {item.days}d {getSprintLabel(item.sprintId)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Placeholder Allocations
                  </div>
                  {placeholders.length > 0 ? (
                    <div className="space-y-1.5">
                      {placeholders.map((placeholder) => (
                        <div
                          key={placeholder.id}
                          className="flex items-center gap-2 rounded-md border border-border bg-white px-2.5 py-2 text-xs shadow-sm"
                        >
                          <div className="w-1 self-stretch rounded-full bg-violet-500" />
                          <Badge
                            variant="outline"
                            className="h-5 border-violet-200 bg-violet-50 px-1.5 text-[10px] text-violet-700"
                          >
                            {placeholder.role}
                          </Badge>
                          <span className="min-w-0 flex-1 text-foreground">
                            {placeholder.days}d unassigned
                            {placeholder.note ? (
                              <span className="text-muted-foreground"> • {placeholder.note}</span>
                            ) : null}
                          </span>
                          <Badge
                            variant="outline"
                            className="h-5 border-slate-200 bg-slate-50 px-1.5 text-[10px] text-slate-700"
                          >
                            {getSprintLabel(placeholder.sprintId)}
                          </Badge>
                          <div className="ml-auto flex items-center gap-1">
                            <Input
                              type="number"
                              min={1}
                              max={10}
                              value={placeholder.days}
                              onChange={(e) =>
                                onUpdateAllocation(
                                  placeholder.id,
                                  Math.max(1, Math.min(10, Number(e.target.value) || 1))
                                )
                              }
                              className="h-6 w-14 text-xs"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => onDeleteAllocation(placeholder.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No placeholder allocations yet. Add demand here or directly from the grid.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <>
                {placeholders.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {placeholders.length} editable placeholder allocation
                    {placeholders.length !== 1 ? 's' : ''} hidden
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">No placeholder allocations</p>
                )}
              </>
            )}
          </section>
        </div>
      ) : (
        <div className="px-4 pb-3">
          {placeholders.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Placeholder demand remains editable when you expand the summary.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Expand the summary to review detailed issues and placeholder demand.
            </p>
          )}
        </div>
      )}

      {isExpanded && placeholders.length === 0 && hardConflicts.length === 0 && warnings.length === 0 && (
        <div className="px-4 pb-3">
          <p className="text-xs text-muted-foreground">
            No placeholder allocations or conflicts. Add scenario allocations using the grid above
            or the controls here.
          </p>
        </div>
      )}
    </div>
  );
};

export default ScenarioPanel;
