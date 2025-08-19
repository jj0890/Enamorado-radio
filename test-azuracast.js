import Client from 'ssh2-sftp-client';

const sftp = new Client();

async function testAzuraCastConnection() {
  try {
    console.log('🔗 Testing AzuraCast SFTP connection...');
    
    await sftp.connect({
      host: process.env.SFTP_HOST || '24.199.109.18',
      port: parseInt(process.env.SFTP_PORT) || 2022,
      username: process.env.SFTP_USER || 'dj1',
      password: process.env.SFTP_PASS
    });

    console.log('✅ Connected to AzuraCast SFTP successfully!');
    
    // List directory contents to verify access
    const files = await sftp.list('/var/azuracast/stations/enamorado_radio/media/');
    console.log(`📁 Found ${files.length} files in media directory`);
    
    // Test API connection
    const apiKey = process.env.AZURACAST_API_KEY;
    const baseUrl = process.env.AZURACAST_BASE_URL || 'http://24.199.109.18';
    
    if (apiKey) {
      console.log('🔗 Testing AzuraCast API connection...');
      
      const response = await fetch(`${baseUrl}/api/nowplaying/enamorado_radio`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      if (response.ok) {
        const nowPlaying = await response.json();
        console.log('✅ API connection successful!');
        console.log('🎵 Now Playing:', nowPlaying.now_playing?.song?.title || 'Unknown');
        console.log('📡 Stream URL:', `${baseUrl}/listen/enamorado_radio/radio.mp3`);
      } else {
        console.log('❌ API connection failed:', response.status);
      }
    } else {
      console.log('⚠️  AZURACAST_API_KEY not found, skipping API test');
    }
    
    await sftp.end();
    console.log('🎉 AzuraCast integration test complete!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    await sftp.end().catch(() => {});
  }
}

testAzuraCastConnection();