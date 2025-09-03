
import React from 'react';
import { ROLE_OPTIONS } from '@/constants/roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, UserPlus, Search } from 'lucide-react';
import TimeframeSelector from './TimeframeSelector';
import MultiRoleSelector from './MultiRoleSelector';
import { TimeframeOption } from './TimeframeSelector';

interface ResourcePlannerHeaderProps {
  timeframe: TimeframeOption;
  onTimeframeChange: (timeframe: TimeframeOption) => void;
  selectedRoles?: string[];
  onRoleChange: (roles: string[]) => void;
  availableRoles?: string[];
  searchTerm?: string;
  onSearchChange: (searchTerm: string) => void;
  onAddProject: () => void;
  onAddEmployee: () => void;
}

const ResourcePlannerHeader: React.FC<ResourcePlannerHeaderProps> = ({
  timeframe,
  onTimeframeChange = () => {},    // default no-op if not provided
  selectedRoles = [],
  onRoleChange = () => {},          // default no-op
  availableRoles = ROLE_OPTIONS,
  searchTerm = '',
  onSearchChange = () => {},
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
    console.log('ResourcePlannerHeader: Processing availableRoles:', { 
      availableRoles, 
      type: typeof availableRoles, 
      isArray: Array.isArray(availableRoles) 
    });
    
    if (!Array.isArray(availableRoles)) {
      console.warn('ResourcePlannerHeader: availableRoles is not an array', { availableRoles });
      return [];
    }
    
    const cleaned = availableRoles.filter(role => {
      const isValid = typeof role === 'string' && role.trim() !== '';
      if (!isValid) {
        console.warn('ResourcePlannerHeader: Filtering out invalid availableRole:', role);
      }
      return isValid;
    });
    
    console.log('ResourcePlannerHeader: Sanitized availableRoles result:', cleaned);
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
        
      </div>
      
      {/* Filters */}
      <div className="flex items-center gap-6">
        {/* Team Member Search */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Search Team Member:</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Type name to search..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
        </div>
        
        {/* Role Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Filter by Role:</label>
          <MultiRoleSelector
            roles={safeAvailableRoles}
            selectedRoles={safeSelectedRoles}
            onRoleChange={handleRoleChange}
            placeholder="All Roles"
          />
        </div>
      </div>
    </div>
  );
};

export default ResourcePlannerHeader;
