
import { useState, useCallback, useEffect } from 'react';
import { Employee, Project, Allocation, Week, DragItem } from '../types';
import { sampleEmployees, sampleProjects, sampleAllocations } from '../data/sampleData';
import { toast } from '@/components/ui/sonner';
import { startOfWeek } from 'date-fns';
import { generateWeeks } from '../utils/dateUtils';

export const usePlannerStore = () => {
  console.log('usePlannerStore initializing');

  // Weeks don't change, so we can just generate them once
  const [weeks] = useState<Week[]>(() => {
    console.log('Generating weeks');
    return generateWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 8);
  });
  
  // Initialize state with data from localStorage or sample data
  const [employees, setEmployees] = useState<Employee[]>(() => {
    console.log('Loading employees');
    const savedEmployees = localStorage.getItem('planner_employees');
    const loadedEmployees = savedEmployees ? JSON.parse(savedEmployees) : sampleEmployees;
    console.log('Loaded employees:', loadedEmployees);
    return loadedEmployees;
  });
  
  const [projects, setProjects] = useState<Project[]>(() => {
    console.log('Loading projects');
    const savedProjects = localStorage.getItem('planner_projects');
    let loadedProjects;
    if (savedProjects) {
      // Parse and convert date strings back to Date objects
      const parsedProjects = JSON.parse(savedProjects);
      loadedProjects = parsedProjects.map((proj: any) => ({
        ...proj,
        startDate: new Date(proj.startDate),
        endDate: new Date(proj.endDate)
      }));
    } else {
      loadedProjects = sampleProjects;
    }
    console.log('Loaded projects:', loadedProjects);
    return loadedProjects;
  });
  
  const [allocations, setAllocations] = useState<Allocation[]>(() => {
    console.log('Loading allocations');
    const savedAllocations = localStorage.getItem('planner_allocations');
    const loadedAllocations = savedAllocations ? JSON.parse(savedAllocations) : sampleAllocations;
    console.log('Loaded allocations:', loadedAllocations);
    return loadedAllocations;
  });
  
  // Save to localStorage when data changes
  useEffect(() => {
    console.log('Saving employees to localStorage:', employees);
    localStorage.setItem('planner_employees', JSON.stringify(employees));
  }, [employees]);
  
  useEffect(() => {
    // For projects, we need to handle Date objects specially
    console.log('Saving projects to localStorage:', projects);
    localStorage.setItem('planner_projects', JSON.stringify(projects));
  }, [projects]);
  
  useEffect(() => {
    console.log('Saving allocations to localStorage:', allocations);
    localStorage.setItem('planner_allocations', JSON.stringify(allocations));
  }, [allocations]);

  // Add a new employee
  const addEmployee = useCallback((employee: Omit<Employee, 'id'>) => {
    const newEmployee = {
      ...employee,
      id: `emp${Date.now()}`,
    };
    setEmployees(prev => [...prev, newEmployee]);
    toast.success(`Added employee: ${newEmployee.name}`);
  }, []);

  // Update an existing employee
  const updateEmployee = useCallback((updatedEmployee: Employee) => {
    setEmployees(prev => 
      prev.map(emp => emp.id === updatedEmployee.id ? updatedEmployee : emp)
    );
    toast.success(`Updated employee: ${updatedEmployee.name}`);
  }, []);

  // Get an employee by ID
  const getEmployeeById = useCallback((id: string) => {
    return employees.find(employee => employee.id === id);
  }, [employees]);

  // Add a new project
  const addProject = useCallback((project: Omit<Project, 'id'>) => {
    const newProject = {
      ...project,
      id: `proj${Date.now()}`,
    };
    setProjects(prev => [...prev, newProject]);
    toast.success(`Added project: ${newProject.name}`);
  }, []);

  // Update an existing project
  const updateProject = useCallback((updatedProject: Project) => {
    setProjects(prev => 
      prev.map(proj => proj.id === updatedProject.id ? updatedProject : proj)
    );
    toast.success(`Updated project: ${updatedProject.name}`);
  }, []);

  // Add a new allocation
  const addAllocation = useCallback((allocation: Omit<Allocation, 'id'>) => {
    const newAllocation = {
      ...allocation,
      id: `alloc${Date.now()}`,
    };
    setAllocations(prev => [...prev, newAllocation]);
    toast.success('Resource allocated successfully');
  }, []);

  // Update an existing allocation
  const updateAllocation = useCallback((updatedAllocation: Allocation) => {
    setAllocations(prev => 
      prev.map(alloc => alloc.id === updatedAllocation.id ? updatedAllocation : alloc)
    );
    toast.success('Allocation updated');
  }, []);

  // Move an allocation to a different week
  const moveAllocation = useCallback((dragItem: DragItem, weekId: string) => {
    if (dragItem.sourceWeekId) {
      // This is an existing allocation being moved
      setAllocations(prev => 
        prev.map(alloc => {
          if (alloc.id === dragItem.id) {
            return { ...alloc, weekId };
          }
          return alloc;
        })
      );
      toast.success('Resource moved successfully');
    } else {
      // This is a new allocation being created
      const newAllocation: Allocation = {
        id: `alloc${Date.now()}`,
        employeeId: dragItem.employeeId,
        projectId: dragItem.projectId,
        weekId,
        days: dragItem.days || 3, // Default to 3 days if not specified
      };
      setAllocations(prev => [...prev, newAllocation]);
      toast.success('Resource allocated successfully');
    }
  }, []);

  // Delete an allocation
  const deleteAllocation = useCallback((id: string) => {
    setAllocations(prev => prev.filter(alloc => alloc.id !== id));
    toast.success('Allocation removed');
  }, []);

  // Get all allocations for an employee
  const getEmployeeAllocations = useCallback((employeeId: string) => {
    return allocations.filter(alloc => alloc.employeeId === employeeId);
  }, [allocations]);

  // Get a project by ID
  const getProjectById = useCallback((id: string) => {
    return projects.find(project => project.id === id);
  }, [projects]);

  // Get total days allocated for an employee in a specific week
  const getTotalAllocationDays = useCallback((employeeId: string, weekId: string) => {
    return allocations
      .filter(alloc => alloc.employeeId === employeeId && alloc.weekId === weekId)
      .reduce((total, alloc) => total + alloc.days, 0);
  }, [allocations]);

  // Get all allocations for a project
  const getProjectAllocations = useCallback((projectId: string) => {
    return allocations.filter(alloc => alloc.projectId === projectId);
  }, [allocations]);

  return {
    employees,
    projects,
    allocations,
    weeks,
    addEmployee,
    updateEmployee,
    addProject,
    updateProject,
    addAllocation,
    updateAllocation,
    moveAllocation,
    deleteAllocation,
    getEmployeeAllocations,
    getProjectById,
    getEmployeeById,
    getTotalAllocationDays,
    getProjectAllocations,
  };
};
