
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, UserPlus } from 'lucide-react';
import TimeframeSelector from './TimeframeSelector';
import MultiRoleSelector from './MultiRoleSelector';
import { TimeframeOption } from './TimeframeSelector';

interface ResourcePlannerHeaderProps {
  timeframe: TimeframeOption;
  onTimeframeChange: (timeframe: TimeframeOption) => void;
  selectedRoles: string[];
  onRoleChange: (roles: string[]) => void;
  availableRoles: string[];
  onAddProject: () => void;
  onAddEmployee: () => void;
}

const ResourcePlannerHeader: React.FC<ResourcePlannerHeaderProps> = ({
  timeframe,
  onTimeframeChange,
  selectedRoles,
  onRoleChange,
  availableRoles,
  onAddProject,
  onAddEmployee
}) => {
  // Enhanced logging for debugging
  console.log('ResourcePlannerHeader: Render', { 
    selectedRoles, 
    selectedRolesType: typeof selectedRoles,
    selectedRolesIsArray: Array.isArray(selectedRoles),
    availableRoles, 
    availableRolesType: typeof availableRoles,
    availableRolesIsArray: Array.isArray(availableRoles)
  });

  // Ensure arrays are safe with logging
  const safeSelectedRoles = React.useMemo(() => {
    if (!Array.isArray(selectedRoles)) {
      console.warn('ResourcePlannerHeader: selectedRoles is not an array', { selectedRoles, type: typeof selectedRoles });
      return [];
    }
    return selectedRoles;
  }, [selectedRoles]);

  const safeAvailableRoles = React.useMemo(() => {
    if (!Array.isArray(availableRoles)) {
      console.warn('ResourcePlannerHeader: availableRoles is not an array', { availableRoles, type: typeof availableRoles });
      return [];
    }
    return availableRoles;
  }, [availableRoles]);

  const handleRoleChange = (roles: string[]) => {
    console.log('ResourcePlannerHeader: handleRoleChange called', { roles });
    try {
      onRoleChange(Array.isArray(roles) ? roles : []);
    } catch (error) {
      console.error('ResourcePlannerHeader: Error in handleRoleChange', error);
      onRoleChange([]);
    }
  };

  return (
    <div className="p-4 border-b bg-white space-y-4">
      <div className="flex justify-between items-center">
        <TimeframeSelector
          timeframe={timeframe}
          onTimeframeChange={onTimeframeChange}
        />
        
        <Button 
          onClick={onAddEmployee}
          variant="outline"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Team Member
        </Button>
      </div>
      
      {/* Role Filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Filter by Role:</label>
        <MultiRoleSelector
          roles={safeAvailableRoles}
          selectedRoles={safeSelectedRoles}
          onRoleChange={handleRoleChange}
          placeholder="All Roles"
        />
      </div>
    </div>
  );
};

export default ResourcePlannerHeader;
