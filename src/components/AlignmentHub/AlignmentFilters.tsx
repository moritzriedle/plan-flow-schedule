import React, { useState, useMemo } from 'react';
import { Project, Employee } from '../../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, X, ChevronDown } from 'lucide-react';

interface AlignmentFiltersProps {
  projects: Project[];
  employees: Employee[];
  selectedProjectIds: string[];
  selectedEmployeeIds: string[];
  onProjectFilterChange: (ids: string[]) => void;
  onEmployeeFilterChange: (ids: string[]) => void;
}

const MultiSelectFilter: React.FC<{
  label: string;
  items: { id: string; name: string; color?: string }[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}> = ({ label, items, selectedIds, onChange }) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(
    () =>
      items.filter((i) =>
        i.name.toLowerCase().includes(search.toLowerCase().trim())
      ),
    [items, search]
  );

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((s) => s !== id)
        : [...selectedIds, id]
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Filter className="w-3.5 h-3.5" />
          {label}
          {selectedIds.length > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              {selectedIds.length}
            </Badge>
          )}
          <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <Input
          placeholder={`Search ${label.toLowerCase()}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2 h-8 text-sm"
        />
        <div className="max-h-48 overflow-y-auto space-y-1">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground py-2 text-center">No results</p>
          )}
          {filtered.map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer text-sm"
            >
              <Checkbox
                checked={selectedIds.includes(item.id)}
                onCheckedChange={() => toggle(item.id)}
              />
              <span className="truncate">{item.name}</span>
            </label>
          ))}
        </div>
        {selectedIds.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-xs"
            onClick={() => onChange([])}
          >
            Clear all
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
};

const AlignmentFilters: React.FC<AlignmentFiltersProps> = ({
  projects,
  employees,
  selectedProjectIds,
  selectedEmployeeIds,
  onProjectFilterChange,
  onEmployeeFilterChange,
}) => {
  const activeProjects = useMemo(
    () =>
      projects
        .filter((p) => !p.archived)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [projects]
  );

  const activeEmployees = useMemo(
    () =>
      employees
        .filter((e) => !e.archived)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [employees]
  );

  const allSelectedIds = [...selectedProjectIds, ...selectedEmployeeIds];
  const hasFilters = allSelectedIds.length > 0;

  const getNameById = (id: string) => {
    const p = projects.find((x) => x.id === id);
    if (p) return p.name;
    const e = employees.find((x) => x.id === id);
    if (e) return e.name;
    return id;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <MultiSelectFilter
          label="Projects"
          items={activeProjects}
          selectedIds={selectedProjectIds}
          onChange={onProjectFilterChange}
        />
        <MultiSelectFilter
          label="Employees"
          items={activeEmployees}
          selectedIds={selectedEmployeeIds}
          onChange={onEmployeeFilterChange}
        />
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => {
              onProjectFilterChange([]);
              onEmployeeFilterChange([]);
            }}
          >
            <X className="w-3 h-3 mr-1" />
            Clear all filters
          </Button>
        )}
      </div>

      {hasFilters && (
        <div className="flex flex-wrap gap-1.5">
          {selectedProjectIds.map((id) => (
            <Badge
              key={id}
              variant="secondary"
              className="text-xs gap-1 cursor-pointer"
              onClick={() =>
                onProjectFilterChange(selectedProjectIds.filter((s) => s !== id))
              }
            >
              {getNameById(id)}
              <X className="w-3 h-3" />
            </Badge>
          ))}
          {selectedEmployeeIds.map((id) => (
            <Badge
              key={id}
              variant="outline"
              className="text-xs gap-1 cursor-pointer"
              onClick={() =>
                onEmployeeFilterChange(selectedEmployeeIds.filter((s) => s !== id))
              }
            >
              {getNameById(id)}
              <X className="w-3 h-3" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlignmentFilters;
