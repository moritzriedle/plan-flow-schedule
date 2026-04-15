import React, { useState } from 'react';
import { ScenarioAllocation, ScenarioConflict } from '@/hooks/useScenarioStore';
import { Project } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Edit2, Check, X, AlertCircle, Plus } from 'lucide-react';

interface ScenarioCellOverlayProps {
  scenarioAllocations: ScenarioAllocation[];
  conflicts: ScenarioConflict[];
  project: Project | undefined;
  onUpdate: (id: string, days: number) => void;
  onDelete: (id: string) => void;
  onAdd: (params: { employeeId: string; sprintId: string; days: number }) => void;
  employeeId: string;
  sprintId: string;
}

const ScenarioCellOverlay: React.FC<ScenarioCellOverlayProps> = ({
  scenarioAllocations,
  conflicts,
  project,
  onUpdate,
  onDelete,
  onAdd,
  employeeId,
  sprintId,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDays, setEditDays] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [addDays, setAddDays] = useState(5);

  const hasConflict = conflicts.some(c => c.type === 'hard');

  if (scenarioAllocations.length === 0 && !showAdd) {
    return (
      <div>
        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-full text-[10px] text-purple-600 hover:bg-purple-50 border border-dashed border-purple-300 rounded"
          onClick={() => setShowAdd(true)}
        >
          <Plus className="h-3 w-3 mr-0.5" />
          Scenario
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {hasConflict && (
        <div className="flex items-center gap-1 text-[10px] text-destructive">
          <AlertCircle className="h-3 w-3" />
          <span>Overallocated</span>
        </div>
      )}

      {scenarioAllocations.map(alloc => (
        <div
          key={alloc.id}
          className="flex items-center gap-1 bg-purple-100 border border-purple-300 rounded px-1.5 py-0.5 text-xs"
        >
          {editingId === alloc.id ? (
            <>
              <Input
                type="number"
                min={1}
                max={10}
                value={editDays}
                onChange={e => setEditDays(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
                className="h-5 w-12 text-xs p-0.5"
                autoFocus
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0 text-green-600"
                onClick={() => { onUpdate(alloc.id, editDays); setEditingId(null); }}
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0"
                onClick={() => setEditingId(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <>
              <span className="text-purple-800 font-medium truncate flex-1" title={project?.name}>
                {project?.name?.slice(0, 8)}{(project?.name?.length || 0) > 8 ? '…' : ''}
              </span>
              <Badge className="bg-purple-200 text-purple-800 text-[10px] px-1 py-0 h-4 font-semibold">
                {alloc.days}d
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                className="h-4 w-4 p-0 text-purple-600 hover:text-purple-800"
                onClick={() => { setEditingId(alloc.id); setEditDays(alloc.days); }}
              >
                <Edit2 className="h-2.5 w-2.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-4 w-4 p-0 text-purple-400 hover:text-destructive"
                onClick={() => onDelete(alloc.id)}
              >
                <Trash2 className="h-2.5 w-2.5" />
              </Button>
            </>
          )}
        </div>
      ))}

      {showAdd ? (
        <div className="flex items-center gap-1 bg-purple-50 border border-dashed border-purple-300 rounded px-1.5 py-0.5">
          <Input
            type="number"
            min={1}
            max={10}
            value={addDays}
            onChange={e => setAddDays(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
            className="h-5 w-12 text-xs p-0.5"
            autoFocus
          />
          <span className="text-[10px] text-muted-foreground">d</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0 text-green-600"
            onClick={() => { onAdd({ employeeId, sprintId, days: addDays }); setShowAdd(false); setAddDays(5); }}
          >
            <Check className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0"
            onClick={() => setShowAdd(false)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : scenarioAllocations.length > 0 ? (
        <Button
          size="sm"
          variant="ghost"
          className="h-4 w-full text-[9px] text-purple-500 hover:bg-purple-50 p-0"
          onClick={() => setShowAdd(true)}
        >
          <Plus className="h-2.5 w-2.5" /> more
        </Button>
      ) : null}
    </div>
  );
};

export default ScenarioCellOverlay;
