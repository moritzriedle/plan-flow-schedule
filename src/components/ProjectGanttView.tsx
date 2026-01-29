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
  if (!ticketRef?.trim()) return null;
  const projectKey = ticketRef.split('-')[0];
  return `https://proglove.atlassian.net/jira/polaris/projects/${projectKey}/ideas/view/3252935?selectedIssue=${ticketRef.trim()}`;
};

const toDate = (d: any): Date | null => {
  if (!d) return null;
  if (d instanceof Date) return Number.isNaN(d.getTime()) ? null : d;
  const parsed = new Date(d);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const ProjectGanttView = () => {
  const { projects, employees, getProjectAllocations } = usePlanner();

  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showArchived, setShowArchived] = useState<boolean>(false);

  // ✅ compact mode (default on)
  const [compact, setCompact] = useState<boolean>(true);

  if (!projects?.length) {
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

  const safeEmployees = useMemo(() => {
    if (!employees || !Array.isArray(employees)) return [];
    return employees.filter((emp) => emp && typeof emp === 'object');
  }, [employees]);

  const safeSelectedRoles = useMemo(() => {
    return Array.isArray(selectedRoles)
      ? selectedRoles.filter((role) => role && typeof role === 'string')
      : [];
  }, [selectedRoles]);

  // Get unique roles from employees
  const uniqueRoles = useMemo(() => {
    try {
      const validRoles = Array.isArray(safeEmployees)
        ? safeEmployees.map((emp: any) => emp?.role).filter((role) => typeof role === 'string')
        : [];
      return Array.from(new Set(validRoles)).sort();
    } catch {
      return [];
    }
  }, [safeEmployees]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    if (!Array.isArray(projects)) return [];

    let base = projects;

    if (!showArchived) {
      base = base.filter((project) => !project.archived);
    }

    if (safeSelectedRoles.length > 0) {
      base = base.filter((project) => {
        const allocations = getProjectAllocations(project?.id) || [];
        return allocations.some((alloc: any) => {
          const employee = safeEmployees.find((emp: any) => emp?.id === alloc?.employeeId);
          return employee && safeSelectedRoles.includes(employee.role);
        });
      });
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      base = base.filter((project) => project?.name?.toLowerCase().includes(q));
    }

    return base;
  }, [projects, showArchived, safeSelectedRoles, safeEmployees, getProjectAllocations, searchTerm]);

  // Rolling 12-month view
  const currentDate = new Date();
  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(addMonths(currentDate, 11));
  const months = eachMonthOfInterval({ start: startDate, end: endDate });

  const toggleExpandProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) newExpanded.delete(projectId);
    else newExpanded.add(projectId);
    setExpandedProjects(newExpanded);
  };

  const leftColClass = compact ? 'w-[360px]' : 'w-[420px]';
  const monthColMinW = compact ? 'min-w-[70px]' : 'min-w-[90px]';

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
                <ProjectMonthDetails project={project} month={months[0]} />
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
  const allocations = getProjectAllocations(project.id) || [];
  const totalAllocation = allocations.reduce((sum, alloc: any) => sum + (alloc?.days || 0), 0);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const projectStart = toDate((project as any)?.startDate ?? (project as any)?.start_date ?? null);
  const projectEnd = toDate((project as any)?.endDate ?? (project as any)?.end_date ?? null);

  const isActiveInMonth = (month: Date) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    // If dates are missing, don’t paint anything
    if (!projectStart || !projectEnd) return false;

    return projectStart <= monthEnd && projectEnd >= monthStart;
  };

  const projectLeadId = (project as any)?.leadId ?? (project as any)?.lead_id ?? null;
  const projectLead = projectLeadId ? getEmployeeById(projectLeadId) : null;
  const jiraUrl = project.ticketReference ? generateLink(project.ticketReference) : null;

  return (
    <>
      <div
        className={[
          'flex border-b hover:bg-gray-50',
          project.archived ? 'bg-gray-100 opacity-60' : '',
        ].join(' ')}
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

              {/* Non-compact keeps meta visible */}
              {!compact && (
                <div className="text-xs text-gray-500 mt-1 leading-tight">
                  <span className="font-medium">{totalAllocation}d</span> allocated
                  {projectLead && <span> · Lead: {projectLead.name}</span>}
                  {project.ticketReference && jiraUrl && (
                    <>
                      <span> · </span>
                      <a
                        href={jiraUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
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

      <ProjectEditDialog project={project} isOpen={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} />
    </>
  );
};

export default ProjectGanttView;
