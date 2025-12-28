// SoundCloud API utilities for fetching playlist data
export interface SoundCloudTrack {
  id: number;
  title: string;
  user: {
    username: string;
    avatar_url: string;
  };
  artwork_url: string | null;
  stream_url: string;
  permalink_url: string;
  duration: number;
  waveform_url: string;
  created_at: string;
}

export interface SoundCloudPlaylist {
  id: number;
  title: string;
  tracks: SoundCloudTrack[];
  artwork_url: string | null;
  user: {
    username: string;
  };
}

// Your playlist ID from the URL: https://soundcloud.com/scumbagjones1/sets/essentials
const PLAYLIST_ID = 'essentials';
const USER_ID = 'scumbagjones1';

// SoundCloud uses a client_id for public API access
// This is a public client_id that works for basic track info
const SOUNDCLOUD_CLIENT_ID = 'iZIs9mchVcX5lhVkq0qGGONJF9UNsYRSW1f1E1a9b9a';

export async function fetchPlaylistTracks(playlistUrl: string): Promise<SoundCloudTrack[]> {
  try {
    // Extract playlist info from URL
    const resolveUrl = `https://api.soundcloud.com/resolve?url=${encodeURIComponent(playlistUrl)}&client_id=${SOUNDCLOUD_CLIENT_ID}`;
    
    const resolveResponse = await fetch(resolveUrl);
    if (!resolveResponse.ok) {
      throw new Error('Failed to resolve SoundCloud URL');
    }
    
    const playlistData: SoundCloudPlaylist = await resolveResponse.json();
    
    return playlistData.tracks.map(track => ({
      ...track,
      // Ensure artwork URL is high quality
      artwork_url: track.artwork_url?.replace('large', 't500x500') || null,
      // Convert waveform URL to JSON format for visualization
      waveform_url: track.waveform_url || `https://waveforms-mix.sndcdn.com/${track.id}.json`
    }));
    
  } catch (error) {
    console.error('Error fetching SoundCloud playlist:', error);
    // Fallback to demo tracks if API fails
    return [
      {
        id: 1,
        title: "PARTYNEXTDOOR ~ Jus Know (feat. Travis Scott)",
        user: { username: "PARTYNEXTDOOR", avatar_url: "" },
        artwork_url: "https://via.placeholder.com/500x500/ff0000/ffffff?text=PND",
        stream_url: "https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3",
        permalink_url: "",
        duration: 180000,
        waveform_url: "",
        created_at: ""
      },
      {
        id: 2,
        title: "WILOUGH ~ Female Energy - Freestyle",
        user: { username: "WILOUGH", avatar_url: "" },
        artwork_url: "https://via.placeholder.com/500x500/ff0000/ffffff?text=WILOUGH",
        stream_url: "https://commondatastorage.googleapis.com/codeskulptor-assets/week7-brrring.m4a",
        permalink_url: "",
        duration: 200000,
        waveform_url: "",
        created_at: ""
      }
    ];
  }
}

export async function getTrackWaveform(track: SoundCloudTrack): Promise<number[]> {
  try {
    if (!track.waveform_url) return [];
    
    const response = await fetch(track.waveform_url);
    if (!response.ok) return [];
    
    const waveformData = await response.json();
    return waveformData.samples || [];
  } catch (error) {
    console.error('Error fetching waveform:', error);
    // Return mock waveform data
    return Array.from({ length: 100 }, () => Math.random() * 100);
  }
}

// Get high quality artwork URL
export function getHighQualityArtwork(artworkUrl: string | null): string {
  if (!artworkUrl) return 'https://via.placeholder.com/500x500/ff0000/ffffff?text=ER';
  
  // Convert to highest quality available
  return artworkUrl
    .replace('large.jpg', 't500x500.jpg')
    .replace('t67x67.jpg', 't500x500.jpg')
    .replace('badge.jpg', 't500x500.jpg');
}