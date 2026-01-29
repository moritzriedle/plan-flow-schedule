import React from 'react';
import { Employee, Sprint } from '../../types';

// NOTE: Keep your existing Project type import if you have one.
// Using `any` here only to avoid breaking your build in case your types differ.
type Project = any;
type Allocation = any;

interface ProjectAlignmentCardProps {
  project: Project;
  sprints: Sprint[];
  allocations: Allocation[];
  employees: Employee[];
  overallocatedEmployees: Map<string, { employee: Employee; sprintId: string; totalDays: number }[]>;
  highlightSprintId?: string | null;
}

const ProjectAlignmentCard: React.FC<ProjectAlignmentCardProps> = ({
  project,
  sprints,
  allocations,
  employees,
  overallocatedEmployees,
  highlightSprintId,
}) => {
  return (
    <div className="bg-background border rounded-lg overflow-hidden">
      <div className="grid grid-cols-[300px_1fr] gap-4 px-4 py-4">
        {/* LEFT: Project column */}
        <div className="min-w-0">
          {/* 🔽 KEEP/PASTE your existing project header UI here */}
          {/* Example (replace with your real content): */}
          <div className="font-semibold truncate">{project?.name}</div>
          {/* 🔼 END project header UI */}
        </div>

        {/* RIGHT: Sprint columns */}
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${sprints.length}, 1fr)` }}
        >
          {sprints.map((sprint) => {
            const isHighlighted = highlightSprintId && sprint.id === highlightSprintId;

            return (
              <div
                key={sprint.id}
                className={[
                  'rounded-md p-2 transition-colors',
                  // This is the column highlight
                  isHighlighted ? 'bg-primary/5 ring-2 ring-primary/30' : 'bg-transparent',
                ].join(' ')}
              >
                {/* 🔽 KEEP/PASTE your existing per-sprint cell content here */}
                {/* You already have everything you need in scope: project, sprint, allocations, employees, overallocatedEmployees */}
                {/* Example placeholder (replace with your real content): */}
                <div className="text-sm text-muted-foreground">
                  {/* Replace this with your actual per-sprint rendering */}
                  Sprint cell content
                </div>
                {/* 🔼 END per-sprint cell content */}
              </div>
            );
          })}
        </div>
      </div>

      {/* 🔽 If your card has extra sections below (team list, notes, etc.), paste them here */}
      {/* 🔼 END extra sections */}
    </div>
  );
};

export default ProjectAlignmentCard;
