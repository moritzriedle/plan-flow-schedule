import React, { useMemo, useState } from 'react';
import { usePlanner } from '@/contexts/PlannerContext';
import { format, addMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Project } from '@/types';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Edit } from 'lucide-react';
import ProjectEditDialog from './ProjectEditDialog';
import ProjectMonthDetails from './ProjectMonthDetails';
import MultiRoleSelector from './MultiRoleSelector';

// ✅ Helper to generate Jira ticket URL
const generateLink = (ticketRef: string) => {
  if (!ticketRef.trim()) return null;
  const projectKey = ticketRef.split('-')[0];
  return `https://proglove.atlassian.net/jira/polaris/projects/${projectKey}/ideas/view/3252935?selectedIssue=${ticketRef.trim()}`;
};

const ProjectGanttView = () => {
  const { projects, employees, getProjectAllocations } = usePlanner();

  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showArchived, setShowArchived] = useState<boolean>(false);

  // ✅ compact mode (default on)
  const [compact, setCompact] = useState<boolean>(true);

  // ✅ new: hovered row inspector (compact only)
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);

  // Handle case where projects array is empty
  if (!projects.length) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Project Timeline (Gantt View)</h2>
          <p className="text-sm text-muted-foreground">Monthly timeline of all projects</p>
        </div>
        <div className="p-8 text-center text-gray-500">
          <p>No projects available</p>
        </div>
      </div>
    );
  }

  // Ensure arrays are safe with comprehensive checks
  const safeEmployees = useMemo(() => {
    if (!employees || !Array.isArray(employees)) {
      console.warn('ProjectGanttView: employees is not a valid array', { employees });
      return [];
    }
    // keep only plausible employee objects
    return employees.filter((emp) => emp && typeof emp === 'object');
  }, [employees]);

  const safeSelectedRoles = useMemo(() => {
    if (!selectedRoles || !Array.isArray(selectedRoles)) {
      console.warn('ProjectGanttView: selectedRoles is not a valid array', { selectedRoles });
      return [];
    }
    return selectedRoles.filter((role) => role && typeof role === 'string');
  }, [selectedRoles]);

  // Get unique roles from employees
  const uniqueRoles = useMemo(() => {
    try {
      const validRoles = Array.isArray(safeEmployees)
        ? safeEmployees.map((emp: any) => emp?.role).filter((role) => typeof role === 'string')
        : [];

      const roleSet = new Set(validRoles);

      if (roleSet && typeof roleSet[Symbol.iterator] === 'function') {
        return Array.from(roleSet).sort();
      } else {
        console.warn('ProjectGanttView: roleSet is not iterable', roleSet);
        return [];
      }
    } catch (error) {
      console.error('ProjectGanttView: Error computing uniqueRoles', error);
      return [];
    }
  }, [safeEmployees]);

  // Filter projects based on selected roles and project
  const filteredProjects = useMemo(() => {
    if (!Array.isArray(projects)) return [];

    let base = projects;

    // Filter archived projects
    if (!showArchived) {
      base = base.filter((project) => !project.archived);
    }

    // ✅ Filter by role
    if (Array.isArray(safeSelectedRoles) && safeSelectedRoles.length > 0) {
      base = base.filter((project) => {
        const allocations = getProjectAllocations(project?.id) || [];
        return allocations.some((alloc: any) => {
          const employee = safeEmployees.find((emp: any) => emp?.id === alloc?.employeeId);
          return employee && safeSelectedRoles.includes(employee.role);
        });
      });
    }

    // ✅ Filter by search term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      base = base.filter((project) => project?.name?.toLowerCase().includes(q));
    }

    return base;
  }, [projects, safeSelectedRoles, safeEmployees, getProjectAllocations, searchTerm, showArchived]);

  // Rolling 12-month view: current month to 11 months forward
  const currentDate = new Date();
  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(addMonths(currentDate, 11));

  // Generate an array of months for the header
  const months = eachMonthOfInterval({ start: startDate, end: endDate });

  const toggleExpandProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) newExpanded.delete(projectId);
    else newExpanded.add(projectId);
    setExpandedProjects(newExpanded);
  };

  // ✅ give project names more room; reduce month width a bit
  const leftColClass = compact ? 'w-[360px]' : 'w-[420px]';
  const monthColMinW = compact ? 'min-w-[70px]' : 'min-w-[90px]';

  // ✅ hovered project inspector content (compact only)
  const hoveredProject = useMemo(() => {
    if (!compact || !hoveredProjectId) return null;
    return (filteredProjects || []).find((p) => p.id === hoveredProjectId) || null;
  }, [compact, hoveredProjectId, filteredProjects]);

  const hoveredMeta = useMemo(() => {
    if (!hoveredProject) return null;

    const allocations = getProjectAllocations(hoveredProject.id) || [];
    const totalAllocation = allocations.reduce((sum: number, alloc: any) => sum + (alloc?.days || 0), 0);

    const lead =
      hoveredProject.leadId ? (safeEmployees.find((e: any) => e?.id === hoveredProject.leadId) as any) : null;

    const jiraUrl = hoveredProject.ticketReference ? generateLink(hoveredProject.ticketReference) : null;

    return { totalAllocation, leadName: lead?.name || null, jiraUrl };
  }, [hoveredProject, getProjectAllocations, safeEmployees]);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-semibold">Project Timeline (Gantt View)</h2>
            <p className="text-sm text-muted-foreground">Monthly timeline of all projects</p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Filter by Role:</label>
              <MultiRoleSelector
                roles={uniqueRoles}
                selectedRoles={safeSelectedRoles}
                onRoleChange={setSelectedRoles}
                placeholder="All Roles"
              />
            </div>

            {/* Search filter */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              />
            </div>

            {/* Show Archived Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showArchivedGantt"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="showArchivedGantt" className="text-sm cursor-pointer">
                Show archived
              </label>
            </div>

            {/* Compact Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="compactGantt"
                checked={compact}
                onChange={(e) => setCompact(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="compactGantt" className="text-sm cursor-pointer">
                Compact
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-200px)] relative">
        <div className="min-w-max">
          {/* Month Headers */}
          <div className="flex border-b sticky top-0 bg-white z-30 shadow-sm">
            <div className={`${leftColClass} flex-shrink-0 bg-white`} />
            <div className="flex flex-1">
              {months.map((month, index) => (
                <div
                  key={index}
                  className={[
                    'flex-1 border-r bg-white text-center font-medium',
                    monthColMinW,
                    compact ? 'py-1 px-1 text-xs' : 'p-2 text-sm',
                  ].join(' ')}
                >
                  {format(month, compact ? 'MMM yy' : 'MMM yyyy')}
                </div>
              ))}
            </div>
          </div>

          {/* ✅ Compact hover inspector (no vertical whitespace inside rows) */}
          {compact && (
            <div className="sticky top-[33px] z-20 bg-white border-b">
              <div className="flex">
                <div className={`${leftColClass} flex-shrink-0 px-2 py-1 text-xs text-muted-foreground`}>
                  {hoveredProject && hoveredMeta ? (
                    <div className="truncate">
                      <span className="font-medium text-foreground">{hoveredProject.name}</span>
                      <span className="ml-2">{hoveredMeta.totalAllocation}d</span>
                      {hoveredMeta.leadName && <span className="ml-2">Lead: {hoveredMeta.leadName}</span>}
                      {hoveredProject.ticketReference && hoveredMeta.jiraUrl && (
                        <>
                          <span className="ml-2">·</span>
                          <a
                            href={hoveredMeta.jiraUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-blue-600 hover:underline"
                          >
                            {hoveredProject.ticketReference}
                          </a>
                        </>
                      )}
                      {hoveredProject.archived && (
                        <span className="ml-2 inline-flex align-middle">
                          <Badge variant="secondary" className="text-[10px] px-1 py-0">
                            Archived
                          </Badge>
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="opacity-60">Hover a project to see details</span>
                  )}
                </div>

                {/* filler cells to keep grid aligned */}
                <div className="flex flex-1">
                  {months.map((_, i) => (
                    <div key={i} className={['flex-1 border-r', monthColMinW].join(' ')} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Project Rows */}
          {(filteredProjects || []).map((project) => (
            <div key={project.id}>
              <ProjectGanttRow
                project={project}
                months={months}
                isExpanded={expandedProjects.has(project.id)}
                onToggleExpand={() => toggleExpandProject(project.id)}
                compact={compact}
                leftColClass={leftColClass}
                monthColMinW={monthColMinW}
                onHoverChange={(isHovering) => setHoveredProjectId(isHovering ? project.id : null)}
              />

              {expandedProjects.has(project.id) && (
                <div className="bg-gray-50 border-b">
                  <div className={compact ? 'p-3' : 'p-4'}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {months.map((month) => (
                        <div key={month.getTime()}>
                          <ProjectMonthDetails project={project} month={month} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface ProjectGanttRowProps {
  project: Project;
  months: Date[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  compact?: boolean;
  leftColClass: string;
  monthColMinW: string;
  onHoverChange?: (isHovering: boolean) => void;
}

const ProjectGanttRow: React.FC<ProjectGanttRowProps> = ({
  project,
  months,
  isExpanded,
  onToggleExpand,
  compact = false,
  leftColClass,
  monthColMinW,
  onHoverChange,
}) => {
  const { getProjectAllocations, getEmployeeById } = usePlanner();
  const allocations = getProjectAllocations(project.id);
  const totalAllocation = allocations.reduce((sum, alloc) => sum + alloc.days, 0);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Check if project is active in a given month
  const isActiveInMonth = (month: Date) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    return project.startDate <= monthEnd && project.endDate >= monthStart;
  };

  // Get project lead name
  const projectLead = project.leadId ? getEmployeeById(project.leadId) : null;
  const jiraUrl = project.ticketReference ? generateLink(project.ticketReference) : null;

  return (
    <>
      <div
        className={[
          'flex border-b hover:bg-gray-50',
          project.archived ? 'bg-gray-100 opacity-60' : '',
        ].join(' ')}
        onMouseEnter={() => onHoverChange?.(true)}
        onMouseLeave={() => onHoverChange?.(false)}
      >
        {/* Left column */}
        <div
          className={[
            leftColClass,
            'flex-shrink-0 border-r',
            compact ? 'px-2 py-1.5' : 'p-3',
          ].join(' ')}
          style={{ borderLeftColor: `var(--project-${project.color})`, borderLeftWidth: '4px' }}
        >
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              {/* More space + allow bulky names to wrap a bit when not compact */}
              <div className={compact ? 'text-sm font-medium leading-tight truncate' : 'font-medium leading-tight'}>
                {project.name}
              </div>

              {project.archived && (
                <Badge
                  variant="secondary"
                  className={compact ? 'text-[10px] mt-1 px-1 py-0 inline-flex' : 'text-xs mt-1'}
                >
                  Archived
                </Badge>
              )}

              {/* Non-compact keeps meta visible (compact uses the sticky inspector instead) */}
              {!compact && (
                <div className="text-xs text-gray-500 mt-1 leading-tight">
                  <span className="font-medium">{totalAllocation}d</span> allocated
                  {projectLead && <span> · Lead: {projectLead.name}</span>}
                  {project.ticketReference && jiraUrl && (
                    <>
                      <span> · </span>
                      <a href={jiraUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {project.ticketReference}
                      </a>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className={compact ? 'h-7 w-7 p-0' : 'h-8 w-8 p-0'}
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Edit className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
                <span className="sr-only">Edit project</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className={compact ? 'h-7 w-7 p-0' : 'h-8 w-8 p-0'}
                onClick={onToggleExpand}
              >
                {isExpanded ? (
                  <ChevronUp className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
                ) : (
                  <ChevronDown className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
                )}
                <span className="sr-only">Toggle details</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Month cells */}
        <div className="flex flex-1">
          {months.map((month, index) => {
            const isActive = isActiveInMonth(month);

            return (
              <div key={index} className={['flex-1 border-r relative', monthColMinW].join(' ')}>
                {/* Active = background highlight only */}
                {isActive && (
                  <div
                    className="h-full w-full"
                    style={{ backgroundColor: `rgba(var(--project-${project.color}-rgb), 0.2)` }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Project edit dialog */}
      <ProjectEditDialog project={project} isOpen={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} />
    </>
  );
};

export default ProjectGanttView;
