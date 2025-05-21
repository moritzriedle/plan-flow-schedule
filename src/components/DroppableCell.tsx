
import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import { DragItem } from '../types';
import { usePlanner } from '../contexts/PlannerContext';
import AllocationItem from './AllocationItem';

interface DroppableCellProps {
  employeeId: string;
  weekId: string;
}

const DroppableCell: React.FC<DroppableCellProps> = ({ employeeId, weekId }) => {
  const { allocations, moveAllocation, getTotalAllocationDays } = usePlanner();
  const [isOver, setIsOver] = useState(false);

  // Filter allocations for this employee and week
  const cellAllocations = allocations.filter(
    alloc => alloc.employeeId === employeeId && alloc.weekId === weekId
  );
  
  const totalDays = getTotalAllocationDays(employeeId, weekId);
  const isOverallocated = totalDays > 5;

  // Set up drop functionality
  const [{ isOverCurrent }, drop] = useDrop({
    accept: 'ALLOCATION',
    drop: (item: DragItem) => {
      moveAllocation(item, weekId);
      return { weekId };
    },
    hover: () => {
      setIsOver(true);
    },
    collect: (monitor) => ({
      isOverCurrent: monitor.isOver({ shallow: true }),
    }),
  });

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
      } ${isOverallocated ? 'bg-red-50' : ''}`}
    >
      <div className="mb-1 flex justify-between items-center">
        <span className={`text-xs font-medium ${isOverallocated ? 'text-red-500' : 'text-gray-500'}`}>
          {totalDays}/5 days
        </span>
        {isOverallocated && (
          <span className="text-xs text-red-500 font-bold">!</span>
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
