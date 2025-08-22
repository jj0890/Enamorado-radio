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
  };
  showAdminActions?: boolean;
  onApprove?: (id: number) => void;
  onFeature?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export default function MixCard({ mix, showAdminActions = false, onApprove, onFeature, onDelete }: MixCardProps) {
  // Get artwork with fallback
  const artwork = mix.metadata?.thumbnail_url || mix.metadata?.artwork_url;
  const isFeatured = mix.notes?.includes('Featured: true');
  
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
        
        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          {showAdminActions ? (
            <>
              {mix.status === 'pending' && (
                <Button 
                  size="sm" 
                  onClick={() => onApprove?.(mix.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Approve
                </Button>
              )}
              
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onFeature?.(mix.id)}
                className={isFeatured ? "border-yellow-500 text-yellow-700" : ""}
              >
                <Star className={`w-4 h-4 mr-1 ${isFeatured ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                {isFeatured ? 'Unfeature' : 'Feature'}
              </Button>
              
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => window.open(mix.url, '_blank')}
                className="border-blue-500 text-blue-700"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Listen
              </Button>
              
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => onDelete?.(mix.id)}
              >
                <X className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </>
          ) : (
            <Button 
              size="sm" 
              onClick={() => window.open(mix.url, '_blank')}
              className="bg-neutral-900 text-white hover:bg-neutral-800"
            >
              Listen
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}