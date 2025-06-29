
import React from 'react';
import { Employee, Sprint } from '../types';
import { usePlanner } from '../contexts/PlannerContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';

interface EmployeeRowProps {
  employee: Employee;
  sprints: Sprint[];
  onEmployeeEdit?: (employee: Employee) => void;
}

const EmployeeRow: React.FC<EmployeeRowProps> = ({ employee, sprints, onEmployeeEdit }) => {
  const { getTotalAllocationDays } = usePlanner();

  // Calculate total allocation across all sprints
  const totalAllocation = sprints.reduce((total, sprint) => {
    return total + getTotalAllocationDays(employee.id, sprint.id);
  }, 0);

  // Get initials from name
  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEmployeeEdit) {
      onEmployeeEdit(employee);
    }
  };

  return (
    <div className="p-3 h-full min-h-[120px] flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <Avatar className="h-8 w-8 flex-shrink-0">
          {employee.imageUrl ? (
            <AvatarImage src={employee.imageUrl} alt={employee.name} />
          ) : (
            <AvatarFallback className="text-xs">
              {getInitials(employee.name)}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate" title={employee.name}>
            {employee.name}
          </div>
          <div className="text-xs text-gray-500 truncate" title={employee.role}>
            {employee.role}
          </div>
        </div>
        {onEmployeeEdit && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
            onClick={handleEditClick}
          >
            <Edit className="h-3 w-3" />
          </Button>
        )}
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
