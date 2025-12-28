import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { ArrowLeft, User, Instagram, ExternalLink, Music, ListMusic } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ContributorWithSubmissions {
  id: number;
  handle: string;
  displayName: string;
  email?: string;
  socialHandle?: string;
  bio?: string;
  avatarUrl?: string;
  createdAt?: string;
  submissions: {
    mixes: Array<{
      id: number;
      title: string;
      genre: string;
      artwork_url?: string;
      artUrl?: string;
      submittedAt?: string;
    }>;
    playlists: Array<{
      id: number;
      title: string;
      artworkUrl?: string;
      submittedAt?: string;
    }>;
    total: number;
  };
}

export default function ContributorProfile() {
  const [, params] = useRoute('/contributors/:handle');
  const handle = params?.handle;

  const { data: contributor, isLoading, error } = useQuery<ContributorWithSubmissions>({
    queryKey: ['/api/contributors', handle],
    queryFn: async () => {
      const response = await fetch(`/api/contributors/${handle}`);
      if (!response.ok) throw new Error('Contributor not found');
      return response.json();
    },
    enabled: !!handle,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream dark:bg-gray-950">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="flex items-center gap-6 mb-12">
              <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-800" />
              <div className="flex-1">
                <div className="h-8 bg-gray-200 dark:bg-gray-800 w-48 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-800 w-32" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-800" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !contributor) {
    return (
      <div className="min-h-screen bg-cream dark:bg-gray-950">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <h1 className="text-3xl font-serif text-gray-900 dark:text-white mb-4">
              Contributor Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              @{handle} hasn't submitted any content yet.
            </p>
            <Link href="/" className="text-navy dark:text-navy-light hover:underline" data-testid="link-back-home">
              Back to Home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const getArtwork = (item: any): string => {
    return item.artwork_url || item.artUrl || item.artworkUrl || '/placeholder-artwork.jpg';
  };

  const initials = contributor.displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-cream dark:bg-gray-950">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8" data-testid="link-back">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="flex flex-col md:flex-row gap-8 mb-12">
          <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-white dark:border-gray-800 shadow-lg">
            <AvatarImage src={contributor.avatarUrl} alt={contributor.displayName} />
            <AvatarFallback className="text-2xl bg-navy text-white dark:bg-navy-light dark:text-gray-900">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-serif text-gray-900 dark:text-white mb-2" data-testid="text-contributor-name">
              {contributor.displayName}
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-4" data-testid="text-contributor-handle">
              @{contributor.handle}
            </p>

            {contributor.bio && (
              <p className="text-gray-700 dark:text-gray-300 mb-4 max-w-2xl" data-testid="text-contributor-bio">
                {contributor.bio}
              </p>
            )}

            <div className="flex items-center gap-4">
              {contributor.socialHandle && (
                <a
                  href={`https://instagram.com/${contributor.socialHandle.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  data-testid="link-instagram"
                >
                  <Instagram className="w-5 h-5" />
                  <span>{contributor.socialHandle}</span>
                </a>
              )}
              <span className="text-sm text-gray-500 dark:text-gray-400" data-testid="text-submission-count">
                {contributor.submissions.total} contribution{contributor.submissions.total !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {contributor.submissions.total === 0 ? (
          <div className="text-center py-16 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <User className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No approved submissions yet.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {contributor.submissions.mixes.length > 0 && (
              <section>
                <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  <Music className="w-5 h-5" />
                  Mixes
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {contributor.submissions.mixes.map(mix => (
                    <Link key={mix.id} href={`/community/${mix.id}`} className="group block" data-testid={`card-mix-${mix.id}`}>
                      <div className="aspect-square bg-gray-200 dark:bg-gray-800 mb-2 overflow-hidden">
                        <img
                          src={getArtwork(mix)}
                          alt={mix.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-navy dark:group-hover:text-navy-light">
                        {mix.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {mix.genre}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {contributor.submissions.playlists.length > 0 && (
              <section>
                <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  <ListMusic className="w-5 h-5" />
                  Playlists
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {contributor.submissions.playlists.map(playlist => (
                    <Link key={playlist.id} href={`/community/${playlist.id}`} className="group block" data-testid={`card-playlist-${playlist.id}`}>
                      <div className="aspect-square bg-gray-200 dark:bg-gray-800 mb-2 overflow-hidden">
                        <img
                          src={getArtwork(playlist)}
                          alt={playlist.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-navy dark:group-hover:text-navy-light">
                        {playlist.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Playlist
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
