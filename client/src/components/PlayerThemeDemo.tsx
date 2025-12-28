import React, { useState } from 'react';
import { defaultThemes, PlayerTheme } from '@/types/playerThemes';
import { Play, Pause, SkipForward, Volume2, Users } from 'lucide-react';

interface PlayerThemeDemoProps {
  theme: PlayerTheme;
  isPlaying: boolean;
  onThemeSelect: (themeId: string) => void;
}

function ThemePreview({ theme, isPlaying, onThemeSelect }: PlayerThemeDemoProps) {
  const playerStyles: React.CSSProperties = {
    background: theme.colors.background,
    color: theme.colors.text,
    borderColor: theme.colors.border,
    borderRadius: theme.effects.borderRadius,
    boxShadow: theme.effects.shadow,
    fontFamily: theme.fonts.primary,
    ...(theme.effects.glassEffect && {
      backdropFilter: 'blur(20px)',
      border: `1px solid ${theme.colors.border}`,
    }),
  };

  return (
    <div className="p-4">
      <div className="mb-3">
        <h3 className="font-mono font-semibold text-sm">{theme.name}</h3>
        <p className="font-mono text-xs text-gray-600">{theme.description}</p>
      </div>
      
      <div style={playerStyles} className="border p-3 max-w-sm cursor-pointer transform hover:scale-105 transition-transform">
        {/* Mini player preview */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div 
              className={`w-1.5 h-1.5 rounded-full ${theme.effects.animations ? 'animate-pulse' : ''}`}
              style={{ backgroundColor: theme.colors.accent }}
            ></div>
            <span style={{ fontFamily: theme.fonts.mono }} className="text-xs font-medium">LIVE</span>
          </div>
          <div className="flex items-center space-x-1" style={{ color: theme.colors.secondary }}>
            <Users className="w-2.5 h-2.5" />
            <span style={{ fontFamily: theme.fonts.mono }} className="text-xs">23</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center">
            <span className="text-gray-500 text-xs">♪</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 style={{ fontFamily: theme.fonts.mono }} className="text-xs font-medium truncate">
              Sample Track
            </h4>
            <p style={{ fontFamily: theme.fonts.mono, color: theme.colors.secondary }} className="text-xs truncate">
              Demo Artist
            </p>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mb-2">
          <div 
            className="w-full h-0.5 rounded-full"
            style={{ backgroundColor: theme.colors.progressBg }}
          >
            <div 
              className="h-0.5 rounded-full w-1/3"
              style={{ background: theme.colors.progressFill }}
            ></div>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-center space-x-2">
          <button
            className="flex items-center justify-center w-6 h-6 text-white rounded-full"
            style={{ 
              background: theme.colors.buttonBg,
              borderRadius: theme.effects.borderRadius,
            }}
          >
            {isPlaying ? (
              <Pause className="w-2.5 h-2.5" />
            ) : (
              <Play className="w-2.5 h-2.5 ml-0.5" />
            )}
          </button>
          
          <button
            className="flex items-center justify-center w-4 h-4"
            style={{ color: theme.colors.secondary }}
          >
            <SkipForward className="w-2.5 h-2.5" />
          </button>
          
          <div className="flex items-center space-x-1" style={{ color: theme.colors.secondary }}>
            <Volume2 className="w-2.5 h-2.5" />
            <div 
              className="w-8 rounded-full h-0.5"
              style={{ backgroundColor: theme.colors.progressBg }}
            >
              <div 
                className="h-0.5 rounded-full w-2/3"
                style={{ backgroundColor: theme.colors.secondary }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      <button
        onClick={() => onThemeSelect(theme.id)}
        className="w-full mt-3 px-3 py-2 bg-navy text-white rounded font-mono text-xs hover:bg-navy-dark transition-colors"
      >
        Apply Theme
      </button>
    </div>
  );
}

export function PlayerThemeDemo() {
  const [isPlaying, setIsPlaying] = useState(true);

  const handleThemeSelect = (themeId: string) => {
    // Save theme preference
    localStorage.setItem('enamorado-player-theme', themeId);
    
    // Show confirmation
    const themeDisplayName = defaultThemes.find(t => t.id === themeId)?.name || 'Unknown';
    alert(`Applied "${themeDisplayName}" theme! Refresh the page to see changes in the radio player.`);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-mono font-bold mb-2">Player Themes</h2>
        <p className="font-mono text-sm text-gray-600">
          Customize your radio player experience
        </p>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="mt-2 px-3 py-1 border border-gray-300 rounded font-mono text-xs hover:bg-gray-50"
        >
          {isPlaying ? 'Preview Paused' : 'Preview Playing'}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {defaultThemes.map((theme) => (
          <ThemePreview
            key={theme.id}
            theme={theme}
            isPlaying={isPlaying}
            onThemeSelect={handleThemeSelect}
          />
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-mono font-semibold text-sm mb-2">How to Use</h3>
        <ul className="font-mono text-xs text-gray-600 space-y-1">
          <li>• Click "Apply Theme" on any theme preview above</li>
          <li>• Your selection is saved automatically</li>
          <li>• Refresh the page to see changes in the top-right radio player</li>
          <li>• You can also change themes using the palette icon on the player</li>
        </ul>
      </div>
    </div>
  );
}