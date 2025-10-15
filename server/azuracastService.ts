import Client from 'ssh2-sftp-client';
import path from 'path';
import axios, { AxiosInstance } from 'axios';
import { IStorage } from './storage';

export interface CreateStreamerRequest {
  streamer_username: string;
  streamer_password: string;
  display_name: string;
  comments?: string;
  is_active?: boolean;
}

export interface StreamerResponse {
  id: number;
  streamer_username: string;
  display_name: string;
  is_active: boolean;
}

export class AzuraCastService {
  private baseUrl = process.env.AZURACAST_BASE_URL || 'http://24.199.109.18';
  private apiKey = process.env.AZURACAST_API_KEY;
  private client: AxiosInstance | null = null;
  private storage: IStorage | null = null;
  private stationId: string | null = null;
  
  async testConnection() {
    try {
      // Test API connection
      const response = await fetch(`${this.baseUrl}/api/nowplaying`, {
        headers: {
          'X-API-Key': this.apiKey || ''
        }
      });
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      
      // Test SFTP connection
      const sftp = new Client();
      await sftp.connect({
        host: process.env.SFTP_HOST || '24.199.109.18',
        port: parseInt(process.env.SFTP_PORT || '2022'),
        username: process.env.SFTP_USER || 'dj1',
        password: process.env.SFTP_PASS
      });
      await sftp.end();

      return {
        success: true,
        streamUrl: 'http://24.199.109.18/listen/enamorado_radio/radio.mp3',
        publicPlayerUrl: 'http://24.199.109.18/public/enamorado_radio',
        apiResponse: data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getNowPlaying() {
    try {
      const response = await fetch(`${this.baseUrl}/api/nowplaying`, {
        headers: {
          'X-API-Key': this.apiKey || ''
        }
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('AzuraCast nowplaying error:', error);
      return null;
    }
  }

  async uploadMixToAzuraCast(mixTitle: string, artistName: string, tempFilePath: string) {
    const sftp = new Client();
    
    try {
      await sftp.connect({
        host: process.env.SFTP_HOST || '24.199.109.18',
        port: parseInt(process.env.SFTP_PORT || '2022'),
        username: process.env.SFTP_USER || 'dj1',
        password: process.env.SFTP_PASS
      });

      // Create target filename
      const safeTitle = mixTitle.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
      const safeArtist = artistName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
      const filename = `${safeArtist}-${safeTitle}.mp3`;
      
      // Try different media paths
      const possiblePaths = [
        '/var/azuracast/stations/enamorado_radio/media/',
        '/home/azuracast/stations/enamorado_radio/media/',
        '/media/',
        '/uploads/'
      ];

      let uploadPath = '';
      for (const testPath of possiblePaths) {
        try {
          const files = await sftp.list(testPath);
          uploadPath = testPath;
          console.log(`✅ Found accessible path: ${uploadPath}`);
          break;
        } catch (e) {
          console.log(`❌ Path not accessible: ${testPath}`);
        }
      }

      if (!uploadPath) {
        // Default to user home directory
        uploadPath = './';
        console.log('Using home directory for upload');
      }

      const targetPath = path.posix.join(uploadPath, filename);
      await sftp.put(tempFilePath, targetPath);
      
      console.log(`✅ Uploaded ${filename} to AzuraCast at ${targetPath}`);
      
      await sftp.end();
      return { success: true, path: targetPath, filename };
    } catch (error) {
      await sftp.end().catch(() => {});
      throw error;
    }
  }

  /**
   * Initialize the service with storage for dynamic config
   */
  async initializeWithStorage(storage: IStorage): Promise<boolean> {
    this.storage = storage;

    const baseUrl = await storage.getSettingByKey('azuracast_base_url');
    const apiKey = await storage.getSettingByKey('azuracast_api_key');
    const stationId = await storage.getSettingByKey('azuracast_station_id');

    if (baseUrl) this.baseUrl = baseUrl.value;
    if (apiKey) this.apiKey = apiKey.value;
    if (stationId) this.stationId = stationId.value;

    if (!this.apiKey || !this.stationId) {
      console.log('⚠️  AzuraCast streamer management not configured - auto-creation disabled');
      return false;
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('✅ AzuraCast streamer management initialized');
    return true;
  }

  /**
   * Check if streamer management is configured
   */
  isStreamerManagementConfigured(): boolean {
    return this.client !== null && this.stationId !== null;
  }

  /**
   * Create a streamer account in AzuraCast
   */
  async createStreamer(data: CreateStreamerRequest): Promise<StreamerResponse> {
    if (!this.client || !this.stationId) {
      throw new Error('AzuraCast streamer management not configured');
    }

    try {
      const response = await this.client.post<StreamerResponse>(
        `/api/station/${this.stationId}/streamers`,
        data
      );

      console.log(`✅ Created AzuraCast streamer: ${data.streamer_username} (ID: ${response.data.id})`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to create AzuraCast streamer:', error.response?.data || error.message);
      throw new Error(`AzuraCast API error: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Update a streamer account in AzuraCast
   */
  async updateStreamer(streamerId: number, data: Partial<CreateStreamerRequest>): Promise<StreamerResponse> {
    if (!this.client || !this.stationId) {
      throw new Error('AzuraCast streamer management not configured');
    }

    try {
      const response = await this.client.put<StreamerResponse>(
        `/api/station/${this.stationId}/streamers/${streamerId}`,
        data
      );

      console.log(`✅ Updated AzuraCast streamer: ${streamerId}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to update AzuraCast streamer:', error.response?.data || error.message);
      throw new Error(`AzuraCast API error: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Delete a streamer account in AzuraCast
   */
  async deleteStreamer(streamerId: number): Promise<void> {
    if (!this.client || !this.stationId) {
      throw new Error('AzuraCast streamer management not configured');
    }

    try {
      await this.client.delete(
        `/api/station/${this.stationId}/streamers/${streamerId}`
      );

      console.log(`✅ Deleted AzuraCast streamer: ${streamerId}`);
    } catch (error: any) {
      console.error('❌ Failed to delete AzuraCast streamer:', error.response?.data || error.message);
      throw new Error(`AzuraCast API error: ${error.response?.data?.message || error.message}`);
    }
  }
}

export const azuracastService = new AzuraCastService();