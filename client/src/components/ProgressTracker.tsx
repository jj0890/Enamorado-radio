import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Music, Check, AlertCircle, Loader2 } from 'lucide-react';

interface ProgressData {
  mixId: number;
  stage: 'initializing' | 'downloading' | 'converting' | 'tagging' | 'complete' | 'error';
  progress: number;
  speed?: string;
  eta?: string;
  totalSize?: string;
  elapsed?: string;
  message: string;
}

interface ProgressTrackerProps {
  mixId: number;
  mixTitle: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export default function ProgressTracker({ mixId, mixTitle, onComplete, onError }: ProgressTrackerProps) {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Connect to WebSocket for real-time progress updates
    const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`);

    ws.onopen = () => {
      console.log('🔗 Connected to progress WebSocket');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'audioProgress' && message.data.mixId === mixId) {
          console.log('📊 Progress update:', message.data);
          setProgressData(message.data);
          setIsActive(true);

          // Handle completion
          if (message.data.stage === 'complete') {
            setTimeout(() => {
              setIsActive(false);
              onComplete?.();
            }, 2000); // Show completion for 2 seconds
          }

          // Handle errors
          if (message.data.stage === 'error') {
            setTimeout(() => {
              setIsActive(false);
              onError?.(message.data.message);
            }, 3000); // Show error for 3 seconds
          }
        }
      } catch (error) {
        console.error('❌ Failed to parse progress message:', error);
      }
    };

    ws.onclose = () => {
      console.log('🔌 Progress WebSocket disconnected');
    };

    ws.onerror = (error) => {
      console.error('❌ Progress WebSocket error:', error);
      // Retry connection after a short delay
      setTimeout(() => {
        console.log('🔄 Retrying WebSocket connection...');
        // The useEffect cleanup will close the old connection
        // and a new one will be established on re-render
      }, 1000);
    };

    return () => {
      ws.close();
    };
  }, [mixId, onComplete, onError]);

  if (!isActive || !progressData) {
    return null;
  }

  const getStageIcon = () => {
    switch (progressData.stage) {
      case 'initializing':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'downloading':
        return <Download className="w-4 h-4 text-blue-500 animate-bounce" />;
      case 'converting':
        return <Music className="w-4 h-4 text-purple-500 animate-pulse" />;
      case 'tagging':
        return <Music className="w-4 h-4 text-green-500" />;
      case 'complete':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Loader2 className="w-4 h-4 animate-spin" />;
    }
  };

  const getStageColor = () => {
    switch (progressData.stage) {
      case 'complete':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getProgressColor = () => {
    switch (progressData.stage) {
      case 'complete':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <Card className={`w-full max-w-md mx-auto ${getStageColor()}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {getStageIcon()}
          Processing: {mixTitle}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium capitalize">{progressData.stage}</span>
            <span className="font-mono">{progressData.progress}%</span>
          </div>
          <Progress 
            value={progressData.progress} 
            className="h-2"
            style={{
              '--progress-background': getProgressColor()
            } as any}
          />
        </div>

        {/* Status Message */}
        <div className="text-sm text-gray-700">
          {progressData.message}
        </div>

        {/* Download Stats */}
        {progressData.stage === 'downloading' && (
          <div className="grid grid-cols-2 gap-4 text-xs">
            {progressData.speed && (
              <div>
                <span className="text-gray-500">Speed:</span>
                <div className="font-mono font-medium">{progressData.speed}</div>
              </div>
            )}
            {progressData.eta && (
              <div>
                <span className="text-gray-500">ETA:</span>
                <div className="font-mono font-medium">{progressData.eta}</div>
              </div>
            )}
            {progressData.totalSize && (
              <div>
                <span className="text-gray-500">Size:</span>
                <div className="font-mono font-medium">{progressData.totalSize}</div>
              </div>
            )}
            {progressData.elapsed && (
              <div>
                <span className="text-gray-500">Elapsed:</span>
                <div className="font-mono font-medium">{progressData.elapsed}</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}