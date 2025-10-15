import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, User, Key, Radio, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import type { Resident } from '@shared/schema';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ResidentFormData {
  username: string;
  password: string;
  displayName: string;
  email?: string;
  bio?: string;
  showTitle?: string;
  showDescription?: string;
  azuracastUsername?: string;
  azuracastPassword?: string;
  mountPoint?: string;
  isActive: boolean;
  canGoLive: boolean;
}

export default function AdminResidents() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);

  const { data: residents = [], isLoading } = useQuery<Resident[]>({
    queryKey: ['/api/admin/residents'],
  });

  const form = useForm<ResidentFormData>({
    defaultValues: {
      username: '',
      password: '',
      displayName: '',
      email: '',
      bio: '',
      showTitle: '',
      showDescription: '',
      azuracastUsername: '',
      azuracastPassword: '',
      mountPoint: '',
      isActive: true,
      canGoLive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ResidentFormData) => {
      return await apiRequest('POST', '/api/admin/residents', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/residents'] });
      toast({
        title: "Resident Created",
        description: "New resident has been added successfully.",
      });
      setIsCreateOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create resident.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ResidentFormData> }) => {
      return await apiRequest('PATCH', `/api/admin/residents/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/residents'] });
      toast({
        title: "Resident Updated",
        description: "Resident details have been updated successfully.",
      });
      setEditingResident(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update resident.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/admin/residents/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/residents'] });
      toast({
        title: "Resident Deleted",
        description: "Resident has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete resident.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (resident: Resident) => {
    setEditingResident(resident);
    form.reset({
      username: resident.username,
      password: '', // Don't pre-fill password
      displayName: resident.displayName,
      email: resident.email || '',
      bio: resident.bio || '',
      showTitle: resident.showTitle || '',
      showDescription: resident.showDescription || '',
      azuracastUsername: resident.azuracastUsername || '',
      azuracastPassword: resident.azuracastPassword || '',
      mountPoint: resident.mountPoint || '',
      isActive: resident.isActive ?? true,
      canGoLive: resident.canGoLive ?? true,
    });
  };

  const onSubmit = (data: ResidentFormData) => {
    if (editingResident) {
      // Don't send password if it's empty (no change)
      const updateData = { ...data };
      if (!updateData.password) {
        delete (updateData as any).password;
      }
      updateMutation.mutate({ id: editingResident.id, data: updateData });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="min-h-screen bg-[#FEFCF9] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-mono text-red-500">RESIDENTS MANAGEMENT</h1>
            <p className="text-gray-600 mt-2">Manage resident DJs and their streaming credentials</p>
          </div>
          <Dialog open={isCreateOpen || !!editingResident} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) {
              setEditingResident(null);
              form.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-resident">
                <Plus className="w-4 h-4 mr-2" />
                Add Resident
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingResident ? 'Edit Resident' : 'Create New Resident'}</DialogTitle>
                <DialogDescription>
                  {editingResident ? 'Update resident details and streaming credentials.' : 'Add a new resident DJ to the platform.'}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="username"
                      rules={{ required: 'Username is required' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username*</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="resident_username" data-testid="input-username" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      rules={editingResident ? {} : { required: 'Password is required' }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password{editingResident ? '' : '*'}</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" placeholder={editingResident ? 'Leave blank to keep current' : 'Enter password'} data-testid="input-password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="displayName"
                    rules={{ required: 'Display name is required' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name*</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="DJ Name" data-testid="input-displayname" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="dj@example.com" data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="showTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Show Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="The Radio Show" data-testid="input-show-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="showDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Show Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Description of the show..." rows={3} data-testid="textarea-show-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      AzuraCast Streaming Credentials
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name="azuracastUsername"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>AzuraCast Username</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="streamer_username" data-testid="input-azuracast-username" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="azuracastPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>AzuraCast Password</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" placeholder="streaming_password" data-testid="input-azuracast-password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="mountPoint"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mount Point</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="/live" data-testid="input-mount-point" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Alert className="bg-yellow-50 border-yellow-200">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertTitle className="text-yellow-800">Important: Playlist Interruption</AlertTitle>
                    <AlertDescription className="text-yellow-700 text-sm">
                      When residents connect to AzuraCast via BUTT/Mixxx, the scheduled playlist will automatically stop and their live stream will take over. 
                      The playlist resumes when they disconnect. The "Go Live" button only updates internal status - actual broadcasting happens when they connect via streaming software.
                    </AlertDescription>
                  </Alert>

                  <Alert className="bg-blue-50 border-blue-200">
                    <Radio className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">AzuraCast Account Auto-Creation</AlertTitle>
                    <AlertDescription className="text-blue-700 text-sm">
                      When you create a resident, the system automatically attempts to create an AzuraCast streamer account using their username and password. 
                      If this fails, you'll need to manually create the account in AzuraCast under Streamers/DJs section.
                    </AlertDescription>
                  </Alert>

                  <div className="border-t pt-4 mt-4 space-y-3">
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel>Active Account</FormLabel>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-is-active" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="canGoLive"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <FormLabel>Can Go Live</FormLabel>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-can-go-live" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreateOpen(false);
                        setEditingResident(null);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending || updateMutation.isPending}
                      data-testid="button-submit-resident"
                    >
                      {editingResident ? 'Update' : 'Create'} Resident
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Residents List */}
        <Card>
          <CardHeader>
            <CardTitle>All Residents ({residents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : residents.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No residents yet. Click "Add Resident" to create one.</p>
            ) : (
              <div className="space-y-3">
                {residents.map((resident) => (
                  <div
                    key={resident.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    data-testid={`resident-item-${resident.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{resident.displayName}</h3>
                          <Badge variant={resident.isActive ? 'default' : 'secondary'}>
                            {resident.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {resident.canGoLive && (
                            <Badge variant="outline">
                              <Radio className="w-3 h-3 mr-1" />
                              Can Stream
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">@{resident.username}</p>
                        {resident.showTitle && (
                          <p className="text-sm text-gray-500 mt-1">Show: {resident.showTitle}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(resident)}
                        data-testid={`button-edit-${resident.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete ${resident.displayName}?`)) {
                            deleteMutation.mutate(resident.id);
                          }
                        }}
                        data-testid={`button-delete-${resident.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
