
import React, { useState } from 'react';
import { usePlanner } from '../contexts/PlannerContext';
import MultiRoleSelector from './MultiRoleSelector';
import { startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, format } from 'date-fns';
import { ROLE_OPTIONS } from '@/constants/roles';
import { countWorkingDays } from '../utils/dateUtils'; // ⬅️ new import

const ProfessionView: React.FC = () => {
  const { employees = [], allocations = [], projects = [], sprints = [] } = usePlanner();
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // Ensure ROLE_OPTIONS is always a valid array
  const availableRoles = React.useMemo(() => {
    if (!ROLE_OPTIONS || !Array.isArray(ROLE_OPTIONS)) {
      console.warn('ProfessionView: ROLE_OPTIONS is not a valid array', { ROLE_OPTIONS });
      return [];
    }
    return Array.isArray(ROLE_OPTIONS)
      ? ROLE_OPTIONS.filter(role => role && typeof role === 'string')
      : [];
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
        if (!emp || !emp.role || typeof emp.role !== 'string') {
          console.warn('ProfessionView: Employee missing valid role', { emp });
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

  // Generate 12-month rolling view starting from current month
  const months = React.useMemo(() => {
    console.log('ProfessionView: Generating months array');
    const currentDate = new Date();
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthsList = [];
    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
      monthsList.push(monthStart);
    }
    console.log('ProfessionView: Generated months array:', monthsList);
    return Array.isArray(monthsList) ? monthsList : [];
  }, []);

  // Calculate working days in a month (Monday to Friday) minus vacation days
  const getWorkingDaysInMonth = (month: Date, employeeId?: string): number => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    let workingDays = countWorkingDays(monthStart, monthEnd);

    
    // Deduct vacation days if employeeId is provided
    if (employeeId) {
      const employee = safeEmployees.find(emp => emp.id === employeeId);
      if (employee && employee.vacationDates && Array.isArray(employee.vacationDates)) {
        const vacationDaysInMonth = employee.vacationDates.filter(vacationDate => {
          const vacation = new Date(vacationDate);
          return vacation >= monthStart && vacation <= monthEnd && !isWeekend(vacation);
        }).length;
        workingDays = Math.max(0, workingDays - vacationDaysInMonth);
      }
    }
    
    return workingDays;
  };

  // Helper function to get allocations for a specific employee and month
 const getAllocationDaysForMonth = (employeeId: string, month: Date): number => {
  const safeAllocations = Array.isArray(allocations) ? allocations : [];
  const employeeAllocations = safeAllocations.filter(
    alloc => alloc && alloc.employeeId === employeeId
  );

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);

  let totalDays = 0;

  employeeAllocations.forEach(allocation => {
    const sprint = sprints.find(s => s && s.id === allocation.sprintId);
    if (!sprint || !sprint.startDate || !sprint.endDate) return;

    const sprintStart = new Date(sprint.startDate);
    const sprintEnd = new Date(sprint.endDate);

    // Overlap between sprint and this month
    const overlapStart = sprintStart > monthStart ? sprintStart : monthStart;
    const overlapEnd = sprintEnd < monthEnd ? sprintEnd : monthEnd;

    if (overlapStart > overlapEnd) return; // no overlap

    // 1. Total sprint working days
    const sprintWorkingDays = countWorkingDays(sprintStart, sprintEnd);

    // 2. Days allocated to this employee in this sprint (from DB, int4)
    const allocatedDaysInSprint = allocation.days ?? 0;

    // 3. Overlap working days inside this month
    const overlapWorkingDays = countWorkingDays(overlapStart, overlapEnd);

    // 4. Prorate allocation into this month
    const proratedDays = Math.round(
      (allocatedDaysInSprint / sprintWorkingDays) * overlapWorkingDays
    );

    totalDays += proratedDays;
  });

  return totalDays;
};



  // Get projects for an employee in a specific month
  const getProjectsForMonth = (employeeId: string, month: Date): string[] => {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);

  const safeAllocations = Array.isArray(allocations) ? allocations : [];
  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeSprints = Array.isArray(sprints) ? sprints : [];

  const employeeAllocations = safeAllocations.filter(
    alloc => alloc && alloc.employeeId === employeeId
  );

  const projectIds = new Set<string>();

  employeeAllocations.forEach(allocation => {
    const sprint = safeSprints.find(s => s && s.id === allocation.sprintId);
    if (!sprint || !sprint.startDate || !sprint.endDate) return;

    const sprintStart = new Date(sprint.startDate);
    const sprintEnd = new Date(sprint.endDate);

    // Calculate overlap with the month
    const overlapStart = sprintStart > monthStart ? sprintStart : monthStart;
    const overlapEnd = sprintEnd < monthEnd ? sprintEnd : monthEnd;

    if (overlapStart <= overlapEnd && allocation.projectId) {
      projectIds.add(allocation.projectId);
    }
  });

  // Map project IDs to names
  return Array.from(projectIds).map(projectId => {
    const project = safeProjects.find(p => p && p.id === projectId);
    return project ? project.name : 'Unknown Project';
  });
};


  // Calculate utilization percentage
  const getUtilizationPercentage = (employeeId: string, month: Date): number => {
    const allocatedDays = getAllocationDaysForMonth(employeeId, month);
    const workingDays = getWorkingDaysInMonth(month, employeeId);
    
    if (workingDays === 0) return 0;
    return Math.round((allocatedDays / workingDays) * 100);
  };

  // Calculate role summaries for each month
  const getRoleSummaryForMonth = (role: string, month: Date) => {
    const roleEmployees = (filteredEmployees || []).filter(emp => emp?.role === role);
    let totalAvailable = 0;
    let totalUtilized = 0;
    
    roleEmployees.forEach(employee => {
      const availableDays = getWorkingDaysInMonth(month, employee.id);
      const allocatedDays = getAllocationDaysForMonth(employee.id, month);
      totalAvailable += availableDays;
      totalUtilized += allocatedDays;
    });
    
    return { totalAvailable, totalUtilized, utilization: totalAvailable > 0 ? Math.round((totalUtilized / totalAvailable) * 100) : 0 };
  };

  // Get unique roles from filtered employees
  const uniqueRoles = React.useMemo(() => {
    try {
      if (!Array.isArray(filteredEmployees)) {
        console.warn('ProfessionView: filteredEmployees is not an array', filteredEmployees);
        return [];
      }
      
      const validRoles = (filteredEmployees || [])
        .map(emp => emp?.role)
        .filter(role => role && typeof role === 'string');
      
      const roles = new Set(validRoles);
      console.log('ProfessionView: About to call Array.from with roles Set:', roles);
      
      if (!roles || typeof roles[Symbol.iterator] !== 'function') {
        console.warn('ProfessionView: roles Set is not iterable', roles);
        return [];
      }
      
      const rolesArray = Array.from(roles);
      return rolesArray.sort();
    } catch (error) {
      console.error('ProfessionView: Error creating uniqueRoles', error);
      return [];
    }
  }, [filteredEmployees]);

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

      <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-200px)] relative">
        <div className="min-w-max">
            {/* Month Headers */}
            <div className="flex border-b-2 border-gray-200 bg-gray-50 sticky top-0 z-20 shadow-sm">
              <div className="w-48 p-3 font-semibold border-r bg-gray-50">Team Member</div>
              {!Array.isArray(months) ? (
                console.warn('ProfessionView: months is not an array', months),
                <div>No months data available</div>
              ) : (months || []).map((month) => (
              <div key={month.toISOString()} className="w-40 p-2 text-center text-sm font-medium border-r bg-gray-50">
                <div>{format(month, 'MMM yyyy')}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Working days (avg: {getWorkingDaysInMonth(month)})
                </div>
              </div>
            ))}
          </div>

          {/* Role Summary Rows */}
          {(uniqueRoles || []).map((role) => (
            <div key={`role-${role}`} className="flex border-b bg-blue-50">
              <div className="w-48 p-3 border-r">
                <div className="font-bold text-blue-800">{role} (Total)</div>
                <div className="text-sm text-blue-600">Role Summary</div>
              </div>
              {(months || []).map((month) => {
                const summary = getRoleSummaryForMonth(role, month);
                
                return (
                  <div
                    key={month.toISOString()}
                    className={`w-40 p-2 text-center border-r ${
                      summary.utilization > 100
                        ? 'bg-red-100'
                        : summary.utilization > 80
                        ? 'bg-orange-100'
                        : 'bg-green-50'
                    }`}
                  >
                    <div className="text-sm font-bold text-blue-800">
                      {summary.totalUtilized}d / {summary.totalAvailable}d
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      {summary.utilization}% utilized
                    </div>
                    <div className="text-xs mt-1">
                      {summary.totalAvailable - summary.totalUtilized}d available
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Employee Rows */}
          {(filteredEmployees || []).map((employee) => (
            <div key={employee.id} className="flex border-b hover:bg-gray-50">
              <div className="w-48 p-3 border-r">
                <div className="font-medium">{employee.name}</div>
                <div className="text-sm text-gray-500">{employee.role}</div>
              </div>
              {(months || []).map((month) => {
                const monthlyAllocation = getAllocationDaysForMonth(employee.id, month);
                const utilizationPercentage = getUtilizationPercentage(employee.id, month);
                const workingDays = getWorkingDaysInMonth(month, employee.id);
                const projectsInMonth = getProjectsForMonth(employee.id, month);
                
                return (
                  <div
                    key={month.toISOString()}
                    className={`w-40 p-2 text-center border-r ${
                      utilizationPercentage > 100
                        ? 'bg-red-100'
                        : utilizationPercentage > 80
                        ? 'bg-orange-100'
                        : 'bg-green-50'
                    }`}
                  >
                    {monthlyAllocation > 0 ? (
                      <div>
                        <span className="text-sm font-medium text-blue-600">
                          {monthlyAllocation}d
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {utilizationPercentage}% of {workingDays}d
                        </div>
                        {projectsInMonth.length > 0 && (
                          <div className="text-xs text-gray-700 mt-1 space-y-1">
                            {projectsInMonth.map((projectName, idx) => (
                              <div key={idx} className="truncate" title={projectName}>
                                {projectName}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="text-xs mt-1">
                          {utilizationPercentage > 100
                            ? 'Overallocated'
                            : utilizationPercentage > 80
                            ? 'High load'
                            : 'Available'}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span className="text-xs text-gray-400">-</span>
                        <div className="text-xs mt-1">{workingDays}d available</div>
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
