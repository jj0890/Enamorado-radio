import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Play, Pause, SkipForward, Volume2, Users, Palette } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { PlayerTheme, defaultThemes, getThemeById, getThemePreference, saveThemePreference } from '@/types/playerThemes';

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
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<PlayerTheme>(
    getThemeById(getThemePreference()) || defaultThemes[0]
  );

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

  const handleThemeChange = (themeId: string) => {
    const theme = getThemeById(themeId);
    if (theme) {
      setCurrentTheme(theme);
      saveThemePreference(themeId);
      setShowThemeSelector(false);
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

  // Generate dynamic styles based on current theme
  const playerStyles: React.CSSProperties = {
    background: currentTheme.colors.background,
    color: currentTheme.colors.text,
    borderColor: currentTheme.colors.border,
    borderRadius: currentTheme.effects.borderRadius,
    boxShadow: currentTheme.effects.shadow,
    fontFamily: currentTheme.fonts.primary,
    ...(currentTheme.effects.glassEffect && {
      backdropFilter: 'blur(20px)',
      border: `1px solid ${currentTheme.colors.border}`,
    }),
  };

  if (!streamState?.currentTrack) {
    return (
      <div style={playerStyles} className="border p-4 max-w-md relative">
        <div className="text-center" style={{ color: currentTheme.colors.secondary }}>
          <p style={{ fontFamily: currentTheme.fonts.mono }} className="text-sm">ENAMORADO RADIO</p>
          <p className="text-xs">No track currently playing</p>
        </div>
        
        {/* Theme Selector Button */}
        <button
          onClick={() => setShowThemeSelector(!showThemeSelector)}
          className="absolute top-2 right-2 p-1 rounded opacity-50 hover:opacity-100 transition-opacity"
          style={{ color: currentTheme.colors.secondary }}
        >
          <Palette className="w-4 h-4" />
        </button>
        
        {/* Theme Selector Dropdown */}
        {showThemeSelector && (
          <div className="absolute top-8 right-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50 min-w-48">
            <p className="font-mono text-xs font-medium mb-2 text-gray-600">Choose Theme</p>
            {defaultThemes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className="w-full text-left p-2 rounded text-sm hover:bg-gray-50 transition-colors"
              >
                <div className="font-mono font-medium text-gray-900">{theme.name}</div>
                <div className="text-xs text-gray-500">{theme.description}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const { currentTrack } = streamState;

  return (
    <div style={playerStyles} className="border p-4 max-w-md relative">
      {/* Hidden audio element for actual playback */}
      {currentTrack.audioUrl.endsWith('.mp3') && (
        <audio 
          ref={audioRef}
          src={currentTrack.audioUrl}
          onEnded={handleNext}
        />
      )}
      
      {/* Theme Selector Button */}
      <button
        onClick={() => setShowThemeSelector(!showThemeSelector)}
        className="absolute top-2 right-2 p-1 rounded opacity-50 hover:opacity-100 transition-opacity"
        style={{ color: currentTheme.colors.secondary }}
      >
        <Palette className="w-4 h-4" />
      </button>
      
      {/* Theme Selector Dropdown */}
      {showThemeSelector && (
        <div className="absolute top-8 right-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50 min-w-48">
          <p className="font-mono text-xs font-medium mb-2 text-gray-600">Choose Theme</p>
          {defaultThemes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              className={`w-full text-left p-2 rounded text-sm hover:bg-gray-50 transition-colors ${
                theme.id === currentTheme.id ? 'bg-blue-50 border border-blue-200' : ''
              }`}
            >
              <div className="font-mono font-medium text-gray-900">{theme.name}</div>
              <div className="text-xs text-gray-500">{theme.description}</div>
              <div className="flex space-x-1 mt-1">
                <div 
                  className="w-3 h-3 rounded-full border"
                  style={{ backgroundColor: theme.colors.accent }}
                ></div>
                <div 
                  className="w-3 h-3 rounded-full border"
                  style={{ backgroundColor: theme.colors.background }}
                ></div>
                <div 
                  className="w-3 h-3 rounded-full border"
                  style={{ backgroundColor: theme.colors.text }}
                ></div>
              </div>
            </button>
          ))}
        </div>
      )}
      
      {/* Now Playing Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div 
            className={`w-2 h-2 rounded-full ${currentTheme.effects.animations ? 'animate-pulse' : ''}`}
            style={{ backgroundColor: currentTheme.colors.accent }}
          ></div>
          <span style={{ fontFamily: currentTheme.fonts.mono }} className="text-xs font-medium">LIVE NOW</span>
        </div>
        <div className="flex items-center space-x-1" style={{ color: currentTheme.colors.secondary }}>
          <Users className="w-3 h-3" />
          <span style={{ fontFamily: currentTheme.fonts.mono }} className="text-xs">{streamState.listeners}</span>
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
          <h3 style={{ fontFamily: currentTheme.fonts.mono }} className="text-sm font-medium truncate">
            {currentTrack.title}
          </h3>
          <p style={{ fontFamily: currentTheme.fonts.mono, color: currentTheme.colors.secondary }} className="text-xs truncate">
            {currentTrack.artist}
          </p>
          <p style={{ fontFamily: currentTheme.fonts.mono, color: currentTheme.colors.secondary }} className="text-xs opacity-70">
            {currentTrack.source === 'dj_mix' ? 'DJ Mix' : 
             currentTrack.source === 'submission' ? 'Community Pick' : 'Upload'}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1" style={{ fontFamily: currentTheme.fonts.mono, color: currentTheme.colors.secondary }}>
          <span>{formatTime(streamState.currentTime)}</span>
          <span>{formatTime(currentTrack.duration)}</span>
        </div>
        <div 
          className="w-full h-1 rounded-full"
          style={{ backgroundColor: currentTheme.colors.progressBg }}
        >
          <div 
            className={`h-1 rounded-full ${currentTheme.effects.animations ? 'transition-all duration-1000' : ''}`}
            style={{ 
              width: `${progressPercentage}%`,
              background: currentTheme.colors.progressFill
            }}
          ></div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={isLocalPlaying ? handlePause : handlePlay}
          className={`flex items-center justify-center w-8 h-8 text-white rounded-full ${currentTheme.effects.animations ? 'transition-colors' : ''}`}
          style={{ 
            background: currentTheme.colors.buttonBg,
            borderRadius: currentTheme.effects.borderRadius,
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.background = currentTheme.colors.buttonHover;
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.background = currentTheme.colors.buttonBg;
          }}
        >
          {isLocalPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </button>
        
        <button
          onClick={handleNext}
          className={`flex items-center justify-center w-6 h-6 ${currentTheme.effects.animations ? 'transition-colors' : ''}`}
          style={{ color: currentTheme.colors.secondary }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.color = currentTheme.colors.text;
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.color = currentTheme.colors.secondary;
          }}
        >
          <SkipForward className="w-4 h-4" />
        </button>
        
        <div className="flex items-center space-x-2" style={{ color: currentTheme.colors.secondary }}>
          <Volume2 className="w-4 h-4" />
          <div 
            className="w-16 rounded-full h-1"
            style={{ backgroundColor: currentTheme.colors.progressBg }}
          >
            <div 
              className="h-1 rounded-full"
              style={{ 
                width: `${streamState.volume * 100}%`,
                backgroundColor: currentTheme.colors.secondary
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Platform Link */}
      {currentTrack.source === 'submission' && currentTrack.audioUrl.includes('spotify') && (
        <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${currentTheme.colors.border}` }}>
          <a 
            href={currentTrack.audioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-xs flex items-center justify-center space-x-1 ${currentTheme.effects.animations ? 'transition-colors' : ''}`}
            style={{ 
              fontFamily: currentTheme.fonts.mono,
              color: currentTheme.colors.secondary
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.color = currentTheme.colors.text;
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.color = currentTheme.colors.secondary;
            }}
          >
            <span>Listen on Spotify</span>
            <span>↗</span>
          </a>
        </div>
      )}
    </div>
  );
}