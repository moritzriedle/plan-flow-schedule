
import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { usePlanner } from '../contexts/PlannerContext';
import { useAuth } from '@/hooks/useAuth';
import { useTimeframeWeeks } from '../hooks/useTimeframeWeeks';
import EmployeeRow from './EmployeeRow';
import ProjectsSidebar from './ProjectsSidebar';
import TimeframeSelector from './TimeframeSelector';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { FilterIcon, UserPlus, FolderPlus, Loader2, LogOut, User } from 'lucide-react';
import { AddEmployeeDialog } from './AddEmployeeDialog';
import { AddProjectDialog } from './AddProjectDialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import DroppableCell from './DroppableCell';

const ResourcePlanner: React.FC = () => {
  const { employees, loading } = usePlanner();
  const { profile, signOut } = useAuth();
  const { timeframe, granularity, weeks, setTimeframe, setGranularity } = useTimeframeWeeks();
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

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
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top header with user info */}
          <div className="px-4 py-3 border-b bg-white flex items-center justify-between flex-shrink-0">
            <h1 className="text-xl font-semibold text-gray-900">Resource Planner</h1>
            
            {profile && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    {profile.image_url ? (
                      <AvatarImage src={profile.image_url} alt={profile.name} />
                    ) : (
                      <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
                    )}
                  </Avatar>
                  <div className="text-sm">
                    <div className="font-medium">{profile.name}</div>
                    <div className="text-gray-500">
                      {profile.role} {profile.is_admin && '(Admin)'}
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          {/* Filter bar */}
          <div className="p-4 border-b bg-gray-50 flex-shrink-0">
            <div className="flex items-center gap-4 flex-wrap">
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
              
              {profile?.is_admin && (
                <>
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
                </>
              )}
            </div>
            
            {/* Timeframe selector */}
            <div className="mt-4 pt-4 border-t">
              <TimeframeSelector
                timeframe={timeframe}
                granularity={granularity}
                onTimeframeChange={setTimeframe}
                onGranularityChange={setGranularity}
              />
            </div>
          </div>
          
          {/* Scrollable content area */}
          <div className="flex-1 overflow-auto">
            <div className="min-w-max">
              {/* Header with week labels - now sticky */}
              <div className="flex border-b sticky top-0 z-10 bg-white shadow-sm">
                <div className="w-64 flex-shrink-0 p-4 font-semibold bg-gray-50 border-r">
                  Team Members
                </div>
                
                <div className="flex">
                  {weeks.map(week => (
                    <div 
                      key={week.id}
                      className="w-48 flex-shrink-0 p-4 text-center font-medium border-r"
                    >
                      {week.label}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Employee rows */}
              <div>
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map(employee => (
                    <div key={employee.id} className="flex border-b hover:bg-gray-50">
                      <div className="w-64 flex-shrink-0 p-4 border-r bg-gray-50">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            {employee.imageUrl ? (
                              <AvatarImage src={employee.imageUrl} alt={employee.name} />
                            ) : (
                              <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <div className="font-medium">{employee.name}</div>
                            <div className="text-sm text-gray-500">{employee.role}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex">
                        {weeks.map(week => (
                          <DroppableCell
                            key={week.id}
                            employeeId={employee.id}
                            weekId={week.id}
                            granularity={granularity}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    {employees.length === 0 ? (
                      <div>
                        <User className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <p>No team members found</p>
                        {profile?.is_admin && (
                          <p className="text-sm mt-2">Add team members to get started</p>
                        )}
                      </div>
                    ) : (
                      'No team members match the current filters'
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Dialogs - only show for admins */}
      {profile?.is_admin && (
        <>
          <AddEmployeeDialog 
            open={addEmployeeDialogOpen} 
            onOpenChange={setAddEmployeeDialogOpen} 
          />
          
          <AddProjectDialog 
            open={addProjectDialogOpen} 
            onOpenChange={setAddProjectDialogOpen} 
          />
        </>
      )}
    </DndProvider>
  );
};

export default ResourcePlanner;
