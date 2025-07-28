import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface TrackMetadata {
  filename: string;
  artist?: string;
  trackName?: string;
  album?: string;
  imageUrl?: string;
  lastfmUrl?: string;
  duration?: number;
  displayTitle: string;
}

interface FeaturedSubmission {
  id: number;
  djName: string;
  demoMixTitle: string;
  demoMixDescription: string;
  primaryGenre: string;
  showLength: number;
  soundcloudUrl?: string;
  mixcloudUrl?: string;
  audiocomUrl?: string;
  otherUrl?: string;
}

interface FeaturedMixCardProps {
  submission: FeaturedSubmission;
  thumbnail?: string;
}

export default function FeaturedMixCard({ submission, thumbnail }: FeaturedMixCardProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Use actual uploaded audio file if available
  const audioSrc = `/attached_assets/how did i do_1753594094475.mp3`;
  
  // Fetch track metadata
  const { data: trackMetadata } = useQuery<TrackMetadata>({
    queryKey: ['track-metadata', 'how did i do_1753594094475.mp3'],
    queryFn: async () => {
      const response = await fetch(`/api/track-metadata/${encodeURIComponent('how did i do_1753594094475.mp3')}`);
      if (!response.ok) throw new Error('Failed to fetch track metadata');
      return response.json();
    },
    staleTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      const current = audio.currentTime;
      const total = audio.duration;
      setProgress((current / total) * 100);
      setCurrentTime(current);
      setDuration(total);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', () => setDuration(audio.duration));
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    audio.currentTime = newTime;
    setProgress(parseFloat(e.target.value));
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Featured Mix Badge */}
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-2 text-red-500 text-sm font-mono font-medium">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          FEATURED MIX
        </span>
      </div>

      {/* Main Card */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Mix Artwork */}
        <div className="flex">
          <div className="w-48 h-48 bg-gray-100 flex-shrink-0">
            {thumbnail ? (
              <img 
                src={thumbnail} 
                alt={submission.demoMixTitle}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-gray-400 text-center">
                  <div className="text-4xl mb-2">🎵</div>
                  <div className="text-xs font-mono">{submission.primaryGenre}</div>
                </div>
              </div>
            )}
          </div>

          {/* Mix Info and Controls */}
          <div className="flex-1 p-6">
            <h1 className="text-2xl font-bold mb-2 font-mono text-gray-800">
              {submission.demoMixTitle || `New Mix (Mostly ${submission.primaryGenre})`}
            </h1>
            <p className="text-lg text-gray-600 mb-4 font-mono">{submission.djName}</p>
            
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              {submission.demoMixDescription || `High energy ${submission.primaryGenre.toLowerCase()} tracks for the dance floor`}
            </p>

            <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 font-mono">
              <span>{submission.primaryGenre}</span>
              <span>•</span>
              <span>{submission.showLength}min</span>
            </div>

            {/* Audio Controls */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={togglePlay}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors font-mono"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  {isPlaying ? 'Pause' : 'Play Mix'}
                </button>

                {submission.soundcloudUrl && (
                  <a
                    href={submission.soundcloudUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors font-mono"
                  >
                    Listen Live
                  </a>
                )}
              </div>

              {/* Progress Bar */}
              {duration > 0 && (
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={handleSeek}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${progress}%, #e5e7eb ${progress}%, #e5e7eb 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500 font-mono">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              )}

              {/* Volume Control */}
              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="text-gray-500 hover:text-gray-700">
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="metadata"
      />
    </div>
  );
}