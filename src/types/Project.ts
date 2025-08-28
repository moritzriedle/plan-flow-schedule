export interface Project {
  id: string;
  name: string;
  color: 'blue' | 'purple' | 'pink' | 'orange' | 'green';
  startDate?: Date;
  endDate?: Date;
  leadId?: string;
  ticketReference?: string;
  description?: string;
}