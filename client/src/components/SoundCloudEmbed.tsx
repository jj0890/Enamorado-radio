import { useState, useEffect } from 'react';
import { getSoundCloudEmbedUrl } from '../utils/soundcloud';

interface SoundCloudEmbedProps {
  url: string;
  title?: string;
  artist?: string;
  height?: number;
  className?: string;
}

export function SoundCloudEmbed({ 
  url, 
  title, 
  artist, 
  height = 300,
  className = "" 
}: SoundCloudEmbedProps) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (url) {
      const embed = getSoundCloudEmbedUrl(url);
      setEmbedUrl(embed);
    }
  }, [url]);

  if (!embedUrl) {
    return (
      <div className={`${className} bg-gray-800 rounded-lg p-4 flex items-center justify-center`} style={{ height }}>
        <div className="text-white/60 text-center">
          <div className="text-sm">Unable to load SoundCloud embed</div>
          <div className="text-xs mt-1">Check the URL format</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} rounded-lg overflow-hidden`}>
      <iframe
        width="100%"
        height={height}
        scrolling="no"
        frameBorder="no"
        allow="autoplay"
        src={embedUrl}
        title={title ? `${title} by ${artist}` : "SoundCloud player"}
        className="w-full"
      />
    </div>
  );
}