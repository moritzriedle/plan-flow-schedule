
import React, { useRef, useState } from 'react';
import { useDrag } from 'react-dnd';
import { DragItem } from '../types';
import { usePlanner } from '../contexts/PlannerContext';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Loader2 } from 'lucide-react';

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
  const { getProjectById, deleteAllocation, updateAllocation } = usePlanner();
  const project = getProjectById(projectId);
  const [isUpdating, setIsUpdating] = useState(false);
  
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

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUpdating(true);
    
    try {
      await deleteAllocation(id);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleIncreaseDays = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (days < 5 && !isUpdating) {
      setIsUpdating(true);
      
      try {
        await updateAllocation({
          id,
          employeeId,
          projectId,
          weekId,
          days: days + 1
        });
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleDecreaseDays = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (days > 1 && !isUpdating) {
      setIsUpdating(true);
      
      try {
        await updateAllocation({
          id,
          employeeId,
          projectId,
          weekId,
          days: days - 1
        });
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const opacity = isDragging ? 0.4 : 1;

  drag(ref);

  return (
    <Card 
      ref={ref}
      className={`allocation-item mb-1 p-1.5 border-l-4 bg-white shadow-sm hover:shadow-md ${
        isDragging ? 'opacity-40' : 'opacity-100'
      } ${isUpdating ? 'bg-gray-50' : ''}`}
      style={{ 
        borderLeftColor: `var(--project-${project.color})`,
        backgroundColor: `rgba(var(--project-${project.color}-rgb), 0.05)`,
        opacity
      }}
    >
      <div className="flex justify-between items-center">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-xs truncate">{project.name}</div>
          <div className="flex items-center gap-1 mt-1">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-4 w-4 rounded-full p-0"
              onClick={handleDecreaseDays}
              disabled={days <= 1 || isUpdating}
            >
              <Minus className="h-2 w-2" />
            </Button>
            
            <Badge 
              variant="outline" 
              className="px-1 py-0 h-4 text-xs"
              style={{ 
                color: `var(--project-${project.color})`,
                borderColor: `var(--project-${project.color})`
              }}
            >
              {days}d
            </Badge>
            
            <Button 
              variant="outline" 
              size="icon" 
              className="h-4 w-4 rounded-full p-0"
              onClick={handleIncreaseDays}
              disabled={days >= 5 || isUpdating}
            >
              <Plus className="h-2 w-2" />
            </Button>
          </div>
        </div>
        {isUpdating ? (
          <Loader2 className="h-3 w-3 animate-spin text-gray-400 flex-shrink-0" />
        ) : (
          <button 
            onClick={handleDelete}
            className="text-gray-400 hover:text-red-500 transition-colors text-xs flex-shrink-0 ml-1"
            disabled={isUpdating}
          >
            &times;
          </button>
        )}
      </div>
    </Card>
  );
};

export default AllocationItem;
