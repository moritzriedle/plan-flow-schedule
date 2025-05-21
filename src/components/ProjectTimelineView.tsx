
import React from 'react';
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
  const { weeks, employees, getProjectAllocations, getEmployeeById } = usePlanner();
  
  if (!project) return null;

  const allocations = getProjectAllocations(project.id);
  
  // Group allocations by week
  const allocationsByWeek = weeks.map(week => {
    const weekAllocations = allocations.filter(a => a.weekId === week.id);
    
    // Group by employee for this week
    const employeeAllocations = weekAllocations.reduce((acc, alloc) => {
      const employee = getEmployeeById(alloc.employeeId);
      if (employee) {
        acc.push({
          employee,
          days: alloc.days
        });
      }
      return acc;
    }, [] as { employee: Employee; days: number }[]);
    
    const totalDays = weekAllocations.reduce((sum, alloc) => sum + alloc.days, 0);
    
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
  
  // Get all employees who have worked on this project
  const projectEmployees = Array.from(
    new Set(allocations.map(a => a.employeeId))
  ).map(empId => getEmployeeById(empId)).filter(Boolean) as Employee[];
  
  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
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
        
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Team Members</h3>
          <div className="flex flex-wrap gap-3 mb-6">
            {projectEmployees.length > 0 ? (
              projectEmployees.map(employee => (
                <div key={employee.id} className="flex items-center p-2 bg-gray-50 rounded-md">
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
              ))
            ) : (
              <p className="text-gray-500">No team members assigned yet</p>
            )}
          </div>
          
          <h3 className="text-lg font-medium mb-3">Weekly Allocation</h3>
          <div className="h-[300px] mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                {projectEmployees.map(employee => (
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
          
          <h3 className="text-lg font-medium mb-3">Detailed Breakdown</h3>
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
