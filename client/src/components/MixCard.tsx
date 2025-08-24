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
  // Get artwork with fallback (priority: coverUrl > metadata > fallback)
  const artwork = mix.coverUrl || mix.metadata?.thumbnail_url || mix.metadata?.artwork_url;
  const isFeatured = mix.featured || mix.notes?.includes('Featured: true');
  const isApproved = mix.approved || mix.status === 'approved';
  
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
              e.currentTarget.nextElementSibling.style.display = 'flex';
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
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <Badge 
            variant={mix.status === 'approved' ? 'default' : mix.status === 'pending' ? 'secondary' : 'destructive'}
            className="text-xs font-mono"
          >
            {mix.status === 'pending' ? 'PENDING REVIEW' : 
             mix.status === 'approved' ? 'APPROVED' : 
             mix.status === 'featured' ? 'FEATURED' : 
             mix.status?.toUpperCase()}
          </Badge>
        </div>
        
        {/* Featured Star */}
        {isFeatured && (
          <div className="absolute top-3 right-3">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          </div>
        )}
        
        {/* Play Button */}
        {!showAdminActions && (
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
        {showAdminBadges && mix.fileName && (
          <p className="text-xs text-green-600 mb-2">
            📎 {mix.fileName}
          </p>
        )}
        
        {/* Actions */}
        <div className="space-y-3">
          {showAdminActions ? (
            <>
              {/* Toggle Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  onClick={() => onApprove?.(mix.id)}
                  variant={isApproved ? "default" : "outline"}
                  size="sm"
                  className={isApproved ? "bg-green-600 hover:bg-green-700" : "text-green-600 border-green-600 hover:bg-green-50"}
                >
                  <Check className="h-3 w-3 mr-1" />
                  {isApproved ? 'Approved' : 'Approve'}
                </Button>
                
                <Button
                  onClick={() => onFeature?.(mix.id)}
                  variant={isFeatured ? "default" : "outline"}
                  size="sm"
                  className={isFeatured ? "bg-yellow-600 hover:bg-yellow-700" : "text-yellow-600 border-yellow-600 hover:bg-yellow-50"}
                >
                  <Star className="h-3 w-3 mr-1" />
                  {isFeatured ? 'Featured' : 'Feature'}
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