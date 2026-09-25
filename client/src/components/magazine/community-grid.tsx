type Row = {
  id: string;
  kind: "art" | "playlist" | "writing" | "link";
  title: string;
  subtitle?: string;
  author?: string;
  authorHandle?: string;
  createdAt?: string;
  thumbnail?: string | null;
  files?: { url: string; type: string }[];
  externalUrl?: string | null;
  likes?: number;
};

interface CommunityGridProps {
  submissions: Row[];
  onCardClick?: (submission: Row) => void;
}

export default function CommunityGrid({ submissions, onCardClick }: CommunityGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {submissions.map((submission) => (
        <div
          key={submission.id}
          className="border border-paper-border hover:border-olive transition-colors cursor-pointer overflow-hidden"
          onClick={() => onCardClick?.(submission)}
        >
          {submission.thumbnail && (
            <div className="aspect-[4/3] overflow-hidden bg-paper-cool">
              <img
                src={submission.thumbnail}
                alt={submission.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-4">
            <span className="font-mono text-xs uppercase tracking-widest text-olive">
              {submission.kind}
            </span>
            <h3 className="font-display font-black uppercase text-lg leading-none text-foreground mt-2">
              {submission.title}
            </h3>
            {submission.author && (
              <p className="font-mono text-xs uppercase tracking-widest text-ink-faint mt-3">
                {submission.author}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
