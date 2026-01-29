import React from 'react';
import { Link } from 'react-router-dom';
import { ROLE_OPTIONS } from '@/constants/roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Users, Archive, LayoutGrid } from 'lucide-react';
import TimeframeSelector, { TimeframeOption } from './TimeframeSelector';
import MultiRoleSelector from './MultiRoleSelector';

interface ResourcePlannerHeaderProps {
  timeframe: TimeframeOption;
  onTimeframeChange: (timeframe: TimeframeOption) => void;
  selectedRoles?: string[];
  onRoleChange: (roles: string[]) => void;
  availableRoles?: string[];
  searchTerm?: string;
  onSearchChange: (searchTerm: string) => void;
  showUnallocatedOnly?: boolean;
  onShowUnallocatedChange: (show: boolean) => void;
  showArchivedEmployees?: boolean;
  onShowArchivedEmployeesChange: (show: boolean) => void;
  onAddProject: () => void;
  onAddEmployee: () => void;
}

const ResourcePlannerHeader: React.FC<ResourcePlannerHeaderProps> = ({
  timeframe,
  onTimeframeChange = () => {},
  selectedRoles = [],
  onRoleChange = () => {},
  availableRoles = ROLE_OPTIONS,
  searchTerm = '',
  onSearchChange = () => {},
  showUnallocatedOnly = false,
  onShowUnallocatedChange = () => {},
  showArchivedEmployees = false,
  onShowArchivedEmployeesChange = () => {},
}) => {
  const safeSelectedRoles = React.useMemo(() => {
    if (!Array.isArray(selectedRoles)) return [];
    return selectedRoles.filter(r => typeof r === 'string' && r.trim() !== '');
  }, [selectedRoles]);

  const safeAvailableRoles = React.useMemo(() => {
    if (!Array.isArray(availableRoles)) return [];
    return availableRoles.filter(r => typeof r === 'string' && r.trim() !== '');
  }, [availableRoles]);

  const handleRoleChange = (roles: string[]) => {
    const validRoles = Array.isArray(roles) ? roles.filter(r => typeof r === 'string' && r.trim()) : [];
    onRoleChange(validRoles);
  };

  return (
    <div className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="p-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Controls (wrap-friendly) */}
          <div className="flex flex-wrap items-center gap-3 min-w-[260px]">
            <div className="min-w-[170px]">
              <TimeframeSelector timeframe={timeframe} onTimeframeChange={onTimeframeChange} />
            </div>

            <div className="relative w-64 max-w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                aria-label="Search team members"
                placeholder="Search team member…"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="min-w-[200px] max-w-full">
              <MultiRoleSelector
                roles={safeAvailableRoles}
                selectedRoles={safeSelectedRoles}
                onRoleChange={handleRoleChange}
                placeholder="All roles"
              />
            </div>
          </div>

          {/* Actions (always visible, wraps on zoom) */}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              variant={showUnallocatedOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => onShowUnallocatedChange(!showUnallocatedOnly)}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <Users className="h-4 w-4" />
              {showUnallocatedOnly ? 'Show All' : 'Unallocated Only'}
            </Button>

            <Button
              variant={showArchivedEmployees ? 'default' : 'outline'}
              size="sm"
              onClick={() => onShowArchivedEmployeesChange(!showArchivedEmployees)}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <Archive className="h-4 w-4" />
              {showArchivedEmployees ? 'Hide Archived' : 'Show Archived'}
            </Button>

            <Link to="/alignment-hub" className="shrink-0">
              <Button variant="outline" size="sm" className="flex items-center gap-2 whitespace-nowrap">
                <LayoutGrid className="h-4 w-4" />
                Alignment Hub
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourcePlannerHeader;
