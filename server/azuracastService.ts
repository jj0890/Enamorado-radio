import Client from 'ssh2-sftp-client';
import path from 'path';

export class AzuraCastService {
  private baseUrl = process.env.AZURACAST_BASE_URL || 'http://24.199.109.18';
  private apiKey = process.env.AZURACAST_API_KEY;
  
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
}

export const azuracastService = new AzuraCastService();