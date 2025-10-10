import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types';

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);

  const updateProject = async (project: Project) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: project.name,
          color: project.color,
          lead_id: project.leadId,
          ticket_reference: project.ticketReference,
          description: project.description,
          start_date: project.startDate ? project.startDate.toISOString().split('T')[0] : null,
          end_date: project.endDate ? project.endDate.toISOString().split('T')[0] : null,
          archived: project.archived || false,
        })
        .eq('id', project.id);

      if (error) {
        throw error;
      }

      // Update local state
      setProjects(prev => prev.map(p => p.id === project.id ? project : p));
      
      toast.success('Project updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
      return false;
    }
  };

  return {
    projects,
    setProjects,
    updateProject
  };
};