import { updateProject as updateProjectSupabase } from '@/integrations/supabase/projects'
// ...existing imports

const updateProject = async (project: Project) => {
    // ...existing code
    await updateProjectSupabase(project)
    // ...existing code
}

// ...existing code