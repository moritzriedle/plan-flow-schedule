
import React from 'react';
import { Employee, Sprint } from '../types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { usePlanner } from '../contexts/PlannerContext';

interface EmployeeRowProps {
  employee: Employee;
  sprints: Sprint[];
}

const EmployeeRow: React.FC<EmployeeRowProps> = ({ employee, sprints }) => {
  const { getTotalAllocationDays } = usePlanner();

  // Calculate total allocation across all sprints
  const totalAllocation = sprints.reduce((total, sprint) => {
    return total + getTotalAllocationDays(employee.id, sprint.id);
  }, 0);

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="p-4 h-full flex flex-col justify-center min-h-[120px]">
      <div className="flex items-center mb-2">
        <Avatar className="h-10 w-10 mr-3">
          {employee.imageUrl ? (
            <AvatarImage src={employee.imageUrl} alt={employee.name} />
          ) : (
            <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1">
          <div className="font-medium text-sm">{employee.name}</div>
          <Badge variant="secondary" className="text-xs mt-1">
            {employee.role}
          </Badge>
        </div>
      </div>
      
      {totalAllocation > 0 && (
        <div className="text-xs text-gray-500">
          Total: {totalAllocation} days allocated
        </div>
      )}
    </div>
  );
};

export default EmployeeRow;
