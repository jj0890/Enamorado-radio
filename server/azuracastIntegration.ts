import SftpClient from 'ssh2-sftp-client';
import path from 'path';
import fs from 'fs';

// Clean community mixes folder structure
const COMMUNITY_DIR = '/var/azuracast/stations/enamorado_radio/media/Community Mixes';

function buildAzuraFilename(artist: string, title: string, d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const safe = (s: string) => s.replace(/[\/\\:*?"<>|]/g, '').trim();
  return `${safe(artist || 'Unknown')} — ${safe(title || 'Untitled')} (${y}-${m}-${day}).mp3`;
}

export class AzuraCastIntegration {
  private readonly baseUrl: string;
  private readonly station: string;
  private readonly apiKey: string;
  private readonly sftpHost: string;
  private readonly sftpPort: number;
  private readonly sftpUser: string;
  private readonly sftpPass: string;

  constructor() {
    this.baseUrl = process.env.AZURACAST_BASE_URL || '';
    this.station = process.env.AZURACAST_STATION || '';
    this.apiKey = process.env.AZURACAST_API_KEY || '';
    this.sftpHost = process.env.AZ_SFTP_HOST || '';
    this.sftpPort = Number(process.env.AZ_SFTP_PORT) || 2022;
    this.sftpUser = process.env.AZ_SFTP_USER || '';
    this.sftpPass = process.env.AZ_SFTP_PASS || '';
  }

  // Upload file to AzuraCast via SFTP to Community Mixes folder
  async uploadFile(localPath: string, fileName: string): Promise<string> {
    if (!fs.existsSync(localPath)) {
      throw new Error(`Local file not found: ${localPath}`);
    }

    const targetDir = COMMUNITY_DIR;
    const remotePath = `${targetDir}/${fileName}`;

    const sftp = new SftpClient();
    
    try {
      await sftp.connect({
        host: this.sftpHost,
        port: this.sftpPort,
        username: this.sftpUser,
        password: this.sftpPass,
      });

      // Create target directory if it doesn't exist
      try {
        await sftp.mkdir(targetDir, true);
      } catch (err) {
        // Directory might already exist
      }

      // Upload file
      await sftp.fastPut(localPath, remotePath);
      console.log(`✅ Uploaded ${fileName} to AzuraCast: ${remotePath}`);
      
      return remotePath;
    } finally {
      await sftp.end();
    }
  }

  // Trigger AzuraCast library rescan
  async rescanLibrary(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/station/${this.station}/files/rescan`,
        {
          method: 'POST',
          headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Rescan failed: ${response.status} ${response.statusText}`);
      }

      console.log('✅ AzuraCast library rescan triggered');
      return true;
    } catch (error) {
      console.error('❌ AzuraCast rescan failed:', error);
      return false;
    }
  }

  // Full workflow: upload file and rescan
  // New method with clean filename generation
  async pushFileToAzuraCast(localPath: string, artist: string, title: string): Promise<{ 
    success: boolean; 
    remotePath?: string; 
    fileName?: string;
    error?: string 
  }> {
    try {
      const fileName = buildAzuraFilename(artist, title);
      const remotePath = await this.uploadFile(localPath, fileName);
      const rescanSuccess = await this.rescanLibrary();
      
      if (!rescanSuccess) {
        console.warn('⚠️ File uploaded but rescan failed - file may not appear in AzuraCast immediately');
      }

      return {
        success: true,
        remotePath,
        fileName,
      };
    } catch (error) {
      console.error('❌ AzuraCast push failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Legacy method for backwards compatibility
  async pushFileToAzuraCastLegacy(localPath: string, fileName: string): Promise<{ 
    success: boolean; 
    remotePath?: string; 
    error?: string 
  }> {
    try {
      const remotePath = await this.uploadFile(localPath, fileName);
      const rescanSuccess = await this.rescanLibrary();
      
      if (!rescanSuccess) {
        console.warn('⚠️ File uploaded but rescan failed - file may not appear in AzuraCast immediately');
      }

      return {
        success: true,
        remotePath,
      };
    } catch (error) {
      console.error('❌ AzuraCast push failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const azuracastIntegration = new AzuraCastIntegration();