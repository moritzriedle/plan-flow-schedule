import React, { useState, useMemo } from 'react';
import { Project } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';

interface ScenarioProjectSelectorProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projects: Project[];
  onSelect: (projectId: string) => void;
}

const ScenarioProjectSelector: React.FC<ScenarioProjectSelectorProps> = ({
  open,
  onOpenChange,
  projects,
  onSelect,
}) => {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const active = projects.filter(p => !p.archived);
    if (!search.trim()) return active.slice(0, 50);
    const q = search.toLowerCase();
    return active.filter(p => p.name.toLowerCase().includes(q)).slice(0, 50);
  }, [projects, search]);

  const handleConfirm = () => {
    if (selectedId) {
      onSelect(selectedId);
      onOpenChange(false);
      setSelectedId(null);
      setSearch('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Pre-G2 Planning</DialogTitle>
          <DialogDescription>
            Select a project to start scenario planning. You can plan ideal staffing and compare against real allocations.
          </DialogDescription>
        </DialogHeader>

        <Command className="border rounded-md">
          <CommandInput placeholder="Search project..." value={search} onValueChange={setSearch} />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No projects found.</CommandEmpty>
            <CommandGroup>
              {filtered.map(p => (
                <CommandItem
                  key={p.id}
                  value={p.name}
                  onSelect={() => {
                    setSelectedId(p.id);
                    setSearch(p.name);
                  }}
                  className={selectedId === p.id ? 'bg-accent' : ''}
                >
                  <span className="truncate">{p.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>

        {selectedId && (
          <div className="text-sm text-muted-foreground">
            Selected: <span className="font-medium text-foreground">{projects.find(p => p.id === selectedId)?.name}</span>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!selectedId}>Start Planning</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScenarioProjectSelector;
