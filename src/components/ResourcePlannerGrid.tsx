import React, { useMemo } from 'react';
import EmployeeRow from './EmployeeRow';
import DroppableCell from './DroppableCell';
import { getSprintDateRange, findActiveSprint } from '../utils/sprintUtils';
import { Employee, Sprint } from '../types';
import { usePlanner } from '../contexts/PlannerContext';

interface ResourcePlannerGridProps {
  filteredEmployees: Employee[];
  sprints: Sprint[];
  onEmployeeEdit: (employee: Employee) => void;
}

const ResourcePlannerGrid: React.FC<ResourcePlannerGridProps> = ({
  filteredEmployees,
  sprints,
  onEmployeeEdit,
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
    if (pct >= 90) return 'text-red-600';
    if (pct >= 70) return 'text-orange-600';
    return 'text-green-600';
  };

  return (
    <div className="flex-1 overflow-auto" style={{ height: '80vh' }}>
      <div className="min-w-max">
        {/* Fixed Header Row */}
        <div className="sticky top-0 z-10 bg-white border-b-2 border-gray-200 shadow-sm">
          <div className="flex">
            {/* Employee Column Header */}
            <div
              className="flex-shrink-0 px-4 py-3 font-semibold text-gray-700 border-r bg-gray-50 sticky left-0 z-10"
              style={{ width: `${employeeColumnWidth}px` }}
            >
              Team Members
            </div>

            {/* Sprint Headers */}
            <div className="flex" style={{ width: `${totalSprintsWidth}px` }}>
              {safeSprints.map((sprint, idx) => {
                const isActive = activeSprint?.id === sprint.id;
                const { totalAvailable, allocationPercentage } = getSprintStats(sprint);

                return (
                  <div
                    key={sprint.id}
                    className={[
                      'flex-shrink-0 border-r',
                      // compact padding
                      'px-2 py-2 text-center',
                      // base header bg
                      'bg-gray-50 text-gray-700',
                      // active column tint
                      isActive ? 'bg-blue-50 text-blue-900 border-blue-200' : '',
                      // subtle separator every 2 sprints (optional, helps scanning)
                      idx % 2 === 0 ? '' : 'border-r-gray-200',
                    ].join(' ')}
                    style={{ width: `${sprintColumnWidth}px` }}
                    title={sprint.name}
                  >
                    <div className="truncate font-semibold text-sm leading-tight">
                      {sprint.name}
                    </div>

                    <div className="text-xs text-gray-500 mt-0.5">
                      {getSprintDateRange(sprint)}
                    </div>

                    {/* one compact stat line */}
                    <div className="text-xs mt-1 flex items-center justify-center gap-2">
                      <span className="text-gray-500">cap {totalAvailable}d</span>
                      <span className={['font-semibold', allocationColor(allocationPercentage)].join(' ')}>
                        {allocationPercentage}%
                      </span>

                      {/* tiny active dot instead of yelling "ACTIVE" */}
                      {isActive && <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-600" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Employee Rows */}
        <div className="divide-y divide-gray-200">
          {safeEmployees.map((employee, rowIndex) => (
            <div
              key={employee.id}
              className={[
                'flex',
                rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/40',
                'hover:bg-gray-50/80 transition-colors',
              ].join(' ')}
            >
              {/* Employee Info Column */}
              <div
                className="flex-shrink-0 border-r bg-white sticky left-0 z-10"
                style={{ width: `${employeeColumnWidth}px` }}
              >
                {/* Keep role visible in EmployeeRow; remove totals there */}
                <EmployeeRow employee={employee} sprints={safeSprints} onEmployeeEdit={onEmployeeEdit} />
              </div>

              {/* Allocation Columns */}
              <div className="flex" style={{ width: `${totalSprintsWidth}px` }}>
                {safeSprints.map((sprint) => {
                  const isActive = activeSprint?.id === sprint.id;

                  return (
                    <div
                      key={`${employee.id}-${sprint.id}`}
                      className={[
                        'flex-shrink-0',
                        // active sprint column tint across all rows
                        isActive ? 'bg-blue-50/40' : '',
                      ].join(' ')}
                      style={{ width: `${sprintColumnWidth}px` }}
                    >
                      <DroppableCell employeeId={employee.id} sprintId={sprint.id} sprint={sprint} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* If you want to hide archived rows here too, switch safeEmployees.map -> activeEmployees.map */}
      </div>
    </div>
  );
};

export default ResourcePlannerGrid;
