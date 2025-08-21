import axios from 'axios';
// @ts-ignore - No type definitions available\nimport SftpClient from 'ssh2-sftp-client';

const base = process.env.AZURACAST_BASE_URL;
const apiKey = process.env.AZURACAST_API_KEY;
const station = process.env.AZURACAST_STATION || 'enamorado_radio';

const headers = { 
  "X-API-Key": apiKey, 
  "Content-Type": "application/json" 
};

export async function rescanLibrary() {
  await axios.post(`${base}/api/station/${station}/files/rescan`, {}, { headers });
}

export async function ensurePlaylist(name: string) {
  const response = await axios.get(`${base}/api/station/${station}/playlists`, { headers });
  const playlists = response.data;
  
  let found = playlists.find((p: any) => p.name === name);
  if (found) return found;

  const created = await axios.post(`${base}/api/station/${station}/playlists`, {
    name, 
    type: "default", 
    order: "shuffle", 
    is_enabled: true,
    include_in_on_demand: true
  }, { headers });
  
  return created.data;
}

export async function addMediaToPlaylist(playlistId: number, paths: string[]) {
  const response = await axios.post(
    `${base}/api/station/${station}/playlist/${playlistId}/media`, 
    { paths }, 
    { headers }
  );
  return response.data;
}

export async function createSchedule(
  playlistId: number, 
  days: string[], 
  startTime: string, 
  endTime: string, 
  loopOnce = true
) {
  const response = await axios.post(
    `${base}/api/station/${station}/playlist/${playlistId}/schedule`, 
    { 
      days, 
      start_time: startTime, 
      end_time: endTime, 
      loop_once: loopOnce 
    }, 
    { headers }
  );
  return response.data;
}

export async function uploadViaSftp(localPath: string, remoteFilename: string) {
  const sftp = new SftpClient();
  
  await sftp.connect({
    host: process.env.AZ_SFTP_HOST!,
    port: Number(process.env.AZ_SFTP_PORT || 2022),
    username: process.env.AZ_SFTP_USER!,
    password: process.env.AZ_SFTP_PASS!
  });
  
  // Upload to station media folder
  await sftp.put(localPath, remoteFilename);
  await sftp.end();
  
  return remoteFilename;
}

export async function getNowPlaying() {
  const response = await axios.get(`${base}/api/nowplaying/${station}`, { headers });
  return response.data;
}