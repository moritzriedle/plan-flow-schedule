
import React, { useState } from 'react';
import ResourcePlanner from '@/components/ResourcePlanner';
import ProjectGanttView from '@/components/ProjectGanttView';
import '@/components/ProjectColors.css';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FilterIcon, ChartGantt } from 'lucide-react';

const Index = () => {
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
        </TabsList>
        
        <TabsContent value="allocation">
          <ResourcePlanner />
        </TabsContent>
        
        <TabsContent value="timeline">
          <ProjectGanttView />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
