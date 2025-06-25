
import React, { useState } from 'react';
import { Project, Employee } from '@/types';
import { usePlanner } from '@/contexts/PlannerContext';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetClose
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ProjectTimelineViewProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProjectTimelineView: React.FC<ProjectTimelineViewProps> = ({ 
  project, 
  isOpen, 
  onClose 
}) => {
  const { weeks, employees, getProjectAllocations, getEmployeeById, allocateToProjectTimeline } = usePlanner();
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [allocationDays, setAllocationDays] = useState<1 | 3 | 5>(5);
  
  if (!project) return null;

  const allocations = getProjectAllocations(project.id);
  
  // Get unique roles from employees who have allocations on this project
  const projectEmployeeIds = Array.from(new Set(allocations.map(a => a.employeeId)));
  const projectEmployees = projectEmployeeIds
    .map(id => getEmployeeById(id))
    .filter(Boolean) as Employee[];
  
  const uniqueRoles = Array.from(new Set(projectEmployees.map(emp => emp.role)));
  
  // Filter employees by selected role
  const filteredEmployees = selectedRole === 'all' 
    ? projectEmployees 
    : projectEmployees.filter(emp => emp.role === selectedRole);
  
  // Group allocations by week
  const allocationsByWeek = weeks.map(week => {
    const weekAllocations = allocations.filter(a => a.weekId === week.id);
    
    // Group by employee for this week, filtered by role
    const employeeAllocations = weekAllocations.reduce((acc, alloc) => {
      const employee = getEmployeeById(alloc.employeeId);
      if (employee && (selectedRole === 'all' || employee.role === selectedRole)) {
        acc.push({
          employee,
          days: alloc.days
        });
      }
      return acc;
    }, [] as { employee: Employee; days: number }[]);
    
    const totalDays = employeeAllocations.reduce((sum, alloc) => sum + alloc.days, 0);
    
    return {
      week,
      allocations: employeeAllocations,
      totalDays
    };
  });
  
  // Format data for chart
  const chartData = allocationsByWeek.map(weekData => {
    const data: any = {
      name: weekData.week.label,
      Total: weekData.totalDays,
    };
    
    // Add days for each employee
    weekData.allocations.forEach(alloc => {
      data[alloc.employee.name] = alloc.days;
    });
    
    return data;
  });
  
  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const handleAllocateTimeline = async (employeeId: string) => {
    await allocateToProjectTimeline(employeeId, project.id, allocationDays);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-4xl overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded" 
              style={{ backgroundColor: `var(--project-${project.color})` }}
            ></div>
            <SheetTitle>{project.name} Timeline</SheetTitle>
          </div>
          <SheetDescription>
            Showing resource allocation from {weeks[0]?.label} to {weeks[weeks.length-1]?.label}
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Role Filter */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Filter by Role:</label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {uniqueRoles.map(role => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Timeline Allocation Tool */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-lg font-medium mb-3">Allocate to Project Timeline</h3>
            <div className="flex items-center gap-4 mb-3">
              <label className="text-sm font-medium">Default Allocation:</label>
              <Select value={allocationDays.toString()} onValueChange={(value) => setAllocationDays(parseInt(value) as 1 | 3 | 5)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day/week</SelectItem>
                  <SelectItem value="3">3 days/week</SelectItem>
                  <SelectItem value="5">5 days/week</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Select a team member below to allocate them to the entire project timeline with the chosen daily allocation.
            </p>
          </div>
          
          <h3 className="text-lg font-medium">Team Members</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {employees.map(employee => (
              <div key={employee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-2">
                    {employee.imageUrl ? (
                      <AvatarImage src={employee.imageUrl} alt={employee.name} />
                    ) : (
                      <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <div className="font-medium text-sm">{employee.name}</div>
                    <div className="text-xs text-gray-500">{employee.role}</div>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleAllocateTimeline(employee.id)}
                >
                  Allocate
                </Button>
              </div>
            ))}
          </div>
          
          {filteredEmployees.length > 0 && (
            <>
              <h3 className="text-lg font-medium">Weekly Allocation Chart</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {filteredEmployees.map(employee => (
                      <Bar 
                        key={employee.id} 
                        dataKey={employee.name} 
                        stackId="a" 
                        fill={`var(--project-${project.color})`} 
                        opacity={0.8}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
          
          <h3 className="text-lg font-medium">Detailed Breakdown</h3>
          <div className="space-y-4">
            {allocationsByWeek.map((weekData, index) => (
              <div key={index} className="border rounded-md p-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">{weekData.week.label}</h4>
                  <Badge variant="outline">
                    {weekData.totalDays} {weekData.totalDays === 1 ? 'day' : 'days'} total
                  </Badge>
                </div>
                
                {weekData.allocations.length > 0 ? (
                  <div className="space-y-2">
                    {weekData.allocations.map((alloc, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <div className="flex items-center">
                          <Avatar className="h-6 w-6 mr-2">
                            {alloc.employee.imageUrl ? (
                              <AvatarImage src={alloc.employee.imageUrl} alt={alloc.employee.name} />
                            ) : (
                              <AvatarFallback>{getInitials(alloc.employee.name)}</AvatarFallback>
                            )}
                          </Avatar>
                          <span>{alloc.employee.name}</span>
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {alloc.employee.role}
                          </Badge>
                        </div>
                        <span>{alloc.days} {alloc.days === 1 ? 'day' : 'days'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No resources allocated this week</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t">
          <SheetClose asChild>
            <Button variant="outline" className="w-full">Close</Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProjectTimelineView;
