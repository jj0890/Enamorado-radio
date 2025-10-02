const STREAM_URL = '/stream.mp3';
const NOWPLAYING = '/nowplaying';

const audio = document.getElementById('radio-audio');
const btn   = document.getElementById('radio-toggle');
const vol   = document.getElementById('radio-volume');
const ticker = document.getElementById('radio-title');
const text = document.getElementById('radio-text');

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

/** Only scroll if content is wider than its container; set speed by pixels/sec */
function updateTicker(newText) {
  text.textContent = newText;
  // duplicate second copy to keep loop seamless
  const items = ticker.querySelectorAll('.ticker__item');
  if (items[1]) items[1].textContent = newText;

  requestAnimationFrame(() => {
    const inner = ticker.querySelector('.ticker__inner');
    const overflow = inner.scrollWidth > ticker.clientWidth;
    ticker.classList.toggle('is-overflow', overflow);
    if (overflow) {
      // Slower speed on mobile for better readability
      const isMobile = window.innerWidth <= 640;
      const pxPerSec = isMobile ? 40 : 80;
      const distance = inner.scrollWidth / 2 + ticker.clientWidth; // because duplicated
      ticker.style.setProperty('--ticker-dur', `${distance / pxPerSec}s`);
    }
  });
}

async function fetchNowPlaying() {
  try {
    console.log('📡 Fetching now playing...');
    const r = await fetch(NOWPLAYING, { cache:'no-store' });
    const data = await r.json();
    console.log('📡 Now playing data:', data);
    
    const s = data?.now_playing?.song || data?.playing?.song || {};
    const newTitle = (s.artist && s.title) ? `${s.artist} — ${s.title}` :
                     s.title || 'Live on Enamorado Radio';
    
    updateTicker(newTitle);
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