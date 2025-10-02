const STREAM_URL   = '/stream.mp3';            // proxied by your Replit server
const NOWPLAYING   = '/nowplaying';            // proxied by your Replit server
const RETRY_SECS   = 6;                        // retry fetch cadence

const audio = document.getElementById('radio-audio');
const btn   = document.getElementById('radio-toggle');
const vol   = document.getElementById('radio-volume');
const ticker = document.getElementById('radio-title');
const text  = document.getElementById('radio-text');
const sub   = document.getElementById('radio-sub');

let userInteracted = false;

audio.src    = STREAM_URL;
audio.volume = parseFloat(vol.value || '0.9');

function setBtn(state){
  // swap play/pause icon
  btn.setAttribute('data-state', state);
  btn.innerHTML = (state === 'playing')
    ? `<svg viewBox="0 0 24 24" width="18" height="18"><path d="M6 5h4v14H6zM14 5h4v14h-4z" fill="currentColor"/></svg>`
    : `<svg viewBox="0 0 24 24" width="18" height="18"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>`;
}

async function tryPlay() {
  try {
    await audio.play();
    setBtn('playing');
    sub.textContent = 'Live';
  } catch (err) {
    // autoplay will fail until user clicks
    setBtn('paused');
    if (userInteracted) {
      sub.textContent = 'Tap play to listen';
    }
  }
}

btn.addEventListener('click', async () => {
  userInteracted = true;
  if (audio.paused) {
    // cache-bust in case the proxy or browser held a dead connection
    audio.src = `${STREAM_URL}?t=${Date.now()}`;
    await tryPlay();
  } else {
    audio.pause();
    setBtn('paused');
  }
});

vol.addEventListener('input', () => { audio.volume = parseFloat(vol.value); });

audio.addEventListener('error', () => {
  setBtn('paused');
  sub.textContent = 'Failed to play';
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
      const pxPerSec = 80; // speed - adjust if needed
      const distance = inner.scrollWidth / 2 + ticker.clientWidth; // because duplicated
      ticker.style.setProperty('--ticker-dur', `${distance / pxPerSec}s`);
    }
  });
}

async function tickNowPlaying(){
  try {
    const r = await fetch(NOWPLAYING, { cache:'no-store' });
    const data = await r.json();
    // AzuraCast formats may differ slightly between versions
    const s  = data?.now_playing?.song || data?.playing?.song || {};
    const st = data?.live?.is_live ? 'Live' : (data?.station?.name || 'Enamorado Radio');

    const newTitle = (s.artist && s.title) ? `${s.artist} — ${s.title}` :
                     s.title || 'Enamorado Radio';
    updateTicker(newTitle);
    sub.textContent = st;

  } catch(e){
    // keep last known
  } finally {
    setTimeout(tickNowPlaying, RETRY_SECS * 1000);
  }
}
tickNowPlaying();