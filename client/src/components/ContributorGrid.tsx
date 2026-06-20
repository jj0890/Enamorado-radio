import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

interface Album {
  rank: number;
  coverUrl: string | null;
  title: string;
  artist: string;
}

interface ContributorRow {
  id: number;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  roleLabels: string[] | null;
  role: string | null;
  bio: string | null;
  albums: Album[];
}

const ALL_ROLES = ["All", "Writer", "DJ", "Photographer", "Editor", "Producer", "Artist", "Stylist"];

function getRoles(c: ContributorRow): string[] {
  if (c.roleLabels && c.roleLabels.length > 0) return c.roleLabels;
  if (c.role) return [c.role.charAt(0).toUpperCase() + c.role.slice(1)];
  return ["Contributor"];
}

export default function ContributorGrid() {
  const { data: profiles = [], isLoading } = useQuery<ContributorRow[]>({
    queryKey: ["/api/contributors"],
    queryFn: () => fetch("/api/contributors").then((r) => r.json()),
  });

  const [activeRole, setActiveRole] = useState("All");
  const [query, setQuery] = useState("");

  const presentRoles = useMemo(() => {
    const set = new Set<string>();
    profiles.forEach((p) => getRoles(p).forEach((r) => set.add(r)));
    return ALL_ROLES.filter((r) => r === "All" || set.has(r));
  }, [profiles]);

  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      const roles = getRoles(p);
      const matchesRole =
        activeRole === "All" ||
        roles.some((r) => r.toLowerCase() === activeRole.toLowerCase());
      const matchesQuery =
        !query ||
        p.displayName.toLowerCase().includes(query.toLowerCase()) ||
        roles.some((r) => r.toLowerCase().includes(query.toLowerCase()));
      return matchesRole && matchesQuery;
    });
  }, [profiles, activeRole, query]);

  if (isLoading) {
    return (
      <div className="py-24 text-center text-sm text-gray-400 font-light tracking-wider">
        Loading contributors…
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-8">
        <div className="flex flex-wrap gap-2">
          {presentRoles.map((role) => (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className={`text-xs tracking-[0.1em] uppercase px-3 py-1.5 border transition-colors ${
                activeRole === role
                  ? "border-[#1a1a1a] bg-[#1a1a1a] text-white"
                  : "border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-800"
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search contributors…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 pr-4 py-1.5 text-xs tracking-wide border border-gray-200 bg-transparent placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors w-52"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-24">
          {profiles.length === 0
            ? "No contributors yet — be the first."
            : "No contributors match that filter."}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-px bg-gray-100">
          {filtered.map((profile) => (
            <Link
              key={profile.id}
              href={`/contributors/${profile.handle}`}
              className="bg-white p-4 flex flex-col gap-3 hover:bg-[#faf8f5] transition-colors group"
            >
              {/* Avatar */}
              <div className="aspect-square bg-gray-50 border border-gray-100 overflow-hidden">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.displayName}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-2xl text-gray-300 font-light">
                      {profile.displayName?.[0] ?? "?"}
                    </span>
                  </div>
                )}
              </div>

              {/* Name + roles */}
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight mb-0.5 truncate group-hover:underline underline-offset-2">
                  {profile.displayName}
                </p>
                <p className="text-xs text-gray-400 truncate tracking-wide">
                  {getRoles(profile).join(" · ")}
                </p>
              </div>

              {/* Album taste strip */}
              {profile.albums?.length > 0 && (
                <div className="flex gap-1 mt-auto">
                  {profile.albums.slice(0, 3).map((album, i) =>
                    album.coverUrl ? (
                      <div
                        key={i}
                        className="w-8 h-8 bg-gray-100 overflow-hidden shrink-0 border border-gray-100"
                      >
                        <img
                          src={album.coverUrl}
                          alt={album.title}
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                        />
                      </div>
                    ) : null
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-5 text-center tracking-wider">
        {filtered.length} contributor{filtered.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
