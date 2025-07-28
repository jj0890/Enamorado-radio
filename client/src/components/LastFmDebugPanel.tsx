import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface TrackMetadata {
  filename: string;
  artist?: string;
  trackName?: string;
  album?: string;
  imageUrl?: string;
  lastfmUrl?: string;
  duration?: number;
  playcount?: number;
  listeners?: number;
  displayTitle: string;
}

interface LastFmDebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LastFmDebugPanel({ isOpen, onClose }: LastFmDebugPanelProps) {
  const [testFilename, setTestFilename] = useState('how did i do_1753594094475.mp3');
  const [testResults, setTestResults] = useState<any[]>([]);
  const queryClient = useQueryClient();

  // Test tracks for different scenarios
  const testTracks = [
    { name: 'Known DJ Mix', filename: 'how did i do_1753594094475.mp3' },
    { name: 'Popular Track', filename: 'bohemian rhapsody - queen.mp3' },
    { name: 'Hip-Hop Track', filename: 'jus know - partynextdoor.mp3' },
    { name: 'Electronic', filename: 'strobe - deadmau5.mp3' },
    { name: 'Unparseable', filename: 'random_mix_202501.mp3' }
  ];

  // Manual metadata test
  const testMetadata = useMutation({
    mutationFn: async (filename: string) => {
      console.log(`[debug] Testing Last.fm lookup for: ${filename}`);
      const response = await fetch(`/api/track-metadata/${encodeURIComponent(filename)}`);
      const data = await response.json();
      console.log(`[debug] Last.fm response:`, data);
      return { filename, ...data, timestamp: new Date().toISOString() };
    },
    onSuccess: (data) => {
      setTestResults(prev => [data, ...prev.slice(0, 9)]); // Keep last 10 results
    }
  });

  // Force refresh metadata
  const refreshMetadata = useMutation({
    mutationFn: async (filename: string) => {
      console.log(`[debug] Force refreshing metadata for: ${filename}`);
      const response = await fetch(`/api/track-metadata/${encodeURIComponent(filename)}/refresh`, {
        method: 'POST'
      });
      const data = await response.json();
      console.log(`[debug] Refreshed metadata:`, data);
      return { filename, ...data, timestamp: new Date().toISOString(), refreshed: true };
    },
    onSuccess: (data) => {
      setTestResults(prev => [data, ...prev.slice(0, 9)]);
      // Invalidate the cache for this track
      queryClient.invalidateQueries({ queryKey: ['track-metadata', data.filename] });
    }
  });

  const handleTest = (filename: string) => {
    testMetadata.mutate(filename);
  };

  const handleRefresh = (filename: string) => {
    refreshMetadata.mutate(filename);
  };

  const getStatusIcon = (result: any) => {
    if (result.artist && result.trackName) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else if (result.displayTitle && result.displayTitle !== result.filename) {
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    } else {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold font-mono text-red-500">LAST.FM API DEBUG PANEL</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Quick Tests */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Quick Tests</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {testTracks.map((track) => (
                <button
                  key={track.filename}
                  onClick={() => handleTest(track.filename)}
                  disabled={testMetadata.isPending}
                  className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <div className="font-medium text-sm">{track.name}</div>
                  <div className="text-xs text-gray-500 truncate">{track.filename}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Test */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Custom Test</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={testFilename}
                onChange={(e) => setTestFilename(e.target.value)}
                placeholder="Enter filename to test..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono"
              />
              <button
                onClick={() => handleTest(testFilename)}
                disabled={testMetadata.isPending || !testFilename.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm flex items-center gap-2 hover:bg-blue-600 disabled:opacity-50"
              >
                <Search className="w-4 h-4" />
                Test
              </button>
            </div>
          </div>

          {/* Test Results */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Test Results</h3>
            
            {testResults.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                No tests run yet. Click a test button above to start.
              </div>
            ) : (
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result)}
                        <span className="font-mono text-sm font-medium">{result.filename}</span>
                        {result.refreshed && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            REFRESHED
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{new Date(result.timestamp).toLocaleTimeString()}</span>
                        <button
                          onClick={() => handleRefresh(result.filename)}
                          disabled={refreshMetadata.isPending}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                          title="Force refresh metadata"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {result.artist && result.trackName ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-gray-800">Track Info</div>
                          <div className="text-sm text-gray-600">
                            <div><strong>Artist:</strong> {result.artist}</div>
                            <div><strong>Track:</strong> {result.trackName}</div>
                            {result.album && <div><strong>Album:</strong> {result.album}</div>}
                            <div><strong>Display:</strong> {result.displayTitle}</div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm font-medium text-gray-800">Last.fm Data</div>
                          <div className="text-sm text-gray-600">
                            {result.playcount && <div><strong>Plays:</strong> {result.playcount.toLocaleString()}</div>}
                            {result.listeners && <div><strong>Listeners:</strong> {result.listeners.toLocaleString()}</div>}
                            {result.duration && <div><strong>Duration:</strong> {result.duration}s</div>}
                            {result.lastfmUrl && (
                              <div>
                                <a href={result.lastfmUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                  View on Last.fm
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        No metadata found. Displaying filename: {result.displayTitle}
                      </div>
                    )}

                    {result.imageUrl && (
                      <div className="mt-3">
                        <img 
                          src={result.imageUrl} 
                          alt="Album artwork"
                          className="w-16 h-16 rounded object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="text-xs text-gray-500 font-mono">
            <div><strong>Status Indicators:</strong></div>
            <div className="flex items-center gap-4 mt-1">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Full metadata from Last.fm
              </span>
              <span className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-yellow-500" />
                Partial data or filename parsing
              </span>
              <span className="flex items-center gap-1">
                <XCircle className="w-3 h-3 text-red-500" />
                No metadata found
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}