import React, { useState } from 'react';
import { usePlanner } from '../contexts/PlannerContext';
import MultiRoleSelector from './MultiRoleSelector';
import { startOfMonth, endOfMonth, isWeekend, format } from 'date-fns';
import { ROLE_OPTIONS } from '@/constants/roles';
import { countWorkingDays } from '../utils/dateUtils';

const ProfessionView: React.FC = () => {
  const { employees = [], allocations = [], projects = [], sprints = [] } = usePlanner();
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // Ensure ROLE_OPTIONS is always a valid array
  const availableRoles = React.useMemo(() => {
    if (!ROLE_OPTIONS || !Array.isArray(ROLE_OPTIONS)) {
      console.warn('ProfessionView: ROLE_OPTIONS is not a valid array', { ROLE_OPTIONS });
      return [];
    }
    return ROLE_OPTIONS.filter((role) => role && typeof role === 'string');
  }, []);

  // Ensure selectedRoles is always a valid array
  const safeSelectedRoles = React.useMemo(() => {
    if (!selectedRoles || !Array.isArray(selectedRoles)) {
      console.warn('ProfessionView: selectedRoles is not a valid array', { selectedRoles });
      return [];
    }
    return selectedRoles.filter((role) => role && typeof role === 'string');
  }, [selectedRoles]);

  // Safe employees
  const safeEmployees = React.useMemo(() => {
    if (!employees || !Array.isArray(employees)) {
      console.warn('ProfessionView: employees is not a valid array', { employees });
      return [];
    }
    return employees.filter((emp) => emp && emp.id);
  }, [employees]);

  // ✅ Active employees (non-archived) for calculations
  // Assumes employee.archived boolean. If your field differs, change it here.
  const activeEmployees = React.useMemo(() => {
    return safeEmployees.filter((emp: any) => !emp?.archived);
  }, [safeEmployees]);

  // Filter employees by selected roles (for rendering)
  const filteredEmployeesForRender = React.useMemo(() => {
    try {
      const base = safeSelectedRoles.length === 0 ? safeEmployees : safeEmployees.filter((emp: any) => {
        if (!emp || !emp.role || typeof emp.role !== 'string') return false;
        return safeSelectedRoles.includes(emp.role);
      });
      return base;
    } catch (error) {
      console.error('ProfessionView: Error filtering employees', error);
      return safeEmployees;
    }
  }, [safeEmployees, safeSelectedRoles]);

  // ✅ Same filter, but only for active employees (for calculations)
  const filteredEmployeesForCalc = React.useMemo(() => {
    try {
      const base = safeSelectedRoles.length === 0 ? activeEmployees : activeEmployees.filter((emp: any) => {
        if (!emp || !emp.role || typeof emp.role !== 'string') return false;
        return safeSelectedRoles.includes(emp.role);
      });
      return base;
    } catch (error) {
      console.error('ProfessionView: Error filtering active employees', error);
      return activeEmployees;
    }
  }, [activeEmployees, safeSelectedRoles]);

  const handleRoleChange = (roles: string[]) => {
    try {
      const safeRoles = Array.isArray(roles) ? roles.filter((role) => role && typeof role === 'string') : [];
      setSelectedRoles(safeRoles);
    } catch (error) {
      console.error('ProfessionView: Error in handleRoleChange', error);
      setSelectedRoles([]);
    }
  };

  // Generate 12-month rolling view starting from current month
  const months = React.useMemo(() => {
    const currentDate = new Date();
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthsList: Date[] = [];
    for (let i = 0; i < 12; i++) {
      monthsList.push(new Date(startDate.getFullYear(), startDate.getMonth() + i, 1));
    }
    return monthsList;
  }, []);

  // Calculate working days in a month (Mon-Fri) minus vacation days
  const getWorkingDaysInMonth = (month: Date, employeeId?: string): number => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    let workingDays = countWorkingDays(monthStart, monthEnd);

    if (employeeId) {
      const employee: any = safeEmployees.find((emp: any) => emp.id === employeeId);

      // ✅ Archived employees contribute 0 available days
      if (employee?.archived) return 0;

      if (employee && employee.vacationDates && Array.isArray(employee.vacationDates)) {
        const vacationDaysInMonth = employee.vacationDates.filter((vacationDate: any) => {
          const vacation = new Date(vacationDate);
          return vacation >= monthStart && vacation <= monthEnd && !isWeekend(vacation);
        }).length;

        workingDays = Math.max(0, workingDays - vacationDaysInMonth);
      }
    }

    return workingDays;
  };

  // Allocations for employee in month (prorated by sprint overlap)
  const getAllocationDaysForMonth = (employeeId: string, month: Date): number => {
    const employee: any = safeEmployees.find((emp: any) => emp.id === employeeId);
    // ✅ Archived employees contribute 0 utilization days (optional but consistent)
    if (employee?.archived) return 0;

    const safeAllocations = Array.isArray(allocations) ? allocations : [];
    const employeeAllocations = safeAllocations.filter((alloc: any) => alloc && alloc.employeeId === employeeId);

    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    let totalDays = 0;

    employeeAllocations.forEach((allocation: any) => {
      const sprint: any = (Array.isArray(sprints) ? sprints : []).find((s: any) => s && s.id === allocation.sprintId);
      if (!sprint || !sprint.startDate || !sprint.endDate) return;

      const sprintStart = new Date(sprint.startDate);
      const sprintEnd = new Date(sprint.endDate);

      const overlapStart = sprintStart > monthStart ? sprintStart : monthStart;
      const overlapEnd = sprintEnd < monthEnd ? sprintEnd : monthEnd;
      if (overlapStart > overlapEnd) return;

      const sprintWorkingDays = countWorkingDays(sprintStart, sprintEnd);
      const allocatedDaysInSprint = allocation.days ?? 0;
      const overlapWorkingDays = countWorkingDays(overlapStart, overlapEnd);

      if (sprintWorkingDays <= 0) return;

      const proratedDays = Math.round((allocatedDaysInSprint / sprintWorkingDays) * overlapWorkingDays);
      totalDays += proratedDays;
    });

    return totalDays;
  };

  const getProjectsForMonth = (employeeId: string, month: Date): string[] => {
    const employee: any = safeEmployees.find((emp: any) => emp.id === employeeId);
    if (employee?.archived) return [];

    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    const safeAllocations = Array.isArray(allocations) ? allocations : [];
    const safeProjects = Array.isArray(projects) ? projects : [];
    const safeSprints = Array.isArray(sprints) ? sprints : [];

    const employeeAllocations = safeAllocations.filter((alloc: any) => alloc && alloc.employeeId === employeeId);
    const projectIds = new Set<string>();

    employeeAllocations.forEach((allocation: any) => {
      const sprint: any = safeSprints.find((s: any) => s && s.id === allocation.sprintId);
      if (!sprint || !sprint.startDate || !sprint.endDate) return;

      const sprintStart = new Date(sprint.startDate);
      const sprintEnd = new Date(sprint.endDate);

      const overlapStart = sprintStart > monthStart ? sprintStart : monthStart;
      const overlapEnd = sprintEnd < monthEnd ? sprintEnd : monthEnd;

      if (overlapStart <= overlapEnd && allocation.projectId) projectIds.add(allocation.projectId);
    });

    return Array.from(projectIds).map((projectId) => {
      const project: any = safeProjects.find((p: any) => p && p.id === projectId);
      return project ? project.name : 'Unknown Project';
    });
  };

  const getUtilizationPercentage = (employeeId: string, month: Date): number => {
    const allocatedDays = getAllocationDaysForMonth(employeeId, month);
    const workingDays = getWorkingDaysInMonth(month, employeeId);
    if (workingDays === 0) return 0;
    return Math.round((allocatedDays / workingDays) * 100);
  };

  // ✅ Role summaries based on active employees only
  const getRoleSummaryForMonth = (role: string, month: Date) => {
    const roleEmployees = (filteredEmployeesForCalc || []).filter((emp: any) => emp?.role === role);
    let totalAvailable = 0;
    let totalUtilized = 0;

    roleEmployees.forEach((employee: any) => {
      totalAvailable += getWorkingDaysInMonth(month, employee.id);
      totalUtilized += getAllocationDaysForMonth(employee.id, month);
    });

    return {
      totalAvailable,
      totalUtilized,
      utilization: totalAvailable > 0 ? Math.round((totalUtilized / totalAvailable) * 100) : 0,
    };
  };

  // ✅ Unique roles from calc employees (prevents role summary showing roles that only exist as archived)
  const uniqueRoles = React.useMemo(() => {
    try {
      if (!Array.isArray(filteredEmployeesForCalc)) return [];
      const validRoles = filteredEmployeesForCalc
        .map((emp: any) => emp?.role)
        .filter((role: any) => role && typeof role === 'string');

      return Array.from(new Set(validRoles)).sort();
    } catch (error) {
      console.error('ProfessionView: Error creating uniqueRoles', error);
      return [];
    }
  }, [filteredEmployeesForCalc]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Resource Allocation by Role</h2>

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

            {(months || []).map((month) => (
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
                    <div className="text-xs text-blue-600 mt-1">{summary.utilization}% utilized</div>
                    <div className="text-xs mt-1">{summary.totalAvailable - summary.totalUtilized}d available</div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Employee Rows (rendering can still include archived if your filtering does) */}
          {(filteredEmployeesForRender || []).map((employee: any) => {
            const isArchived = !!employee?.archived;

            return (
              <div
                key={employee.id}
                className={`flex border-b hover:bg-gray-50 ${isArchived ? 'opacity-60 bg-gray-50' : ''}`}
                title={isArchived ? 'Archived employee' : undefined}
              >
                <div className="w-48 p-3 border-r">
                  <div className="font-medium">{employee.name}</div>
                  <div className="text-sm text-gray-500">{employee.role}</div>
                  {isArchived && <div className="text-xs text-gray-500 mt-1">Archived</div>}
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
                          <span className="text-sm font-medium text-blue-600">{monthlyAllocation}d</span>
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
                            {utilizationPercentage > 100 ? 'Overallocated' : utilizationPercentage > 80 ? 'High load' : 'Available'}
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
            );
          })}

          {/* If you want archived employees fully hidden in this view, change filteredEmployeesForRender -> filteredEmployeesForCalc above */}
        </div>
      </div>
    </div>
  );
};

export default ProfessionView;
