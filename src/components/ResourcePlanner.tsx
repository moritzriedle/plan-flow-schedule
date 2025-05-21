
import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { usePlanner } from '../contexts/PlannerContext';
import EmployeeRow from './EmployeeRow';
import ProjectsSidebar from './ProjectsSidebar';

const ResourcePlanner: React.FC = () => {
  const { employees, weeks } = usePlanner();

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen overflow-hidden bg-white">
        <ProjectsSidebar />
        
        <div className="flex-1 overflow-auto flex flex-col">
          {/* Header with week labels */}
          <div className="flex border-b sticky top-0 z-10 bg-white shadow-sm">
            <div className="w-64 flex-shrink-0 p-4 font-semibold bg-gray-50 border-r">
              Team Members
            </div>
            
            <div className="flex flex-1">
              {weeks.map(week => (
                <div 
                  key={week.id}
                  className="flex-1 min-w-[180px] p-4 text-center font-medium border-r"
                >
                  {week.label}
                </div>
              ))}
            </div>
          </div>
          
          {/* Employee rows */}
          <div className="flex-1 overflow-auto">
            {employees.map(employee => (
              <EmployeeRow key={employee.id} employee={employee} />
            ))}
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default ResourcePlanner;
