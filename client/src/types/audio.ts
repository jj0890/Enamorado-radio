export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  artwork?: string;
  duration?: number;
  isLive?: boolean;
}

export interface AudioStation {
  id: number;
  name: string;
  slug: string;
  streamUrl: string;
  genre: string;
  description?: string;
  artworkUrl?: string;
  isLive: boolean;
}

export interface AudioShow {
  id: number;
  title: string;
  host: string;
  description?: string;
  artworkUrl?: string;
  genre: string;
  scheduledAt?: Date;
  duration?: number;
  isLive: boolean;
  isFeatured: boolean;
}

export interface CurrentPlayback {
  id: number;
  stationId?: number;
  showId?: number;
  title: string;
  artist?: string;
  artwork?: string;
  startTime: Date;
  isLive: boolean;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  error?: string;
}

export interface AudioPlayerControls {
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unmute: () => void;
}
