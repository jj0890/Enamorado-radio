const STREAM_URL = '/stream.mp3';
const NOWPLAYING = '/nowplaying';

const audio = document.getElementById('radio-audio');
const btn   = document.getElementById('radio-toggle');
const vol   = document.getElementById('radio-volume');
const title = document.getElementById('radio-title');

console.log('🎵 Sticky player script loaded');

audio.src   = STREAM_URL;
audio.volume = parseFloat(vol.value || '0.9');

console.log('🎵 Audio source set to:', STREAM_URL);

btn.addEventListener('click', async () => {
  console.log('🎵 Play button clicked, audio.paused:', audio.paused);
  if (audio.paused) {
    try { 
      await audio.play(); 
      btn.textContent = '⏸'; 
      console.log('✅ Audio playing');
    }
    catch (e) { 
      console.warn('❌ Play blocked until user gesture', e); 
      alert('Play failed: ' + e.message);
    }
  } else {
    audio.pause(); 
    btn.textContent = '▶️';
    console.log('⏸ Audio paused');
  }
});

vol.addEventListener('input', () => { 
  audio.volume = parseFloat(vol.value); 
  console.log('🔊 Volume set to:', vol.value);
});

async function fetchNowPlaying() {
  try {
    console.log('📡 Fetching now playing...');
    const r = await fetch(NOWPLAYING, { cache:'no-store' });
    const data = await r.json();
    console.log('📡 Now playing data:', data);
    
    const s = data?.now_playing?.song || data?.playing?.song || {};
    const newTitle = (s.artist && s.title) ? `${s.artist} — ${s.title}` :
                     s.title || 'Live on Enamorado Radio';
    
    title.textContent = newTitle;
    console.log('✅ Title updated to:', newTitle);
  } catch (e) {
    console.error('❌ Failed to fetch now playing:', e);
    // keep last title
  } finally {
    setTimeout(fetchNowPlaying, 10000);
  }
}

// Start polling
fetchNowPlaying();

console.log('🎵 Sticky player initialized');