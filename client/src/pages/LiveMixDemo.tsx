import { useState } from 'react';
import { Link } from 'wouter';
import { Play, Upload, Music, ArrowLeft } from 'lucide-react';
import LiveMixPlayer from '@/components/LiveMixPlayer';

export default function LiveMixDemo() {
  const [selectedMixId, setSelectedMixId] = useState<number | null>(null);

  // Sample mix data for demonstration
  const sampleMixes = [
    {
      id: 1,
      title: "Footwork Sessions Vol. 1",
      artist: "Jarrad",
      genre: "Electronic",
      duration: 2700, // 45 minutes
      description: "High energy footwork and juke tracks for the dance floor"
    },
    {
      id: 2,
      title: "Midnight Frequencies",
      artist: "Luna Park",
      genre: "Ambient",
      duration: 3600, // 60 minutes  
      description: "A journey through ambient soundscapes for late night listening"
    }
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-purple-400 hover:text-purple-300 mb-6 inline-flex items-center group transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:translate-x-[-4px] transition-transform" />
            Back to Home
          </Link>
          
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Live Mix Player Demo
          </h1>
          <p className="text-gray-300 max-w-2xl">
            Experience the future of radio with our custom audio player featuring real-time track information, 
            NTS-inspired design, and seamless playback controls.
          </p>
        </div>

        {/* Upload Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-2">Upload Your Mix</h2>
                <p className="text-gray-300">
                  Ready to share your mix with detailed track information? Upload your MP3 and create a professional listening experience.
                </p>
              </div>
              <Link
                href="/mix-upload"
                className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Mix
              </Link>
            </div>
          </div>
        </div>

        {/* Mix Selection */}
        {!selectedMixId && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Choose a Mix to Play</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sampleMixes.map((mix) => (
                <div
                  key={mix.id}
                  className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedMixId(mix.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Music className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">{mix.title}</h3>
                      <p className="text-gray-400 mb-2">{mix.artist}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{mix.genre}</span>
                        <span>•</span>
                        <span>{formatTime(mix.duration)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center w-12 h-12 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                      <Play className="w-6 h-6 text-white ml-1" />
                    </div>
                  </div>
                  <p className="text-gray-300 mt-4 text-sm">{mix.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Mix Player */}
        {selectedMixId && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Now Playing</h2>
              <button
                onClick={() => setSelectedMixId(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Choose Different Mix
              </button>
            </div>
            
            <LiveMixPlayer
              mixId={selectedMixId}
              autoPlay={true}
              className="mb-6"
            />
          </div>
        )}

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
              <Music className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Real-Time Track Info</h3>
            <p className="text-gray-400 text-sm">
              See exactly what track is playing with detailed metadata including artist, label, BPM, and key information.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
              <Play className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Seamless Playback</h3>
            <p className="text-gray-400 text-sm">
              Professional audio controls with seek, volume, and playback speed controls inspired by modern music platforms.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Easy Upload</h3>
            <p className="text-gray-400 text-sm">
              Upload your MP3 mixes with detailed track listings to create an immersive listening experience for your audience.
            </p>
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
          <h3 className="text-lg font-semibold mb-4">How It Works</h3>
          <div className="space-y-3 text-gray-300">
            <p>
              <strong>1. Upload Your Mix:</strong> Upload your MP3 file along with detailed track information including start times, artist names, and metadata.
            </p>
            <p>
              <strong>2. Real-Time Sync:</strong> The player automatically detects which track is playing based on the current playback time and displays relevant information.
            </p>
            <p>
              <strong>3. Professional Experience:</strong> Listeners get a radio-quality experience with track information, controls, and beautiful visuals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}