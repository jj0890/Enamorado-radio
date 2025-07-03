import { useState, useEffect } from 'react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useWebSocket } from '@/hooks/useWebSocket';
import { CompactPlayer } from './CompactPlayer';
import { FullPlayer } from './FullPlayer';
import { AudioTrack, CurrentPlayback } from '@/types/audio';

interface AudioPlayerProps {
  className?: string;
}

export function AudioPlayer({ className }: AudioPlayerProps) {
  const [isFullPlayerVisible, setIsFullPlayerVisible] = useState(false);
  const [currentStreamUrl, setCurrentStreamUrl] = useState<string>('');
  
  const { currentTrack, playbackState, controls, loadTrack } = useAudioPlayer();

  // WebSocket connection for real-time updates
  const { send } = useWebSocket('/ws', {
    onMessage: (message) => {
      if (message.type === 'currentPlayback') {
        const playback: CurrentPlayback = message.data;
        const track: AudioTrack = {
          id: playback.id.toString(),
          title: playback.title,
          artist: playback.artist || 'Unknown Artist',
          artwork: playback.artwork,
          isLive: playback.isLive
        };
        
        // Load the track if it's different from current
        if (!currentTrack || currentTrack.id !== track.id) {
          // In a real app, you'd get the stream URL from the playback data
          const streamUrl = 'https://stream.rinse.fm/rinse'; // Default stream
          loadTrack(track, streamUrl);
        }
      }
    },
    onConnect: () => {
      console.log('Connected to WebSocket');
    },
    onDisconnect: () => {
      console.log('Disconnected from WebSocket');
    }
  });

  const handleExpandPlayer = () => {
    setIsFullPlayerVisible(true);
  };

  const handleClosePlayer = () => {
    setIsFullPlayerVisible(false);
  };

  // Load initial track and stream
  useEffect(() => {
    const initialTrack: AudioTrack = {
      id: '1',
      title: 'Deep House Sessions',
      artist: 'Marcus Rivera',
      isLive: true
    };
    
    const streamUrl = 'https://stream.rinse.fm/rinse';
    loadTrack(initialTrack, streamUrl);
  }, []);

  return (
    <div className={className}>
      <CompactPlayer
        currentTrack={currentTrack}
        playbackState={playbackState}
        controls={controls}
        onExpandPlayer={handleExpandPlayer}
        isVisible={!isFullPlayerVisible && !!currentTrack}
      />
      
      <FullPlayer
        currentTrack={currentTrack}
        playbackState={playbackState}
        controls={controls}
        onClosePlayer={handleClosePlayer}
        isVisible={isFullPlayerVisible}
      />
    </div>
  );
}
