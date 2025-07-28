import React, { useState, useMemo } from 'react';
import { useDrag } from 'react-dnd';
import { usePlanner } from '../contexts/PlannerContext';
import { Project, Employee } from '../types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Eye, Calendar, Search } from 'lucide-react';

interface DraggableProjectItemProps {
  project: Project;
  onTimelineOpen?: (project: Project) => void;
  employees: Employee[];  
}

// ✅ Helper to generate Jira ticket URL
const generateLink = (ticketRef: string) => {
  if (!ticketRef.trim()) return null;
  const projectKey = ticketRef.split('-')[0];
  return `https://proglove.atlassian.net/jira/polaris/projects/${projectKey}/ideas/view/3252935?selectedIssue=${ticketRef.trim()}`;
};

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
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const lead = project.leadId 
    ? employees.find(emp => emp.id === project.leadId) 
    : null;
  const leadName = lead ? lead.name : null;

  const opacity = isDragging ? 0.4 : 1;
  
return (
  <Card 
    ref={drag}
    className={`p-3 cursor-move border-l-4 hover:shadow-md transition-shadow ${
      isDragging ? 'opacity-40' : 'opacity-100'
    }`}
    style={{ 
      borderLeftColor: `var(--project-${project.color})`,
      backgroundColor: `rgba(var(--project-${project.color}-rgb), 0.05)`,
      opacity
    }}
  >
    <div className="flex justify-between items-start mb-1">
      {/* Left side: Project name + lead */}
      <div className="flex flex-col flex-1">
        <h4 className="font-medium text-sm truncate">{project.name}</h4>
        <div className="text-xs text-gray-500 truncate">
          {leadName ? leadName : 'No lead assigned'}
        </div>
      </div>

      {/* Right side: Eye button + Jira ticket */}
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
            href={generateLink(project.ticketReference)}
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
  const { projects = [], employees = [] } = usePlanner();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredAndSortedProjects = useMemo(() => {
    try {
      if (!Array.isArray(projects)) {
        console.warn('ProjectsSidebar: projects is not an array', projects);
        return [];
      }
      
      let filtered = projects.filter(project => 
        project && 
        project.name && 
        typeof project.name === 'string'
      );
      
      if (searchTerm.trim()) {
        filtered = filtered.filter(project =>
          project.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('ProjectsSidebar: Error filtering/sorting projects', error);
      return [];
    }
  }, [projects, searchTerm]);

  const handleDetailedAllocation = (project: Project) => {
    if (selectedEmployeeId && onDetailedAllocation) {
      const employee = employees.find(emp => emp.id === selectedEmployeeId);
      if (employee) {
        onDetailedAllocation(employee, project);
      }
    }
  };

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

      {/* Employee selector for detailed allocation */}
      <div className="mb-4">
        <label className="text-sm font-medium mb-2 block">Quick Allocate:</label>
        <select 
          value={selectedEmployeeId}
          onChange={(e) => setSelectedEmployeeId(e.target.value)}
          className="w-full p-2 border rounded text-sm"
        >
          <option value="">Select team member...</option>
          {employees.map(employee => (
            <option key={employee.id} value={employee.id}>
              {employee.name} ({employee.role})
            </option>
          ))}
        </select>
      </div>

      {/* Projects List */}
      {filteredAndSortedProjects.length === 0 && searchTerm ? (
        <div className="text-sm text-gray-500 text-center py-4">
          No projects found matching "{searchTerm}"
        </div>
      ) : (
        filteredAndSortedProjects.map((project) => (
          <div key={project.id} className="space-y-1">
            <DraggableProjectItem 
              project={project} 
              onTimelineOpen={onProjectTimelineOpen}
              employees={employees}
            />
            {selectedEmployeeId && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => handleDetailedAllocation(project)}
              >
                Allocate to {project.name}
              </Button>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default ProjectsSidebar;
