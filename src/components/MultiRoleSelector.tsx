
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
  roles = Array.isArray(ROLE_OPTIONS) && ROLE_OPTIONS.length > 0 ? [...ROLE_OPTIONS] : [],
  selectedRoles = [],
  onRoleChange  = () => {},  // <-- default empty function to avoid crashes
  placeholder = "Select roles..."
}) => {
  
  console.log("MultiRoleSelector: roles defaulted to", roles);

  const [open, setOpen] = React.useState(false);

  // Add comprehensive logging at the start
  console.log('MultiRoleSelector render - raw props:', { 
    roles, 
    selectedRoles, 
    rolesType: typeof roles,
    selectedRolesType: typeof selectedRoles,
    rolesIsArray: Array.isArray(roles),
    selectedRolesIsArray: Array.isArray(selectedRoles)
  });

  // Ensure arrays are always valid with comprehensive safety checks
  const safeRoles = React.useMemo(() => {
    console.log('MultiRoleSelector: Processing roles in useMemo:', { roles, type: typeof roles, isArray: Array.isArray(roles) });
    
    if (!roles || !Array.isArray(roles)) {
      console.warn('MultiRoleSelector: roles is not a valid array, using empty array', { roles });
      return [];
    }
    
    const filtered = roles.filter(role => {
      const isValid = role && typeof role === 'string' && role.trim() !== '';
      if (!isValid) {
        console.warn('MultiRoleSelector: Filtering out invalid role:', role);
      }
      return isValid;
    });
    
    console.log('MultiRoleSelector: safeRoles result:', filtered);
    return filtered;
  }, [roles]);

  const safeSelectedRoles: string[] = React.useMemo(() => {
    console.log('MultiRoleSelector: Processing selectedRoles in useMemo:', { selectedRoles, type: typeof selectedRoles, isArray: Array.isArray(selectedRoles) });
    
    if (!Array.isArray(selectedRoles)) {
      console.warn('MultiRoleSelector: selectedRoles is not an array — fallback to []', { selectedRoles });
      return [];
    }
    
    const filtered = selectedRoles.filter(role => {
      const isValid = typeof role === 'string' && role.trim() !== '';
      if (!isValid) {
        console.warn('MultiRoleSelector: Filtering out invalid selectedRole:', role);
      }
      return isValid;
    });
    
    console.log('MultiRoleSelector: safeSelectedRoles result:', filtered);
    return filtered;
  }, [selectedRoles]);
  
  React.useEffect(() => {
    console.log('MultiRoleSelector useEffect - Final values:', {
      safeRoles,
      safeSelectedRoles,
      safeRolesIsArray: Array.isArray(safeRoles),
      safeSelectedRolesIsArray: Array.isArray(safeSelectedRoles),
      safeRolesLength: safeRoles?.length,
      safeSelectedRolesLength: safeSelectedRoles?.length
    });
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
      console.log('MultiRoleSelector getDisplayText called with:', { 
        safeSelectedRoles, 
        length: safeSelectedRoles?.length,
        isArray: Array.isArray(safeSelectedRoles)
      });
      
      if (!Array.isArray(safeSelectedRoles)) {
        console.warn('MultiRoleSelector getDisplayText: safeSelectedRoles not array, using placeholder');
        return placeholder;
      }
      
      if (safeSelectedRoles.length === 0) return placeholder;
      if (safeSelectedRoles.length === 1) return safeSelectedRoles[0];
      return `${safeSelectedRoles.length} roles selected`;
    } catch (error) {
      console.error('MultiRoleSelector: Error in getDisplayText', error);
      return placeholder;
    }
  };

  // Final validation before render
  const renderSafeRoles = React.useMemo(() => {
    if (!Array.isArray(safeRoles)) {
      console.error('MultiRoleSelector: safeRoles is not an array at render time', safeRoles);
      return [];
    }
    return safeRoles;
  }, [safeRoles]);

  const renderSafeSelectedRoles = React.useMemo(() => {
    if (!Array.isArray(safeSelectedRoles)) {
      console.error('MultiRoleSelector: safeSelectedRoles is not an array at render time', safeSelectedRoles);
      return [];
    }
    return safeSelectedRoles;
  }, [safeSelectedRoles]);

  console.log('MultiRoleSelector: About to render with:', {
    renderSafeRoles,
    renderSafeSelectedRoles,
    open
  });

  // Don't render if we don't have valid data
  if (!Array.isArray(renderSafeRoles) || !Array.isArray(renderSafeSelectedRoles)) {
    console.error('MultiRoleSelector: Invalid data for rendering, returning fallback');
    return (
      <div className="w-48 p-2 border rounded bg-gray-100">
        <span className="text-sm text-gray-500">Loading roles...</span>
      </div>
    );
  }

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
        {/* Add defensive wrapper around Command */}
        {renderSafeRoles.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            No roles available
          </div>
        ) : (
          <Command>
            <CommandInput placeholder="Search roles..." />
            <CommandEmpty>No roles found.</CommandEmpty>
            
           {(() => {
  console.log('MultiRoleSelector: Building command items with:', { renderSafeRoles, renderSafeSelectedRoles });

  if (!Array.isArray(renderSafeRoles) || !Array.isArray(renderSafeSelectedRoles)) {
    console.error('MultiRoleSelector: renderSafe arrays invalid during Command render');
    return null;
  }

  const roleItems = renderSafeRoles
    .filter(role => typeof role === 'string' && role.trim() !== '')
    .map((role, index) => {
      try {
        const isSelected = renderSafeSelectedRoles.includes(role);

        return (
          <CommandItem
            key={String(role) + '-' + index}
            onSelect={() => handleRoleToggle(role)}
            className="cursor-pointer"
          >
            <Check
              className={`mr-2 h-4 w-4 ${isSelected ? 'opacity-100' : 'opacity-0'}`}
            />
            <span className="truncate">{role}</span>
          </CommandItem>
        );
      } catch (err) {
        console.error('MultiRoleSelector: Error rendering CommandItem for role:', role, err);
        return null;
      }
    })
    .filter(Boolean); // filter out any failed/null renders

  if (roleItems.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        No valid roles found
      </div>
    );
  }

  return (
    <CommandGroup>
      <div className="p-2 border-b flex gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSelectAll}
          className="flex-1 text-xs"
          disabled={renderSafeSelectedRoles.length === renderSafeRoles.length}
        >
          Select All
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleClearAll}
          className="flex-1 text-xs"
          disabled={renderSafeSelectedRoles.length === 0}
        >
          Clear All
        </Button>
      </div>
      {roleItems}
    </CommandGroup>
  );
})()}

          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default MultiRoleSelector;
