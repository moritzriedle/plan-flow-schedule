import React from 'react';
import { Project, Employee } from '@/types';
import { Scenario } from '@/hooks/useScenarioStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, X, Save, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';

interface ScenarioBannerProps {
  scenario: Scenario;
  project: Project | undefined;
  projectLead: Employee | undefined;
  isOutdated: boolean;
  conflictCount: number;
  warningCount: number;
  onSave: () => void;
  onCommit: () => void;
  onExit: () => void;
  onShift: (by: number) => void;
}

const ScenarioBanner: React.FC<ScenarioBannerProps> = ({
  scenario,
  project,
  projectLead,
  isOutdated,
  conflictCount,
  warningCount,
  onSave,
  onCommit,
  onExit,
  onShift,
}) => {
  return (
    <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 py-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Badge className="bg-white/20 text-white border-white/30 text-xs font-semibold">
            PRE-G2 SCENARIO
          </Badge>
          <span className="font-semibold text-sm">{project?.name || 'Unknown Project'}</span>
          {projectLead && (
            <span className="text-xs text-white/80">Lead: {projectLead.name}</span>
          )}
          {scenario.sprintShift !== 0 && (
            <Badge variant="outline" className="border-white/40 text-white text-xs">
              Shifted {scenario.sprintShift > 0 ? '+' : ''}{scenario.sprintShift} sprint(s)
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isOutdated && (
            <Badge variant="destructive" className="text-xs flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Scenario may be outdated
            </Badge>
          )}

          {conflictCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {conflictCount} conflict{conflictCount !== 1 ? 's' : ''}
            </Badge>
          )}

          {warningCount > 0 && (
            <Badge className="bg-amber-500 text-white text-xs">
              {warningCount} warning{warningCount !== 1 ? 's' : ''}
            </Badge>
          )}

          {/* Shift controls */}
          <div className="flex items-center gap-1 border-l border-white/30 pl-2 ml-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-white hover:bg-white/20 px-2 text-xs"
              onClick={() => onShift(-1)}
              title="Shift scenario -1 sprint"
            >
              <ChevronLeft className="h-3 w-3 mr-1" />−1
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-white hover:bg-white/20 px-2 text-xs"
              onClick={() => onShift(1)}
              title="Shift scenario +1 sprint"
            >
              +1<ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>

          <div className="flex items-center gap-1 border-l border-white/30 pl-2 ml-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-white hover:bg-white/20 gap-1 text-xs"
              onClick={onSave}
            >
              <Save className="h-3 w-3" /> Save
            </Button>
            <Button
              size="sm"
              className="h-7 bg-white text-purple-700 hover:bg-white/90 gap-1 text-xs font-semibold"
              onClick={onCommit}
            >
              <CheckCircle className="h-3 w-3" /> Commit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-white hover:bg-white/20 px-2"
              onClick={onExit}
              title="Exit scenario mode"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioBanner;
