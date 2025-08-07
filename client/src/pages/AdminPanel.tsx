import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, Music, Calendar, Users, Star, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PersistentRadioPlayer from "@/components/PersistentRadioPlayer";

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
  const [activeTab, setActiveTab] = useState<'mixes' | 'schedule' | 'episodes'>('mixes');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending mix submissions
  const { data: pendingMixes = [] } = useQuery<MixSubmission[]>({
    queryKey: ["/api/mixes?status=pending"],
    refetchInterval: 5000, // Faster refresh for debugging
    staleTime: 0, // Always consider data stale
    cacheTime: 0, // Don't cache the response
  });

  // Fetch all mixes for management  
  const { data: allMixes = [] } = useQuery<MixSubmission[]>({
    queryKey: ["/api/mixes"],
  });

  // Fetch schedule items
  const { data: scheduleItems = [] } = useQuery({
    queryKey: ["/api/schedule"],
  });

  // Mix status update mutation
  const updateMixStatus = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes?: string }) => {
      const response = await fetch(`/api/mixes/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      if (!response.ok) throw new Error('Failed to update mix status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mixes"] });
      toast({
        title: "Mix status updated successfully",
        description: "The community will see the updated status immediately.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to update mix status",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (id: number) => {
    updateMixStatus.mutate({ id, status: 'approved', notes: 'Approved for community showcase' });
  };

  const handleFeature = (id: number) => {
    updateMixStatus.mutate({ id, status: 'featured', notes: 'Featured mix - exceptional quality' });
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <PersistentRadioPlayer isActive={false} onToggle={() => {}} />

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
          <div className="flex gap-4">
            <Button
              variant={activeTab === 'mixes' ? 'default' : 'outline'}
              onClick={() => setActiveTab('mixes')}
              className={activeTab === 'mixes' 
                ? "bg-red-500 hover:bg-red-600 text-white font-mono" 
                : "border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono"
              }
            >
              <Music className="w-4 h-4 mr-2" />
              Mix Submissions ({pendingMixes.length} pending)
            </Button>
            <Button
              variant={activeTab === 'schedule' ? 'default' : 'outline'}
              onClick={() => setActiveTab('schedule')}
              className={activeTab === 'schedule' 
                ? "bg-red-500 hover:bg-red-600 text-white font-mono" 
                : "border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono"
              }
            >
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Management
            </Button>
            <Button
              variant={activeTab === 'episodes' ? 'default' : 'outline'}
              onClick={() => setActiveTab('episodes')}
              className={activeTab === 'episodes' 
                ? "bg-red-500 hover:bg-red-600 text-white font-mono" 
                : "border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono"
              }
            >
              <Users className="w-4 h-4 mr-2" />
              Episodes & Content
            </Button>
          </div>
        </div>

        {/* Mix Submissions Tab */}
        {activeTab === 'mixes' && (
          <div className="space-y-6">
            {/* Pending Reviews */}
            <div>
              <h2 className="text-2xl font-bold mb-6 font-mono text-red-500">
                PENDING SUBMISSIONS ({pendingMixes.length})
              </h2>
              
              {pendingMixes.length > 0 ? (
                <div className="space-y-4">
                  {pendingMixes.map((mix: any) => (
                    <div key={mix.id} className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-xs font-mono bg-yellow-500 text-black px-2 py-1 rounded">
                              PENDING REVIEW
                            </span>
                            <span className="text-xs font-mono text-gray-500">
                              Submitted {new Date(mix.submittedAt).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <h3 className="text-xl font-bold font-mono text-gray-900 mb-2">
                            {mix.title}
                          </h3>
                          <div className="text-gray-600 font-mono text-sm mb-2">
                            by {mix.name} • {mix.genre}
                          </div>
                          <p className="text-gray-600 font-mono text-sm mb-4">
                            {mix.about}
                          </p>
                          
                          <div className="flex items-center gap-4">
                            <Button 
                              size="sm"
                              className="bg-green-500 hover:bg-green-600 text-white font-mono"
                              onClick={() => handleApprove(mix.id)}
                              disabled={updateMixStatus.isPending}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm"
                              className="bg-yellow-500 hover:bg-yellow-600 text-black font-mono"
                              onClick={() => handleFeature(mix.id)}
                              disabled={updateMixStatus.isPending}
                            >
                              <Star className="w-4 h-4 mr-1" />
                              Feature
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white font-mono"
                              onClick={() => window.open(mix.url, '_blank')}
                            >
                              Listen
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600 font-mono">
                  No pending submissions to review
                </div>
              )}
            </div>

            {/* Recent Approved */}
            <div>
              <h2 className="text-2xl font-bold mb-6 font-mono text-red-500">
                RECENT COMMUNITY MIXES ({allMixes.length})
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allMixes.slice(0, 9).map((mix: any) => (
                  <div key={mix.id} className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-mono px-2 py-1 rounded ${
                        mix.status === 'featured' 
                          ? 'bg-yellow-500 text-black' 
                          : 'bg-green-500 text-white'
                      }`}>
                        {mix.status.toUpperCase()}
                      </span>
                    </div>
                    <h4 className="font-bold font-mono text-gray-900 text-sm mb-1">
                      {mix.title}
                    </h4>
                    <div className="text-xs font-mono text-gray-600">
                      {mix.name} • {mix.genre}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div>
            <h2 className="text-2xl font-bold mb-6 font-mono text-red-500">PROGRAMMING SCHEDULE</h2>
            <div className="text-center py-16">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-600 font-mono mb-4">
                Schedule management coming soon
              </div>
              <p className="text-gray-500 font-mono text-sm">
                Advanced scheduling tools for live shows and content programming
              </p>
            </div>
          </div>
        )}

        {/* Episodes Tab */}
        {activeTab === 'episodes' && (
          <div>
            <h2 className="text-2xl font-bold mb-6 font-mono text-red-500">EPISODES & CONTENT</h2>
            <div className="text-center py-16">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-600 font-mono mb-4">
                Episode management coming soon
              </div>
              <p className="text-gray-500 font-mono text-sm">
                Tools for creating and managing radio episodes, shows, and series
              </p>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-bold mb-6 font-mono text-red-500">QUICK STATS</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold font-mono text-red-500">{pendingMixes.length}</div>
              <div className="text-sm font-mono text-gray-600">Pending Reviews</div>
            </div>
            <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold font-mono text-red-500">{allMixes.length}</div>
              <div className="text-sm font-mono text-gray-600">Approved Mixes</div>
            </div>
            <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold font-mono text-red-500">{scheduleItems.length}</div>
              <div className="text-sm font-mono text-gray-600">Scheduled Shows</div>
            </div>
            <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold font-mono text-red-500">
                {allMixes.filter((m: any) => m.status === 'featured').length}
              </div>
              <div className="text-sm font-mono text-gray-600">Featured Content</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}