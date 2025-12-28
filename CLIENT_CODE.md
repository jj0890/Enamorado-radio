# Client Code Files

## client/src/index.css
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 240 9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 10% 3.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 240 4.9% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

## client/src/main.tsx
```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

## client/src/App.tsx
```typescript
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import RadioLanding from "@/pages/RadioLanding";
import MobileRadio from "@/pages/MobileRadio";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/radio" component={RadioLanding} />
      <Route path="/mobile" component={MobileRadio} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
```

## client/src/lib/queryClient.ts
```typescript
import { QueryClient, type QueryFunctionContext } from "@tanstack/react-query";

const QUERY_RETRY_COUNT = 3;
const QUERY_STALE_TIME = 5 * 60 * 1000; // 5 minutes

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error);
  }
}

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => (context: QueryFunctionContext) => Promise<T> = ({ on401 }) => {
  return async ({ queryKey }) => {
    const [endpoint] = queryKey;
    try {
      const res = await apiRequest(endpoint as string);
      return await res.json();
    } catch (error) {
      if (error instanceof Error && error.message.includes("401")) {
        if (on401 === "returnNull") return null;
        throw error;
      }
      throw error;
    }
  };
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: QUERY_RETRY_COUNT,
      staleTime: QUERY_STALE_TIME,
      queryFn: getQueryFn({ on401: "throw" }),
    },
  },
});
```

## client/src/lib/utils.ts
```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## client/src/types/audio.ts
```typescript
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
```

## client/src/hooks/useWebSocket.ts
```typescript
import { useEffect, useRef, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  data: any;
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
}

export function useWebSocket(url: string, options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectInterval = 3000
  } = options;

  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const isConnected = useRef(false);

  const connect = useCallback(() => {
    try {
      ws.current = new WebSocket(url);
      
      ws.current.onopen = () => {
        isConnected.current = true;
        onConnect?.();
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          onMessage?.(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        isConnected.current = false;
        onDisconnect?.();
        
        // Attempt to reconnect after delay
        reconnectTimer.current = setTimeout(() => {
          if (!isConnected.current) {
            connect();
          }
        }, reconnectInterval);
      };

      ws.current.onerror = (error) => {
        onError?.(error);
      };

    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  }, [url, onMessage, onConnect, onDisconnect, onError, reconnectInterval]);

  const send = (message: WebSocketMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
    }
    if (ws.current) {
      ws.current.close();
    }
  }, []);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return {
    send,
    disconnect,
    isConnected: isConnected.current
  };
}
```

## client/src/pages/Home.tsx
```typescript
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AudioPlayer } from "@/components/AudioPlayer";
import { StationGrid } from "@/components/StationGrid";
import { FeaturedShows } from "@/components/FeaturedShows";
import type { AudioStation, AudioShow } from "@/types/audio";
import { getQueryFn } from "@/lib/queryClient";
import { useState } from "react";
import { Link } from "wouter";

export default function Home() {
  const [selectedStation, setSelectedStation] = useState<AudioStation | null>(null);
  const [selectedShow, setSelectedShow] = useState<AudioShow | null>(null);

  const { data: stations } = useQuery({
    queryKey: ['/api/stations'],
    queryFn: getQueryFn({ on401: 'throw' })
  });

  const { data: featuredShows } = useQuery({
    queryKey: ['/api/shows/featured'],
    queryFn: getQueryFn({ on401: 'throw' })
  });

  const handleStationSelect = (station: AudioStation) => {
    setSelectedStation(station);
    setSelectedShow(null);
  };

  const handleShowSelect = (show: AudioShow) => {
    setSelectedShow(show);
    setSelectedStation(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Enamorado Radio</h1>
          <p className="text-muted-foreground">
            Discover amazing radio stations and shows
          </p>
          <div className="mt-4 space-x-4">
            <Link href="/radio">
              <Button variant="outline">Landing Page</Button>
            </Link>
            <Link href="/mobile">
              <Button>Mobile Radio</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Featured Shows</CardTitle>
                <CardDescription>
                  Discover our curated selection of shows
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FeaturedShows 
                  shows={featuredShows || []}
                  onShowSelect={handleShowSelect}
                  currentShowId={selectedShow?.id}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Radio Stations</CardTitle>
                <CardDescription>
                  Browse our collection of radio stations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StationGrid 
                  stations={stations || []}
                  onStationSelect={handleStationSelect}
                  currentStationId={selectedStation?.id}
                />
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Now Playing</CardTitle>
              </CardHeader>
              <CardContent>
                <AudioPlayer />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## client/src/pages/not-found.tsx
```typescript
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-muted-foreground mb-4">Page not found</p>
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    </div>
  );
}
```

## client/src/pages/RadioLanding.tsx
```typescript
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function RadioLanding() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-4">ENAMORADO RADIO</h1>
          <p className="text-xl text-gray-300 mb-8">
            Authentic Radio Experience
          </p>
          <div className="space-x-4">
            <Link href="/mobile">
              <Button size="lg" className="bg-white text-black hover:bg-gray-200">
                Listen Now
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-black">
                Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
```