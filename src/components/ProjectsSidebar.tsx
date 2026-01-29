import React, { useMemo, useState } from 'react';
import { useDrag } from 'react-dnd';
import { usePlanner } from '../contexts/PlannerContext';
import { Project, Employee } from '../types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';

interface DraggableProjectItemProps {
  project: Project;
  employees: Employee[];
}

// Helper to generate Jira ticket URL
const generateLink = (ticketRef: string) => {
  if (!ticketRef.trim()) return null;
  const projectKey = ticketRef.split('-')[0];
  return `https://proglove.atlassian.net/jira/polaris/projects/${projectKey}/ideas/view/3252935?selectedIssue=${ticketRef.trim()}`;
};

const DraggableProjectItem: React.FC<DraggableProjectItemProps> = ({ project, employees }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'ALLOCATION',
    item: {
      type: 'PROJECT',
      projectId: project.id,
      name: project.name,
      color: project.color,
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const lead = project.leadId ? employees.find((emp) => emp.id === project.leadId) : null;
  const leadName = lead ? lead.name : null;

  return (
    <Card
      ref={drag}
      className={`p-3 cursor-move border-l-4 hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-40' : 'opacity-100'
      }`}
      style={{
        borderLeftColor: `var(--project-${project.color})`,
        backgroundColor: `rgba(var(--project-${project.color}-rgb), 0.05)`,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <div className="flex justify-between items-start">
        {/* Left side */}
        <div className="flex flex-col flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{project.name}</h4>
          <div className="text-xs text-gray-500 truncate">
            {leadName ? leadName : 'No lead assigned'}
          </div>
        </div>

        {/* Right side */}
        <div className="flex flex-col items-end ml-2 flex-shrink-0">
          {project.ticketReference && (
            <a
              href={generateLink(project.ticketReference) || undefined}
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

const ProjectsSidebar: React.FC = () => {
  const { projects = [], employees = [] } = usePlanner();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [employeeSearch, setEmployeeSearch] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(''); // informational only
  const [showArchived, setShowArchived] = useState<boolean>(false);

  const filteredAndSortedProjects = useMemo(() => {
    try {
      let filtered = (projects || []).filter(
        (project: Project) => project && project.name && typeof project.name === 'string'
      );

      if (!showArchived) filtered = filtered.filter((p: Project) => !p.archived);

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        filtered = filtered.filter((p: Project) => p.name.toLowerCase().includes(q));
      }

      return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('ProjectsSidebar: Error filtering/sorting projects', error);
      return [];
    }
  }, [projects, searchTerm, showArchived]);

  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return [];
    const q = employeeSearch.toLowerCase();
    return (employees || []).filter(
      (emp: Employee) => emp.name.toLowerCase().includes(q) || emp.role.toLowerCase().includes(q)
    );
  }, [employees, employeeSearch]);

  const selectedEmployee = useMemo(
    () => employees.find((e: Employee) => e.id === selectedEmployeeId) || null,
    [employees, selectedEmployeeId]
  );

  return (
    <div className="space-y-2">
      {/* Project Search */}
      <div className="mb-4">
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

      {/* Show Archived Toggle */}
      <div className="flex items-center space-x-2 mb-4">
        <input
          type="checkbox"
          id="showArchived"
          checked={showArchived}
          onChange={(e) => setShowArchived(e.target.checked)}
          className="w-4 h-4"
        />
        <Label htmlFor="showArchived" className="cursor-pointer text-sm">
          Show archived projects
        </Label>
      </div>

      {/* Optional employee selection (context only) */}
      <div className="mb-2">
        <label className="text-sm font-medium mb-2 block">Selected Team Member (optional)</label>
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
                  {filteredEmployees.map((employee: Employee) => (
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

        {selectedEmployee && (
          <div className="mt-2 text-xs text-muted-foreground">
            Selected: <span className="font-medium text-foreground">{selectedEmployee.name}</span>
          </div>
        )}
      </div>

      {/* Projects List */}
      {filteredAndSortedProjects.length === 0 && searchTerm ? (
        <div className="text-sm text-gray-500 text-center py-4">
          No projects found matching "{searchTerm}"
        </div>
      ) : (
        filteredAndSortedProjects.map((project: Project) => (
          <div key={project.id} className="space-y-1">
            <div className={project.archived ? 'opacity-50' : ''}>
              <DraggableProjectItem project={project} employees={employees} />
              {project.archived && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  Archived
                </Badge>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ProjectsSidebar;
