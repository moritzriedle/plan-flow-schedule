
import React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';

interface MultiRoleSelectorProps {
  roles: string[];
  selectedRoles: string[];
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

  const handleRoleToggle = (role: string) => {
    const newSelectedRoles = selectedRoles.includes(role)
      ? selectedRoles.filter(r => r !== role)
      : [...selectedRoles, role];
    
    onRoleChange(newSelectedRoles);
  };

  const handleClearAll = () => {
    onRoleChange([]);
  };

  const handleSelectAll = () => {
    onRoleChange([...roles]);
  };

  const getDisplayText = () => {
    if (selectedRoles.length === 0) return placeholder;
    if (selectedRoles.length === 1) return selectedRoles[0];
    return `${selectedRoles.length} roles selected`;
  };

  // Safety check to ensure roles is an array
  const safeRoles = Array.isArray(roles) ? roles : [];

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
      <PopoverContent className="w-48 p-0">
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
                disabled={selectedRoles.length === safeRoles.length}
              >
                Select All
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearAll}
                className="flex-1 text-xs"
                disabled={selectedRoles.length === 0}
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
                    selectedRoles.includes(role) ? "opacity-100" : "opacity-0"
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
