import { supabase } from './client'
import { Project } from '@/types/Project'

// ...existing code...

export async function updateProject(project: Project) {
    // ...existing code...
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
    // ...existing code...
}

// ...existing code...