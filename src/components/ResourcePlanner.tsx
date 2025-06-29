
import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { usePlanner } from '../contexts/PlannerContext';
import EmployeeRow from './EmployeeRow';
import DroppableCell from './DroppableCell';
import ProjectsSidebar from './ProjectsSidebar';
import ProjectTimelineView from './ProjectTimelineView';
import TimeframeSelector from './TimeframeSelector';
import MultiRoleSelector from './MultiRoleSelector';
import { AddProjectDialog } from './AddProjectDialog';
import { AddEmployeeDialog } from './AddEmployeeDialog';
import { useTimeframeSprints } from '../hooks/useTimeframeSprints';
import { getSprintDateRange } from '../utils/sprintUtils';
import { Project } from '../types';
import { Button } from '@/components/ui/button';
import { Plus, UserPlus } from 'lucide-react';

const ResourcePlanner: React.FC = () => {
  const { employees, loading } = usePlanner();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isProjectTimelineOpen, setIsProjectTimelineOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = useState(false);
  
  const { timeframe, sprints, setTimeframe } = useTimeframeSprints();

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
  
  // Filter employees by selected roles
  const filteredEmployees = selectedRoles.length === 0 
    ? employees 
    : employees.filter(emp => selectedRoles.includes(emp.role));

  // Calculate fixed column width for consistent alignment
  const employeeColumnWidth = 200;
  const sprintColumnWidth = 150;
  const totalSprintsWidth = sprints.length * sprintColumnWidth;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen bg-gray-50">
        <div className="w-80 border-r bg-white p-4 overflow-y-auto">
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Projects</h3>
            <p className="text-sm text-gray-600 mb-4">
              Drag projects to allocate resources or click for details
            </p>
            <Button 
              onClick={() => setIsAddProjectDialogOpen(true)}
              className="w-full mb-4"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Project
            </Button>
          </div>
          <ProjectsSidebar />
        </div>
        
        <div className="flex-1 overflow-hidden">
          <div className="p-4 border-b bg-white space-y-4">
            <div className="flex justify-between items-center">
              <TimeframeSelector
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
              />
              
              <Button 
                onClick={() => setIsAddEmployeeDialogOpen(true)}
                variant="outline"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Team Member
              </Button>
            </div>
            
            {/* Role Filter */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Filter by Role:</label>
              <MultiRoleSelector
                roles={uniqueRoles}
                selectedRoles={selectedRoles}
                onRoleChange={setSelectedRoles}
                placeholder="All Roles"
              />
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
                  
                  {/* Sprint Headers */}
                  <div className="flex" style={{ width: `${totalSprintsWidth}px` }}>
                    {sprints.map((sprint) => (
                      <div
                        key={sprint.id}
                        className="flex-shrink-0 p-2 text-center text-sm font-medium text-gray-700 border-r bg-gray-50"
                        style={{ width: `${sprintColumnWidth}px` }}
                      >
                        <div className="truncate font-semibold" title={sprint.name}>
                          {sprint.name}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {getSprintDateRange(sprint)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {sprint.workingDays.length} days
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
                      <EmployeeRow employee={employee} sprints={sprints} />
                    </div>
                    
                    {/* Allocation Columns */}
                    <div className="flex" style={{ width: `${totalSprintsWidth}px` }}>
                      {sprints.map((sprint) => (
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

      <AddProjectDialog 
        open={isAddProjectDialogOpen} 
        onOpenChange={setIsAddProjectDialogOpen} 
      />

      <AddEmployeeDialog 
        open={isAddEmployeeDialogOpen} 
        onOpenChange={setIsAddEmployeeDialogOpen} 
      />
    </DndProvider>
  );
};

export default ResourcePlanner;
