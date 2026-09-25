import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Calendar, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ContentItem } from '@shared/schema';

interface LatestContentListProps {
  limit?: number;
  contentTypes?: Array<'mix' | 'episode' | 'playlist' | 'art'>;
}

export default function LatestContentList({
  limit = 20,
  contentTypes
}: LatestContentListProps) {
  const { data: latestContent = [], isLoading } = useQuery<ContentItem[]>({
    queryKey: ['/api/community', 'latest', limit, contentTypes],
    queryFn: async () => {
      const params = new URLSearchParams({
        sort: 'recent',
        limit: limit.toString(),
      });

      if (contentTypes && contentTypes.length > 0) {
        params.append('types', contentTypes.join(','));
      }

      const response = await fetch(`/api/community?${params}`);
      if (!response.ok) throw new Error('Failed to fetch latest content');
      return response.json();
    },
    refetchOnWindowFocus: false,
  });

  const formatDate = (dateInput: Date | string | null | undefined): string => {
    if (!dateInput) return '';
    const date = new Date(dateInput as string);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getCreatorName = (item: ContentItem): string => {
    const any = item as any;
    return any.name || any.hostName || any.authorName || any.artistName || any.curatorName || 'Unknown';
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'mix': return 'Mix';
      case 'episode': return 'Episode';
      case 'playlist': return 'Playlist';
      case 'art': return 'Art';
      default: return 'Content';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-b border-gray-200 dark:border-gray-800 pb-6 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-800 w-24 mb-3" />
            <div className="h-8 bg-gray-200 dark:bg-gray-800 w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 w-1/2 mb-4" />
            <div className="h-20 bg-gray-200 dark:bg-gray-800 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (latestContent.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p className="font-mono">No content yet. Be the first to contribute!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {latestContent.map((item) => (
        <Link key={item.id} href={`/community/${item.id}`}>
          <article className="group border-b border-gray-200 dark:border-gray-800 pb-6 cursor-pointer transition-all hover:border-navy dark:hover:border-navy-light">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                {/* Type Badge */}
                <Badge
                  variant="outline"
                  className="mb-3 font-mono text-xs"
                >
                  {getContentTypeLabel(item.type)}
                </Badge>

                {/* Title */}
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-navy dark:group-hover:text-navy-light transition-colors line-clamp-2">
                  {item.title}
                </h3>

                {/* Creator */}
                <p className="text-gray-600 dark:text-gray-400 mb-3 font-mono text-sm">
                  by {getCreatorName(item)}
                </p>

                {/* Description */}
                {item.description && (
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3 mb-4">
                    {item.description}
                  </p>
                )}

                {/* Tags */}
                {'genre' in item && item.genre && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="inline-flex items-center px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded">
                      {item.genre}
                    </span>
                  </div>
                )}

                {/* Read More Link */}
                <div className="flex items-center gap-2 text-navy dark:text-navy-light font-mono text-sm group-hover:gap-3 transition-all">
                  <span>View Details</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Date */}
              <div className="flex-shrink-0 text-right">
                <time className="text-sm text-gray-500 dark:text-gray-400 font-mono flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(item.submittedAt)}
                </time>
              </div>
            </div>
          </article>
        </Link>
      ))}
    </div>
  );
}
