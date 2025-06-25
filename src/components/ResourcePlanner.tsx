
import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { usePlanner } from '../contexts/PlannerContext';
import EmployeeRow from './EmployeeRow';
import DroppableCell from './DroppableCell';
import ProjectsSidebar from './ProjectsSidebar';
import ProjectTimelineView from './ProjectTimelineView';
import TimeframeSelector, { TimeframeOption, GranularityOption } from './TimeframeSelector';
import { useTimeframeWeeks } from '../hooks/useTimeframeWeeks';
import { Project } from '../types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ResourcePlanner: React.FC = () => {
  const { employees, loading } = usePlanner();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isProjectTimelineOpen, setIsProjectTimelineOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  
  const { timeframe, granularity, weeks, setTimeframe, setGranularity } = useTimeframeWeeks();

  const handleProjectTimelineOpen = (project: Project) => {
    setSelectedProject(project);
    setIsProjectTimelineOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading resource planner...</div>
      </div>
    );
  }

  // Get unique roles from employees
  const uniqueRoles = Array.from(new Set(employees.map(emp => emp.role)));
  
  // Filter employees by selected role
  const filteredEmployees = selectedRole === 'all' 
    ? employees 
    : employees.filter(emp => emp.role === selectedRole);

  // Calculate fixed column width for consistent alignment
  const employeeColumnWidth = 200;
  const weekColumnWidth = 150;
  const totalWeeksWidth = weeks.length * weekColumnWidth;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen bg-gray-50">
        <ProjectsSidebar />
        <div className="flex-1 overflow-hidden">
          <div className="p-4 border-b bg-white space-y-4">
            <TimeframeSelector
              timeframe={timeframe}
              granularity={granularity}
              onTimeframeChange={setTimeframe}
              onGranularityChange={setGranularity}
            />
            
            {/* Role Filter */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Filter by Role:</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {uniqueRoles.map(role => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
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
                  
                  {/* Week Headers */}
                  <div className="flex" style={{ width: `${totalWeeksWidth}px` }}>
                    {weeks.map((week) => (
                      <div
                        key={week.id}
                        className="flex-shrink-0 p-2 text-center text-sm font-medium text-gray-700 border-r bg-gray-50"
                        style={{ width: `${weekColumnWidth}px` }}
                      >
                        <div className="truncate" title={week.label}>
                          {week.label}
                        </div>
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
                      <EmployeeRow employee={employee} weeks={weeks} />
                    </div>
                    
                    {/* Allocation Columns */}
                    <div className="flex" style={{ width: `${totalWeeksWidth}px` }}>
                      {weeks.map((week) => (
                        <div
                          key={`${employee.id}-${week.id}`}
                          className="flex-shrink-0"
                          style={{ width: `${weekColumnWidth}px` }}
                        >
                          <DroppableCell
                            employeeId={employee.id}
                            weekId={week.id}
                            granularity={granularity}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProjectTimelineView
        project={selectedProject}
        isOpen={isProjectTimelineOpen}
        onClose={() => {
          setIsProjectTimelineOpen(false);
          setSelectedProject(null);
        }}
      />
    </DndProvider>
  );
};

export default ResourcePlanner;
