
import React, { useState } from 'react';
import { Employee } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import EmployeeEditor from './EmployeeEditor';
import { FileEdit } from 'lucide-react';

interface EmployeeRowProps {
  employee: Employee;
  weeks: any[]; // Keep for compatibility but won't use
}

const EmployeeRow: React.FC<EmployeeRowProps> = ({ employee }) => {
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
      <div className="p-4 flex items-center space-x-3 h-full">
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
      
      <EmployeeEditor 
        employee={employee} 
        isOpen={editorOpen} 
        onClose={() => setEditorOpen(false)} 
      />
    </>
  );
};

export default EmployeeRow;
