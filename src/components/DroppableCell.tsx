import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import { DragItem } from '../types';
import { usePlanner } from '../contexts/PlannerContext';
import AllocationItem from './AllocationItem';
import { Loader2 } from 'lucide-react';

interface DroppableCellProps {
  employeeId: string;
  sprintId: string;
}

const DroppableCell: React.FC<DroppableCellProps> = ({ employeeId, sprintId }) => {
  const { allocations, moveAllocation, getTotalAllocationDays, getAvailableDays } = usePlanner();
  const [isOver, setIsOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter allocations for this employee and sprint
  const cellAllocations = allocations.filter(
    alloc => alloc.employeeId === employeeId && alloc.sprintId === sprintId
  );
  
  const totalDays = getTotalAllocationDays(employeeId, sprintId);
  const availableDays = getAvailableDays(employeeId, sprintId);
  const isOverallocated = totalDays > availableDays;

  // Set up drop functionality
  const [{ isOverCurrent }, drop] = useDrop({
    accept: 'ALLOCATION',
    drop: (item: DragItem) => {
      handleDrop(item);
      return { sprintId };
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
      console.log('Dropping item:', item, 'to sprint:', sprintId, 'for employee:', employeeId);
      
      // Calculate days for new allocations (default to 10 for sprints)
      let allocationDays = item.days;
      if (!item.sourceSprintId) { // New allocation from project drag
        allocationDays = 10;
      }
      
      // Ensure we have the correct employee ID for new allocations
      const dragItemWithEmployee = {
        ...item,
        employeeId: employeeId,
        days: allocationDays
      };
      
      await moveAllocation(dragItemWithEmployee, sprintId);
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
          {totalDays}/{availableDays} days
        </span>
        {isOverallocated && (
          <span className="text-xs text-red-500 font-bold">!</span>
        )}
        {isProcessing && (
          <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
        )}
      </div>
      
      {availableDays < 10 && (
        <div className="text-xs text-orange-500 mb-1">
          {10 - availableDays} vacation days
        </div>
      )}
      
      {cellAllocations.map((allocation) => (
        <AllocationItem
          key={allocation.id}
          id={allocation.id}
          employeeId={allocation.employeeId}
          projectId={allocation.projectId}
          days={allocation.days}
          sprintId={allocation.sprintId}
        />
      ))}
    </div>
  );
};

export default DroppableCell;
