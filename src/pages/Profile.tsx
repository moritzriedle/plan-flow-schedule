import React, { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePlanner } from '@/contexts/PlannerContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, User, Briefcase, Calendar, Plus, Edit, Trash2, Camera } from 'lucide-react';
import VacationDateRangeSelector from '@/components/VacationDateRangeSelector';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/sonner';
import { format, isAfter, isBefore, startOfDay } from 'date-fns';
import { ROLE_OPTIONS } from '@/constants/roles';

interface VacationPeriod {
  id: string;
  startDate: string;
  endDate: string;
  note?: string;
}

const Profile = () => {
  const { user, profile } = useAuth();
  const { employees, projects, allocations, sprints, updateEmployee } = usePlanner();
  
  // Get current user's employee data
  const currentEmployee = employees.find(emp => emp.id === user?.id);
  
  const [vacationDates, setVacationDates] = useState<string[]>((profile?.vacation_dates as string[]) || []);
  const [isVacationDialogOpen, setIsVacationDialogOpen] = useState(false);
  const [editingVacation, setEditingVacation] = useState<VacationPeriod | null>(null);
  const [vacationNote, setVacationNote] = useState('');
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [editRole, setEditRole] = useState(profile?.role || '');
  const [editImageUrl, setEditImageUrl] = useState(currentEmployee?.imageUrl || '');

  // Get user's allocations
  const userAllocations = allocations.filter(alloc => alloc.employeeId === user?.id);

  // Get user's projects
  const userProjects = useMemo(() => {
    const projectIds = [...new Set(userAllocations.map(alloc => alloc.projectId))];
    return projects.filter(project => projectIds.includes(project.id));
  }, [userAllocations, projects]);

  // Get upcoming and past allocations
  const { upcomingAllocations, pastAllocations, allocationsBySprint } = useMemo(() => {
    const today = startOfDay(new Date());
    const upcoming: typeof userAllocations = [];
    const past: typeof userAllocations = [];
    const bySprint: Record<string, { sprint: any; allocations: typeof userAllocations }> = {};

    userAllocations.forEach(allocation => {
      const sprint = sprints.find(s => s.id === allocation.sprintId);
      if (sprint) {
        if (isAfter(sprint.endDate, today)) {
          upcoming.push(allocation);
          
          // Group by sprint for sprint-based view
          if (!bySprint[sprint.id]) {
            bySprint[sprint.id] = { sprint, allocations: [] };
          }
          bySprint[sprint.id].allocations.push(allocation);
        } else {
          past.push(allocation);
        }
      }
    });

    return { 
      upcomingAllocations: upcoming, 
      pastAllocations: past,
      allocationsBySprint: Object.values(bySprint).sort((a, b) => 
        new Date(a.sprint.startDate).getTime() - new Date(b.sprint.startDate).getTime()
      )
    };
  }, [userAllocations, sprints]);

  // Parse vacation periods from vacation dates
  const vacationPeriods = useMemo(() => {
    const periods: VacationPeriod[] = [];
    const sortedDates = [...vacationDates].sort();
    
    let currentPeriod: { startDate: string; endDate: string; dates: string[] } | null = null;
    
    sortedDates.forEach(date => {
      if (!currentPeriod) {
        currentPeriod = { startDate: date, endDate: date, dates: [date] };
      } else {
        const lastDate = new Date(currentPeriod.endDate);
        const currentDate = new Date(date);
        const dayDiff = (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (dayDiff <= 1) {
          currentPeriod.endDate = date;
          currentPeriod.dates.push(date);
        } else {
          periods.push({
            id: `${currentPeriod.startDate}-${currentPeriod.endDate}`,
            startDate: currentPeriod.startDate,
            endDate: currentPeriod.endDate
          });
          currentPeriod = { startDate: date, endDate: date, dates: [date] };
        }
      }
    });
    
    if (currentPeriod) {
      periods.push({
        id: `${currentPeriod.startDate}-${currentPeriod.endDate}`,
        startDate: currentPeriod.startDate,
        endDate: currentPeriod.endDate
      });
    }
    
    return periods;
  }, [vacationDates]);

  const { upcomingVacations, pastVacations } = useMemo(() => {
    const today = startOfDay(new Date());
    const upcoming = vacationPeriods.filter(period => isAfter(new Date(period.endDate), today));
    const past = vacationPeriods.filter(period => isBefore(new Date(period.endDate), today));
    return { upcomingVacations: upcoming, pastVacations: past };
  }, [vacationPeriods]);

  const handleVacationSave = async () => {
    if (!currentEmployee) return;

    try {
      const updated = await updateEmployee({
        ...currentEmployee,
        vacationDates
      });

      if (updated) {
        toast.success('Vacation dates updated successfully');
        setIsVacationDialogOpen(false);
        setEditingVacation(null);
        setVacationNote('');
      }
    } catch (error) {
      console.error('Error updating vacation dates:', error);
      toast.error('Failed to update vacation dates');
    }
  };

  const handleDeleteVacation = (vacation: VacationPeriod) => {
    const startDate = new Date(vacation.startDate);
    const endDate = new Date(vacation.endDate);
    const datesToRemove: string[] = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      datesToRemove.push(format(d, 'yyyy-MM-dd'));
    }
    
    const updatedDates = vacationDates.filter(date => !datesToRemove.includes(date));
    setVacationDates(updatedDates);
  };

  const handleProfileUpdate = async () => {
    if (!currentEmployee) return;

    try {
      const updated = await updateEmployee({
        ...currentEmployee,
        imageUrl: editImageUrl
      });

      if (updated) {
        toast.success('Profile picture updated successfully');
        setIsEditProfileOpen(false);
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
      toast.error('Failed to update profile picture');
    }
  };

  const handleRoleUpdate = async () => {
    if (!currentEmployee) return;

    try {
      const updated = await updateEmployee({
        ...currentEmployee,
        role: editRole
      });

      if (updated) {
        toast.success('Role updated successfully');
        setIsEditRoleOpen(false);
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const calculateWorkload = () => {
    const today = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(today.getMonth() + 3);

    const relevantAllocations = upcomingAllocations.filter(allocation => {
      const sprint = sprints.find(s => s.id === allocation.sprintId);
      return sprint && sprint.startDate <= threeMonthsFromNow;
    });

    const totalDays = relevantAllocations.reduce((sum, alloc) => sum + alloc.days, 0);
    const workingDaysInPeriod = 65; // Approximate working days in 3 months
    return Math.round((totalDays / workingDaysInPeriod) * 100);
  };

  if (!user || !profile) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16">
                <AvatarImage src={currentEmployee?.imageUrl} />
                <AvatarFallback className="text-lg">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
              <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full p-0"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Profile Picture</DialogTitle>
                    <DialogDescription>
                      Update your profile picture URL
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="imageUrl">Profile Picture URL</Label>
                      <Input
                        id="imageUrl"
                        placeholder="https://example.com/avatar.jpg"
                        value={editImageUrl}
                        onChange={(e) => setEditImageUrl(e.target.value)}
                      />
                    </div>
                    {editImageUrl && (
                      <div className="flex justify-center">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={editImageUrl} />
                          <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditProfileOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleProfileUpdate}>
                      Save Changes
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div>
              <h1 className="text-3xl font-bold">{profile.name}</h1>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">
                  {profile.role}
                </Badge>
                <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-6 px-2">
                      <Edit className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Role</DialogTitle>
                      <DialogDescription>
                        Update your role/profession
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select value={editRole} onValueChange={setEditRole}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your role" />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTIONS.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsEditRoleOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleRoleUpdate}>
                        Save Changes
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        {/* Workload Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Workload Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{calculateWorkload()}%</div>
                <div className="text-sm text-muted-foreground">Next 3 Months</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{upcomingAllocations.length}</div>
                <div className="text-sm text-muted-foreground">Upcoming Allocations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{upcomingVacations.length}</div>
                <div className="text-sm text-muted-foreground">Upcoming Vacations</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="projects" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Projects & Allocations
            </TabsTrigger>
            <TabsTrigger value="vacations" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Vacations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-6">
            {/* Current Projects */}
            <Card>
              <CardHeader>
                <CardTitle>Current Projects</CardTitle>
                <CardDescription>Projects you're currently allocated to</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {userProjects.map(project => (
                    <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full bg-${project.color}-500`} />
                        <div>
                          <h3 className="font-medium">{project.name}</h3>
                          {project.ticketReference && (
                            <p className="text-sm text-muted-foreground">{project.ticketReference}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {userAllocations
                          .filter(alloc => alloc.projectId === project.id)
                          .reduce((sum, alloc) => sum + alloc.days, 0)} days allocated
                      </div>
                    </div>
                  ))}
                  {userProjects.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No current project allocations</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Allocations by Sprint */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Allocations by Sprint</CardTitle>
                <CardDescription>Your scheduled work periods organized by sprint</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {allocationsBySprint.map(({ sprint, allocations }) => {
                    const totalDays = allocations.reduce((sum, alloc) => sum + alloc.days, 0);
                    return (
                      <div key={sprint.id} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{sprint.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {format(sprint.startDate, 'MMM dd')} - {format(sprint.endDate, 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-sm">
                            {totalDays} days total
                          </Badge>
                        </div>
                        <div className="grid gap-2 ml-4">
                          {allocations.map(allocation => {
                            const project = projects.find(p => p.id === allocation.projectId);
                            return (
                              <div key={allocation.id} className="flex items-center justify-between p-3 border rounded bg-muted/30">
                                <div className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full bg-${project?.color || 'gray'}-500`} />
                                  <div>
                                    <div className="font-medium">{project?.name || 'Unknown Project'}</div>
                                    {project?.ticketReference && (
                                      <div className="text-xs text-muted-foreground">{project.ticketReference}</div>
                                    )}
                                  </div>
                                </div>
                                <Badge variant="outline">{allocation.days} days</Badge>
                              </div>
                            );
                          })}
                        </div>
                        <Separator />
                      </div>
                    );
                  })}
                  {allocationsBySprint.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No upcoming allocations</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vacations" className="space-y-6">
            {/* Vacation Management */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Vacation Management</CardTitle>
                  <CardDescription>Manage your vacation dates and time off</CardDescription>
                </div>
                <Dialog open={isVacationDialogOpen} onOpenChange={setIsVacationDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Vacation
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Vacation Dates</DialogTitle>
                      <DialogDescription>
                        Select the dates you'll be on vacation
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <VacationDateRangeSelector
                        selectedDates={vacationDates}
                        onDatesChange={setVacationDates}
                      />
                      <div className="space-y-2">
                        <Label htmlFor="vacation-note">Note (Optional)</Label>
                        <Textarea
                          id="vacation-note"
                          placeholder="Add a note about your vacation..."
                          value={vacationNote}
                          onChange={(e) => setVacationNote(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsVacationDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleVacationSave}>
                        Save Vacation
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="upcoming" className="w-full">
                  <TabsList>
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="past">Past</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="upcoming" className="space-y-3">
                    {upcomingVacations.map(vacation => (
                      <div key={vacation.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <div>
                            <div className="font-medium">
                              {vacation.startDate === vacation.endDate
                                ? format(new Date(vacation.startDate), 'MMM dd, yyyy')
                                : `${format(new Date(vacation.startDate), 'MMM dd')} - ${format(new Date(vacation.endDate), 'MMM dd, yyyy')}`
                              }
                            </div>
                            {vacation.note && (
                              <p className="text-sm text-muted-foreground">{vacation.note}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteVacation(vacation)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {upcomingVacations.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No upcoming vacations</p>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="past" className="space-y-3">
                    {pastVacations.map(vacation => (
                      <div key={vacation.id} className="flex items-center justify-between p-4 border rounded-lg opacity-60">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">
                              {vacation.startDate === vacation.endDate
                                ? format(new Date(vacation.startDate), 'MMM dd, yyyy')
                                : `${format(new Date(vacation.startDate), 'MMM dd')} - ${format(new Date(vacation.endDate), 'MMM dd, yyyy')}`
                              }
                            </div>
                            {vacation.note && (
                              <p className="text-sm text-muted-foreground">{vacation.note}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {pastVacations.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No past vacations</p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;