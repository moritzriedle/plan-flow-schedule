import React from 'react';
import { Employee, Sprint } from '../types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Edit, Archive } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface EmployeeRowProps {
  employee: Employee;
  sprints: Sprint[]; // kept for compatibility (no longer used)
  onEmployeeEdit?: (employee: Employee) => void;
}

const EmployeeRow: React.FC<EmployeeRowProps> = ({ employee, onEmployeeEdit }) => {
  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEmployeeEdit?.(employee);
  };

  return (
    <div
      className={[
        'p-3 h-full flex items-center gap-2',
        employee.archived ? 'opacity-60 bg-gray-100' : 'bg-white',
      ].join(' ')}
    >
      <Avatar className="h-8 w-8 flex-shrink-0">
        {employee.imageUrl ? (
          <AvatarImage src={employee.imageUrl} alt={employee.name} />
        ) : (
          <AvatarFallback className="text-xs">{getInitials(employee.name)}</AvatarFallback>
        )}
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate flex items-center gap-2" title={employee.name}>
          <span className="truncate">{employee.name}</span>
          {employee.archived && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 inline-flex items-center gap-1">
              <Archive className="h-2.5 w-2.5" />
              Archived
            </Badge>
          )}
        </div>

        {/* Role always visible */}
        <div className="text-xs text-gray-500 truncate" title={employee.role}>
          {employee.role}
        </div>
      </div>

      {onEmployeeEdit && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 opacity-60 hover:opacity-100"
          onClick={handleEditClick}
        >
          <Edit className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
};

export default EmployeeRow;
