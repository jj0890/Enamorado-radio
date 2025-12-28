import { useQuery } from "@tanstack/react-query";
import { AlbumScrollStory } from "@/components/AlbumScrollStory";
import { top10Albums2025, type Top10List, type Top10Album } from "@/data/top10Albums2025";
import { Disc } from "lucide-react";

interface ApiAlbumPickItem {
  id: number;
  rank: number;
  blurb?: string;
  writeUp?: string;
  standoutTracks?: string[];
  label?: string;
  releaseDate?: string;
  accentColor?: string;
  tags?: string[];
  spotifyUrl?: string;
  appleMusicUrl?: string;
  bandcampUrl?: string;
  album?: {
    id: number;
    artist: string;
    title: string;
    coverArtUrl?: string;
    spotifyUrl?: string;
  } | null;
}

interface ApiAlbumPick {
  id: number;
  month: string;
  title: string;
  description?: string;
  listType: string;
  introText?: string;
  outroText?: string;
  isPublished: boolean;
  publishedAt?: string;
  slug: string;
  items: ApiAlbumPickItem[];
}

function transformApiToScrollStory(apiData: ApiAlbumPick): Top10List {
  return {
    year: parseInt(apiData.month.split('-')[0]) || 2025,
    title: apiData.title,
    slug: apiData.slug,
    introText: apiData.introText || "Welcome to our year in review.",
    outroText: apiData.outroText || "Thank you for exploring our picks.",
    publishedAt: apiData.publishedAt || new Date().toISOString(),
    albums: apiData.items
      .filter(item => item.album)
      .sort((a, b) => a.rank - b.rank)
      .map(item => ({
        rank: item.rank,
        artist: item.album?.artist || "Unknown Artist",
        title: item.album?.title || "Unknown Album",
        label: item.label || "",
        releaseDate: item.releaseDate || "",
        coverArtUrl: item.album?.coverArtUrl || "",
        writeUp: item.writeUp || item.blurb || "",
        standoutTracks: item.standoutTracks || [],
        accentColor: item.accentColor || "#003F87",
        spotifyUrl: item.spotifyUrl || item.album?.spotifyUrl,
        appleMusicUrl: item.appleMusicUrl,
        bandcampUrl: item.bandcampUrl,
        tags: item.tags || [],
      })),
  };
}

export default function Top10AlbumsPage() {
  const { data: apiList, isLoading, error } = useQuery<ApiAlbumPick>({
    queryKey: ["/api/albums/top-lists", "top-10-albums-2025"],
    queryFn: async () => {
      const res = await fetch("/api/albums/top-lists/top-10-albums-2025");
      if (!res.ok) throw new Error("Not published");
      return res.json();
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="text-center">
          <Disc className="w-12 h-12 animate-spin mx-auto mb-4 text-white" />
          <p className="font-mono text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  // If API returns data, use it; otherwise fall back to static data
  const list = apiList ? transformApiToScrollStory(apiList) : top10Albums2025;

  return <AlbumScrollStory list={list} />;
}
