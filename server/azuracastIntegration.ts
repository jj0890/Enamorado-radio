// AzuraCast Integration Module
// Handles SFTP uploads, API calls, and synchronization

import Client from 'ssh2-sftp-client';
import fs from 'fs';
import path from 'path';

export interface AzuraCastConfig {
  baseUrl: string;
  apiKey: string;
  stationId: string;
  sftp: {
    host: string;
    port: number;
    username: string;
    password: string;
  };
}

export class AzuraCastService {
  private config: AzuraCastConfig;
  
  constructor() {
    this.config = {
      baseUrl: process.env.AZURACAST_BASE_URL || 'http://24.199.109.18',
      apiKey: process.env.AZURACAST_API_KEY || '',
      stationId: 'enamorado_radio',
      sftp: {
        host: process.env.SFTP_HOST || '24.199.109.18',
        port: parseInt(process.env.SFTP_PORT || '2022'),
        username: process.env.SFTP_USER || 'dj1',
        password: process.env.SFTP_PASS || ''
      }
    };
  }

  // Upload audio file to AzuraCast media library
  async uploadAudioFile(localFilePath: string, remoteFileName: string): Promise<boolean> {
    const sftp = new Client();
    
    try {
      await sftp.connect(this.config.sftp);
      console.log('✅ Connected to AzuraCast SFTP');
      
      const remotePath = `/var/azuracast/stations/${this.config.stationId}/media/${remoteFileName}`;
      await sftp.put(localFilePath, remotePath);
      
      console.log(`🎵 Uploaded ${remoteFileName} to AzuraCast`);
      await sftp.end();
      
      // Trigger library rescan
      await this.rescanLibrary();
      
      return true;
    } catch (error) {
      console.error('❌ SFTP upload failed:', error);
      await sftp.end().catch(() => {});
      return false;
    }
  }

  // Trigger library rescan after uploads
  async rescanLibrary(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/station/${this.config.stationId}/files/rescan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log('📁 Library rescan initiated');
        return true;
      } else {
        console.error('❌ Library rescan failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Library rescan error:', error);
      return false;
    }
  }

  // Get current now playing info
  async getNowPlaying(): Promise<any> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/nowplaying/${this.config.stationId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });
      
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to get now playing:', error);
      return null;
    }
  }

  // Get station info and listener count
  async getStationInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/station/${this.config.stationId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });
      
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to get station info:', error);
      return null;
    }
  }

  // Create or update playlist
  async createPlaylist(name: string, type: string = 'default'): Promise<any> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/station/${this.config.stationId}/playlists`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          type,
          is_enabled: true,
          playback_order: 'shuffle'
        })
      });
      
      if (response.ok) {
        const playlist = await response.json();
        console.log(`📋 Created playlist: ${name}`);
        return playlist;
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to create playlist:', error);
      return null;
    }
  }

  // Add file to playlist
  async addToPlaylist(playlistId: number, mediaPath: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/station/${this.config.stationId}/playlists/${playlistId}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          media_path: mediaPath
        })
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ Failed to add to playlist:', error);
      return false;
    }
  }

  // Get public stream URL
  getStreamUrl(): string {
    return `${this.config.baseUrl}/listen/${this.config.stationId}/radio.mp3`;
  }

  // Get public player URL
  getPublicPlayerUrl(): string {
    return `${this.config.baseUrl}/public/${this.config.stationId}`;
  }
}

export const azuracastService = new AzuraCastService();