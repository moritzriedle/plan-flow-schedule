import React from 'react';
import { PlannerProvider } from '../contexts/PlannerContext';
import AlignmentHubView from '../components/AlignmentHub/AlignmentHubView';

const AlignmentHub: React.FC = () => {
  return (
    <PlannerProvider>
      <AlignmentHubView />
    </PlannerProvider>
  );
};

export default AlignmentHub;
