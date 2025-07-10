# Components Code Files

## shared/schema.ts
```typescript
import { pgTable, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  username: text("username").unique().notNull(),
  email: text("email").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const stations = pgTable("stations", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  streamUrl: text("stream_url").notNull(),
  genre: text("genre").notNull(),
  description: text("description"),
  artworkUrl: text("artwork_url"),
  isLive: boolean("is_live").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const shows = pgTable("shows", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  title: text("title").notNull(),
  host: text("host").notNull(),
  description: text("description"),
  artworkUrl: text("artwork_url"),
  genre: text("genre").notNull(),
  scheduledAt: timestamp("scheduled_at"),
  duration: integer("duration"), // in minutes
  isLive: boolean("is_live").default(false).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const currentPlayback = pgTable("current_playback", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  stationId: integer("station_id").references(() => stations.id),
  showId: integer("show_id").references(() => shows.id),
  title: text("title").notNull(),
  artist: text("artist"),
  artwork: text("artwork"),
  startTime: timestamp("start_time").notNull(),
  isLive: boolean("is_live").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
});

export const insertStationSchema = createInsertSchema(stations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShowSchema = createInsertSchema(shows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCurrentPlaybackSchema = createInsertSchema(currentPlayback).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Station = typeof stations.$inferSelect;
export type Show = typeof shows.$inferSelect;
export type CurrentPlayback = typeof currentPlayback.$inferSelect;
export type InsertStation = z.infer<typeof insertStationSchema>;
export type InsertShow = z.infer<typeof insertShowSchema>;
export type InsertCurrentPlayback = z.infer<typeof insertCurrentPlaybackSchema>;
```

## client/src/components/AudioPlayer.tsx
```typescript
import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { useWebSocket } from '@/hooks/useWebSocket';
import type { AudioTrack, PlaybackState, AudioPlayerControls } from '@/types/audio';

interface AudioPlayerProps {
  className?: string;
}

export function AudioPlayer({ className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    isLoading: false,
  });

  // WebSocket connection for real-time updates
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  useWebSocket(wsUrl, {
    onMessage: (message) => {
      if (message.type === 'currentPlayback') {
        const playback = message.data;
        const track: AudioTrack = {
          id: playback.id.toString(),
          title: playback.title,
          artist: playback.artist || 'Unknown Artist',
          artwork: playback.artwork,
          isLive: playback.isLive,
        };
        setCurrentTrack(track);
      }
    }
  });

  // Initialize with default track
  useEffect(() => {
    const initialTrack: AudioTrack = {
      id: '1',
      title: 'DJ Amadeezy Mix',
      artist: 'DJ Amadeezy',
      artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
      isLive: true,
    };
    setCurrentTrack(initialTrack);
  }, []);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setPlaybackState(prev => ({
        ...prev,
        currentTime: audio.currentTime,
      }));
    };

    const handleDurationChange = () => {
      setPlaybackState(prev => ({
        ...prev,
        duration: audio.duration,
      }));
    };

    const handlePlay = () => {
      setPlaybackState(prev => ({
        ...prev,
        isPlaying: true,
        isLoading: false,
      }));
    };

    const handlePause = () => {
      setPlaybackState(prev => ({
        ...prev,
        isPlaying: false,
      }));
    };

    const handleLoadStart = () => {
      setPlaybackState(prev => ({
        ...prev,
        isLoading: true,
      }));
    };

    const handleLoadedData = () => {
      setPlaybackState(prev => ({
        ...prev,
        isLoading: false,
      }));
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadeddata', handleLoadedData);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadeddata', handleLoadedData);
    };
  }, []);

  const controls: AudioPlayerControls = {
    play: () => {
      const audio = audioRef.current;
      if (audio) {
        audio.src = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
        audio.play();
      }
    },
    pause: () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
      }
    },
    stop: () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    },
    seek: (time: number) => {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = time;
      }
    },
    setVolume: (volume: number) => {
      const audio = audioRef.current;
      if (audio) {
        audio.volume = volume;
        setPlaybackState(prev => ({
          ...prev,
          volume,
          isMuted: volume === 0,
        }));
      }
    },
    mute: () => {
      const audio = audioRef.current;
      if (audio) {
        audio.muted = true;
        setPlaybackState(prev => ({
          ...prev,
          isMuted: true,
        }));
      }
    },
    unmute: () => {
      const audio = audioRef.current;
      if (audio) {
        audio.muted = false;
        setPlaybackState(prev => ({
          ...prev,
          isMuted: false,
        }));
      }
    },
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = playbackState.duration > 0 
    ? (playbackState.currentTime / playbackState.duration) * 100 
    : 0;

  if (!currentTrack) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No track selected
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <audio ref={audioRef} crossOrigin="anonymous" preload="metadata" />
        
        <div className="space-y-4">
          {/* Track info */}
          <div className="text-center">
            {currentTrack.artwork && (
              <img 
                src={currentTrack.artwork} 
                alt={currentTrack.title}
                className="w-24 h-24 rounded-lg mx-auto mb-4 object-cover"
              />
            )}
            <h3 className="font-semibold">{currentTrack.title}</h3>
            <p className="text-sm text-muted-foreground">{currentTrack.artist}</p>
            {currentTrack.isLive && (
              <span className="inline-block mt-1 px-2 py-1 text-xs bg-red-500 text-white rounded">
                LIVE
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(playbackState.currentTime)}</span>
              <span>{formatTime(playbackState.duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={playbackState.isPlaying ? controls.pause : controls.play}
              disabled={playbackState.isLoading}
            >
              {playbackState.isPlaying ? <Pause /> : <Play />}
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={playbackState.isMuted ? controls.unmute : controls.mute}
              >
                {playbackState.isMuted ? <VolumeX /> : <Volume2 />}
              </Button>
              
              <Slider
                value={[playbackState.isMuted ? 0 : playbackState.volume]}
                onValueChange={(value) => controls.setVolume(value[0])}
                max={1}
                step={0.1}
                className="w-20"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

## client/src/components/StationGrid.tsx
```typescript
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Radio } from 'lucide-react';
import type { AudioStation } from '@/types/audio';

interface StationGridProps {
  stations: AudioStation[];
  onStationSelect: (station: AudioStation) => void;
  currentStationId?: number;
}

export function StationGrid({ stations, onStationSelect, currentStationId }: StationGridProps) {
  if (stations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No stations available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {stations.map((station) => (
        <Card 
          key={station.id}
          className={`cursor-pointer transition-all hover:shadow-lg ${
            currentStationId === station.id ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => onStationSelect(station)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Radio className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">{station.name}</h3>
              </div>
              {station.isLive && (
                <Badge variant="destructive" className="text-xs">
                  LIVE
                </Badge>
              )}
            </div>
            
            {station.artworkUrl && (
              <img 
                src={station.artworkUrl} 
                alt={station.name}
                className="w-full h-32 object-cover rounded-lg mb-3"
              />
            )}
            
            <div className="space-y-2">
              <Badge variant="secondary" className="text-xs">
                {station.genre}
              </Badge>
              
              {station.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {station.description}
                </p>
              )}
              
              <Button 
                size="sm" 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onStationSelect(station);
                }}
              >
                <Play className="w-4 h-4 mr-2" />
                Listen Now
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

## client/src/components/FeaturedShows.tsx
```typescript
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Calendar } from 'lucide-react';
import type { AudioShow } from '@/types/audio';

interface FeaturedShowsProps {
  shows: AudioShow[];
  onShowSelect: (show: AudioShow) => void;
  currentShowId?: number;
}

export function FeaturedShows({ shows, onShowSelect, currentShowId }: FeaturedShowsProps) {
  if (shows.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No featured shows available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {shows.map((show) => (
        <Card 
          key={show.id}
          className={`cursor-pointer transition-all hover:shadow-lg ${
            currentShowId === show.id ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => onShowSelect(show)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">{show.title}</h3>
              </div>
              <div className="flex space-x-1">
                {show.isLive && (
                  <Badge variant="destructive" className="text-xs">
                    LIVE
                  </Badge>
                )}
                {show.isFeatured && (
                  <Badge variant="secondary" className="text-xs">
                    FEATURED
                  </Badge>
                )}
              </div>
            </div>
            
            {show.artworkUrl && (
              <img 
                src={show.artworkUrl} 
                alt={show.title}
                className="w-full h-32 object-cover rounded-lg mb-3"
              />
            )}
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {show.genre}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {show.host}
                </span>
              </div>
              
              {show.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {show.description}
                </p>
              )}
              
              <div className="flex items-center justify-between">
                {show.scheduledAt && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(show.scheduledAt).toLocaleString()}
                  </span>
                )}
                {show.duration && (
                  <span className="text-xs text-muted-foreground">
                    {show.duration}m
                  </span>
                )}
              </div>
              
              <Button 
                size="sm" 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onShowSelect(show);
                }}
              >
                <Play className="w-4 h-4 mr-2" />
                Listen Now
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

## client/src/hooks/use-toast.ts
```typescript
import React from "react";
import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"];
    };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const listeners: Array<(state: State) => void> = [];

let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

type Toast = Omit<ToasterToast, "id">;

function toast({ ...props }: Toast) {
  const id = genId();

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast, toast };
```