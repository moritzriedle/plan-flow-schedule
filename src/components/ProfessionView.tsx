
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

  // Load unique roles from users
  useEffect(() => {
    async function fetchRoles() {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .order('role');
          
        if (error) throw error;
        
        // Get unique roles
        const uniqueRoles = [...new Set(data?.map(user => user.role) || [])];
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
        const { data, error } = await supabase
          .from('allocations')
          .select(`
            days,
            week,
            users!inner(id, name, role, image_url),
            projects!inner(id, name)
          `)
          .eq('users.role', selectedRole)
          .order('week');
        
        if (error) {
          console.error('Query error:', error);
          throw error;
        }
        
        // Transform the data to expected format
        const transformedData = data?.map(item => ({
          projectName: (item.projects as any).name,
          userName: (item.users as any).name,
          userRole: (item.users as any).role,
          userImageUrl: (item.users as any).image_url,
          week: item.week,
          days: item.days
        })) || [];
        
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
