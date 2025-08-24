import path from 'path';
import SftpClient from 'ssh2-sftp-client';

export async function pushToAzuraCast(localFilePath: string, fileName: string): Promise<{ success: boolean; error?: string }> {
  try {
    // SFTP credentials from environment
    const host = process.env.AZ_SFTP_HOST!;
    const port = Number(process.env.AZ_SFTP_PORT || 2022);
    const username = process.env.AZ_SFTP_USER!;
    const password = process.env.AZ_SFTP_PASS!;
    const station = process.env.AZURACAST_STATION!; // e.g., enamorado_radio
    const baseUrl = process.env.AZURACAST_BASE_URL!;   // e.g., http://24.199.109.18

    if (!host || !username || !password || !station || !baseUrl) {
      throw new Error('Missing AzuraCast configuration');
    }

    // Upload via SFTP
    const remotePath = `/var/azuracast/stations/${station}/media/${fileName}`;
    const sftp = new SftpClient();
    
    await sftp.connect({ host, port, username, password });
    await sftp.fastPut(localFilePath, remotePath);
    await sftp.end();

    // Trigger library rescan
    const rescanResponse = await fetch(`${baseUrl}/api/station/${station}/files/rescan`, {
      method: 'POST',
      headers: { 
        'X-API-Key': process.env.AZURACAST_API_KEY! 
      }
    });

    if (!rescanResponse.ok) {
      console.warn('AzuraCast rescan failed:', rescanResponse.status, rescanResponse.statusText);
    }

    return { success: true };
  } catch (error) {
    console.error('AzuraCast push failed:', error);
    return { success: false, error: String(error) };
  }
}