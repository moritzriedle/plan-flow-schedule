import React, { useState, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { DragItem } from '../types';
import { usePlanner } from '../contexts/PlannerContext';
import AllocationItem from './AllocationItem';
import { Loader2 } from 'lucide-react';
import { useEmployeeOperations, useTimeFrameSprints } from '../hooks'; // or however you fetch employee/sprint

interface DroppableCellProps {
  employeeId: string;
  sprintId: string;
}

const DroppableCell: React.FC<DroppableCellProps> = ({ employeeId, sprintId }) => {
  const {
    allocations,
    moveAllocation,
    getTotalAllocationDays,
    getAvailableDays,
    getEmployeeById,
    getSprintById
  } = usePlanner();

  const [isOver, setIsOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const employee: Employee | undefined = getEmployeeById(employeeId);
  const sprint: Sprint | undefined = getSprintById(sprintId);

  const cellAllocations = allocations.filter(
    (alloc) => alloc.employeeId === employeeId && alloc.sprintId === sprintId
  );

  const totalDays = getTotalAllocationDays(employeeId, sprintId);
  const availableDays = getAvailableDays(employeeId, sprintId);
  const isOverallocated = totalDays > availableDays;

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
      let allocationDays = item.days ?? 10;

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
    if (!isOverCurrent) {
      setIsOver(false);
    }
  }, [isOverCurrent]);

 // Utility to count how many vacation dates fall within this sprint
  function countVacationDaysInSprint(vacationDates: string[], sprint: Sprint): number {
    if (!Array.isArray(vacationDates) || !sprint.workingDays) return 0;

    const sprintDays = new Set(sprint.workingDays.map(d => new Date(d).toDateString()));
    return vacationDates.filter(dateStr => sprintDays.has(new Date(dateStr).toDateString())).length;
  }

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
        {isOverallocated && <span className="text-xs text-red-500 font-bold">!</span>}
        {isProcessing && <Loader2 className="h-3 w-3 animate-spin text-gray-400" />}
      </div>

        {/* Vacation display just for this sprint */}
      {employee && sprint && employee.vacationDates && (
        (() => {
          const vacationCount = countVacationDaysInSprint(employee.vacationDates, sprint);
          return vacationCount > 0 ? (
            <div className="text-[11px] text-amber-700 mb-1">
              {vacationCount} vacation day{vacationCount > 1 ? 's' : ''}
            </div>
          ) : null;
        })()
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
