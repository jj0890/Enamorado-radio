import { Link } from "wouter";
import { Heart, MessageCircle, Repeat2, Bookmark } from "lucide-react";
import { ContentItem } from "@shared/schema";
import { useState } from "react";

interface FeedPostProps {
  content: ContentItem;
  variant?: "featured" | "grid";
  showBadge?: boolean;
}

export default function FeedPost({
  content,
  variant = "grid",
  showBadge = true,
}: FeedPostProps) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  // Determine content source badge
  const contentBadge = content.isFeatured
    ? "EDITORIAL"
    : content.type === "playlist" || content.type === "mix"
    ? "COMMUNITY"
    : null;

  // Format date
  const formatDate = (dateInput?: Date | string | null) => {
    if (!dateInput) return "";
    const date = new Date(dateInput as string);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return "2 days ago";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get author name
  const authorName =
    content.curatorName ||
    content.hostName ||
    content.handle ||
    "Anonymous";

  // Get excerpt from description
  const excerpt = content.description
    ? content.description.slice(0, 150) + (content.description.length > 150 ? "..." : "")
    : "";

  const isFeaturedVariant = variant === "featured";

  return (
    <article
      className={`group ${
        isFeaturedVariant ? "w-full" : "w-full"
      }`}
    >
      <Link href={`/community/${content.id}`}>
        <div className="relative mb-4 overflow-hidden bg-gray-100">
          {/* Image Container - 16:9 Aspect Ratio */}
          <div
            className={`relative ${
              isFeaturedVariant ? "aspect-[16/9]" : "aspect-[16/9]"
            }`}
          >
            {content.artworkUrl ? (
              <img
                src={content.artworkUrl}
                alt={content.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400 text-sm font-sans">No Image</span>
              </div>
            )}

            {/* Content Badge Overlay */}
            {showBadge && contentBadge && (
              <div className="absolute top-4 right-4">
                <span className="bg-black text-white text-xs font-sans px-3 py-1 tracking-wide">
                  {contentBadge}
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Post Metadata */}
      <div className="space-y-2">
        {/* Author + Date */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-sans">{authorName}</span>
          <span>·</span>
          <span className="font-sans">
            {formatDate(content.submittedAt || content.createdAt)}
          </span>
        </div>

        {/* Title */}
        <Link href={`/community/${content.id}`}>
          <h2
            className={`font-serif text-black hover:text-gray-600 transition-colors ${
              isFeaturedVariant ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"
            }`}
          >
            {content.title}
          </h2>
        </Link>

        {/* Excerpt */}
        {excerpt && (
          <p className="text-sm font-sans text-gray-600 leading-relaxed">
            {excerpt}
          </p>
        )}

        {/* Social Actions */}
        <div className="flex items-center gap-6 pt-2">
          <button
            onClick={() => setLiked(!liked)}
            className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors"
            aria-label="Like"
          >
            <Heart
              className={`w-5 h-5 ${liked ? "fill-red-500 text-red-500" : ""}`}
            />
            <span className="text-sm font-sans">
              {liked ? "630" : "629"}
            </span>
          </button>

          <button
            className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
            aria-label="Comment"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-sans">7</span>
          </button>

          <button
            className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors"
            aria-label="Repost"
          >
            <Repeat2 className="w-5 h-5" />
            <span className="text-sm font-sans">64</span>
          </button>

          <button
            onClick={() => setBookmarked(!bookmarked)}
            className="ml-auto text-gray-600 hover:text-black transition-colors"
            aria-label="Bookmark"
          >
            <Bookmark
              className={`w-5 h-5 ${bookmarked ? "fill-black" : ""}`}
            />
          </button>
        </div>
      </div>
    </article>
  );
}
