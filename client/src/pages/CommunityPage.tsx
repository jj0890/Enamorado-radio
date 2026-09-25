/**
 * Community feed page.
 * Layout: editorial, Substack-inspired.
 *   – Hero card (first item, full-width horizontal)
 *   – 3-col grid for the rest
 *   – Submissions invite strip between sections
 *   – Chronological "Latest" list at the bottom
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';
import Navigation from '@/components/Navigation';
import ContentCard from '@/components/ContentCard';
import LatestContentList from '@/components/editorial/LatestContentList';
import { ContentItem } from '@shared/schema';

type ContentType = 'all' | 'mix' | 'episode' | 'playlist';

const FILTERS: { value: ContentType; label: string }[] = [
  { value: 'all',      label: 'All' },
  { value: 'mix',      label: 'Mixes' },
  { value: 'episode',  label: 'Episodes' },
  { value: 'playlist', label: 'Playlists' },
];

export default function CommunityPage() {
  const [activeFilter, setActiveFilter] = useState<ContentType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: allContent = [], isLoading } = useQuery<ContentItem[]>({
    queryKey: ['/api/community', activeFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({ type: activeFilter, limit: '48', sort: 'recent' });
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      const res = await fetch(`/api/community?${params}`);
      if (!res.ok) throw new Error('Failed to fetch community content');
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  const staffPicks = allContent.filter(item => item.isFeatured);
  const freshContent = allContent.filter(item => !item.isFeatured);
  const isSearching = searchQuery.trim().length > 0;

  // First fresh item gets the hero treatment; rest go into the grid
  const [heroItem, ...gridItems] = freshContent;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-5xl mx-auto px-4 py-12">

        {/* ── Page header ─────────────────────────────────────────── */}
        <div className="mb-10 border-b border-paper-border pb-8">
          <p className="font-mono text-xs uppercase tracking-widest text-ink-muted mb-2">
            Community
          </p>
          <h1
            className="font-display font-black uppercase text-foreground leading-none"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}
          >
            From the feed
          </h1>
          <p className="font-body text-sm text-ink-muted mt-3 max-w-lg">
            Mixes, playlists, writing, and art submitted by the community.
            Have something to share?{' '}
            <Link href="/submit" className="text-olive hover:underline">Add it here →</Link>
          </p>
        </div>

        {/* ── Filters + search ────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          {/* Type filters */}
          <div className="flex gap-0 border border-paper-border">
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setActiveFilter(value)}
                className={[
                  'px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors',
                  activeFilter === value
                    ? 'bg-foreground text-background'
                    : 'text-ink-muted hover:text-foreground',
                ].join(' ')}
                data-testid={`filter-${value}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-paper-border font-body text-sm text-foreground placeholder-ink-faint focus:outline-none focus:border-ink/40"
              data-testid="input-search"
            />
          </div>
        </div>

        {/* ── Loading skeleton ────────────────────────────────────── */}
        {isLoading && (
          <div className="space-y-8">
            <div className="h-64 bg-paper-cool animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[3/2] bg-paper-cool animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {/* ── Empty state ─────────────────────────────────────────── */}
        {!isLoading && allContent.length === 0 && (
          <div className="py-24 text-center border border-paper-border">
            <p className="font-display font-black uppercase text-foreground text-2xl mb-3">
              Nothing here yet
            </p>
            <p className="font-body text-sm text-ink-muted mb-6">
              {searchQuery ? 'Try different keywords or clear the filter.' : 'Be the first to share something.'}
            </p>
            <Link
              href="/submit"
              className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest bg-foreground text-background px-5 py-2 hover:bg-olive transition-colors"
            >
              Submit something <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* ── Search results ──────────────────────────────────────── */}
        {!isLoading && isSearching && allContent.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allContent.map(item => (
              <ContentCard key={`${item.type}-${item.id}`} content={item} />
            ))}
          </div>
        )}

        {/* ── Normal feed ─────────────────────────────────────────── */}
        {!isLoading && !isSearching && allContent.length > 0 && (
          <div className="space-y-14">

            {/* Staff Picks — only if present */}
            {staffPicks.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <span className="font-mono text-xs uppercase tracking-widest text-ink-muted">Staff picks</span>
                  <div className="flex-1 h-px bg-paper-border" />
                </div>
                {/* Hero for first staff pick */}
                {staffPicks[0] && (
                  <div className="mb-6">
                    <ContentCard content={staffPicks[0]} showFeaturedBadge hero />
                  </div>
                )}
                {staffPicks.length > 1 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {staffPicks.slice(1, 4).map(item => (
                      <ContentCard key={`${item.type}-${item.id}`} content={item} showFeaturedBadge />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Fresh from the community */}
            {freshContent.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <span className="font-mono text-xs uppercase tracking-widest text-ink-muted">
                    Fresh from the community
                  </span>
                  <div className="flex-1 h-px bg-paper-border" />
                </div>

                {/* Hero — first item */}
                {heroItem && (
                  <div className="mb-6">
                    <ContentCard content={heroItem} hero />
                  </div>
                )}

                {/* Grid — the rest */}
                {gridItems.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {gridItems.slice(0, 8).map(item => (
                      <ContentCard key={`${item.type}-${item.id}`} content={item} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* ── Submissions invite strip ─────────────────────── */}
            <div className="border border-paper-border bg-background">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-8">
                <div className="flex-1">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-ink-faint mb-2">
                    Open to all
                  </p>
                  <p
                    className="font-display font-black uppercase text-foreground leading-tight"
                    style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}
                  >
                    Share something with the feed
                  </p>
                  <p className="font-body text-sm text-ink-muted mt-2 max-w-md">
                    Mixes, playlists, a song you've been playing on repeat, a poem, artwork —
                    anything that feels like Enamorado. We review everything.
                  </p>
                </div>
                <Link
                  href="/submit"
                  className="shrink-0 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest bg-foreground text-background px-6 py-3 hover:bg-olive transition-colors"
                >
                  Submit <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* ── Latest chronological list ────────────────────── */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <span className="font-mono text-xs uppercase tracking-widest text-ink-muted">Latest</span>
                <div className="flex-1 h-px bg-paper-border" />
              </div>
              <LatestContentList
                limit={20}
                contentTypes={activeFilter === 'all' ? undefined : [activeFilter]}
              />
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
