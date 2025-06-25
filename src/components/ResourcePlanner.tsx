
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

const ResourcePlanner: React.FC = () => {
  const { employees, loading } = usePlanner();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isProjectTimelineOpen, setIsProjectTimelineOpen] = useState(false);
  
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

  // Calculate fixed column width for consistent alignment
  const employeeColumnWidth = 200; // Fixed width for employee names
  const weekColumnWidth = 150; // Fixed width for each week column
  const totalWeeksWidth = weeks.length * weekColumnWidth;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen bg-gray-50">
        <ProjectsSidebar />
        <div className="flex-1 overflow-hidden">
          <div className="p-4 border-b bg-white">
            <TimeframeSelector
              timeframe={timeframe}
              granularity={granularity}
              onTimeframeChange={setTimeframe}
              onGranularityChange={setGranularity}
            />
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
                {employees.map((employee) => (
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
