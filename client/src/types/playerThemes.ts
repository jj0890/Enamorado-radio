export interface PlayerTheme {
  id: string;
  name: string;
  description: string;
  colors: {
    background: string;
    text: string;
    accent: string;
    secondary: string;
    border: string;
    progressBg: string;
    progressFill: string;
    buttonBg: string;
    buttonHover: string;
  };
  fonts: {
    primary: string;
    mono: string;
  };
  effects: {
    borderRadius: string;
    shadow: string;
    glassEffect?: boolean;
    animations?: boolean;
  };
}

export const defaultThemes: PlayerTheme[] = [
  {
    id: 'enamorado',
    name: 'Enamorado Classic',
    description: 'Clean white background with red accents and IBM Plex Mono',
    colors: {
      background: '#ffffff',
      text: '#000000',
      accent: '#ff0000',
      secondary: '#666666',
      border: '#e5e5e5',
      progressBg: '#f0f0f0',
      progressFill: '#ff0000',
      buttonBg: '#ff0000',
      buttonHover: '#cc0000',
    },
    fonts: {
      primary: 'IBM Plex Mono, monospace',
      mono: 'IBM Plex Mono, monospace',
    },
    effects: {
      borderRadius: '8px',
      shadow: '0 2px 8px rgba(0,0,0,0.1)',
      animations: true,
    },
  },
  {
    id: 'dark-mode',
    name: 'Dark Mode',
    description: 'Sleek dark theme with neon accents',
    colors: {
      background: '#1a1a1a',
      text: '#ffffff',
      accent: '#00ff88',
      secondary: '#888888',
      border: '#333333',
      progressBg: '#2a2a2a',
      progressFill: '#00ff88',
      buttonBg: '#00ff88',
      buttonHover: '#00cc6a',
    },
    fonts: {
      primary: 'IBM Plex Mono, monospace',
      mono: 'IBM Plex Mono, monospace',
    },
    effects: {
      borderRadius: '12px',
      shadow: '0 4px 16px rgba(0,255,136,0.2)',
      animations: true,
    },
  },
  {
    id: 'retro-wave',
    name: 'Retro Wave',
    description: 'Synthwave-inspired with gradient backgrounds',
    colors: {
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      text: '#ffffff',
      accent: '#ff00ff',
      secondary: '#aa88ff',
      border: '#444466',
      progressBg: '#2a2a44',
      progressFill: 'linear-gradient(90deg, #ff00ff, #00ffff)',
      buttonBg: 'linear-gradient(45deg, #ff00ff, #00ffff)',
      buttonHover: 'linear-gradient(45deg, #cc00cc, #0088cc)',
    },
    fonts: {
      primary: 'Orbitron, IBM Plex Mono, monospace',
      mono: 'Share Tech Mono, monospace',
    },
    effects: {
      borderRadius: '16px',
      shadow: '0 8px 32px rgba(255,0,255,0.3)',
      glassEffect: true,
      animations: true,
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Ultra-clean design with subtle shadows',
    colors: {
      background: '#fafafa',
      text: '#333333',
      accent: '#000000',
      secondary: '#999999',
      border: '#e0e0e0',
      progressBg: '#f5f5f5',
      progressFill: '#000000',
      buttonBg: '#000000',
      buttonHover: '#333333',
    },
    fonts: {
      primary: 'Inter, sans-serif',
      mono: 'JetBrains Mono, monospace',
    },
    effects: {
      borderRadius: '4px',
      shadow: '0 1px 3px rgba(0,0,0,0.05)',
      animations: false,
    },
  },
  {
    id: 'nts-inspired',
    name: 'NTS Inspired',
    description: 'Bold orange accents with modern typography',
    colors: {
      background: '#ffffff',
      text: '#000000',
      accent: '#ff6b35',
      secondary: '#666666',
      border: '#dddddd',
      progressBg: '#f0f0f0',
      progressFill: '#ff6b35',
      buttonBg: '#ff6b35',
      buttonHover: '#e55a2b',
    },
    fonts: {
      primary: 'Helvetica Neue, Arial, sans-serif',
      mono: 'Courier New, monospace',
    },
    effects: {
      borderRadius: '0px',
      shadow: '0 0 0 1px rgba(0,0,0,0.1)',
      animations: true,
    },
  },
  {
    id: 'glass-morphism',
    name: 'Glass Morphism',
    description: 'Translucent design with backdrop blur',
    colors: {
      background: 'rgba(255,255,255,0.15)',
      text: '#ffffff',
      accent: '#ffffff',
      secondary: 'rgba(255,255,255,0.7)',
      border: 'rgba(255,255,255,0.2)',
      progressBg: 'rgba(255,255,255,0.1)',
      progressFill: '#ffffff',
      buttonBg: 'rgba(255,255,255,0.2)',
      buttonHover: 'rgba(255,255,255,0.3)',
    },
    fonts: {
      primary: 'SF Pro Display, -apple-system, sans-serif',
      mono: 'SF Mono, Monaco, monospace',
    },
    effects: {
      borderRadius: '20px',
      shadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
      glassEffect: true,
      animations: true,
    },
  },
];

export function getThemeById(id: string): PlayerTheme | undefined {
  return defaultThemes.find(theme => theme.id === id);
}

export function saveThemePreference(themeId: string) {
  localStorage.setItem('enamorado-player-theme', themeId);
}

export function getThemePreference(): string {
  return localStorage.getItem('enamorado-player-theme') || 'enamorado';
}