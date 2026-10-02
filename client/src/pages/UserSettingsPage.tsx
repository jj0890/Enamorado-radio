import { useState, useEffect, useRef, FormEvent } from 'react';
import { useLocation } from 'wouter';
import { useUser } from '@/contexts/UserContext';
import { Plus, Trash2, X, ExternalLink, Search } from 'lucide-react';

interface Album { rank: number; mbId: string; title: string; artist: string; year?: string; coverUrl?: string; }
interface Contribution { id: number; type: string; title: string; url?: string; publishedAt?: string; status: string; }

const GRID_SIZE = 5;

export default function UserSettingsPage() {
  const { user, loading, refresh, logout } = useUser();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<'profile' | 'albums' | 'contributions'>('profile');

  // Profile state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Albums state
  const [albums, setAlbums] = useState<Album[]>([]);
  const [activeSlot, setActiveSlot] = useState<number | null>(null); // which slot is being picked
  const [albumSearch, setAlbumSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Album[]>([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Contributions state
  const [contribs, setContribs] = useState<Contribution[]>([]);
  const [newContrib, setNewContrib] = useState({ type: 'Article', title: '', url: '' });

  useEffect(() => {
    if (!loading && !user) setLocation('/login');
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName);
    fetch('/api/user/profile', { credentials: 'include' }).then(r => r.json()).then(d => {
      if (d.profile) setBio(d.profile.bio ?? '');
    });
    fetch('/api/user/albums', { credentials: 'include' }).then(r => r.json()).then(d => setAlbums(d.albums ?? []));
    fetch('/api/user/contributions', { credentials: 'include' }).then(r => r.json()).then(d => setContribs(d.contributions ?? []));
  }, [user]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/user/profile', {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName, bio }),
    });
    await refresh();
    setSaveMsg('Saved');
    setSaving(false);
    setTimeout(() => setSaveMsg(''), 2000);
  }

  async function searchAlbums() {
    if (!albumSearch.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/musicbrainz/search?q=${encodeURIComponent(albumSearch)}&type=release-group&limit=8`);
      const data = await res.json();
      setSearchResults((data.results ?? []).map((r: any) => ({
        rank: 0, mbId: r.id, title: r.title, artist: r.artist, year: r.year, coverUrl: r.coverUrl,
      })));
    } catch { setSearchResults([]); }
    setSearching(false);
  }

  function openSlot(slot: number) {
    setActiveSlot(slot);
    setAlbumSearch('');
    setSearchResults([]);
    setTimeout(() => searchRef.current?.focus(), 50);
  }

  function closeSlot() {
    setActiveSlot(null);
    setAlbumSearch('');
    setSearchResults([]);
  }

  function pickAlbum(album: Album) {
    if (activeSlot === null) return;
    const rank = activeSlot;
    const updated = albums.filter(a => a.rank !== rank);
    updated.push({ ...album, rank });
    setAlbums(updated);
    saveAlbums(updated);
    closeSlot();
  }

  function removeAlbum(rank: number) {
    const updated = albums.filter(a => a.rank !== rank);
    setAlbums(updated);
    saveAlbums(updated);
  }

  async function saveAlbums(list: Album[]) {
    await fetch('/api/user/albums', {
      method: 'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ albums: list }),
    });
  }

  async function addContrib(e: FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/user/contributions', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newContrib),
    });
    const data = await res.json();
    if (data.ok) {
      setContribs(prev => [data.contribution, ...prev]);
      setNewContrib({ type: 'Article', title: '', url: '' });
    }
  }

  async function deleteContrib(id: number) {
    await fetch(`/api/user/contributions/${id}`, { method: 'DELETE', credentials: 'include' });
    setContribs(prev => prev.filter(c => c.id !== id));
  }

  if (loading) return <div className="min-h-screen bg-[#090909]" />;

  return (
    <div className="min-h-screen bg-[#090909] text-white">
      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">Settings</p>
            <h1 className="font-display font-black uppercase text-2xl mt-0.5">@{user?.handle}</h1>
          </div>
          <button onClick={() => { logout(); setLocation('/'); }}
            className="font-mono text-[10px] uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors">
            Sign out
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-white/10">
          {(['profile', 'albums', 'contributions'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`font-mono text-[10px] uppercase tracking-[0.16em] px-4 py-2.5 transition-colors border-b-2 -mb-px ${
                tab === t ? 'border-blue text-white' : 'border-transparent text-white/40 hover:text-white/60'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {tab === 'profile' && (
          <form onSubmit={saveProfile} className="space-y-5">
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-[0.18em] text-white/40 mb-1.5">Display name</label>
              <input value={displayName} onChange={e => setDisplayName(e.target.value)} required
                className="w-full bg-[#13141A] border border-[#25272E] focus:border-blue/60 text-white font-mono text-sm px-3 py-3 outline-none transition-colors" />
            </div>
            <div>
              <label className="block font-mono text-[9px] uppercase tracking-[0.18em] text-white/40 mb-1.5">Bio</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4}
                placeholder="A few words about you…"
                className="w-full bg-[#13141A] border border-[#25272E] focus:border-blue/60 text-white font-mono text-sm px-3 py-3 outline-none transition-colors resize-none placeholder:text-white/20" />
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" disabled={saving}
                className="bg-blue hover:bg-blue-dark text-white font-display font-black uppercase tracking-[0.06em] text-xs px-6 py-2.5 transition-colors disabled:opacity-50">
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              {saveMsg && <span className="font-mono text-[10px] text-green-400">{saveMsg}</span>}
            </div>
            <p className="font-mono text-[10px] text-white/30">
              Public profile: <a href={`/profile/${user?.handle}`} className="text-blue hover:underline">/profile/@{user?.handle}</a>
            </p>
          </form>
        )}

        {/* Albums tab */}
        {tab === 'albums' && (
          <div className="space-y-8">
            <p className="font-mono text-[10px] text-white/30">Pick up to 9 albums. Click any slot to choose or replace.</p>

            {/* 5-slot horizontal row */}
            <div className="grid grid-cols-5 gap-1.5" style={{ maxWidth: 500 }}>
              {Array.from({ length: GRID_SIZE }, (_, i) => {
                const rank = i + 1;
                const album = albums.find(a => a.rank === rank) ?? null;
                const isActive = activeSlot === rank;
                return (
                  <div key={rank} className="relative">
                    <button
                      onClick={() => isActive ? closeSlot() : openSlot(rank)}
                      className={`relative aspect-square w-full overflow-hidden transition-all ${
                        isActive ? 'ring-2 ring-white/40' : 'hover:ring-1 hover:ring-white/20'
                      } ${album ? 'bg-[#141414]' : 'bg-[#141414] border border-dashed border-white/10 hover:border-white/20'}`}
                    >
                      {album ? (
                        <>
                          {album.coverUrl
                            ? <img src={album.coverUrl} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center p-2">
                                <span className="font-mono text-[9px] text-white/40 text-center leading-tight">{album.title}</span>
                              </div>
                          }
                          <span className="absolute top-1.5 left-2 font-mono text-[9px] text-white/40">
                            {String(rank).padStart(2, '0')}
                          </span>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                          <Plus className="w-4 h-4 text-white/20" />
                          <span className="font-mono text-[9px] text-white/20">{String(rank).padStart(2, '0')}</span>
                        </div>
                      )}
                    </button>

                    {/* Remove button — shows when slot is filled */}
                    {album && (
                      <button
                        onClick={e => { e.stopPropagation(); removeAlbum(rank); }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 group-hover:opacity-100 text-white/70 hover:text-red-400 transition-opacity z-10"
                        title="Remove"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Search panel — appears when a slot is active */}
            {activeSlot !== null && (
              <div className="border border-[#25272E] bg-[#0e0e0e]">
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#25272E]">
                  <Search className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                  <input
                    ref={searchRef}
                    value={albumSearch}
                    onChange={e => setAlbumSearch(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); searchAlbums(); }
                      if (e.key === 'Escape') closeSlot();
                    }}
                    placeholder={`Search for slot ${String(activeSlot).padStart(2, '0')}…`}
                    className="flex-1 bg-transparent text-white font-mono text-sm outline-none placeholder:text-white/20"
                  />
                  <button onClick={searchAlbums} disabled={searching}
                    className="font-mono text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors px-2">
                    {searching ? '…' : 'Go'}
                  </button>
                  <button onClick={closeSlot} className="text-white/20 hover:text-white/60 transition-colors ml-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {searchResults.length > 0 ? (
                  <div className="divide-y divide-[#1a1a1a] max-h-64 overflow-y-auto">
                    {searchResults.map(r => (
                      <button key={r.mbId} onClick={() => pickAlbum(r)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.04] text-left transition-colors">
                        {r.coverUrl
                          ? <img src={r.coverUrl} alt="" className="w-9 h-9 object-cover flex-shrink-0" />
                          : <div className="w-9 h-9 bg-[#1e1e1e] flex-shrink-0" />
                        }
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-sm text-white truncate">{r.title}</div>
                          <div className="font-mono text-[10px] text-white/40">{r.artist}{r.year ? ` · ${r.year}` : ''}</div>
                        </div>
                        <Plus className="w-3.5 h-3.5 text-white/20 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="font-mono text-[11px] text-white/20 text-center py-4">
                    {albumSearch ? 'No results — try a different search' : 'Type to search albums'}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Contributions tab */}
        {tab === 'contributions' && (
          <div className="space-y-6">
            <form onSubmit={addContrib} className="space-y-3">
              <p className="font-mono text-[10px] text-white/40">Log something you've contributed to — articles, mixes, interviews.</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[9px] uppercase tracking-[0.18em] text-white/40 mb-1.5">Type</label>
                  <select value={newContrib.type} onChange={e => setNewContrib(f => ({ ...f, type: e.target.value }))}
                    className="w-full bg-[#13141A] border border-[#25272E] text-white font-mono text-sm px-3 py-2.5 outline-none">
                    {['Article', 'Mix', 'Interview', 'Feature', 'Photo essay'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[9px] uppercase tracking-[0.18em] text-white/40 mb-1.5">Title</label>
                  <input value={newContrib.title} onChange={e => setNewContrib(f => ({ ...f, title: e.target.value }))} required
                    className="w-full bg-[#13141A] border border-[#25272E] focus:border-blue/60 text-white font-mono text-sm px-3 py-2.5 outline-none transition-colors" />
                </div>
              </div>
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-[0.18em] text-white/40 mb-1.5">URL (optional)</label>
                <input value={newContrib.url} onChange={e => setNewContrib(f => ({ ...f, url: e.target.value }))} type="url"
                  placeholder="https://…"
                  className="w-full bg-[#13141A] border border-[#25272E] focus:border-blue/60 text-white font-mono text-sm px-3 py-2.5 outline-none transition-colors placeholder:text-white/20" />
              </div>
              <button type="submit"
                className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-white/50 hover:text-white transition-colors">
                <Plus className="w-3 h-3" /> Submit for review
              </button>
            </form>

            <div className="divide-y divide-white/[0.06]">
              {contribs.map(c => (
                <div key={c.id} className="flex items-start gap-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-white/30">{c.type}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="font-mono text-sm text-white mt-0.5 truncate">{c.title}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {c.url && <a href={c.url} target="_blank" rel="noreferrer" className="text-white/20 hover:text-white/60 transition-colors"><ExternalLink className="w-3.5 h-3.5" /></a>}
                    <button onClick={() => deleteContrib(c.id)} className="text-white/20 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
              {contribs.length === 0 && <p className="font-mono text-[11px] text-white/20 text-center py-6">No contributions logged yet</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'text-yellow-400/70',
    approved: 'text-green-400/70',
    rejected: 'text-red-400/70',
  };
  return <span className={`font-mono text-[9px] uppercase tracking-widest ${map[status] ?? 'text-white/30'}`}>{status}</span>;
}
