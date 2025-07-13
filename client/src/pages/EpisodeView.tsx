import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { EpisodePlayer } from '@/components/EpisodePlayer';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { Episode } from '@shared/schema';

export default function EpisodeView() {
  const [, params] = useRoute('/episode/:id');
  const episodeId = params?.id ? parseInt(params.id) : null;

  const { data: episode, isLoading, error } = useQuery<Episode>({
    queryKey: ['/api/episodes', episodeId],
    queryFn: async () => {
      if (!episodeId) throw new Error('Episode ID is required');
      const response = await fetch(`/api/episodes/${episodeId}`);
      if (!response.ok) throw new Error('Failed to fetch episode');
      return response.json();
    },
    enabled: !!episodeId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !episode) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Episode Not Found</h1>
          <p className="text-gray-400">The episode you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return <EpisodePlayer episode={episode} />;
}