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
import { Plus, Trash2, AlertTriangle, AlertCircle, UserPlus, Users } from 'lucide-react';
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
  projectId,
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

  const placeholders = scenarioAllocations.filter(a => a.isPlaceholder);
  const hardConflicts = conflicts.filter(c => c.type === 'hard');
  const warnings = conflicts.filter(c => c.type === 'warning');

  // Only show visible sprints (next 12 or so)
  const visibleSprints = sprints.slice(0, 24);

  const handleAdd = () => {
    if (addMode === 'placeholder' && newRole && newSprintId && newDays > 0) {
      onAddPlaceholder({ role: newRole, sprintId: newSprintId, days: newDays, note: newNote || undefined });
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
    <div className="border-t bg-muted/30 p-4 space-y-4 max-h-[300px] overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Users className="h-4 w-4" />
          Scenario Allocations & Warnings
        </h3>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => setAddMode(addMode === 'named' ? 'none' : 'named')}
          >
            <UserPlus className="h-3 w-3" /> Assign Team Member
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => setAddMode(addMode === 'placeholder' ? 'none' : 'placeholder')}
          >
            <Plus className="h-3 w-3" /> Add Placeholder
          </Button>
        </div>
      </div>

      {/* Add form */}
      {addMode !== 'none' && (
        <div className="flex items-end gap-2 p-3 bg-background rounded-md border flex-wrap">
          {addMode === 'placeholder' ? (
            <div className="space-y-1 min-w-[150px]">
              <label className="text-xs font-medium">Role</label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-1 min-w-[180px]">
              <label className="text-xs font-medium">Team Member</label>
              <Select value={newEmployeeId} onValueChange={setNewEmployeeId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {employees.filter(e => !e.archived).map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.name} ({e.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1 min-w-[160px]">
            <label className="text-xs font-medium">Sprint</label>
            <Select value={newSprintId} onValueChange={setNewSprintId}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select sprint" />
              </SelectTrigger>
              <SelectContent>
                {visibleSprints.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({getSprintDateRange(s)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 w-20">
            <label className="text-xs font-medium">Days</label>
            <Input
              type="number"
              min={1}
              max={10}
              value={newDays}
              onChange={e => setNewDays(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
              className="h-8 text-xs"
            />
          </div>

          {addMode === 'placeholder' && (
            <div className="space-y-1 min-w-[120px]">
              <label className="text-xs font-medium">Note (optional)</label>
              <Input
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="e.g. Senior preferred"
                className="h-8 text-xs"
              />
            </div>
          )}

          <Button size="sm" className="h-8" onClick={handleAdd}>Add</Button>
          <Button size="sm" variant="ghost" className="h-8" onClick={resetForm}>Cancel</Button>
        </div>
      )}

      {/* Conflicts & Warnings */}
      {(hardConflicts.length > 0 || warnings.length > 0) && (
        <div className="space-y-2">
          {hardConflicts.map((c, i) => (
            <div key={`hard-${i}`} className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 px-3 py-1.5 rounded-md">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{c.message}</span>
              <Badge variant="destructive" className="text-[10px] ml-auto">
                {sprints.find(s => s.id === c.sprintId)?.name}
              </Badge>
            </div>
          ))}
          {warnings.map((c, i) => (
            <div key={`warn-${i}`} className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-md">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{c.message}</span>
              <Badge className="bg-amber-200 text-amber-800 text-[10px] ml-auto">
                {sprints.find(s => s.id === c.sprintId)?.name}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Placeholder allocations list */}
      {placeholders.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground">Placeholder Allocations</div>
          {placeholders.map(p => (
            <div key={p.id} className="flex items-center gap-2 text-xs bg-background p-2 rounded border border-dashed border-purple-300">
              <Badge variant="outline" className="text-[10px] border-purple-300 text-purple-700">
                {p.role}
              </Badge>
              <span className="text-muted-foreground">
                {sprints.find(s => s.id === p.sprintId)?.name}
              </span>
              <span className="font-medium">{p.days}d</span>
              {p.note && <span className="text-muted-foreground italic">— {p.note}</span>}
              <div className="ml-auto flex items-center gap-1">
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={p.days}
                  onChange={e => onUpdateAllocation(p.id, Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
                  className="h-6 w-14 text-xs"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => onDeleteAllocation(p.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {placeholders.length === 0 && hardConflicts.length === 0 && warnings.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No placeholder allocations or conflicts. Add scenario allocations using the grid above or the buttons here.
        </p>
      )}
    </div>
  );
};

export default ScenarioPanel;
