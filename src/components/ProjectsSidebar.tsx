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
}

const DraggableProjectItem: React.FC<DraggableProjectItemProps> = ({ 
  project, 
  onTimelineOpen 
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
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-sm truncate flex-1">{project.name}</h4>
        {onTimelineOpen && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 ml-2 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onTimelineOpen(project);
            }}
          >
            <Eye className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        <Badge 
          variant="outline" 
          className="text-xs"
          style={{ 
            color: `var(--project-${project.color})`,
            borderColor: `var(--project-${project.color})`
          }}
        >
          {project.color}
        </Badge>
        
        {project.leadId && (
          <div className="text-xs text-gray-500">
            Lead assigned
          </div>
        )}
      </div>
      
      {project.ticketReference && (
        <div className="mt-2 text-xs text-blue-600">
          {project.ticketReference}
        </div>
      )}
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

  // Sort projects alphabetically and filter by search term
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects;
    
    // Filter by search term if provided
    if (searchTerm.trim()) {
      filtered = projects.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort alphabetically by name
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
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
            {/* Existing draggable project item */}
            <DraggableProjectItem 
              project={project} 
              onTimelineOpen={onProjectTimelineOpen}
            />
            
            {/* Quick allocation button */}
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
