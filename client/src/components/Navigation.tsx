import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { ChevronDown, Search, X, Music, Disc } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FEATURES } from "@/config/features";

const SEARCH_TABS = ["Mixes", "Albums", "Genres"] as const;
type SearchTab = (typeof SEARCH_TABS)[number];

function useDebounced(value: string, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export default function Navigation() {
  const [location, navigate] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("Mixes");
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debouncedQ = useDebounced(searchQ, 280);

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const navLinkClass = (path: string) => {
    const base = "font-mono text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burnt-orange-500 focus-visible:ring-offset-2";
    return isActive(path)
      ? `${base} text-charcoal-900 font-bold border-b-2 border-burnt-orange-500 pb-0.5`
      : `${base} text-charcoal-600 hover:text-charcoal-900`;
  };

  const openSearch = useCallback(() => {
    setSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQ("");
    setActiveTab("Mixes");
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!searchOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) closeSearch();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [searchOpen, closeSearch]);

  // Close on Escape
  useEffect(() => {
    if (!searchOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeSearch(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [searchOpen, closeSearch]);

  // Close search when navigating
  useEffect(() => { closeSearch(); }, [location]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mixes search
  const { data: mixResults = [] } = useQuery<any[]>({
    queryKey: ["/api/mixes/search", debouncedQ],
    queryFn: async () => {
      if (debouncedQ.length < 2) return [];
      const r = await fetch(`/api/mixes?q=${encodeURIComponent(debouncedQ)}`);
      if (!r.ok) return [];
      const data = await r.json();
      return (Array.isArray(data) ? data : []).slice(0, 6);
    },
    enabled: debouncedQ.length >= 2 && activeTab === "Mixes",
    staleTime: 30_000,
  });

  // Albums (community suggestions)
  const { data: allAlbums = [] } = useQuery<any[]>({
    queryKey: ["/api/albums/community"],
    queryFn: async () => {
      const r = await fetch("/api/albums/community");
      if (!r.ok) return [];
      return r.json();
    },
    enabled: searchOpen && activeTab === "Albums",
    staleTime: 60_000,
  });
  const albumResults = debouncedQ.length >= 2
    ? allAlbums.filter((a: any) =>
        a.title?.toLowerCase().includes(debouncedQ.toLowerCase()) ||
        a.artist?.toLowerCase().includes(debouncedQ.toLowerCase())
      ).slice(0, 6)
    : allAlbums.slice(0, 6);

  // Genres
  const { data: genreData } = useQuery<{ all: any[] }>({
    queryKey: ["/api/genres"],
    queryFn: async () => {
      const r = await fetch("/api/genres");
      if (!r.ok) return { all: [], byCategory: {} };
      const json = await r.json();
      return json.data ?? json;
    },
    enabled: searchOpen && activeTab === "Genres",
    staleTime: 5 * 60_000,
  });
  const genreResults = (genreData?.all ?? [])
    .filter((g: any) =>
      !debouncedQ || g.name?.toLowerCase().includes(debouncedQ.toLowerCase())
    )
    .slice(0, 12);

  const tabIndex = SEARCH_TABS.indexOf(activeTab);

  const handleMixClick = (mix: any) => {
    closeSearch();
    navigate("/mixes");
  };
  const handleAlbumClick = () => { closeSearch(); navigate("/albums"); };
  const handleGenreClick = (slug: string) => { closeSearch(); navigate(`/mixes?genre=${slug}`); };

  return (
    <header className="border-b border-black bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight font-mono text-charcoal-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burnt-orange-500 focus-visible:ring-offset-2"
            data-testid="link-nav-logo"
          >
            Enamorado
          </Link>

          <nav className="flex items-center space-x-6">
            <Link href="/" className={navLinkClass("/")} data-testid="link-nav-home">Home</Link>
            <Link href="/latest" className={navLinkClass("/latest")} data-testid="link-nav-latest">Latest</Link>
            <Link href="/community" className={navLinkClass("/community")} data-testid="link-nav-community">Community</Link>

            <DropdownMenu>
              <DropdownMenuTrigger
                className="font-mono text-sm text-charcoal-600 hover:text-charcoal-900 transition-colors inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burnt-orange-500 focus-visible:ring-offset-2"
                data-testid="dropdown-nav-explore"
              >
                Explore
                <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-white border-black font-mono">
                <DropdownMenuItem asChild>
                  <Link href="/episodes" className="cursor-pointer focus:bg-cream-100 focus:text-charcoal-900" data-testid="dropdown-item-episodes">Episodes</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/mixes" className="cursor-pointer focus:bg-cream-100 focus:text-charcoal-900" data-testid="dropdown-item-mixes">Mixes</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/albums" className="cursor-pointer focus:bg-cream-100 focus:text-charcoal-900" data-testid="dropdown-item-albums">Albums of the Month</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/editorial" className="cursor-pointer focus:bg-cream-100 focus:text-charcoal-900" data-testid="dropdown-item-editorial">Editorial</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/contributors" className="cursor-pointer focus:bg-cream-100 focus:text-charcoal-900" data-testid="dropdown-item-contributors">Contributors</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/genres" className="cursor-pointer focus:bg-cream-100 focus:text-charcoal-900" data-testid="dropdown-item-genres">Genres</Link>
                </DropdownMenuItem>
                {FEATURES.SCHEDULE && (
                  <DropdownMenuItem asChild>
                    <Link href="/schedule" className="cursor-pointer focus:bg-cream-100 focus:text-charcoal-900" data-testid="dropdown-item-schedule">Schedule</Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/submit" className={navLinkClass("/submit")} data-testid="link-nav-submit">Submit</Link>
            <Link href="/about" className={navLinkClass("/about")} data-testid="link-nav-about">About</Link>

            {/* Search toggle */}
            <button
              onClick={searchOpen ? closeSearch : openSearch}
              className="text-charcoal-500 hover:text-charcoal-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-burnt-orange-500 focus-visible:ring-offset-2"
              aria-label={searchOpen ? "Close search" : "Open search"}
              data-testid="btn-search-toggle"
            >
              {searchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>
          </nav>
        </div>
      </div>

      {/* Search dropdown panel */}
      {searchOpen && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 top-full bg-white border-b border-black shadow-lg z-50"
        >
          {/* Search input */}
          <div className="max-w-7xl mx-auto px-4 pt-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search mixes, albums, genres…"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-charcoal-200 bg-cream-50 text-charcoal-900 font-mono text-sm rounded-none focus:outline-none focus:border-charcoal-500 placeholder:text-charcoal-400"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Tabs with sliding underline — musicboard.app pattern */}
          <div className="max-w-7xl mx-auto px-4">
            <div className="relative flex border-b border-charcoal-100">
              {SEARCH_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`font-mono text-xs px-4 py-2.5 transition-colors relative ${
                    activeTab === tab ? "text-charcoal-900 font-semibold" : "text-charcoal-400 hover:text-charcoal-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
              {/* Sliding underline indicator */}
              <div
                className="absolute bottom-0 h-[2px] bg-burnt-orange-500 transition-transform duration-200"
                style={{
                  width: `${100 / SEARCH_TABS.length}%`,
                  transform: `translateX(${tabIndex * 100}%)`,
                }}
              />
            </div>
          </div>

          {/* Results */}
          <div className="max-w-7xl mx-auto px-4 py-3 max-h-80 overflow-y-auto">
            {activeTab === "Mixes" && (
              mixResults.length > 0 ? (
                <ul className="divide-y divide-charcoal-50">
                  {mixResults.map((mix: any) => (
                    <li key={mix.id}>
                      <button
                        className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-cream-50 transition-colors px-1"
                        onClick={() => handleMixClick(mix)}
                      >
                        {mix.artwork ? (
                          <img src={mix.artwork} alt={mix.title} className="w-8 h-8 object-cover flex-shrink-0" />
                        ) : (
                          <Music className="w-8 h-8 text-charcoal-300 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-mono text-sm text-charcoal-900 truncate">{mix.title}</p>
                          {mix.artist && <p className="font-mono text-xs text-charcoal-500 truncate">{mix.artist}</p>}
                        </div>
                        {mix.genre && (
                          <span className="ml-auto font-mono text-[10px] text-charcoal-400 uppercase tracking-wider flex-shrink-0">{mix.genre}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : debouncedQ.length >= 2 ? (
                <p className="font-mono text-xs text-charcoal-400 py-4 text-center">No mixes found for "{debouncedQ}"</p>
              ) : (
                <p className="font-mono text-xs text-charcoal-400 py-4 text-center">Type to search mixes…</p>
              )
            )}

            {activeTab === "Albums" && (
              albumResults.length > 0 ? (
                <ul className="divide-y divide-charcoal-50">
                  {albumResults.map((album: any) => (
                    <li key={album.id}>
                      <button
                        className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-cream-50 transition-colors px-1"
                        onClick={handleAlbumClick}
                      >
                        {album.coverArtUrl ? (
                          <img src={album.coverArtUrl} alt={album.title} className="w-8 h-8 object-cover flex-shrink-0" />
                        ) : (
                          <Disc className="w-8 h-8 text-charcoal-300 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-mono text-sm text-charcoal-900 truncate">{album.title}</p>
                          <p className="font-mono text-xs text-charcoal-500 truncate">{album.artist}</p>
                        </div>
                        {album.releaseYear && (
                          <span className="ml-auto font-mono text-[10px] text-charcoal-400 flex-shrink-0">{album.releaseYear}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-mono text-xs text-charcoal-400 py-4 text-center">No albums found</p>
              )
            )}

            {activeTab === "Genres" && (
              genreResults.length > 0 ? (
                <div className="flex flex-wrap gap-2 py-2">
                  {genreResults.map((g: any) => (
                    <button
                      key={g.slug}
                      onClick={() => handleGenreClick(g.slug)}
                      className="font-mono text-xs px-3 py-1.5 border border-charcoal-200 text-charcoal-700 hover:border-burnt-orange-400 hover:text-burnt-orange-600 transition-colors"
                    >
                      {g.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="font-mono text-xs text-charcoal-400 py-4 text-center">No genres found</p>
              )
            )}
          </div>
        </div>
      )}
    </header>
  );
}
