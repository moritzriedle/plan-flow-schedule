
import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import { DragItem } from '../types';
import { usePlanner } from '../contexts/PlannerContext';
import AllocationItem from './AllocationItem';
import { Loader2 } from 'lucide-react';

interface DroppableCellProps {
  employeeId: string;
  weekId: string;
  granularity?: string;
}

const DroppableCell: React.FC<DroppableCellProps> = ({ employeeId, weekId, granularity }) => {
  const { allocations, moveAllocation, getTotalAllocationDays } = usePlanner();
  const [isOver, setIsOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter allocations for this employee and week
  const cellAllocations = allocations.filter(
    alloc => alloc.employeeId === employeeId && alloc.weekId === weekId
  );
  
  const totalDays = getTotalAllocationDays(employeeId, weekId);
  const maxDays = granularity === 'biweekly' ? 10 : granularity === 'monthly' ? 20 : 5;
  const isOverallocated = totalDays > maxDays;

  // Set up drop functionality
  const [{ isOverCurrent }, drop] = useDrop({
    accept: 'ALLOCATION',
    drop: (item: DragItem) => {
      handleDrop(item);
      return { weekId };
    },
    hover: () => {
      setIsOver(true);
    },
    collect: (monitor) => ({
      isOverCurrent: monitor.isOver({ shallow: true }),
    }),
  });

  const handleDrop = async (item: DragItem) => {
    setIsProcessing(true);
    
    try {
      console.log('Dropping item:', item, 'to week:', weekId, 'for employee:', employeeId);
      
      // Ensure we have the correct employee ID for new allocations
      const dragItemWithEmployee = {
        ...item,
        employeeId: employeeId // Always use the target cell's employee ID
      };
      
      await moveAllocation(dragItemWithEmployee, weekId, granularity);
      console.log('Drop successful, allocation updated');
    } catch (error) {
      console.error('Drop failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  React.useEffect(() => {
    if (!isOverCurrent) {
      setIsOver(false);
    }
  }, [isOverCurrent]);

  return (
    <div
      ref={drop}
      className={`droppable-cell p-2 h-full min-h-[120px] border-r border-b ${
        isOver ? 'active bg-primary/10' : ''
      } ${isOverallocated ? 'bg-red-50' : ''} ${isProcessing ? 'bg-gray-50' : ''}`}
    >
      <div className="mb-1 flex justify-between items-center">
        <span className={`text-xs font-medium ${isOverallocated ? 'text-red-500' : 'text-gray-500'}`}>
          {totalDays}/{maxDays} days
        </span>
        {isOverallocated && (
          <span className="text-xs text-red-500 font-bold">!</span>
        )}
        {isProcessing && (
          <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
        )}
      </div>
      
      {cellAllocations.map((allocation) => (
        <AllocationItem
          key={allocation.id}
          id={allocation.id}
          employeeId={allocation.employeeId}
          projectId={allocation.projectId}
          days={allocation.days}
          weekId={allocation.weekId}
        />
      ))}
    </div>
  );
};

export default DroppableCell;
