// components/AddProjectDialog.tsx
import React from 'react';
import { usePlanner } from '@/contexts/PlannerContext';
import { Project } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import ProjectForm from './ProjectForm';

interface AddProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddProjectDialog: React.FC<AddProjectDialogProps> = ({
  isOpen,
  onClose
}) => {
  const { addProject } = usePlanner();

  const handleAdd = (projectData: Partial<Project>) => {
    const newProject: Project = {
      id: uuidv4(),
      name: projectData.name ?? '',
      color: projectData.color ?? 'blue',
      startDate: projectData.startDate ?? new Date(),
      endDate: projectData.endDate ?? new Date(),
      leadId: projectData.leadId
    };

    addProject(newProject);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Project</DialogTitle>
        </DialogHeader>
        <ProjectForm
          initialProject={{}}
          onSubmit={handleAdd}
          submitLabel="Create Project"
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddProjectDialog;
