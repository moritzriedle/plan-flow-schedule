import React, { useMemo } from 'react';
import EmployeeRow from './EmployeeRow';
import DroppableCell from './DroppableCell';
import { getSprintDateRange, findActiveSprint } from '../utils/sprintUtils';
import { Employee, Sprint, Project } from '../types';
import { usePlanner } from '../contexts/PlannerContext';
import { ScenarioAllocation, ScenarioConflict } from '@/hooks/useScenarioStore';
import ScenarioCellOverlay from './Scenario/ScenarioCellOverlay';

interface ResourcePlannerGridProps {
  filteredEmployees: Employee[];
  sprints: Sprint[];
  onEmployeeEdit: (employee: Employee) => void;
  // Scenario props
  scenarioMode?: boolean;
  scenarioAllocations?: ScenarioAllocation[];
  scenarioProject?: Project;
  scenarioConflicts?: ScenarioConflict[];
  onAddScenarioAllocation?: (params: { employeeId: string; sprintId: string; days: number }) => Promise<string | null>;
  onUpdateScenarioAllocation?: (id: string, days: number) => Promise<boolean>;
  onDeleteScenarioAllocation?: (id: string) => Promise<boolean>;
  getScenarioAllocationsForCell?: (employeeId: string, sprintId: string) => ScenarioAllocation[];
  getConflictsForCell?: (employeeId: string, sprintId: string) => ScenarioConflict[];
}

const ResourcePlannerGrid: React.FC<ResourcePlannerGridProps> = ({
  filteredEmployees,
  sprints,
  onEmployeeEdit,
  scenarioMode = false,
  scenarioProject,
  onAddScenarioAllocation,
  onUpdateScenarioAllocation,
  onDeleteScenarioAllocation,
  getScenarioAllocationsForCell,
  getConflictsForCell,
}) => {
  const { getTotalAllocationDays, getAvailableDays } = usePlanner();

  const employeeColumnWidth = 200;
  const sprintColumnWidth = 150;

  const safeSprints = Array.isArray(sprints) ? sprints : [];
  const safeEmployees = Array.isArray(filteredEmployees) ? filteredEmployees : [];

  const activeEmployees = useMemo(
    () => safeEmployees.filter((e) => !e?.archived),
    [safeEmployees]
  );

  const totalSprintsWidth = safeSprints.length * sprintColumnWidth;
  const activeSprint = findActiveSprint(safeSprints);

  const getSprintStats = (sprint: Sprint) => {
    let totalAllocated = 0;
    let totalAvailable = 0;

    activeEmployees.forEach((employee) => {
      totalAllocated += getTotalAllocationDays(employee.id, sprint);
      totalAvailable += getAvailableDays(employee.id, sprint);
    });

    const allocationPercentage =
      totalAvailable === 0 ? 0 : Math.round((totalAllocated / totalAvailable) * 100);

    return { totalAllocated, totalAvailable, allocationPercentage };
  };

  const allocationColor = (pct: number) => {
    if (pct >= 90) return 'text-destructive';
    if (pct >= 70) return 'text-orange-600';
    return 'text-green-600';
  };

  return (
    <div className="flex-1 overflow-auto" style={{ height: scenarioMode ? '60vh' : '80vh' }}>
      <div className="min-w-max">
        {/* Fixed Header Row */}
        <div className="sticky top-0 z-10 bg-card border-b-2 border-border shadow-sm">
          <div className="flex">
            <div
              className="flex-shrink-0 px-4 py-3 font-semibold text-foreground border-r bg-muted/50 sticky left-0 z-10"
              style={{ width: `${employeeColumnWidth}px` }}
            >
              Team Members
            </div>

            <div className="flex" style={{ width: `${totalSprintsWidth}px` }}>
              {safeSprints.map((sprint, idx) => {
                const isActive = activeSprint?.id === sprint.id;
                const { totalAvailable, allocationPercentage } = getSprintStats(sprint);

                return (
                  <div
                    key={sprint.id}
                    className={[
                      'flex-shrink-0 border-r px-2 py-2 text-center bg-muted/50 text-foreground',
                      isActive ? 'bg-primary/10 text-primary border-primary/30' : '',
                    ].join(' ')}
                    style={{ width: `${sprintColumnWidth}px` }}
                    title={sprint.name}
                  >
                    <div className="truncate font-semibold text-sm leading-tight">{sprint.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{getSprintDateRange(sprint)}</div>
                    <div className="text-xs mt-1 flex items-center justify-center gap-2">
                      <span className="text-muted-foreground">cap {totalAvailable}d</span>
                      <span className={['font-semibold', allocationColor(allocationPercentage)].join(' ')}>
                        {allocationPercentage}%
                      </span>
                      {isActive && <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Employee Rows */}
        <div className="divide-y divide-border">
          {safeEmployees.map((employee, rowIndex) => (
            <div
              key={employee.id}
              className={[
                'flex',
                rowIndex % 2 === 0 ? 'bg-card' : 'bg-muted/20',
                'hover:bg-muted/40 transition-colors',
              ].join(' ')}
            >
              <div
                className="flex-shrink-0 border-r bg-card sticky left-0 z-10"
                style={{ width: `${employeeColumnWidth}px` }}
              >
                <EmployeeRow employee={employee} sprints={safeSprints} onEmployeeEdit={onEmployeeEdit} />
              </div>

              <div className="flex" style={{ width: `${totalSprintsWidth}px` }}>
                {safeSprints.map((sprint) => {
                  const isActive = activeSprint?.id === sprint.id;
                  const cellScenarioAllocations = scenarioMode && getScenarioAllocationsForCell
                    ? getScenarioAllocationsForCell(employee.id, sprint.id)
                    : [];
                  const cellConflicts = scenarioMode && getConflictsForCell
                    ? getConflictsForCell(employee.id, sprint.id)
                    : [];

                  return (
                    <div
                      key={`${employee.id}-${sprint.id}`}
                      className={[
                        'flex-shrink-0',
                        isActive ? 'bg-primary/5' : '',
                      ].join(' ')}
                      style={{ width: `${sprintColumnWidth}px` }}
                    >
                      <DroppableCell employeeId={employee.id} sprintId={sprint.id} sprint={sprint} />
                      {scenarioMode && (
                        <ScenarioCellOverlay
                          scenarioAllocations={cellScenarioAllocations}
                          conflicts={cellConflicts}
                          project={scenarioProject}
                          onUpdate={onUpdateScenarioAllocation || (async () => false)}
                          onDelete={onDeleteScenarioAllocation || (async () => false)}
                          onAdd={onAddScenarioAllocation || (async () => null)}
                          employeeId={employee.id}
                          sprintId={sprint.id}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResourcePlannerGrid;
