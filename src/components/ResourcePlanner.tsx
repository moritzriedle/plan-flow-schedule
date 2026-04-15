
import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { usePlanner } from '../contexts/PlannerContext';
import ProjectsSidebar from './ProjectsSidebar';
import EmployeeEditor from './EmployeeEditor';
import AddProjectDialog from './AddProjectDialog';
import { AddEmployeeDialog } from './AddEmployeeDialog';
import { DetailedAllocationDialog } from './DetailedAllocationDialog';
import ResourcePlannerHeader from './ResourcePlannerHeader';
import ResourcePlannerGrid from './ResourcePlannerGrid';
import { useTimeframeSprints } from '../hooks/useTimeframeSprints';
import { Project, Employee } from '../types';
import { Button } from '@/components/ui/button';
import { Plus, FlaskConical, Eye } from 'lucide-react';
import ProjectTimelineView from './ProjectTimelineView';
import { ROLE_OPTIONS } from '@/constants/roles';
import { findActiveSprint } from '@/utils/sprintUtils';
import { useScenarioStore } from '@/hooks/useScenarioStore';
import ScenarioBanner from './Scenario/ScenarioBanner';
import ScenarioProjectSelector from './Scenario/ScenarioProjectSelector';
import ScenarioPanel from './Scenario/ScenarioPanel';
import SavedScenariosDialog from './Scenario/SavedScenariosDialog';

const ResourcePlanner: React.FC = () => {
  const plannerData = usePlanner();
  const { employees = [], projects = [], allocations = [], loading, allocateToProjectTimeline, getAvailableDays, createSprintAllocation } = plannerData;

  const safeEmployees = React.useMemo(() => {
    if (!employees || !Array.isArray(employees)) return [];
    return employees.filter(emp => emp && emp.id);
  }, [employees]);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [forceShowContent, setForceShowContent] = useState(false);

  useEffect(() => {
    if (loading) {
      const fallbackTimer = setTimeout(() => {
        setForceShowContent(true);
      }, 15000);
      return () => clearTimeout(fallbackTimer);
    } else {
      setForceShowContent(false);
    }
  }, [loading]);

  const [isProjectTimelineOpen, setIsProjectTimelineOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showUnallocatedOnly, setShowUnallocatedOnly] = useState(false);
  const [showArchivedEmployees, setShowArchivedEmployees] = useState(false);
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEmployeeEditorOpen, setIsEmployeeEditorOpen] = useState(false);
  const [isDetailedAllocationOpen, setIsDetailedAllocationOpen] = useState(false);
  const [allocationEmployee, setAllocationEmployee] = useState<Employee | null>(null);
  const [allocationProject, setAllocationProject] = useState<Project | null>(null);

  // Scenario state
  const [isScenarioSelectorOpen, setIsScenarioSelectorOpen] = useState(false);

  const { timeframe, sprints, setTimeframe } = useTimeframeSprints();

  const scenario = useScenarioStore(
    safeEmployees,
    allocations,
    projects,
    Array.isArray(sprints) ? sprints : [],
    getAvailableDays,
  );

  const safeRoleOptions = React.useMemo(() => {
    const fromEmployees = Array.isArray(safeEmployees)
      ? safeEmployees.map(emp => emp?.role).filter((role): role is string => typeof role === 'string' && role.trim() !== '')
      : [];
    const fromConstants = Array.isArray(ROLE_OPTIONS)
      ? ROLE_OPTIONS.filter(role => typeof role === 'string' && role.trim() !== '')
      : [];
    return Array.from(new Set([...fromEmployees, ...fromConstants]));
  }, [safeEmployees]);

  const safeSelectedRoles = React.useMemo(() => {
    if (!selectedRoles || !Array.isArray(selectedRoles)) return [];
    return selectedRoles.filter(role => role && typeof role === 'string');
  }, [selectedRoles]);

  const filteredEmployees = React.useMemo(() => {
    try {
      let filtered = safeEmployees;
      if (!showArchivedEmployees) filtered = filtered.filter(emp => !emp.archived);
      if (safeSelectedRoles.length > 0) {
        filtered = filtered.filter(emp => emp?.role && safeSelectedRoles.includes(emp.role));
      }
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase().trim();
        filtered = filtered.filter(emp => emp?.name?.toLowerCase().includes(searchLower));
      }
      if (showUnallocatedOnly) {
        const activeSprint = findActiveSprint(sprints);
        if (activeSprint) {
          filtered = filtered.filter(emp => {
            const employeeAllocations = plannerData.getEmployeeAllocations(emp.id);
            return !employeeAllocations.some(allocation => allocation.sprintId === activeSprint.id);
          });
        }
      }
      return filtered;
    } catch {
      return safeEmployees;
    }
  }, [safeEmployees, safeSelectedRoles, searchTerm, showUnallocatedOnly, showArchivedEmployees, sprints, plannerData]);

  const handleRoleChange = (roles: string[]) => {
    setSelectedRoles(Array.isArray(roles) ? roles.filter(role => role && typeof role === 'string') : []);
  };

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

  const handleAllocationComplete = async (params: {
    employeeId: string;
    projectId: string;
    sprintId: string;
    days: number;
  }) => {
    await plannerData.createSprintAllocation(params);
  };

  const scenarioProject = scenario.activeScenario
    ? projects.find(p => p.id === scenario.activeScenario!.projectId)
    : undefined;
  const scenarioLead = scenarioProject?.leadId
    ? safeEmployees.find(e => e.id === scenarioProject.leadId)
    : undefined;

  const hardConflicts = scenario.conflicts.filter(c => c.type === 'hard').length;
  const warningConflicts = scenario.conflicts.filter(c => c.type === 'warning').length;

  if (loading && !forceShowContent) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading resource planner...</div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen bg-background">
        <div className="w-80 border-r bg-card p-4 overflow-y-auto">
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Projects</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drag projects to allocate resources or click for details
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => setIsAddProjectDialogOpen(true)}
                className="w-full"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Project
              </Button>
              <Button
                onClick={() => setIsScenarioSelectorOpen(true)}
                className="w-full"
                variant="outline"
              >
                <FlaskConical className="w-4 h-4 mr-2" />
                Pre-G2 Planning
              </Button>
              <Button
                onClick={() => { scenario.setShowSavedScenarios(true); scenario.loadSavedScenarios(); }}
                className="w-full"
                variant="ghost"
                size="sm"
              >
                <Eye className="w-4 h-4 mr-2" />
                Show Saved Scenarios
              </Button>
            </div>
          </div>
          <ProjectsSidebar />
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Scenario Banner */}
          {scenario.scenarioMode && scenario.activeScenario && (
            <ScenarioBanner
              scenario={scenario.activeScenario}
              project={scenarioProject}
              projectLead={scenarioLead}
              isOutdated={scenario.isOutdated}
              conflictCount={hardConflicts}
              warningCount={warningConflicts}
              onSave={scenario.saveScenario}
              onCommit={() => scenario.commitScenario(createSprintAllocation)}
              onExit={scenario.exitScenario}
              onShift={scenario.shiftScenario}
            />
          )}

          <ResourcePlannerHeader
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
            selectedRoles={safeSelectedRoles}
            onRoleChange={handleRoleChange}
            availableRoles={safeRoleOptions}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            showUnallocatedOnly={showUnallocatedOnly}
            onShowUnallocatedChange={setShowUnallocatedOnly}
            showArchivedEmployees={showArchivedEmployees}
            onShowArchivedEmployeesChange={setShowArchivedEmployees}
            onAddProject={() => setIsAddProjectDialogOpen(true)}
            onAddEmployee={() => setIsAddEmployeeDialogOpen(true)}
          />

          <ResourcePlannerGrid
            filteredEmployees={filteredEmployees}
            sprints={Array.isArray(sprints) ? sprints : []}
            onEmployeeEdit={handleEmployeeEdit}
            scenarioMode={scenario.scenarioMode}
            scenarioAllocations={scenario.scenarioAllocations}
            scenarioProject={scenarioProject}
            scenarioConflicts={scenario.conflicts}
            onAddScenarioAllocation={scenario.addScenarioAllocation}
            onUpdateScenarioAllocation={scenario.updateScenarioAllocation}
            onDeleteScenarioAllocation={scenario.deleteScenarioAllocation}
            getScenarioAllocationsForCell={scenario.getScenarioAllocationsForCell}
            getConflictsForCell={scenario.getConflictsForCell}
          />

          {/* Scenario Panel */}
          {scenario.scenarioMode && scenario.activeScenario && (
            <ScenarioPanel
              scenarioAllocations={scenario.scenarioAllocations}
              conflicts={scenario.conflicts}
              sprints={Array.isArray(sprints) ? sprints : []}
              employees={safeEmployees}
              projectId={scenario.activeScenario.projectId}
              onAddPlaceholder={scenario.addPlaceholderAllocation}
              onAddNamed={scenario.addScenarioAllocation}
              onUpdateAllocation={scenario.updateScenarioAllocation}
              onDeleteAllocation={scenario.deleteScenarioAllocation}
            />
          )}
        </div>
      </div>

      <ProjectTimelineView
        project={selectedProject}
        isOpen={isProjectTimelineOpen}
        onClose={() => { setIsProjectTimelineOpen(false); setSelectedProject(null); }}
        selectedRoles={safeSelectedRoles}
        onRoleChange={handleRoleChange}
      />

      <AddProjectDialog open={isAddProjectDialogOpen} onOpenChange={setIsAddProjectDialogOpen} />
      <AddEmployeeDialog open={isAddEmployeeDialogOpen} onOpenChange={setIsAddEmployeeDialogOpen} />

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
          sprints={Array.isArray(sprints) ? sprints : []}
          onAllocate={handleAllocationComplete}
        />
      )}

      <ScenarioProjectSelector
        open={isScenarioSelectorOpen}
        onOpenChange={setIsScenarioSelectorOpen}
        projects={projects}
        onSelect={scenario.startScenario}
      />

      <SavedScenariosDialog
        open={scenario.showSavedScenarios}
        onOpenChange={scenario.setShowSavedScenarios}
        scenarios={scenario.savedScenarios}
        projects={projects}
        onLoad={scenario.startScenario}
      />
    </DndProvider>
  );
};

export default ResourcePlanner;
