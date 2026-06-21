import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import StickyRadioPlayer from "@/components/StickyRadioPlayer";
import { X, Plus, Check } from "lucide-react";

const ROLE_OPTIONS = [
  "Writer", "Editor", "DJ", "Photographer", "Music journalist",
  "Creative director", "Art director", "Stylist", "Producer", "Other",
];

interface AlbumResult {
  id: string;
  title: string;
  artist: string;
  year: string | null;
  coverArtUrl: string | null;
}

interface AlbumSlot {
  rank: number;
  album: {
    mbId: string;
    title: string;
    artist: string;
    year?: string;
    coverUrl: string | null;
  } | null;
}

interface ProfileData {
  displayName: string;
  handle: string;
  bio: string;
  tagline: string;
  roleLabels: string[];
  links: Array<{ label: string; url: string }>;
  isPublic: boolean;
  avatarUrl: string;
}

export default function ProfileSetup() {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const handleCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Check resident auth ──────────────────────────────────────────────────
  const { data: auth, isLoading: authLoading } = useQuery<{ authenticated: boolean; residentId?: number }>({
    queryKey: ["/api/resident/auth"],
    queryFn: () => fetch("/api/resident/auth").then((r) => r.json()),
  });

  useEffect(() => {
    if (!authLoading && auth && !auth.authenticated) {
      setLocation(`/resident?from=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [auth, authLoading, setLocation]);

  // ── Load existing profile ────────────────────────────────────────────────
  const { data: existing } = useQuery<ProfileData & { id?: number }>({
    queryKey: ["/api/profile"],
    queryFn: () => fetch("/api/profile").then((r) => (r.ok ? r.json() : null)),
    enabled: !!auth?.authenticated,
  });

  const { data: existingAlbums = [] } = useQuery<AlbumSlot["album"][]>({
    queryKey: ["/api/profile/albums"],
    queryFn: () => fetch("/api/profile/albums").then((r) => r.json()),
    enabled: !!auth?.authenticated,
  });

  // ── Form state ────────────────────────────────────────────────────────────
  const [form, setForm] = useState({ displayName: "", handle: "", bio: "", tagline: "" });
  const [roleLabels, setRoleLabels] = useState<string[]>([]);
  const [links, setLinks] = useState<Array<{ label: string; url: string }>>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [handleStatus, setHandleStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  const [slots, setSlots] = useState<AlbumSlot[]>([1, 2, 3, 4, 5].map((r) => ({ rank: r, album: null })));
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AlbumResult[]>([]);
  const [searching, setSearching] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Populate form from existing data
  useEffect(() => {
    if (existing) {
      setForm({
        displayName: existing.displayName ?? "",
        handle: existing.handle ?? "",
        bio: existing.bio ?? "",
        tagline: existing.tagline ?? "",
      });
      setRoleLabels(existing.roleLabels ?? []);
      setLinks(existing.links ?? []);
      setIsPublic(existing.isPublic ?? true);
      if (existing.avatarUrl) setAvatarPreview(existing.avatarUrl);
    }
  }, [existing]);

  useEffect(() => {
    if (existingAlbums?.length) {
      const anyAlbums = existingAlbums as any[];
      setSlots((prev) =>
        prev.map((slot) => {
          const found = anyAlbums.find((a: any) => a.rank === slot.rank);
          return found ? { ...slot, album: { mbId: found.mbId, title: found.title, artist: found.artist, year: found.year, coverUrl: found.coverUrl } } : slot;
        })
      );
    }
  }, [existingAlbums]);

  // ── Handle check ─────────────────────────────────────────────────────────
  function checkHandle(handle: string) {
    if (handleCheckRef.current) clearTimeout(handleCheckRef.current);
    if (!handle || !/^[a-z0-9-]{2,30}$/.test(handle)) { setHandleStatus("idle"); return; }
    // Skip check if handle is unchanged from existing
    if (existing?.handle && handle === existing.handle) { setHandleStatus("available"); return; }
    setHandleStatus("checking");
    handleCheckRef.current = setTimeout(async () => {
      const res = await fetch(`/api/contributors/check-handle?handle=${encodeURIComponent(handle)}`);
      const { available } = await res.json();
      setHandleStatus(available ? "available" : "taken");
    }, 500);
  }

  function setField(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (error) setError("");
  }

  function handleNameChange(value: string) {
    const slug = value.toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 30);
    setForm((f) => ({ ...f, displayName: value, handle: slug }));
    checkHandle(slug);
  }

  function toggleRole(role: string) {
    setRoleLabels((prev) => {
      if (prev.includes(role)) return prev.filter((r) => r !== role);
      if (prev.length >= 3) return prev;
      return [...prev, role];
    });
  }

  // ── Links ─────────────────────────────────────────────────────────────────
  function addLink() {
    if (links.length >= 8) return;
    setLinks((l) => [...l, { label: "", url: "" }]);
  }
  function updateLink(i: number, field: "label" | "url", value: string) {
    setLinks((l) => l.map((link, idx) => idx === i ? { ...link, [field]: value } : link));
  }
  function removeLink(i: number) {
    setLinks((l) => l.filter((_, idx) => idx !== i));
  }

  // ── Avatar ────────────────────────────────────────────────────────────────
  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Photo must be under 5 MB."); return; }
    setAvatarPreview(URL.createObjectURL(file));
    // Upload immediately
    const fd = new FormData();
    fd.append("file", file);
    fetch("/api/media/upload", { method: "POST", body: fd })
      .then((r) => r.json())
      .then((data) => setForm((f) => ({ ...f })) || setAvatarPreview(data.url))
      .catch(() => {});
  }

  // ── Album search ──────────────────────────────────────────────────────────
  const searchAlbums = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/music/search?q=${encodeURIComponent(q)}`);
      const data: AlbumResult[] = await res.json();
      setResults(data ?? []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAlbums(value), 400);
  }

  function openSlot(rank: number) {
    setActiveSlot(rank);
    setQuery("");
    setResults([]);
    setTimeout(() => searchRef.current?.focus(), 50);
  }

  function pickAlbum(r: AlbumResult) {
    if (activeSlot === null) return;
    setSlots((prev) =>
      prev.map((s) =>
        s.rank === activeSlot
          ? { ...s, album: { mbId: r.id, title: r.title, artist: r.artist, year: r.year ?? "", coverUrl: r.coverArtUrl } }
          : s
      )
    );
    setActiveSlot(null);
    setQuery("");
    setResults([]);
  }

  function clearSlot(rank: number) {
    setSlots((prev) => prev.map((s) => s.rank === rank ? { ...s, album: null } : s));
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.displayName.trim()) return setError("Please enter your name.");
    if (!form.handle.trim()) return setError("Please enter a handle.");
    if (!/^[a-z0-9-]{2,30}$/.test(form.handle))
      return setError("Handle: lowercase letters, numbers, and hyphens only (2–30 chars).");
    if (handleStatus === "taken") return setError("That handle is already taken.");

    setSaving(true);
    try {
      // Save profile
      const profileRes = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: form.displayName,
          handle: form.handle,
          bio: form.bio,
          tagline: form.tagline,
          roleLabels,
          links: links.filter((l) => l.label.trim() && l.url.trim()),
          isPublic,
          ...(avatarPreview && avatarPreview.startsWith("/") ? { avatarUrl: avatarPreview } : {}),
        }),
      });
      if (!profileRes.ok) {
        const { error: msg } = await profileRes.json().catch(() => ({}));
        throw new Error(msg ?? "Failed to save profile");
      }

      // Save albums
      await Promise.all(
        slots
          .filter((s) => s.album !== null)
          .map((s) =>
            fetch("/api/profile/albums", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ rank: s.rank, ...s.album }),
            })
          )
      );
      // Clear removed slots
      await Promise.all(
        slots
          .filter((s) => s.album === null && existingAlbums?.some((a: any) => a.rank === s.rank))
          .map((s) => fetch(`/api/profile/albums/${s.rank}`, { method: "DELETE" }))
      );

      qc.invalidateQueries({ queryKey: ["/api/profile"] });
      qc.invalidateQueries({ queryKey: ["/api/profile/albums"] });
      qc.invalidateQueries({ queryKey: ["/api/contributors"] });
      setSaved(true);
      setTimeout(() => setLocation(`/contributors/${form.handle}`), 1200);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  }

  if (authLoading) return <div className="min-h-screen bg-[#FAF6F0]" />;

  return (
    <div className="min-h-screen bg-[#FAF6F0]">
      <StickyRadioPlayer />
      <Navigation />

      {saved && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1a1a1a] text-white px-6 py-3 text-sm tracking-widest flex items-center gap-2">
          <Check className="w-4 h-4" /> Profile saved
        </div>
      )}

      <main className="max-w-lg mx-auto px-6 py-16">
        <h1 className="text-2xl font-semibold mb-1 text-gray-900">
          {existing ? "Edit your profile" : "Set up your profile"}
        </h1>
        <p className="text-sm text-gray-400 mb-10 leading-relaxed">
          This is how you'll appear on Enamorado Radio.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-7">

          {/* Avatar */}
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-widest mb-3">Profile photo</label>
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative w-20 h-20 bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden hover:border-gray-400 transition-colors shrink-0"
              >
                {avatarPreview
                  ? <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                  : <span className="text-gray-300 text-xl">+</span>}
              </button>
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs tracking-wide underline underline-offset-2 hover:text-gray-900 transition-colors block mb-1"
                >
                  {avatarPreview ? "Change photo" : "Upload photo"}
                </button>
                <p className="text-xs text-gray-400">JPG, PNG or WebP · max 5 MB</p>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} className="hidden" />
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">Your name</label>
            <input
              type="text"
              value={form.displayName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Jarrad Jones"
              maxLength={80}
              className="w-full border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>

          {/* Handle */}
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">Handle</label>
            <div className="flex items-center border border-gray-200 focus-within:border-gray-400 transition-colors bg-white">
              <span className="text-xs text-gray-400 px-4 py-3 border-r border-gray-200 bg-gray-50 shrink-0">enamoradoradio.com/</span>
              <input
                type="text"
                value={form.handle}
                onChange={(e) => {
                  const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                  setField("handle", v);
                  checkHandle(v);
                }}
                placeholder="your-name"
                maxLength={30}
                className="flex-1 bg-transparent px-4 py-3 text-sm focus:outline-none"
              />
            </div>
            <p className={`text-xs mt-1.5 ${
              handleStatus === "available" ? "text-green-600" :
              handleStatus === "taken" ? "text-red-500" : "text-gray-400"
            }`}>
              {handleStatus === "checking" && "Checking…"}
              {handleStatus === "available" && "✓ Available"}
              {handleStatus === "taken" && "✗ Already taken"}
              {handleStatus === "idle" && "Lowercase letters, numbers, and hyphens only."}
            </p>
          </div>

          {/* Role labels */}
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <label className="text-xs text-gray-500 uppercase tracking-widest">What do you do?</label>
              <span className="text-xs text-gray-400">{roleLabels.length}/3</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((role) => {
                const selected = roleLabels.includes(role);
                const maxed = !selected && roleLabels.length >= 3;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    disabled={maxed}
                    className={`text-xs px-3 py-1.5 border transition-colors ${
                      selected
                        ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                        : maxed
                        ? "border-gray-100 text-gray-300 cursor-not-allowed"
                        : "border-gray-200 hover:border-gray-400 text-gray-600"
                    }`}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Top 5 albums */}
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-widest mb-3">Top 5 albums</label>
            <div className="grid grid-cols-5 gap-2">
              {slots.map((slot) => (
                <div key={slot.rank}>
                  {slot.album ? (
                    <div className="relative group">
                      <div className="aspect-square bg-gray-100 border border-gray-200 overflow-hidden">
                        {slot.album.coverUrl
                          ? <img src={slot.album.coverUrl} alt={slot.album.title} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center p-1">
                              <span className="text-[9px] text-gray-400 text-center leading-tight">{slot.album.title}</span>
                            </div>}
                      </div>
                      <button
                        type="button"
                        onClick={() => clearSlot(slot.rank)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/70 text-white text-xs hidden group-hover:flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <p className="text-[9px] font-medium leading-tight truncate mt-1">{slot.album.title}</p>
                      <p className="text-[9px] text-gray-400 truncate">{slot.album.artist}</p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openSlot(slot.rank)}
                      className="w-full aspect-square border border-dashed border-gray-200 hover:border-gray-400 hover:bg-white transition-colors flex flex-col items-center justify-center gap-1"
                    >
                      <Plus className="w-4 h-4 text-gray-300" />
                      <span className="text-[9px] text-gray-400">{slot.rank}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Album search panel */}
            {activeSlot !== null && (
              <div className="mt-3 border border-gray-200 bg-white">
                <div className="flex items-center border-b border-gray-100">
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    placeholder={`Search for album #${activeSlot}…`}
                    className="flex-1 bg-transparent px-4 py-3 text-sm focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => { setActiveSlot(null); setResults([]); }}
                    className="px-4 py-3 text-xs text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    cancel
                  </button>
                </div>
                {searching && <p className="text-xs text-gray-400 px-4 py-3">Searching…</p>}
                {!searching && results.length > 0 && (
                  <ul>
                    {results.map((r) => (
                      <li key={r.id}>
                        <button
                          type="button"
                          onClick={() => pickAlbum(r)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                        >
                          {r.coverArtUrl
                            ? <img src={r.coverArtUrl} alt={r.title} className="w-10 h-10 object-cover shrink-0 border border-gray-100" />
                            : <div className="w-10 h-10 bg-gray-100 shrink-0 flex items-center justify-center"><span className="text-gray-300 text-xs">?</span></div>}
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{r.title}</p>
                            <p className="text-xs text-gray-400 truncate">{r.artist}{r.year ? ` · ${r.year}` : ""}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {!searching && query.trim() && results.length === 0 && (
                  <p className="text-xs text-gray-400 px-4 py-3">No results found.</p>
                )}
              </div>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">
              Bio <span className="normal-case text-gray-400">(optional)</span>
            </label>
            <textarea
              value={form.bio}
              onChange={(e) => setField("bio", e.target.value)}
              placeholder="A sentence or two about yourself and your work."
              maxLength={500}
              rows={4}
              className="w-full border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:border-gray-400 transition-colors resize-none"
            />
            <p className="text-right text-xs text-gray-400 mt-1">{form.bio.length}/500</p>
          </div>

          {/* Links */}
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <label className="text-xs text-gray-500 uppercase tracking-widest">Links</label>
              {links.length < 8 && (
                <button type="button" onClick={addLink} className="text-xs text-gray-400 hover:text-gray-700 underline underline-offset-2">
                  + Add link
                </button>
              )}
            </div>
            {links.map((link, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Label"
                  value={link.label}
                  onChange={(e) => updateLink(i, "label", e.target.value)}
                  maxLength={30}
                  className="w-28 border border-gray-200 bg-white px-3 py-2 text-xs focus:outline-none focus:border-gray-400 transition-colors"
                />
                <input
                  type="url"
                  placeholder="https://…"
                  value={link.url}
                  onChange={(e) => updateLink(i, "url", e.target.value)}
                  className="flex-1 border border-gray-200 bg-white px-3 py-2 text-xs focus:outline-none focus:border-gray-400 transition-colors"
                />
                <button type="button" onClick={() => removeLink(i)} className="px-2 text-gray-300 hover:text-gray-600 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {links.length === 0 && (
              <p className="text-xs text-gray-400">Add your website, Instagram, SoundCloud, etc.</p>
            )}
          </div>

          {/* Visibility */}
          <div className="flex items-center justify-between border border-gray-200 bg-white px-4 py-3">
            <div>
              <p className="text-xs font-medium text-gray-700">Profile visibility</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {isPublic ? "Public — visible in the contributor directory" : "Private — only you can see this"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic((v) => !v)}
              className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${isPublic ? "bg-[#1a1a1a]" : "bg-gray-200"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isPublic ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-600 border border-red-200 bg-red-50 px-4 py-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="bg-[#1a1a1a] text-white px-7 py-3 text-xs tracking-[0.12em] uppercase hover:bg-black transition-colors disabled:opacity-50 self-start"
          >
            {saving ? "Saving…" : existing ? "Save changes →" : "Create profile →"}
          </button>
        </form>
      </main>
    </div>
  );
}
