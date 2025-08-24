import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Star, Check, X, ExternalLink } from 'lucide-react';

interface MixCardProps {
  mix: {
    id: number;
    name: string;
    title: string;
    genre: string;
    about: string;
    url: string;
    status: string;
    submittedAt: string;
    metadata?: any;
    notes?: string;
    // New admin fields
    featured?: boolean;
    approved?: boolean;
    coverUrl?: string;
    filePath?: string;
    fileName?: string;
  };
  showAdminBadges?: boolean; // Show admin status badges
  showAdminActions?: boolean; // Show admin action buttons
  onApprove?: (id: number) => void;
  onFeature?: (id: number) => void;
  onDelete?: (id: number) => void;
  onAttachFile?: (id: number, file: File) => void;
  onPushToAzura?: (id: number) => void;
}

export default function MixCard({ 
  mix, 
  showAdminBadges = false, 
  showAdminActions = false, 
  onApprove, 
  onFeature, 
  onDelete, 
  onAttachFile, 
  onPushToAzura 
}: MixCardProps) {
  const [location] = useLocation();
  const isAdmin = location.startsWith('/admin');
  const [, forceRender] = useState(0);
  const rerender = () => forceRender(v => v + 1);
  
  // SoundCloud artwork via CORS-safe proxy
  const [artwork, setArtwork] = useState<string | null>(
    (mix as any).artUrl || mix.coverUrl || mix.metadata?.thumbnail_url || mix.metadata?.imageUrl || mix.metadata?.artwork_url || null
  );
  
  useEffect(() => {
    let ignore = false;
    async function fetchSoundCloudArtwork() {
      if (artwork || !mix.url?.includes('soundcloud.com')) return;
      
      try {
        const response = await fetch(`/api/oembed?url=${encodeURIComponent(mix.url)}`);
        if (!response.ok) return;
        const data = await response.json();
        if (!ignore && (data?.thumbnail_url || data?.artUrl)) {
          setArtwork(data.thumbnail_url || data.artUrl);
        }
      } catch (error) {
        console.warn('Failed to fetch SoundCloud artwork:', error);
      }
    }
    
    fetchSoundCloudArtwork();
    return () => { ignore = true; };
  }, [mix.url, artwork]);
  
  // Use new boolean structure from migrated data
  const isFeatured = (mix as any).featureOnSite || false;
  const isApproved = (mix as any).pushToAzura || false;
  
  // Admin toggle functions
  async function toggleApprove() {
    if (onApprove) {
      console.log('Using AdminPanel approve handler for mix:', mix.id);
      onApprove(mix.id);
    } else {
      console.log('Calling approve API directly for mix:', mix.id);
      try {
        const response = await fetch(`/api/admin/mixes/${mix.id}/approve`, { method: 'POST' });
        const result = await response.json();
        console.log('Approve response:', response.status, result);
        if (response.ok) {
          (mix as any).approved = result.approved;
          mix.status = result.approved ? 'approved' : 'pending';
          rerender();
        } else {
          alert(result.error || 'Approve failed');
        }
      } catch (error) {
        console.error('Approve error:', error);
        alert('Network error');
      }
    }
  }
  
  async function toggleFeature() {
    if (!isApproved) {
      alert('Mix must be approved first before featuring');
      return;
    }
    
    if (onFeature) {
      console.log('Using AdminPanel feature handler for mix:', mix.id);
      onFeature(mix.id);
    } else {
      console.log('Calling feature API directly for mix:', mix.id);
      try {
        const response = await fetch(`/api/admin/mixes/${mix.id}/feature`, { method: 'POST' });
        const result = await response.json();
        console.log('Feature response:', response.status, result);
        if (response.ok) {
          (mix as any).featured = result.featured;
          rerender();
        } else {
          if (result.error === 'approve-first') {
            alert('Mix must be approved first before featuring');
          } else {
            alert(result.error || 'Feature failed');
          }
        }
      } catch (error) {
        console.error('Feature error:', error);
        alert('Network error');
      }
    }
  }
  
  // Format date
  const submittedDate = new Date(mix.submittedAt).toLocaleDateString();
  
  return (
    <div className="rounded-xl border border-neutral-200 overflow-hidden bg-white hover:shadow-lg transition-shadow">
      {/* Artwork */}
      <div className="relative">
        {artwork ? (
          <img 
            src={artwork}
            alt={`${mix.title} cover`}
            className="w-full h-48 object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling!.style.display = 'flex';
            }}
          />
        ) : null}
        {/* Fallback artwork */}
        <div 
          className={`w-full h-48 bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center ${artwork ? 'hidden' : 'flex'}`}
          style={{ display: artwork ? 'none' : 'flex' }}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-neutral-300 rounded-full mx-auto mb-3 flex items-center justify-center">
              <div className="text-2xl font-bold text-neutral-600">♪</div>
            </div>
            <div className="text-sm text-neutral-500 font-mono">MIX</div>
          </div>
        </div>
        
        {/* Admin Badges (only show on admin pages) */}
        {isAdmin && (
          <div className="absolute top-3 left-3 space-y-1">
            {isApproved ? (
              <Badge variant="default" className="text-xs font-mono bg-green-600">
                APPROVED
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs font-mono">
                PENDING
              </Badge>
            )}
            {isFeatured && (
              <Badge variant="default" className="text-xs font-mono bg-yellow-600">
                FEATURED
              </Badge>
            )}
          </div>
        )}
        
        {/* Public Featured Star (only show on non-admin pages for featured) */}
        {!isAdmin && isFeatured && (
          <div className="absolute top-3 right-3">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          </div>
        )}
        
        {/* Play Button */}
        {!isAdmin && (
          <div className="absolute bottom-3 right-3">
            <Button 
              size="sm" 
              className="rounded-full w-10 h-10 p-0"
              onClick={() => window.open(mix.url, '_blank')}
            >
              <Play className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Genre and Date */}
        <div className="text-sm uppercase tracking-wide text-neutral-500 mb-2">
          {mix.genre || 'Mix'} • {submittedDate}
        </div>
        
        {/* Title and Artist */}
        <h3 className="text-lg font-semibold mb-1">{mix.title}</h3>
        <p className="text-neutral-600 mb-3">by {mix.name}</p>
        
        {/* Description */}
        {mix.about && (
          <p className="text-sm text-neutral-600 mb-4 line-clamp-2">{mix.about}</p>
        )}
        
        {/* File attachment status (admin only) */}
        {isAdmin && mix.fileName && (
          <p className="text-xs text-green-600 mb-2">
            📎 {mix.fileName}
          </p>
        )}
        
        {/* Actions */}
        <div className="space-y-3">
          {isAdmin ? (
            <>
              {/* Toggle Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  onClick={toggleApprove}
                  variant={isApproved ? "default" : "outline"}
                  size="sm"
                  className={isApproved ? "bg-green-600 hover:bg-green-700" : "text-green-600 border-green-600 hover:bg-green-50"}
                >
                  <Check className="h-3 w-3 mr-1" />
                  {isApproved ? 'Approved ✓' : 'Approve'}
                </Button>
                
                <Button
                  onClick={toggleFeature}
                  variant={isFeatured ? "default" : "outline"}
                  size="sm"
                  disabled={false}
                  className={`${
                    isFeatured 
                      ? "bg-yellow-600 hover:bg-yellow-700 cursor-pointer" 
                      : !isApproved 
                        ? "text-gray-400 border-gray-400 cursor-not-allowed" 
                        : "text-yellow-600 border-yellow-600 hover:bg-yellow-50 cursor-pointer"
                  }`}
                >
                  <Star className="h-3 w-3 mr-1" />
                  {isFeatured ? 'Featured ★' : 'Feature'}
                </Button>
                
                <Button
                  onClick={() => onDelete?.(mix.id)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-600 hover:bg-red-50 ml-auto"
                >
                  <X className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
              
              {/* File Attachment Section */}
              <div className="border-t pt-2">
                {mix.filePath ? (
                  <div className="space-y-2">
                    <p className="text-xs text-green-600">✅ File attached: {mix.fileName}</p>
                    <Button
                      onClick={() => onPushToAzura?.(mix.id)}
                      variant="outline"
                      size="sm"
                      className="w-full text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      Send to AzuraCast
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">No file attached</p>
                    <input
                      type="file"
                      accept=".mp3,audio/mpeg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onAttachFile?.(mix.id, file);
                      }}
                      className="text-xs w-full"
                    />
                    <p className="text-muted-foreground text-xs">Attach MP3 to enable AzuraCast push</p>
                  </div>
                )}
              </div>
              
              {/* Listen Button */}
              <Button 
                size="sm" 
                onClick={() => window.open(mix.url, '_blank')}
                className="w-full bg-neutral-900 text-white hover:bg-neutral-800"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Listen to Original
              </Button>
            </>
          ) : (
            <Button 
              size="sm" 
              onClick={() => window.open(mix.url, '_blank')}
              className="w-full bg-neutral-900 text-white hover:bg-neutral-800"
            >
              <Play className="w-4 h-4 mr-1" />
              Listen
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}