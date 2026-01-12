import React, { useState, useEffect, useMemo } from 'react';
import { useDrop } from 'react-dnd';
import { DragItem, Sprint } from '../types';
import { usePlanner } from '../contexts/PlannerContext';
import AllocationItem from './AllocationItem';
import { Loader2 } from 'lucide-react';

interface DroppableCellProps {
  employeeId: string;
  sprintId: string;
  sprint: Sprint;
}

const DroppableCell: React.FC<DroppableCellProps> = ({ employeeId, sprintId, sprint }) => {
  const {
    allocations,
    moveAllocation,
    getTotalAllocationDays,
    getAvailableDays,
    getEmployeeById,
  } = usePlanner();

  const [isOver, setIsOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const employee = getEmployeeById(employeeId);
  const isEmployeeArchived = employee?.archived || false;

  const cellAllocations = useMemo(
    () => allocations.filter((alloc) => alloc.employeeId === employeeId && alloc.sprintId === sprintId),
    [allocations, employeeId, sprintId]
  );

  const totalDays = getTotalAllocationDays(employeeId, sprint);
  const availableDays = getAvailableDays(employeeId, sprint);

  const isOverallocated = totalDays > availableDays;
  const utilizationPct =
    availableDays <= 0 ? 0 : Math.min(150, Math.round((totalDays / availableDays) * 100)); // cap visual

  const [{ isOverCurrent }, drop] = useDrop({
    accept: 'ALLOCATION',
    canDrop: () => !isEmployeeArchived && !isProcessing,
    drop: (item: DragItem) => {
      if (isEmployeeArchived || isProcessing) return;
      handleDrop(item);
      return { sprintId };
    },
    hover: () => {
      if (!isEmployeeArchived && !isProcessing) setIsOver(true);
    },
    collect: (monitor) => ({
      isOverCurrent: monitor.isOver({ shallow: true }),
    }),
  });

  const handleDrop = async (item: DragItem) => {
    setIsProcessing(true);
    try {
      const allocationDays = item.days ?? 10;

      const dragItemWithEmployee = {
        ...item,
        employeeId,
        days: allocationDays,
      };

      await moveAllocation(dragItemWithEmployee, sprintId);
    } catch (error) {
      console.error('Drop failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!isOverCurrent) setIsOver(false);
  }, [isOverCurrent]);

  // Utility: count vacation dates within sprint working days
  const vacationCount = useMemo(() => {
    if (!employee?.vacationDates || !Array.isArray(employee.vacationDates)) return 0;
    if (!sprint?.workingDays || !Array.isArray(sprint.workingDays)) return 0;

    const sprintDays = new Set(sprint.workingDays.map((d) => new Date(d).toDateString()));
    return employee.vacationDates.filter((dateStr) => sprintDays.has(new Date(dateStr).toDateString())).length;
  }, [employee?.vacationDates, sprint?.workingDays]);

  return (
    <div
      ref={drop}
      className={[
        'droppable-cell p-2 h-full min-h-[110px] border-r border-b relative',
        isEmployeeArchived ? 'cursor-not-allowed opacity-50 bg-gray-50' : 'bg-white',
        isOver ? 'bg-primary/5 ring-1 ring-primary/30' : '',
        isOverallocated ? 'bg-red-50' : '',
        isProcessing ? 'bg-gray-50' : '',
      ].join(' ')}
    >
      {/* Top compact meta row */}
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={[
              'text-[11px] font-medium',
              isOverallocated ? 'text-red-600' : 'text-gray-600',
            ].join(' ')}
            title={`${totalDays}/${availableDays} days`}
          >
            {totalDays}/{availableDays}
          </span>

          {/* tiny progress bar, fast to parse */}
          <div className="h-1.5 w-16 rounded bg-gray-200 overflow-hidden">
            <div
              className={[
                'h-full',
                isOverallocated ? 'bg-red-500' : utilizationPct >= 80 ? 'bg-orange-500' : 'bg-green-500',
              ].join(' ')}
              style={{ width: `${Math.min(100, utilizationPct)}%` }}
            />
          </div>

          {vacationCount > 0 && (
            <span className="text-[10px] text-amber-700 whitespace-nowrap" title="Vacation in this sprint">
              {vacationCount} vac
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {isOverallocated && <span className="text-[11px] text-red-600 font-bold" title="Overallocated">!</span>}
          {isProcessing && <Loader2 className="h-3 w-3 animate-spin text-gray-400" />}
        </div>
      </div>

      {/* Allocations list */}
      <div className="space-y-1">
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

      {/* Empty state hint (only when not archived) */}
      {cellAllocations.length === 0 && !isEmployeeArchived && (
        <div className="text-[11px] text-gray-300 mt-2 select-none">
          Drop here
        </div>
      )}
    </div>
  );
};

export default DroppableCell;
