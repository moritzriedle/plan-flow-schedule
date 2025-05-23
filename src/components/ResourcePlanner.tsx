
import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { usePlanner } from '../contexts/PlannerContext';
import EmployeeRow from './EmployeeRow';
import ProjectsSidebar from './ProjectsSidebar';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { FilterIcon, UserPlus, FolderPlus, Loader2 } from 'lucide-react';
import { AddEmployeeDialog } from './AddEmployeeDialog';
import { AddProjectDialog } from './AddProjectDialog';

const ResourcePlanner: React.FC = () => {
  const { employees, weeks, loading } = usePlanner();
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [addEmployeeDialogOpen, setAddEmployeeDialogOpen] = useState(false);
  const [addProjectDialogOpen, setAddProjectDialogOpen] = useState(false);
  
  // Extract unique roles for filter dropdown
  const uniqueRoles = Array.from(new Set(employees.map(emp => emp.role)));
  
  // Filter employees based on role and search query
  const filteredEmployees = employees.filter(employee => {
    const matchesRole = roleFilter === "all" || employee.role === roleFilter;
    const matchesSearch = !searchQuery || 
      employee.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-gray-500">Loading resource planner...</p>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen overflow-hidden bg-white rounded-lg shadow">
        <ProjectsSidebar onAddProject={() => setAddProjectDialogOpen(true)} />
        
        <div className="flex-1 overflow-auto flex flex-col">
          {/* Filter bar */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FilterIcon className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-sm">Filters:</span>
              </div>
              
              <div className="flex-1 max-w-xs">
                <Input
                  type="text"
                  placeholder="Search team members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8"
                />
              </div>
              
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px] h-8">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {uniqueRoles.map(role => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                size="sm" 
                variant="outline"
                className="h-8"
                onClick={() => setAddEmployeeDialogOpen(true)}
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Add Team Member
              </Button>
              
              <Button 
                size="sm"
                className="h-8"
                onClick={() => setAddProjectDialogOpen(true)}
              >
                <FolderPlus className="h-4 w-4 mr-1" />
                Add Project
              </Button>
            </div>
          </div>
          
          {/* Header with week labels */}
          <div className="flex border-b sticky top-0 z-10 bg-white shadow-sm">
            <div className="w-64 flex-shrink-0 p-4 font-semibold bg-gray-50 border-r">
              Team Members
            </div>
            
            <div className="flex flex-1">
              {weeks.map(week => (
                <div 
                  key={week.id}
                  className="flex-1 min-w-[180px] p-4 text-center font-medium border-r"
                >
                  {week.label}
                </div>
              ))}
            </div>
          </div>
          
          {/* Employee rows */}
          <div className="flex-1 overflow-auto">
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map(employee => (
                <EmployeeRow key={employee.id} employee={employee} />
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                No team members match the current filters
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Dialogs */}
      <AddEmployeeDialog 
        open={addEmployeeDialogOpen} 
        onOpenChange={setAddEmployeeDialogOpen} 
      />
      
      <AddProjectDialog 
        open={addProjectDialogOpen} 
        onOpenChange={setAddProjectDialogOpen} 
      />
    </DndProvider>
  );
};

export default ResourcePlanner;
