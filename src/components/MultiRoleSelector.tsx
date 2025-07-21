
import React from 'react';
import { ROLE_OPTIONS } from '@/constants/roles'; // adjust path if needed
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
  roles = ROLE_OPTIONS.length > 0 ? ROLE_OPTIONS : [],
  selectedRoles = [],
  onRoleChange  = () => {},  // <-- default empty function to avoid crashes
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

  const safeSelectedRoles: string[] = React.useMemo(() => {
  if (!Array.isArray(selectedRoles)) {
    console.warn('MultiRoleSelector: selectedRoles is not an array — fallback to []', { selectedRoles });
    return [];
  }
  return selectedRoles.filter(role => typeof role === 'string' && role.trim() !== '');
}, [selectedRoles]);
  
React.useEffect(() => {
    if (!Array.isArray(safeRoles)) {
      console.error('MultiRoleSelector: safeRoles is NOT an array', safeRoles);
    }
    if (!Array.isArray(safeSelectedRoles)) {
      console.error('MultiRoleSelector: safeSelectedRoles is NOT an array', safeSelectedRoles);
    }
    console.log('MultiRoleSelector current safeRoles:', safeRoles);
    console.log('MultiRoleSelector current safeSelectedRoles:', safeSelectedRoles);
  }, [safeRoles, safeSelectedRoles]);
  
  const handleRoleToggle = (role: string) => {
    if (!role || typeof role !== 'string') {
      console.warn('MultiRoleSelector: Invalid role provided to handleRoleToggle', { role });
      return;
    }
    
    try {
      const newSelectedRoles = safeSelectedRoles.includes(role)
        ? safeSelectedRoles.filter(r => r !== role)
        : Array.isArray(safeSelectedRoles) ? [...safeSelectedRoles, role] : [role];
      
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
      onRoleChange(Array.isArray(safeRoles) ? [...safeRoles] : []);
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

  {/* 🔁 NEW: Pre-build items list */}
  {(() => {
 // Defensive check here before mapping
            if (!Array.isArray(safeRoles)) {
              console.error('MultiRoleSelector: safeRoles is not an array during render', safeRoles);
              return null; // fail gracefully
            }
            if (!Array.isArray(safeSelectedRoles)) {
              console.error('MultiRoleSelector: safeSelectedRoles is not an array during render', safeSelectedRoles);
              return null; // fail gracefully
            }
   
  // Final fallback in case safeSelectedRoles is invalid
const rolesToUse = Array.isArray(safeSelectedRoles) ? safeSelectedRoles : [];

const roleItems = Array.isArray(safeRoles)
  ? safeRoles
      .filter(role => typeof role === 'string')
      .map(role => (
        <CommandItem
          key={role}
          onSelect={() => handleRoleToggle(role)}
          className="cursor-pointer"
        >
          <Check
            className={`mr-2 h-4 w-4 ${
              rolesToUse.includes(role) ? "opacity-100" : "opacity-0"
            }`}
          />
          <span className="truncate">{role}</span>
        </CommandItem>
      ))
  : [];

    // ✅ Only render group if items exist
    if (roleItems.length === 0) return null;

    return (
      <CommandGroup>
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
        {roleItems}
      </CommandGroup>
    );
  })()}
</Command>


       
      </PopoverContent>
    </Popover>
  );
};

export default MultiRoleSelector;
