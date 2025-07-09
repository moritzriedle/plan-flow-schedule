import { useCallback } from 'react';
import { Employee } from '../../types';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useEmployeeOperations = (
  employees: Employee[],
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>
) => {
  const { user, profile } = useAuth();

  const addEmployee = useCallback(async (employee: Omit<Employee, 'id'>) => {
    if (!user || !profile?.is_admin) {
      toast.error('Only administrators can add team members. Team members must register with their @proglove.de or @proglove.com email address.');
      return null;
    }

    toast.error('Team members must register with their @proglove.de or @proglove.com email address. You cannot directly add team members.');
    return null;
  }, [user, profile]);

  const updateEmployee = useCallback(async (updatedEmployee: Employee) => {
    if (!user || (!profile?.is_admin && updatedEmployee.id !== user.id)) {
      toast.error('You can only update your own profile');
      return false;
    }

    try {
      console.log('Updating employee in database:', updatedEmployee);
      
      const updateData = {
        name: updatedEmployee.name,
        role: updatedEmployee.role,
        image_url: updatedEmployee.imageUrl || null,
        vacation_dates: updatedEmployee.vacationDates || []
      };
      
      console.log('Update data being sent:', updateData);
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', updatedEmployee.id);
        
      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      console.log('Successfully updated employee in database');
      
      setEmployees(prev => 
        prev.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp)
      );
      toast.success(`Updated profile: ${updatedEmployee.name}`);
      return true;
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Failed to update profile');
      return false;
    }
  }, [user, profile, setEmployees]);

  const getEmployeeById = useCallback((id: string) => {
    return employees.find(employee => employee.id === id);
  }, [employees]);

  return {
    addEmployee,
    updateEmployee,
    getEmployeeById
  };
};