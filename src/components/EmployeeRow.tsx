
import React from 'react';
import { Employee } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import DroppableCell from './DroppableCell';
import { usePlanner } from '@/contexts/PlannerContext';

interface EmployeeRowProps {
  employee: Employee;
}

const EmployeeRow: React.FC<EmployeeRowProps> = ({ employee }) => {
  const { weeks } = usePlanner();
  
  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="flex w-full border-b">
      <div className="w-64 flex-shrink-0 p-4 border-r bg-gray-50 flex items-center space-x-3">
        <Avatar className="h-8 w-8">
          {employee.imageUrl ? (
            <AvatarImage src={employee.imageUrl} alt={employee.name} />
          ) : (
            <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
          )}
        </Avatar>
        <div>
          <div className="font-medium">{employee.name}</div>
          <div className="text-xs text-gray-500">{employee.role}</div>
        </div>
      </div>
      
      <div className="flex-1 flex">
        {weeks.map((week) => (
          <div 
            key={week.id} 
            className="flex-1 min-w-[180px]"
          >
            <DroppableCell 
              employeeId={employee.id} 
              weekId={week.id} 
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmployeeRow;
