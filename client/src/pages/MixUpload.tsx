import { useState } from 'react';
import { Link } from 'wouter';
import { Upload, Plus, X, Music, Clock, FileAudio, Tag, User, Info } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface TrackData {
  trackNumber: number;
  title: string;
  artist: string;
  startTime: number;
  endTime: number | null;
  label: string;
  year: number | null;
  genre: string;
  bpm: number | null;
  key: string;
  notes: string;
}

export default function MixUpload() {
  const [mixData, setMixData] = useState({
    title: '',
    artist: '',
    description: '',
    genre: '',
    duration: 0,
    fileUrl: '',
    artworkUrl: '',
    uploadedBy: 'admin', // This would come from auth context
  });

  const [tracks, setTracks] = useState<TrackData[]>([]);
  const [currentTrack, setCurrentTrack] = useState<TrackData>({
    trackNumber: 1,
    title: '',
    artist: '',
    startTime: 0,
    endTime: null,
    label: '',
    year: null,
    genre: '',
    bpm: null,
    key: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [step, setStep] = useState(1); // 1: Mix Info, 2: Tracklist, 3: Review

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMixMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/mix-uploads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mix-uploads'] });
      setShowSuccess(true);
      toast({
        title: "Mix Uploaded Successfully",
        description: "Your mix has been uploaded and is ready for review.",
      });
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your mix. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createTrackMutation = useMutation({
    mutationFn: async ({ mixId, track }: { mixId: number; track: TrackData }) => {
      return apiRequest(`/api/mix-uploads/${mixId}/tracklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(track),
      });
    },
  });

  const handleMixInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setMixData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTrackInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentTrack(prev => ({
      ...prev,
      [name]: name === 'trackNumber' || name === 'startTime' || name === 'endTime' || name === 'year' || name === 'bpm' 
        ? (value === '' ? null : parseInt(value))
        : value,
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'audio' | 'artwork') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'audio') {
      setAudioFile(file);
      // Create a temporary URL for the audio file
      const url = URL.createObjectURL(file);
      setMixData(prev => ({ ...prev, fileUrl: url }));
      
      // Get audio duration
      const audio = new Audio(url);
      audio.onloadedmetadata = () => {
        setMixData(prev => ({ ...prev, duration: Math.floor(audio.duration) }));
      };
    } else {
      setArtworkFile(file);
      const url = URL.createObjectURL(file);
      setMixData(prev => ({ ...prev, artworkUrl: url }));
    }
  };

  const addTrack = () => {
    if (!currentTrack.title || !currentTrack.artist) {
      toast({
        title: "Missing Information",
        description: "Please enter at least the track title and artist.",
        variant: "destructive",
      });
      return;
    }

    setTracks(prev => [...prev, { ...currentTrack }]);
    setCurrentTrack(prev => ({
      ...prev,
      trackNumber: prev.trackNumber + 1,
      title: '',
      artist: '',
      startTime: prev.endTime || prev.startTime + 180, // Default 3 minutes if no end time
      endTime: null,
      label: '',
      year: null,
      genre: '',
      bpm: null,
      key: '',
      notes: '',
    }));
  };

  const removeTrack = (index: number) => {
    setTracks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!mixData.title || !mixData.artist || !mixData.genre) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required mix information.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // First upload the mix
      const mixResult = await uploadMixMutation.mutateAsync(mixData);
      
      // Then upload all tracks
      for (const track of tracks) {
        await createTrackMutation.mutateAsync({
          mixId: mixResult.id,
          track,
        });
      }

      setShowSuccess(true);
      
      // Reset form after delay
      setTimeout(() => {
        setMixData({
          title: '',
          artist: '',
          description: '',
          genre: '',
          duration: 0,
          fileUrl: '',
          artworkUrl: '',
          uploadedBy: 'admin',
        });
        setTracks([]);
        setCurrentTrack({
          trackNumber: 1,
          title: '',
          artist: '',
          startTime: 0,
          endTime: null,
          label: '',
          year: null,
          genre: '',
          bpm: null,
          key: '',
          notes: '',
        });
        setStep(1);
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Music className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Mix Uploaded Successfully!</h2>
          <p className="text-gray-300 mb-6">Your mix and tracklist have been uploaded and are ready for review.</p>
          <Link
            href="/"
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-purple-400 hover:text-purple-300 mb-6 inline-flex items-center group transition-colors">
            <span className="text-lg group-hover:translate-x-[-4px] transition-transform">←</span>
            <span className="ml-2">Back to Home</span>
          </Link>
          
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Upload Your Mix
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Share your mix with detailed track information for the ultimate listening experience
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  stepNum === step ? 'bg-purple-500 text-white' : 
                  stepNum < step ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-12 h-1 mx-2 ${
                    stepNum < step ? 'bg-green-500' : 'bg-gray-600'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10">
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <Info className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Mix Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Mix Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={mixData.title}
                    onChange={handleMixInputChange}
                    placeholder="Enter mix title"
                    className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Artist/DJ Name *</label>
                  <input
                    type="text"
                    name="artist"
                    value={mixData.artist}
                    onChange={handleMixInputChange}
                    placeholder="Your artist name"
                    className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Genre *</label>
                  <select
                    name="genre"
                    value={mixData.genre}
                    onChange={handleMixInputChange}
                    className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white [&>option]:text-gray-900 [&>option]:bg-white"
                  >
                    <option value="" className="text-gray-900 bg-white">Select genre</option>
                    <option value="Electronic" className="text-gray-900 bg-white">Electronic</option>
                    <option value="Hip-Hop" className="text-gray-900 bg-white">Hip-Hop</option>
                    <option value="House" className="text-gray-900 bg-white">House</option>
                    <option value="Techno" className="text-gray-900 bg-white">Techno</option>
                    <option value="Ambient" className="text-gray-900 bg-white">Ambient</option>
                    <option value="Jazz" className="text-gray-900 bg-white">Jazz</option>
                    <option value="Footwork" className="text-gray-900 bg-white">Footwork</option>
                    <option value="Juke" className="text-gray-900 bg-white">Juke</option>
                    <option value="Other" className="text-gray-900 bg-white">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Audio File *</label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => handleFileUpload(e, 'audio')}
                    className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white file:text-white file:bg-purple-600 file:border-0 file:px-4 file:py-2 file:rounded file:mr-4"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Description</label>
                <textarea
                  name="description"
                  value={mixData.description}
                  onChange={handleMixInputChange}
                  placeholder="Describe your mix..."
                  rows={4}
                  className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Artwork</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'artwork')}
                  className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white file:text-white file:bg-purple-600 file:border-0 file:px-4 file:py-2 file:rounded file:mr-4"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!mixData.title || !mixData.artist || !mixData.genre}
                  className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Next: Add Tracklist
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <Music className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Tracklist</h2>
              </div>

              {/* Add Track Form */}
              <div className="bg-black/20 rounded-lg p-6 border border-white/10">
                <h3 className="text-lg font-semibold mb-4">Add Track #{currentTrack.trackNumber}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Track Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={currentTrack.title}
                      onChange={handleTrackInputChange}
                      placeholder="Track title"
                      className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder:text-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Artist *</label>
                    <input
                      type="text"
                      name="artist"
                      value={currentTrack.artist}
                      onChange={handleTrackInputChange}
                      placeholder="Artist name"
                      className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder:text-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Start Time (seconds) *</label>
                    <input
                      type="number"
                      name="startTime"
                      value={currentTrack.startTime}
                      onChange={handleTrackInputChange}
                      className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder:text-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">End Time (seconds)</label>
                    <input
                      type="number"
                      name="endTime"
                      value={currentTrack.endTime || ''}
                      onChange={handleTrackInputChange}
                      className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder:text-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Label</label>
                    <input
                      type="text"
                      name="label"
                      value={currentTrack.label}
                      onChange={handleTrackInputChange}
                      placeholder="Record label"
                      className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder:text-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Year</label>
                    <input
                      type="number"
                      name="year"
                      value={currentTrack.year || ''}
                      onChange={handleTrackInputChange}
                      className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder:text-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">BPM</label>
                    <input
                      type="number"
                      name="bpm"
                      value={currentTrack.bpm || ''}
                      onChange={handleTrackInputChange}
                      className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder:text-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Key</label>
                    <input
                      type="text"
                      name="key"
                      value={currentTrack.key}
                      onChange={handleTrackInputChange}
                      placeholder="Musical key"
                      className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Notes</label>
                  <textarea
                    name="notes"
                    value={currentTrack.notes}
                    onChange={handleTrackInputChange}
                    placeholder="Any additional notes about this track..."
                    rows={2}
                    className="w-full px-3 py-2 bg-black/20 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                  />
                </div>

                <button
                  onClick={addTrack}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Track
                </button>
              </div>

              {/* Track List */}
              {tracks.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Tracks ({tracks.length})</h3>
                  {tracks.map((track, index) => (
                    <div key={index} className="bg-black/20 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <span className="text-gray-400 font-mono">{track.trackNumber}</span>
                            <div>
                              <h4 className="font-semibold">{track.title}</h4>
                              <p className="text-gray-400">{track.artist}</p>
                            </div>
                            <div className="ml-auto flex items-center gap-4 text-sm text-gray-400">
                              <span>{formatTime(track.startTime)}</span>
                              {track.endTime && <span>→ {formatTime(track.endTime)}</span>}
                              {track.label && <span>• {track.label}</span>}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeTrack(index)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Review & Upload
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Review & Upload</h2>
              </div>

              {/* Mix Summary */}
              <div className="bg-black/20 rounded-lg p-6 border border-white/10">
                <h3 className="text-lg font-semibold mb-4">Mix Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400">Title:</span>
                    <span className="ml-2 font-semibold">{mixData.title}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Artist:</span>
                    <span className="ml-2 font-semibold">{mixData.artist}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Genre:</span>
                    <span className="ml-2 font-semibold">{mixData.genre}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Duration:</span>
                    <span className="ml-2 font-semibold">{formatTime(mixData.duration)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Tracks:</span>
                    <span className="ml-2 font-semibold">{tracks.length}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload Mix
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}