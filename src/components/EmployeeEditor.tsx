
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Employee } from '@/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePlanner } from '@/contexts/PlannerContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { ROLE_OPTIONS } from '@/constants/roles';
import VacationDateRangeSelector from './VacationDateRangeSelector';
import { Checkbox } from '@/components/ui/checkbox';

interface EmployeeEditorProps {
  employee: Employee;
  isOpen: boolean;
  onClose: () => void;
}

const EmployeeEditor: React.FC<EmployeeEditorProps> = ({ 
  employee, 
  isOpen, 
  onClose 
}) => {
  const { updateEmployee } = usePlanner();
  const [name, setName] = useState(employee.name);
  const [role, setRole] = useState(employee.role);
  const [imageUrl, setImageUrl] = useState(employee.imageUrl || '');
  const [vacationDates, setVacationDates] = useState(employee.vacationDates || []);
  const [archived, setArchived] = useState(employee.archived || false);

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Submitting employee update:', {
      id: employee.id,
      name,
      role,
      imageUrl: imageUrl || undefined,
      vacationDates
    });

const success = await updateEmployee({
      ...employee,
      name,
      role,
      imageUrl: imageUrl || undefined,
      vacationDates,
      archived
    });
    
  
    if (success) {
      onClose();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-96">
        <SheetHeader>
          <SheetTitle>Edit Team Member</SheetTitle>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16">
              {imageUrl ? (
                <AvatarImage src={imageUrl} alt={name} />
              ) : (
                <AvatarFallback>{getInitials(name)}</AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <h3 className="font-medium">{name}</h3>
              <p className="text-sm text-gray-500">{role}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Name</label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Enter full name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="role" className="text-sm font-medium">Role</label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((roleOption) => (
                  <SelectItem key={roleOption} value={roleOption}>
                    {roleOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="imageUrl" className="text-sm font-medium">Profile Image URL</label>
            <Input 
              id="imageUrl" 
              value={imageUrl} 
              onChange={(e) => setImageUrl(e.target.value)} 
              placeholder="https://example.com/image.jpg (optional)"
            />
            <p className="text-xs text-gray-500">Leave empty to use initials</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Vacation Dates</label>
            <VacationDateRangeSelector
              selectedDates={vacationDates}
              onDatesChange={setVacationDates}
            />
          </div>

          <div className="flex items-center space-x-2 pt-4 border-t">
            <Checkbox
              id="archived"
              checked={archived}
              onCheckedChange={(checked) => setArchived(checked === true)}
            />
            <label
              htmlFor="archived"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Archive this team member
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            Archived team members are hidden from the Resource Allocation view by default.
          </p>
          
          <SheetFooter className="pt-4">
            <Button type="submit">Save Changes</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default EmployeeEditor;
