
import React, { useState } from 'react';
import { usePlanner } from '@/contexts/PlannerContext';
import { useDrag } from 'react-dnd';
import { DragItem, Project } from '@/types';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import ProjectTimelineView from './ProjectTimelineView';

const ProjectItem: React.FC<{ 
  id: string; 
  name: string; 
  color: string;
  onClick: () => void;
}> = ({ id, name, color, onClick }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'ALLOCATION',
    item: { 
      type: 'ALLOCATION', 
      projectId: id, 
      days: 3 // Default 3 days for new allocations
    } as DragItem,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div 
      ref={drag}
      className={`allocation-item cursor-grab ${isDragging ? 'opacity-40' : ''}`}
      onClick={onClick}
    >
      <Card 
        className="mb-2 p-3 border-l-4 hover:shadow-md transition-shadow"
        style={{ 
          borderLeftColor: `var(--project-${color})`,
          backgroundColor: `rgba(var(--project-${color}-rgb), 0.05)`,
        }}
      >
        <h4 className="font-medium text-sm">{name}</h4>
        <p className="text-xs text-gray-500 mt-1">Drag to allocate or click for details</p>
      </Card>
    </div>
  );
};

const ProjectsSidebar: React.FC = () => {
  const { projects, getProjectById } = usePlanner();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  const selectedProject = selectedProjectId ? getProjectById(selectedProjectId) : null;

  return (
    <>
      <div className="w-64 border-r bg-white p-4 flex flex-col h-full">
        <h2 className="font-bold mb-4">Projects</h2>
        <p className="text-sm text-gray-500 mb-4">Drag projects to allocate resources or click for details</p>

        <Separator className="mb-4" />
        
        <div className="space-y-1">
          {projects.map(project => (
            <ProjectItem 
              key={project.id}
              id={project.id}
              name={project.name}
              color={project.color}
              onClick={() => setSelectedProjectId(project.id)}
            />
          ))}
        </div>
        
        <div className="mt-auto">
          <Separator className="my-4" />
          <div className="text-xs text-gray-500">
            <h3 className="font-medium mb-2">Project Timelines</h3>
            {projects.map(project => (
              <div 
                key={project.id} 
                className="mb-2 cursor-pointer"
                onClick={() => setSelectedProjectId(project.id)}
              >
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: `var(--project-${project.color})` }}
                  ></div>
                  <span className="font-medium">{project.name}</span>
                </div>
                <p className="ml-5 text-xs text-gray-400">
                  Ends {formatDistanceToNow(project.endDate, { addSuffix: true })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <ProjectTimelineView 
        project={selectedProject as Project}
        isOpen={!!selectedProjectId}
        onClose={() => setSelectedProjectId(null)}
      />
    </>
  );
};

export default ProjectsSidebar;
