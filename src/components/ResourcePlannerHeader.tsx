
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, UserPlus } from 'lucide-react';
import TimeframeSelector from './TimeframeSelector';
import MultiRoleSelector from './MultiRoleSelector';

interface ResourcePlannerHeaderProps {
  timeframe: string;
  onTimeframeChange: (timeframe: string) => void;
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
          roles={availableRoles}
          selectedRoles={selectedRoles}
          onRoleChange={onRoleChange}
          placeholder="All Roles"
        />
      </div>
    </div>
  );
};

export default ResourcePlannerHeader;
