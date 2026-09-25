import { useEffect } from 'react';
import { AudioPlayer } from '@/components/AudioPlayer';
import { audioManager } from '@/lib/audioManager';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  // Initialize audio manager on mount
  useEffect(() => {
    audioManager.startAutoMode().catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-[#FEFCF9] dark:bg-gray-900">
      <div className="container mx-auto px-4 pb-24">
        {children}
      </div>
      
      {/* Fixed Audio Player */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50">
        <div className="container mx-auto px-4 py-3">
          <AudioPlayer />
        </div>
      </div>
    </div>
  );
}