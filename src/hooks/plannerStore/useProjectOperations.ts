// src/hooks/projects/useProjectOperations.ts
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

  const addProject = useCallback(
    async (project: Omit<Project, 'id'>) => {
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
            lead_id: project.leadId ?? null,
            ticket_reference: project.ticketReference ?? null,
            start_date: project.startDate
              ? project.startDate.toISOString().split('T')[0]
              : null,
            end_date: project.endDate
              ? project.endDate.toISOString().split('T')[0]
              : null,
            archived: project.archived ?? false, // ← NEW
          })
          .select()
          .single();

        if (error) throw error;

        const newProject: Project = {
          id: data.id,
          name: data.name,
          color: data.color as Project['color'],
          startDate: (data as any).start_date ? new Date((data as any).start_date) : null,
          endDate: (data as any).end_date ? new Date((data as any).end_date) : null,
          leadId: data.lead_id ?? undefined,
          ticketReference: data.ticket_reference ?? undefined,
          archived: !!data.archived, // ← NEW
        };

        setProjects((prev) =>
          [...prev, newProject].sort((a, b) => a.name.localeCompare(b.name))
        );

        toast.success(`Added project: ${newProject.name}`);
        return newProject;
      } catch (error) {
        console.error('Error adding project:', error);
        toast.error('Failed to add project');
        return null;
      }
    },
    [user, profile, setProjects]
  );

  const updateProject = useCallback(
    async (updatedProject: Project) => {
      const allowedRoles = [
        'Manager',
        'Product Manager',
        'Product Owner',
        'Technical Project Manager',
      ];
      const canUpdate =
        profile?.is_admin || (profile?.role && allowedRoles.includes(profile.role));

      if (!user || !canUpdate) {
        toast.error('You do not have permission to update projects');
        return false;
      }

      try {
        const { data, error } = await supabase
          .from('projects')
          .update({
            name: updatedProject.name,
            color: updatedProject.color,
            lead_id: updatedProject.leadId ?? null,
            ticket_reference: updatedProject.ticketReference ?? null,
            start_date: updatedProject.startDate
              ? updatedProject.startDate.toISOString().split('T')[0]
              : null,
            end_date: updatedProject.endDate
              ? updatedProject.endDate.toISOString().split('T')[0]
              : null,
            archived: updatedProject.archived, // ← NEW
          })
          .eq('id', updatedProject.id)
          .select()
          .single(); // return canonical row

        if (error) throw error;

        // normalize back to Project
        const normalized: Project = {
          id: data.id,
          name: data.name,
          color: data.color as Project['color'],
          startDate: (data as any).start_date ? new Date((data as any).start_date) : null,
          endDate: (data as any).end_date ? new Date((data as any).end_date) : null,
          leadId: data.lead_id ?? undefined,
          ticketReference: data.ticket_reference ?? undefined,
          archived: !!data.archived,
        };

        setProjects((prev) =>
          prev
            .map((p) => (p.id === normalized.id ? normalized : p))
            .sort((a, b) => a.name.localeCompare(b.name))
        );

        toast.success(`Updated project: ${normalized.name}`);
        return true;
      } catch (error) {
        console.error('Error updating project:', error);
        toast.error('Failed to update project');
        return false;
      }
    },
    [user, profile, setProjects]
  );

  const getProjectById = useCallback(
    (id: string) => projects.find((project) => project.id === id),
    [projects]
  );

  return {
    addProject,
    updateProject,
    getProjectById,
  };
};
