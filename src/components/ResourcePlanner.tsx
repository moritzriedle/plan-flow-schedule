
import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { usePlanner } from '../contexts/PlannerContext';
import EmployeeRow from './EmployeeRow';
import ProjectsSidebar from './ProjectsSidebar';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { FilterIcon } from 'lucide-react';

const ResourcePlanner: React.FC = () => {
  const { employees, weeks } = usePlanner();
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Extract unique roles for filter dropdown
  const uniqueRoles = Array.from(new Set(employees.map(emp => emp.role)));
  
  // Filter employees based on role and search query
  const filteredEmployees = employees.filter(employee => {
    const matchesRole = !roleFilter || employee.role === roleFilter;
    const matchesSearch = !searchQuery || 
      employee.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen overflow-hidden bg-white rounded-lg shadow">
        <ProjectsSidebar />
        
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
                  <SelectItem value="">All roles</SelectItem>
                  {uniqueRoles.map(role => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
    </DndProvider>
  );
};

export default ResourcePlanner;
