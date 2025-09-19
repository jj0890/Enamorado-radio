import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Music, 
  Clock, 
  Star, 
  ExternalLink, 
  User, 
  Calendar, 
  Hash,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Link } from "wouter";
import AdminMixCard from "@/components/AdminMixCard";

interface MixSubmission {
  id: number;
  name: string;
  title: string;
  genre: string;
  about: string;
  url: string;
  artUrl?: string;
  featureOnSite?: boolean;
  pushToAzura?: boolean;
  filePath?: string;
  fileName?: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'featured';
  approvedAt?: string;
  approvedBy?: string;
}

export default function AdminMixSubmissions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("pending");

  // Get mix submissions
  const { data: allSubmissions = [], isLoading } = useQuery<MixSubmission[]>({
    queryKey: ['/api/mixes'],
  });

  // Filter submissions by status
  const pendingSubmissions = allSubmissions.filter(sub => sub.status === 'pending');
  const approvedSubmissions = allSubmissions.filter(sub => sub.status === 'approved');
  const featuredSubmissions = allSubmissions.filter(sub => sub.status === 'featured');

  // Approve mix mutation
  const approveMutation = useMutation({
    mutationFn: async (mixId: number) => {
      return apiRequest('POST', `/api/mixes/${mixId}/approve`, {});
    },
    onSuccess: () => {
      toast({
        title: "Mix Approved",
        description: "Mix has been approved successfully.",
      });
      // Invalidate admin cache AND public caches for immediate display update
      queryClient.invalidateQueries({ queryKey: ['/api/mixes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/public/mixes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/public/mixes/featured'] });
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve mix.",
        variant: "destructive",
      });
    },
  });

  // Feature mix mutation  
  const featureMutation = useMutation({
    mutationFn: async (mixId: number) => {
      return apiRequest('POST', `/api/mixes/${mixId}/feature`, {});
    },
    onSuccess: () => {
      toast({
        title: "Mix Featured",
        description: "Mix has been featured successfully.",
      });
      // Invalidate admin cache AND public caches for immediate display update
      queryClient.invalidateQueries({ queryKey: ['/api/mixes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/public/mixes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/public/mixes/featured'] });
    },
    onError: (error: any) => {
      toast({
        title: "Feature Failed",
        description: error.message || "Failed to feature mix.",
        variant: "destructive",
      });
    },
  });

  // Delete mix mutation
  const deleteMutation = useMutation({
    mutationFn: async (mixId: number) => {
      return apiRequest('DELETE', `/api/mixes/${mixId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Mix Deleted",
        description: "Mix has been deleted successfully.",
      });
      // Invalidate admin cache AND public caches for immediate display update
      queryClient.invalidateQueries({ queryKey: ['/api/mixes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/public/mixes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/public/mixes/featured'] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete mix.",
        variant: "destructive",
      });
    },
  });

  // Bulk clear all mixes mutation
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/admin/danger/clear-all-mixes', {});
    },
    onSuccess: (data: any) => {
      toast({
        title: "All Mixes Cleared",
        description: data.message || "All mix submissions have been permanently deleted.",
      });
      // Invalidate all caches for immediate display update
      queryClient.invalidateQueries({ queryKey: ['/api/mixes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/public/mixes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/public/mixes/featured'] });
    },
    onError: (error: any) => {
      toast({
        title: "Clear All Failed",
        description: error.message || "Failed to clear all mixes.",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (mixId: number) => {
    approveMutation.mutate(mixId);
  };

  const handleFeature = (mixId: number) => {
    featureMutation.mutate(mixId);
  };

  const handleDelete = (mixId: number) => {
    if (confirm("Are you sure you want to delete this mix? This action cannot be undone.")) {
      deleteMutation.mutate(mixId);
    }
  };

  const handleClearAll = () => {
    const confirmMessage = `⚠️ DANGER: This will PERMANENTLY DELETE ALL ${allSubmissions.length} mix submissions!\n\nThis includes:\n• ${pendingSubmissions.length} pending submissions\n• ${approvedSubmissions.length} approved submissions\n• ${featuredSubmissions.length} featured submissions\n\nA backup will be created before deletion.\n\nAre you absolutely sure you want to continue?`;
    
    if (confirm(confirmMessage)) {
      clearAllMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen bg-[#FEFCF9]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold font-mono text-red-500">MIX SUBMISSIONS</h1>
                <p className="text-gray-600 font-mono">Review and manage community mix submissions</p>
              </div>
            </div>
            
            {/* Bulk Actions */}
            <div className="flex items-center space-x-2">
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleClearAll}
                disabled={clearAllMutation.isPending || allSubmissions.length === 0}
                data-testid="button-clear-all-mixes"
              >
                {clearAllMutation.isPending ? "Clearing..." : `Clear All (${allSubmissions.length})`}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono text-gray-600">Pending Review</p>
                  <p className="text-3xl font-bold font-mono text-orange-600">{pendingSubmissions.length}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono text-gray-600">Approved</p>
                  <p className="text-3xl font-bold font-mono text-green-600">{approvedSubmissions.length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono text-gray-600">Featured</p>
                  <p className="text-3xl font-bold font-mono text-purple-600">{featuredSubmissions.length}</p>
                </div>
                <Star className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submissions Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="pending" className="font-mono" data-testid="tab-pending">
              Pending ({pendingSubmissions.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="font-mono" data-testid="tab-approved">
              Approved ({approvedSubmissions.length})
            </TabsTrigger>
            <TabsTrigger value="featured" className="font-mono" data-testid="tab-featured">
              Featured ({featuredSubmissions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>
                ))}
              </div>
            ) : pendingSubmissions.length === 0 ? (
              <div className="text-center py-12">
                <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 font-mono">No pending submissions</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingSubmissions.map((mix) => (
                  <AdminMixCard
                    key={mix.id}
                    mix={mix}
                    onApprove={handleApprove}
                    onFeature={handleFeature}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved">
            {approvedSubmissions.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 font-mono">No approved submissions</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {approvedSubmissions.map((mix) => (
                  <AdminMixCard
                    key={mix.id}
                    mix={mix}
                    onApprove={handleApprove}
                    onFeature={handleFeature}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="featured">
            {featuredSubmissions.length === 0 ? (
              <div className="text-center py-12">
                <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 font-mono">No featured submissions</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredSubmissions.map((mix) => (
                  <AdminMixCard
                    key={mix.id}
                    mix={mix}
                    onApprove={handleApprove}
                    onFeature={handleFeature}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}