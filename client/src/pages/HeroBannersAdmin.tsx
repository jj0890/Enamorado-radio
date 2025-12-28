import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Image, Upload, Trash2, CheckCircle2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import type { HeroBanner } from "@shared/schema";

export default function HeroBannersAdmin() {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [overlayText, setOverlayText] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);

  const { data: banners = [], isLoading } = useQuery<HeroBanner[]>({
    queryKey: ['/api/editor/hero-banners'],
  });

  const createMutation = useMutation({
    mutationFn: async (bannerData: {
      title: string;
      subtitle: string | null;
      imageUrl: string;
      overlayText: string | null;
      isActive: boolean;
      displayOrder: number;
    }) => {
      return apiRequest('POST', '/api/editor/hero-banners', bannerData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/editor/hero-banners'] });
      queryClient.invalidateQueries({ queryKey: ['/api/hero-banners/active'] });
      toast({ title: "Hero banner created successfully" });
      // Reset form
      setTitle("");
      setSubtitle("");
      setImageUrl("");
      setOverlayText("");
      setDisplayOrder(0);
    },
    onError: () => {
      toast({ title: "Failed to create hero banner", variant: "destructive" });
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('POST', `/api/editor/hero-banners/${id}/activate`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/editor/hero-banners'] });
      queryClient.invalidateQueries({ queryKey: ['/api/hero-banners/active'] });
      toast({ title: "Banner activated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to activate banner", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/editor/hero-banners/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/editor/hero-banners'] });
      queryClient.invalidateQueries({ queryKey: ['/api/hero-banners/active'] });
      toast({ title: "Banner deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete banner", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !imageUrl) {
      toast({ title: "Title and image URL are required", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      title,
      subtitle: subtitle || null,
      imageUrl,
      overlayText: overlayText || null,
      isActive: banners.length === 0, // First banner is auto-activated
      displayOrder,
    });
  };

  return (
    <div className="min-h-screen bg-[#FEFCF9]">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/admin/editor">
              <Button variant="ghost" size="sm" className="mr-4" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-xl font-bold font-mono text-navy" data-testid="heading-hero-banners">
              HERO BANNERS
            </h1>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Form */}
          <Card data-testid="card-upload">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-orange-500" />
                <CardTitle className="font-mono">Upload New Banner</CardTitle>
              </div>
              <CardDescription className="font-mono">
                Create a seasonal hero banner for the homepage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title" className="font-mono">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Summer Vibes 2025"
                    className="font-mono"
                    data-testid="input-title"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="subtitle" className="font-mono">Subtitle</Label>
                  <Input
                    id="subtitle"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Hot tracks for the season"
                    className="font-mono"
                    data-testid="input-subtitle"
                  />
                </div>

                <div>
                  <Label htmlFor="imageUrl" className="font-mono">Image URL *</Label>
                  <Input
                    id="imageUrl"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/banner.jpg"
                    className="font-mono"
                    data-testid="input-image-url"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1 font-mono">
                    Recommended: 1920x600px, hosted externally
                  </p>
                </div>

                <div>
                  <Label htmlFor="overlayText" className="font-mono">Live Metadata Overlay Text</Label>
                  <Textarea
                    id="overlayText"
                    value={overlayText}
                    onChange={(e) => setOverlayText(e.target.value)}
                    placeholder="NOW PLAYING: {artist} - {title}"
                    className="font-mono"
                    data-testid="input-overlay-text"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1 font-mono">
                    Use placeholders: {"{artist}"}, {"{title}"}, {"{show}"}
                  </p>
                </div>

                <div>
                  <Label htmlFor="displayOrder" className="font-mono">Display Order</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                    className="font-mono"
                    data-testid="input-display-order"
                  />
                  <p className="text-xs text-gray-500 mt-1 font-mono">
                    Higher numbers appear first
                  </p>
                </div>

                {imageUrl && (
                  <div className="rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "https://placehold.co/1920x600/003F87/FEFCF9?text=Image+Not+Found";
                      }}
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full font-mono"
                  disabled={createMutation.isPending}
                  data-testid="button-create-banner"
                >
                  {createMutation.isPending ? "Creating..." : "Create Banner"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Banner List */}
          <Card data-testid="card-banner-list">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Image className="h-5 w-5 text-orange-500" />
                <CardTitle className="font-mono">Existing Banners</CardTitle>
              </div>
              <CardDescription className="font-mono">
                {banners.length} banner{banners.length !== 1 ? 's' : ''} total
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <p className="text-gray-500 font-mono text-center py-8">Loading banners...</p>
              )}
              
              {!isLoading && banners.length === 0 && (
                <p className="text-gray-500 font-mono text-center py-8">
                  No banners yet. Create your first one!
                </p>
              )}

              <div className="space-y-4">
                {banners.map((banner) => (
                  <div
                    key={banner.id}
                    className="border border-gray-200 rounded-lg p-4 space-y-3"
                    data-testid={`banner-item-${banner.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-mono font-semibold">{banner.title}</h3>
                          {banner.isActive && (
                            <Badge variant="default" className="font-mono" data-testid={`badge-active-${banner.id}`}>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </div>
                        {banner.subtitle && (
                          <p className="text-sm text-gray-600 font-mono">{banner.subtitle}</p>
                        )}
                        <p className="text-xs text-gray-400 font-mono mt-1">
                          Order: {banner.displayOrder}
                        </p>
                      </div>
                    </div>

                    <div className="rounded overflow-hidden">
                      <img
                        src={banner.imageUrl}
                        alt={banner.title}
                        className="w-full h-24 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "https://placehold.co/1920x600/003F87/FEFCF9?text=Image+Error";
                        }}
                      />
                    </div>

                    <div className="flex gap-2">
                      {!banner.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => activateMutation.mutate(banner.id)}
                          disabled={activateMutation.isPending}
                          className="font-mono flex-1"
                          data-testid={`button-activate-${banner.id}`}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Activate
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Delete "${banner.title}"?`)) {
                            deleteMutation.mutate(banner.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="font-mono"
                        data-testid={`button-delete-${banner.id}`}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
