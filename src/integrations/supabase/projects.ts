import { supabase } from './client'
import { Project } from '@/types/Project'

export async function updateProject(project: Project) {
    const { id, name, startDate, endDate, ...rest } = project
    const { data, error } = await supabase
        .from('projects')
        .update({
            name,
            start_date: startDate ? startDate.toISOString().split('T')[0] : null,
            end_date: endDate ? endDate.toISOString().split('T')[0] : null,
            ...rest
        })
        .eq('id', id)
}

export async function updateProjectInSupabase(project: Project) {
  const { id, name, startDate, endDate, ...rest } = project;
  const updateFields = {
    name,
    start_date: startDate ? startDate.toISOString().split('T')[0] : null,
    end_date: endDate ? endDate.toISOString().split('T')[0] : null,
    ...rest
  };
  const { error } = await supabase
    .from('projects')
    .update(updateFields)
    .eq('id', id);

  if (error) {
    throw error;
  }
}