import { useCallback } from 'react';
import { Project } from '../../types';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useProjectOperations = (
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  const { user, profile } = useAuth();

  const addProject = useCallback(async (project: Omit<Project, 'id'>) => {
    if (!user || !profile?.is_admin) {
      toast.error('Only administrators can add projects');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: project.name,
          color: project.color,
          lead_id: project.leadId,
          ticket_reference: project.ticketReference
        })
        .select()
        .single();
        
      if (error) throw error;
      
      const newProject: Project = {
        id: data.id,
        name: data.name,
        color: data.color as 'blue' | 'purple' | 'pink' | 'orange' | 'green',
        startDate: project.startDate,
        endDate: project.endDate,
        leadId: data.lead_id,
        ticketReference: data.ticket_reference
      };
      
      // Add new project and sort alphabetically
      setProjects(prev => [...prev, newProject].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success(`Added project: ${newProject.name}`);
      return newProject;
    } catch (error) {
      console.error('Error adding project:', error);
      toast.error('Failed to add project');
      return null;
    }
  }, [user, profile, setProjects]);

 const updateProject = useCallback(async (updatedProject: Project) => {
    const allowedRoles = [
      'Manager',
      'Product Manager',
      'Product Owner',
      'Technical Project Manager'
    ];
    const canUpdate =
      profile?.is_admin || (profile?.role && allowedRoles.includes(profile.role));

    if (!user || !canUpdate) {
      toast.error('You do not have permission to update projects');
      return false;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: updatedProject.name,
          color: updatedProject.color,
          lead_id: updatedProject.leadId,
          ticket_reference: updatedProject.ticketReference,
          start_date: updatedProject.startDate,
          end_date: updatedProject.endDate
        })
        .eq('id', updatedProject.id);
        
      if (error) throw error;
      
      // Update project and maintain alphabetical sorting
      setProjects(prev => 
        prev.map(proj => proj.id === updatedProject.id ? updatedProject : proj)
           .sort((a, b) => a.name.localeCompare(b.name))
      );
      toast.success(`Updated project: ${updatedProject.name}`);
      return true;
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
      return false;
    }
  }, [user, profile, setProjects]);

  const getProjectById = useCallback((id: string) => {
    return projects.find(project => project.id === id);
  }, [projects]);

  return {
    addProject,
    updateProject,
    getProjectById
  };
};
