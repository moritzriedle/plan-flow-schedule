
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, UserPlus } from 'lucide-react';
import TimeframeSelector from './TimeframeSelector';
import MultiRoleSelector from './MultiRoleSelector';
import { TimeframeOption } from './TimeframeSelector';

interface ResourcePlannerHeaderProps {
  timeframe: TimeframeOption;
  onTimeframeChange: (timeframe: TimeframeOption) => void;
  selectedRoles?: string[];
  onRoleChange: (roles: string[]) => void;
  availableRoles?: string[];
  onAddProject: () => void;
  onAddEmployee: () => void;
}

const ResourcePlannerHeader: React.FC<ResourcePlannerHeaderProps> = ({
  timeframe,
  onTimeframeChange = () => {},    // default no-op if not provided
  selectedRoles = [],
  onRoleChange = () => {},          // default no-op
  availableRoles = [],
  onAddProject = () => {},
  onAddEmployee = () => {}
}) => {
  // Sanitize selectedRoles
  const safeSelectedRoles = React.useMemo(() => {
    if (!Array.isArray(selectedRoles)) {
      console.warn('selectedRoles is not an array', { selectedRoles });
      return [];
    }
    return selectedRoles.filter(role => typeof role === 'string' && role.trim() !== '');
  }, [selectedRoles]);

  // ✅ Sanitize availableRoles (Step 1 fix)
  const safeAvailableRoles = React.useMemo(() => {
    if (!Array.isArray(availableRoles)) {
      console.warn('availableRoles is not an array', { availableRoles });
      return [];
    }
    const cleaned = availableRoles.filter(role => typeof role === 'string' && role.trim() !== '');
    console.log('✅ Sanitized availableRoles:', cleaned);
    return cleaned;
  }, [availableRoles]);
  
  const handleRoleChange = (roles: string[]) => {
    try {
      const validRoles = Array.isArray(roles) ? roles.filter(role => role && typeof role === 'string') : [];
      onRoleChange(validRoles);
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
