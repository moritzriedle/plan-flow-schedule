import React, { useState, useMemo } from 'react';
import { usePlanner } from '../../contexts/PlannerContext';
import { useTimeframeSprints } from '../../hooks/useTimeframeSprints';
import { findActiveSprint } from '../../utils/sprintUtils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ArrowLeft, AlertTriangle, UserMinus } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProjectAlignmentCard from './ProjectAlignmentCard';
import { Sprint, Employee } from '../../types';

const AlignmentHubView: React.FC = () => {
  const { employees, projects, allocations, sprints: plannerSprints, loading } = usePlanner();
  const { sprints } = useTimeframeSprints();
  const [searchTerm, setSearchTerm] = useState('');

  // Get current sprint and next 2 sprints
  const relevantSprints = useMemo(() => {
    const activeSprint = findActiveSprint(sprints);
    if (!activeSprint) {
      // If no active sprint, take the first 3
      return sprints.slice(0, 3);
    }
    
    const activeIndex = sprints.findIndex(s => s.id === activeSprint.id);
    return sprints.slice(activeIndex, activeIndex + 3);
  }, [sprints]);

  // Filter projects by search term (excluding archived)
  const filteredProjects = useMemo(() => {
    const activeProjects = projects.filter(p => !p.archived);
    if (!searchTerm.trim()) return activeProjects;
    
    const searchLower = searchTerm.toLowerCase().trim();
    return activeProjects.filter(p => 
      p.name.toLowerCase().includes(searchLower)
    );
  }, [projects, searchTerm]);

  // Calculate overallocated employees across relevant sprints
  const overallocatedEmployees = useMemo(() => {
    const overallocated: Map<string, { employee: Employee; sprintId: string; totalDays: number }[]> = new Map();
    
    const activeEmployees = employees.filter(e => !e.archived);
    
    for (const sprint of relevantSprints) {
      for (const employee of activeEmployees) {
        const sprintAllocations = allocations.filter(
          a => a.employeeId === employee.id && a.sprintId === sprint.id
        );
        const totalDays = sprintAllocations.reduce((sum, a) => sum + a.days, 0);
        
        // Assuming 10 days max per sprint (2 weeks * 5 days)
        if (totalDays > 10) {
          const existing = overallocated.get(employee.id) || [];
          existing.push({ employee, sprintId: sprint.id, totalDays });
          overallocated.set(employee.id, existing);
        }
      }
    }
    
    return overallocated;
  }, [employees, allocations, relevantSprints]);

  // Calculate unallocated employees for current sprint
  const unallocatedEmployees = useMemo(() => {
    const activeSprint = relevantSprints[0];
    if (!activeSprint) return [];
    
    const activeEmployees = employees.filter(e => !e.archived);
    return activeEmployees.filter(employee => {
      const hasAllocations = allocations.some(
        a => a.employeeId === employee.id && a.sprintId === activeSprint.id
      );
      return !hasAllocations;
    });
  }, [employees, allocations, relevantSprints]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading alignment hub...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-background border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Resource Planner
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Alignment Hub</h1>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Overallocated Alert */}
          {overallocatedEmployees.size > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">
                  {overallocatedEmployees.size} overallocated team member{overallocatedEmployees.size > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-muted-foreground">
                  {Array.from(overallocatedEmployees.values())
                    .map(entries => entries[0].employee.name)
                    .slice(0, 3)
                    .join(', ')}
                  {overallocatedEmployees.size > 3 && ` +${overallocatedEmployees.size - 3} more`}
                </p>
              </div>
            </div>
          )}

          {/* Unallocated Alert */}
          {unallocatedEmployees.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 flex items-center gap-3">
              <UserMinus className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-700">
                  {unallocatedEmployees.length} unallocated in current sprint
                </p>
                <p className="text-sm text-muted-foreground">
                  {unallocatedEmployees
                    .slice(0, 3)
                    .map(e => e.name)
                    .join(', ')}
                  {unallocatedEmployees.length > 3 && ` +${unallocatedEmployees.length - 3} more`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sprint Headers */}
        <div className="grid grid-cols-[300px_1fr] gap-4 mb-4">
          <div className="font-medium text-muted-foreground">Project</div>
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${relevantSprints.length}, 1fr)` }}>
            {relevantSprints.map((sprint, index) => (
              <div key={sprint.id} className="text-center">
                <div className={`font-medium ${index === 0 ? 'text-primary' : 'text-foreground'}`}>
                  {sprint.name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(sprint.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {' - '}
                  {new Date(sprint.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Cards */}
        <div className="space-y-4">
          {filteredProjects.map(project => (
            <ProjectAlignmentCard
              key={project.id}
              project={project}
              sprints={relevantSprints}
              allocations={allocations}
              employees={employees}
              overallocatedEmployees={overallocatedEmployees}
            />
          ))}
          
          {filteredProjects.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm ? 'No projects match your search.' : 'No active projects found.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlignmentHubView;
