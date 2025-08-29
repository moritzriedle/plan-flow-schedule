import React, { useState } from 'react';
import ProjectForm from './ProjectForm'; // you can replace the whole form with ProjectForm component instead if preferred
import { usePlanner } from '@/contexts/PlannerContext';
import { Project } from '@/types';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import TicketReferenceInput from './TicketReferenceInput'; // import your Jira input

interface ProjectEditDialogProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

const ProjectEditDialog: React.FC<ProjectEditDialogProps> = ({
  project,
  isOpen,
  onClose
}) => {
  const { updateProject, employees } = usePlanner();

  const [name, setName] = useState(project.name);
  const [color, setColor] = useState<Project['color']>(project.color);
  const [leadId, setLeadId] = useState(project.leadId || '');
  const [startDate, setStartDate] = useState<Date>(project.startDate);
  const [endDate, setEndDate] = useState<Date>(project.endDate);
  const [ticketReference, setTicketReference] = useState(project.ticketReference || '');

  const colorOptions: Project['color'][] = ['blue', 'purple', 'pink', 'orange', 'green'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedProject: Project = {
      ...project,
      name,
      color,
      leadId: leadId === 'none' ? undefined : leadId,
      startDate, // pass Date object
      endDate,   // pass Date object
      ticketReference: ticketReference || undefined,
    };

    updateProject(updatedProject);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-color">Project Color</Label>
            <Select value={color} onValueChange={(value: Project['color']) => setColor(value)}>
              <SelectTrigger id="project-color">
                <SelectValue placeholder="Select color" />
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map((colorOption) => (
                  <SelectItem key={colorOption} value={colorOption}>
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded mr-2" 
                        style={{ backgroundColor: `var(--project-${colorOption})` }}
                      />
                      <span className="capitalize">{colorOption}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-lead">Project Lead</Label>
            <Select value={leadId} onValueChange={setLeadId}>
              <SelectTrigger id="project-lead">
                <SelectValue placeholder="Select project lead" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No project lead</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name} ({employee.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticketReference">Ticket Reference</Label>
            <TicketReferenceInput
              value={ticketReference}
              onChange={setTicketReference}
              placeholder="e.g., PPT-82"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(endDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectEditDialog;
