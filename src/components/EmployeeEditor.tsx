
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Employee } from '@/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { usePlanner } from '@/contexts/PlannerContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

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

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmployee({
      ...employee,
      name,
      role,
      imageUrl: imageUrl || undefined
    });
    toast.success("Employee details updated");
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
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
            <Input 
              id="role" 
              value={role} 
              onChange={(e) => setRole(e.target.value)} 
              placeholder="Enter professional role"
              required
            />
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
          
          <SheetFooter className="pt-4">
            <Button type="submit">Save Changes</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default EmployeeEditor;
