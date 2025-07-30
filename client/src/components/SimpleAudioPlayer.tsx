import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Play, Pause, SkipForward, Volume2, Users } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

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

export function SimpleAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isLocalPlaying, setIsLocalPlaying] = useState(false);

  const { data: streamState, refetch } = useQuery<StreamState>({
    queryKey: ['/api/stream/state'],
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Sync with server state
  useEffect(() => {
    if (streamState?.isPlaying !== isLocalPlaying) {
      setIsLocalPlaying(streamState?.isPlaying || false);
    }
  }, [streamState?.isPlaying]);

  const handlePlay = async () => {
    try {
      await apiRequest('/api/stream/play', { method: 'POST' });
      setIsLocalPlaying(true);
      refetch();
      
      // Play actual audio if it's an MP3 file
      if (audioRef.current && streamState?.currentTrack?.audioUrl.endsWith('.mp3')) {
        audioRef.current.play();
      }
    } catch (error) {
      console.error('Failed to play:', error);
    }
  };

  const handlePause = async () => {
    try {
      await apiRequest('/api/stream/pause', { method: 'POST' });
      setIsLocalPlaying(false);
      refetch();
      
      // Pause actual audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
    } catch (error) {
      console.error('Failed to pause:', error);
    }
  };

  const handleNext = async () => {
    try {
      await apiRequest('/api/stream/next', { method: 'POST' });
      refetch();
    } catch (error) {
      console.error('Failed to skip:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = streamState?.currentTrack 
    ? (streamState.currentTime / streamState.currentTrack.duration) * 100 
    : 0;

  if (!streamState?.currentTrack) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-md">
        <div className="text-center text-gray-500">
          <p className="font-mono text-sm">ENAMORADO RADIO</p>
          <p className="text-xs">No track currently playing</p>
        </div>
      </div>
    );
  }

  const { currentTrack } = streamState;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-md shadow-sm">
      {/* Hidden audio element for actual playback */}
      {currentTrack.audioUrl.endsWith('.mp3') && (
        <audio 
          ref={audioRef}
          src={currentTrack.audioUrl}
          onEnded={handleNext}
        />
      )}
      
      {/* Now Playing Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="font-mono text-xs font-medium">LIVE NOW</span>
        </div>
        <div className="flex items-center space-x-1 text-gray-600">
          <Users className="w-3 h-3" />
          <span className="font-mono text-xs">{streamState.listeners}</span>
        </div>
      </div>

      {/* Track Info */}
      <div className="flex items-center space-x-3 mb-4">
        {currentTrack.artworkUrl ? (
          <img 
            src={currentTrack.artworkUrl} 
            alt={currentTrack.title}
            className="w-12 h-12 rounded object-cover"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
            <span className="text-gray-400 text-xs font-mono">♪</span>
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h3 className="font-mono text-sm font-medium truncate">
            {currentTrack.title}
          </h3>
          <p className="font-mono text-xs text-gray-600 truncate">
            {currentTrack.artist}
          </p>
          <p className="font-mono text-xs text-gray-400">
            {currentTrack.source === 'dj_mix' ? 'DJ Mix' : 
             currentTrack.source === 'submission' ? 'Community Pick' : 'Upload'}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs font-mono text-gray-500 mb-1">
          <span>{formatTime(streamState.currentTime)}</span>
          <span>{formatTime(currentTrack.duration)}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div 
            className="bg-red-500 h-1 rounded-full transition-all duration-1000"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={isLocalPlaying ? handlePause : handlePlay}
          className="flex items-center justify-center w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
        >
          {isLocalPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </button>
        
        <button
          onClick={handleNext}
          className="flex items-center justify-center w-6 h-6 text-gray-600 hover:text-gray-800"
        >
          <SkipForward className="w-4 h-4" />
        </button>
        
        <div className="flex items-center space-x-2 text-gray-600">
          <Volume2 className="w-4 h-4" />
          <div className="w-16 bg-gray-200 rounded-full h-1">
            <div 
              className="bg-gray-400 h-1 rounded-full"
              style={{ width: `${streamState.volume * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Platform Link */}
      {currentTrack.source === 'submission' && currentTrack.audioUrl.includes('spotify') && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <a 
            href={currentTrack.audioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-gray-500 hover:text-gray-700 flex items-center justify-center space-x-1"
          >
            <span>Listen on Spotify</span>
            <span>↗</span>
          </a>
        </div>
      )}
    </div>
  );
}