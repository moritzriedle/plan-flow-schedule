import { supabase } from './client'
import { Project } from '@/types/Project'

export async function updateProject(project: Project) {
    const { id, name, startDate, endDate, ...rest } = project
    const { data, error } = await supabase
        .from('projects')
        .update({
            name,
            start_date: startDate,
            end_date: endDate,
            ...rest
        })
        .eq('id', id)
}

export async function updateProjectInSupabase(project: Project) {
  const { id, ...fields } = project;
  const { error } = await supabase
    .from('projects')
    .update(fields)
    .eq('id', id);

  if (error) {
    throw error;
  }
}