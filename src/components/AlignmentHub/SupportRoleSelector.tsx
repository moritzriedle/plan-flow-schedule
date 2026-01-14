import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, X } from 'lucide-react';
import { ROLE_OPTIONS } from '@/constants/roles';

interface SupportRoleSelectorProps {
  selectedRoles: string[];
  onRolesChange: (roles: string[]) => void;
}

const SupportRoleSelector: React.FC<SupportRoleSelectorProps> = ({
  selectedRoles,
  onRolesChange,
}) => {
  const handleRoleToggle = (role: string) => {
    if (selectedRoles.includes(role)) {
      onRolesChange(selectedRoles.filter(r => r !== role));
    } else {
      onRolesChange([...selectedRoles, role]);
    }
  };

  const handleRemoveRole = (role: string) => {
    onRolesChange(selectedRoles.filter(r => r !== role));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {selectedRoles.map(role => (
          <Badge key={role} variant="secondary" className="text-xs pr-1">
            {role}
            <button
              onClick={() => handleRemoveRole(role)}
              className="ml-1 hover:bg-muted rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 text-xs">
            Add needed role
            <ChevronDown className="w-3 h-3 ml-1" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2 max-h-64 overflow-y-auto" align="start">
          <div className="space-y-1">
            {ROLE_OPTIONS.map(role => (
              <label
                key={role}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded cursor-pointer text-sm"
              >
                <Checkbox
                  checked={selectedRoles.includes(role)}
                  onCheckedChange={() => handleRoleToggle(role)}
                />
                {role}
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default SupportRoleSelector;
