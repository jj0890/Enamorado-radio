import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Music, ArrowRight, Pause, Play } from "lucide-react";
import { FeaturedMixCard } from "@/components/FeaturedMixCard";
import PublicMixCard from "@/components/PublicMixCard";
import ContentCard from "@/components/ContentCard";
import FeaturedHero from "@/components/FeaturedHero";
import Navigation from "@/components/Navigation";
import { useAudio } from "@/providers/AudioProvider";
import { getTrackThumbnail } from "@/utils/soundcloud";

interface NowPlayingData {
  now_playing?: { song?: { title?: string; artist?: string; art?: string } };
  live?: { is_live?: boolean; streamer_name?: string };
}

interface FeaturedSubmission {
  id: number;
  name: string;
  title: string;
  genre: string;
  about: string;
  url: string;
  artUrl?: string;
  metadata?: any;
  submittedAt: string;
  featureOnSite?: boolean;
}

const FILTER_OPTIONS = [
  { value: "all",      label: "All"      },
  { value: "mixes",    label: "Mixes"    },
  { value: "episodes", label: "Episodes" },
] as const;

type FilterValue = typeof FILTER_OPTIONS[number]["value"];

export default function Home() {
  const [trackThumbnails, setTrackThumbnails] = useState<Record<number, string>>({});
  const [contentFilter, setContentFilter] = useState<FilterValue>("all");

  const { state: audioState, actions: audioActions } = useAudio();
  const isPlaying = audioState.status === 'playing';

  const { data: nowPlaying } = useQuery<NowPlayingData>({
    queryKey: ['/api/nowplaying'],
    refetchInterval: 10000,
  });

  const isLive = nowPlaying?.live?.is_live ?? false;
  const streamerName = nowPlaying?.live?.streamer_name ?? '';
  const nowTitle = nowPlaying?.now_playing?.song?.title ?? '';
  const nowArtist = nowPlaying?.now_playing?.song?.artist ?? '';

  const heroTrackLine = isLive && streamerName
    ? streamerName
    : nowTitle && nowArtist
      ? `${nowTitle} — ${nowArtist}`
      : 'San Antonio · Live Stream';

  const handleHeroPlay = async () => {
    if (isPlaying) {
      audioActions.pause();
    } else {
      await audioActions.play('/stream.mp3', {
        title: isLive ? streamerName : nowTitle || 'Enamorado Radio',
        artist: isLive ? 'Live' : nowArtist,
        isLive,
      });
    }
  };

  const { data: featuredSubmissions = [] } = useQuery<FeaturedSubmission[]>({
    queryKey: ["/api/public/mixes/featured"],
  });

  const { data: freshMixes = [] } = useQuery({
    queryKey: ["/api/community", { type: "mix", limit: 12 }],
    queryFn: async () => {
      const r = await fetch("/api/community?type=mix&limit=12&sort=recent", { cache: "no-store" });
      if (!r.ok) throw new Error("Failed to fetch mixes");
      return r.json();
    },
    refetchOnWindowFocus: false,
  });

  const { data: freshPlaylists = [] } = useQuery({
    queryKey: ["/api/community", { type: "playlist", limit: 6 }],
    queryFn: async () => {
      const r = await fetch("/api/community?type=playlist&limit=6&sort=recent", { cache: "no-store" });
      if (!r.ok) throw new Error("Failed to fetch playlists");
      return r.json();
    },
    refetchOnWindowFocus: false,
  });

  const { data: allEpisodes = [] } = useQuery({
    queryKey: ["/api/episodes"],
    queryFn: async () => {
      const r = await fetch("/api/episodes");
      if (!r.ok) throw new Error("Failed to fetch episodes");
      const episodes = await r.json();
      return episodes.filter((e: any) => e.status === "published");
    },
    refetchOnWindowFocus: false,
  });

  const { data: upcomingShows = [] } = useQuery({
    queryKey: ["/api/schedule", { upcoming: true }],
    queryFn: async () => {
      const r = await fetch("/api/schedule?upcoming=true&limit=3");
      if (!r.ok) throw new Error("Failed to fetch schedule");
      return r.json();
    },
    refetchInterval: 60000,
  });

  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  };

  const { data: currentMonthPick } = useQuery({
    queryKey: ["/api/albums/published", getCurrentMonth()],
    queryFn: async () => {
      const r = await fetch(`/api/albums/published/${getCurrentMonth()}`);
      if (!r.ok) return null;
      return r.json();
    },
    refetchOnWindowFocus: false,
  });

  const blendedContent = useMemo(() => {
    const withType = (arr: any[], type: string) =>
      arr.map((item) => ({
        ...item,
        type,
        dateForSorting: new Date(item.submittedAt || item.airDate || item.date || 0).getTime(),
        isFeatured: item.featureOnSite || item.isFeatured || false,
      }));

    const combined = [
      ...withType(freshMixes, "mix"),
      ...withType(allEpisodes, "episode"),
      ...withType(freshPlaylists, "playlist"),
    ];

    const featured = combined.filter((i) => i.isFeatured).sort((a, b) => b.dateForSorting - a.dateForSorting);
    const rest = combined.filter((i) => !i.isFeatured).sort((a, b) => b.dateForSorting - a.dateForSorting);
    const sorted = [...featured.slice(0, 2), ...featured.slice(2).map((i) => ({ ...i, isFeatured: false })), ...rest];

    if (contentFilter === "mixes")    return sorted.filter((i) => i.type === "mix").slice(0, 12);
    if (contentFilter === "episodes") return sorted.filter((i) => i.type === "episode").slice(0, 12);
    return sorted.slice(0, 12);
  }, [freshMixes, allEpisodes, freshPlaylists, contentFilter]);

  useEffect(() => {
    if (!featuredSubmissions.length) return;
    (async () => {
      const thumbs: Record<number, string> = {};
      for (const sub of featuredSubmissions) {
        try {
          const t = await getTrackThumbnail(sub);
          if (t) thumbs[sub.id] = t;
        } catch {}
      }
      setTrackThumbnails(thumbs);
    })();
  }, [featuredSubmissions]);

  const featuredSubmission = featuredSubmissions[0];

  // Editorial content for homepage strip
  const { data: editorialItems = [] } = useQuery({
    queryKey: ["/api/published-content", "homepage"],
    queryFn: async () => {
      const [pubRes, promRes] = await Promise.all([
        fetch("/api/published-content"),
        fetch("/api/editorial-promoted"),
      ]);
      const pub = pubRes.ok ? await pubRes.json() : [];
      const prom = promRes.ok ? await promRes.json() : [];
      const seen = new Set();
      return [...pub, ...prom].filter((item: any) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      }).slice(0, 4);
    },
    refetchOnWindowFocus: false,
  });

  const featuredAlbum = (() => {
    if (!currentMonthPick?.items?.length) return null;
    const idx = (new Date().getDate() - 1) % currentMonthPick.items.length;
    return currentMonthPick.items[idx];
  })();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <main className="pb-32">

        {/* ── HERO ─────────────────────────────────────────────────── */}
        <section className="bg-[#090909] border-b border-paper-border py-16 sm:py-24 flex flex-col items-center text-center">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/30 mb-7">
            <span className="w-8 h-px bg-white/10" />
            San Antonio · Independent Radio
            <span className="w-8 h-px bg-white/10" />
          </div>

          {/* Wordmark */}
          <h1
            className="font-display font-black uppercase text-white leading-[0.9] tracking-[-0.02em]"
            style={{ fontSize: 'clamp(56px, 11vw, 120px)' }}
          >
            Enamorado<br />
            <span className="text-blue">Radio</span>
          </h1>

          {/* Sub */}
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/30 mt-2 mb-12">
            Community-powered · Always on
          </p>

          {/* Live player card */}
          <div className="w-full max-w-lg bg-[#13141A] border border-[#25272E] px-6 py-5 flex items-center gap-5 text-left mx-4">
            <button
              onClick={handleHeroPlay}
              aria-label={isPlaying ? 'Pause' : 'Play live radio'}
              className="w-11 h-11 rounded-full bg-blue flex items-center justify-center flex-shrink-0 hover:bg-blue-dark transition-colors"
            >
              {isPlaying
                ? <Pause className="w-4 h-4 text-white fill-white" />
                : <Play  className="w-4 h-4 text-white fill-white ml-[2px]" />
              }
            </button>

            <div className="flex-1 min-w-0">
              <div className="font-display font-black uppercase text-[13px] tracking-[0.04em] text-white">
                Enamorado Radio
              </div>
              <div className="font-mono text-[10px] text-white/40 mt-0.5 truncate tracking-[0.04em]">
                {heroTrackLine}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2.5 flex-shrink-0">
              <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--live-dot)] flex items-center gap-1.5">
                <span className="w-[5px] h-[5px] rounded-full bg-[var(--live-dot)] animate-live-pulse" />
                On Air
              </div>
              {isPlaying && (
                <div className="flex items-center gap-[2px] h-5">
                  {[6, 14, 20, 10, 16, 7, 12].map((h, i) => (
                    <div
                      key={i}
                      className="w-[2px] bg-blue rounded-[1px] hero-wave-bar"
                      style={{
                        height: h,
                        animationDelay: `${[0, 0.12, 0.04, 0.2, 0.08, 0.25, 0.16][i]}s`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="max-w-site mx-auto px-4 sm:px-6">

          {/* ── FEATURED MIX ─────────────────────────────────────────── */}
          {featuredSubmission && (
            <section className="py-10 border-b border-paper-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-700 text-2xl uppercase tracking-wide text-foreground">
                  Featured
                </h2>
                <Link href="/mixes" className="font-mono text-xs uppercase tracking-widest text-ink-muted hover:text-blue transition-colors flex items-center gap-1">
                  All Mixes <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <FeaturedMixCard
                mix={featuredSubmission}
              />
            </section>
          )}

          {/* ── UPCOMING SHOWS ───────────────────────────────────────── */}
          {upcomingShows.length > 0 && (
            <section className="py-10 border-b border-paper-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-700 text-2xl uppercase tracking-wide text-foreground">
                  Coming Up
                </h2>
                <Link href="/schedule" className="font-mono text-xs uppercase tracking-widest text-ink-muted hover:text-blue transition-colors flex items-center gap-1">
                  Full Schedule <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {upcomingShows.map((show: any) => {
                  const scheduledTime = show.scheduledAt ?? show.scheduledAirDate;
                  if (!scheduledTime) return null;
                  const scheduledDate = new Date(scheduledTime);
                  const now = new Date();
                  const isToday = scheduledDate.toDateString() === now.toDateString();
                  const timeStr = scheduledDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
                  const dateStr = isToday ? "Today" : scheduledDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  const name = show.hostName ?? show.residentName ?? "Resident DJ";
                  return (
                    <div
                      key={show.id}
                      className="border border-paper-border p-4 hover:border-blue transition-colors"
                    >
                      <p className="font-mono text-xs uppercase tracking-widest text-blue mb-2">
                        {dateStr} · {timeStr}
                      </p>
                      <h3 className="font-display font-600 text-xl uppercase leading-tight text-foreground mb-1">
                        {show.title}
                      </h3>
                      <p className="font-mono text-xs text-ink-muted">{name}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── COMMUNITY FEED ───────────────────────────────────────── */}
          {blendedContent.length > 0 && (
            <section className="py-10 border-b border-paper-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-700 text-2xl uppercase tracking-wide text-foreground">
                  Community
                </h2>
                <div className="flex items-center gap-1">
                  {FILTER_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setContentFilter(value)}
                      className={[
                        "font-mono text-xs uppercase tracking-widest px-3 py-1 border transition-colors",
                        contentFilter === value
                          ? "border-blue bg-blue text-white"
                          : "border-paper-border text-ink-muted hover:border-blue hover:text-foreground",
                      ].join(" ")}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {blendedContent[0]?.isFeatured && (
                <div className="mb-8">
                  <FeaturedHero item={blendedContent[0]} />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {blendedContent
                  .slice(blendedContent[0]?.isFeatured ? 1 : 0)
                  .map((item: any) => (
                    <ContentCard
                      key={`${item.type}-${item.id}`}
                      content={{ ...item, isFeatured: false }}
                      type={item.type}
                    />
                  ))}
              </div>

              <div className="mt-8 text-center">
                <Link
                  href="/community"
                  className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-ink-muted hover:text-blue transition-colors border border-paper-border hover:border-blue px-6 py-3"
                >
                  Browse All Community Content <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </section>
          )}

          {/* ── EDITORIAL STRIP ──────────────────────────────────────── */}
          <section className="py-10 border-b border-paper-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-700 text-2xl uppercase tracking-wide text-foreground">
                Editorial
              </h2>
              <Link href="/editorial" className="font-mono text-xs uppercase tracking-widest text-ink-muted hover:text-blue transition-colors flex items-center gap-1">
                All Stories <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {editorialItems.length > 0 ? (
              /* Real editorial content — pi.fyi grid style */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {editorialItems.map((item: any) => {
                  const LABEL_MAP: Record<string, string> = {
                    writing: "Essay", art: "Visual", playlist: "Playlist",
                    video_essay: "Video Essay", interview: "Interview",
                    photoshoot: "Photoshoot", essay: "Essay",
                  };
                  const label = LABEL_MAP[item.contentType || item.kind] ?? (item.kind || "Editorial");
                  const dateStr = item.submittedAt
                    ? new Date(item.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                    : "";
                  return (
                    <Link key={item.id} href={`/entry/${item.id}?from=editorials`}>
                      <div className="group border border-paper-border hover:border-blue transition-colors cursor-pointer flex flex-col h-full">
                        {/* Thumbnail */}
                        <div className="aspect-[4/3] overflow-hidden bg-paper-cool shrink-0">
                          {item.thumbnail ? (
                            <img
                              src={item.thumbnail}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-paper-warm flex items-center justify-center">
                              <span className="font-mono text-xs uppercase tracking-widest text-ink-faint">No Image</span>
                            </div>
                          )}
                        </div>
                        {/* Body */}
                        <div className="p-4 flex flex-col flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-xs uppercase tracking-widest text-blue">{label}</span>
                            {dateStr && (
                              <span className="font-mono text-xs text-ink-faint">{dateStr}</span>
                            )}
                          </div>
                          <h3 className="font-display font-black uppercase text-lg leading-none text-foreground group-hover:text-blue transition-colors mb-2">
                            {item.title}
                          </h3>
                          {item.description && (
                            <p className="font-serif italic text-ink-muted text-sm leading-relaxed line-clamp-2 flex-1"
                              style={{ fontSize: "0.9rem" }}>
                              {item.description}
                            </p>
                          )}
                          <p className="font-mono text-xs uppercase tracking-widest text-ink-faint mt-3">
                            {item.authorName || item.authorHandle || ""}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              /* Placeholder tiles when no editorial content yet */
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {[
                  { type: "Photoshoots", desc: "Visual features from our community" },
                  { type: "Essays",      desc: "Cultural writing and criticism" },
                  { type: "Interviews",  desc: "Conversations with artists and creators" },
                ].map(({ type, desc }) => (
                  <Link
                    key={type}
                    href={`/editorial?type=${type.toLowerCase()}`}
                    className="group border border-paper-border p-6 hover:border-blue transition-colors"
                  >
                    <p className="font-mono text-xs uppercase tracking-widest text-blue mb-2">{type}</p>
                    <h3 className="font-display font-700 text-3xl uppercase leading-none text-foreground group-hover:text-blue transition-colors mb-3">
                      Browse<br />{type}
                    </h3>
                    <p className="font-serif italic text-ink-muted text-sm leading-relaxed">{desc}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* ── EXPLORE TILES ────────────────────────────────────────── */}
          <section className="py-10 border-b border-paper-border">
            <h2 className="font-display font-700 text-2xl uppercase tracking-wide text-foreground mb-6">
              Explore
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { href: "/albums",         label: "Albums of\nthe Month",    meta: "Monthly picks" },
                { href: "/spotlight",      label: "Spotlight\nFeatures",     meta: "People & music" },
                { href: "/submit-mix",     label: "Submit\na Mix",           meta: "Open now" },
                { href: "/residents",      label: "Residents\n& DJs",        meta: "Our roster" },
              ].map(({ href, label, meta }) => (
                <Link
                  key={href}
                  href={href}
                  className="group border border-paper-border p-5 hover:border-blue hover:bg-blue-bg transition-colors"
                >
                  <p className="font-mono text-xs uppercase tracking-widest text-ink-muted mb-3">{meta}</p>
                  <h3
                    className="font-display font-700 uppercase leading-tight text-foreground group-hover:text-blue transition-colors whitespace-pre-line"
                    style={{ fontSize: "1.5rem" }}
                  >
                    {label}
                  </h3>
                  <ArrowRight className="w-4 h-4 mt-3 text-ink-faint group-hover:text-blue transition-colors" />
                </Link>
              ))}
            </div>
          </section>

          {/* ── ALBUM OF THE MONTH ───────────────────────────────────── */}
          {featuredAlbum && currentMonthPick && (
            <section className="py-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-700 text-2xl uppercase tracking-wide text-foreground">
                  Album of the Month
                </h2>
                <Link href="/albums" className="font-mono text-xs uppercase tracking-widest text-ink-muted hover:text-blue transition-colors flex items-center gap-1">
                  All Picks <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <Link href="/albums" className="group flex gap-6 items-center border border-paper-border p-6 hover:border-blue transition-colors">
                <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-paper-cool border border-paper-border overflow-hidden">
                  {featuredAlbum.album.coverArtUrl ? (
                    <img
                      src={featuredAlbum.album.coverArtUrl}
                      alt={`${featuredAlbum.album.title} by ${featuredAlbum.album.artist}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-8 h-8 text-ink-faint" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs uppercase tracking-widest text-blue mb-1">
                    #{featuredAlbum.rank} · {currentMonthPick.title}
                  </p>
                  <h3 className="font-display font-700 text-3xl sm:text-4xl uppercase leading-none text-foreground group-hover:text-blue transition-colors truncate">
                    {featuredAlbum.album.title}
                  </h3>
                  <p className="font-mono text-sm text-ink-muted mt-1">
                    {featuredAlbum.album.artist}
                    {featuredAlbum.album.releaseYear && ` · ${featuredAlbum.album.releaseYear}`}
                  </p>
                  {featuredAlbum.album.reason && (
                    <p className="font-mono text-xs text-ink-muted mt-2 italic line-clamp-2">
                      "{featuredAlbum.album.reason}"
                    </p>
                  )}
                </div>
              </Link>
            </section>
          )}

        </div>
      </main>
    </div>
  );
}
