import React from 'react';
import { Scenario } from '@/hooks/useScenarioStore';
import { Project } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Play } from 'lucide-react';

interface SavedScenariosDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  scenarios: Scenario[];
  projects: Project[];
  onLoad: (projectId: string) => void;
}

const SavedScenariosDialog: React.FC<SavedScenariosDialogProps> = ({
  open,
  onOpenChange,
  scenarios,
  projects,
  onLoad,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Saved Scenarios</DialogTitle>
          <DialogDescription>
            Draft scenarios that have been saved for later. Click to resume planning.
          </DialogDescription>
        </DialogHeader>

        {scenarios.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No saved scenarios yet.</p>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {scenarios.map(s => {
              const project = projects.find(p => p.id === s.projectId);
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 border rounded-md hover:bg-accent/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="font-medium text-sm">{project?.name || 'Unknown Project'}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">Draft</Badge>
                      {s.lastSavedAt && (
                        <span>Saved {format(new Date(s.lastSavedAt), 'MMM d, yyyy HH:mm')}</span>
                      )}
                      {s.sprintShift !== 0 && (
                        <span>Shifted {s.sprintShift > 0 ? '+' : ''}{s.sprintShift}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => { onLoad(s.projectId); onOpenChange(false); }}
                  >
                    <Play className="h-3 w-3" /> Resume
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SavedScenariosDialog;
