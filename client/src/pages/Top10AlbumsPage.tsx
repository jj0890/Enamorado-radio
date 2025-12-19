import { AlbumScrollStory } from "@/components/AlbumScrollStory";
import { top10Albums2025 } from "@/data/top10Albums2025";

export default function Top10AlbumsPage() {
  return <AlbumScrollStory list={top10Albums2025} />;
}
