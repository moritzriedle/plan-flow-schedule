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

  // ✅ new: compact mode (default on)
  const [compact, setCompact] = useState<boolean>(true);

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
    return employees.filter((emp) => emp && emp.role && typeof emp.role === 'string');
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
        ? safeEmployees.map((emp) => emp?.role).filter((role) => typeof role === 'string')
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
        return allocations.some((alloc) => {
          const employee = safeEmployees.find((emp) => emp?.id === alloc?.employeeId);
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

  const leftColClass = compact ? 'w-56' : 'w-64';
  const monthColMinW = compact ? 'min-w-[80px]' : 'min-w-[100px]';

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

            {/* ✅ Compact Toggle */}
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
          <div className="flex border-b sticky top-0 bg-white z-20 shadow-sm">
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
}

const ProjectGanttRow: React.FC<ProjectGanttRowProps> = ({
  project,
  months,
  isExpanded,
  onToggleExpand,
  compact = false,
  leftColClass,
  monthColMinW,
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

  return (
    <>
      <div className={`flex border-b hover:bg-gray-50 ${project.archived ? 'bg-gray-100 opacity-60' : ''}`}>
        {/* Left column */}
        <div
          className={[
            leftColClass,
            'flex-shrink-0 border-r',
            compact ? 'px-2 py-2' : 'p-3',
          ].join(' ')}
          style={{ borderLeftColor: `var(--project-${project.color})`, borderLeftWidth: '4px' }}
        >
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <div className={compact ? 'text-sm font-medium leading-tight truncate' : 'font-medium'}>
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

              <div className={compact ? 'text-[11px] text-gray-500 mt-1 leading-tight' : 'text-xs text-gray-500 mt-1'}>
                <span className="font-medium">{totalAllocation}d</span> allocated
                {projectLead && <div className="mt-0.5">Lead: {projectLead.name}</div>}
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {project.ticketReference && (
                <a
                  href={generateLink(project.ticketReference) || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={compact ? 'text-blue-600 hover:underline text-xs' : 'text-blue-600 hover:underline'}
                >
                  {project.ticketReference}
                </a>
              )}

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
                {isActive && (
                  <div
                    className={[
                      'h-full w-full',
                      compact ? 'px-1 py-0.5 flex items-center justify-center' : 'p-2 flex items-center justify-center',
                    ].join(' ')}
                    style={{ backgroundColor: `rgba(var(--project-${project.color}-rgb), 0.2)` }}
                  >
                    {/* In compact mode: tiny marker, not a full badge */}
                    {compact ? (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full border"
                        style={{
                          borderColor: `var(--project-${project.color})`,
                          color: `var(--project-${project.color})`,
                          backgroundColor: 'rgba(255,255,255,0.6)',
                        }}
                        title="active"
                      >
                        •
                      </span>
                    ) : (
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: `var(--project-${project.color})`,
                          color: `var(--project-${project.color})`,
                        }}
                      >
                        active
                      </Badge>
                    )}
                  </div>
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
