import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Play, Pause, SkipForward, Settings, Upload } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface StreamState {
  currentTrack: {
    id: string;
    title: string;
    artist: string;
    duration: number;
    audioUrl: string;
    artworkUrl?: string;
    source: string;
  } | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  playlist: any[];
  currentIndex: number;
  listeners: number;
}

export default function AdminStreamControl() {
  const { toast } = useToast();
  const [showManualUpdate, setShowManualUpdate] = useState(false);
  const [manualTrack, setManualTrack] = useState({
    title: '',
    artist: '',
    artworkUrl: ''
  });

  const { data: streamState, refetch } = useQuery<StreamState>({
    queryKey: ['/api/stream/state'],
    refetchInterval: 2000,
  });

  const playMutation = useMutation({
    mutationFn: () => apiRequest('/api/stream/play', { method: 'POST' }),
    onSuccess: () => {
      toast({ title: "Stream started" });
      refetch();
    }
  });

  const pauseMutation = useMutation({
    mutationFn: () => apiRequest('/api/stream/pause', { method: 'POST' }),
    onSuccess: () => {
      toast({ title: "Stream paused" });
      refetch();
    }
  });

  const skipMutation = useMutation({
    mutationFn: () => apiRequest('/api/stream/next', { method: 'POST' }),
    onSuccess: () => {
      toast({ title: "Skipped to next track" });
      refetch();
    }
  });

  const setNowPlayingMutation = useMutation({
    mutationFn: (data: { title: string; artist: string; artworkUrl?: string }) =>
      apiRequest('/api/stream/set-now-playing', { 
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      toast({ title: "Now playing updated" });
      setShowManualUpdate(false);
      setManualTrack({ title: '', artist: '', artworkUrl: '' });
      refetch();
    }
  });

  const handleManualUpdate = () => {
    if (!manualTrack.title || !manualTrack.artist) {
      toast({ 
        title: "Error", 
        description: "Title and artist are required",
        variant: "destructive"
      });
      return;
    }
    setNowPlayingMutation.mutate(manualTrack);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-mono font-bold">Stream Control</h1>
            <p className="text-gray-600 font-mono text-sm">Admin panel for live radio stream</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="font-mono text-sm">Server Online</span>
          </div>
        </div>

        {/* Current Stream Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="font-mono font-semibold mb-4">Current Stream</h2>
          
          {streamState?.currentTrack ? (
            <div className="flex items-center space-x-4 mb-6">
              {streamState.currentTrack.artworkUrl ? (
                <img 
                  src={streamState.currentTrack.artworkUrl}
                  alt={streamState.currentTrack.title}
                  className="w-16 h-16 rounded object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-gray-400">♪</span>
                </div>
              )}
              
              <div className="flex-1">
                <h3 className="font-mono font-medium">{streamState.currentTrack.title}</h3>
                <p className="font-mono text-sm text-gray-600">{streamState.currentTrack.artist}</p>
                <p className="font-mono text-xs text-gray-400 capitalize">
                  {streamState.currentTrack.source.replace('_', ' ')} • {streamState.listeners} listeners
                </p>
                <div className="mt-2">
                  <div className="flex justify-between text-xs font-mono text-gray-500 mb-1">
                    <span>{formatTime(streamState.currentTime)}</span>
                    <span>{formatTime(streamState.currentTrack.duration)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-navy h-2 rounded-full transition-all"
                      style={{ 
                        width: `${(streamState.currentTime / streamState.currentTrack.duration) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${streamState.isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="font-mono text-sm">
                  {streamState.isPlaying ? 'LIVE' : 'PAUSED'}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p className="font-mono">No track currently playing</p>
            </div>
          )}

          {/* Stream Controls */}
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => streamState?.isPlaying ? pauseMutation.mutate() : playMutation.mutate()}
              disabled={playMutation.isPending || pauseMutation.isPending}
              className="flex items-center justify-center w-12 h-12 bg-navy text-white rounded-full hover:bg-navy-dark disabled:opacity-50"
            >
              {streamState?.isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>
            
            <button
              onClick={() => skipMutation.mutate()}
              disabled={skipMutation.isPending}
              className="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              <SkipForward className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setShowManualUpdate(!showManualUpdate)}
              className="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-800"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Manual Now Playing Update */}
        {showManualUpdate && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="font-mono font-semibold mb-4">Manual Update</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block font-mono text-sm font-medium mb-1">Track Title</label>
                <input
                  type="text"
                  value={manualTrack.title}
                  onChange={(e) => setManualTrack({ ...manualTrack, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded font-mono text-sm"
                  placeholder="Enter track title"
                />
              </div>
              <div>
                <label className="block font-mono text-sm font-medium mb-1">Artist</label>
                <input
                  type="text"
                  value={manualTrack.artist}
                  onChange={(e) => setManualTrack({ ...manualTrack, artist: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded font-mono text-sm"
                  placeholder="Enter artist name"
                />
              </div>
              <div>
                <label className="block font-mono text-sm font-medium mb-1">Artwork URL (optional)</label>
                <input
                  type="url"
                  value={manualTrack.artworkUrl}
                  onChange={(e) => setManualTrack({ ...manualTrack, artworkUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded font-mono text-sm"
                  placeholder="https://..."
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleManualUpdate}
                  disabled={setNowPlayingMutation.isPending}
                  className="px-4 py-2 bg-navy text-white rounded font-mono text-sm hover:bg-navy-dark disabled:opacity-50"
                >
                  Update Now Playing
                </button>
                <button
                  onClick={() => setShowManualUpdate(false)}
                  className="px-4 py-2 border border-gray-300 rounded font-mono text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Playlist Preview */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-mono font-semibold mb-4">Upcoming Tracks</h3>
          {streamState?.playlist && streamState.playlist.length > 0 ? (
            <div className="space-y-3">
              {streamState.playlist.slice(streamState.currentIndex + 1, streamState.currentIndex + 6).map((track, index) => (
                <div key={track.id} className="flex items-center space-x-3 py-2 border-b border-gray-100 last:border-0">
                  <span className="font-mono text-xs text-gray-400 w-6">{index + 1}</span>
                  <div className="flex-1">
                    <p className="font-mono text-sm">{track.title}</p>
                    <p className="font-mono text-xs text-gray-600">{track.artist}</p>
                  </div>
                  <span className="font-mono text-xs text-gray-400 capitalize">
                    {track.source.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-mono text-sm text-gray-500">No upcoming tracks</p>
          )}
        </div>
      </div>
    </div>
  );
}