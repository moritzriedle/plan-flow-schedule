
import React, { ErrorInfo, ReactNode, Suspense, useState } from 'react';
import ResourcePlanner from '@/components/ResourcePlanner';
import ProjectGanttView from '@/components/ProjectGanttView';
import ProfessionView from '@/components/ProfessionView';
import '@/components/ProjectColors.css';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FilterIcon, ChartGantt, Users } from 'lucide-react';

// Component-specific error boundary for better error isolation
class ComponentErrorBoundary extends React.Component<
  { children: ReactNode; name: string },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; name: string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in ${this.props.name}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-200 rounded bg-red-50">
          <h2 className="font-semibold text-red-600">Error in {this.props.name}</h2>
          <p className="text-sm mt-1">{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

const Index = () => {
  console.log('Index component rendering');
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-bold mb-6">Project Resource Management</h1>
      
      <Tabs defaultValue="allocation" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="allocation" className="flex items-center gap-2">
            <FilterIcon className="w-4 h-4" />
            Resource Allocation
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <ChartGantt className="w-4 h-4" />
            Project Timeline
          </TabsTrigger>
          <TabsTrigger value="profession" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            By Profession
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="allocation">
          <Suspense fallback={<div>Loading Resource Planner...</div>}>
            <ComponentErrorBoundary name="ResourcePlanner">
              <ResourcePlanner />
            </ComponentErrorBoundary>
          </Suspense>
        </TabsContent>
        
        <TabsContent value="timeline">
          <Suspense fallback={<div>Loading Project Timeline...</div>}>
            <ComponentErrorBoundary name="ProjectGanttView">
              <ProjectGanttView />
            </ComponentErrorBoundary>
          </Suspense>
        </TabsContent>
        
        <TabsContent value="profession">
          <Suspense fallback={<div>Loading Profession View...</div>}>
            <ComponentErrorBoundary name="ProfessionView">
              <ProfessionView />
            </ComponentErrorBoundary>
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
