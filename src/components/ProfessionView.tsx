
import React, { useState } from 'react';
import { usePlanner } from '../contexts/PlannerContext';
import MultiRoleSelector from './MultiRoleSelector';
import { startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, format } from 'date-fns';
import { ROLE_OPTIONS } from '@/constants/roles';

const ProfessionView: React.FC = () => {
  const { employees = [], allocations = [], projects = [], sprints = [] } = usePlanner();
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // Ensure ROLE_OPTIONS is always a valid array
  const availableRoles = React.useMemo(() => {
    if (!ROLE_OPTIONS || !Array.isArray(ROLE_OPTIONS)) {
      console.warn('ProfessionView: ROLE_OPTIONS is not a valid array', { ROLE_OPTIONS });
      return [];
    }
    return [...ROLE_OPTIONS].filter(role => role && typeof role === 'string');
  }, []);

  // Ensure selectedRoles is always a valid array
  const safeSelectedRoles = React.useMemo(() => {
    if (!selectedRoles || !Array.isArray(selectedRoles)) {
      console.warn('ProfessionView: selectedRoles is not a valid array', { selectedRoles });
      return [];
    }
    return selectedRoles.filter(role => role && typeof role === 'string');
  }, [selectedRoles]);

  // Filter employees by selected roles with comprehensive safety checks
  const safeEmployees = React.useMemo(() => {
    if (!employees || !Array.isArray(employees)) {
      console.warn('ProfessionView: employees is not a valid array', { employees });
      return [];
    }
    return employees.filter(emp => emp && emp.id);
  }, [employees]);

  const filteredEmployees = React.useMemo(() => {
    try {
      if (safeSelectedRoles.length === 0) {
        return safeEmployees;
      }
      
      const filtered = safeEmployees.filter(emp => {
        if (!emp || !emp.role) {
          console.warn('ProfessionView: Employee missing role', { emp });
          return false;
        }
        return safeSelectedRoles.includes(emp.role);
      });
      
      return filtered;
    } catch (error) {
      console.error('ProfessionView: Error filtering employees', error);
      return safeEmployees;
    }
  }, [safeEmployees, safeSelectedRoles]);

  const handleRoleChange = (roles: string[]) => {
    try {
      const safeRoles = Array.isArray(roles) ? roles.filter(role => role && typeof role === 'string') : [];
      setSelectedRoles(safeRoles);
    } catch (error) {
      console.error('ProfessionView: Error in handleRoleChange', error);
      setSelectedRoles([]);
    }
  };

  // Generate months starting from June 2025
  const startDate = new Date(2025, 5, 1); // June 2025 (month is 0-indexed)
  const months = [];
  for (let i = 0; i < 12; i++) {
    const monthStart = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
    months.push(monthStart);
  }

  // Calculate working days in a month (Monday to Friday)
  const getWorkingDaysInMonth = (month: Date): number => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    return allDays.filter(day => !isWeekend(day)).length;
  };

  // Helper function to get allocations for a specific employee and month
  const getAllocationDaysForMonth = (employeeId: string, month: Date): number => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
  
    // Filter allocations for the employee with safety checks
    const safeAllocations = Array.isArray(allocations) ? allocations : [];
    const employeeAllocations = safeAllocations.filter(alloc => alloc && alloc.employeeId === employeeId);
  
    let totalDays = 0;
  
    // Iterate through each allocation to check if it falls within the specified month
    employeeAllocations.forEach(allocation => {
      const safeSprints = Array.isArray(sprints) ? sprints : [];
      const sprint = safeSprints.find(s => s && s.id === allocation.sprintId);
      if (sprint && sprint.startDate) {
        const sprintYear = sprint.startDate.getFullYear();
        const sprintMonth = sprint.startDate.getMonth();
  
        // Check if the sprint falls within the specified month
        if (sprintYear === year && sprintMonth === monthIndex) {
          totalDays += allocation.days || 0;
        }
      }
    });
  
    return totalDays;
  };

  // Calculate utilization percentage
  const getUtilizationPercentage = (employeeId: string, month: Date): number => {
    const allocatedDays = getAllocationDaysForMonth(employeeId, month);
    const workingDays = getWorkingDaysInMonth(month);
    
    if (workingDays === 0) return 0;
    return Math.round((allocatedDays / workingDays) * 100);
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
            selectedRoles={safeSelectedRoles}
            onRoleChange={handleRoleChange}
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
              <div key={month.toISOString()} className="w-32 p-2 text-center text-sm font-medium border-r">
                <div>{format(month, 'MMM yyyy')}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {getWorkingDaysInMonth(month)} working days
                </div>
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
                const utilizationPercentage = getUtilizationPercentage(employee.id, month);
                const workingDays = getWorkingDaysInMonth(month);
                
                return (
                  <div key={month.toISOString()} className="w-32 p-2 text-center border-r">
                    {monthlyAllocation > 0 ? (
                      <div>
                        <span className="text-sm font-medium text-blue-600">
                          {monthlyAllocation}d
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {utilizationPercentage}% of {workingDays}d
                        </div>
                        <div className={`text-xs mt-1 ${
                          utilizationPercentage > 100 ? 'text-red-500' : 
                          utilizationPercentage > 80 ? 'text-orange-500' : 
                          'text-green-500'
                        }`}>
                          {utilizationPercentage > 100 ? 'Overallocated' : 
                           utilizationPercentage > 80 ? 'High load' : 
                           'Available'}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span className="text-xs text-gray-400">-</span>
                        <div className="text-xs text-green-500 mt-1">Available</div>
                      </div>
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
