
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, addMonths } from 'date-fns';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

interface RoleAllocation {
  projectName: string;
  userName: string;
  userRole: string;
  userImageUrl: string | null;
  week: string;
  days: number;
  userId: string;
}

interface MonthlyCapacity {
  month: Date;
  totalAllocated: number;
  totalCapacity: number;
  availableCapacity: number;
  utilizationRate: number;
  teamMembers: {
    id: string;
    name: string;
    imageUrl: string | null;
    allocatedDays: number;
    capacity: number;
  }[];
}

export default function ProfessionView() {
  const [roles, setRoles] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [allocations, setAllocations] = useState<RoleAllocation[]>([]);
  const [monthlyCapacities, setMonthlyCapacities] = useState<MonthlyCapacity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAllocations, setLoadingAllocations] = useState(false);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  
  // Generate months for the last 6 months and next 6 months
  const months = eachMonthOfInterval({
    start: addMonths(new Date(), -6),
    end: addMonths(new Date(), 6)
  });

  // Load unique roles from profiles table
  useEffect(() => {
    async function fetchRoles() {
      try {
        console.log('Fetching roles from profiles table...');
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .order('role');
          
        if (error) {
          console.error('Error fetching roles:', error);
          throw error;
        }
        
        console.log('Raw roles data:', data);
        
        // Get unique roles, filtering out null/empty values
        const uniqueRoles = [...new Set(data?.map(profile => profile.role).filter(role => role && role.trim() !== '') || [])];
        console.log('Unique roles found:', uniqueRoles);
        
        setRoles(uniqueRoles);
        
        if (uniqueRoles.length > 0) {
          setSelectedRole(uniqueRoles[0]);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching roles:', error);
        setLoading(false);
      }
    }
    
    fetchRoles();
  }, []);
  
  // Fetch allocations and calculate capacities for selected role
  useEffect(() => {
    if (!selectedRole) return;
    
    async function fetchRoleData() {
      setLoadingAllocations(true);
      try {
        console.log('Fetching data for role:', selectedRole);
        
        // First get profiles with the selected role
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, role, image_url')
          .eq('role', selectedRole);
          
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          throw profilesError;
        }
        
        console.log('Profiles with role', selectedRole, ':', profilesData);
        
        if (!profilesData || profilesData.length === 0) {
          console.log('No profiles found with role:', selectedRole);
          setAllocations([]);
          setMonthlyCapacities([]);
          setLoadingAllocations(false);
          return;
        }
        
        const userIds = profilesData.map(profile => profile.id);
        
        // Then get allocations for these profiles
        const { data: allocationsData, error: allocationsError } = await supabase
          .from('allocations')
          .select(`
            days,
            week,
            user_id,
            project_id
          `)
          .in('user_id', userIds)
          .order('week');
        
        if (allocationsError) {
          console.error('Error fetching allocations:', allocationsError);
          throw allocationsError;
        }
        
        console.log('Raw allocations data:', allocationsData);
        
        // Get project data
        const projectIds = [...new Set(allocationsData?.map(alloc => alloc.project_id) || [])];
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('id, name')
          .in('id', projectIds);
          
        if (projectsError) {
          console.error('Error fetching projects:', projectsError);
          throw projectsError;
        }
        
        console.log('Projects data:', projectsData);
        
        // Create lookup maps
        const profilesMap = new Map(profilesData.map(profile => [profile.id, profile]));
        const projectsMap = new Map(projectsData?.map(project => [project.id, project]) || []);
        
        // Transform allocations data
        const transformedAllocations = allocationsData?.map(allocation => {
          const profile = profilesMap.get(allocation.user_id);
          const project = projectsMap.get(allocation.project_id);
          
          return {
            projectName: project?.name || 'Unknown Project',
            userName: profile?.name || 'Unknown User',
            userRole: profile?.role || 'Unknown Role',
            userImageUrl: profile?.image_url || null,
            userId: allocation.user_id,
            week: allocation.week,
            days: allocation.days
          };
        }).filter(item => item.projectName !== 'Unknown Project' && item.userName !== 'Unknown User') || [];
        
        console.log('Transformed allocations data:', transformedAllocations);
        setAllocations(transformedAllocations);
        
        // Calculate monthly capacities
        const capacities = calculateMonthlyCapacities(transformedAllocations, profilesData, months);
        setMonthlyCapacities(capacities);
        
      } catch (error) {
        console.error('Error fetching role data:', error);
        setAllocations([]);
        setMonthlyCapacities([]);
      } finally {
        setLoadingAllocations(false);
      }
    }
    
    fetchRoleData();
  }, [selectedRole]);
  
  // Calculate monthly capacity data
  const calculateMonthlyCapacities = (
    allocations: RoleAllocation[], 
    profiles: any[], 
    months: Date[]
  ): MonthlyCapacity[] => {
    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      // Assuming 20 working days per month per person
      const workingDaysPerMonth = 20;
      const totalCapacity = profiles.length * workingDaysPerMonth;
      
      // Calculate allocations for this month
      const monthAllocations = allocations.filter(alloc => {
        const allocDate = new Date(alloc.week);
        return allocDate >= monthStart && allocDate <= monthEnd;
      });
      
      // Group by user and sum their allocations
      const userAllocations = new Map<string, number>();
      monthAllocations.forEach(alloc => {
        const current = userAllocations.get(alloc.userId) || 0;
        userAllocations.set(alloc.userId, current + alloc.days);
      });
      
      const totalAllocated = Array.from(userAllocations.values()).reduce((sum, days) => sum + days, 0);
      const availableCapacity = totalCapacity - totalAllocated;
      const utilizationRate = totalCapacity > 0 ? (totalAllocated / totalCapacity) * 100 : 0;
      
      // Create team member details
      const teamMembers = profiles.map(profile => ({
        id: profile.id,
        name: profile.name,
        imageUrl: profile.image_url,
        allocatedDays: userAllocations.get(profile.id) || 0,
        capacity: workingDaysPerMonth
      }));
      
      return {
        month,
        totalAllocated,
        totalCapacity,
        availableCapacity,
        utilizationRate: Math.round(utilizationRate),
        teamMembers
      };
    });
  };

  const currentMonth = months[currentMonthIndex];
  const currentCapacity = monthlyCapacities[currentMonthIndex];

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const nextMonth = () => {
    if (currentMonthIndex < months.length - 1) {
      setCurrentMonthIndex(currentMonthIndex + 1);
    }
  };

  const prevMonth = () => {
    if (currentMonthIndex > 0) {
      setCurrentMonthIndex(currentMonthIndex - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-gray-500">Loading role data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Resource Allocation by Role</h1>
        <p className="text-gray-500">
          View resource allocations and capacity planning filtered by team member role
        </p>
      </div>
      
      {roles.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">
              No roles found. Please add team members to the system first.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-6 max-w-sm">
            <label className="block text-sm font-medium mb-1">Select Role</label>
            <Select
              value={selectedRole}
              onValueChange={setSelectedRole}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map(role => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {loadingAllocations ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[1, 2].map(j => (
                        <div key={j} className="flex items-center gap-2">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <Skeleton className="h-4 w-48" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Monthly Capacity Overview */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Monthly Capacity Overview</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={prevMonth}
                        disabled={currentMonthIndex === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="font-medium min-w-[120px] text-center">
                        {currentMonth ? format(currentMonth, 'MMM yyyy') : 'Loading...'}
                      </span>
                      <Button 
                        variant="outline"
                        size="sm" 
                        onClick={nextMonth}
                        disabled={currentMonthIndex === months.length - 1}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {currentCapacity ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{currentCapacity.totalCapacity}</div>
                          <div className="text-sm text-gray-500">Total Capacity (days)</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{currentCapacity.totalAllocated}</div>
                          <div className="text-sm text-gray-500">Allocated (days)</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{currentCapacity.availableCapacity}</div>
                          <div className="text-sm text-gray-500">Available (days)</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{currentCapacity.utilizationRate}%</div>
                          <div className="text-sm text-gray-500">Utilization Rate</div>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Capacity Utilization</span>
                          <span className="text-sm text-gray-500">{currentCapacity.utilizationRate}%</span>
                        </div>
                        <Progress value={currentCapacity.utilizationRate} className="h-2" />
                      </div>
                      
                      <div className="mt-6">
                        <h4 className="font-medium mb-3">Team Member Allocations</h4>
                        <div className="space-y-2">
                          {currentCapacity.teamMembers.map(member => (
                            <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  {member.imageUrl ? (
                                    <AvatarImage src={member.imageUrl} />
                                  ) : (
                                    <AvatarFallback>
                                      {getInitials(member.name)}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <span className="font-medium">{member.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">
                                  {member.allocatedDays}/{member.capacity} days
                                </span>
                                <Badge variant={member.allocatedDays > member.capacity * 0.8 ? "destructive" : "secondary"}>
                                  {Math.round((member.allocatedDays / member.capacity) * 100)}%
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500">No capacity data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
