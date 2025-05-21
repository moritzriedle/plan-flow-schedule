
import React, { useRef } from 'react';
import { useDrag } from 'react-dnd';
import { DragItem } from '../types';
import { usePlanner } from '../contexts/PlannerContext';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface AllocationItemProps {
  id: string;
  employeeId: string;
  projectId: string;
  days: number;
  weekId: string;
}

const AllocationItem: React.FC<AllocationItemProps> = ({ 
  id, 
  employeeId, 
  projectId, 
  days, 
  weekId 
}) => {
  const { getProjectById, deleteAllocation } = usePlanner();
  const project = getProjectById(projectId);
  
  const ref = useRef<HTMLDivElement>(null);
  
  const [{ isDragging }, drag] = useDrag({
    type: 'ALLOCATION',
    item: { 
      type: 'ALLOCATION', 
      id, 
      employeeId, 
      projectId, 
      days,
      sourceWeekId: weekId 
    } as DragItem,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  if (!project) return null;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteAllocation(id);
  };

  // Apply styles based on the drag state
  const opacity = isDragging ? 0.4 : 1;

  drag(ref);

  return (
    <Card 
      ref={ref}
      className={`allocation-item mb-2 p-2 border-l-4 bg-white shadow-sm hover:shadow-md ${
        isDragging ? 'opacity-40' : 'opacity-100'
      }`}
      style={{ 
        borderLeftColor: `var(--project-${project.color})`,
        backgroundColor: `rgba(var(--project-${project.color}-rgb), 0.05)`,
        opacity
      }}
    >
      <div className="flex justify-between items-center">
        <div>
          <div className="font-medium text-sm">{project.name}</div>
          <Badge 
            variant="outline" 
            className="mt-1"
            style={{ 
              color: `var(--project-${project.color})`,
              borderColor: `var(--project-${project.color})`
            }}
          >
            {days} {days === 1 ? 'day' : 'days'}
          </Badge>
        </div>
        <button 
          onClick={handleDelete}
          className="text-gray-400 hover:text-red-500 transition-colors"
        >
          &times;
        </button>
      </div>
    </Card>
  );
};

export default AllocationItem;
