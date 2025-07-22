import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePlanner } from '@/contexts/PlannerContext';
import { toast } from 'sonner';
import { ROLE_OPTIONS } from '@/constants/roles';

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddEmployeeDialog: React.FC<AddEmployeeDialogProps> = ({
  open,
  onOpenChange
}) => {
  const { addEmployee } = usePlanner();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

if (!name.trim() || !role) {
  toast.error('Please fill in all required fields');
  return;
}

const result = await addEmployee({
  name: name.trim(),
  role,
  imageUrl: imageUrl.trim() || undefined
});

if (result) {
  setName('');
  setRole('');
  setImageUrl('');
  onOpenChange(false);
}

  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
        </DialogHeader>

    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">Name *</label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter full name"
          required
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="role" className="text-sm font-medium">Role *</label>
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
          placeholder="<https://example.com/image.jpg> (optional)"
        />
      </div>
      
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit">Add Team Member</Button>
      </div>
    </form>
  </DialogContent>
</Dialog>

  );
};
