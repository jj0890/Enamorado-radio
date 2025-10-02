import { useState } from 'react';
import { Play, Check, Star, X, Upload, ExternalLink, Music, Clock, User } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AdminMixCardProps {
  mix: {
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
  };
  onApprove?: (id: number) => void;
  onFeature?: (id: number) => void;
  onDelete?: (id: number) => void;
  onAttachFile?: (id: number, file: File) => void;
  onPushToAzura?: (id: number) => void;
}

export default function AdminMixCard({ 
  mix, 
  onApprove, 
  onFeature, 
  onDelete, 
  onAttachFile, 
  onPushToAzura 
}: AdminMixCardProps) {
  
  const isApproved = mix.status === 'approved' || mix.status === 'featured';
  const isFeatured = mix.status === 'featured';
  const artwork = mix.artUrl || null;
  
  // Admin toggle functions
  async function toggleApprove() {
    if (onApprove) {
      onApprove(mix.id);
    } else {
      // Fallback to direct API call
      try {
        const response = await fetch(`/api/admin/mixes/${mix.id}/approve`, { method: 'POST' });
        if (response.ok) {
          window.location.reload(); // Simple refresh for now
        }
      } catch (error) {
        console.error('Error toggling approval:', error);
      }
    }
  }

  async function toggleFeature() {
    if (!isApproved) {
      alert('Mix must be approved first before featuring');
      return;
    }
    
    if (onFeature) {
      onFeature(mix.id);
    } else {
      // Fallback to direct API call
      try {
        const response = await fetch(`/api/admin/mixes/${mix.id}/feature`, { method: 'POST' });
        if (response.ok) {
          window.location.reload(); // Simple refresh for now
        }
      } catch (error) {
        console.error('Error toggling feature:', error);
      }
    }
  }

  return (
    <div className="relative bg-white dark:bg-gray-900 rounded-xl overflow-hidden transition-all duration-300 group focus-within:outline-none focus-within:ring-2 focus-within:ring-red-500/50">
      {/* Hairline border */}
      <div className="absolute inset-0 rounded-xl pointer-events-none shadow-[0_0_0_1px_rgba(12,12,13,0.08)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_0_1px_rgba(209,77,14,0.3),0_6px_14px_rgba(0,0,0,0.12)] dark:group-hover:shadow-[0_0_0_1px_rgba(239,68,68,0.5),0_6px_14px_rgba(0,0,0,0.5)] transition-shadow"></div>
      
      {/* Artwork */}
      <div className="aspect-square bg-gray-200 dark:bg-gray-800 relative">
        {artwork ? (
          <img 
            src={artwork} 
            alt={mix.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
            <Music className="w-12 h-12 text-gray-400" />
          </div>
        )}
        
        {/* Admin Status Badges */}
        <div className="absolute top-3 left-3 space-y-1">
          {isApproved ? (
            <Badge variant="default" className="text-xs font-mono bg-green-600 border-0">
              APPROVED
            </Badge>
          ) : (
            <Badge className="text-xs font-mono bg-yellow-100 text-yellow-700 border-0">
              PENDING
            </Badge>
          )}
          
          {isFeatured && (
            <Badge variant="default" className="text-xs font-mono bg-yellow-600 border-0">
              FEATURED
            </Badge>
          )}
        </div>
      </div>
      
      <div className="p-3 sm:p-4">
        {/* Genre and Date */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full uppercase">
            {mix.genre}
          </span>
          <div className="text-xs font-mono text-gray-500 dark:text-gray-400 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {new Date(mix.submittedAt).toLocaleDateString()}
          </div>
        </div>

        {/* Title and Artist */}
        <div className="mb-3">
          <h4 className="text-base sm:text-lg font-bold font-mono text-gray-900 dark:text-white mb-1 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">
            {mix.title}
          </h4>
          <div className="flex items-center text-gray-600 dark:text-gray-400 font-mono text-sm">
            <User className="w-3 h-3 mr-1" />
            {mix.name}
          </div>
        </div>

        {/* Admin Action Buttons */}
        <div className="space-y-2 mb-4">
          <div className="flex gap-2">
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
              className={
                isFeatured 
                  ? "bg-yellow-600 hover:bg-yellow-700" 
                  : !isApproved 
                    ? "text-gray-400 border-gray-400 cursor-not-allowed" 
                    : "text-yellow-600 border-yellow-600 hover:bg-yellow-50"
              }
              disabled={!isApproved}
            >
              <Star className="h-3 w-3 mr-1" />
              {isFeatured ? 'Featured ⭐' : 'Feature'}
            </Button>
          </div>
          
          {onDelete && (
            <Button
              onClick={() => onDelete(mix.id)}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-600 hover:bg-red-50 w-full"
            >
              <X className="h-3 w-3 mr-1" />
              Delete
            </Button>
          )}
        </div>

        {/* File Upload Section */}
        <div className="border-t pt-3 mb-3">
          <div className="text-xs text-gray-500 mb-2">
            {mix.filePath ? 'File attached' : 'No file attached'}
          </div>
          {onAttachFile && (
            <Button
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-600 hover:bg-blue-50 w-full mb-2"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.mp3,.wav,.m4a';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) onAttachFile(mix.id, file);
                };
                input.click();
              }}
            >
              <Upload className="h-3 w-3 mr-1" />
              {mix.filePath ? 'Replace MP3' : 'Attach MP3'}
            </Button>
          )}
          
          {mix.filePath && onPushToAzura && (
            <Button
              variant="outline"
              size="sm"
              className="text-purple-600 border-purple-600 hover:bg-purple-50 w-full"
              onClick={() => onPushToAzura(mix.id)}
            >
              Push to AzuraCast
            </Button>
          )}
        </div>

        {/* Listen Button */}
        <Button 
          size="sm" 
          className="bg-red-500 hover:bg-red-600 text-white font-mono w-full"
          onClick={() => window.open(mix.url, '_blank')}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Listen to Original
        </Button>
      </div>
    </div>
  );
}