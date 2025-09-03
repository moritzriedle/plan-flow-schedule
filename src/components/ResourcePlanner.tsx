
import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { usePlanner } from '../contexts/PlannerContext';
import ProjectsSidebar from './ProjectsSidebar';
// import ProjectTimelineView from './ProjectTimelineView';
import EmployeeEditor from './EmployeeEditor';
import AddProjectDialog from './AddProjectDialog';
import { AddEmployeeDialog } from './AddEmployeeDialog';
import { DetailedAllocationDialog } from './DetailedAllocationDialog';
import ResourcePlannerHeader from './ResourcePlannerHeader';
import ResourcePlannerGrid from './ResourcePlannerGrid';
import { useTimeframeSprints } from '../hooks/useTimeframeSprints';
import { Project, Employee } from '../types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ProjectTimelineView from './ProjectTimelineView';
import { ROLE_OPTIONS } from '@/constants/roles';

const ResourcePlanner: React.FC = () => {
  const plannerData = usePlanner();
  const { employees = [], loading, allocateToProjectTimeline } = plannerData;
   // Ensure employees is always a valid array
  const safeEmployees = React.useMemo(() => {
    if (!employees || !Array.isArray(employees)) {
      console.warn('ResourcePlanner: employees is not a valid array', { employees });
      return [];
    }
    return employees.filter(emp => emp && emp.id);
  }, [employees]);
  
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [forceShowContent, setForceShowContent] = useState(false);
  
  // Fallback mechanism: if loading is stuck for too long, show content anyway
  useEffect(() => {
    if (loading) {
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
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEmployeeEditorOpen, setIsEmployeeEditorOpen] = useState(false);
  const [isDetailedAllocationOpen, setIsDetailedAllocationOpen] = useState(false);
  const [allocationEmployee, setAllocationEmployee] = useState<Employee | null>(null);
  const [allocationProject, setAllocationProject] = useState<Project | null>(null);
  
  const { timeframe, sprints, setTimeframe } = useTimeframeSprints();
 
   const safeRoleOptions = React.useMemo(() => {
  const fromEmployees = Array.isArray(safeEmployees)
    ? safeEmployees
        .map(emp => emp?.role)
        .filter((role): role is string => typeof role === 'string' && role.trim() !== '')
    : [];

  const fromConstants = Array.isArray(ROLE_OPTIONS)
    ? ROLE_OPTIONS.filter(role => typeof role === 'string' && role.trim() !== '')
    : [];

  const allRoles = [...fromEmployees, ...fromConstants];

  return Array.from(new Set(allRoles)); // remove duplicates
}, [safeEmployees]);

  
  // Ensure selectedRoles is always a valid array
  const safeSelectedRoles = React.useMemo(() => {
    if (!selectedRoles || !Array.isArray(selectedRoles)) {
      console.warn('ResourcePlanner: selectedRoles is not a valid array', { selectedRoles });
      return [];
    }
    return selectedRoles.filter(role => role && typeof role === 'string');
  }, [selectedRoles]);

 // Filter employees by selected roles and search term with comprehensive safety checks
  const filteredEmployees = React.useMemo(() => {
    try {
      let filtered = safeEmployees;
      
      // Filter by roles
      if (safeSelectedRoles.length > 0) {
        filtered = filtered.filter(emp => {
          if (!emp || !emp.role || typeof emp.role !== 'string') {
            console.warn('ResourcePlanner: Employee missing valid role', { emp });
            return false;
          }
          return safeSelectedRoles.includes(emp.role);
        });
      }
      
      // Filter by search term
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase().trim();
        filtered = filtered.filter(emp => {
          if (!emp || !emp.name || typeof emp.name !== 'string') {
            return false;
          }
          return emp.name.toLowerCase().includes(searchLower);
        });
      }
      
      return filtered;
    } catch (error) {
      console.error('ResourcePlanner: Error filtering employees', error);
      return safeEmployees;
    }
  }, [safeEmployees, safeSelectedRoles, searchTerm]);

  const handleRoleChange = (roles: string[]) => {
    try {
      const safeRoles = Array.isArray(roles) ? roles.filter(role => role && typeof role === 'string') : [];
      setSelectedRoles(safeRoles);
    } catch (error) {
      console.error('ResourcePlanner: Error in handleRoleChange', error);
      setSelectedRoles([]);
    }
  };

  // Final defensive fallback before render
  if (!Array.isArray(safeSelectedRoles)) {
    console.warn('safeSelectedRoles not iterable — defaulting to empty array');
  }

  if (!Array.isArray(safeRoleOptions)) {
    console.warn('safeRoleOptions not iterable — defaulting to empty array');
  }
  
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
            selectedRoles={safeSelectedRoles}
            onRoleChange={handleRoleChange}
            availableRoles={safeRoleOptions}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
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
  selectedRoles={safeSelectedRoles}
  onRoleChange={handleRoleChange}
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
