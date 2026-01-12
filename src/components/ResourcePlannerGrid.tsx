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

  // ✅ Exclude archived employees from capacity + allocation math
  // Assumes Employee has `archived: boolean`. If your field name differs, swap it here.
  const activeEmployees = useMemo(
    () => safeEmployees.filter((e) => !e?.archived),
    [safeEmployees]
  );

  const totalSprintsWidth = safeSprints.length * sprintColumnWidth;
  const activeSprint = findActiveSprint(safeSprints);

  // ✅ Stats per sprint (capacity-based, ignores archived)
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

  return (
    <div className="flex-1 overflow-auto" style={{ height: '80vh' }}>
      <div className="min-w-max">
        {/* Fixed Header Row */}
        <div className="sticky top-0 z-10 bg-white border-b-2 border-gray-200 shadow-sm">
          <div className="flex">
            {/* Employee Column Header */}
            <div
              className="flex-shrink-0 p-4 font-semibold text-gray-700 border-r bg-gray-50 sticky left-0 z-10"
              style={{ width: `${employeeColumnWidth}px` }}
            >
              Team Members
            </div>

            {/* Sprint Headers */}
            <div className="flex" style={{ width: `${totalSprintsWidth}px` }}>
              {safeSprints.map((sprint) => {
                const isActive = activeSprint?.id === sprint.id;
                const { totalAvailable, allocationPercentage } = getSprintStats(sprint);

                return (
                  <div
                    key={sprint.id}
                    className={`flex-shrink-0 p-2 text-center text-sm font-medium border-r ${
                      isActive
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : 'text-gray-700 bg-gray-50'
                    }`}
                    style={{ width: `${sprintColumnWidth}px` }}
                  >
                    <div className="truncate font-semibold" title={sprint.name}>
                      {sprint.name}
                    </div>

                    <div className="text-xs mt-1">{getSprintDateRange(sprint)}</div>

                    {/* ✅ Capacity days, not calendar days */}
                    <div className="text-xs text-gray-500 mt-1">
                      {totalAvailable} days
                    </div>

                    <div
                      className={`text-xs font-semibold mt-1 ${
                        allocationPercentage >= 90
                          ? 'text-red-600'
                          : allocationPercentage >= 70
                            ? 'text-orange-600'
                            : 'text-green-600'
                      }`}
                    >
                      {allocationPercentage}% allocated
                    </div>

                    {isActive && (
                      <div className="text-xs font-bold text-blue-600 mt-1">ACTIVE</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Employee Rows */}
        <div className="divide-y divide-gray-200">
          {safeEmployees.map((employee) => (
            <div key={employee.id} className="flex hover:bg-gray-50/50">
              {/* Employee Info Column */}
              <div
                className="flex-shrink-0 border-r bg-white sticky left-0 z-10"
                style={{ width: `${employeeColumnWidth}px` }}
              >
                <EmployeeRow employee={employee} sprints={safeSprints} onEmployeeEdit={onEmployeeEdit} />
              </div>

              {/* Allocation Columns */}
              <div className="flex" style={{ width: `${totalSprintsWidth}px` }}>
                {safeSprints.map((sprint) => (
                  <div
                    key={`${employee.id}-${sprint.id}`}
                    className="flex-shrink-0"
                    style={{ width: `${sprintColumnWidth}px` }}
                  >
                    <DroppableCell employeeId={employee.id} sprintId={sprint.id} sprint={sprint} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Optional: if you want to hide archived rows here too, replace safeEmployees.map(...) with activeEmployees.map(...) */}
      </div>
    </div>
  );
};

export default ResourcePlannerGrid;
