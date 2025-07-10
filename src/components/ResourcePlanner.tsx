
import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { usePlanner } from '../contexts/PlannerContext';
import ProjectsSidebar from './ProjectsSidebar';
import ProjectTimelineView from './ProjectTimelineView';
import EmployeeEditor from './EmployeeEditor';
import { AddProjectDialog } from './AddProjectDialog';
import { AddEmployeeDialog } from './AddEmployeeDialog';
import { DetailedAllocationDialog } from './DetailedAllocationDialog';
import ResourcePlannerHeader from './ResourcePlannerHeader';
import ResourcePlannerGrid from './ResourcePlannerGrid';
import { useTimeframeSprints } from '../hooks/useTimeframeSprints';
import { Project, Employee } from '../types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ROLE_OPTIONS } from '@/constants/roles';

const ResourcePlanner: React.FC = () => {
  const plannerData = usePlanner();
  const { employees = [], loading, allocateToProjectTimeline } = plannerData;
  
  console.log('ResourcePlanner: Render', { 
    loading, 
    employeesCount: employees?.length,
    plannerDataKeys: Object.keys(plannerData)
  });
  
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [forceShowContent, setForceShowContent] = useState(false);
  
  // Fallback mechanism: if loading is stuck for too long, show content anyway
  useEffect(() => {
    if (loading) {
      console.log('ResourcePlanner: Starting fallback timer for stuck loading');
      const fallbackTimer = setTimeout(() => {
        console.warn('ResourcePlanner: Loading stuck for 15 seconds, forcing content display');
        setForceShowContent(true);
      }, 15000);
      
      return () => {
        clearTimeout(fallbackTimer);
      };
    } else {
      setForceShowContent(false);
    }
  }, [loading]);
  const [isProjectTimelineOpen, setIsProjectTimelineOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEmployeeEditorOpen, setIsEmployeeEditorOpen] = useState(false);
  const [isDetailedAllocationOpen, setIsDetailedAllocationOpen] = useState(false);
  const [allocationEmployee, setAllocationEmployee] = useState<Employee | null>(null);
  const [allocationProject, setAllocationProject] = useState<Project | null>(null);
  
  const { timeframe, sprints, setTimeframe } = useTimeframeSprints();

  const handleProjectTimelineOpen = (project: Project) => {
    setSelectedProject(project);
    setIsProjectTimelineOpen(true);
  };

  const handleEmployeeEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEmployeeEditorOpen(true);
  };

  const handleEmployeeEditorClose = () => {
    setSelectedEmployee(null);
    setIsEmployeeEditorOpen(false);
  };

  const handleDetailedAllocation = (employee: Employee, project: Project) => {
    setAllocationEmployee(employee);
    setAllocationProject(project);
    setIsDetailedAllocationOpen(true);
  };

  const handleAllocationComplete = async (params: {
    employeeId: string;
    projectId: string;
    startDate: Date;
    endDate: Date;
    daysPerWeek: number;
  }) => {
    const daysPerWeekMap: { [key: number]: 1 | 3 | 5 } = {
      1: 1,
      2: 1,
      3: 3,
      4: 3,
      5: 5
    };
    
    const mappedDaysPerWeek = daysPerWeekMap[params.daysPerWeek] || 5;
    
    await allocateToProjectTimeline(
      params.employeeId,
      params.projectId,
      mappedDaysPerWeek
    );
  };

  if (loading && !forceShowContent) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading resource planner...</div>
        <div className="text-sm text-gray-500 mt-2">
          This is taking longer than expected. If stuck, please refresh the page.
        </div>
      </div>
    );
  }

  // Convert ROLE_OPTIONS to mutable array and ensure it's always an array
  const availableRoles = Array.isArray(ROLE_OPTIONS) ? [...ROLE_OPTIONS] : [];
  
  // Filter employees by selected roles with safety checks
  const safeEmployees = Array.isArray(employees) ? employees : [];
  const filteredEmployees = safeEmployees.length > 0
    ? (selectedRoles.length === 0 
        ? safeEmployees 
        : safeEmployees.filter(emp => emp && emp.role && selectedRoles.includes(emp.role)))
    : [];

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
          <ProjectsSidebar 
            onProjectTimelineOpen={handleProjectTimelineOpen}
            onDetailedAllocation={handleDetailedAllocation}
          />
        </div>
        
        <div className="flex-1 overflow-hidden">
          <ResourcePlannerHeader
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
            selectedRoles={selectedRoles}
            onRoleChange={setSelectedRoles}
            availableRoles={availableRoles}
            onAddProject={() => setIsAddProjectDialogOpen(true)}
            onAddEmployee={() => setIsAddEmployeeDialogOpen(true)}
          />
          
          <ResourcePlannerGrid
            filteredEmployees={filteredEmployees}
            sprints={Array.isArray(sprints) ? sprints : []}
            onEmployeeEdit={handleEmployeeEdit}
          />
        </div>
      </div>

      <ProjectTimelineView
        project={selectedProject}
        isOpen={isProjectTimelineOpen}
        onClose={() => {
          setIsProjectTimelineOpen(false);
          setSelectedProject(null);
        }}
        selectedRoles={selectedRoles}
        onRoleChange={setSelectedRoles}
      />

      <AddProjectDialog 
        open={isAddProjectDialogOpen} 
        onOpenChange={setIsAddProjectDialogOpen} 
      />

      <AddEmployeeDialog 
        open={isAddEmployeeDialogOpen} 
        onOpenChange={setIsAddEmployeeDialogOpen} 
      />

      {selectedEmployee && (
        <EmployeeEditor
          employee={selectedEmployee}
          isOpen={isEmployeeEditorOpen}
          onClose={handleEmployeeEditorClose}
        />
      )}

      {allocationEmployee && allocationProject && (
        <DetailedAllocationDialog
          isOpen={isDetailedAllocationOpen}
          onClose={() => {
            setIsDetailedAllocationOpen(false);
            setAllocationEmployee(null);
            setAllocationProject(null);
          }}
          employee={allocationEmployee}
          project={allocationProject}
          onAllocate={handleAllocationComplete}
        />
      )}
    </DndProvider>
  );
};

export default ResourcePlanner;
