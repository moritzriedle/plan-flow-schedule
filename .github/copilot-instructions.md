# Copilot Instructions for plan-flow-schedule

## Project Overview
This is a Vite + React + TypeScript project for resource and project planning. It features a drag-and-drop interface for allocating employees to projects and sprints, with a focus on visual scheduling and team management. UI is built with shadcn-ui and Tailwind CSS. Data is managed in-memory and/or via Supabase integration.

## Architecture & Key Components
- **src/components/**: UI components for planners, dialogs, editors, and views. `ResourcePlanner.tsx` is the main entry for the planning interface.
- **src/hooks/**: Custom hooks for data loading, state management, and business logic. `usePlannerStore.ts` orchestrates employee, project, allocation, and sprint operations via sub-hooks.
- **src/contexts/PlannerContext.tsx**: Provides global planner state/context.
- **src/types/**: Type definitions for core entities (Employee, Project, Allocation, Sprint, DragItem).
- **src/data/sampleData.ts**: Example data for local development and testing.
- **src/constants/roles.ts**: Role definitions for employees.
- **src/integrations/supabase/**: Supabase integration for backend data persistence.

## Developer Workflows
- **Start Dev Server**: `npm run dev` (port 8080, auto-reload)
- **Build**: `npm run build` or `npm run build:dev`
- **Lint**: `npm run lint`
- **Preview**: `npm run preview`
- **Edit via Lovable**: Changes made in Lovable are auto-committed to this repo.

## Project-Specific Patterns
- **Planner Store Pattern**: All planner operations (add/update/delete employee/project/allocation) are accessed via `usePlannerStore` and its sub-hooks. Always use these hooks for state changes.
- **Drag-and-Drop**: Uses `react-dnd` for allocation movement. See `ResourcePlanner.tsx` and related grid/cell components.
- **UI Composition**: Components are organized by domain (e.g., dialogs, editors, views) and use shadcn-ui primitives.
- **Type Safety**: All entities and operations are strongly typed. Extend types in `src/types/` before adding new fields.
- **Tailwind Customization**: Colors and themes are extended in `tailwind.config.ts` using CSS variables.
- **Alias Imports**: Use `@/` for `src/` imports (see `vite.config.ts`).

## Integration Points
- **Supabase**: Backend integration for persistent data. See `src/integrations/supabase/`.
- **Lovable**: Project can be edited and deployed via [Lovable](https://lovable.dev/projects/ef264048-cc2d-410d-b567-49db9e67b678).

## Conventions & Tips
- **State Management**: Never mutate state directly; always use provided setter functions from hooks/context.
- **Component Tagging**: In development, `lovable-tagger` plugin is enabled for component tracking.
- **Testing**: Use sample data for local testing. Add new samples to `src/data/sampleData.ts`.
- **Custom Domains**: See Lovable docs for domain setup.

## Example: Adding a New Planner Feature
1. Define new types in `src/types/`
2. Extend planner store hooks in `src/hooks/plannerStore/`
3. Add UI in `src/components/`
4. Wire up context/state via `usePlannerStore` and `PlannerContext`

---
If any section is unclear or missing, please provide feedback for further refinement.
