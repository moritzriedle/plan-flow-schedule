
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePlanner } from '@/contexts/PlannerContext';
import { toast } from 'sonner';
import TicketReferenceInput from './TicketReferenceInput';

interface AddProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PROJECT_COLORS = ['blue', 'purple', 'pink', 'orange', 'green'] as const;

export const AddProjectDialog: React.FC<AddProjectDialogProps> = ({
  open,
  onOpenChange
}) => {
  const { addProject, employees } = usePlanner();
  const [name, setName] = useState('');
  const [color, setColor] = useState<typeof PROJECT_COLORS[number]>('blue');
  const [leadId, setLeadId] = useState('');
  const [ticketReference, setTicketReference] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    const result = await addProject({
      name: name.trim(),
      color,
      startDate: new Date(),
      endDate: new Date(),
      leadId: leadId || undefined,
      ticketReference: ticketReference.trim() || undefined
    });

    if (result) {
      setName('');
      setColor('blue');
      setLeadId('');
      setTicketReference('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Project</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Project Name *</label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="ticketReference" className="text-sm font-medium">Ticket Reference</label>
            <TicketReferenceInput
              value={ticketReference}
              onChange={setTicketReference}
              placeholder="e.g., PPT-82"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="color" className="text-sm font-medium">Color</label>
            <Select value={color} onValueChange={(value) => setColor(value as typeof PROJECT_COLORS[number])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_COLORS.map((colorOption) => (
                  <SelectItem key={colorOption} value={colorOption}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: `var(--project-${colorOption})` }}
                      />
                      {colorOption.charAt(0).toUpperCase() + colorOption.slice(1)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="lead" className="text-sm font-medium">Project Lead</label>
            <Select value={leadId} onValueChange={setLeadId}>
              <SelectTrigger>
                <SelectValue placeholder="Select project lead (optional)" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name} - {employee.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Project</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
