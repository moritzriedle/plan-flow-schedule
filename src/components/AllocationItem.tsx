import React, { useRef, useState } from 'react';
import { useDrag } from 'react-dnd';
import { DragItem } from '../types';
import { usePlanner } from '../contexts/PlannerContext';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Loader2, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface AllocationItemProps {
  id: string;
  employeeId: string;
  projectId: string;
  days: number;
  sprintId: string;
}

const AllocationItem: React.FC<AllocationItemProps> = ({
  id,
  employeeId,
  projectId,
  days,
  sprintId,
}) => {
  const {
    getProjectById,
    deleteAllocation,
    updateAllocation,
    getAvailableDays,
    getTotalAllocationDays,
    addAllocation,
    sprints,
    getSprintById,
  } = usePlanner();

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
      sourceSprintId: sprintId,
    } as DragItem,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  if (!project) return null;

  const sprint = getSprintById(sprintId);
  if (!sprint) return null;

  const availableDays = getAvailableDays(employeeId, sprint);
  const totalAllocated = getTotalAllocationDays(employeeId, sprint);

  // Adjacent sprints for copy functionality
  const currentSprintNumber = parseInt(sprintId.split('-')[1]);
  const previousSprint = sprints.find((s) => s.id === `sprint-${currentSprintNumber - 1}`);
  const nextSprint = sprints.find((s) => s.id === `sprint-${currentSprintNumber + 1}`);

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
    if (days < availableDays && totalAllocated < availableDays && !isUpdating) {
      setIsUpdating(true);
      try {
        await updateAllocation({ id, employeeId, projectId, sprintId, days: days + 1 });
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
        await updateAllocation({ id, employeeId, projectId, sprintId, days: days - 1 });
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleCopyToPrevious = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!previousSprint || isUpdating) return;
    setIsUpdating(true);
    try {
      await addAllocation({ employeeId, projectId, sprintId: previousSprint.id, days });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopyToNext = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!nextSprint || isUpdating) return;
    setIsUpdating(true);
    try {
      await addAllocation({ employeeId, projectId, sprintId: nextSprint.id, days });
    } finally {
      setIsUpdating(false);
    }
  };

  drag(ref);

  return (
    <Card
      ref={ref}
      className={`allocation-item relative mb-1 p-1.5 border-l-4 bg-white shadow-sm hover:shadow-md ${
        isDragging ? 'opacity-40' : 'opacity-100'
      } ${isUpdating ? 'bg-gray-50' : ''}`}
      style={{
        borderLeftColor: `var(--project-${project.color})`,
        backgroundColor: `rgba(var(--project-${project.color}-rgb), 0.05)`,
      }}
    >
      {/* X in top-right */}
      <button
        onClick={handleDelete}
        disabled={isUpdating}
        className="absolute top-1 right-1 inline-flex h-5 w-5 items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-red-500"
        aria-label="Remove allocation"
        title="Remove"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Name (more room now) */}
      <div className="pr-6 font-medium text-xs truncate">{project.name}</div>

      {/* One-line controls: ← – [days] + → */}
      <div className="mt-1 flex items-center gap-1.5">
        {previousSprint && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600"
            onClick={handleCopyToPrevious}
            disabled={isUpdating}
            title={`Copy to ${previousSprint.name}`}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
        )}

        <Button
          variant="outline"
          size="icon"
          className="h-5 w-5 rounded-full p-0"
          onClick={handleDecreaseDays}
          disabled={days <= 1 || isUpdating}
        >
          <Minus className="h-3 w-3" />
        </Button>

        <Badge
          variant="outline"
          className="px-1.5 py-0 h-5 text-[11px] font-semibold"
          style={{
            color: `var(--project-${project.color})`,
            borderColor: `var(--project-${project.color})`,
          }}
          aria-live="polite"
        >
          {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : `${days}d`}
        </Badge>

        <Button
          variant="outline"
          size="icon"
          className="h-5 w-5 rounded-full p-0"
          onClick={handleIncreaseDays}
          disabled={days >= availableDays || totalAllocated >= availableDays || isUpdating}
        >
          <Plus className="h-3 w-3" />
        </Button>

        {nextSprint && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600"
            onClick={handleCopyToNext}
            disabled={isUpdating}
            title={`Copy to ${nextSprint.name}`}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </Card>
  );
};

export default AllocationItem;
