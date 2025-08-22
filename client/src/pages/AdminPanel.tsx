import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, Music, Calendar, Users, Star, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MixCard from "@/components/MixCard";

interface MixSubmission {
  id: number;
  name: string;
  title: string;
  genre: string;
  about: string;
  url: string;
  metadata?: any;
  status: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'featured' | 'schedule'>('pending');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending mix submissions
  const { data: pendingMixes = [], error: pendingError, isLoading: pendingLoading } = useQuery<MixSubmission[]>({
    queryKey: ["/api/submissions?status=pending"],
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    cacheTime: 0,
  });

  // Fetch approved mixes
  const { data: approvedMixes = [] } = useQuery<MixSubmission[]>({
    queryKey: ["/api/submissions?status=approved"],
  });

  // Fetch featured mixes
  const { data: featuredMixes = [] } = useQuery<MixSubmission[]>({
    queryKey: ["/api/submissions?featured=true"],
  });

  // Fetch schedule items
  const { data: scheduleItems = [] } = useQuery({
    queryKey: ["/api/schedule"],
  });

  // Approve mix mutation
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/submissions/${id}/approve`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to approve mix');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      toast({
        title: "Mix approved successfully",
        description: "Mix has been uploaded to AzuraCast and approved for community showcase.",
      });
    },
  });

  // Feature mix mutation
  const featureMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/submissions/${id}/feature`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to feature mix');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      toast({
        title: "Mix featured status updated",
        description: "Featured status has been toggled.",
      });
    },
  });

  // Delete mix mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/submissions/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete mix');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      toast({
        title: "Mix deleted successfully",
        description: "Mix has been removed from the system.",
      });
    },
  });

  const handleApprove = (id: number) => {
    approveMutation.mutate(id);
  };

  const handleFeature = (id: number) => {
    featureMutation.mutate(id);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this mix?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header */}
      <header className="border-b border-black bg-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-bold tracking-tight font-mono text-red-500">
                ENAMORADO ADMIN
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Navigation */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-red-500 transition-colors font-mono"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4 font-mono text-red-500 flex items-center">
            <Settings className="w-10 h-10 mr-4" />
            ADMIN PANEL
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl font-mono">
            Manage community submissions, content, and radio programming
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-md transition-colors font-mono text-sm ${
                activeTab === 'pending'
                  ? 'bg-red-500 text-white'
                  : 'text-gray-600 hover:text-red-500'
              }`}
            >
              <Music className="w-4 h-4 mr-2 inline" />
              Pending ({pendingMixes.length})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-4 py-2 rounded-md transition-colors font-mono text-sm ${
                activeTab === 'approved'
                  ? 'bg-red-500 text-white'
                  : 'text-gray-600 hover:text-red-500'
              }`}
            >
              <Check className="w-4 h-4 mr-2 inline" />
              Approved ({approvedMixes.length})
            </button>
            <button
              onClick={() => setActiveTab('featured')}
              className={`px-4 py-2 rounded-md transition-colors font-mono text-sm ${
                activeTab === 'featured'
                  ? 'bg-red-500 text-white'
                  : 'text-gray-600 hover:text-red-500'
              }`}
            >
              <Star className="w-4 h-4 mr-2 inline" />
              Featured ({featuredMixes.length})
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-4 py-2 rounded-md transition-colors font-mono text-sm ${
                activeTab === 'schedule'
                  ? 'bg-red-500 text-white'
                  : 'text-gray-600 hover:text-red-500'
              }`}
            >
              <Calendar className="w-4 h-4 mr-2 inline" />
              Schedule
            </button>
          </div>
        </div>

        {/* Content Sections */}
        
        {/* Pending Mixes */}
        {activeTab === 'pending' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-red-500 font-mono flex items-center">
              <Music className="w-6 h-6 mr-3" />
              PENDING REVIEW ({pendingMixes.length})
            </h2>
            
            {pendingLoading && (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600 font-mono">Loading submissions...</p>
              </div>
            )}
            
            {pendingError && (
              <div className="text-center py-8 text-red-600 font-mono">
                <p>Error loading submissions. Please refresh the page.</p>
              </div>
            )}
            
            {!pendingLoading && !pendingError && pendingMixes.length === 0 && (
              <div className="text-center py-16">
                <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-600 font-mono mb-2">No pending submissions</p>
                <p className="text-gray-500 font-mono">All caught up! Check back later for new submissions.</p>
              </div>
            )}
            
            {!pendingLoading && !pendingError && pendingMixes.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingMixes.map((mix) => (
                  <MixCard 
                    key={mix.id}
                    mix={mix}
                    showAdminActions={true}
                    onApprove={handleApprove}
                    onFeature={handleFeature}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Approved Mixes */}
        {activeTab === 'approved' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-green-600 font-mono flex items-center">
              <Check className="w-6 h-6 mr-3" />
              APPROVED MIXES ({approvedMixes.length})
            </h2>
            
            {approvedMixes.length === 0 ? (
              <div className="text-center py-16">
                <Check className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-600 font-mono mb-2">No approved mixes yet</p>
                <p className="text-gray-500 font-mono">Approved mixes will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {approvedMixes.map((mix) => (
                  <MixCard 
                    key={mix.id}
                    mix={mix}
                    showAdminActions={true}
                    onFeature={handleFeature}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Featured Mixes */}
        {activeTab === 'featured' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-yellow-600 font-mono flex items-center">
              <Star className="w-6 h-6 mr-3" />
              FEATURED MIXES ({featuredMixes.length})
            </h2>
            
            {featuredMixes.length === 0 ? (
              <div className="text-center py-16">
                <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-600 font-mono mb-2">No featured mixes yet</p>
                <p className="text-gray-500 font-mono">Featured mixes will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredMixes.map((mix) => (
                  <MixCard 
                    key={mix.id}
                    mix={mix}
                    showAdminActions={true}
                    onFeature={handleFeature}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-blue-500 font-mono flex items-center">
              <Calendar className="w-6 h-6 mr-3" />
              SCHEDULE MANAGEMENT
            </h2>
            
            {scheduleItems.length === 0 ? (
              <div className="text-center py-16">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-600 font-mono mb-2">No scheduled items</p>
                <p className="text-gray-500 font-mono">Schedule will appear here once items are added.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {scheduleItems.map((item: any) => (
                  <div key={item.id} className="bg-white rounded-lg border p-4">
                    <h3 className="font-bold text-blue-500 font-mono">{item.title}</h3>
                    <p className="text-gray-700">{item.description}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {new Date(item.startTime).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}