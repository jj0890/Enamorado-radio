interface YouTubeEmbedProps {
  /** Pass either a video ID or a full YouTube URL */
  videoId?: string;
  videoUrl?: string;
  title?: string;
  description?: string;
  className?: string;
}

function extractVideoId(props: YouTubeEmbedProps): string {
  if (props.videoId) return props.videoId;
  if (props.videoUrl) {
    const match = props.videoUrl.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/);
    return match?.[1] ?? '';
  }
  return '';
}

export default function YouTubeEmbed(props: YouTubeEmbedProps) {
  const { title = "YouTube video", className = "" } = props;
  const videoId = extractVideoId(props);
  return (
    <div className={`relative aspect-video w-full ${className}`}>
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0"
      />
    </div>
  );
}

export function VideoEssayEmbed(props: YouTubeEmbedProps) {
  return <YouTubeEmbed {...props} />;
}
