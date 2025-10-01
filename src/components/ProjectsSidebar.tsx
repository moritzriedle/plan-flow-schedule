import React, { useState, useMemo } from 'react';
import { useDrag } from 'react-dnd';
import { usePlanner } from '../contexts/PlannerContext';
import { Project, Employee, Sprint } from '../types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Eye, Search } from 'lucide-react';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem
} from "@/components/ui/command";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

// ✅ Helper to generate Jira ticket URL
const generateLink = (ticketRef: string) => {
  if (!ticketRef?.trim()) return null;
  const projectKey = ticketRef.split('-')[0];
  return `https://proglove.atlassian.net/jira/polaris/projects/${projectKey}/ideas/view/3252935?selectedIssue=${ticketRef.trim()}`;
};

interface DraggableProjectItemProps {
  project: Project;
  onTimelineOpen?: (project: Project) => void;
  employees: Employee[];
}

const DraggableProjectItem: React.FC<DraggableProjectItemProps> = ({
  project,
  onTimelineOpen,
  employees
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'ALLOCATION',
    item: {
      type: 'PROJECT',
      projectId: project.id,
      name: project.name,
      color: project.color
    },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  const lead = project.leadId ? employees.find(emp => emp.id === project.leadId) : null;

  return (
    <Card
      ref={drag}
      className={`p-3 cursor-move border-l-4 hover:shadow-md transition-shadow ${isDragging ? 'opacity-40' : 'opacity-100'}`}
      style={{
        borderLeftColor: `var(--project-${project.color})`,
        backgroundColor: `rgba(var(--project-${project.color}-rgb), 0.05)`,
      }}
    >
      <div className="flex justify-between items-start mb-1">
        <div className="flex flex-col flex-1">
          <h4 className="font-medium text-sm truncate">{project.name}</h4>
          <div className="text-xs text-gray-500 truncate">
            {lead ? lead.name : 'No lead assigned'}
          </div>
        </div>

        <div className="flex flex-col items-end ml-2">
          {onTimelineOpen && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 mb-1"
              onClick={(e) => {
                e.stopPropagation();
                onTimelineOpen(project);
              }}
            >
              <Eye className="h-3 w-3" />
            </Button>
          )}
          {project.ticketReference && (
            <a
              href={generateLink(project.ticketReference) ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-blue-600 hover:underline"
            >
              {project.ticketReference}
            </a>
          )}
        </div>
      </div>
    </Card>
  );
};

interface ProjectsSidebarProps {
  onProjectTimelineOpen?: (project: Project) => void;
  onDetailedAllocation?: (employee: Employee, project: Project) => void;
}

const ProjectsSidebar: React.FC<ProjectsSidebarProps> = ({
  onProjectTimelineOpen,
  onDetailedAllocation
}) => {
  // ⬇️ Pull ops from Planner (these should be surfaced from your useAllocationOperations hook)
  const {
    projects = [],
    employees = [],
    sprints = [],
    addAllocation,
    getAvailableDays,
    getTotalAllocationDays,
  } = usePlanner();

  // Who to allocate
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [employeeSearch, setEmployeeSearch] = useState<string>('');

  // Sprint-level quick allocation state
  const [selectedSprintId, setSelectedSprintId] = useState<string>('');
  const [sprintDays, setSprintDays] = useState<string>(''); // keep as string for input
  const [isAllocating, setIsAllocating] = useState<string | null>(null); // projectId while allocating

  // Search
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredAndSortedProjects = useMemo(() => {
    try {
      if (!Array.isArray(projects)) return [];
      let filtered = projects.filter(p => p && typeof p.name === 'string');
      if (searchTerm.trim()) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
      }
      return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    } catch (e) {
      console.error('ProjectsSidebar: filter/sort error', e);
      return [];
    }
  }, [projects, searchTerm]);

  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return [];
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        emp.role.toLowerCase().includes(employeeSearch.toLowerCase())
    );
  }, [employees, employeeSearch]);

  const selectedSprint: Sprint | undefined = useMemo(
    () => sprints.find(s => s.id === selectedSprintId),
    [sprints, selectedSprintId]
  );

  const selectedEmployeeName =
    selectedEmployeeId ? (employees.find(e => e.id === selectedEmployeeId)?.name ?? '') : '';

  // ⚖️ Capacity math (hook-aware): available working days minus current allocations
  const capacity = useMemo(() => {
    if (!selectedEmployeeId || !selectedSprint) return { available: 0, allocated: 0, remaining: 0 };
    const available = getAvailableDays(selectedEmployeeId, selectedSprint); // working days excluding vacation
    const allocated = getTotalAllocationDays(selectedEmployeeId, selectedSprint); // across all projects
    const remaining = Math.max(available - allocated, 0);
    return { available, allocated, remaining };
  }, [selectedEmployeeId, selectedSprint, getAvailableDays, getTotalAllocationDays]);

  const handleDetailedAllocation = (project: Project) => {
    if (!selectedEmployeeId || !onDetailedAllocation) return;
    const employee = employees.find(emp => emp.id === selectedEmployeeId);
    if (employee) onDetailedAllocation(employee, project);
  };

  // Sprint quick allocation handler
  const handleSprintQuickAllocate = async (projectId: string) => {
    if (!selectedEmployeeId || !selectedSprintId || !sprintDays) return;
    const days = parseInt(sprintDays, 10);
    if (Number.isNaN(days) || days <= 0) return;
    if (days > capacity.remaining) return; // Guard against over-allocation

    try {
      setIsAllocating(projectId);
      await addAllocation({
        employeeId: selectedEmployeeId,
        projectId,
        sprintId: selectedSprintId,
        days,
      });
      // Keep sprint selection; clear the input for fast repeated allocations
      setSprintDays('');
    } finally {
      setIsAllocating(null);
    }
  };

  const sprintLabel = (s: Sprint) => {
    const range = (s.startDate && s.endDate)
      ? ` — ${format(new Date(s.startDate), 'MMM d')}–${format(new Date(s.endDate), 'MMM d')}`
      : '';
    return `${s.name ?? `Sprint ${s.id}`}${range}`;
  };

  const daysNum = Number(sprintDays || 0);
  const disableQuickAllocateGlobal =
    !selectedEmployeeId || !selectedSprintId || !daysNum || daysNum <= 0 || daysNum > capacity.remaining;

  return (
    <div className="space-y-3">
      {/* Project Search */}
      <div className="mb-2">
        <label className="text-sm font-medium mb-2 block">Search Projects:</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Type project name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Employee selector */}
      <div className="mb-2">
        <label className="text-sm font-medium mb-2 block">Allocate to Team Member:</label>
        <Command className="border rounded-md">
          <CommandInput
            placeholder="Type to search team member..."
            value={employeeSearch}
            onValueChange={setEmployeeSearch}
          />
          <CommandList>
            {employeeSearch.trim() ? (
              <>
                <CommandEmpty>No team member found.</CommandEmpty>
                <CommandGroup>
                  {filteredEmployees.map((employee) => (
                    <CommandItem
                      key={employee.id}
                      value={employee.name}
                      onSelect={() => {
                        setSelectedEmployeeId(employee.id);
                        setEmployeeSearch(employee.name);
                      }}
                    >
                      {employee.name}{' '}
                      <span className="text-xs text-gray-500 ml-1">({employee.role})</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
        </Command>
      </div>

      {/* Sprint + Days */}
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-1">
          <label className="text-sm font-medium mb-2 block">Sprint</label>
          <Select value={selectedSprintId} onValueChange={setSelectedSprintId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select sprint…" />
            </SelectTrigger>
            <SelectContent>
              {sprints.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {sprintLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-1">
          <label className="text-sm font-medium mb-2 block">Days in sprint</label>
          <Input
            type="number"
            min={0}
            step={1}
            placeholder="e.g., 5"
            value={sprintDays}
            onChange={(e) => setSprintDays(e.target.value)}
          />
          {/* Capacity hint */}
          {selectedEmployeeId && selectedSprint && (
            <div className="mt-1 text-[11px] text-gray-500">
              Available working days: <strong>{capacity.available}</strong> •
              Allocated: <strong>{capacity.allocated}</strong> •
              Remaining: <strong>{capacity.remaining}</strong>
              {daysNum > capacity.remaining && (
                <span className="text-red-600 ml-1">({daysNum} exceeds remaining)</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Projects List */}
      {filteredAndSortedProjects.length === 0 && searchTerm ? (
        <div className="text-sm text-gray-500 text-center py-4">
          No projects found matching "{searchTerm}"
        </div>
      ) : (
        filteredAndSortedProjects.map((project) => {
          const disabledPerRow = disableQuickAllocateGlobal || isAllocating === project.id;

          return (
            <div key={project.id} className="space-y-1">
              <DraggableProjectItem
                project={project}
                onTimelineOpen={onProjectTimelineOpen}
                employees={employees}
              />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => handleDetailedAllocation(project)}
                  disabled={!selectedEmployeeId}
                >
                  Detailed allocation{selectedEmployeeName ? ` for ${selectedEmployeeName}` : ''}
                </Button>

                <Button
                  size="sm"
                  className="flex-1 text-xs"
                  disabled={disabledPerRow}
                  onClick={() => handleSprintQuickAllocate(project.id)}
                >
                  {isAllocating === project.id ? 'Allocating…' : 'Quick allocate to sprint'}
                </Button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default ProjectsSidebar;
