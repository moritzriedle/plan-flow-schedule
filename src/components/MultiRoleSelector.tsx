
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
  roles = [], // Default to empty array to prevent iteration errors
  selectedRoles = [], // Default to empty array
  onRoleChange,
  placeholder = "Select roles..."
}) => {
  const [open, setOpen] = React.useState(false);
  const [tempSelectedRoles, setTempSelectedRoles] = React.useState<string[]>(selectedRoles);

  // Update temp selection when props change
  React.useEffect(() => {
    setTempSelectedRoles(selectedRoles);
  }, [selectedRoles]);

  const handleRoleToggle = (role: string) => {
    if (tempSelectedRoles.includes(role)) {
      setTempSelectedRoles(tempSelectedRoles.filter(r => r !== role));
    } else {
      setTempSelectedRoles([...tempSelectedRoles, role]);
    }
  };

  const handleApply = () => {
    onRoleChange(tempSelectedRoles);
    setOpen(false);
  };

  const handleCancel = () => {
    setTempSelectedRoles(selectedRoles);
    setOpen(false);
  };

  const getDisplayText = () => {
    if (selectedRoles.length === 0) return placeholder;
    if (selectedRoles.length === 1) return selectedRoles[0];
    return `${selectedRoles.length} roles selected`;
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
          {getDisplayText()}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0">
        <Command>
          <CommandInput placeholder="Search roles..." />
          <CommandEmpty>No roles found.</CommandEmpty>
          <CommandGroup>
            {roles.map((role) => (
              <CommandItem
                key={role}
                onSelect={() => handleRoleToggle(role)}
              >
                <Check
                  className={`mr-2 h-4 w-4 ${
                    tempSelectedRoles.includes(role) ? "opacity-100" : "opacity-0"
                  }`}
                />
                {role}
              </CommandItem>
            ))}
          </CommandGroup>
          <div className="p-2 border-t flex gap-2">
            <Button
              size="sm"
              onClick={handleApply}
              className="flex-1"
            >
              Apply
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default MultiRoleSelector;
