import { useQuery } from '@tanstack/react-query';
import { useRoute, Link } from 'wouter';
import Navigation from '@/components/Navigation';
import { ExternalLink } from 'lucide-react';

interface PublicProfile {
  user: { id: number; handle: string; displayName: string; role: string; createdAt: string };
  profile: { bio?: string; avatarUrl?: string; links?: Array<{ label: string; url: string }>; isPublic: boolean } | null;
  albums: Array<{ rank: number; mbId: string; title: string; artist: string; year?: string; coverUrl?: string }>;
  contributions: Array<{ id: number; type: string; title: string; url?: string; publishedAt?: string }>;
}

const GRID_SIZE = 5;

export default function ProfilePage() {
  const [, params] = useRoute('/profile/:handle');
  const handle = params?.handle?.replace(/^@/, '');

  const { data, isLoading, error } = useQuery<PublicProfile>({
    queryKey: ['/api/profiles/public', handle],
    queryFn: async () => {
      const res = await fetch(`/api/profiles/public/${handle}`, { credentials: 'include' });
      if (!res.ok) throw new Error('not found');
      return res.json();
    },
    enabled: !!handle,
    refetchOnWindowFocus: false,
  });

  if (isLoading) return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navigation />
      <div className="max-w-site mx-auto px-6 pt-24 pb-20">
        <div className="animate-pulse">
          <div className="h-6 w-40 bg-white/10 mb-3" />
          <div className="h-3 w-24 bg-white/5" />
          <div className="mt-12 grid grid-cols-5 gap-2" style={{ maxWidth: 600 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="aspect-square bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navigation />
      <div className="max-w-site mx-auto px-6 pt-24">
        <p className="font-mono text-[11px] uppercase tracking-widest text-white/30">Profile not found</p>
      </div>
    </div>
  );

  const { user, profile, albums, contributions } = data;
  const sortedAlbums = [...albums].sort((a, b) => a.rank - b.rank);
  const slots = Array.from({ length: GRID_SIZE }, (_, i) => sortedAlbums.find(a => a.rank === i + 1) ?? null);
  const hasAlbums = sortedAlbums.length > 0;
  const hasWork = contributions.length > 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a]" style={{ color: '#e8e6e1' }}>
      <Navigation />

      <main className="max-w-site mx-auto px-6 sm:px-10 lg:px-16" style={{ paddingTop: 'clamp(5rem, 10vw, 8rem)', paddingBottom: 'clamp(4rem, 8vw, 7rem)' }}>

        {/* Identity header */}
        <header className="flex items-start gap-6 mb-16">
          {profile?.avatarUrl && profile.avatarUrl.includes('avatar_') && (
            <img src={profile.avatarUrl} alt={user.displayName}
              className="w-16 h-16 rounded-full object-cover flex-shrink-0 ring-1 ring-white/10" />
          )}
          <div>
            <h1 className="font-display font-black uppercase text-3xl sm:text-4xl leading-none tracking-tight"
              style={{ letterSpacing: '-0.01em' }}>
              {user.displayName}
            </h1>
            <p className="font-mono text-[11px] tracking-widest text-white/30 mt-1.5">@{user.handle}</p>
            {profile?.bio && (
              <p className="mt-4 text-[15px] leading-relaxed text-white/60 max-w-prose" style={{ fontFamily: "'EB Garamond', serif" }}>
                {profile.bio}
              </p>
            )}
            {profile?.links && (profile.links as Array<{ label: string; url: string }>).length > 0 && (
              <div className="flex flex-wrap gap-4 mt-4">
                {(profile.links as Array<{ label: string; url: string }>).map((l, i) => (
                  <a key={i} href={l.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-white/30 hover:text-white/70 transition-colors">
                    {l.label} <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Album grid — the identity */}
        {hasAlbums && (
          <section className="mb-20">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/20 mb-6">
              5 albums that made me
            </p>
            <div
              className="grid grid-cols-5 gap-1"
              style={{ maxWidth: 'min(600px, 100%)' }}
            >
              {slots.map((album, i) => (
                <div key={i} className="relative aspect-square bg-[#141414] group overflow-hidden">
                  {album ? (
                    <>
                      {album.coverUrl
                        ? <img src={album.coverUrl} alt={`${album.title} by ${album.artist}`}
                            className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center px-2">
                              <p className="font-mono text-[10px] text-white/60 leading-tight">{album.title}</p>
                              <p className="font-mono text-[9px] text-white/30 mt-1">{album.artist}</p>
                            </div>
                          </div>
                      }
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-200 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100">
                        <p className="font-mono text-[10px] text-white leading-tight truncate">{album.title}</p>
                        <p className="font-mono text-[9px] text-white/50 truncate">{album.artist}{album.year ? ` · ${album.year}` : ''}</p>
                      </div>
                      {/* Rank number */}
                      <span className="absolute top-2 left-2.5 font-mono text-[9px] text-white/30 group-hover:text-white/70 transition-colors">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </>
                  ) : (
                    <span className="absolute top-2 left-2.5 font-mono text-[9px] text-white/10">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Work */}
        {hasWork && (
          <section>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/20 mb-6">
              Work
            </p>
            <div className="divide-y divide-white/[0.06]">
              {contributions.map(c => (
                <div key={c.id} className="flex items-baseline gap-4 py-4">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-white/20 flex-shrink-0 w-20">
                    {c.type}
                  </span>
                  {c.url
                    ? <a href={c.url} target="_blank" rel="noreferrer"
                        className="flex-1 font-mono text-sm text-white/70 hover:text-white transition-colors truncate">
                        {c.title}
                      </a>
                    : <span className="flex-1 font-mono text-sm text-white/70 truncate">{c.title}</span>
                  }
                  {c.publishedAt && (
                    <span className="font-mono text-[10px] text-white/20 flex-shrink-0">
                      {new Date(c.publishedAt).getFullYear()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {!hasAlbums && !hasWork && (
          <p className="font-mono text-[11px] text-white/20">Nothing here yet.</p>
        )}
      </main>
    </div>
  );
}
