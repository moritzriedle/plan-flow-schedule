
import React, { createContext, useContext } from 'react';
import { PlannerContextType } from './PlannerContextTypes';
import { usePlannerStore } from '../hooks/usePlannerStore';

// Create context
const PlannerContext = createContext<PlannerContextType | undefined>(undefined);

export const PlannerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('PlannerProvider initializing');
  
  // Use the store hook to manage all planner state and actions
  const plannerStore = usePlannerStore();
  
  console.log('PlannerProvider rendering with value:', plannerStore);

  return (
    <PlannerContext.Provider value={plannerStore}>
      {children}
    </PlannerContext.Provider>
  );
};

export const usePlanner = () => {
  const context = useContext(PlannerContext);
  if (context === undefined) {
    throw new Error('usePlanner must be used within a PlannerProvider');
  }
  console.log('usePlanner hook called, returning context');
  return context;
};
