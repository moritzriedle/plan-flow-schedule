
import React, { useState } from 'react';
import { Employee, Week } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import DroppableCell from './DroppableCell';
import { Button } from '@/components/ui/button';
import EmployeeEditor from './EmployeeEditor';
import { FileEdit } from 'lucide-react';

interface EmployeeRowProps {
  employee: Employee;
  weeks: Week[];
}

const EmployeeRow: React.FC<EmployeeRowProps> = ({ employee, weeks }) => {
  const [editorOpen, setEditorOpen] = useState(false);
  
  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <>
      <div className="flex w-full border-b">
        <div className="w-64 flex-shrink-0 p-4 border-r bg-gray-50 flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            {employee.imageUrl ? (
              <AvatarImage src={employee.imageUrl} alt={employee.name} />
            ) : (
              <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            <div className="font-medium">{employee.name}</div>
            <div className="text-xs text-gray-500">{employee.role}</div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="flex-shrink-0"
            onClick={() => setEditorOpen(true)}
          >
            <FileEdit className="h-4 w-4" />
          </Button>
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
      
      <EmployeeEditor 
        employee={employee} 
        isOpen={editorOpen} 
        onClose={() => setEditorOpen(false)} 
      />
    </>
  );
};

export default EmployeeRow;
