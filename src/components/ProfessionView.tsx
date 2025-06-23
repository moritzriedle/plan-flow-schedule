
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
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface RoleAllocation {
  projectName: string;
  userName: string;
  userRole: string;
  userImageUrl: string | null;
  week: string;
  days: number;
}

export default function ProfessionView() {
  const [roles, setRoles] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [allocations, setAllocations] = useState<RoleAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAllocations, setLoadingAllocations] = useState(false);

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
  
  // Fetch allocations for selected role
  useEffect(() => {
    if (!selectedRole) return;
    
    async function fetchRoleAllocations() {
      setLoadingAllocations(true);
      try {
        console.log('Fetching allocations for role:', selectedRole);
        
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
        
        if (!allocationsData || allocationsData.length === 0) {
          console.log('No allocations found for profiles with role:', selectedRole);
          setAllocations([]);
          setLoadingAllocations(false);
          return;
        }
        
        // Get project data
        const projectIds = [...new Set(allocationsData.map(alloc => alloc.project_id))];
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
        
        // Transform the data
        const transformedData = allocationsData.map(allocation => {
          const profile = profilesMap.get(allocation.user_id);
          const project = projectsMap.get(allocation.project_id);
          
          return {
            projectName: project?.name || 'Unknown Project',
            userName: profile?.name || 'Unknown User',
            userRole: profile?.role || 'Unknown Role',
            userImageUrl: profile?.image_url || null,
            week: allocation.week,
            days: allocation.days
          };
        }).filter(item => item.projectName !== 'Unknown Project' && item.userName !== 'Unknown User');
        
        console.log('Transformed allocations data:', transformedData);
        setAllocations(transformedData);
      } catch (error) {
        console.error('Error fetching allocations by role:', error);
        setAllocations([]);
      } finally {
        setLoadingAllocations(false);
      }
    }
    
    fetchRoleAllocations();
  }, [selectedRole]);
  
  // Group allocations by week
  const allocationsByWeek = React.useMemo(() => {
    return allocations.reduce((acc, allocation) => {
      const weekKey = allocation.week;
      if (!acc[weekKey]) {
        acc[weekKey] = [];
      }
      acc[weekKey].push(allocation);
      return acc;
    }, {} as Record<string, RoleAllocation[]>);
  }, [allocations]);
  
  // Sort weeks for display
  const sortedWeeks = React.useMemo(() => {
    return Object.keys(allocationsByWeek).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });
  }, [allocationsByWeek]);

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

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Resource Allocation by Role</h1>
        <p className="text-gray-500">
          View resource allocations filtered by team member role
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
          ) : sortedWeeks.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-gray-500">
                  No allocations found for this role.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {sortedWeeks.map(week => (
                <Card key={week}>
                  <CardHeader>
                    <CardTitle>
                      Week of {format(new Date(week), 'MMM d, yyyy')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Team Member</TableHead>
                          <TableHead>Project</TableHead>
                          <TableHead className="text-right">Days</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allocationsByWeek[week].map((allocation, index) => (
                          <TableRow key={`${week}-${allocation.userName}-${index}`}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  {allocation.userImageUrl ? (
                                    <AvatarImage src={allocation.userImageUrl} />
                                  ) : (
                                    <AvatarFallback>
                                      {getInitials(allocation.userName)}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <div>
                                  <p className="font-medium">{allocation.userName}</p>
                                  <p className="text-xs text-gray-500">{allocation.userRole}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{allocation.projectName}</TableCell>
                            <TableCell className="text-right">
                              {allocation.days}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
