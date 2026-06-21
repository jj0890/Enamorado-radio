import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, User, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import type { Contributor } from '@shared/schema';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminShell from '@/components/admin/AdminShell';

const CONTRIBUTOR_ROLES = ['dj', 'writer', 'photographer', 'curator', 'artist', 'producer', 'other'] as const;

interface ContributorFormData {
  handle: string;
  displayName: string;
  email?: string;
  bio?: string;
  tagline?: string;
  location?: string;
  role?: string;
  avatarUrl?: string;
  websiteUrl?: string;
  isPublic: boolean;
  isFeatured: boolean;
}

interface AdminContributorsProps {
  onLogout?: () => void;
  currentUser?: string;
}

export default function AdminContributors({ onLogout, currentUser = 'admin' }: AdminContributorsProps) {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingContributor, setEditingContributor] = useState<Contributor | null>(null);

  const { data: contributors = [], isLoading } = useQuery<Contributor[]>({
    queryKey: ['/api/contributors'],
  });

  const form = useForm<ContributorFormData>({
    defaultValues: {
      handle: '',
      displayName: '',
      email: '',
      bio: '',
      tagline: '',
      location: '',
      role: '',
      avatarUrl: '',
      websiteUrl: '',
      isPublic: true,
      isFeatured: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ContributorFormData) => {
      return await apiRequest('POST', '/api/admin/contributors', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contributors'] });
      toast({ title: 'Contributor Created', description: 'New contributor profile has been added.' });
      setIsCreateOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create contributor.',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ContributorFormData> }) => {
      return await apiRequest('PATCH', `/api/admin/contributors/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contributors'] });
      toast({ title: 'Contributor Updated', description: 'Contributor profile has been updated.' });
      setEditingContributor(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update contributor.',
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (contributor: Contributor) => {
    setEditingContributor(contributor);
    form.reset({
      handle: contributor.handle,
      displayName: contributor.displayName,
      email: contributor.email || '',
      bio: contributor.bio || '',
      tagline: contributor.tagline || '',
      location: contributor.location || '',
      role: contributor.role || '',
      avatarUrl: contributor.avatarUrl || '',
      websiteUrl: contributor.websiteUrl || '',
      isPublic: contributor.isPublic ?? true,
      isFeatured: contributor.isFeatured ?? false,
    });
  };

  const onSubmit = (data: ContributorFormData) => {
    // Strip handle prefix if user typed it
    const normalized = { ...data, handle: data.handle.replace(/^@/, '') };
    if (editingContributor) {
      updateMutation.mutate({ id: editingContributor.id, data: normalized });
    } else {
      createMutation.mutate(normalized);
    }
  };

  const residents = contributors.filter((c) => c.isResident);
  const nonResidents = contributors.filter((c) => !c.isResident);

  return (
    <AdminShell
      title="Contributors"
      subtitle="Manage contributor profiles"
      breadcrumbs={[{ label: 'Contributors' }]}
      currentUser={currentUser}
      userRole="admin"
      onLogout={onLogout}
      actions={
        <Button onClick={() => { setIsCreateOpen(true); form.reset(); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Contributor
        </Button>
      }
    >
      <Dialog
        open={isCreateOpen || !!editingContributor}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingContributor(null);
            form.reset();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingContributor ? 'Edit Contributor' : 'Create Contributor'}</DialogTitle>
            <DialogDescription>
              {editingContributor
                ? 'Update this contributor\'s public profile.'
                : 'Add a new non-resident contributor to the platform.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="handle"
                  rules={{ required: 'Handle is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Handle*</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="dj-handle" disabled={!!editingContributor} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="displayName"
                  rules={{ required: 'Display name is required' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name*</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="DJ Name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="contributor@example.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CONTRIBUTOR_ROLES.map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="tagline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tagline</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Short 1-liner for cards (150 chars)" maxLength={150} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Full bio (up to 500 chars)" rows={3} maxLength={500} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Brooklyn, NY" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="websiteUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL</FormLabel>
                      <FormControl>
                        <Input {...field} type="url" placeholder="https://..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar URL</FormLabel>
                    <FormControl>
                      <Input {...field} type="url" placeholder="https://..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="border-t pt-4 mt-4 space-y-3">
                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Public Profile</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Featured</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
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
                    setEditingContributor(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingContributor ? 'Update' : 'Create'} Contributor
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        <ContributorList
          title={`Non-Resident Contributors (${nonResidents.length})`}
          items={nonResidents}
          isLoading={isLoading}
          emptyMessage='No non-resident contributors yet. Click "Add Contributor" to create one.'
          onEdit={handleEdit}
        />
        <ContributorList
          title={`Resident Contributors (${residents.length})`}
          items={residents}
          isLoading={false}
          emptyMessage="No resident contributors found."
          onEdit={handleEdit}
        />
      </div>
    </AdminShell>
  );
}

function ContributorList({
  title,
  items,
  isLoading,
  emptyMessage,
  onEdit,
}: {
  title: string;
  items: Contributor[];
  isLoading: boolean;
  emptyMessage: string;
  onEdit: (c: Contributor) => void;
}) {
  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-gray-500 py-8">{emptyMessage}</p>
        ) : (
          <div className="space-y-3">
            {items.map((contributor) => (
              <div
                key={contributor.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center overflow-hidden">
                    {contributor.avatarUrl ? (
                      <img src={contributor.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-navy" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{contributor.displayName}</h3>
                      {!contributor.isPublic && <Badge variant="secondary">Hidden</Badge>}
                      {contributor.isFeatured && <Badge variant="default">Featured</Badge>}
                      {contributor.role && <Badge variant="outline">{contributor.role}</Badge>}
                    </div>
                    <p className="text-sm text-gray-600">@{contributor.handle}</p>
                    {contributor.tagline && (
                      <p className="text-sm text-gray-500 mt-0.5 truncate max-w-xs">{contributor.tagline}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/contributors/${contributor.handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <Button variant="outline" size="sm" onClick={() => onEdit(contributor)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
