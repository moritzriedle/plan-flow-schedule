
import React from 'react';
import EmployeeRow from './EmployeeRow';
import DroppableCell from './DroppableCell';
import { getSprintDateRange, isSprintActive } from '../utils/sprintUtils';
import { Employee, Sprint } from '../types';

interface ResourcePlannerGridProps {
  filteredEmployees: Employee[];
  sprints: Sprint[];
  onEmployeeEdit: (employee: Employee) => void;
}

const ResourcePlannerGrid: React.FC<ResourcePlannerGridProps> = ({
  filteredEmployees,
  sprints,
  onEmployeeEdit
}) => {
  // Calculate fixed column width for consistent alignment
  const employeeColumnWidth = 200;
  const sprintColumnWidth = 150;
  const safeSprints = Array.isArray(sprints) ? sprints : [];
  const totalSprintsWidth = safeSprints.length * sprintColumnWidth;

  return (
    <div className="flex-1 overflow-auto">
      <div className="min-w-max">
        {/* Fixed Header Row */}
        <div className="sticky top-0 z-10 bg-white border-b-2 border-gray-200 shadow-sm">
          <div className="flex">
            {/* Employee Column Header */}
            <div 
              className="flex-shrink-0 p-4 font-semibold text-gray-700 border-r bg-gray-50"
              style={{ width: `${employeeColumnWidth}px` }}
            >
              Team Members
            </div>
            
            {/* Sprint Headers */}
            <div className="flex" style={{ width: `${totalSprintsWidth}px` }}>
              {safeSprints.map((sprint) => (
                <div
                  key={sprint.id}
                  className={`flex-shrink-0 p-2 text-center text-sm font-medium border-r ${
                    isSprintActive(sprint) 
                      ? 'bg-blue-100 text-blue-800 border-blue-200' 
                      : 'text-gray-700 bg-gray-50'
                  }`}
                  style={{ width: `${sprintColumnWidth}px` }}
                >
                  <div className="truncate font-semibold" title={sprint.name}>
                    {sprint.name}
                  </div>
                  <div className="text-xs mt-1">
                    {getSprintDateRange(sprint)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {sprint.workingDays?.length || 0} days
                  </div>
                  {isSprintActive(sprint) && (
                    <div className="text-xs font-bold text-blue-600 mt-1">
                      ACTIVE
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Employee Rows */}
        <div className="divide-y divide-gray-200">
          {filteredEmployees.map((employee) => (
            <div key={employee.id} className="flex hover:bg-gray-50/50">
              {/* Employee Info Column */}
              <div 
                className="flex-shrink-0 border-r bg-white"
                style={{ width: `${employeeColumnWidth}px` }}
              >
                <EmployeeRow 
                  employee={employee} 
                  sprints={safeSprints}
                  onEmployeeEdit={onEmployeeEdit}
                />
              </div>
              
              {/* Allocation Columns */}
              <div className="flex" style={{ width: `${totalSprintsWidth}px` }}>
                {safeSprints.map((sprint) => (
                  <div
                    key={`${employee.id}-${sprint.id}`}
                    className="flex-shrink-0"
                    style={{ width: `${sprintColumnWidth}px` }}
                  >
                    <DroppableCell
                      employeeId={employee.id}
                      sprintId={sprint.id}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResourcePlannerGrid;
