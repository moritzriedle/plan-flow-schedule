
import React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';

interface MultiRoleSelectorProps {
  roles?: string[];
  selectedRoles?: string[];
  onRoleChange: (roles: string[]) => void;
  placeholder?: string;
}

const MultiRoleSelector: React.FC<MultiRoleSelectorProps> = ({
  roles = [],
  selectedRoles = [],
  onRoleChange,
  placeholder = "Select roles..."
}) => {
  const [open, setOpen] = React.useState(false);

  // Ensure arrays are always valid with comprehensive safety checks
  const safeRoles = React.useMemo(() => {
    if (!roles || !Array.isArray(roles)) {
      console.warn('MultiRoleSelector: roles is not a valid array, using empty array', { roles });
      return [];
    }
    return roles.filter(role => role && typeof role === 'string');
  }, [roles]);

  const safeSelectedRoles = React.useMemo(() => {
    if (!selectedRoles || !Array.isArray(selectedRoles)) {
      console.warn('MultiRoleSelector: selectedRoles is not a valid array, using empty array', { selectedRoles });
      return [];
    }
    return selectedRoles.filter(role => role && typeof role === 'string');
  }, [selectedRoles]);

  const handleRoleToggle = (role: string) => {
    if (!role || typeof role !== 'string') {
      console.warn('MultiRoleSelector: Invalid role provided to handleRoleToggle', { role });
      return;
    }
    
    try {
      const newSelectedRoles = safeSelectedRoles.includes(role)
        ? safeSelectedRoles.filter(r => r !== role)
        : [...safeSelectedRoles, role];
      
      onRoleChange(newSelectedRoles);
    } catch (error) {
      console.error('MultiRoleSelector: Error in handleRoleToggle', error);
      onRoleChange([]);
    }
  };

  const handleClearAll = () => {
    try {
      onRoleChange([]);
    } catch (error) {
      console.error('MultiRoleSelector: Error in handleClearAll', error);
    }
  };

  const handleSelectAll = () => {
    try {
      onRoleChange([...safeRoles]);
    } catch (error) {
      console.error('MultiRoleSelector: Error in handleSelectAll', error);
      onRoleChange([]);
    }
  };

  const getDisplayText = () => {
    try {
      if (safeSelectedRoles.length === 0) return placeholder;
      if (safeSelectedRoles.length === 1) return safeSelectedRoles[0];
      return `${safeSelectedRoles.length} roles selected`;
    } catch (error) {
      console.error('MultiRoleSelector: Error in getDisplayText', error);
      return placeholder;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-48 justify-between"
        >
          <span className="truncate">{getDisplayText()}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0 bg-white z-50">
        <Command>
          <CommandInput placeholder="Search roles..." />
          <CommandEmpty>No roles found.</CommandEmpty>
          <CommandGroup>
            {/* Action buttons */}
            <div className="p-2 border-b flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSelectAll}
                className="flex-1 text-xs"
                disabled={safeSelectedRoles.length === safeRoles.length}
              >
                Select All
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearAll}
                className="flex-1 text-xs"
                disabled={safeSelectedRoles.length === 0}
              >
                Clear All
              </Button>
            </div>
            
            {/* Role options */}
            {safeRoles.map((role) => (
              <CommandItem
                key={role}
                onSelect={() => handleRoleToggle(role)}
                className="cursor-pointer"
              >
                <Check
                  className={`mr-2 h-4 w-4 ${
                    safeSelectedRoles.includes(role) ? "opacity-100" : "opacity-0"
                  }`}
                />
                <span className="truncate">{role}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default MultiRoleSelector;
