// AzuraCast Operations Controller
// Handles live broadcast controls (Go Live, Return to Auto, Skip, etc.)

import axios from 'axios';

const AZURACAST_BASE_URL = (process.env.AZURACAST_BASE_URL || '').trim();
const AZURACAST_API_KEY = (process.env.AZURACAST_API_KEY || '').trim();
const AZURACAST_STATION_ID = (process.env.AZURACAST_STATION_ID || '').trim();

// Configure axios instance with API key
const azuracastClient = axios.create({
  baseURL: AZURACAST_BASE_URL,
  headers: {
    'X-API-Key': AZURACAST_API_KEY,
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export interface LiveStatus {
  isLive: boolean;
  streamerName: string | null;
  nowPlaying: any | null;
}

/**
 * Get current live broadcast status
 */
export async function getLiveStatus(): Promise<LiveStatus> {
  try {
    // Fetch now playing info from AzuraCast
    const response = await azuracastClient.get(`/api/nowplaying/${AZURACAST_STATION_ID}`);
    const data = response.data;

    const isLive = data.live?.is_live || false;
    const streamerName = data.live?.streamer_name || null;

    return {
      isLive,
      streamerName,
      nowPlaying: data,
    };
  } catch (error) {
    console.error('Error fetching live status from AzuraCast:', error);
    return {
      isLive: false,
      streamerName: null,
      nowPlaying: null,
    };
  }
}

/**
 * Switch to live DJ input
 * Note: This requires a DJ to be connected via streaming software (BUTT/Mixxx)
 * AzuraCast automatically switches when a streamer connects
 */
export async function goLive(): Promise<{ success: boolean; message: string }> {
  try {
    // Check if a streamer is currently connected
    const status = await getLiveStatus();
    
    if (status.isLive) {
      return {
        success: true,
        message: 'Already live',
      };
    }

    // In AzuraCast, going live happens automatically when a streamer connects
    // This endpoint is primarily for monitoring/confirmation
    return {
      success: false,
      message: 'No streamer connected. Ensure DJ is streaming via BUTT/Mixxx first.',
    };
  } catch (error: any) {
    console.error('Error in goLive:', error);
    return {
      success: false,
      message: error?.message || 'Failed to switch to live mode',
    };
  }
}

/**
 * Return to AutoDJ (disconnect live stream)
 */
export async function returnToAuto(): Promise<{ success: boolean; message: string }> {
  try {
    // Disconnect all active streamers to return to AutoDJ
    // This endpoint stops the live stream and resumes playlist
    await azuracastClient.post(`/api/station/${AZURACAST_STATION_ID}/backend/disconnect`);

    return {
      success: true,
      message: 'Returned to AutoDJ mode',
    };
  } catch (error: any) {
    console.error('Error returning to auto:', error);
    return {
      success: false,
      message: error?.response?.data?.message || 'Failed to return to auto mode',
    };
  }
}

/**
 * Skip current track (AutoDJ only)
 */
export async function skipTrack(): Promise<{ success: boolean; message: string }> {
  try {
    // Check if we're in AutoDJ mode
    const status = await getLiveStatus();
    
    if (status.isLive) {
      return {
        success: false,
        message: 'Cannot skip track while live. Stop live stream first.',
      };
    }

    // Skip to next track in AutoDJ playlist
    await azuracastClient.post(`/api/station/${AZURACAST_STATION_ID}/backend/skip`);

    return {
      success: true,
      message: 'Skipped to next track',
    };
  } catch (error: any) {
    console.error('Error skipping track:', error);
    return {
      success: false,
      message: error?.response?.data?.message || 'Failed to skip track',
    };
  }
}

/**
 * Get current playback queue
 */
export async function getQueue(): Promise<any[]> {
  try {
    const response = await azuracastClient.get(`/api/station/${AZURACAST_STATION_ID}/queue`);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching queue:', error);
    return [];
  }
}

/**
 * Validate AzuraCast configuration
 */
export function validateConfig(): { valid: boolean; message: string } {
  if (!AZURACAST_BASE_URL) {
    return { valid: false, message: 'AZURACAST_BASE_URL not configured' };
  }
  if (!AZURACAST_API_KEY) {
    return { valid: false, message: 'AZURACAST_API_KEY not configured' };
  }
  if (!AZURACAST_STATION_ID) {
    return { valid: false, message: 'AZURACAST_STATION_ID not configured' };
  }
  return { valid: true, message: 'Configuration valid' };
}

console.log('✅ AzuraCast Operations Controller initialized');
console.log(`   Base URL: ${AZURACAST_BASE_URL}`);
console.log(`   Station ID: ${AZURACAST_STATION_ID}`);
