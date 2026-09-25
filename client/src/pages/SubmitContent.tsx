/**
 * Unified Submission Form
 * One form, every content type: mix, playlist, track suggestion, writing, artwork, article.
 * Mixes → /api/mixes (mix_submissions table, can go on air)
 * Everything else → /api/community-submissions (magazine_submissions table)
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { detectPlaylistPlatform, getPlatformDisplayName } from '@/lib/embed-utils';
import { PlatformIcon } from '@/components/PlatformIcon';
import {
  Disc,
  ListMusic,
  Music,
  PenLine,
  ImageIcon,
  BookOpen,
  CheckCircle2,
  ArrowLeft,
  ChevronRight,
  Radio,
} from 'lucide-react';

// ─── Content types ────────────────────────────────────────────────────────────

type ContentKind =
  | 'mix'
  | 'playlist'
  | 'track'
  | 'writing'
  | 'artwork'
  | 'article';

interface KindMeta {
  label: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const KINDS: Record<ContentKind, KindMeta> = {
  mix: {
    label: 'Mix / DJ Set',
    tagline: 'SoundCloud, Mixcloud, or file upload — can go on air',
    icon: Disc,
    badge: 'For the air',
  },
  playlist: {
    label: 'Playlist',
    tagline: 'Spotify, Apple Music, or YouTube — for discovery',
    icon: ListMusic,
    badge: 'Community pick',
  },
  track: {
    label: 'Track Suggestion',
    tagline: 'Recommend a single song — any platform',
    icon: Music,
  },
  writing: {
    label: 'Writing / Poetry',
    tagline: 'Share words — paste or link an external piece',
    icon: PenLine,
  },
  artwork: {
    label: 'Artwork / Photo',
    tagline: 'Visual work — image URL or portfolio link',
    icon: ImageIcon,
  },
  article: {
    label: 'Article / Essay',
    tagline: 'Long-form writing — paste or link',
    icon: BookOpen,
  },
};

const KIND_ORDER: ContentKind[] = ['mix', 'playlist', 'track', 'writing', 'artwork', 'article'];

function extractNinaSlug(url: string): string | null {
  if (!url.includes('ninaprotocol.com')) return null;
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    return parts[parts.length - 1] || null;
  } catch {
    return null;
  }
}

const GENRES = [
  'House', 'Techno', 'Hip Hop', 'Jazz', 'Funk', 'Soul', 'Disco',
  'Ambient', 'Experimental', 'Electronic', 'Indie', 'Rock',
  'R&B', 'Latin', 'World', 'Classical', 'Folk', 'Other',
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function SubmitContent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<'pick' | 'form'>('pick');
  const [kind, setKind] = useState<ContentKind | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Shared fields
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [externalUrl, setExternalUrl] = useState('');

  // Mix-specific
  const [genre, setGenre] = useState('');
  const [artUrl, setArtUrl] = useState('');

  // Writing / article
  const [body, setBody] = useState('');

  // Nina Protocol import
  const [ninaStatus, setNinaStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');

  useEffect(() => {
    const slug = extractNinaSlug(externalUrl);
    if (!slug) { setNinaStatus('idle'); return; }
    setNinaStatus('loading');
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://services.ninaprotocol.com/v1/releases/${slug}`);
        if (!res.ok) throw new Error('not found');
        const data = await res.json();
        const meta = data.release?.metadata ?? data.metadata ?? {};
        if (meta.name && !title) setTitle(meta.name);
        if (meta.description && !description) setDescription(meta.description);
        if (meta.image && !artUrl) setArtUrl(meta.image);
        const tags: string[] = meta.properties?.tags ?? [];
        if (tags.length && !genre) {
          const match = GENRES.find(g =>
            tags.some((t) => t.toLowerCase() === g.toLowerCase())
          );
          if (match) setGenre(match.toLowerCase());
        }
        setNinaStatus('ok');
      } catch {
        setNinaStatus('err');
      }
    }, 600);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalUrl]);

  // Detected platform from URL
  const detectedPlatformKey = externalUrl ? detectPlaylistPlatform(externalUrl) : null;
  const detectedPlatform = detectedPlatformKey
    ? getPlatformDisplayName(detectedPlatformKey)
    : null;

  // ── Mutation ─────────────────────────────────────────────────────────────

  const mutation = useMutation({
    mutationFn: async () => {
      if (kind === 'mix') {
        const res = await fetch('/api/mixes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, title, genre, about: description, url: externalUrl, artUrl }),
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Submission failed');
        return res.json();
      }

      // All other types → magazine_submissions
      const res = await fetch('/api/community-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          title,
          description: kind === 'writing' || kind === 'article' ? body || description : description,
          externalUrl: externalUrl || undefined,
          authorName: name,
          genre: genre || undefined,
          coverImageUrl: artUrl || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Submission failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mixes'] });
      setSubmitted(true);
      toast({ title: 'Submitted!', description: 'We\'ll review your submission soon.' });
    },
    onError: (err) => {
      toast({
        title: 'Submission failed',
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  // ── Validation ───────────────────────────────────────────────────────────

  const validate = (): string | null => {
    if (!name.trim()) return 'Please enter your name or handle.';
    if (!title.trim()) return 'Please enter a title.';
    if (kind === 'mix') {
      if (!externalUrl.trim()) return 'Please enter a SoundCloud or Mixcloud URL for your mix.';
      if (!genre) return 'Please select a genre.';
    }
    if (kind === 'playlist' || kind === 'track') {
      if (!externalUrl.trim()) return 'Please enter a URL.';
    }
    if ((kind === 'writing' || kind === 'article') && !body.trim() && !externalUrl.trim()) {
      return 'Please paste your text or provide an external link.';
    }
    if (kind === 'artwork' && !externalUrl.trim() && !artUrl.trim()) {
      return 'Please provide an image URL or link to your work.';
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast({ title: 'Missing info', description: err, variant: 'destructive' });
      return;
    }
    mutation.mutate();
  };

  // ── Success screen ────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
          <CheckCircle2 className="w-16 h-16 text-olive mb-6" />
          <h1 className="font-display font-black uppercase text-foreground text-4xl mb-3">
            We got it
          </h1>
          <p className="font-mono text-sm text-ink-muted max-w-sm mb-8">
            Your{' '}
            <span className="text-foreground">{kind ? KINDS[kind].label.toLowerCase() : 'submission'}</span>{' '}
            is in the queue. We review everything and will follow up if we feature it.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => { setSubmitted(false); setStep('pick'); setKind(null); setName(''); setTitle(''); setDescription(''); setExternalUrl(''); setGenre(''); setArtUrl(''); setBody(''); setNinaStatus('idle'); }}
            >
              Submit another
            </Button>
            <Button onClick={() => setLocation('/community')} className="bg-olive hover:bg-olive/90 text-white">
              See community
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 1: Type picker ───────────────────────────────────────────────────

  if (step === 'pick') {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />

        <main className="max-w-4xl mx-auto px-4 py-14">
          {/* Header */}
          <div className="mb-12 text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-ink-muted mb-3">
              Community submissions
            </p>
            <h1
              className="font-display font-black uppercase text-foreground leading-none"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}
            >
              What are you sharing?
            </h1>
            <p className="font-body text-ink-muted mt-4 max-w-md mx-auto text-sm">
              Mixes, playlists, tracks, writing, art — all welcome.
              Pick a type and we'll ask for the right details.
            </p>
          </div>

          {/* Kind cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {KIND_ORDER.map((k) => {
              const meta = KINDS[k];
              const Icon = meta.icon;
              return (
                <button
                  key={k}
                  onClick={() => { setKind(k); setStep('form'); }}
                  className="group text-left border border-paper-border hover:border-foreground p-6 transition-all duration-150"
                >
                  <div className="flex items-start justify-between mb-5">
                    <Icon className="w-5 h-5 text-ink-muted group-hover:text-foreground transition-colors" />
                    {meta.badge && (
                      <span className="font-mono text-[10px] uppercase tracking-widest text-ink-faint">
                        {meta.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-black uppercase text-foreground text-lg mb-1">
                    {meta.label}
                  </h3>
                  <p className="font-body text-xs text-ink-muted leading-relaxed">
                    {meta.tagline}
                  </p>
                  <div className="mt-4 flex items-center gap-1 font-mono text-xs text-ink-faint group-hover:text-foreground transition-colors">
                    Continue <ChevronRight className="w-3 h-3" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Also: apply to be a resident */}
          <div className="mt-10 border border-paper-border p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Radio className="w-5 h-5 text-ink-muted shrink-0" />
            <div className="flex-1">
              <p className="font-display font-700 uppercase text-foreground text-sm">
                Want to host your own show?
              </p>
              <p className="font-body text-xs text-ink-muted mt-0.5">
                Apply to become a resident DJ and get a recurring slot on Enamorado Radio.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="font-mono text-xs uppercase tracking-widest shrink-0"
              onClick={() => { window.location.href = '/resident-application'; }}
            >
              Apply
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // ── Step 2: Form ──────────────────────────────────────────────────────────

  if (!kind) return null;
  const meta = KINDS[kind];
  const Icon = meta.icon;

  const urlLabel: Record<ContentKind, string> = {
    mix: 'SoundCloud or Mixcloud URL',
    playlist: 'Playlist URL (Spotify, Apple Music, YouTube)',
    track: 'Track URL (any platform)',
    writing: 'External link (optional)',
    artwork: 'Image URL or portfolio link',
    article: 'External link (optional)',
  };

  const urlPlaceholder: Record<ContentKind, string> = {
    mix: 'https://soundcloud.com/your-mix',
    playlist: 'https://open.spotify.com/playlist/...',
    track: 'https://open.spotify.com/track/...',
    writing: 'https://your-publication.com/piece',
    artwork: 'https://your-portfolio.com or direct image URL',
    article: 'https://your-blog.com/article',
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Back + type label */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setStep('pick')}
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-ink-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> All types
          </button>
          <div className="flex items-center gap-2">
            <Icon className="w-3.5 h-3.5 text-ink-muted" />
            <span className="font-mono text-xs uppercase tracking-widest text-ink-muted">
              {meta.label}
            </span>
          </div>
        </div>

        {/* Form heading */}
        <h1
          className="font-display font-black uppercase text-foreground leading-none mb-8"
          style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}
        >
          {kind === 'mix' ? 'Submit your mix' :
           kind === 'playlist' ? 'Share a playlist' :
           kind === 'track' ? 'Recommend a track' :
           kind === 'writing' ? 'Share your writing' :
           kind === 'artwork' ? 'Share your artwork' :
           'Submit an article'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name / handle */}
          <div>
            <Label className="font-mono text-xs uppercase tracking-widest text-ink-muted mb-2 block">
              Your name or handle *
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. DJ Shadow or @djshadow"
              className="font-body"
              required
            />
          </div>

          {/* Title */}
          <div>
            <Label className="font-mono text-xs uppercase tracking-widest text-ink-muted mb-2 block">
              {kind === 'track' ? 'Song title *' :
               kind === 'artwork' ? 'Title or series *' :
               'Title *'}
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                kind === 'mix' ? 'Late Night Vibes Vol. 1' :
                kind === 'playlist' ? 'My playlist title' :
                kind === 'track' ? 'Artist – Song name' :
                kind === 'writing' || kind === 'article' ? 'Piece title' :
                'Work title'
              }
              className="font-body"
              required
            />
          </div>

          {/* Genre — mix only */}
          {kind === 'mix' && (
            <div>
              <Label className="font-mono text-xs uppercase tracking-widest text-ink-muted mb-2 block">
                Genre *
              </Label>
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger className="font-body">
                  <SelectValue placeholder="Select a genre" />
                </SelectTrigger>
                <SelectContent>
                  {GENRES.map((g) => (
                    <SelectItem key={g} value={g.toLowerCase()}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* URL — mix, playlist, track, artwork, or optional for writing/article */}
          {(kind !== 'writing' && kind !== 'article') || true ? (
            <div>
              <Label className="font-mono text-xs uppercase tracking-widest text-ink-muted mb-2 block">
                {urlLabel[kind]}{kind === 'mix' || kind === 'playlist' || kind === 'track' ? ' *' : ''}
              </Label>
              <Input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder={urlPlaceholder[kind]}
                className="font-body"
                required={kind === 'mix' || kind === 'playlist' || kind === 'track' || kind === 'artwork'}
              />
              {ninaStatus === 'loading' && (
                <p className="mt-1.5 font-mono text-xs text-ink-faint">
                  Fetching from Nina Protocol...
                </p>
              )}
              {ninaStatus === 'ok' && (
                <p className="mt-1.5 font-mono text-xs text-olive">
                  Imported from Nina Protocol — fields pre-filled below
                </p>
              )}
              {ninaStatus === 'err' && (
                <p className="mt-1.5 font-mono text-xs text-ink-faint">
                  Nina release not found — fill in fields manually
                </p>
              )}
              {ninaStatus === 'idle' && externalUrl && detectedPlatform && detectedPlatform !== 'Link' && detectedPlatformKey && (
                <p className="mt-1.5 font-mono text-xs text-olive flex items-center gap-1.5">
                  <PlatformIcon platform={detectedPlatformKey} size={12} branded />
                  {detectedPlatform}
                </p>
              )}
              {kind === 'mix' && (
                <p className="mt-1.5 font-mono text-xs text-ink-faint">
                  Mixes on SoundCloud or Mixcloud can be queued for airplay.
                </p>
              )}
              {kind === 'playlist' && (
                <p className="mt-1.5 font-mono text-xs text-ink-faint">
                  Playlists appear in the community feed. Spotify/Apple Music can't go to air due to licensing — submit a mix for airplay.
                </p>
              )}
            </div>
          ) : null}

          {/* Body text — writing / article */}
          {(kind === 'writing' || kind === 'article') && (
            <div>
              <Label className="font-mono text-xs uppercase tracking-widest text-ink-muted mb-2 block">
                {kind === 'writing' ? 'Your text *' : 'Full text (or link above) *'}
              </Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={
                  kind === 'writing'
                    ? 'Paste your poem, essay, or prose here...'
                    : 'Paste the full article text, or provide a link above...'
                }
                rows={10}
                className="font-body resize-y"
              />
            </div>
          )}

          {/* Artwork URL — mix only (optional) */}
          {kind === 'mix' && (
            <div>
              <Label className="font-mono text-xs uppercase tracking-widest text-ink-muted mb-2 block">
                Artwork URL <span className="text-ink-faint">(optional)</span>
              </Label>
              <Input
                type="url"
                value={artUrl}
                onChange={(e) => setArtUrl(e.target.value)}
                placeholder="https://example.com/cover.jpg"
                className="font-body"
              />
              <p className="mt-1.5 font-mono text-xs text-ink-faint">
                SoundCloud / Mixcloud artwork is auto-fetched. Only needed for direct file uploads.
              </p>
            </div>
          )}

          {/* Description / note */}
          {kind !== 'writing' && kind !== 'article' && (
            <div>
              <Label className="font-mono text-xs uppercase tracking-widest text-ink-muted mb-2 block">
                {kind === 'track' ? 'Why this track?' : 'About'}{' '}
                <span className="text-ink-faint">(optional)</span>
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  kind === 'mix' ? 'Tell us about your mix — mood, inspiration, key tracks...' :
                  kind === 'playlist' ? 'What\'s the vibe? What\'s the story behind this playlist?' :
                  kind === 'track' ? 'Why should people hear this? Any context?' :
                  kind === 'artwork' ? 'Describe the work, process, or series...' :
                  ''
                }
                rows={4}
                className="font-body resize-none"
              />
            </div>
          )}

          {/* Submit */}
          <div className="pt-2 flex items-center justify-between">
            <p className="font-mono text-xs text-ink-faint">
              Reviewed by the Enamorado team
            </p>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-foreground hover:bg-olive text-background font-mono text-xs uppercase tracking-widest px-8 transition-colors"
            >
              {mutation.isPending ? 'Sending...' : 'Submit'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
