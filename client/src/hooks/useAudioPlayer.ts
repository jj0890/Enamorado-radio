import { useState, useEffect, useRef } from 'react';
import { audioManager } from '@/lib/audioContext';
import { AudioTrack, PlaybackState, AudioPlayerControls } from '@/types/audio';

export function useAudioPlayer(initialTrack?: AudioTrack) {
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(initialTrack || null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    isMuted: false,
    isLoading: false,
    error: undefined
  });

  const updateInterval = useRef<NodeJS.Timeout | null>(null);

  const updatePlaybackState = () => {
    if (currentTrack) {
      setPlaybackState(prev => ({
        ...prev,
        currentTime: audioManager.getCurrentTime(),
        duration: audioManager.getDuration(),
        isPlaying: audioManager.isPlaying()
      }));
    }
  };

  const startUpdateInterval = () => {
    if (updateInterval.current) {
      clearInterval(updateInterval.current);
    }
    updateInterval.current = setInterval(updatePlaybackState, 1000);
  };

  const stopUpdateInterval = () => {
    if (updateInterval.current) {
      clearInterval(updateInterval.current);
      updateInterval.current = null;
    }
  };

  const loadTrack = async (track: AudioTrack, streamUrl: string) => {
    try {
      setPlaybackState(prev => ({ ...prev, isLoading: true, error: undefined }));
      
      await audioManager.loadStream(streamUrl);
      setCurrentTrack(track);
      
      setPlaybackState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setPlaybackState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to load track'
      }));
    }
  };

  const play = async () => {
    if (!currentTrack) return;

    try {
      setPlaybackState(prev => ({ ...prev, isLoading: true, error: undefined }));
      await audioManager.play();
      setPlaybackState(prev => ({ ...prev, isPlaying: true, isLoading: false }));
      startUpdateInterval();
    } catch (error) {
      setPlaybackState(prev => ({ 
        ...prev, 
        isPlaying: false, 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to play'
      }));
    }
  };

  const pause = () => {
    audioManager.pause();
    setPlaybackState(prev => ({ ...prev, isPlaying: false }));
    stopUpdateInterval();
  };

  const stop = () => {
    audioManager.stop();
    setPlaybackState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
    stopUpdateInterval();
  };

  const seek = (time: number) => {
    if (currentTrack && !currentTrack.isLive) {
      // Only allow seeking for non-live content
      const duration = audioManager.getDuration();
      const clampedTime = Math.max(0, Math.min(time, duration));
      audioManager.getCurrentTime = () => clampedTime;
      updatePlaybackState();
    }
  };

  const setVolume = (volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    audioManager.setVolume(clampedVolume);
    setPlaybackState(prev => ({ ...prev, volume: clampedVolume, isMuted: false }));
  };

  const mute = () => {
    audioManager.setVolume(0);
    setPlaybackState(prev => ({ ...prev, isMuted: true }));
  };

  const unmute = () => {
    audioManager.setVolume(playbackState.volume);
    setPlaybackState(prev => ({ ...prev, isMuted: false }));
  };

  const controls: AudioPlayerControls = {
    play,
    pause,
    stop,
    seek,
    setVolume,
    mute,
    unmute
  };

  // Setup audio manager event listeners
  useEffect(() => {
    audioManager.on('play', () => {
      setPlaybackState(prev => ({ ...prev, isPlaying: true }));
      startUpdateInterval();
    });

    audioManager.on('pause', () => {
      setPlaybackState(prev => ({ ...prev, isPlaying: false }));
      stopUpdateInterval();
    });

    audioManager.on('stop', () => {
      setPlaybackState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
      stopUpdateInterval();
    });

    audioManager.on('error', (error) => {
      setPlaybackState(prev => ({ 
        ...prev, 
        isPlaying: false, 
        isLoading: false,
        error: error?.message || 'Playback error'
      }));
      stopUpdateInterval();
    });

    return () => {
      audioManager.off('play');
      audioManager.off('pause');
      audioManager.off('stop');
      audioManager.off('error');
      stopUpdateInterval();
    };
  }, []);

  // Set initial volume
  useEffect(() => {
    audioManager.setVolume(playbackState.volume);
  }, []);

  return {
    currentTrack,
    playbackState,
    controls,
    loadTrack
  };
}
