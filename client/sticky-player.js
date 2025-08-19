// Radio player functionality
class RadioPlayer {
  constructor() {
    this.audio = document.getElementById('radio-audio');
    this.toggleBtn = document.getElementById('radio-toggle');
    this.volumeSlider = document.getElementById('radio-volume');
    this.titleElement = document.getElementById('radio-title');
    
    this.isPlaying = false;
    this.streamUrl = 'https://radio.enamorado.co/live'; // Default stream URL
    
    this.init();
  }

  init() {
    if (!this.audio || !this.toggleBtn || !this.volumeSlider) {
      console.warn('Radio player elements not found');
      return;
    }

    // Set up event listeners
    this.toggleBtn.addEventListener('click', () => this.toggle());
    this.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
    
    // Audio events
    this.audio.addEventListener('loadstart', () => this.updateTitle('Connecting...'));
    this.audio.addEventListener('canplay', () => this.updateTitle('Ready to play'));
    this.audio.addEventListener('playing', () => {
      this.isPlaying = true;
      this.updateButton();
      this.updateTitle('Now Playing');
    });
    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.updateButton();
      this.updateTitle('Paused');
    });
    this.audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      this.updateTitle('Stream unavailable');
      this.isPlaying = false;
      this.updateButton();
    });

    // Set initial volume
    this.audio.volume = parseFloat(this.volumeSlider.value);
    
    // Set the stream URL
    this.audio.src = this.streamUrl;
  }

  toggle() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  async play() {
    try {
      if (!this.audio.src) {
        this.audio.src = this.streamUrl;
      }
      
      await this.audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      this.updateTitle('Failed to play');
    }
  }

  pause() {
    this.audio.pause();
  }

  setVolume(value) {
    this.audio.volume = parseFloat(value);
  }

  updateButton() {
    if (this.toggleBtn) {
      this.toggleBtn.textContent = this.isPlaying ? '⏸️' : '▶️';
      this.toggleBtn.setAttribute('aria-label', this.isPlaying ? 'Pause' : 'Play');
    }
  }

  updateTitle(title) {
    if (this.titleElement) {
      this.titleElement.textContent = title;
    }
  }
}

// Initialize the radio player when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new RadioPlayer();
  });
} else {
  new RadioPlayer();
}