import React, { useState } from 'react';
import { usePlanner } from '../contexts/PlannerContext';
import MultiRoleSelector from './MultiRoleSelector';
import { startOfMonth, addMonths, format } from 'date-fns';
import { ROLE_OPTIONS } from '@/constants/roles';

const ProfessionView: React.FC = () => {
  const { employees = [], allocations, projects, sprints } = usePlanner();
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // Convert ROLE_OPTIONS from readonly to mutable array
  const availableRoles = [...ROLE_OPTIONS];

  // Filter employees by selected roles
  const filteredEmployees = Array.isArray(employees) && employees.length > 0
    ? (selectedRoles.length === 0 
        ? employees 
        : employees.filter(emp => emp && emp.role && selectedRoles.includes(emp.role)))
    : [];

  // Generate months starting from June 2025
  const startDate = new Date(2025, 5, 1); // June 2025 (month is 0-indexed)
  const months = [];
  for (let i = 0; i < 12; i++) {
    months.push(addMonths(startDate, i));
  }

  // Helper function to get allocations for a specific employee and month
  const getAllocationDaysForMonth = (employeeId: string, month: Date): number => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
  
    // Filter allocations for the employee
    const employeeAllocations = allocations.filter(alloc => alloc.employeeId === employeeId);
  
    let totalDays = 0;
  
    // Iterate through each allocation to check if it falls within the specified month
    employeeAllocations.forEach(allocation => {
      const sprint = sprints.find(s => s.id === allocation.sprintId);
      if (sprint) {
        const sprintYear = sprint.startDate.getFullYear();
        const sprintMonth = sprint.startDate.getMonth();
  
        // Check if the sprint falls within the specified month
        if (sprintYear === year && sprintMonth === monthIndex) {
          totalDays += allocation.days;
        }
      }
    });
  
    return totalDays;
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Resource Allocation by Role</h2>
        
        {/* Role Filter */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Filter by Role:</label>
          <MultiRoleSelector
            roles={availableRoles}
            selectedRoles={selectedRoles}
            onRoleChange={setSelectedRoles}
            placeholder="All Roles"
          />
        </div>
      </div>

      <div className="overflow-auto">
        <div className="min-w-max">
          {/* Month Headers */}
          <div className="flex border-b-2 border-gray-200 bg-gray-50">
            <div className="w-48 p-3 font-semibold border-r">Team Member</div>
            {months.map((month) => (
              <div key={month.toISOString()} className="w-24 p-2 text-center text-sm font-medium border-r">
                {format(month, 'MMM yyyy')}
              </div>
            ))}
          </div>

          {/* Employee Rows */}
          {filteredEmployees.map((employee) => (
            <div key={employee.id} className="flex border-b hover:bg-gray-50">
              <div className="w-48 p-3 border-r">
                <div className="font-medium">{employee.name}</div>
                <div className="text-sm text-gray-500">{employee.role}</div>
              </div>
              {months.map((month) => {
                const monthlyAllocation = getAllocationDaysForMonth(employee.id, month);
                return (
                  <div key={month.toISOString()} className="w-24 p-2 text-center border-r">
                    {monthlyAllocation > 0 ? (
                      <span className="text-sm font-medium text-blue-600">
                        {monthlyAllocation}d
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfessionView;
